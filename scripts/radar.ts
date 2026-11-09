#!/usr/bin/env node
/**
 * scripts/radar.ts
 * Standalone Architecture, Layer Hierarchy, TypeScript & Boundary Radar for RCUIModule.
 *
 * Enforces all RCUIModule invariants independently before committing to the submodule:
 * 0. Lockfile Guard: Forbids non-pnpm lockfiles (`package-lock.json`, `yarn.lock`, `bun.lock`).
 * 1. TypeScript Strict Check: Runs `tsc --noEmit` across all 13 UI layers (`--no-tsc` to skip, `--tsc-only` for typecheck).
 * 2. 7-Layer Unidirectional Hierarchy & L1 Config Purity: Blocks upward runtime imports and mutable/side-effecting L1 configs.
 * 3. Zero Value Re-Export & Zero Circular Dependency Guard: Blocks direct/indirect value re-export barrels and runtime/type cycles.
 * 4. Dual-Cap Volume (SoftInfo=400L/12KB, HardError=800L/18KB) & MaxLine<=400chars Guard.
 * 5. Floating Window 1:1 Preset & `SURFACE_META` Guard + English/Zero-Emoji/Neutral-Ball Hygiene.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  expandRelativeGlobPattern,
  FILE_ANY_LIMIT,
  getGitModifiedRelFiles,
  getLayerInfo,
  HARD_BYTE_LIMIT,
  HARD_LINE_LIMIT,
  HOST_MOUNTED_ENTRY_FILES,
  MAX_LINE_CHAR_LIMIT,
  resolveImportPath,
  ROOT_DIR,
  runTypeScriptCheck,
  SOFT_BYTE_LIMIT,
  SOFT_LINE_LIMIT,
  stripComments,
  toPosixRel,
  walkUiCoreFiles,
} from './radar/uiRadarConstantsAndFs.ts';
import {
  checkConfigPurity,
  checkFloatingWindowPresets,
  checkLanguageEmojiAndHygiene,
  checkValueReExports,
} from './radar/uiRadarScanners.ts';

function detectCircularDependencies(importGraph: Map<string, string[]>, errors: string[]): void {
  const visitState = new Map<string, number>();
  const cycles: string[][] = [];

  function dfs(node: string, stack: string[]): void {
    visitState.set(node, 1);
    const neighbors = importGraph.get(node) || [];
    for (const next of neighbors) {
      if (!importGraph.has(next)) continue;
      const state = visitState.get(next) || 0;
      if (state === 1) {
        const idx = stack.indexOf(next);
        cycles.push([...stack.slice(idx), next]);
      } else if (state === 0) {
        dfs(next, [...stack, next]);
      }
    }
    visitState.set(node, 2);
  }

  for (const node of importGraph.keys()) {
    if ((visitState.get(node) || 0) === 0) {
      dfs(node, [node]);
    }
  }

  for (const cycle of cycles) {
    errors.push(`[CIRCULAR DEPENDENCY] ${cycle.join(' -> ')}`);
  }
}

function main(): void {
  const args = new Set(process.argv.slice(2));
  const skipTsc = args.has('--no-tsc');
  const tscOnly = args.has('--tsc-only');
  const showAllInfos = args.has('--all-info');
  if (tscOnly) {
    const tsResult = runTypeScriptCheck();
    if (!tsResult.ok) {
      for (const line of tsResult.errors) {
        console.error(line);
      }
      process.exit(1);
    }
    process.exit(0);
  }
  const startTime = Date.now();

  const errors: string[] = [];
  const infos: string[] = [];
  const modifiedRelSet = getGitModifiedRelFiles(ROOT_DIR);
  let totalLargeFileCount = 0;

  const forbiddenLockfiles = ['package-lock.json', 'yarn.lock', 'bun.lockb', 'bun.lock'].filter(
    (lf) => fs.existsSync(path.join(ROOT_DIR, lf))
  );
  if (forbiddenLockfiles.length > 0) {
    errors.push(
      `[LOCKFILE HYGIENE VIOLATION] Non-pnpm lockfile(s) detected: ${forbiddenLockfiles.join(', ')}.`
    );
  }
  if (!fs.existsSync(path.join(ROOT_DIR, 'pnpm-lock.yaml'))) {
    errors.push(
      '[LOCKFILE HYGIENE VIOLATION] Missing pnpm-lock.yaml in repository root. Maintain canonical pnpm lockfile hygiene.'
    );
  }

  const allFiles = walkUiCoreFiles();
  const importGraph = new Map<string, string[]>();
  const incomingRefCounts = new Map<string, number>();

  for (const file of allFiles) {
    incomingRefCounts.set(toPosixRel(file), 0);
  }

  for (const file of allFiles) {
    const rel = toPosixRel(file);
    if (/\.(js|mjs|cjs)$/.test(rel)) {
      errors.push(`[ZERO-JS VIOLATION] ${rel} must be written in TypeScript (.ts / .tsx).`);
    }

    const content = fs.readFileSync(file, 'utf8');
    const codeWithoutComments = stripComments(content);
    const lineCount = content.split(/\r?\n/).length;
    const byteSize = Buffer.byteLength(content, 'utf8');
    const kbFormatted = (byteSize / 1024).toFixed(1);

    const exceedsHardLine = lineCount > HARD_LINE_LIMIT;
    const exceedsHardByte = byteSize > HARD_BYTE_LIMIT;

    if (exceedsHardLine) {
      errors.push(
        `[VOLUME OVERFLOW] ${rel} has ${lineCount} lines (${kbFormatted} KB; exceeds hard ceiling of ${HARD_LINE_LIMIT} lines). Decompose by functional domain, pure logic, or UI Slot responsibility.`
      );
    }
    if (exceedsHardByte) {
      errors.push(
        `[BYTE VOLUME OVERFLOW] ${rel} is ${kbFormatted} KB (${byteSize} bytes, ${lineCount} lines; exceeds hard ceiling of ${(HARD_BYTE_LIMIT / 1024).toFixed(0)} KB). Decompose by functional domain, pure logic, or UI Slot responsibility.`
      );
    }

    if (!exceedsHardLine && !exceedsHardByte && (byteSize > SOFT_BYTE_LIMIT || lineCount > SOFT_LINE_LIMIT)) {
      totalLargeFileCount++;
      if (showAllInfos || modifiedRelSet.has(rel)) {
        infos.push(
          `[INFO: LARGE FILE NOTICE] ${rel} is ${kbFormatted} KB (${lineCount} lines; soft notice > ${(SOFT_BYTE_LIMIT / 1024).toFixed(0)} KB / ${SOFT_LINE_LIMIT}L, hard ceiling ${(HARD_BYTE_LIMIT / 1024).toFixed(0)} KB / ${HARD_LINE_LIMIT}L). Status: ACCEPTABLE (no action required to pass check; do NOT compress lines or shorten variable names). If considering splitting up when adding substantial new features later, split strictly by functional domain, pure logic, or independent UI Slot — never halve a file arbitrarily by line count or bridge it via a pass-through connector/helper.`
        );
      }
    }

    checkLanguageEmojiAndHygiene(rel, content, codeWithoutComments, errors);
    checkConfigPurity(rel, content, errors);
    checkValueReExports(rel, codeWithoutComments, errors);

    const fromLayer = getLayerInfo(rel);
    const deps: string[] = [];

    const staticRegex =
      /\b(?:import|export)\s+(?:(type)\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = staticRegex.exec(content)) !== null) {
      const isTypeOnly = Boolean(match[1]);
      const spec = match[2];
      if (!spec.startsWith('.')) continue;

      const resolved = resolveImportPath(file, spec);
      if (resolved === false) {
        errors.push(`[BROKEN IMPORT] ${rel} imports unresolvable path "${spec}".`);
      } else if (resolved) {
        const targetRel = toPosixRel(resolved);
        deps.push(targetRel);
        if (targetRel !== rel) {
          incomingRefCounts.set(targetRel, (incomingRefCounts.get(targetRel) || 0) + 1);
        }
        const toLayer = getLayerInfo(targetRel);
        if (!isTypeOnly && fromLayer.rank < toLayer.rank) {
          const isAllowedPanelRegistryBridge =
            rel.startsWith('panels/') && targetRel.startsWith('navigation/');
          if (!isAllowedPanelRegistryBridge) {
            errors.push(
              `[LAYER VIOLATION] ${rel} (${fromLayer.name}) imports upward from ${targetRel} (${toLayer.name}).`
            );
          }
        }
      }
    }

    const globRegex =
      /\b(?:import\.meta\.glob|importMetaGlob)\s*(?:<[\s\S]*?>)?\s*\(\s*['"]([^'"]+)['"]/g;
    let globMatch: RegExpExecArray | null;
    while ((globMatch = globRegex.exec(content)) !== null) {
      for (const expanded of expandRelativeGlobPattern(file, globMatch[1])) {
        const resolved = resolveImportPath(file, expanded);
        if (resolved) {
          const targetRel = toPosixRel(resolved);
          deps.push(targetRel);
          if (targetRel !== rel) {
            incomingRefCounts.set(targetRel, (incomingRefCounts.get(targetRel) || 0) + 1);
          }
        }
      }
    }

    importGraph.set(rel, deps);
  }

  for (const file of allFiles) {
    const rel = toPosixRel(file);
    if (HOST_MOUNTED_ENTRY_FILES.has(rel)) continue;
    const refCount = incomingRefCounts.get(rel) || 0;
    if (refCount === 0) {
      errors.push(
        `[ORPHAN MODULE] ${rel} has 0 incoming references across RCUIModule and is not a host-mounted root entry.`
      );
    }
  }

  checkFloatingWindowPresets(errors);
  detectCircularDependencies(importGraph, errors);

  const tsResult = skipTsc
    ? { ok: true, command: 'skipped (--no-tsc)', errors: [] }
    : runTypeScriptCheck();
  if (!tsResult.ok) {
    for (const tsLine of tsResult.errors.slice(0, 25)) {
      errors.push(`[TYPESCRIPT COMPILER ERROR] ${tsLine}`);
    }
  }

  const elapsedMs = Date.now() - startTime;
  console.log('======================================================================');
  console.log(` RCUIMODULE STANDALONE SEMANTIC & TYPESCRIPT RADAR (${elapsedMs}ms)`);
  console.log('======================================================================');
  console.log(` Scanned UI Files    : ${allFiles.length}`);
  console.log(
    ` TypeScript Strict   : ${
      tsResult.ok ? `PASS (${tsResult.command})` : `FAIL (${tsResult.errors.length} tsc lines)`
    }`
  );
  console.log(
    ` Volume Guardrails   : SoftInfo=${SOFT_LINE_LIMIT}L/${(SOFT_BYTE_LIMIT / 1024).toFixed(0)}KB | HardError=${HARD_LINE_LIMIT}L/${(HARD_BYTE_LIMIT / 1024).toFixed(0)}KB | MaxLine<=${MAX_LINE_CHAR_LIMIT}chars`
  );
  console.log(
    ` Hard Boundaries     : 0 Circular Deps | 0 Value Re-Exports | 0 Upward Imports | Any<=${FILE_ANY_LIMIT}`
  );
  console.log('----------------------------------------------------------------------');

  if (infos.length > 0) {
    console.log(` INFO (Non-blocking, Status: ACCEPTABLE — ${infos.length} modified file notice(s)):`);
    for (const info of infos) {
      console.log(`  [i] ${info}`);
    }
    console.log('----------------------------------------------------------------------');
  } else if (totalLargeFileCount > 0) {
    console.log(
      ` INFO (Non-blocking) : ${totalLargeFileCount} existing file(s) in ${(SOFT_BYTE_LIMIT / 1024).toFixed(0)}KB..${(HARD_BYTE_LIMIT / 1024).toFixed(0)}KB / ${SOFT_LINE_LIMIT}..${HARD_LINE_LIMIT}L range — Status: ACCEPTABLE (pass --all-info to list).`
    );
    console.log('----------------------------------------------------------------------');
  }

  if (errors.length > 0) {
    console.error(` ERRORS (${errors.length}):`);
    for (const e of errors) {
      console.error(`  [x] ${e}`);
    }
    console.log('======================================================================');
    process.exit(1);
  }

  console.log(' STATUS: GREEN -- 0 TypeScript errors, hard boundaries & volume caps verified.');
  console.log('======================================================================');
}

main();
