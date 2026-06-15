/**
 * Meshkit Storage — React Native safe
 * Encrypts payload, stores manifest as JSON string on IPFS (no binary uploads).
 */

import {generateKey, encryptBytes, decryptBytes} from '../core/crypto';
import {stringToBytes} from '../core/fragment';

export async function store(payload, ctx) {
  const {ipfs, keystore} = ctx;

  const plainBytes =
    typeof payload === 'string' ? stringToBytes(payload) : payload;

  const keyHex = generateKey();
  const {cipherHex, ivHex} = encryptBytes(plainBytes, keyHex);

  const manifest = {
    version: 2,
    ivHex,
    cipherHex,
    totalSize: plainBytes.length,
  };

  const manifestCid = await ipfs.uploadString(JSON.stringify(manifest));
  keystore.set(manifestCid, {keyHex, ivHex});

  return {cid: manifestCid, manifest: {...manifest, cipherHex: '[redacted]'}};
}

export async function retrieve(cid, ctx) {
  const {ipfs, keystore} = ctx;

  const {keyHex} = keystore.get(cid);

  const manifestText = await ipfs.downloadString(cid);
  const manifest = JSON.parse(manifestText);

  if (!manifest.cipherHex || !manifest.ivHex) {
    throw new Error('[Meshkit] Invalid manifest — missing cipherHex or ivHex');
  }

  return decryptBytes(manifest.cipherHex, manifest.ivHex, keyHex);
}
