import React, {useState, useRef} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Button, Text, Card} from 'react-native-paper';
import {useIpfs} from '../../ipfs-http-client';
import {formatError} from '../../ipfs-rn-utils';

const TOPIC = 'react-native-ipfs-demo';

const PubsubScreen = () => {
  const {client} = useIpfs();
  const {pubsub} = client;
  const handlerRef = useRef(null);
  const [log, setLog] = useState([]);
  const [messages, setMessages] = useState([]);
  const [subscribed, setSubscribed] = useState(false);

  const addLog = (msg, isError = false) =>
    setLog(prev => [
      `[${new Date().toLocaleTimeString()}] ${isError ? 'ERROR: ' : ''}${msg}`,
      ...prev,
    ]);

  const subscribe = async () => {
    try {
      const handler = msg => {
        try {
          const data = msg?.data ?? msg;
          const text =
            typeof data === 'string'
              ? data
              : new TextDecoder().decode(
                  data instanceof Uint8Array ? data : new Uint8Array(data),
                );
          setMessages(prev => [text, ...prev]);
          addLog(`Received: "${text}"`);
        } catch (e) {
          addLog(`Message parse error: ${formatError(e)}`, true);
        }
      };
      handlerRef.current = handler;
      await pubsub.subscribe(TOPIC, handler, {
        onError: err => addLog(`PubSub error: ${formatError(err)}`, true),
      });
      setSubscribed(true);
      addLog(`Subscribed to "${TOPIC}"`);
    } catch (err) {
      addLog(`Subscribe failed: ${formatError(err)}`, true);
    }
  };

  const unsubscribe = async () => {
    try {
      if (handlerRef.current) {
        await pubsub.unsubscribe(TOPIC, handlerRef.current);
        handlerRef.current = null;
      }
      setSubscribed(false);
      addLog('Unsubscribed');
    } catch (err) {
      addLog(`Unsubscribe failed: ${formatError(err)}`, true);
    }
  };

  const publish = async () => {
    try {
      const text = `hello from RN at ${new Date().toLocaleTimeString()}`;
      await pubsub.publish(TOPIC, new TextEncoder().encode(text));
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
              <Text key={i} style={styles.msg}>{m}</Text>
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
              <Text key={i} style={[styles.logLine, l.includes('ERROR') && styles.errorLine]}>
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
