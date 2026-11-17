#!/usr/bin/env node
/**
 * RKStride - Centralized Governance, Contract, Language & Architecture Verifier
 * Enforces AGENTS.md, DESIGN.md, docs/glosarium.md, and docs/steering/tech.md.
 *
 * Modes:
 *   --mode=guard   (default) Fails on any regression above baseline, any diff-introduced
 *                  violation, TypeScript error, engine test failure, or tracked dist/.
 *   --mode=strict  Zero-tolerance mode: fails if ANY violation count > 0.
 *   --staged       Also scans staged git diff (+ lines) with zero tolerance for regressions.
 *   --with-tests   Also runs `npm test` (Vitest suite).
 *   --with-build   Also runs `npm run build` (Vite production build).
 *   --skip-tsc     Skip `tsc --noEmit` (useful only for rapid local dry-runs).
 *   --skip-engine  Skip `npm run test:engine`.
 *   --update-baseline  Regenerate scripts/verify-baseline.json from current counts.
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const BASELINE_PATH = join(ROOT, 'scripts', 'verify-baseline.json');

const args = new Set(process.argv.slice(2));
const modeArg = [...args].find((a) => a.startsWith('--mode='));
const MODE = modeArg ? modeArg.split('=')[1] : 'guard';
const IS_STRICT = MODE === 'strict';
const CHECK_STAGED = args.has('--staged');
const WITH_TESTS = args.has('--with-tests');
const WITH_BUILD = args.has('--with-build');
const SKIP_TSC = args.has('--skip-tsc');
const SKIP_ENGINE = args.has('--skip-engine');
const UPDATE_BASELINE = args.has('--update-baseline');

function rel(fullPath) {
  return relative(ROOT, fullPath).replace(/\\/g, '/');
}

function walkFiles(dir, predicate) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      results.push(...walkFiles(full, predicate));
    } else if (predicate(rel(full))) {
      results.push(full);
    }
  }
  return results;
}

function readLines(filePath) {
  return readFileSync(filePath, 'utf8').split(/\r?\n/);
}

function isTestFile(relPath) {
  return (
    relPath.includes('/__tests__/') ||
    relPath.includes('src/test/') ||
    /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(relPath)
  );
}

function runCommand(cmd, label) {
  process.stdout.write(`> ${label} (${cmd})...\n`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8' });
    console.log(`  [PASS] ${label}`);
    return true;
  } catch (err) {
    console.error(`  [FAIL] ${label}`);
    if (err.stdout) console.error(err.stdout);
    if (err.stderr) console.error(err.stderr);
    return false;
  }
}

function scanRegex(files, regex, filterFn) {
  const hits = [];
  for (const file of files) {
    const r = rel(file);
    const lines = readLines(file);
    lines.forEach((line, idx) => {
      if (filterFn && !filterFn(line, r, idx + 1)) return;
      if (regex.test(line)) {
        hits.push(`${r}:${idx + 1}: ${line.trim().slice(0, 120)}`);
      }
    });
  }
  return hits;
}

// =============================================================================
// 1. COLLECT SOURCE FILES
// =============================================================================
const srcFiles = walkFiles(join(ROOT, 'src'), (p) => /\.(ts|tsx)$/.test(p));
const prodSrcFiles = srcFiles.filter((f) => !isTestFile(rel(f)));
const uiFiles = prodSrcFiles.filter((f) => {
  const r = rel(f);
  return r.startsWith('src/components/') || r === 'src/App.tsx';
});
const engineFiles = prodSrcFiles.filter((f) => rel(f).startsWith('src/lib/engine/'));
const contractFiles = prodSrcFiles.filter((f) => rel(f).startsWith('src/contracts/'));
const docFiles = [
  ...walkFiles(join(ROOT, 'docs'), (p) => p.endsWith('.md')),
  join(ROOT, 'agents.md'),
].filter((f) => existsSync(f));

// =============================================================================
// 2. RULE DEFINITIONS (ALL AGENTS.MD / TECH.MD / DESIGN.MD / GLOSARIUM RULES)
// =============================================================================
const rules = [
  {
    id: 'ui_hex_literals',
    category: 'Design & Lint',
    description: 'Nol literal hex di src/components/** dan src/App.tsx (gunakan tokens.css)',
    run: () =>
      scanRegex(
        uiFiles,
        /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/,
        (line) => !line.trim().startsWith('//') && !line.trim().startsWith('*')
      ),
  },
  {
    id: 'no_outline_none',
    category: 'Accessibility',
    description: "Dilarang menghapus focus indicator dengan outline: 'none' / outline: 0",
    run: () => scanRegex(prodSrcFiles, /outline\s*:\s*(['"]none['"]|0\b)/),
  },
  {
    id: 'no_browser_alert',
    category: 'UI Hygiene',
    description: 'Dilarang memakai alert()/confirm()/prompt() di UI (gunakan banner inline)',
    run: () =>
      scanRegex(
        uiFiles,
        /\b(alert|confirm|prompt)\s*\(/,
        (line) => {
          const t = line.trim();
          return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('{/*');
        }
      ),
  },
  {
    id: 'no_em_dash_ui_docs',
    category: 'Copy & Paritas Bahasa',
    description: 'Dilarang karakter em dash (U+2014) di UI maupun dokumen governance',
    run: () =>
      scanRegex([...uiFiles, ...docFiles], /\u2014/, (line, r) => {
        // Keep science.md untouched legacy prose exempt only if outside specs/prd/glosarium/steering/agents
        if (r === 'docs/science.md') return false;
        return true;
      }),
  },
  {
    id: 'no_as_any',
    category: 'Kontrak & Type Safety',
    description: 'Dilarang bypass tipe dengan `as any` di kode produksi',
    run: () => scanRegex(prodSrcFiles, /\bas\s+any\b/),
  },
  {
    id: 'weak_zod_enum',
    category: 'Kontrak API & Zod',
    description: 'Enum WorkoutCategory/RunningType/ACWRStatus tidak boleh dilemahkan jadi z.string()',
    run: () =>
      scanRegex(
        prodSrcFiles.filter((f) => rel(f).startsWith('src/contracts/') || rel(f) === 'src/lib/db/exportImport.ts'),
        /\b(category|runningType|acwrStatus|goal|activityLevel)\s*:\s*z\.string\(/
      ),
  },
  {
    id: 'acwr_warning_legacy',
    category: 'Konsistensi Status Kanonikal',
    description: "Status ACWR legacy 'warning' tidak boleh dipancarkan/direferensikan di engine, AI, atau UI",
    run: () =>
      scanRegex(
        prodSrcFiles.filter((f) => rel(f) !== 'src/types/workout.ts'),
        /(acwr\.status|acwrStatus|projectedStatus|isWarning)\s*===?\s*['"]warning['"]|['"]warning['"]\s*\)/,
        (line) => line.includes('acwr') || line.includes('ACWR') || line.includes('isWarning')
      ),
  },
  {
    id: 'stale_acwr_threshold_text',
    category: 'Konsistensi Kontrak Sains',
    description: 'Teks saran di engine/AI tidak boleh menyebut ambang ACWR lama (> 1.3, 0.8 - 1.3, > 1.5)',
    run: () =>
      scanRegex(
        [...engineFiles, ...prodSrcFiles.filter((f) => rel(f).startsWith('src/lib/ai/'))],
        /(ACWR.*(1\.3|1\.5)|0\.8\s*-\s*1\.3)/i
      ),
  },
  {
    id: 'legacy_wrong_formula_ui',
    category: 'Konsistensi Rumus UI vs Engine',
    description: 'UI dilarang mendefinisikan rumus beban menyimpang (rpe / 2, * 0.1, bobot Z2=1.2)',
    run: () =>
      scanRegex(
        uiFiles,
        /(\(rpe\s*\/\s*10\)\s*[*×]\s*0\.1|\b(?:rpe|r)\s*\/\s*2\b|Z2=1\.2)/i
      ),
  },
  {
    id: 'dexie_backup_version_drift',
    category: 'Kontrak DB vs Backup',
    description: 'Versi payload exportDatabaseToJson() harus sama dengan versi skema RKStrideDatabase',
    run: () => {
      const dbFile = join(ROOT, 'src', 'lib', 'db', 'database.ts');
      const expFile = join(ROOT, 'src', 'lib', 'db', 'exportImport.ts');
      if (!existsSync(dbFile) || !existsSync(expFile)) return [];
      const dbText = readFileSync(dbFile, 'utf8');
      const expText = readFileSync(expFile, 'utf8');
      const dbVersions = [...dbText.matchAll(/this\.version\((\d+)\)/g)].map((m) => Number(m[1]));
      const maxDbVer = dbVersions.length ? Math.max(...dbVersions) : 0;
      let expVer = 0;
      const expVerMatch = expText.match(/version:\s*(\d+)/);
      if (expVerMatch) {
        expVer = Number(expVerMatch[1]);
      } else if (/version:\s*CURRENT_DB_VERSION/.test(expText)) {
        const schemaFile = join(ROOT, 'src', 'contracts', 'backup.schema.ts');
        const schemaText = existsSync(schemaFile) ? readFileSync(schemaFile, 'utf8') : '';
        const schemaVerMatch = schemaText.match(/CURRENT_SCHEMA_VERSION\s*=\s*(\d+)/);
        if (schemaVerMatch) expVer = Number(schemaVerMatch[1]);
      }
      if (maxDbVer !== expVer) {
        return [
          `src/lib/db/exportImport.ts: backup version (${expVer}) !== RKStrideDatabase version (${maxDbVer})`,
        ];
      }
      return [];
    },
  },
  {
    id: 'unconditional_byok_key_export',
    category: 'Keamanan & Privasi',
    description: 'exportDatabaseToJson() dilarang mengekspor byokApiKey secara default',
    run: () =>
      scanRegex(
        [join(ROOT, 'src', 'lib', 'db', 'exportImport.ts')].filter(existsSync),
        /aiCoachConfig:\s*getAiCoachConfig\(\)/
      ),
  },
  {
    id: 'utc_date_split',
    category: 'Integritas Tanggal Lokal',
    description: "Dilarang memakai toISOString().split('T')[0] untuk kunci harian YYYY-MM-DD",
    run: () => scanRegex(prodSrcFiles, /toISOString\(\)\.split\(['"]T['"]\)\[0\]/),
  },
  {
    id: 'engine_isolation',
    category: 'Audit Arsitektur',
    description: 'Pure engine (src/lib/engine/**) dilarang mengimpor React, Dexie, database, atau localStorage',
    run: () =>
      scanRegex(
        engineFiles,
        /(from\s+['"]react['"]|from\s+['"]dexie['"]|lib\/db\/database|\blocalStorage\b|\bdocument\.)/
      ),
  },
  {
    id: 'ui_direct_db_or_localstorage',
    category: 'Audit Arsitektur (Thin UI)',
    description: 'Komponen UI & App.tsx dilarang memanggil db.* atau localStorage.* langsung',
    run: () =>
      scanRegex(
        uiFiles,
        /(\bdb\.(workoutLogs|dailyReadiness|userProfile|weeklySchedule|appSettings|postWorkoutDebrief)\b|from\s+['"][^'"]*lib\/db\/database['"]|\blocalStorage\.(getItem|setItem|removeItem)\b)/
      ),
  },
  {
    id: 'fabricated_telemetry_or_fallback',
    category: 'Kejujuran Data',
    description: 'Dilarang angka fabrikasi (strengthExercisesCount: 3) atau silent dummy fallback smartwatch',
    run: () =>
      scanRegex(
        prodSrcFiles,
        /(strengthExercisesCount:\s*[^,\n]*\?\s*3\s*:|let\s+sleepHours\s*=\s*7\.5|let\s+restingHeartRate\s*=\s*51)/
      ),
  },
  {
    id: 'brand_parity_ui',
    category: 'Paritas Bahasa & Brand',
    description: 'Teks UI dilarang membocorkan nama merek lama PULSE (gunakan RKStride)',
    run: () =>
      scanRegex(uiFiles, /\bPULSE\b/, (line) => !line.trim().startsWith('//') && !line.trim().startsWith('*')),
  },
  {
    id: 'contract_english_field_parity',
    category: 'Paritas Bahasa Kontrak',
    description: 'Skema kontrak baru di src/contracts/** harus memakai penamaan field Bahasa Inggris (kecuali @legacy-alias)',
    run: () =>
      scanRegex(
        contractFiles,
        /\b(tanggal|namaGerakan|bebanKg|jarakKm|durasiMenit)\s*:/,
        (line) => !line.includes('@legacy-alias')
      ),
  },
  {
    id: 'tab_key_parity',
    category: 'Konsistensi Navigasi',
    description: 'Kunci AppTab di BottomNav.tsx harus 1:1 dengan tabTitles di App.tsx',
    run: () => {
      const navFile = join(ROOT, 'src', 'components', 'BottomNav.tsx');
      const appFile = join(ROOT, 'src', 'App.tsx');
      if (!existsSync(navFile) || !existsSync(appFile)) return [];
      const navText = readFileSync(navFile, 'utf8');
      const appText = readFileSync(appFile, 'utf8');
      const tabMatch = navText.match(/export type AppTab\s*=\s*([^;]+);/);
      const titlesMatch = appText.match(/const tabTitles:\s*Record<AppTab,\s*string>\s*=\s*\{([^}]+)\}/);
      if (!tabMatch || !titlesMatch) return ['Tidak dapat mem-parse AppTab atau tabTitles'];
      const navKeys = [...tabMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
      const titleKeys = [...titlesMatch[1].matchAll(/([a-zA-Z0-9_]+)\s*:/g)].map((m) => m[1]).sort();
      if (JSON.stringify(navKeys) !== JSON.stringify(titleKeys)) {
        return [`Mismatch AppTab [${navKeys.join(',')}] vs tabTitles [${titleKeys.join(',')}]`];
      }
      return [];
    },
  },
  {
    id: 'monolith_file_guard',
    category: 'Audit Arsitektur (Batas Modul)',
    description: 'File komponen/engine > 500 baris ditandai sebagai target pemecahan modul',
    run: () => {
      const hits = [];
      for (const f of [...uiFiles, ...engineFiles]) {
        const lines = readLines(f);
        if (lines.length > 500) {
          hits.push(`${rel(f)}: ${lines.length} baris (batas ideal <= 400-500 baris)`);
        }
      }
      return hits;
    },
  },
  {
    id: 'git_tracked_build_artifacts',
    category: 'Git Hygiene',
    description: 'Direktori dist/ dan node_modules/ dilarang dilacak di Git',
    run: () => {
      try {
        const out = execSync('git ls-files dist node_modules', {
          cwd: ROOT,
          encoding: 'utf8',
          stdio: 'pipe',
        }).trim();
        return out ? out.split(/\r?\n/).map((f) => `Tracked artifact: ${f}`) : [];
      } catch {
        return [];
      }
    },
  },
];

// =============================================================================
// 3. STAGED / WORKING DIFF ZERO-TOLERANCE GUARD
// =============================================================================
function checkDiffAddedLines() {
  const diffCmd = CHECK_STAGED
    ? 'git diff --cached -U0 --diff-filter=ACM'
    : 'git diff -U0 --diff-filter=ACM';
  let diffOutput = '';
  try {
    diffOutput = execSync(diffCmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  } catch {
    return [];
  }

  // Also check staged dist/ or node_modules/ files directly
  const diffFailures = [];
  if (CHECK_STAGED) {
    try {
      const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACMR', {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: 'pipe',
      })
        .trim()
        .split(/\r?\n/)
        .filter(Boolean);
      for (const f of stagedFiles) {
        if (f.startsWith('dist/') || f.startsWith('node_modules/')) {
          diffFailures.push(`[STAGED FORBIDDEN] ${f} tidak boleh di-commit`);
        }
      }
    } catch {
      // ignore
    }
  }

  const isCodeSrc = (file) => file.startsWith('src/') && /\.(ts|tsx|js|jsx)$/.test(file);

  let currentFile = '';
  const bannedInNewCode = [
    {
      name: 'as_any_in_new_code',
      test: (line, file) => isCodeSrc(file) && !isTestFile(file) && /\bas\s+any\b/.test(line),
      msg: 'Penggunaan `as any` baru dilarang',
    },
    {
      name: 'utc_date_in_new_code',
      test: (line, file) => isCodeSrc(file) && !isTestFile(file) && /toISOString\(\)\.split\(['"]T['"]\)\[0\]/.test(line),
      msg: "Gunakan getLocalDateKey(), dilarang toISOString().split('T')[0]",
    },
    {
      name: 'ui_hex_in_new_code',
      test: (line, file) =>
        (file.startsWith('src/components/') || file === 'src/App.tsx') &&
        isCodeSrc(file) &&
        !isTestFile(file) &&
        /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/.test(line),
      msg: 'Literal hex dilarang di UI, gunakan token CSS var(--*)',
    },
    {
      name: 'outline_none_in_new_code',
      test: (line, file) => isCodeSrc(file) && /outline\s*:\s*(['"]none['"]|0\b)/.test(line),
      msg: 'Dilarang menghapus focus indicator dengan outline: none/0',
    },
    {
      name: 'alert_in_new_code',
      test: (line, file) =>
        (file.startsWith('src/components/') || file === 'src/App.tsx') &&
        isCodeSrc(file) &&
        !line.trim().startsWith('//') &&
        !line.trim().startsWith('{/*') &&
        /\b(alert|confirm|prompt)\s*\(/.test(line),
      msg: 'Dilarang alert/confirm/prompt di UI, gunakan banner/modal inline',
    },
    {
      name: 'direct_db_in_ui',
      test: (line, file) =>
        (file.startsWith('src/components/') || file === 'src/App.tsx') &&
        isCodeSrc(file) &&
        !isTestFile(file) &&
        (/\bdb\.(workoutLogs|dailyReadiness|userProfile|weeklySchedule|appSettings|postWorkoutDebrief)\b/.test(line) ||
          /lib\/db\/database/.test(line)),
      msg: 'UI dilarang memanggil db.* langsung; gunakan repository/hook',
    },
    {
      name: 'em_dash_in_new_code',
      test: (line, file) =>
        (isCodeSrc(file) || file.startsWith('docs/')) && file !== 'docs/science.md' && /\u2014/.test(line),
      msg: 'Dilarang karakter em dash (U+2014) di UI atau dokumen',
    },
  ];

  for (const rawLine of diffOutput.split(/\r?\n/)) {
    if (rawLine.startsWith('+++ b/')) {
      currentFile = rawLine.slice(6).trim();
      continue;
    }
    if (!rawLine.startsWith('+') || rawLine.startsWith('+++')) continue;
    const added = rawLine.slice(1);
    for (const check of bannedInNewCode) {
      if (check.test(added, currentFile)) {
        diffFailures.push(`[NEW DIFF VIOLATION] ${currentFile}: ${check.msg} -> ${added.trim().slice(0, 100)}`);
      }
    }
  }

  return diffFailures;
}

// =============================================================================
// 4. EXECUTE ALL CHECKS
// =============================================================================
console.log('================================================================');
console.log(`RKStride Governance Verifier (mode: ${MODE}${CHECK_STAGED ? ', staged-guard' : ''})`);
console.log('================================================================');

let ok = true;

if (!SKIP_TSC && !UPDATE_BASELINE) {
  if (!runCommand('npx tsc --noEmit', 'TypeScript strict typecheck')) ok = false;
}

if (!SKIP_ENGINE && !UPDATE_BASELINE) {
  if (!runCommand('npm run test:engine', 'Sports Science Engine CLI Suite')) ok = false;
}

const currentCounts = {};
const ruleResults = [];

for (const rule of rules) {
  const hits = rule.run();
  currentCounts[rule.id] = hits.length;
  ruleResults.push({ ...rule, hits });
}

if (UPDATE_BASELINE) {
  const baselinePayload = {
    generatedAt: new Date().toISOString(),
    note: 'Ratchet baseline: counts may only decrease toward 0 as Sprint 1-5 progresses.',
    maxCounts: currentCounts,
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(baselinePayload, null, 2) + '\n', 'utf8');
  console.log(`\nUpdated baseline at ${rel(BASELINE_PATH)}:`);
  console.log(JSON.stringify(currentCounts, null, 2));
  process.exit(0);
}

let baseline = {};
if (existsSync(BASELINE_PATH)) {
  try {
    baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).maxCounts || {};
  } catch (err) {
    console.error(`Failed to parse ${rel(BASELINE_PATH)}:`, err);
    process.exit(1);
  }
}

console.log('\n--- Static Audit: Kontrak, Arsitektur, Paritas Bahasa & Lint ---');
let improvements = 0;

for (const res of ruleResults) {
  const allowed = IS_STRICT ? 0 : (baseline[res.id] ?? 0);
  const count = res.hits.length;

  if (count > allowed) {
    ok = false;
    console.error(`\n[FAIL] ${res.id} (${res.category}): ${count} temuan (batas maksimal: ${allowed})`);
    console.error(`       Aturan: ${res.description}`);
    res.hits.slice(0, 10).forEach((h) => console.error(`       - ${h}`));
    if (res.hits.length > 10) console.error(`       ... dan ${res.hits.length - 10} lainnya`);
  } else if (!IS_STRICT && count < allowed) {
    improvements++;
    console.log(`[IMPROVED] ${res.id}: turun ${allowed} -> ${count} (jalankan --update-baseline untuk mengunci)`);
  } else if (count === 0) {
    console.log(`[PASS] ${res.id}: 0 temuan`);
  } else {
    console.log(`[DEBT-TRACKED] ${res.id}: ${count}/${allowed} (legacy baseline, wajib turun ke 0)`);
  }
}

const diffFailures = checkDiffAddedLines();
if (diffFailures.length > 0) {
  ok = false;
  console.error('\n--- Diff Regression Guard Failures ---');
  diffFailures.forEach((f) => console.error(`  ${f}`));
} else {
  console.log('\n[PASS] Diff Regression Guard: tidak ada pelanggaran baru di perubahan aktif.');
}

if (WITH_TESTS) {
  if (!runCommand('npm test', 'Vitest Component & Integration Suite')) ok = false;
}

if (WITH_BUILD) {
  if (!runCommand('npm run build', 'Production Vite Build')) ok = false;
}

console.log('\n================================================================');
if (!ok) {
  console.error('VERIFICATION FAILED: Perbaiki pelanggaran di atas sebelum commit/merge.');
  process.exit(1);
}
if (improvements > 0) {
  console.log(`VERIFICATION PASSED (${improvements} aturan membaik; jalankan \`node scripts/verify.mjs --update-baseline\` untuk mengunci ratchet).`);
} else {
  console.log('VERIFICATION PASSED.');
}
