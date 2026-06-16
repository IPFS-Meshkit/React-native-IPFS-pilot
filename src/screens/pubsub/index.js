import React, {useState, useRef} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Button, Text, Card} from 'react-native-paper';
import {pubsubPublish, pubsubSubscribe, formatError} from '../../ipfs-rn-utils';

const TOPIC = 'react-native-ipfs-demo';

const PubsubScreen = () => {
  const cancelRef = useRef(null);
  const [log, setLog] = useState([]);
  const [messages, setMessages] = useState([]);
  const [subscribed, setSubscribed] = useState(false);

  const addLog = (msg, isError = false) =>
    setLog(prev => [
      `[${new Date().toLocaleTimeString()}] ${isError ? 'ERROR: ' : ''}${msg}`,
      ...prev,
    ]);

  const subscribe = () => {
    try {
      const cancel = pubsubSubscribe(
        TOPIC,
        ({from, data}) => {
          setMessages(prev => [data, ...prev]);
          addLog(`Received: "${data}"`);
        },
        err => addLog(`PubSub error: ${formatError(err)}`, true),
      );
      cancelRef.current = cancel;
      setSubscribed(true);
      addLog(`Subscribed to "${TOPIC}"`);
    } catch (err) {
      addLog(`Subscribe failed: ${formatError(err)}`, true);
    }
  };

  const unsubscribe = () => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setSubscribed(false);
    addLog('Unsubscribed');
  };

  const publish = async () => {
    try {
      const text = `hello from RN at ${new Date().toLocaleTimeString()}`;
      await pubsubPublish(TOPIC, text);
      addLog(`Published: "${text}"`);
    } catch (err) {
      addLog(`Publish failed: ${formatError(err)}`, true);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!subscribed ? (
        <Button mode="contained" onPress={subscribe}>
          Subscribe
        </Button>
      ) : (
        <Button mode="outlined" onPress={unsubscribe}>
          Unsubscribe
        </Button>
      )}
      <Button mode="contained" onPress={publish} disabled={!subscribed}>
        Publish hello
      </Button>

      {messages.length > 0 ? (
        <Card style={styles.card}>
          <Card.Title title="Messages received" />
          <Card.Content>
            {messages.map((m, i) => (
              <Text key={i} style={styles.msg}>
                {m}
              </Text>
            ))}
          </Card.Content>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <Card.Title title="Log" />
        <Card.Content>
          {log.length === 0 ? (
            <Text style={styles.empty}>Subscribe then Publish.</Text>
          ) : (
            log.map((l, i) => (
              <Text
                key={i}
                style={[
                  styles.logLine,
                  l.includes('ERROR') && styles.errorLine,
                ]}>
                {l}
              </Text>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, gap: 12},
  card: {marginTop: 4},
  msg: {fontSize: 14, marginBottom: 6},
  empty: {color: '#999', fontStyle: 'italic'},
  logLine: {fontSize: 11, fontFamily: 'monospace', marginBottom: 2},
  errorLine: {color: '#c62828'},
});

export default PubsubScreen;
