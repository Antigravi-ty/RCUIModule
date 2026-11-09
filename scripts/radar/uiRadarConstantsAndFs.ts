import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export const ROOT_DIR: string = process.cwd();

export const UI_CORE_DIRS: readonly string[] = [
  'charts',
  'compounds',
  'config',
  'hud',
  'layout',
  'manifest',
  'navigation',
  'panels',
  'primitives',
  'recipes',
  'stores',
  'tokens',
  'viewport',
];

export const SOFT_LINE_LIMIT = 400;
export const HARD_LINE_LIMIT = 800;
export const SOFT_BYTE_LIMIT = 12 * 1024;
export const HARD_BYTE_LIMIT = 18 * 1024;
export const MAX_LINE_CHAR_LIMIT = 400;
export const FILE_ANY_LIMIT = 5;

export const HOST_MOUNTED_ENTRY_FILES: ReadonlySet<string> = new Set([
  'compounds/Dialogue.tsx',
  'config/nameTagPillRenderer.ts',
  'hud/InGameHUD.tsx',
  'hud/StaticTrainingPackHUD.tsx',
  'navigation/EdgeInspectorDrawer.tsx',
  'navigation/FloatingStackIcon.tsx',
  'navigation/FloatingWindowManager.tsx',
  'navigation/MorphingShell.tsx',
  'navigation/QuickNotificationSystem.tsx',
  'panels/floatingWindowRegistry.tsx',
  'viewport/SafeAreaHud.tsx',
]);

export interface LayerRule {
  prefix: string;
  rank: number;
  name: string;
}

export const LAYER_RULES: readonly LayerRule[] = [
  { prefix: 'tokens/', rank: 1, name: 'L1:Tokens' },
  { prefix: 'config/', rank: 1, name: 'L1:Config' },
  { prefix: 'stores/', rank: 1, name: 'L1:Stores' },
  { prefix: 'utils/', rank: 1, name: 'L1:Utils' },
  { prefix: 'manifest/surfaceRegistry.ts', rank: 6, name: 'L6:SurfaceRegistry' },
  { prefix: 'manifest/floatingSurfaceRegistry.ts', rank: 6, name: 'L6:SurfaceRegistry' },
  { prefix: 'manifest/', rank: 1, name: 'L1:Manifest' },
  { prefix: 'primitives/', rank: 2, name: 'L2:Primitives' },
  { prefix: 'layout/', rank: 2, name: 'L2:Layout' },
  { prefix: 'compounds/', rank: 3, name: 'L3:Compounds' },
  { prefix: 'charts/', rank: 3, name: 'L3:Charts' },
  { prefix: 'viewport/', rank: 4, name: 'L4:Viewport' },
  { prefix: 'hud/', rank: 5, name: 'L5:HUD' },
  { prefix: 'recipes/', rank: 6, name: 'L6:Recipes' },
  { prefix: 'panels/', rank: 6, name: 'L6:Panels' },
  { prefix: 'navigation/', rank: 7, name: 'L7:Navigation' },
];

export const ARBITRARY_SPLIT_FILENAME_RE =
  /(Part[1-9]|Half[1-9]|Chunk[1-9]|Split[1-9]|Section[1-9]$|Tab[1-9]$|Helper[1-9])/i;

export interface TypeScriptCheckResult {
  ok: boolean;
  command: string;
  errors: string[];
}

export function getLayerInfo(relPath: string): LayerRule {
  for (const rule of LAYER_RULES) {
    if (relPath.startsWith(rule.prefix) || relPath === rule.prefix) {
      return rule;
    }
  }
  return { prefix: '', rank: 7, name: 'L7:Root' };
}

export function walkUiCoreFiles(): string[] {
  const results: string[] = [];
  function walk(dir: string): void {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(js|mjs|cjs|ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        results.push(fullPath);
      }
    }
  }
  for (const subDir of UI_CORE_DIRS) {
    walk(path.join(ROOT_DIR, subDir));
  }
  return results;
}

export function toPosixRel(absPath: string): string {
  return path.relative(ROOT_DIR, absPath).split(path.sep).join('/');
}

export function stripComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

export function kebabToPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function getGitModifiedRelFiles(repoDir: string = ROOT_DIR): Set<string> {
  const modified = new Set<string>();
  try {
    const out = execSync('git status --porcelain', {
      cwd: repoDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    for (const line of out.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const rawPath = line.slice(3).trim();
      const targetPath = rawPath.includes(' -> ') ? rawPath.split(' -> ').pop()!.trim() : rawPath;
      modified.add(targetPath.replace(/^"+|"+$/g, ''));
    }
  } catch {
    // Ignore when git status is unavailable
  }
  return modified;
}

export function resolveImportPath(fromFile: string, importSpec: string): string | false | null {
  if (!importSpec.startsWith('.')) return null;
  const baseTarget = path.resolve(path.dirname(fromFile), importSpec);
  const candidates = [
    baseTarget,
    `${baseTarget}.ts`,
    `${baseTarget}.tsx`,
    `${baseTarget}.js`,
    path.join(baseTarget, 'index.ts'),
    path.join(baseTarget, 'index.tsx'),
  ];
  for (const cand of candidates) {
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
      return cand;
    }
  }
  return false;
}

export function expandRelativeGlobPattern(fromFileAbs: string, pattern: string): string[] {
  if (!pattern.startsWith('.')) return [];
  const fromDir = path.dirname(fromFileAbs);
  const braceMatch = pattern.match(/^(.*)\{([^}]+)\}(.*)$/);
  const subPatterns = braceMatch
    ? braceMatch[2].split(',').map((opt) => `${braceMatch[1]}${opt.trim()}${braceMatch[3]}`)
    : [pattern];

  const results: string[] = [];
  for (const sub of subPatterns) {
    const targetDir = path.resolve(fromDir, path.posix.dirname(sub));
    const filePattern = path.posix.basename(sub);
    if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) continue;
    const regexStr =
      '^' +
      filePattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*') +
      '$';
    const fileRe = new RegExp(regexStr);
    for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
      if (entry.isFile() && fileRe.test(entry.name)) {
        const absMatch = path.join(targetDir, entry.name);
        let relSpec = path.relative(fromDir, absMatch).split(path.sep).join('/');
        if (!relSpec.startsWith('.')) relSpec = `./${relSpec}`;
        results.push(relSpec);
      }
    }
  }
  return results;
}

function resolveTscCommand(): string | null {
  const binName = process.platform === 'win32' ? 'tsc.cmd' : 'tsc';
  const candidateBins = [
    path.join(ROOT_DIR, 'node_modules', '.bin', binName),
    path.resolve(ROOT_DIR, '..', 'node_modules', '.bin', binName),
    path.resolve(ROOT_DIR, '..', '..', 'node_modules', '.bin', binName),
  ];
  for (const cand of candidateBins) {
    if (fs.existsSync(cand)) {
      return `"${cand}" --noEmit`;
    }
  }
  try {
    const versionOut = execSync('tsc --version', {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      encoding: 'utf8',
    }).trim();
    if (/Version\s+5\./.test(versionOut)) {
      return 'tsc --noEmit';
    }
  } catch {
    // Fall through
  }
  return null;
}

export function runTypeScriptCheck(): TypeScriptCheckResult {
  const cmd = resolveTscCommand();
  if (!cmd) {
    return {
      ok: false,
      command: 'tsc --noEmit (missing local node_modules/.bin/tsc)',
      errors: [
        'Local TypeScript 5.x compiler not found in node_modules/.bin/tsc. Run "npm install -g pnpm --force && pnpm install" first.',
      ],
    };
  }
  try {
    execSync(cmd, {
      cwd: ROOT_DIR,
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return { ok: true, command: cmd, errors: [] };
  } catch (err: unknown) {
    const execErr = err as { stdout?: Buffer | string; stderr?: Buffer | string };
    const stdout = execErr.stdout ? String(execErr.stdout) : '';
    const stderr = execErr.stderr ? String(execErr.stderr) : '';
    const combined = `${stdout}\n${stderr}`.trim();
    const lines = combined
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    return { ok: false, command: cmd, errors: lines };
  }
}
