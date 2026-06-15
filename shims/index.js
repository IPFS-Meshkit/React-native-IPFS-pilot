import 'react-native-url-polyfill/auto';

// TextEncoder/TextDecoder polyfill for Hermes
if (typeof TextDecoder === 'undefined') {
  const {TextDecoder, TextEncoder} = require('text-encoding');
  global.TextDecoder = TextDecoder;
  global.TextEncoder = TextEncoder;
}

// crypto.getRandomValues polyfill for Hermes / older RN versions
// @noble/ciphers needs globalThis.crypto.getRandomValues to generate keys and IVs
if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.getRandomValues !== 'function') {
  const getRandomValues = arr => {
    // Use Math.random as fallback — acceptable for dev/demo only
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  };
  globalThis.crypto = {
    ...(globalThis.crypto || {}),
    getRandomValues,
  };
}
