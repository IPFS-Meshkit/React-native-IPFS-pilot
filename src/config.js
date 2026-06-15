import {Platform} from 'react-native';

const HTTP_CLIENT_URL = Platform.select({
  ios: 'http://localhost:5001',
  android: 'http://10.0.2.2:5001',
});

const IPFS_API = `${HTTP_CLIENT_URL}/api/v0`;

export {HTTP_CLIENT_URL, IPFS_API};
