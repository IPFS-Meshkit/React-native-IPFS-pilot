/**
 * Meshkit Kubo Adapter — React Native safe
 */

import {create} from 'kubo-rpc-client';
import {addTextFile, catToString, formatError} from '../../ipfs-rn-utils';

export class KuboAdapter {
  constructor(nodeUrls) {
    if (!nodeUrls || nodeUrls.length === 0) {
      throw new Error('[KuboAdapter] At least one node URL is required.');
    }
    this._primaryUrl = nodeUrls[0];
    this._client = null;
  }

  connect() {
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
    const result = await addTextFile(this.client, 'manifest.json', text);
    return result.cid;
  }

  async downloadString(cid) {
    return catToString(this.client, cid).then(s => s.trim());
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
    return this.client.id();
  }

  async swarmConnect(addr) {
    return this.client.swarm.connect(addr);
  }
}

export {formatError};
