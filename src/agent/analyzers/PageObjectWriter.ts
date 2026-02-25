/**
 * PageObjectWriter
 * Adds new reusable locator functions and methods to existing page object files.
 * Ensures generated Playwright scripts reference real, callable methods.
 *
 * @author AI Agent Generator
 * @created 2026-02-12
 */

import fs from 'fs';
import { PageObjectScanner, PageObjectScanResult } from './PageObjectScanner';

/** Describes a new locator to add to a page object */
export interface NewLocatorDef {
  name: string;             // e.g. 'emailErrorMessage_LOC'
  selector: string;         // e.g. "//*[contains(text(),'Enter at least one email')]"
  locatorMethod: string;    // e.g. "locator" | "getByText" | "getByRole"
  isDynamic: boolean;       // if true, generates (param: string) => Locator
  dynamicParam?: string;    // e.g. 'text' for dynamic locators
  isPrivate?: boolean;      // defaults to true (private readonly)
}

/** Describes a new method to add to a page object */
export interface NewMethodDef {
  name: string;             // e.g. 'verifyEmailErrorMessage'
  parameters: string;       // e.g. 'expectedText: string'
  returnType: string;       // e.g. 'Promise<void>'
  isAsync: boolean;
  body: string;             // The method implementation body (without outer braces)
  jsdocComment?: string;    // Optional JSDoc block
}

/** Result of writing to a page object */
export interface WriteResult {
  success: boolean;
  filePath: string;
  addedLocators: string[];
  addedMethods: string[];
  skippedLocators: string[];   // already existed
  skippedMethods: string[];    // already existed
  error?: string;
}

export class PageObjectWriter {
  private scanner: PageObjectScanner;

  constructor(scanner: PageObjectScanner) {
    this.scanner = scanner;
  }

  /**
   * Add locators and methods to an existing page object file.
   * Skips any locator/method that already exists.
   * Returns a detailed result.
   */
  addToPageObject(
    className: string,
    locators: NewLocatorDef[],
    methods: NewMethodDef[]
  ): WriteResult {
    const scan = this.scanner.getByClassName(className);
    if (!scan) {
      return {
        success: false,
        filePath: '',
        addedLocators: [],
        addedMethods: [],
        skippedLocators: locators.map(l => l.name),
        skippedMethods: methods.map(m => m.name),
        error: `Page object class '${className}' not found in scanned pages.`,
      };
    }

    const addedLocators: string[] = [];
    const addedMethods: string[] = [];
    const skippedLocators: string[] = [];
    const skippedMethods: string[] = [];

    let content = scan.rawContent;
    const lines = content.split('\n');

    // ---- 1. Add new locators (as properties + constructor assignments) ----
    const locatorsToAdd: NewLocatorDef[] = [];
    for (const loc of locators) {
      if (this.scanner.locatorExists(className, loc.name)) {
        skippedLocators.push(loc.name);
      } else {
        locatorsToAdd.push(loc);
        addedLocators.push(loc.name);
      }
    }

    if (locatorsToAdd.length > 0) {
      content = this.insertLocators(content, lines, scan, locatorsToAdd);
    }

    // ---- 2. Add new methods (before the class closing brace) ----
    const methodsToAdd: NewMethodDef[] = [];
    for (const method of methods) {
      const scannerKnows = this.scanner.methodExists(className, method.name);
      // Fallback: raw text search catches multi-line signatures the scanner regex may miss
      const rawTextExists = new RegExp(
        `(?:async\\s+)?${method.name}\\s*\\(`, 'm'
      ).test(content);
      if (scannerKnows || rawTextExists) {
        skippedMethods.push(method.name);
        if (rawTextExists && !scannerKnows) {
          console.log(`   ⚠️ Scanner missed '${method.name}' on ${className} but raw text search found it — skipping.`);
        }
      } else {
        methodsToAdd.push(method);
        addedMethods.push(method.name);
      }
    }

    if (methodsToAdd.length > 0) {
      content = this.insertMethods(content, scan, methodsToAdd);
    }

    // ---- 3. Validate before writing ----
    if (addedLocators.length > 0 || addedMethods.length > 0) {
      const validationError = this.validateModifiedContent(content, scan.className);
      if (validationError) {
        console.log(`   ❌ POM validation failed for ${scan.className}: ${validationError}`);
        return {
          success: false,
          filePath: scan.filePath,
          addedLocators,
          addedMethods,
          skippedLocators,
          skippedMethods,
          error: `POM validation failed: ${validationError}`,
        };
      }

      try {
        fs.writeFileSync(scan.filePath, content, 'utf-8');
        this.scanner.scanFile(scan.filePath);
        console.log(`   ✅ POM validated and written: ${scan.filePath}`);
      } catch (err: any) {
        return {
          success: false,
          filePath: scan.filePath,
          addedLocators,
          addedMethods,
          skippedLocators,
          skippedMethods,
          error: `Failed to write file: ${err.message}`,
        };
      }
    }

    return {
      success: true,
      filePath: scan.filePath,
      addedLocators,
      addedMethods,
      skippedLocators,
      skippedMethods,
    };
  }

  /**
   * Add only methods to an existing page object (convenience wrapper)
   */
  addMethods(className: string, methods: NewMethodDef[]): WriteResult {
    return this.addToPageObject(className, [], methods);
  }

  /**
   * Add only locators to an existing page object (convenience wrapper)
   */
  addLocators(className: string, locators: NewLocatorDef[]): WriteResult {
    return this.addToPageObject(className, locators, []);
  }

  // ======================== PRIVATE HELPERS ========================

  /**
   * Insert locator property declarations and constructor assignments
   */
  private insertLocators(
    content: string,
    _lines: string[],
    _scan: PageObjectScanResult,
    locators: NewLocatorDef[]
  ): string {
    // Build property declarations
    const propDeclarations: string[] = [];
    const constructorAssignments: string[] = [];

    for (const loc of locators) {
      const visibility = loc.isPrivate !== false ? 'private' : 'public';
      if (loc.isDynamic && loc.dynamicParam) {
        propDeclarations.push(
          `  ${visibility} readonly ${loc.name}: (${loc.dynamicParam}: string) => Locator;`
        );
        constructorAssignments.push(
          `    this.${loc.name} = (${loc.dynamicParam}: string) => page.${loc.locatorMethod}(\`${loc.selector.replace(/'/g, '')}\`);`
        );
      } else {
        propDeclarations.push(
          `  ${visibility} readonly ${loc.name}: Locator;`
        );
        constructorAssignments.push(
          `    this.${loc.name} = page.${loc.locatorMethod}("${loc.selector.replace(/"/g, '\\"')}");`
        );
      }
    }

    // Insert property declarations before the constructor
    const constructorIdx = content.search(/\s+constructor\s*\(/);
    if (constructorIdx !== -1) {
      const newProps = '\n  // Auto-generated locators by AI Agent\n' + propDeclarations.join('\n') + '\n';
      content = content.slice(0, constructorIdx) + newProps + content.slice(constructorIdx);
    }

    // Insert constructor assignments before the constructor's closing brace
    // We need to find the constructor closing brace again (content has shifted)
    const updatedLines = content.split('\n');
    const ctorEndLine = this.findConstructorEndLine(updatedLines);
    if (ctorEndLine > 0) {
      const newAssignments = '\n    // Auto-generated locator assignments by AI Agent\n' + constructorAssignments.join('\n') + '\n';
      const before = updatedLines.slice(0, ctorEndLine);
      const after = updatedLines.slice(ctorEndLine);
      content = before.join('\n') + newAssignments + after.join('\n');
    }

    return content;
  }

  /**
   * Insert methods before the class closing brace
   */
  private insertMethods(
    content: string,
    scan: PageObjectScanResult,
    methods: NewMethodDef[]
  ): string {
    const methodStrings: string[] = [];

    for (const method of methods) {
      let methodStr = '\n';

      // JSDoc comment
      if (method.jsdocComment) {
        methodStr += `  ${method.jsdocComment}\n`;
      } else {
        methodStr += `  /**\n`;
        methodStr += `   * ${method.name} - Auto-generated by AI Agent\n`;
        methodStr += `   * @author AI Agent Generator\n`;
        methodStr += `   * @created ${new Date().toISOString().split('T')[0]}\n`;
        methodStr += `   */\n`;
      }

      // Method signature
      const asyncPrefix = method.isAsync ? 'async ' : '';
      const params = method.parameters || '';
      const returnType = method.returnType ? `: ${method.returnType}` : '';
      methodStr += `  ${asyncPrefix}${method.name}(${params})${returnType} {\n`;
      
      // Method body — indent each line
      const bodyLines = method.body.split('\n');
      for (const line of bodyLines) {
        methodStr += `    ${line}\n`;
      }

      methodStr += `  }\n`;
      methodStrings.push(methodStr);
    }

    // Find the class closing brace and insert methods before it
    const lines = content.split('\n');
    const classEndLine = this.findClassEndLineInContent(lines, scan.className);
    if (classEndLine >= 0) {
      const before = lines.slice(0, classEndLine);
      const after = lines.slice(classEndLine);
      content = before.join('\n') + '\n' + methodStrings.join('\n') + after.join('\n');
    }

    return content;
  }

  /**
   * Count only structural braces in a line of code, ignoring braces inside
   * string literals, template literals, comments, and import statements.
   */
  private countStructuralBraces(line: string): { open: number; close: number } {
    let open = 0;
    let close = 0;
    const trimmed = line.trim();

    // Skip import lines — import { X, Y } doesn't count as structural braces
    if (/^\s*import\s+/.test(trimmed)) return { open: 0, close: 0 };

    // Skip full-line comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return { open: 0, close: 0 };
    }

    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inTemplate = false;
    let escaped = false;

    for (let j = 0; j < line.length; j++) {
      const ch = line[j];

      if (escaped) { escaped = false; continue; }
      if (ch === '\\') { escaped = true; continue; }

      // Track string state
      if (ch === "'" && !inDoubleQuote && !inTemplate) { inSingleQuote = !inSingleQuote; continue; }
      if (ch === '"' && !inSingleQuote && !inTemplate) { inDoubleQuote = !inDoubleQuote; continue; }
      if (ch === '`' && !inSingleQuote && !inDoubleQuote) { inTemplate = !inTemplate; continue; }

      // Skip inline comments
      if (ch === '/' && j + 1 < line.length && line[j + 1] === '/' && !inSingleQuote && !inDoubleQuote && !inTemplate) {
        break; // rest of line is comment
      }

      if (inSingleQuote || inDoubleQuote || inTemplate) continue;

      if (ch === '{') open++;
      if (ch === '}') close++;
    }
    return { open, close };
  }

  private findConstructorEndLine(lines: string[]): number {
    let braceCount = 0;
    let inConstructor = false;

    for (let i = 0; i < lines.length; i++) {
      if (/^\s*constructor\s*\(/.test(lines[i])) {
        inConstructor = true;
      }
      if (!inConstructor) continue;

      const { open, close } = this.countStructuralBraces(lines[i]);
      braceCount += open - close;
      if (braceCount === 0 && inConstructor && (open > 0 || close > 0)) {
        return i;
      }
    }
    return -1;
  }

  private findClassEndLineInContent(lines: string[], _className: string): number {
    let braceCount = 0;
    let classStarted = false;

    for (let i = 0; i < lines.length; i++) {
      if (!classStarted && /(?:export\s+default\s+)?class\s+\w+/.test(lines[i])) {
        classStarted = true;
      }
      if (!classStarted) continue;

      const { open, close } = this.countStructuralBraces(lines[i]);
      braceCount += open - close;
      if (braceCount === 0 && classStarted && (open > 0 || close > 0)) {
        return i;
      }
    }
    return lines.length - 1;
  }

  /**
   * Validate that modified POM content is structurally correct before writing.
   * Checks: no methods/async keywords before import/class lines,
   * class declaration exists, class body has balanced braces.
   * Returns null if valid, error message string if invalid.
   */
  private validateModifiedContent(content: string, className: string): string | null {
    const lines = content.split('\n');

    // 1. Find the class declaration line
    const classLineIdx = lines.findIndex(l =>
      /(?:export\s+default\s+)?class\s+\w+/.test(l)
    );
    if (classLineIdx === -1) {
      return `No class declaration found for '${className}'`;
    }

    // 2. Check that no async/function keywords appear before the class declaration
    //    (skipping comments and empty lines)
    for (let i = 0; i < classLineIdx; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*') ||
          trimmed.startsWith('/*') || trimmed.startsWith('*/') ||
          trimmed.startsWith('import ') || trimmed.startsWith('import{') ||
          trimmed.startsWith('/**')) {
        continue;
      }
      if (/^\s*(?:async\s+|(?:public|private|protected)\s+)?\w+\s*\(/.test(trimmed)) {
        return `Method or function found outside class body at line ${i + 1}: "${trimmed.substring(0, 60)}..."`;
      }
    }

    // 3. Check structural brace balance for the class body
    let braceCount = 0;
    for (let i = classLineIdx; i < lines.length; i++) {
      const { open, close } = this.countStructuralBraces(lines[i]);
      braceCount += open - close;
    }
    if (braceCount !== 0) {
      return `Unbalanced braces in class body: net count = ${braceCount} (expected 0)`;
    }

    return null;
  }
}

export default PageObjectWriter;
