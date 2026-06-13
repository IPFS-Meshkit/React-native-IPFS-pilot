import {Platform} from 'react-native';

const HTTP_CLIENT_URL = Platform.select({
  ios: 'http://localhost:5001',
  android: 'http://10.0.2.2:5001',
});

export {HTTP_CLIENT_URL};
