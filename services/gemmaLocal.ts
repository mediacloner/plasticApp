import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { PlasticScanResult } from './types';

export const SYSTEM_PROMPT = `You are a plastic material identification and recyclability assessment system.
Analyze the provided image and identify ALL distinct plastic items visible. For each item, provide its approximate position in the image as a percentage (0-100) from top-left corner.

For each plastic item found, evaluate:
1. Identify the plastic type and resin identification code (RIC 1-7) if visible
2. Assess the color and transparency of the plastic
3. Examine surface texture, markings, and any recycling symbols
4. Check shape and form factor (bottle, container, film, foam, etc.)
5. Identify any contaminants: labels, food residue, mixed materials, degradation
6. Estimate recyclability based on type and condition
7. Provide an overall recyclability score (1-10) and status (RECYCLABLE|CONDITIONAL|NON_RECYCLABLE)
8. Give a disposal or recycling recommendation

Common plastic types:
- PET (1): Clear bottles, food containers
- HDPE (2): Milk jugs, detergent bottles
- PVC (3): Pipes, window frames
- LDPE (4): Plastic bags, squeeze bottles
- PP (5): Yogurt cups, bottle caps
- PS (6): Styrofoam, disposable cutlery
- Other (7): Mixed/multilayer plastics

Return ONLY valid JSON with this structure:
{
  "items": [
    {
      "label": 1,
      "plastic_type": "string (e.g. PET #1, HDPE #2)",
      "resin_code": "string (1-7 or unknown)",
      "status": "RECYCLABLE | CONDITIONAL | NON_RECYCLABLE",
      "score": "number 1-10",
      "color_analysis": "string",
      "surface_analysis": "string",
      "shape_analysis": "string",
      "contaminants": ["string"],
      "recyclability": "string",
      "recommendation": "string",
      "confidence": "number 0-1",
      "position": {
        "x": "number 0-100 (percentage from left edge)",
        "y": "number 0-100 (percentage from top edge)"
      }
    }
  ],
  "summary": "string (brief overview of all items found and overall recycling guidance)"
}

Number each item starting from 1. Position should point to the approximate center of each plastic item in the image.`;

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

export const parseLlmResponse = (responseText: string): PlasticScanResult => {
  const cleanJsonStr = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJsonStr);
};
