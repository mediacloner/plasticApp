import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FruitAnalysisResult } from '../services/types';

export default function ResultScreen() {
  const { result, imageUri, isHistory } = useLocalSearchParams<{result: string, imageUri: string, isHistory: string}>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!result || !imageUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading result data.</Text>
      </View>
    );
  }

  const analysis: FruitAnalysisResult = JSON.parse(result);

  let statusColor = '#34C759';
  let statusBg = 'rgba(52,199,89,0.12)';
  if (analysis.status === 'ACCEPTABLE') { statusColor = '#FF9500'; statusBg = 'rgba(255,149,0,0.12)'; }
  if (analysis.status === 'BAD') { statusColor = '#FF3B30'; statusBg = 'rgba(255,59,48,0.12)'; }

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.heroContainer}>
        <Image source={{ uri: imageUri }} style={styles.heroImage} />
        <View style={styles.heroGradient} />
      </View>

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fruitName}>{analysis.fruit}</Text>
            <View style={styles.metricsRow}>
              <Text style={styles.scoreValue}>{analysis.score}</Text>
              <Text style={styles.scoreLabel}>/10</Text>
              <View style={styles.metricDivider} />
              <Text style={styles.confidenceText}>{(analysis.confidence * 100).toFixed(0)}% confidence</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{analysis.status}</Text>
          </View>
        </View>

        {/* Recommendation highlight */}
        <View style={styles.recommendationCard}>
          <Text style={styles.recommendationLabel}>Recommendation</Text>
          <Text style={styles.recommendationText}>{analysis.recommendation}</Text>
        </View>

        {/* Detail sections */}
        <View style={styles.detailCard}>
          <DetailRow label="Ripeness" value={analysis.ripeness} />
          <DetailRow label="Color" value={analysis.color_analysis} />
          <DetailRow label="Surface" value={analysis.surface_analysis} />
          <DetailRow label="Shape" value={analysis.shape_analysis} />

          <View style={styles.defectsSection}>
            <Text style={styles.detailLabel}>Defects</Text>
            {analysis.defects.length > 0 ? (
              analysis.defects.map((d, i) => (
                <View key={i} style={styles.defectRow}>
                  <View style={styles.defectDot} />
                  <Text style={styles.defectText}>{d}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDefects}>None detected</Text>
            )}
          </View>
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={[styles.actionButton, { marginBottom: insets.bottom + 24 }]}
          activeOpacity={0.8}
          onPress={() => router.navigate('/(tabs)')}
        >
          <Text style={styles.actionButtonText}>
            {isHistory === 'true' ? 'Back to History' : 'Scan Another Fruit'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  errorText: { fontSize: 16, color: '#8E8E93', textAlign: 'center', marginTop: 100 },

  // Hero
  heroContainer: { position: 'relative' },
  heroImage: { width: '100%', height: 320, backgroundColor: '#E5E5EA' },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'transparent',
  },

  // Content
  content: { padding: 20, marginTop: -28, backgroundColor: '#F2F2F7', borderTopLeftRadius: 28, borderTopRightRadius: 28 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  fruitName: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  metricsRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  scoreValue: { fontSize: 24, fontWeight: '700', color: '#1C1C1E' },
  scoreLabel: { fontSize: 16, fontWeight: '500', color: '#8E8E93', marginRight: 12 },
  metricDivider: { width: 1, height: 16, backgroundColor: '#D1D1D6', marginRight: 12, alignSelf: 'center' },
  confidenceText: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },

  // Status badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 4,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  // Recommendation
  recommendationCard: {
    backgroundColor: '#007AFF', borderRadius: 16, padding: 18, marginBottom: 16,
  },
  recommendationLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  recommendationText: { fontSize: 16, color: '#FFF', fontWeight: '500', lineHeight: 24 },

  // Detail card
  detailCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 12, elevation: 2,
  },
  detailRow: { marginBottom: 18 },
  detailLabel: { fontSize: 12, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 16, color: '#1C1C1E', lineHeight: 24 },

  // Defects
  defectsSection: { marginTop: 2 },
  defectRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6, gap: 8 },
  defectDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30', marginTop: 8 },
  defectText: { fontSize: 16, color: '#1C1C1E', flex: 1, lineHeight: 24 },
  noDefects: { fontSize: 16, color: '#34C759', fontWeight: '500', marginTop: 4 },

  // Action button
  actionButton: {
    backgroundColor: '#1C1C1E', borderRadius: 16, padding: 18, alignItems: 'center',
  },
  actionButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
});
