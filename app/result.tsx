import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlasticScanResult, PlasticItem } from '../services/types';

const MARKER_COLORS = [
  '#FF3B30', '#007AFF', '#FF9500', '#34C759', '#AF52DE',
  '#FF2D55', '#5856D6', '#00BCD4', '#FFCC00', '#8E8E93',
];

function getStatusColor(status: string): { color: string; bg: string } {
  if (status === 'CONDITIONAL') return { color: '#FF9500', bg: 'rgba(255,149,0,0.12)' };
  if (status === 'NON_RECYCLABLE') return { color: '#FF3B30', bg: 'rgba(255,59,48,0.12)' };
  return { color: '#4CAF50', bg: 'rgba(76,175,80,0.12)' };
}

export default function ResultScreen() {
  const { result, imageUri, isHistory, modelName, processingTime } = useLocalSearchParams<{
    result: string;
    imageUri: string;
    isHistory: string;
    modelName: string;
    processingTime: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  if (!result || !imageUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading result data.</Text>
      </View>
    );
  }

  const analysis: PlasticScanResult = JSON.parse(result);
  const items = analysis.items;
  const heroHeight = 360;

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Hero image with numbered markers */}
      <View style={[styles.heroContainer, { height: heroHeight }]}>
        <Image source={{ uri: imageUri }} style={styles.heroImage} />

        {/* Numbered markers overlay */}
        {items.map((item, index) => {
          const markerColor = MARKER_COLORS[index % MARKER_COLORS.length];
          return (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.marker,
                {
                  left: `${Math.min(Math.max(item.position.x, 5), 90)}%`,
                  top: `${Math.min(Math.max(item.position.y, 5), 90)}%`,
                  backgroundColor: markerColor,
                  borderColor: '#FFF',
                },
              ]}
              onPress={() => setExpandedItem(expandedItem === index ? null : index)}
              activeOpacity={0.8}
            >
              <Text style={styles.markerText}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.heroGradient} />

        {/* Item count badge */}
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{items.length} item{items.length !== 1 ? 's' : ''} found</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Meta row */}
        <View style={styles.metaRow}>
          {!!modelName && <Text style={styles.metaChip}>{modelName}</Text>}
          {!!processingTime && Number(processingTime) > 0 && (
            <Text style={styles.metaChip}>{Math.round(Number(processingTime) / 1000)}s</Text>
          )}
        </View>

        {/* Summary */}
        {analysis.summary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Summary</Text>
            <Text style={styles.summaryText}>{analysis.summary}</Text>
          </View>
        )}

        {/* Item cards */}
        {items.map((item, index) => {
          const markerColor = MARKER_COLORS[index % MARKER_COLORS.length];
          const { color: statusColor, bg: statusBg } = getStatusColor(item.status);
          const isExpanded = expandedItem === index;

          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.itemCard, isExpanded && styles.itemCardExpanded]}
              activeOpacity={0.8}
              onPress={() => setExpandedItem(isExpanded ? null : index)}
            >
              {/* Item header */}
              <View style={styles.itemHeader}>
                <View style={[styles.itemMarker, { backgroundColor: markerColor }]}>
                  <Text style={styles.itemMarkerText}>{item.label}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemName}>{item.plastic_type}</Text>
                  <View style={styles.itemMetaRow}>
                    {item.resin_code && (
                      <View style={styles.resinPill}>
                        <Text style={styles.resinPillText}>#{item.resin_code}</Text>
                      </View>
                    )}
                    <Text style={styles.itemScore}>{item.score}/10</Text>
                    <Text style={styles.itemConfidence}>{(item.confidence * 100).toFixed(0)}%</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>

              {/* Expanded detail */}
              {isExpanded && (
                <View style={styles.itemDetail}>
                  <View style={styles.recommendationCard}>
                    <Text style={styles.recommendationLabel}>Recommendation</Text>
                    <Text style={styles.recommendationText}>{item.recommendation}</Text>
                  </View>

                  <DetailRow label="Recyclability" value={item.recyclability} />
                  <DetailRow label="Color" value={item.color_analysis} />
                  <DetailRow label="Surface" value={item.surface_analysis} />
                  <DetailRow label="Shape" value={item.shape_analysis} />

                  {item.contaminants.length > 0 && (
                    <View style={styles.contaminantsSection}>
                      <Text style={styles.detailLabel}>Contaminants</Text>
                      {item.contaminants.map((c, i) => (
                        <View key={i} style={styles.contaminantRow}>
                          <View style={styles.contaminantDot} />
                          <Text style={styles.contaminantText}>{c}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Expand indicator */}
              <Text style={styles.expandIndicator}>{isExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          );
        })}

        {/* Action button */}
        <TouchableOpacity
          style={[styles.actionButton, { marginBottom: insets.bottom + 24 }]}
          activeOpacity={0.8}
          onPress={() => router.navigate('/(tabs)')}
        >
          <Text style={styles.actionButtonText}>
            {isHistory === 'true' ? 'Back to History' : 'Scan Again'}
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
  heroImage: { width: '100%', height: '100%', backgroundColor: '#E5E5EA' },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
    backgroundColor: 'transparent',
  },

  // Markers
  marker: {
    position: 'absolute',
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
    transform: [{ translateX: -16 }, { translateY: -16 }],
    shadowColor: '#000', shadowOpacity: 0.4, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4,
    elevation: 5,
  },
  markerText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  // Count badge
  countBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
  },
  countBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  // Content
  content: { padding: 20, marginTop: -28, backgroundColor: '#F2F2F7', borderTopLeftRadius: 28, borderTopRightRadius: 28 },

  // Meta
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  metaChip: {
    fontSize: 13, fontWeight: '600', color: '#8E8E93',
    backgroundColor: 'rgba(142,142,147,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },

  // Summary
  summaryCard: {
    backgroundColor: '#0277BD', borderRadius: 16, padding: 18, marginBottom: 16,
  },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  summaryText: { fontSize: 16, color: '#FFF', fontWeight: '500', lineHeight: 24 },

  // Item cards
  itemCard: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 12, elevation: 2,
  },
  itemCardExpanded: {
    shadowOpacity: 0.08,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center' },
  itemMarker: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  itemMarkerText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  itemName: { fontSize: 17, fontWeight: '700', color: '#1C1C1E' },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  resinPill: {
    backgroundColor: 'rgba(0,188,212,0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  resinPillText: { fontSize: 12, fontWeight: '700', color: '#00BCD4' },
  itemScore: { fontSize: 14, fontWeight: '600', color: '#3A3A3C' },
  itemConfidence: { fontSize: 13, color: '#8E8E93' },

  // Status badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // Expanded detail
  itemDetail: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F2F2F7' },

  // Recommendation
  recommendationCard: {
    backgroundColor: 'rgba(2,119,189,0.08)', borderRadius: 12, padding: 14, marginBottom: 16,
  },
  recommendationLabel: { fontSize: 11, fontWeight: '700', color: '#0277BD', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  recommendationText: { fontSize: 15, color: '#1C1C1E', lineHeight: 22 },

  // Detail rows
  detailRow: { marginBottom: 14 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  detailValue: { fontSize: 15, color: '#1C1C1E', lineHeight: 22 },

  // Contaminants
  contaminantsSection: { marginTop: 2 },
  contaminantRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4, gap: 8 },
  contaminantDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF9500', marginTop: 7 },
  contaminantText: { fontSize: 15, color: '#1C1C1E', flex: 1, lineHeight: 22 },

  // Expand indicator
  expandIndicator: { textAlign: 'center', color: '#C7C7CC', fontSize: 12, marginTop: 8 },

  // Action button
  actionButton: {
    backgroundColor: '#1C1C1E', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 4,
  },
  actionButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600' },
});
