/**
 * React Native safe IPFS helpers.
 * Never pass Uint8Array/Blob to kubo-rpc-client — use strings only.
 */

/** Upload a string as a single IPFS file. Returns { cid, path, size }. */
export async function addTextFile(client, filename, content) {
  const safeName =
    String(filename)
      .replace(/^\/+/, '')
      .split('/')
      .pop() || 'data.txt';

  let entry = null;
  for await (const e of client.addAll(
    [{path: safeName, content: String(content)}],
    {pin: true, wrapWithDirectory: false},
  )) {
    entry = e;
  }

  if (!entry) {
    throw new Error('IPFS add failed — is `ipfs daemon` running?');
  }

  return {
    cid: entry.cid.toString(),
    path: entry.path,
    size: entry.size,
  };
}

/** Upload multiple files wrapped in a directory. Returns root directory CID. */
export async function addDirectory(client, files) {
  const entries = files.map(f => ({
    path: f.path,
    content: String(f.content),
  }));

  let root = null;
  for await (const e of client.addAll(entries, {pin: true, wrapWithDirectory: true})) {
    root = e;
  }

  if (!root) {
    throw new Error('IPFS add failed — is `ipfs daemon` running?');
  }

  return {cid: root.cid.toString(), path: root.path, size: root.size};
}

/** Download a CID as a UTF-8 string. */
export async function catToString(client, cid) {
  const chunks = [];
  for await (const chunk of client.cat(cid)) {
    chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(out);
}

/** List entries under a directory CID. */
export async function lsEntries(client, cid) {
  const entries = [];
  for await (const entry of client.ls(cid)) {
    entries.push(entry);
  }
  return entries;
}

/** Format any error for display. */
export function formatError(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  return err.message || String(err);
}
