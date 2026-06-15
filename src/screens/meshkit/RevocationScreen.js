import React, {useState} from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Button, TextInput, Text, Card} from 'react-native-paper';
import {useMeshkit} from '../../meshkit/MeshkitProvider';

const RevocationScreen = () => {
  const {mk, status, error: initError} = useMeshkit();
  const [payload, setPayload] = useState('Sensitive financial data: $$$');
  const [cid, setCid] = useState('');
  const [keyList, setKeyList] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const addLog = msg =>
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

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
      <View style={[styles.statusBanner, status === 'ready' ? styles.statusOk : styles.statusWarn]}>
        <Text style={styles.statusText}>
          Meshkit: {status}{initError ? ` — ${initError}` : ''}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Title title="mk.revoke()" subtitle="Key Destruction" />
        <Card.Content>
          <Text style={styles.note}>
            Phase 1: destroys key in memory. Phase 2 will call LitAdapter.revokeAccess()
            to update on-chain ACL — permanently blocking decryption for everyone.
          </Text>
          <TextInput label="Data to store" value={payload} onChangeText={setPayload} multiline mode="outlined" style={styles.input} />
          <Button mode="contained" onPress={handleStore} loading={loading} disabled={loading || status !== 'ready'} style={styles.btn}>
            Store Encrypted
          </Button>

          {cid ? (
            <>
              <Text style={styles.label}>CID:</Text>
              <Text style={styles.cid} selectable>{cid}</Text>

              <Button mode="outlined" onPress={handleRetrieve} loading={loading} disabled={loading} style={styles.btn}>
                Try Retrieve (should succeed)
              </Button>
              <Button mode="contained" buttonColor="#d32f2f" onPress={handleRevoke} style={styles.btn}>
                REVOKE ACCESS — Destroy Key
              </Button>
              <Button mode="outlined" onPress={handleRetrieve} loading={loading} disabled={loading} style={styles.btn}>
                Try Retrieve Again (should fail)
              </Button>
            </>
          ) : null}
        </Card.Content>
      </Card>

      {/* KeyStore Snapshot — plain View instead of DataTable */}
      <Card style={styles.card}>
        <Card.Title title="KeyStore Snapshot" />
        <Card.Content>
          <Button mode="text" onPress={refreshKeyList} compact style={styles.btn}>
            Refresh
          </Button>
          {keyList.length === 0 ? (
            <Text style={styles.empty}>No keys tracked yet.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.col, styles.colHead]}>CID</Text>
                <Text style={[styles.col, styles.colHead]}>Revoked</Text>
                <Text style={[styles.col, styles.colHead]}>Recipients</Text>
              </View>
              {keyList.map((entry, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                  <Text style={styles.col}>{entry.cid.slice(0, 10)}…</Text>
                  <Text style={[styles.col, entry.revoked && styles.revoked]}>
                    {entry.revoked ? 'Yes' : 'No'}
                  </Text>
                  <Text style={styles.col}>{entry.recipients.length || 'all'}</Text>
                </View>
              ))}
            </>
          )}
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
  note: {fontSize: 12, color: '#666', marginBottom: 12, fontStyle: 'italic'},
  input: {marginBottom: 8},
  btn: {marginVertical: 6},
  label: {fontWeight: 'bold', marginTop: 8, marginBottom: 2},
  cid: {fontSize: 11, fontFamily: 'monospace', color: '#555', marginBottom: 8},
  empty: {color: '#999', fontStyle: 'italic', marginTop: 8},
  tableHeader: {flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ccc', paddingBottom: 4, marginBottom: 4},
  tableRow: {flexDirection: 'row', paddingVertical: 4},
  tableRowAlt: {backgroundColor: '#f5f5f5'},
  col: {flex: 1, fontSize: 12},
  colHead: {fontWeight: 'bold'},
  revoked: {color: '#d32f2f', fontWeight: 'bold'},
  logLine: {fontSize: 11, color: '#444', fontFamily: 'monospace', marginBottom: 2},
});

export default RevocationScreen;
