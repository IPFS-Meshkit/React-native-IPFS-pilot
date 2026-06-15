/**
 * MeshkitProvider — React context wrapper for the Meshkit library.
 * Drop this in at the root of the app (same pattern as the existing IpfsHttpClientContext).
 */

import React, {createContext, useContext, useState, useEffect} from 'react';
import {Platform} from 'react-native';
import Meshkit from './index';

const MeshkitContext = createContext(null);

const IPFS_URL = Platform.select({
  ios: 'http://localhost:5001',
  android: 'http://10.0.2.2:5001',
});

export const MeshkitProvider = ({children}) => {
  const [mk, setMk] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | connecting | ready | error
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('connecting');

    const instance = new Meshkit();
    instance
      .init({nodes: [IPFS_URL], encryption: 'aes-gcm-256'})
      .then(() => {
        if (!cancelled) {
          setMk(instance);
          setStatus('ready');
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MeshkitContext.Provider value={{mk, status, error}}>
      {children}
    </MeshkitContext.Provider>
  );
};

export const useMeshkit = () => {
  const ctx = useContext(MeshkitContext);
  if (!ctx) {
    throw new Error('useMeshkit must be used inside <MeshkitProvider>');
  }
  return ctx;
};
