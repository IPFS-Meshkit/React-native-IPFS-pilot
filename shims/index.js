import 'react-native-url-polyfill/auto';

// TextEncoder/TextDecoder polyfill for Hermes
if (typeof TextDecoder === 'undefined') {
  const {TextDecoder, TextEncoder} = require('text-encoding');
  global.TextDecoder = TextDecoder;
  global.TextEncoder = TextEncoder;
}
