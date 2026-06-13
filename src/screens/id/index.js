import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Text, Alert} from 'react-native';
import {Button, Card} from 'react-native-paper';
import {useIpfs} from '../../ipfs-http-client';

const IdScreen = () => {
  const {client} = useIpfs();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const id = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const data = await client.id();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err.message || String(err));
      Alert.alert('Error', err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button mode="contained" loading={loading} onPress={id}>
        Call ipfs.id()
      </Button>
      {error ? (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      ) : null}
      {result ? (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Text style={styles.resultText}>{result}</Text>
          </Card.Content>
        </Card>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16, gap: 12},
  resultCard: {marginTop: 12, backgroundColor: '#e8f5e9'},
  errorCard: {marginTop: 12, backgroundColor: '#ffebee'},
  resultText: {fontFamily: 'monospace', fontSize: 12},
  errorText: {color: 'red', fontSize: 13},
});

export default IdScreen;
