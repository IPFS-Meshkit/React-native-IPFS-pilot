import React, {useState, useCallback} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Button, TextInput, Text, Card, Chip} from 'react-native-paper';
import {useMeshkit} from '../../meshkit/MeshkitProvider';

const MessagingScreen = () => {
  const {mk, status} = useMeshkit();
  const [senderId, setSenderId] = useState('bob');
  const [recipientId, setRecipientId] = useState('alice');
  const [message, setMessage] = useState('Hey Alice! This is E2EE via Meshkit.');
  const [subscribed, setSubscribed] = useState(false);
  const [unsubHandler, setUnsubHandler] = useState(null);
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);

  const addLog = msg => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleSend = async () => {
    if (!mk) return;
    setLoading(true);
    try {
      addLog(`Encrypting message from ${senderId} → ${recipientId}...`);
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
      addLog(`Subscribing as ${recipientId}, listening for messages from ${senderId}...`);
      const handler = await mk.receive(recipientId, senderId, ({from, message: msg, timestamp}) => {
        setInbox(prev => [{from, message: msg, timestamp}, ...prev]);
        addLog(`New message from ${from}: "${msg}"`);
      });
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
      <Card style={styles.card}>
        <Card.Title title="mk.send() / mk.receive()" subtitle="E2EE Messaging via PubSub" />
        <Card.Content>
          <Chip icon="message-lock" style={styles.chip}>AES-GCM-256 E2EE · Phase 1 (shared-secret)</Chip>
          <TextInput label="Sender ID" value={senderId} onChangeText={setSenderId} mode="outlined" style={styles.input} />
          <TextInput label="Recipient ID" value={recipientId} onChangeText={setRecipientId} mode="outlined" style={styles.input} />
          <TextInput label="Message" value={message} onChangeText={setMessage} multiline mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={handleSend} loading={loading} disabled={loading || status !== 'ready'} style={styles.btn} icon="send-lock">
            Encrypt & Send
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Inbox" subtitle={`Listening as: ${recipientId}`} />
        <Card.Content>
          {!subscribed ? (
            <Button mode="contained-tonal" onPress={handleSubscribe} disabled={status !== 'ready'} style={styles.btn} icon="bell">
              Subscribe to Messages
            </Button>
          ) : (
            <Button mode="outlined" onPress={handleUnsubscribe} style={styles.btn} icon="bell-off">
              Unsubscribe
            </Button>
          )}
          {inbox.length === 0 ? (
            <Text style={styles.empty}>No messages yet.</Text>
          ) : (
            inbox.map((msg, i) => (
              <Card key={i} style={styles.msgCard}>
                <Card.Content>
                  <Text style={styles.msgFrom}>From: {msg.from}</Text>
                  <Text style={styles.msgText}>{msg.message}</Text>
                  <Text style={styles.msgTime}>{new Date(msg.timestamp).toLocaleTimeString()}</Text>
                </Card.Content>
              </Card>
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Activity Log" />
        <Card.Content>
          {log.map((l, i) => (
            <Text key={i} style={styles.logLine}>{l}</Text>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, gap: 12},
  card: {marginBottom: 12},
  chip: {marginBottom: 12, alignSelf: 'flex-start'},
  input: {marginBottom: 8},
  btn: {marginVertical: 6},
  empty: {color: '#999', fontStyle: 'italic', marginTop: 8},
  msgCard: {marginTop: 8, backgroundColor: '#f0f4ff'},
  msgFrom: {fontWeight: 'bold', fontSize: 12},
  msgText: {fontSize: 14, marginVertical: 4},
  msgTime: {fontSize: 10, color: '#888'},
  logLine: {fontSize: 11, color: '#444', fontFamily: 'monospace', marginBottom: 2},
});

export default MessagingScreen;
