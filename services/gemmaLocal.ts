import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { FruitAnalysisResult } from './types';

export const SYSTEM_PROMPT = `You are a fruit quality inspection system.
Analyze the provided image of a fruit and return a JSON assessment.

Evaluate the following criteria:
1. Identify the fruit type and variety if possible
2. Assess color uniformity and appropriateness for the variety
3. Examine surface texture for damage, dehydration, or decay
4. Check shape and structural integrity
5. Identify any defects: bruises, mold, cuts, insect damage
6. Estimate ripeness stage
7. Provide an overall quality score (1-10) and status (GOOD|ACCEPTABLE|BAD)
8. Give a storage or consumption recommendation

Return ONLY valid JSON with this structure:
{
  "fruit": "string",
  "status": "GOOD | ACCEPTABLE | BAD",
  "score": "number 1-10",
  "color_analysis": "string",
  "surface_analysis": "string",
  "shape_analysis": "string",
  "defects": ["string"],
  "ripeness": "string",
  "recommendation": "string",
  "confidence": "number 0-1"
}`;

export interface InstalledModel {
  filename: string;
  path: string;
  displayName: string;
  sizeMB: number;
}

/**
 * Scans the app documents directory for any .litertlm model file.
 * Returns info about the first one found, or null if none installed.
 */
export const findInstalledModel = async (): Promise<InstalledModel | null> => {
  try {
    const docDir = FileSystem.documentDirectory;
    if (!docDir) return null;

    const files = await FileSystem.readDirectoryAsync(docDir);
    const modelFile = files.find(f => f.endsWith('.litertlm'));

    if (!modelFile) return null;

    const path = docDir + modelFile;
    const info = await FileSystem.getInfoAsync(path);
    const sizeMB = info.exists && 'size' in info ? Math.round((info.size ?? 0) / 1_000_000) : 0;

    // Derive display name: "gemma-4-E4B-it.litertlm" -> "Gemma 4 E4B"
    const displayName = modelFile
      .replace('.litertlm', '')
      .replace(/-it$/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/gemma\s*(\d)/i, 'Gemma $1')
      .replace(/\b(e\d+b)\b/i, (m) => m.toUpperCase());

    return { filename: modelFile, path, displayName, sizeMB };
  } catch (err) {
    console.error("Failed to scan for models", err);
    return null;
  }
};

/**
 * Opens a document picker to import a .litertlm model file.
 * Deletes any existing model first, then copies the new one.
 * Returns the installed model info or null if cancelled.
 */
export const importModelFromDevice = async (): Promise<InstalledModel | null> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: false,
    });

    if (result.canceled || !result.assets?.length) return null;

    const pickedFile = result.assets[0];
    const filename = pickedFile.name || 'model.litertlm';

    // Delete any existing model first
    await deleteInstalledModel();

    const docDir = FileSystem.documentDirectory;
    if (!docDir) throw new Error("documentDirectory is null");

    const destPath = docDir + filename;

    console.log(`Importing model: ${filename} -> ${destPath}`);
    await FileSystem.copyAsync({ from: pickedFile.uri, to: destPath });
    console.log("Model imported successfully");

    return findInstalledModel();
  } catch (err) {
    console.error("Failed to import model", err);
    return null;
  }
};

/**
 * Deletes the currently installed model file.
 */
export const deleteInstalledModel = async (): Promise<void> => {
  const model = await findInstalledModel();
  if (model) {
    await FileSystem.deleteAsync(model.path, { idempotent: true });
    console.log("Deleted model:", model.filename);
  }
};

/**
 * Extracts a short model name for display (e.g. "E4B", "E2B").
 */
export const getModelShortName = (filename: string): string => {
  const match = filename.match(/e\d+b/i);
  return match ? match[0].toUpperCase() : filename.replace('.litertlm', '');
};

export const parseLlmResponse = (responseText: string): FruitAnalysisResult => {
  const cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJsonStr);
};
