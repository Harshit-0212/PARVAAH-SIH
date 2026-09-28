import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { logger } from './logger.js';

export interface IndoFloodsRecord {
  flood_id?: string;
  state?: string;
  district?: string;
  ward_id?: string;
  ward_name?: string;
  year?: string;
  flood_type?: string;
  severity?: string;
  [key: string]: any;
}

let cachedFrequencies: Map<string, number> | null = null;

/**
 * Loads INDOFLOODS dataset from CSV file using csv-parse
 */
export function loadIndoFloodsData(csvFilePath?: string): IndoFloodsRecord[] {
  const defaultPath = path.resolve(process.cwd(), '../data/raw/indofloods/indofloods_events.csv');
  const fallbackPath = path.resolve(process.cwd(), 'data/raw/indofloods/indofloods_events.csv');
  
  const targetPath = csvFilePath || (fs.existsSync(defaultPath) ? defaultPath : fallbackPath);

  if (!fs.existsSync(targetPath)) {
    logger.warn(`IndoFloods CSV not found at: ${targetPath}. Using built-in fallback frequencies.`);
    return [
      { ward_id: 'W-01', ward_name: 'Silpukhuri Ward', district: 'Kamrup', severity: 'High' },
      { ward_id: 'W-01', ward_name: 'Silpukhuri Ward', district: 'Kamrup', severity: 'Very High' },
      { ward_id: 'W-01', ward_name: 'Silpukhuri Ward', district: 'Kamrup', severity: 'High' },
      { ward_id: 'W-02', ward_name: 'Dispur Valley', district: 'Kamrup', severity: 'High' },
      { ward_id: 'W-02', ward_name: 'Dispur Valley', district: 'Kamrup', severity: 'Moderate' },
      { ward_id: 'W-03', ward_name: 'Kamakhya Foothills', district: 'Kamrup', severity: 'Moderate' },
      { ward_id: 'W-04', ward_name: 'Silchar Central', district: 'Cachar', severity: 'Very High' },
      { ward_id: 'W-04', ward_name: 'Silchar Central', district: 'Cachar', severity: 'High' },
    ];
  }

  try {
    const fileContent = fs.readFileSync(targetPath, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as IndoFloodsRecord[];

    return records;
  } catch (error: any) {
    logger.error('Failed to parse INDOFLOODS CSV file:', error);
    return [];
  }
}

/**
 * Computes historical flood frequency grouped by ward_id (or district if ward_id unavailable)
 */
export function getFloodFrequencyByWard(csvFilePath?: string): Map<string, number> {
  if (cachedFrequencies && !csvFilePath) {
    return cachedFrequencies;
  }

  const records = loadIndoFloodsData(csvFilePath);
  const freqMap = new Map<string, number>();

  for (const row of records) {
    const key = (row.ward_id || row.ward || row.district || 'UNKNOWN').trim().toUpperCase();
    freqMap.set(key, (freqMap.get(key) || 0) + 1);
  }

  cachedFrequencies = freqMap;
  return freqMap;
}
