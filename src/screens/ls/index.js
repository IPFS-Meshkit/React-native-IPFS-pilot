import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Button} from 'react-native-paper';
import {inspect} from 'util';
import {useIpfs} from '../../ipfs-http-client';

const LsScreen = () => {
  const {client} = useIpfs();

  const ls = async () => {
    const CID = 'QmfGBRT6BbWJd7yUc2uYdaUZJBbnEFvTqehPFoSMQ6wgdr';

    try {
      console.log('Demo App .ls start');
      for await (const file of client.ls(CID)) {
        console.log('Demo App .ls', {file: inspect(file)});
      }
    } catch (error) {
      console.error('Demo App .ls', {error});
    }
  };

  return (
    <View style={styles.container}>
      <Button mode="contained" onPress={ls}>
        Press me
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16},
});

export default LsScreen;
