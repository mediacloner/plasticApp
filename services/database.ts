import * as SQLite from 'expo-sqlite';
import { FruitAnalysisResult, ScanRecord } from './types';

const DB_NAME = 'fruitinspector.db';

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
      fruit_name TEXT NOT NULL,
      status TEXT NOT NULL,
      score INTEGER NOT NULL,
      confidence REAL NOT NULL,
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
  analysis: FruitAnalysisResult,
  modelName: string,
  processingTimeMs: number
): Promise<number> => {
  const database = getDb();

  const result = await database.runAsync(
    `INSERT INTO scans (fruit_name, status, score, confidence, image_uri, analysis_json, scanned_at, model_name, processing_time_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    analysis.fruit,
    analysis.status,
    analysis.score,
    analysis.confidence,
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
