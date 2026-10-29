/**
 * PacingTelemetryExporter.js
 * Manages retention, unified .zip archive downloads (metadata.json + telemetry.csv),
 * trace imports (.zip / .json / .csv), and 1-second temporary QuickNotifications
 * (post-match podium, disconnect/eviction, and 20-minute capacity overflow)
 * for the Network Input Buffer & Clock Pacing Telemetry system.
 */

import { globalPacingTelemetryRecorder } from './pacingTelemetryRecorder';

export const NETWORK_TELEMETRY_NOTIFICATION_ID = 'network-pacing-telemetry-export';

let _retainedTelemetryPayload = null;
let _importedTelemetryPayload = null;
const _traceListeners = new Set();
let _telemetryNotificationHandler = null;

export function setPacingTelemetryNotificationHandler(handler) {
  _telemetryNotificationHandler = typeof handler === 'function' ? handler : null;
}

// Precomputed IEEE 802.3 CRC-32 lookup table for ZIP archive headers
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function computeCrc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function encodeUtf8(str) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
  return out;
}

function decodeUtf8(bytes) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(bytes);
  }
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

/**
 * Builds a standard PKZIP archive (Uint8Array) containing the given named entries.
 * Uses Store method (0) for zero-dependency synchronous packaging in browser and Node.
 * @param {Array<{name: string, data: Uint8Array | string}>} entries
 * @returns {Uint8Array}
 */
export function buildZipArchiveBytes(entries) {
  const prepared = entries.map((e) => {
    const nameBytes = encodeUtf8(e.name);
    const dataBytes = typeof e.data === 'string' ? encodeUtf8(e.data) : e.data;
    const crc = computeCrc32(dataBytes);
    return { nameBytes, dataBytes, crc };
  });

  let localTotal = 0;
  let centralTotal = 0;
  for (const item of prepared) {
    localTotal += 30 + item.nameBytes.length + item.dataBytes.length;
    centralTotal += 46 + item.nameBytes.length;
  }

  const out = new Uint8Array(localTotal + centralTotal + 22);
  const view = new DataView(out.buffer);
  let localOffset = 0;
  let centralOffset = localTotal;

  for (const item of prepared) {
    const { nameBytes, dataBytes, crc } = item;
    const len = dataBytes.length;
    const itemLocalStart = localOffset;

    // Local file header (0x04034b50)
    view.setUint32(localOffset, 0x04034b50, true);
    view.setUint16(localOffset + 4, 20, true); // version needed (2.0)
    view.setUint16(localOffset + 6, 0x0800, true); // UTF-8 flag
    view.setUint16(localOffset + 8, 0, true); // compression method: 0 (Store)
    view.setUint16(localOffset + 10, 0, true); // mod time
    view.setUint16(localOffset + 12, 0, true); // mod date
    view.setUint32(localOffset + 14, crc, true);
    view.setUint32(localOffset + 18, len, true);
    view.setUint32(localOffset + 22, len, true);
    view.setUint16(localOffset + 26, nameBytes.length, true);
    view.setUint16(localOffset + 28, 0, true); // extra len
    out.set(nameBytes, localOffset + 30);
    out.set(dataBytes, localOffset + 30 + nameBytes.length);
    localOffset += 30 + nameBytes.length + len;

    // Central directory file header (0x02014b50)
    view.setUint32(centralOffset, 0x02014b50, true);
    view.setUint16(centralOffset + 4, 20, true); // version made by
    view.setUint16(centralOffset + 6, 20, true); // version needed
    view.setUint16(centralOffset + 8, 0x0800, true); // UTF-8 flag
    view.setUint16(centralOffset + 10, 0, true); // compression method: 0 (Store)
    view.setUint16(centralOffset + 12, 0, true);
    view.setUint16(centralOffset + 14, 0, true);
    view.setUint32(centralOffset + 16, crc, true);
    view.setUint32(centralOffset + 20, len, true);
    view.setUint32(centralOffset + 24, len, true);
    view.setUint16(centralOffset + 28, nameBytes.length, true);
    view.setUint16(centralOffset + 30, 0, true); // extra len
    view.setUint16(centralOffset + 32, 0, true); // comment len
    view.setUint16(centralOffset + 34, 0, true); // disk number
    view.setUint16(centralOffset + 36, 0, true); // internal attrs
    view.setUint32(centralOffset + 38, 0, true); // external attrs
    view.setUint32(centralOffset + 42, itemLocalStart, true);
    out.set(nameBytes, centralOffset + 46);
    centralOffset += 46 + nameBytes.length;
  }

  // End of central directory record (0x06054b50)
  view.setUint32(centralOffset, 0x06054b50, true);
  view.setUint16(centralOffset + 4, 0, true);
  view.setUint16(centralOffset + 6, 0, true);
  view.setUint16(centralOffset + 8, prepared.length, true);
  view.setUint16(centralOffset + 10, prepared.length, true);
  view.setUint32(centralOffset + 12, centralTotal, true);
  view.setUint32(centralOffset + 16, localTotal, true);
  view.setUint16(centralOffset + 20, 0, true);

  return out;
}

async function inflateRawBytes(compressedBytes) {
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    writer.write(compressedBytes);
    writer.close();
    const resp = new Response(ds.readable);
    const buf = await resp.arrayBuffer();
    return new Uint8Array(buf);
  }
  throw new Error('DecompressionStream unavailable for deflate-compressed ZIP entry');
}

/**
 * Extracts text files from a PKZIP archive buffer (supports Store method 0 and Deflate method 8).
 * @param {ArrayBuffer | Uint8Array} zipBuffer
 * @returns {Promise<Record<string, string>>}
 */
export async function extractZipArchiveTextEntries(zipBuffer) {
  const bytes = zipBuffer instanceof Uint8Array ? zipBuffer : new Uint8Array(zipBuffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files = {};

  // Locate End of Central Directory (0x06054b50)
  let eocdOffset = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset >= 0) {
    const totalEntries = view.getUint16(eocdOffset + 10, true);
    let cdOffset = view.getUint32(eocdOffset + 16, true);
    for (let e = 0; e < totalEntries && cdOffset + 46 <= bytes.length; e++) {
      if (view.getUint32(cdOffset, true) !== 0x02014b50) break;
      const method = view.getUint16(cdOffset + 10, true);
      const compSize = view.getUint32(cdOffset + 20, true);
      const nameLen = view.getUint16(cdOffset + 28, true);
      const extraLen = view.getUint16(cdOffset + 30, true);
      const commentLen = view.getUint16(cdOffset + 32, true);
      const localHeaderOffset = view.getUint32(cdOffset + 42, true);
      const name = decodeUtf8(bytes.subarray(cdOffset + 46, cdOffset + 46 + nameLen));

      const localNameLen = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const rawSlice = bytes.subarray(dataStart, dataStart + compSize);

      if (method === 0) {
        files[name] = decodeUtf8(rawSlice);
      } else if (method === 8) {
        const inflated = await inflateRawBytes(rawSlice);
        files[name] = decodeUtf8(inflated);
      }
      cdOffset += 46 + nameLen + extraLen + commentLen;
    }
  }
  return files;
}

export function parseCsvTelemetryColumns(csvText) {
  const lines = String(csvText || '')
    .trim()
    .split(/\r?\n/);
  if (lines.length < 2) return null;
  const headers = lines[0].split(',').map((h) => h.trim());
  const idxMap = {};
  headers.forEach((h, idx) => {
    idxMap[h] = idx;
  });

  const columns = {
    timeMs: [],
    clientTick: [],
    serverTick: [],
    rawRttMs: [],
    smoothRttMs: [],
    jitterMs: [],
    serverBuffer: [],
    effectiveBuffer: [],
    targetBuffer: [],
    physicsRateHz: [],
    leadTicks: [],
    posErrorUu: [],
    localPosErrorUu: [],
    ballPosErrorUu: [],
    remotePosErrorUu: [],
    probePosErrorUu: [],
    reconcileTier: [],
    tierState: [],
    eventFlags: [],
  };

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 8) continue;
    const posErr = Number(parts[idxMap.posErrorUu ?? 12]) || 0;
    columns.timeMs.push(Number(parts[idxMap.timeMs ?? 1]) || 0);
    columns.clientTick.push(Number(parts[idxMap.clientTick ?? 2]) || 0);
    columns.serverTick.push(Number(parts[idxMap.serverTick ?? 3]) || 0);
    columns.rawRttMs.push(Number(parts[idxMap.rawRttMs ?? 4]) || 0);
    columns.smoothRttMs.push(Number(parts[idxMap.smoothRttMs ?? 5]) || 0);
    columns.jitterMs.push(Number(parts[idxMap.jitterMs ?? 6]) || 0);
    columns.serverBuffer.push(Number(parts[idxMap.serverBuffer ?? 7]) || 0);
    columns.effectiveBuffer.push(Number(parts[idxMap.effectiveBuffer ?? 8]) || 0);
    columns.targetBuffer.push(Number(parts[idxMap.targetBuffer ?? 9]) || 3);
    columns.physicsRateHz.push(Number(parts[idxMap.physicsRateHz ?? 10]) || 120);
    columns.leadTicks.push(Number(parts[idxMap.leadTicks ?? 11]) || 3);
    columns.posErrorUu.push(posErr);
    columns.tierState.push(Number(parts[idxMap.tierState ?? 13]) || 0);
    columns.eventFlags.push(Number(parts[idxMap.eventFlags ?? 14]) || 0);
    columns.localPosErrorUu.push(idxMap.localPosErrorUu !== undefined ? (Number(parts[idxMap.localPosErrorUu]) || 0) : posErr);
    columns.ballPosErrorUu.push(idxMap.ballPosErrorUu !== undefined ? (Number(parts[idxMap.ballPosErrorUu]) || 0) : 0);
    columns.remotePosErrorUu.push(idxMap.remotePosErrorUu !== undefined ? (Number(parts[idxMap.remotePosErrorUu]) || 0) : 0);
    columns.probePosErrorUu.push(idxMap.probePosErrorUu !== undefined ? (Number(parts[idxMap.probePosErrorUu]) || 0) : 0);
    columns.reconcileTier.push(idxMap.reconcileTier !== undefined ? (Number(parts[idxMap.reconcileTier]) || 1) : 1);
  }

  return columns.timeMs.length > 0 ? columns : null;
}

/**
 * Parses an imported telemetry file (.zip, .json, or .csv) into a normalized telemetry payload.
 * @param {File} file
 * @returns {Promise<object>}
 */
export async function parseImportedTelemetryFile(file) {
  const name = (file?.name || '').toLowerCase();
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);

  // Detect PKZIP magic signature (0x50 0x4b 0x03 0x04) or .zip extension
  const isZip =
    name.endsWith('.zip') ||
    (bytes.length >= 4 &&
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      bytes[2] === 0x03 &&
      bytes[3] === 0x04);

  if (isZip) {
    const entries = await extractZipArchiveTextEntries(bytes);
    const entryNames = Object.keys(entries);
    const metaKey = entryNames.find((k) => k.endsWith('metadata.json') || k.endsWith('.json'));
    const csvKey = entryNames.find((k) => k.endsWith('.csv'));

    let metaObj = {};
    if (metaKey && entries[metaKey]) {
      metaObj = JSON.parse(entries[metaKey]);
    }
    if (metaObj.columns && Array.isArray(metaObj.columns.timeMs)) {
      return metaObj;
    }
    if (csvKey && entries[csvKey]) {
      const columns = parseCsvTelemetryColumns(entries[csvKey]);
      if (!columns) {
        throw new Error('ZIP archive CSV entry contains no valid telemetry rows.');
      }
      return {
        schemaVersion: metaObj.schemaVersion || 'rc-network-telemetry-v2',
        exportedAt: metaObj.exportedAt || new Date().toISOString(),
        metadata: metaObj.metadata || {
          clockPacingMode: 'csts',
          clockPacingPriority: 'balanced',
          recordedTicks: columns.timeMs.length,
        },
        summary: metaObj.summary || {
          recordedTicks: columns.timeMs.length,
          durationSeconds: Math.round(((columns.timeMs[columns.timeMs.length - 1] - columns.timeMs[0]) / 100) ) / 10,
        },
        columns,
      };
    }
    throw new Error('ZIP archive does not contain telemetry.csv or telemetry JSON.');
  }

  const text = decodeUtf8(bytes);
  if (name.endsWith('.csv') || text.trimStart().startsWith('index,timeMs,')) {
    const columns = parseCsvTelemetryColumns(text);
    if (!columns) {
      throw new Error('Invalid telemetry CSV file.');
    }
    return {
      schemaVersion: 'rc-network-telemetry-csv',
      exportedAt: new Date().toISOString(),
      metadata: {
        clockPacingMode: 'csts',
        clockPacingPriority: 'balanced',
        recordedTicks: columns.timeMs.length,
      },
      summary: {
        recordedTicks: columns.timeMs.length,
        durationSeconds: Math.round(((columns.timeMs[columns.timeMs.length - 1] - columns.timeMs[0]) / 100)) / 10,
      },
      columns,
    };
  }

  const parsed = JSON.parse(text);
  const cols = parsed?.columns || parsed?.trace;
  if (!cols || !Array.isArray(cols.timeMs || cols.elapsedMs)) {
    throw new Error('Invalid trace JSON: missing columns.timeMs array');
  }
  return parsed.columns
    ? parsed
    : {
        ...parsed,
        columns: {
          timeMs: cols.elapsedMs,
          clientTick: cols.clientTick,
          serverTick: cols.serverTick,
          rawRttMs: cols.rttMs,
          smoothRttMs: cols.rttMs,
          jitterMs: cols.jitterMs,
          serverBuffer: cols.rawServerBuffer,
          effectiveBuffer: cols.compensatedBuffer,
          targetBuffer: cols.dynamicTarget,
          physicsRateHz: cols.effectiveHz,
          tierState: cols.tierState,
          eventFlags: cols.eventFlags,
        },
      };
}

function notifyTraceListeners() {
  for (const cb of _traceListeners) {
    try {
      cb();
    } catch (err) {
      console.warn('[PacingTelemetryExporter] Error in trace listener:', err);
    }
  }
}

export function subscribeTelemetryTraceUpdates(listener) {
  _traceListeners.add(listener);
  return () => _traceListeners.delete(listener);
}

export function getRetainedTelemetryPayload() {
  return _retainedTelemetryPayload;
}

export function getImportedTelemetryPayload() {
  return _importedTelemetryPayload;
}

export function setImportedTelemetryPayload(payload) {
  _importedTelemetryPayload = payload;
  notifyTraceListeners();
}

export function clearImportedTelemetryPayload() {
  _importedTelemetryPayload = null;
  notifyTraceListeners();
}

export function snapshotCurrentTelemetryPayload(recorder = globalPacingTelemetryRecorder) {
  if (!recorder || recorder.count <= 0) {
    return _retainedTelemetryPayload;
  }
  _retainedTelemetryPayload = recorder.toSerializableObject();
  notifyTraceListeners();
  return _retainedTelemetryPayload;
}

function triggerBrowserFileDownload(contentOrBytes, filename, mimeType) {
  if (typeof document === 'undefined' || typeof Blob === 'undefined') return false;
  const blob = new Blob([contentOrBytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}

function buildCsvFromColumns(c) {
  const n = c?.timeMs?.length || 0;
  if (n <= 0) return '';
  const lines = [
    'index,timeMs,clientTick,serverTick,rawRttMs,smoothRttMs,jitterMs,serverBuffer,effectiveBuffer,targetBuffer,physicsRateHz,leadTicks,posErrorUu,tierState,eventFlags,localPosErrorUu,ballPosErrorUu,remotePosErrorUu,probePosErrorUu,reconcileTier',
  ];
  for (let i = 0; i < n; i++) {
    lines.push(
      `${i},${c.timeMs[i]},${c.clientTick[i]},${c.serverTick[i]},${c.rawRttMs[i]},${c.smoothRttMs[i]},` +
        `${c.jitterMs[i]},${c.serverBuffer[i]},${c.effectiveBuffer[i]},${c.targetBuffer[i]},` +
        `${c.physicsRateHz[i]},${c.leadTicks?.[i] ?? 3},${c.posErrorUu?.[i] ?? 0},${c.tierState[i]},${c.eventFlags[i]},` +
        `${c.localPosErrorUu?.[i] ?? 0},${c.ballPosErrorUu?.[i] ?? 0},${c.remotePosErrorUu?.[i] ?? 0},` +
        `${c.probePosErrorUu?.[i] ?? 0},${c.reconcileTier?.[i] ?? 1}`
    );
  }
  return lines.join('\n');
}

/**
 * Packages metadata.json + telemetry.csv into a single unified .zip archive and triggers browser download.
 */
export function downloadNetworkTelemetryZip(payloadOrRecorder = null, reasonTag = 'session') {
  let metadataObj = null;
  let csvText = '';

  if (
    payloadOrRecorder &&
    typeof payloadOrRecorder.toCsvString === 'function' &&
    payloadOrRecorder.count > 0
  ) {
    metadataObj =
      typeof payloadOrRecorder.toMetadataObject === 'function'
        ? payloadOrRecorder.toMetadataObject()
        : {
            schemaVersion: 'rc-network-telemetry-v2',
            exportedAt: new Date().toISOString(),
            metadata: {
              clockPacingMode: payloadOrRecorder.activeMode,
              clockPacingPriority: payloadOrRecorder.activePriority,
              clockPacingParams: payloadOrRecorder.activeParams,
              recordedTicks: payloadOrRecorder.count,
            },
            summary: payloadOrRecorder.getSummaryStats(),
          };
    csvText = payloadOrRecorder.toCsvString();
  } else {
    const payload =
      payloadOrRecorder && payloadOrRecorder.columns
        ? payloadOrRecorder
        : globalPacingTelemetryRecorder.count > 0
        ? globalPacingTelemetryRecorder.toSerializableObject()
        : _retainedTelemetryPayload;

    if (!payload || !payload.columns || !payload.columns.timeMs?.length) {
      console.warn('[PacingTelemetryExporter] No recorded network telemetry data available to export.');
      return false;
    }

    metadataObj = {
      schemaVersion: 'rc-network-telemetry-v2',
      exportedAt: payload.exportedAt || new Date().toISOString(),
      metadata: payload.metadata,
      summary: payload.summary,
    };
    csvText = buildCsvFromColumns(payload.columns);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const mode = metadataObj?.metadata?.clockPacingMode || 'csts';
  const filename = `rc-net-telemetry-${mode}-${reasonTag}-${stamp}.zip`;
  const zipBytes = buildZipArchiveBytes([
    { name: 'metadata.json', data: JSON.stringify(metadataObj, null, 2) },
    { name: 'telemetry.csv', data: csvText },
  ]);

  return triggerBrowserFileDownload(zipBytes, filename, 'application/zip');
}

export function downloadNetworkTelemetryJson(payloadOrRecorder = null, reasonTag = 'session') {
  return downloadNetworkTelemetryZip(payloadOrRecorder, reasonTag);
}

export function downloadNetworkTelemetryCsv(recorder = globalPacingTelemetryRecorder, reasonTag = 'session') {
  return downloadNetworkTelemetryZip(recorder, reasonTag);
}

/**
 * Retains the current recorded network telemetry trace and triggers a 1-second (1000ms)
 * temporary QuickNotification with a single unified .zip download action.
 *
 * @param {'match-complete' | 'disconnected' | 'overflow'} [reason='match-complete']
 * @param {import('./PacingTelemetryRecorder.js').PacingTelemetryRecorder} [recorder]
 */
export function notifyNetworkTelemetryExportAvailable(
  reason = 'match-complete',
  recorder = globalPacingTelemetryRecorder
) {
  const retained = snapshotCurrentTelemetryPayload(recorder);
  if (!retained || !retained.summary || retained.summary.recordedTicks <= 0) {
    return null;
  }

  const durSec = retained.summary.durationSeconds ?? 0;
  const starveCnt = retained.summary.starvationCount ?? 0;
  const recMode = (retained.summary.recommendedMode || 'sts').toUpperCase();

  let labelPrefix = 'Match Network Log Ready';
  let tone = 'info';
  if (reason === 'disconnected') {
    labelPrefix = 'Connection Lost - Network Diagnostic Log Saved';
    tone = 'warning';
  } else if (reason === 'overflow') {
    labelPrefix = '20m Telemetry Buffer Full - Log Frozen for Export';
    tone = 'warning';
  }

  try {
    _telemetryNotificationHandler?.({
      id: `${NETWORK_TELEMETRY_NOTIFICATION_ID}-${reason}-${Date.now()}`,
      type: 'temporary',
      tone,
      icon: 'download',
      duration: 1000,
      content: `${labelPrefix} (${durSec}s, ${starveCnt} starvations, Rec: ${recMode}) - Download telemetry package?`,
      buttons: [
        {
          key: 'export-net-zip',
          label: 'Download .zip',
          icon: 'download',
          color: 'sky',
          dismissOnClick: false,
          onClick: () => {
            downloadNetworkTelemetryZip(retained, reason);
          },
        },
      ],
    });
  } catch (err) {
    console.warn('[PacingTelemetryExporter] Failed to push temporary telemetry notification:', err);
  }

  return retained;
}

// Wire automatic 20-minute capacity overflow notification
globalPacingTelemetryRecorder.onCapacityOverflow = (rec) => {
  notifyNetworkTelemetryExportAvailable('overflow', rec);
};

