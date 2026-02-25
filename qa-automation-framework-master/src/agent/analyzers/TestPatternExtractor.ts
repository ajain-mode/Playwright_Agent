/**
 * Test Pattern Extractor
 *
 * Scans existing spec files (hand-written AND generated) to extract reusable
 * step patterns. The CodeGenerator queries this before falling back to keyword
 * matching, so new test cases automatically reuse functions from proven tests.
 *
 * Priority order:
 *   1. Hand-written tests (src/tests/dfb/, src/tests/carrier/, etc.) — most reliable
 *   2. Generated tests marked as working (src/tests/generated/) — second priority
 *
 * @author AI Agent Generator
 * @created 2026-02-20
 */

import fs from 'fs';
import path from 'path';

export interface ExtractedPattern {
  /** Keywords that describe this pattern (from step name, lowercased) */
  keywords: string[];
  /** The actual code inside the test.step block */
  code: string;
  /** Source file this pattern was extracted from */
  sourceFile: string;
  /** Step name as written in the spec */
  stepName: string;
  /** Whether this came from a hand-written (true) or generated (false) spec */
  isHandWritten: boolean;
  /** Functional category: login, navigation, form, validation, multi-app, carrier, etc. */
  category: FunctionCategory;
}

export type FunctionCategory =
  | 'login'
  | 'navigation'
  | 'office-setup'
  | 'agent-email'
  | 'customer'
  | 'carrier'
  | 'form-fill'
  | 'load-creation'
  | 'validation'
  | 'multi-app'
  | 'dme'
  | 'tnx'
  | 'alert'
  | 'toggle'
  | 'post-automation'
  | 'bid-history'
  | 'other';

export class TestPatternExtractor {
  private patterns: ExtractedPattern[] = [];
  private scanned = false;
  private testsRoot: string;

  constructor(testsRoot?: string) {
    this.testsRoot = testsRoot || path.resolve(__dirname, '../../tests');
  }

  /**
   * Scan all spec files and extract step patterns. Call once per session.
   * Returns the number of patterns extracted.
   */
  scan(): number {
    if (this.scanned) return this.patterns.length;

    const handWrittenDirs = [
      'dfb', 'carrier', 'edi', 'salesLead', 'nonOperationalLoads',
    ].map(d => path.join(this.testsRoot, d));

    const generatedDir = path.join(this.testsRoot, 'generated');

    // Scan hand-written tests first (higher priority)
    for (const dir of handWrittenDirs) {
      if (fs.existsSync(dir)) {
        this.scanDirectory(dir, true);
      }
    }

    // Scan generated tests second
    if (fs.existsSync(generatedDir)) {
      this.scanDirectory(generatedDir, false);
    }

    this.scanned = true;
    console.log(`   📚 TestPatternExtractor: extracted ${this.patterns.length} reusable patterns from existing tests`);
    return this.patterns.length;
  }

  /**
   * Find the best matching pattern for a given action description.
   * Returns the pattern code if a match is found (score >= threshold), else null.
   */
  findPattern(action: string): ExtractedPattern | null {
    if (!this.scanned) this.scan();
    if (this.patterns.length === 0) return null;

    const actionWords = this.tokenize(action);
    if (actionWords.length === 0) return null;

    let bestMatch: ExtractedPattern | null = null;
    let bestScore = 0;
    const threshold = 0.4; // at least 40% keyword overlap

    for (const pattern of this.patterns) {
      const score = this.calculateMatchScore(actionWords, pattern.keywords);

      // Hand-written patterns get a bonus
      const adjustedScore = pattern.isHandWritten ? score * 1.2 : score;

      if (adjustedScore > bestScore && adjustedScore >= threshold) {
        bestScore = adjustedScore;
        bestMatch = pattern;
      }
    }

    return bestMatch;
  }

  /**
   * Find all patterns matching a functional category.
   */
  findByCategory(category: FunctionCategory): ExtractedPattern[] {
    if (!this.scanned) this.scan();
    return this.patterns.filter(p => p.category === category);
  }

  /**
   * Get the full extracted pattern library (for debugging/inspection).
   */
  getAllPatterns(): ExtractedPattern[] {
    if (!this.scanned) this.scan();
    return [...this.patterns];
  }

  // ======================== PRIVATE ========================

  private scanDirectory(dir: string, isHandWritten: boolean): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        this.scanDirectory(fullPath, isHandWritten);
      } else if (entry.name.endsWith('.spec.ts')) {
        this.extractFromFile(fullPath, isHandWritten);
      }
    }
  }

  private extractFromFile(filePath: string, isHandWritten: boolean): void {
    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      return;
    }

    // Skip files with smart quotes in import area (corrupted files)
    if (/[\u201C\u201D]/.test(content.split('\n').slice(0, 5).join(''))) {
      return;
    }

    const relPath = path.relative(this.testsRoot, filePath);

    // Find test.step blocks using brace-counting (handles nested braces correctly)
    const stepStart = /await\s+test\.step\(\s*"([^"]+)"\s*,\s*async\s*\(\)\s*=>\s*\{/g;
    let match;

    while ((match = stepStart.exec(content)) !== null) {
      const stepName = match[1];
      const bodyStartIdx = match.index + match[0].length;

      // Count braces to find the matching closing brace
      let depth = 1;
      let i = bodyStartIdx;
      while (i < content.length && depth > 0) {
        const ch = content[i];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        // Skip string literals to avoid counting braces inside strings
        else if (ch === '"' || ch === "'" || ch === '`') {
          const quote = ch;
          i++;
          while (i < content.length && content[i] !== quote) {
            if (content[i] === '\\') i++; // skip escaped characters
            i++;
          }
        }
        i++;
      }

      if (depth !== 0) continue; // unmatched braces, skip

      const stepCode = content.slice(bodyStartIdx, i - 1).trim();

      if (this.isPlaceholderCode(stepCode)) continue;

      const meaningfulLines = stepCode
        .split('\n')
        .filter(l => l.trim() && !l.trim().startsWith('//'))
        .length;
      if (meaningfulLines < 2) continue;

      const keywords = this.tokenize(stepName);
      const category = this.categorizeStep(stepName, stepCode);

      this.patterns.push({
        keywords,
        code: this.normalizeIndentation(stepCode),
        sourceFile: relPath,
        stepName,
        isHandWritten,
        category,
      });
    }
  }

  private isPlaceholderCode(code: string): boolean {
    const stripped = code
      .replace(/\/\/.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!stripped) return true;

    // Only contains waitForMultipleLoadStates
    if (/^await\s+pages\.basePage\.waitForMultipleLoadStates\(/.test(stripped) &&
        !stripped.includes('\n') && stripped.split(';').filter(s => s.trim()).length <= 1) {
      return true;
    }

    return false;
  }

  /**
   * Categorize a step into a functional category based on step name and code.
   */
  private categorizeStep(stepName: string, code: string): FunctionCategory {
    const lower = (stepName + ' ' + code).toLowerCase();

    if (lower.includes('btmslogin') || lower.includes('login btms')) return 'login';
    if (lower.includes('switchtotnx') || lower.includes('switch to tnx') || lower.includes('tnxlogin')) return 'tnx';
    if (lower.includes('switchtodme') || lower.includes('switch to dme') || lower.includes('dmelogin')) return 'dme';
    if (lower.includes('switchtobtms') || lower.includes('multiappmanager') || lower.includes('closeallsecondary')) return 'multi-app';
    if (lower.includes('agent') && lower.includes('email')) return 'agent-email';
    if (lower.includes('officepreconditions') || lower.includes('setupoffice') || lower.includes('office config')) return 'office-setup';
    if (lower.includes('toggle') || lower.includes('enable_dme') || lower.includes('tnxbids') || lower.includes('auto accept')) return 'toggle';
    if (lower.includes('post automation') || lower.includes('postautomation')) return 'post-automation';
    if (lower.includes('carrier') && (lower.includes('tab') || lower.includes('dispatch') || lower.includes('assigned'))) return 'carrier';
    if (lower.includes('carrier') && (lower.includes('search') || lower.includes('visibility'))) return 'carrier';
    if (lower.includes('customer') && (lower.includes('search') || lower.includes('cargo'))) return 'customer';
    if (lower.includes('createnonatabularload') || lower.includes('nontabularload') || lower.includes('create load') || lower.includes('fill') && lower.includes('form')) return 'form-fill';
    if (lower.includes('loadnumber') || lower.includes('getloadnumber') || lower.includes('load creation')) return 'load-creation';
    if (lower.includes('bid history') || lower.includes('bids report')) return 'bid-history';
    if (lower.includes('validatealert') || lower.includes('alert_patterns')) return 'alert';
    if (lower.includes('hoveroverheader') || lower.includes('clicksubheader') || lower.includes('navigate')) return 'navigation';
    if (lower.includes('expect') || lower.includes('validate') || lower.includes('verify') || lower.includes('assert')) return 'validation';

    return 'other';
  }

  /**
   * Tokenize text into lowercase keywords, stripping noise words.
   */
  private tokenize(text: string): string[] {
    const noiseWords = new Set([
      'the', 'a', 'an', 'to', 'and', 'or', 'in', 'on', 'of', 'for', 'is',
      'are', 'was', 'were', 'be', 'been', 'with', 'from', 'as', 'at', 'by',
      'it', 'its', 'this', 'that', 'step', 'csv', 'precondition',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1 && !noiseWords.has(w));
  }

  /**
   * Calculate overlap score between action words and pattern keywords.
   * Returns 0..1 (Jaccard-like similarity).
   */
  private calculateMatchScore(actionWords: string[], patternKeywords: string[]): number {
    if (actionWords.length === 0 || patternKeywords.length === 0) return 0;

    const actionSet = new Set(actionWords);
    const patternSet = new Set(patternKeywords);

    let matches = 0;
    for (const word of actionSet) {
      if (patternSet.has(word)) {
        matches++;
      } else {
        // Partial match: "carrier" matches "carriers", "validate" matches "validation"
        for (const pkw of patternSet) {
          if (pkw.startsWith(word) || word.startsWith(pkw)) {
            matches += 0.7;
            break;
          }
        }
      }
    }

    const union = new Set([...actionSet, ...patternSet]).size;
    return matches / union;
  }

  /**
   * Normalize indentation to 8 spaces (standard step body indent).
   */
  private normalizeIndentation(code: string): string {
    const lines = code.split('\n');
    // Find minimum indentation
    let minIndent = Infinity;
    for (const line of lines) {
      if (line.trim()) {
        const indent = line.match(/^(\s*)/)?.[1].length || 0;
        if (indent < minIndent) minIndent = indent;
      }
    }
    if (minIndent === Infinity) minIndent = 0;

    return lines
      .map(line => {
        if (!line.trim()) return '';
        return '        ' + line.slice(minIndent);
      })
      .join('\n')
      .trim();
  }
}

export default TestPatternExtractor;
