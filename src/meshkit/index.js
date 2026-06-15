/**
 * ╔══════════════════════════════════════════════════════╗
 * ║               M E S H K I T   v0.1.0                ║
 * ║  Privacy-preserving IPFS abstraction library         ║
 * ║  Phase 1 — AES-GCM-256 + Kubo RPC (no Lit yet)      ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Usage:
 *   const mk = new Meshkit();
 *   await mk.init({ nodes: ['http://localhost:5001'] });
 *
 *   // Store encrypted data
 *   const { cid } = await mk.store('hello world');
 *
 *   // Retrieve and decrypt
 *   const data = await mk.retrieve(cid);
 *
 *   // Upload a named file
 *   const { cid: fileCid } = await mk.upload({ name: 'doc.txt', content: 'tax ledger...' });
 *
 *   // Share with a recipient
 *   mk.share(fileCid, 'alice@example.com');
 *
 *   // Download (only succeeds if requesterId has access)
 *   const file = await mk.download(fileCid, 'alice@example.com');
 *
 *   // Send an E2EE message
 *   await mk.send('bob', 'alice', 'secret message');
 *
 *   // Receive messages
 *   const unsubHandler = await mk.receive('alice', 'bob', ({ from, message }) => {
 *     console.log(from, message);
 *   });
 *
 *   // Revoke access
 *   mk.revoke(cid);
 */

import {KuboAdapter} from './adapters/kubo';
import KeyStore from './core/keystore';
import {store, retrieve} from './modules/storage';
import {upload, share, download} from './modules/transfer';
import {send, receive, stopReceiving} from './modules/messaging';
import {revoke, isRevoked} from './modules/revocation';

export class Meshkit {
  constructor() {
    this._ready = false;
    this._ipfs = null;
    this._keystore = new KeyStore();
    this._config = {};
  }

  /**
   * Initialise the Meshkit instance.
   *
   * @param {object} config
   * @param {string[]} config.nodes          IPFS RPC node URLs (at least one)
   * @param {string}   [config.encryption]   Cipher standard label (default: 'aes-gcm-256')
   * @param {object}   [config.keyService]   Reserved for Phase 2 (Lit config)
   */
  async init(config = {}) {
    if (!config.nodes || config.nodes.length === 0) {
      throw new Error('[Meshkit] init() requires at least one node URL in config.nodes');
    }

    this._config = {
      encryption: 'aes-gcm-256',
      ...config,
    };

    this._ipfs = new KuboAdapter(config.nodes);
    this._ipfs.connect();

    this._ready = true;
    console.log('[Meshkit] Initialised', {
      nodes: config.nodes,
      encryption: this._config.encryption,
      phase: 1,
    });

    return this;
  }

  _ctx() {
    this._assertReady();
    return {ipfs: this._ipfs, keystore: this._keystore, config: this._config};
  }

  _assertReady() {
    if (!this._ready) {
      throw new Error('[Meshkit] Not initialised. Call await mk.init(...) first.');
    }
  }

  // ─── Storage ──────────────────────────────────────────────────────────────

  /**
   * Encrypt and store a payload on IPFS.
   * @param {string | Uint8Array} payload
   * @returns {Promise<{ cid: string, manifest: object }>}
   */
  async store(payload) {
    return store(payload, this._ctx());
  }

  /**
   * Retrieve and decrypt a stored payload.
   * @param {string} cid  Manifest CID returned by store()
   * @returns {Promise<Uint8Array>}
   */
  async retrieve(cid) {
    return retrieve(cid, this._ctx());
  }

  // ─── File Transfer ────────────────────────────────────────────────────────

  /**
   * Upload and encrypt a named file.
   * @param {{ name: string, content: string | Uint8Array }} file
   * @returns {Promise<{ cid: string, manifest: object }>}
   */
  async upload(file) {
    return upload(file, this._ctx());
  }

  /**
   * Grant a recipient access to a stored CID.
   * @param {string} cid
   * @param {string} recipientId
   * @returns {{ cid: string, recipientId: string, grantedAt: number }}
   */
  share(cid, recipientId) {
    return share(cid, recipientId, this._ctx());
  }

  /**
   * Download and decrypt a file (only if requesterId has access).
   * @param {string} cid
   * @param {string} requesterId
   * @returns {Promise<Uint8Array>}
   */
  async download(cid, requesterId) {
    return download(cid, requesterId, this._ctx());
  }

  // ─── Messaging ────────────────────────────────────────────────────────────

  /**
   * Send an E2EE message to a recipient via IPFS PubSub.
   * @param {string} senderId
   * @param {string} recipientId
   * @param {string} message
   */
  async send(senderId, recipientId, message) {
    return send(senderId, recipientId, message, this._ctx());
  }

  /**
   * Subscribe to incoming E2EE messages from a peer.
   * @param {string} selfId
   * @param {string} peerId
   * @param {function} handler  Called with { from, message, timestamp }
   * @returns {Promise<function>}  Unsubscribe handler — pass to stopReceiving()
   */
  async receive(selfId, peerId, handler) {
    return receive(selfId, peerId, handler, this._ctx());
  }

  /**
   * Unsubscribe from a messaging topic.
   * @param {string} selfId
   * @param {string} peerId
   * @param {function} handler  The handler returned by receive()
   */
  async stopReceiving(selfId, peerId, handler) {
    return stopReceiving(selfId, peerId, handler, this._ctx());
  }

  // ─── Revocation ───────────────────────────────────────────────────────────

  /**
   * Revoke access to a CID by destroying its decryption key.
   * After this, retrieve() and download() will throw for this CID.
   * @param {string} cid
   * @returns {{ cid: string, revokedAt: number }}
   */
  revoke(cid) {
    return revoke(cid, this._ctx());
  }

  /**
   * Check if a CID has been revoked.
   * @param {string} cid
   * @returns {boolean}
   */
  isRevoked(cid) {
    return isRevoked(cid, this._ctx());
  }

  // ─── Diagnostics ──────────────────────────────────────────────────────────

  /** Returns the IPFS node identity. */
  async id() {
    return this._ipfs.id();
  }

  /** Returns a snapshot of all tracked CIDs and their access state. */
  listKeys() {
    return this._keystore.listAll();
  }
}

// Default singleton export for convenience
export default Meshkit;
