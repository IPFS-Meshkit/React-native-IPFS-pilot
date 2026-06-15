/**
 * Meshkit Messaging Module
 *
 * Implements:
 *   mk.send(recipientId, message)   — E2EE encrypt and publish via PubSub
 *   mk.receive(topic, handler)      — subscribe and auto-decrypt incoming msgs
 *   mk.stopReceiving(topic, handler)— unsubscribe
 *
 * E2EE model (Phase 1 — shared-secret simulation):
 *   Both parties derive a shared AES key from a deterministic hash of
 *   sorted(senderId + recipientId). This is NOT proper public-key E2EE —
 *   it's a stand-in until Phase 2 integrates ECDH key exchange.
 *
 *   Phase 2: Replace _deriveSharedKey with an ECDH exchange using
 *   @noble/curves secp256k1 or the recipient's registered public key.
 *
 * Wire format (JSON, published as UTF-8 bytes over PubSub):
 *   {
 *     meshkitVersion: 1,
 *     senderId: string,
 *     recipientId: string,
 *     ivHex: string,
 *     cipherHex: string,
 *     timestamp: number
 *   }
 */

import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex, encryptBytes, decryptBytes} from '../core/crypto';
import {stringToBytes, bytesToString} from '../core/fragment';

/**
 * Derive a deterministic AES key from two participant IDs.
 * Phase 1 only — Phase 2 replaces with real ECDH.
 */
function _deriveSharedKey(idA, idB) {
  const sorted = [idA, idB].sort().join(':');
  return bytesToHex(sha256(stringToBytes(sorted)));
}

/**
 * Send an encrypted message to a recipient over IPFS PubSub.
 *
 * @param {string} senderId
 * @param {string} recipientId
 * @param {string} message       Plaintext message
 * @param {object} ctx
 * @param {import('../adapters/kubo').KuboAdapter} ctx.ipfs
 */
export async function send(senderId, recipientId, message, ctx) {
  const {ipfs} = ctx;

  const sharedKey = _deriveSharedKey(senderId, recipientId);
  const {cipherHex, ivHex} = encryptBytes(stringToBytes(message), sharedKey);

  const envelope = {
    meshkitVersion: 1,
    senderId,
    recipientId,
    ivHex,
    cipherHex,
    timestamp: Date.now(),
  };

  const topic = _topic(senderId, recipientId);
  // Publish as string bytes — React Native safe
  const envelopeBytes = new TextEncoder().encode(JSON.stringify(envelope));
  await ipfs.publish(topic, envelopeBytes);

  return {topic, envelope};
}

/**
 * Subscribe to incoming messages for a given recipientId.
 * The handler receives the decrypted plaintext string.
 *
 * @param {string} selfId          Your own ID (to derive the shared key)
 * @param {string} peerId          Peer you are listening to messages from
 * @param {function} handler       Called with ({ from, message, timestamp })
 * @param {object} ctx
 * @returns {function}  Unsubscribe function
 */
export async function receive(selfId, peerId, handler, ctx) {
  const {ipfs} = ctx;
  const sharedKey = _deriveSharedKey(selfId, peerId);
  const topic = _topic(selfId, peerId);

  const innerHandler = rawMsg => {
    try {
      const envelope = JSON.parse(bytesToString(rawMsg.data));

      // Only process messages addressed to selfId
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
      console.warn('[Meshkit] Failed to decrypt incoming message:', err);
    }
  };

  await ipfs.subscribe(topic, innerHandler, {
    onError: err => console.warn('[Meshkit] PubSub error:', err),
  });

  // Return the inner handler so the caller can unsubscribe
  return innerHandler;
}

/**
 * Unsubscribe from a messaging topic.
 * Pass the handler returned by receive().
 */
export async function stopReceiving(selfId, peerId, handler, ctx) {
  const {ipfs} = ctx;
  const topic = _topic(selfId, peerId);
  await ipfs.unsubscribe(topic, handler);
}

/** Canonical topic for a pair of IDs — sorted so A→B and B→A use same topic. */
function _topic(idA, idB) {
  return `meshkit:msg:${[idA, idB].sort().join(':')}`;
}
