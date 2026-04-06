import React from 'react';
import { ScrollView, Text, StyleSheet, View, Image } from 'react-native';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Visual Quality Inspector</Text>
      <Text style={styles.description}>
        This on-device visual evaluation tool is a proxy for industrial inspection technology.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mobile Vision vs. Industrial Sensors</Text>
        <Text style={styles.cardText}>
          While this smartphone demo evaluates shape, external color, bruises, and mold using RGB cameras, true industrial setups utilize Near-Infrared (NIR) or Hyperspectral imaging to look deeper.
        </Text>
        
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableHeader]}>Feature</Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>Mobile App</Text>
          <Text style={[styles.tableCell, styles.tableHeader]}>Industrial</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Hardware</Text>
          <Text style={styles.tableCell}>RGB</Text>
          <Text style={styles.tableCell}>NIR</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Metrics</Text>
          <Text style={styles.tableCell}>Skin, Color</Text>
          <Text style={styles.tableCell}>Brix, Moisture</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Accuracy</Text>
          <Text style={styles.tableCell}>~85%</Text>
          <Text style={styles.tableCell}>{'>'}95%</Text>
        </View>
      </View>

      <Text style={styles.footerText}>Powered Locally by Gemma 4</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 20,
    alignItems: 'center'
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#3A3A3C',
    marginBottom: 24,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 22,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
  },
  tableHeader: {
    fontWeight: 'bold',
    color: '#3A3A3C',
  },
  footerText: {
    marginTop: 40,
    fontSize: 14,
    color: '#C7C7CC',
    fontWeight: '500'
  }
});
