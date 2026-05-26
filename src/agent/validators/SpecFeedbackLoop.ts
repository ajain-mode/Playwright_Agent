/**
 * Spec Feedback Loop (Agent 4)
 *
 * Compares the generated spec against the original test case steps from the CSV.
 * - Steps with no match in the spec (similarity < MISSING_THRESHOLD) → generates
 *   new test.step code and injects it at the correct position.
 * - Steps with a low-confidence match (MISSING_THRESHOLD ≤ sim < MATCHED_THRESHOLD)
 *   → annotates the spec with a review comment so a human can verify intent.
 *
 * Pipeline position: runs after SpecValidator (Agent 3), before final file write.
 *
 * @author AI Agent Generator
 * @created 2026-05-07
 */

import { TestCaseInput } from '../types/TestCaseTypes';
import { ProcessedStep } from '../analyzers/StepProcessor';
import { CodeGenerator } from '../generators/CodeGenerator';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface StepFeedback {
  csvStepNumber: number;
  csvStepText: string;
  /** Label of the best-matching spec step, if any */
  specStepLabel?: string;
  /** Jaccard word-similarity score against the best-matching spec step */
  similarityScore: number;
  issueType: 'missing' | 'low-match';
  /** Generated test.step block (only set for missing steps) */
  generatedCode?: string;
}

export interface FeedbackReport {
  testCaseId: string;
  totalCsvSteps: number;
  stepsMatched: number;
  stepsMissing: StepFeedback[];
  stepsLowMatch: StepFeedback[];
  correctionsApplied: boolean;
  summary: string;
}

export interface FeedbackLoopResult {
  correctedContent: string;
  report: FeedbackReport;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

interface SpecStepBlock {
  label: string;
  stepNumber: number;
  startIndex: number;
  endIndex: number;
}

// ─── Main class ───────────────────────────────────────────────────────────────

export class SpecFeedbackLoop {
  /** CSV step is "missing" if best spec similarity < this threshold */
  private static readonly MISSING_THRESHOLD = 0.25;
  /** CSV step is "matched" if best spec similarity >= this threshold */
  private static readonly MATCHED_THRESHOLD = 0.5;

  constructor(private readonly generator: CodeGenerator) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // Public API
  // ═══════════════════════════════════════════════════════════════════════════

  async run(
    specContent: string,
    testCase: TestCaseInput,
    _processedSteps: ProcessedStep[],
  ): Promise<FeedbackLoopResult> {
    console.log(`\n🔄 Running spec feedback loop for ${testCase.id}...`);

    const specSteps = this.extractSpecSteps(specContent);
    console.log(
      `   📊 Spec: ${specSteps.length} test.step blocks | CSV: ${testCase.steps.length} steps`,
    );
    const { missing, lowMatch } = this.classifySteps(testCase, specSteps);

    let correctedContent = specContent;
    const missingWithCode: StepFeedback[] = [];

    // Step 1: Annotate low-match steps (in reverse position order, safe for indices)
    if (lowMatch.length > 0) {
      console.log(`   ℹ️  ${lowMatch.length} low-match step(s) — adding review annotations`);
      correctedContent = this.annotateSteps(correctedContent, specSteps, lowMatch);
    }

    // Step 2: Generate + inject code for missing steps
    if (missing.length > 0) {
      console.log(`   ⚠️  ${missing.length} missing step(s) — generating code...`);
      const generated = await this.generateMissingCode(missing, testCase);
      // Re-parse after annotations so insertion positions are accurate
      const refreshedSteps = this.extractSpecSteps(correctedContent);
      correctedContent = this.injectMissingSteps(correctedContent, refreshedSteps, generated);
      missingWithCode.push(...generated);
    }

    const correctionsApplied = missingWithCode.some(s => !!s.generatedCode);
    const stepsMatched = testCase.steps.length - missing.length - lowMatch.length;

    const report: FeedbackReport = {
      testCaseId: testCase.id,
      totalCsvSteps: testCase.steps.length,
      stepsMatched,
      stepsMissing: missingWithCode,
      stepsLowMatch: lowMatch,
      correctionsApplied,
      summary:
        `${stepsMatched}/${testCase.steps.length} matched; ` +
        `${missingWithCode.length} missing (code injected); ` +
        `${lowMatch.length} flagged for review`,
    };

    if (correctionsApplied || lowMatch.length > 0) {
      console.log(`   📋 Feedback summary: ${report.summary}`);
    } else {
      console.log(`   ✅ All ${stepsMatched} CSV steps are covered in spec`);
    }

    return { correctedContent, report };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Step extraction from generated spec
  // ═══════════════════════════════════════════════════════════════════════════

  private extractSpecSteps(content: string): SpecStepBlock[] {
    const results: SpecStepBlock[] = [];
    const headerRe =
      /await\s+test\.step\s*\(\s*["'`]([^"'`]*?)["'`]\s*,\s*async\s*\(\s*\)\s*=>\s*\{/g;
    let m: RegExpExecArray | null;

    while ((m = headerRe.exec(content)) !== null) {
      const label = m[1];
      const numMatch = label.match(/step\s*(\d+)/i);
      const stepNumber = numMatch ? parseInt(numMatch[1], 10) : 0;

      const bodyStart = m.index + m[0].length;
      const blockEnd = this.findBlockEnd(content, bodyStart);
      if (blockEnd === -1) continue;

      results.push({ label, stepNumber, startIndex: m.index, endIndex: blockEnd });
    }

    return results;
  }

  /**
   * Find the character index just past the closing `);` of an `async () => { … }` body.
   * bodyStart must be positioned immediately after the opening `{` of that body.
   * Handles string literals (single, double, template) to avoid false brace counting.
   */
  private findBlockEnd(content: string, bodyStart: number): number {
    let depth = 0;
    let inStr = false;
    let strCh = '';
    let i = bodyStart;

    while (i < content.length) {
      const ch = content[i];

      if (inStr) {
        if (ch === '\\') { i += 2; continue; }
        if (ch === strCh) inStr = false;
      } else if (ch === '/' && content[i + 1] === '/') {
        // Skip line comment — apostrophes in comments must not trigger string mode
        const nl = content.indexOf('\n', i);
        i = nl === -1 ? content.length : nl + 1;
        continue;
      } else if (ch === '/' && content[i + 1] === '*') {
        // Skip block comment
        const end = content.indexOf('*/', i + 2);
        i = end === -1 ? content.length : end + 2;
        continue;
      } else if (ch === '"' || ch === "'" || ch === '`') {
        inStr = true;
        strCh = ch;
      } else if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        if (depth === 0) {
          // This `}` closes the async body; consume the trailing `);`
          const after = content.substring(i + 1);
          const close = after.match(/^\s*\)\s*;/);
          return close ? i + 1 + close[0].length : i + 1;
        }
        depth--;
      }

      i++;
    }

    return -1;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Step classification
  // ═══════════════════════════════════════════════════════════════════════════

  private classifySteps(
    testCase: TestCaseInput,
    specSteps: SpecStepBlock[],
  ): { missing: StepFeedback[]; lowMatch: StepFeedback[] } {
    const missing: StepFeedback[] = [];
    const lowMatch: StepFeedback[] = [];
    const usedIndices = new Set<number>();

    for (const csvStep of testCase.steps) {
      // If this step number falls inside a composite [CSV X-Y] range in the spec,
      // it was absorbed by a FormStepGrouper composite group — count as matched.
      const compositeIdx = specSteps.findIndex(s =>
        this.isInCompositeRange(csvStep.stepNumber, s.label)
      );
      if (compositeIdx !== -1) {
        // Do NOT add compositeIdx to usedIndices — multiple CSV steps share the same composite spec step
        continue;
      }

      const { score, idx } = this.bestSpecMatch(
        csvStep.action,
        csvStep.stepNumber,
        specSteps,
        usedIndices,
      );

      if (score >= SpecFeedbackLoop.MATCHED_THRESHOLD) {
        usedIndices.add(idx);
      } else if (score >= SpecFeedbackLoop.MISSING_THRESHOLD) {
        // Before treating as low-match, verify that SpecValidator STEP-001 would accept
        // the best-matching spec step as coverage for this CSV step. STEP-001 uses exact
        // "Step N:" / [CSV X-Y] / keyword matching — not Jaccard. If none of those
        // criteria are satisfied, a FEEDBACK comment won't prevent the hard block, so
        // promote this step to missing so a proper test.step block gets injected instead.
        if (this.wouldPassStepCoverage(csvStep.stepNumber, csvStep.action, specSteps)) {
          usedIndices.add(idx);
          lowMatch.push({
            csvStepNumber: csvStep.stepNumber,
            csvStepText: csvStep.action,
            specStepLabel: specSteps[idx]?.label,
            similarityScore: score,
            issueType: 'low-match',
          });
        } else {
          // Low-match but STEP-001 would still fire — inject a proper test.step block
          missing.push({
            csvStepNumber: csvStep.stepNumber,
            csvStepText: csvStep.action,
            similarityScore: score,
            issueType: 'missing',
          });
        }
      } else {
        missing.push({
          csvStepNumber: csvStep.stepNumber,
          csvStepText: csvStep.action,
          similarityScore: score,
          issueType: 'missing',
        });
      }
    }

    return { missing, lowMatch };
  }

  /** Returns true if csvStepNumber falls within the [CSV X-Y] range declared in a composite spec step label. */
  private isInCompositeRange(csvStepNumber: number, specStepLabel: string): boolean {
    const m = specStepLabel.match(/\[CSV\s+(\d+)[–\-](\d+)\]/i);
    if (!m) return false;
    const start = parseInt(m[1], 10);
    const end = parseInt(m[2], 10);
    return csvStepNumber >= start && csvStepNumber <= end;
  }

  /**
   * Returns true if any spec step would satisfy SpecValidator STEP-001 for this CSV step.
   * Mirrors SpecValidator.findStepBlockRange title-match logic: "Step N:", [CSV X-Y] range,
   * or first-24-chars keyword match. Used to decide whether a low-match step needs a real
   * test.step injection or if a FEEDBACK annotation is sufficient.
   */
  private wouldPassStepCoverage(
    csvStepNumber: number,
    csvAction: string,
    specSteps: SpecStepBlock[],
  ): boolean {
    const needle = `Step ${csvStepNumber}:`;
    const kwRaw = csvAction.replace(/['"`\\]/g, '').trim();
    const kwSlice = kwRaw.length >= 6 ? kwRaw.slice(0, 48) : '';
    const keyword = kwSlice.length >= 6 ? kwSlice.toLowerCase().slice(0, Math.min(24, kwSlice.length)) : '';

    for (const s of specSteps) {
      if (s.label.includes(needle)) return true;

      const csvM = s.label.match(/\[CSV\s+(\d+)[-–](\d+)\]/i);
      if (csvM) {
        const rangeStart = parseInt(csvM[1], 10);
        const rangeEnd = parseInt(csvM[2], 10);
        if (csvStepNumber >= rangeStart && csvStepNumber <= rangeEnd) return true;
      }

      if (keyword.length >= 6 && s.label.toLowerCase().includes(keyword)) return true;
    }

    return false;
  }

  private bestSpecMatch(
    csvText: string,
    csvStepNumber: number,
    specSteps: SpecStepBlock[],
    usedIndices: Set<number>,
  ): { score: number; idx: number } {
    let best = { score: 0, idx: -1 };

    for (let i = 0; i < specSteps.length; i++) {
      if (usedIndices.has(i)) continue;
      const score = this.wordJaccard(csvText, specSteps[i].label);
      if (score > best.score) best = { score, idx: i };
    }

    // Secondary: fall back to step-number alignment when text similarity is low
    if (best.score < SpecFeedbackLoop.MISSING_THRESHOLD && csvStepNumber > 0) {
      const ni = specSteps.findIndex(
        (s, i) => !usedIndices.has(i) && s.stepNumber === csvStepNumber,
      );
      if (ni !== -1) {
        const ns = this.wordJaccard(csvText, specSteps[ni].label);
        if (ns > best.score) best = { score: ns, idx: ni };
      }
    }

    return best;
  }

  /** Word-level Jaccard similarity (case-insensitive, punctuation-stripped). */
  private wordJaccard(a: string, b: string): number {
    const tokens = (s: string) =>
      new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean));
    const A = tokens(a);
    const B = tokens(b);
    const inter = [...A].filter(w => B.has(w)).length;
    const union = new Set([...A, ...B]).size;
    return union > 0 ? inter / union : 0;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Code generation for missing steps
  // ═══════════════════════════════════════════════════════════════════════════

  private async generateMissingCode(
    missing: StepFeedback[],
    testCase: TestCaseInput,
  ): Promise<StepFeedback[]> {
    const results: StepFeedback[] = [];
    for (const fb of missing) {
      try {
        const code = await this.generator.generatePublicStepBlock(
          fb.csvStepText,
          fb.csvStepNumber,
          testCase,
        );
        results.push({ ...fb, generatedCode: code });
        console.log(
          `   ➕ Step ${fb.csvStepNumber} code generated: ${fb.csvStepText.substring(0, 60)}`,
        );
      } catch (e) {
        results.push(fb);
        console.warn(
          `   ⚠️  Code gen failed for Step ${fb.csvStepNumber}: ${(e as Error).message}`,
        );
      }
    }
    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Spec mutation
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Insert review-annotation comments above the best-matching spec step for each
   * low-match CSV step. Processes in REVERSE position order so string indices stay valid.
   */
  private annotateSteps(
    content: string,
    specSteps: SpecStepBlock[],
    lowMatch: StepFeedback[],
  ): string {
    type Annotation = { insertAt: number; comment: string };
    const annotations: Annotation[] = [];

    for (const fb of lowMatch) {
      let best: SpecStepBlock | null = null;
      let bestScore = 0;
      for (const s of specSteps) {
        const score = this.wordJaccard(fb.csvStepText, s.label);
        if (score > bestScore) { bestScore = score; best = s; }
      }
      if (!best) continue;

      const safeText = fb.csvStepText.substring(0, 120).replace(/"/g, "'");
      const comment =
        `      // ⚠️ FEEDBACK [CSV Step ${fb.csvStepNumber}]: "${safeText}"\n` +
        `      //   Spec similarity: ${(fb.similarityScore * 100).toFixed(0)}%` +
        ` — verify this step covers the CSV intent\n`;

      annotations.push({ insertAt: best.startIndex, comment });
    }

    annotations.sort((a, b) => b.insertAt - a.insertAt);
    let result = content;
    for (const { insertAt, comment } of annotations) {
      result = result.slice(0, insertAt) + comment + result.slice(insertAt);
    }
    return result;
  }

  /**
   * Inject generated test.step blocks at the correct position for each missing step.
   * Calculates all insertion points first, then applies in reverse position order
   * so that earlier insertions do not shift later indices.
   */
  private injectMissingSteps(
    content: string,
    specSteps: SpecStepBlock[],
    missing: StepFeedback[],
  ): string {
    const toInject = missing
      .filter(fb => fb.generatedCode)
      .map(fb => ({
        fb,
        insertPos: this.findInsertionPos(content, specSteps, fb.csvStepNumber),
      }))
      .filter(({ insertPos }) => insertPos !== -1)
      // Reverse by position; equal positions: higher step number processed first so
      // after all insertions the steps appear in ascending order at that location.
      .sort((a, b) =>
        b.insertPos !== a.insertPos
          ? b.insertPos - a.insertPos
          : b.fb.csvStepNumber - a.fb.csvStepNumber,
      );

    let result = content;
    for (const { fb, insertPos } of toInject) {
      const block = `\n\n      ${fb.generatedCode!.trim()}`;
      result = result.slice(0, insertPos) + block + result.slice(insertPos);
    }
    return result;
  }

  /**
   * Find the character index at which to insert a missing step with the given number.
   * Preference order:
   *   1. Immediately after the last spec step whose number is < csvStepNumber
   *   2. Immediately before the first spec step (insert at the top of the step list)
   *   3. Before the outer test body's closing bracket (absolute fallback)
   */
  private findInsertionPos(
    content: string,
    specSteps: SpecStepBlock[],
    csvStepNumber: number,
  ): number {
    const prior = specSteps
      .filter(s => s.stepNumber > 0 && s.stepNumber < csvStepNumber && s.endIndex <= content.length)
      .sort((a, b) => b.stepNumber - a.stepNumber);

    if (prior.length > 0) return prior[0].endIndex;

    // No preceding step found — insert before the first numbered step
    const firstStep = specSteps
      .filter(s => s.stepNumber > 0)
      .sort((a, b) => a.stepNumber - b.stepNumber)[0];

    if (firstStep && firstStep.startIndex <= content.length) return firstStep.startIndex;

    return this.findTestBodyEnd(content);
  }

  /** Character index of the last `  });` line that closes the outer test body. */
  private findTestBodyEnd(content: string): number {
    const lines = content.split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const t = lines[i].trim();
      if ((t === '});' || t === '})') && lines[i].length <= 6) {
        let pos = 0;
        for (let j = 0; j < i; j++) pos += lines[j].length + 1;
        return pos;
      }
    }
    return Math.max(0, content.length - 5);
  }
}
