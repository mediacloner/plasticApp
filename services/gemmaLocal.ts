import * as FileSystem from 'expo-file-system/legacy';
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

// Where the user should adb push the model to
const SIDELOAD_PATH = '/sdcard/Download/' + MODEL_FILENAME;

export const getModelPath = () => {
    if (!FileSystem.documentDirectory) {
        throw new Error("FileSystem.documentDirectory is null! Native module hasn't loaded.");
    }
    return FileSystem.documentDirectory + MODEL_FILENAME;
};

/**
 * Checks if the Gemma 4 model file exists in the app's documents directory.
 * If not found there, looks in /sdcard/Download/ and copies it over automatically.
 */
export const checkModelExists = async (onProgress?: (msg: string) => void): Promise<boolean> => {
  try {
    const appPath = getModelPath();
    const appFileInfo = await FileSystem.getInfoAsync(appPath);

    if (appFileInfo.exists) {
      console.log("Model found at", appPath);
      return true;
    }

    // Check if the model was sideloaded to /sdcard/Download/
    const sideloadInfo = await FileSystem.getInfoAsync('file://' + SIDELOAD_PATH);

    if (sideloadInfo.exists) {
      console.log("Model found at sideload path, copying to app storage...");
      onProgress?.("Copying model to app storage...");
      await FileSystem.copyAsync({
        from: 'file://' + SIDELOAD_PATH,
        to: appPath,
      });
      console.log("Model copied to", appPath);
      return true;
    }

    console.warn(
      `⚠️ Model not found.\n` +
      `Download gemma-4-E4B-it.litertlm from HuggingFace, rename to ${MODEL_FILENAME}, and push:\n` +
      `  adb push ${MODEL_FILENAME} /sdcard/Download/`
    );
    return false;
  } catch (err) {
    console.error("Failed to locate or copy Gemma 4 model", err);
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
