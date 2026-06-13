import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Button} from 'react-native-paper';
import {inspect} from 'util';
import {useIpfs} from '../../ipfs-http-client';

const IdScreen = () => {
  const {client} = useIpfs();

  const id = async () => {
    try {
      console.log('Demo App .id start');
      console.log('Demo App .id', {result: inspect(await client.id())});
    } catch (error) {
      console.error('Demo App .id', {error});
    }
  };

  return (
    <View style={styles.container}>
      <Button mode="contained" onPress={id}>
        Press me
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16},
});

export default IdScreen;
