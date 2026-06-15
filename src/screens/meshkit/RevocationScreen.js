import React, {useState} from 'react';
import {ScrollView, StyleSheet} from 'react-native';
import {Button, TextInput, Text, Card, Chip, DataTable} from 'react-native-paper';
import {useMeshkit} from '../../meshkit/MeshkitProvider';

const RevocationScreen = () => {
  const {mk, status} = useMeshkit();
  const [payload, setPayload] = useState('Sensitive financial data: $$$');
  const [cid, setCid] = useState('');
  const [keyList, setKeyList] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = msg => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  const refreshKeyList = () => setKeyList(mk ? mk.listKeys() : []);

  const handleStore = async () => {
    if (!mk) return;
    setLoading(true);
    try {
      const result = await mk.store(payload);
      setCid(result.cid);
      addLog(`Stored. CID: ${result.cid}`);
      refreshKeyList();
    } catch (e) {
      addLog(`ERROR: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrieve = async () => {
    if (!mk || !cid) return;
    setLoading(true);
    try {
      const bytes = await mk.retrieve(cid);
      const text = new TextDecoder().decode(bytes);
      addLog(`Retrieved OK: "${text}"`);
    } catch (e) {
      addLog(`BLOCKED: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = () => {
    if (!mk || !cid) return;
    try {
      mk.revoke(cid);
      addLog(`Key destroyed for CID: ${cid}`);
      addLog('IPFS data still exists but is now permanently undecipherable.');
      refreshKeyList();
    } catch (e) {
      addLog(`ERROR: ${e.message}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="mk.revoke()" subtitle="Key Destruction / Access Revocation" />
        <Card.Content>
          <Chip icon="key-remove" style={styles.chip}>Phase 1 — in-memory KeyStore</Chip>
          <Text style={styles.note}>
            Phase 2 will call LitAdapter.revokeAccess() to update the on-chain ACL,
            making the data undecipherable even if someone has a cached copy.
          </Text>
          <TextInput label="Data to store" value={payload} onChangeText={setPayload} multiline mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={handleStore} loading={loading} disabled={loading || status !== 'ready'} style={styles.btn}>
            Store Encrypted
          </Button>
          {cid ? (
            <>
              <Text style={styles.label}>CID: <Text style={styles.cid}>{cid}</Text></Text>
              <Button mode="outlined" onPress={handleRetrieve} loading={loading} disabled={loading} style={styles.btn} icon="download">
                Try Retrieve (should succeed)
              </Button>
              <Button mode="contained" buttonColor="#d32f2f" onPress={handleRevoke} style={styles.btn} icon="key-remove">
                REVOKE ACCESS
              </Button>
              <Button mode="outlined" onPress={handleRetrieve} loading={loading} disabled={loading} style={styles.btn} icon="download">
                Try Retrieve Again (should fail)
              </Button>
            </>
          ) : null}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="KeyStore Snapshot" />
        <Card.Content>
          <Button mode="text" onPress={refreshKeyList} icon="refresh" compact style={styles.btn}>
            Refresh
          </Button>
          {keyList.length === 0 ? (
            <Text style={styles.empty}>No keys tracked yet.</Text>
          ) : (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>CID (truncated)</DataTable.Title>
                <DataTable.Title>Revoked</DataTable.Title>
                <DataTable.Title>Recipients</DataTable.Title>
              </DataTable.Header>
              {keyList.map((entry, i) => (
                <DataTable.Row key={i}>
                  <DataTable.Cell>{entry.cid.slice(0, 12)}…</DataTable.Cell>
                  <DataTable.Cell>{entry.revoked ? '🔴 Yes' : '🟢 No'}</DataTable.Cell>
                  <DataTable.Cell>{entry.recipients.length || 'all'}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
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
  note: {fontSize: 12, color: '#666', marginBottom: 12, fontStyle: 'italic'},
  input: {marginBottom: 8},
  btn: {marginVertical: 6},
  label: {fontWeight: 'bold', marginTop: 8},
  cid: {fontSize: 11, fontFamily: 'monospace', color: '#555'},
  empty: {color: '#999', fontStyle: 'italic', marginTop: 8},
  logLine: {fontSize: 11, color: '#444', fontFamily: 'monospace', marginBottom: 2},
});

export default RevocationScreen;
