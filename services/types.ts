export type FruitStatus = 'GOOD' | 'ACCEPTABLE' | 'BAD';

export interface FruitAnalysisResult {
  fruit: string;
  status: FruitStatus;
  score: number;
  color_analysis: string;
  surface_analysis: string;
  shape_analysis: string;
  defects: string[];
  ripeness: string;
  recommendation: string;
  confidence: number;
}

export interface ScanRecord {
  id: number;
  fruit_name: string;
  status: FruitStatus;
  score: number;
  confidence: number;
  image_uri: string;
  analysis_json: string; // The raw JSON string returned by Gemma
  scanned_at: string; // ISO date string
}
