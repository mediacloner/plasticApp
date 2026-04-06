import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
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

  // LiteRT-LM native module for Gemma 4 on-device inference
  const { analyzeImage, isLoaded: modelLoaded } = useLiteRtLm(
    hasDownloadedModel ? getModelPath() : null
  );

  useEffect(() => {
    // Initialize DB on boot
    initDB().catch(console.error);

    // Check if model file exists on device
    checkModelExists().then((exists) => {
      if (exists) setHasDownloadedModel(true);
    }).catch(console.error);
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
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

      // 1. Resize/Compress
      const compressedUri = await prepareImageForInference(photo.uri);

      // 2. Local AI Inference (multimodal: image + text via LiteRT-LM)
      const responseText = await analyzeImage(compressedUri, SYSTEM_PROMPT);
      const result = parseLlmResponse(responseText);

      // 3. Save to History DB
      await insertScan(photo.uri, result);

      // 4. Navigate to details
      router.push({
        pathname: '/result',
        params: { result: JSON.stringify(result), imageUri: photo.uri }
      });

    } catch (error) {
      console.error(error);
      alert("Analysis failed. Ensure the model is correct and running.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
      <View style={styles.overlay}>
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
            <View style={styles.loadingModel}>
               <ActivityIndicator size="small" color="#FFF" />
               <Text style={styles.loadingText}>Loading Gemma 4 Model...</Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.captureButton, isAnalyzing && styles.disabledButton]} 
              onPress={takePictureAndAnalyze}
              disabled={isAnalyzing || !modelLoaded}
            >
              {isAnalyzing ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Text style={styles.captureText}>Analyze</Text>
              )}
            </TouchableOpacity>
          </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#000' },
  message: { textAlign: 'center', paddingBottom: 10, color: 'white' },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'transparent', flexDirection: 'column', justifyContent: 'space-between', padding: 20, paddingBottom: 40,
  },
  importButton: {
    backgroundColor: '#007AFF', padding: 16, borderRadius: 12, alignItems: 'center', alignSelf: 'center', marginTop: 60, paddingHorizontal: 24,
  },
  importText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  loadingModel: {
    backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginTop: 40,
  },
  loadingText: { color: '#FFF', marginLeft: 8, fontWeight: '600' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginBottom: 40 },
  button: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 30 },
  text: { fontSize: 18, fontWeight: 'bold', color: 'white' },
  captureButton: { backgroundColor: '#007AFF', padding: 20, borderRadius: 50, width: 100, height: 100, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'white' },
  disabledButton: { backgroundColor: '#555' },
  captureText: { fontSize: 18, fontWeight: 'bold', color: 'white' }
});
