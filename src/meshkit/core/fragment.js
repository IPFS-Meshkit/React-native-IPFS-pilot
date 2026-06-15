/**
 * Meshkit Fragment Core
 *
 * Splits a Uint8Array payload into fixed-size chunks so large files can be
 * uploaded as multiple smaller IPFS objects and reassembled on retrieval.
 *
 * Default chunk size: 256 KB — a safe default well below IPFS block limits.
 */

const DEFAULT_CHUNK_SIZE = 256 * 1024; // 256 KB

/**
 * Fragment a Uint8Array into an ordered array of Uint8Array chunks.
 * @param {Uint8Array} data
 * @param {number} chunkSize
 * @returns {Uint8Array[]}
 */
export function fragment(data, chunkSize = DEFAULT_CHUNK_SIZE) {
  const chunks = [];
  let offset = 0;
  while (offset < data.length) {
    chunks.push(data.slice(offset, offset + chunkSize));
    offset += chunkSize;
  }
  return chunks.length > 0 ? chunks : [new Uint8Array(0)];
}

/**
 * Reassemble an ordered array of Uint8Array chunks back into a single buffer.
 * @param {Uint8Array[]} chunks
 * @returns {Uint8Array}
 */
export function reassemble(chunks) {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/**
 * Convert a plain string to Uint8Array.
 * Works in React Native (TextEncoder polyfill assumed via shims).
 */
export function stringToBytes(str) {
  return new TextEncoder().encode(str);
}

export function bytesToString(bytes) {
  return new TextDecoder().decode(bytes);
}
