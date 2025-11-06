#!/usr/bin/env node
/*
 Apply stubs from scan-<lang>.json to locale/lang-<lang>.js
 Options:
  --lang <code>      target language (default zh_CN)
  --scan <path>      path to scan result JSON (required)
  --fill=english     fill values with English (the key itself) instead of empty
*/
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../');

function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) { fs.writeFileSync(p, s, 'utf8'); }

function escapeVal(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

function main() {
  const args = process.argv.slice(2);
  const lang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'zh_CN';
  const scanIdx = args.indexOf('--scan');
  if (scanIdx < 0) { console.error('Missing --scan <path>'); process.exit(1); }
  const scanPath = path.resolve(args[scanIdx + 1]);
  const fillEnglish = args.includes('--fill=english');
  const langPath = path.join(root, 'locale', `lang-${lang}.js`);
  if (!fs.existsSync(langPath)) { console.error('Locale file not found:', langPath); process.exit(1); }

  const scan = JSON.parse(read(scanPath));
  const rawKeys = Object.keys(scan.missing || {});
  const keys = rawKeys.filter(k => {
    const s = String(k);
    const len = s.length;
    const hasNL = /\n/.test(s);
    const looksHint = /^uncheck|^check/.test(s);
    // reject obvious code fragments or very long strings
    if (len > 180) return false;
    if (/function|=>|var\s|new\s|\bthis\.|\bBlockMorph|\bDialogBoxMorph|\bXMLHttpRequest|\bserializer|\bpaletteXML/.test(s)) return false;
    if (/https?:\/\//.test(s)) return false; // skip URLs in messages
    if (hasNL && !looksHint) return false; // only allow newline in short hints
    return true;
  });
  const lines = keys.map(k => `    "${escapeVal(k)}": "${fillEnglish ? escapeVal(k) : ''}",`);
  const block = [
    `\n// applied from ${path.relative(root, scanPath)} on ${new Date().toISOString()}`,
    `SnapTranslator.dict.${lang} = { ...SnapTranslator.dict.${lang},`,
    ...lines,
    '};\n'
  ].join('\n');

  const backupDir = path.join(root, 'utilities', 'i18n', 'backup');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `lang-${lang}.js.pre-scan-${Date.now()}.bak`);
  fs.copyFileSync(langPath, backupPath);
  fs.appendFileSync(langPath, block, 'utf8');
  console.log(`Applied ${keys.length} filtered stubs (from ${rawKeys.length}) to ${langPath}`);
  console.log('Backup saved at', backupPath);
}

if (require.main === module) {
  try { main(); } catch (e) { console.error('apply_scan_stub failed:', e); process.exit(1); }
}