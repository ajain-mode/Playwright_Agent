/**
 * Reference Spec Analyzer
 *
 * Parses existing "golden" spec files into structural blocks that can be
 * reused as templates when generating new tests of the same category.
 *
 * Instead of generating code bottom-up (step by step from CSV text), the
 * analyzer enables top-down generation: clone the proven structure from a
 * reference spec and customize only the test-specific data.
 *
 * @author AI Agent Generator
 * @created 2026-02-20
 */

import fs from 'fs';
import path from 'path';

// ─────────────────────────── Types ───────────────────────────

export interface StructuralBlock {
  name: string;
  code: string;
  category: BlockCategory;
  stepNumbers?: number[];
}

export type BlockCategory =
  | 'login'
  | 'agent-email-capture'
  | 'office-config'
  | 'carrier-search'
  | 'carrier-visibility'
  | 'dme-carrier-toggle'
  | 'customer-search-create'
  | 'form-fill'
  | 'create-load-rate'
  | 'carrier-tab'
  | 'save-alert'
  | 'view-mode-validate'
  | 'post-load'
  | 'dme-verify'
  | 'tnx-verify'
  | 'btms-final-verify'
  | 'other';

export interface SpecStructure {
  imports: string;
  preconditionBlocks: StructuralBlock[];
  testStepBlocks: StructuralBlock[];
  validationBlocks: StructuralBlock[];
  navigationPattern: 'url-based' | 'click-home';
  helperImport: 'commissionHelper' | 'dfbHelpers';
  sourceFile: string;
}

// Category → reference spec file paths (relative to project root)
const REFERENCE_SPECS: Record<string, string[]> = {
  dfb: [
    'src/tests/generated/dfb/DFB-97739.spec.ts',
    'src/tests/generated/dfb/DFB-97741.spec.ts',
  ],
  commission: [
    'src/tests/generated/dfb/DFB-25103.spec.ts',
  ],
};

// ─────────────────────────── Analyzer ───────────────────────────

export class ReferenceSpecAnalyzer {
  private cache = new Map<string, SpecStructure>();
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * Find and parse the best reference spec for the given category.
   * Returns null if no reference exists for this category.
   */
  findBestReference(category: string): SpecStructure | null {
    const refs = REFERENCE_SPECS[category];
    if (!refs || refs.length === 0) return null;

    for (const relPath of refs) {
      const absPath = path.resolve(this.projectRoot, relPath);
      if (!fs.existsSync(absPath)) continue;

      if (this.cache.has(absPath)) return this.cache.get(absPath)!;

      const structure = this.parseSpec(absPath);
      if (structure) {
        this.cache.set(absPath, structure);
        console.log(`   📐 ReferenceSpecAnalyzer: Loaded structure from ${relPath}`);
        return structure;
      }
    }
    return null;
  }

  /**
   * Parse a spec file into its structural components.
   */
  private parseSpec(filePath: string): SpecStructure | null {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }

    const imports = this.extractImports(content);
    const blocks = this.extractStepBlocks(content);
    const preconditionBlocks: StructuralBlock[] = [];
    const testStepBlocks: StructuralBlock[] = [];
    const validationBlocks: StructuralBlock[] = [];

    for (const block of blocks) {
      const cat = this.categorizeBlock(block.name, block.code);
      block.category = cat;

      if (['login', 'agent-email-capture', 'office-config', 'carrier-search',
        'carrier-visibility', 'dme-carrier-toggle'].includes(cat)) {
        preconditionBlocks.push(block);
      } else if (cat === 'btms-final-verify') {
        validationBlocks.push(block);
      } else {
        testStepBlocks.push(block);
      }
    }

    const navigationPattern: SpecStructure['navigationPattern'] =
      content.includes('new URL(sharedPage.url()).origin') ? 'url-based' : 'click-home';

    const helperImport: SpecStructure['helperImport'] =
      content.includes('commissionHelper') ? 'commissionHelper' : 'dfbHelpers';

    return {
      imports,
      preconditionBlocks,
      testStepBlocks,
      validationBlocks,
      navigationPattern,
      helperImport,
      sourceFile: filePath,
    };
  }

  /**
   * Extract the import block from the top of the file.
   */
  private extractImports(content: string): string {
    const lines = content.split('\n');
    const importLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('import ') || (importLines.length > 0 && line.trim() === '')) {
        importLines.push(line);
      } else if (importLines.length > 0 && !line.startsWith('import ')) {
        break;
      }
    }
    return importLines.join('\n').trim();
  }

  /**
   * Extract all test.step blocks with their names and code bodies.
   */
  private extractStepBlocks(content: string): StructuralBlock[] {
    const blocks: StructuralBlock[] = [];
    const stepRegex = /await test\.step\("([^"]+)",\s*async\s*\(\)\s*=>\s*\{/g;
    let match;

    while ((match = stepRegex.exec(content)) !== null) {
      const stepName = match[1];
      const startIdx = match.index + match[0].length;
      const code = this.extractBlockBody(content, startIdx);
      if (code) {
        blocks.push({
          name: stepName,
          code: code.trim(),
          category: 'other',
        });
      }
    }
    return blocks;
  }

  /**
   * Extract the body of a brace-delimited block using brace counting.
   */
  private extractBlockBody(content: string, startIdx: number): string | null {
    let depth = 1;
    let i = startIdx;
    while (i < content.length && depth > 0) {
      if (content[i] === '{') depth++;
      else if (content[i] === '}') depth--;
      i++;
    }
    if (depth !== 0) return null;
    // -1 to exclude the closing brace
    return content.substring(startIdx, i - 1);
  }

  /**
   * Categorize a step block by its name and code content.
   */
  private categorizeBlock(name: string, code: string): BlockCategory {
    const n = name.toLowerCase();
    const c = code.toLowerCase();

    if (n.includes('login btms') || n.includes('login') && !n.includes('dme') && !n.includes('tnx'))
      return 'login';
    if (n.includes('agent') && (n.includes('email') || n.includes('search')))
      return 'agent-email-capture';
    if (n.includes('pre-condition') || n.includes('office config') ||
        (n.includes('precondition') && n.includes('office')))
      return 'office-config';
    if (n.includes('carrier search') || (n.includes('carrier') && n.includes('search') && !n.includes('dme')))
      return 'carrier-search';
    if (n.includes('carrier') && (n.includes('visibility') || n.includes('loadboard') || n.includes('toggle')))
      return c.includes('switchto dme') || c.includes('switchtodme') ? 'dme-carrier-toggle' : 'carrier-visibility';
    if (n.includes('dme') && (n.includes('carrier') || n.includes('toggle')))
      return 'dme-carrier-toggle';
    if (n.includes('customer') && n.includes('create'))
      return 'customer-search-create';
    if (n.includes('fill') && (n.includes('load') || n.includes('form')))
      return 'form-fill';
    if (n.includes('create load') && n.includes('rate'))
      return 'create-load-rate';
    if (n.includes('carrier tab') || (n.includes('carrier') && n.includes('offer rate')))
      return 'carrier-tab';
    if (n.includes('save') && (n.includes('alert') || n.includes('contact') || n.includes('carrier contact')))
      return 'save-alert';
    if (n.includes('validate') && n.includes('view mode'))
      return 'view-mode-validate';
    if (n.includes('post') && n.includes('load'))
      return 'post-load';
    if (n.includes('dme') && (n.includes('verify') || n.includes('status')))
      return 'dme-verify';
    if (n.includes('tnx') && (n.includes('verify') || n.includes('matched')))
      return 'tnx-verify';
    if (n.includes('btms') && (n.includes('booked') || n.includes('verify') || n.includes('bids') || n.includes('carrier detail')))
      return 'btms-final-verify';

    // Fallback: check code content
    if (c.includes('switchto dme') || c.includes('switchtodme'))
      return n.includes('verify') || n.includes('status') ? 'dme-verify' : 'dme-carrier-toggle';
    if (c.includes('switchtotnx'))
      return 'tnx-verify';
    if (c.includes('refreshandvalidateloadstatus') && c.includes('booked'))
      return 'btms-final-verify';

    return 'other';
  }

  /**
   * Build a template-ready import block for the given category and type.
   * Always uses the reference spec's exact imports (deduplicated).
   */
  getTemplateImports(structure: SpecStructure): string {
    const lines = structure.imports.split('\n').filter(l => l.trim());
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const line of lines) {
      const normalized = line.trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        deduped.push(line);
      }
    }
    return deduped.join('\n');
  }

  /**
   * Get precondition code blocks from the reference, ready to inject.
   * Returns an array of { stepName, code } pairs.
   */
  getTemplatePreconditions(structure: SpecStructure): Array<{ stepName: string; code: string }> {
    return structure.preconditionBlocks
      .filter(b => b.category !== 'login')
      .map(b => ({ stepName: b.name, code: b.code }));
  }

  /**
   * Get the final validation block code from the reference.
   */
  getTemplateValidation(structure: SpecStructure): Array<{ stepName: string; code: string }> {
    return structure.validationBlocks.map(b => ({ stepName: b.name, code: b.code }));
  }

  /**
   * Check if a reference structure exists for the given category.
   */
  hasReference(category: string): boolean {
    return !!REFERENCE_SPECS[category];
  }
}
