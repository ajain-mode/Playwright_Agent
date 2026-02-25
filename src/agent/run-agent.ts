#!/usr/bin/env node
/**
 * Agent Runner
 * Entry point for running the Playwright Test Script Generator Agent
 * 
 * Usage:
 *   npx ts-node src/agent/run-agent.ts
 *   npx ts-node src/agent/run-agent.ts --cli
 *   npx ts-node src/agent/run-agent.ts --generate "test case description"
 *   npx ts-node src/agent/run-agent.ts --file path/to/testcase.json
 *   npx ts-node src/agent/run-agent.ts --batch path/to/testcases/
 * 
 * @author AI Agent Generator
 * @created 2026-02-05
 */

import { PlaywrightAgent } from './PlaywrightAgent';
import { runCLI } from './cli/AgentCLI';
import { TestCaseParser } from './parsers/TestCaseParser';
import { DataValidator } from './analyzers/DataValidator';
import fs from 'fs';
import path from 'path';

/**
 * Default CSV file containing test cases.
 * When no arguments are provided, the agent reads from this file.
 */
const DEFAULT_CSV_PATH = path.resolve(__dirname, 'examples', 'sample-testcases.csv');

const SUPPORTED_EXTENSIONS = ['.json', '.txt', '.csv', '.xlsx', '.xls'];

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  // Run interactive CLI
  if (args.includes('--cli') || args.includes('-i')) {
    await runCLI();
    return;
  }

  // Default behavior (no arguments): read from sample-testcases.csv
  if (args.length === 0) {
    await runDefaultCSV();
    return;
  }

  const agent = new PlaywrightAgent();

  // Generate from description
  if (args.includes('--generate') || args.includes('-g')) {
    const descIndex = args.indexOf('--generate') !== -1 
      ? args.indexOf('--generate') 
      : args.indexOf('-g');
    const description = args.slice(descIndex + 1).join(' ');

    if (!description) {
      console.error('❌ Please provide a test case description.');
      process.exit(1);
    }

    console.log('\n⏳ Generating script...\n');
    const result = await agent.generateFromDescription(description);

    if (result.success) {
      console.log('\n✅ Script generated successfully!');
      result.scripts.forEach(script => {
        console.log(`   📄 ${script.filePath}`);
      });
    } else {
      console.log('\n❌ Generation failed:');
      result.errors?.forEach(error => {
        console.log(`   - ${error}`);
      });
      process.exit(1);
    }
    return;
  }

  // Generate from file (supports JSON, TXT, CSV, XLSX, XLS)
  if (args.includes('--file') || args.includes('-f')) {
    const fileIndex = args.indexOf('--file') !== -1 
      ? args.indexOf('--file') 
      : args.indexOf('-f');
    const filePath = args[fileIndex + 1];

    if (!filePath || !fs.existsSync(filePath)) {
      console.error('❌ Please provide a valid file path.');
      process.exit(1);
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      console.error(`❌ Unsupported file format: ${ext}`);
      console.error(`   Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      process.exit(1);
    }
    
    console.log(`\n⏳ Generating script from ${ext} file...\n`);
    
    const parser = new TestCaseParser();
    
    try {
      const testCases = parser.parseFromFile(filePath);
      console.log(`📋 Found ${testCases.length} test case(s) in file\n`);
      
      if (testCases.length === 1) {
        const result = await agent.generateFromTestCase(testCases[0]);
        handleResult(result);
      } else {
        // Multiple test cases in file
        const result = await agent.generateFromMultipleTestCases(testCases);
        console.log('\n📊 Generation Results:');
        console.log(`   Total: ${result.summary.totalTestCases}`);
        console.log(`   Success: ${result.summary.successfullyGenerated}`);
        console.log(`   Failed: ${result.summary.failed}`);
        console.log(`   Time: ${result.summary.executionTime}ms\n`);
        
        if (result.scripts.length > 0) {
          console.log('✅ Generated scripts:');
          result.scripts.forEach(script => {
            console.log(`   📄 ${script.filePath}`);
          });
        }
        
        if (result.errors && result.errors.length > 0) {
          console.log('\n❌ Errors:');
          result.errors.forEach(error => {
            console.log(`   - ${error}`);
          });
        }
      }
    } catch (error: any) {
      console.error(`❌ Error parsing file: ${error.message}`);
      process.exit(1);
    }
    return;
  }

  // Batch generate (supports JSON, TXT, CSV, XLSX, XLS files in directory)
  if (args.includes('--batch') || args.includes('-b')) {
    const batchIndex = args.indexOf('--batch') !== -1 
      ? args.indexOf('--batch') 
      : args.indexOf('-b');
    const dirPath = args[batchIndex + 1];

    if (!dirPath || !fs.existsSync(dirPath)) {
      console.error('❌ Please provide a valid directory path.');
      process.exit(1);
    }

    const files = fs.readdirSync(dirPath).filter(f => 
      SUPPORTED_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext))
    );

    if (files.length === 0) {
      console.error('❌ No test case files found in directory.');
      console.error(`   Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      process.exit(1);
    }

    console.log(`\n📁 Found ${files.length} test case file(s)\n`);

    const parser = new TestCaseParser();
    const allTestCases: any[] = [];
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      console.log(`   📄 Processing: ${file}`);
      
      try {
        const testCases = parser.parseFromFile(filePath);
        console.log(`      ├─ Found ${testCases.length} test case(s)`);
        allTestCases.push(...testCases);
      } catch (error: any) {
        console.error(`      ├─ ❌ Error: ${error.message}`);
      }
    }

    if (allTestCases.length === 0) {
      console.error('\n❌ No valid test cases found in any files.');
      process.exit(1);
    }

    console.log(`\n📋 Total test cases to process: ${allTestCases.length}`);
    console.log('⏳ Batch generating scripts...\n');
    
    const result = await agent.generateFromMultipleTestCases(allTestCases);

    console.log('\n📊 Batch Generation Results:');
    console.log(`   Total: ${result.summary.totalTestCases}`);
    console.log(`   Success: ${result.summary.successfullyGenerated}`);
    console.log(`   Failed: ${result.summary.failed}`);
    console.log(`   Time: ${result.summary.executionTime}ms\n`);

    if (result.scripts.length > 0) {
      console.log('✅ Generated scripts:');
      result.scripts.forEach(script => {
        console.log(`   📄 ${script.filePath}`);
      });
    }

    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      process.exit(1);
    }
    return;
  }

  // Preview
  if (args.includes('--preview') || args.includes('-p')) {
    const previewIndex = args.indexOf('--preview') !== -1 
      ? args.indexOf('--preview') 
      : args.indexOf('-p');
    const description = args.slice(previewIndex + 1).join(' ');

    if (!description) {
      console.error('❌ Please provide a test case description.');
      process.exit(1);
    }

    console.log('\n⏳ Generating preview...\n');
    const preview = await agent.previewScript(description);
    console.log(preview);
    return;
  }

  // Analyze
  if (args.includes('--analyze') || args.includes('-a')) {
    const analyzeIndex = args.indexOf('--analyze') !== -1 
      ? args.indexOf('--analyze') 
      : args.indexOf('-a');
    const description = args.slice(analyzeIndex + 1).join(' ');

    if (!description) {
      console.error('❌ Please provide a test case description.');
      process.exit(1);
    }

    console.log('\n⏳ Analyzing test case...\n');
    const analysis = await agent.analyzeTestCase(description);

    console.log('📊 Analysis Results:');
    console.log(`   Test Case ID: ${analysis.testCase.id}`);
    console.log(`   Category: ${analysis.testCase.category}`);
    console.log(`   Complexity: ${analysis.complexity}`);
    console.log(`   Suggested Template: ${analysis.suggestedTemplate}`);
    console.log(`   Steps Detected: ${analysis.testCase.steps.length}`);
    console.log(`\n   Suggested Page Objects:`);
    analysis.suggestedPageObjects.forEach(po => {
      console.log(`     - ${po}`);
    });
    return;
  }

  // Show schema
  if (args.includes('--schema')) {
    const schema = await agent.getProjectSchema();
    console.log('\n📊 Project Schema:\n');
    console.log('Test Categories:', schema.testCategories);
    console.log('\nPage Objects:', schema.pageObjects.slice(0, 10), '...');
    console.log('\nConstants:', schema.constants);
    console.log('\nUtilities:', schema.utilities);
    return;
  }

  // Unknown command
  console.error('❌ Unknown command. Use --help for usage information.');
  process.exit(1);
}

/**
 * Default mode: read all test cases from sample-testcases.csv, generate
 * Playwright specs with module-prefixed IDs (DFB-25103, CARRIER-72101, etc.),
 * validate the generated code, and write to the spec output directory.
 */
async function runDefaultCSV(): Promise<void> {
  const csvPath = DEFAULT_CSV_PATH;

  if (!fs.existsSync(csvPath)) {
    console.error(`\n❌ Default test case file not found: ${csvPath}`);
    console.error(`   Place your test cases in src/agent/examples/sample-testcases.csv`);
    console.error(`   Or use --file <path> to specify a different file.\n`);
    process.exit(1);
  }

  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║  🤖 Playwright Agent — Default CSV Mode                    ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);
  console.log(`\n📄 Reading test cases from: ${csvPath}\n`);

  const parser = new TestCaseParser();
  const agent = new PlaywrightAgent();
  const validator = new DataValidator();

  // Pre-validate all data CSV files and auto-correct ambiguous values
  const dataDir = path.resolve(__dirname, '..', 'data');
  if (fs.existsSync(dataDir)) {
    const dataCsvFiles = fs.readdirSync(dataDir, { recursive: true })
      .map(f => String(f))
      .filter(f => f.endsWith('.csv'));
    for (const csvFile of dataCsvFiles) {
      const fullPath = path.join(dataDir, csvFile);
      const result = validator.validateAndCorrectCsvFile(fullPath);
      if (result.reports.length > 0) {
        console.log(`\n🔍 Validated ${csvFile}:`);
        validator.printReport(result.reports);
      }
    }
  }

  try {
    const testCases = parser.parseFromFile(csvPath);
    console.log(`📋 Found ${testCases.length} test case(s)\n`);

    if (testCases.length === 0) {
      console.error('❌ No valid test cases found in CSV.');
      process.exit(1);
    }

    // Display parsed test cases with their prefixed IDs
    testCases.forEach((tc, i) => {
      console.log(`   ${i + 1}. [${tc.category.toUpperCase()}] ${tc.id} — ${tc.title.substring(0, 60)}${tc.title.length > 60 ? '...' : ''}`);
      if (tc.explicitValues) {
        const pre = tc.explicitValues.precondition;
        const form = tc.explicitValues.formFields;
        const preVals = Object.entries(pre).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(', ');
        const formVals = Object.entries(form).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join(', ');
        if (preVals) console.log(`      Precondition values: ${preVals}`);
        if (formVals) console.log(`      Form values: ${formVals}`);
      }
    });

    console.log(`\n⏳ Generating Playwright scripts...\n`);

    const result = await agent.generateFromMultipleTestCases(testCases);

    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║  📊 Generation Results                                     ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  Total:     ${String(result.summary.totalTestCases).padEnd(45)}║`);
    console.log(`║  Success:   ${String(result.summary.successfullyGenerated).padEnd(45)}║`);
    console.log(`║  Failed:    ${String(result.summary.failed).padEnd(45)}║`);
    console.log(`║  Time:      ${String(result.summary.executionTime + 'ms').padEnd(45)}║`);
    console.log(`╚════════════════════════════════════════════════════════════╝`);

    if (result.scripts.length > 0) {
      console.log('\n✅ Generated spec files:');
      result.scripts.forEach(script => {
        console.log(`   📄 ${script.filePath}`);
      });
    }

    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`❌ Error processing CSV: ${error.message}`);
    process.exit(1);
  }
}

function showHelp(): void {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     🤖 Playwright Test Script Generator Agent - Help       ║
╚════════════════════════════════════════════════════════════╝

Usage:
  npm run agent                     Read sample-testcases.csv (default)
  npm run agent -- --cli            Start interactive CLI mode
  npm run agent -- --file <path>    Generate from file

Options:
  (no args)                Default: reads src/agent/examples/sample-testcases.csv
  --cli, -i                Start interactive CLI mode
  --generate, -g <desc>    Generate script from description
  --file, -f <path>        Generate script from file (JSON/TXT/CSV/XLSX/XLS)
  --batch, -b <dir>        Batch generate from directory of files
  --preview, -p <desc>     Preview generated script without saving
  --analyze, -a <desc>     Analyze test case and show suggestions
  --schema                 Show project schema information
  --help, -h               Show this help message

Default Behavior:
  When no arguments are provided, the agent reads ALL test cases from
  src/agent/examples/sample-testcases.csv and generates Playwright spec
  files for each one. Test case IDs are auto-prefixed with their module
  abbreviation (DFB-25103, CARRIER-72101, EDI-25160, etc.).

Supported File Formats:
  .json    - JSON file with test case object(s)
  .txt     - Plain text test case description
  .csv     - CSV file with test case rows
  .xlsx    - Excel file with test case rows
  .xls     - Legacy Excel file with test case rows

CSV/Excel Column Mappings (case-insensitive):
  ID Columns:      Test Script ID, TestCaseID, TC ID, ID, Test ID
  Title Columns:   Title, Test Title, Name, Test Name, Summary
  Steps Columns:   Steps, Test Steps, Procedure, Actions
  Expected:        Expected Results, Expected, Expected Result

Examples:
  # Interactive mode
  npx ts-node src/agent/run-agent.ts

  # Generate from description
  npx ts-node src/agent/run-agent.ts -g "Create a DFB load with cargo value"

  # Generate from JSON file
  npx ts-node src/agent/run-agent.ts -f testcase.json

  # Generate from Excel file
  npx ts-node src/agent/run-agent.ts -f testcases.xlsx

  # Generate from CSV file
  npx ts-node src/agent/run-agent.ts -f testcases.csv

  # Batch generate from directory
  npx ts-node src/agent/run-agent.ts -b ./testcases/

  # Preview script
  npx ts-node src/agent/run-agent.ts -p "Login to BTMS and create a new load"

  # Analyze test case
  npx ts-node src/agent/run-agent.ts -a "Create load with TNX verification"
`);
}

function handleResult(result: any): void {
  if (result.success) {
    console.log('\n✅ Script generated successfully!');
    result.scripts.forEach((script: any) => {
      console.log(`   📄 ${script.filePath}`);
    });
  } else {
    console.log('\n❌ Generation failed:');
    result.errors?.forEach((error: string) => {
      console.log(`   - ${error}`);
    });
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
