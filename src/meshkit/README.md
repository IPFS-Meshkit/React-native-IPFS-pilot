# Meshkit — Privacy-Preserving IPFS Abstraction Library

> **Branch:** `feat/meshkit` | **Phase:** 1 (kubo-only, AES-GCM-256)

---

## What is Meshkit?

Meshkit is a JavaScript library that wraps raw IPFS (`kubo-rpc-client`) calls and adds a **privacy-preserving abstraction layer**. Instead of pushing plain data to IPFS, every payload is **encrypted on-device before it ever touches the network**.

---

## 5 Abstract Methods

| Method | What it does |
|---|---|
| `mk.init(config)` | Initialise with IPFS nodes, encryption standard, and (Phase 2) Key Service config |
| `mk.store(payload)` / `mk.retrieve(cid)` | Encrypt → fragment → upload; download → reassemble → decrypt |
| `mk.upload(file)` / `mk.share(cid, recipientId)` / `mk.download(cid, requesterId)` | Encrypted file transfer with per-CID access control |
| `mk.send(from, to, msg)` / `mk.receive(self, peer, handler)` | E2EE messages over IPFS PubSub |
| `mk.revoke(cid)` | Destroy the decryption key — renders IPFS data permanently unreadable |

---

## Architecture

```
src/meshkit/
├── index.js                  ← Public API — Meshkit class
├── MeshkitProvider.js        ← React context + useMeshkit() hook
├── core/
│   ├── crypto.js             ← AES-GCM-256 encrypt/decrypt (@noble/ciphers)
│   ├── fragment.js           ← Split/reassemble large payloads into chunks
│   └── keystore.js           ← In-memory CID→key map (Phase 1)
├── modules/
│   ├── storage.js            ← store() / retrieve()
│   ├── transfer.js           ← upload() / share() / download()
│   ├── messaging.js          ← send() / receive() / stopReceiving()
│   └── revocation.js         ← revoke() / isRevoked()
└── adapters/
    ├── kubo.js               ← Kubo RPC adapter (Phase 1 — active)
    └── lit.js                ← Lit Protocol adapter (Phase 2 — stub)
```

---

## Phase 1 vs Phase 2

| Feature | Phase 1 (current) | Phase 2 (TODO) |
|---|---|---|
| Encryption | AES-GCM-256, in-device key gen | Lit Protocol threshold encryption |
| Key storage | In-memory `Map` (lost on restart) | Lit decentralised key network |
| Access control | `recipients[]` array in KeyStore | Lit on-chain ACL |
| Revocation | Zeroise key in memory | `LitAdapter.revokeAccess()` — updates on-chain ACL |
| E2EE messaging | Shared-secret AES (deterministic) | ECDH public-key exchange (`@noble/curves`) |
| ZK identity | Not implemented | Semaphore / Anon Aadhaar proof-of-membership |
| Pinning service | Local node pin | Lighthouse Web3 pinning API |

---

## Phase 2 Steps (What to do next)

### Step 1 — Integrate Lit Protocol (Key Service)
```bash
npm install @lit-protocol/lit-node-client @lit-protocol/constants
```
- Implement `src/meshkit/adapters/lit.js` (stub already exists with full interface)
- In `storage.js` and `transfer.js`, replace `keystore.set/get` with `LitAdapter.encrypt/decrypt`
- `revoke()` becomes `LitAdapter.revokeAccess(cid)` which updates the on-chain ACL

### Step 2 — Real ECDH for Messaging
```bash
npm install @noble/curves
```
- Replace `_deriveSharedKey()` in `messaging.js` with `secp256k1.getSharedSecret()`
- Require users to register their public key before they can receive messages

### Step 3 — Semaphore ZK Identity Gate
- Add a `zkGate` option to `retrieve()` and `download()`
- Before decrypting, verify the caller's Semaphore group membership proof

### Step 4 — Lighthouse Pinning
- After every `ipfs.add`, call the Lighthouse API to pin persistently on Web3.Storage
- Reference: https://x.com/LighthouseWeb3/status/2057737397358727424

### Step 5 — Anon Aadhaar (India deployment)
- Add an optional `requireAadhaarProof: true` flag to `mk.download()`
- Verify the ZK proof before releasing the decryption key

---

## Quick Start (in-app)

```js
import Meshkit from './src/meshkit';

const mk = new Meshkit();
await mk.init({ nodes: ['http://localhost:5001'] });

// Encrypted storage
const { cid } = await mk.store('sensitive data');
const bytes = await mk.retrieve(cid);

// File transfer
const { cid: fileCid } = await mk.upload({ name: 'report.txt', content: '...' });
mk.share(fileCid, 'alice@example.com');
const file = await mk.download(fileCid, 'alice@example.com');

// E2EE messaging
await mk.send('bob', 'alice', 'secret message');
const unsub = await mk.receive('alice', 'bob', ({ from, message }) => console.log(from, message));

// Revoke
mk.revoke(cid); // key destroyed — data permanently unreadable
```
