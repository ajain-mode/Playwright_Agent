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
import { LLMService } from './services/LLMService';
import { TestCaseMatcher, MatchResult } from './analyzers/TestCaseMatcher';
import { SpecValidator } from './validators/SpecValidator';
import { ProcessedStep } from './analyzers/StepProcessor';
import { RepoCloneManager } from './services/RepoCloneManager';
import { AppSourceIndexer } from './analyzers/AppSourceIndexer';
import { CsvDataService } from './services/CsvDataService';

// Category-to-CSV mapping moved to CsvDataService

export class PlaywrightAgent {
  private config: AgentConfig;
  private parser: TestCaseParser;
  private analyzer: SchemaAnalyzer;
  private dataValidator: DataValidator;
  private generator: CodeGenerator;
  private templates: TestTemplates;
  private llmService: LLMService;
  private matcher: TestCaseMatcher;
  /** When true, saveScript skips per-file tsc — caller runs batch check at the end */
  private batchMode: boolean = false;
  private pendingCompilationFiles: string[] = [];
  private specValidator: SpecValidator;
  private csvService: CsvDataService;
  private appSourceIndexerReady = false;

  constructor(options?: AgentConfigOptions) {
    this.config = new AgentConfig(options);
    this.llmService = new LLMService(this.config);
    this.parser = new TestCaseParser(this.llmService);
    this.analyzer = new SchemaAnalyzer();
    this.dataValidator = new DataValidator();
    this.generator = new CodeGenerator(this.config, this.llmService);
    this.templates = new TestTemplates();
    this.matcher = new TestCaseMatcher();
    this.specValidator = new SpecValidator();
    this.csvService = new CsvDataService(this.config.dataDir);
  }

  private async ensureAppSourceIndexer(): Promise<void> {
    if (this.appSourceIndexerReady) return;
    this.appSourceIndexerReady = true;

    const startMs = Date.now();
    console.log('\n🔍 Initializing application source indexer...');

    const repoManager = new RepoCloneManager(
      this.config.appSourceCacheDir,
      this.config.appSourceCacheMaxAgeMs,
    );

    const { sourceDirs, anyUpdated } = await repoManager.ensureRepos(this.config.appSourceRepos);
    if (sourceDirs.size === 0) {
      console.warn('   ⚠️ No application source repos available — app-source locator lookup disabled.');
      return;
    }

    const indexer = new AppSourceIndexer();
    const indexCachePath = path.join(this.config.appSourceCacheDir, 'app-source-index.json');

    // Only use cached index if no repo was freshly pulled — otherwise rebuild
    const loaded = !anyUpdated && indexer.loadFromCache(indexCachePath);
    if (loaded && indexer.elements.length > 0) {
      console.log(`   ✅ Loaded cached index (${indexer.elements.length} elements) in ${Date.now() - startMs}ms`);
    } else {
      if (anyUpdated) {
        console.log('   🔄 App source repos were updated — rebuilding index...');
      }
      await indexer.buildIndex(
        sourceDirs,
        this.config.appSourceRepos.map((r) => ({ name: r.name, app: r.app, fileTypes: r.fileTypes })),
      );
      indexer.saveToCache(indexCachePath);
      console.log(`   ✅ Built fresh index (${indexer.elements.length} elements) in ${Date.now() - startMs}ms`);
    }

    this.generator.setAppSourceIndexer(indexer);
    console.log('   📊 App source indexer connected to code generator.\n');
  }

  /**
   * Generate a single Playwright test script from a test case description
   */
  async generateFromDescription(description: string): Promise<AgentResponse> {
    const startTime = Date.now();
    const scripts: GeneratedScript[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    await this.ensureAppSourceIndexer();

    try {
      // Parse the test case
      const testCase = this.parser.parseTestCase(description);
      console.log(`\n📋 Parsed Test Case: ${testCase.id}`);
      console.log(`   Category: ${testCase.category}`);
      console.log(`   Steps: ${testCase.steps.length}`);

      // Always run similarity matching first (for score calculation and data inheritance)
      const match = this.matchAndEnrichFromSimilar(testCase);

      // Skip code generation if both spec file and data CSV row already exist
      const skipCheck = this.shouldSkipGeneration(testCase);
      if (skipCheck.skip) {
        console.log(`⏭️  Skipping ${testCase.id}: ${skipCheck.reason}`);
        warnings.push(`Skipped ${testCase.id}: ${skipCheck.reason}`);
      } else {
        // LLM enrichment: fill critical missing fields before CSV write
        await this.enrichTestDataWithLLM(testCase);

        // Validate and auto-correct test data before writing to CSV
        const validationErrors = this.validateTestData(testCase);
        if (validationErrors.length > 0) {
          warnings.push(...validationErrors.map(e => `[${testCase.id}] ${e}`));
        }

        // Ensure test data exists in the respective data CSV (uses corrected values)
        this.csvService.ensureTestDataInCsv(testCase);

        // Generate the script (pass matched spec path and score for reference adoption)
        const script = await this.generator.generateScript(testCase, undefined, match?.specPath || undefined, match?.score);
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

    await this.ensureAppSourceIndexer();

    try {
      // Always run similarity matching first (for score calculation and data inheritance)
      const match = this.matchAndEnrichFromSimilar(testCase);

      // Skip code generation if both spec file and data CSV row already exist
      const skipCheck = this.shouldSkipGeneration(testCase);
      if (skipCheck.skip) {
        console.log(`⏭️  Skipping ${testCase.id}: ${skipCheck.reason}`);
        warnings.push(`Skipped ${testCase.id}: ${skipCheck.reason}`);
      } else {
        // LLM enrichment: fill critical missing fields before CSV write
        await this.enrichTestDataWithLLM(testCase);

        // Validate and auto-correct test data before writing to CSV
        const validationErrors = this.validateTestData(testCase);
        if (validationErrors.length > 0) {
          warnings.push(...validationErrors.map(e => `[${testCase.id}] ${e}`));
        }

        // Ensure test data exists in the respective data CSV (uses corrected values)
        this.csvService.ensureTestDataInCsv(testCase);

        const script = await this.generator.generateScript(testCase, testData, match?.specPath || undefined, match?.score);
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

    await this.ensureAppSourceIndexer();

    // Enable batch mode: skip per-file tsc, run once at the end
    this.batchMode = true;
    this.pendingCompilationFiles = [];

    // Track which test cases have been generated in this batch so far.
    // Only exclude already-generated IDs from similarity matching — NOT all batch IDs.
    // This allows test case DFB-97748 to match against DFB-97746 (which hasn't been
    // regenerated yet) while preventing it from matching against a freshly-generated
    // sibling whose spec might be broken.
    this.matcher.clearBatchExcludeIds();
    const generatedInBatch: string[] = [];
    console.log(`   🔍 Batch mode: ${testCases.length} test cases — similarity matching will exclude only already-generated siblings`);

    let skippedCount = 0;
    for (const input of testCases) {
      try {
        const testCase = typeof input === 'string' 
          ? this.parser.parseTestCase(input) 
          : input;

        // Always run similarity matching first (for score calculation and data inheritance)
        const match = this.matchAndEnrichFromSimilar(testCase);

        // Skip code generation if both spec file and data CSV row already exist
        const skipCheck = this.shouldSkipGeneration(testCase);
        if (skipCheck.skip) {
          console.log(`⏭️  Skipping ${testCase.id}: ${skipCheck.reason}`);
          warnings.push(`Skipped ${testCase.id}: ${skipCheck.reason}`);
          skippedCount++;
          continue;
        }

        // LLM enrichment: fill critical missing fields before CSV write
        await this.enrichTestDataWithLLM(testCase);

        // Validate and auto-correct test data before writing to CSV
        const validationErrors = this.validateTestData(testCase);
        if (validationErrors.length > 0) {
          warnings.push(...validationErrors.map(e => `[${testCase.id}] ${e}`));
        }

        // Ensure test data exists in the respective data CSV (uses corrected values)
        this.csvService.ensureTestDataInCsv(testCase);

        const testData = testDataMap?.get(testCase.id);
        const script = await this.generator.generateScript(testCase, testData, match?.specPath || undefined, match?.score);
        scripts.push(script);
        await this.saveScript(script);
        console.log(`✅ Generated: ${script.fileName}`);

        // After generating, exclude this ID from future matching in this batch
        // to prevent sibling test cases from referencing a freshly-generated spec
        generatedInBatch.push(testCase.id);
        this.matcher.setBatchExcludeIds(generatedInBatch);
      } catch (error: any) {
        const id = typeof input === 'string' ? 'Unknown' : input.id;
        errors.push(`Error generating script for ${id}: ${error.message}`);
        console.error(`❌ Failed: ${id} - ${error.message}`);
      }
    }

    // End batch mode and clean up
    this.batchMode = false;
    this.matcher.clearBatchExcludeIds();
    if (this.pendingCompilationFiles.length > 0) {
      this.runBatchCompilationCheck(this.pendingCompilationFiles);
      this.pendingCompilationFiles = [];
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
   * Save generated script to file after SpecValidator (Agent 3) validation and correction.
   * Post-write: compile check (batch or per-file).
   */
  private async saveScript(script: GeneratedScript): Promise<void> {
    const dir = path.dirname(script.filePath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Get processed steps from the generator for validation
    const processedSteps: ProcessedStep[] = this.generator.getProcessedSteps();

    // Agent 3: Validate + correct loop (replaces old sanitize → selfCheck → validate → LLM fix flow)
    console.log(`   🔍 Running SpecValidator for ${script.testCaseId}...`);
    const { finalCode, report } = await this.specValidator.validateAndCorrect(
      script.content,
      processedSteps,
      this.generator.getPOMMethodMatcher(),
      2,
    );

    // Log validation summary
    console.log(`   📊 Validation: ${report.summary.stepsImplemented}/${report.summary.stepsTotal} steps, `
      + `${report.summary.hardBlocks} blocks, ${report.summary.errors} errors, ${report.summary.warnings} warnings`);

    if (report.passed) {
      fs.writeFileSync(script.filePath, finalCode, 'utf-8');
      console.log(`   ✅ Generated: ${script.testCaseId}.spec.ts`);
    } else if (report.summary.hardBlocks > 0) {
      // Save as draft — NOT a production spec
      const draftPath = script.filePath.replace('.spec.ts', '.draft.spec.ts');
      fs.writeFileSync(draftPath, finalCode, 'utf-8');
      console.log(`   ⚠️ Draft saved: ${path.basename(draftPath)} — ${report.summary.hardBlocks} unresolved hard-block(s)`);
      for (const v of report.violations.filter(v => v.severity === 'hard-block')) {
        console.log(`      ❌ ${v.ruleId}: ${v.message}`);
      }
    } else {
      // Errors but no hard-blocks — write as spec but warn
      fs.writeFileSync(script.filePath, finalCode, 'utf-8');
      console.log(`   ⚠️ Generated with warnings: ${script.testCaseId}.spec.ts`);
      for (const v of report.violations.filter(v => v.severity === 'error')) {
        console.log(`      ⚠️ ${v.ruleId}: ${v.message}`);
      }
    }

    // Post-write: compile check
    if (this.batchMode) {
      this.pendingCompilationFiles.push(script.filePath);
    } else {
      this.runCompilationCheck(script.filePath, script.testCaseId);
    }

    // Legacy sanitizeGeneratedCode/validateGeneratedCode/selfCheckAndFix methods
    // have been migrated to SpecValidator's declarative SANITIZER_RULES registry.
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
   * Run a single TypeScript compilation check for multiple generated files at once.
   * Much faster than running tsc per-file when generating a batch of test cases.
   */
  private runBatchCompilationCheck(filePaths: string[]): void {
    console.log(`\n🔍 Running batch TypeScript compilation check for ${filePaths.length} file(s)...`);
    const projectRoot = path.resolve(__dirname, '../..');
    const fileBasenames = new Set(filePaths.map(fp => path.basename(fp)));

    try {
      execSync(`npx tsc --noEmit --pretty -p tsconfig.json 2>&1`, {
        encoding: 'utf-8',
        timeout: 120000, // 2 min for batch
        cwd: projectRoot,
      });
      console.log(`   ✅ Batch compilation passed — no TypeScript errors found in any generated file`);
    } catch (error: any) {
      const output = error.stdout || error.message || '';
      const errorsByFile = new Map<string, string[]>();

      output.split('\n').forEach((line: string) => {
        // Must be about one of our generated files
        const matchedFile = [...fileBasenames].find(bn => line.includes(bn));
        if (!matchedFile) return;
        if (!line.includes('error TS') && !line.includes('warning TS')) return;
        if (line.includes('TS2307') && line.match(/@\w+\//)) return;

        if (!errorsByFile.has(matchedFile)) errorsByFile.set(matchedFile, []);
        errorsByFile.get(matchedFile)!.push(line.trim());
      });

      if (errorsByFile.size > 0) {
        let totalIssues = 0;
        for (const [file, errors] of errorsByFile) {
          console.log(`   ⚠️ ${file}:`);
          errors.forEach(e => console.log(`      ${e}`));
          totalIssues += errors.length;
        }
        console.log(`   📝 Total: ${totalIssues} issue(s) across ${errorsByFile.size} file(s)`);
      } else {
        console.log(`   ✅ Batch compilation passed — no actionable TypeScript errors`);
      }
    }
  }


  // getDataCsvPath moved to CsvDataService

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

    const csvPath = this.csvService.getDataCsvPath(testCase.category);
    let dataRowExists = false;

    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
      if (lines.length > 0) {
        const headers = this.csvService.parseCsvLine(lines[0]);
        const idColIdx = headers.findIndex(h =>
          h.trim().toLowerCase().replace(/[\s_-]/g, '') === 'testscriptid'
        );
        if (idColIdx !== -1) {
          for (let i = 1; i < lines.length; i++) {
            const values = this.csvService.parseCsvLine(lines[i]);
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
    const csvPath = this.csvService.getDataCsvPath(testCase.category);
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
   * Enrich test case data using LLM when regex extraction missed critical fields.
   * This runs the async LLM extraction and merges results into testCase.testData
   * and testCase.explicitValues, ensuring the data CSV gets complete values.
   */
  private async enrichTestDataWithLLM(testCase: TestCaseInput): Promise<void> {
    if (!testCase.explicitValues?._needsLLMEnrichment) return;
    if (!this.llmService || !this.llmService.isAvailable()) return;

    const stepsText = testCase.steps.map(s => `${s.stepNumber}. ${s.action}`).join('\n');
    const precondText = (testCase.preconditions || []).join('\n');
    const expectedText = (testCase.expectedResults || []).join('\n');

    // Run async LLM extraction
    const enrichedValues = await this.parser.extractExplicitValuesAsync(
      precondText, stepsText, expectedText
    );

    // Merge LLM results into explicitValues (preserving regex values)
    if (testCase.explicitValues) {
      for (const [key, value] of Object.entries(enrichedValues.formFields)) {
        if (value && !testCase.explicitValues.formFields[key]) {
          testCase.explicitValues.formFields[key] = value;
        }
      }
      for (const [key, value] of Object.entries(enrichedValues.precondition)) {
        if (value && !testCase.explicitValues.precondition[key]) {
          testCase.explicitValues.precondition[key] = value;
        }
      }
      testCase.explicitValues._needsLLMEnrichment = false;
    }

    // Re-bridge to testData with enriched values
    if (testCase.explicitValues && testCase.testData) {
      testCase.testData = this.parser.bridgeExplicitValuesToTestData(
        testCase.testData as TestData, testCase.explicitValues, testCase.id
      );
    }
  }

  /**
   * Match a new test case against existing test cases to:
   * 1. Find the most functionally similar existing spec (for code generation reference)
   * 2. Inherit missing data fields from the matched test case's CSV row
   *
   * Returns the MatchResult so CodeGenerator can use the matched spec as template.
   */
  private matchAndEnrichFromSimilar(testCase: TestCaseInput): MatchResult | null {
    const match = this.matcher.findBestMatch(testCase);
    if (!match) return null;

    console.log(`   🔗 Similarity match: ${testCase.id} → ${match.matchedId} (score=${(match.score * 100).toFixed(0)}%, ${match.reasons.join(', ')})`);

    // Inherit missing data from matched test case
    if (testCase.testData && Object.keys(match.matchedData).length > 0) {
      const { inherited, data } = this.matcher.inheritMissingData(
        testCase.testData, match.matchedData, match.matchedId
      );
      if (inherited.length > 0) {
        testCase.testData = data;
      }
    }

    return match;
  }

  // ensureTestDataInCsv moved to CsvDataService

  // createNewDataCsv moved to CsvDataService

  // appendTestDataToCsv, escapeCsvValue, normalizeLoadMethod, toCamelCase, parseCsvLine moved to CsvDataService

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
