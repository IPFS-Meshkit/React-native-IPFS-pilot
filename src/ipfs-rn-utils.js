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

/** Format any error for display. */
export function formatError(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  return err.message || String(err);
}
