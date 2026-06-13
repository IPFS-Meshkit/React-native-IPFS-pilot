import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {Provider as PaperProvider} from 'react-native-paper';
import Navigation from './navigation';
import {Provider as IpfsProvider} from './ipfs-http-client';

const App = () => (
  <GestureHandlerRootView style={{flex: 1}}>
    <IpfsProvider>
      <PaperProvider>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
      </PaperProvider>
    </IpfsProvider>
  </GestureHandlerRootView>
);

export default App;
