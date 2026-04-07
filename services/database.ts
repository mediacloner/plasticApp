import * as SQLite from 'expo-sqlite';
import { PlasticScanResult, ScanRecord } from './types';

const DB_NAME = 'plasticinspector.db';

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
  }
  return db;
}

export const initDB = async (): Promise<void> => {
  const database = getDb();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plastic_type TEXT NOT NULL,
      status TEXT NOT NULL,
      score INTEGER NOT NULL,
      confidence REAL NOT NULL,
      item_count INTEGER NOT NULL DEFAULT 1,
      image_uri TEXT NOT NULL,
      analysis_json TEXT NOT NULL,
      scanned_at DATETIME NOT NULL,
      model_name TEXT NOT NULL DEFAULT '',
      processing_time_ms INTEGER NOT NULL DEFAULT 0
    );
  `);
};

export const insertScan = async (
  imageUri: string,
  analysis: PlasticScanResult,
  modelName: string,
  processingTimeMs: number
): Promise<number> => {
  const database = getDb();

  const items = analysis.items;
  const primaryType = items.length > 0
    ? items.map(i => i.plastic_type).join(', ')
    : 'Unknown';
  const avgScore = items.length > 0
    ? Math.round(items.reduce((sum, i) => sum + i.score, 0) / items.length)
    : 0;
  const avgConfidence = items.length > 0
    ? items.reduce((sum, i) => sum + i.confidence, 0) / items.length
    : 0;
  const worstStatus = items.reduce((worst, i) => {
    if (i.status === 'NON_RECYCLABLE') return 'NON_RECYCLABLE';
    if (i.status === 'CONDITIONAL' && worst !== 'NON_RECYCLABLE') return 'CONDITIONAL';
    return worst;
  }, items[0]?.status ?? 'RECYCLABLE');

  const result = await database.runAsync(
    `INSERT INTO scans (plastic_type, status, score, confidence, item_count, image_uri, analysis_json, scanned_at, model_name, processing_time_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    primaryType,
    worstStatus,
    avgScore,
    avgConfidence,
    items.length,
    imageUri,
    JSON.stringify(analysis),
    new Date().toISOString(),
    modelName,
    processingTimeMs
  );

  return result.lastInsertRowId;
};

export const getScanHistory = async (): Promise<ScanRecord[]> => {
  const database = getDb();
  const allRows = await database.getAllAsync<ScanRecord>('SELECT * FROM scans ORDER BY scanned_at DESC');
  return allRows;
};

export const clearHistory = async (): Promise<void> => {
  const database = getDb();
  await database.execAsync('DELETE FROM scans;');
};
