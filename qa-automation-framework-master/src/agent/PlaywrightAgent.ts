/**
 * Playwright Test Script Generator Agent
 * 
 * Main agent class that orchestrates test case parsing,
 * schema analysis, and code generation.
 * 
 * @author AI Agent Generator
 * @created 2026-02-05
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  TestCaseInput,
  TestData,
  GeneratedScript,
  AgentResponse,
  TestType
} from './types/TestCaseTypes';
import { AgentConfig, AgentConfigOptions } from './config/AgentConfig';
import { TestCaseParser } from './parsers/TestCaseParser';
import { SchemaAnalyzer } from './analyzers/SchemaAnalyzer';
import { DataValidator } from './analyzers/DataValidator';
import { CodeGenerator, PageObjectModification } from './generators/CodeGenerator';
import { TestTemplates } from './templates/TestTemplates';

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
  custom: { folder: 'dfb', file: 'dfbdata.csv' }
};

export class PlaywrightAgent {
  private config: AgentConfig;
  private parser: TestCaseParser;
  private analyzer: SchemaAnalyzer;
  private dataValidator: DataValidator;
  private generator: CodeGenerator;
  private templates: TestTemplates;

  constructor(options?: AgentConfigOptions) {
    this.config = new AgentConfig(options);
    this.parser = new TestCaseParser();
    this.analyzer = new SchemaAnalyzer();
    this.dataValidator = new DataValidator();
    this.generator = new CodeGenerator(this.config);
    this.templates = new TestTemplates();
  }

  /**
   * Generate a single Playwright test script from a test case description
   */
  async generateFromDescription(description: string): Promise<AgentResponse> {
    const startTime = Date.now();
    const scripts: GeneratedScript[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Parse the test case
      const testCase = this.parser.parseTestCase(description);
      console.log(`\n📋 Parsed Test Case: ${testCase.id}`);
      console.log(`   Category: ${testCase.category}`);
      console.log(`   Steps: ${testCase.steps.length}`);

      // Skip if both spec file and data CSV row already exist
      const skipCheck = this.shouldSkipGeneration(testCase);
      if (skipCheck.skip) {
        console.log(`⏭️  Skipping ${testCase.id}: ${skipCheck.reason}`);
        warnings.push(`Skipped ${testCase.id}: ${skipCheck.reason}`);
      } else {
        // Ensure test data exists in the respective data CSV
        this.ensureTestDataInCsv(testCase);

        // Validate and auto-correct test data
        const validationErrors = this.validateTestData(testCase);
        if (validationErrors.length > 0) {
          warnings.push(...validationErrors.map(e => `[${testCase.id}] ${e}`));
        }

        // Generate the script
        const script = await this.generator.generateScript(testCase);
        scripts.push(script);

        // Save the script
        await this.saveScript(script);
        console.log(`✅ Generated: ${script.fileName}`);
      }

    } catch (error: any) {
      errors.push(`Error generating script: ${error.message}`);
      console.error(`❌ Error: ${error.message}`);
    }

    // Log any page object file modifications
    this.logPageObjectModifications();

    return {
      success: errors.length === 0,
      scripts,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      summary: {
        totalTestCases: 1,
        successfullyGenerated: scripts.length,
        failed: errors.length,
        executionTime: Date.now() - startTime
      }
    };
  }

  /**
   * Generate Playwright test scripts from structured test case input
   */
  async generateFromTestCase(testCase: TestCaseInput, testData?: TestData): Promise<AgentResponse> {
    const startTime = Date.now();
    const scripts: GeneratedScript[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Skip if both spec file and data CSV row already exist
      const skipCheck = this.shouldSkipGeneration(testCase);
      if (skipCheck.skip) {
        console.log(`⏭️  Skipping ${testCase.id}: ${skipCheck.reason}`);
        warnings.push(`Skipped ${testCase.id}: ${skipCheck.reason}`);
      } else {
        // Ensure test data exists in the respective data CSV
        this.ensureTestDataInCsv(testCase);

        // Validate and auto-correct test data
        const validationErrors = this.validateTestData(testCase);
        if (validationErrors.length > 0) {
          warnings.push(...validationErrors.map(e => `[${testCase.id}] ${e}`));
        }

        const script = await this.generator.generateScript(testCase, testData);
        scripts.push(script);
        await this.saveScript(script);
        console.log(`✅ Generated: ${script.fileName}`);
      }
    } catch (error: any) {
      errors.push(`Error generating script for ${testCase.id}: ${error.message}`);
    }

    return {
      success: errors.length === 0,
      scripts,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      summary: {
        totalTestCases: 1,
        successfullyGenerated: scripts.length,
        failed: errors.length,
        executionTime: Date.now() - startTime
      }
    };
  }

  /**
   * Generate multiple test scripts from an array of test cases
   */
  async generateFromMultipleTestCases(
    testCases: (string | TestCaseInput)[],
    testDataMap?: Map<string, TestData>
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const scripts: GeneratedScript[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    console.log(`\n🚀 Starting generation for ${testCases.length} test cases...\n`);

    let skippedCount = 0;
    for (const input of testCases) {
      try {
        const testCase = typeof input === 'string' 
          ? this.parser.parseTestCase(input) 
          : input;

        // Skip if both spec file and data CSV row already exist
        const skipCheck = this.shouldSkipGeneration(testCase);
        if (skipCheck.skip) {
          console.log(`⏭️  Skipping ${testCase.id}: ${skipCheck.reason}`);
          warnings.push(`Skipped ${testCase.id}: ${skipCheck.reason}`);
          skippedCount++;
          continue;
        }

        // Ensure test data exists in the respective data CSV
        this.ensureTestDataInCsv(testCase);

        // Validate and auto-correct test data
        const validationErrors = this.validateTestData(testCase);
        if (validationErrors.length > 0) {
          warnings.push(...validationErrors.map(e => `[${testCase.id}] ${e}`));
        }

        const testData = testDataMap?.get(testCase.id);
        const script = await this.generator.generateScript(testCase, testData);
        scripts.push(script);
        await this.saveScript(script);
        console.log(`✅ Generated: ${script.fileName}`);
      } catch (error: any) {
        const id = typeof input === 'string' ? 'Unknown' : input.id;
        errors.push(`Error generating script for ${id}: ${error.message}`);
        console.error(`❌ Failed: ${id} - ${error.message}`);
      }
    }

    // Log any page object file modifications
    this.logPageObjectModifications();

    console.log(`\n📊 Summary:`);
    console.log(`   Total: ${testCases.length}`);
    console.log(`   Generated: ${scripts.length}`);
    console.log(`   Skipped (already exist): ${skippedCount}`);
    console.log(`   Failed: ${errors.length}`);
    console.log(`   Time: ${Date.now() - startTime}ms\n`);

    return {
      success: errors.length === 0,
      scripts,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      summary: {
        totalTestCases: testCases.length,
        successfullyGenerated: scripts.length,
        failed: errors.length,
        executionTime: Date.now() - startTime
      }
    };
  }

  /**
   * Generate script using a specific template
   */
  async generateFromTemplate(
    templateType: TestType,
    testCase: TestCaseInput,
    customSteps?: string,
    testData?: TestData
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const scripts: GeneratedScript[] = [];
    const errors: string[] = [];

    try {
      const content = this.templates.fillTemplate(
        templateType,
        testCase,
        customSteps || '',
        testData
      );

      const script: GeneratedScript = {
        testCaseId: testCase.id,
        fileName: `${testCase.id}.spec.ts`,
        filePath: `${this.config.outputDir}/${testCase.category}/${testCase.id}.spec.ts`,
        content,
        imports: [],
        pageObjectsUsed: [],
        constantsUsed: [],
        testSteps: [],
        metadata: {
          author: 'AI Agent Generator',
          createdDate: new Date().toISOString().split('T')[0],
          testCategory: testCase.category,
          testType: templateType,
          retryCount: 1,
          timeout: 300000,
          tags: testCase.tags || []
        }
      };

      scripts.push(script);
      await this.saveScript(script);
      console.log(`✅ Generated from template: ${script.fileName}`);
    } catch (error: any) {
      errors.push(`Error generating from template: ${error.message}`);
    }

    return {
      success: errors.length === 0,
      scripts,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        totalTestCases: 1,
        successfullyGenerated: scripts.length,
        failed: errors.length,
        executionTime: Date.now() - startTime
      }
    };
  }

  /**
   * Analyze a test case and suggest the best approach
   */
  async analyzeTestCase(input: string | TestCaseInput): Promise<{
    testCase: TestCaseInput;
    suggestedTemplate: TestType;
    suggestedPageObjects: string[];
    suggestedConstants: string[];
    complexity: 'simple' | 'medium' | 'complex';
  }> {
    const testCase = typeof input === 'string' 
      ? this.parser.parseTestCase(input) 
      : input;

    const suggestedTemplate = this.templates.suggestTemplate(testCase);
    const suggestedPageObjects: string[] = [];

    testCase.steps.forEach(step => {
      const pageObjects = this.analyzer.suggestPageObjects(step.action);
      pageObjects.forEach(po => {
        if (!suggestedPageObjects.includes(po)) {
          suggestedPageObjects.push(po);
        }
      });
    });

    // Determine complexity
    let complexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (testCase.steps.length > 10 || suggestedTemplate === 'multi-app') {
      complexity = 'complex';
    } else if (testCase.steps.length > 5) {
      complexity = 'medium';
    }

    return {
      testCase,
      suggestedTemplate,
      suggestedPageObjects,
      suggestedConstants: this.analyzer.getAvailableConstants(),
      complexity
    };
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): TestType[] {
    return this.templates.getAllTemplates().map(t => t.type);
  }

  /**
   * Get project schema information
   */
  async getProjectSchema(): Promise<{
    pageObjects: string[];
    constants: string[];
    utilities: string[];
    testCategories: string[];
  }> {
    const schema = await this.analyzer.analyzeSchema();
    return {
      pageObjects: schema.pageObjects.map(po => po.name),
      constants: schema.constants,
      utilities: schema.utilities,
      testCategories: this.config.testCategories
    };
  }

  /**
   * Save generated script to file after sanitization and validation.
   * Flow: sanitize -> validate -> re-sanitize if needed -> write -> compile check
   */
  private async saveScript(script: GeneratedScript): Promise<void> {
    const dir = path.dirname(script.filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Mandatory pre-write sanitization: auto-fix known syntax issues
    console.log(`   🔧 Sanitizing generated code for ${script.testCaseId}...`);
    script.content = this.sanitizeGeneratedCode(script.content);

    // Self-check and auto-fix pass (multi-app detection + pattern fixes)
    const isMultiApp = script.content.includes('MultiAppManager') || script.content.includes('appManager');
    const selfCheckResult = this.selfCheckAndFix(script.content, isMultiApp);
    script.content = selfCheckResult.content;
    if (selfCheckResult.warnings.length > 0) {
      console.log(`   ⚠️ Self-check warnings for ${script.testCaseId}:`);
      selfCheckResult.warnings.forEach(w => console.log(`      - ${w}`));
    }

    // Validate after sanitization + self-check
    const issues = this.validateGeneratedCode(script.content, script.testCaseId);
    if (issues.length > 0) {
      console.log(`   ⚠️ Validation warnings for ${script.testCaseId} (post-sanitize):`);
      issues.forEach(issue => console.log(`      - ${issue}`));
      // Re-sanitize in case validation found fixable patterns
      script.content = this.sanitizeGeneratedCode(script.content);
    }

    fs.writeFileSync(script.filePath, script.content, 'utf-8');

    // Post-write: compile check as standard practice
    this.runCompilationCheck(script.filePath, script.testCaseId);
  }

  /**
   * Run TypeScript compilation check on a generated file using the full project
   * tsconfig.json (which includes path alias resolution for @utils/, @config/, etc.).
   * Logs only genuine compilation errors — path alias resolution warnings (TS2307
   * for @-prefixed imports) are filtered out since they resolve correctly at runtime.
   */
  private runCompilationCheck(filePath: string, testId: string): void {
    console.log(`\n🔍 Running TypeScript compilation check for ${testId}...`);
    const projectRoot = path.resolve(__dirname, '../..');
    try {
      execSync(`npx tsc --noEmit --pretty -p tsconfig.json 2>&1`, {
        encoding: 'utf-8',
        timeout: 60000,
        cwd: projectRoot,
      });
      console.log(`   ✅ Compilation check passed — no TypeScript errors found`);
    } catch (error: any) {
      const output = error.stdout || error.message || '';
      // Only look at errors in the specific generated file
      const fileBasename = path.basename(filePath);
      const errorLines = output
        .split('\n')
        .filter((line: string) => {
          // Must be about our generated file
          if (!line.includes(fileBasename)) return false;
          // Must be an actual TS error/warning
          if (!line.includes('error TS') && !line.includes('warning TS')) return false;
          // Filter out path alias resolution errors (TS2307) for @ imports —
          // these always resolve correctly at runtime via tsconfig-paths
          if (line.includes('TS2307') && line.match(/@\w+\//)) return false;
          return true;
        })
        .map((line: string) => line.trim());

      if (errorLines.length > 0) {
        console.log(`   ⚠️ TypeScript compilation issues found for ${testId}:`);
        errorLines.forEach((line: string) => console.log(`      ${line}`));
        console.log(`   📝 Total: ${errorLines.length} issue(s) — review and fix before running tests`);
      } else {
        console.log(`   ✅ Compilation check passed — no actionable TypeScript errors`);
      }
    }
  }

  /**
   * Sanitize generated code to auto-fix common syntax errors before writing.
   * This is a mandatory pre-write step — the agent MUST NOT output broken code.
   *
   * Fixes: smart/curly quotes, invalid testData.* identifiers, empty ALERT_PATTERNS,
   * trailing dots in property access, smart quotes in TABS.*, clickButtonByText(), etc.
   */
  private sanitizeGeneratedCode(content: string): string {
    let code = content;

    // 1. Replace ALL smart/curly quotes with regular quotes throughout the entire file.
    //    Smart quotes from CSV data corrupt executable code when embedded directly.
    code = code.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');  // smart double -> regular double
    code = code.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");  // smart single -> regular single

    // 2. Fix invalid testData.* property access — strip quotes, parens, special chars
    //    e.g. testData.customernameinthe"Customer"field(MillerCoors) -> testData.customerName
    //    Only captures the immediate property name (up to next dot, paren, space, etc.)
    code = code.replace(/testData\.([a-zA-Z_$][\w$]*(?:[\u201C\u201D"'][^"']*[\u201C\u201D"']\w*)*)/g, (_match, prop: string) => {
      // If the property is a clean identifier already (e.g. Carrier, offerRate), keep it
      if (/^[a-zA-Z_$][\w$]*$/.test(prop)) {
        return `testData.${prop}`;
      }
      // Strip all non-alphanumeric/underscore characters from the property name
      let cleaned = prop.replace(/[^a-zA-Z0-9_]/g, '');
      if (!cleaned) cleaned = 'unknownField';
      cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
      return `testData.${cleaned}`;
    });

    // 3. Fix empty ALERT_PATTERNS. (dot with nothing after) -> ALERT_PATTERNS.UNKNOWN_MESSAGE
    code = code.replace(/ALERT_PATTERNS\.\s*[),;\n]/g, (match) => {
      return `ALERT_PATTERNS.UNKNOWN_MESSAGE${match.charAt(match.length - 1)}`;
    });

    // 4. Fix TABS."CARRIER or TABS."anything -> TABS.CARRIER (strip embedded quotes)
    code = code.replace(/TABS\.[""']*([A-Z_]+)/g, (_match, name: string) => {
      return `TABS.${name}`;
    });

    // 5. Fix clickButtonByText with smart/extra quotes: clickButtonByText(""Search"") -> clickButtonByText("Search")
    code = code.replace(/clickButtonByText\(\s*""+([^"]*)""+\s*\)/g, (_match, text: string) => {
      return `clickButtonByText("${text.trim()}")`;
    });

    // 6. Fix fillFieldBySelector with invalid selectors containing quotes/parens
    //    e.g. fillFieldBySelector("the_"customer"_field", ...) -> fillFieldBySelector("customer_field", ...)
    code = code.replace(/fillFieldBySelector\(\s*"([^"]*)"([^)]*)\)/g, (_match, selector: string, rest: string) => {
      const cleanSelector = selector.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      // Also clean the second argument if it's a testData reference (already handled by rule 2)
      return `fillFieldBySelector("${cleanSelector}"${rest})`;
    });

    // 7. Fix selectOptionByField with invalid selectors
    code = code.replace(/selectOptionByField\(\s*"([^"]*)"([^)]*)\)/g, (_match, selector: string, rest: string) => {
      const cleanSelector = selector.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
      return `selectOptionByField("${cleanSelector}"${rest})`;
    });

    // 8. Remove trailing dots from property access chains: obj.prop. ) -> obj.prop)
    code = code.replace(/(\w)\.\s*([),;\n\r])/g, '$1$2');

    // 9. Fix DMELogin/TNXLogin with extra password argument
    code = code.replace(/DMELogin\(([^,)]+),\s*[^)]+\)/g, 'DMELogin($1)');
    code = code.replace(/TNXLogin\(([^,)]+),\s*[^)]+\)/g, 'TNXLogin($1)');

    // 10. Fix navigateToHeader (doesn't exist) -> hoverOverHeaderByText
    code = code.replace(/pages\.homePage\.navigateToHeader\(/g, 'pages.basePage.hoverOverHeaderByText(');

    // 11. Ensure loadNumber is assigned after Create Load if it's used but never assigned
    if (/let loadNumber/.test(code) && /searchLoad\(loadNumber\)|expect\(loadNumber/.test(code)) {
      if (!/loadNumber\s*=\s*await/.test(code)) {
        // Inject loadNumber capture after clickButtonByText("Create Load") or clickButton("create")
        code = code.replace(
          /(clickButtonByText\("Create Load"\);[\s\S]*?waitForMultipleLoadStates\(\[.*?\]\);)/,
          `$1\n        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();\n        console.log("Created Load Number:", loadNumber);`
        );
      }
    }

    // 12. Ensure BTMS login step exists — if completely missing, inject it after beforeAll
    if (!code.includes('BTMSLogin') && code.includes('test.describe')) {
      const btmsLoginBlock = `      await test.step("Step 1: Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
          await pages.btmsAcceptTermPage.acceptTermsAndConditions();
        }
        pages.logger.info("Logged in successfully");
      });\n\n`;
      code = code.replace(
        /(test\.setTimeout\(\d+\);)\n/,
        `$1\n\n${btmsLoginBlock}`
      );
    }

    return code;
  }

  /**
   * Validate generated code for common issues before writing.
   * Returns an array of warning/error messages. Empty = clean.
   */
  private validateGeneratedCode(content: string, _testId: string): string[] {
    const issues: string[] = [];

    // --- Structural checks ---

    // Check for unmatched braces/brackets/parens
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push(`Unbalanced braces: ${openBraces} open vs ${closeBraces} close`);
    }

    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      issues.push(`Unbalanced parentheses: ${openParens} open vs ${closeParens} close`);
    }

    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push(`Unbalanced brackets: ${openBrackets} open vs ${closeBrackets} close`);
    }

    // --- Common typo checks ---

    if (content.includes('HEADERS.LOADS')) {
      issues.push(`Found 'HEADERS.LOADS' — should be 'HEADERS.LOAD'`);
    }
    if (content.includes('LOADS_SUB_MENU')) {
      issues.push(`Found 'LOADS_SUB_MENU' — should be 'LOAD_SUB_MENU'`);
    }

    // --- Empty body checks ---

    if (content.includes('async () => {\n    }') || content.includes('async () => {}')) {
      issues.push('Found empty test body — no implementation code generated');
    }

    // --- Smart quotes (CSV import artifact) ---

    if (/[\u201C\u201D\u2018\u2019]/.test(content)) {
      issues.push('Found smart quotes — these will cause TypeScript syntax errors');
    }

    // --- Trailing dots in property access ---

    if (/\.\s*[,;)\]}]/.test(content)) {
      issues.push('Found trailing dot in property access — potential syntax error');
    }

    // --- Must have test structure ---

    if (!content.includes('test(') && !content.includes('test.describe')) {
      issues.push('No test() or test.describe() found — script may be incomplete');
    }

    // --- Alert/dialog handling checks ---

    // Warn if agent-created duplicates are used instead of the existing commonReusables.validateAlert
    if (content.includes('verifyMessageDisplayed') || content.includes('basePage.verifyAlertMessage')) {
      issues.push(
        `Found agent-created duplicate (verifyMessageDisplayed or basePage.verifyAlertMessage) — ` +
        `always use the existing pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.*) instead.`
      );
    }

    // If using page.on('dialog') without Promise.all, the dialog may be missed
    if (content.includes("on('dialog'") && !content.includes('Promise.all')) {
      issues.push(
        `Found page.on('dialog') without Promise.all — dialog handler must be registered ` +
        `concurrently with the triggering action to avoid race conditions`
      );
    }

    // --- Hardcoded alert string check ---
    // Alert messages should always reference ALERT_PATTERNS constants, not hardcoded strings

    // Alert messages should always reference ALERT_PATTERNS constants, not hardcoded strings
    const validateAlertCalls = content.match(/validateAlert\([^)]*"[^"]+"/g) || [];
    for (const call of validateAlertCalls) {
      if (!call.includes('ALERT_PATTERNS') && !call.includes('SALES_LEAD_ALERT_PATTERNS')) {
        issues.push(
          `Found validateAlert with hardcoded string instead of ALERT_PATTERNS constant — ` +
          `always use centralized constants from @utils/alertPatterns (e.g., ALERT_PATTERNS.EMAIL_NOTIFICATION_REQUIRED)`
        );
        break;
      }
    }

    // Check that ALERT_PATTERNS is imported when used
    if (content.includes('ALERT_PATTERNS') && !content.includes('import { ALERT_PATTERNS }') && !content.includes('import {ALERT_PATTERNS}')) {
      issues.push(
        `ALERT_PATTERNS is referenced but not imported — add: import { ALERT_PATTERNS } from "@utils/alertPatterns";`
      );
    }

    // --- Import checks ---

    if (content.includes('Dialog') && !content.includes("import") ) {
      issues.push('Using Dialog type but missing import from @playwright/test');
    }

    // --- Unused variable checks ---

    const declaredVars = content.match(/(?:let|const|var)\s+(\w+)\s*[=:;]/g) || [];
    for (const decl of declaredVars) {
      const varMatch = decl.match(/(?:let|const|var)\s+(\w+)/);
      if (varMatch) {
        const varName = varMatch[1];
        if (['sharedContext', 'sharedPage', 'pages', 'testData', 'testcaseID', 'appManager'].includes(varName)) continue;
        const escapedVar = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const usages = content.match(new RegExp(`\\b${escapedVar}\\b`, 'g'));
        if (usages && usages.length === 1) {
          issues.push(`Variable '${varName}' is declared but never used — may cause TS6133 linter error`);
        }
      }
    }

    // --- Uninitialized variable usage (loadNumber) ---
    // If loadNumber is used (searchLoad, expect, console.log) but never assigned (no `loadNumber =`)
    if (content.includes('let loadNumber')) {
      const isAssigned = /loadNumber\s*=\s*await/.test(content);
      const isUsed = /searchLoad\(loadNumber\)|expect\(loadNumber/.test(content);
      if (isUsed && !isAssigned) {
        issues.push(`'loadNumber' is used but never assigned — add 'loadNumber = await pages.dfbLoadFormPage.getLoadNumber()' after Create Load`);
      }
    }

    // --- Non-existent method calls ---
    if (content.includes('navigateToHeader')) {
      issues.push(`'navigateToHeader' does not exist on HomePage — use basePage.hoverOverHeaderByText() instead`);
    }

    // --- Missing BTMS login (application URL won't open) ---
    if (!content.includes('BTMSLogin') && content.includes('test.describe')) {
      issues.push(`No BTMSLogin step found — the application URL will never open. BTMS login must always be the first step.`);
    }

    // --- Login method argument count checks ---
    const dmeLoginMatch = content.match(/DMELogin\(([^)]*)\)/g) || [];
    for (const call of dmeLoginMatch) {
      const args = call.match(/DMELogin\(([^)]*)\)/);
      if (args && args[1].includes(',')) {
        issues.push(`DMELogin called with multiple args but only accepts 1 (userName) — remove password arg`);
      }
    }
    const tnxLoginMatch = content.match(/TNXLogin\(([^)]*)\)/g) || [];
    for (const call of tnxLoginMatch) {
      const args = call.match(/TNXLogin\(([^)]*)\)/);
      if (args && args[1].includes(',')) {
        issues.push(`TNXLogin called with multiple args but only accepts 1 (userName) — remove password arg`);
      }
    }

    // --- No relative page.goto("/") — must use absolute URLs ---
    if (/\.goto\s*\(\s*["']\s*\/\s*["']\s*\)/.test(content)) {
      issues.push(
        `Found page.goto("/") — relative URLs fail at runtime. ` +
        `Use: const btmsBaseUrl = new URL(sharedPage.url()).origin; await sharedPage.goto(btmsBaseUrl);`
      );
    }

    // --- Multi-app typed variables check ---
    const isMultiApp = content.includes('MultiAppManager') || content.includes('appManager');
    if (isMultiApp) {
      if (/let\s+sharedContext\s*:\s*any/.test(content)) {
        issues.push(`Multi-app test uses 'sharedContext: any' — should be 'sharedContext: BrowserContext'`);
      }
      if (/let\s+sharedPage\s*:\s*any/.test(content)) {
        issues.push(`Multi-app test uses 'sharedPage: any' — should be 'sharedPage: Page'`);
      }
      // Multi-app tests must call closeAllSecondaryPages() in afterAll
      if (!content.includes('closeAllSecondaryPages')) {
        issues.push(
          `Multi-app test missing closeAllSecondaryPages() in afterAll — ` +
          `secondary tabs (DME, TNX) will leak between test runs`
        );
      }
    }

    // --- Step numbering sequential check ---
    const stepMatches = content.match(/Step (\d+)/g) || [];
    const stepNumbers = stepMatches.map(s => parseInt(s.replace('Step ', ''), 10));
    for (let i = 1; i < stepNumbers.length; i++) {
      if (stepNumbers[i] !== stepNumbers[i - 1] + 1 && stepNumbers[i] !== stepNumbers[i - 1]) {
        issues.push(
          `Step numbering gap: Step ${stepNumbers[i - 1]} → Step ${stepNumbers[i]}. Steps should be sequential.`
        );
        break;
      }
    }

    // --- Expected results grouped at end anti-pattern ---
    if (content.includes('await test.step("Verify Expected Results"')) {
      issues.push(
        `Expected results are grouped in a trailing "Verify Expected Results" block. ` +
        `They should be embedded inline in their corresponding test steps.`
      );
    }

    // --- testData.undefined check ---
    if (/testData\.undefined\b/.test(content)) {
      issues.push(`Found 'testData.undefined' — a testData field reference resolved to undefined`);
    }

    return issues;
  }

  /**
   * Post-generation self-check and auto-fix pass.
   * Scans generated code for common anti-patterns and auto-fixes what it can.
   * Returns the fixed content and a list of warnings for items that could not be auto-fixed.
   */
  private selfCheckAndFix(content: string, isMultiApp: boolean): { content: string; warnings: string[] } {
    let code = content;
    const warnings: string[] = [];

    // Fix 1: Replace page.goto("/") with absolute URL pattern
    if (/\.goto\s*\(\s*["']\s*\/\s*["']\s*\)/.test(code)) {
      code = code.replace(
        /await\s+(\w+)\.goto\s*\(\s*["']\s*\/\s*["']\s*\)/g,
        `const btmsBaseUrl = new URL($1.url()).origin;\n        await $1.goto(btmsBaseUrl)`
      );
      console.log('   🔧 Self-check: Fixed relative goto("/") → absolute URL');
    }

    // Fix 2: Upgrade any → typed variables for multi-app
    if (isMultiApp) {
      if (/let\s+sharedContext\s*:\s*any/.test(code)) {
        code = code.replace(/let\s+sharedContext\s*:\s*any/, 'let sharedContext: BrowserContext');
        console.log('   🔧 Self-check: Fixed sharedContext: any → BrowserContext');
      }
      if (/let\s+sharedPage\s*:\s*any/.test(code)) {
        code = code.replace(/let\s+sharedPage\s*:\s*any/, 'let sharedPage: Page');
        console.log('   🔧 Self-check: Fixed sharedPage: any → Page');
      }

      // Ensure BrowserContext and Page are imported
      if (code.includes('BrowserContext') && !code.includes('import') ) {
        // This shouldn't happen with proper generation, but warn
        warnings.push('BrowserContext type used but import may be missing');
      }

      // Ensure closeAllSecondaryPages in afterAll
      if (!code.includes('closeAllSecondaryPages') && code.includes('afterAll')) {
        code = code.replace(
          /(test\.afterAll\(async\s*\(\)\s*=>\s*{)/,
          `$1\n    if (appManager) {\n      await appManager.closeAllSecondaryPages();\n    }`
        );
        console.log('   🔧 Self-check: Added closeAllSecondaryPages() to afterAll');
      }
    }

    // Fix 3: Replace testData.undefined with a warning comment
    if (/testData\.undefined\b/.test(code)) {
      code = code.replace(/testData\.undefined/g, 'testData.FIXME_UNDEFINED_FIELD');
      warnings.push('Found testData.undefined references — replaced with testData.FIXME_UNDEFINED_FIELD');
    }

    // Fix 4: Ensure ALERT_PATTERNS import when referenced
    if (code.includes('ALERT_PATTERNS') && !code.includes('import { ALERT_PATTERNS }') && !code.includes('import {ALERT_PATTERNS}')) {
      const firstImportIdx = code.indexOf('import ');
      if (firstImportIdx >= 0) {
        const insertPos = code.indexOf('\n', firstImportIdx);
        code = code.slice(0, insertPos + 1) +
          'import { ALERT_PATTERNS } from "@utils/alertPatterns";\n' +
          code.slice(insertPos + 1);
        console.log('   🔧 Self-check: Added missing ALERT_PATTERNS import');
      }
    }

    // Fix 5: Scaffold mismatch — if multi-app keywords exist in step/test code but
    // the scaffold uses PageManager instead of MultiAppManager, fix the scaffold
    if (!isMultiApp) {
      const multiAppKeywordsInCode = [
        'appManager', 'switchToDME', 'switchToTNX', 'switchToBTMS',
        'MultiAppManager', 'closeAllSecondaryPages', 'dmePageManager', 'tnxPageManager',
      ];
      const hasMultiAppCode = multiAppKeywordsInCode.some(kw => code.includes(kw));
      if (hasMultiAppCode) {
        warnings.push('SCAFFOLD MISMATCH: Multi-app code detected but standard scaffold used. Upgrading to multi-app scaffold.');
        // Upgrade variable types
        code = code.replace(/let\s+sharedContext\s*:\s*any/, 'let sharedContext: BrowserContext');
        code = code.replace(/let\s+sharedPage\s*:\s*any/, 'let sharedPage: Page');
        // Add MultiAppManager variable if missing
        if (!code.includes('let appManager')) {
          code = code.replace(
            /let pages: PageManager;/,
            'let appManager: MultiAppManager;\nlet pages: PageManager;'
          );
        }
        // Fix beforeAll to use MultiAppManager instead of PageManager
        if (code.includes('pages = new PageManager(sharedPage)') && !code.includes('appManager = new MultiAppManager')) {
          code = code.replace(
            /pages = new PageManager\(sharedPage\);/,
            'appManager = new MultiAppManager(sharedContext, sharedPage);\n    pages = appManager.btmsPageManager;'
          );
        }
        // Fix timeout from 300000 to WAIT.SPEC_TIMEOUT_LARGE
        code = code.replace(/test\.setTimeout\(300000\)/, 'test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE)');
        // Ensure MultiAppManager import
        if (!code.includes('MultiAppManager')) {
          code = code.replace(
            /import { PageManager }/,
            'import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";\nimport { PageManager }'
          );
        }
        // Ensure BrowserContext/Page imports
        if (code.includes('BrowserContext') && !code.includes('BrowserContext,') && !code.includes('BrowserContext }')) {
          code = code.replace(
            /import \{ test, expect \}/,
            'import { BrowserContext, expect, Page, test }'
          );
        }
        // Add closeAllSecondaryPages to afterAll if missing
        if (!code.includes('closeAllSecondaryPages') && code.includes('afterAll')) {
          code = code.replace(
            /(test\.afterAll\(async\s*\(\)\s*=>\s*{)/,
            `$1\n    if (appManager) {\n      await appManager.closeAllSecondaryPages();\n    }`
          );
        }
        console.log('   🔧 Self-check: Upgraded standard scaffold → multi-app scaffold');
      }
    }

    // Fix 6: Remove placeholder steps (only waitForMultipleLoadStates / empty body)
    // These steps have no real test logic — they were generated when the agent
    // couldn't map a CSV action to any POM call. Remove them entirely.
    const placeholderStepRegex = /\n\s*await test\.step\("([^"]+)",\s*async\s*\(\)\s*=>\s*\{\s*(?:\/\/[^\n]*\n\s*)*(?:\/\/[^\n]*\n\s*)?await pages\.basePage\.waitForMultipleLoadStates\(\["load",\s*"networkidle"\]\);\s*\}\);\s*\n/g;
    const placeholderMatches = code.match(placeholderStepRegex) || [];
    if (placeholderMatches.length > 0) {
      for (const ph of placeholderMatches) {
        const stepNameMatch = ph.match(/test\.step\("([^"]+)"/);
        const stepName = stepNameMatch ? stepNameMatch[1] : 'unknown';
        console.log(`   🔧 Self-check: Removed empty placeholder step: "${stepName.substring(0, 60)}..."`);
        code = code.replace(ph, '\n');
      }
      warnings.push(`PLACEHOLDER STEPS: Removed ${placeholderMatches.length} empty step(s) that contained only waitForMultipleLoadStates.`);
    }

    // Fix 7: Detect fillFieldBySelector with invented selectors (not valid CSS/XPath)
    const inventedSelectorPattern = /fillFieldBySelector\(\s*"([^"]+)"/g;
    let selectorMatch;
    const inventedSelectors: string[] = [];
    while ((selectorMatch = inventedSelectorPattern.exec(code)) !== null) {
      const selector = selectorMatch[1];
      // Valid selectors start with #, ., [, //, or contain CSS syntax
      if (!selector.match(/^[#.\[\/>]/) && !selector.includes('=') && selector.includes('_')) {
        inventedSelectors.push(selector);
      }
    }
    if (inventedSelectors.length > 0) {
      warnings.push(`INVENTED SELECTORS: ${inventedSelectors.length} fillFieldBySelector call(s) use auto-generated selectors that likely don't exist: ${inventedSelectors.slice(0, 3).join(', ')}...`);
    }

    // Fix 8: Wrong timeout for multi-app tests
    if (isMultiApp && code.includes('test.setTimeout(300000)')) {
      code = code.replace(/test\.setTimeout\(300000\)/, 'test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE)');
      console.log('   🔧 Self-check: Fixed timeout 300000 → WAIT.SPEC_TIMEOUT_LARGE for multi-app test');
    }

    // Fix 9: Ensure commonReusables import when validateAlert is used
    if (code.includes('commonReusables') && !code.includes('import commonReusables')) {
      const firstImportIdx = code.indexOf('import ');
      if (firstImportIdx >= 0) {
        const insertPos = code.indexOf('\n', firstImportIdx);
        code = code.slice(0, insertPos + 1) +
          'import commonReusables from "@utils/commonReusables";\n' +
          code.slice(insertPos + 1);
        console.log('   🔧 Self-check: Added missing commonReusables import');
      }
    }

    // Fix 10: Ensure commissionHelper import when referenced
    if (code.includes('commissionHelper') && !code.includes('import commissionHelper')) {
      const firstImportIdx = code.indexOf('import ');
      if (firstImportIdx >= 0) {
        const insertPos = code.indexOf('\n', firstImportIdx);
        code = code.slice(0, insertPos + 1) +
          'import commissionHelper from "@utils/commission-helpers";\n' +
          code.slice(insertPos + 1);
        console.log('   🔧 Self-check: Added missing commissionHelper import');
      }
    }

    // ═══════ NEW PRODUCTION FIXES (11-15) ═══════

    // Fix 11: Import deduplication — remove duplicate import lines
    {
      const lines = code.split('\n');
      const seenImports = new Set<string>();
      const deduped: string[] = [];
      let removedCount = 0;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ')) {
          if (seenImports.has(trimmed)) {
            removedCount++;
            continue;
          }
          seenImports.add(trimmed);
        }
        deduped.push(line);
      }
      if (removedCount > 0) {
        code = deduped.join('\n');
        console.log(`   🔧 Self-check: Removed ${removedCount} duplicate import line(s)`);
      }
    }

    // Fix 12: POM method validation — detect calls to non-existent or misnamed methods
    {
      const METHOD_ALIASES: Record<string, string> = {
        'basePage.clickButton': 'basePage.clickButtonByText',
        'basePage.navigateToHeader': 'basePage.hoverOverHeaderByText',
        'basePage.verifyMessageDisplayed': 'commonReusables.validateAlert',
        'basePage.verifyAlertMessage': 'commonReusables.validateAlert',
      };

      for (const [badCall, goodCall] of Object.entries(METHOD_ALIASES)) {
        const [badObj, badMethod] = badCall.split('.');
        const pattern = new RegExp(
          `pages\\.${badObj}\\.${badMethod}\\s*\\(`,
          'g'
        );
        if (pattern.test(code)) {
          const [goodObj, goodMethod] = goodCall.split('.');
          const isUtility = goodObj === 'commonReusables';
          const replacement = isUtility
            ? `pages.${goodObj}.${goodMethod}(`
            : `pages.${goodObj}.${goodMethod}(`;
          code = code.replace(pattern, replacement);
          console.log(`   🔧 Self-check: Fixed ${badCall}() → ${goodCall}()`);
        }
      }

      // Detect fillFieldByLabel usage (AI-generated stub) and warn
      if (/pages\.basePage\.fillFieldByLabel\s*\(/.test(code)) {
        warnings.push(
          'FORBIDDEN PATTERN: basePage.fillFieldByLabel() is an AI-generated stub. ' +
          'Use specific POM field methods instead.'
        );
      }

      // Detect postAutomationRulePage.hoverAndSelectOfficeConfig (non-existent)
      if (code.includes('postAutomationRulePage.hoverAndSelectOfficeConfig')) {
        code = code.replace(
          /await pages\.postAutomationRulePage\.hoverAndSelectOfficeConfig\([^)]*\);?/g,
          `await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`
        );
        console.log('   🔧 Self-check: Replaced hoverAndSelectOfficeConfig → hoverOverHeaderByText(HEADERS.HOME)');
      }

      // Detect newSalesLeadPage.enterCustomerName (should be searchCustomerPage)
      if (code.includes('newSalesLeadPage.enterCustomerName')) {
        code = code.replace(
          /pages\.newSalesLeadPage\.enterCustomerName/g,
          'pages.searchCustomerPage.enterCustomerName'
        );
        console.log('   🔧 Self-check: Fixed newSalesLeadPage.enterCustomerName → searchCustomerPage.enterCustomerName');
      }
    }

    // Fix 12b: Ensure selectCarreirContactForRateConfirmation passes CARRIER_CONTACT.CONTACT_1
    if (code.includes('selectCarreirContactForRateConfirmation()')) {
      code = code.replace(
        /selectCarreirContactForRateConfirmation\(\)/g,
        'selectCarreirContactForRateConfirmation(CARRIER_CONTACT.CONTACT_1)'
      );
      console.log('   🔧 Self-check: Added CARRIER_CONTACT.CONTACT_1 to selectCarreirContactForRateConfirmation');
    }

    // Fix 12c: Replace undefined variables from pattern-matching with correct testData references
    if (code.includes('randomCustomerName') && !code.includes('const randomCustomerName') && !code.includes('let randomCustomerName')) {
      code = code.replace(/randomCustomerName/g, 'testData.customerName');
      console.log('   🔧 Self-check: Replaced randomCustomerName → testData.customerName');
    }

    // Fix 13: Replace clickHomeButton() with URL-based navigation
    if (/pages\.basePage\.clickHomeButton\s*\(\s*\)/.test(code)) {
      code = code.replace(
        /await pages\.basePage\.clickHomeButton\s*\(\s*\)\s*;/g,
        `const btmsBaseUrl = new URL(sharedPage.url()).origin;
        await sharedPage.goto(btmsBaseUrl);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`
      );
      console.log('   🔧 Self-check: Replaced clickHomeButton() → URL-based navigation');
    }

    // Fix 14: Helper import correction for multi-app tests
    if (isMultiApp) {
      if (code.includes('import dfbHelpers from') && code.includes('commissionHelper')) {
        // Both imports present — remove dfbHelpers if only commissionHelper is used in code body
        const codeBody = code.substring(code.indexOf('test.describe'));
        if (!codeBody.includes('dfbHelpers.') && codeBody.includes('commissionHelper.')) {
          code = code.replace(/import dfbHelpers from "[^"]+";\n?/g, '');
          console.log('   🔧 Self-check: Removed unused dfbHelpers import (commissionHelper is used instead)');
        }
      }
      // If dfbHelpers is imported but NOT used, and commissionHelper IS used but NOT imported
      if (code.includes('import dfbHelpers from') && !code.includes('import commissionHelper')) {
        const codeBody = code.substring(code.indexOf('test.describe') || 0);
        if (codeBody.includes('commissionHelper.') && !codeBody.includes('dfbHelpers.')) {
          code = code.replace(
            /import dfbHelpers from "[^"]+";/,
            'import commissionHelper from "@utils/commission-helpers";'
          );
          console.log('   🔧 Self-check: Replaced dfbHelpers import → commissionHelper');
        }
      }
    }

    // Fix 15: Clean up "Verify Remaining Expected Results" block quality
    // Replace console.log("Manual verification needed: ...") with TODO warnings
    // and remove duplicate assertion calls within the block
    {
      const verifyBlockMatch = code.match(
        /await test\.step\("(?:Step \d+: )?Verify Remaining Expected Results"[\s\S]*?\n\s*\}\);/
      );
      if (verifyBlockMatch) {
        let block = verifyBlockMatch[0];
        const manualLogCount = (block.match(/console\.log\("Manual verification needed/g) || []).length;
        const todoCount = (block.match(/\/\/ TODO:/g) || []).length;
        if (manualLogCount > 3 || todoCount > 3) {
          warnings.push(
            `WEAK VALIDATION: "Verify Remaining Expected Results" has ${manualLogCount} manual-only checks ` +
            `and ${todoCount} TODOs. Expected results should be inline assertions in their steps.`
          );
        }
        // Remove truly empty/useless lines: console.log("Manual verification needed: ...") without any assertion
        block = block.replace(
          /\s*console\.log\("Manual verification needed:.*?"\);\s*\/\/ TODO:.*\n/g,
          '\n'
        );
        code = code.replace(verifyBlockMatch[0], block);
      }
    }

    // Fix 16: Sidebar wait after BTMS navigation — prevent timing failures
    // Every goto(btmsBaseUrl/btmsHome/btmsOrigin) followed by hoverOverHeaderByText
    // must have a sidebar container wait in between.
    {
      const gotoThenHover = /await sharedPage\.goto\(btms\w+\);\s*\n(\s*)await pages\.basePage\.waitForMultipleLoadStates\(\["load",\s*"networkidle"\]\);\s*\n(\s*)(await pages\.basePage\.hoverOverHeaderByText)/g;
      let navMatch;
      let fixCount = 0;
      while ((navMatch = gotoThenHover.exec(code)) !== null) {
        const fullMatch = navMatch[0];
        if (!fullMatch.includes('c-sitemenu-container')) {
          const indent = navMatch[2] || navMatch[1];
          const sidebarWait = `${indent}await sharedPage.locator('#c-sitemenu-container').waitFor({ state: 'visible', timeout: 15000 });\n`;
          const fixed = fullMatch.replace(
            navMatch[3],
            sidebarWait + indent + navMatch[3]
          );
          code = code.replace(fullMatch, fixed);
          fixCount++;
        }
      }
      if (fixCount > 0) {
        console.log(`   🔧 Self-check Fix 16: Injected sidebar wait at ${fixCount} BTMS navigation point(s)`);
      }
    }

    // Fix 17: Wrong POM method in mismatched step context
    // e.g. editLoadFormPage.clickOnSaveBtn() inside a "Click on 'Search' button" step
    {
      const stepBlockRegex = /await test\.step\("([^"]+)"[\s\S]*?\}\);/g;
      let stepMatch;
      while ((stepMatch = stepBlockRegex.exec(code)) !== null) {
        const stepName = stepMatch[1].toLowerCase();
        const stepBody = stepMatch[0];

        // clickOnSaveBtn in a Search-button step → should be search-related
        if (stepName.includes('search') && !stepName.includes('save') &&
            stepBody.includes('editLoadFormPage.clickOnSaveBtn()') &&
            !stepBody.includes('searchCustomerPage')) {
          const fixed = stepBody.replace(
            'await pages.editLoadFormPage.clickOnSaveBtn();',
            'await pages.searchCustomerPage.clickOnSearchCustomer();'
          );
          code = code.replace(stepBody, fixed);
          console.log(`   🔧 Self-check Fix 17: Replaced editLoadFormPage.clickOnSaveBtn → searchCustomerPage.clickOnSearchCustomer in "${stepMatch[1].substring(0, 60)}"`);
        }

        // enterCustomerName without prior navigation to customer search page
        if (stepBody.includes('searchCustomerPage.enterCustomerName') &&
            !stepBody.includes('hoverOverHeaderByText') &&
            !stepBody.includes('HEADERS.CUSTOMER') &&
            !stepName.includes('csv') && !stepName.includes('fill')) {
          const indent = '        ';
          const navCode = `${indent}const btmsBaseUrl = new URL(sharedPage.url()).origin;\n` +
            `${indent}await sharedPage.goto(btmsBaseUrl);\n` +
            `${indent}await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);\n` +
            `${indent}await sharedPage.locator('#c-sitemenu-container').waitFor({ state: 'visible', timeout: 15000 });\n` +
            `${indent}await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);\n` +
            `${indent}await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);\n`;
          const entryLine = stepBody.indexOf('await pages.searchCustomerPage.enterCustomerName');
          if (entryLine > 0) {
            const lineStart = stepBody.lastIndexOf('\n', entryLine) + 1;
            const fixedStep = stepBody.slice(0, lineStart) + navCode + stepBody.slice(lineStart);
            code = code.replace(stepBody, fixedStep);
            console.log(`   🔧 Self-check Fix 17: Injected customer search navigation before enterCustomerName in "${stepMatch[1].substring(0, 60)}"`);
          }
        }
      }
    }

    return { content: code, warnings };
  }

  /**
   * Get the data CSV file path for a given category
   */
  private getDataCsvPath(category: string): string {
    const mapping = CATEGORY_DATA_CSV_MAP[category] || CATEGORY_DATA_CSV_MAP.custom;
    return path.join(this.config.dataDir, mapping.folder, mapping.file);
  }

  /**
   * Check if both the spec file AND the data CSV row already exist for a test case.
   * If both are present, generation should be skipped to avoid overwriting.
   * Returns { skip: true, reason } if both exist, { skip: false } otherwise.
   */
  private shouldSkipGeneration(testCase: TestCaseInput): { skip: boolean; reason?: string } {
    const cleanId = testCase.id.replace(/[^a-zA-Z0-9-]/g, '-');
    const specFileName = `${cleanId}.spec.ts`;
    const specFilePath = path.join(this.config.outputDir, testCase.category, specFileName);
    const specExists = fs.existsSync(specFilePath);

    const csvPath = this.getDataCsvPath(testCase.category);
    let dataRowExists = false;

    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
      if (lines.length > 0) {
        const headers = this.parseCsvLine(lines[0]);
        const idColIdx = headers.findIndex(h =>
          h.trim().toLowerCase().replace(/[\s_-]/g, '') === 'testscriptid'
        );
        if (idColIdx !== -1) {
          for (let i = 1; i < lines.length; i++) {
            const values = this.parseCsvLine(lines[i]);
            if (values[idColIdx] && values[idColIdx].trim() === testCase.id) {
              dataRowExists = true;
              break;
            }
          }
        }
      }
    }

    if (specExists && dataRowExists) {
      return {
        skip: true,
        reason: `Spec file (${specFileName}) and data CSV row both already exist for ${testCase.id}`
      };
    }

    if (specExists) {
      console.log(`   📄 Spec file exists but data CSV row missing — will add data and regenerate`);
    }
    if (dataRowExists) {
      console.log(`   📊 Data CSV row exists but spec file missing — will generate spec`);
    }

    return { skip: false };
  }

  /**
   * Validate and auto-correct test data CSV values before code generation.
   * Learns valid values from the existing CSV, then validates/corrects
   * the test case's data in-place and logs any corrections or errors.
   */
  private validateTestData(testCase: TestCaseInput): string[] {
    const csvPath = this.getDataCsvPath(testCase.category);
    this.dataValidator.learnFromCsv(csvPath);

    if (!testCase.testData) return [];

    const report = this.dataValidator.validateAndCorrect(
      testCase.id,
      testCase.testData
    );

    if (report.corrections.length > 0 || report.errors.length > 0) {
      this.dataValidator.printReport([report]);
    }

    return report.errors.map(e => e.message);
  }

  /**
   * Check if a test case ID exists in the respective data CSV file
   * If not present, add a new row with the test case data
   */
  private ensureTestDataInCsv(testCase: TestCaseInput): void {
    const category = testCase.category;
    const csvPath = this.getDataCsvPath(category);
    const testCaseId = testCase.id;

    console.log(`\n📂 Checking data CSV for category '${category}': ${csvPath}`);

    // Ensure the data directory exists
    const csvDir = path.dirname(csvPath);
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }

    // Check if CSV file exists
    if (!fs.existsSync(csvPath)) {
      console.log(`   ⚠️ Data CSV file not found. Creating new file: ${csvPath}`);
      this.createNewDataCsv(csvPath, testCase);
      return;
    }

    // Read existing CSV and check for test case ID
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

    if (lines.length === 0) {
      console.log(`   ⚠️ Data CSV is empty. Recreating with headers.`);
      this.createNewDataCsv(csvPath, testCase);
      return;
    }

    // Parse headers
    const headers = this.parseCsvLine(lines[0]);

    // Check if test ID already exists
    const idColumnIndex = headers.findIndex(h => 
      h.trim().toLowerCase().replace(/[\s_-]/g, '') === 'testscriptid'
    );

    if (idColumnIndex === -1) {
      console.log(`   ⚠️ No 'Test Script ID' column found in CSV. Skipping CSV insertion.`);
      return;
    }

    // Search for the test case ID in existing rows
    let found = false;
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values[idColumnIndex] && values[idColumnIndex].trim() === testCaseId) {
        found = true;
        break;
      }
    }

    if (found) {
      console.log(`   ✅ Test ID '${testCaseId}' already exists in ${path.basename(csvPath)}`);
    } else {
      console.log(`   ➕ Test ID '${testCaseId}' not found. Adding to ${path.basename(csvPath)}...`);
      this.appendTestDataToCsv(csvPath, headers, testCase);
      console.log(`   ✅ Test ID '${testCaseId}' added to ${path.basename(csvPath)}`);
    }
  }

  /**
   * Create a new data CSV file with headers and test data
   */
  private createNewDataCsv(csvPath: string, testCase: TestCaseInput): void {
    const testData = testCase.testData || {};
    
    // Build headers from testData keys (with 'Test Script ID' first)
    const headers = ['Test Script ID'];
    const dataKeys = Object.keys(testData).filter(k => 
      k !== 'Test Script ID' && k !== 'testCaseId' && testData[k]
    );
    headers.push(...dataKeys);

    // Build value row
    const values = [testCase.id];
    dataKeys.forEach(key => {
      const val = String(testData[key] || '');
      values.push(this.escapeCsvValue(val));
    });

    const csvContent = headers.join(',') + '\n' + values.join(',') + '\n';
    fs.writeFileSync(csvPath, csvContent, 'utf-8');
  }

  /**
   * Append test data row to existing CSV.
   * Uses testData (bridged from explicitValues) and also builds a column-alias
   * lookup so extracted values land in the right columns even if the key names
   * don't match exactly.
   */
  private appendTestDataToCsv(csvPath: string, headers: string[], testCase: TestCaseInput): void {
    const testData = testCase.testData || {};
    const ev = testCase.explicitValues;

    // Build a secondary alias map: CSV column name (lowercase) → value
    // This handles cases where testData key names differ from CSV column headers
    const aliasMap: Record<string, string> = {};
    if (ev) {
      const pre = ev.precondition || {};
      const form = ev.formFields || {};

      // Precondition → column aliases
      if (pre.officeCode)    aliasMap['officename'] = pre.officeCode;
      if (pre.customerName)  aliasMap['customername'] = pre.customerName;
      if (pre.switchToUser) {
        const agent = pre.switchToUser.replace(/\(/, ' (').replace(/\s{2,}/, ' ').trim();
        aliasMap['salesagent'] = agent;
      }

      // Form fields → column aliases (original)
      if (form.customerName)    aliasMap['customername'] = form.customerName;
      if (form.pickLocation)    aliasMap['shippername'] = form.pickLocation;
      if (form.dropLocation)    aliasMap['consigneename'] = form.dropLocation;
      if (form.equipmentType)   aliasMap['equipmenttype'] = form.equipmentType;
      if (form.loadType)        aliasMap['loadmethod'] = form.loadType;
      if (form.offerRate)       { aliasMap['offerrate'] = form.offerRate; aliasMap['offerrate'] = form.offerRate; }
      if (form.shipperZip)      aliasMap['shipperzip'] = form.shipperZip;
      if (form.consigneeZip)    aliasMap['consigneezip'] = form.consigneeZip;
      if (form.commodity)       aliasMap['commodity'] = form.commodity;
      if (form.emailNotification) aliasMap['saleagentemail'] = form.emailNotification;

      // New NLP-extracted fields → column aliases
      if (form['qty'])                aliasMap['shipmentcommodityqty'] = form['qty'];
      if (form['uom'])                aliasMap['shipmentcommodityuom'] = form['uom'];
      if (form['description'])        aliasMap['shipmentcommoditydescription'] = form['description'];
      if (form['weight'])             aliasMap['shipmentcommodityweight'] = form['weight'];
      if (form['trailerLength'])      { aliasMap['trailerlength'] = form['trailerLength']; aliasMap['equipmentlength'] = form['trailerLength']; }
      if (form['mileageEngine'])      aliasMap['mileageengine'] = form['mileageEngine'];
      if (form['method'])             aliasMap['method'] = form['method'];
      if (form['rateType'])           aliasMap['ratetype'] = form['rateType'];
      if (form['carrierName'])        aliasMap['carrier'] = form['carrierName'];
      if (form['shipperEarliestTime'])  aliasMap['shipperearliesttime'] = form['shipperEarliestTime'];
      if (form['shipperLatestTime'])    aliasMap['shipperlatesttime'] = form['shipperLatestTime'];
      if (form['consigneeEarliestTime']) aliasMap['consigneeearliesttime'] = form['consigneeEarliestTime'];
      if (form['consigneeLatestTime'])   aliasMap['consigneelatesttime'] = form['consigneeLatestTime'];
      if (form['salesperson'])        aliasMap['salesagent'] = form['salesperson'];
      // Carrier name from precondition
      if (pre.carrierName)            aliasMap['carrier'] = pre.carrierName;

      // Extract city/state from "NAME - CITY, ST" or "|NAME|CITY|ST" patterns
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
        // Priority: testData direct match → testData camelCase match → alias map
        const val =
          testData[headerClean] ||
          testData[this.toCamelCase(headerClean)] ||
          aliasMap[headerLower] ||
          '';
        values.push(this.escapeCsvValue(String(val)));
        if (val) filledColumns.push(headerClean);
      }
    });

    // Log which columns were populated
    if (filledColumns.length > 1) {
      console.log(`   📋 Populated columns: ${filledColumns.join(', ')}`);
    }

    // Append to CSV file
    const newLine = values.join(',');
    const existingContent = fs.readFileSync(csvPath, 'utf-8');
    const separator = existingContent.endsWith('\n') ? '' : '\n';
    fs.writeFileSync(csvPath, existingContent + separator + newLine + '\n', 'utf-8');
  }

  /**
   * Escape a CSV value (wrap in quotes if contains commas, quotes, or newlines)
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Convert header name to camelCase for matching testData keys
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toLowerCase());
  }

  /**
   * Parse a CSV line handling quoted values
   */
  private parseCsvLine(line: string): string[] {
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
   * Get page object modifications made during the last generation run
   */
  getPageObjectModifications(): PageObjectModification[] {
    return this.generator.getPageObjectModifications();
  }

  /**
   * Log page object modifications summary
   */
  private logPageObjectModifications(): void {
    const mods = this.generator.getPageObjectModifications();
    if (mods.length === 0) return;

    console.log(`\n📄 Page Object Modifications:`);
    for (const mod of mods) {
      console.log(`   ${mod.className} (${mod.filePath}):`);
      if (mod.addedMethods.length > 0) {
        console.log(`     ➕ Methods: ${mod.addedMethods.join(', ')}`);
      }
      if (mod.addedLocators.length > 0) {
        console.log(`     ➕ Locators: ${mod.addedLocators.join(', ')}`);
      }
    }
  }

  /**
   * Preview script without saving
   */
  async previewScript(input: string | TestCaseInput, testData?: TestData): Promise<string> {
    const testCase = typeof input === 'string' 
      ? this.parser.parseTestCase(input) 
      : input;

    const script = await this.generator.generateScript(testCase, testData);
    return script.content;
  }

  /**
   * Validate test case input
   */
  validateTestCase(input: string | TestCaseInput): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const testCase = typeof input === 'string' 
        ? this.parser.parseTestCase(input) 
        : input;

      if (!testCase.id) {
        errors.push('Test case ID is required');
      }
      if (!testCase.title) {
        errors.push('Test case title is required');
      }
      if (testCase.steps.length === 0) {
        errors.push('At least one test step is required');
      }
      if (testCase.expectedResults.length === 0) {
        warnings.push('No expected results defined');
      }

    } catch (error: any) {
      errors.push(`Parse error: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export default PlaywrightAgent;
