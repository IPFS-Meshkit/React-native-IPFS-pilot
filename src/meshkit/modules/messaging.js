/**
 * Meshkit Messaging — React Native safe
 */

import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex, encryptBytes, decryptBytes} from '../core/crypto';
import {stringToBytes, bytesToString} from '../core/fragment';

function _deriveSharedKey(idA, idB) {
  const sorted = [idA, idB].sort().join(':');
  return bytesToHex(sha256(stringToBytes(sorted)));
}

function _normalizePubsubData(data) {
  if (data == null) {
    return new Uint8Array(0);
  }
  if (data instanceof Uint8Array) {
    return data;
  }
  if (typeof data === 'string') {
    return stringToBytes(data);
  }
  if (Array.isArray(data)) {
    return Uint8Array.from(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  return stringToBytes(String(data));
}

export async function send(senderId, recipientId, message, ctx) {
  const {ipfs} = ctx;

  const sharedKey = _deriveSharedKey(senderId, recipientId);
  const {cipherHex, ivHex} = encryptBytes(stringToBytes(message), sharedKey);

  const envelope = JSON.stringify({
    meshkitVersion: 1,
    senderId,
    recipientId,
    ivHex,
    cipherHex,
    timestamp: Date.now(),
  });

  const topic = _topic(senderId, recipientId);
  await ipfs.publish(topic, envelope);

  return {topic};
}

export async function receive(selfId, peerId, handler, ctx) {
  const {ipfs} = ctx;
  const sharedKey = _deriveSharedKey(selfId, peerId);
  const topic = _topic(selfId, peerId);

  const innerHandler = rawMsg => {
    try {
      const data = _normalizePubsubData(rawMsg?.data ?? rawMsg);
      const envelope = JSON.parse(bytesToString(data));

      if (envelope.recipientId !== selfId) {
        return;
      }

      const plainBytes = decryptBytes(
        envelope.cipherHex,
        envelope.ivHex,
        sharedKey,
      );
      handler({
        from: envelope.senderId,
        message: bytesToString(plainBytes),
        timestamp: envelope.timestamp,
      });
    } catch (err) {
      console.warn('[Meshkit] Failed to decrypt message:', err.message);
    }
  };

  await ipfs.subscribe(topic, innerHandler, {
    onError: err => console.warn('[Meshkit] PubSub error:', err.message),
  });

  return innerHandler;
}

export async function stopReceiving(selfId, peerId, handler, ctx) {
  const {ipfs} = ctx;
  const topic = _topic(selfId, peerId);
  await ipfs.unsubscribe(topic, handler);
}

function _topic(idA, idB) {
  return `meshkit:msg:${[idA, idB].sort().join(':')}`;
}
