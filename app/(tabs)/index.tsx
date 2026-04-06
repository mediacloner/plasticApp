import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLiteRtLm } from '../../modules/litert-lm';

import { prepareImageForInference } from '../../utils/image';
import {
  findInstalledModel,
  importModelFromDevice,
  deleteInstalledModel,
  getModelShortName,
  parseLlmResponse,
  SYSTEM_PROMPT,
  type InstalledModel,
} from '../../services/gemmaLocal';
import { insertScan, initDB } from '../../services/database';

export default function ScannerScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [model, setModel] = useState<InstalledModel | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { analyzeImage, isLoaded: modelLoaded, isInitializing, progress } = useLiteRtLm(
    model?.path ?? null
  );

  useEffect(() => {
    initDB().catch(console.error);
    findInstalledModel().then(setModel).catch(console.error);
  }, []);

  const handleImportModel = useCallback(async () => {
    setIsImporting(true);
    try {
      const imported = await importModelFromDevice();
      if (imported) setModel(imported);
    } catch (e) {
      console.error(e);
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    const modelName = model ? model.displayName : 'None';
    const modelSize = model ? `${model.sizeMB} MB` : '';

    Alert.alert(
      'Model Settings',
      model
        ? `Current: ${modelName}\nSize: ${modelSize}`
        : 'No model installed',
      [
        { text: 'Import New Model', onPress: handleImportModel },
        ...(model ? [{ text: 'Delete Model', style: 'destructive' as const, onPress: async () => {
          await deleteInstalledModel();
          setModel(null);
        }}] : []),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  }, [model, handleImportModel]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionMessage}>
            We need camera access to capture and analyze fruit quality.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  async function takePictureAndAnalyze() {
    if (!cameraRef.current || isAnalyzing || !modelLoaded || !model) return;

    try {
      // Capture photo BEFORE unmounting camera
      const photo = await cameraRef.current.takePictureAsync();
      if (!photo) throw new Error("Did not capture photo");

      const compressedUri = await prepareImageForInference(photo.uri);

      // Now switch to processing screen (camera off)
      setIsAnalyzing(true);

      const startTime = Date.now();
      const responseText = await analyzeImage(compressedUri, SYSTEM_PROMPT);
      const processingTimeMs = Date.now() - startTime;

      const result = parseLlmResponse(responseText);
      const modelName = getModelShortName(model.filename);

      await insertScan(photo.uri, result, modelName, processingTimeMs);

      router.push({
        pathname: '/result',
        params: {
          result: JSON.stringify(result),
          imageUri: photo.uri,
          modelName,
          processingTime: String(processingTimeMs),
        }
      });
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Ensure the model is loaded and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const modelReady = !!model && modelLoaded;
  const shortName = model ? getModelShortName(model.filename) : '';

  // Processing screen (camera off)
  if (isAnalyzing) {
    return (
      <View style={styles.processingContainer}>
        <View style={styles.processingContent}>
          <Text style={styles.processingEmoji}>🍎</Text>
          <Text style={styles.processingTitle}>Analyzing Fruit...</Text>
          <Text style={styles.processingSubtitle}>Model: {shortName}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>

          <Text style={styles.processingHint}>
            Camera is off to free memory for the model
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />

      {/* Scanning frame */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.topBarRow}>
          {/* Status pill */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            {!model && !isImporting && (
              <TouchableOpacity style={styles.importButton} onPress={handleImportModel}>
                <Text style={styles.importText}>Import Model</Text>
              </TouchableOpacity>
            )}
            {isImporting && (
              <View style={styles.statusPill}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.statusText}>Importing...</Text>
              </View>
            )}
            {model && isInitializing && (
              <View style={styles.statusPill}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.statusText}>Loading {shortName}...</Text>
              </View>
            )}
            {modelReady && (
              <View style={[styles.statusPill, styles.statusReady]}>
                <View style={styles.readyDot} />
                <Text style={styles.statusText}>{shortName} Ready</Text>
              </View>
            )}
          </View>

          {/* Settings gear */}
          <TouchableOpacity style={styles.gearButton} onPress={handleOpenSettings}>
            <Text style={styles.gearIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={styles.sideButton}
          onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
        >
          <Text style={styles.sideButtonIcon}>↻</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.captureButton,
            !modelReady && styles.captureDisabled,
          ]}
          onPress={takePictureAndAnalyze}
          disabled={!modelReady}
        >
          <View style={[styles.captureInner, !modelReady && styles.captureInnerDisabled]} />
        </TouchableOpacity>

        <View style={styles.sideButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  // Permission
  permissionContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 32 },
  permissionCard: { backgroundColor: '#1C1C1E', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%' },
  permissionIcon: { fontSize: 48, marginBottom: 16 },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  permissionMessage: { fontSize: 16, color: '#8E8E93', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  permissionButton: { backgroundColor: '#007AFF', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  permissionButtonText: { color: '#FFF', fontSize: 17, fontWeight: '600' },

  // Scan frame
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' },
  scanFrame: { width: 260, height: 260, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: 'rgba(255,255,255,0.7)' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },

  // Top bar
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16 },
  topBarRow: { flexDirection: 'row', alignItems: 'center' },
  importButton: {
    backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center',
  },
  importText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  statusPill: {
    backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  statusReady: { backgroundColor: 'rgba(52,199,89,0.25)' },
  statusText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  readyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' },
  gearButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  gearIcon: { fontSize: 20, color: '#FFF' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingHorizontal: 32,
  },
  sideButton: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  sideButtonIcon: { fontSize: 24, color: '#FFF', fontWeight: '300' },
  captureButton: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 4,
    borderColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF' },
  captureDisabled: { borderColor: 'rgba(255,255,255,0.3)' },
  captureInnerDisabled: { backgroundColor: 'rgba(255,255,255,0.3)' },

  // Processing screen
  processingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  processingContent: { alignItems: 'center', paddingHorizontal: 40 },
  processingEmoji: { fontSize: 64, marginBottom: 24 },
  processingTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  processingSubtitle: { fontSize: 16, color: '#8E8E93', marginBottom: 32 },
  progressContainer: { alignItems: 'center', width: '100%' },
  progressBarBg: {
    width: 200, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 4, backgroundColor: '#34C759' },
  progressText: { color: '#FFF', fontSize: 18, fontWeight: '700', marginTop: 12 },
  processingHint: { color: '#555', fontSize: 13, marginTop: 32, textAlign: 'center' },
});
