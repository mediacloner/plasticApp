import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FruitAnalysisResult } from '../services/types';

export default function ResultScreen() {
  const { result, imageUri, isHistory } = useLocalSearchParams<{result: string, imageUri: string, isHistory: string}>();
  const router = useRouter();

  if (!result || !imageUri) {
    return (
      <View style={styles.container}>
        <Text>Error loading result data.</Text>
      </View>
    );
  }

  const analysis: FruitAnalysisResult = JSON.parse(result);

  let statusColor = '#34C759'; // GOOD
  if (analysis.status === 'ACCEPTABLE') statusColor = '#FF9500';
  if (analysis.status === 'BAD') statusColor = '#FF3B30';

  return (
    <ScrollView style={styles.container} bounces={false}>
      <Image source={{ uri: imageUri }} style={styles.heroImage} />
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{analysis.fruit}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{analysis.status}</Text>
          </View>
        </View>
        
        <Text style={styles.score}>Score: {analysis.score}/10</Text>
        <Text style={styles.confidence}>Local Model Confidence: {(analysis.confidence * 100).toFixed(1)}%</Text>

        <View style={styles.card}>
          <Section title="Recommendation" content={analysis.recommendation} highlight />
          <Section title="Ripeness" content={analysis.ripeness} />
          <Section title="Color Assessment" content={analysis.color_analysis} />
          <Section title="Surface Condition" content={analysis.surface_analysis} />
          <Section title="Shape & Structure" content={analysis.shape_analysis} />
          
          <Text style={styles.sectionTitle}>Defects Detected</Text>
          {analysis.defects.length > 0 ? (
            analysis.defects.map((d, i) => (
              <Text key={i} style={styles.bulletPoint}>• {d}</Text>
            ))
          ) : (
            <Text style={styles.sectionContent}>None detected.</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.doneButton} 
          onPress={() => router.navigate('/(tabs)')}
        >
          <Text style={styles.doneButtonText}>
            {isHistory === 'true' ? 'Back to History' : 'Scan Another Fruit'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Section({ title, content, highlight = false }: { title: string, content: string, highlight?: boolean }) {
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={[styles.sectionContent, highlight && styles.highlightText]}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  heroImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#E5E5EA',
  },
  content: {
    padding: 20,
    marginTop: -20,
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  score: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3A3A3C',
    marginBottom: 4,
  },
  confidence: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
  },
  highlightText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  bulletPoint: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 4,
    marginLeft: 8,
  },
  doneButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 40,
  },
  doneButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
