# litert-lm — Expo Native Module

Custom Expo native module wrapping Google's [LiteRT-LM](https://github.com/google-ai-edge/LiteRT-LM) Kotlin SDK for on-device Gemma 4 multimodal inference on Android.

## Why

No existing React Native library supports Gemma 4 multimodal (image + text) inference. This module bridges the LiteRT-LM Android SDK directly via Expo's native module system.

## Architecture

```
React Native (TypeScript)
  └── useLiteRtLm() hook
        └── LiteRtLmModule.ts (requireNativeModule bridge)
              └── LiteRtLmModule.kt (Expo Module Definition)
                    └── LiteRtLmEngine.kt (LiteRT-LM SDK wrapper)
                          └── Google LiteRT-LM Engine (GPU + Vision)
```

## API

### `useLiteRtLm(modelPath: string | null)`

React hook that initializes the engine and provides inference.

```typescript
import { useLiteRtLm } from '../modules/litert-lm';

const { isLoaded, isInitializing, error, analyzeImage } = useLiteRtLm(modelPath);

// Run multimodal inference (image file + text prompt)
const responseText = await analyzeImage(imageUri, prompt);
```

**Parameters:**
- `modelPath` — Absolute path to the `.litertlm` model file on device. Pass `null` to skip initialization.

**Returns:**
- `isLoaded: boolean` — `true` when the engine is ready for inference
- `isInitializing: boolean` — `true` during engine startup (5-10s on first load)
- `error: string | null` — Error message if initialization failed
- `analyzeImage(imagePath, prompt): Promise<string>` — Runs multimodal inference, returns model response text

## Setup

### 1. Model file

Download `gemma-4-E4B-it.litertlm` from [HuggingFace](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm) (requires Gemma license acceptance).

Rename and push to the device's Download folder:
```bash
adb push gemma-4-E4B-it.litertlm /sdcard/Download/gemma4-e4b.litertlm
```

On the next app launch, the model is automatically detected in `/sdcard/Download/` and copied into the app's private documents directory. This avoids `Permission denied` errors from trying to write directly to `/data/data/...`.

The auto-copy logic lives in `services/gemmaLocal.ts` (`checkModelExists`). The lookup order is:
1. App documents dir (`FileSystem.documentDirectory + 'gemma4-e4b.litertlm'`) — used directly if found
2. `/sdcard/Download/gemma4-e4b.litertlm` — copied to app documents dir, then used

Once copied, the sideloaded file in `/sdcard/Download/` can be deleted to free storage.

### 2. Android build config

After generating the Android project (`npx expo run:android`), set in `android/gradle.properties`:

```properties
expo.useLegacyPackaging=true
```

This ensures LiteRT-LM's native `.so` libraries load correctly.

### 3. minSdkVersion

LiteRT-LM requires Android API 26+. The Expo default is 24. If builds fail with a minSdk error, add `expo-build-properties` to `app.json`:

```json
{
  "plugins": [
    ["expo-build-properties", {
      "android": { "minSdkVersion": 26 }
    }]
  ]
}
```

## Supported platforms

- Android only. iOS is not supported (LiteRT-LM Swift API is still in development).

## Model compatibility

Tested with `.litertlm` format models from:
- [litert-community/gemma-4-E4B-it-litert-lm](https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm) (3.65 GB, multimodal)

## Troubleshooting

**Gradle can't resolve `com.google.ai.edge.litertlm:litertlm-android`:**
The SDK may not yet be published to Google Maven. Download the `.aar` from [LiteRT-LM releases](https://github.com/google-ai-edge/LiteRT-LM/releases), place it in `modules/litert-lm/android/libs/`, and update `build.gradle`:
```groovy
dependencies {
    implementation fileTree(dir: 'libs', include: ['*.aar'])
}
```

**Engine initialization takes long:**
First load optimizes weights for the device's GPU. Subsequent loads use a cached version and are faster.

**Out of memory:**
Gemma 4 E4B requires ~4GB RAM. Ensure the device has sufficient free memory. The `prepareImageForInference()` utility in `utils/image.ts` downscales images to 1024px to reduce memory pressure.
