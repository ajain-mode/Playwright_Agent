/**
 * Agent CLI
 * Command-line interface for the Playwright Test Script Generator Agent
 * 
 * @author AI Agent Generator
 * @created 2026-02-05
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { PlaywrightAgent } from '../PlaywrightAgent';
import { TestCaseInput } from '../types/TestCaseTypes';
import { TestCaseParser } from '../parsers/TestCaseParser';

const SUPPORTED_EXTENSIONS = ['.json', '.txt', '.csv', '.xlsx', '.xls'];

export class AgentCLI {
  private agent: PlaywrightAgent;
  private rl: readline.Interface;

  constructor() {
    this.agent = new PlaywrightAgent();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Start the interactive CLI
   */
  async start(): Promise<void> {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║    🤖 Playwright Test Script Generator Agent           ║');
    console.log('║    Generates test scripts from test case descriptions  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    await this.showMainMenu();
  }

  /**
   * Show main menu
   */
  private async showMainMenu(): Promise<void> {
    console.log('\n📋 Main Menu:');
    console.log('  1. Generate from description');
    console.log('  2. Generate from file');
    console.log('  3. Generate from template');
    console.log('  4. Analyze test case');
    console.log('  5. Preview script');
    console.log('  6. Show available templates');
    console.log('  7. Show project schema');
    console.log('  8. Batch generate');
    console.log('  9. Exit');
    console.log('');

    const choice = await this.prompt('Select an option (1-9): ');

    switch (choice) {
      case '1':
        await this.generateFromDescription();
        break;
      case '2':
        await this.generateFromFile();
        break;
      case '3':
        await this.generateFromTemplate();
        break;
      case '4':
        await this.analyzeTestCase();
        break;
      case '5':
        await this.previewScript();
        break;
      case '6':
        await this.showTemplates();
        break;
      case '7':
        await this.showSchema();
        break;
      case '8':
        await this.batchGenerate();
        break;
      case '9':
        this.exit();
        return;
      default:
        console.log('\n❌ Invalid option. Please try again.');
    }

    await this.showMainMenu();
  }

  /**
   * Generate from description
   */
  private async generateFromDescription(): Promise<void> {
    console.log('\n📝 Enter Test Case Description');
    console.log('   (Enter a blank line when done)\n');

    const lines: string[] = [];
    let line = await this.prompt('');
    
    while (line !== '') {
      lines.push(line);
      line = await this.prompt('');
    }

    if (lines.length === 0) {
      console.log('\n❌ No description provided.');
      return;
    }

    const description = lines.join('\n');
    console.log('\n⏳ Generating script...\n');

    const result = await this.agent.generateFromDescription(description);

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
    }
  }

  /**
   * Generate from file (supports JSON, TXT, CSV, XLSX, XLS)
   */
  private async generateFromFile(): Promise<void> {
    console.log('\n📁 Supported file formats: JSON, TXT, CSV, XLSX, XLS');
    const filePath = await this.prompt('Enter file path: ');

    if (!fs.existsSync(filePath)) {
      console.log('\n❌ File not found.');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      console.log(`\n❌ Unsupported file format: ${ext}`);
      console.log(`   Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      return;
    }

    try {
      const parser = new TestCaseParser();
      const testCases = parser.parseFromFile(filePath);
      
      console.log(`\n📋 Found ${testCases.length} test case(s) in file`);
      
      // Show preview of test cases found
      testCases.slice(0, 5).forEach((tc, index) => {
        console.log(`   ${index + 1}. ${tc.id} - ${tc.title.substring(0, 50)}${tc.title.length > 50 ? '...' : ''}`);
      });
      if (testCases.length > 5) {
        console.log(`   ... and ${testCases.length - 5} more`);
      }

      const confirm = await this.prompt(`\nGenerate scripts for ${testCases.length} test case(s)? (y/n): `);
      if (confirm.toLowerCase() !== 'y') {
        console.log('\n❌ Generation cancelled.');
        return;
      }

      console.log('\n⏳ Generating scripts...\n');
      
      if (testCases.length === 1) {
        const result = await this.agent.generateFromTestCase(testCases[0]);
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
        }
      } else {
        const result = await this.agent.generateFromMultipleTestCases(testCases);
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
      console.log(`\n❌ Error: ${error.message}`);
    }
  }

  /**
   * Generate from template
   */
  private async generateFromTemplate(): Promise<void> {
    console.log('\n📋 Available Templates:');
    const templates = this.agent.getAvailableTemplates();
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template}`);
    });

    const choice = await this.prompt('\nSelect template (number): ');
    const templateIndex = parseInt(choice) - 1;

    if (templateIndex < 0 || templateIndex >= templates.length) {
      console.log('\n❌ Invalid selection.');
      return;
    }

    const templateType = templates[templateIndex];

    const testCaseId = await this.prompt('Enter Test Case ID: ');
    const title = await this.prompt('Enter Test Title: ');
    const category = await this.prompt('Enter Category (dfb/edi/commission/etc): ');

    const testCase: TestCaseInput = {
      id: testCaseId,
      title,
      description: title,
      category: category as any,
      steps: [],
      expectedResults: [],
      tags: [`@${category}`]
    };

    console.log('\n⏳ Generating from template...\n');
    const result = await this.agent.generateFromTemplate(templateType, testCase);

    if (result.success) {
      console.log('\n✅ Script generated successfully!');
      result.scripts.forEach(script => {
        console.log(`   📄 ${script.filePath}`);
      });
    }
  }

  /**
   * Analyze test case
   */
  private async analyzeTestCase(): Promise<void> {
    console.log('\n📝 Enter Test Case Description for Analysis');
    console.log('   (Enter a blank line when done)\n');

    const lines: string[] = [];
    let line = await this.prompt('');
    
    while (line !== '') {
      lines.push(line);
      line = await this.prompt('');
    }

    if (lines.length === 0) {
      console.log('\n❌ No description provided.');
      return;
    }

    const description = lines.join('\n');
    console.log('\n⏳ Analyzing...\n');

    const analysis = await this.agent.analyzeTestCase(description);

    console.log('\n📊 Analysis Results:');
    console.log(`   Test Case ID: ${analysis.testCase.id}`);
    console.log(`   Category: ${analysis.testCase.category}`);
    console.log(`   Complexity: ${analysis.complexity}`);
    console.log(`   Suggested Template: ${analysis.suggestedTemplate}`);
    console.log(`   Steps Detected: ${analysis.testCase.steps.length}`);
    console.log(`   Expected Results: ${analysis.testCase.expectedResults.length}`);
    console.log(`\n   Suggested Page Objects:`);
    analysis.suggestedPageObjects.forEach(po => {
      console.log(`     - ${po}`);
    });
  }

  /**
   * Preview script
   */
  private async previewScript(): Promise<void> {
    console.log('\n📝 Enter Test Case Description for Preview');
    console.log('   (Enter a blank line when done)\n');

    const lines: string[] = [];
    let line = await this.prompt('');
    
    while (line !== '') {
      lines.push(line);
      line = await this.prompt('');
    }

    if (lines.length === 0) {
      console.log('\n❌ No description provided.');
      return;
    }

    const description = lines.join('\n');
    console.log('\n⏳ Generating preview...\n');

    const preview = await this.agent.previewScript(description);

    console.log('\n' + '═'.repeat(60));
    console.log('📄 SCRIPT PREVIEW');
    console.log('═'.repeat(60));
    console.log(preview);
    console.log('═'.repeat(60));
  }

  /**
   * Show available templates
   */
  private async showTemplates(): Promise<void> {
    console.log('\n📋 Available Templates:\n');
    const templates = this.agent.getAvailableTemplates();
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template}`);
    });
  }

  /**
   * Show project schema
   */
  private async showSchema(): Promise<void> {
    console.log('\n⏳ Loading project schema...\n');
    const schema = await this.agent.getProjectSchema();

    console.log('📊 Project Schema:\n');
    
    console.log('   📁 Test Categories:');
    schema.testCategories.forEach(cat => {
      console.log(`      - ${cat}`);
    });

    console.log('\n   📦 Page Objects:');
    schema.pageObjects.slice(0, 15).forEach(po => {
      console.log(`      - ${po}`);
    });
    if (schema.pageObjects.length > 15) {
      console.log(`      ... and ${schema.pageObjects.length - 15} more`);
    }

    console.log('\n   🔧 Utilities:');
    schema.utilities.forEach(util => {
      console.log(`      - ${util}`);
    });

    console.log('\n   📌 Constants:');
    schema.constants.forEach(constant => {
      console.log(`      - ${constant}`);
    });
  }

  /**
   * Batch generate from multiple files (supports JSON, TXT, CSV, XLSX, XLS)
   */
  private async batchGenerate(): Promise<void> {
    console.log('\n📁 Supported file formats: JSON, TXT, CSV, XLSX, XLS');
    const dirPath = await this.prompt('Enter directory path with test case files: ');

    if (!fs.existsSync(dirPath)) {
      console.log('\n❌ Directory not found.');
      return;
    }

    const files = fs.readdirSync(dirPath).filter(f => 
      SUPPORTED_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext))
    );

    if (files.length === 0) {
      console.log('\n❌ No supported files found in directory.');
      console.log(`   Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      return;
    }

    console.log(`\n📁 Found ${files.length} file(s):`);
    files.forEach(f => console.log(`   - ${f}`));

    const confirm = await this.prompt('\nProceed with batch generation? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('\n❌ Batch generation cancelled.');
      return;
    }

    const parser = new TestCaseParser();
    const allTestCases: TestCaseInput[] = [];
    
    console.log('\n📋 Processing files...');
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      console.log(`   📄 ${file}`);
      
      try {
        const testCases = parser.parseFromFile(filePath);
        console.log(`      ├─ Found ${testCases.length} test case(s)`);
        allTestCases.push(...testCases);
      } catch (error: any) {
        console.error(`      ├─ ❌ Error: ${error.message}`);
      }
    }

    if (allTestCases.length === 0) {
      console.log('\n❌ No valid test cases found.');
      return;
    }

    console.log(`\n📋 Total test cases to process: ${allTestCases.length}`);
    console.log('⏳ Batch generating...\n');
    
    const result = await this.agent.generateFromMultipleTestCases(allTestCases);

    console.log('\n📊 Batch Generation Results:');
    console.log(`   Total: ${result.summary.totalTestCases}`);
    console.log(`   Success: ${result.summary.successfullyGenerated}`);
    console.log(`   Failed: ${result.summary.failed}`);
    console.log(`   Time: ${result.summary.executionTime}ms`);

    if (result.scripts.length > 0) {
      console.log('\n✅ Generated scripts:');
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

  /**
   * Prompt for user input
   */
  private prompt(question: string): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(question, answer => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Exit the CLI
   */
  private exit(): void {
    console.log('\n👋 Goodbye!\n');
    this.rl.close();
    process.exit(0);
  }
}

// Export for direct execution
export async function runCLI(): Promise<void> {
  const cli = new AgentCLI();
  await cli.start();
}

export default AgentCLI;
