/**
 * Meshkit Storage Module — React Native safe
 *
 * RN-compatible upload strategy:
 *   kubo-rpc-client.add(string) works fine in React Native.
 *   kubo-rpc-client.add(Uint8Array/ArrayBuffer) throws "Blob from ArrayBuffer
 *   not supported" in React Native's limited Blob implementation.
 *
 * So we encode encrypted bytes as hex and store everything as a JSON string.
 * No raw binary ever touches kubo-rpc-client.
 *
 * Manifest stored on IPFS (plain JSON string):
 *   { version, ivHex, cipherHex, totalSize }
 */

import {generateKey, encryptBytes} from '../core/crypto';
import {stringToBytes, bytesToString} from '../core/fragment';

/**
 * Store a string or Uint8Array payload on IPFS, encrypted.
 * @param {string | Uint8Array} payload
 * @param {object} ctx
 * @returns {Promise<{ cid: string, manifest: object }>}
 */
export async function store(payload, ctx) {
  const {ipfs, keystore} = ctx;

  const plainBytes =
    typeof payload === 'string' ? stringToBytes(payload) : payload;

  const keyHex = generateKey();
  const {cipherHex, ivHex} = encryptBytes(plainBytes, keyHex);

  const manifest = {
    version: 1,
    ivHex,
    cipherHex,
    totalSize: plainBytes.length,
  };

  // Upload as JSON string — React Native safe, no Blob needed
  const manifestCid = await ipfs.uploadString(JSON.stringify(manifest));

  keystore.set(manifestCid, {keyHex, ivHex});

  return {cid: manifestCid, manifest: {...manifest, cipherHex: '[redacted]'}};
}

/**
 * Retrieve and decrypt a previously stored payload.
 * @param {string} cid
 * @param {object} ctx
 * @returns {Promise<Uint8Array>}
 */
export async function retrieve(cid, ctx) {
  const {ipfs, keystore} = ctx;

  const {keyHex} = keystore.get(cid);

  const manifestText = await ipfs.downloadString(cid);
  const manifest = JSON.parse(manifestText);

  const {decryptBytes} = await import('../core/crypto');
  const plainBytes = decryptBytes(manifest.cipherHex, manifest.ivHex, keyHex);

  return plainBytes;
}
