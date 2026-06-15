/**
 * Meshkit KeyStore — Phase 1 (in-memory)
 *
 * Maps CID → { keyHex, ivHex, ownerPubKey?, recipientPubKeys[] }
 *
 * Phase 1: Keys live only in process memory.
 * Phase 2: This will be replaced by the Lit Protocol adapter which stores
 *           key material on a decentralised threshold network.
 */

class KeyStore {
  constructor() {
    /** @type {Map<string, object>} */
    this._store = new Map();
  }

  /**
   * Persist key material for a CID.
   * @param {string} cid
   * @param {{ keyHex: string, ivHex: string, recipients?: string[] }} entry
   */
  set(cid, entry) {
    this._store.set(cid, {...entry, revokedAt: null});
  }

  /**
   * Retrieve key material.
   * Throws if the key has been revoked or never existed.
   * @param {string} cid
   */
  get(cid) {
    const entry = this._store.get(cid);
    if (!entry) {
      throw new Error(`[KeyStore] No key found for CID: ${cid}`);
    }
    if (entry.revokedAt !== null) {
      throw new Error(`[KeyStore] Access to CID ${cid} has been revoked.`);
    }
    return entry;
  }

  /**
   * Revoke access to a CID by destroying its key material.
   * After this call, get(cid) will throw.
   * @param {string} cid
   */
  revoke(cid) {
    const entry = this._store.get(cid);
    if (!entry) {
      throw new Error(`[KeyStore] Cannot revoke unknown CID: ${cid}`);
    }
    // Overwrite key bytes with zeros before deletion (best-effort zeroise)
    this._store.set(cid, {
      keyHex: '0'.repeat(64),
      ivHex: '0'.repeat(24),
      recipients: [],
      revokedAt: Date.now(),
    });
  }

  /**
   * Add a recipient to an existing key entry (used by share()).
   * @param {string} cid
   * @param {string} recipientId
   */
  addRecipient(cid, recipientId) {
    const entry = this.get(cid);
    if (!entry.recipients) {
      entry.recipients = [];
    }
    if (!entry.recipients.includes(recipientId)) {
      entry.recipients.push(recipientId);
    }
    this._store.set(cid, entry);
  }

  /** Check whether a recipient has access to a CID. */
  hasAccess(cid, recipientId) {
    try {
      const entry = this.get(cid);
      return (
        !entry.recipients ||
        entry.recipients.length === 0 ||
        entry.recipients.includes(recipientId)
      );
    } catch {
      return false;
    }
  }

  isRevoked(cid) {
    const entry = this._store.get(cid);
    return entry ? entry.revokedAt !== null : false;
  }

  listAll() {
    return Array.from(this._store.entries()).map(([cid, entry]) => ({
      cid,
      revoked: entry.revokedAt !== null,
      recipients: entry.recipients || [],
    }));
  }
}

// Singleton — one keystore per Meshkit instance
export default KeyStore;
