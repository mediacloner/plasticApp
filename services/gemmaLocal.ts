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
  "fruit": "string — fruit name and variety",
  "status": "GOOD | ACCEPTABLE | BAD",
  "score": "number 1-10",
  "color_analysis": "string",
  "surface_analysis": "string",
  "shape_analysis": "string",
  "defects": ["array of strings"],
  "ripeness": "string",
  "recommendation": "string",
  "confidence": "number 0-1"
}`;

/**
 * Initializes the MediaPipe task runner or pulls the Gemma model.
 * In a real environment, this requires react-native-llm-mediapipe
 * and loading a quantized .bin asset file from the bundle.
 */
export const initializeModel = async (): Promise<boolean> => {
  // TODO: Use MediaPipe LLM Inference bindings here
  console.log("Model loading logic to be implemented dynamically via native module...");
  
  // Simulate load time
  await new Promise(resolve => setTimeout(resolve, 2000));
  return true; 
};

/**
 * Sends the image to the local on-device Gemma 4 instance.
 */
export const analyzeFruitImageLocal = async (localImageUri: string): Promise<FruitAnalysisResult> => {
  console.log("Sending to Gemma local model...", localImageUri);
  
  // =========================================================
  // TODO: Implement the actual MediaPipe LLM bridging logic
  // e.g., const res = await nativeLlm.generate(SYSTEM_PROMPT, imageBuffer);
  // =========================================================
  
  // For UI development purposes, we mock a response after a 3s delay
  // This simulates the expected inference delay for Gemma 4 E4B on a mobile GPU
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const mockResponse: FruitAnalysisResult = {
    fruit: "Apple (Red Delicious)",
    status: "GOOD",
    score: 8,
    color_analysis: "Uniform deep red with minor green patches near stem — consistent with variety",
    surface_analysis: "Smooth skin, firm to appearance, natural wax bloom present",
    shape_analysis: "Symmetrical, typical elongated shape for Red Delicious",
    defects: ["Minor stem bruise (cosmetic only)"],
    ripeness: "Optimal eating ripeness",
    recommendation: "Eat within 3-5 days or refrigerate for up to 2 weeks",
    confidence: 0.92
  };
  
  return mockResponse;
};
