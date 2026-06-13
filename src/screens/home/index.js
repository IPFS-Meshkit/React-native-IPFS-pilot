import React from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Button} from 'react-native-paper';

const runGenerator = () => {
  const generator = function* () {
    yield* Array(5)
      .fill()
      .map((_, i) => i);
  };

  for (const i of generator()) {
    console.log(`generator: ${i}`);
  }
};

const runAsyncGenerator2 = async () => {
  const generator = async function* () {
    var stream = [Promise.resolve(4), Promise.resolve(9), Promise.resolve(12)];
    var total = 0;
    for await (let val of stream) {
      total += await val;
      yield total;
    }
  };

  for await (const i of generator()) {
    console.log(`asyncGenerator2: ${i}`);
  }
};

const readableStreamTest1 = async () => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const rs = new ReadableStream({
    async pull(c) {
      await delay(250);
      c.enqueue('readable');
      await delay(250);
      c.enqueue('stream');
      await delay(250);
      c.enqueue('polyfill');
      c.close();
    },
  });

  const reader = rs.getReader();

  const read = () => {
    return reader
      .read()
      .then(({done, value}) => {
        if (done) {
          console.log('readableStreamTest1 done');
          return;
        }
        console.log('readableStreamTest1 read', {value});
        return read();
      })
      .catch((error) => console.error('readableStreamTest1 read', {error}));
  };

  read();
};

const HomeScreen = ({navigation}) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate('Id')}>
        ipfs.id()
      </Button>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate('Ls')}>
        ipfs.ls()
      </Button>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate('Add')}>
        ipfs.add()
      </Button>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate('Get')}>
        ipfs.get()
      </Button>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate('Cat')}>
        ipfs.cat()
      </Button>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => navigation.navigate('Pubsub')}>
        ipfs.pubsub
      </Button>
      <Button mode="contained" style={styles.button} onPress={runGenerator}>
        generator
      </Button>
      <Button
        mode="contained"
        style={styles.button}
        onPress={runAsyncGenerator2}>
        async generator
      </Button>
      <Button
        mode="contained"
        style={styles.button}
        onPress={readableStreamTest1}>
        readablestream test
      </Button>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => console.error('error')}>
        console.error
      </Button>
      <Button
        mode="contained"
        style={styles.button}
        onPress={() => console.warn('warn')}>
        console.warn
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  button: {
    marginVertical: 4,
  },
});

export default HomeScreen;
