/**
 * Data Validator
 * Validates and auto-corrects CSV test data values before code generation.
 * Learns valid values from existing data and enforces consistency.
 *
 * @author AI Agent Generator
 * @created 2026-02-20
 */

import fs from 'fs';
import path from 'path';

export interface ValidationResult {
  field: string;
  originalValue: string;
  correctedValue: string | null;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ValidationReport {
  testCaseId: string;
  isValid: boolean;
  corrections: ValidationResult[];
  errors: ValidationResult[];
  warnings: ValidationResult[];
}

type FieldRule = {
  allowedValues: string[];
  aliases: Record<string, string>;
  caseSensitive: boolean;
  allowEmpty: boolean;
  /** When true, learn additional valid values from existing CSV data */
  learnFromData: boolean;
};

export class DataValidator {
  private fieldRules: Record<string, FieldRule>;
  private learnedValues: Record<string, Set<string>> = {};

  constructor() {
    this.fieldRules = this.buildFieldRules();
  }

  private buildFieldRules(): Record<string, FieldRule> {
    return {
      shipmentCommodityUoM: {
        allowedValues: ['CASES', 'TEST', 'PALLETS', 'DRUMS', 'BAGS', 'ROLLS', 'PIECES', 'CARTONS', 'BOXES', 'BUNDLES', 'COILS', 'CRATES'],
        aliases: {
          'case or cases': 'CASES',
          'case': 'CASES',
          'cases': 'CASES',
          'pallet': 'PALLETS',
          'drum': 'DRUMS',
          'bag': 'BAGS',
          'roll': 'ROLLS',
          'piece': 'PIECES',
          'carton': 'CARTONS',
          'box': 'BOXES',
          'bundle': 'BUNDLES',
          'coil': 'COILS',
          'crate': 'CRATES',
        },
        caseSensitive: false,
        allowEmpty: true,
        learnFromData: true,
      },

      equipmentType: {
        allowedValues: ['FLATBED', 'VAN', 'REEFER', 'FLATBED/STEP DECK', 'VAN OR REEFER', 'STEP DECK', 'LOWBOY', 'TANKER', 'CONTAINER', 'POWER ONLY', 'HOPPER', 'DOUBLE DROP'],
        aliases: {
          'flat bed': 'FLATBED',
          'flat': 'FLATBED',
          'van/reefer': 'VAN OR REEFER',
          'stepdeck': 'STEP DECK',
          'flatbed/stepdeck': 'FLATBED/STEP DECK',
          'flatbed / step deck': 'FLATBED/STEP DECK',
        },
        caseSensitive: false,
        allowEmpty: true,
        learnFromData: true,
      },

      rateType: {
        allowedValues: ['SPOT', 'CONTRACT', 'BID'],
        aliases: {
          'spot rate': 'SPOT',
          'contract rate': 'CONTRACT',
        },
        caseSensitive: false,
        allowEmpty: true,
        learnFromData: false,
      },

      loadMethod: {
        allowedValues: ['TruckLoad', 'TL', 'LTL', 'Intermodal', 'Partial'],
        aliases: {
          'truckload': 'TruckLoad',
          'truck load': 'TruckLoad',
          'ftl': 'TruckLoad',
          'full truckload': 'TruckLoad',
          'full truck load': 'TruckLoad',
          'less than truckload': 'LTL',
          'less than truck load': 'LTL',
        },
        caseSensitive: true,
        allowEmpty: true,
        learnFromData: false,
      },

      Method: {
        allowedValues: ['Practical', 'Current', 'Shortest'],
        aliases: {
          'practical miles': 'Practical',
          'current miles': 'Current',
          'shortest miles': 'Shortest',
        },
        caseSensitive: true,
        allowEmpty: true,
        learnFromData: false,
      },

      mileageEngine: {
        allowedValues: ['Current', 'Practical', 'Shortest'],
        aliases: {},
        caseSensitive: true,
        allowEmpty: true,
        learnFromData: false,
      },

      shipperCountry: {
        allowedValues: ['United States', 'Canada', 'Mexico'],
        aliases: {
          'us': 'United States',
          'usa': 'United States',
          'u.s.': 'United States',
          'u.s.a.': 'United States',
          'ca': 'Canada',
          'can': 'Canada',
          'mx': 'Mexico',
          'mex': 'Mexico',
        },
        caseSensitive: true,
        allowEmpty: true,
        learnFromData: false,
      },

      consigneeCountry: {
        allowedValues: ['United States', 'Canada', 'Mexico'],
        aliases: {
          'us': 'United States',
          'usa': 'United States',
          'u.s.': 'United States',
          'u.s.a.': 'United States',
          'ca': 'Canada',
          'can': 'Canada',
          'mx': 'Mexico',
          'mex': 'Mexico',
        },
        caseSensitive: true,
        allowEmpty: true,
        learnFromData: false,
      },
    };
  }

  /**
   * Learn valid values from an existing data CSV file.
   * Scans non-empty values for each learnable field and adds them
   * to the allowed set, so the validator stays in sync with real data.
   */
  learnFromCsv(csvPath: string): void {
    if (!fs.existsSync(csvPath)) return;

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return;

    const headers = this.parseCsvLineSimple(lines[0]);

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLineSimple(lines[i]);
      for (const [field, rule] of Object.entries(this.fieldRules)) {
        if (!rule.learnFromData) continue;

        const colIdx = headers.findIndex(
          h => h.trim().toLowerCase() === field.toLowerCase()
        );
        if (colIdx === -1 || colIdx >= values.length) continue;

        const val = values[colIdx].trim();
        if (!val) continue;

        if (!this.learnedValues[field]) {
          this.learnedValues[field] = new Set();
        }
        this.learnedValues[field].add(val);
      }
    }

    const learnedSummary = Object.entries(this.learnedValues)
      .map(([f, s]) => `${f}(${s.size})`)
      .join(', ');
    console.log(`📊 DataValidator learned values from ${path.basename(csvPath)}: ${learnedSummary}`);
  }

  /**
   * Validate a single field value.
   * Returns null if valid, or a ValidationResult with correction/error info.
   */
  validateField(field: string, value: string): ValidationResult | null {
    const rule = this.fieldRules[field];
    if (!rule) return null;

    if (!value || !value.trim()) {
      return rule.allowEmpty ? null : {
        field,
        originalValue: value,
        correctedValue: null,
        severity: 'error',
        message: `Field '${field}' cannot be empty`,
      };
    }

    const trimmed = value.trim();
    const lookupKey = rule.caseSensitive ? trimmed : trimmed.toLowerCase();

    // Check direct match against allowed values
    const directMatch = rule.allowedValues.find(av =>
      rule.caseSensitive ? av === trimmed : av.toLowerCase() === lookupKey
    );
    if (directMatch) return null;

    // Check learned values
    const learned = this.learnedValues[field];
    if (learned) {
      const learnedMatch = [...learned].find(lv =>
        rule.caseSensitive ? lv === trimmed : lv.toLowerCase() === lookupKey
      );
      if (learnedMatch) return null;
    }

    // Check aliases for auto-correction
    const aliasKey = trimmed.toLowerCase();
    if (rule.aliases[aliasKey]) {
      return {
        field,
        originalValue: trimmed,
        correctedValue: rule.aliases[aliasKey],
        severity: 'warning',
        message: `Field '${field}': "${trimmed}" auto-corrected to "${rule.aliases[aliasKey]}"`,
      };
    }

    // Fuzzy match: check if value is a case-mismatch of an allowed value
    if (!rule.caseSensitive) {
      const caseMatch = rule.allowedValues.find(
        av => av.toLowerCase() === lookupKey
      );
      if (caseMatch) {
        return {
          field,
          originalValue: trimmed,
          correctedValue: caseMatch,
          severity: 'info',
          message: `Field '${field}': "${trimmed}" normalized to "${caseMatch}"`,
        };
      }
    }

    // No match found — return error
    const allValid = [
      ...rule.allowedValues,
      ...(learned ? [...learned] : []),
    ];
    return {
      field,
      originalValue: trimmed,
      correctedValue: null,
      severity: 'error',
      message: `Field '${field}': "${trimmed}" is not a recognized value. Valid options: ${allValid.slice(0, 10).join(', ')}${allValid.length > 10 ? '...' : ''}`,
    };
  }

  /**
   * Validate all fields in a test data record.
   * Returns a full report with corrections, errors, and warnings.
   */
  validateTestData(testCaseId: string, testData: Record<string, any>): ValidationReport {
    const corrections: ValidationResult[] = [];
    const errors: ValidationResult[] = [];
    const warnings: ValidationResult[] = [];

    for (const field of Object.keys(this.fieldRules)) {
      const value = testData[field];
      if (value === undefined || value === null) continue;

      const result = this.validateField(field, String(value));
      if (!result) continue;

      switch (result.severity) {
        case 'error':
          errors.push(result);
          break;
        case 'warning':
          corrections.push(result);
          warnings.push(result);
          break;
        case 'info':
          corrections.push(result);
          break;
      }
    }

    return {
      testCaseId,
      isValid: errors.length === 0,
      corrections,
      errors,
      warnings,
    };
  }

  /**
   * Validate and auto-correct test data in-place.
   * Modifies the testData record directly and returns the report.
   */
  validateAndCorrect(testCaseId: string, testData: Record<string, any>): ValidationReport {
    const report = this.validateTestData(testCaseId, testData);

    for (const correction of report.corrections) {
      if (correction.correctedValue !== null) {
        testData[correction.field] = correction.correctedValue;
      }
    }

    return report;
  }

  /**
   * Validate and auto-correct a CSV data file in-place.
   * Reads the file, corrects ambiguous values, writes back, and returns a summary.
   */
  validateAndCorrectCsvFile(csvPath: string): {
    totalRows: number;
    correctedRows: number;
    reports: ValidationReport[];
  } {
    if (!fs.existsSync(csvPath)) {
      return { totalRows: 0, correctedRows: 0, reports: [] };
    }

    this.learnFromCsv(csvPath);

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    const nonEmptyLines = lines.filter(l => l.trim());
    if (nonEmptyLines.length < 2) {
      return { totalRows: 0, correctedRows: 0, reports: [] };
    }

    const headerLine = nonEmptyLines[0];
    const headers = this.parseCsvLineSimple(headerLine);
    const reports: ValidationReport[] = [];
    let correctedRows = 0;
    let modified = false;

    const idColIdx = headers.findIndex(
      h => h.trim().toLowerCase().replace(/[\s_-]/g, '') === 'testscriptid'
    );

    const outputLines = [headerLine];

    for (let i = 1; i < nonEmptyLines.length; i++) {
      const values = this.parseCsvLineSimple(nonEmptyLines[i]);
      const testCaseId = idColIdx >= 0 && idColIdx < values.length
        ? values[idColIdx].trim()
        : `Row-${i}`;

      let rowModified = false;
      const corrections: ValidationResult[] = [];
      const rowErrors: ValidationResult[] = [];
      const rowWarnings: ValidationResult[] = [];

      for (const [field] of Object.entries(this.fieldRules)) {
        const colIdx = headers.findIndex(
          h => h.trim().toLowerCase() === field.toLowerCase()
        );
        if (colIdx === -1 || colIdx >= values.length) continue;

        const result = this.validateField(field, values[colIdx]);
        if (!result) continue;

        if (result.correctedValue !== null) {
          values[colIdx] = result.correctedValue;
          rowModified = true;
          modified = true;
          corrections.push(result);
        }

        if (result.severity === 'error') rowErrors.push(result);
        if (result.severity === 'warning') rowWarnings.push(result);
      }

      if (rowModified) correctedRows++;

      if (corrections.length > 0 || rowErrors.length > 0) {
        reports.push({
          testCaseId,
          isValid: rowErrors.length === 0,
          corrections,
          errors: rowErrors,
          warnings: rowWarnings,
        });
      }

      outputLines.push(values.join(','));
    }

    if (modified) {
      const trailingNewline = content.endsWith('\n') ? '\n' : '';
      fs.writeFileSync(csvPath, outputLines.join('\n') + trailingNewline, 'utf-8');
    }

    return {
      totalRows: nonEmptyLines.length - 1,
      correctedRows,
      reports,
    };
  }

  /**
   * Print a human-readable validation summary to the console.
   */
  printReport(reports: ValidationReport[]): void {
    if (reports.length === 0) {
      console.log('✅ DataValidator: All CSV values are valid — no corrections needed.');
      return;
    }

    console.log(`\n╔══════════════════════════════════════════════════════╗`);
    console.log(`║  📊 Data Validation Report                            ║`);
    console.log(`╚══════════════════════════════════════════════════════╝\n`);

    for (const report of reports) {
      const icon = report.isValid ? '⚠️' : '❌';
      console.log(`${icon} ${report.testCaseId}:`);

      for (const c of report.corrections) {
        console.log(`   🔧 ${c.message}`);
      }
      for (const e of report.errors) {
        console.log(`   ❌ ${e.message}`);
      }
    }

    const totalCorrections = reports.reduce((n, r) => n + r.corrections.length, 0);
    const totalErrors = reports.reduce((n, r) => n + r.errors.length, 0);
    console.log(`\n   Summary: ${totalCorrections} auto-correction(s), ${totalErrors} error(s)\n`);
  }

  /**
   * Minimal CSV line parser (handles basic quoting).
   */
  private parseCsvLineSimple(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }
}

export default new DataValidator();
