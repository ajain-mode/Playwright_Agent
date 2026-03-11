/**
 * LLM Service
 * Uses Claude CLI (claude -p) to leverage the user's Max plan for code generation,
 * value extraction, and code fixing. No API key required.
 * Gracefully degrades — returns null when Claude CLI is unavailable or calls fail.
 */

import { spawn, spawnSync } from 'child_process';
import { AgentConfig } from '../config/AgentConfig';
import { ExplicitValues } from '../types/TestCaseTypes';
import {
  SchemaContext,
  buildCodeGenSystemPrompt,
  buildCodeGenUserPrompt,
  buildValueExtractionPrompt,
  buildCodeFixPrompt,
  buildFullSpecPrompt,
} from './LLMPrompts';

/** Context passed alongside a step action for code generation */
export interface StepContext {
  schema: SchemaContext;
  testDataFields?: string[];
  /** Code from a similar reference spec to guide generation */
  referenceSpecCode?: string;
  /** Code from a secondary reference spec for POM method discovery */
  secondaryRefSpecCode?: string;
  /** Match score from TestCaseMatcher — when >= 0.7, adopt full reference structure */
  matchScore?: number;
}

export class LLMService {
  private config: AgentConfig;
  private cache: Map<string, string> = new Map();
  private enabled: boolean;

  constructor(config: AgentConfig) {
    this.config = config;

    if (config.llmEnabled === false) {
      this.enabled = false;
      console.log('LLM Service disabled via --no-llm flag. Using rule-based generation only.');
      return;
    }

    // Check if Claude CLI is available
    try {
      const result = spawnSync('claude', ['--version'], {
        encoding: 'utf-8',
        timeout: 10000,
        shell: true,
      });
      if (result.status === 0 && result.stdout) {
        this.enabled = true;
        const version = result.stdout.trim().split('\n')[0];
        console.log(`LLM Service initialized via Claude CLI (${version})`);
      } else {
        this.enabled = false;
        console.log('LLM Service disabled — Claude CLI not found. Using rule-based generation only.');
        if (result.stderr) {
          console.log(`  Claude CLI stderr: ${result.stderr.trim().substring(0, 200)}`);
        }
      }
    } catch {
      this.enabled = false;
      console.log('LLM Service disabled — Claude CLI not available. Using rule-based generation only.');
    }
  }

  /** Check if the LLM service is available */
  isAvailable(): boolean {
    return this.enabled;
  }

  /**
   * Generate Playwright code for a single test step action.
   * Returns executable TypeScript code string, or null on failure.
   */
  async generateStepCode(action: string, context: StepContext): Promise<string | null> {
    if (!this.isAvailable()) return null;

    // Check cache first
    const cacheKey = `step:${action}`;
    if (this.config.llmCacheEnabled && this.cache.has(cacheKey)) {
      console.log(`      LLM cache hit for: "${action.substring(0, 50)}..."`);
      return this.cache.get(cacheKey)!;
    }

    const systemPrompt = buildCodeGenSystemPrompt(context.schema);
    let userPrompt = buildCodeGenUserPrompt(action, context.testDataFields);

    // Append reference spec context so LLM can see how similar test cases are implemented
    if (context.referenceSpecCode) {
      const isHighMatch = (context.matchScore || 0) >= 0.7;
      const maxRefLength = isHighMatch ? 8000 : 3000;
      const instruction = isHighMatch
        ? '## Reference Spec (HIGH MATCH ≥70% — adopt the FULL step structure, method calls, and flow from this reference. Adjust only test-specific values like testData fields, load numbers, and carrier names):'
        : '## Reference Spec (from a similar existing test case — adapt patterns, do NOT copy verbatim):';
      userPrompt += `\n\n${instruction}\n\`\`\`typescript\n${context.referenceSpecCode.substring(0, maxRefLength)}\n\`\`\``;
    }

    // Append secondary reference for POM method discovery (e.g., DFB-97746 has carrier/load methods)
    if (context.secondaryRefSpecCode && !context.referenceSpecCode) {
      userPrompt += `\n\n## Secondary Reference (for POM method discovery only — use method signatures and patterns, but do NOT copy DFB-specific preconditions or flow):\n\`\`\`typescript\n${context.secondaryRefSpecCode.substring(0, 3000)}\n\`\`\``;
    }

    const code = await this.chatCompletion(systemPrompt, userPrompt);
    if (!code) return null;

    // Clean response — strip markdown fences if present
    const cleaned = this.stripMarkdownFences(code);

    // Basic validation: must contain await or pages. or expect
    if (!cleaned.includes('await') && !cleaned.includes('pages.') && !cleaned.includes('expect')) {
      console.log(`      LLM response doesn't look like executable code, discarding`);
      return null;
    }

    // Cache the result
    if (this.config.llmCacheEnabled) {
      this.cache.set(cacheKey, cleaned);
    }

    console.log(`      LLM generated code for: "${action.substring(0, 50)}..."`);
    return cleaned;
  }

  /**
   * Generate a COMPLETE .spec.ts file by adapting a reference spec to a new test case.
   * Used when TestCaseMatcher score >= 0.7 — bypasses step-by-step generation entirely.
   * Returns the complete spec file content, or null on failure.
   */
  async generateFullSpecFromReference(
    referenceSpecCode: string,
    testCaseId: string,
    testCaseTitle: string,
    testCaseCategory: string,
    preconditions: string[],
    steps: { stepNumber: number; action: string; expectedResult?: string }[],
    expectedResults: string[],
    testDataFields: string[],
    schema: SchemaContext,
  ): Promise<string | null> {
    if (!this.isAvailable()) return null;

    console.log(`   🧠 Full-spec LLM generation: adapting reference to ${testCaseId} (${steps.length} steps, ${expectedResults.length} expected results)`);

    const { system, user } = buildFullSpecPrompt(
      referenceSpecCode,
      testCaseId,
      testCaseTitle,
      testCaseCategory,
      preconditions,
      steps,
      expectedResults,
      testDataFields,
      schema,
    );

    // Full-spec generation needs a longer timeout (5 min) since it produces a complete 600+ line file
    const response = await this.chatCompletion(system, user, 300000);
    if (!response) {
      console.log(`   ⚠️ Full-spec LLM generation failed (no response — likely timeout or CLI error) — falling back to step-by-step`);
      return null;
    }
    console.log(`   📏 Full-spec LLM response: ${response.length} chars, ${response.split('\n').length} lines`);

    const cleaned = this.stripMarkdownFences(response);

    // Validate: must look like a complete spec file
    if (!cleaned.includes('test.describe') || !cleaned.includes('test.step')) {
      console.log(`   ⚠️ Full-spec LLM response doesn't look like a complete spec file, discarding`);
      return null;
    }

    // Validate: must reference the correct test case ID
    if (!cleaned.includes(testCaseId)) {
      console.log(`   ⚠️ Full-spec LLM response doesn't reference ${testCaseId}, discarding`);
      return null;
    }

    console.log(`   ✅ Full-spec LLM generation successful for ${testCaseId}`);
    return cleaned;
  }

  /**
   * Extract structured values from natural language precondition/step text.
   * Returns ExplicitValues object, or null on failure.
   */
  async extractValues(
    preconditionText: string,
    stepsText: string,
    expectedText: string
  ): Promise<ExplicitValues | null> {
    if (!this.isAvailable()) return null;

    // Check cache
    const cacheKey = `extract:${this.hashString(preconditionText + stepsText)}`;
    if (this.config.llmCacheEnabled && this.cache.has(cacheKey)) {
      try {
        return JSON.parse(this.cache.get(cacheKey)!) as ExplicitValues;
      } catch {
        // Cache corrupted, regenerate
      }
    }

    const { system, user } = buildValueExtractionPrompt(preconditionText, stepsText, expectedText);
    const response = await this.chatCompletion(system, user);
    if (!response) return null;

    try {
      const cleaned = this.stripMarkdownFences(response);
      const parsed = JSON.parse(cleaned);

      // Convert null values to undefined to match ExplicitValues interface
      const result: ExplicitValues = {
        precondition: this.nullsToUndefined(parsed.precondition || {}),
        formFields: this.nullsToUndefined(parsed.formFields || {}),
        preconditionSteps: [],
        testStepsRaw: [],
        expectedResultText: expectedText.trim(),
      };

      // Cache the raw JSON
      if (this.config.llmCacheEnabled) {
        this.cache.set(cacheKey, JSON.stringify(result));
      }

      console.log(`      LLM extracted values from precondition/steps text`);
      return result;
    } catch (e) {
      console.log(`      LLM value extraction failed to parse JSON: ${(e as Error).message}`);
      return null;
    }
  }

  /**
   * Fix broken generated code using error messages.
   * Returns the complete fixed code string, or null on failure.
   */
  async fixCode(code: string, errors: string[], schema: SchemaContext): Promise<string | null> {
    if (!this.isAvailable()) return null;

    const { system, user } = buildCodeFixPrompt(code, errors, schema);
    const response = await this.chatCompletion(system, user);
    if (!response) return null;

    const cleaned = this.stripMarkdownFences(response);

    // Must still look like a complete test file
    if (!cleaned.includes('test.describe') && !cleaned.includes('test(')) {
      console.log(`      LLM fix response doesn't contain test structure, discarding`);
      return null;
    }

    console.log(`      LLM fixed ${errors.length} code issue(s)`);
    return cleaned;
  }

  /**
   * Core method: invoke Claude CLI in print mode.
   * Pipes the prompt via stdin, returns the response text or null on error.
   * @param timeoutMs — override default timeout (120s) for large prompts like full-spec generation
   */
  private async chatCompletion(systemPrompt: string, userPrompt: string, timeoutMs?: number): Promise<string | null> {
    for (let attempt = 0; attempt <= this.config.llmMaxRetries; attempt++) {
      try {
        const response = await this.invokeClaudeCLI(systemPrompt, userPrompt, timeoutMs);
        if (response && response.trim()) {
          return response.trim();
        }
        console.log(`      LLM returned empty response (attempt ${attempt + 1}/${this.config.llmMaxRetries + 1}) — prompt length: ${(systemPrompt.length + userPrompt.length)} chars`);
      } catch (error: any) {
        console.log(`      LLM CLI error (attempt ${attempt + 1}/${this.config.llmMaxRetries + 1}): ${error.message}`);
        if (attempt < this.config.llmMaxRetries) {
          await this.sleep(1000 * (attempt + 1));
        }
      }
    }
    return null;
  }

  /**
   * Spawn Claude CLI process, pipe prompt via stdin, collect stdout.
   */
  private invokeClaudeCLI(systemPrompt: string, userPrompt: string, timeoutMs?: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const args = ['-p', '--output-format', 'text'];
      // Only pass --model if a valid model name is configured
      if (this.config.modelName) {
        args.push('--model', this.config.modelName);
      }

      const effectiveTimeout = timeoutMs || 120000;
      const proc = spawn('claude', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        timeout: effectiveTimeout,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      proc.on('close', (code) => {
        if (code === 0 && stdout.trim()) {
          resolve(stdout.trim());
        } else if (code === 0) {
          console.log(`      LLM CLI returned empty stdout (exit code 0)`);
          console.log(`      LLM CLI prompt length: system=${systemPrompt.length}, user=${userPrompt.length}, total=${systemPrompt.length + userPrompt.length}`);
          if (stderr.trim()) {
            console.log(`      LLM CLI stderr: ${stderr.trim().substring(0, 500)}`);
          }
          resolve(null);
        } else {
          console.log(`      LLM CLI exit code: ${code}`);
          console.log(`      LLM CLI prompt length: system=${systemPrompt.length}, user=${userPrompt.length}, total=${systemPrompt.length + userPrompt.length}`);
          if (stderr.trim()) {
            console.log(`      LLM CLI stderr: ${stderr.trim().substring(0, 500)}`);
          }
          const errMsg = stderr.trim().substring(0, 500) || `exit code ${code}`;
          reject(new Error(errMsg));
        }
      });

      proc.on('error', (err) => {
        this.enabled = false;
        reject(new Error(`Claude CLI not found: ${err.message}`));
      });

      // Combine system + user prompts with clear separation
      const fullPrompt = `<instructions>\n${systemPrompt}\n</instructions>\n\n${userPrompt}`;
      console.log(`      LLM CLI args: ${args.join(' ')} | prompt: ${fullPrompt.length} chars`);
      proc.stdin.write(fullPrompt);
      proc.stdin.end();
    });
  }

  /** Strip markdown code fences from LLM output */
  private stripMarkdownFences(text: string): string {
    return text
      .replace(/^```(?:typescript|ts|javascript|js)?\s*\n?/gm, '')
      .replace(/\n?```\s*$/gm, '')
      .trim();
  }

  /** Convert null values in an object to undefined */
  private nullsToUndefined(obj: Record<string, any>): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = value === null ? undefined : String(value);
    }
    return result;
  }

  /** Simple string hash for cache keys */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(36);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
