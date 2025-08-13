// Purpose: Deduplicate and clean the aggregated shorts CSV, then compute the earliest
//          unfilled row to resume from. Optionally overwrite the original file.
// Usage:   node tools/cleanup-shorts-output.mjs \
//            --out attached_assets/800Exercise_DB_shorts_full.csv \
//            --source attached_assets/800Exercise_DB - Sheet1.csv
// Notes:   - Keeps one row per `rowid`, choosing the best candidate based on presence of
//            youtube_video_id, tags_matched, and LLM acceptance in selection_reason.
//          - Prints a recommended --start index to resume the main script.

import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx/xlsx.mjs';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { out: '', source: '', forward: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if ((a === '--out' || a === '--output') && i + 1 < args.length) {
      opts.out = String(args[i + 1]); i++;
    } else if (a === '--source' && i + 1 < args.length) {
      opts.source = String(args[i + 1]); i++;
    } else if (a === '--forward') {
      opts.forward = true;
    }
  }
  return opts;
}

function readCsvAsJson(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const wb = XLSX.read(content, { type: 'string' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

function scoreRecord(rec) {
  const hasId = String(rec.youtube_video_id || '').trim().length > 0;
  const tagsMatched = String(rec.tags_matched).toLowerCase() === 'true';
  const reason = String(rec.selection_reason || '').toLowerCase();
  let score = 0;
  if (hasId) score += 100;
  if (tagsMatched) score += 10;
  if (reason.includes('llm-accept')) score += 20;
  if (reason.startsWith('error')) score -= 100;
  if (reason.includes('no-result')) score -= 10;
  return score;
}

function isGood(rec) {
  return String(rec.youtube_video_id || '').trim().length > 0;
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

async function main() {
  const projectRoot = process.cwd();
  const opts = parseArgs();
  const { out, source } = opts;
  if (!out) {
    console.error('Missing --out <output_csv_path>');
    process.exit(1);
  }
  const outPath = path.resolve(projectRoot, out);
  if (!fs.existsSync(outPath)) {
    console.error(`Output CSV not found: ${outPath}`);
    process.exit(1);
  }
  const sourcePath = path.resolve(projectRoot, source || 'attached_assets/800Exercise_DB - Sheet1.csv');
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source CSV not found: ${sourcePath}`);
    process.exit(1);
  }

  const rawRows = readCsvAsJson(outPath);
  const sourceRows = readCsvAsJson(sourcePath);

  // Deduplicate by rowid using best-score
  const byRowId = new Map();
  for (const r of rawRows) {
    const rowid = parseInt(r.rowid, 10);
    if (!Number.isFinite(rowid)) continue;
    const current = byRowId.get(rowid);
    if (!current) {
      byRowId.set(rowid, r);
    } else {
      const sNew = scoreRecord(r);
      const sOld = scoreRecord(current);
      if (sNew > sOld) byRowId.set(rowid, r);
    }
  }

  // Determine resume index
  const expectedRowIds = sourceRows.map(r => parseInt(r.rowid, 10)).filter(Number.isFinite);
  const maxExpected = Math.max(...expectedRowIds);

  let resumeRowId;
  if (opts.forward) {
    // Next after the highest good rowid
    const goodRowIds = Array.from(byRowId.entries()).filter(([, rec]) => isGood(rec)).map(([id]) => id);
    const maxGood = goodRowIds.length ? Math.max(...goodRowIds) : 1;
    resumeRowId = Math.min(maxGood + 1, maxExpected);
  } else {
    // Earliest missing or bad
    resumeRowId = 1;
    for (let i = 1; i <= maxExpected; i++) {
      const rec = byRowId.get(i);
      if (!rec || !isGood(rec)) { resumeRowId = i; break; }
      resumeRowId = i + 1;
    }
  }
  const resumeStartIndex = Math.max(0, resumeRowId - 1); // 0-based index for --start

  // Write cleaned file (backup original)
  const bakPath = outPath + '.bak';
  fs.copyFileSync(outPath, bakPath);

  const header = ['rowid','exercise_name','youtube_video_id','youtube_url','title','channel','duration_seconds','tags_matched','matched_tag','selection_reason'];
  const lines = [header.join(',')];
  const sortedRowIds = Array.from(byRowId.keys()).sort((a,b)=>a-b);
  for (const id of sortedRowIds) {
    const r = byRowId.get(id);
    if (!isGood(r)) continue; // only write good rows
    const clean = {
      rowid: r.rowid,
      exercise_name: sanitizeField(r.exercise_name),
      youtube_video_id: sanitizeField(r.youtube_video_id),
      youtube_url: sanitizeField(r.youtube_url),
      title: sanitizeField(r.title),
      channel: sanitizeField(r.channel),
      duration_seconds: sanitizeField(r.duration_seconds),
      tags_matched: sanitizeField(r.tags_matched),
      matched_tag: sanitizeField(r.matched_tag),
      selection_reason: sanitizeField(r.selection_reason),
    };
    const line = header.map(k => csvEscape(clean[k])).join(',');
    lines.push(line);
  }
  // Atomic replace to avoid leftover trailing bytes from previous file
  const tmpPath = outPath + '.tmp';
  fs.writeFileSync(tmpPath, lines.join('\n') + '\n');
  fs.renameSync(tmpPath, outPath);

  // Stats
  const goodCount = sortedRowIds.filter(id => isGood(byRowId.get(id))).length;
  const total = maxExpected;
  console.log(`Cleaned: ${outPath}`);
  console.log(`Kept unique rows: ${sortedRowIds.length}. Good videos: ${goodCount}/${total}.`);
  console.log(`Backup saved at: ${bakPath}`);
  console.log(`Resume suggested: --start ${resumeStartIndex} (rowid ${resumeRowId})${opts.forward ? ' [forward]' : ''}`);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});


