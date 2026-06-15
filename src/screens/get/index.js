import React, {useState} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Button, Text, Card} from 'react-native-paper';
import {addDirectory, getDirectoryFiles, formatError} from '../../ipfs-rn-utils';

const GetScreen = () => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setupAndGet = async () => {
    setLoading(true);
    setError('');
    setFiles([]);
    try {
      const dir = await addDirectory([
        {path: 'get-demo/readme.txt', content: 'README content from get()'},
        {path: 'get-demo/notes.txt', content: 'Notes content from get()'},
      ]);
      setFiles(await getDirectoryFiles(dir.cid));
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button mode="contained" loading={loading} disabled={loading} onPress={setupAndGet}>
        Create folder and get()
      </Button>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {files.map((f, i) => (
        <Card key={i} style={styles.card}>
          <Card.Title title={f.path} />
          <Card.Content><Text style={styles.content}>{f.content}</Text></Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, gap: 12},
  error: {color: '#c62828', fontSize: 13},
  card: {backgroundColor: '#e8f5e9'},
  content: {fontFamily: 'monospace', fontSize: 13},
});

export default GetScreen;
