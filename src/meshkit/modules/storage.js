/**
 * Meshkit Storage Module
 *
 * Implements:
 *   mk.store(payload)    — encrypt → fragment → upload to IPFS
 *   mk.retrieve(cid)     — download from IPFS → reassemble → decrypt
 *
 * Phase 1: Uses AES-GCM-256 (in-device) + in-memory KeyStore.
 * Phase 2: Replace keystore calls with LitAdapter.
 */

import {generateKey, encryptBytes, decryptBytes} from '../core/crypto';
import {fragment, reassemble, stringToBytes, bytesToString} from '../core/fragment';

/**
 * Store a string or Uint8Array payload on IPFS, encrypted.
 *
 * @param {string | Uint8Array} payload   Data to store
 * @param {object} ctx                    Meshkit internal context
 * @param {import('../adapters/kubo').KuboAdapter} ctx.ipfs
 * @param {import('../core/keystore').default} ctx.keystore
 * @returns {Promise<{ cid: string, manifest: object }>}
 */
export async function store(payload, ctx) {
  const {ipfs, keystore} = ctx;

  // 1. Normalise to bytes
  const plainBytes =
    typeof payload === 'string' ? stringToBytes(payload) : payload;

  // 2. Generate a unique key per payload (one key per CID)
  const keyHex = generateKey();

  // 3. Encrypt
  const {cipherHex, ivHex} = encryptBytes(plainBytes, keyHex);
  const cipherBytes = _hexToBytes(cipherHex);

  // 4. Fragment
  const chunks = fragment(cipherBytes);

  // 5. Upload each chunk to IPFS, collect chunk CIDs
  const chunkCids = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkCid = await ipfs.uploadFile(
      `/meshkit/chunk-${i}`,
      chunks[i],
    );
    chunkCids.push(chunkCid);
  }

  // 6. Upload a manifest that records ivHex, total size, and ordered chunk CIDs
  const manifest = {
    version: 1,
    ivHex,
    totalSize: plainBytes.length,
    chunkCount: chunkCids.length,
    chunkCids,
  };
  const manifestBytes = stringToBytes(JSON.stringify(manifest));
  const manifestCid = await ipfs.uploadBytes(manifestBytes);

  // 7. Store key in keystore keyed by the manifest CID
  keystore.set(manifestCid, {keyHex, ivHex});

  return {cid: manifestCid, manifest};
}

/**
 * Retrieve and decrypt a previously stored payload.
 *
 * @param {string} cid                    Manifest CID returned by store()
 * @param {object} ctx
 * @param {import('../adapters/kubo').KuboAdapter} ctx.ipfs
 * @param {import('../core/keystore').default} ctx.keystore
 * @returns {Promise<Uint8Array>}
 */
export async function retrieve(cid, ctx) {
  const {ipfs, keystore} = ctx;

  // 1. Load key from store (throws if revoked)
  const {keyHex, ivHex} = keystore.get(cid);

  // 2. Download manifest
  const manifestBytes = await ipfs.downloadBytes(cid);
  const manifest = JSON.parse(bytesToString(manifestBytes));

  // 3. Download and reassemble all chunks
  const chunks = [];
  for (const chunkCid of manifest.chunkCids) {
    const chunk = await ipfs.downloadBytes(chunkCid);
    chunks.push(chunk);
  }
  const cipherBytes = reassemble(chunks);

  // 4. Decrypt
  const cipherHex = _bytesToHex(cipherBytes);
  const plainBytes = decryptBytes(cipherHex, ivHex, keyHex);

  return plainBytes;
}

// --- tiny hex helpers to avoid importing from crypto to keep this self-contained ---
function _bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function _hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return out;
}
