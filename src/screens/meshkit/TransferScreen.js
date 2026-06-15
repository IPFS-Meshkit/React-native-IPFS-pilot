import React, {useState} from 'react';
import {View, ScrollView, StyleSheet, Alert} from 'react-native';
import {Button, TextInput, Text, Card} from 'react-native-paper';
import {useMeshkit} from '../../meshkit/MeshkitProvider';

const TransferScreen = () => {
  const {mk, status, error: initError} = useMeshkit();
  const [fileName, setFileName] = useState('tax-ledger.txt');
  const [fileContent, setFileContent] = useState('Q1 Revenue: $120,000\nQ2 Revenue: $145,000');
  const [cid, setCid] = useState('');
  const [recipientId, setRecipientId] = useState('alice@example.com');
  const [downloaderId, setDownloaderId] = useState('alice@example.com');
  const [downloadedText, setDownloadedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState([]);

  const addLog = msg =>
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const handleUpload = async () => {
    if (!mk) return;
    setLoading(true);
    try {
      addLog(`Uploading and encrypting "${fileName}"...`);
      const result = await mk.upload({name: fileName, content: fileContent});
      setCid(result.cid);
      addLog(`Upload done. CID: ${result.cid}`);
    } catch (e) {
      addLog(`ERROR: ${e.message}`);
      Alert.alert('Upload failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!mk || !cid) return;
    try {
      mk.share(cid, recipientId);
      addLog(`Access granted to: ${recipientId}`);
    } catch (e) {
      addLog(`ERROR: ${e.message}`);
    }
  };

  const handleDownload = async () => {
    if (!mk || !cid) return;
    setLoading(true);
    try {
      addLog(`Attempting download as: ${downloaderId}`);
      const bytes = await mk.download(cid, downloaderId);
      const text = new TextDecoder().decode(bytes);
      setDownloadedText(text);
      addLog(`Downloaded and decrypted. ${bytes.length} bytes.`);
    } catch (e) {
      addLog(`DENIED: ${e.message}`);
      Alert.alert('Access Denied', e.message);
    } finally {
      setLoading(false);
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
        <Card.Title title="mk.upload() / mk.share() / mk.download()" subtitle="Access-Controlled File Transfer" />
        <Card.Content>
          <TextInput label="File name" value={fileName} onChangeText={setFileName} mode="outlined" style={styles.input} />
          <TextInput label="File content" value={fileContent} onChangeText={setFileContent} multiline mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={handleUpload} loading={loading} disabled={loading || status !== 'ready'} style={styles.btn}>
            Upload and Encrypt File
          </Button>

          {cid ? (
            <>
              <Text style={styles.label}>File CID:</Text>
              <Text style={styles.cid} selectable>{cid}</Text>

              <TextInput label="Grant access to (recipient ID)" value={recipientId} onChangeText={setRecipientId} mode="outlined" style={styles.input} />
              <Button mode="contained-tonal" onPress={handleShare} style={styles.btn}>
                Share Access
              </Button>

              <TextInput label="Download as (requester ID)" value={downloaderId} onChangeText={setDownloaderId} mode="outlined" style={styles.input} />
              <Button mode="outlined" onPress={handleDownload} loading={loading} disabled={loading} style={styles.btn}>
                Download
              </Button>
            </>
          ) : null}

          {downloadedText ? (
            <>
              <Text style={styles.label}>Decrypted File Content:</Text>
              <View style={styles.result}>
                <Text>{downloadedText}</Text>
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
  input: {marginBottom: 8},
  btn: {marginVertical: 6},
  label: {fontWeight: 'bold', marginTop: 12, marginBottom: 4},
  cid: {fontSize: 11, color: '#555', fontFamily: 'monospace', marginBottom: 8},
  result: {backgroundColor: '#e8f5e9', padding: 8, borderRadius: 6},
  empty: {color: '#999', fontStyle: 'italic'},
  logLine: {fontSize: 11, color: '#444', fontFamily: 'monospace', marginBottom: 2},
});

export default TransferScreen;
