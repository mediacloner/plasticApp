import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLiteRtLm } from '../../modules/litert-lm';

import { prepareImageForInference } from '../../utils/image';
import {
  checkModelExists,
  importModelFromDevice,
  parseLlmResponse,
  getModelPath,
  SYSTEM_PROMPT
} from '../../services/gemmaLocal';
import { insertScan, initDB } from '../../services/database';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasDownloadedModel, setHasDownloadedModel] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // LiteRT-LM native module for Gemma 4 on-device inference
  const { analyzeImage, isLoaded: modelLoaded, progress } = useLiteRtLm(
    hasDownloadedModel ? getModelPath() : null
  );

  useEffect(() => {
    initDB().catch(console.error);
    checkModelExists().then((exists) => {
      if (exists) setHasDownloadedModel(true);
    }).catch(console.error);
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

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

  async function handleImportModel() {
    setIsImporting(true);
    try {
      const success = await importModelFromDevice();
      if (success) setHasDownloadedModel(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsImporting(false);
    }
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePictureAndAnalyze() {
    if (!cameraRef.current || isAnalyzing || !modelLoaded) return;

    try {
      setIsAnalyzing(true);
      const photo = await cameraRef.current.takePictureAsync();
      if (!photo) throw new Error("Did not capture photo");

      const compressedUri = await prepareImageForInference(photo.uri);
      const responseText = await analyzeImage(compressedUri, SYSTEM_PROMPT);
      const result = parseLlmResponse(responseText);
      await insertScan(photo.uri, result);

      router.push({
        pathname: '/result',
        params: { result: JSON.stringify(result), imageUri: photo.uri }
      });
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Ensure the model is loaded and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  const modelReady = hasDownloadedModel && modelLoaded;

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />

      {/* Scanning frame overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      {/* Top status bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        {!hasDownloadedModel && (
          <TouchableOpacity
            style={styles.importButton}
            onPress={handleImportModel}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.importText}>Import Gemma 4 Model</Text>
            )}
          </TouchableOpacity>
        )}
        {hasDownloadedModel && !modelLoaded && (
          <View style={styles.statusPill}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.statusText}>Initializing Gemma 4...</Text>
          </View>
        )}
        {modelReady && (
          <View style={[styles.statusPill, styles.statusReady]}>
            <View style={styles.readyDot} />
            <Text style={styles.statusText}>Model Ready</Text>
          </View>
        )}
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity style={styles.sideButton} onPress={toggleCameraFacing}>
          <Text style={styles.sideButtonIcon}>↻</Text>
        </TouchableOpacity>

        <View style={styles.captureArea}>
          {isAnalyzing && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.captureButton,
              !modelReady && styles.captureDisabled,
              isAnalyzing && styles.captureAnalyzing,
            ]}
            onPress={takePictureAndAnalyze}
            disabled={isAnalyzing || !modelReady}
          >
            {isAnalyzing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.sideButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  // Permission screen
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
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
  importButton: {
    backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  importText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  statusPill: {
    backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  statusReady: { backgroundColor: 'rgba(52,199,89,0.25)' },
  statusText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  readyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' },

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
  captureArea: { alignItems: 'center' },
  progressContainer: { alignItems: 'center', marginBottom: 12 },
  progressBarBg: {
    width: 120, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', borderRadius: 3, backgroundColor: '#34C759',
  },
  progressText: { color: '#FFF', fontSize: 13, fontWeight: '600', marginTop: 4 },
  captureButton: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 4,
    borderColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  captureInner: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF',
  },
  captureDisabled: { borderColor: 'rgba(255,255,255,0.3)' },
  captureAnalyzing: { borderColor: '#007AFF', backgroundColor: 'rgba(0,122,255,0.15)' },
});
