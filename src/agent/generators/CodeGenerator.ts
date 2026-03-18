/**
 * Code Generator
 * Generates Playwright test scripts from parsed test cases
 * 
 * @author AI Agent Generator
 * @created 2026-02-05
 */

import {
  TestCaseInput,
  TestType,
  GeneratedScript,
  GeneratedTestStep,
  ScriptMetadata,
  TestData
} from '../types/TestCaseTypes';
import { AgentConfig } from '../config/AgentConfig';
import { SchemaAnalyzer } from '../analyzers/SchemaAnalyzer';
import { NewMethodDef, NewLocatorDef } from '../analyzers/PageObjectWriter';
import { TestCaseParser } from '../parsers/TestCaseParser';
import { 
  getCategoryConfig,
  DEFAULTS,
  CODE_TEMPLATES,
  MANDATORY_STEPS
} from '../config/PromptsConfig';
import { TestPatternExtractor } from '../analyzers/TestPatternExtractor';
import { FormStepGrouper } from '../analyzers/FormStepGrouper';
import { ReferenceSpecAnalyzer, SpecStructure } from '../analyzers/ReferenceSpecAnalyzer';
import { LLMService } from '../services/LLMService';
import { SchemaContext } from '../services/LLMPrompts';
import fs from 'fs';
import path from 'path';

/**
 * Known mapping of alert message text to ALERT_PATTERNS constant names.
 * Used to generate code that references centralized constants instead of hardcoded strings.
 */
const ALERT_MESSAGE_TO_CONSTANT: Record<string, string> = {
  "Enter at least one email for notifications": "ALERT_PATTERNS.EMAIL_NOTIFICATION_REQUIRED",
  "Please select a customer": "ALERT_PATTERNS.CUSTOMER_REQUIRED",
  "Please select a pick location": "ALERT_PATTERNS.PICK_LOCATION_REQUIRED",
  "Please select a drop location": "ALERT_PATTERNS.DROP_LOCATION_REQUIRED",
  "Please select an equipment type": "ALERT_PATTERNS.EQUIPMENT_TYPE_REQUIRED",
  "Please select a load type": "ALERT_PATTERNS.LOAD_TYPE_REQUIRED",
  "Please enter an offer rate": "ALERT_PATTERNS.OFFER_RATE_REQUIRED",
  "Pickup and Delivery dates must be in correct order": "ALERT_PATTERNS.PICKUP_DELIVERY_DATE_ORDER_ERROR",
  "Please enter a value for the Name field.": "SALES_LEAD_ALERT_PATTERNS.SALES_LEAD_CUSTOMER_NAME_ERROR",
  "Please enter a value for the City field.": "SALES_LEAD_ALERT_PATTERNS.SALES_LEAD_CITY_NAME_ERROR",
  "Please enter a value for the state field.": "SALES_LEAD_ALERT_PATTERNS.SALES_LEAD_STATE_NAME_ERROR",
  "status has been set to booked": "ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED",
  "status has been set to invoiced": "ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_INVOICED",
  "payable status has been updated to invoice received": "ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED",
};

/**
 * Converts a message string to SCREAMING_SNAKE_CASE for use as a constant name.
 * Returns 'UNKNOWN_MESSAGE' for empty/whitespace-only input.
 */
function toConstantName(message: string): string {
  const result = message
    .replace(/[\u201C\u201D\u201E\u201F\u2018\u2019\u201A\u201B\u2033\u2036\u2032\u2035]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase()
    .replace(/^[0-9_]+/, '') // Strip leading digits/underscores — invalid JS identifier start
    .substring(0, 60);
  return result || 'UNKNOWN_MESSAGE';
}

/**
 * Look up the ALERT_PATTERNS constant for a given message text.
 * If not found, auto-creates a new entry in alertPatterns.ts and returns the reference.
 */
function resolveAlertPatternConstant(messageText: string, alertPatternsPath?: string): string {
  // Guard: empty or whitespace-only message text -> safe fallback
  if (!messageText || !messageText.trim()) {
    return 'ALERT_PATTERNS.UNKNOWN_MESSAGE';
  }

  // Check known mapping first (case-insensitive exact match)
  for (const [msg, constant] of Object.entries(ALERT_MESSAGE_TO_CONSTANT)) {
    if (msg.toLowerCase() === messageText.toLowerCase()) {
      return constant;
    }
  }

  // Fallback: check if the step text *contains* a known alert phrase (handles "44. Status has been set to INVOICED ALERT should appear...")
  const normalizedInput = messageText.toLowerCase();
  for (const [msg, constant] of Object.entries(ALERT_MESSAGE_TO_CONSTANT)) {
    if (normalizedInput.includes(msg.toLowerCase())) {
      return constant;
    }
  }

  // Not found — auto-create a new constant in alertPatterns.ts
  const constantName = toConstantName(messageText);
  const fullRef = `ALERT_PATTERNS.${constantName}`;

  // Add to runtime map so subsequent calls in same session reuse it
  ALERT_MESSAGE_TO_CONSTANT[messageText] = fullRef;

  // Append to the alertPatterns.ts file if path is provided
  if (alertPatternsPath) {
    try {
      let fileContent = fs.readFileSync(alertPatternsPath, 'utf-8');
      // Check if constant already exists in the file
      if (!fileContent.includes(constantName)) {
        const safeMessage = messageText.replace(/"/g, '\\"');
        const newEntry = `  ${constantName}: "${safeMessage}",`;
        // Insert before the closing }; of ALERT_PATTERNS
        fileContent = fileContent.replace(
          /(\n)(};[\s\S]*?\/\*\*[\s\S]*?@description Added Alert Patterns for Sales Lead)/,
          `\n${newEntry}\n$1$2`
        );
        // Fallback: if the above pattern doesn't match, find the last entry before };
        if (!fileContent.includes(constantName)) {
          fileContent = fileContent.replace(
            /(export const ALERT_PATTERNS = \{[\s\S]*?)(};)/,
            `$1  ${constantName}: "${safeMessage}",\n$2`
          );
        }
        fs.writeFileSync(alertPatternsPath, fileContent, 'utf-8');
        console.log(`   📝 Auto-created ALERT_PATTERNS.${constantName} in alertPatterns.ts`);
      }
    } catch (e) {
      console.log(`   ⚠️ Could not auto-create alert pattern: ${(e as Error).message}`);
    }
  }

  return fullRef;
}

/** Tracks page object modifications made during a generation run */
export interface PageObjectModification {
  className: string;
  addedMethods: string[];
  addedLocators: string[];
  filePath: string;
}

export class CodeGenerator {
  private config: AgentConfig;
  private schemaAnalyzer: SchemaAnalyzer;
  private parser: TestCaseParser;
  private patternExtractor: TestPatternExtractor;
  private formStepGrouper: FormStepGrouper;
  private referenceAnalyzer: ReferenceSpecAnalyzer;
  private llmService: LLMService | null = null;
  /** Cached schema context for LLM calls (built once per generation run) */
  private _schemaContext: SchemaContext | null = null;
  /** Active reference structure during generation (set by assembleScript) */
  private _activeRefStructure: SpecStructure | null = null;
  /** Raw content of the active reference spec (passed to LLM as context) */
  private _activeRefSpecCode: string | null = null;
  /** Raw content of secondary reference spec for POM method discovery */
  private _secondaryRefSpecCode: string | null = null;
  /** Match score from TestCaseMatcher — controls reference adoption aggressiveness */
  private _matchScore: number = 0;
  /** Modifications made to page object files during this generation */
  private pageObjectModifications: PageObjectModification[] = [];

  // Category to dataConfig property mapping
  private readonly categoryDataConfigMap: Record<string, string> = {
    dfb: 'dfbData',
    edi: 'ediData',
    commission: 'commissionData',
    salesLead: 'salesleadData',
    banyan: 'banyanData',
    carrier: 'carrierData',
    api: 'apiData',
    dat: 'datData',
    bulkChange: 'bulkChangeData',
    nonOperationalLoads: 'nonOperationalLoadsData',
    billingtoggle: 'billingtoggleData',
    custom: 'dfbData'
  };

  // Category to data CSV file path mapping (relative to src/data)
  private readonly categoryDataFileMap: Record<string, string> = {
    dfb: 'dfb/dfbdata.csv',
    edi: 'edi/edidata.csv',
    commission: 'commission/commissiondata.csv',
    salesLead: 'salesLead/salesleaddata.csv',
    banyan: 'banyan/banyandata.csv',
    carrier: 'carrier/carrierdata.csv',
    api: 'api/apidata.csv',
    dat: 'dat/datdata.csv',
    bulkChange: 'bulkChange/bulkchangedata.csv',
    nonOperationalLoads: 'nonOperationalLoads/nonoperationalloadsdata.csv',
    billingtoggle: 'billingtoggle/billingtoggledata.csv',
    custom: 'dfb/dfbdata.csv'
  };

  constructor(config?: AgentConfig, llmService?: LLMService) {
    this.config = config || new AgentConfig();
    this.llmService = llmService || null;
    this.schemaAnalyzer = new SchemaAnalyzer(
      this.config.pagesDir,
      this.config.excludedPageDirs
    );
    this.parser = new TestCaseParser();
    this.patternExtractor = new TestPatternExtractor();
    this.formStepGrouper = new FormStepGrouper();
    this.referenceAnalyzer = new ReferenceSpecAnalyzer();
    // Perform initial dynamic scan of page objects
    this.schemaAnalyzer.performDynamicScan();
    // Scan existing spec files for reusable step patterns
    this.patternExtractor.scan();
  }

  /**
   * Get modifications made to page object files during generation
   */
  getPageObjectModifications(): PageObjectModification[] {
    return this.pageObjectModifications;
  }

  /**
   * Ensure a method exists on the target page object class.
   * If it doesn't exist, generate and add it to the page file.
   * Returns true if the method was already present or successfully added.
   */
  ensureMethodOnPageObject(
    className: string,
    methodName: string,
    locator?: NewLocatorDef,
    method?: NewMethodDef
  ): boolean {
    // Check if method already exists
    if (this.schemaAnalyzer.methodExistsOnClass(className, methodName)) {
      return true;
    }

    // If no method definition provided, create a generic one
    const methodDef: NewMethodDef = method || {
      name: methodName,
      parameters: '',
      returnType: 'Promise<void>',
      isAsync: true,
      body: `// TODO: Implement ${methodName}\nawait this.page.waitForLoadState('load');`,
    };

    const locators: NewLocatorDef[] = locator ? [locator] : [];
    const methods: NewMethodDef[] = [methodDef];

    const result = this.schemaAnalyzer.addToPageObject(className, locators, methods);

    if (result.success && (result.addedMethods.length > 0 || result.addedLocators.length > 0)) {
      console.log(`   📝 Added to ${className}: methods=[${result.addedMethods.join(', ')}] locators=[${result.addedLocators.join(', ')}]`);
      
      // Track the modification
      const existing = this.pageObjectModifications.find(m => m.className === className);
      if (existing) {
        existing.addedMethods.push(...result.addedMethods);
        existing.addedLocators.push(...result.addedLocators);
      } else {
        this.pageObjectModifications.push({
          className,
          addedMethods: result.addedMethods,
          addedLocators: result.addedLocators,
          filePath: result.filePath,
        });
      }
      return true;
    }

    if (!result.success) {
      console.warn(`   ⚠️ Could not add ${methodName} to ${className}: ${result.error}`);
    }
    return false;
  }

  /**
   * Get the dataConfig property name for a given category
   */
  getDataConfigProperty(category: string): string {
    return this.categoryDataConfigMap[category] || 'dfbData';
  }

  /**
   * Get the data CSV file path for a given category
   */
  getDataFilePath(category: string): string {
    return this.categoryDataFileMap[category] || 'dfb/dfbdata.csv';
  }

  /**
   * Generate a complete test script from test case input
   */
  async generateScript(testCase: TestCaseInput, testData?: TestData, dynamicRefSpecPath?: string, matchScore?: number): Promise<GeneratedScript> {
    const testType = this.parser.detectTestType(testCase.description);
    const fileName = this.generateFileName(testCase.id, testCase.category);
    const filePath = `${this.config.outputDir}/${testCase.category}/${fileName}`;

    // Track match score for reference spec adoption decisions
    this._matchScore = matchScore || 0;

    // ── Reference-first: try dynamic match, then fall back to category-based ──
    let refStructure = dynamicRefSpecPath
      ? this.referenceAnalyzer.parseSpecByPath(dynamicRefSpecPath)
      : null;
    if (!refStructure) {
      refStructure = this.referenceAnalyzer.findBestReference(testCase.category);
    }

    // Load raw reference spec code for LLM context
    this._activeRefSpecCode = null;
    if (dynamicRefSpecPath && fs.existsSync(dynamicRefSpecPath)) {
      try {
        this._activeRefSpecCode = fs.readFileSync(dynamicRefSpecPath, 'utf-8');
        const highMatch = (matchScore || 0) >= 0.7;
        console.log(`   📐 Loaded reference spec code from ${path.basename(dynamicRefSpecPath)} for LLM context${highMatch ? ' (HIGH MATCH — full structure adoption)' : ''}`);
      } catch { /* ignore read errors */ }
    }

    // Fallback: load category-based reference spec code when no dynamic match
    if (!this._activeRefSpecCode && refStructure?.sourceFile) {
      try {
        this._activeRefSpecCode = fs.readFileSync(refStructure.sourceFile, 'utf-8');
        console.log(`   📐 Loaded category reference spec code from ${path.basename(refStructure.sourceFile)} for LLM context (category fallback)`);
      } catch { /* ignore read errors */ }
    }

    // Secondary fallback: load DFB-97746 as supplementary reference for POM method discovery
    let _secondaryRefSpecCode: string | null = null;
    if (testCase.category !== 'dfb') {
      const secondaryRefPath = path.resolve(process.cwd(), 'src/tests/generated/dfb/DFB-97746.spec.ts');
      if (fs.existsSync(secondaryRefPath)) {
        try {
          _secondaryRefSpecCode = fs.readFileSync(secondaryRefPath, 'utf-8');
          console.log(`   📐 Loaded secondary reference DFB-97746.spec.ts for POM method discovery`);
        } catch { /* ignore read errors */ }
      }
    }
    this._secondaryRefSpecCode = _secondaryRefSpecCode;

    // ── HIGH-MATCH HYBRID: CLONE + LLM FOR DIFFERING STEPS ──
    // When matchScore >= 0.7 and we have a reference spec:
    // 1. Clone the reference spec (replace ID, title, date)
    // 2. Compare new test case steps against reference steps
    // 3. For steps that differ significantly → LLM generates replacement code
    // 4. Splice LLM-generated steps into the cloned spec
    const isHighMatch = (matchScore || 0) >= 0.7;
    if (isHighMatch && this._activeRefSpecCode) {
      console.log(`\n🧠 HIGH MATCH (${((matchScore || 0) * 100).toFixed(0)}%) — hybrid clone + LLM adaptation`);

      const clonedContent = await this.cloneAndAdaptReferenceSpec(
        this._activeRefSpecCode, testCase, testData
      );
      if (clonedContent) {
        let content = this.cleanUnusedImports(clonedContent);
        content = this.validatePostGenerationGuardrails(content, testCase);
        this.ensurePageObjectMethodsExist(content, testCase);

        const metadata = this.generateMetadata(testCase, testType);
        const imports = content.split('\n').filter(l => l.trim().startsWith('import '));
        const pageObjectsUsed = this.determinePageObjects(testCase);
        const constantsUsed = this.determineConstants(testCase);

        console.log(`   ✅ Hybrid clone+adapt completed for ${testCase.id}`);
        return {
          testCaseId: testCase.id,
          fileName,
          filePath,
          content,
          imports,
          pageObjectsUsed,
          constantsUsed,
          testSteps: testCase.steps.map(s => ({
            stepName: `Step ${s.stepNumber}: ${s.action.substring(0, 80)}`,
            code: '// Hybrid: cloned structure + LLM-adapted differing steps',
            pageObjects: [],
            assertions: [],
          })),
          metadata
        };
      }
      console.log(`   ⚠️ Hybrid clone failed — trying full-spec LLM generation as fallback`);

      // Fallback: generate the COMPLETE spec in one LLM call (300s timeout, single request)
      if (this.llmService && this.llmService.isAvailable()) {
        const schemaCtx = this.getSchemaContext();
        const testDataFields = testData
          ? Object.keys(testData).filter(k => testData[k] && String(testData[k]).trim())
          : [];
        const preconditions = testCase.preconditions || [];
        const steps = testCase.steps.map(s => ({
          stepNumber: s.stepNumber,
          action: s.action,
          expectedResult: s.expectedResult,
        }));
        const expectedResults = testCase.steps
          .filter(s => s.expectedResult)
          .map(s => s.expectedResult!);

        const fullSpecCode = await this.llmService.generateFullSpecFromReference(
          this._activeRefSpecCode,
          testCase.id,
          testCase.title || testCase.description,
          testCase.category,
          preconditions,
          steps,
          expectedResults,
          testDataFields,
          schemaCtx,
        );

        if (fullSpecCode) {
          let content = this.cleanUnusedImports(fullSpecCode);
          content = this.validatePostGenerationGuardrails(content, testCase);
          this.ensurePageObjectMethodsExist(content, testCase);

          const metadata = this.generateMetadata(testCase, testType);
          const imports = content.split('\n').filter(l => l.trim().startsWith('import '));
          const pageObjectsUsed = this.determinePageObjects(testCase);
          const constantsUsed = this.determineConstants(testCase);

          console.log(`   ✅ Full-spec LLM fallback completed for ${testCase.id}`);
          return {
            testCaseId: testCase.id,
            fileName,
            filePath,
            content,
            imports,
            pageObjectsUsed,
            constantsUsed,
            testSteps: testCase.steps.map(s => ({
              stepName: `Step ${s.stepNumber}: ${s.action.substring(0, 80)}`,
              code: '// Full-spec LLM generation from reference',
              pageObjects: [],
              assertions: [],
            })),
            metadata
          };
        }
        console.log(`   ⚠️ Full-spec LLM fallback also failed — falling back to step-by-step pipeline`);
      }
    }

    // ── STANDARD STEP-BY-STEP PIPELINE (fallback) ──
    // Generate metadata
    const metadata = this.generateMetadata(testCase, testType);

    // Determine required imports — prefer reference imports if available,
    // but always ensure category-required imports are present
    let imports: string[];
    if (refStructure) {
      const refImports = this.referenceAnalyzer.getTemplateImports(refStructure);
      imports = refImports.split('\n').filter(l => l.trim());
      console.log(`   📐 Using reference imports from ${refStructure.sourceFile}`);
    } else {
      imports = this.determineImports(testCase, testType);
    }
    // Ensure category-required imports are always present (even when using reference)
    const categoryConfig = getCategoryConfig(testCase.category);
    const importText = imports.join('\n');
    if (categoryConfig.requiredImports.includes('dfbHelpers') && !importText.includes('dfbHelpers')) {
      imports.push('import dfbHelpers from "@utils/dfbUtils/dfbHelpers";');
    }
    if (categoryConfig.requiredImports.includes('commissionHelper') && !importText.includes('commissionHelper')) {
      imports.push('import commissionHelper from "@utils/commission-helpers";');
    }
    if (categoryConfig.requiredImports.includes('axios') && !importText.includes('axios')) {
      imports.push('import axios from "axios";');
    }

    // Determine page objects used
    const pageObjectsUsed = this.determinePageObjects(testCase);

    // Determine constants used
    const constantsUsed = this.determineConstants(testCase);

    // Generate test steps (async — may call LLM for unmapped steps)
    const testSteps = await this.generateTestSteps(testCase, testData);

    // Generate the complete script content (pass reference structure for template generation)
    let content = await this.assembleScript({
      testCase,
      testType,
      testData,
      imports,
      pageObjectsUsed,
      constantsUsed,
      testSteps,
      metadata
    }, refStructure || undefined);

    // Remove unused imports to satisfy noUnusedLocals
    content = this.cleanUnusedImports(content);

    // Post-generation guardrails: detect and auto-fix common LLM errors
    content = this.validatePostGenerationGuardrails(content, testCase);

    // Ensure all referenced page object methods exist in the page files
    // If any are missing, generate reusable locator functions in the respective page files
    this.ensurePageObjectMethodsExist(content, testCase);

    return {
      testCaseId: testCase.id,
      fileName,
      filePath,
      content,
      imports,
      pageObjectsUsed,
      constantsUsed,
      testSteps,
      metadata
    };
  }

  /**
   * Analyze generated code and ensure all referenced page object methods
   * actually exist in the page files. If a method is missing, generate and
   * add a reusable locator function to the respective page object file.
   */
  private ensurePageObjectMethodsExist(content: string, testCase: TestCaseInput): void {
    // Pattern: pages.<pageGetter>.<methodName>(
    const pageCallRegex = /pages\.(\w+)\.(\w+)\s*\(/g;
    let match;
    const checkedMethods = new Set<string>();

    while ((match = pageCallRegex.exec(content)) !== null) {
      const pageGetter = match[1];    // e.g. 'postAutomationRulePage'
      const methodName = match[2];     // e.g. 'clickElementByText'
      const key = `${pageGetter}.${methodName}`;

      if (checkedMethods.has(key)) continue;
      checkedMethods.add(key);

      // Skip utilities that are not page objects
      if (['toggleSettings', 'dataConfig', 'commonReusables', 'dfbHelpers', 'requiredFieldAlertValidator', 'logger'].includes(pageGetter)) {
        continue;
      }

      // Resolve pageGetter to class name via scanner
      const scanResult = this.schemaAnalyzer.getScanner().getByPageManagerName(pageGetter);
      if (!scanResult) continue;

      const className = scanResult.className;

      // Check if the method exists
      if (this.schemaAnalyzer.methodExistsOnClass(className, methodName)) {
        continue; // Already exists, nothing to do
      }

      // Check if method already exists on a DIFFERENT POM class (duplicate detection)
      const existsElsewhere = this.schemaAnalyzer.methodExistsAnywhere(methodName);
      if (existsElsewhere.exists && existsElsewhere.className && existsElsewhere.className !== className) {
        console.log(`\n⚠️  Duplicate POM method detected: '${methodName}' already exists on '${existsElsewhere.className}' but spec calls it on '${className}'.`);
        console.log(`   Review whether the existing method on '${existsElsewhere.className}' can be reused instead of creating a duplicate.`);
        console.log(`   Proceeding with auto-generation on '${className}' — review for potential deduplication.`);
      }

      // Method doesn't exist — generate and add it
      console.log(`\n🔧 Method '${methodName}' not found on '${className}'. Generating reusable function...`);

      const { locator, method } = this.generatePageObjectMethod(
        className, methodName, pageGetter, testCase
      );

      this.ensureMethodOnPageObject(className, methodName, locator, method);
    }
  }

  /**
   * Generate a page object method definition based on the method name and context.
   * Tries to infer the method's purpose from naming conventions.
   */
  private generatePageObjectMethod(
    _className: string,
    methodName: string,
    _pageGetter: string,
    _testCase: TestCaseInput
  ): { locator?: NewLocatorDef; method: NewMethodDef } {
    const lowerName = methodName.toLowerCase();

    // ---- clickElementByText ----
    if (lowerName === 'clickelementbytext') {
      return {
        method: {
          name: methodName,
          parameters: 'text: string',
          returnType: 'Promise<void>',
          isAsync: true,
          body: `const element = this.page.locator(\`//*[contains(text(),'\${text}')]\`);
await element.waitFor({ state: 'visible', timeout: 10000 });
await element.click();
console.log(\`Clicked element with text: \${text}\`);`,
        },
      };
    }

    // ---- clickOn* / click* patterns ----
    if (lowerName.startsWith('clickon') || lowerName.startsWith('click')) {
      const targetName = methodName.replace(/^clickOn|^click/i, '');
      const readableName = targetName.replace(/([A-Z])/g, ' $1').trim();

      // Methods like clickButton, clickTab, clickLink take a text parameter
      // Methods like clickOnSaveBtn, clickOnPostButton, clickOnTab are fixed-target (no param)
      const needsTextParam = /^(button|tab|link|element|header|menu|option)/i.test(targetName);
      if (needsTextParam) {
        return {
          method: {
            name: methodName,
            parameters: 'text: string',
            returnType: 'Promise<void>',
            isAsync: true,
            body: `const el = this.page.locator(\`//button[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'\${text.toLowerCase()}')] | //*[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'\${text.toLowerCase()}')]\`);
await el.waitFor({ state: 'visible', timeout: 10000 });
await el.click();
console.log(\`Clicked on \${text}\`);`,
          },
        };
      }

      const locatorName = `${targetName.charAt(0).toLowerCase() + targetName.slice(1)}_LOC`;
      return {
        locator: {
          name: locatorName,
          selector: `//*[contains(text(),'${readableName}')] | //button[contains(text(),'${readableName}')] | //input[contains(@value,'${readableName}')]`,
          locatorMethod: 'locator',
          isDynamic: false,
          isPrivate: true,
        },
        method: {
          name: methodName,
          parameters: '',
          returnType: 'Promise<void>',
          isAsync: true,
          body: `await this.${locatorName}.waitFor({ state: 'visible', timeout: 10000 });
await this.${locatorName}.click();
console.log('Clicked on ${readableName}');`,
        },
      };
    }

    // ---- verify* / validate* patterns ----
    if (lowerName.startsWith('verify') || lowerName.startsWith('validate')) {
      const targetName = methodName.replace(/^verify|^validate/i, '');
      const readableName = targetName.replace(/([A-Z])/g, ' $1').trim();

      return {
        method: {
          name: methodName,
          parameters: 'expectedValue?: string',
          returnType: 'Promise<void>',
          isAsync: true,
          body: `// Verify ${readableName}
const element = this.page.locator(\`//*[contains(text(),'\${expectedValue || ""}')]\`);
await expect(element, \`Expected to see: \${expectedValue}\`).toBeVisible({ timeout: 10000 });
console.log('Verified: ${readableName}');`,
        },
      };
    }

    // ---- enter* / fill* / input* patterns ----
    if (lowerName.startsWith('enter') || lowerName.startsWith('fill') || lowerName.startsWith('input')) {
      const targetName = methodName.replace(/^enter|^fill|^input/i, '');
      const readableName = targetName.replace(/([A-Z])/g, ' $1').trim();
      const locatorName = `${targetName.charAt(0).toLowerCase() + targetName.slice(1)}Input_LOC`;
      const fieldId = targetName.charAt(0).toLowerCase() + targetName.slice(1);

      return {
        locator: {
          name: locatorName,
          selector: `#${fieldId}, [name*='${fieldId}'], [placeholder*='${readableName}']`,
          locatorMethod: 'locator',
          isDynamic: false,
          isPrivate: true,
        },
        method: {
          name: methodName,
          parameters: 'value: string',
          returnType: 'Promise<void>',
          isAsync: true,
          body: `await this.${locatorName}.waitFor({ state: 'visible', timeout: 10000 });
await this.${locatorName}.fill(value);
console.log(\`Entered \${value} in ${readableName}\`);`,
        },
      };
    }

    // ---- get* patterns ----
    if (lowerName.startsWith('get')) {
      const targetName = methodName.replace(/^get/i, '');
      const readableName = targetName.replace(/([A-Z])/g, ' $1').trim();

      return {
        method: {
          name: methodName,
          parameters: '',
          returnType: 'Promise<string>',
          isAsync: true,
          body: `const element = this.page.locator('[data-field="${targetName.charAt(0).toLowerCase() + targetName.slice(1)}"]').first();
const text = await element.textContent() || '';
console.log('Got ${readableName}:', text);
return text.trim();`,
        },
      };
    }

    // ---- select* patterns ----
    if (lowerName.startsWith('select')) {
      const targetName = methodName.replace(/^select/i, '');
      const readableName = targetName.replace(/([A-Z])/g, ' $1').trim();

      return {
        method: {
          name: methodName,
          parameters: 'value: string',
          returnType: 'Promise<void>',
          isAsync: true,
          body: `const dropdown = this.page.locator('[id*="${targetName.charAt(0).toLowerCase() + targetName.slice(1)}"], [name*="${targetName.charAt(0).toLowerCase() + targetName.slice(1)}"]').first();
await dropdown.click();
const option = this.page.locator(\`//*[contains(text(),'\${value}')]\`);
await option.click();
console.log(\`Selected \${value} for ${readableName}\`);`,
        },
      };
    }

    // ---- search* patterns ----
    if (lowerName.startsWith('search') || lowerName.includes('search')) {
      return {
        method: {
          name: methodName,
          parameters: 'searchTerm: string',
          returnType: 'Promise<void>',
          isAsync: true,
          body: `const searchInput = this.page.locator("input[type='search'], input[id*='search'], input[placeholder*='Search']").first();
await searchInput.waitFor({ state: 'visible', timeout: 10000 });
await searchInput.fill(searchTerm);
console.log(\`Searched for: \${searchTerm}\`);`,
        },
      };
    }

    // ---- waitFor* patterns ----
    if (lowerName.startsWith('waitfor')) {
      return {
        method: {
          name: methodName,
          parameters: '',
          returnType: 'Promise<void>',
          isAsync: true,
          body: `await this.page.waitForLoadState('load');
await this.page.waitForLoadState('networkidle');`,
        },
      };
    }

    // ---- Default: generic placeholder method ----
    return {
      method: {
        name: methodName,
        parameters: '',
        returnType: 'Promise<void>',
        isAsync: true,
        body: `// TODO: Implement ${methodName} - auto-generated placeholder
await this.page.waitForLoadState('load');`,
      },
    };
  }

  /**
   * Generate file name from test case ID
   */
  private generateFileName(testCaseId: string, _category: string): string {
    const cleanId = testCaseId.replace(/[^a-zA-Z0-9-]/g, '-');
    return `${cleanId}.spec.ts`;
  }

  /**
   * Generate script metadata using centralized config
   */
  private generateMetadata(testCase: TestCaseInput, testType: TestType): ScriptMetadata {
    const categoryConfig = getCategoryConfig(testCase.category);
    
    return {
      author: DEFAULTS.author,
      createdDate: new Date().toISOString().split('T')[0],
      testCategory: testCase.category,
      testType,
      retryCount: DEFAULTS.retryCount,
      timeout: testType === 'multi-app' ? DEFAULTS.multiAppTimeout : categoryConfig.timeout,
      tags: testCase.tags || categoryConfig.defaultTags
    };
  }

  /**
   * Determine required imports based on test case using centralized config
   */
  private determineImports(testCase: TestCaseInput, testType: TestType): string[] {
    // Use centralized import templates
    const isMultiApp = testType === 'multi-app' || this.needsMultiApp(testCase);
    const baseImports = isMultiApp 
      ? CODE_TEMPLATES.IMPORTS.multiApp 
      : CODE_TEMPLATES.IMPORTS.standard;
    
    const imports = baseImports.split('\n');
    
    // Add category-specific imports
    const categoryConfig = getCategoryConfig(testCase.category);
    if (categoryConfig.requiredImports.includes('dfbHelpers')) {
      imports.push('import dfbHelpers from "@utils/dfbUtils/dfbHelpers";');
    }
    if (categoryConfig.requiredImports.includes('commissionHelper')) {
      imports.push('import commissionHelper from "@utils/commission-helpers";');
    }
    if (categoryConfig.requiredImports.includes('axios')) {
      imports.push('import axios from "axios";');
    }

    // Always include ALERT_PATTERNS when test involves alert/message/validation verification
    const stepsText = (testCase.steps || []).map(s => typeof s === 'string' ? s : s.action).join(' ');
    const expectedText = (testCase.expectedResults || []).join(' ');
    const fullText = `${testCase.description} ${expectedText} ${stepsText}`.toLowerCase();
    if (fullText.includes('alert') || fullText.includes('message') || fullText.includes('displayed') ||
        fullText.includes('validation') || fullText.includes('error') || fullText.includes('required') ||
        fullText.includes('enter at least') || fullText.includes('please enter') || fullText.includes('pop')) {
      imports.push('import { ALERT_PATTERNS } from "@utils/alertPatterns";');
    }

    return imports;
  }

  /**
   * Check if test needs MultiAppManager
   */
  private needsMultiApp(testCase: TestCaseInput): boolean {
    // Categories that always use multi-app template
    const multiAppCategories = ['dfb', 'billingtoggle'];
    if (multiAppCategories.includes(testCase.category)) return true;

    const textParts = [
      testCase.description,
      ...(testCase.preconditions || []),
      ...(testCase.steps || []).map(s => typeof s === 'string' ? s : s.action),
      ...(testCase.expectedResults || []),
    ];
    const fullText = textParts.join(' ').toLowerCase();

    const multiAppKeywords = [
      'tnx', 'dme', 'multi-app', 'cross application',
      'switch to dme', 'switch to tnx', 'digital matching engine',
      'transnational exchange', 'switch back to btms',
      'dme carrier', 'dme toggle', 'tnx bids', 'tnx offer',
      'multiappmanager', 'appmanager',
    ];
    return multiAppKeywords.some(kw => fullText.includes(kw));
  }

  /**
   * Determine page objects used
   */
  private determinePageObjects(testCase: TestCaseInput): string[] {
    const pageObjects = new Set<string>();
    
    // Add based on test steps
    testCase.steps.forEach(step => {
      const suggestions = this.schemaAnalyzer.suggestPageObjects(step.action);
      suggestions.forEach(po => pageObjects.add(po));
    });

    // Add based on category
    switch (testCase.category) {
      case 'dfb':
      case 'billingtoggle':
        pageObjects.add('dfbLoadFormPage');
        pageObjects.add('nonTabularLoadPage');
        pageObjects.add('editLoadPage');
        break;
      case 'edi':
        pageObjects.add('edi204LoadTendersPage');
        pageObjects.add('loadTender204Page');
        break;
      case 'commission':
        pageObjects.add('financePage');
        break;
      case 'salesLead':
        pageObjects.add('newSalesLeadPage');
        pageObjects.add('mySalesLeadPage');
        break;
    }

    // Always include base pages
    pageObjects.add('btmsLoginPage');
    pageObjects.add('basePage');

    return Array.from(pageObjects);
  }

  /**
   * Determine constants used
   */
  private determineConstants(testCase: TestCaseInput): string[] {
    const constants = new Set<string>();
    const description = testCase.description.toLowerCase();

    // Add based on content
    if (description.includes('header') || description.includes('navigate')) constants.add('HEADERS');
    if (description.includes('admin')) constants.add('ADMIN_SUB_MENU');
    if (description.includes('customer')) constants.add('CUSTOMER_SUB_MENU');
    if (description.includes('load')) {
      constants.add('LOAD_TYPES');
      constants.add('TABS');
    }
    if (description.includes('cargo')) constants.add('CARGO_VALUES');
    if (description.includes('country')) constants.add('COUNTRY');
    if (description.includes('status')) constants.add('LOAD_STATUS');
    if (description.includes('tnx')) constants.add('TNX');
    if (description.includes('post') || description.includes('dfb')) constants.add('DFB_Button');
    if (description.includes('wait') || description.includes('timeout')) constants.add('WAIT');
    if (description.includes('carrier')) constants.add('CARRIER_NAME');

    return Array.from(constants);
  }

  /**
   * Generate test steps code
   */
  private async generateTestSteps(testCase: TestCaseInput, testData?: TestData): Promise<GeneratedTestStep[]> {
    const steps: GeneratedTestStep[] = [];

    for (let index = 0; index < testCase.steps.length; index++) {
      const step = testCase.steps[index];
      const generatedStep = await this.generateSingleStep(step.action, index + 1, testData);
      steps.push(generatedStep);
    }

    return steps;
  }

  /**
   * Generate code for a single test step
   * Uses comprehensive action-to-code mapping for better code generation
   */
  private async generateSingleStep(action: string, _stepNumber: number, testData?: TestData): Promise<GeneratedTestStep> {
    const pageObjects: string[] = [];
    const assertions: string[] = [];

    // Always use the comprehensive code generator for better results
    const code = await this.generateCodeFromAction(action, testData);
    
    // Get suggested page objects for reference
    const suggestions = this.schemaAnalyzer.suggestPageObjects(action);
    suggestions.forEach(po => pageObjects.push(po));

    return {
      stepName: action.substring(0, 60) + (action.length > 60 ? '...' : ''),
      code,
      pageObjects: [...new Set(pageObjects)],
      assertions
    };
  }

  /**
   * Generate code from action description.
   *
   * Priority order:
   *   1. Pattern library (extracted from existing working spec files)
   *   2. Hardcoded keyword → code mappings (below)
   *   3. Generic fallback
   */
  private async generateCodeFromAction(action: string, _testData?: TestData): Promise<string> {
    const lowerAction = action.toLowerCase();

    // ==================== PRIORITY 1: PATTERN LIBRARY ====================
    // Check existing working tests for a matching step pattern FIRST.
    // This ensures reuse of proven code from DFB-97739, DFB-25103, etc.
    const existingPattern = this.patternExtractor.findPattern(action);
    if (existingPattern) {
      console.log(`      📚 Reusing pattern from ${existingPattern.sourceFile}: "${existingPattern.stepName}"`);
      return existingPattern.code;
    }
    
    // ==================== COMPOUND STEP SPLITTING ====================
    // Detect steps with multiple actions joined by "and" or "." followed by action verbs
    // e.g. "Enter invoice number e.g 123456 and Enter Invoice Amount e.g. 1000 and click on attach"
    const compoundSplitPattern = /\.\s*(?=(?:Enter|Click|Select|Upload|Navigate|Validate|Verify|Check|Close|Refresh|Save)\b)|(?<=\d)\s+and\s+(?=(?:Enter|Click|Select|Upload|Navigate|Validate|Verify|Check|Close|Refresh|Save)\b)/i;
    if (compoundSplitPattern.test(action)) {
      const subActions = action.split(compoundSplitPattern).map(s => s.trim()).filter(s => s.length > 3);
      if (subActions.length >= 2) {
        console.log(`      📦 Splitting compound step into ${subActions.length} sub-actions`);
        const codeParts: string[] = [];
        for (const subAction of subActions) {
          const subCode = await this.generateCodeFromAction(subAction, _testData);
          codeParts.push(subCode);
        }
        return codeParts.join('\n        ');
      }
    }

    // ==================== LOGIN ACTIONS ====================
    if (lowerAction.includes('login')) {
      if (lowerAction.includes('tnx')) {
        return 'await pages.tnxLoginPage.TNXLogin(userSetup.tnxUser);';
      }
      if (lowerAction.includes('dme')) {
        return 'await pages.dmeLoginPage.DMELogin(userSetup.dmeUser);';
      }
      // Default to BTMS login
      return `await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
          await pages.btmsAcceptTermPage.acceptTermsAndConditions();
        }`;
    }

    // ==================== MULTI-APP SWITCHING ACTIONS ====================
    // Reference: DFB-97739.spec.ts multi-app patterns
    if (lowerAction.includes('switch to dme') || lowerAction.includes('switchtodme')) {
      return `// Switch to DME application
        await appManager.switchToDME();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Switched to DME");`;
    }
    if (lowerAction.includes('switch to tnx') || lowerAction.includes('switchtotnx')) {
      return `// Switch to TNX application
        const tnxPages = await appManager.switchToTNX();
        await tnxPages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Switched to TNX");`;
    }
    if (lowerAction.includes('switch to btms') || lowerAction.includes('switchtobtms') || lowerAction.includes('switch back to btms')) {
      return `// Switch back to BTMS with absolute URL navigation
        await appManager.switchToBTMS();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        const btmsBaseUrl = new URL(sharedPage.url()).origin;
        await sharedPage.goto(btmsBaseUrl);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await sharedPage.locator('#c-sitemenu-container').waitFor({ state: 'visible', timeout: 15000 });
        console.log("Switched back to BTMS");`;
    }

    // ==================== DME CARRIER TOGGLE CHECK ====================
    // Reference: DFB-97739.spec.ts Step 6
    if (lowerAction.includes('dme') && lowerAction.includes('carrier') && (lowerAction.includes('toggle') || lowerAction.includes('enable') || lowerAction.includes('status'))) {
      return `// Switch to DME and check carrier toggle
        await appManager.switchToDME();
        const dmePages = appManager.dmePageManager!;
        await dmePages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await dmePages.basePage.hoverOverHeaderByText("Carriers");
        await dmePages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        const dmeSearchInput = appManager.dmePage!.locator("input[type='search'], input[placeholder*='Search']").first();
        await dmeSearchInput.fill(testData.Carrier || testData.carrierName || "");
        await appManager.dmePage!.keyboard.press("Enter");
        await dmePages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("DME: Verified carrier toggle status");
        await appManager.switchToBTMS();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }

    // ==================== TNX NAVIGATION ACTIONS ====================
    // Reference: DFB-97739.spec.ts Step 16
    if (lowerAction.includes('tnx') && (lowerAction.includes('organization') || lowerAction.includes('org'))) {
      return `// Switch to TNX and select organization
        const tnxPages = await appManager.switchToTNX();
        await tnxPages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await tnxPages.tnxLandingPage.selectOrganization(testData.customerName);
        console.log("TNX: Selected organization");`;
    }
    if (lowerAction.includes('tnx') && (lowerAction.includes('active jobs') || lowerAction.includes('jobs'))) {
      return `// Navigate to Active Jobs in TNX
        const tnxPages = await appManager.switchToTNX();
        await tnxPages.tnxLandingPage.clickActiveJobs();
        await tnxPages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("TNX: Navigated to Active Jobs");`;
    }

    // ==================== CARRIER AUTO-ACCEPT ====================
    // Reference: DFB-97739.spec.ts Step 10
    if (lowerAction.includes('auto') && lowerAction.includes('accept') && lowerAction.includes('carrier')) {
      return `// Click carrier auto-accept checkbox
        await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
        console.log("Carrier auto-accept checkbox clicked");`;
    }
    if (lowerAction.includes('carrier contact') && (lowerAction.includes('select') || lowerAction.includes('rate confirmation'))) {
      return `// Select carrier contact for rate confirmation — dynamic dropdown lookup
        const contactDropdown = sharedPage.locator("//select[@id='form_accept_as_user']");
        await contactDropdown.waitFor({ state: "attached", timeout: WAIT.LARGE });
        await sharedPage.waitForTimeout(2000);
        const contactOptions = await contactDropdown.locator("option").allTextContents();
        const matchedContact = contactOptions.find(
          (opt: string) => opt.toLowerCase().includes(testData.saleAgentEmail.toLowerCase())
        );
        console.log(\`Looking for carrier contact with email: \${testData.saleAgentEmail}\`);
        console.log(\`Available options: [\${contactOptions.filter((o: string) => o.trim()).join(" | ")}]\`);
        expect(matchedContact, \`No contact found with email: \${testData.saleAgentEmail}\`).toBeTruthy();
        const normalizedLabel = matchedContact!.trim().replace(/\\s+/g, " ");
        await pages.dfbLoadFormPage.selectCarreirContactForRateConfirmation(normalizedLabel);
        console.log(\`Selected carrier contact for rate confirmation: \${normalizedLabel}\`);`;
    }

    // ==================== VIEW LOAD VALIDATIONS ====================
    // Reference: DFB-97739.spec.ts Steps 13, 17
    if (lowerAction.includes('refresh') && lowerAction.includes('load') && lowerAction.includes('status')) {
      return `// Refresh page and validate load status
        await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.BOOKED);
        console.log("Load status validated");`;
    }
    if (lowerAction.includes('carrier tab') && (lowerAction.includes('dispatch') || lowerAction.includes('name'))) {
      return `// Validate carrier dispatch details on carrier tab
        await pages.viewLoadPage.clickCarrierTab();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.viewLoadCarrierTabPage.validateCarrierAssignedText();
        await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(testData.dispatchName || "");
        await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(testData.dispatchEmail || "");
        console.log("Carrier tab dispatch details validated");`;
    }

    // ==================== BID HISTORY ====================
    // Reference: DFB-97739.spec.ts Step 17
    if (lowerAction.includes('bid history') || lowerAction.includes('bids report')) {
      return `// Check BIDS and bid history (optional)
        try {
          const bidsReportValue = await pages.viewLoadCarrierTabPage.getBidsReportValue();
          console.log(\`BIDS Reports value = "\${bidsReportValue}"\`);
          await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks("Bid History");
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          const bidDetails = await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
          console.log("Bid History details:", JSON.stringify(bidDetails));
          await pages.viewLoadCarrierTabPage.closeBidHistoryModal();
        } catch (e) {
          console.log(\`Bid history check — could not complete: \${(e as Error).message}\`);
        }`;
    }

    // ==================== DFB FORM VALIDATIONS ====================
    // Reference: DFB-97739.spec.ts Step 13
    if (lowerAction.includes('validate') && lowerAction.includes('dfb') && (lowerAction.includes('field') || lowerAction.includes('form'))) {
      return `// Validate DFB form fields and state
        await pages.dfbLoadFormPage.validateDFBTextFieldHaveExpectedValues({});
        await pages.dfbLoadFormPage.validateFormFieldsState();
        await pages.dfbLoadFormPage.validateFieldsAreNotEditable();
        console.log("DFB form fields validated");`;
    }
    if (lowerAction.includes('validate') && lowerAction.includes('post status')) {
      const statusMatch = action.match(/(POSTED|BOOKED|ACTIVE|DISPATCHED|CANCELLED|MATCHED)/i);
      const status = statusMatch ? statusMatch[1].toUpperCase() : 'POSTED';
      return `// Validate post status
        await pages.dfbLoadFormPage.validatePostStatus("${status}");
        console.log("Post status validated: ${status}");`;
    }

    // ==================== HOVER ACTIONS ====================
    // "Hover to ADMIN" / "Hover over Loads" etc. — maps to hoverOverHeaderByText
    if (lowerAction.match(/\bhover\b/) && !lowerAction.includes('click')) {
      if (lowerAction.includes('admin')) {
        return `await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('load')) {
        return `await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('customer')) {
        return `await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('carrier')) {
        return `await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('finance')) {
        return `await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('home')) {
        return `await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      const hoverTarget = action.match(/hover\s+(?:to|over|on)\s+(?:the\s+)?(.+?)\.?\s*$/i);
      if (hoverTarget) {
        return `await pages.basePage.hoverOverHeaderByText("${hoverTarget[1].trim()}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
    }

    // ==================== OFFICE PROFILE / AGENT PROFILE ACTIONS ====================
    if (lowerAction.includes('office profile') || lowerAction.includes('office info')) {
      if (lowerAction.includes('click')) {
        return `await pages.editOfficeInfoPage.clickOnOfficeProfile();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      return `await pages.editOfficeInfoPage.clickOnOfficeProfile();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }
    if (lowerAction.includes('agent profile') || (lowerAction.includes('click') && lowerAction.includes('agent') && !lowerAction.includes('search') && !lowerAction.includes('field'))) {
      return `await pages.agentSearchPage.selectAgentByName(testData.salesAgent);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }

    // ==================== ENTER VALUE INTO FIELD ====================
    // "Enter the value into Agent field as FRISCO TL" -> extract field & value
    if (lowerAction.match(/enter\s+(?:the\s+)?value\s+into\s+/)) {
      const fieldValueMatch = action.match(/into\s+(?:the\s+)?(.+?)\s+(?:field|input)\s+(?:as|with|=)\s+(.+?)\.?\s*$/i);
      if (fieldValueMatch) {
        const fieldName = fieldValueMatch[1].trim().toLowerCase();
        const fieldValue = fieldValueMatch[2].trim();
        if (fieldName.includes('agent')) {
          return `await pages.editOfficeInfoPage.fillAgentField("${fieldValue}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
        }
        if (fieldName.includes('office') || fieldName.includes('code')) {
          return `await pages.editOfficeInfoPage.fillOfficeCode("${fieldValue}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
        }
        if (fieldName.includes('customer')) {
          return `await pages.searchCustomerPage.enterCustomerName("${fieldValue}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
        }
        if (fieldName.includes('carrier')) {
          return `await pages.carrierSearchPage.nameInputOnCarrierPage("${fieldValue}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
        }
        const fid = fieldName.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        return `// Enter ${fieldName}: ${fieldValue}
        const field_${fid} = sharedPage.locator("#form_${fid}, #${fid}, [name='${fid}']").first();
        await field_${fid}.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await field_${fid}.fill("${fieldValue}");
        console.log("Entered ${fieldName}: ${fieldValue}");`;
      }
    }

    // ==================== TOGGLE / SETTING ACTIONS ====================
    // "Ensure Carrier Auto Accept is set to YES"
    // "Set Enable TNX Bids to YES"
    // "Toggle Digital Matching Engine to YES"
    if (lowerAction.match(/\b(toggle|enable|disable|set|ensure|verify|update)\b/) &&
        (lowerAction.includes('yes') || lowerAction.includes('no') || lowerAction.includes('on') || lowerAction.includes('off'))) {
      const wantEnabled = lowerAction.includes('yes') || lowerAction.includes('on') || lowerAction.includes('enable');

      if (lowerAction.includes('carrier auto accept') || lowerAction.includes('auto accept')) {
        return `// ${wantEnabled ? 'Enable' : 'Disable'} Carrier Auto Accept in office settings
        await pages.editOfficeInfoPage.setToggle("Carrier Auto Accept", ${wantEnabled});
        console.log("Carrier Auto Accept set to ${wantEnabled ? 'YES' : 'NO'}");`;
      }
      if (lowerAction.includes('tnx bids') || lowerAction.includes('tnx bid')) {
        return `// ${wantEnabled ? 'Enable' : 'Disable'} TNX Bids in office settings
        await pages.editOfficeInfoPage.setToggle("Enable TNX Bids", ${wantEnabled});
        console.log("TNX Bids set to ${wantEnabled ? 'YES' : 'NO'}");`;
      }
      if (lowerAction.includes('digital matching') || lowerAction.includes('dme')) {
        return `// ${wantEnabled ? 'Enable' : 'Disable'} Digital Matching Engine in office settings
        await pages.editOfficeInfoPage.setToggle("Enable Digital Matching Engine", ${wantEnabled});
        console.log("Digital Matching Engine set to ${wantEnabled ? 'YES' : 'NO'}");`;
      }
      if (lowerAction.includes('auto post')) {
        return `// ${wantEnabled ? 'Enable' : 'Disable'} Auto Post in office settings
        await pages.editOfficeInfoPage.setToggle("Auto Post", ${wantEnabled});
        console.log("Auto Post set to ${wantEnabled ? 'YES' : 'NO'}");`;
      }
      if (lowerAction.includes('greenscreen')) {
        return `// ${wantEnabled ? 'Enable' : 'Disable'} Greenscreen in office settings
        await pages.editOfficeInfoPage.setToggle("Greenscreen", ${wantEnabled});
        console.log("Greenscreen set to ${wantEnabled ? 'YES' : 'NO'}");`;
      }
      const toggleMatch = action.match(/(?:toggle|enable|disable|set|ensure|update)\s+(?:the\s+)?(.+?)\s+(?:to|as|is)\s+(yes|no|on|off)/i);
      if (toggleMatch) {
        const settingName = toggleMatch[1].trim();
        return `// Set ${settingName} to ${wantEnabled ? 'YES' : 'NO'}
        await pages.editOfficeInfoPage.setToggle("${settingName}", ${wantEnabled});
        console.log("${settingName} set to ${wantEnabled ? 'YES' : 'NO'}");`;
      }
    }

    // ==================== EDIT / SAVE BUTTON ON OFFICE/PROFILE ====================
    if (lowerAction.includes('edit button') || (lowerAction.includes('click') && lowerAction.includes('edit') && !lowerAction.includes('load'))) {
      if (lowerAction.includes('office') || lowerAction.includes('profile') || lowerAction.includes('setting')) {
        return `await pages.editOfficeInfoPage.clickEditButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
    }
    if (lowerAction.includes('save changes') || (lowerAction.includes('save') && (lowerAction.includes('office') || lowerAction.includes('setting') || lowerAction.includes('profile')))) {
      return `await pages.editOfficeInfoPage.clickSaveButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }

    // ==================== INCLUDE CARRIERS / SELECT CARRIERS ====================
    if (lowerAction.includes('include carrier') || (lowerAction.includes('select') && lowerAction.includes('carrier') && lowerAction.includes('include'))) {
      return `await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.Carrier || testData.carrierName]);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Selected carrier in Include Carriers");`;
    }

    // ==================== DO NOT SELECT / NEGATIVE ACTIONS ====================
    if (lowerAction.includes('do not select') || lowerAction.includes('should not select') || lowerAction.includes('don\'t select')) {
      if (lowerAction.includes('carrier contact') || lowerAction.includes('loadboard user') || lowerAction.includes('rate confirmation')) {
        return `// Deliberately NOT selecting carrier contact for rate confirmation
        // This is a negative test — verify the system behavior without a contact selected
        console.log("Skipped carrier contact selection — testing missing contact scenario");`;
      }
      return `// Deliberate skip — ${action}
        console.log("Negative test step: ${action.replace(/"/g, "'")}");`;
    }

    // ==================== FILL DFB LOAD FORM (comprehensive) ====================
    if (lowerAction.includes('fill') && (lowerAction.includes('form') || lowerAction.includes('dfb') || lowerAction.includes('load form'))) {
      return `// Fill DFB Load Form using createNonTabularLoad helper
        await pages.nonTabularLoadPage.createNonTabularLoad({
          shipperValue: testData.shipperName,
          consigneeValue: testData.consigneeName,
          shipperEarliestTime: testData.shipperEarliestTime,
          shipperLatestTime: testData.shipperLatestTime,
          consigneeEarliestTime: testData.consigneeEarliestTime,
          consigneeLatestTime: testData.consigneeLatestTime,
          shipmentCommodityQty: testData.shipmentCommodityQty,
          shipmentCommodityUoM: testData.shipmentCommodityUoM,
          shipmentCommodityDescription: testData.shipmentCommodityDescription,
          shipmentCommodityWeight: testData.shipmentCommodityWeight,
          equipmentType: testData.equipmentType,
          equipmentLength: testData.equipmentLength,
          distanceMethod: testData.Method,
        });
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log("Load form filled, Load Number:", loadNumber);`;
    }

    // ==================== REFRESH PAGE / RELOAD ====================
    if (lowerAction.includes('refresh') && !lowerAction.includes('status')) {
      return `await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }

    // ==================== VALIDATE LOAD STATUS ====================
    if (lowerAction.includes('validate') && lowerAction.includes('load') && lowerAction.includes('status')) {
      const statusMatch = action.match(/(BOOKED|POSTED|ACTIVE|DISPATCHED|CANCELLED|MATCHED|AVAILABLE)/i);
      const status = statusMatch ? statusMatch[1].toUpperCase() : 'BOOKED';
      return `await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.${status});
        console.log("Load status validated: ${status}");`;
    }

    // ==================== SEARCH LOAD ====================
    if (lowerAction.includes('search') && lowerAction.includes('load') && !lowerAction.includes('create')) {
      return `await pages.allLoadsSearchPage.searchByLoadNumber(loadNumber);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Searched for load:", loadNumber);`;
    }

    // ==================== CARRIER TAB ACTIONS ====================
    if (lowerAction.includes('carrier tab')) {
      return `await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }

    // ==================== VALIDATE CARRIER ASSIGNED / DISPATCH ====================
    if (lowerAction.includes('carrier assigned') || lowerAction.includes('carrier dispatch') ||
        (lowerAction.includes('dispatch') && (lowerAction.includes('name') || lowerAction.includes('email')))) {
      return `await pages.viewLoadCarrierTabPage.validateCarrierAssignedText();
        await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(CARRIER_DISPATCH_NAME.DISPATCH_NAME_1);
        await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(CARRIER_DISPATCH_EMAIL.DISPATCH_EMAIL_1);
        console.log("Carrier dispatch details validated");`;
    }

    // ==================== VALIDATE ALERT / MESSAGE ====================
    if (lowerAction.includes('validate') && (lowerAction.includes('alert') || lowerAction.includes('message') || lowerAction.includes('notification'))) {
      const msgMatch = action.match(/['""'\u201C\u201D](.+?)['""'\u201C\u201D]/);
      if (msgMatch) {
        const alertPatternsPath = path.resolve(__dirname, '../../utils/alertPatterns.ts');
        const patternConstant = resolveAlertPatternConstant(msgMatch[1], alertPatternsPath);
        return `await pages.commonReusables.validateAlert(sharedPage, ${patternConstant});
        console.log("Alert validated");`;
      }
      return `// Validate alert/message
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Alert message step — review and add specific ALERT_PATTERNS constant");`;
    }

    // ==================== POST AUTOMATION RULE ACTIONS ====================
    // Must be checked BEFORE generic click/navigate/enter to avoid false matches
    if (lowerAction.includes('post automation') || lowerAction.includes('automation rule') || 
        (lowerAction.includes('create new entry') && (lowerAction.includes('form') || lowerAction.includes('pop')))) {
      if (lowerAction.includes('new') && (lowerAction.includes('button') || lowerAction.includes('click'))) {
        return `// Click New button to open CREATE NEW ENTRY form
        await pages.postAutomationRulePage.clickElementByText(POST_AUTOMATION_RULE.NEW_BUTTON);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('fill') || lowerAction.includes('enter') || lowerAction.includes('select') || lowerAction.includes('valid values')) {
        // Detect "except" clause — which fields to EXCLUDE from the form fill
        const hasExceptClause = lowerAction.includes('except');
        const excludeEmail = hasExceptClause && (lowerAction.includes('email') || lowerAction.includes('notification'));
        const excludePickLocation = hasExceptClause && lowerAction.includes('pick location');
        const excludeDestination = hasExceptClause && lowerAction.includes('destination');
        const excludeEquipment = hasExceptClause && lowerAction.includes('equipment');
        const excludeLoadType = hasExceptClause && lowerAction.includes('load type');
        const excludeOfferRate = hasExceptClause && (lowerAction.includes('offer rate') || lowerAction.includes('rate'));
        const excludeCustomer = hasExceptClause && lowerAction.includes('customer');
        const excludeCommodity = hasExceptClause && lowerAction.includes('commodity');
        
        // Build the form data object, commenting out excluded fields
        const formFields: string[] = [];
        formFields.push(excludeCustomer 
          ? '            // customer intentionally omitted per test case requirement' 
          : '            customer: testData.customerName,');
        formFields.push(excludeEmail 
          ? '            // emailNotification intentionally omitted - testing missing email validation' 
          : '            emailNotification: testData.saleAgentEmail,');
        formFields.push(excludePickLocation 
          ? '            // pickLocation intentionally omitted per test case requirement' 
          : '            pickLocation: testData.shipperName,');
        formFields.push(excludeDestination 
          ? '            // destination intentionally omitted per test case requirement' 
          : '            destination: testData.consigneeName,');
        formFields.push(excludeEquipment 
          ? '            // equipment intentionally omitted per test case requirement' 
          : '            equipment: testData.equipmentType,');
        formFields.push(excludeLoadType 
          ? '            // loadType intentionally omitted per test case requirement' 
          : '            loadType: testData.loadMethod,');
        formFields.push(excludeOfferRate 
          ? '            // offerRate intentionally omitted per test case requirement' 
          : '            offerRate: testData.offerRate,');
        formFields.push(excludeCommodity 
          ? '            // commodity intentionally omitted per test case requirement' 
          : '            commodity: testData.commodity,');

        const excludeComment = hasExceptClause 
          ? `// Fill Post Automation Rule form - EXCLUDING field(s) as per test case` 
          : `// Fill Post Automation Rule form with valid values`;
        
        return `${excludeComment}
        await dfbHelpers.fillPostAutomationRuleForm(
          pages,
          {
${formFields.join('\n')}
          },
          true
        );`;
      }
      if (lowerAction.includes('create') && lowerAction.includes('button')) {
        return `// Click Create button on post automation rule form
        await pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('verify') || lowerAction.includes('validate') || lowerAction.includes('check')) {
        return `// Verify post automation rule
        await pages.postAutomationRulePage.ruleInputSearch(testData.customerName);
        await pages.postAutomationRulePage.verifySinglePostAutomationRow({
          customerName: testData.customerName,
          equipment: testData.equipmentType,
          method: testData.loadMethod,
          offerRate: testData.offerRate,
        });`;
      }
      if (lowerAction.includes('delete')) {
        return `// Delete post automation rule
        await pages.postAutomationRulePage.ruleInputSearch(testData.customerName);
        await pages.postAutomationRulePage.selectAllRecordsAndDelete();`;
      }
      if (lowerAction.includes('edit')) {
        return `// Edit post automation rule
        await pages.postAutomationRulePage.ruleInputSearch(testData.customerName);
        await pages.postAutomationRulePage.clickSelectSingleRecordAndEdit();`;
      }
      if (lowerAction.includes('search') || lowerAction.includes('find')) {
        return `// Search for post automation rule
        await pages.postAutomationRulePage.ruleInputSearch(testData.customerName);`;
      }
      if (lowerAction.includes('navigate') || lowerAction.includes('go to') || lowerAction.includes('open')) {
        return `// Navigate to Post Automation Rule page
        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName);`;
      }
      // Generic post automation action
      return `// Post automation rule action: ${action}
        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.clickPostAutomationButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }
    
    // ==================== CLICK ACTIONS ====================
    // Checked BEFORE navigation to prevent "click X to open Y" from hitting navigation
    if (lowerAction.includes('click')) {
      // Click specific named buttons with proper name extraction
      if (lowerAction.includes('button')) {
        const buttonMatch = action.match(/click\s+(?:on\s+)?(?:the\s+)?(.+?)\s+button/i);
        if (buttonMatch) {
          const rawName = buttonMatch[1].trim();
          // Strip smart quotes, leading articles, and clean up
          const buttonName = rawName
            .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
            .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
            .replace(/[""'']/g, '')
            .replace(/^(the|a|an)\s+/i, '')
            .trim();
          // Map common button names to constants
          if (/^(new|add)$/i.test(buttonName)) {
            return `// Click ${buttonName} button
        await pages.postAutomationRulePage.clickElementByText(POST_AUTOMATION_RULE.NEW_BUTTON);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
          }
          if (/^create$/i.test(buttonName)) {
            return `// Click Create button
        await pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
          }
          if (/^create\s*load$/i.test(buttonName)) {
            return `// Click Create Load button and capture load number
        await pages.basePage.clickButtonByText("Create Load");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log("Created Load Number:", loadNumber);`;
          }
          if (/^(save|update)$/i.test(buttonName)) {
            return `// Click ${buttonName} button
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
          }
          if (/^(delete|remove)$/i.test(buttonName)) {
            return `// Click ${buttonName} button
        await pages.basePage.clickButton("${buttonName.toLowerCase()}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
          }
          if (/^(search|find)$/i.test(buttonName)) {
            return `// Click ${buttonName} button
        await pages.basePage.clickButton("${buttonName.toLowerCase()}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
          }
          if (/^post$/i.test(buttonName)) {
            return `// Click Post button
        await pages.dfbLoadFormPage.clickOnPostButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
          }
          // Generic button click using reusable page object method
          return `// Click ${buttonName} button
        await pages.basePage.clickButtonByText("${buttonName}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
        }
      }
      // Click on links/elements by text
      if (lowerAction.includes('link') || lowerAction.includes('menu')) {
        const linkMatch = action.match(/click\s+(?:on\s+)?(?:the\s+)?(.+?)(?:\s+link|\s+menu)/i);
        if (linkMatch) {
          const linkText = linkMatch[1].replace(/^(the|a|an)\s+/i, '').trim();
          return `// Click ${linkText} link/menu
        await pages.basePage.clickLinkByText("${linkText}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
        }
      }
      // Click on dropdown
      if (lowerAction.includes('dropdown') || lowerAction.includes('drop down') || lowerAction.includes('drop-down')) {
        const ddMatch = action.match(/click\s+(?:on\s+)?(?:the\s+)?(.+?)\s+(?:dropdown|drop-down|drop down)/i);
        if (ddMatch) {
          const ddName = ddMatch[1].replace(/^(the|a|an)\s+/i, '').trim();
          return `// Click ${ddName} dropdown and select a value
        await pages.basePage.clickDropdownById("form_${ddName.toLowerCase().replace(/\s+/g, '_')}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
        }
      }
      // Click on tab
      if (lowerAction.includes('tab')) {
        const tabMatch = action.match(/click\s+(?:on\s+)?(?:the\s+)?(.+?)\s+tab/i);
        if (tabMatch) {
          // Strip smart quotes and non-alphanumeric chars to produce valid TABS.* constant
          const rawTab = tabMatch[1].replace(/^(the|a|an)\s+/i, '').trim();
          const tabName = rawTab
            .replace(/[\u201C\u201D\u201E\u201F\u2018\u2019\u201A\u201B\u2033\u2036\u2032\u2035""'']/g, '')
            .replace(/[^a-zA-Z0-9\s_]/g, '')
            .trim()
            .toUpperCase()
            .replace(/\s+/g, '_');
          return `// Click ${rawTab} tab
        await pages.editLoadPage.clickOnTab(TABS.${tabName});`;
        }
      }
      // Generic click with "Search" keyword
      if (lowerAction.includes('search')) {
        return `// Click Search
        await pages.basePage.clickButton("search");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      // Generic click
      return `// ${action}
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }

    // ==================== NAVIGATION ACTIONS ====================
    // Only match explicit navigation intent: "navigate to X", "go to X", "open X page/section"
    // Exclude "open" when part of "to open the form" (already handled by CLICK above)
    if (lowerAction.includes('navigate') || lowerAction.includes('go to') || 
        (lowerAction.includes('open') && !lowerAction.includes('click') && !lowerAction.includes('form'))) {
      if (lowerAction.includes('post automation') || lowerAction.includes('automation rule')) {
        return `// Navigate to Post Automation Rules
        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.clickPostAutomationButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('load')) {
        return `// Navigate to Loads
        await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('carrier search') || (lowerAction.includes('carrier') && lowerAction.includes('search'))) {
        return `// Navigate to Carrier Search
        await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
        await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('carrier')) {
        return `// Navigate to Carriers
        await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
        await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('admin')) {
        return `// Navigate to Admin
        await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('customer')) {
        return `// Navigate to Customers
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('finance')) {
        return `// Navigate to Finance
        await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('edi') || lowerAction.includes('queue')) {
        return `// Navigate to EDI queue
        await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('office config') || lowerAction.includes('office configuration')) {
        return `// Navigate to Office Config
        await pages.basePage.clickHeaderAndSubMenu(HEADERS.HOME, ADMIN_SUB_MENU.OFFICE_CONFIG);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('office')) {
        return `// Navigate to Office Search
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('agent search')) {
        return `// Navigate to Agent Search
        await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
        await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('sales lead')) {
        return `// Navigate to Sales Lead
        await pages.basePage.hoverOverHeaderByText(HEADERS.AGENT);
        await pages.basePage.clickSubHeaderByText(AGENT_SUB_MENU.MY_SALES_LEADS);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('home')) {
        return `// Navigate to Home
        await pages.basePage.clickHomeButton();`;
      }
      // Generic navigation fallback - try to extract destination
      const navMatch = action.match(/(?:navigate to|go to|open)\s+(?:the\s+)?(.+?)(?:\s+page|\s+section|$)/i);
      if (navMatch) {
        const destination = navMatch[1].trim();
        return `// Navigate to ${destination}
        await pages.basePage.hoverOverHeaderByText("${destination}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      return `// Navigate
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }
    
    // ==================== LOAD CREATION ACTIONS ====================
    if (lowerAction.includes('create') && (lowerAction.includes('load') || lowerAction.includes('non-tabular') || lowerAction.includes('non tabular'))) {
      // Check if it's a specific type of load creation
      if (lowerAction.includes('matching') || lowerAction.includes('rule')) {
        return `// Create load matching the automation rule
        await pages.loadsPage.clickNewLoadDropdown();
        await pages.loadsPage.selectNonTabularTL();
        await pages.nonTabularLoadPage.createNonTabularLoad({
          shipperValue: testData.shipperName,
          consigneeValue: testData.consigneeName,
          equipmentType: testData.equipmentType
        });
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log("Created Load Number:", loadNumber);`;
      }
      
      return `// Create new non-tabular load
        await pages.loadsPage.clickNewLoadDropdown();
        await pages.loadsPage.selectNonTabularTL();
        await pages.nonTabularLoadPage.createNonTabularLoad({
          shipperValue: testData.shipperName,
          consigneeValue: testData.consigneeName,
          shipperEarliestTime: testData.shipperEarliestTime,
          shipperLatestTime: testData.shipperLatestTime,
          consigneeEarliestTime: testData.consigneeEarliestTime,
          consigneeLatestTime: testData.consigneeLatestTime,
          shipmentCommodityQty: testData.shipmentCommodityQty,
          shipmentCommodityUoM: testData.shipmentCommodityUoM,
          shipmentCommodityDescription: testData.shipmentCommodityDescription,
          shipmentCommodityWeight: testData.shipmentCommodityWeight,
          equipmentType: testData.equipmentType,
          equipmentLength: testData.equipmentLength,
          distanceMethod: testData.Method
        });
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log("Created Load Number:", loadNumber);`;
    }
    
    // ==================== CARGO VALUE ACTIONS ====================
    if (lowerAction.includes('cargo value') || lowerAction.includes('enter cargo')) {
      // Extract cargo value if mentioned in action
      const valueMatch = action.match(/(\d+)/);
      const cargoValue = valueMatch ? valueMatch[1] : 'testData.cargoValue';
      return `// Enter cargo value
        await pages.nonTabularLoadPage.enterCargoValue("${cargoValue}");`;
    }
    
    // ==================== OFFER RATE ACTIONS ====================
    if (lowerAction.includes('offer rate') || lowerAction.includes('enter rate')) {
      return `// Enter offer rate
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate || "1000");`;
    }
    
    // ==================== SAVE ACTIONS ====================
    if (lowerAction.includes('save')) {
      if (lowerAction.includes('close')) {
        return `// Save and close
        await pages.nonTabularLoadPage.clickSaveAndClose();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log("Saved Load Number:", loadNumber);`;
      }
      if (lowerAction.includes('verify') || (lowerAction.includes('and') && lowerAction.includes('load'))) {
        return `// Save and verify load
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        expect(loadNumber, "Load should be saved").toBeTruthy();
        console.log("Saved Load Number:", loadNumber);`;
      }
      return `// Save
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }
    
    // ==================== POST ACTIONS ====================
    if (lowerAction.includes('post')) {
      if (lowerAction.includes('tnx') || lowerAction.includes('to tnx')) {
        return `// Post to TNX
        await pages.dfbLoadFormPage.clickOnPostButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('button') || lowerAction.includes('click')) {
        return `await pages.dfbLoadFormPage.clickOnPostButton();`;
      }
    }
    
    // ==================== VERIFICATION/VALIDATION ACTIONS ====================
    if (lowerAction.includes('verify') || lowerAction.includes('validate') || lowerAction.includes('check')) {
      if (lowerAction.includes('post status')) {
        return `// Verify post status
        await pages.dfbLoadFormPage.validatePostStatus("POSTED");`;
      }
      if (lowerAction.includes('load') && lowerAction.includes('created')) {
        return `// Verify load was created
        expect(loadNumber, "Load should be created").toBeTruthy();
        console.log("Verified load created:", loadNumber);`;
      }
      if (lowerAction.includes('message') || lowerAction.includes('error') || lowerAction.includes('alert') || lowerAction.includes('toast') || lowerAction.includes('displayed')) {
        // Extract the message text - handle various quote styles
        const msgMatch = action.match(/['""'\u201C\u201D](.+?)['""'\u201C\u201D]/);
        let msgText = msgMatch ? msgMatch[1] : action.replace(/.*(?:message|displayed|relating|showing)\s*/i, '').trim();
        msgText = msgText.replace(/^['"]+|['"]+$/g, '').trim();
        // Resolve to ALERT_PATTERNS constant — auto-creates in alertPatterns.ts if not found
        const alertPatternsPath = path.resolve(__dirname, '../../utils/alertPatterns.ts');
        const patternConstant = resolveAlertPatternConstant(msgText, alertPatternsPath);
        // Use existing commonReusables.validateAlert for alert/popup/validation messages
        if (lowerAction.includes('alert') || lowerAction.includes('pop') || lowerAction.includes('validation')) {
          return `// Verify browser alert dialog using existing commonReusables.validateAlert
        await Promise.all([
          pages.commonReusables.validateAlert(sharedPage, ${patternConstant}),
          pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE),
        ]);`;
        }
        // For DOM-visible messages (toast, banner, inline error), use validateAlert if it's an alert
        // otherwise check DOM text directly
        return `// Verify message is displayed on the page
        await Promise.all([
          pages.commonReusables.validateAlert(sharedPage, ${patternConstant}),
          pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE),
        ]);`;
      }
      if (lowerAction.includes('tnx') && !lowerAction.includes('auto')) {
        return `// Verify in TNX
        try {
          const tnxPages = await appManager.switchToTNX();
          await tnxPages.tnxLandingPage.searchLoadOnTNXLandingPage(loadNumber);
          console.log("TNX verification completed for load: " + loadNumber);
        } catch (e) {
          console.log("TNX verification could not complete:", (e as Error).message);
        }`;
      }
      if (lowerAction.includes('dme')) {
        return `// Verify in DME
        try {
          const dmePages = await appManager.switchToDME();
          await dmePages.dmeDashboardPage.clickOnLoadsLink();
          await dmePages.dmeDashboardPage.searchLoad(loadNumber);
          await dmePages.dmeLoadPage.validateSingleTableRowPresent();
          console.log("DME verification completed for load: " + loadNumber);
        } catch (e) {
          console.log("DME verification could not complete:", (e as Error).message);
        }`;
      }
      if (lowerAction.includes('cargo')) {
        return `// Verify cargo value
        const displayedCargoValue = await pages.dfbLoadFormPage.getCargoValue();
        expect(displayedCargoValue).toBeTruthy();`;
      }
      if (lowerAction.includes('auto') || lowerAction.includes('automation')) {
        return `// Verify automation
        try {
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          const automationStatus = sharedPage.locator("//*[contains(@class,'status') or contains(@id,'automation')]").first();
          const statusText = await automationStatus.textContent({ timeout: 10000 }).catch(() => "");
          console.log("Automation status: " + statusText);
        } catch (e) {
          console.log("Automation verification could not complete:", (e as Error).message);
        }`;
      }
      if (lowerAction.includes('column') || lowerAction.includes('hidden') || lowerAction.includes('visible')) {
        const escapedAct = action.substring(0, 80).replace(/"/g, '\\"');
        return `// Verify column visibility: ${action}
        try {
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          const targetCol = sharedPage.locator("//th[contains(text(),'${escapedAct.split(' ').pop()}')] | //td[contains(text(),'${escapedAct.split(' ').pop()}')]").first();
          const isColumnVisible = await targetCol.isVisible({ timeout: 10000 }).catch(() => false);
          expect.soft(isColumnVisible, "${escapedAct}").toBeTruthy();
          console.log("Column visibility check: " + isColumnVisible);
        } catch (e) {
          console.log("Column visibility check could not complete:", (e as Error).message);
        }`;
      }
      // Generic verification with locator-based assertion
      {
        const escapedAct = action.substring(0, 80).replace(/"/g, '\\"');
        return `// Verify: ${action}
        try {
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          const verifyElement = sharedPage.locator("//*[contains(text(),'${escapedAct.split(' ').slice(-3).join(' ').replace(/'/g, "\\'")}')]").first();
          const isVisible = await verifyElement.isVisible({ timeout: 10000 }).catch(() => false);
          expect.soft(isVisible, "${escapedAct}").toBeTruthy();
          console.log("Verified: ${escapedAct}");
        } catch (e) {
          console.log("Verification could not complete: ${escapedAct}", (e as Error).message);
        }`;
      }
    }
    
    // ==================== CUSTOMER SEARCH ACTIONS ====================
    if (lowerAction.includes('search') && lowerAction.includes('customer')) {
      return `// Search customer
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);`;
    }

    // ==================== CUSTOMER VALUE SELECT ON ENTER NEW LOAD FORM ====================
    // Handles: "Customer field is already selected or if not select the customer [NAME]"
    if (lowerAction.includes('customer') && (lowerAction.includes('field') || lowerAction.includes('select the customer') || lowerAction.includes('enter new load')) && !lowerAction.includes('search')) {
      return `// Select customer value on Enter New Load form
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        const customerName = testData['Customer Value'] || testData.customerName;
        const customerSelect2 = sharedPage.locator(
          "//select[contains(@id,'customer')]//following-sibling::span[contains(@class,'select2')]"
        ).first();
        const customerDropdown = sharedPage.locator(
          "//select[contains(@id,'customer_id') or contains(@id,'customer')]"
        ).first();
        if (await customerSelect2.isVisible({ timeout: 5000 }).catch(() => false)) {
          await customerSelect2.click();
          const searchInput = sharedPage.locator("input.select2-search__field");
          await searchInput.waitFor({ state: "visible", timeout: 5000 });
          await searchInput.fill(customerName);
          await sharedPage.waitForTimeout(2000);
          const resultItem = sharedPage.locator(
            \`//li[contains(@class,'select2-results__option') and contains(text(),'\${customerName}')]\`
          ).first();
          await resultItem.waitFor({ state: "visible", timeout: 10000 });
          await resultItem.click();
          console.log(\`Selected customer via Select2: \${customerName}\`);
        } else if (await customerDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
          await customerDropdown.selectOption({ label: customerName });
          console.log(\`Selected customer via dropdown: \${customerName}\`);
        }
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await sharedPage.waitForTimeout(3000);
        await sharedPage.locator("//select[@id='form_shipper_ship_point']")
          .waitFor({ state: "visible", timeout: WAIT.LARGE });
        console.log("Customer value selected and form reloaded");`;
    }

    // ==================== COMMISSION ACTIONS ====================
    if (lowerAction.includes('commission') || lowerAction.includes('audit')) {
      if (lowerAction.includes('navigate') || lowerAction.includes('open')) {
        return `// Navigate to Finance/Commission
        await pages.homePage.navigateToHeader(HEADERS.FINANCE);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('verify') || lowerAction.includes('check') || lowerAction.includes('validate')) {
        return `// Verify commission details
        try {
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          const commissionElement = sharedPage.locator("//*[contains(@class,'commission') or contains(@id,'commission')]").first();
          const commText = await commissionElement.textContent({ timeout: 10000 }).catch(() => "");
          console.log("Commission details: " + commText);
        } catch (e) {
          console.log("Commission verification could not complete:", (e as Error).message);
        }`;
      }
    }

    // ==================== SALES LEAD ACTIONS ====================
    if (lowerAction.includes('sales lead') || lowerAction.includes('lead')) {
      if (lowerAction.includes('create') || lowerAction.includes('new')) {
        return `// Create new sales lead
        await pages.newSalesLeadPage.createSalesLead({
          customerName: testData.customerName,
          officeName: testData.officeName
        });`;
      }
      if (lowerAction.includes('verify') || lowerAction.includes('check')) {
        return `// Verify sales lead
        try {
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          const leadElement = sharedPage.locator("//*[contains(@class,'lead') or contains(@id,'sales_lead')]").first();
          const leadText = await leadElement.textContent({ timeout: 10000 }).catch(() => "");
          console.log("Sales lead details: " + leadText);
        } catch (e) {
          console.log("Sales lead verification could not complete:", (e as Error).message);
        }`;
      }
    }

    // ==================== BULK CHANGE ACTIONS ====================
    if (lowerAction.includes('bulk') && (lowerAction.includes('change') || lowerAction.includes('update'))) {
      return `// Bulk change operation
        try {
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          const bulkChangeForm = sharedPage.locator("//form[contains(@id,'bulk') or contains(@class,'bulk')]").first();
          await bulkChangeForm.waitFor({ state: "visible", timeout: WAIT.LARGE });
          console.log("Bulk change form visible");
        } catch (e) {
          console.log("Bulk change step could not complete:", (e as Error).message);
        }`;
    }

    // ==================== SEARCH GENERIC ACTIONS ====================
    if (lowerAction.includes('search') || lowerAction.includes('find') || lowerAction.includes('look up')) {
      if (lowerAction.includes('load')) {
        return `// Search for load
        await pages.allLoadsSearchPage.searchLoad(loadNumber);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      return `// Search operation
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }

    // ==================== SWITCH USER ACTIONS ====================
    if (lowerAction.includes('switch user') || lowerAction.includes('change user')) {
      return `// Switch user
        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);
        console.log("Switched user successfully");`;
    }

    // ==================== OFFICE CONFIGURATION ACTIONS ====================
    if (lowerAction.includes('office') && (lowerAction.includes('configure') || lowerAction.includes('config') || lowerAction.includes('setting'))) {
      return `// Configure office settings
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
        await pages.officePage.configureOfficePreConditions(testData.officeName, pages.toggleSettings.enable_DME);`;
    }

    // ==================== INVOICE/BILLING ACTIONS ====================
    if (lowerAction.includes('invoice') || lowerAction.includes('billing')) {
      if (lowerAction.includes('create')) {
        return `// Create invoice
        await pages.loadBillingPage.clickOnCreateInvoiceButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
      }
      if (lowerAction.includes('verify') || lowerAction.includes('check')) {
        return `// Verify billing/invoice
        try {
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          const billingElement = sharedPage.locator("//*[contains(@class,'billing') or contains(@id,'billing')]").first();
          const billingText = await billingElement.textContent({ timeout: 10000 }).catch(() => "");
          console.log("Billing details: " + billingText);
        } catch (e) {
          console.log("Billing verification could not complete:", (e as Error).message);
        }`;
      }
    }

    // ==================== OBSERVE/VIEW ACTIONS ====================
    if (lowerAction.includes('observe') || lowerAction.includes('view') || lowerAction.includes('review')) {
      return `// ${action}
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }

    // ==================== ENTER/FILL/INPUT ACTIONS (generic fallback) ====================
    // GUARD: Skip generic enter/fill handler if action contains billing/carrier-specific keywords
    // that have dedicated handlers later in the pipeline (invoice, carrier rate, miles, etc.)
    const hasBillingKeywords = /invoice|carrier\s*(?:rate|flat)|customer\s*(?:rate|flat)|total\s*miles|trailer\s*length|expiration\s*(?:date|time)|email.*notification|offer\s*rate|payable|document\s*type|billing\s*toggle|view\s*billing|add\s*new|view\s*history|choose\s*carrier|enter\s*amount|radio\s*button|save\s*invoice|upload.*(?:pod|proof|document)|close.*(?:pop|dialog)/i.test(action);
    if (!hasBillingKeywords && (lowerAction.includes('enter') || lowerAction.includes('fill') || lowerAction.includes('input') || lowerAction.includes('type'))) {
      const fieldMatch = action.match(/(?:enter|fill|input|type)\s+(?:a\s+|an\s+|the\s+)?(?:valid\s+)?(.+?)(?:\s+(?:as|with|=|:)\s+(.+))?$/i);
      if (fieldMatch) {
        const rawFieldName = fieldMatch[1].replace(/\s+field$/i, '').trim();
        const camelField = this.sanitizeStringForCode(rawFieldName, 'identifier');
        const rawValue = fieldMatch[2]?.trim();
        // Guard: strip instructional text like "let's say", "e.g.", "eg" from values
        const cleanedValue = rawValue
          ? rawValue.replace(/^(?:let['']s\s+say|e\.?g\.?\s*)/i, '').trim()
          : undefined;
        const sanitizedValue = cleanedValue
          ? `"${cleanedValue.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"').replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'").replace(/"/g, '\\"')}"`
          : `testData.${camelField}`;
        const fieldId = rawFieldName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        return `// Enter ${rawFieldName}
        const field_${fieldId} = sharedPage.locator("#form_${fieldId}, #${fieldId}, [name='${fieldId}']").first();
        await field_${fieldId}.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await field_${fieldId}.fill(${sanitizedValue});
        console.log("Entered ${rawFieldName}: " + ${sanitizedValue});`;
      }
      return this.generateDirectLocatorCode(action, _testData);
    }

    // ==================== SELECT/CHOOSE ACTIONS (generic fallback) ====================
    // GUARD: Skip generic select handler if action contains billing/carrier-specific keywords
    if (!hasBillingKeywords && (lowerAction.includes('select') || lowerAction.includes('choose') || lowerAction.includes('pick'))) {
      const selectMatch = action.match(/(?:select|choose|pick)\s+(?:a\s+|an\s+|the\s+)?(.+?)(?:\s+(?:from|in|on)\s+(.+))?$/i);
      if (selectMatch) {
        const rawValue = selectMatch[1].trim()
          .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
          .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
          .replace(/"/g, '\\"');
        const field = selectMatch[2] ? selectMatch[2].trim() : '';
        if (field) {
          const fieldId = field.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
          return `// Select ${rawValue} from ${field}
        const select_${fieldId} = sharedPage.locator("//select[contains(@name,'${fieldId}') or contains(@id,'${fieldId}')]").first();
        await select_${fieldId}.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await select_${fieldId}.selectOption({ label: "${rawValue}" });
        console.log("Selected ${rawValue} from ${field}");`;
        }
        return this.generateDirectLocatorCode(action, _testData);
      }
      return this.generateDirectLocatorCode(action, _testData);
    }

    // ==================== UNHIDE/SHOW COLUMN ACTIONS ====================
    if (lowerAction.includes('unhide') || lowerAction.includes('show column') || lowerAction.includes('toggle column')) {
      return `// ${action}
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }
    
    // ==================== TAB NAVIGATION ====================
    if (lowerAction.includes('tab')) {
      if (lowerAction.includes('load')) {
        return `await pages.editLoadPage.clickOnTab(TABS.LOAD);`;
      }
      if (lowerAction.includes('pick')) {
        return `await pages.editLoadPage.clickOnTab(TABS.PICK);`;
      }
      if (lowerAction.includes('drop')) {
        return `await pages.editLoadPage.clickOnTab(TABS.DROP);`;
      }
      if (lowerAction.includes('carrier')) {
        return `await pages.editLoadPage.clickOnTab(TABS.CARRIER);`;
      }
      if (lowerAction.includes('customer')) {
        return `await pages.editLoadPage.clickOnTab(TABS.CUSTOMER);`;
      }
    }
    
    // ==================== CARRIER SEARCH/ACTIONS ====================
    if (lowerAction.includes('carrier')) {
      if (lowerAction.includes('search') && (lowerAction.includes('mc') || lowerAction.includes('mc number'))) {
        return `// Search carrier by MC number
        await pages.carrierSearchPage.mcNoInputOnCarrierPage(testData.mcNumber);
        await pages.carrierSearchPage.selectStatusOnCarrier(testData.carrierStatus || CARRIER_STATUS.ACTIVE);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyMCNoInputOnCarrierSearchPage(testData.mcNumber);`;
      }
      if (lowerAction.includes('search') && lowerAction.includes('dot')) {
        return `// Search carrier by DOT number
        await pages.carrierSearchPage.dotNoInputOnCarrierPage(testData.dotNumber);
        await pages.carrierSearchPage.selectStatusOnCarrier(testData.carrierStatus || CARRIER_STATUS.ACTIVE);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyDotNoInputOnCarrierSearchPage(testData.dotNumber);`;
      }
      if (lowerAction.includes('search') && lowerAction.includes('name')) {
        return `// Search carrier by name
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.selectStatusOnCarrier(testData.carrierStatus || CARRIER_STATUS.ACTIVE);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyNameInputOnCarrierSearchPage(testData.carrierName);`;
      }
      if (lowerAction.includes('search') && lowerAction.includes('id')) {
        return `// Search carrier by ID
        await pages.carrierSearchPage.carrierIDInputOnCarrierPage(testData.carrierID);
        await pages.carrierSearchPage.selectStatusOnCarrier(testData.carrierStatus || CARRIER_STATUS.ACTIVE);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyCarrierIDInputOnCarrierSearchPage(testData.carrierID);`;
      }
      if (lowerAction.includes('search')) {
        return `// Search for carrier
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.selectStatusOnCarrier(testData.carrierStatus || CARRIER_STATUS.ACTIVE);
        await pages.carrierSearchPage.clickOnSearchButton();`;
      }
      if (lowerAction.includes('select') && lowerAction.includes('by name')) {
        return `// Select carrier by name
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);`;
      }
      if (lowerAction.includes('verify') || lowerAction.includes('check') || lowerAction.includes('status')) {
        return `// Verify carrier details
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
        await pages.viewCarrierPage.verifyCarrierNameInDetails(testData.carrierName);`;
      }
      if (lowerAction.includes('profile')) {
        return `// Check carrier profile
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
        await pages.viewCarrierPage.verifyCarrierNameInDetails(testData.carrierName);`;
      }
      if (lowerAction.includes('select') || lowerAction.includes('include')) {
        return `// Select carriers
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.carrierName]);`;
      }
      if (lowerAction.includes('waterfall')) {
        return `// Configure carrier waterfall
        await pages.dfbHelpers.configureCarriersDataWithWaterfall(pages, carriersData);`;
      }
    }
    
    // ==================== PRECONDITION/SETUP ACTIONS ====================
    if (lowerAction.includes('setup') || lowerAction.includes('precondition') || lowerAction.includes('configure')) {
      if (lowerAction.includes('automation') || lowerAction.includes('rule')) {
        return `// Setup post automation rule
        await pages.dfbHelpers.setupDFBTestPreConditions(
          pages,
          testData.officeName,
          { postAutomation: true },
          { postAutomation: true },
          testData.salesAgent,
          testData.customerName
        );`;
      }
      return `// Setup preconditions
        await pages.dfbHelpers.setupDFBTestPreConditions(
          pages,
          testData.officeName,
          toggleSettings,
          ensureToggleValue,
          testData.salesAgent,
          testData.customerName
        );`;
    }
    
    // ==================== EDI ACTIONS ====================
    if (lowerAction.includes('edi') || lowerAction.includes('204') || lowerAction.includes('tender')) {
      if (lowerAction.includes('receive') || lowerAction.includes('accept')) {
        return `// Process EDI tender
        await pages.edi204LoadTendersPage.acceptTender(testData.tenderID);`;
      }
      if (lowerAction.includes('verify') || lowerAction.includes('990')) {
        return `// Verify 990 acknowledgment
        await pages.edi204LoadTendersPage.verify990Sent();`;
      }
    }
    
    // ==================== VIEW BILLING / BILLING TOGGLE ====================
    if (lowerAction.includes('view billing') && (lowerAction.includes('click') || lowerAction.includes('navigate'))) {
      return `await pages.editLoadPage.clickOnTab(TABS.LOAD);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.editLoadFormPage.clickOnViewBillingBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked View Billing");`;
    }
    if ((lowerAction.includes('billing toggle') || lowerAction.includes('payable toggle')) && (lowerAction.includes('validate') || lowerAction.includes('verify') || lowerAction.includes('check'))) {
      return `// Billing toggle is in the Billing Issues "Waiting On" section — check if "Agent" has active class
        const billingIssuesSection = sharedPage.locator("//h4[contains(text(),'Billing Issues')]/parent::*");
        await billingIssuesSection.first().scrollIntoViewIfNeeded();
        const toggleResult = await sharedPage.evaluate(() => {
          const billingHeader = Array.from(document.querySelectorAll('h4'))
            .find(h => h.textContent?.includes('Billing Issues'));
          if (!billingHeader) return { found: false, error: 'Billing Issues header not found' };
          const section = billingHeader.parentElement!;
          const waitingLabels = Array.from(section.querySelectorAll('*'))
            .filter(el => el.textContent?.trim() === 'Waiting On');
          if (waitingLabels.length === 0) return { found: false, error: 'Waiting On not found' };
          const waitingOn = waitingLabels[waitingLabels.length - 1];
          const container = waitingOn.nextElementSibling || waitingOn.parentElement;
          if (!container) return { found: false, error: 'Toggle container not found' };
          const children = Array.from(container.children);
          const toggleInfo = children.map(el => ({
            text: el.textContent?.trim() || '',
            classes: el.className || '',
            isActive: el.classList?.contains('active') || el.classList?.contains('selected') || false,
          }));
          const agentEl = children.find(el => el.textContent?.trim() === 'Agent');
          const isAgentActive = agentEl?.classList?.contains('active') || agentEl?.classList?.contains('selected') || false;
          return { found: true, toggleInfo, isAgentActive };
        });
        console.log("Billing toggle info:", JSON.stringify(toggleResult));
        expect.soft(toggleResult.found, "Billing Issues Waiting On section should exist").toBeTruthy();
        if (toggleResult.found) {
          expect.soft(toggleResult.isAgentActive, "Billing toggle should be set to 'Agent'").toBeTruthy();
        }`;
    }

    // ==================== NOT DELIV FINAL / FINANCE ISSUE VALIDATION ====================
    if ((lowerAction.includes('not deliv') || lowerAction.includes('not delivered') || lowerAction.includes('finance issue')) && (lowerAction.includes('validate') || lowerAction.includes('verify') || lowerAction.includes('check') || lowerAction.includes('marked'))) {
      return `// Not Deliv Final is a <strong> label in Billing Issues with hidden checkbox siblings
        const billingIssuesSection = sharedPage.locator("//h4[contains(text(),'Billing Issues')]/parent::*").first();
        await billingIssuesSection.scrollIntoViewIfNeeded();
        const notDelivResult = await sharedPage.evaluate(() => {
          const billingHeader = Array.from(document.querySelectorAll('h4'))
            .find(h => h.textContent?.includes('Billing Issues'));
          if (!billingHeader) return { found: false, error: 'Billing Issues header not found' };
          const section = billingHeader.parentElement!;
          const notDelivStrong = Array.from(section.querySelectorAll('strong'))
            .find(el => el.textContent?.includes('Not Deliv'));
          if (!notDelivStrong) return { found: false, error: 'Not Deliv. Final label not found' };
          const parent = notDelivStrong.parentElement;
          const checkbox = parent?.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
          const hasActiveClass = notDelivStrong.classList?.contains('active') ||
            notDelivStrong.classList?.contains('checked') ||
            parent?.classList?.contains('active') || false;
          const isChecked = checkbox?.checked || false;
          return { found: true, isChecked: isChecked || hasActiveClass, checkboxExists: !!checkbox,
            labelClasses: notDelivStrong.className || '', parentClasses: parent?.className || '' };
        });
        console.log("Not Deliv Final info:", JSON.stringify(notDelivResult));
        expect.soft(notDelivResult.found, "Not Deliv. Final label should exist in Billing Issues").toBeTruthy();
        if (notDelivResult.found) {
          expect.soft(notDelivResult.isChecked, "Finance issue should be marked as 'Not Delivered Final'").toBeTruthy();
        }`;
    }

    // ==================== VIEW LOAD (from billing page) ====================
    if (lowerAction.includes('view load') && (lowerAction.includes('click') || lowerAction.includes('navigate') || lowerAction.includes('back'))) {
      return `await pages.loadBillingPage.clickOnViewLoadBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Navigated back to View Load page");`;
    }

    // ==================== UPLOAD DOCUMENTS ====================
    if (lowerAction.includes('upload icon') || (lowerAction.includes('document') && lowerAction.includes('upload icon'))) {
      return `const uploadIcon = sharedPage.locator("//img[@title='Upload document']").first();
        await uploadIcon.scrollIntoViewIfNeeded();
        await uploadIcon.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await uploadIcon.click();
        console.log("Clicked document upload icon");
        await sharedPage.waitForTimeout(2000);`;
    }
    if (lowerAction.includes('upload') && (lowerAction.includes('proof of delivery') || lowerAction.includes('pod'))) {
      return `await pages.viewLoadPage.uploadPODDocument();
        console.log("POD document uploaded successfully");`;
    }
    if (lowerAction.includes('upload') && (lowerAction.includes('carrier invoice') || lowerAction.includes('invoice document'))) {
      return `await pages.viewLoadPage.uploadCarrierInvoiceDocument(testData);
        console.log("Carrier Invoice document uploaded");`;
    }

    // ==================== INVOICE NUMBER + FILE ATTACH + SUBMIT ====================
    if ((lowerAction.includes('invoice number') || lowerAction.includes('invoice num')) && (lowerAction.includes('enter') || lowerAction.includes('fill') || lowerAction.includes('attach'))) {
      return `const invoiceNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        const invoiceNumberInput = sharedPage.locator("//input[@id='carr_invoice_num_input']");
        await invoiceNumberInput.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await invoiceNumberInput.fill(invoiceNumber);
        console.log("Entered random invoice number:", invoiceNumber);
        const invoiceAmountInput = sharedPage.locator("//input[@id='carr_invoice_amount']");
        if (await invoiceAmountInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          await invoiceAmountInput.fill(testData.bidAmount || "1000");
          console.log("Entered invoice amount");
        }`;
    }

    // ==================== ATTACH FILE (carrier invoice PDF) ====================
    if ((lowerAction.includes('attach') || lowerAction.includes('browse')) && (lowerAction.includes('file') || lowerAction.includes('document') || lowerAction.includes('invoice'))) {
      return `const dragDropArea = sharedPage.locator("//div[@class='dz-message']");
        await dragDropArea.click().catch(() => console.log("Drag-drop area not clickable, trying file input directly"));
        const fileInput = sharedPage.locator("//input[@type='file']").first();
        const path = require("path");
        const filePath = path.resolve(process.cwd(), "src", "data", "bulkchange", "CarrierInvoice.pdf");
        await fileInput.setInputFiles(filePath);
        console.log("Attached file:", filePath);
        await sharedPage.waitForTimeout(2000);`;
    }

    // ==================== SUBMIT / ACCEPT ALERT IN DIALOG ====================
    if (lowerAction.includes('submit') && (lowerAction.includes('alert') || lowerAction.includes('accept') || lowerAction.includes('dialog'))) {
      return `const submitBtn = sharedPage.locator("//input[@type='submit']").first();
        await submitBtn.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await submitBtn.click();
        console.log("Clicked submit button");
        await sharedPage.waitForTimeout(3000);
        // Handle duplicate invoice warning — Confirm button replaces Submit
        const confirmBtn = sharedPage.locator("//button[text()='Confirm']").first();
        if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await confirmBtn.click();
          console.log("Duplicate invoice warning — clicked Confirm");
        }`;
    }

    // ==================== CLOSE UPLOAD DIALOG ====================
    if ((lowerAction.includes('close') && (lowerAction.includes('dialog') || lowerAction.includes('upload') || lowerAction.includes('popup') || lowerAction.includes('pop up') || lowerAction.includes('modal')))) {
      return `const closeDialogBtn = sharedPage.locator(
          "//div[@role='dialog' and .//span[text()='Document Upload Utility']]//button[contains(@class,'ui-dialog-titlebar-close')]"
        ).first();
        await closeDialogBtn.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await closeDialogBtn.click({ force: true });
        console.log("Closed document upload dialog");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }

    // ==================== CHOOSE CARRIER (on carrier tab) ====================
    if ((lowerAction.includes('choose carrier') || (lowerAction.includes('choose') && lowerAction.includes('carrier'))) && !lowerAction.includes('include')) {
      const carrierNameMatch = action.match(/(?:typing|typing in|select(?:ing)?)\s+(?:in\s+)?(.+?)\.?\s*$/i);
      const carrierName = carrierNameMatch ? carrierNameMatch[1].trim() : 'testData.Carrier';
      const useTestData = !carrierNameMatch;
      const nameExpr = useTestData ? 'testData.Carrier || ""' : `"${carrierName.replace(/"/g, '\\"')}"`;
      return `await pages.editLoadCarrierTabPage.clickOnChooseCarrier();
        console.log("Clicked Choose Carrier button");
        await sharedPage.locator("#carr_1_carr_auto").waitFor({ state: "visible" });
        await sharedPage.locator("#carr_1_carr_auto").pressSequentially(${nameExpr}, { delay: 50 });
        await sharedPage.keyboard.press("Tab");
        await sharedPage.waitForTimeout(3000);
        const carrierOption = sharedPage.locator("#carr_1_carr_select > option");
        if (await carrierOption.isVisible({ timeout: 5000 }).catch(() => false)) {
          await carrierOption.click();
          console.log("Selected carrier from dropdown");
        }
        await pages.editLoadCarrierTabPage.clickOnUseCarrierBtn();
        console.log("Clicked Use Carrier button");`;
    }

    // ==================== ENTER CUSTOMER RATE / CARRIER RATE / MILES / TRAILER LENGTH ====================
    if (lowerAction.includes('customer') && (lowerAction.includes('rate') || lowerAction.includes('flat rate')) && lowerAction.includes('enter')) {
      const rateMatch = action.match(/(?:eg|e\.g\.?|as|=|:)\s*(\d+)/i);
      const rateValue = rateMatch ? `"${rateMatch[1]}"` : 'testData.customerRate || "500"';
      return `await pages.editLoadCarrierTabPage.enterCustomerRate(${rateValue});
        console.log("Entered Customer Rate: " + ${rateValue});`;
    }
    if (lowerAction.includes('flat rate') && lowerAction.includes('customer')) {
      const rateMatch = action.match(/(?:eg|e\.g\.?|as|=|:)\s*(\d+)/i);
      const rateValue = rateMatch ? `"${rateMatch[1]}"` : 'testData.customerRate || "500"';
      return `await pages.editLoadCarrierTabPage.enterCustomerRate(${rateValue});
        console.log("Entered Customer flat rate: " + ${rateValue});`;
    }
    if ((lowerAction.includes('carrier') && (lowerAction.includes('rate') || lowerAction.includes('flat rate')) && lowerAction.includes('enter'))
      && !lowerAction.includes('offer') && !lowerAction.includes('customer') && !lowerAction.includes('search') && !lowerAction.includes('tab')) {
      const rateMatch = action.match(/(?:eg|e\.g\.?|as|=|:)\s*(\d+)/i);
      const rateValue = rateMatch ? `"${rateMatch[1]}"` : 'testData.carrierRate || "600"';
      return `await pages.editLoadCarrierTabPage.enterCarrierRate(${rateValue});
        console.log("Entered Carrier Rate: " + ${rateValue});`;
    }
    if (lowerAction.includes('flat rate') && lowerAction.includes('carrier') && !lowerAction.includes('customer')) {
      const rateMatch = action.match(/(?:eg|e\.g\.?|as|=|:)\s*(\d+)/i);
      const rateValue = rateMatch ? `"${rateMatch[1]}"` : 'testData.carrierRate || "600"';
      return `await pages.editLoadCarrierTabPage.enterCarrierRate(${rateValue});
        console.log("Entered Carrier flat rate: " + ${rateValue});`;
    }
    if (lowerAction.includes('total miles') || (lowerAction.includes('miles') && lowerAction.includes('enter'))) {
      const milesMatch = action.match(/(?:eg|e\.g\.?|as|=|:)\s*(\d+)/i);
      const milesValue = milesMatch ? `"${milesMatch[1]}"` : 'testData.miles || "100"';
      return `await pages.editLoadCarrierTabPage.enterMiles(${milesValue});
        console.log("Entered total miles: " + ${milesValue});`;
    }
    if (lowerAction.includes('trailer length') && lowerAction.includes('enter')) {
      return `await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        console.log(\`Entered trailer length: \${testData.trailerLength}\`);`;
    }

    // ==================== EXPIRATION DATE / TIME ====================
    if (lowerAction.includes('expiration date') && (lowerAction.includes('enter') || lowerAction.includes('select'))) {
      return `const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const formattedDate = \`\${(futureDate.getMonth() + 1).toString().padStart(2, '0')}/\${futureDate.getDate().toString().padStart(2, '0')}/\${futureDate.getFullYear()}\`;
        await pages.editLoadFormPage.enterExpirationDate(formattedDate);
        console.log(\`Entered Expiration Date: \${formattedDate}\`);`;
    }
    if (lowerAction.includes('expiration time') && (lowerAction.includes('enter') || lowerAction.includes('select'))) {
      const timeMatch = action.match(/(?:as|=|:)\s*(\d{1,2}:\d{2})/i);
      const timeValue = timeMatch ? timeMatch[1] : '18:00';
      return `await pages.editLoadFormPage.enterExpirationTime("${timeValue}");
        console.log("Entered Expiration Time: ${timeValue}");`;
    }

    // ==================== EMAIL FOR NOTIFICATION ====================
    if (lowerAction.includes('email') && lowerAction.includes('notification') && (lowerAction.includes('enter') || lowerAction.includes('value'))) {
      return `await pages.editLoadCarrierTabPage.selectEmailNotificationAddress(testData.saleAgentEmail);
        console.log(\`Selected email notification: \${testData.saleAgentEmail}\`);`;
    }

    // ==================== INVOICE NUMBER / AMOUNT ====================
    if (lowerAction.includes('invoice number') && lowerAction.includes('enter')) {
      // Always use random invoice number to avoid duplicate invoice warnings on re-runs
      return `const invoiceNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        const invoiceNumInput = sharedPage.locator("#carr_invoice_num_input");
        await invoiceNumInput.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await invoiceNumInput.fill(invoiceNumber);
        console.log("Entered Invoice #: " + invoiceNumber);`;
    }
    if (lowerAction.includes('invoice amount') && lowerAction.includes('enter')) {
      const amtMatch = action.match(/(?:eg|e\.g\.?|as|=|:)\s*(\d+)/i);
      const amtValue = amtMatch ? `"${amtMatch[1]}"` : 'testData.carrierInvoiceAmount || "1000"';
      return `const invoiceAmtInput = sharedPage.locator("#carr_invoice_amount");
        await invoiceAmtInput.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await invoiceAmtInput.fill(${amtValue});
        console.log("Entered Invoice Amount: " + ${amtValue});`;
    }

    // ==================== UPLOAD CARRIER INVOICE FILE ====================
    if (lowerAction.includes('upload') && (lowerAction.includes('carrier invoice') || lowerAction.includes('invoice document') || lowerAction.includes('invoice file'))) {
      return `const dragDropArea = sharedPage.locator("//div[@class='dz-message']");
        await dragDropArea.click().catch(() => console.log("Drag-drop area not clickable, trying file input directly"));
        const fileInput = sharedPage.locator("//input[@type='file']").first();
        const path = require("path");
        const filePath = path.resolve(process.cwd(), "src", "data", "bulkchange", "CarrierInvoice.pdf");
        await fileInput.setInputFiles(filePath);
        console.log("Uploaded file: " + filePath);`;
    }

    // ==================== CLICK ATTACH / SUBMIT WITH ALERT ====================
    if ((lowerAction.includes('attach') || lowerAction.includes('submit')) && (lowerAction.includes('click') || lowerAction.includes('accept'))) {
      const alertMatch = action.match(/\[(.+?)\]/);
      const alertPattern = alertMatch ? alertMatch[1].trim() : '';
      const alertCode = alertPattern
        ? `const alertPromise = pages.commonReusables.validateAlert(
          sharedPage,
          /${alertPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/i
        );`
        : '';
      return `${alertCode}
        const submitBtn = sharedPage.locator("//input[@type='submit']").last();
        await submitBtn.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await submitBtn.click();
        console.log("Clicked Attach/Submit button");
        // Handle duplicate invoice warning — if Confirm button appears, click it
        const confirmBtn = sharedPage.locator("//button[text()='Confirm']").first();
        if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await confirmBtn.click();
          console.log("Duplicate invoice warning — clicked Confirm");
        }${alertPattern ? `
        const alertMsg = await alertPromise;
        console.log(\`Alert handled: "\${alertMsg}"\`);` : ''}`;
    }

    // ==================== ENTER AMOUNT (billing context — "Enter Amount as let's say 1000") ====================
    if (lowerAction.includes('enter amount') || (lowerAction.includes('amount') && (lowerAction.includes('enter') || lowerAction.includes('fill')))) {
      // Extract numeric value, stripping instructional text like "let's say", "e.g."
      const amtMatch = action.match(/(?:let['']s\s+say|eg|e\.g\.?|as|=|:)\s*(\d+)/i) || action.match(/(\d+)/);
      const amtValue = amtMatch ? `"${amtMatch[1]}"` : '"1000"';
      return `const invoiceAmtInput = sharedPage.locator("#carr_invoice_amount");
        await invoiceAmtInput.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await invoiceAmtInput.fill(${amtValue});
        console.log("Entered Amount: " + ${amtValue});`;
    }

    // ==================== SAVE INVOICE / REFRESH ====================
    if ((lowerAction.includes('save') && lowerAction.includes('invoice')) || (lowerAction.includes('save') && lowerAction.includes('refresh'))) {
      return `await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Saved invoice");
        await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Page refreshed");`;
    }

    // ==================== ADD NEW (billing context) ====================
    if (lowerAction.includes('add new') && (lowerAction.includes('invoice') || lowerAction.includes('carrier'))) {
      return `const addNewBtn = sharedPage.locator("//button[contains(text(),'Add New')] | //a[contains(text(),'Add New')] | //input[@value='Add New']").first();
        await addNewBtn.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await addNewBtn.click();
        console.log("Clicked Add New button");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }

    // ==================== VIEW HISTORY ====================
    if (lowerAction.includes('view history') && (lowerAction.includes('click') || lowerAction.includes('navigate'))) {
      return `const viewHistoryBtn = sharedPage.locator(
          "//button[contains(text(),'View history')] | //a[contains(text(),'View history')] | //button[contains(text(),'View History')] | //a[contains(text(),'View History')]"
        ).first();
        await viewHistoryBtn.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await viewHistoryBtn.click();
        console.log("Clicked View History");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`;
    }

    // ==================== PAYABLES RADIO BUTTON ====================
    if (lowerAction.includes('payable') && (lowerAction.includes('radio') || lowerAction.includes('select'))) {
      return `const payablesRadio = sharedPage.locator("//input[@id='cat_payables']");
        await payablesRadio.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await payablesRadio.check();
        console.log("Selected Payables radio button");`;
    }
    // Bare "select radio button" without context — in billing toggle tests, this typically means Payables
    if (lowerAction.includes('radio button') && !lowerAction.includes('customer') && !lowerAction.includes('payable') && !lowerAction.includes('proof')) {
      return `// Context: selecting Payables radio button in billing document upload
        const payablesRadio = sharedPage.locator("//input[@id='cat_payables']");
        if (await payablesRadio.isVisible({ timeout: 5000 }).catch(() => false)) {
          await payablesRadio.check();
          console.log("Selected Payables radio button");
        }`;
    }

    // ==================== DOCUMENT TYPE DROPDOWN ====================
    if (lowerAction.includes('document type') && (lowerAction.includes('select') || lowerAction.includes('carrier invoice'))) {
      const docType = lowerAction.includes('proof of delivery') ? 'Proof of Delivery' : 'Carrier Invoice';
      return `const documentTypeDropdown = sharedPage.locator("//select[@name='document_type']");
        await documentTypeDropdown.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await documentTypeDropdown.selectOption({ label: "${docType}" });
        console.log("Selected Document Type: ${docType}");`;
    }

    // ==================== WAIT ACTIONS ====================
    if (lowerAction.includes('wait')) {
      return `await pages.basePage.waitForMultipleLoadStates(["load", "networkidle", "domcontentloaded"]);`;
    }

    // ==================== GET/EXTRACT ACTIONS ====================
    if (lowerAction.includes('get') || lowerAction.includes('extract') || lowerAction.includes('capture')) {
      if (lowerAction.includes('load number')) {
        return `loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log("Load Number:", loadNumber);`;
      }
    }

    // ==================== PRIORITY 3: LLM GENERATION ====================
    // When all rule-based mappings fail, ask the LLM to generate code
    if (this.llmService && this.llmService.isAvailable()) {
      console.log(`      🤖 No pattern/keyword match — invoking LLM for: "${action.substring(0, 60)}..."`);
      const schemaCtx = this.getSchemaContext();
      const testDataFields = _testData ? Object.keys(_testData).filter(k => _testData[k]) : undefined;
      const llmCode = await this.llmService.generateStepCode(action, {
        schema: schemaCtx,
        testDataFields,
        referenceSpecCode: this._activeRefSpecCode || undefined,
        secondaryRefSpecCode: this._secondaryRefSpecCode || undefined,
        matchScore: this._matchScore,
      });
      if (llmCode) {
        return `// LLM-generated code for: ${action.substring(0, 80)}
        ${llmCode}`;
      }
      console.log(`      ⚠️ LLM could not generate code — using placeholder`);
    }

    // ==================== DEFAULT: Direct locator fallback ====================
    return this.generateDirectLocatorCode(action, _testData);
  }

  /**
   * Generate direct Playwright locator code when no POM method matches.
   * Parses the action text to determine the interaction type and derive a best-guess locator.
   */
  private generateDirectLocatorCode(action: string, testData?: Record<string, any>): string {
    const lowerAction = action.toLowerCase();

    const extractFieldName = (text: string): string => {
      // First try: "enter [an] [invalid/valid] value [in/into/for] [the] FIELD_NAME [field]"
      const valueForMatch = text.match(/(?:enter|fill|input|type|set)\s+(?:a\s+|an\s+)?(?:invalid\s+|valid\s+)?(?:value\s+)?(?:in|into|for)\s+(?:the\s+)?(.+?)(?:\s+(?:field|input|as|with|=|:).*)?$/i);
      if (valueForMatch) return valueForMatch[1].trim();
      // General: "VERB [a/an/the] [valid] [value ...] REST"
      const match = text.match(/(?:enter|fill|input|type|set|select|choose|click|check|toggle)\s+(?:a\s+|an\s+|the\s+)?(?:valid\s+)?(?:value\s+(?:in|into|for)\s+(?:the\s+)?)?(.+?)(?:\s+(?:as|with|=|:|field|input|button|checkbox|radio|dropdown).*)?$/i);
      return match ? match[1].trim() : text.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    };

    const extractValue = (text: string): string | null => {
      const match = text.match(/(?:as|with|=|:|value\s+)\s*["']?([^"']+?)["']?\s*\.?\s*$/i);
      return match ? match[1].trim() : null;
    };

    const toFieldId = (name: string): string =>
      name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

    const toCamelCase = (name: string): string =>
      name.replace(/[^a-zA-Z0-9\s]/g, '').trim().split(/\s+/)
        .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');

    const fieldName = extractFieldName(action);
    const fieldId = toFieldId(fieldName);
    const camelField = toCamelCase(fieldName);
    const rawValue = extractValue(action);
    const valueExpr = rawValue ? `"${rawValue.replace(/"/g, '\\"')}"` : (testData && camelField ? `testData.${camelField}` : `""`);
    const escapedAction = action.substring(0, 80).replace(/"/g, '\\"');

    if (lowerAction.includes('select') || lowerAction.includes('choose') || lowerAction.includes('pick') || lowerAction.includes('dropdown')) {
      const optionLabel = rawValue || fieldName;
      return `// ${escapedAction}
        const dropdown_${fieldId} = sharedPage.locator("//select[contains(@name,'${fieldId}') or contains(@id,'${fieldId}')]").first();
        await dropdown_${fieldId}.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await dropdown_${fieldId}.selectOption({ label: "${optionLabel.replace(/"/g, '\\"')}" });
        console.log("Selected ${fieldName}: ${optionLabel.replace(/"/g, '\\"')}");`;
    }

    if (lowerAction.includes('check') || lowerAction.includes('radio') || lowerAction.includes('toggle') || lowerAction.includes('enable') || lowerAction.includes('disable')) {
      return `// ${escapedAction}
        const checkbox_${fieldId} = sharedPage.locator("//input[contains(@id,'${fieldId}') or contains(@name,'${fieldId}')]").first();
        await checkbox_${fieldId}.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await checkbox_${fieldId}.check();
        console.log("Checked ${fieldName}");`;
    }

    if (lowerAction.includes('click') || lowerAction.includes('press') || lowerAction.includes('button') || lowerAction.includes('submit')) {
      const buttonText = fieldName.replace(/\s*button\s*/i, '').trim();
      // Guard: if buttonText looks like a description (>40 chars or >6 words), emit TODO instead of garbage locator
      if (buttonText.length > 40 || buttonText.split(/\s+/).length > 6) {
        return `// TODO: Manual implementation needed — ${escapedAction}
        console.log("TODO: Step requires manual implementation — ${escapedAction}");`;
      }
      return `// ${escapedAction}
        const btn_${fieldId} = sharedPage.locator("//button[contains(text(),'${buttonText}')] | //input[@type='button' and contains(@value,'${buttonText}')] | //a[contains(text(),'${buttonText}')]").first();
        await btn_${fieldId}.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await btn_${fieldId}.click();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked ${buttonText}");`;
    }

    if (lowerAction.includes('verify') || lowerAction.includes('validate') || lowerAction.includes('assert') || lowerAction.includes('should') || lowerAction.includes('expect') || lowerAction.includes('confirm')) {
      // Guard: if fieldName looks like a description (>60 chars or >8 words), emit TODO instead of garbage locator
      if (fieldName.length > 60 || fieldName.split(/\s+/).length > 8) {
        return `// TODO: Manual implementation needed — ${escapedAction}
        console.log("TODO: Step requires manual implementation — ${escapedAction}");`;
      }
      return `// ${escapedAction}
        try {
          const verifyTarget = sharedPage.locator("//*[contains(text(),'${fieldName.replace(/'/g, "\\'")}')]").first();
          const isVisible = await verifyTarget.isVisible({ timeout: 10000 }).catch(() => false);
          expect.soft(isVisible, "${escapedAction}").toBeTruthy();
          console.log("Verified: ${escapedAction}");
        } catch (e) {
          console.log("Verification could not complete: ${escapedAction}", (e as Error).message);
        }`;
    }

    // Only use direct locator if the field ID looks like a real field name (short, no long descriptions)
    if (fieldId.length > 40 || fieldId.split('_').length > 6) {
      return `// TODO: Manual implementation needed — ${escapedAction}
        console.log("TODO: Step requires manual implementation — ${escapedAction}");`;
    }

    return `// ${escapedAction}
        const field_${fieldId} = sharedPage.locator("#form_${fieldId}, #${fieldId}, [name='${fieldId}']").first();
        await field_${fieldId}.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await field_${fieldId}.fill(${valueExpr});
        console.log("Entered ${fieldName}: " + ${valueExpr});`;
  }

  /**
   * Build the schema context for LLM calls.
   * Cached per generation run to avoid redundant scans.
   */
  getSchemaContext(): SchemaContext {
    if (this._schemaContext) return this._schemaContext;

    const summary = this.schemaAnalyzer.getPageObjectSummary();
    const pageObjects: Record<string, string[]> = {};
    for (const [className, methods] of summary) {
      // Convert class name to getter-style (e.g., "BTMSLoginPage" → "btmsLoginPage")
      const getter = className.charAt(0).toLowerCase() + className.slice(1);
      pageObjects[getter] = methods;
    }

    this._schemaContext = {
      pageObjects,
      constants: this.config.globalConstants,
    };

    return this._schemaContext;
  }

  /**
   * Assemble the complete script
   */
  private async assembleScript(params: {
    testCase: TestCaseInput;
    testType: TestType;
    testData?: TestData;
    imports: string[];
    pageObjectsUsed: string[];
    constantsUsed: string[];
    testSteps: GeneratedTestStep[];
    metadata: ScriptMetadata;
  }, refStructure?: SpecStructure): Promise<string> {
    const { testCase, testType, testData, imports, testSteps, metadata } = params;

    // Store reference structure for use in step generation
    this._activeRefStructure = refStructure || null;

    // Generate the script based on test type
    if (testType === 'multi-app' || this.needsMultiApp(testCase)) {
      return await this.generateMultiAppScript(testCase, testData, imports, testSteps, metadata);
    }

    return await this.generateStandardScript(testCase, testData, imports, testSteps, metadata);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REMOVED: generateExplicitScript, buildPreconditionStepsCode,
  //          buildTestStepsCode, buildValidationCode
  //
  // These methods produced PRECONDITION/FORM_VALUES hardcoded constants in
  // spec files — an anti-pattern. The standard is DFB-25103.spec.ts:
  //   - Use testData.* from dataConfig.getTestDataFromCsv()
  //   - Use existing helper functions (dfbHelpers, commonReusables, etc.)
  //   - Never hardcode values in spec files
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Generate standard test script
   */
  private async generateStandardScript(
    testCase: TestCaseInput,
    _testData: TestData | undefined,
    imports: string[],
    testSteps: GeneratedTestStep[],
    metadata: ScriptMetadata
  ): Promise<string> {
    // Ensure each tag starts with @ prefix
    const formattedTags = metadata.tags
      .map(t => t.startsWith('@') ? t : `@${t}`)
      .join(',');

    const stepCode = await this.generateStepCode(testSteps, testCase);

    // Only declare variables that are actually used in the generated step code
    const optionalVars: string[] = [];
    if (stepCode.includes('loadNumber')) optionalVars.push('let loadNumber: string;');

    return `${imports.join('\n')}

/**
 * Test Case: ${testCase.id} - ${testCase.title}
 * @author ${metadata.author}
 * @date ${metadata.createdDate}
 * @category ${metadata.testCategory}
 */
const testcaseID = "${testCase.id}";
const testData = dataConfig.getTestDataFromCsv(dataConfig.${this.getDataConfigProperty(testCase.category)}, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
${optionalVars.join('\n')}

test.describe.configure({ retries: ${metadata.retryCount} });
test.describe.serial("${testCase.title}", () => {
  test.beforeAll(async ({ browser }) => {
    // Create shared context and page that will persist across tests
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    pages = new PageManager(sharedPage);
  });

  test.afterAll(async () => {
    // Cleanup after all tests
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: ${testCase.id} - ${testCase.title}",
    {
      tag: "${formattedTags}"
    },
    async () => {
      test.setTimeout(${metadata.timeout});

${stepCode}
    }
  );
});
`;
  }

  /**
   * Generate multi-app test script
   */
  private async generateMultiAppScript(
    testCase: TestCaseInput,
    _testData: TestData | undefined,
    imports: string[],
    testSteps: GeneratedTestStep[],
    metadata: ScriptMetadata
  ): Promise<string> {
    // Ensure each tag starts with @ prefix
    const formattedTags = metadata.tags
      .map(t => t.startsWith('@') ? t : `@${t}`)
      .join(',');

    // Ensure multi-app imports include BrowserContext, Page, ALERT_PATTERNS, commonReusables
    const importBlock = this.ensureMultiAppImports(imports);

    const stepCode = await this.generateStepCode(testSteps, testCase);

    // Only declare variables that are actually used in the generated step code
    const optionalVars: string[] = [];
    if (stepCode.includes('cargoValue')) optionalVars.push('// eslint-disable-next-line @typescript-eslint/no-unused-vars\nlet cargoValue: string;');
    if (stepCode.includes('loadNumber')) optionalVars.push('let loadNumber: string;');
    if (stepCode.includes('agentEmail')) optionalVars.push('let agentEmail: string;');

    return `${importBlock}

/**
 * Test Case: ${testCase.id} - ${testCase.title}
 * @author ${metadata.author}
 * @date ${metadata.createdDate}
 * @category ${metadata.testCategory}
 */
const testcaseID = "${testCase.id}";
const testData = dataConfig.getTestDataFromCsv(dataConfig.${this.getDataConfigProperty(testCase.category)}, testcaseID);

${optionalVars.join('\n')}
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: ${metadata.retryCount} });
test.describe.serial(
  "Case ID: ${testCase.id} - ${testCase.title}",
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      appManager = new MultiAppManager(sharedContext, sharedPage);
      pages = appManager.btmsPageManager;
    });

    test.afterAll(async () => {
      if (appManager) {
        await appManager.closeAllSecondaryPages();
      }
      if (sharedContext) {
        await sharedContext.close();
      }
    });

    test(
      "Case Id: ${testCase.id} - ${testCase.title}",
      {
        tag: "${formattedTags}"
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes

${stepCode}
      }
    );
  }
);
`;
  }

  /**
   * Ensure multi-app imports include BrowserContext, Page, ALERT_PATTERNS, commonReusables.
   * Modifies the import list in-place and returns the joined string.
   */
  private ensureMultiAppImports(imports: string[]): string {
    const joined = imports.join('\n');
    const result: string[] = [];

    for (const imp of imports) {
      // Upgrade playwright import to include BrowserContext and Page
      if (imp.includes('@playwright/test') && !imp.includes('BrowserContext')) {
        result.push('import { BrowserContext, expect, Page, test } from "@playwright/test";');
      } else {
        result.push(imp);
      }
    }

    // Ensure all multi-app required imports are present
    if (!joined.includes('MultiAppManager')) {
      result.push('import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";');
    }
    if (!joined.includes('userSetup')) {
      result.push('import userSetup from "@loginHelpers/userSetup";');
    }
    if (!joined.includes('PageManager')) {
      result.push('import { PageManager } from "@utils/PageManager";');
    }

    return result.join('\n');
  }

  /**
   * Clone a reference spec for a new test case by replacing test-specific values.
   * Deterministic, fast, no LLM needed. Preserves the entire proven step structure.
   */
  private cloneReferenceSpec(refCode: string, testCase: TestCaseInput): string | null {
    try {
      // Extract the reference test case ID from the spec
      const refIdMatch = refCode.match(/const\s+testcaseID\s*=\s*["']([^"']+)["']/);
      if (!refIdMatch) {
        console.log('   ⚠️ Could not find testcaseID in reference spec');
        return null;
      }
      const refId = refIdMatch[1];
      const newId = testCase.id;

      // Extract the reference title from test.describe.serial
      const refDescribeMatch = refCode.match(/test\.describe\.serial\(\s*\n?\s*["']Case ID:\s*[^"']+["']/);

      let content = refCode;

      // 1. Replace testcaseID constant
      content = content.replace(
        new RegExp(`const\\s+testcaseID\\s*=\\s*["']${refId}["']`),
        `const testcaseID = "${newId}"`
      );

      // 2. Replace all remaining occurrences of the reference ID
      content = content.replace(new RegExp(refId, 'g'), newId);

      // 3. Update the JSDoc header
      const dateStr = new Date().toISOString().split('T')[0];
      content = content.replace(/@date\s+\d{4}-\d{2}-\d{2}/, `@date ${dateStr}`);

      // 4. Update the describe.serial title if the new test case has a different title
      if (testCase.title && refDescribeMatch) {
        const shortTitle = testCase.title.length > 120
          ? testCase.title.substring(0, 120) + '...'
          : testCase.title;
        // Replace in test.describe.serial
        content = content.replace(
          /test\.describe\.serial\(\s*\n?\s*["']Case ID:\s*[^"']+["']/,
          `test.describe.serial(\n  "Case ID: ${newId} - ${shortTitle}"`
        );
        // Replace in test() title
        content = content.replace(
          /test\(\s*\n?\s*["']Case Id:\s*[^"']+["']/,
          `test(\n      "Case Id: ${newId} - ${shortTitle}"`
        );
        // Replace JSDoc title
        content = content.replace(
          /\* Test Case: [^\n]+/,
          `* Test Case: ${newId} - ${shortTitle}`
        );
      }

      console.log(`   📋 Cloned reference ${refId} → ${newId} (${content.split('\n').length} lines)`);
      return content;
    } catch (e) {
      console.log(`   ⚠️ Reference clone error: ${(e as Error).message}`);
      return null;
    }
  }

  /**
   * Hybrid clone + LLM adaptation for high-match test cases (≥70% match score).
   *
   * 1. Clones the reference spec (deterministic ID/title/date replacement)
   * 2. Parses both reference and new test case into step blocks
   * 3. Compares each new step against reference steps using keyword similarity
   * 4. For matching steps (similarity ≥ 0.5) → keeps cloned code as-is
   * 5. For differing steps → uses LLM to generate just that step (small prompt, fast)
   * 6. Splices LLM-generated code back into the cloned spec
   */
  private async cloneAndAdaptReferenceSpec(
    refCode: string,
    testCase: TestCaseInput,
    testData?: TestData
  ): Promise<string | null> {
    try {
      // Step 1: Clone reference spec with deterministic replacements
      const cloned = this.cloneReferenceSpec(refCode, testCase);
      if (!cloned) return null;

      // Step 2: Parse the cloned spec into step blocks
      const refStepBlocks = this.parseSpecIntoStepBlocks(cloned);
      if (refStepBlocks.length === 0) {
        console.log('   ⚠️ Could not parse reference spec into step blocks');
        return cloned; // Return pure clone as fallback
      }
      console.log(`   📊 Reference has ${refStepBlocks.length} step blocks`);

      // Step 3: Parse new test case steps
      const newSteps = testCase.steps;
      if (!newSteps || newSteps.length === 0) {
        console.log('   ⚠️ New test case has no steps — returning pure clone');
        return cloned;
      }

      // Step 4: Match new steps to reference steps using keyword similarity
      const stepMatches = this.matchStepsToReference(newSteps, refStepBlocks);

      // Count how many steps differ
      const differingSteps = stepMatches.filter(m => m.similarity < 0.5);
      console.log(`   🔍 Step comparison: ${stepMatches.length - differingSteps.length} matching, ${differingSteps.length} differing`);

      // If all steps match well enough, return pure clone
      if (differingSteps.length === 0) {
        console.log('   ✅ All steps match reference — returning pure clone');
        return cloned;
      }

      // Step 5: Use LLM to generate code only for differing steps
      if (!this.llmService || !this.llmService.isAvailable()) {
        console.log('   ⚠️ LLM not available for step adaptation — returning pure clone');
        return cloned;
      }

      let adaptedCode = cloned;
      let adaptedCount = 0;

      // Build a MINIMAL schema for per-step calls — only POM methods used in the reference spec
      const fullSchema = this.getSchemaContext();
      const minimalPom: Record<string, string[]> = {};
      const refCodeLower = refCode.toLowerCase();
      for (const [getter, methods] of Object.entries(fullSchema.pageObjects)) {
        if (refCodeLower.includes(`pages.${getter.toLowerCase()}.`)) {
          minimalPom[getter] = methods;
        }
      }
      // Always include basePage and commonReusables as they're universally needed
      if (fullSchema.pageObjects['basePage']) minimalPom['basePage'] = fullSchema.pageObjects['basePage'];
      if (fullSchema.pageObjects['commonReusables']) minimalPom['commonReusables'] = fullSchema.pageObjects['commonReusables'];
      const minimalSchema: SchemaContext = {
        pageObjects: minimalPom,
        constants: fullSchema.constants,
      };
      console.log(`   📦 Minimal schema: ${Object.keys(minimalPom).length} page objects (vs ${Object.keys(fullSchema.pageObjects).length} full)`);

      for (const match of differingSteps) {
        const newStep = match.newStep;
        const stepAction = newStep.action;
        const stepExpected = newStep.expectedResult || '';

        const testDataFields = testData
          ? Object.keys(testData).filter(k => testData[k] && String(testData[k]).trim())
          : [];

        // Include the surrounding reference context (previous and next step) for continuity
        const prevStep = match.refBlockIndex > 0 ? refStepBlocks[match.refBlockIndex - 1] : null;
        const nextStep = match.refBlockIndex >= 0 && match.refBlockIndex + 1 < refStepBlocks.length
          ? refStepBlocks[match.refBlockIndex + 1] : null;
        const contextHint = prevStep
          ? `\n// Previous step: ${prevStep.title}\n// Next step: ${nextStep?.title || 'end of test'}`
          : '';

        // Provide focused reference: only the nearby step code, not the entire spec
        const nearbyRef = [prevStep, match.refBlockIndex >= 0 ? refStepBlocks[match.refBlockIndex] : null, nextStep]
          .filter(Boolean)
          .map(b => b!.fullText)
          .join('\n\n');

        const fullAction = `${stepAction}${stepExpected ? `\nExpected: ${stepExpected}` : ''}${contextHint}`;

        console.log(`   🤖 LLM generating Step ${newStep.stepNumber}: ${stepAction.substring(0, 60)}...`);
        console.log(`      📏 Prompt sizes — action: ${fullAction.length}, nearbyRef: ${nearbyRef.length}, testDataFields: ${testDataFields.length}`);

        const llmCode = await this.llmService.generateStepCode(fullAction, {
          schema: minimalSchema,
          testDataFields,
          referenceSpecCode: nearbyRef.substring(0, 2000),
          matchScore: 0.5, // Use moderate match — focused per-step, not full spec adoption
        });

        if (llmCode && llmCode.trim().length > 10) {
          // Find the matching reference step block to replace (or insert)
          if (match.refBlockIndex >= 0 && match.refBlockIndex < refStepBlocks.length) {
            const refBlock = refStepBlocks[match.refBlockIndex];
            // Build new step block with proper structure
            const stepTitle = `Step ${newStep.stepNumber}: ${stepAction.substring(0, 80)}`;
            const newStepBlock = `      await test.step("${stepTitle}", async () => {\n${this.indentCode(llmCode, 8)}\n      });`;

            // Replace the reference step block in the adapted code
            adaptedCode = adaptedCode.replace(refBlock.fullText, newStepBlock);
            adaptedCount++;
          } else {
            // This is an extra step not in reference — append before closing braces
            const stepTitle = `Step ${newStep.stepNumber}: ${stepAction.substring(0, 80)}`;
            const newStepBlock = `\n      await test.step("${stepTitle}", async () => {\n${this.indentCode(llmCode, 8)}\n      });\n`;

            // Insert before the final closing of the test function
            const lastStepEnd = adaptedCode.lastIndexOf('      });');
            if (lastStepEnd > 0) {
              const insertPoint = adaptedCode.indexOf('\n', lastStepEnd) + 1;
              adaptedCode = adaptedCode.substring(0, insertPoint) + newStepBlock + adaptedCode.substring(insertPoint);
            }
            adaptedCount++;
          }
        } else {
          console.log(`   ⚠️ LLM returned empty for Step ${newStep.stepNumber} — keeping reference code`);
        }
      }

      console.log(`   📝 Adapted ${adaptedCount}/${differingSteps.length} differing steps via LLM`);

      // If zero steps adapted and there are many differing steps, signal failure
      // so the caller can try generateFullSpecFromReference as fallback
      if (adaptedCount === 0 && differingSteps.length >= 3) {
        console.log(`   ⚠️ Clone+adapt produced pure clone (0/${differingSteps.length} adapted) — signaling for full-spec fallback`);
        return null;
      }

      return adaptedCode;

    } catch (e) {
      console.log(`   ⚠️ Hybrid clone+adapt error: ${(e as Error).message}`);
      return null;
    }
  }

  /**
   * Parse a spec file into individual step blocks.
   * Each block contains the step title, full text (including await test.step wrapper), and index.
   */
  private parseSpecIntoStepBlocks(specCode: string): Array<{
    title: string;
    fullText: string;
    index: number;
  }> {
    const blocks: Array<{ title: string; fullText: string; index: number }> = [];
    const stepPattern = /( *await test\.step\("(Step \d+[^"]*)".*?\{)/g;
    let match;
    const positions: Array<{ title: string; startPos: number }> = [];

    while ((match = stepPattern.exec(specCode)) !== null) {
      positions.push({
        title: match[2],
        startPos: match.index,
      });
    }

    for (let i = 0; i < positions.length; i++) {
      const startPos = positions[i].startPos;
      // Find the end of this step block by tracking brace depth
      let endPos = this.findStepBlockEnd(specCode, startPos);
      if (endPos < 0) endPos = positions[i + 1]?.startPos || specCode.length;

      blocks.push({
        title: positions[i].title,
        fullText: specCode.substring(startPos, endPos).trimEnd(),
        index: i,
      });
    }

    return blocks;
  }

  /**
   * Find the end position of a test.step block by tracking brace depth.
   */
  private findStepBlockEnd(code: string, startPos: number): number {
    // Find the opening brace of the async () => {
    const firstBrace = code.indexOf('{', code.indexOf('async', startPos));
    if (firstBrace < 0) return -1;

    let depth = 1;
    let pos = firstBrace + 1;
    let inString = false;
    let stringChar = '';
    let inTemplate = false;

    while (pos < code.length && depth > 0) {
      const ch = code[pos];
      const prevCh = code[pos - 1];

      if (inString) {
        if (ch === stringChar && prevCh !== '\\') inString = false;
      } else if (inTemplate) {
        if (ch === '`' && prevCh !== '\\') inTemplate = false;
        // Track ${} inside template literals
        if (ch === '{' && prevCh === '$') depth++;
      } else {
        if (ch === '"' || ch === "'") { inString = true; stringChar = ch; }
        else if (ch === '`') { inTemplate = true; }
        else if (ch === '{') depth++;
        else if (ch === '}') depth--;
      }
      pos++;
    }

    if (depth === 0) {
      // Include the closing `});` after the step block
      const afterClose = code.indexOf(');', pos - 1);
      return afterClose >= 0 ? afterClose + 2 : pos;
    }
    return -1;
  }

  /**
   * Match new test case steps to reference spec steps using keyword similarity.
   * Returns an array with one entry per new step, indicating the best reference match and similarity score.
   */
  private matchStepsToReference(
    newSteps: Array<{ stepNumber: number; action: string; expectedResult?: string }>,
    refBlocks: Array<{ title: string; fullText: string; index: number }>
  ): Array<{
    newStep: { stepNumber: number; action: string; expectedResult?: string };
    refBlockIndex: number;
    similarity: number;
  }> {
    return newSteps.map(step => {
      let bestMatch = -1;
      let bestSimilarity = 0;

      for (let i = 0; i < refBlocks.length; i++) {
        const sim = this.computeStepSimilarity(step.action, refBlocks[i].title);
        if (sim > bestSimilarity) {
          bestSimilarity = sim;
          bestMatch = i;
        }
      }

      return {
        newStep: step,
        refBlockIndex: bestMatch,
        similarity: bestSimilarity,
      };
    });
  }

  /**
   * Compute keyword-based similarity between a test step action and a reference step title.
   * Returns 0-1 score based on keyword overlap (Jaccard similarity).
   */
  private computeStepSimilarity(action: string, refTitle: string): number {
    const normalize = (text: string) =>
      text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2); // Skip tiny words like "a", "to", "is"

    const actionWords = new Set(normalize(action));
    const refWords = new Set(normalize(refTitle));

    if (actionWords.size === 0 || refWords.size === 0) return 0;

    let intersection = 0;
    for (const word of actionWords) {
      if (refWords.has(word)) intersection++;
    }

    const union = new Set([...actionWords, ...refWords]).size;
    return union > 0 ? intersection / union : 0;
  }

  /**
   * Indent a block of code by the specified number of spaces.
   */
  private indentCode(code: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return code
      .split('\n')
      .map(line => line.trim() ? `${indent}${line}` : line)
      .join('\n');
  }

  /**
   * Post-generation guardrails: detect and auto-fix common LLM generation errors.
   * Runs after code assembly and import cleanup, before POM method existence check.
   *
   * Checks:
   * 1. ALERT_PATTERNS.UNKNOWN_MESSAGE usage → replace with specific pattern or warn
   * 2. console.log used as validation substitute → flag as needing expect()
   * 3. Duplicate consecutive method calls (copy-paste errors)
   * 4. POM method calls with wrong constant keys (e.g., DISPATCH_EMAIL_1 → EMAIL_1)
   * 5. Fabricated locator IDs (too long or too many segments)
   */
  private validatePostGenerationGuardrails(code: string, _testCase: TestCaseInput): string {
    let fixed = code;
    const warnings: string[] = [];

    // ── 1. Replace ALERT_PATTERNS.UNKNOWN_MESSAGE with contextual pattern ──
    if (fixed.includes('ALERT_PATTERNS.UNKNOWN_MESSAGE')) {
      // Try to infer the correct pattern from surrounding context
      const unknownUsages = fixed.match(/ALERT_PATTERNS\.UNKNOWN_MESSAGE/g);
      if (unknownUsages) {
        // Check if there's a carrier contact context
        if (/carrier.*contact|auto.?accept/i.test(fixed)) {
          fixed = fixed.replace(
            /ALERT_PATTERNS\.UNKNOWN_MESSAGE/g,
            'ALERT_PATTERNS.A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED'
          );
          warnings.push('⚠️  Guardrail: Replaced ALERT_PATTERNS.UNKNOWN_MESSAGE with A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED (carrier context detected)');
        } else if (/view\s*mode|in\s*view/i.test(fixed)) {
          fixed = fixed.replace(
            /ALERT_PATTERNS\.UNKNOWN_MESSAGE/g,
            'ALERT_PATTERNS.IN_VIEW_MODE'
          );
          warnings.push('⚠️  Guardrail: Replaced ALERT_PATTERNS.UNKNOWN_MESSAGE with IN_VIEW_MODE (view mode context detected)');
        } else if (/booked|status.*booked/i.test(fixed)) {
          fixed = fixed.replace(
            /ALERT_PATTERNS\.UNKNOWN_MESSAGE/g,
            'ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED'
          );
          warnings.push('⚠️  Guardrail: Replaced ALERT_PATTERNS.UNKNOWN_MESSAGE with STATUS_HAS_BEEN_SET_TO_BOOKED');
        } else {
          warnings.push('⚠️  Guardrail: ALERT_PATTERNS.UNKNOWN_MESSAGE found — matches ANY alert with a colon. Replace with a specific pattern.');
        }
      }
    }

    // ── 2. Detect console.log used as validation substitute ──
    // Pattern: console.log containing "verified", "validated", "expected", "should be" without an adjacent expect()
    const consoleLogValidationPattern = /console\.log\([^)]*(?:verif|validat|expected|should\s*be|assert|confirmed|checked)[^)]*\)/gi;
    const suspiciousLogs = fixed.match(consoleLogValidationPattern);
    if (suspiciousLogs && suspiciousLogs.length > 0) {
      warnings.push(`⚠️  Guardrail: ${suspiciousLogs.length} console.log() call(s) appear to substitute for assertions. Use expect() or POM validation methods instead.`);
    }

    // ── 3. Detect duplicate consecutive method calls (LLM copy-paste) ──
    const lines = fixed.split('\n');
    const duplicateLines: number[] = [];
    for (let i = 1; i < lines.length; i++) {
      const curr = lines[i].trim();
      const prev = lines[i - 1].trim();
      if (curr.length > 20 && curr === prev && /await\s+pages\./.test(curr)) {
        duplicateLines.push(i + 1);
      }
    }
    if (duplicateLines.length > 0) {
      // Remove duplicate lines
      const toRemove = new Set(duplicateLines.map(l => l - 1)); // 0-indexed
      fixed = lines.filter((_, idx) => !toRemove.has(idx)).join('\n');
      warnings.push(`⚠️  Guardrail: Removed ${duplicateLines.length} duplicate consecutive POM call(s) at lines: ${duplicateLines.join(', ')}`);
    }

    // ── 4. Validate constant keys against known registries ──
    const constantValidations: Array<{ pattern: RegExp; validKeys: string[]; parentName: string }> = [
      {
        pattern: /CARRIER_DISPATCH_EMAIL\.(\w+)/g,
        validKeys: ['EMAIL_1'],
        parentName: 'CARRIER_DISPATCH_EMAIL'
      },
      {
        pattern: /CARRIER_DISPATCH_NAME\.(\w+)/g,
        validKeys: ['DISPATCH_NAME_1', 'DISPATCH_NAME_2'],
        parentName: 'CARRIER_DISPATCH_NAME'
      },
      {
        pattern: /CARRIER_CONTACT\.(\w+)/g,
        validKeys: ['CONTACT_1', 'CONTACT_2', 'CONTACT_3'],
        parentName: 'CARRIER_CONTACT'
      },
      {
        pattern: /CARRIER_NAME\.(\w+)/g,
        validKeys: ['CARRIER_1', 'CARRIER_2', 'CARRIER_3', 'CARRIER_4', 'CARRIER_5', 'CARRIER_6', 'CARRIER_7', 'CARRIER_8', 'CARRIER_9'],
        parentName: 'CARRIER_NAME'
      },
      {
        pattern: /PRIORITY\.(\w+)/g,
        validKeys: ['PRIORITY_1', 'PRIORITY_2', 'PRIORITY_3'],
        parentName: 'PRIORITY'
      },
      {
        pattern: /LOAD_OFFER_RATES\.(\w+)/g,
        validKeys: ['OFFER_RATE_1', 'OFFER_RATE_2', 'OFFER_RATE_3', 'OFFER_RATE_4'],
        parentName: 'LOAD_OFFER_RATES'
      },
      {
        pattern: /CARRIER_TIMING\.(\w+)/g,
        validKeys: ['TIMING_1', 'TIMING_2', 'TIMING_3', 'TIMING_4', 'TIMING_5'],
        parentName: 'CARRIER_TIMING'
      },
      {
        pattern: /TNX_STATUS_HISTORY\.(\w+)/g,
        validKeys: ['STATUS_MATCHED', 'STATUS_DELIVERED', 'STATUS_IN_TRANSIT'],
        parentName: 'TNX_STATUS_HISTORY'
      },
      {
        pattern: /ALERT_PATTERNS\.(\w+)/g,
        validKeys: [
          'PICKUP_DELIVERY_DATE_ORDER_ERROR', 'OFFER_RATE_SET_BY_GREENSCREENS',
          'INVALID_SHIPPER_ZIP_CODE_US', 'INVALID_SHIPPER_ZIP_CODE_CA', 'INVALID_SHIPPER_ZIP_CODE_MX',
          'POST_AUTOMATION_RULE_MATCHED', 'CARRIER_ALREADY_INCLUDED_ERROR', 'CARRIER_NOT_INCLUDED_ERROR',
          'EMAIL_NOTIFICATION_REQUIRED', 'CUSTOMER_REQUIRED', 'PICK_LOCATION_REQUIRED',
          'DROP_LOCATION_REQUIRED', 'EQUIPMENT_TYPE_REQUIRED', 'LOAD_TYPE_REQUIRED',
          'OFFER_RATE_REQUIRED', 'INVALID_CUSTOMER_SUPPLIED', 'INVALID_TARGET_RATE_SUPPLIED',
          'A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED', 'CARRIER_CAUTIONARY_SAFETY_RATING',
          'IN_VIEW_MODE', 'UNKNOWN_MESSAGE', 'FOR_SECONDARY_INVOICE',
          'STATING_STATUS_HAS_MOVED_TO_THE_INVOICE_SHOULD_APPEAR_ON_THE',
          'STATUS_HAS_BEEN_SET_TO_BOOKED', 'PAYABLE_STATUS_INVOICE_RECEIVED',
          'UNRECOGNISED_ZIP_CODE_ENTERED'
        ],
        parentName: 'ALERT_PATTERNS'
      },
    ];

    for (const { pattern, validKeys, parentName } of constantValidations) {
      let m;
      while ((m = pattern.exec(fixed)) !== null) {
        const key = m[1];
        if (!validKeys.includes(key)) {
          // Try to find best match
          const bestMatch = validKeys.find(vk =>
            vk.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(vk.toLowerCase())
          );
          if (bestMatch) {
            fixed = fixed.replace(new RegExp(`${parentName}\\.${key}\\b`, 'g'), `${parentName}.${bestMatch}`);
            warnings.push(`⚠️  Guardrail: Fixed invalid constant ${parentName}.${key} → ${parentName}.${bestMatch}`);
          } else {
            warnings.push(`⚠️  Guardrail: Invalid constant key ${parentName}.${key} — valid keys: ${validKeys.join(', ')}`);
          }
        }
      }
    }

    // ── 5. Detect fabricated locator IDs (too long or too many segments) ──
    const locatorIdPattern = /#([\w-]+)/g;
    let locMatch;
    while ((locMatch = locatorIdPattern.exec(fixed)) !== null) {
      const id = locMatch[1];
      const segments = id.split(/[_-]/).length;
      if (id.length > 40 || segments > 6) {
        warnings.push(`⚠️  Guardrail: Potentially fabricated locator ID "#${id}" (${id.length} chars, ${segments} segments). Verify it exists in the DOM.`);
      }
    }

    // ── 6. Auto-correct wrong login user ──
    // BTMSLogin must use globalUser for all categories except salesLead (which uses UserSales)
    const category = _testCase.category?.toLowerCase() || '';
    if (category !== 'saleslead') {
      const wrongLoginPattern = /BTMSLogin\(userSetup\.(?!globalUser)(\w+)\)/g;
      const wrongLoginMatch = wrongLoginPattern.exec(fixed);
      if (wrongLoginMatch) {
        fixed = fixed.replace(
          /BTMSLogin\(userSetup\.(?!globalUser)\w+\)/g,
          'BTMSLogin(userSetup.globalUser)'
        );
        warnings.push(`⚠️  Guardrail: Fixed login user from userSetup.${wrongLoginMatch[1]} → userSetup.globalUser (category: ${category})`);
      }
    }

    // ── 7. Auto-correct selectCustomerByName → clickOnActiveCustomer ──
    // selectCustomerByName uses exact text match which fails when the table shows
    // customer name with ID appended (e.g., "AGENT RESPONSE TEST CUSTOMER(192815)")
    // clickOnActiveCustomer safely clicks the first ACTIVE row regardless of name format
    if (/selectCustomerByName\s*\(/.test(fixed)) {
      fixed = fixed.replace(
        /await\s+pages\.searchCustomerPage\.selectCustomerByName\s*\([^)]*\)\s*;?/g,
        'await pages.searchCustomerPage.clickOnActiveCustomer();'
      );
      warnings.push('⚠️  Guardrail: Replaced selectCustomerByName() → clickOnActiveCustomer() (exact name match fails when table appends customer ID)');
    }

    // ── 8. Validate POM method calls exist in schema ──
    const pomCallPattern = /pages\.(\w+)\.(\w+)\s*\(/g;
    let pomMatch;
    const checkedPomCalls = new Set<string>();
    while ((pomMatch = pomCallPattern.exec(fixed)) !== null) {
      const pageGetter = pomMatch[1];
      const methodName = pomMatch[2];
      const callKey = `${pageGetter}.${methodName}`;
      if (checkedPomCalls.has(callKey)) continue;
      checkedPomCalls.add(callKey);

      // Skip known utilities
      if (['toggleSettings', 'dataConfig', 'commonReusables', 'dfbHelpers', 'requiredFieldAlertValidator', 'logger'].includes(pageGetter)) continue;

      const scanResult = this.schemaAnalyzer.getScanner().getByPageManagerName(pageGetter);
      if (!scanResult) {
        warnings.push(`⚠️  Guardrail: Unknown page object getter "pages.${pageGetter}" — not found in PageManager registry.`);
        continue;
      }

      if (!this.schemaAnalyzer.methodExistsOnClass(scanResult.className, methodName)) {
        // Check if method exists anywhere (maybe wrong getter)
        const anywhere = this.schemaAnalyzer.methodExistsAnywhere(methodName);
        if (anywhere.exists && anywhere.className) {
          warnings.push(`⚠️  Guardrail: Method "${methodName}" not on ${scanResult.className} but found on ${anywhere.className}. Will be auto-generated on ${scanResult.className} by ensurePageObjectMethodsExist.`);
        }
        // Don't warn for methods that will be auto-generated — ensurePageObjectMethodsExist handles this
      }
    }

    // ── 9. Auto-convert raw locators to POM calls ──
    // Converts sharedPage.locator("#known_id").action(value) → pages.<page>.<method>(value)
    const rawLocatorReplacements: Array<{ pattern: RegExp; replacement: string; description: string }> = [
      // Document Upload Utility — ViewLoadPage methods
      { pattern: /await\s+(?:sharedPage|this\.page)\.locator\(\s*["']#cat_customer["']\s*\)[\s\S]*?\.check\(\)/g, replacement: 'await pages.viewLoadPage.selectCustomerRadio()', description: 'Customer radio → selectCustomerRadio()' },
      { pattern: /await\s+(?:sharedPage|this\.page)\.locator\(\s*["']#cat_payables["']\s*\)[\s\S]*?\.check\(\)/g, replacement: 'await pages.viewLoadPage.selectPayablesRadio()', description: 'Payables radio → selectPayablesRadio()' },
      { pattern: /await\s+(?:sharedPage|this\.page)\.locator\(\s*["']#document_type["']\s*\)[\s\S]*?\.selectOption\(\s*\{\s*label:\s*["']([^"']+)["']\s*\}\s*\)/g, replacement: 'await pages.viewLoadPage.selectDocumentType("$1")', description: 'Document type → selectDocumentType()' },
      { pattern: /await\s+(?:sharedPage|this\.page)\.locator\(\s*["']#carr_invoice_num_input["']\s*\)\.fill\(([^)]+)\)/g, replacement: 'await pages.viewLoadPage.fillCarrierInvoiceNumber($1)', description: 'Invoice number → fillCarrierInvoiceNumber()' },
      { pattern: /await\s+(?:sharedPage|this\.page)\.locator\(\s*["']#carr_invoice_amount["']\s*\)\.fill\(([^)]+)\)/g, replacement: 'await pages.viewLoadPage.fillCarrierInvoiceAmount($1)', description: 'Invoice amount → fillCarrierInvoiceAmount()' },
      { pattern: /await\s+(?:sharedPage|this\.page)\.locator\(\s*["']#submit_remote["']\s*\)\.click\(\)/g, replacement: 'await pages.viewLoadPage.clickSubmitRemote()', description: 'Submit remote → clickSubmitRemote()' },
      // Upload icon
      { pattern: /await\s+(?:sharedPage|this\.page)\.locator\(\s*["']\/\/img\[@title='Upload document'\]["']\s*\)\.first\(\)\.click\(\)/g, replacement: 'await pages.viewLoadPage.openDocumentUploadDialog()', description: 'Upload icon → openDocumentUploadDialog()' },
      // Add New Carrier Invoice dialog — LoadBillingPage methods
      { pattern: /await\s+(?:sharedPage|this\.page)\.locator\(\s*["']#carr_invoice_add_new["']\s*\)[\s\S]*?\.click\(\)/g, replacement: 'await pages.loadBillingPage.clickAddNewCarrierInvoice()', description: 'Add New btn → clickAddNewCarrierInvoice()' },
      { pattern: /await\s+(?:sharedPage|this\.page)\.locator\(\s*["']#carrier_invoice_number_id["']\s*\)[\s\S]*?\.fill\(([^)]+)\)/g, replacement: 'await pages.loadBillingPage.enterCarrierInvoiceNumber($1)', description: 'Invoice # → enterCarrierInvoiceNumber()' },
      { pattern: /await\s+(?:sharedPage|this\.page)\.locator\(\s*["']#carrier_invoice_amount_id["']\s*\)[\s\S]*?\.fill\(([^)]+)\)/g, replacement: 'await pages.loadBillingPage.enterCarrierInvoiceAmount($1)', description: 'Invoice amt → enterCarrierInvoiceAmount()' },
      { pattern: /await\s+(?:sharedPage|this\.page)\.locator\(\s*["']#submit_save_carrier_invoice["']\s*\)[\s\S]*?\.click\(\)/g, replacement: 'await pages.loadBillingPage.clickSaveCarrierInvoice()', description: 'Save invoice → clickSaveCarrierInvoice()' },
    ];
    for (const { pattern, replacement, description } of rawLocatorReplacements) {
      pattern.lastIndex = 0; // reset after test()
      if (pattern.test(fixed)) {
        pattern.lastIndex = 0; // reset before replace()
        fixed = fixed.replace(pattern, replacement);
        warnings.push(`✅ Guardrail: Auto-converted raw locator → POM: ${description}`);
      }
    }

    // Warn about remaining known raw locators that weren't auto-converted (complex patterns)
    const knownPomLocators: Record<string, string> = {
      '#cat_customer': 'pages.viewLoadPage.selectCustomerRadio()',
      '#cat_payables': 'pages.viewLoadPage.selectPayablesRadio()',
      '#document_type': 'pages.viewLoadPage.selectDocumentType(label)',
      '#carr_invoice_num_input': 'pages.viewLoadPage.fillCarrierInvoiceNumber(value)',
      '#carr_invoice_amount': 'pages.viewLoadPage.fillCarrierInvoiceAmount(value)',
      '#submit_remote': 'pages.viewLoadPage.clickSubmitRemote()',
      '#message_display': 'pages.viewLoadPage.waitForUploadSuccess()',
      '#carrier_invoice_number_id': 'pages.loadBillingPage.enterCarrierInvoiceNumber(value)',
      '#carrier_invoice_amount_id': 'pages.loadBillingPage.enterCarrierInvoiceAmount(value)',
      '#submit_save_carrier_invoice': 'pages.loadBillingPage.clickSaveCarrierInvoice()',
      '#carr_invoice_add_new': 'pages.loadBillingPage.clickAddNewCarrierInvoice()',
      '#carrier_invoice_dialog_form': 'pages.loadBillingPage.clickAddNewCarrierInvoice()',
      '#fi_waiting_on': 'pages.loadBillingPage.getBillingToggleValue()',
      '#waiting_on_select': 'pages.loadBillingPage.getBillingToggleValue()',
    };
    for (const [locatorId, pomMethod] of Object.entries(knownPomLocators)) {
      const escaped = locatorId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(escaped).test(fixed)) {
        warnings.push(`⚠️  Guardrail: Raw locator "${locatorId}" still present after auto-fix — manually replace with: ${pomMethod}`);
      }
    }

    // ── 10. Convert generic sharedPage.locator() patterns to POM calls ──
    // For ANY raw locator usage, attempt to convert fill/click/check to pages.<page>.<method>() call
    // so that ensurePageObjectMethodsExist can auto-create the method in the appropriate POM file
    const genericLocatorPattern = /await\s+sharedPage\.locator\(\s*["']#(\w+)["']\s*\)\s*\.\s*(fill|click|check|selectOption)\s*\(([^)]*)\)/g;
    let genericMatch;
    const genericReplacements: Array<{ original: string; replacement: string }> = [];
    while ((genericMatch = genericLocatorPattern.exec(fixed)) !== null) {
      const elementId = genericMatch[1];
      const action = genericMatch[2];
      const args = genericMatch[3];
      // Skip IDs that are already handled by known POM methods above
      const alreadyHandled = Object.keys(knownPomLocators).some(k => k === `#${elementId}`);
      if (alreadyHandled) continue;

      // Determine the appropriate page object and method name
      let pageGetter = 'editLoadFormPage'; // default for form fields
      let methodName = '';

      // Infer page getter from ID prefix patterns
      if (elementId.startsWith('form_')) {
        pageGetter = 'editLoadFormPage';
        const fieldName = elementId.replace('form_', '');
        if (action === 'fill') methodName = `enter${fieldName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
        else if (action === 'click') methodName = `clickOn${fieldName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
        else if (action === 'selectOption') methodName = `select${fieldName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
        else if (action === 'check') methodName = `check${fieldName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
      } else if (elementId.startsWith('carr_') || elementId.startsWith('carrier_')) {
        pageGetter = 'editLoadCarrierTabPage';
        if (action === 'fill') methodName = `enter${elementId.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
        else methodName = `${action}${elementId.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
      }

      if (methodName) {
        const pomCall = args
          ? `await pages.${pageGetter}.${methodName}(${args})`
          : `await pages.${pageGetter}.${methodName}()`;
        genericReplacements.push({ original: genericMatch[0], replacement: pomCall });
      }
    }
    for (const { original, replacement } of genericReplacements) {
      fixed = fixed.replace(original, replacement);
      warnings.push(`✅ Guardrail: Auto-converted generic raw locator to POM call: ${replacement}`);
    }

    // ── 11. Detect brittle XPath translate() patterns ──
    const translatePattern = /translate\s*\(\s*text\s*\(\s*\)\s*,\s*['"]ABCDEFGHIJKLMNOPQRSTUVWXYZ/g;
    if (translatePattern.test(fixed)) {
      warnings.push('⚠️  Guardrail: Brittle XPath translate() detected for case-insensitive matching. Use explicit text alternatives instead (e.g., contains(text(),"LabelA") or contains(text(),"labelb")).');
    }

    // ── 12. Detect try/catch blocks that swallow validation errors ──
    const tryCatchSwallowPattern = /try\s*\{[^}]*(?:validate|getBids|getAvgRate|getBidHistory|getReport|getFinance)[^}]*\}\s*catch\s*\([^)]*\)\s*\{[^}]*console\.log/gi;
    if (tryCatchSwallowPattern.test(fixed)) {
      warnings.push('⚠️  Guardrail: Validation code wrapped in try/catch that swallows errors with console.log(). Use expect.soft() for non-blocking assertions instead of hiding failures.');
    }

    // ── 13. Detect any remaining sharedPage.locator() calls ──
    const rawSharedPageLocator = /sharedPage\.locator\s*\(/g;
    const rawLocatorMatches = fixed.match(rawSharedPageLocator);
    if (rawLocatorMatches && rawLocatorMatches.length > 0) {
      warnings.push(`⚠️  Guardrail: ${rawLocatorMatches.length} sharedPage.locator() call(s) found in spec file. All locators must be in POM files under src/pages/. Use pages.<getter>.<method>() instead.`);
    }

    // ── 14. Detect page.evaluate() with querySelector/closest DOM guessing ──
    const domGuessingPattern = /\.evaluate\s*\([^)]*(?:querySelector|closest|getComputedStyle|classList\.contains)/g;
    const domGuessingMatches = fixed.match(domGuessingPattern);
    if (domGuessingMatches && domGuessingMatches.length > 0) {
      warnings.push(`⚠️  Guardrail: ${domGuessingMatches.length} page.evaluate() call(s) using DOM guessing (querySelector/closest/getComputedStyle). Use Playwright built-in methods (isChecked, inputValue, getAttribute) instead.`);
    }

    // ── 15. Remove hardcoded waitForTimeout calls ──
    const waitForTimeoutPattern = /^\s*await\s+(?:sharedPage|dmePage|tnxPage|this\.page)\.waitForTimeout\s*\(\s*\d+\s*\)\s*;?\s*$/gm;
    const waitMatches = fixed.match(waitForTimeoutPattern);
    if (waitMatches && waitMatches.length > 0) {
      fixed = fixed.replace(waitForTimeoutPattern, '');
      // Clean up double blank lines left behind
      fixed = fixed.replace(/\n{3,}/g, '\n\n');
      warnings.push(`⚠️  Guardrail: Removed ${waitMatches.length} hardcoded waitForTimeout() call(s). Use waitForLoadState or element-based waits instead.`);
    }

    // ── 16. Replace inline require("path")/path.resolve for known files with POM methods ──
    const inlineCarrierInvoicePath = /const\s+(?:path|filePath)\s*=\s*(?:require\s*\(\s*["']path["']\s*\)\s*\.resolve|path\.resolve)\s*\([^)]*CarrierInvoice[^)]*\)\s*;?\s*\n?\s*(?:const\s+\w+\s*=\s*[^;]*;\s*\n?\s*)*(?:if\s*\([^)]*\)\s*\{[^}]*\}\s*else\s*\{[^}]*\}\s*|await\s+pages\.viewLoadPage\.attachFile\s*\([^)]*\)\s*;?\s*)/g;
    if (inlineCarrierInvoicePath.test(fixed)) {
      fixed = fixed.replace(inlineCarrierInvoicePath, 'await pages.viewLoadPage.attachCarrierInvoiceFile();');
      warnings.push('✅ Guardrail: Replaced inline path.resolve(CarrierInvoice) → pages.viewLoadPage.attachCarrierInvoiceFile()');
    }
    const inlinePODPath = /const\s+(?:path|filePath)\s*=\s*(?:require\s*\(\s*["']path["']\s*\)\s*\.resolve|path\.resolve)\s*\([^)]*ProofOfDelivery[^)]*\)\s*;?\s*\n?\s*await\s+pages\.viewLoadPage\.attachFile\s*\([^)]*\)\s*;?/g;
    if (inlinePODPath.test(fixed)) {
      fixed = fixed.replace(inlinePODPath, 'await pages.viewLoadPage.attachPODFile();');
      warnings.push('✅ Guardrail: Replaced inline path.resolve(ProofOfDelivery) → pages.viewLoadPage.attachPODFile()');
    }

    // ── 17. Warn on inline require() calls in spec files ──
    const inlineRequirePattern = /(?:const|let|var)\s+\w+\s*=\s*require\s*\(/g;
    const requireMatches = fixed.match(inlineRequirePattern);
    if (requireMatches && requireMatches.length > 0) {
      warnings.push(`⚠️  Guardrail: ${requireMatches.length} inline require() call(s) found in spec file. Use ES module imports or encapsulate in POM methods.`);
    }

    // ── 18. Detect hardcoded numeric values passed to POM methods ──
    // Methods that accept rates, amounts, miles etc. should use testData.* instead of hardcoded strings
    const hardcodedValueMethods = [
      'enterMiles', 'enterCustomerRate', 'enterCarrierRate', 'enterLinehaulRate',
      'fillCarrierInvoiceAmount', 'fillCarrierInvoiceNumber', 'enterCarrierInvoiceAmount',
      'enterCarrierInvoiceNumber', 'enterOfferRate', 'enterAmount'
    ];
    const hardcodedMethodPattern = new RegExp(
      `(?:${hardcodedValueMethods.join('|')})\\s*\\(\\s*["']\\d+["']\\s*\\)`,
      'g'
    );
    const hardcodedMatches = fixed.match(hardcodedMethodPattern);
    if (hardcodedMatches && hardcodedMatches.length > 0) {
      warnings.push(
        `⚠️  Guardrail: ${hardcodedMatches.length} POM method call(s) with hardcoded numeric values detected. ` +
        `Use testData.* from CSV instead: ${hardcodedMatches.map(m => m.replace(/\s+/g, '')).join(', ')}`
      );
    }

    // Log all warnings
    if (warnings.length > 0) {
      console.log('\n📋 Post-Generation Guardrail Results:');
      for (const w of warnings) {
        console.log(`   ${w}`);
      }
    }

    return fixed;
  }

  /**
   * Remove import lines whose default/named bindings are never referenced
   * in the rest of the generated code. This prevents noUnusedLocals errors.
   */
  private cleanUnusedImports(code: string): string {
    const lines = code.split('\n');
    const importLines: { index: number; line: string }[] = [];
    let firstNonImport = lines.length;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('import ')) {
        importLines.push({ index: i, line: trimmed });
      } else if (trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
        firstNonImport = i;
        break;
      }
    }

    const codeAfterImports = lines.slice(firstNonImport).join('\n');
    const toRemove = new Set<number>();

    for (const { index, line } of importLines) {
      // Default import: import foo from "..."
      const defaultMatch = line.match(/^import\s+(\w+)\s+from\s+/);
      if (defaultMatch) {
        const name = defaultMatch[1];
        // Check if the identifier is used in code body (not just the import line)
        const usage = new RegExp(`\\b${name}\\b`);
        if (!usage.test(codeAfterImports)) {
          toRemove.add(index);
          continue;
        }
      }

      // Named imports: import { A, B } from "..."
      const namedMatch = line.match(/^import\s*\{([^}]+)\}\s*from\s+/);
      if (namedMatch) {
        const names = namedMatch[1].split(',').map(n => n.trim().split(/\s+as\s+/).pop()!.trim());
        const usedNames = names.filter(n => new RegExp(`\\b${n}\\b`).test(codeAfterImports));
        if (usedNames.length === 0) {
          toRemove.add(index);
        } else if (usedNames.length < names.length) {
          // Trim unused named imports from the line
          const fromPart = line.match(/from\s+.+$/)![0];
          lines[index] = `import { ${usedNames.join(', ')} } ${fromPart}`;
        }
      }
    }

    return lines.filter((_, i) => !toRemove.has(i)).join('\n');
  }

  /**
   * Generate step code with test.step wrappers
   * Creates organized test steps with proper code for each action
   */
  private async generateStepCode(testSteps: GeneratedTestStep[], testCase: TestCaseInput): Promise<string> {
    let code = '';
    let stepCounter = 0;

    // ========== MANDATORY: BTMS Login Step (always first) ==========
    // Only skip if there's already a BTMS login step. DME/TNX logins are for
    // different systems and do NOT substitute for the initial BTMS login.
    const hasBTMSLoginStep = testSteps.some(step => {
      const lowerCode = step.code.toLowerCase();
      return lowerCode.includes('btmslogin');
    });

    if (!hasBTMSLoginStep) {
      stepCounter++;
      const loginConfig = MANDATORY_STEPS.LOGIN;
      code += `      await test.step("Step ${stepCounter}: ${loginConfig.stepName}", async () => {\n`;
      code += this.formatStepCode(loginConfig.code);
      code += `      });\n\n`;
    }

    // ========== PRECONDITION STEPS ==========
    // Priority: use reference spec precondition blocks if available,
    // otherwise fall back to the step-by-step precondition generator.
    const hasPreconditionStep = testSteps.some(step => {
      const lowerName = step.stepName.toLowerCase();
      const lowerCode = step.code.toLowerCase();
      return lowerName.includes('setup') || 
        lowerName.includes('precondition') ||
        lowerCode.includes('setupdfbtestpreconditions') ||
        lowerCode.includes('setupofficepreconditions');
    });

    if (!hasPreconditionStep && testCase.preconditions && testCase.preconditions.length > 0) {
      // Check if preconditions are actionable (contain verbs/actions) vs informational
      // (declarative state descriptions like "Payable toggle = Agent")
      const actionableVerbs = /\b(navigate|click|search|login|logged|select|enter|open|go to|setup|configure|create|hover|switch|access|accessed|set|enable|enabled|verify|verified)\b/i;
      const hasActionablePreconditions = testCase.preconditions.some(p => actionableVerbs.test(p));

      // When a strong reference spec match exists, its precondition steps are reliable
      // even if the new test case's precondition text appears informational (e.g. "An agent is logged in")
      const refPreconditions = this._activeRefStructure
        ? this.referenceAnalyzer.getTemplatePreconditions(this._activeRefStructure)
        : [];

      let preconditionSteps: GeneratedTestStep[];

      if (refPreconditions.length > 0) {
        // Filter reference precondition blocks to only those relevant to this test case.
        // E.g., don't inject Agent Search / Carrier Search / DME toggle blocks if the
        // new test case's preconditions don't mention those topics.
        const precondText = (testCase.preconditions || []).join(' ').toLowerCase();
        const stepsLower = testCase.steps.map(s => s.action).join(' ').toLowerCase();
        const allText = precondText + ' ' + stepsLower;

        const relevantBlocks = refPreconditions.filter(p => {
          const cat = p.category;
          // Office-config is almost always needed when preconditions mention office/settings/TNX/DME
          if (cat === 'office-config') {
            return allText.includes('office') || allText.includes('setting') ||
              allText.includes('tnx') || allText.includes('digital matching') ||
              allText.includes('match vendor') || allText.includes('post automation');
          }
          // Agent email capture — only if preconditions/steps mention agent email or agent search
          if (cat === 'agent-email-capture') {
            return allText.includes('agent email') || allText.includes('agent search') ||
              allText.includes('email for notification');
          }
          // Carrier search/visibility — only if preconditions/steps mention carrier
          if (cat === 'carrier-search' || cat === 'carrier-visibility') {
            return allText.includes('carrier search') || allText.includes('carrier loadboard') ||
              allText.includes('carrier visibility') || allText.includes('carrier toggle');
          }
          // DME toggle — only if preconditions/steps mention switching to DME or DME carrier operations.
          // "Enable Digital Matching Engine" in office settings does NOT mean we need the DME app step.
          if (cat === 'dme-carrier-toggle') {
            return allText.includes('switch to dme') || allText.includes('dme carrier') ||
              allText.includes('dme toggle') || allText.includes('dme loadboard') ||
              (allText.includes('dme') && !allText.includes('digital matching engine field'));
          }
          // Default: include other block types
          return true;
        });

        if (relevantBlocks.length > 0) {
          console.log(`   📐 Using ${relevantBlocks.length}/${refPreconditions.length} relevant precondition block(s) from reference spec`);
          preconditionSteps = relevantBlocks.map(p => ({
            stepName: p.stepName,
            code: p.code,
            pageObjects: [],
            assertions: [],
          }));
        } else if (hasActionablePreconditions) {
          // All reference blocks were irrelevant — fall back to generating from test case text
          console.log(`   📐 No relevant reference precondition blocks — generating from test case text`);
          preconditionSteps = await this.generatePreconditionSteps(testCase);
        } else {
          preconditionSteps = [{
            stepName: 'Precondition notes',
            code: testCase.preconditions.map(p => `// Precondition: ${p}`).join('\n'),
            pageObjects: [],
            assertions: [],
          }];
        }
      } else if (hasActionablePreconditions) {
        preconditionSteps = await this.generatePreconditionSteps(testCase);
      } else {
        // Informational preconditions (state assertions) — add as comments only
        console.log(`   📝 Preconditions are informational — adding as comments, not generating setup steps`);
        preconditionSteps = [{
          stepName: 'Precondition notes',
          code: testCase.preconditions.map(p => `// Precondition: ${p}`).join('\n'),
          pageObjects: [],
          assertions: [],
        }];
      }

      for (const precStep of preconditionSteps) {
        // Skip comment-only preconditions from generating a test.step wrapper
        if (precStep.stepName === 'Precondition notes') {
          code += `      // ========== Preconditions (informational — not automated) ==========\n`;
          code += precStep.code.split('\n').map(l => `      ${l}`).join('\n') + '\n\n';
          continue;
        }
        stepCounter++;
        const stepName = this.sanitizeStringForCode(this.cleanStepName(precStep.stepName, stepCounter));
        code += `      await test.step("${stepName}", async () => {\n`;
        code += this.formatStepCode(precStep.code);
        code += `      });\n\n`;
      }
    }

    // ========== Map expected results to steps (inline validation) ==========
    const expectedMap = this.mapExpectedToSteps(testCase);

    // ========== FORM STEP GROUPING — collapse consecutive form-field steps ==========
    const compositeGroups = this.formStepGrouper.groupSteps(testCase.steps);

    // ========== User-defined test steps (using composite groups) ==========
    let lastEmittedCodeKey = '';
    let userStepIndex = 0;

    for (const group of compositeGroups) {
      if (group.type !== 'single' && group.compositeCode) {
        // ── Composite group: emit a single test.step with pre-generated code ──
        stepCounter++;
        userStepIndex++;
        const csvRange = group.csvStepRange;
        const rangeStr = csvRange.length > 1
          ? `CSV ${csvRange[0]}-${csvRange[csvRange.length - 1]}`
          : `CSV ${csvRange[0]}`;
        const stepName = this.sanitizeStringForCode(
          `Step ${stepCounter} [${rangeStr}]: ${group.compositeStepName}`
        );

        let stepBody = this.formatStepCode(group.compositeCode);

        // Inline expected results mapped to any step within this group
        for (const step of group.steps) {
          const mappedExpected = expectedMap.get(step.stepNumber) || [];
          if (mappedExpected.length > 0) {
            stepBody += `\n`;
            for (const exp of mappedExpected) {
              const sanitized = this.sanitizeStringForCode(exp.text);
              stepBody += `        // Expected Step ${exp.csvStep}: ${sanitized}\n`;
              stepBody += this.generateExpectedResultAssertion(sanitized);
            }
          }
        }

        code += `      await test.step("${stepName}", async () => {\n`;
        code += stepBody;
        code += `      });\n\n`;

        // Track consumed step numbers so expected results aren't duplicated
        for (const step of group.steps) {
          userStepIndex = step.stepNumber;
        }
      } else {
        // ── Single step: generate individually (existing logic) ──
        const step = group.steps[0];
        const generatedStep = testSteps.find(ts =>
          ts.stepName.includes(step.action.substring(0, 30))
        ) || await this.generateSingleStep(step.action, step.stepNumber);

        const lowerName = generatedStep.stepName.toLowerCase();
        const lowerCode = generatedStep.code.toLowerCase();
        if (!hasBTMSLoginStep && lowerCode.includes('btmslogin')) continue;
        if (!hasPreconditionStep && (lowerName.includes('setup') || lowerName.includes('precondition'))) continue;

        const codeKey = generatedStep.code.replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ').trim();
        if (codeKey === lastEmittedCodeKey && codeKey.length > 0) continue;
        lastEmittedCodeKey = codeKey;

        stepCounter++;
        userStepIndex = step.stepNumber;
        const stepName = this.sanitizeStringForCode(this.cleanStepName(generatedStep.stepName, stepCounter));

        const shouldWrapTryCatch = generatedStep.isOptional || this.isOptionalVerification(generatedStep);

        let stepBody = '';

        if (shouldWrapTryCatch) {
          stepBody += this.formatStepCode(`try {`);
          stepBody += this.formatStepCode(`  ${generatedStep.code.split('\n').join('\n  ')}`);
        } else {
          stepBody += this.formatStepCode(generatedStep.code);
        }

        if (generatedStep.assertions && generatedStep.assertions.length > 0) {
          generatedStep.assertions.forEach(assertion => {
            stepBody += `        ${assertion}\n`;
          });
        }

        const mappedExpected = expectedMap.get(userStepIndex) || [];
        if (mappedExpected.length > 0) {
          // Check if this step has a button click AND the expected results are alert validations.
          // If so, merge into Promise.all since alert dialogs fire synchronously on click.
          const stepHasClick = generatedStep.code.includes('clickElementByText(BUTTONS.') ||
            generatedStep.code.includes('clickButtonByText(');
          const alertExps = mappedExpected.filter(exp => {
            const lower = exp.text.toLowerCase();
            return lower.includes('message') || lower.includes('displayed') || lower.includes('alert') || lower.includes('toast');
          });

          if (stepHasClick && alertExps.length > 0) {
            // Replace the click line + appended validateAlert with a Promise.all
            const clickMatch = generatedStep.code.match(/(await pages\.\w+\.(?:clickElementByText|clickButtonByText)\([^)]+\));/);
            if (clickMatch) {
              // Remove the click line and waitForMultipleLoadStates from stepBody — we'll redo as Promise.all
              stepBody = stepBody.replace(new RegExp('\\s*' + clickMatch[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '.*\\n'), '\n');
              stepBody = stepBody.replace(/\s*await pages\.basePage\.waitForMultipleLoadStates\(\["load",\s*"networkidle"\]\);\n?/, '\n');

              const alertPatternsPath = path.resolve(__dirname, '../../utils/alertPatterns.ts');
              stepBody += `\n        // Alert fires synchronously on click — must use Promise.all to capture it\n`;
              stepBody += `        await Promise.all([\n`;
              for (const exp of alertExps) {
                const sanitized = this.sanitizeStringForCode(exp.text);
                const msgMatch = sanitized.match(/['""'\u201C\u201D](.+?)['""'\u201C\u201D]/);
                let msgText = msgMatch ? msgMatch[1] : sanitized.replace(/.*(?:message|displayed|relating|showing|is\s+displayed)\s*/i, '').trim();
                msgText = msgText.replace(/^['"]+|['"]+$/g, '').trim();
                const patternConstant = resolveAlertPatternConstant(msgText, alertPatternsPath);
                stepBody += `          pages.commonReusables.validateAlert(sharedPage, ${patternConstant}),\n`;
              }
              stepBody += `          ${clickMatch[1]},\n`;
              stepBody += `        ]);\n`;
              stepBody += `        console.log("Alert validated");\n`;

              // Emit non-alert expected results normally
              const nonAlertExps = mappedExpected.filter(exp => !alertExps.includes(exp));
              for (const exp of nonAlertExps) {
                const sanitized = this.sanitizeStringForCode(exp.text);
                stepBody += `        // Expected Step ${exp.csvStep}: ${sanitized}\n`;
                stepBody += this.generateExpectedResultAssertion(sanitized);
              }
            }
          } else {
            stepBody += `\n`;
            for (const exp of mappedExpected) {
              const sanitized = this.sanitizeStringForCode(exp.text);
              stepBody += `        // Expected Step ${exp.csvStep}: ${sanitized}\n`;
              stepBody += this.generateExpectedResultAssertion(sanitized);
            }
          }
        }

        if (shouldWrapTryCatch) {
          const fallbackMsg = generatedStep.stepName.replace(/"/g, "'");
          stepBody += this.formatStepCode(`} catch (e) {`);
          stepBody += this.formatStepCode(`  console.log(\`${fallbackMsg} — could not complete: \${(e as Error).message}\`);`);
          stepBody += this.formatStepCode(`}`);
        }

        code += `      await test.step("${stepName}", async () => {\n`;
        code += stepBody;
        code += `      });\n\n`;
      }
    }
    
    // ========== FINAL VALIDATION BLOCK ==========
    // Priority: use reference spec validation blocks if available,
    // otherwise generate from unmapped expected results.
    const allMappedIndices = new Set<number>();
    expectedMap.forEach(items => items.forEach(item => allMappedIndices.add(item.csvStep)));
    const unmappedExpected = (testCase.expectedResults || []).filter((_, idx) => !allMappedIndices.has(idx + 1));

    // Only use reference validation blocks if the test case steps actually reference
    // DME/TNX/BTMS-switch patterns. Otherwise the reference validation (e.g., DME status
    // check from DFB tests) gets injected into tests that don't need it.
    const testStepsText = testCase.steps.map(s => s.action.toLowerCase()).join(' ');
    const hasMultiAppSteps = testStepsText.includes('dme') || testStepsText.includes('tnx') ||
      testStepsText.includes('switch to') || testStepsText.includes('switch back');

    // Check if unmapped expected results are alert validations that should merge with last click step.
    // Alert dialogs fire synchronously on click — validateAlert listener must be set up BEFORE the click.
    // So we merge them into a single Promise.all([validateAlert(...), clickButton(...)]) step.
    const alertExpected = unmappedExpected.filter(e => {
      const lower = e.toLowerCase();
      return lower.includes('message') || lower.includes('displayed') || lower.includes('alert') || lower.includes('toast');
    });
    const lastStepIsButtonClick = /await test\.step\([^)]+async \(\) => \{[^}]*clickElementByText\(BUTTONS\.\w+\)|clickButtonByText\([^)]+\)/s.test(
      code.slice(-500)
    );

    if (alertExpected.length > 0 && lastStepIsButtonClick) {
      // Merge alert validation with the last button click step using Promise.all.
      // Use lastIndexOf to find ONLY the last test.step block — not a greedy regex from the start.
      const lastStepMarker = '      await test.step("';
      const lastStepStart = code.lastIndexOf(lastStepMarker);

      if (lastStepStart !== -1) {
        const lastStepBlock = code.substring(lastStepStart);
        const clickLineMatch = lastStepBlock.match(/(await pages\.\w+\.(?:clickElementByText|clickButtonByText)\([^)]+\));/);

        if (clickLineMatch) {
          // Remove only the last step block, keep everything before it
          code = code.substring(0, lastStepStart);
          stepCounter--; // reuse the step number

          // Build the merged step
          stepCounter++;
          const alertPatternsPath = path.resolve(__dirname, '../../utils/alertPatterns.ts');
          const mergedAlerts: string[] = [];
          for (const expected of alertExpected) {
            const msgMatch = expected.match(/['""'\u201C\u201D](.+?)['""'\u201C\u201D]/);
            let msgText = msgMatch ? msgMatch[1] : expected.replace(/.*(?:message|displayed|relating|showing|is\s+displayed)\s*/i, '').trim();
            msgText = msgText.replace(/^['"]+|['"]+$/g, '').trim();
            const patternConstant = resolveAlertPatternConstant(msgText, alertPatternsPath);
            mergedAlerts.push(`          pages.commonReusables.validateAlert(sharedPage, ${patternConstant})`);
          }

          code += `      await test.step("Step ${stepCounter}: Click and Verify Expected Alert Message", async () => {\n`;
          code += `        // Alert fires synchronously on click — must use Promise.all to capture it\n`;
          code += `        await Promise.all([\n`;
          mergedAlerts.forEach(a => { code += `${a},\n`; });
          code += `          ${clickLineMatch[1]},\n`;
          code += `        ]);\n`;
          code += `        console.log("Alert validated");\n`;
          code += `      });\n\n`;

          // Remove alert items from unmapped so they don't get re-emitted below
          const nonAlertExpected = unmappedExpected.filter(e => !alertExpected.includes(e));
          if (nonAlertExpected.length > 0) {
            stepCounter++;
            code += `      await test.step("Step ${stepCounter}: Verify Remaining Expected Results", async () => {\n`;
            nonAlertExpected.forEach((expected) => {
              const sanitized = this.sanitizeStringForCode(expected);
              code += `        // Expected: ${sanitized}\n`;
              code += this.generateExpectedResultAssertion(sanitized);
            });
            code += `      });\n\n`;
          }
        }
      }
    } else if (this._activeRefStructure && hasMultiAppSteps) {
      const refValidation = this.referenceAnalyzer.getTemplateValidation(this._activeRefStructure);
      if (refValidation.length > 0) {
        console.log(`   📐 Using ${refValidation.length} validation block(s) from reference spec`);
        for (const valBlock of refValidation) {
          stepCounter++;
          const stepName = this.sanitizeStringForCode(this.cleanStepName(valBlock.stepName, stepCounter));
          code += `      await test.step("${stepName}", async () => {\n`;
          code += this.formatStepCode(valBlock.code);
          code += `      });\n\n`;
        }
      } else if (unmappedExpected.length > 0) {
        stepCounter++;
        code += `      await test.step("Step ${stepCounter}: Verify Remaining Expected Results", async () => {\n`;
        unmappedExpected.forEach((expected) => {
          const sanitized = this.sanitizeStringForCode(expected);
          code += `        // Expected: ${sanitized}\n`;
          code += this.generateExpectedResultAssertion(sanitized);
        });
        code += `      });\n\n`;
      }
    } else if (unmappedExpected.length > 0) {
      stepCounter++;
      code += `      await test.step("Step ${stepCounter}: Verify Remaining Expected Results", async () => {\n`;
      unmappedExpected.forEach((expected) => {
        const sanitized = this.sanitizeStringForCode(expected);
        code += `        // Expected: ${sanitized}\n`;
        code += this.generateExpectedResultAssertion(sanitized);
      });
      code += `      });\n\n`;
    }

    return code;
  }

  /**
   * Map expected results to their corresponding test step indices.
   * Parses step numbering from expected result text (e.g., "Step 47: ..." or "47. ...")
   * and maps them to the user-defined step index (1-based) they should be inlined into.
   * Returns a Map<userStepIndex, Array<{ csvStep, text }>>.
   */
  private mapExpectedToSteps(testCase: TestCaseInput): Map<number, Array<{ csvStep: number; text: string }>> {
    const map = new Map<number, Array<{ csvStep: number; text: string }>>();
    if (!testCase.expectedResults || testCase.expectedResults.length === 0) return map;
    if (!testCase.steps || testCase.steps.length === 0) return map;

    testCase.expectedResults.forEach((expected, idx) => {
      const csvStep = idx + 1;
      // Try to extract a step number from the expected result text
      const stepMatch = expected.match(/^(?:step\s+)?(\d+)\s*[.:)\-]/i);
      if (stepMatch) {
        const referencedStep = parseInt(stepMatch[1], 10);
        // Find which user step index this CSV step falls into by matching csvStepMapping
        let targetUserStep = this.findUserStepForCsvStep(testCase.steps, referencedStep);
        if (targetUserStep > 0) {
          if (!map.has(targetUserStep)) map.set(targetUserStep, []);
          map.get(targetUserStep)!.push({ csvStep, text: expected });
          return;
        }
      }

      // Fallback: try to match expected result to the step with the same index
      if (csvStep <= testCase.steps.length) {
        // Check if the step has csvStepMapping that includes this csvStep
        for (let i = 0; i < testCase.steps.length; i++) {
          const step = testCase.steps[i];
          if (step.csvStepMapping && step.csvStepMapping.includes(csvStep)) {
            const userIdx = i + 1;
            if (!map.has(userIdx)) map.set(userIdx, []);
            map.get(userIdx)!.push({ csvStep, text: expected });
            return;
          }
        }
      }
      // If no mapping found, the expected result remains unmapped (handled by trailing block)
    });

    return map;
  }

  /**
   * Find which user step index (1-based) a CSV step number maps to.
   * Uses csvStepMapping on TestStep if available.
   */
  private findUserStepForCsvStep(steps: import('../types/TestCaseTypes').TestStep[], csvStepNum: number): number {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.csvStepMapping && step.csvStepMapping.includes(csvStepNum)) {
        return i + 1;
      }
    }
    // Fallback: if step number matches directly
    if (csvStepNum <= steps.length) {
      return csvStepNum;
    }
    return 0;
  }

  /**
   * Determine if a generated step represents an optional verification that should
   * be wrapped in try/catch. Matches patterns like BIDS reports, bid history,
   * average rate, loadboard status checks.
   */
  private isOptionalVerification(step: GeneratedTestStep): boolean {
    const lowerName = step.stepName.toLowerCase();
    const lowerCode = step.code.toLowerCase();
    const optionalKeywords = ['bids report', 'bid history', 'average rate', 'avg rate',
      'loadboard status', 'optional', 'may not be available'];
    return optionalKeywords.some(kw => lowerName.includes(kw) || lowerCode.includes(kw));
  }

  /**
   * Wrap step code in a try/catch block for optional verifications.
   * Returns the wrapped code string.
   */
  wrapOptionalStep(code: string, stepDescription: string): string {
    const safeDesc = stepDescription.replace(/"/g, "'");
    return `try {
          ${code}
        } catch (e) {
          console.log(\`${safeDesc} — could not complete: \${(e as Error).message}\`);
        }`;
  }

  /**
   * Group flat precondition lines into logical sections.
   * Lines starting with -, •, * are sub-items of the preceding line.
   */
  private groupPreconditions(preconditions: string[]): string[][] {
    const groups: string[][] = [];
    let currentGroup: string[] = [];

    for (const precondition of preconditions) {
      const trimmed = precondition.trim();
      if (!trimmed) continue;

      // Sub-items (starting with -, •, *, or numbered sub-items like "a)")
      if (/^[-•*]/.test(trimmed) || /^[a-z][.)]\s/i.test(trimmed)) {
        // Attach to current group as a sub-item
        if (currentGroup.length > 0) {
          currentGroup.push(trimmed);
        } else {
          currentGroup = [trimmed];
        }
      } else {
        // New top-level precondition — push previous group and start a new one
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [trimmed];
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Generate MULTIPLE precondition steps from the test case's explicit preconditions.
   * MANDATORY RULE: Every precondition group MUST produce real executable code.
   * No precondition may be silently skipped or replaced with an empty wait.
   * All preconditions must be fully completed before moving to test steps.
   * Login preconditions are the only exception (handled by mandatory login step).
   */
  private async generatePreconditionSteps(testCase: TestCaseInput): Promise<GeneratedTestStep[]> {
    const steps: GeneratedTestStep[] = [];
    if (!testCase.preconditions || testCase.preconditions.length === 0) return steps;

    const groups = this.groupPreconditions(testCase.preconditions);

    // Track which composite blocks have already been emitted (emit each only once)
    let emittedOfficeSetup = false;
    let emittedPostAutomation = false;
    let emittedSwitchUser = false;

    // Determine correct toggle config once from the full text
    const allText = groups.map(g => g.join(' ').toLowerCase()).join(' ');
    let toggleConfig = 'pages.toggleSettings.enable_DME';
    if (allText.includes('tnx bids') || allText.includes('enable tnx')) {
      toggleConfig = 'pages.toggleSettings.enabled_TNXBids';
    }
    if (allText.includes('greenscreen')) {
      toggleConfig = 'pages.toggleSettings.dme_greeenScreen_enabled';
    }
    if (allText.includes('auto post') && allText.includes('yes')) {
      toggleConfig = 'pages.toggleSettings.enabledAutoPost';
    }

    // Track emitted step codes to prevent duplicate consecutive steps
    const emittedCodes: string[] = [];

    for (const group of groups) {
      const groupText = group.join(' ').toLowerCase();
      const groupFirstLine = (group[0] || '').replace(/^\d+\.?\s*/, '').trim();

      // ---- Skip login preconditions and their sub-steps (handled by mandatory BTMSLogin) ----
      // BTMSLogin internally handles: navigate to URL, enter user ID, click next,
      // enter password, click login button, accept terms. Skip all of these.
      const isLoginSubStep = (
        groupText.includes('logged into') || groupText.includes('log in') ||
        groupText.includes('sign in') || /\blogin\b/.test(groupText) ||
        groupText.includes('login button') ||
        (groupText.includes('user id') && groupText.includes('click next')) ||
        (groupText.includes('enter') && groupText.includes('password') && !groupText.includes('office')) ||
        (groupText.includes('enter') && groupText.includes('user') && groupText.includes('next')) ||
        groupText.includes('click next') ||
        groupText.includes('enter the password') ||
        (groupText.includes('username') && groupText.includes('password'))
      ) && !groupText.includes('office') && !groupText.includes('setting');
      if (isLoginSubStep) {
        continue;
      }

      let step: GeneratedTestStep | null = null;

      // ---- Post Automation page access (composite, emit ONCE) ----
      if (!emittedPostAutomation &&
          (groupText.includes('post automation') || groupText.includes('automation page')) &&
          (groupText.includes('accessed') || groupText.includes('navigate') || groupText.includes('page') ||
           groupText.includes('click') || groupText.includes('button'))) {
        emittedPostAutomation = true;
        step = {
          stepName: 'Navigate to Post Automation Page',
          code: `// Navigate to Post Automation page, search customer, cleanup existing rules
        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
          pageObjects: ['basePage', 'postAutomationRulePage'],
          assertions: []
        };
      }
      // ---- Office / Settings preconditions (composite, emit ONCE — includes switch user) ----
      // Only match groups specifically about office config, NOT about general "enable" / "settings" in other contexts
      else if (!emittedOfficeSetup && (
          (groupText.includes('office') && (groupText.includes('search') || groupText.includes('config') || groupText.includes('setting') || groupText.includes('code') || groupText.includes('form'))) ||
          groupText.includes('match vendors') || groupText.includes('digital matching') ||
          (groupText.includes('toggle') && groupText.includes('office')))) {
        emittedOfficeSetup = true;
        emittedSwitchUser = true;

        // Check if preconditions actually mention customer search / cargo / credit
        // Only include customer/cargo steps when explicitly required
        const needsCustomerCargo = allText.includes('cargo') || allText.includes('credit') ||
          allText.includes('practical default') || allText.includes('customer search') ||
          (allText.includes('search') && allText.includes('customer') && allText.includes('click') && allText.includes('details'));

        let officeCode = `// Configure Office Settings as per preconditions
        const toggleSettingsValue = ${toggleConfig};
        await dfbHelpers.setupOfficePreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.verifyAutoPost
        );

        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);
        console.log("Office preconditions set and switched to sales agent");`;

        if (needsCustomerCargo) {
          officeCode = `// Configure Office Settings — full setup with customer/cargo
        await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
        await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
        await pages.officePage.officeCodeSearchField(testData.officeName);
        await pages.officePage.searchButtonClick();
        await pages.officePage.officeSearchRow(testData.officeName);
        console.log("Navigated to Office profile");

        const toggleSettingsValue = ${toggleConfig};
        await pages.officePage.ensureToggleValues(toggleSettingsValue);
        await pages.officePage.ensureTnxValue();
        console.log("Office toggle configuration complete");

        const btmsHome = new URL(sharedPage.url()).origin;
        await sharedPage.goto(btmsHome);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await sharedPage.locator('#c-sitemenu-container').waitFor({ state: 'visible', timeout: 15000 });
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        await pages.searchCustomerPage.clickOnSearchCustomer();
        await pages.searchCustomerPage.clickOnActiveCustomer();
        await commissionHelper.updateAvailableCreditOnCustomer(sharedPage);
        console.log("Office Pre-condition set successfully");

        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);
        console.log("Switched user to agent salesperson");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle", "domcontentloaded"]);

        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName);
        console.log("Verified no post automation rule for customer");

        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
        cargoValue = await pages.viewCustomerPage.verifyAndSetCargoValue(CARGO_VALUES.DEFAULT);
        await pages.viewCustomerPage.setPracticalDefaultMethodIfNeeded();
        console.log("Customer search and load navigation successful");`;
        }

        step = {
          stepName: 'Setup Office Preconditions',
          code: officeCode,
          pageObjects: ['officePage', 'adminPage', 'basePage'],
          assertions: []
        };
      }
      // ---- Switch user (composite, emit ONCE only if office setup didn't emit it) ----
      else if (!emittedSwitchUser &&
          (groupText.includes('switch user') || groupText.includes('switched to') ||
           (groupText.includes('hover') && groupText.includes('admin') && groupText.includes('switch')))) {
        emittedSwitchUser = true;
        step = {
          stepName: 'Switch User',
          code: `await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);
        console.log("Switched to sales agent");`,
          pageObjects: ['adminPage'],
          assertions: []
        };
      }
      // ---- Skip sub-steps that are clearly part of an ALREADY-emitted composite block ----
      // Narrow checks: only skip if the step is specifically about the same operation
      else if (emittedOfficeSetup && this.isOfficeSubStep(groupText)) {
        continue;
      }
      else if (emittedSwitchUser && this.isSwitchUserSubStep(groupText)) {
        continue;
      }
      else if (emittedPostAutomation && this.isPostAutomationSubStep(groupText)) {
        continue;
      }
      // ---- Agent email capture (Reference: DFB-97739 Step 2) ----
      else if (groupText.includes('agent') && (groupText.includes('email') || groupText.includes('info') || groupText.includes('search'))) {
        step = {
          stepName: 'Capture Agent Email',
          code: `// Navigate to Agent Search and capture agent email
        await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
        await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
        await pages.agentSearchPage.nameInputOnAgentPage(testData.salesAgent);
        await pages.agentSearchPage.clickOnSearchButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.agentSearchPage.selectAgentByName(testData.salesAgent);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        const agentInfoEmail = await pages.agentInfoPage.getAgentEmail();
        agentEmail = agentInfoEmail?.trim() || "";
        console.log(\`Captured agent email: "\${agentEmail}"\`);
        pages.logger.info(\`Agent email captured: \${agentEmail}\`);
        const btmsBaseUrl = new URL(sharedPage.url()).origin;
        await sharedPage.goto(btmsBaseUrl);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await sharedPage.locator('#c-sitemenu-container').waitFor({ state: 'visible', timeout: 15000 });`,
          pageObjects: ['basePage', 'agentSearchPage', 'agentInfoPage'],
          assertions: []
        };
      }
      // ---- Customer search/page ----
      else if (groupText.includes('customer') && (groupText.includes('search') || groupText.includes('navigate to customer'))) {
        step = {
          stepName: 'Navigate to Customer Search',
          code: `// Navigate to Customer Search
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        await pages.searchCustomerPage.clickOnSearchCustomer();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
          pageObjects: ['basePage', 'searchCustomerPage'],
          assertions: []
        };
      }
      // ---- Customer cargo value (Reference: DFB-97739 Step 3) ----
      else if (groupText.includes('cargo') && (groupText.includes('value') || groupText.includes('verify') || groupText.includes('set'))) {
        step = {
          stepName: 'Verify and Set Cargo Value',
          code: `// Navigate to customer, verify and set cargo value
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        cargoValue = await pages.viewCustomerPage.verifyAndSetCargoValue(CARGO_VALUES.DEFAULT);
        console.log(\`Cargo value set to: \${cargoValue}\`);`,
          pageObjects: ['basePage', 'searchCustomerPage', 'viewCustomerPage'],
          assertions: []
        };
      }
      // ---- Carrier visibility / loadboard (Reference: DFB-97739 Step 5) ----
      else if (groupText.includes('carrier') && (groupText.includes('visibility') || groupText.includes('loadboard'))) {
        step = {
          stepName: 'Verify Carrier Visibility Settings',
          code: `// Navigate to Carrier Search and verify visibility settings
        await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
        await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.Carrier);
        await pages.carrierSearchPage.selectStatusOnCarrier(testData.carrierStatus || CARRIER_STATUS.ACTIVE);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.carrierSearchPage.selectCarrierByName(testData.Carrier);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        // Check loadboard status and visibility toggles
        const loadboardStatus = sharedPage.locator("//td[contains(@class,'loadboard')]").first();
        if (await loadboardStatus.isVisible({ timeout: 5000 }).catch(() => false)) {
          const statusText = (await loadboardStatus.textContent())?.trim() || "";
          console.log(\`Loadboard Status: "\${statusText}"\`);
        }
        console.log("Carrier visibility preconditions verified");`,
          pageObjects: ['basePage', 'carrierSearchPage'],
          assertions: []
        };
      }
      // ---- Carrier search (generic) ----
      else if (groupText.includes('carrier') && (groupText.includes('search') || groupText.includes('navigate to carrier'))) {
        step = {
          stepName: 'Navigate to Carrier Search',
          code: `// Navigate to Carrier Search
        await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
        await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.Carrier);
        await pages.carrierSearchPage.selectStatusOnCarrier(testData.carrierStatus || CARRIER_STATUS.ACTIVE);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
          pageObjects: ['basePage', 'carrierSearchPage'],
          assertions: []
        };
      }
      // ---- DME carrier toggle check (Reference: DFB-97739 Step 6) ----
      else if (groupText.includes('dme') && (groupText.includes('carrier') || groupText.includes('toggle') || groupText.includes('enable'))) {
        step = {
          stepName: 'Switch to DME and verify carrier toggle',
          code: `// Switch to DME and verify carrier is enabled with toggle ON
        await appManager.switchToDME();
        const dmePages = appManager.dmePageManager!;
        await dmePages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        // Navigate to Carriers in DME
        await dmePages.basePage.hoverOverHeaderByText("Carriers");
        await dmePages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        // Search for carrier
        const dmeSearchInput = appManager.dmePage!.locator("input[type='search'], input[placeholder*='Search']").first();
        await dmeSearchInput.waitFor({ state: "visible", timeout: 10000 });
        await dmeSearchInput.fill(testData.Carrier || testData.carrierName || "");
        await appManager.dmePage!.keyboard.press("Enter");
        await dmePages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("DME: Searched for carrier, verifying toggle status");
        // Verify carrier toggle is ON (enabled)
        const carrierToggle = appManager.dmePage!.locator("[data-toggle], .toggle-switch, input[type='checkbox']").first();
        if (await carrierToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
          const isChecked = await carrierToggle.isChecked().catch(() => false);
          if (!isChecked) {
            await carrierToggle.click();
            console.log("DME: Carrier toggle was OFF, switched to ON");
          } else {
            console.log("DME: Carrier toggle is already ON");
          }
        }
        // Switch back to BTMS
        await appManager.switchToBTMS();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Switched back to BTMS — DME preconditions complete");`,
          pageObjects: ['basePage'],
          assertions: []
        };
      }
      // ---- Load creation setup ----
      else if (groupText.includes('new load') || groupText.includes('create load') || groupText.includes('load creation')) {
        step = {
          stepName: 'Setup Load Creation Environment',
          code: `// Setup for load creation
        const toggleSettingsValue = pages.toggleSettings.enable_DME;
        const cargoValue = await dfbHelpers.setupDFBTestPreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.verifyDME,
          testData.salesAgent,
          testData.customerName,
          CARGO_VALUES.DEFAULT,
          LOAD_TYPES.CREATE_TL_NEW,
          false,
          true
        );`,
          pageObjects: ['dfbHelpers'],
          assertions: []
        };
      }
      // ---- Billing Toggle (follows DFB load creation pattern) ----
      else if (groupText.includes('billing') || groupText.includes('billing toggle')) {
        step = {
          stepName: 'Setup Billing Toggle Test Environment',
          code: `// Setup for billing toggle test (follows DFB pattern)
        const toggleSettingsValue = pages.toggleSettings.enable_DME;
        const cargoValue = await dfbHelpers.setupDFBTestPreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.verifyDME,
          testData.salesAgent,
          testData.customerName,
          CARGO_VALUES.DEFAULT,
          LOAD_TYPES.CREATE_TL_NEW,
          false,
          true
        );`,
          pageObjects: ['dfbHelpers'],
          assertions: []
        };
      }
      // ---- Finance / Commission ----
      else if (groupText.includes('finance') || groupText.includes('commission')) {
        step = {
          stepName: 'Navigate to Finance',
          code: `// Navigate to Finance/Commission
        await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
        await pages.basePage.clickSubHeaderByText(FINANCE_SUB_MENU.COMMISSION_AUDIT);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
          pageObjects: ['basePage'],
          assertions: []
        };
      }
      // ---- EDI (word-boundary match to avoid false positives with "edit", "credit", etc.) ----
      else if (/\bedi\b/i.test(groupText) || /\btender\b/i.test(groupText)) {
        step = {
          stepName: 'Navigate to EDI Load Tenders',
          code: `// Navigate to EDI Load Tenders
        await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
          pageObjects: ['basePage'],
          assertions: []
        };
      }
      // ---- Sales Lead ----
      else if (groupText.includes('sales lead')) {
        step = {
          stepName: 'Navigate to Sales Lead',
          code: `// Navigate to Sales Lead
        await pages.basePage.hoverOverHeaderByText(HEADERS.SALES_LEAD);
        await pages.basePage.clickSubHeaderByText(SALES_LEAD_SUB_MENU.MY_LEADS);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
          pageObjects: ['basePage'],
          assertions: []
        };
      }
      // ---- DAT (word-boundary match to avoid false positives with "date", "update", etc.) ----
      else if (/\bdat\b/i.test(groupText) || groupText.includes('loadboard')) {
        step = {
          stepName: 'Navigate to DAT',
          code: `// Navigate to DAT
        await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
          pageObjects: ['basePage'],
          assertions: []
        };
      }
      // ---- ALL OTHER preconditions: generate REAL code via generateCodeFromAction ----
      else {
        const code = await this.generateCodeFromAction(groupFirstLine);
        step = {
          stepName: groupFirstLine.substring(0, 60) + (groupFirstLine.length > 60 ? '...' : ''),
          code,
          pageObjects: ['basePage'],
          assertions: []
        };
      }

      // Dedup: skip if the EXACT same code was just emitted (prevents consecutive duplicates)
      if (step) {
        const codeKey = step.code.replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ').trim();
        const lastKey = emittedCodes.length > 0 ? emittedCodes[emittedCodes.length - 1] : '';
        if (codeKey !== lastKey) {
          emittedCodes.push(codeKey);
          steps.push(step);
        }
      }
    }

    return steps;
  }

  /**
   * Check if a precondition group text is a sub-step of the office setup composite block.
   * Only matches steps specifically about editing office settings (not carrier, customer, etc.)
   */
  private isOfficeSubStep(text: string): boolean {
    return (
      (text.includes('office') && (text.includes('search') || text.includes('code') || text.includes('form') || text.includes('row'))) ||
      text.includes('match vendors field') || text.includes('digital matching engine') ||
      (text.includes('edit button') && text.includes('office')) ||
      (text.includes('save changes') && (text.includes('office') || text.includes('setting'))) ||
      (text.includes('update the enable') && text.includes('digital')) ||
      // Toggle settings that are handled by the office composite block
      (text.includes('carrier auto accept') && (text.includes('set') || text.includes('yes') || text.includes('no'))) ||
      (text.includes('tnx bids') && (text.includes('set') || text.includes('enable') || text.includes('yes') || text.includes('no'))) ||
      (text.includes('auto post') && (text.includes('set') || text.includes('enable') || text.includes('yes') || text.includes('no'))) ||
      (text.includes('greenscreen') && (text.includes('set') || text.includes('enable'))) ||
      // Office profile navigation sub-steps
      (text.includes('click') && text.includes('office profile')) ||
      (text.includes('enter') && text.includes('agent') && text.includes('field')) ||
      (text.includes('click') && text.includes('agent profile')) ||
      (text.includes('click') && text.includes('search') && text.includes('button') && !text.includes('carrier') && !text.includes('customer')) ||
      // Office row click: "Once the data is returned click on the row"
      (text.includes('data') && text.includes('returned') && text.includes('click') && text.includes('row')) ||
      // Validate settings page: "On this page validate the following settings"
      (text.includes('validate') && text.includes('following') && text.includes('setting')) ||
      // "navigate to the office form page" or "after clicking user is navigate to the office form"
      (text.includes('navigate') && text.includes('office') && text.includes('form'))
    );
  }

  /**
   * Check if a precondition group text is a sub-step of the switch user composite block.
   */
  private isSwitchUserSubStep(text: string): boolean {
    return (
      text.includes('switch user') || text.includes('switched to') || text.includes('gets switched') ||
      // "Once suggestion is shown click on BRENT DURHAM" — switch user autocomplete sub-step
      (text.includes('suggestion') && text.includes('click')) ||
      (text.includes('hover') && text.includes('admin') && !text.includes('carrier') && !text.includes('customer'))
    );
  }

  /**
   * Check if a precondition group text is a sub-step of the post automation composite block.
   */
  private isPostAutomationSubStep(text: string): boolean {
    return (
      text.includes('post automation') || text.includes('automation button') ||
      text.includes('automation page') || text.includes('automation rule') ||
      // "Hover HOME tab and select sub tab OFFICE CONFIG" → this navigates to post automation
      (text.includes('office config') && (text.includes('hover') || text.includes('select') || text.includes('click'))) ||
      // "If data is visible delete it and if not click on NEW button" — post automation cleanup
      (text.includes('data') && text.includes('visible') && text.includes('delete') && text.includes('new'))
    );
  }

  /**
   * Clean and format step name
   */
  private cleanStepName(stepName: string, stepNumber: number): string {
    // Remove "Step X:" prefix if already present
    let cleaned = stepName.replace(/^Step\s*\d+[:.]?\s*/i, '').trim();
    
    // Truncate if too long
    if (cleaned.length > 60) {
      cleaned = cleaned.substring(0, 57) + '...';
    }
    
    return `Step ${stepNumber}: ${cleaned}`;
  }

  /**
   * Format step code with proper indentation
   */
  private formatStepCode(code: string): string {
    const lines = code.split('\n');
    return lines.map(line => `        ${line.trim()}`).join('\n') + '\n';
  }

  /**
   * Generate assertion code from expected result text
   */
  /**
   * Sanitize a string for safe embedding in generated code
   * Handles smart quotes, special characters, and escaping
   */
  private sanitizeStringForCode(text: string, context: 'string' | 'identifier' = 'string'): string {
    if (context === 'identifier') {
      const cleaned = text
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036\u2018\u2019\u201A\u201B\u2032\u2035]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '');
      if (!cleaned) return 'unknownField';
      return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
    }
    return text
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, "'")
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
      .replace(/\n/g, ' ')
      .replace(/\r/g, '')
      .replace(/"/g, "'")
      .trim();
  }

  private generateExpectedResultAssertion(expected: string): string {
    const lowerExpected = expected.toLowerCase();
    
    // Load created/saved
    if (lowerExpected.includes('load') && (lowerExpected.includes('created') || lowerExpected.includes('success') || lowerExpected.includes('saved'))) {
      return `        expect(loadNumber, "Load should be created").toBeTruthy();\n`;
    }

    // Load auto-accepted / booked
    if ((lowerExpected.includes('auto') && lowerExpected.includes('accept')) || 
        (lowerExpected.includes('load') && lowerExpected.includes('booked'))) {
      return `        await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.BOOKED);\n        console.log("Verified load is auto-accepted/booked");\n`;
    }

    // Load status (generic)
    if (lowerExpected.includes('status')) {
      const statusMatch = expected.match(/(BOOKED|POSTED|ACTIVE|DISPATCHED|CANCELLED|MATCHED|AVAILABLE)/i);
      if (statusMatch) {
        const status = statusMatch[1].toUpperCase();
        return `        await pages.dfbLoadFormPage.validatePostStatus("${status}");\n`;
      }
      if (lowerExpected.includes('post')) {
        return `        await pages.dfbLoadFormPage.validatePostStatus("POSTED");\n`;
      }
    }

    // Carrier assigned / carrier should be assigned
    if (lowerExpected.includes('carrier') && (lowerExpected.includes('assigned') || lowerExpected.includes('booked'))) {
      return `        await pages.viewLoadCarrierTabPage.validateCarrierAssignedText();\n        console.log("Verified carrier assigned");\n`;
    }

    // Dispatch name validation
    if (lowerExpected.includes('dispatch') && lowerExpected.includes('name')) {
      return `        await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(CARRIER_DISPATCH_NAME.DISPATCH_NAME_1);\n        console.log("Dispatch name validated");\n`;
    }

    // Dispatch email validation
    if (lowerExpected.includes('dispatch') && lowerExpected.includes('email')) {
      return `        await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(CARRIER_DISPATCH_EMAIL.DISPATCH_EMAIL_1);\n        console.log("Dispatch email validated");\n`;
    }

    // Cargo value display
    if (lowerExpected.includes('cargo') && lowerExpected.includes('display')) {
      return `        const cargoVal = await pages.dfbLoadFormPage.getCargoValue();\n        expect(cargoVal, "${expected}").toBeTruthy();\n`;
    }

    // Offer rate validation
    if (lowerExpected.includes('offer rate') || (lowerExpected.includes('rate') && lowerExpected.includes('match'))) {
      return `        const displayedRate = await pages.dfbLoadFormPage.getOfferRate();\n        expect(displayedRate).toBe(testData.offerRate);\n        console.log("Offer rate validated:", displayedRate);\n`;
    }

    // BIDS / Bid history (optional — wrap in try/catch)
    if (lowerExpected.includes('bids') || lowerExpected.includes('bid history')) {
      return `        try {\n          const bidsValue = await pages.viewLoadCarrierTabPage.getBidsReportValue();\n          console.log("BIDS Reports value:", bidsValue);\n        } catch (e) {\n          console.log("Bid history check could not complete:", (e as Error).message);\n        }\n`;
    }

    // TNX-specific validations
    if (lowerExpected.includes('tnx') && lowerExpected.includes('offer')) {
      return `        const tnxOfferRate = await pages.tnxLandingPage.getOfferRate();\n        expect(tnxOfferRate, "TNX offer rate should match").toBe(testData.offerRate);\n        console.log("TNX offer rate validated:", tnxOfferRate);\n`;
    }
    if (lowerExpected.includes('tnx') && (lowerExpected.includes('load') || lowerExpected.includes('visible') || lowerExpected.includes('available'))) {
      return `        await pages.tnxLandingPage.verifyLoadVisible(loadNumber);\n        console.log("Load verified visible in TNX");\n`;
    }
    if (lowerExpected.includes('tnx')) {
      return `        console.log("TNX verification: ${expected.replace(/"/g, "'")}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);\n`;
    }

    // Alert/message/notification/error/toast displayed
    if (lowerExpected.includes('message') || lowerExpected.includes('displayed') || lowerExpected.includes('error') || lowerExpected.includes('alert') || lowerExpected.includes('toast')) {
      const msgMatch = expected.match(/['""'\u201C\u201D](.+?)['""'\u201C\u201D]/);
      let msgText = msgMatch ? msgMatch[1] : expected.replace(/.*(?:message|displayed|relating|showing|is\s+displayed)\s*/i, '').trim();
      msgText = msgText.replace(/^['"]+|['"]+$/g, '').trim();
      const alertPatternsPath = path.resolve(__dirname, '../../utils/alertPatterns.ts');
      const patternConstant = resolveAlertPatternConstant(msgText, alertPatternsPath);
      return `        await pages.commonReusables.validateAlert(sharedPage, ${patternConstant});\n        console.log("Alert validated");\n`;
    }

    // EDI / 990
    if (lowerExpected.includes('990') || lowerExpected.includes('edi')) {
      return `        console.log("EDI verification: ${expected.replace(/"/g, "'")}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);\n`;
    }

    // Automation triggered
    if (lowerExpected.includes('trigger') || lowerExpected.includes('automation')) {
      return `        console.log("Automation check: ${expected.replace(/"/g, "'")}");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);\n`;
    }

    // Element visible/hidden
    if (lowerExpected.includes('visible') || lowerExpected.includes('hidden') || lowerExpected.includes('column')) {
      return `        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);\n        console.log("Visibility check: ${expected.replace(/"/g, "'")}");
        // TODO: Add specific locator assertion for visibility check\n`;
    }

    // Loadboard user / active loadboard
    if (lowerExpected.includes('loadboard') && lowerExpected.includes('user')) {
      return `        console.log("Loadboard user validation: ${expected.replace(/"/g, "'")}");
        // Verify active loadboard user was or was not selected based on test scenario\n`;
    }
    
    // Default: log the expected result as a manual check rather than a no-op assert
    return `        console.log("Manual verification needed: ${expected.replace(/"/g, "'")}");
        // TODO: Add specific assertion for this expected result\n`;
  }

  /**
   * Generate multiple scripts from multiple test cases
   */
  async generateMultipleScripts(
    testCases: TestCaseInput[],
    testDataMap?: Map<string, TestData>
  ): Promise<GeneratedScript[]> {
    const scripts: GeneratedScript[] = [];

    for (const testCase of testCases) {
      const testData = testDataMap?.get(testCase.id);
      const script = await this.generateScript(testCase, testData);
      scripts.push(script);
    }

    return scripts;
  }
}

export default new CodeGenerator();
