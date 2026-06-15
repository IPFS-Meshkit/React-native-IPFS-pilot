/**
 * Meshkit Transfer Module
 *
 * Implements:
 *   mk.upload(file)              — encrypt a file and store on IPFS
 *   mk.share(cid, recipientId)   — grant a recipient access to a stored CID
 *   mk.download(cid, requesterId)— retrieve and decrypt if requester has access
 *
 * Phase 1: Access control is enforced by the in-memory KeyStore.
 *          share() records the recipientId in the keystore entry.
 *          Phase 2 will replace this with Lit ACL on-chain updates.
 */

import {generateKey, encryptBytes, decryptBytes} from '../core/crypto';
import {fragment, reassemble, stringToBytes, bytesToString} from '../core/fragment';

/**
 * Upload a file (named), encrypt it, store on IPFS.
 *
 * @param {{ name: string, content: string | Uint8Array }} file
 * @param {object} ctx
 * @returns {Promise<{ cid: string, manifest: object }>}
 */
export async function upload(file, ctx) {
  const {ipfs, keystore} = ctx;

  const plainBytes =
    typeof file.content === 'string'
      ? stringToBytes(file.content)
      : file.content;

  const keyHex = generateKey();
  const {cipherHex, ivHex} = encryptBytes(plainBytes, keyHex);
  const cipherBytes = _hexToBytes(cipherHex);

  const chunks = fragment(cipherBytes);
  const chunkCids = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkCid = await ipfs.uploadFile(`/meshkit/file/${file.name}/chunk-${i}`, chunks[i]);
    chunkCids.push(chunkCid);
  }

  const manifest = {
    version: 1,
    fileName: file.name,
    ivHex,
    totalSize: plainBytes.length,
    chunkCount: chunkCids.length,
    chunkCids,
  };
  const manifestCid = await ipfs.uploadBytes(stringToBytes(JSON.stringify(manifest)));

  keystore.set(manifestCid, {keyHex, ivHex, recipients: []});

  return {cid: manifestCid, manifest};
}

/**
 * Share a CID with a recipient.
 * Phase 1: records recipient in in-memory keystore.
 * Phase 2: calls LitAdapter.grantAccess(cid, recipientId).
 *
 * @param {string} cid
 * @param {string} recipientId  e.g. wallet address or user ID
 * @param {object} ctx
 * @returns {{ cid: string, recipientId: string, grantedAt: number }}
 */
export function share(cid, recipientId, ctx) {
  const {keystore} = ctx;
  keystore.addRecipient(cid, recipientId);
  return {cid, recipientId, grantedAt: Date.now()};
}

/**
 * Download a CID — only succeeds if requesterId has access.
 *
 * @param {string} cid
 * @param {string} requesterId
 * @param {object} ctx
 * @returns {Promise<Uint8Array>}
 */
export async function download(cid, requesterId, ctx) {
  const {ipfs, keystore} = ctx;

  if (!keystore.hasAccess(cid, requesterId)) {
    throw new Error(
      `[Meshkit] Access denied: ${requesterId} is not authorised to download CID ${cid}`,
    );
  }

  const {keyHex, ivHex} = keystore.get(cid);

  const manifestBytes = await ipfs.downloadBytes(cid);
  const manifest = JSON.parse(bytesToString(manifestBytes));

  const chunks = [];
  for (const chunkCid of manifest.chunkCids) {
    chunks.push(await ipfs.downloadBytes(chunkCid));
  }
  const cipherBytes = reassemble(chunks);

  return decryptBytes(_bytesToHex(cipherBytes), ivHex, keyHex);
}

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
