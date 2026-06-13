import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Button} from 'react-native-paper';
import {inspect} from 'util';
import {useIpfs} from '../../ipfs-http-client';

const AddScreen = () => {
  const {client} = useIpfs();

  const addString = async () => {
    console.log('Demo App .add string start');
    const file = {
      path: '/tmp/rn-ipfs-add-string',
      content: '邑中陽裏人也，姓劉氏。母媼嘗息大澤之陂，夢與神遇',
    };
    try {
      console.log('Demo App .add string', {
        result: inspect(await client.add(file)),
      });
    } catch (error) {
      console.error('Demo App .add string', {error});
    }
  };

  const addUint8Array = async () => {
    console.log('Demo App .add Uint8Array start');
    const file = {
      path: '/tmp/rn-ipfs-add-uint8array',
      content: Uint8Array.from([49, 50, 51, 52, 53, 54, 55, 56, 57]),
    };
    try {
      console.log('Demo App .add Uint8Array', {
        result: inspect(await client.add(file)),
      });
    } catch (error) {
      console.error('Demo App .add Uint8Array', {error});
    }
  };

  const addNumbers = async () => {
    console.log('Demo App .add numbers start');
    const file = {
      path: '/tmp/rn-ipfs-add-numbers',
      content: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    };
    try {
      console.log('Demo App .add numbers', {
        result: inspect(await client.add(file)),
      });
    } catch (error) {
      console.error('Demo App .add numbers', {error});
    }
  };

  return (
    <View style={styles.container}>
      <Button mode="contained" style={styles.button} onPress={addString}>
        Add string
      </Button>
      <Button mode="contained" style={styles.button} onPress={addUint8Array}>
        Add Uint8Array
      </Button>
      <Button mode="contained" style={styles.button} onPress={addNumbers}>
        Add numbers
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, gap: 12},
  button: {marginVertical: 4},
});

export default AddScreen;
