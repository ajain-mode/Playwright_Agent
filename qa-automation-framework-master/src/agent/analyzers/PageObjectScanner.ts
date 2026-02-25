/**
 * PageObjectScanner
 * Dynamically scans page object files to discover existing locators, methods,
 * and class structure. Used by the agent to understand what already exists
 * before generating new code.
 *
 * @author AI Agent Generator
 * @created 2026-02-12
 */

import fs from 'fs';
import path from 'path';

/** Represents a single locator declared in a page object */
export interface LocatorInfo {
  name: string;
  type: string;           // e.g. 'Locator', '(text: string) => Locator'
  selector?: string;       // The raw selector string if detectable
  isPrivate: boolean;
  isDynamic: boolean;      // true if it's a function that returns a Locator
}

/** Represents a single method in a page object */
export interface MethodInfo {
  name: string;
  parameters: string;      // e.g. '(customerName: string)'
  returnType: string;      // e.g. 'Promise<void>'
  isAsync: boolean;
  isPrivate: boolean;
  startLine: number;
  endLine: number;
  body: string;            // Full method body
}

/** Full scan result for a single page object file */
export interface PageObjectScanResult {
  filePath: string;
  className: string;
  exportStyle: 'default' | 'named' | 'instance';  // how the class is exported
  locators: LocatorInfo[];
  methods: MethodInfo[];
  imports: string[];
  constructorEndLine: number;   // line after constructor's closing brace
  classEndLine: number;         // line of the class's closing brace
  rawContent: string;
}

/** Summary of a page directory for quick lookup */
export interface PageDirectorySummary {
  directory: string;
  pageObjects: Map<string, PageObjectScanResult>;
}

// Directories to ignore (not used by the agent)
const DEFAULT_EXCLUDED_DIRS = [
  'bulkChange',
  'carrierPortal',
  'customerPortal',
  'legacyCustomerPortal',
  'salesLead',
  'tritan',
];

export class PageObjectScanner {
  private pagesDir: string;
  private excludedDirs: string[];
  private cache: Map<string, PageObjectScanResult> = new Map();

  constructor(pagesDir: string, excludedDirs?: string[]) {
    this.pagesDir = pagesDir;
    this.excludedDirs = excludedDirs || DEFAULT_EXCLUDED_DIRS;
  }

  /**
   * Scan all page object files and return a comprehensive map
   */
  scanAll(): Map<string, PageObjectScanResult> {
    this.cache.clear();
    this.scanDirectory(this.pagesDir);
    return this.cache;
  }

  /**
   * Scan a single page object file
   */
  scanFile(filePath: string): PageObjectScanResult | null {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = this.parsePageObjectFile(filePath, content);
    if (result) {
      this.cache.set(result.className, result);
    }
    return result;
  }

  /**
   * Get scan result by class name (uses cache)
   */
  getByClassName(className: string): PageObjectScanResult | null {
    if (this.cache.size === 0) this.scanAll();
    return this.cache.get(className) || null;
  }

  /**
   * Get scan result by PageManager getter name (e.g. 'carrierSearchPage' → CarrierSearch)
   */
  getByPageManagerName(getterName: string): PageObjectScanResult | null {
    if (this.cache.size === 0) this.scanAll();
    for (const [, result] of this.cache) {
      // Match by lowercased class name or partial match
      const classLower = result.className.toLowerCase();
      const getterLower = getterName.toLowerCase().replace('page', '');
      if (classLower.includes(getterLower) || getterLower.includes(classLower.replace('page', ''))) {
        return result;
      }
    }
    return null;
  }

  /**
   * Check if a method exists in a page object class
   */
  methodExists(className: string, methodName: string): boolean {
    const scan = this.getByClassName(className);
    if (!scan) return false;
    return scan.methods.some(m => m.name === methodName);
  }

  /**
   * Check if a locator exists in a page object class
   */
  locatorExists(className: string, locatorName: string): boolean {
    const scan = this.getByClassName(className);
    if (!scan) return false;
    return scan.locators.some(l => l.name === locatorName);
  }

  /**
   * Get all public methods of a page object
   */
  getPublicMethods(className: string): MethodInfo[] {
    const scan = this.getByClassName(className);
    if (!scan) return [];
    return scan.methods.filter(m => !m.isPrivate);
  }

  /**
   * Find which page object has a specific method
   */
  findMethodOwner(methodName: string): PageObjectScanResult | null {
    if (this.cache.size === 0) this.scanAll();
    for (const [, result] of this.cache) {
      if (result.methods.some(m => m.name === methodName)) {
        return result;
      }
    }
    return null;
  }

  /**
   * Get a summary of all scanned page objects: className → list of public method names
   */
  getSummary(): Map<string, string[]> {
    if (this.cache.size === 0) this.scanAll();
    const summary = new Map<string, string[]>();
    for (const [className, result] of this.cache) {
      summary.set(className, result.methods.filter(m => !m.isPrivate).map(m => m.name));
    }
    return summary;
  }

  // ======================== PRIVATE HELPERS ========================

  private scanDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Skip excluded directories
        if (this.excludedDirs.some(ex => entry.name.toLowerCase() === ex.toLowerCase())) {
          continue;
        }
        this.scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const result = this.parsePageObjectFile(fullPath, content);
        if (result) {
          this.cache.set(result.className, result);
        }
      }
    }
  }

  private parsePageObjectFile(filePath: string, content: string): PageObjectScanResult | null {
    const lines = content.split('\n');

    // Find class declaration
    const classMatch = content.match(/(?:export\s+default\s+)?class\s+(\w+)\s*\{/);
    if (!classMatch) return null;

    const className = classMatch[1];

    // Determine export style
    let exportStyle: 'default' | 'named' | 'instance' = 'named';
    if (/export\s+default\s+class/.test(content)) {
      exportStyle = 'default';
    } else if (/export\s+default\s+new\s+/.test(content)) {
      exportStyle = 'instance';
    } else if (/export\s+default\s+\w+/.test(content)) {
      exportStyle = 'default';
    }

    // Parse imports
    const imports: string[] = [];
    const importRegex = /^import\s+.+$/gm;
    let importMatch;
    while ((importMatch = importRegex.exec(content)) !== null) {
      imports.push(importMatch[0]);
    }

    // Parse locators
    const locators = this.parseLocators(content);

    // Parse methods
    const methods = this.parseMethods(lines);

    // Find constructor end line
    const constructorEndLine = this.findConstructorEndLine(lines);

    // Find class end line
    const classEndLine = this.findClassEndLine(lines);

    return {
      filePath,
      className,
      exportStyle,
      locators,
      methods,
      imports,
      constructorEndLine,
      classEndLine,
      rawContent: content,
    };
  }

  private parseLocators(content: string): LocatorInfo[] {
    const locators: LocatorInfo[] = [];

    // Match property declarations like: private readonly someName_LOC: Locator;
    // Also match: private readonly someName: Locator;
    // Also match dynamic: private readonly someName_LOC: (text: string) => Locator;
    const locatorRegex = /(?:private|public|readonly|\s)+(readonly\s+)?(\w+)\s*:\s*((?:\([^)]*\)\s*=>\s*)?Locator)\s*;/g;
    let match;
    while ((match = locatorRegex.exec(content)) !== null) {
      const name = match[2];
      const type = match[3].trim();
      const isDynamic = type.includes('=>');
      const isPrivate = content.substring(Math.max(0, match.index - 20), match.index + match[0].length).includes('private');

      locators.push({
        name,
        type,
        isPrivate,
        isDynamic,
      });
    }

    return locators;
  }

  private parseMethods(lines: string[]): MethodInfo[] {
    const methods: MethodInfo[] = [];
    const methodRegex = /^\s*(private\s+|public\s+)?(async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^\{]+))?\s*\{/;
    const multiLineMethodStart = /^\s*(private\s+|public\s+)?(async\s+)?(\w+)\s*\(/;

    // Keywords that are NOT method names
    const reservedWords = new Set([
      'if', 'else', 'for', 'while', 'switch', 'catch', 'try', 'finally',
      'return', 'throw', 'new', 'delete', 'typeof', 'void', 'class',
      'function', 'do', 'with', 'import', 'export', 'from', 'const',
      'let', 'var', 'enum', 'interface', 'type', 'namespace', 'module',
    ]);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(methodRegex);

      if (match) {
        const visibility = (match[1] || '').trim();
        const isAsync = !!match[2];
        const name = match[3];
        const parameters = match[4] || '';
        const returnType = (match[5] || '').trim();

        if (name === 'constructor') continue;
        if (reservedWords.has(name)) continue;

        const startLine = i;
        const endLine = this.findClosingBrace(lines, i);
        const bodyLines = lines.slice(startLine, endLine + 1);

        methods.push({
          name,
          parameters: `(${parameters})`,
          returnType: returnType || (isAsync ? 'Promise<void>' : 'void'),
          isAsync,
          isPrivate: visibility === 'private',
          startLine: startLine + 1,
          endLine: endLine + 1,
          body: bodyLines.join('\n'),
        });
        continue;
      }

      // Multi-line method signature: opening ( has no matching ) on the same line
      // e.g. async createNonTabularLoad(loadData: {\n  field: string,\n ...}): Promise<void> {
      const multiMatch = line.match(multiLineMethodStart);
      if (multiMatch) {
        const name = multiMatch[3];
        if (name === 'constructor' || reservedWords.has(name)) continue;

        let parenDepth = 0;
        let foundClose = false;
        let closeLine = i;
        for (let k = i; k < Math.min(i + 50, lines.length); k++) {
          for (const ch of lines[k]) {
            if (ch === '(') parenDepth++;
            if (ch === ')') parenDepth--;
          }
          if (parenDepth <= 0) {
            closeLine = k;
            foundClose = true;
            break;
          }
        }

        if (foundClose && /\{\s*$/.test(lines[closeLine])) {
          const visibility = (multiMatch[1] || '').trim();
          const isAsync = !!multiMatch[2];
          const startLine = i;
          const endLine = this.findClosingBrace(lines, closeLine);
          const bodyLines = lines.slice(startLine, endLine + 1);
          const paramLines = lines.slice(i, closeLine + 1).join(' ');
          const paramMatch = paramLines.match(/\((.+)\)/s);
          const parameters = paramMatch ? paramMatch[1].trim() : '';
          const retMatch = lines[closeLine].match(/\)\s*:\s*([^\{]+)/);
          const returnType = (retMatch ? retMatch[1] : '').trim();

          methods.push({
            name,
            parameters: `(${parameters})`,
            returnType: returnType || (isAsync ? 'Promise<void>' : 'void'),
            isAsync,
            isPrivate: visibility === 'private',
            startLine: startLine + 1,
            endLine: endLine + 1,
            body: bodyLines.join('\n'),
          });
          i = closeLine;
        }
      }
    }

    return methods;
  }

  private findConstructorEndLine(lines: string[]): number {
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*constructor\s*\(/.test(lines[i])) {
        return this.findClosingBrace(lines, i) + 1; // 0-indexed, next line after constructor
      }
    }
    return -1;
  }

  private findClassEndLine(lines: string[]): number {
    // Find last closing brace at indentation level 0 or 1
    let braceCount = 0;
    let classStarted = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/(?:export\s+default\s+)?class\s+\w+/.test(line)) {
        classStarted = true;
      }
      if (!classStarted) continue;

      for (const ch of line) {
        if (ch === '{') braceCount++;
        if (ch === '}') {
          braceCount--;
          if (braceCount === 0) {
            return i; // 0-indexed
          }
        }
      }
    }
    return lines.length - 1;
  }

  private findClosingBrace(lines: string[], startLineIdx: number): number {
    let braceCount = 0;
    let started = false;

    for (let i = startLineIdx; i < lines.length; i++) {
      for (const ch of lines[i]) {
        if (ch === '{') {
          braceCount++;
          started = true;
        }
        if (ch === '}') {
          braceCount--;
          if (started && braceCount === 0) {
            return i;
          }
        }
      }
    }
    return lines.length - 1;
  }
}

export default PageObjectScanner;
