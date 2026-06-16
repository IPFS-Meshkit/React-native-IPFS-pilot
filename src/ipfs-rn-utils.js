/**
 * React Native safe IPFS helpers.
 * Uses Kubo raw HTTP API (fetch + multipart) — avoids kubo-rpc-client
 * Node streams that cause "undefined is not a function" in React Native.
 */

import {IPFS_API} from './config';

function parseNdjson(text) {
  return text
    .trim()
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => JSON.parse(line));
}

function buildMultipartBody(parts, boundary) {
  let body = '';
  parts.forEach((part, i) => {
    if (i > 0) {
      body += '\r\n';
    }
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${part.path}"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;
    body += part.content;
  });
  body += `\r\n--${boundary}--\r\n`;
  return body;
}

async function ipfsPost(path, options = {}) {
  const url = `${IPFS_API}${path}`;
  const res = await fetch(url, {method: 'POST', ...options});
  const text = await res.text();
  if (!res.ok) {
    try {
      const err = JSON.parse(text);
      throw new Error(err.Message || err.message || text);
    } catch (e) {
      if (e.message && e.message !== text) throw e;
      throw new Error(text || `IPFS request failed (${res.status})`);
    }
  }
  return text;
}

/** Get node identity. */
export async function ipfsId() {
  const text = await ipfsPost('/id');
  return JSON.parse(text);
}

/** Upload a string as a single IPFS file. Returns { cid, name, size }. */
export async function addTextFile(filename, content) {
  const safeName =
    String(filename)
      .replace(/^\/+/, '')
      .split('/')
      .pop() || 'data.txt';

  const boundary = `----RN${Date.now()}`;
  const body = buildMultipartBody([{path: safeName, content: String(content)}], boundary);

  const text = await ipfsPost('/add?pin=true&wrap-with-directory=false', {
    headers: {'Content-Type': `multipart/form-data; boundary=${boundary}`},
    body,
  });

  const results = parseNdjson(text);
  const last = results[results.length - 1];
  if (!last?.Hash) {
    throw new Error('IPFS add failed — is `ipfs daemon` running?');
  }

  return {
    cid: last.Hash,
    name: last.Name,
    size: parseInt(last.Size, 10) || 0,
  };
}

/** Upload multiple files as a directory. Returns root directory CID. */
export async function addDirectory(files) {
  const parts = files.map(f => ({path: f.path, content: String(f.content)}));
  const boundary = `----RN${Date.now()}`;
  const body = buildMultipartBody(parts, boundary);

  const text = await ipfsPost('/add?pin=true&wrap-with-directory=true', {
    headers: {'Content-Type': `multipart/form-data; boundary=${boundary}`},
    body,
  });

  const results = parseNdjson(text);
  const last = results[results.length - 1];
  if (!last?.Hash) {
    throw new Error('IPFS add failed — is `ipfs daemon` running?');
  }

  return {cid: last.Hash, name: last.Name, size: parseInt(last.Size, 10) || 0};
}

/** Download a CID as a UTF-8 string. */
export async function catToString(cid) {
  const text = await ipfsPost(`/cat?arg=${encodeURIComponent(cid)}`);
  return text.trim();
}

/** List entries under a directory CID. */
export async function lsEntries(cid) {
  const text = await ipfsPost(
    `/ls?arg=${encodeURIComponent(cid)}&stream=true`,
  );
  const lines = parseNdjson(text);
  const entries = [];
  for (const obj of lines) {
    for (const link of obj.Objects?.[0]?.Links || []) {
      entries.push({
        name: link.Name,
        cid: link.Hash,
        size: link.Size,
        type: link.Type === 1 ? 'dir' : 'file',
      });
    }
  }
  return entries;
}

/** Get all files inside a directory CID (ls + cat each file). */
export async function getDirectoryFiles(dirCid) {
  const entries = await lsEntries(dirCid);
  const files = [];
  for (const entry of entries) {
    if (entry.type === 'dir') {
      const nested = await lsEntries(entry.cid);
      for (const nestedEntry of nested) {
        if (nestedEntry.type !== 'dir') {
          const content = await catToString(nestedEntry.cid);
          files.push({path: `${entry.name}/${nestedEntry.name}`, content});
        }
      }
    } else {
      const content = await catToString(entry.cid);
      files.push({path: entry.name, content});
    }
  }
  return files;
}

// ─── PubSub ───────────────────────────────────────────────────────────────────

/**
 * Encode a topic string as multibase base64url (required by Kubo >=0.11).
 * Prefix 'u' = base64url no-padding.
 */
function topicToMultibase(topic) {
  const bytes = new TextEncoder().encode(topic);
  let binary = '';
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return (
    'u' +
    btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  );
}

/**
 * Decode a multibase base64url string back to bytes/string.
 * Messages from Kubo pubsub arrive with 'u' prefix base64url.
 */
function multibaseToString(mb) {
  if (!mb || mb.length < 1) return '';
  const prefix = mb[0];
  const b64 = mb.slice(1);
  if (prefix === 'u') {
    // base64url → base64 → Uint8Array → UTF-8 string
    const standard = b64.replace(/-/g, '+').replace(/_/g, '/');
    const padded = standard.padEnd(
      standard.length + ((4 - (standard.length % 4)) % 4),
      '=',
    );
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }
  return mb;
}

/** Publish a message to a PubSub topic via raw Kubo HTTP API. */
export async function pubsubPublish(topic, message) {
  const encodedTopic = topicToMultibase(topic);
  const boundary = `----RNPub${Date.now()}`;
  const body =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="data"\r\n` +
    `Content-Type: application/octet-stream\r\n\r\n` +
    message +
    `\r\n--${boundary}--\r\n`;

  await ipfsPost(
    `/pubsub/pub?arg=${encodeURIComponent(encodedTopic)}`,
    {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    },
  );
}

/**
 * Subscribe to a PubSub topic using streaming fetch.
 * Calls onMessage({ from, data }) for each received message.
 * Returns a cancel function — call it to stop listening.
 */
export function pubsubSubscribe(topic, onMessage, onError) {
  const encodedTopic = topicToMultibase(topic);
  const ctrl = new AbortController();
  let cancelled = false;

  (async () => {
    try {
      const res = await fetch(
        `${IPFS_API}/pubsub/sub?arg=${encodeURIComponent(encodedTopic)}`,
        {method: 'POST', signal: ctrl.signal},
      );

      if (!res.ok) {
        const text = await res.text();
        const msg = (() => {
          try {
            return JSON.parse(text).Message || text;
          } catch {
            return text;
          }
        })();
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (!cancelled) {
        const {done, value} = await reader.read();
        if (done) break;
        buf += decoder.decode(value, {stream: true});
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const msg = JSON.parse(trimmed);
            const dataStr = multibaseToString(msg.data || '');
            onMessage({
              from: msg.from || '',
              data: dataStr,
              rawData: msg.data,
            });
          } catch (_) {
            /* ignore parse errors */
          }
        }
      }
    } catch (err) {
      if (!cancelled && err.name !== 'AbortError') {
        onError && onError(err);
      }
    }
  })();

  return () => {
    cancelled = true;
    ctrl.abort();
  };
}

/** Format any error for display. */
export function formatError(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  return err.message || String(err);
}
