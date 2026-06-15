import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {Provider as PaperProvider} from 'react-native-paper';
import Navigation from './navigation';
import {Provider as IpfsProvider} from './ipfs-http-client';
import {MeshkitProvider} from './meshkit/MeshkitProvider';

const App = () => (
  <GestureHandlerRootView style={{flex: 1}}>
    <IpfsProvider>
      <MeshkitProvider>
        <PaperProvider>
          <NavigationContainer>
            <Navigation />
          </NavigationContainer>
        </PaperProvider>
      </MeshkitProvider>
    </IpfsProvider>
  </GestureHandlerRootView>
);

export default App;
