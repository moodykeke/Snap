#!/usr/bin/env node
/*
 i18n audit & assist for Snap!
 - Aggregates SnapTranslator.dict from src/locale.js and locale/lang-*.js
 - Reports missing translations per language vs English baseline
 - Checks placeholder counts ('_' and <#n>) mismatches
 - Optional stub generation for overlay files
*/

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../');
const srcLocalePath = path.join(root, 'src', 'locale.js');
const localeDir = path.join(root, 'locale');

const KEEP_META = new Set(['language_name', 'language_translator', 'translator_e-mail', 'last_changed']);

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

function listLocaleFiles() {
  const files = fs.readdirSync(localeDir)
    .filter(f => f.startsWith('lang-') && f.endsWith('.js'))
    .map(f => path.join(localeDir, f));
  return files;
}

function makeSandbox() {
  const sandbox = {
    modules: {},
    console,
    // minimal stubs to avoid runtime references during definition
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
  // evaluate src/locale.js first to define Localizer and SnapTranslator.dict.*
  evalInSandbox(readFile(srcLocalePath), 'src/locale.js', sandbox);
  // evaluate overlay files to merge
  for (const f of listLocaleFiles()) {
    evalInSandbox(readFile(f), path.relative(root, f), sandbox);
  }
  if (!sandbox.SnapTranslator || !sandbox.SnapTranslator.dict) {
    throw new Error('Failed to load SnapTranslator.dict');
  }
  return sandbox.SnapTranslator.dict;
}

function getEnglishKeys(dict) {
  const en = dict.en || {};
  return Object.keys(en).filter(k => !KEEP_META.has(k));
}

function countPlaceholders(s) {
  if (typeof s !== 'string') return { underscore: 0, angleRefs: 0 };
  const underscore = (s.match(/_/g) || []).length;
  const angleRefs = (s.match(/<#\d+>/g) || []).length;
  return { underscore, angleRefs };
}

function audit(dict) {
  const langs = Object.keys(dict).sort();
  const enKeys = getEnglishKeys(dict);
  const report = { baselineCount: enKeys.length, languages: {} };

  for (const lang of langs) {
    const d = dict[lang] || {};
    if (!d) continue;
    const res = { missing: [], sameAsEnglish: [], placeholderMismatches: [] };
    for (const key of enKeys) {
      const enVal = d === dict.en ? dict.en[key] : dict.en[key];
      const val = d[key];
      const has = Object.prototype.hasOwnProperty.call(d, key);
      if (!has || val === '' || typeof val === 'undefined') {
        res.missing.push(key);
        continue;
      }
      if (val === enVal) {
        res.sameAsEnglish.push(key);
      }
      // placeholder checks only if both are strings
      const pe = countPlaceholders(enVal);
      const pt = countPlaceholders(val);
      if (pe.underscore !== pt.underscore || pe.angleRefs !== pt.angleRefs) {
        res.placeholderMismatches.push({ key, en: pe, tr: pt });
      }
    }
    report.languages[lang] = {
      missingCount: res.missing.length,
      sameAsEnglishCount: res.sameAsEnglish.length,
      placeholderMismatchCount: res.placeholderMismatches.length,
      missing: res.missing,
      sameAsEnglish: res.sameAsEnglish,
      placeholderMismatches: res.placeholderMismatches,
      meta: {
        language_name: d.language_name || lang,
        language_translator: d.language_translator || '',
        last_changed: d.last_changed || '',
      },
    };
  }
  return report;
}

function writeReport(reportPath, report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Report written:', reportPath);
}

function generateStub(lang, dict, enKeys, outDir, mode = 'empty') {
  const d = dict[lang] || {};
  const lines = [];
  for (const key of enKeys) {
    const has = Object.prototype.hasOwnProperty.call(d, key);
    const val = has ? d[key] : undefined;
    if (!has || val === '' || typeof val === 'undefined') {
      const enVal = dict.en[key];
      const stubVal = mode === 'english' ? enVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"') : '';
      lines.push(`    "${key}": "${stubVal}",`);
    }
  }
  const content = [
    `SnapTranslator.dict.${lang} = { ...SnapTranslator.dict.${lang},`,
    ...lines,
    '};\n',
  ].join('\n');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `lang-${lang}.stub.js`);
  fs.writeFileSync(outPath, content, 'utf8');
  console.log('Stub generated:', outPath);
}

function main() {
  const args = process.argv.slice(2);
  const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
  const langArg = args.includes('--lang') ? args[args.indexOf('--lang') + 1] : null;
  const stub = args.includes('--stub');
  const mode = args.includes('--fill=english') ? 'english' : 'empty';

  const dict = loadDictionaries();
  const enKeys = getEnglishKeys(dict);
  const report = audit(dict);
  const stamp = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const reportPath = out || path.join(root, 'utilities', 'i18n', `report-${stamp}.json`);
  writeReport(reportPath, report);

  if (stub) {
    const targetLangs = langArg ? [langArg] : Object.keys(dict).filter(l => l !== 'en');
    const stubOutDir = path.join(root, 'utilities', 'i18n', 'stub');
    for (const lg of targetLangs) {
      generateStub(lg, dict, enKeys, stubOutDir, mode);
    }
  }
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('i18n audit failed:', e.message);
    process.exit(1);
  }
}