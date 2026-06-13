import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Button} from 'react-native-paper';
import {useIpfs} from '../../ipfs-http-client';

const CatScreen = () => {
  const {client} = useIpfs();

  const cat = async () => {
    const CID = 'QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB';

    try {
      console.log('Demo App .cat start');

      const chunks = [];
      for await (const chunk of client.cat(CID)) {
        console.log('Demo App .cat', {chunk, type: typeof chunk});
        chunks.push(chunk);
      }

      const buffer = chunks.reduce((acc, chunk) => {
        const arr = new Uint8Array(acc.length + chunk.length);
        arr.set(acc, 0);
        arr.set(chunk, acc.length);
        return arr;
      }, new Uint8Array(0));

      const content = new TextDecoder().decode(buffer);
      console.log('Demo App .cat', {content});
    } catch (error) {
      console.error('Demo App .cat', {error});
    }
  };

  return (
    <View style={styles.container}>
      <Button mode="contained" onPress={cat}>
        Press me
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16},
});

export default CatScreen;
