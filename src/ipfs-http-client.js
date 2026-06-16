/**
 * Thin compatibility shim — no longer creates a kubo-rpc-client.
 * All raw IPFS screens now import directly from ipfs-rn-utils.
 * This file only exists to avoid breaking the App.js Provider wrapper.
 */
import React, {createContext, useContext} from 'react';
import * as utils from './ipfs-rn-utils';

const IpfsHttpClientContext = createContext({client: utils});

const Provider = ({children}) => (
  <IpfsHttpClientContext.Provider value={{client: utils}}>
    {children}
  </IpfsHttpClientContext.Provider>
);

const useIpfs = () => useContext(IpfsHttpClientContext);

export {Provider, useIpfs};
