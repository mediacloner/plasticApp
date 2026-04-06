import * as SQLite from 'expo-sqlite';
import { FruitAnalysisResult, ScanRecord, FruitStatus } from './types';

const DB_NAME = 'fruitinspector.db';

export const initDB = async (): Promise<void> => {
  const db = await SQLite.openDatabaseSync(DB_NAME);
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fruit_name TEXT NOT NULL,
      status TEXT NOT NULL,
      score INTEGER NOT NULL,
      confidence REAL NOT NULL,
      image_uri TEXT NOT NULL,
      analysis_json TEXT NOT NULL,
      scanned_at DATETIME NOT NULL
    );
  `);
};

export const insertScan = async (
  imageUri: string,
  analysis: FruitAnalysisResult
): Promise<number> => {
  const db = await SQLite.openDatabaseSync(DB_NAME);
  
  const result = await db.runAsync(
    `INSERT INTO scans (fruit_name, status, score, confidence, image_uri, analysis_json, scanned_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      analysis.fruit,
      analysis.status,
      analysis.score,
      analysis.confidence,
      imageUri,
      JSON.stringify(analysis),
      new Date().toISOString()
    ]
  );
  
  return result.lastInsertRowId;
};

export const getScanHistory = async (): Promise<ScanRecord[]> => {
  const db = await SQLite.openDatabaseSync(DB_NAME);
  const allRows = await db.getAllAsync<ScanRecord>('SELECT * FROM scans ORDER BY scanned_at DESC');
  return allRows;
};

export const clearHistory = async (): Promise<void> => {
  const db = await SQLite.openDatabaseSync(DB_NAME);
  await db.execAsync('DELETE FROM scans;');
};
