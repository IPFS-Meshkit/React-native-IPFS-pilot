import React, {useState} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Button, TextInput, Text, Card} from 'react-native-paper';
import {addTextFile, catToString, formatError} from '../../ipfs-rn-utils';

const CatScreen = () => {
  const [cid, setCid] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setupAndCat = async () => {
    setLoading(true);
    setError('');
    setContent('');
    try {
      const added = await addTextFile('cat-demo.txt', 'Cat demo content — ' + Date.now());
      setCid(added.cid);
      setContent(await catToString(added.cid));
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  const catByCid = async () => {
    if (!cid.trim()) {
      setError('Enter a CID first');
      return;
    }
    setLoading(true);
    setError('');
    setContent('');
    try {
      setContent(await catToString(cid.trim()));
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button mode="contained" loading={loading} disabled={loading} onPress={setupAndCat}>
        Add test file and cat it
      </Button>
      <TextInput label="CID to cat" value={cid} onChangeText={setCid} mode="outlined" style={styles.input} />
      <Button mode="outlined" loading={loading} disabled={loading} onPress={catByCid}>
        Cat this CID
      </Button>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {content ? (
        <Card style={styles.card}>
          <Card.Title title="Content" />
          <Card.Content><Text style={styles.content}>{content}</Text></Card.Content>
        </Card>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, gap: 12},
  input: {marginVertical: 8},
  error: {color: '#c62828', fontSize: 13},
  card: {backgroundColor: '#e8f5e9'},
  content: {fontFamily: 'monospace', fontSize: 13},
});

export default CatScreen;
