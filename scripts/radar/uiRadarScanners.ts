import fs from 'node:fs';
import path from 'node:path';
import {
  ARBITRARY_SPLIT_FILENAME_RE,
  FILE_ANY_LIMIT,
  GUT_SHARING_PROP_ACCESS_THRESHOLD,
  kebabToPascalCase,
  L1_STATE_SCHEMA_INTERFACES,
  RECIPE_PROPS_ERROR_THRESHOLD,
  RECIPE_PROPS_WARN_THRESHOLD,
  ROOT_DIR,
  stripComments,
  toPosixRel,
  WAIST_ERROR_THRESHOLD,
  WAIST_WARN_THRESHOLD,
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

  const lines = content.split('\n');
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
      `[ARBITRARY SPLIT FILENAME] ${rel} ("${baseName}") suggests arbitrary line-count halving instead of a semantic UI Slot boundary.`
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

function countInterfaceFields(body: string): number {
  const lines = body
    .split(/\r?\n/)
    .map((l) => l.replace(/\/\/.*$/, '').trim())
    .filter((l) => l && !l.startsWith('*') && !l.startsWith('/*') && !l.startsWith('*/'));

  let braceDepth = 0;
  let parenDepth = 0;
  let propCount = 0;
  for (const line of lines) {
    if (braceDepth === 0 && parenDepth === 0 && /^([a-zA-Z0-9_$]+)\??\s*:/.test(line)) {
      propCount += 1;
    }
    for (const ch of line) {
      if (ch === '{') braceDepth += 1;
      else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);
      else if (ch === '(') parenDepth += 1;
      else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
    }
  }
  return propCount;
}

export function checkWideWaistAndGutSharing(
  rel: string,
  content: string,
  errors: string[],
  warnings: string[]
): void {
  const isAtomicOrHudOrPanelContract =
    rel.startsWith('primitives/') ||
    rel.startsWith('compounds/') ||
    rel.startsWith('hud/') ||
    rel.startsWith('navigation/') ||
    /^panels\/(user|dev)\/\w+FloatingWindow\.tsx$/.test(rel);

  const interfaceRegex =
    /(?:export\s+)?interface\s+(\w*(?:Props|Params|Refs|Slice|Options))\s*(?:extends\s+[^{]+)?\{([\s\S]*?)\n\}/g;
  let match: RegExpExecArray | null;
  while ((match = interfaceRegex.exec(content)) !== null) {
    const interfaceName = match[1];
    const body = match[2];
    if (L1_STATE_SCHEMA_INTERFACES.has(interfaceName)) continue;

    const propCount = countInterfaceFields(body);
    if (/^Layer[1-5]\w+RecipeProps$/.test(interfaceName)) {
      if (propCount >= RECIPE_PROPS_ERROR_THRESHOLD) {
        errors.push(
          `[WIDE WAIST] ${rel} -> ${interfaceName} has ${propCount} fields (limit < ${RECIPE_PROPS_ERROR_THRESHOLD}).`
        );
      } else if (propCount >= RECIPE_PROPS_WARN_THRESHOLD) {
        warnings.push(
          `[WIDE WAIST WARN] ${rel} -> ${interfaceName} has ${propCount} fields (warn >= ${RECIPE_PROPS_WARN_THRESHOLD}).`
        );
      }
      continue;
    }

    if (isAtomicOrHudOrPanelContract && interfaceName.endsWith('Props')) continue;

    if (propCount >= WAIST_ERROR_THRESHOLD) {
      errors.push(
        `[WIDE WAIST] ${rel} -> ${interfaceName} has ${propCount} fields (limit < ${WAIST_ERROR_THRESHOLD}).`
      );
    } else if (propCount >= WAIST_WARN_THRESHOLD) {
      warnings.push(
        `[WIDE WAIST WARN] ${rel} -> ${interfaceName} has ${propCount} fields (warn >= ${WAIST_WARN_THRESHOLD}).`
      );
    }
  }

  if (!rel.startsWith('stores/slices/')) {
    const setGetRegex =
      /(?:export\s+)?(?:function\s+([a-zA-Z0-9_$]+)|const\s+([a-zA-Z0-9_$]+)\s*=)\s*(?:<[^>]*>)?\s*\(\s*set\s*(?::[^,)]+)?,\s*get\b/g;
    let sgMatch: RegExpExecArray | null;
    while ((sgMatch = setGetRegex.exec(content)) !== null) {
      const fnName = sgMatch[1] || sgMatch[2] || 'anonymous';
      errors.push(
        `[GUT-SHARING SPLIT] ${rel} -> ${fnName} passes Zustand (set, get) closure to external helper.`
      );
    }
  }

  if (rel === 'config/pacingControllerEvaluator.ts') return;

  const fnRegex =
    /(?:export\s+)?function\s+([a-zA-Z0-9_$]+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)\s*(?::\s*[^{]+)?\{/g;
  while ((match = fnRegex.exec(content)) !== null) {
    const fnName = match[1];
    if (/^[A-Z]/.test(fnName)) continue;
    const paramNames = match[2]
      .split(',')
      .map((p) => p.trim().match(/^([a-zA-Z0-9_$]+)\s*(?:\?|:|=|$)/)?.[1])
      .filter((p): p is string => Boolean(p));
    if (paramNames.length === 0) continue;

    const bodyStartIdx = match.index + match[0].length - 1;
    let depth = 0;
    let bodyEndIdx = content.length;
    for (let i = bodyStartIdx; i < content.length; i++) {
      if (content[i] === '{') depth += 1;
      else if (content[i] === '}') {
        depth -= 1;
        if (depth === 0) {
          bodyEndIdx = i;
          break;
        }
      }
    }
    const body = content.slice(bodyStartIdx, bodyEndIdx);

    for (const paramName of paramNames) {
      if (
        ['e', 'event', 'ctx', 'canvas', 'doc', 'win', 'window', 'document', 'math', 'console'].includes(
          paramName
        )
      ) {
        continue;
      }
      const propRegex = new RegExp(`\\b${paramName}\\.([a-zA-Z0-9_$]+)`, 'g');
      const accessedProps = new Set<string>();
      let pMatch: RegExpExecArray | null;
      while ((pMatch = propRegex.exec(body)) !== null) {
        accessedProps.add(pMatch[1]);
      }
      if (accessedProps.size < GUT_SHARING_PROP_ACCESS_THRESHOLD) continue;

      const mutRegex = new RegExp(
        `\\b${paramName}\\.([a-zA-Z0-9_$]+)(?:\\.[a-zA-Z0-9_$]+)*\\s*(?:(?<![=!<>])=(?!=)|\\+=|-=|\\*=)`,
        'g'
      );
      const mutatedProps = new Set<string>();
      while ((pMatch = mutRegex.exec(body)) !== null) {
        mutatedProps.add(pMatch[1]);
      }
      const isHostOrRefsParam =
        /^(ctrl|controller|host|instance|owner|self|refs|domRefs)$/i.test(paramName);
      if (isHostOrRefsParam || mutatedProps.size >= 2) {
        errors.push(
          `[GUT-SHARING SPLIT] ${rel} -> ${fnName} accesses ${accessedProps.size} props and mutates ${mutatedProps.size} props on '${paramName}'.`
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
