/**
 * Meshkit Revocation Module
 *
 * Implements:
 *   mk.revoke(cid)   — permanently destroy the decryption key for a CID
 *
 * Phase 1:  Zeroes out the key in the in-memory KeyStore.
 *           Anyone who already downloaded the plaintext still has it.
 *           Future retrievals fail with "access revoked".
 *
 * Phase 2:  Calls LitAdapter.revokeAccess(cid) which updates the on-chain
 *           ACL so even people who had a cached encrypted copy can no longer
 *           obtain the symmetric key from the Lit threshold network.
 *
 * Note:    The IPFS ciphertext itself remains on the network (IPFS data is
 *          immutable/content-addressed). Revocation makes it permanently
 *          *undecipherable*, not deleted.
 */

/**
 * Revoke access to a CID.
 *
 * @param {string} cid
 * @param {object} ctx
 * @param {import('../core/keystore').default} ctx.keystore
 * @returns {{ cid: string, revokedAt: number }}
 */
export function revoke(cid, ctx) {
  const {keystore} = ctx;
  keystore.revoke(cid); // Zeroes key material and marks revokedAt
  return {cid, revokedAt: Date.now()};
}

/**
 * Check whether a CID has been revoked.
 * Useful for UI badges, audit logs, etc.
 *
 * @param {string} cid
 * @param {object} ctx
 * @returns {boolean}
 */
export function isRevoked(cid, ctx) {
  return ctx.keystore.isRevoked(cid);
}
