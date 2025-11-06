#!/usr/bin/env node
/*
 Scans codebase for localizable strings and reports those missing in target language.
 Patterns:
  - localize('...') / localize("...")
  - addItem('...') first argument (Menu labels are localized internally)
  - prompt('...') first argument (dialog titles)
  - inform('...', '...') both title and message (simple literals only)

 Usage:
  node utilities/i18n/scan_keys.js --lang zh_CN --out utilities/i18n/scan-zh_CN.json
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../');
const targets = [path.join(root, 'src'), path.join(root, 'libraries')];
const zhFile = path.join(root, 'locale', 'lang-zh_CN.js');

function listFiles(dir) {
  const res = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && p.endsWith('.js')) res.push(p);
    }
  }
  return res;
}

function read(p) { return fs.readFileSync(p, 'utf8'); }

function makeSandbox() {
  const sandbox = { modules: {}, console, SpriteMorph: function(){}, isNil: x => x==null };
  vm.createContext(sandbox);
  return sandbox;
}

function loadDict(lang) {
  const sandbox = makeSandbox();
  const srcLocalePath = path.join(root, 'src', 'locale.js');
  vm.runInContext(read(srcLocalePath), sandbox, { filename: 'src/locale.js' });
  const langPath = path.join(root, 'locale', `lang-${lang}.js`);
  if (fs.existsSync(langPath)) vm.runInContext(read(langPath), sandbox, { filename: `locale/lang-${lang}.js` });
  return sandbox.SnapTranslator && sandbox.SnapTranslator.dict ? sandbox.SnapTranslator.dict[lang] || {} : {};
}

function scanFile(p) {
  const src = read(p);
  const found = [];
  // localize('...') or localize("...")
  const rgxLocalize = /localize\(\s*(["'])((?:\\.|[^\\])*?)\1\s*\)/g;
  // addItem('...'
  const rgxAddItem = /\.addItem\(\s*(["'])((?:\\.|[^\\])*?)\1/g;
  // prompt('...'
  const rgxPrompt = /\.prompt(?:Vector|Numeric)?\(\s*(["'])((?:\\.|[^\\])*?)\1/g;
  // inform('...', '...') simple literals
  const rgxInform = /\.inform\(\s*(["'])((?:\\.|[^\\])*?)\1\s*,\s*(["'])((?:\\.|[^\\])*?)\3/g;

  let m;
  while ((m = rgxLocalize.exec(src))) found.push(m[2]);
  while ((m = rgxAddItem.exec(src))) found.push(m[2]);
  while ((m = rgxPrompt.exec(src))) found.push(m[2]);
  while ((m = rgxInform.exec(src))) { found.push(m[2]); found.push(m[4]); }
  return found;
}

function main() {
  const args = process.argv.slice(2);
  const lang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'zh_CN';
  const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(root, 'utilities', 'i18n', `scan-${lang}.json`);
  const dict = loadDict(lang);
  const keys = new Set(Object.keys(dict));
  const missing = {};
  for (const dir of targets) {
    for (const file of listFiles(dir)) {
      const vals = scanFile(file);
      vals.forEach(k => {
        if (!keys.has(k)) {
          if (!missing[k]) missing[k] = [];
          missing[k].push(path.relative(root, file));
        }
      });
    }
  }
  const result = {
    lang,
    missingCount: Object.keys(missing).length,
    missing
  };
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Scan complete. Missing keys for ${lang}:`, result.missingCount);
  console.log('Output:', out);
}

if (require.main === module) {
  try { main(); } catch (e) { console.error('scan_keys failed:', e); process.exit(1); }
}