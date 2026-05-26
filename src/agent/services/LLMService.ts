/**
 * LLM Service
 * Uses Claude CLI (claude -p) to leverage the user's Max plan for code generation,
 * value extraction, and code fixing. No API key required.
 * Gracefully degrades — returns null when Claude CLI is unavailable or calls fail.
 */

import { spawn, spawnSync } from 'child_process';
import fs from 'fs';
import https from 'https';
import path from 'path';
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

    if (config.llmEnabled !== true) {
      this.enabled = false;
      console.log('LLM Service disabled. Using rule-based generation only.');
      return;
    }

    // Check if Claude CLI is available (only when LLM is explicitly enabled)
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
        console.log(`LLM Service disabled — claude --version exited with status=${result.status}, stdout="${(result.stdout || '').trim().substring(0, 100)}", stderr="${(result.stderr || '').trim().substring(0, 200)}"`);
        console.log('  → All LLM tiers will be skipped. Using rule-based generation only.');
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

    // Append secondary reference for POM method discovery (e.g., DFB-97739 has carrier/load methods)
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
    testData: Record<string, string> | string[],
    schema: SchemaContext,
    mode: 'adapt' | 'generate' = 'adapt',
  ): Promise<string | null> {
    if (!this.isAvailable()) return null;

    console.log(`   🧠 Full-spec LLM generation: adapting reference to ${testCaseId} (${steps.length} steps, ${expectedResults.length} expected results, mode=${mode})`);

    const { system, user } = buildFullSpecPrompt(
      referenceSpecCode,
      testCaseId,
      testCaseTitle,
      testCaseCategory,
      preconditions,
      steps,
      expectedResults,
      testData,
      schema,
      mode,
    );

    // Full-spec generation timeout: 90s — with --tools "" Claude outputs text directly, no tool loops
    const callStartMs = Date.now();
    const response = await this.chatCompletion(system, user, 90000);
    if (!response) {
      // Claude returned empty stdout — it may have written the file directly via Write tool.
      // Check the expected spec file path before giving up.
      const writtenCode = this.tryReadWrittenSpecFile(testCaseId, testCaseCategory, callStartMs);
      if (writtenCode) return writtenCode;
      console.log(`   ⚠️ Full-spec LLM generation failed (no response — likely timeout or CLI error) — falling back to step-by-step`);
      return null;
    }
    console.log(`   📏 Full-spec LLM response: ${response.length} chars, ${response.split('\n').length} lines`);

    // Detect narrative responses — Claude described what it did instead of outputting code.
    // With --dangerouslySkipPermissions the Write tool is auto-approved, so Claude writes the
    // file to disk and returns a narrative in stdout. Read the file back instead of discarding.
    const isNarrative = /write permission|approve.*file|file.*approve|spec will be written|I(?:'ve| have) (?:written|created|generated) (?:the|a) (?:spec|file)|I(?:'ve| have) (?:updated|saved) the/i.test(response);
    if (isNarrative || !response.includes('test.describe')) {
      const writtenCode = this.tryReadWrittenSpecFile(testCaseId, testCaseCategory, callStartMs);
      if (writtenCode) return writtenCode;
      console.log(`   ⚠️ Full-spec LLM response is a narrative or missing test.describe — discarding`);
      return null;
    }

    const cleaned = this.stripMarkdownFences(response);

    // Validate: must look like a complete spec file
    if (!cleaned.includes('test.describe') || !cleaned.includes('test.step')) {
      const writtenCode = this.tryReadWrittenSpecFile(testCaseId, testCaseCategory, callStartMs);
      if (writtenCode) return writtenCode;
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
   * Core method: generate text via Anthropic API (preferred) or Claude CLI fallback.
   * The API path has no tool access and never hangs — it returns text directly.
   * The CLI path is a fallback for when no API key is available.
   * @param timeoutMs — override default timeout (120s) for large prompts
   */
  private async chatCompletion(systemPrompt: string, userPrompt: string, timeoutMs?: number): Promise<string | null> {
    const effectiveTimeout = timeoutMs || 120000;

    // ── PRIMARY: Anthropic Messages API (no tools, no agent loop, no hanging) ──
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        console.log(`      Using Anthropic API (prompt: ${(systemPrompt.length + userPrompt.length)} chars)`);
        const response = await this.callAnthropicAPI(systemPrompt, userPrompt, apiKey, effectiveTimeout);
        if (response && response.trim()) {
          return response.trim();
        }
        console.log(`      Anthropic API returned empty response`);
      } catch (error: any) {
        console.log(`      Anthropic API error: ${error.message} — falling back to Claude CLI`);
      }
    }

    // ── FALLBACK: Claude CLI subprocess ──
    for (let attempt = 0; attempt <= this.config.llmMaxRetries; attempt++) {
      try {
        const response = await this.invokeClaudeCLI(systemPrompt, userPrompt, effectiveTimeout);
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
   * Call the Anthropic Messages API directly via HTTPS.
   * Pure text completion — no tools, no agent loop, returns TypeScript directly.
   */
  private callAnthropicAPI(systemPrompt: string, userPrompt: string, apiKey: string, timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({
        model: this.config.modelName || 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const req = https.request(
        {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.content?.[0]?.text) {
                resolve(parsed.content[0].text);
              } else if (parsed.error) {
                reject(new Error(`Anthropic API: ${parsed.error.type} — ${parsed.error.message}`));
              } else {
                reject(new Error(`Anthropic API unexpected response: ${data.substring(0, 200)}`));
              }
            } catch (e) {
              reject(new Error(`Anthropic API JSON parse error: ${(e as Error).message}`));
            }
          });
        },
      );

      const timer = setTimeout(() => {
        req.destroy();
        reject(new Error(`Anthropic API timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      req.on('close', () => clearTimeout(timer));
      req.on('error', (err) => { clearTimeout(timer); reject(err); });

      req.write(body);
      req.end();
    });
  }

  /**
   * Spawn Claude CLI process, pipe prompt via stdin, collect stdout.
   *
   * Uses --tools "" (empty string) to disable ALL Claude Code tools, forcing
   * Claude to output TypeScript directly as plain text without entering the
   * agentic loop. This avoids the full-agent-loop hang caused by
   * --dangerously-skip-permissions (which auto-approves tools and runs for
   * many minutes), and avoids the blocking permission prompts from
   * --allowedTools / --disallowedTools in -p mode.
   *
   * Windows empty-string-drop workaround: Node.js spawn() with shell:true
   * passes args through cmd.exe, which drops '' entries. To preserve the
   * empty string we build the entire command as a single string and pass
   * an empty args array — cmd.exe then parses "" correctly as empty string.
   */
  private invokeClaudeCLI(systemPrompt: string, userPrompt: string, timeoutMs?: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const effectiveTimeout = timeoutMs || 120000;

      // Build command as a single string so cmd.exe preserves the "" empty-string arg
      const modelPart = this.config.modelName ? ` --model ${this.config.modelName}` : '';
      const cmdStr = `claude -p --output-format text --tools ""${modelPart}`;

      // Do NOT pass spawn's built-in `timeout` option — on Windows with shell:true it
      // terminates cmd.exe but leaves the claude child process as an orphan that keeps
      // running indefinitely. Use a manual setTimeout + taskkill /F /T /PID instead.
      const proc = spawn(cmdStr, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });

      let stdout = '';
      let stderr = '';
      let settled = false;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(killTimer);
        fn();
      };

      // Kill the entire process tree (cmd.exe + claude child) after timeout
      const killTimer = setTimeout(() => {
        if (settled) return;
        console.log(`      LLM CLI timeout after ${effectiveTimeout}ms — killing process tree (PID ${proc.pid})`);
        try {
          if (process.platform === 'win32' && proc.pid) {
            // taskkill /F /T kills the process and all its children
            spawn('taskkill', ['/F', '/T', '/PID', String(proc.pid)], { shell: false });
          }
          proc.kill('SIGKILL');
        } catch { /* ignore kill errors */ }
        settle(() => reject(new Error(`LLM CLI timeout after ${effectiveTimeout}ms`)));
      }, effectiveTimeout);

      proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      proc.on('close', (code) => {
        settle(() => {
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
            if (stdout.trim() && !stderr.trim()) {
              console.log(`      LLM CLI stdout (error detail): ${stdout.trim().substring(0, 500)}`);
            }
            const errMsg = stderr.trim().substring(0, 500) || stdout.trim().substring(0, 500) || `exit code ${code}`;
            reject(new Error(errMsg));
          }
        });
      });

      proc.on('error', (err) => {
        settle(() => {
          this.enabled = false;
          reject(new Error(`Claude CLI not found: ${err.message}`));
        });
      });

      // Combine system + user prompts with clear separation
      const fullPrompt = `<instructions>\n${systemPrompt}\n</instructions>\n\n${userPrompt}`;
      console.log(`      LLM CLI cmd: ${cmdStr} | timeout: ${effectiveTimeout}ms | prompt: ${fullPrompt.length} chars`);
      proc.stdin.write(fullPrompt);
      proc.stdin.end();
    });
  }

  /**
   * When Claude uses the Write tool (auto-approved by --dangerouslySkipPermissions),
   * it writes the spec file to disk and emits a narrative in stdout instead of code.
   * This method checks if the expected spec file was written during the current LLM call
   * (within the last 90s from callStartMs) and reads it back as the LLM output.
   */
  private tryReadWrittenSpecFile(testCaseId: string, testCaseCategory: string, callStartMs: number): string | null {
    // Check 1: expected exact path
    try {
      const specPath = path.join(this.config.outputDir, testCaseCategory, `${testCaseId}.spec.ts`);
      if (fs.existsSync(specPath)) {
        const stat = fs.statSync(specPath);
        if (stat.mtimeMs >= callStartMs - 5000) {
          const content = fs.readFileSync(specPath, 'utf-8');
          if (content.includes('test.describe') && content.includes(testCaseId)) {
            console.log(`   📥 Claude wrote spec directly to disk — reading back from ${path.basename(specPath)}`);
            return content;
          }
        }
      }
    } catch { /* fall through to scan */ }

    // Check 2: scan entire output dir for a freshly written spec file with this test case ID
    // (handles cases where Claude writes to a different subfolder or cwd)
    try {
      const candidates: string[] = [];
      const searchDirs = [
        this.config.outputDir,
        process.cwd(),
      ];
      for (const dir of searchDirs) {
        if (!fs.existsSync(dir)) continue;
        const walk = (d: string) => {
          for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
            const full = path.join(d, entry.name);
            if (entry.isDirectory()) { walk(full); }
            else if (entry.name.endsWith('.spec.ts') && entry.name.includes(testCaseId)) {
              candidates.push(full);
            }
          }
        };
        walk(dir);
      }
      for (const candidate of candidates) {
        const stat = fs.statSync(candidate);
        if (stat.mtimeMs < callStartMs - 5000) continue;
        const content = fs.readFileSync(candidate, 'utf-8');
        if (content.includes('test.describe') && content.includes(testCaseId)) {
          console.log(`   📥 Claude wrote spec to alternate path — reading back from ${candidate}`);
          return content;
        }
      }
    } catch { /* ignore scan errors */ }

    return null;
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
