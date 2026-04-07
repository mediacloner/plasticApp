import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getScanHistory } from '../../services/database';
import { ScanRecord } from '../../services/types';

export default function HistoryScreen() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      getScanHistory()
        .then(setScans)
        .catch(console.error);
    }, [])
  );

  const renderItem = ({ item }: { item: ScanRecord }) => {
    let statusColor = '#4CAF50';
    if (item.status === 'CONDITIONAL') statusColor = '#FF9500';
    if (item.status === 'NON_RECYCLABLE') statusColor = '#FF3B30';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
           router.push({
             pathname: '/result',
             params: {
               result: item.analysis_json,
               imageUri: item.image_uri,
               isHistory: 'true',
               modelName: item.model_name || '',
               processingTime: String(item.processing_time_ms || 0),
             }
           });
        }}
      >
        <Image source={{ uri: item.image_uri }} style={styles.thumbnail} />
        <View style={styles.cardContent}>
          <Text style={styles.plasticName} numberOfLines={1}>{item.plastic_type}</Text>
          <Text style={styles.date}>{new Date(item.scanned_at).toLocaleDateString()}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>{item.status.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.scoreText}>{item.score}/10</Text>
            <View style={styles.itemCountPill}>
              <Text style={styles.itemCountText}>{item.item_count} item{item.item_count !== 1 ? 's' : ''}</Text>
            </View>
            {!!item.model_name && (
              <Text style={styles.metaText}>{item.model_name}</Text>
            )}
          </View>
        </View>

        <Text style={styles.chevron}>&rsaquo;</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {scans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>&#x267B;</Text>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptySubtitle}>
            Point your camera at plastic items and tap analyze to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContainer: {
    padding: 16,
  },
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
  emptySubtitle: { fontSize: 16, color: '#8E8E93', textAlign: 'center', lineHeight: 24 },
  // Cards
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 3,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
  },
  plasticName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  date: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  itemCountPill: {
    backgroundColor: 'rgba(0,188,212,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00BCD4',
  },
  metaText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 24,
    color: '#C7C7CC',
    fontWeight: '300',
    marginLeft: 4,
  },
});
