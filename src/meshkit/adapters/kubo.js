/**
 * Meshkit Kubo Adapter — uses raw HTTP API (React Native safe)
 */

import {
  addTextFile,
  catToString,
  ipfsId,
} from '../../ipfs-rn-utils';
import {create} from 'kubo-rpc-client';

export class KuboAdapter {
  constructor(nodeUrls) {
    if (!nodeUrls || nodeUrls.length === 0) {
      throw new Error('[KuboAdapter] At least one node URL is required.');
    }
    this._primaryUrl = nodeUrls[0];
    this._client = null;
  }

  connect() {
    // kubo client kept only for pubsub (optional)
    this._client = create({url: this._primaryUrl});
    return this._client;
  }

  get client() {
    if (!this._client) {
      throw new Error('[KuboAdapter] Not connected. Call Meshkit.init() first.');
    }
    return this._client;
  }

  async uploadString(text) {
    if (typeof text !== 'string') {
      throw new Error('[KuboAdapter] uploadString requires a string');
    }
    const result = await addTextFile('manifest.json', text);
    return result.cid;
  }

  async downloadString(cid) {
    return catToString(cid);
  }

  async publish(topic, data) {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    await this.client.pubsub.publish(topic, new TextEncoder().encode(text));
  }

  async subscribe(topic, handler, options = {}) {
    await this.client.pubsub.subscribe(topic, handler, options);
  }

  async unsubscribe(topic, handler) {
    await this.client.pubsub.unsubscribe(topic, handler);
  }

  async id() {
    return ipfsId();
  }

  async swarmConnect(addr) {
    return this.client.swarm.connect(addr);
  }
}
