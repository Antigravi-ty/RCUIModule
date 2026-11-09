import fs from 'node:fs';
import path from 'node:path';
import {
  ARBITRARY_SPLIT_FILENAME_RE,
  FILE_ANY_LIMIT,
  kebabToPascalCase,
  MAX_LINE_CHAR_LIMIT,
  ROOT_DIR,
  stripComments,
  toPosixRel,
} from './uiRadarConstantsAndFs.ts';

export function checkLanguageEmojiAndHygiene(
  rel: string,
  content: string,
  codeWithoutComments: string,
  errors: string[]
): void {
  const cjkRegex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;
  const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
  const allowedTechnicalSymbols = /[±×÷→←↑↓↔↗↘↙↖⇒⇐⇔µαβγδθλμπσωΔΩ°✓✗✔✘⚠⚡]/g;

  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (cjkRegex.test(line)) {
      errors.push(
        `[NON-ENGLISH / EMOJI VIOLATION] ${rel}:${i + 1} contains CJK characters: "${line.trim().slice(0, 80)}"`
      );
      break;
    }
    const sanitized = line.replace(allowedTechnicalSymbols, '');
    if (emojiRegex.test(sanitized)) {
      errors.push(
        `[NON-ENGLISH / EMOJI VIOLATION] ${rel}:${i + 1} contains forbidden emoji: "${line.trim().slice(0, 80)}"`
      );
      break;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > MAX_LINE_CHAR_LIMIT) {
      errors.push(
        `[LINE LENGTH OVERFLOW] ${rel}:${i + 1} has ${line.length} characters (limit <= ${MAX_LINE_CHAR_LIMIT}). Do not inline Base64/data blobs or compress multiple statements onto a single line.`
      );
      break;
    }
  }

  const soccarMatch = content.match(/\b\w*socc[ae]r\w*\b/i);
  if (soccarMatch) {
    errors.push(
      `[TERMINOLOGY VIOLATION] ${rel} contains forbidden term "${soccarMatch[0]}". Use neutral "ball" / "carball" / "arena" terminology.`
    );
  }

  if (
    /broker\.emqx\.io|RocketCompanion_PrivateProfile|rc_7e2a4d|wss:\/\/[a-z0-9.-]*ngrok/i.test(
      content
    )
  ) {
    errors.push(
      `[HARDCODED ENDPOINT / SECRET VIOLATION] ${rel} contains hardcoded broker, private profile, or tunnel literal.`
    );
  }

  const baseName = path.basename(rel, path.extname(rel));
  if (ARBITRARY_SPLIT_FILENAME_RE.test(baseName)) {
    errors.push(
      `[ARBITRARY SPLIT FILENAME] ${rel} ("${baseName}") uses an arbitrary numbered split suffix. Decompose by functional domain or UI Slot responsibility instead of line-count halving.`
    );
  }

  const anyMatches =
    codeWithoutComments.match(/(?::\s*any\b|\bas\s+any\b|<any>|Record<[^,>]+,\s*any>)/g) || [];
  const boundaryAnyRegex =
    /\bexport\s+(?:async\s+)?function\s+\w+[^{]*:\s*any\b|\bexport\s+interface\s+\w+\s*\{[^}]*:\s*any\b/s;
  if (anyMatches.length > FILE_ANY_LIMIT || boundaryAnyRegex.test(codeWithoutComments)) {
    errors.push(
      `[UNTYPED ANY VIOLATION] ${rel} exceeds 'any' threshold (${anyMatches.length}/${FILE_ANY_LIMIT}) or exposes 'any' on an exported module boundary.`
    );
  }
}

export function checkConfigPurity(rel: string, content: string, errors: string[]): void {
  if (!rel.startsWith('config/')) return;
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\/\/.*$/, '').trim();
    if (!line || line.startsWith('*') || line.startsWith('/*')) continue;

    if (/\bexport\s+let\b/.test(line)) {
      errors.push(`[L1 CONFIG PURITY] ${rel}:${i + 1} uses forbidden mutable 'export let' in config/.`);
    }
    if (rel !== 'config/storageHelpers.ts' && /\blocalStorage\b/.test(line)) {
      errors.push(
        `[L1 CONFIG PURITY] ${rel}:${i + 1} accesses 'localStorage' directly in config/; sink persistence to stores/.`
      );
    }
    if (
      /(?:listeners|subscribers|appliers)\s*=\s*new\s+Set\b/i.test(line) ||
      /new\s+Set\s*<\s*[^>]*(?:Listener|Subscriber|Callback|Applier)/i.test(line) ||
      /new\s+Set\s*<\s*\([^)]*\)\s*=>/.test(line)
    ) {
      errors.push(
        `[L1 CONFIG PURITY] ${rel}:${i + 1} defines reactive subscriber Set() in config/; sink subscriptions to stores/.`
      );
    }
  }
}

export function checkValueReExports(
  rel: string,
  codeWithoutComments: string,
  errors: string[]
): void {
  if (rel === 'index.ts') return;

  const reExportRegex = /\bexport\s+(type\s+)?(\*|\{[^}]*\})\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = reExportRegex.exec(codeWithoutComments)) !== null) {
    if (match[1]) continue;
    const clause = match[2];
    const fromSpec = match[3];
    if (clause === '*') {
      errors.push(
        `[RE-EXPORT FACADE VIOLATION] ${rel} re-exports wildcard values from "${fromSpec}".`
      );
      continue;
    }
    const valueSpecs = clause
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim())
      .filter((s) => Boolean(s) && !/^type\s+/.test(s));
    if (valueSpecs.length > 0) {
      errors.push(
        `[RE-EXPORT FACADE VIOLATION] ${rel} re-exports values { ${valueSpecs.slice(0, 4).join(', ')} } from "${fromSpec}".`
      );
    }
  }

  const importedValueLocals = new Map<string, string>();
  const importStmtRegex = /\bimport\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  let impMatch: RegExpExecArray | null;
  while ((impMatch = importStmtRegex.exec(codeWithoutComments)) !== null) {
    if (impMatch[1]) continue;
    const clause = impMatch[2].trim();
    const fromSpec = impMatch[3];
    const namedMatch = clause.match(/\{([^}]*)\}/);
    if (namedMatch) {
      for (const rawSpec of namedMatch[1].split(',')) {
        const spec = rawSpec.trim();
        if (!spec || /^type\s+/.test(spec)) continue;
        const asParts = spec.split(/\s+as\s+/);
        const localName = (asParts[1] || asParts[0]).trim();
        if (localName) importedValueLocals.set(localName, fromSpec);
      }
    }
    const defaultPart = clause.replace(/\{[^}]*\}/, '').replace(/,/g, '').trim();
    if (defaultPart && !defaultPart.startsWith('*') && /^[A-Za-z_$][\w$]*$/.test(defaultPart)) {
      importedValueLocals.set(defaultPart, fromSpec);
    }
  }

  if (importedValueLocals.size > 0) {
    const localExportRegex = /\bexport\s+(type\s+)?\{([^}]*)\}(?!\s*from\b)/g;
    let expMatch: RegExpExecArray | null;
    while ((expMatch = localExportRegex.exec(codeWithoutComments)) !== null) {
      if (expMatch[1]) continue;
      const reExportedLocals: string[] = [];
      for (const rawSpec of expMatch[2].split(',')) {
        const spec = rawSpec.trim();
        if (!spec || /^type\s+/.test(spec)) continue;
        const localName = spec.split(/\s+as\s+/)[0].trim();
        if (importedValueLocals.has(localName)) {
          reExportedLocals.push(`${localName} (from "${importedValueLocals.get(localName)}")`);
        }
      }
      if (reExportedLocals.length > 0) {
        errors.push(
          `[RE-EXPORT FACADE VIOLATION] ${rel} indirectly re-exports imported values { ${reExportedLocals.slice(0, 4).join(', ')} }.`
        );
      }
    }
  }
}

export function checkFloatingWindowPresets(errors: string[]): void {
  const presetFiles = [
    path.join(ROOT_DIR, 'stores/floatingPresets.ts'),
    path.join(ROOT_DIR, 'stores/devFloatingPresets.ts'),
  ];
  const presetBlockRegex = /export\s+const\s+\w+_PRESET\s*:\s*PresetConfig\s*=\s*\{([\s\S]*?)\n\};/g;
  for (const presetFile of presetFiles) {
    if (!fs.existsSync(presetFile)) continue;
    const rel = toPosixRel(presetFile);
    const content = stripComments(fs.readFileSync(presetFile, 'utf8'));
    let blockMatch: RegExpExecArray | null;
    while ((blockMatch = presetBlockRegex.exec(content)) !== null) {
      const body = blockMatch[1];
      const idMatch = body.match(/\bid\s*:\s*['"]([^'"]+)['"]/);
      const compMatch = body.match(/\bcomponent\s*:\s*['"]([^'"]+)['"]/);
      const sourceMatch = body.match(/\bsourcePath\s*:\s*['"]([^'"]+)['"]/);
      if (!idMatch) continue;

      const id = idMatch[1];
      const component = compMatch?.[1] || '';
      const sourcePath = sourceMatch?.[1] || '';
      const expectedComponent = `${kebabToPascalCase(id)}FloatingWindow`;

      if (component !== expectedComponent) {
        errors.push(
          `[UI NAMING VIOLATION] ${rel} preset '${id}' maps to '${component}', expected '${expectedComponent}'.`
        );
      }
      if (!sourcePath.endsWith(`/${expectedComponent}.tsx`)) {
        errors.push(
          `[UI NAMING VIOLATION] ${rel} preset '${id}' has sourcePath '${sourcePath}', expected ending '/${expectedComponent}.tsx'.`
        );
      }
      const relSource = sourcePath.replace(/^src\/ui-core\//, '');
      const absSource = path.join(ROOT_DIR, relSource);
      if (!fs.existsSync(absSource)) {
        errors.push(
          `[UI NAMING VIOLATION] ${rel} preset '${id}' points to missing file '${relSource}'.`
        );
      } else {
        const winContent = stripComments(fs.readFileSync(absSource, 'utf8'));
        const metaBlockMatch = winContent.match(
          /\bexport\s+const\s+SURFACE_META\b[\s\S]*?\bid\s*:\s*['"]([^'"]+)['"]/
        );
        if (!metaBlockMatch || metaBlockMatch[1] !== id) {
          errors.push(
            `[UI NAMING VIOLATION] ${relSource} must export SURFACE_META with id '${id}'.`
          );
        }
      }
    }
  }
}
