/**
 * Meshkit Kubo Adapter — React Native safe
 *
 * Upload rule: ALWAYS use { path, content: string } via addAll().
 * Plain Uint8Array / Blob uploads throw "Unexpected input" or
 * "Creating blob from ArrayBuffer not supported" in React Native.
 */

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
    this._client = create({url: this._primaryUrl});
    return this._client;
  }

  get client() {
    if (!this._client) {
      throw new Error('[KuboAdapter] Not connected. Call Meshkit.init() first.');
    }
    return this._client;
  }

  /**
   * Upload a UTF-8 string to IPFS.
   * Returns the file CID (not a directory CID).
   */
  async uploadString(text) {
    if (typeof text !== 'string') {
      throw new Error('[KuboAdapter] uploadString requires a string, got ' + typeof text);
    }

    let fileCid = null;

    // Same pattern as the working ipfs.add() demo — string content in a file object.
    // wrapWithDirectory:false ensures the returned CID points directly to the file bytes.
    for await (const entry of this.client.addAll(
      [{path: 'manifest.json', content: text}],
      {pin: true, wrapWithDirectory: false},
    )) {
      fileCid = entry.cid.toString();
    }

    if (!fileCid) {
      throw new Error('[KuboAdapter] IPFS add returned no CID — is ipfs daemon running?');
    }

    return fileCid;
  }

  /** Download a CID as a UTF-8 string. */
  async downloadString(cid) {
    const bytes = await this._catBytes(cid);
    return new TextDecoder().decode(bytes).trim();
  }

  /** Publish a PubSub message (string or Uint8Array). */
  async publish(topic, data) {
    // PubSub accepts Uint8Array — encode string to bytes safely
    const bytes =
      typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data instanceof Uint8Array
          ? data
          : new TextEncoder().encode(String(data));
    await this.client.pubsub.publish(topic, bytes);
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

  async _catBytes(cid) {
    const chunks = [];
    for await (const chunk of this.client.cat(cid)) {
      chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
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
}
