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

export const getModelPath = () => {
    if (!FileSystem.documentDirectory) {
        throw new Error("FileSystem.documentDirectory is null! Native module hasn't loaded.");
    }
    return FileSystem.documentDirectory + MODEL_FILENAME;
};

/**
 * Checks if the Gemma 4 model file exists on device.
 */
export const checkModelExists = async (): Promise<boolean> => {
  try {
    const path = getModelPath();
    const fileInfo = await FileSystem.getInfoAsync(path);
    
    if (!fileInfo.exists) {
      console.warn(
        `⚠️ Model not found at ${getModelPath()}.\n` +
        `Download gemma-4-E4B-it.litertlm from HuggingFace and push it to the device:\n` +
        `  adb push gemma-4-E4B-it.litertlm /sdcard/Download/\n` +
        `Then copy it to the app documents directory, or update getModelPath() to point to the file.`
      );
      return false;
    } else {
      console.log("Model found at", getModelPath());
    }
    
    return true; 
  } catch (err) {
    console.error("Failed to download or locate Gemma 4 model", err);
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
