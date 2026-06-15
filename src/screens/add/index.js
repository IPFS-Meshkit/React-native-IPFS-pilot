import React, {useState} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Button, Text, Card} from 'react-native-paper';
import {addTextFile, formatError} from '../../ipfs-rn-utils';

const AddScreen = () => {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg, isError = false) =>
    setLog(prev => [
      `[${new Date().toLocaleTimeString()}] ${isError ? 'ERROR: ' : ''}${msg}`,
      ...prev,
    ]);

  const runAdd = async (label, filename, content) => {
    setLoading(true);
    addLog(`${label} — uploading...`);
    try {
      const result = await addTextFile(filename, content);
      addLog(`${label} OK — CID: ${result.cid}`);
    } catch (err) {
      addLog(`${label} failed: ${formatError(err)}`, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button mode="contained" style={styles.button} loading={loading} disabled={loading}
        onPress={() => runAdd('Add string', 'demo-string.txt', '邑中陽裏人也，姓劉氏。母媼嘗息大澤之陂，夢與神遇')}>
        Add string
      </Button>
      <Button mode="contained" style={styles.button} loading={loading} disabled={loading}
        onPress={() => runAdd('Add numbers', 'demo-numbers.txt', '1,2,3,4,5,6,7,8,9')}>
        Add numbers (as string)
      </Button>
      <Button mode="contained" style={styles.button} loading={loading} disabled={loading}
        onPress={() => runAdd('Add text file', 'demo-hello.txt', 'Hello IPFS from React Native!')}>
        Add hello.txt
      </Button>

      <Card style={styles.card}>
        <Card.Title title="Results" />
        <Card.Content>
          {log.length === 0 ? (
            <Text style={styles.empty}>Tap a button above.</Text>
          ) : (
            log.map((line, i) => (
              <Text key={i} style={[styles.logLine, line.includes('ERROR') && styles.errorLine]}>{line}</Text>
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, gap: 12},
  button: {marginVertical: 4},
  card: {marginTop: 8},
  empty: {color: '#999', fontStyle: 'italic'},
  logLine: {fontSize: 12, fontFamily: 'monospace', marginBottom: 4},
  errorLine: {color: '#c62828'},
});

export default AddScreen;
