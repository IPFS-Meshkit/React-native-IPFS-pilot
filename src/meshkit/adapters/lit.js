/**
 * Meshkit Lit Protocol Adapter — Phase 2 Scaffold
 *
 * This file defines the interface that the Lit adapter must satisfy so the
 * rest of Meshkit can call it without caring about the underlying KMS.
 *
 * Phase 1: All methods throw a "not implemented" error and fall back to
 *          the in-memory KeyStore (see core/keystore.js).
 * Phase 2: Install @lit-protocol/lit-node-client and implement below.
 *
 * TODO (Phase 2):
 *   npm install @lit-protocol/lit-node-client @lit-protocol/constants
 *
 * The core idea:
 *   - On store/upload  → encrypt with Lit; store cipher + metadata on IPFS.
 *   - On share         → update Lit ACL to include recipientId.
 *   - On revoke        → update Lit ACL to deny everyone.
 *   - On retrieve/download → ask Lit to decrypt (only if ACL passes).
 */

export class LitAdapter {
  constructor(_config = {}) {
    this._ready = false;
    // Phase 2: this._litClient = new LitNodeClient({ litNetwork: 'datil' });
  }

  async connect() {
    // Phase 2: await this._litClient.connect();
    throw new _NotImplemented('LitAdapter.connect');
  }

  /**
   * Encrypt bytes using Lit access control conditions.
   * @param {Uint8Array} _bytes
   * @param {object} _accessControlConditions
   * @returns {{ encryptedData: string, encryptedSymmetricKey: string }}
   */
  async encrypt(_bytes, _accessControlConditions) {
    throw new _NotImplemented('LitAdapter.encrypt');
  }

  /**
   * Decrypt bytes using Lit, contingent on ACL evaluation passing.
   * @param {string} _encryptedData
   * @param {string} _encryptedSymmetricKey
   * @param {object} _accessControlConditions
   * @returns {Uint8Array}
   */
  async decrypt(_encryptedData, _encryptedSymmetricKey, _accessControlConditions) {
    throw new _NotImplemented('LitAdapter.decrypt');
  }

  /**
   * Update ACL to grant a new recipient access.
   * @param {string} _cid
   * @param {string} _recipientAddress
   */
  async grantAccess(_cid, _recipientAddress) {
    throw new _NotImplemented('LitAdapter.grantAccess');
  }

  /**
   * Revoke all access to a CID by updating the ACL to deny everyone.
   * This is the decentralised equivalent of key destruction.
   * @param {string} _cid
   */
  async revokeAccess(_cid) {
    throw new _NotImplemented('LitAdapter.revokeAccess');
  }
}

class _NotImplemented extends Error {
  constructor(method) {
    super(
      `[LitAdapter] ${method} is not yet implemented. ` +
        'This is a Phase 2 feature. See src/meshkit/adapters/lit.js for instructions.',
    );
    this.name = 'NotImplemented';
  }
}
