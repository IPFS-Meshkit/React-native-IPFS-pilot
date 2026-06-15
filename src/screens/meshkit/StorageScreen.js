import React, {useState} from 'react';
import {View, ScrollView, StyleSheet, Alert} from 'react-native';
import {Button, TextInput, Text, Card, Chip} from 'react-native-paper';
import {useMeshkit} from '../../meshkit/MeshkitProvider';

const StorageScreen = () => {
  const {mk, status} = useMeshkit();
  const [payload, setPayload] = useState('Hello Meshkit! This is encrypted data.');
  const [cid, setCid] = useState('');
  const [retrievedText, setRetrievedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);

  const addLog = msg => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleStore = async () => {
    if (!mk) return;
    setLoading(true);
    try {
      addLog('Encrypting payload with AES-GCM-256...');
      const result = await mk.store(payload);
      setCid(result.cid);
      addLog(`Fragmented into ${result.manifest.chunkCount} chunk(s).`);
      addLog(`Stored! Manifest CID: ${result.cid}`);
    } catch (e) {
      addLog(`ERROR: ${e.message}`);
      Alert.alert('Store failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieve = async () => {
    if (!mk || !cid) return;
    setLoading(true);
    try {
      addLog(`Retrieving CID: ${cid}`);
      const bytes = await mk.retrieve(cid);
      const text = new TextDecoder().decode(bytes);
      setRetrievedText(text);
      addLog(`Decrypted successfully. ${bytes.length} bytes.`);
    } catch (e) {
      addLog(`ERROR: ${e.message}`);
      Alert.alert('Retrieve failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="mk.store() / mk.retrieve()" subtitle="Encrypted Storage" />
        <Card.Content>
          <Chip icon="lock" style={styles.chip}>AES-GCM-256 · Phase 1</Chip>
          <TextInput
            label="Payload to store"
            value={payload}
            onChangeText={setPayload}
            multiline
            style={styles.input}
            mode="outlined"
          />
          <Button
            mode="contained"
            onPress={handleStore}
            loading={loading}
            disabled={loading || status !== 'ready'}
            style={styles.btn}>
            Encrypt & Store on IPFS
          </Button>

          {cid ? (
            <>
              <Text style={styles.label}>Manifest CID:</Text>
              <Text style={styles.cid} selectable>{cid}</Text>
              <Button
                mode="outlined"
                onPress={handleRetrieve}
                loading={loading}
                disabled={loading}
                style={styles.btn}>
                Retrieve & Decrypt
              </Button>
            </>
          ) : null}

          {retrievedText ? (
            <>
              <Text style={styles.label}>Decrypted Result:</Text>
              <Text style={styles.result}>{retrievedText}</Text>
            </>
          ) : null}
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
  input: {marginBottom: 12},
  btn: {marginVertical: 6},
  label: {fontWeight: 'bold', marginTop: 12, marginBottom: 4},
  cid: {fontSize: 11, color: '#555', fontFamily: 'monospace', marginBottom: 8},
  result: {backgroundColor: '#e8f5e9', padding: 8, borderRadius: 6, marginTop: 4},
  logLine: {fontSize: 11, color: '#444', fontFamily: 'monospace', marginBottom: 2},
});

export default StorageScreen;
