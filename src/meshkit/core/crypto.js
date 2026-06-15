/**
 * Meshkit Crypto Core — AES-GCM-256 encrypt/decrypt utilities.
 *
 * Uses @noble/ciphers (pure JS, React Native safe).
 * Every encrypted envelope is self-describing so we can reconstruct
 * it without any external state: [ iv(12) | ciphertext | tag(16) ]
 * stored as a base64 string alongside the raw key (hex).
 */

import {gcm} from '@noble/ciphers/aes';
import {randomBytes} from '@noble/ciphers/webcrypto';
import {bytesToHex, hexToBytes, utf8ToBytes, bytesToUtf8} from '@noble/ciphers/utils';

const IV_LENGTH = 12; // 96-bit IV for AES-GCM

/** Generate a fresh 256-bit AES key. Returns hex string. */
export function generateKey() {
  return bytesToHex(randomBytes(32));
}

/**
 * Encrypt arbitrary bytes with AES-GCM-256.
 * @param {Uint8Array} plainBytes
 * @param {string} keyHex  32-byte key as hex
 * @returns {{ cipherHex: string, ivHex: string }}
 */
export function encryptBytes(plainBytes, keyHex) {
  const key = hexToBytes(keyHex);
  const iv = randomBytes(IV_LENGTH);
  const cipher = gcm(key, iv);
  const sealed = cipher.encrypt(plainBytes);
  return {
    cipherHex: bytesToHex(sealed),
    ivHex: bytesToHex(iv),
  };
}

/**
 * Decrypt bytes with AES-GCM-256.
 * @param {string} cipherHex
 * @param {string} ivHex
 * @param {string} keyHex
 * @returns {Uint8Array}
 */
export function decryptBytes(cipherHex, ivHex, keyHex) {
  const key = hexToBytes(keyHex);
  const iv = hexToBytes(ivHex);
  const cipher = gcm(key, iv);
  return cipher.decrypt(hexToBytes(cipherHex));
}

/** Encrypt a UTF-8 string, return a serialisable envelope object. */
export function encryptString(plaintext, keyHex) {
  const bytes = utf8ToBytes(plaintext);
  return encryptBytes(bytes, keyHex);
}

/** Decrypt an envelope produced by encryptString / encryptBytes. */
export function decryptToString(cipherHex, ivHex, keyHex) {
  const bytes = decryptBytes(cipherHex, ivHex, keyHex);
  return bytesToUtf8(bytes);
}

export {bytesToHex, hexToBytes, utf8ToBytes, bytesToUtf8, randomBytes};
