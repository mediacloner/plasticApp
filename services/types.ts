export type PlasticStatus = 'RECYCLABLE' | 'CONDITIONAL' | 'NON_RECYCLABLE';

export interface PlasticItem {
  label: number;
  plastic_type: string;
  resin_code: string;
  status: PlasticStatus;
  score: number;
  color_analysis: string;
  surface_analysis: string;
  shape_analysis: string;
  contaminants: string[];
  recyclability: string;
  recommendation: string;
  confidence: number;
  position: {
    x: number;
    y: number;
  };
}

export interface PlasticScanResult {
  items: PlasticItem[];
  summary: string;
}

export interface ScanRecord {
  id: number;
  plastic_type: string;
  status: PlasticStatus;
  score: number;
  confidence: number;
  item_count: number;
  image_uri: string;
  analysis_json: string;
  scanned_at: string;
  model_name: string;
  processing_time_ms: number;
}
