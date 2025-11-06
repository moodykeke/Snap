#!/usr/bin/env node
/*
 Apply zh_CN candidate translations into locale/lang-zh_CN.js
 Usage: node utilities/i18n/apply_candidates.js --file utilities/i18n/candidates.zh_CN.json
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../..');
const localeDir = path.join(root, 'locale');
const zhCNPath = path.join(localeDir, 'lang-zh_CN.js');

function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) { fs.writeFileSync(p, s, 'utf8'); }

function makeSandbox() {
  const sandbox = { modules: {}, console, SpriteMorph: function(){}, isNil: x => x==null };
  vm.createContext(sandbox);
  return sandbox;
}

function evalInSandbox(code, filename, sandbox) {
  new vm.Script(code, { filename }).runInContext(sandbox);
}

function loadDict() {
  const sandbox = makeSandbox();
  const srcLocalePath = path.join(root, 'src', 'locale.js');
  evalInSandbox(read(srcLocalePath), 'src/locale.js', sandbox);
  // load zh_CN overlay only
  evalInSandbox(read(zhCNPath), 'locale/lang-zh_CN.js', sandbox);
  if (!sandbox.SnapTranslator || !sandbox.SnapTranslator.dict) {
    throw new Error('Failed to load SnapTranslator.dict');
  }
  return sandbox.SnapTranslator.dict;
}

function main() {
  const args = process.argv.slice(2);
  const fileFlagIdx = args.indexOf('--file');
  const filePath = fileFlagIdx >= 0 ? args[fileFlagIdx + 1] : path.join(root, 'utilities', 'i18n', 'candidates.zh_CN.json');
  if (!fs.existsSync(filePath)) {
    console.error('Candidates file not found:', filePath);
    process.exit(1);
  }
  const candidates = JSON.parse(read(filePath));
  const dict = loadDict();
  const en = dict.en || {};
  const entries = {};
  Object.keys(candidates).forEach(k => {
    if (k === '_meta') return;
    const val = candidates[k];
    // keep placeholders intact; do not auto-convert
    entries[k] = String(val);
  });

  // prepare append block
  const lines = Object.keys(entries).map(k => `    "${k}": "${entries[k].replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",`);
  const block = [
    `\n// applied from utilities/i18n/candidates.zh_CN.json on ${new Date().toISOString()}`,
    `SnapTranslator.dict.zh_CN = { ...SnapTranslator.dict.zh_CN,`,
    ...lines,
    '};\n'
  ].join('\n');

  // backup and append
  const backupDir = path.join(root, 'utilities', 'i18n', 'backup');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, 'lang-zh_CN.js.pre-candidates.bak');
  fs.copyFileSync(zhCNPath, backupPath);
  fs.appendFileSync(zhCNPath, block, 'utf8');
  console.log(`Applied ${Object.keys(entries).length} candidate entries to ${zhCNPath}`);
  console.log('Backup saved at', backupPath);
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('apply_candidates failed:', e);
    process.exit(1);
  }
}