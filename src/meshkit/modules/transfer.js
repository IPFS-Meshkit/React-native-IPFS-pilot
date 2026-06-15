/**
 * Meshkit Transfer — React Native safe
 */

import {generateKey, encryptBytes, decryptBytes} from '../core/crypto';
import {stringToBytes} from '../core/fragment';

export async function upload(file, ctx) {
  const {ipfs, keystore} = ctx;

  const plainBytes =
    typeof file.content === 'string'
      ? stringToBytes(file.content)
      : file.content;

  const keyHex = generateKey();
  const {cipherHex, ivHex} = encryptBytes(plainBytes, keyHex);

  const manifest = {
    version: 2,
    fileName: file.name,
    ivHex,
    cipherHex,
    totalSize: plainBytes.length,
  };

  const manifestCid = await ipfs.uploadString(JSON.stringify(manifest));
  keystore.set(manifestCid, {keyHex, ivHex, recipients: []});

  return {cid: manifestCid, manifest: {...manifest, cipherHex: '[redacted]'}};
}

export function share(cid, recipientId, ctx) {
  const {keystore} = ctx;
  keystore.addRecipient(cid, recipientId);
  return {cid, recipientId, grantedAt: Date.now()};
}

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

  if (!manifest.cipherHex || !manifest.ivHex) {
    throw new Error('[Meshkit] Invalid manifest — missing cipherHex or ivHex');
  }

  return decryptBytes(manifest.cipherHex, manifest.ivHex, keyHex);
}
