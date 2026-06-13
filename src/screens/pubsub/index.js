import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Button} from 'react-native-paper';
import {multiaddr} from '@multiformats/multiaddr';
import {useIpfs} from '../../ipfs-http-client';

const TOPIC = 'react-native-ipfs-demo';
const ADDR = multiaddr(
  '/ip4/147.75.100.9/tcp/4001/p2p/Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6',
);

const handleMessage = (msg) => console.log('Demo app .pubsub message', {msg});
const handleError = (error) => console.log('Demo app .pubsub error', {error});

const PubsubScreen = () => {
  const {
    client: {pubsub, swarm},
  } = useIpfs();

  const connect = async () => {
    try {
      console.log('Demo App .pubsub start');
      await swarm.connect(ADDR);
      console.log('Demo App .pubsub connect', {addr: ADDR});
    } catch (error) {
      console.error('Demo App .pubsub connect', {addr: ADDR, error});
    }
  };

  const disconnect = async () => {
    try {
      console.log('Demo App .disconnect start');
      await swarm.disconnect(ADDR);
      console.log('Demo App .pubsub disconnect', {addr: ADDR});
    } catch (error) {
      console.error('Demo App .pubsub disconnect', {addr: ADDR, error});
    }
  };

  const subscribe = async () => {
    try {
      console.log('Demo App .pubsub subscribe start');
      await pubsub.subscribe(TOPIC, handleMessage, {onError: handleError});
      console.log('Demo App .pubsub subscribe', {topic: TOPIC});
    } catch (error) {
      console.error('Demo App .pubsub subscribe', {topic: TOPIC, error});
    }
  };

  const unsubscribe = async () => {
    try {
      console.log('Demo App .pubsub unsubscribe start');
      await pubsub.unsubscribe(TOPIC, handleMessage);
      console.log('Demo App .pubsub unsubscribe', {topic: TOPIC});
    } catch (error) {
      console.error('Demo App .pubsub unsubscribe', {topic: TOPIC, error});
    }
  };

  const publish = async () => {
    try {
      console.log('Demo App .pubsub publish start');
      const msg = new TextEncoder().encode('hello');
      await pubsub.publish(TOPIC, msg);
      console.log('Demo App .pubsub publish', {topic: TOPIC, msg});
    } catch (error) {
      console.error('Demo App .pubsub publish', {error});
    }
  };

  return (
    <View style={styles.container}>
      <Button mode="contained" style={styles.button} onPress={connect}>
        Connect
      </Button>
      <Button mode="contained" style={styles.button} onPress={disconnect}>
        Disconnect
      </Button>
      <Button mode="contained" style={styles.button} onPress={subscribe}>
        Subscribe
      </Button>
      <Button mode="contained" style={styles.button} onPress={unsubscribe}>
        Unsubscribe
      </Button>
      <Button mode="contained" style={styles.button} onPress={publish}>
        Publish
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, gap: 12},
  button: {marginVertical: 4},
});

export default PubsubScreen;
