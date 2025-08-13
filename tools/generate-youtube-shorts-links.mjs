// Purpose: Generate YouTube Shorts search URLs for each exercise in the provided CSV,
//          adding a new column `youtube_shorts_search_url` to a new CSV file.
// Context: The source CSV is `attached_assets/800Exercise_DB - Sheet1.csv` where column B is `exercise_name`.
// Output:  `attached_assets/800Exercise_DB_with_youtube.csv` with all original columns plus the new URL column.
// Usage:   node tools/generate-youtube-shorts-links.mjs
// Notes:   This does NOT call the YouTube API. It creates a direct Shorts search link that opens
//          a page of short videos for the specific exercise. This avoids API keys and quota limits.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
// Use the ESM build to ensure functions like read/write are available in ESM
import * as XLSX from 'xlsx/xlsx.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Absolute paths per workspace info
  const projectRoot = path.resolve(__dirname, '..');
  const inputCsvPath = path.resolve(projectRoot, 'attached_assets/800Exercise_DB - Sheet1.csv');
  const outputCsvPath = path.resolve(projectRoot, 'attached_assets/800Exercise_DB_with_youtube.csv');

  // Basic validation of input file
  if (!fs.existsSync(inputCsvPath)) {
    console.error(`Input CSV not found at: ${inputCsvPath}`);
    process.exit(1);
  }

  // Read CSV via xlsx (robust CSV parsing incl. quoted fields)
  const fileContent = fs.readFileSync(inputCsvPath, 'utf8');
  const workbook = XLSX.read(fileContent, { type: 'string', raw: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  /**
   * Convert to JSON preserving headers. defval ensures empty cells are kept as empty strings
   * to avoid column shifting during re-export.
   */
  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!Array.isArray(rows) || rows.length === 0) {
    console.error('No rows found in the input CSV.');
    process.exit(1);
  }

  // Determine the exercise name column; expected `exercise_name`
  const sample = rows[0];
  const exerciseKey = Object.prototype.hasOwnProperty.call(sample, 'exercise_name')
    ? 'exercise_name'
    : null;

  if (!exerciseKey) {
    console.error('Could not find `exercise_name` column in the CSV header.');
    const available = Object.keys(sample);
    console.error(`Available columns: ${available.join(', ')}`);
    process.exit(1);
  }

  // Build output rows with an added column for Shorts search URL
  const augmentedRows = rows.map((row) => {
    const nameRaw = String(row[exerciseKey] || '').trim();
    const query = nameRaw.length > 0 ? nameRaw : '';
    // Build standard YouTube search URL and a Shorts-focused search (by including the keyword 'shorts').
    const youtubeSearchUrl = query
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' exercise')}`
      : '';
    const youtubeShortsSearchUrl = query
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' exercise shorts')}`
      : '';
    return {
      ...row,
      youtube_search_query: query,
      youtube_search_url: youtubeSearchUrl,
      youtube_shorts_search_url: youtubeShortsSearchUrl,
    };
  });

  // Export to CSV using xlsx
  const outWs = XLSX.utils.json_to_sheet(augmentedRows);
  const csv = XLSX.utils.sheet_to_csv(outWs);
  fs.writeFileSync(outputCsvPath, csv);

  console.log(`Created: ${outputCsvPath}`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});


