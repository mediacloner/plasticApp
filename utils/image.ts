import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Aggressively scales and compresses an image before passing
 * it to the on-device language model to avoid heavy memory allocation crashes.
 */
export const prepareImageForInference = async (uri: string): Promise<string> => {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    // Downscale the image. 1024px is generally safe and responsive for mobile LLMs
    [{ resize: { width: 1024 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  
  return result.uri;
};
