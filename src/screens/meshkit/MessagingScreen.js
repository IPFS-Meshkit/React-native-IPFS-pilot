import React, {useState} from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Button, TextInput, Text, Card} from 'react-native-paper';
import {useMeshkit} from '../../meshkit/MeshkitProvider';

const MessagingScreen = () => {
  const {mk, status, error: initError} = useMeshkit();
  const [senderId, setSenderId] = useState('bob');
  const [recipientId, setRecipientId] = useState('alice');
  const [message, setMessage] = useState('Hey Alice! This is E2EE via Meshkit.');
  const [subscribed, setSubscribed] = useState(false);
  const [unsubHandler, setUnsubHandler] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);

  const addLog = msg =>
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleSend = async () => {
    if (!mk) return;
    setLoading(true);
    try {
      addLog(`Encrypting message from ${senderId} to ${recipientId}...`);
      await mk.send(senderId, recipientId, message);
      addLog('Published encrypted envelope to PubSub.');
    } catch (e) {
      addLog(`ERROR: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!mk || subscribed) return;
    try {
      addLog(`Subscribing as ${recipientId}, listening from ${senderId}...`);
      const handler = await mk.receive(
        recipientId,
        senderId,
        ({from, message: msg}) => {
          setInbox(prev => [{from, message: msg, time: new Date().toLocaleTimeString()}, ...prev]);
          addLog(`New message from ${from}: "${msg}"`);
        },
      );
      setUnsubHandler(() => handler);
      setSubscribed(true);
      addLog('Subscribed. Waiting for messages...');
    } catch (e) {
      addLog(`ERROR: ${e.message}`);
    }
  };

  const handleUnsubscribe = async () => {
    if (!mk || !unsubHandler) return;
    try {
      await mk.stopReceiving(recipientId, senderId, unsubHandler);
      setSubscribed(false);
      setUnsubHandler(null);
      addLog('Unsubscribed from topic.');
    } catch (e) {
      addLog(`ERROR: ${e.message}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.statusBanner, status === 'ready' ? styles.statusOk : styles.statusWarn]}>
        <Text style={styles.statusText}>
          Meshkit: {status}{initError ? ` — ${initError}` : ''}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Title title="mk.send()" subtitle="E2EE Messaging via PubSub" />
        <Card.Content>
          <TextInput label="Sender ID" value={senderId} onChangeText={setSenderId} mode="outlined" style={styles.input} />
          <TextInput label="Recipient ID" value={recipientId} onChangeText={setRecipientId} mode="outlined" style={styles.input} />
          <TextInput label="Message" value={message} onChangeText={setMessage} multiline mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={handleSend} loading={loading} disabled={loading || status !== 'ready'} style={styles.btn}>
            Encrypt and Send
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="mk.receive()" subtitle={`Inbox as: ${recipientId}`} />
        <Card.Content>
          {!subscribed ? (
            <Button mode="contained-tonal" onPress={handleSubscribe} disabled={status !== 'ready'} style={styles.btn}>
              Subscribe to Messages
            </Button>
          ) : (
            <Button mode="outlined" onPress={handleUnsubscribe} style={styles.btn}>
              Unsubscribe
            </Button>
          )}
          {inbox.length === 0 ? (
            <Text style={styles.empty}>No messages yet.</Text>
          ) : (
            inbox.map((msg, i) => (
              <View key={i} style={styles.msgCard}>
                <Text style={styles.msgFrom}>From: {msg.from}</Text>
                <Text style={styles.msgText}>{msg.message}</Text>
                <Text style={styles.msgTime}>{msg.time}</Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Activity Log" />
        <Card.Content>
          {log.length === 0 ? (
            <Text style={styles.empty}>No activity yet.</Text>
          ) : (
            log.map((l, i) => <Text key={i} style={styles.logLine}>{l}</Text>)
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, gap: 12},
  statusBanner: {padding: 8, borderRadius: 6, marginBottom: 4},
  statusOk: {backgroundColor: '#c8e6c9'},
  statusWarn: {backgroundColor: '#fff3e0'},
  statusText: {fontSize: 12, fontWeight: 'bold'},
  card: {marginBottom: 12},
  input: {marginBottom: 8},
  btn: {marginVertical: 6},
  empty: {color: '#999', fontStyle: 'italic', marginTop: 8},
  msgCard: {backgroundColor: '#f0f4ff', padding: 10, borderRadius: 6, marginTop: 8},
  msgFrom: {fontWeight: 'bold', fontSize: 12},
  msgText: {fontSize: 14, marginVertical: 4},
  msgTime: {fontSize: 10, color: '#888'},
  logLine: {fontSize: 11, color: '#444', fontFamily: 'monospace', marginBottom: 2},
});

export default MessagingScreen;
