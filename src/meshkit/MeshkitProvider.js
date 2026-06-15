/**
 * MeshkitProvider — React context wrapper for the Meshkit library.
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
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('connecting');

    (async () => {
      try {
        const instance = new Meshkit();
        await instance.init({nodes: [IPFS_URL], encryption: 'aes-gcm-256'});
        // Verify IPFS is actually reachable before marking ready
        await instance.id();
        if (!cancelled) {
          setMk(instance);
          setStatus('ready');
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || String(err));
          setStatus('error');
        }
      }
    })();

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
