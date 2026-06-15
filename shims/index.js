import 'react-native-url-polyfill/auto';

// TextEncoder/TextDecoder polyfill for Hermes
if (typeof TextDecoder === 'undefined') {
  const {TextDecoder, TextEncoder} = require('text-encoding');
  global.TextDecoder = TextDecoder;
  global.TextEncoder = TextEncoder;
}

// crypto.getRandomValues — pure JS polyfill (no native module needed)
if (
  typeof globalThis.crypto === 'undefined' ||
  typeof globalThis.crypto.getRandomValues !== 'function'
) {
  const getRandomValues = array => {
    for (let i = 0, r = 0; i < array.length; i++) {
      if ((i & 3) === 0) {
        r = Math.random() * 0x100000000;
      }
      array[i] = (r >>> ((i & 3) << 3)) & 0xff;
    }
    return array;
  };
  globalThis.crypto = {...(globalThis.crypto || {}), getRandomValues};
}
