import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getScanHistory } from '../../services/database';
import { ScanRecord } from '../../services/types';

export default function HistoryScreen() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      getScanHistory()
        .then(setScans)
        .catch(console.error);
    }, [])
  );

  const renderItem = ({ item }: { item: ScanRecord }) => {
    // Parse the status for color
    let statusColor = '#34C759'; // GOOD
    if (item.status === 'ACCEPTABLE') statusColor = '#FF9500';
    if (item.status === 'BAD') statusColor = '#FF3B30';

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => {
           router.push({
             pathname: '/result',
             params: { result: item.analysis_json, imageUri: item.image_uri, isHistory: 'true' }
           });
        }}
      >
        <Image source={{ uri: item.image_uri }} style={styles.thumbnail} />
        <View style={styles.cardContent}>
          <Text style={styles.title}>{item.fruit_name}</Text>
          <Text style={styles.date}>{new Date(item.scanned_at).toLocaleDateString()}</Text>
          
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
            <Text style={styles.scoreText}>Score: {item.score}/10</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {scans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No fruits scanned yet.</Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#8E8E93',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3A3A3C',
  }
});
