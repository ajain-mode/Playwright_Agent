/**
 * Test Case Matcher
 *
 * Compares a new test case against existing test cases and generated specs
 * to find the most similar match. Uses tag overlap, step-action fingerprinting,
 * and functional pattern detection to rank similarity.
 *
 * When a match is found:
 * 1. Missing CSV data is inherited from the matched test case
 * 2. The matched spec file is used as the reference template for code generation
 *
 * @author AI Agent Generator
 * @created 2026-03-05
 */

import fs from 'fs';
import path from 'path';
import { TestCaseInput } from '../types/TestCaseTypes';

// ─────────────────────────── Types ───────────────────────────

export interface MatchResult {
  /** The best matching test case ID (e.g. "BT-67847") */
  matchedId: string;
  /** Similarity score 0-1 */
  score: number;
  /** Path to the matched spec file */
  specPath: string;
  /** Test data row from the matched test case's CSV */
  matchedData: Record<string, string>;
  /** Which aspects contributed to the match */
  reasons: string[];
}

interface ExistingTestCase {
  id: string;
  title: string;
  category: string;
  tags: string[];
  stepsText: string;
  expectedText: string;
  preconditionText: string;
  specPath: string;
  csvData: Record<string, string>;
}

// Step action patterns for functional fingerprinting
const FUNCTIONAL_PATTERNS: Record<string, RegExp[]> = {
  'billing-toggle': [
    /view\s+billing/i,
    /billing\s+toggle/i,
    /carrier\s+invoice/i,
    /not\s+deliv/i,
  ],
  'carrier-auto-accept': [
    /carrier\s+auto\s+accept/i,
    /carrier\s+contact\s+for\s+rate/i,
    /post\s+button/i,
    /dme.*load/i,
    /tnx.*active\s+jobs/i,
  ],
  'post-automation-rule': [
    /post\s+automation/i,
    /create\s+new\s+entry/i,
    /office\s+config/i,
  ],
  'load-create-basic': [
    /create\s+tl\s+\*new\*/i,
    /enter\s+new\s+load/i,
    /create\s+load/i,
  ],
  'payable-toggle': [
    /payable\s+toggle/i,
    /price\s+difference/i,
    /view\s+history/i,
    /secondary\s+invoice/i,
  ],
  'carrier-tab-setup': [
    /carrier\s+tab/i,
    /offer\s+rate/i,
    /choose\s+.*carrier/i,
    /include\s+carrier/i,
  ],
  'customer-search': [
    /customer.*search/i,
    /view\s+customer/i,
    /customer\s+detail/i,
  ],
  'form-fill': [
    /shipper.*field/i,
    /consignee.*field/i,
    /equipment.*field/i,
    /mileage.*engine/i,
  ],
  'document-upload': [
    /upload.*document/i,
    /proof\s+of\s+delivery/i,
    /carrier\s+invoice/i,
    /document\s+type/i,
  ],
};

// ─────────────────────────── Matcher ───────────────────────────

export class TestCaseMatcher {
  private projectRoot: string;
  private existingTestCases: ExistingTestCase[] | null = null;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * Find the most similar existing test case for a new test case.
   * Returns null if no good match is found (score < 0.3).
   */
  findBestMatch(newTestCase: TestCaseInput): MatchResult | null {
    const existing = this.loadExistingTestCases();
    if (existing.length === 0) return null;

    // Don't match against self
    const candidates = existing.filter(e => e.id !== newTestCase.id);
    if (candidates.length === 0) return null;

    const newStepsText = newTestCase.steps.map(s => s.action).join('\n');
    const newExpectedText = (newTestCase.expectedResults || []).join('\n');
    const newPrecondText = (newTestCase.preconditions || []).join('\n');
    const newTags = newTestCase.tags || [];
    const newFingerprint = this.extractFunctionalFingerprint(
      newStepsText + '\n' + newExpectedText + '\n' + newPrecondText
    );

    let bestMatch: MatchResult | null = null;
    let bestScore = 0;

    const newTitle = newTestCase.title || newTestCase.description || '';

    for (const candidate of candidates) {
      const reasons: string[] = [];
      let score = 0;

      // 1. Title/description similarity (weight: 0.30) — strongest signal
      // An identical title means the test cases are testing the same thing.
      const titleSimilarity = this.computeStepSimilarity(newTitle, candidate.title);
      if (titleSimilarity > 0) {
        score += titleSimilarity * 0.30;
        reasons.push(`title=${(titleSimilarity * 100).toFixed(0)}%`);
      }

      // 2. Tag overlap (weight: 0.15)
      const tagOverlap = this.computeTagOverlap(newTags, candidate.tags);
      if (tagOverlap > 0) {
        score += tagOverlap * 0.15;
        reasons.push(`tags=${(tagOverlap * 100).toFixed(0)}%`);
      }

      // 3. Same category (weight: 0.10)
      if (newTestCase.category === candidate.category) {
        score += 0.10;
        reasons.push('same-category');
      }

      // 4. Functional pattern overlap (weight: 0.25)
      const candidateFingerprint = this.extractFunctionalFingerprint(
        candidate.stepsText + '\n' + candidate.expectedText + '\n' + candidate.preconditionText
      );
      const patternOverlap = this.computePatternOverlap(newFingerprint, candidateFingerprint);
      if (patternOverlap > 0) {
        score += patternOverlap * 0.25;
        reasons.push(`patterns=${(patternOverlap * 100).toFixed(0)}%`);
      }

      // 5. Step-action keyword similarity (weight: 0.15)
      const stepSimilarity = this.computeStepSimilarity(newStepsText, candidate.stepsText);
      if (stepSimilarity > 0) {
        score += stepSimilarity * 0.15;
        reasons.push(`steps=${(stepSimilarity * 100).toFixed(0)}%`);
      }

      // Small bonus for candidates with an existing spec file (prefer referenceable matches)
      if (candidate.specPath) {
        score += 0.05;
        reasons.push('has-spec');
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          matchedId: candidate.id,
          score,
          specPath: candidate.specPath,
          matchedData: candidate.csvData,
          reasons,
        };
      }
    }

    // Only return matches above threshold
    if (bestMatch && bestMatch.score >= 0.3) {
      return bestMatch;
    }
    return null;
  }

  /**
   * Inherit missing data fields from a matched test case's CSV row.
   * Only fills in fields that are empty/missing in the new test case's data.
   */
  inheritMissingData(
    newTestData: Record<string, any>,
    matchedData: Record<string, string>,
    matchedId: string
  ): { inherited: string[]; data: Record<string, any> } {
    const merged = { ...newTestData };
    const inherited: string[] = [];

    // Fields that are test-case-specific and should NOT be inherited
    const skipFields = new Set([
      'Test Script ID', 'testCaseId', 'testscriptid',
    ]);

    for (const [key, value] of Object.entries(matchedData)) {
      if (skipFields.has(key)) continue;
      if (!value || value.trim() === '') continue;

      // Only fill if the new test case doesn't already have this field
      const existingVal = merged[key];
      if (!existingVal || (typeof existingVal === 'string' && existingVal.trim() === '')) {
        merged[key] = value;
        inherited.push(key);
      }
    }

    if (inherited.length > 0) {
      console.log(`   📋 Inherited ${inherited.length} field(s) from ${matchedId}: ${inherited.slice(0, 8).join(', ')}${inherited.length > 8 ? '...' : ''}`);
    }

    return { inherited, data: merged };
  }

  // ─────────────────────── Internal Methods ───────────────────────

  /**
   * Load all existing test cases from sample-testcases.csv and cross-reference
   * with generated spec files and data CSVs.
   */
  private loadExistingTestCases(): ExistingTestCase[] {
    if (this.existingTestCases !== null) return this.existingTestCases;

    this.existingTestCases = [];

    // Load from sample-testcases.csv
    const csvPath = path.resolve(this.projectRoot, 'src/agent/examples/sample-testcases.csv');
    if (!fs.existsSync(csvPath)) return this.existingTestCases;

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split(/\r?\n/);
    if (lines.length < 2) return this.existingTestCases;

    // Parse CSV rows (handle quoted fields with commas)
    const rows = this.parseCSVRows(lines);

    for (const row of rows) {
      const caseId = (row['Case ID'] || '').trim();
      if (!caseId || caseId === 'Case ID') continue;

      const title = (row['Case'] || row['Title'] || '').trim();
      const tags = (row['Tags'] || '').split(',').map(t => t.trim()).filter(Boolean);
      const stepsText = row['Test Steps'] || '';
      const expectedText = row['Expected'] || '';
      const preconditionText = row['Precondition'] || '';

      // Determine category from tags
      const category = this.detectCategoryFromTags(tags);

      // Find corresponding spec file
      const specPath = this.findSpecFile(caseId, category);

      // Load CSV data row for this test case
      const csvData = this.loadCsvDataRow(caseId, category);

      // Include all test cases for similarity matching (data inheritance works without spec files)
      this.existingTestCases.push({
        id: this.prefixId(caseId, category),
        title,
        category,
        tags,
        stepsText,
        expectedText,
        preconditionText,
        specPath,
        csvData,
      });
    }

    console.log(`   🔍 TestCaseMatcher: Loaded ${this.existingTestCases.length} existing test case(s) for similarity matching`);
    return this.existingTestCases;
  }

  /**
   * Parse CSV content handling quoted fields with embedded commas and newlines.
   */
  private parseCSVRows(lines: string[]): Record<string, string>[] {
    // Rejoin lines into single content, then split into logical rows
    const fullContent = lines.join('\n');
    const rows: Record<string, string>[] = [];

    // Extract header
    const headerEnd = fullContent.indexOf('\n');
    if (headerEnd === -1) return rows;
    const headers = this.splitCSVLine(fullContent.substring(0, headerEnd));

    // Parse data rows: handle multi-line quoted fields
    let pos = headerEnd + 1;
    while (pos < fullContent.length) {
      const { fields, endPos } = this.parseCSVRecord(fullContent, pos);
      pos = endPos;

      if (fields.length === 0) continue;

      const row: Record<string, string> = {};
      for (let i = 0; i < headers.length && i < fields.length; i++) {
        row[headers[i].trim()] = fields[i];
      }
      rows.push(row);
    }

    return rows;
  }

  /**
   * Parse a single CSV record starting at position, handling multi-line quoted fields.
   */
  private parseCSVRecord(content: string, startPos: number): { fields: string[]; endPos: number } {
    const fields: string[] = [];
    let pos = startPos;
    let field = '';
    let inQuotes = false;

    while (pos < content.length) {
      const ch = content[pos];

      if (inQuotes) {
        if (ch === '"') {
          if (pos + 1 < content.length && content[pos + 1] === '"') {
            field += '"';
            pos += 2;
          } else {
            inQuotes = false;
            pos++;
          }
        } else {
          field += ch;
          pos++;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
          pos++;
        } else if (ch === ',') {
          fields.push(field.trim());
          field = '';
          pos++;
        } else if (ch === '\n') {
          fields.push(field.trim());
          pos++;
          break;
        } else if (ch === '\r') {
          pos++;
        } else {
          field += ch;
          pos++;
        }
      }
    }

    // End of content
    if (field || fields.length > 0) {
      fields.push(field.trim());
    }

    return { fields, endPos: pos };
  }

  private splitCSVLine(line: string): string[] {
    const result = this.parseCSVRecord(line + '\n', 0);
    return result.fields;
  }

  /**
   * Extract functional fingerprint — a set of high-level patterns detected in the text.
   */
  private extractFunctionalFingerprint(text: string): Set<string> {
    const fingerprint = new Set<string>();
    for (const [pattern, regexes] of Object.entries(FUNCTIONAL_PATTERNS)) {
      const matchCount = regexes.filter(r => r.test(text)).length;
      if (matchCount >= 2 || (regexes.length <= 2 && matchCount >= 1)) {
        fingerprint.add(pattern);
      }
    }
    return fingerprint;
  }

  /**
   * Compute Jaccard overlap between two tag sets.
   */
  private computeTagOverlap(tagsA: string[], tagsB: string[]): number {
    // Exclude generic tags
    const exclude = new Set(['aiteam']);
    const setA = new Set(tagsA.filter(t => !exclude.has(t)));
    const setB = new Set(tagsB.filter(t => !exclude.has(t)));
    if (setA.size === 0 && setB.size === 0) return 0;

    let intersection = 0;
    for (const t of setA) {
      if (setB.has(t)) intersection++;
    }
    const union = new Set([...setA, ...setB]).size;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Compute pattern fingerprint overlap (Jaccard).
   */
  private computePatternOverlap(fpA: Set<string>, fpB: Set<string>): number {
    if (fpA.size === 0 && fpB.size === 0) return 0;
    let intersection = 0;
    for (const p of fpA) {
      if (fpB.has(p)) intersection++;
    }
    const union = new Set([...fpA, ...fpB]).size;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Compute step-level keyword similarity using normalized keyword sets.
   */
  private computeStepSimilarity(stepsA: string, stepsB: string): number {
    const kwA = this.extractKeywords(stepsA);
    const kwB = this.extractKeywords(stepsB);
    if (kwA.size === 0 && kwB.size === 0) return 0;

    let intersection = 0;
    for (const kw of kwA) {
      if (kwB.has(kw)) intersection++;
    }
    const union = new Set([...kwA, ...kwB]).size;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Extract meaningful keywords from step text (ignoring noise words).
   */
  private extractKeywords(text: string): Set<string> {
    const noise = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
      'should', 'may', 'might', 'must', 'can', 'could', 'to', 'of', 'in',
      'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
      'during', 'before', 'after', 'above', 'below', 'between', 'out',
      'up', 'down', 'and', 'but', 'or', 'nor', 'not', 'no', 'so', 'if',
      'then', 'else', 'when', 'than', 'that', 'this', 'it', 'its',
      'step', 'click', 'enter', 'select', 'field', 'page', 'button',
      'value', 'eg', 'once', 'need', 'already', 'also', 'user', 'get',
      'navigate', 'now', 'new', 'under', 'scroll', 'down', 'visible',
    ]);

    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !noise.has(w));

    return new Set(words);
  }

  /**
   * Detect category from tags.
   */
  private detectCategoryFromTags(tags: string[]): string {
    const tagSet = new Set(tags.map(t => t.toLowerCase()));
    if (tagSet.has('billingtoggle')) return 'billingtoggle';
    if (tagSet.has('payabletoggle')) return 'billingtoggle';
    if (tagSet.has('dfb') || tagSet.has('carrierautoaccept')) return 'dfb';
    if (tagSet.has('carrier')) return 'carrier';
    if (tagSet.has('commission')) return 'commission';
    if (tagSet.has('edi')) return 'edi';
    if (tagSet.has('saleslead')) return 'salesLead';
    if (tagSet.has('bulkchange')) return 'bulkChange';
    if (tagSet.has('dat')) return 'dat';
    return 'dfb'; // default
  }

  /**
   * Prefix a raw case ID with category abbreviation.
   */
  private prefixId(caseId: string, category: string): string {
    const prefixMap: Record<string, string> = {
      dfb: 'DFB', billingtoggle: 'BT', carrier: 'CAR', commission: 'COM',
      edi: 'EDI', salesLead: 'SL', bulkChange: 'BULK', dat: 'DAT',
    };
    const prefix = prefixMap[category] || category.toUpperCase();
    if (caseId.includes('-')) return caseId; // Already prefixed
    return `${prefix}-${caseId}`;
  }

  /**
   * Find the spec file for a given test case ID.
   */
  private findSpecFile(caseId: string, category: string): string {
    const generatedDir = path.resolve(this.projectRoot, 'src/tests/generated');
    const prefixed = this.prefixId(caseId, category);

    // Try exact match in category folder
    const candidates = [
      path.join(generatedDir, category, `${prefixed}.spec.ts`),
      path.join(generatedDir, category, `${caseId}.spec.ts`),
    ];

    // Also check dfb folder for cross-category references
    if (category !== 'dfb') {
      candidates.push(
        path.join(generatedDir, 'dfb', `DFB-${caseId}.spec.ts`),
        path.join(generatedDir, 'dfb', `${caseId}.spec.ts`),
      );
    }

    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return '';
  }

  /**
   * Load test data row from the category's data CSV for a given test case ID.
   */
  private loadCsvDataRow(caseId: string, category: string): Record<string, string> {
    const csvMap: Record<string, string> = {
      dfb: 'src/data/dfb/dfbdata.csv',
      billingtoggle: 'src/data/billingtoggle/billingtoggledata.csv',
      carrier: 'src/data/carrier/carrierdata.csv',
      commission: 'src/data/commission/commissiondata.csv',
      edi: 'src/data/edi/edidata.csv',
      salesLead: 'src/data/salesLead/salesleaddata.csv',
      bulkChange: 'src/data/bulkChange/bulkchangedata.csv',
      dat: 'src/data/dat/datdata.csv',
    };

    const csvRelPath = csvMap[category];
    if (!csvRelPath) return {};

    const csvPath = path.resolve(this.projectRoot, csvRelPath);
    if (!fs.existsSync(csvPath)) return {};

    try {
      const content = fs.readFileSync(csvPath, 'utf-8');
      const lines = content.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) return {};

      const headers = this.splitCSVLine(lines[0]);
      const prefixed = this.prefixId(caseId, category);

      for (let i = 1; i < lines.length; i++) {
        const fields = this.splitCSVLine(lines[i]);
        const id = (fields[0] || '').trim();
        if (id === prefixed || id === caseId) {
          const row: Record<string, string> = {};
          for (let j = 0; j < headers.length && j < fields.length; j++) {
            row[headers[j].trim()] = fields[j];
          }
          return row;
        }
      }
    } catch {
      // Silently fail
    }
    return {};
  }
}
