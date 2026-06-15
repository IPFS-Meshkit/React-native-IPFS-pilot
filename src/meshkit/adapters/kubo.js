/**
 * Meshkit Kubo Adapter — Phase 1
 *
 * Thin wrapper around kubo-rpc-client. This is the only file that imports
 * kubo-rpc-client. Swapping to Helia or another IPFS implementation in
 * future only requires changing this file.
 */

import {create} from 'kubo-rpc-client';

export class KuboAdapter {
  /**
   * @param {string[]} nodeUrls   List of IPFS RPC endpoints
   */
  constructor(nodeUrls) {
    if (!nodeUrls || nodeUrls.length === 0) {
      throw new Error('[KuboAdapter] At least one node URL is required.');
    }
    // Primary node — future versions can load-balance or failover across all
    this._primaryUrl = nodeUrls[0];
    this._allUrls = nodeUrls;
    this._client = null;
  }

  connect() {
    this._client = create({url: this._primaryUrl});
    return this._client;
  }

  get client() {
    if (!this._client) {
      throw new Error(
        '[KuboAdapter] Not connected. Call Meshkit.init() first.',
      );
    }
    return this._client;
  }

  /** Upload raw bytes, returns CID string. */
  async uploadBytes(bytes) {
    const result = await this.client.add(bytes, {pin: true});
    return result.cid.toString();
  }

  /** Upload a named file object, returns CID string. */
  async uploadFile(path, bytes) {
    const result = await this.client.add({path, content: bytes}, {pin: true});
    return result.cid.toString();
  }

  /** Download all bytes for a CID. */
  async downloadBytes(cid) {
    const chunks = [];
    for await (const chunk of this.client.cat(cid)) {
      chunks.push(chunk);
    }
    const total = chunks.reduce((n, c) => n + c.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }

  /** Pin a CID to keep it available. */
  async pin(cid) {
    await this.client.pin.add(cid);
  }

  /** Unpin a CID (node may GC it later). */
  async unpin(cid) {
    await this.client.pin.rm(cid);
  }

  /** Publish a PubSub message. */
  async publish(topic, messageBytes) {
    await this.client.pubsub.publish(topic, messageBytes);
  }

  /** Subscribe to a PubSub topic. */
  async subscribe(topic, handler, options = {}) {
    await this.client.pubsub.subscribe(topic, handler, options);
  }

  /** Unsubscribe from a PubSub topic. */
  async unsubscribe(topic, handler) {
    await this.client.pubsub.unsubscribe(topic, handler);
  }

  /** Get node identity info. */
  async id() {
    return this.client.id();
  }

  /** Connect to a swarm peer. */
  async swarmConnect(addr) {
    return this.client.swarm.connect(addr);
  }
}
