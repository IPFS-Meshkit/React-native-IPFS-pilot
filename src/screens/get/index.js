import React, {useState} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Button, Text, Card} from 'react-native-paper';
import {useIpfs} from '../../ipfs-http-client';
import {addDirectory, formatError} from '../../ipfs-rn-utils';

const GetScreen = () => {
  const {client} = useIpfs();
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setupAndGet = async () => {
    setLoading(true);
    setError('');
    setFiles([]);
    try {
      const dir = await addDirectory(client, [
        {path: 'get-demo/readme.txt', content: 'README content from get()'},
        {path: 'get-demo/notes.txt', content: 'Notes content from get()'},
      ]);

      const results = [];
      for await (const file of client.get(dir.cid)) {
        if (!file.content) continue;
        const chunks = [];
        for await (const chunk of file.content) {
          chunks.push(chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk));
        }
        const total = chunks.reduce((n, c) => n + c.length, 0);
        const out = new Uint8Array(total);
        let offset = 0;
        for (const c of chunks) {
          out.set(c, offset);
          offset += c.length;
        }
        results.push({
          path: file.path,
          content: new TextDecoder().decode(out),
        });
      }
      setFiles(results);
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
          <Card.Content>
            <Text style={styles.content}>{f.content}</Text>
          </Card.Content>
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
