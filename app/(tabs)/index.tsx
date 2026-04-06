import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { prepareImageForInference } from '../../utils/image';
import { analyzeFruitImageLocal, initializeModel } from '../../services/gemmaLocal';
import { insertScan, initDB } from '../../services/database';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  useEffect(() => {
    // Initialize DB on boot
    initDB().catch(console.error);

    // Warm up the Gemma Local Model
    initializeModel().then(() => setModelReady(true)).catch(console.error);
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

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePictureAndAnalyze() {
    if (!cameraRef.current || isAnalyzing || !modelReady) return;

    try {
      setIsAnalyzing(true);
      
      const photo = await cameraRef.current.takePictureAsync();
      if (!photo) throw new Error("Did not capture photo");

      // 1. Resize/Compress
      const compressedUri = await prepareImageForInference(photo.uri);

      // 2. Local AI Inference
      const result = await analyzeFruitImageLocal(compressedUri);

      // 3. Save to History DB
      await insertScan(photo.uri, result);

      // 4. Navigate to details
      router.push({
        pathname: '/result',
        params: { result: JSON.stringify(result), imageUri: photo.uri }
      });

    } catch (error) {
      console.error(error);
      alert("Analysis failed. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.overlay}>
            {!modelReady && (
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
                disabled={isAnalyzing || !modelReady}
              >
                {isAnalyzing ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <Text style={styles.captureText}>Analyze</Text>
                )}
              </TouchableOpacity>
            </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 40,
  },
  loadingModel: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 40,
  },
  loadingText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 40,
  },
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 30,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  captureButton: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 50,
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  captureText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  }
});
