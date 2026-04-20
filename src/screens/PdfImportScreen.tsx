import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Appbar, Button, Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ImportStackParamList } from '@/navigation/AppNavigator';
import { parseBankStatement } from '@/services/pdfParser';

// react-native-webview requires a development build — not available in Expo Go
let WebView: any = null;
try {
  WebView = require('react-native-webview').WebView;
} catch {
  WebView = null;
}

type Nav = NativeStackNavigationProp<ImportStackParamList, 'PdfImport'>;

export default function PdfImportScreen() {
  const theme = useTheme();
  const nav = useNavigation<Nav>();
  const webViewRef = useRef<any>(null);
  const [status, setStatus] = useState<'idle' | 'picking' | 'extracting' | 'parsing'>('idle');
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  async function pickPdf() {
    setStatus('picking');
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) {
      setStatus('idle');
      return;
    }
    setPdfUri(result.assets[0].uri);
    setStatus('extracting');
  }

  function handleWebViewMessage(event: { nativeEvent: { data: string } }) {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      if (payload.type === 'text') {
        setStatus('parsing');
        const rows = parseBankStatement(payload.text);
        if (rows.length === 0) {
          Alert.alert('No Transactions Found', 'Could not detect any transactions in this PDF. Try a different file or add transactions manually.');
          setStatus('idle');
          setPdfUri(null);
          return;
        }
        nav.navigate('ImportReview', { parsedRows: rows });
        setStatus('idle');
        setPdfUri(null);
      } else if (payload.type === 'error') {
        Alert.alert('PDF Error', payload.message ?? 'Could not read this PDF file.');
        setStatus('idle');
        setPdfUri(null);
      }
    } catch {
      setStatus('idle');
    }
  }

  const viewerHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
    <script>
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      async function extractText(uri) {
        try {
          const loadingTask = pdfjsLib.getDocument(uri);
          const pdf = await loadingTask.promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(' ') + '\\n';
          }
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'text', text: fullText }));
        } catch(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message }));
        }
      }
      document.addEventListener('message', function(e) { extractText(e.data); });
      window.addEventListener('message', function(e) { extractText(e.data); });
    </script>
    </body>
    </html>
  `;

  if (!WebView) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header>
          <Appbar.Content title="Import Bank Statement" />
        </Appbar.Header>
        <View style={styles.body}>
          <MaterialCommunityIcons name="information-outline" size={64} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.4 }} />
          <Text variant="titleMedium" style={{ textAlign: 'center', marginTop: 16 }}>Not available in Expo Go</Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            PDF import requires a full development build. Build the APK using:
          </Text>
          <Text variant="bodySmall" style={[styles.code, { backgroundColor: theme.colors.surfaceVariant }]}>
            eas build --platform android --profile preview
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.Content title="Import Bank Statement" />
      </Appbar.Header>

      <View style={styles.body}>
        <MaterialCommunityIcons name="file-pdf-box" size={80} color={theme.colors.primary} style={{ opacity: 0.7 }} />
        <Text variant="headlineSmall" style={styles.title}>Import from PDF</Text>
        <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Pick your bank statement PDF. Transactions will be extracted automatically.
        </Text>
        <Text variant="labelSmall" style={[styles.note, { color: theme.colors.onSurfaceVariant }]}>
          Supported: HDFC, SBI, ICICI, Axis and most Indian banks
        </Text>

        {status === 'idle' && (
          <Button mode="contained" icon="file-upload" onPress={pickPdf} style={styles.btn}>
            Pick PDF File
          </Button>
        )}

        {(status === 'picking' || status === 'extracting' || status === 'parsing') && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" />
            <Text variant="bodyMedium" style={{ marginTop: 12 }}>
              {status === 'picking' ? 'Opening file picker...' : status === 'extracting' ? 'Extracting transactions...' : 'Analysing data...'}
            </Text>
          </View>
        )}
      </View>

      {pdfUri && status === 'extracting' && WebView && (
        <WebView
          ref={webViewRef}
          style={styles.hidden}
          source={{ html: viewerHtml }}
          onMessage={handleWebViewMessage}
          onLoad={() => {
            webViewRef.current?.postMessage(pdfUri);
          }}
          originWhitelist={['*']}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  note: { textAlign: 'center', opacity: 0.6 },
  btn: { marginTop: 8, paddingHorizontal: 16 },
  loadingWrap: { alignItems: 'center', gap: 8 },
  hidden: { width: 0, height: 0, position: 'absolute' },
  code: { padding: 12, borderRadius: 8, fontFamily: 'monospace', textAlign: 'center', width: '100%' },
});
