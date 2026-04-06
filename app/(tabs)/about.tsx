import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroSection}>
        <Text style={styles.heroEmoji}>🔬</Text>
        <Text style={styles.heroTitle}>Visual Quality Inspector</Text>
        <Text style={styles.heroSubtitle}>
          On-device AI fruit analysis powered by Gemma 4
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>How It Works</Text>
        <Text style={styles.cardText}>
          Point your camera at a fruit and tap the capture button. The Gemma 4 model
          runs entirely on your device — no cloud, no internet required. It evaluates
          color, shape, surface condition, and defects in seconds.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mobile vs. Industrial Sensors</Text>
        <Text style={styles.cardText}>
          While this app evaluates visible traits using your RGB camera, industrial
          systems use Near-Infrared (NIR) or Hyperspectral imaging for deeper analysis.
        </Text>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Feature</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Mobile</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Industrial</Text>
          </View>
          <TableRow cells={['Hardware', 'RGB Camera', 'NIR / HSI']} />
          <TableRow cells={['Metrics', 'Skin, Color', 'Brix, Moisture']} />
          <TableRow cells={['Accuracy', '~85%', '>95%']} last />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerPill}>
          <Text style={styles.footerPillText}>Powered locally by Gemma 4 E4B</Text>
        </View>
        <Text style={styles.footerNote}>All processing happens on-device. No data leaves your phone.</Text>
      </View>
    </ScrollView>
  );
}

function TableRow({ cells, last = false }: { cells: [string, string, string]; last?: boolean }) {
  return (
    <View style={[styles.tableRow, last && styles.tableRowLast]}>
      <Text style={[styles.tableCell, styles.tableCellLabel]}>{cells[0]}</Text>
      <Text style={styles.tableCell}>{cells[1]}</Text>
      <Text style={styles.tableCell}>{cells[2]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 20 },

  // Hero
  heroSection: { alignItems: 'center', marginBottom: 28, marginTop: 8 },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center', marginTop: 6, lineHeight: 24 },

  // Cards
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 12, elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
  cardText: { fontSize: 15, color: '#3A3A3C', lineHeight: 23 },

  // Table
  table: { marginTop: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F9F9FB' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#EDEDF0', paddingVertical: 10, paddingHorizontal: 12 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#EDEDF0' },
  tableRowLast: { borderBottomWidth: 0 },
  tableCell: { flex: 1, fontSize: 14, color: '#1C1C1E' },
  tableHeaderText: { fontWeight: '700', color: '#3A3A3C', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.3 },
  tableCellLabel: { fontWeight: '600', color: '#8E8E93' },

  // Footer
  footer: { alignItems: 'center', marginTop: 16 },
  footerPill: { backgroundColor: 'rgba(0,122,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  footerPillText: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  footerNote: { fontSize: 13, color: '#C7C7CC', marginTop: 10, textAlign: 'center' },
});
