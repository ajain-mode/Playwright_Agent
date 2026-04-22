/**
 * CSV Data Service
 *
 * Manages all CSV test-data operations: reading, writing, parsing,
 * appending rows, and value aliasing. Extracted from PlaywrightAgent
 * to keep that class focused on orchestration.
 *
 * @author AI Agent
 * @created 2026-04-22
 */

import * as fs from 'fs';
import * as path from 'path';
import { TestCaseInput } from '../types/TestCaseTypes';
import { buildCsvAliasMap } from '../config/FieldRegistry';

// Category to data CSV file mapping
const CATEGORY_DATA_CSV_MAP: Record<string, { folder: string; file: string }> = {
  dfb: { folder: 'dfb', file: 'dfbdata.csv' },
  edi: { folder: 'edi', file: 'edidata.csv' },
  commission: { folder: 'commission', file: 'commissiondata.csv' },
  salesLead: { folder: 'salesLead', file: 'salesleaddata.csv' },
  banyan: { folder: 'banyan', file: 'banyandata.csv' },
  carrier: { folder: 'carrier', file: 'carrierdata.csv' },
  api: { folder: 'api', file: 'apidata.csv' },
  dat: { folder: 'dat', file: 'datdata.csv' },
  bulkChange: { folder: 'bulkChange', file: 'bulkchangedata.csv' },
  nonOperationalLoads: { folder: 'nonOperationalLoads', file: 'nonoperationalloadsdata.csv' },
  billingtoggle: { folder: 'billingtoggle', file: 'billingtoggledata.csv' },
  custom: { folder: 'dfb', file: 'dfbdata.csv' },
};

export class CsvDataService {
  constructor(private dataDir: string) {}

  /**
   * Get the data CSV file path for a given category.
   */
  getDataCsvPath(category: string): string {
    const mapping = CATEGORY_DATA_CSV_MAP[category] || CATEGORY_DATA_CSV_MAP.custom;
    return path.join(this.dataDir, mapping.folder, mapping.file);
  }

  /**
   * Ensure the test case has a row in the category CSV file.
   * Creates the file if it doesn't exist, appends a row if the ID is missing.
   */
  ensureTestDataInCsv(testCase: TestCaseInput): void {
    const category = testCase.category;
    const csvPath = this.getDataCsvPath(category);
    const testCaseId = testCase.id;

    console.log(`\n📂 Checking data CSV for category '${category}': ${csvPath}`);

    const csvDir = path.dirname(csvPath);
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }

    if (!fs.existsSync(csvPath)) {
      console.log(`   ⚠️ Data CSV file not found. Creating new file: ${csvPath}`);
      this.createNewDataCsv(csvPath, testCase);
      return;
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      console.log(`   ⚠️ Data CSV is empty. Recreating with headers.`);
      this.createNewDataCsv(csvPath, testCase);
      return;
    }

    const headers = this.parseCsvLine(lines[0]);
    const idColumnIndex = headers.findIndex(h =>
      h.trim().toLowerCase().replace(/[\s_-]/g, '') === 'testscriptid',
    );

    if (idColumnIndex === -1) {
      console.log(`   ⚠️ No 'Test Script ID' column found in CSV. Skipping CSV insertion.`);
      return;
    }

    let foundLineIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values[idColumnIndex] && values[idColumnIndex].trim() === testCaseId) {
        foundLineIndex = i;
        break;
      }
    }

    if (foundLineIndex >= 0) {
      console.log(`   ✅ Test ID '${testCaseId}' already exists in ${path.basename(csvPath)}`);
      // Update existing row if testCase has extracted values that differ from the CSV
      this.updateExistingRowIfNeeded(csvPath, lines, headers, foundLineIndex, testCase);
    } else {
      console.log(`   ➕ Test ID '${testCaseId}' not found. Adding to ${path.basename(csvPath)}...`);
      this.appendTestDataToCsv(csvPath, headers, testCase);
      console.log(`   ✅ Test ID '${testCaseId}' added to ${path.basename(csvPath)}`);
    }
  }

  /**
   * Update an existing CSV row if extracted values from the test case differ.
   * Only updates columns where the test case has a non-empty extracted value
   * and the existing CSV cell is empty or contains inherited (stale) data.
   */
  private updateExistingRowIfNeeded(
    csvPath: string,
    lines: string[],
    headers: string[],
    rowIndex: number,
    testCase: TestCaseInput,
  ): void {
    const testData = testCase.testData || {};
    const ev = testCase.explicitValues;
    if (!ev) return;

    // Build alias map from extracted values
    const aliasMap: Record<string, string> = buildCsvAliasMap(ev, (v) => this.normalizeLoadMethod(v));

    const existingValues = this.parseCsvLine(lines[rowIndex]);
    let updated = false;
    const updatedColumns: string[] = [];

    const newValues = headers.map((header, colIndex) => {
      const headerClean = header.trim();
      const headerLower = headerClean.toLowerCase().replace(/[\s_-]/g, '');
      if (headerLower === 'testscriptid') return existingValues[colIndex] || testCase.id;

      const extractedVal =
        testData[headerClean] ||
        testData[toCamelCase(headerClean)] ||
        aliasMap[headerLower] ||
        '';
      const existingVal = (existingValues[colIndex] || '').trim();

      // Update if: we have an extracted value AND it differs from existing
      if (extractedVal && String(extractedVal).trim() && String(extractedVal).trim() !== existingVal) {
        updated = true;
        updatedColumns.push(`${headerClean}: ${existingVal} → ${String(extractedVal).trim()}`);
        return this.escapeCsvValue(String(extractedVal));
      }
      return existingValues[colIndex] || '';
    });

    if (updated) {
      lines[rowIndex] = newValues.join(',');
      const newContent = lines.join('\n') + '\n';
      fs.writeFileSync(csvPath, newContent, 'utf-8');
      console.log(`   🔄 Updated ${updatedColumns.length} column(s) in existing row: ${updatedColumns.join(', ')}`);
    }
  }

  /**
   * Create a new data CSV file with headers from testData keys.
   */
  private createNewDataCsv(csvPath: string, testCase: TestCaseInput): void {
    const testData = testCase.testData || {};
    const headers = ['Test Script ID'];
    const dataKeys = Object.keys(testData).filter(
      k => k !== 'Test Script ID' && k !== 'testCaseId' && testData[k],
    );
    headers.push(...dataKeys);

    const values = [testCase.id];
    dataKeys.forEach(key => {
      const val = String(testData[key] || '');
      values.push(this.escapeCsvValue(val));
    });

    const csvContent = headers.join(',') + '\n' + values.join(',') + '\n';
    fs.writeFileSync(csvPath, csvContent, 'utf-8');
  }

  /**
   * Append a test data row to an existing CSV file.
   * Uses FieldRegistry to resolve column aliases from explicitValues.
   */
  private appendTestDataToCsv(csvPath: string, headers: string[], testCase: TestCaseInput): void {
    const testData = testCase.testData || {};
    const ev = testCase.explicitValues;

    // Build alias map from unified FieldRegistry
    const aliasMap: Record<string, string> = ev
      ? buildCsvAliasMap(ev, (v) => this.normalizeLoadMethod(v))
      : {};

    // Extract city/state from "NAME - CITY, ST" or "|NAME|CITY|ST" patterns
    if (ev) {
      const form = ev.formFields || {};
      if (form.pickLocation) {
        const dashM = form.pickLocation.match(/- ([^,]+),\s*(\w+)/);
        const pipeM = form.pickLocation.match(/\|([^|]+)\|([^|]+)\|(\w+)/);
        if (dashM) {
          aliasMap['shippercity'] = dashM[1].trim();
          aliasMap['shipperstate'] = dashM[2].trim();
        } else if (pipeM) {
          aliasMap['shippername'] = pipeM[1].trim();
          aliasMap['shippercity'] = pipeM[2].trim();
          aliasMap['shipperstate'] = pipeM[3].trim();
        }
      }
      if (form.dropLocation) {
        const dashM = form.dropLocation.match(/- ([^,]+),\s*(\w+)/);
        const pipeM = form.dropLocation.match(/\|([^|]+)\|([^|]+)\|(\w+)/);
        if (dashM) {
          aliasMap['consigneecity'] = dashM[1].trim();
          aliasMap['consigneestate'] = dashM[2].trim();
        } else if (pipeM) {
          aliasMap['consigneename'] = pipeM[1].trim();
          aliasMap['consigneecity'] = pipeM[2].trim();
          aliasMap['consigneestate'] = pipeM[3].trim();
        }
      }
    }

    // Build value row matching existing headers
    const values: string[] = [];
    const filledColumns: string[] = [];
    headers.forEach(header => {
      const headerClean = header.trim();
      const headerLower = headerClean.toLowerCase().replace(/[\s_-]/g, '');

      if (headerLower === 'testscriptid') {
        values.push(testCase.id);
        filledColumns.push(headerClean);
      } else {
        const val =
          testData[headerClean] ||
          testData[toCamelCase(headerClean)] ||
          aliasMap[headerLower] ||
          '';
        values.push(this.escapeCsvValue(String(val)));
        if (val) filledColumns.push(headerClean);
      }
    });

    if (filledColumns.length > 1) {
      console.log(`   📋 Populated columns: ${filledColumns.join(', ')}`);
    }

    const newLine = values.join(',');
    const existingContent = fs.readFileSync(csvPath, 'utf-8');
    const separator = existingContent.endsWith('\n') ? '' : '\n';
    fs.writeFileSync(csvPath, existingContent + separator + newLine + '\n', 'utf-8');
  }

  /**
   * Escape a CSV value (wrap in quotes if contains special characters).
   */
  escapeCsvValue(value: string): string {
    if (
      value.includes(',') ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes('(') ||
      value.includes(')')
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Normalize loadMethod values to the short form used by the UI dropdown.
   */
  normalizeLoadMethod(value: string): string {
    const lower = value.trim().toLowerCase();
    const tlAliases = ['truckload', 'truck load', 'ftl', 'full truckload', 'full truck load'];
    if (tlAliases.includes(lower)) return 'TL';
    if (lower === 'less than truckload' || lower === 'less than truck load') return 'LTL';
    return value.trim();
  }

  /**
   * Parse a CSV line handling quoted values.
   */
  parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}

// ─── Utility ─────────────────────────────────────────────────────────

function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toLowerCase());
}
