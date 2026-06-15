import React, {useState} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Button, Text, Card} from 'react-native-paper';
import {useIpfs} from '../../ipfs-http-client';
import {addDirectory, lsEntries, formatError} from '../../ipfs-rn-utils';

const LsScreen = () => {
  const {client} = useIpfs();
  const [entries, setEntries] = useState([]);
  const [dirCid, setDirCid] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setupAndLs = async () => {
    setLoading(true);
    setError('');
    setEntries([]);
    try {
      const dir = await addDirectory(client, [
        {path: 'demo-folder/file1.txt', content: 'First file'},
        {path: 'demo-folder/file2.txt', content: 'Second file'},
      ]);
      setDirCid(dir.cid);
      const list = await lsEntries(client, dir.cid);
      setEntries(list);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button mode="contained" loading={loading} disabled={loading} onPress={setupAndLs}>
        Create folder and ls()
      </Button>

      {dirCid ? <Text style={styles.cid}>Directory CID: {dirCid}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {entries.length > 0 ? (
        <Card style={styles.card}>
          <Card.Title title={`ls() — ${entries.length} entries`} />
          <Card.Content>
            {entries.map((e, i) => (
              <Text key={i} style={styles.entry}>
                {e.type}: {e.name} ({e.size} bytes)
              </Text>
            ))}
          </Card.Content>
        </Card>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, gap: 12},
  cid: {fontSize: 11, fontFamily: 'monospace', color: '#555'},
  error: {color: '#c62828', fontSize: 13},
  card: {backgroundColor: '#e8f5e9'},
  entry: {fontSize: 13, fontFamily: 'monospace', marginBottom: 4},
});

export default LsScreen;
