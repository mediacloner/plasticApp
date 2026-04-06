import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { FruitAnalysisResult } from './types';

// The system prompt as requested in the proposal
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

export const MODEL_FILENAME = 'gemma4-e4b.litertlm';

export const getModelPath = () => {
    if (!FileSystem.documentDirectory) {
        throw new Error("FileSystem.documentDirectory is null! Native module hasn't loaded.");
    }
    return FileSystem.documentDirectory + MODEL_FILENAME;
};

/**
 * Checks if the Gemma 4 model file exists in the app's documents directory.
 */
export const checkModelExists = async (): Promise<boolean> => {
  try {
    const appPath = getModelPath();
    const appFileInfo = await FileSystem.getInfoAsync(appPath);

    if (appFileInfo.exists) {
      console.log("Model found at", appPath);
      return true;
    }

    console.log("Model not found at", appPath);
    return false;
  } catch (err) {
    console.error("Failed to check Gemma 4 model", err);
    return false;
  }
};

/**
 * Opens a document picker so the user can select the .litertlm model file.
 * The file is copied from the picker's cache into the app's documents directory.
 * Returns true if the model was successfully imported.
 */
export const importModelFromDevice = async (): Promise<boolean> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/octet-stream',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return false;
    }

    const pickedFile = result.assets[0];
    const destPath = getModelPath();

    console.log(`Copying model from ${pickedFile.uri} to ${destPath}...`);
    await FileSystem.copyAsync({
      from: pickedFile.uri,
      to: destPath,
    });
    console.log("Model imported successfully to", destPath);
    return true;
  } catch (err) {
    console.error("Failed to import model", err);
    return false;
  }
};

/**
 * Helper to parse the raw text output from the LLM into our JSON typescript object
 */
export const parseLlmResponse = (responseText: string): FruitAnalysisResult => {
    // We strip any markdown formatting Gemma might inject around the JSON block
    const cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJsonStr);
};
