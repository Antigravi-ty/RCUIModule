export interface ZipArchiveEntry {
  name: string;
  data: Uint8Array | string;
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

function computeCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function encodeUtf8(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i) & 0xff;
  return out;
}

export function decodeUtf8(bytes: Uint8Array): string {
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
 */
export function buildZipArchiveBytes(entries: ZipArchiveEntry[]): Uint8Array {
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

async function inflateRawBytes(compressedBytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    writer.write(compressedBytes as BufferSource);
    writer.close();
    const resp = new Response(ds.readable);
    const buf = await resp.arrayBuffer();
    return new Uint8Array(buf);
  }
  throw new Error('DecompressionStream unavailable for deflate-compressed ZIP entry');
}

/**
 * Extracts text files from a PKZIP archive buffer (supports Store method 0 and Deflate method 8).
 */
export async function extractZipArchiveTextEntries(
  zipBuffer: ArrayBuffer | Uint8Array
): Promise<Record<string, string>> {
  const bytes = zipBuffer instanceof Uint8Array ? zipBuffer : new Uint8Array(zipBuffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files: Record<string, string> = {};

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
