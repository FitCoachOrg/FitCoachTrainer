// Purpose: Find specific YouTube Shorts for exercises with the exercise name present in video tags when possible.
// Scope:   Reads the first N exercises from `attached_assets/800Exercise_DB - Sheet1.csv` and writes results to CSV.
// Output:  `attached_assets/800Exercise_DB_first_15_shorts.csv` by default.
// Usage:   YOUTUBE_API_KEY=... node tools/find-youtube-shorts.mjs --limit 15
// Notes:
//  - Requires a valid YouTube Data API v3 key in env var YOUTUBE_API_KEY.
//  - We bias to true Shorts (<= 60s) and videos with matching tags.
//  - If tags are unavailable, we fallback to strong title match and presence of 'shorts' in title/description.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import * as XLSX from 'xlsx/xlsx.mjs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let API_KEYS = [];
let API_KEY_IDX = 0;
const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const YT_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const YT_CHANNELS_URL = 'https://www.googleapis.com/youtube/v3/channels';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { limit: 15, apiKey: '', strict: false, llm: false, start: 0, out: '', concurrency: 1, all: false, verbose: false, onlyGood: true, skipExisting: true };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--limit' && i + 1 < args.length) {
      opts.limit = Math.max(1, parseInt(args[i + 1], 10) || 15);
      i++;
    } else if ((a === '--api-key' || a === '-k') && i + 1 < args.length) {
      opts.apiKey = String(args[i + 1]);
      i++;
    } else if (a === '--strict') {
      opts.strict = true;
    } else if (a === '--llm') {
      opts.llm = true;
    } else if (a === '--start' && i + 1 < args.length) {
      opts.start = Math.max(0, parseInt(args[i + 1], 10) || 0);
      i++;
    } else if ((a === '--out' || a === '--output') && i + 1 < args.length) {
      opts.out = String(args[i + 1]);
      i++;
    } else if ((a === '--concurrency' || a === '-c') && i + 1 < args.length) {
      opts.concurrency = Math.max(1, parseInt(args[i + 1], 10) || 1);
      i++;
    } else if (a === '--all') {
      opts.all = true;
    } else if (a === '--verbose' || a === '-v') {
      opts.verbose = true;
    } else if (a === '--only-good') {
      opts.onlyGood = true;
    } else if (a === '--include-bad') {
      opts.onlyGood = false;
    } else if (a === '--no-skip-existing') {
      opts.skipExisting = false;
    }
  }
  return opts;
}

function normalizeTag(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[#]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function generateCandidateTags(exerciseName) {
  const base = normalizeTag(exerciseName);
  if (!base) return [];
  const parts = base.split(' ').filter(Boolean);
  const variants = new Set([
    base,
    parts.join(''),
    parts.join('-'),
    parts.join('_'),
  ]);
  return Array.from(variants);
}

function iso8601ToSeconds(duration) {
  // e.g., PT1M5S, PT45S, PT2M => seconds
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(duration || '');
  if (!match) return 0;
  const [, h, m, s] = match;
  return (parseInt(h || '0') * 3600) + (parseInt(m || '0') * 60) + (parseInt(s || '0'));
}

async function ytSearch(query, maxResults = 8, verbose = false) {
  // Try all available API keys on quotaExceeded
  for (let i = API_KEY_IDX; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];
    const url = new URL(YT_SEARCH_URL);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('maxResults', String(maxResults));
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('videoDuration', 'short'); // < 4 minutes
    url.searchParams.set('relevanceLanguage', 'en');
    url.searchParams.set('regionCode', 'US');
    url.searchParams.set('key', key);

    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      if (verbose) console.error(`ERROR ytSearch ${resp.status}: ${text.slice(0,300)}...`);
      // Attempt to detect quotaExceeded and switch keys
      if (resp.status === 403 && /quota/i.test(text)) {
        if (verbose) console.warn(`Switching YouTube API key (search): index ${i} -> ${i+1}`);
        API_KEY_IDX = Math.min(i + 1, API_KEYS.length - 1);
        if (i + 1 < API_KEYS.length) continue; // try next key
      }
      throw new Error(`YouTube search failed: ${resp.status} ${text}`);
    }
    const data = await resp.json();
    return data.items || [];
  }
}

async function ytVideosDetails(videoIds, verbose = false) {
  if (!videoIds.length) return [];
  for (let i = API_KEY_IDX; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];
    const url = new URL(YT_VIDEOS_URL);
    url.searchParams.set('part', 'snippet,contentDetails,statistics');
    url.searchParams.set('id', videoIds.join(','));
    url.searchParams.set('key', key);
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      if (verbose) console.error(`ERROR ytVideosDetails ${resp.status}: ${text.slice(0,300)}...`);
      if (resp.status === 403 && /quota/i.test(text)) {
        if (verbose) console.warn(`Switching YouTube API key (videos): index ${i} -> ${i+1}`);
        API_KEY_IDX = Math.min(i + 1, API_KEYS.length - 1);
        if (i + 1 < API_KEYS.length) continue;
      }
      throw new Error(`YouTube videos failed: ${resp.status} ${text}`);
    }
    const data = await resp.json();
    return data.items || [];
  }
}

async function ytChannelsDetails(channelIds, verbose = false) {
  if (!channelIds.length) return [];
  // YouTube API caps id list length; but our usage is small per batch
  for (let i = API_KEY_IDX; i < API_KEYS.length; i++) {
    const key = API_KEYS[i];
    const url = new URL(YT_CHANNELS_URL);
    url.searchParams.set('part', 'snippet,statistics');
    url.searchParams.set('id', channelIds.join(','));
    url.searchParams.set('key', key);
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      if (verbose) console.error(`ERROR ytChannelsDetails ${resp.status}: ${text.slice(0,300)}...`);
      if (resp.status === 403 && /quota/i.test(text)) {
        if (verbose) console.warn(`Switching YouTube API key (channels): index ${i} -> ${i+1}`);
        API_KEY_IDX = Math.min(i + 1, API_KEYS.length - 1);
        if (i + 1 < API_KEYS.length) continue;
      }
      throw new Error(`YouTube channels failed: ${resp.status} ${text}`);
    }
    const data = await resp.json();
    return data.items || [];
  }
}

function scoreVideoForExercise(video, exerciseName, channelStats, opts = { strict: false }) {
  const tags = (video.snippet?.tags || []).map(t => normalizeTag(t));
  const title = normalizeTag(video.snippet?.title || '');
  const description = normalizeTag(video.snippet?.description || '');
  const durationSec = iso8601ToSeconds(video.contentDetails?.duration || 'PT0S');
  const channelId = video.snippet?.channelId || '';
  const channel = channelStats?.get(channelId);
  const subscriberCount = channel ? parseInt(channel.statistics?.subscriberCount || '0', 10) : 0;
  const channelTitleNorm = normalizeTag(channel?.snippet?.title || '');

  const candidates = generateCandidateTags(exerciseName);
  let matchedTag = '';
  let hasTagMatch = false;
  for (const c of candidates) {
    if (tags.includes(c)) { matchedTag = c; hasTagMatch = true; break; }
    // Substring match inside longer tags (e.g., 'alternate-hammer-curl-form')
    if (tags.some(t => t.includes(c))) { matchedTag = c; hasTagMatch = true; break; }
  }

  // Shorts signals
  const hasShortsSignal = /\bshorts?\b/.test(title) || /\bshorts?\b/.test(description);
  const isUnder60s = durationSec > 0 && durationSec <= 65; // allow slight parsing variance

  // Title relevance: all words present
  const words = normalizeTag(exerciseName).split(' ').filter(Boolean);
  const titleHasAllWords = words.every(w => title.includes(w));

  // Positive and negative keywords
  const positives = ['how to', 'proper form', 'tutorial', 'demonstration', 'demo', 'coach', 'trainer', 'physio', 'physical therapist', 'physiotherapist', 'cscs', 'nasm', 'acsm'];
  const negatives = ['review', 'product', 'unboxing', 'ad', 'sponsored', 'commercial'];
  const positiveHits = positives.filter(p => title.includes(p) || description.includes(p));
  const negativeHits = negatives.filter(n => title.includes(n) || description.includes(n));

  // Channel quality heuristics
  const trustedChannels = [
    'athlean x',
    'jeff nippard',
    'squat university',
    'alan thrall',
    'nuffield health',
    'mayo clinic',
    'nhs',
    'cleveland clinic',
    'bodybuilding com',
    'exrx',
    'ori gym',
    'origym',
    'ace fitness',
    'cscs',
    'physio network',
    'bob & brad',
    'bob and brad',
    'university',
  ];
  const isTrustedChannel = trustedChannels.some(tc => channelTitleNorm.includes(tc));
  const channelQualityBonus = (
    (subscriberCount >= 100000 ? 40 : subscriberCount >= 25000 ? 25 : subscriberCount >= 5000 ? 10 : 0) +
    (/(health|clinic|physio|physiotherapy|fitness|academy|university|ace|nuffield|mayo|nhs)\b/.test(channelTitleNorm) ? 15 : 0) +
    (isTrustedChannel ? 60 : 0)
  );

  // Score: prefer tag match, then title match + shorts signal, then duration under 60s
  let score = 0;
  let reason = [];
  if (hasTagMatch) { score += 100; reason.push('tag-match'); }
  if (titleHasAllWords) { score += 30; reason.push('title-match'); }
  if (hasShortsSignal) { score += 20; reason.push('shorts-signal'); }
  if (isUnder60s) { score += 10; reason.push('<=60s'); }
  if (positiveHits.length) { score += 15 + positiveHits.length * 5; reason.push('positives'); }
  if (negativeHits.length) { score -= 40 + negativeHits.length * 12; reason.push('negatives'); }
  if (channelQualityBonus) { score += channelQualityBonus; reason.push('channel-quality'); }
  if (opts.strict && !isUnder60s) { score -= 80; reason.push('>60s-penalty'); }
  if (opts.strict && !titleHasAllWords && !hasTagMatch) { score -= 40; reason.push('weak-title'); }
  if (opts.strict && !positiveHits.length && !isTrustedChannel) { score -= 25; reason.push('no-positive-signal'); }

  return { score, matchedTag, reason: reason.join('+'), durationSec };
}

async function findBestShortForExercise(exerciseName, opts = { strict: false, llm: false, verbose: false }) {
  // Bias queries towards trainer-led demos
  const q = `${exerciseName} how to proper form demonstration`; // better relevance than just 'shorts'
  const searchItems = await ytSearch(q, 15, opts.verbose);
  const videoIds = searchItems.map(it => it?.id?.videoId).filter(Boolean);
  const details = await ytVideosDetails(videoIds, opts.verbose);
  if (!details.length) return null;

  // Get channel stats for scoring
  const channelIds = Array.from(new Set(details.map(v => v.snippet?.channelId).filter(Boolean)));
  const channels = await ytChannelsDetails(channelIds, opts.verbose);
  const channelMap = new Map(channels.map(c => [c.id, c]));

  const scored = details
    .map(v => ({ v, meta: scoreVideoForExercise(v, exerciseName, channelMap, { strict: opts.strict }) }))
    .sort((a, b) => b.meta.score - a.meta.score);

  const best = scored[0];
  const vid = best.v;
  let result = {
    videoId: vid.id,
    title: vid.snippet?.title || '',
    channelTitle: vid.snippet?.channelTitle || '',
    duration: vid.contentDetails?.duration || '',
    durationSeconds: best.meta.durationSec,
    tagsMatched: best.meta.reason.includes('tag-match'),
    matchedTag: best.meta.matchedTag,
    reason: best.meta.reason,
  };

  if (opts.llm) {
    const llmVerdict = await llmScreenVideo({
      exerciseName,
      title: result.title,
      description: vid.snippet?.description || '',
      channelTitle: result.channelTitle,
      tags: (vid.snippet?.tags || []).slice(0, 20),
      durationSeconds: result.durationSeconds,
      url: `https://www.youtube.com/watch?v=${result.videoId}`,
    });
    if (llmVerdict?.accept === false && llmVerdict?.confidence >= 0.7) {
      // If LLM strongly rejects top pick, try next best that LLM accepts
      for (let i = 1; i < scored.length; i++) {
        const cand = scored[i];
        const v = cand.v;
        const check = await llmScreenVideo({
          exerciseName,
          title: v.snippet?.title || '',
          description: v.snippet?.description || '',
          channelTitle: v.snippet?.channelTitle || '',
          tags: (v.snippet?.tags || []).slice(0, 20),
          durationSeconds: iso8601ToSeconds(v.contentDetails?.duration || 'PT0S'),
          url: `https://www.youtube.com/watch?v=${v.id}`,
        });
        if (check?.accept === true) {
          result = {
            videoId: v.id,
            title: v.snippet?.title || '',
            channelTitle: v.snippet?.channelTitle || '',
            duration: v.contentDetails?.duration || '',
            durationSeconds: iso8601ToSeconds(v.contentDetails?.duration || 'PT0S'),
            tagsMatched: (v.snippet?.tags || []).some(t => normalizeTag(t).includes(normalizeTag(exerciseName))),
            matchedTag: '',
            reason: `${cand.meta.reason}+llm-accept`,
          };
          break;
        }
      }
    } else if (llmVerdict?.accept === true) {
      result.reason += '+llm-accept';
    }
  }

  return result;
}

async function llmScreenVideo(payload) {
  const apiKey = process.env.CEREBRAS_API_KEY || process.env.VITE_CEREBRAS_API_KEY || process.env.LLM_API_KEY;
  const baseUrl = process.env.CEREBRAS_BASE_URL || process.env.LLM_BASE_URL || 'https://api.cerebras.ai/v1';
  const model = process.env.CEREBRAS_MODEL || process.env.VITE_CEREBRAS_MODEL || process.env.VITE_CEREBRAS_MODE || process.env.LLM_MODEL;
  if (!apiKey || !model) return null;

  const prompt = `You are evaluating whether a YouTube video is a high-fidelity, trainer-led exercise demonstration for the given exercise. Accept only if:
- The video shows how to perform the exercise (how to, demonstration, proper form).
- It appears led by a qualified coach/trainer/physio or a reputable fitness organization.
- It is not a product review, ad, or promo.
- The content is concise and instructional.

Return a strict JSON object: {"accept": boolean, "confidence": number, "reason": string}.

Exercise: ${payload.exerciseName}
Title: ${payload.title}
Channel: ${payload.channelTitle}
DurationSeconds: ${payload.durationSeconds}
Tags: ${payload.tags.join(', ')}
URL: ${payload.url}
Description: ${payload.description.slice(0, 1000)}
`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You strictly return JSON only, no prose.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  try {
    const obj = JSON.parse(text);
    if (typeof obj.accept === 'boolean') return obj;
  } catch (_) {
    // ignore
  }
  return null;
}

function tryLoadEnvAt(p) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

async function main() {
  const { limit, apiKey, strict, llm, start, out, concurrency, all, verbose, onlyGood } = parseArgs();
  const projectRoot = path.resolve(__dirname, '..');
  // Load env from common locations
  tryLoadEnvAt(path.resolve(projectRoot, '.env'));
  tryLoadEnvAt(path.resolve(projectRoot, '.env.local'));
  tryLoadEnvAt(path.resolve(projectRoot, 'client/.env'));
  tryLoadEnvAt(path.resolve(projectRoot, 'client/.env.local'));

  // Collect multiple keys for fallback
  const envKeys = [
    apiKey,
    process.env.YOUTUBE_API,
    process.env.YOUTUBE_API2,
    process.env.YOUTUBE_API3,
    process.env.YOUTUBE_API_KEY,
    process.env.YT_API_KEY,
  ].filter(k => typeof k === 'string' && k.trim().length > 0);
  API_KEYS = Array.from(new Set(envKeys));
  API_KEY_IDX = 0;
  if (!API_KEYS.length) {
    console.error('Missing API key. Provide via --api-key, or set YOUTUBE_API or YOUTUBE_API2/YOUTUBE_API_KEY in .env');
    process.exit(1);
  }

  const inputCsvPath = path.resolve(projectRoot, 'attached_assets/800Exercise_DB - Sheet1.csv');
  const outputCsvPath = path.resolve(projectRoot, out || (all || limit > 100 ? 'attached_assets/800Exercise_DB_shorts_full.csv' : 'attached_assets/800Exercise_DB_first_15_shorts.csv'));

  if (!fs.existsSync(inputCsvPath)) {
    console.error(`Input CSV not found at: ${inputCsvPath}`);
    process.exit(1);
  }

  // Read CSV
  const fileContent = fs.readFileSync(inputCsvPath, 'utf8');
  const workbook = XLSX.read(fileContent, { type: 'string', raw: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const exerciseKey = 'exercise_name';
  const total = rows.length;
  const effectiveLimit = all ? (total - start) : Math.min(limit, Math.max(0, total - start));
  const rangeRows = rows.slice(start, start + effectiveLimit);

  // Prepare output CSV (append-safe)
  const header = ['rowid','exercise_name','youtube_video_id','youtube_url','title','channel','duration_seconds','tags_matched','matched_tag','selection_reason'];
  const fileExists = fs.existsSync(outputCsvPath);
  if (!fileExists) {
    fs.writeFileSync(outputCsvPath, header.join(',') + '\n');
  }

  // Index existing good rowids to avoid duplicates across retries
  const existingRowIds = new Set();
  if (fileExists) {
    try {
      const existingContent = fs.readFileSync(outputCsvPath, 'utf8');
      const wb0 = XLSX.read(existingContent, { type: 'string' });
      const ws0 = wb0.Sheets[wb0.SheetNames[0]];
      const rows0 = XLSX.utils.sheet_to_json(ws0, { defval: '' });
      for (const r0 of rows0) {
        const id = parseInt(r0.rowid, 10);
        const vid = String(r0.youtube_video_id || '').trim();
        if (Number.isFinite(id) && vid) existingRowIds.add(id);
      }
    } catch (e) {
      if (verbose) console.warn('WARN: could not index existing CSV, proceeding without skipExisting.');
    }
  }

  function csvEscape(value) {
    const s = value === undefined || value === null ? '' : String(value);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function sanitizeField(value) {
    const s = value === undefined || value === null ? '' : String(value);
    return s.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  function isGood(found) {
    if (!found || !found.videoId) return false;
    const durOk = typeof found.durationSeconds === 'number' && found.durationSeconds > 0 && found.durationSeconds <= 65;
    const reason = String(found.reason || '').toLowerCase();
    const qualitySignal = Boolean(found.tagsMatched) || reason.includes('title-match') || reason.includes('llm-accept');
    const badSignal = reason.includes('error') || reason.includes('no-result');
    return durOk && qualitySignal && !badSignal;
  }

  async function processOne(row) {
    const exercise = String(row[exerciseKey] || '').trim();
    if (!exercise) return null;
    const rowIdNum = Number(row.rowid);
    if (skipExisting && Number.isFinite(rowIdNum) && existingRowIds.has(rowIdNum)) {
      if (verbose) console.warn(`SKIP existing rowid ${rowIdNum} ${exercise}`);
      return null;
    }
    try {
      const found = await findBestShortForExercise(exercise, { strict, llm, verbose });
      if (onlyGood && !isGood(found)) {
        if (verbose) console.warn(`SKIP not-good rowid ${row.rowid} ${exercise}: ${found ? found.reason : 'no-result'}`);
        return null;
      }
      const record = found && isGood(found) ? {
        rowid: row.rowid,
        exercise_name: exercise,
        youtube_video_id: found.videoId,
        youtube_url: `https://www.youtube.com/shorts/${found.videoId}`,
        title: sanitizeField(found.title),
        channel: sanitizeField(found.channelTitle),
        duration_seconds: found.durationSeconds,
        tags_matched: found.tagsMatched,
        matched_tag: found.matchedTag,
        selection_reason: sanitizeField(found.reason),
      } : null;
      if (record) {
        const line = header.map(k => csvEscape(record[k])).join(',') + '\n';
        fs.appendFileSync(outputCsvPath, line);
        if (Number.isFinite(rowIdNum)) existingRowIds.add(rowIdNum);
      }
      return record;
    } catch (err) {
      if (verbose) console.error(`ERROR rowid ${row.rowid} ${exercise}: ${String(err?.message || err)}`);
      return null;
    }
  }

  // Simple concurrency control
  const pool = [];
  let inFlight = 0;
  let idx = 0;
  async function runNext() {
    if (idx >= rangeRows.length) return;
    const row = rangeRows[idx++];
    inFlight++;
    await processOne(row);
    inFlight--;
    await runNext();
  }
  const workers = Math.min(concurrency, rangeRows.length);
  for (let i = 0; i < workers; i++) pool.push(runNext());
  await Promise.all(pool);

  console.log(`Created/updated: ${outputCsvPath}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});


