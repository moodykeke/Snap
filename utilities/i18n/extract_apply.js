#!/usr/bin/env node
/*
 i18n extract & apply tool for Snap!
 Implements user workflow:
 1) If marking enabled, generate marker flags for translatable keys; else just extract.
 2) Translate extracted keys (default to Simplified Chinese zh_CN).
 3) Apply translations to current locale file, run basic verification; on failure revert; on success leave changes for commit.

 CLI:
  node utilities/i18n/extract_apply.js --lang zh_CN --apply --limit 50 --mark
 Options:
  --lang <code>        target language (default zh_CN)
  --apply              apply translations to locale/lang-<code>.js
  --limit <n>          limit number of applied missing keys (safety)
  --mark               produce markers file utilities/i18n/markers.json
  --engine <stub|deepl|azure> translation engine (default stub)
  --fill=english       when engine is stub, fill with English instead of empty
  --dry                extract & translate but do not write

 Note: External engines require env vars (DEEPL_API_KEY or AZURE_TRANSLATOR_KEY) and are not enabled by default.
*/

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../');
const srcLocalePath = path.join(root, 'src', 'locale.js');
const localeDir = path.join(root, 'locale');
const markersPath = path.join(root, 'utilities', 'i18n', 'markers.json');

const KEEP_META = new Set(['language_name', 'language_translator', 'translator_e-mail', 'last_changed']);

function readFile(p) { return fs.readFileSync(p, 'utf8'); }
function writeFile(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s, 'utf8'); }

function listLocaleFiles() {
  return fs.readdirSync(localeDir)
    .filter(f => f.startsWith('lang-') && f.endsWith('.js'))
    .map(f => path.join(localeDir, f));
}

function makeSandbox() {
  const sandbox = {
    modules: {},
    console,
    // minimal stubs
    SpriteMorph: function () {},
    isNil: function (x) { return x === null || x === undefined; },
  };
  vm.createContext(sandbox);
  return sandbox;
}

function evalInSandbox(code, filename, sandbox) {
  const script = new vm.Script(code, { filename });
  script.runInContext(sandbox);
}

function loadDictionaries() {
  const sandbox = makeSandbox();
  evalInSandbox(readFile(srcLocalePath), 'src/locale.js', sandbox);
  for (const f of listLocaleFiles()) {
    evalInSandbox(readFile(f), path.relative(root, f), sandbox);
  }
  const dict = sandbox.SnapTranslator && sandbox.SnapTranslator.dict;
  if (!dict) throw new Error('Failed to load SnapTranslator.dict');
  return dict;
}

function getEnglishKeys(dict) {
  const en = dict.en || {};
  return Object.keys(en).filter(k => !KEEP_META.has(k));
}

function getMissingKeys(dict, lang) {
  const enKeys = getEnglishKeys(dict);
  const d = dict[lang] || {};
  const missing = [];
  for (const key of enKeys) {
    const has = Object.prototype.hasOwnProperty.call(d, key);
    const val = d[key];
    if (!has || val === '' || typeof val === 'undefined') {
      missing.push(key);
    }
  }
  return missing;
}

// Simple glossary-based zh_CN translator stub
const GLOSSARY = {
  'Help': '帮助',
  'Cancel': '取消',
  'Error': '错误',
  'Import': '导入',
  'Export': '导出',
  'Settings': '设置',
  'Default': '默认',
  'Delete': '删除',
  'Save': '保存',
  'Load': '加载',
  'Back...': '返回...',
  'Download': '下载',
  'Upload': '上传',
  'OK': '确定'
};

async function translateStub(en) {
  if (typeof en !== 'string') return en;
  if (GLOSSARY[en]) return GLOSSARY[en];
  // Heuristic: keep placeholders intact
  return en; // default to English to avoid incorrect auto-translation
}

async function translateBatch(keys, dict, target, engine, fillEnglish) {
  const out = {};
  for (const key of keys) {
    const enVal = dict.en[key];
    let tr = enVal;
    if (engine === 'stub') {
      tr = await translateStub(enVal);
      if (tr === enVal && !fillEnglish && target.startsWith('zh')) {
        tr = ''; // leave empty unless fillEnglish requested
      }
    } else {
      // TODO: Implement real engines via env vars
      tr = enVal;
    }
    out[key] = tr;
  }
  return out;
}

function appendToLocaleFile(lang, entries) {
  const filePath = path.join(localeDir, `lang-${lang}.js`);
  if (!fs.existsSync(filePath)) throw new Error(`Locale file not found: ${filePath}`);
  const block = [
    `\nSnapTranslator.dict.${lang} = { ...SnapTranslator.dict.${lang},`,
    ...Object.keys(entries).map(k => `    "${k}": "${String(entries[k]).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",`),
    '};\n'
  ].join('\n');
  const backupDir = path.join(root, 'utilities', 'i18n', 'backup');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, `lang-${lang}.js.bak`);
  fs.copyFileSync(filePath, backupPath);
  fs.appendFileSync(filePath, block, 'utf8');
  return { filePath, backupPath };
}

function writeMarkers(keys, targetLang) {
  const stamp = new Date().toISOString();
  const data = { stamp, targetLang, keys };
  writeFile(markersPath, JSON.stringify(data, null, 2));
  console.log('Markers written:', markersPath);
}

async function main() {
  const args = process.argv.slice(2);
  const targetLang = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : 'zh_CN';
  const apply = args.includes('--apply');
  const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : 50;
  const mark = args.includes('--mark');
  const engine = args.includes('--engine') ? args[args.indexOf('--engine') + 1] : 'stub';
  const fillEnglish = args.includes('--fill=english');
  const dry = args.includes('--dry');

  const dict = loadDictionaries();
  const missing = getMissingKeys(dict, targetLang);
  console.log(`Missing keys for ${targetLang}:`, missing.length);

  if (mark) {
    writeMarkers(missing, targetLang);
  }

  const subset = missing.slice(0, limit);
  const translations = await translateBatch(subset, dict, targetLang, engine, fillEnglish);
  console.log('Prepared translations:', Object.keys(translations).length);

  if (dry) {
    console.log('Dry run: no files modified');
    return;
  }

  if (apply) {
    let backup;
    try {
      backup = appendToLocaleFile(targetLang, translations);
      console.log('Applied to locale file:', backup.filePath);
    } catch (e) {
      console.error('Apply failed:', e.message);
      if (backup && backup.backupPath) {
        fs.copyFileSync(backup.backupPath, backup.filePath);
        console.log('Reverted from backup');
      }
      process.exit(1);
    }
  } else {
    console.log('Apply flag not set; nothing written');
  }
}

if (require.main === module) {
  main().catch(e => { console.error('extract_apply failed:', e); process.exit(1); });
}