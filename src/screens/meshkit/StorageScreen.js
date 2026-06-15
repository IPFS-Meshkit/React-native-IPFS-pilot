import React, {useState} from 'react';
import {View, ScrollView, StyleSheet, Alert} from 'react-native';
import {Button, TextInput, Text, Card} from 'react-native-paper';
import {useMeshkit} from '../../meshkit/MeshkitProvider';

const StorageScreen = () => {
  const {mk, status, error: initError} = useMeshkit();
  const [payload, setPayload] = useState('Hello Meshkit! This is encrypted data.');
  const [cid, setCid] = useState('');
  const [retrievedText, setRetrievedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);

  const addLog = msg =>
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleStore = async () => {
    if (!mk) return;
    setLoading(true);
    setRetrievedText('');
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
      {/* Status banner */}
      <View style={[styles.statusBanner, status === 'ready' ? styles.statusOk : styles.statusWarn]}>
        <Text style={styles.statusText}>
          Meshkit: {status}{initError ? ` — ${initError}` : ''}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Title title="mk.store() / mk.retrieve()" subtitle="AES-GCM-256 Encrypted Storage" />
        <Card.Content>
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
            Encrypt and Store on IPFS
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
                Retrieve and Decrypt
              </Button>
            </>
          ) : null}

          {retrievedText ? (
            <>
              <Text style={styles.label}>Decrypted Result:</Text>
              <View style={styles.result}>
                <Text>{retrievedText}</Text>
              </View>
            </>
          ) : null}
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
  input: {marginBottom: 12},
  btn: {marginVertical: 6},
  label: {fontWeight: 'bold', marginTop: 12, marginBottom: 4},
  cid: {fontSize: 11, color: '#555', fontFamily: 'monospace', marginBottom: 8},
  result: {backgroundColor: '#e8f5e9', padding: 8, borderRadius: 6, marginTop: 4},
  empty: {color: '#999', fontStyle: 'italic'},
  logLine: {fontSize: 11, color: '#444', fontFamily: 'monospace', marginBottom: 2},
});

export default StorageScreen;
