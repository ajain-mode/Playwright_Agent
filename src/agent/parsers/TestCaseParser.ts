/**
 * Test Case Parser
 * Parses test case descriptions and extracts structured data
 * Supports JSON, text, CSV, and XLSX file formats
 * 
 * @author AI Agent Generator
 * @created 2026-02-05
 */

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import {
  TestCaseInput,
  TestStep,
  TestCategory,
  TestType,
  TestData,
  ExplicitValues
} from '../types/TestCaseTypes';

export class TestCaseParser {
  
  // Keywords for detecting test categories
  private readonly categoryKeywords: Record<TestCategory, string[]> = {
    dfb: ['dfb', 'cargo value', 'post load', 'tnx', 'include carrier', 'exclude carrier', 'waterfall', 'post automation', 'nontabular', 'non-tabular', 'non tabular'],
    edi: ['edi', '204', '214', '990', '210', 'tender', 'electronic data'],
    commission: ['commission', 'audit', 'internal share', 'agent commission'],
    salesLead: ['sales lead', 'lead', 'new customer', 'activation', 'clearance queue'],
    banyan: ['banyan', 'ltl quote', 'ltl rate'],
    carrier: ['carrier', 'carrier status', 'carrier profile', 'dnl'],
    bulkChange: ['bulk change', 'bulk update', 'mass edit'],
    dat: ['dat', 'loadboard'],
    nonOperationalLoads: ['non-operational', 'non operational', 'dead load'],
    api: ['api', 'rest', 'endpoint', 'request', 'response'],
    custom: []
  };

  // Keywords for detecting test types
  private readonly testTypeKeywords: Record<TestType, string[]> = {
    'non-tabular-load': ['non-tabular', 'non tabular', 'create load', 'new load'],
    'tabular-load': ['tabular', 'edit load', 'tabular fields'],
    'duplicate-load': ['duplicate', 'copy load', 'clone load'],
    'edi-load': ['edi load', 'edi tender', '204 load'],
    'template-load': ['template', 'load template', 'create from template'],
    'post-automation': ['post automation', 'automation rule', 'auto post'],
    'carrier-validation': ['carrier validation', 'verify carrier', 'carrier check'],
    'customer-validation': ['customer validation', 'verify customer', 'customer check'],
    'multi-app': ['dme', 'tnx', 'multi-app', 'cross application', 'multiple applications'],
    'api-test': ['api test', 'api request', 'endpoint test'],
    'generic': []
  };

  /**
   * Parse a raw test case description into structured format
   */
  parseTestCase(rawInput: string | object): TestCaseInput {
    if (typeof rawInput === 'string') {
      return this.parseFromText(rawInput);
    }
    return this.parseFromObject(rawInput as Record<string, any>);
  }

  /**
   * Parse test case from plain text description
   */
  private parseFromText(text: string): TestCaseInput {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Extract test case ID
    const idMatch = text.match(/(?:test\s*case\s*id|tc|dfb|edi)[-:\s]*([A-Z0-9-]+)/i);
    const id = idMatch ? idMatch[1] : this.generateTestCaseId();

    // Extract title
    const titleMatch = text.match(/(?:title|test\s*case)[:]\s*(.+)/i);
    const title = titleMatch ? titleMatch[1].trim() : lines[0];

    // Extract tags first so we can use them for category detection
    const preliminaryTags = this.extractTags(text, 'custom');

    // Detect category (using both text and tags)
    const category = this.detectCategory(text, preliminaryTags);

    // Extract steps
    const steps = this.extractSteps(text);

    // Extract expected results
    const expectedResults = this.extractExpectedResults(text);

    // Extract preconditions
    const preconditions = this.extractPreconditions(text);

    // Re-extract tags with correct category
    const tags = this.extractTags(text, category);

    return {
      id,
      title,
      description: text,
      category,
      priority: this.detectPriority(text),
      tags,
      preconditions,
      steps,
      expectedResults
    };
  }

  /**
   * Parse test case from object format
   */
  private parseFromObject(obj: Record<string, any>): TestCaseInput {
    return {
      id: obj.id || obj.testCaseId || this.generateTestCaseId(),
      title: obj.title || obj.name || 'Untitled Test Case',
      description: obj.description || '',
      category: obj.category || this.detectCategory(obj.description || ''),
      priority: obj.priority || 'medium',
      tags: obj.tags || [],
      preconditions: obj.preconditions || [],
      steps: this.normalizeSteps(obj.steps || []),
      expectedResults: obj.expectedResults || obj.expected || [],
      testData: obj.testData || obj.data || {}
    };
  }

  /**
   * Detect test category from description and optional tags
   */
  detectCategory(text: string, tags?: string[]): TestCategory {
    const lowerText = text.toLowerCase();
    
    // First check the text/description for category keywords
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category as TestCategory;
      }
    }
    
    // If no match found in text, check tags
    if (tags && tags.length > 0) {
      const tagText = tags.join(' ').toLowerCase();
      for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
        if (keywords.some(keyword => tagText.includes(keyword))) {
          return category as TestCategory;
        }
      }
      // Also check direct category name in tags
      const categoryNames = ['dfb', 'edi', 'commission', 'carrier', 'saleslead', 'salesLead', 'banyan', 'dat', 'api', 'bulkchange', 'bulkChange'];
      for (const catName of categoryNames) {
        if (tagText.includes(catName.toLowerCase())) {
          return this.mapCategoryString(catName);
        }
      }
    }
    
    return 'custom';
  }

  /**
   * Detect test type from description
   */
  detectTestType(text: string): TestType {
    const lowerText = text.toLowerCase();
    
    for (const [type, keywords] of Object.entries(this.testTypeKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return type as TestType;
      }
    }
    
    return 'generic';
  }

  /**
   * Extract test steps from text
   * Handles multiple formats: numbered, semicolon-separated, bullet points, sentences
   */
  private extractSteps(text: string): TestStep[] {
    const steps: TestStep[] = [];

    // First, normalize semicolon-separated numbered steps (common in CSV)
    // Pattern: "1. Action;2. Action;3. Action"
    const semicolonSteps = text.split(/;/).map(s => s.trim()).filter(s => s);
    const hasNumberedSemicolonSteps = semicolonSteps.some(s => /^\d+[\.\):\s]/.test(s));
    
    if (hasNumberedSemicolonSteps && semicolonSteps.length > 1) {
      semicolonSteps.forEach((step, index) => {
        // Remove the number prefix if present
        const actionMatch = step.match(/^\d+[\.\):\s]+(.+)/);
        const action = actionMatch ? actionMatch[1].trim() : step.trim();
        if (action && action.length > 0) {
          steps.push({
            stepNumber: index + 1,
            action: action
          });
        }
      });
      if (steps.length > 0) return steps;
    }

    // Try numbered steps with newlines
    const numberedSteps = text.match(/(?:step\s*)?(\d+)[\.\):\s]+([^\n;]+)/gi);
    if (numberedSteps && numberedSteps.length > 0) {
      numberedSteps.forEach((match, index) => {
        const actionMatch = match.match(/(?:step\s*)?(\d+)[\.\):\s]+(.+)/i);
        if (actionMatch) {
          const action = actionMatch[2].trim();
          if (action && action.length > 0) {
            steps.push({
              stepNumber: index + 1,
              action: action
            });
          }
        }
      });
      if (steps.length > 0) return steps;
    }

    // If no numbered steps, try bullet points
    if (steps.length === 0) {
      const bulletSteps = text.match(/^\s*[-•*]\s*(.+)$/gm);
      if (bulletSteps) {
        bulletSteps.forEach((step, index) => {
          const action = step.replace(/^\s*[-•*]\s*/, '').trim();
          if (action && action.length > 0) {
            steps.push({
              stepNumber: index + 1,
              action: action
            });
          }
        });
      }
      if (steps.length > 0) return steps;
    }

    // If still no steps, split by semicolons (even without numbers)
    if (steps.length === 0 && text.includes(';')) {
      const semiParts = text.split(';').map(s => s.trim()).filter(s => s.length > 3);
      semiParts.forEach((action, index) => {
        steps.push({
          stepNumber: index + 1,
          action: action
        });
      });
      if (steps.length > 0) return steps;
    }

    // Last resort: create from sentences
    if (steps.length === 0) {
      const sentences = text.split(/[.]/).filter(s => 
        s.trim().length > 10 && 
        !s.toLowerCase().includes('test case') &&
        !s.toLowerCase().includes('expected')
      );
      
      sentences.slice(0, 10).forEach((sentence, index) => {
        steps.push({
          stepNumber: index + 1,
          action: sentence.trim()
        });
      });
    }

    return steps;
  }

  /**
   * Extract expected results from text
   */
  private extractExpectedResults(text: string): string[] {
    const results: string[] = [];
    
    // Look for expected results section
    const expectedMatch = text.match(/(?:expected\s*result|expected|verify|validate|assert)s?[:]\s*(.+?)(?=(?:step|precondition|note)|$)/gi);
    
    if (expectedMatch) {
      expectedMatch.forEach(match => {
        const result = match.replace(/(?:expected\s*result|expected|verify|validate|assert)s?[:]\s*/i, '').trim();
        if (result) {
          results.push(result);
        }
      });
    }

    // Also look for specific assertion keywords
    const assertionPatterns = [
      /should\s+(.+?)(?=\.|$)/gi,
      /verify\s+(?:that\s+)?(.+?)(?=\.|$)/gi,
      /validate\s+(?:that\s+)?(.+?)(?=\.|$)/gi,
      /assert\s+(?:that\s+)?(.+?)(?=\.|$)/gi
    ];

    assertionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = match.replace(/^(should|verify|validate|assert)(\s+that)?\s*/i, '').trim();
          if (cleaned && !results.includes(cleaned)) {
            results.push(cleaned);
          }
        });
      }
    });

    return results;
  }

  /**
   * Extract preconditions from text
   */
  private extractPreconditions(text: string): string[] {
    const preconditions: string[] = [];
    
    // Look for preconditions section
    const preconMatch = text.match(/(?:precondition|prerequisite|setup|given)s?[:]\s*(.+?)(?=(?:step|expected|when|then)|$)/gi);
    
    if (preconMatch) {
      preconMatch.forEach(match => {
        const condition = match.replace(/(?:precondition|prerequisite|setup|given)s?[:]\s*/i, '').trim();
        if (condition) {
          preconditions.push(condition);
        }
      });
    }

    return preconditions;
  }

  /**
   * Extract tags from text
   */
  private extractTags(text: string, category: TestCategory): string[] {
    const tags: string[] = [`@${category}`];
    
    // Look for explicit tags
    const tagMatches = text.match(/@[\w-]+/g);
    if (tagMatches) {
      tagMatches.forEach(tag => {
        if (!tags.includes(tag)) {
          tags.push(tag);
        }
      });
    }

    // Add common tags based on content
    const lowerText = text.toLowerCase();
    if (lowerText.includes('smoke')) tags.push('@smoke');
    if (lowerText.includes('regression')) tags.push('@regression');
    if (lowerText.includes('critical')) tags.push('@critical');
    if (lowerText.includes('api')) tags.push('@api');
    if (lowerText.includes('tnx')) tags.push('@tnx');
    if (lowerText.includes('dme')) tags.push('@dme');

    return [...new Set(tags)];
  }

  /**
   * Detect priority from text
   */
  private detectPriority(text: string): 'critical' | 'high' | 'medium' | 'low' {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('critical') || lowerText.includes('blocker')) return 'critical';
    if (lowerText.includes('high') || lowerText.includes('important')) return 'high';
    if (lowerText.includes('low') || lowerText.includes('minor')) return 'low';
    
    return 'medium';
  }

  /**
   * Normalize steps from various formats
   */
  private normalizeSteps(steps: any[]): TestStep[] {
    return steps.map((step, index) => {
      if (typeof step === 'string') {
        return {
          stepNumber: index + 1,
          action: step
        };
      }
      return {
        stepNumber: step.stepNumber || step.step || index + 1,
        action: step.action || step.description || step.text || '',
        expectedResult: step.expectedResult || step.expected,
        data: step.data
      };
    });
  }

  /**
   * Generate a unique test case ID
   */
  private generateTestCaseId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `TC-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Parse test data from CSV row data
   */
  parseTestDataFromCSV(csvRow: Record<string, string>): TestData {
    return {
      testCaseId: csvRow['Test Script ID'] || csvRow['testCaseId'] || '',
      officeName: csvRow['officeName'] || '',
      customerName: csvRow['customerName'] || '',
      shipperName: csvRow['shipperName'] || '',
      consigneeName: csvRow['consigneeName'] || '',
      salesAgent: csvRow['salesAgent'] || '',
      equipmentType: csvRow['equipmentType'] || '',
      shipperZip: csvRow['shipperZip'] || '',
      consigneeZip: csvRow['consigneeZip'] || '',
      shipperCity: csvRow['shipperCity'] || '',
      consigneeCity: csvRow['consigneeCity'] || '',
      shipperState: csvRow['shipperState'] || '',
      consigneeState: csvRow['consigneeState'] || '',
      shipperCountry: csvRow['shipperCountry'] || '',
      consigneeCountry: csvRow['consigneeCountry'] || '',
      offerRate: csvRow['offerRate'] || csvRow['Offer Rate'] || '',
      bidRate: csvRow['bidRate'] || '',
      rateType: csvRow['rateType'] || 'SPOT',
      loadMethod: csvRow['loadMethod'] || 'TruckLoad',
      shipperEarliestTime: csvRow['shipperEarliestTime'] || '',
      shipperLatestTime: csvRow['shipperLatestTime'] || '',
      consigneeEarliestTime: csvRow['consigneeEarliestTime'] || '',
      consigneeLatestTime: csvRow['consigneeLatestTime'] || '',
      shipmentCommodityQty: csvRow['shipmentCommodityQty'] || '',
      shipmentCommodityUoM: csvRow['shipmentCommodityUoM'] || '',
      shipmentCommodityDescription: csvRow['shipmentCommodityDescription'] || '',
      shipmentCommodityWeight: csvRow['shipmentCommodityWeight'] || '',
      equipmentLength: csvRow['equipmentLength'] || '',
      Method: csvRow['Method'] || 'Practical',
      saleAgentEmail: csvRow['saleAgentEmail'] || '',
      shipperAddress: csvRow['shipperAddress'] || '',
      consigneeAddress: csvRow['consigneeAddress'] || '',
      ...csvRow
    };
  }

  /**
   * Batch parse multiple test cases
   */
  parseMultipleTestCases(inputs: (string | object)[]): TestCaseInput[] {
    return inputs.map(input => this.parseTestCase(input));
  }

  /**
   * Parse test cases from a file (supports JSON, TXT, CSV, XLSX)
   */
  parseFromFile(filePath: string): TestCaseInput[] {
    const ext = path.extname(filePath).toLowerCase();
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    switch (ext) {
      case '.json':
        return this.parseFromJsonFile(filePath);
      case '.txt':
        return this.parseFromTextFile(filePath);
      case '.csv':
        return this.parseFromCsvFile(filePath);
      case '.xlsx':
      case '.xls':
        return this.parseFromExcelFile(filePath);
      default:
        throw new Error(`Unsupported file format: ${ext}. Supported formats: .json, .txt, .csv, .xlsx, .xls`);
    }
  }

  /**
   * Parse test cases from JSON file
   */
  private parseFromJsonFile(filePath: string): TestCaseInput[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Handle array of test cases
    if (Array.isArray(data)) {
      return data.map(item => this.parseTestCase(item));
    }
    
    // Handle single test case
    return [this.parseTestCase(data)];
  }

  /**
   * Parse test cases from text file
   */
  private parseFromTextFile(filePath: string): TestCaseInput[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if multiple test cases separated by delimiter
    const delimiter = /\n={3,}\n|\n-{3,}\n|\n#{3,}\n/;
    if (delimiter.test(content)) {
      const sections = content.split(delimiter).filter(s => s.trim());
      return sections.map(section => this.parseTestCase(section));
    }
    
    return [this.parseTestCase(content)];
  }

  /**
   * Parse test cases from CSV file
   */
  parseFromCsvFile(filePath: string): TestCaseInput[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = this.parseCSVContent(content);
    
    if (rows.length === 0) {
      throw new Error('CSV file is empty or has no valid data rows');
    }

    return rows.map(row => this.parseTestCaseFromRow(row));
  }

  /**
   * Parse CSV content into array of objects.
   * Properly handles multi-line quoted fields (e.g., Precondition, Test Steps).
   */
  private parseCSVContent(content: string): Record<string, string>[] {
    // Split content into logical CSV rows (respecting quoted multi-line fields)
    const logicalRows = this.splitCSVIntoLogicalRows(content);
    
    if (logicalRows.length < 2) {
      return [];
    }

    const headers = this.parseCSVLine(logicalRows[0]);
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < logicalRows.length; i++) {
      const values = this.parseCSVLine(logicalRows[i]);
      // Accept rows with at least minimum required columns (be lenient)
      if (values.length >= Math.min(headers.length, 3)) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        rows.push(row);
      }
    }

    return rows;
  }

  /**
   * Split raw CSV content into logical rows, properly handling multi-line quoted fields.
   * A "logical row" may span multiple physical lines if a quoted field contains newlines.
   */
  private splitCSVIntoLogicalRows(content: string): string[] {
    const rows: string[] = [];
    let currentRow = '';
    let inQuotes = false;

    const lines = content.split('\n');
    for (const line of lines) {
      if (!inQuotes && currentRow === '' && line.trim() === '') continue;

      if (currentRow !== '') {
        currentRow += '\n' + line;
      } else {
        currentRow = line;
      }

      // Count unescaped quotes to determine if we're still inside a quoted field
      for (let i = (currentRow.length - line.length - (currentRow !== line ? 1 : 0)); i < currentRow.length; i++) {
        if (i < 0) i = 0;
        if (currentRow[i] === '"') {
          // Skip escaped quotes ("")
          if (i + 1 < currentRow.length && currentRow[i + 1] === '"') {
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        }
      }

      if (!inQuotes) {
        const trimmed = currentRow.replace(/\r$/, '');
        if (trimmed.trim()) {
          rows.push(trimmed);
        }
        currentRow = '';
      }
    }

    // Push any remaining content
    if (currentRow.trim()) {
      rows.push(currentRow.replace(/\r$/, ''));
    }

    return rows;
  }

  /**
   * Parse a single CSV line handling quoted values (including embedded newlines)
   */
  private parseCSVLine(line: string): string[] {
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

  /**
   * Parse test cases from Excel file (xlsx/xls)
   */
  parseFromExcelFile(filePath: string, sheetName?: string): TestCaseInput[] {
    const workbook = XLSX.readFile(filePath);
    
    // Use specified sheet or first sheet
    const sheet = sheetName 
      ? workbook.Sheets[sheetName] 
      : workbook.Sheets[workbook.SheetNames[0]];
    
    if (!sheet) {
      throw new Error(`Sheet not found: ${sheetName || 'default'}`);
    }

    // Convert sheet to JSON
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    if (rows.length === 0) {
      throw new Error('Excel sheet is empty or has no valid data rows');
    }

    return rows.map(row => this.parseTestCaseFromRow(row));
  }

  /**
   * Get sheet names from Excel file
   */
  getExcelSheetNames(filePath: string): string[] {
    const workbook = XLSX.readFile(filePath);
    return workbook.SheetNames;
  }

  /**
   * Parse a test case from a spreadsheet row (CSV or Excel)
   */
  private parseTestCaseFromRow(row: Record<string, any>): TestCaseInput {
    // Standard column mappings (case-insensitive)
    const getField = (possibleNames: string[]): string => {
      for (const name of possibleNames) {
        const key = Object.keys(row).find(k => 
          k.toLowerCase().replace(/[\s_-]/g, '') === name.toLowerCase().replace(/[\s_-]/g, '')
        );
        if (key && row[key]) return String(row[key]).trim();
      }
      return '';
    };

    const id = getField(['Case ID', 'CaseID', 'Test Script ID', 'TestCaseID', 'TC ID', 'ID', 'Test ID', 'TestID']);
    const title = getField(['Case', 'Title', 'Test Title', 'Test Case Title', 'Name', 'Test Name', 'Summary']);
    const description = getField(['Description', 'Test Description', 'Details', 'Full Description']);
    const category = getField(['Category', 'Test Category', 'Type', 'Test Type', 'Module']);
    const priority = getField(['Priority', 'Severity', 'Importance']);
    const tags = getField(['Tags', 'Labels', 'Keywords']);
    const preconditions = getField(['Precondition', 'Preconditions', 'Prerequisites', 'Setup', 'Pre-conditions', 'Pre-condition']);
    const steps = getField(['Test Steps', 'Steps', 'Procedure', 'Actions']);
    const expectedResults = getField(['Expected', 'Expected Results', 'Expected Result', 'Expected Outcome', 'Assertions']);

    // Parse steps from string if provided
    const parsedSteps: TestStep[] = steps 
      ? this.extractSteps(steps)
      : this.extractSteps(title + ' ' + description);

    // Parse expected results
    const parsedExpectedResults: string[] = expectedResults
      ? expectedResults.split(/[;|\n]/).map(s => s.trim()).filter(s => s)
      : this.extractExpectedResults(description);

    // Parse tags
    const parsedTags: string[] = tags
      ? tags.split(/[,;|\s]/).map(s => s.trim()).filter(s => s)
      : [];

    // Parse preconditions
    const parsedPreconditions: string[] = preconditions
      ? preconditions.split(/[;|\n]/).map(s => s.trim()).filter(s => s)
      : [];

    // Use all available text for category detection (title + description + preconditions + tags)
    const fullText = [title, description, preconditions, tags].filter(Boolean).join(' ');
    
    // Detect category if not provided
    const detectedCategory = category 
      ? this.mapCategoryString(category)
      : this.detectCategory(fullText, parsedTags);

    // Parse test data from remaining columns
    const testData = this.parseTestDataFromCSV(row as Record<string, string>);

    // Extract explicit values from precondition and test steps text
    const explicitValues = this.extractExplicitValues(
      preconditions || '',
      steps || '',
      expectedResults || ''
    );

    // Auto-prefix test case ID with module abbreviation
    const rawId = id || this.generateTestCaseId();
    const prefixedId = this.applyModulePrefix(rawId, detectedCategory);

    // Bridge extracted explicit values into testData (maps to data CSV column names)
    const mergedTestData = this.bridgeExplicitValuesToTestData(testData, explicitValues, prefixedId);

    return {
      id: prefixedId,
      title: title || description || 'Untitled Test Case',
      description: description || title || '',
      category: detectedCategory,
      priority: this.mapPriority(priority),
      tags: parsedTags.length > 0 ? parsedTags : this.extractTags(fullText, detectedCategory),
      preconditions: parsedPreconditions,
      steps: parsedSteps,
      expectedResults: parsedExpectedResults,
      testData: mergedTestData,
      explicitValues
    };
  }

  /**
   * Map string category to TestCategory enum
   */
  private mapCategoryString(category: string): TestCategory {
    const lower = category.toLowerCase().trim();
    const categoryMap: Record<string, TestCategory> = {
      'dfb': 'dfb',
      'edi': 'edi',
      'commission': 'commission',
      'sales lead': 'salesLead',
      'saleslead': 'salesLead',
      'banyan': 'banyan',
      'carrier': 'carrier',
      'bulk change': 'bulkChange',
      'bulkchange': 'bulkChange',
      'dat': 'dat',
      'non-operational': 'nonOperationalLoads',
      'nonoperational': 'nonOperationalLoads',
      'api': 'api'
    };
    return categoryMap[lower] || 'custom';
  }

  /**
   * Map priority string to enum value
   */
  private mapPriority(priority: string): 'critical' | 'high' | 'medium' | 'low' {
    const lower = priority.toLowerCase().trim();
    if (['critical', 'blocker', 'p0', '0'].includes(lower)) return 'critical';
    if (['high', 'p1', '1', 'major'].includes(lower)) return 'high';
    if (['low', 'p3', '3', 'minor', 'trivial'].includes(lower)) return 'low';
    return 'medium';
  }

  // ── Module prefix mapping (category → ID prefix) ────────────────────────
  private readonly categoryPrefixMap: Record<string, string> = {
    dfb: 'DFB',
    edi: 'EDI',
    commission: 'COMM',
    salesLead: 'SALES',
    banyan: 'BANYAN',
    carrier: 'CARRIER',
    bulkChange: 'BULK',
    dat: 'DAT',
    nonOperationalLoads: 'NONOP',
    api: 'API',
    custom: 'TC',
  };

  /**
   * Auto-prefix a test case ID with its module abbreviation if not already prefixed.
   * E.g. "25103" with category "dfb" → "DFB-25103"
   */
  applyModulePrefix(id: string, category: TestCategory): string {
    const prefix = this.categoryPrefixMap[category] || 'TC';
    // If the ID already has a known prefix, return as-is
    const upperID = id.toUpperCase();
    for (const pfx of Object.values(this.categoryPrefixMap)) {
      if (upperID.startsWith(pfx + '-')) {
        return id;
      }
    }
    // If ID is purely numeric or doesn't have any prefix, add one
    return `${prefix}-${id}`;
  }

  /**
   * Extract explicit values from structured Precondition and Test Steps columns.
   * Parses natural language to pull out specific field names, values, user names,
   * office codes, etc. that should be hard-coded in the generated Playwright script.
   */
  extractExplicitValues(
    preconditionText: string,
    testStepsText: string,
    expectedText: string
  ): ExplicitValues {
    const values: ExplicitValues = {
      precondition: {},
      formFields: {},
      preconditionSteps: [],
      testStepsRaw: [],
      expectedResultText: expectedText.trim(),
    };

    // ── Parse precondition steps ──────────────────────────────────────────
    if (preconditionText) {
      // Split into individual steps
      const stepMatches = preconditionText.match(/Step\s*\d+[:\s]*[^\n]*/gi);
      if (stepMatches) {
        values.preconditionSteps = stepMatches.map(s => s.trim());
      }

      const lowerPre = preconditionText.toLowerCase();
      // Normalize smart quotes in the precondition text for reliable matching
      const normalizedPre = preconditionText
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

      // ── Extract office code ──
      // Patterns: "enter value as TX-STK", "office code (TX-STK)", "office code: TX-RED"
      const officeCodePatterns = [
        /enter\s+(?:the\s+)?(?:value\s+as|value)\s+([A-Z]{2,5}-[A-Z0-9]{2,5})\b/i,
        /office\s+code\s*[\(:=]\s*([A-Z]{2,5}-[A-Z0-9]{2,5})\b/i,
        /office\s+code\s+([A-Z]{2,5}-[A-Z0-9]{2,5})\b/i,
      ];
      for (const pattern of officeCodePatterns) {
        const officeMatch = normalizedPre.match(pattern);
        if (officeMatch) {
          values.precondition.officeCode = officeMatch[1].trim();
          break;
        }
      }

      // ── Extract switch user ──
      // Patterns: "BRENT DURHAM(TX-RED)", "BRENT DURHAM (TX-RED)", "enter value as FRISCO TL",
      //           "click on FRISCO TL" (user names after switch user context)
      const switchUserPatterns = [
        /switch\s+user[\s\S]*?(?:enter\s+value\s+as|enter|click\s+on)\s+([A-Z][A-Z ]+\([A-Z]{2}-[A-Z]+\))/,
        /(?:suggestion[\s\S]*?click\s+on)\s+([A-Z][A-Z ]+\([A-Z]{2}-[A-Z]+\))/,
        /\b([A-Z][A-Z ]+\([A-Z]{2}-[A-Z]+\))/,
        // Fallback: "Switch User field enter value as NAME" (no parenthetical code)
        /switch\s+user\s+field\s+enter\s+value\s+as\s+([A-Z][A-Za-z ]{2,})/i,
        /enter\s+value\s+as\s+([A-Z][A-Za-z ]+?)(?:\s*\d|\s*$|\n)/i,
      ];
      for (const pattern of switchUserPatterns) {
        const switchMatch = normalizedPre.match(pattern);
        if (switchMatch && !switchMatch[1].includes('Step')) {
          values.precondition.switchToUser = switchMatch[1].trim();
          break;
        }
      }

      // ── Extract customer name ──
      // Patterns: "search for the customer(MillerCoors Accessorial)",
      //           "enter value as BONDED CHEMICAL" in search/post automation context,
      //           "customer name: XXX", "customer (Name)"
      const customerPatterns = [
        /customer\s*\(\s*([^)]+)\s*\)/i,
        /search\s+(?:for\s+)?(?:the\s+)?customer\s*\(\s*([^)]+)\s*\)/i,
        /customer\s*name\s*[:=]\s*"?([^"\n,]+)"?/i,
      ];
      for (const pattern of customerPatterns) {
        const custMatch = normalizedPre.match(pattern);
        if (custMatch) {
          values.precondition.customerName = custMatch[1].trim();
          break;
        }
      }
      // Fallback: "enter value as <ALL CAPS NAME>" in search/post automation lines
      if (!values.precondition.customerName) {
        const searchLines = normalizedPre.split('\n').filter(l =>
          /search\s+field|post\s+automation|search\s+for/i.test(l) && /enter\s+value|customer/i.test(l)
        );
        for (const line of searchLines) {
          const custMatch = line.match(/enter\s+value\s+as\s+([A-Z][A-Z ]+[A-Z])\b/);
          if (custMatch) {
            values.precondition.customerName = custMatch[1].trim();
            break;
          }
        }
      }

      // ── Extract carrier name from preconditions ──
      // Patterns: "Enter the value into name field as "18 king trucking llc""
      //           "Search for the Carrier (name)"
      const carrierPatterns = [
        /(?:name\s+field|carrier)\s+(?:as|:)\s*"([^"]+)"/i,
        /(?:name\s+field|carrier)\s+(?:as|:)\s*""([^"]+)""/i,
        /search\s+for\s+(?:the\s+)?carrier\s*\(\s*([^)]+)\s*\)/i,
      ];
      for (const pattern of carrierPatterns) {
        const carrierMatch = normalizedPre.match(pattern);
        if (carrierMatch) {
          values.precondition.carrierName = carrierMatch[1].trim();
          break;
        }
      }

      // ── Extract Match vendors setting ──
      if (lowerPre.includes('match vendor') && lowerPre.includes('tnx')) {
        values.precondition.matchVendors = 'TNX';
      }

      // ── Extract DME setting ──
      if (lowerPre.includes('digital matching engine') && lowerPre.includes('yes')) {
        values.precondition.enableDME = 'YES';
      }
    }

    // ── Parse test steps for form field values ────────────────────────────
    if (testStepsText) {
      // Normalize smart quotes for reliable matching
      const normalizedSteps = testStepsText
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");

      // Split into individual test steps
      const testStepMatches = normalizedSteps.match(/\d+\.\s*[^\n]*/gi);
      if (testStepMatches) {
        values.testStepsRaw = testStepMatches.map(s => s.trim());
      }

      // ── Strategy 1: Direct "Key: Value" patterns (original) ──
      const fieldPatterns: { key: keyof ExplicitValues['formFields']; patterns: RegExp[] }[] = [
        { key: 'customerName', patterns: [
          /Customer\s*Name\s*:\s*(.+)/i,
          /"Customer"\s+field\s*\(\s*([^)]+)\s*\)/i,
          /customer\s+name\s+in\s+the\s+"?Customer"?\s+field\s*\(\s*([^)]+)\s*\)/i,
          /enter\s+the\s+Customer\s+name[^(]*\(\s*([^)]+)\s*\)/i,
        ]},
        { key: 'pickLocation', patterns: [
          /(?:ShipperName|Pickup\s*Location|Pick)\s*(?:\/City)?\s*:\s*(.+)/i,
          /(?:location|field)\s+from\s+the\s+"Shipper"\s+field\s*\.?\(\s*([^)]+)\s*\)/i,
          /(?:select|choose)\s+(?:the\s+)?location\s+from\s+(?:the\s+)?"?Shipper"?\s+field\s*\.?\(\s*([^)]+)\s*\)/i,
        ]},
        { key: 'dropLocation', patterns: [
          /(?:consigneeName|Drop\s*Location|Drop)\s*(?:\/City)?\s*:\s*(.+)/i,
          /(?:location|field)\s+from\s+the\s+"Consignee"\s+field\s*\.?\(\s*([^)]+)\s*\)/i,
          /(?:select|choose)\s+(?:the\s+)?location\s+from\s+(?:the\s+)?"?Consignee"?\s+field\s*\.?\(\s*([^)]+)\s*\)/i,
        ]},
        { key: 'loadType', patterns: [
          /(?:LoadMethod|Load\s*Method)\s*(?:\/TYPE)?\s*:\s*(.+)/i,
        ]},
        { key: 'equipmentType', patterns: [
          /(?:Equipment|Equipment\s*Type)\s*(?:\/Equipment\s*Type)?\s*:\s*(.+)/i,
          /"Equipment"\s+field\s+as\s+"([^"]+)"/i,
          /select\s+(?:the\s+)?"?Equipment"?\s+(?:field\s+)?as\s+"([^"]+)"/i,
        ]},
        { key: 'offerRate', patterns: [
          /Offer\s*Rate\s*\$?\s*:\s*(.+)/i,
          /Offer\s+Rate\s+field[^"]*"([^"]+)"/i,
          /(?:value\s+for\s+(?:the\s+)?)?Offer\s+Rate[^"]*as\s+"([^"]+)"/i,
        ]},
        { key: 'shipperZip', patterns: [
          /(?:Zip\/Postal\s*code)\s*:\s*(\d{5})/i,
        ]},
        { key: 'consigneeZip', patterns: [
          /(?:Zip\/Postal\s*code\/ConsigneeZip)\s*:\s*(\d{5})/i,
        ]},
        { key: 'commodity', patterns: [
          /Commodity\s*:\s*(.+)/i,
        ]},
      ];

      const lines = normalizedSteps.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        for (const fp of fieldPatterns) {
          for (const pattern of fp.patterns) {
            const match = trimmed.match(pattern);
            if (match && !values.formFields[fp.key]) {
              let val = match[1].trim();
              val = val.replace(/[,.]$/, '').replace(/^"|"$/g, '').trim();
              if (fp.key === 'offerRate' && /any\s+numeric/i.test(val)) {
                val = '1000';
              }
              values.formFields[fp.key] = val;
            }
          }
        }
      }

      // ── Strategy 2: Broad NLP extraction from natural language steps ──
      // These extract values from patterns like:
      //   'Select the "X" field as "VALUE"', 'Enter the X as "VALUE"',
      //   'Enter the X field (Eg. VALUE)', 'Select X as "VALUE"'
      for (const line of lines) {
        const trimmed = line.trim();

        // "Qty" field (Eg. 95)  or  "Qty" field as "95"
        if (!values.formFields['qty']) {
          const qtyMatch = trimmed.match(/"Qty"\s+field\s*\(\s*(?:Eg\.?\s*)?(\d+)\s*\)/i)
            || trimmed.match(/Quantity\s+in\s+the\s+"?Qty"?\s+field\s*\(\s*(?:Eg\.?\s*)?(\d+)\s*\)/i);
          if (qtyMatch) values.formFields['qty'] = qtyMatch[1].trim();
        }

        // "UoM" field (Eg. Case or Cases)
        if (!values.formFields['uom']) {
          const uomMatch = trimmed.match(/"UoM"\s+field\s*\(\s*(?:Eg\.?\s*)?([^)]+)\s*\)/i)
            || trimmed.match(/select\s+(?:the\s+)?"?UoM"?\s+field\s*\(\s*(?:Eg\.?\s*)?([^)]+)\s*\)/i);
          if (uomMatch) values.formFields['uom'] = uomMatch[1].trim();
        }

        // "Description" field (Eg. Total 95 cases)
        if (!values.formFields['description']) {
          const descMatch = trimmed.match(/"Description"\s+field\s*\(\s*(?:Eg\.?\s*)?([^)]+)\s*\)/i)
            || trimmed.match(/description\s+in\s+the\s+"?Description"?\s+field\s*\(\s*(?:Eg\.?\s*)?([^)]+)\s*\)/i);
          if (descMatch) values.formFields['description'] = descMatch[1].trim();
        }

        // "Weight" field (Eg. 8500)
        if (!values.formFields['weight']) {
          const weightMatch = trimmed.match(/"Weight"\s+field\s*\(\s*(?:Eg\.?\s*)?(\d+)\s*\)/i)
            || trimmed.match(/weight\s+in\s+the\s+"?Weight"?\s+field\s*\(\s*(?:Eg\.?\s*)?(\d+)\s*\)/i);
          if (weightMatch) values.formFields['weight'] = weightMatch[1].trim();
        }

        // "length" field (Eg. 54)
        if (!values.formFields['trailerLength']) {
          const lenMatch = trimmed.match(/"(?:length|lenght)"\s+field\s*\(\s*(?:Eg\.?\s*)?(\d+)\s*\)/i)
            || trimmed.match(/(?:length|lenght)\s+(?:field\s+)?\(\s*(?:Eg\.?\s*)?(\d+)\s*\)/i);
          if (lenMatch) values.formFields['trailerLength'] = lenMatch[1].trim();
        }

        // "Mileage Engine" field as "Current"
        if (!values.formFields['mileageEngine']) {
          const mileMatch = trimmed.match(/"?Mileage\s+Engine"?\s+field\s+as\s+"([^"]+)"/i)
            || trimmed.match(/select\s+(?:the\s+)?"?Mileage\s+Engine"?\s+(?:field\s+)?as\s+"([^"]+)"/i);
          if (mileMatch) values.formFields['mileageEngine'] = mileMatch[1].trim();
        }

        // "Method" as "Practical"
        if (!values.formFields['method']) {
          const methodMatch = trimmed.match(/"?Method"?\s+(?:field\s+)?as\s+"([^"]+)"/i)
            || trimmed.match(/select\s+(?:the\s+)?"?Method"?\s+as\s+"([^"]+)"/i);
          if (methodMatch) values.formFields['method'] = methodMatch[1].trim();
        }

        // Rate type as "SPOT"
        if (!values.formFields['rateType']) {
          const rateMatch = trimmed.match(/Rate\s+type\s+as\s+"([^"]+)"/i)
            || trimmed.match(/select\s+(?:the\s+)?Rate\s+type\s+as\s+"([^"]+)"/i);
          if (rateMatch) values.formFields['rateType'] = rateMatch[1].trim();
        }

        // Carrier name: "Include Carriers field on the load.(Eg. 18 KING TRUCKING LLC)"
        if (!values.formFields['carrierName']) {
          const carrierMatch = trimmed.match(/(?:Include\s+)?Carrier[s]?\s+field[^(]*\(\s*(?:Eg\.?\s*)?([^)]+)\s*\)/i)
            || trimmed.match(/select\s+a\s+carrier[^(]*\(\s*(?:Eg\.?\s*)?([^)]+)\s*\)/i);
          if (carrierMatch) values.formFields['carrierName'] = carrierMatch[1].trim();
        }

        // "Earliest Time" / "Latest Time" (Eg. 09:00, 10:00)
        if (!values.formFields['shipperEarliestTime']) {
          // Match in shipper context (steps before consignee section)
          const etMatch = trimmed.match(/(?:Enter\s+)?(?:the\s+)?"?Earliest\s+Time"?\s*\(\s*(?:Eg\.?\s*)?([^)]+)\s*\)/i);
          if (etMatch) values.formFields['shipperEarliestTime'] = etMatch[1].trim();
        }
        if (!values.formFields['shipperLatestTime']) {
          const ltMatch = trimmed.match(/(?:Enter\s+)?(?:the\s+)?"?Latest\s+Time"?\s*\(\s*(?:Eg\.?\s*)?([^)]+)\s*\)/i);
          if (ltMatch) values.formFields['shipperLatestTime'] = ltMatch[1].trim();
        }

        // Carrier Contact for Rate Confirmation (Eg. email)
        if (!values.formFields['emailNotification']) {
          const emailMatch = trimmed.match(/Rate\s+Confirmation\s+field\s*\(\s*(?:Eg\.?\s*)?([^)]+@[^)]+)\s*\)/i)
            || trimmed.match(/(?:loadboard\s+user)[^(]*\(\s*(?:Eg\.?\s*)?([^)]+@[^)]+)\s*\)/i);
          if (emailMatch) values.formFields['emailNotification'] = emailMatch[1].trim();
        }

        // Salesperson / Dispatcher (FRISCO TL)
        if (!values.formFields['salesperson']) {
          const spMatch = trimmed.match(/"?Salesperson"?\s+(?:and\s+"?Dispatcher"?\s+)?[^(]*\(\s*([^)]+)\s*\)/i);
          if (spMatch) values.formFields['salesperson'] = spMatch[1].trim();
        }
      }

      // ── Resolve shipper/consignee times: assign correctly by step context ──
      // If "Earliest Time" and "Latest Time" appear multiple times, first pair = shipper, second = consignee
      const timeSteps = lines.filter(l => /Earliest\s+Time|Latest\s+Time/i.test(l));
      const earliestTimes: string[] = [];
      const latestTimes: string[] = [];
      for (const ts of timeSteps) {
        const etm = ts.match(/Earliest\s+Time[^(]*\(\s*(?:Eg\.?\s*)?([^)]+)\s*\)/i);
        const ltm = ts.match(/Latest\s+Time[^(]*\(\s*(?:Eg\.?\s*)?([^)]+)\s*\)/i);
        if (etm) earliestTimes.push(etm[1].trim());
        if (ltm) latestTimes.push(ltm[1].trim());
      }
      if (earliestTimes.length >= 1) values.formFields['shipperEarliestTime'] = earliestTimes[0];
      if (latestTimes.length >= 1) values.formFields['shipperLatestTime'] = latestTimes[0];
      if (earliestTimes.length >= 2) values.formFields['consigneeEarliestTime'] = earliestTimes[1];
      if (latestTimes.length >= 2) values.formFields['consigneeLatestTime'] = latestTimes[1];

      // If customer name not found in form fields, inherit from precondition
      if (!values.formFields.customerName && values.precondition.customerName) {
        values.formFields.customerName = values.precondition.customerName;
      }
      // If carrier name found in precondition but not test steps, inherit
      if (!values.formFields['carrierName'] && values.precondition.carrierName) {
        values.formFields['carrierName'] = values.precondition.carrierName;
      }
    }

    return values;
  }

  /**
   * Bridge explicitValues into testData, mapping extracted field names to the
   * column names used in data CSV files (dfbdata.csv, carrierdata.csv, etc.).
   * Only fills in values that are currently empty/missing in testData.
   */
  bridgeExplicitValuesToTestData(
    testData: TestData,
    explicitValues: ExplicitValues,
    testCaseId: string
  ): TestData {
    const merged = { ...testData };

    // Always set the test case ID
    if (!merged.testCaseId) {
      merged.testCaseId = testCaseId;
    }

    // Map precondition values → dfbdata.csv column names
    const pre = explicitValues.precondition;
    if (pre.officeCode && !merged.officeName) {
      merged.officeName = pre.officeCode;
    }
    if (pre.customerName && !merged.customerName) {
      merged.customerName = pre.customerName;
    }
    if (pre.switchToUser && !merged.salesAgent) {
      // "BRENT DURHAM(TX-RED)" → "BRENT DURHAM (TX-RED)" (normalize spacing)
      merged.salesAgent = pre.switchToUser.replace(/\(/, ' (').replace(/\s{2,}/, ' ').trim();
    }
    if (pre.matchVendors) {
      merged['matchVendors'] = pre.matchVendors;
    }
    if (pre.enableDME) {
      merged['enableDME'] = pre.enableDME;
    }

    // Map form field values → dfbdata.csv column names
    const form = explicitValues.formFields;
    if (form.customerName && !merged.customerName) {
      merged.customerName = form.customerName;
    }
    if (form.pickLocation && !merged.shipperName) {
      merged.shipperName = form.pickLocation;
    }
    if (form.dropLocation && !merged.consigneeName) {
      merged.consigneeName = form.dropLocation;
    }
    if (form.equipmentType && !merged.equipmentType) {
      merged.equipmentType = form.equipmentType;
    }
    if (form.loadType && !merged.loadMethod) {
      merged.loadMethod = form.loadType;
    }
    if (form.offerRate && !merged.offerRate) {
      merged.offerRate = form.offerRate;
    }
    if (form.shipperZip && !merged.shipperZip) {
      merged.shipperZip = form.shipperZip;
    }
    if (form.consigneeZip && !merged.consigneeZip) {
      merged.consigneeZip = form.consigneeZip;
    }
    if (form.commodity && !merged['commodity']) {
      merged['commodity'] = form.commodity;
    }
    if (form.emailNotification) {
      merged['saleAgentEmail'] = form.emailNotification;
    }

    // New fields extracted by NLP patterns
    if (form['qty'] && !merged['shipmentCommodityQty']) {
      merged['shipmentCommodityQty'] = form['qty'];
    }
    if (form['uom'] && !merged['shipmentCommodityUoM']) {
      merged['shipmentCommodityUoM'] = form['uom'];
    }
    if (form['description'] && !merged['shipmentCommodityDescription']) {
      merged['shipmentCommodityDescription'] = form['description'];
    }
    if (form['weight'] && !merged['shipmentCommodityWeight']) {
      merged['shipmentCommodityWeight'] = form['weight'];
    }
    if (form['trailerLength'] && !merged['trailerLength']) {
      merged['trailerLength'] = form['trailerLength'];
    }
    if (form['mileageEngine'] && !merged['mileageEngine']) {
      merged['mileageEngine'] = form['mileageEngine'];
    }
    if (form['method'] && !merged['Method']) {
      merged['Method'] = form['method'];
    }
    if (form['rateType'] && !merged['rateType']) {
      merged['rateType'] = form['rateType'];
    }
    if (form['carrierName'] && !merged['Carrier']) {
      merged['Carrier'] = form['carrierName'];
    }
    if (form['shipperEarliestTime'] && !merged['shipperEarliestTime']) {
      merged['shipperEarliestTime'] = form['shipperEarliestTime'];
    }
    if (form['shipperLatestTime'] && !merged['shipperLatestTime']) {
      merged['shipperLatestTime'] = form['shipperLatestTime'];
    }
    if (form['consigneeEarliestTime'] && !merged['consigneeEarliestTime']) {
      merged['consigneeEarliestTime'] = form['consigneeEarliestTime'];
    }
    if (form['consigneeLatestTime'] && !merged['consigneeLatestTime']) {
      merged['consigneeLatestTime'] = form['consigneeLatestTime'];
    }
    if (form['salesperson'] && !merged['salesAgent']) {
      merged['salesAgent'] = form['salesperson'];
    }
    // Carrier name from precondition
    if (pre.carrierName && !merged['Carrier']) {
      merged['Carrier'] = pre.carrierName;
    }

    // Extract city/state from shipper name format "NAME - CITY, ST" or "|NAME|CITY|ST"
    if (form.pickLocation) {
      const dashMatch = form.pickLocation.match(/- ([^,]+),\s*(\w+)/);
      const pipeMatch = form.pickLocation.match(/\|([^|]+)\|([^|]+)\|(\w+)/);
      if (dashMatch) {
        if (!merged.shipperCity) merged.shipperCity = dashMatch[1].trim();
        if (!merged.shipperState) merged.shipperState = dashMatch[2].trim();
      } else if (pipeMatch) {
        if (!merged.shipperName) merged.shipperName = pipeMatch[1].trim();
        if (!merged.shipperCity) merged.shipperCity = pipeMatch[2].trim();
        if (!merged.shipperState) merged.shipperState = pipeMatch[3].trim();
      }
    }
    if (form.dropLocation) {
      const dashMatch = form.dropLocation.match(/- ([^,]+),\s*(\w+)/);
      const pipeMatch = form.dropLocation.match(/\|([^|]+)\|([^|]+)\|(\w+)/);
      if (dashMatch) {
        if (!merged.consigneeCity) merged.consigneeCity = dashMatch[1].trim();
        if (!merged.consigneeState) merged.consigneeState = dashMatch[2].trim();
      } else if (pipeMatch) {
        if (!merged.consigneeName) merged.consigneeName = pipeMatch[1].trim();
        if (!merged.consigneeCity) merged.consigneeCity = pipeMatch[2].trim();
        if (!merged.consigneeState) merged.consigneeState = pipeMatch[3].trim();
      }
    }

    return merged;
  }

  /**
   * Get supported file extensions
   */
  static getSupportedExtensions(): string[] {
    return ['.json', '.txt', '.csv', '.xlsx', '.xls'];
  }
}

export default new TestCaseParser();
