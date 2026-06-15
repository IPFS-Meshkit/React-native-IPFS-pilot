/**
 * Meshkit Transfer Module — React Native safe
 *
 * Same RN-safe strategy as storage.js:
 * Everything is stored as JSON strings on IPFS — no raw binary uploads.
 */

import {generateKey, encryptBytes, decryptBytes} from '../core/crypto';
import {stringToBytes, bytesToString} from '../core/fragment';

/**
 * Upload and encrypt a named file.
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

  const manifest = {
    version: 1,
    fileName: file.name,
    ivHex,
    cipherHex,
    totalSize: plainBytes.length,
  };

  const manifestCid = await ipfs.uploadString(JSON.stringify(manifest));
  keystore.set(manifestCid, {keyHex, ivHex, recipients: []});

  return {cid: manifestCid, manifest: {...manifest, cipherHex: '[redacted]'}};
}

/**
 * Grant a recipient access to a stored CID.
 * @param {string} cid
 * @param {string} recipientId
 * @param {object} ctx
 */
export function share(cid, recipientId, ctx) {
  const {keystore} = ctx;
  keystore.addRecipient(cid, recipientId);
  return {cid, recipientId, grantedAt: Date.now()};
}

/**
 * Download and decrypt — only if requesterId has access.
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

  const {keyHex} = keystore.get(cid);
  const manifestText = await ipfs.downloadString(cid);
  const manifest = JSON.parse(manifestText);

  return decryptBytes(manifest.cipherHex, manifest.ivHex, keyHex);
}
