/**
 * Meshkit Kubo Adapter — fully raw HTTP API (React Native safe)
 * No kubo-rpc-client dependency; all calls go directly to Kubo's HTTP API.
 */

import {IPFS_API} from '../../config';
import {
  addTextFile,
  catToString,
  ipfsId,
  pubsubPublish,
  pubsubSubscribe,
} from '../../ipfs-rn-utils';

export class KuboAdapter {
  constructor(nodeUrls) {
    if (!nodeUrls || nodeUrls.length === 0) {
      throw new Error('[KuboAdapter] At least one node URL is required.');
    }
    this._primaryUrl = nodeUrls[0];
    // Map<handler, cancelFn> — used to cancel subscriptions
    this._cancelFns = new Map();
  }

  connect() {
    // No client to create — all calls are raw HTTP
    return this;
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
    const text =
      typeof data === 'string' ? data : new TextDecoder().decode(data);
    await pubsubPublish(topic, text);
  }

  subscribe(topic, handler, options = {}) {
    const cancel = pubsubSubscribe(
      topic,
      msg => handler(msg),
      err => options.onError && options.onError(err),
    );
    this._cancelFns.set(handler, cancel);
    return Promise.resolve();
  }

  unsubscribe(topic, handler) {
    const cancel = this._cancelFns.get(handler);
    if (cancel) {
      cancel();
      this._cancelFns.delete(handler);
    }
    return Promise.resolve();
  }

  async id() {
    return ipfsId();
  }

  async swarmConnect(addr) {
    const res = await fetch(
      `${IPFS_API}/swarm/connect?arg=${encodeURIComponent(addr)}`,
      {method: 'POST'},
    );
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.Message || 'swarm connect failed');
    }
    return json;
  }
}
