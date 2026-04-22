import { ProcessedStep } from '../analyzers/StepProcessor';
import { POMMethodMatcher } from '../generators/POMMethodMatcher';
import { GlobalConstants, OFFER_RATE_INPUT_ID } from '../../utils/globalConstants';
import { ALERT_PATTERNS } from '../../utils/alertPatterns';

export interface ValidationViolation {
  ruleId: string;
  severity: 'hard-block' | 'error' | 'warning';
  message: string;
  line?: number;
  stepNumber?: number;
  category:
    | 'step-coverage'
    | 'guardrail'
    | 'structural'
    | 'pom-compliance'
    | 'data-compliance'
    | 'assertion-quality';
  autoFixable: boolean;
  correctionHint?: string;
  affectedCode?: string;
}

export interface ValidationReport {
  passed: boolean;
  violations: ValidationViolation[];
  stepCoverage: StepCoverageResult;
  summary: {
    hardBlocks: number;
    errors: number;
    warnings: number;
    stepsImplemented: number;
    stepsTotal: number;
    stepsMissing: number;
  };
}

export interface StepCoverageResult {
  totalSteps: number;
  implementedSteps: number;
  missingSteps: ProcessedStep[];
  todoSteps: ProcessedStep[];
}

export interface CorrectionRequest {
  stepIndex: number;
  processedStep: ProcessedStep;
  violation: ValidationViolation;
  instruction: string;
}

const KNOWN_ALERT_PATTERN_KEYS = new Set<string>([
  'PICKUP_DELIVERY_DATE_ORDER_ERROR',
  'OFFER_RATE_SET_BY_GREENSCREENS',
  'INVALID_SHIPPER_ZIP_CODE_US',
  'INVALID_SHIPPER_ZIP_CODE_CA',
  'INVALID_SHIPPER_ZIP_CODE_MX',
  'POST_AUTOMATION_RULE_MATCHED',
  'CARRIER_ALREADY_INCLUDED_ERROR',
  'CARRIER_NOT_INCLUDED_ERROR',
  'EMAIL_NOTIFICATION_REQUIRED',
  'CUSTOMER_REQUIRED',
  'PICK_LOCATION_REQUIRED',
  'DROP_LOCATION_REQUIRED',
  'EQUIPMENT_TYPE_REQUIRED',
  'LOAD_TYPE_REQUIRED',
  'OFFER_RATE_REQUIRED',
  'INVALID_CUSTOMER_SUPPLIED',
  'INVALID_TARGET_RATE_SUPPLIED',
  'A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED',
  'CARRIER_CAUTIONARY_SAFETY_RATING',
  'IN_VIEW_MODE',
  'UNKNOWN_MESSAGE',
  'FOR_SECONDARY_INVOICE',
  'STATING_STATUS_HAS_MOVED_TO_THE_INVOICE_SHOULD_APPEAR_ON_THE',
  'STATUS_HAS_BEEN_SET_TO_BOOKED',
  'PAYABLE_STATUS_INVOICE_RECEIVED',
  'UNRECOGNISED_ZIP_CODE_ENTERED',
]);

const KNOWN_PAGE_GETTERS = new Set<string>([
  'logger',
  'commonReusables',
  'dataConfig',
  'toggleSettings',
  'dfbHelpers',
  'requiredFieldAlertValidator',
  'basePage',
  'officePage',
  'adminPage',
  'customerPage',
  'searchCustomerPage',
  'editLoadDropTabPage',
  'editLoadCarrierTabPage',
  'editLoadFormPage',
  'editLoadLoadTabPage',
  'editLoadPickTabPage',
  'postAutomationRulePage',
  'btmsLoginPage',
  'CustomerPortalLogin',
  'tnxLoginPage',
  'dmeLoginPage',
  'homePage',
  'loadsPage',
  'loadTender204Page',
  'edi204LoadTendersPage',
  'viewPickDetailsTabPage',
  'viewDropDetailsTabPage',
  'viewLoadCustomerTabPage',
  'viewLoadPage',
  'viewLoadEDITabPage',
  'financePage',
  'editLoadPage',
  'editLoadRailTabPage',
  'viewLoadCarrierTabPage',
  'nonTabularLoadPage',
  'editLoadValidationFieldPage',
  'editLoadTabularFieldHelpers',
  'loadBillingPage',
  'viewCustomerPage',
  'viewMasterCustomerPage',
  'editCustomerPage',
  'newSalesLeadPage',
  'mySalesLeadPage',
  'accountClearanceQueuePage',
  'viewSalesLeadPage',
  'tnxLandingPage',
  'dfbLoadFormPage',
  'dmeLoadPage',
  'dmeDashboardPage',
  'tnxCarrierTenderPage',
  'tnxExecutionTenderPage',
  'duplicateLoadPage',
  'loadTemplateSearchPage',
  'editTemplatePage',
  'ltlQuoteRequestPage',
  'quoteLTL',
  'editMasterCustomerPage',
  'tritanLoginPage',
  'customerDemoPortalPage',
  'addQuickQuotePage',
  'customerMasterListPage',
  'tnxRepLoginPage',
  'tnxRepLandingPage',
  'dfbIncludeCarriersDataModalWaterfall',
  'simulateEDispatchPage',
  'viewOfficeInfoPage',
  'editOfficeInfoPage',
  'simulateEDispatchDocumentUploadPage',
  'tritanAdminPage',
  'legacyCustomerPortalLogin',
  'lcpQuoteLTL',
  'tritanLoadLinksPage',
  'tritanDashboardPage',
  'tritanCompanyPage',
  'carrierSearchPage',
  'viewCarrierPage',
  'agentSearchPage',
  'agentInfoPage',
  'tritanListLoadPage',
  'tritanLoadPlanPage',
  'tritanLoadDetailsPage',
  'editLoadCustomerTabPage',
  'bulkChangeHelper',
  'agentEditPage',
  'duplicateAgentPage',
  'accountsPayablePage',
  'officeCommissionsDetailPage',
  'officeCommissionsSummaryPage',
  'emailedDocumentsForLoadPage',
  'editSalesLeadPage',
  'leadsRequestingActivationPage',
  'listShipmentTemplatePage',
  'addShipment',
  'shipmentActivitiesPage',
  'shipmentDetailsPage',
  'myBulkLoadsChangesAndImports',
  'selectChangesPage',
  'agentAccountsPage',
  'allLoadsSearchPage',
  'postAutomationRulePageEditEntryModal',
  'btmsAcceptTermPage',
  'carrierPortalPage',
  'billingAdjustmentsQueue',
]);

const KNOW_ALERT_STRING_TO_KEY: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const key of KNOWN_ALERT_PATTERN_KEYS) {
    const v = (ALERT_PATTERNS as Record<string, string | RegExp>)[key];
    if (typeof v === 'string' && v.length >= 12) {
      out[v] = key;
    }
  }
  return out;
})();

const KNOWN_DOM_ID_KEYS = new Set<string>([
  OFFER_RATE_INPUT_ID,
  ...Object.values(GlobalConstants.DFBLOAD_FORM),
]);

function lineNumberAt(code: string, index: number): number {
  return code.slice(0, index).split('\n').length;
}

function stripTsComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\/\/[^\n]*/g, '');
}

function isBalancedGrouping(code: string): boolean {
  let depthParen = 0;
  let depthBracket = 0;
  let depthBrace = 0;
  let state: 'normal' | 'sq' | 'dq' | 'tm' | 'line' | 'block' = 'normal';
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const next = code[i + 1];
    if (state === 'line') {
      if (c === '\n') {
        state = 'normal';
      }
      continue;
    }
    if (state === 'block') {
      if (c === '*' && next === '/') {
        state = 'normal';
        i++;
      }
      continue;
    }
    if (state === 'sq') {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === "'") {
        state = 'normal';
      }
      continue;
    }
    if (state === 'dq') {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === '"') {
        state = 'normal';
      }
      continue;
    }
    if (state === 'tm') {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === '`') {
        state = 'normal';
      }
      continue;
    }
    if (c === '/' && next === '/') {
      state = 'line';
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      state = 'block';
      i++;
      continue;
    }
    if (c === "'") {
      state = 'sq';
      continue;
    }
    if (c === '"') {
      state = 'dq';
      continue;
    }
    if (c === '`') {
      state = 'tm';
      continue;
    }
    if (c === '(') {
      depthParen++;
    } else if (c === ')') {
      depthParen--;
    } else if (c === '[') {
      depthBracket++;
    } else if (c === ']') {
      depthBracket--;
    } else if (c === '{') {
      depthBrace++;
    } else if (c === '}') {
      depthBrace--;
    }
    if (depthParen < 0 || depthBracket < 0 || depthBrace < 0) {
      return false;
    }
  }
  return depthParen === 0 && depthBracket === 0 && depthBrace === 0 && state === 'normal';
}

interface StepBlockRange {
  headerStart: number;
  bodyStart: number;
  bodyEnd: number;
  stepNumber: number;
}

function readStringLiteral(code: string, start: number): { text: string; end: number } | undefined {
  let i = start;
  while (i < code.length && /\s/.test(code[i])) {
    i++;
  }
  const q = code[i];
  if (q !== '"' && q !== "'" && q !== '`') {
    return undefined;
  }
  i++;
  const contentStart = i;
  if (q === '`') {
    while (i < code.length) {
      if (code[i] === '\\') {
        i += 2;
        continue;
      }
      if (code[i] === '$' && code[i + 1] === '{') {
        let d = 1;
        i += 2;
        while (i < code.length && d > 0) {
          if (code[i] === '{') {
            d++;
          } else if (code[i] === '}') {
            d--;
          }
          i++;
        }
        continue;
      }
      if (code[i] === '`') {
        return { text: code.slice(contentStart, i), end: i + 1 };
      }
      i++;
    }
    return undefined;
  }
  while (i < code.length) {
    if (code[i] === '\\') {
      i += 2;
      continue;
    }
    if (code[i] === q) {
      return { text: code.slice(contentStart, i), end: i + 1 };
    }
    i++;
  }
  return undefined;
}

function findMatchingParenEnd(code: string, openParenIndex: number): number {
  let depth = 1;
  let state: 'normal' | 'sq' | 'dq' | 'tm' | 'line' | 'block' = 'normal';
  let i = openParenIndex + 1;
  for (; i < code.length && depth > 0; i++) {
    const c = code[i];
    const next = code[i + 1];
    if (state === 'line') {
      if (c === '\n') {
        state = 'normal';
      }
      continue;
    }
    if (state === 'block') {
      if (c === '*' && next === '/') {
        state = 'normal';
        i++;
      }
      continue;
    }
    if (state === 'sq') {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === "'") {
        state = 'normal';
      }
      continue;
    }
    if (state === 'dq') {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === '"') {
        state = 'normal';
      }
      continue;
    }
    if (state === 'tm') {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === '`') {
        state = 'normal';
      }
      continue;
    }
    if (c === '/' && next === '/') {
      state = 'line';
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      state = 'block';
      i++;
      continue;
    }
    if (c === "'") {
      state = 'sq';
      continue;
    }
    if (c === '"') {
      state = 'dq';
      continue;
    }
    if (c === '`') {
      state = 'tm';
      continue;
    }
    if (c === '(') {
      depth++;
    } else if (c === ')') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function findClosingBraceIndex(code: string, openBraceIndex: number): number {
  let depth = 1;
  let state: 'normal' | 'sq' | 'dq' | 'tm' | 'line' | 'block' = 'normal';
  let i = openBraceIndex + 1;
  for (; i < code.length && depth > 0; i++) {
    const c = code[i];
    const next = code[i + 1];
    if (state === 'line') {
      if (c === '\n') {
        state = 'normal';
      }
      continue;
    }
    if (state === 'block') {
      if (c === '*' && next === '/') {
        state = 'normal';
        i++;
      }
      continue;
    }
    if (state === 'sq') {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === "'") {
        state = 'normal';
      }
      continue;
    }
    if (state === 'dq') {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === '"') {
        state = 'normal';
      }
      continue;
    }
    if (state === 'tm') {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === '`') {
        state = 'normal';
      }
      continue;
    }
    if (c === '/' && next === '/') {
      state = 'line';
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      state = 'block';
      i++;
      continue;
    }
    if (c === "'") {
      state = 'sq';
      continue;
    }
    if (c === '"') {
      state = 'dq';
      continue;
    }
    if (c === '`') {
      state = 'tm';
      continue;
    }
    if (c === '{') {
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

// ─── Declarative Guardrail Rule Registry ─────────────────────────────

/**
 * A declarative guardrail rule. Rules with a `fix` function are auto-fixable;
 * rules with only `detect` produce warnings/errors for manual resolution.
 */
export interface GuardrailRule {
  id: string;
  description: string;
  severity: 'hard-block' | 'error' | 'warning';
  category: ValidationViolation['category'];
  /** Returns true if the violation is detected in the code */
  detect: (code: string) => boolean;
  /** If provided, applies an auto-fix and returns the corrected code */
  fix?: (code: string) => string;
}

/**
 * Sanitizer rules migrated from PlaywrightAgent legacy methods.
 * These run as a pre-pass before structural/guardrail validation.
 */
const SANITIZER_RULES: GuardrailRule[] = [
  {
    id: 'SAN-001',
    description: 'Replace smart/curly quotes with straight quotes',
    severity: 'error',
    category: 'structural',
    detect: (code) => /[\u201C\u201D\u201E\u201F\u2033\u2036\u2018\u2019\u201A\u201B\u2032\u2035]/.test(code),
    fix: (code) => code
      .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'"),
  },
  {
    id: 'SAN-002',
    description: 'Fix invalid testData property access with embedded quotes/parens',
    severity: 'error',
    category: 'data-compliance',
    detect: (code) => /testData\.[a-zA-Z_$][\w$]*[^\w$.\s,);}\]]/.test(code),
    fix: (code) => code.replace(/testData\.([a-zA-Z_$][\w$]*(?:[\u201C\u201D"'][^"']*[\u201C\u201D"']\w*)*)/g, (_match, prop: string) => {
      if (/^[a-zA-Z_$][\w$]*$/.test(prop)) return `testData.${prop}`;
      let cleaned = prop.replace(/[^a-zA-Z0-9_]/g, '');
      if (!cleaned) cleaned = 'unknownField';
      cleaned = cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
      return `testData.${cleaned}`;
    }),
  },
  {
    id: 'SAN-003',
    description: 'Fix empty ALERT_PATTERNS. (dot with nothing after)',
    severity: 'error',
    category: 'data-compliance',
    detect: (code) => /ALERT_PATTERNS\.\s*[),;\n]/.test(code),
    fix: (code) => code.replace(/ALERT_PATTERNS\.\s*[),;\n]/g, (match) =>
      `ALERT_PATTERNS.UNKNOWN_MESSAGE${match.charAt(match.length - 1)}`),
  },
  {
    id: 'SAN-004',
    description: 'Fix TABS with embedded quotes (TABS."CARRIER" → TABS.CARRIER)',
    severity: 'error',
    category: 'structural',
    detect: (code) => /TABS\.[""']/.test(code),
    fix: (code) => code.replace(/TABS\.[""']*([A-Z_]+)/g, (_m, name: string) => `TABS.${name}`),
  },
  {
    id: 'SAN-005',
    description: 'Fix trailing dots in property access chains',
    severity: 'error',
    category: 'structural',
    detect: (code) => /(\w)\.\s*([),;\n\r])/.test(code),
    fix: (code) => code.replace(/(\w)\.\s*([),;\n\r])/g, '$1$2'),
  },
  {
    id: 'SAN-006',
    description: 'Fix DMELogin/TNXLogin with extra password argument',
    severity: 'error',
    category: 'pom-compliance',
    detect: (code) => /(?:DMELogin|TNXLogin)\([^,)]+,\s*[^)]+\)/.test(code),
    fix: (code) => code
      .replace(/DMELogin\(([^,)]+),\s*[^)]+\)/g, 'DMELogin($1)')
      .replace(/TNXLogin\(([^,)]+),\s*[^)]+\)/g, 'TNXLogin($1)'),
  },
  {
    id: 'SAN-007',
    description: 'Replace navigateToHeader (non-existent) with hoverOverHeaderByText',
    severity: 'error',
    category: 'pom-compliance',
    detect: (code) => code.includes('navigateToHeader'),
    fix: (code) => code.replace(/pages\.homePage\.navigateToHeader\(/g, 'pages.basePage.hoverOverHeaderByText('),
  },
  {
    id: 'SAN-008',
    description: 'Replace testData.undefined with FIXME placeholder',
    severity: 'error',
    category: 'data-compliance',
    detect: (code) => /testData\.undefined\b/.test(code),
    fix: (code) => code.replace(/testData\.undefined/g, 'testData.FIXME_UNDEFINED_FIELD'),
  },
  {
    id: 'SAN-009',
    description: 'Replace page.goto("/") with absolute URL navigation',
    severity: 'error',
    category: 'pom-compliance',
    detect: (code) => /\.goto\s*\(\s*["']\s*\/\s*["']\s*\)/.test(code),
    fix: (code) => code.replace(
      /await\s+(\w+)\.goto\s*\(\s*["']\s*\/\s*["']\s*\)/g,
      `const btmsBaseUrl = new URL($1.url()).origin;\n        await $1.goto(btmsBaseUrl)`,
    ),
  },
  {
    id: 'SAN-010',
    description: 'Replace verifyMessageDisplayed/basePage.verifyAlertMessage with validateAlert',
    severity: 'error',
    category: 'pom-compliance',
    detect: (code) => /verifyMessageDisplayed|basePage\.verifyAlertMessage/.test(code),
    fix: (code) => code
      .replace(/pages\.basePage\.verifyMessageDisplayed\s*\(/g, 'pages.commonReusables.validateAlert(sharedPage, ')
      .replace(/pages\.basePage\.verifyAlertMessage\s*\(/g, 'pages.commonReusables.validateAlert(sharedPage, '),
  },
  {
    id: 'SAN-011',
    description: 'Deduplicate import lines',
    severity: 'warning',
    category: 'structural',
    detect: (code) => {
      const imports = code.split('\n').filter(l => l.trim().startsWith('import '));
      return imports.length !== new Set(imports.map(l => l.trim())).size;
    },
    fix: (code) => {
      const lines = code.split('\n');
      const seen = new Set<string>();
      return lines.filter(line => {
        const t = line.trim();
        if (t.startsWith('import ')) {
          if (seen.has(t)) return false;
          seen.add(t);
        }
        return true;
      }).join('\n');
    },
  },
  {
    id: 'SAN-012',
    description: 'Replace clickHomeButton() with URL-based navigation',
    severity: 'error',
    category: 'pom-compliance',
    detect: (code) => /pages\.basePage\.clickHomeButton\s*\(\s*\)/.test(code),
    fix: (code) => code.replace(
      /await pages\.basePage\.clickHomeButton\s*\(\s*\)\s*;/g,
      `const btmsBaseUrl = new URL(sharedPage.url()).origin;\n        await sharedPage.goto(btmsBaseUrl);\n        await commonReusables.waitForAllLoadStates(sharedPage);`,
    ),
  },
  {
    id: 'SAN-013',
    description: 'Fix selectCarreirContactForRateConfirmation missing argument',
    severity: 'error',
    category: 'pom-compliance',
    detect: (code) => code.includes('selectCarreirContactForRateConfirmation()'),
    fix: (code) => code.replace(
      /selectCarreirContactForRateConfirmation\(\)/g,
      'selectCarreirContactForRateConfirmation(CARRIER_CONTACT.CONTACT_1)',
    ),
  },
];

export class SpecValidator {
  /**
   * Apply declarative sanitizer rules as a pre-pass.
   * Returns cleaned code and a list of applied rule IDs.
   */
  sanitize(specCode: string): { code: string; appliedRules: string[] } {
    let code = specCode;
    const applied: string[] = [];
    for (const rule of SANITIZER_RULES) {
      if (rule.detect(code) && rule.fix) {
        code = rule.fix(code);
        applied.push(rule.id);
      }
    }
    return { code, appliedRules: applied };
  }

  validate(specCode: string, processedSteps: ProcessedStep[]): ValidationReport {
    const violations: ValidationViolation[] = [];

    const stepCoverage = this.analyzeStepCoverage(specCode, processedSteps, violations);
    this.runHardGuardrails(specCode, violations);
    this.runStructural(specCode, violations);
    this.runPomCompliance(specCode, violations);
    this.runDataCompliance(specCode, violations);
    this.runAssertionQuality(specCode, processedSteps, violations);
    this.runNavigationChecks(specCode, violations);

    const hardBlocks = violations.filter((v) => v.severity === 'hard-block').length;
    const errors = violations.filter((v) => v.severity === 'error').length;
    const warnings = violations.filter((v) => v.severity === 'warning').length;
    const passed = hardBlocks === 0 && errors === 0;

    return {
      passed,
      violations,
      stepCoverage,
      summary: {
        hardBlocks,
        errors,
        warnings,
        stepsImplemented: stepCoverage.implementedSteps,
        stepsTotal: stepCoverage.totalSteps,
        stepsMissing: stepCoverage.missingSteps.length,
      },
    };
  }

  async validateAndCorrect(
    specCode: string,
    processedSteps: ProcessedStep[],
    pomMatcher: POMMethodMatcher,
    maxIterations: number = 2,
  ): Promise<{ finalCode: string; report: ValidationReport }> {
    // Run declarative sanitizer rules as pre-pass
    const { code: sanitizedCode, appliedRules } = this.sanitize(specCode);
    if (appliedRules.length > 0) {
      console.log(`   🧹 Sanitizer pre-pass applied ${appliedRules.length} rule(s): ${appliedRules.join(', ')}`);
    }
    let currentCode = sanitizedCode;
    let iteration = 0;

    while (iteration < maxIterations) {
      const report = this.validate(currentCode, processedSteps);

      if (report.passed) {
        return { finalCode: currentCode, report };
      }

      currentCode = this.applyAutoFixes(currentCode, report.violations, processedSteps);

      const corrections = this.buildCorrectionRequests(report, processedSteps);

      if (corrections.length === 0 || processedSteps.length === 0) {
        const finalReport = this.validate(currentCode, processedSteps);
        return { finalCode: currentCode, report: finalReport };
      }

      const grouped = new Map<string, CorrectionRequest[]>();
      for (const c of corrections) {
        if (!c.processedStep?.context) continue;
        const key = c.processedStep.context.currentPage;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(c);
      }

      for (const [, batch] of grouped) {
        const results = pomMatcher.correctBatch(batch.map((c) => ({ step: c.processedStep, instruction: c.instruction })));
        for (let i = 0; i < batch.length; i++) {
          currentCode = this.replaceStepCode(currentCode, processedSteps, batch[i].stepIndex, results[i].code);
        }
      }

      iteration++;
    }

    const finalReport = this.validate(currentCode, processedSteps);
    return { finalCode: currentCode, report: finalReport };
  }

  private analyzeStepCoverage(
    specCode: string,
    processedSteps: ProcessedStep[],
    violations: ValidationViolation[],
  ): StepCoverageResult {
    const sorted = [...processedSteps].sort((a, b) => a.stepNumber - b.stepNumber);
    const totalSteps = sorted.length;
    const missingSteps: ProcessedStep[] = [];
    const todoSteps: ProcessedStep[] = [];
    let implementedSteps = 0;

    const numbersFound: number[] = [];
    const reStepHeader = /(?:await\s+)?test\.step\s*\(\s*(['"`])([\s\S]*?)\1/g;
    let m: RegExpExecArray | null;
    while ((m = reStepHeader.exec(specCode)) !== null) {
      const inner = m[2];
      const numMatch = inner.match(/Step\s+(\d+)\s*:/i);
      if (numMatch) {
        numbersFound.push(parseInt(numMatch[1], 10));
      }
    }

    if (numbersFound.length > 0) {
      const sortedNums = [...new Set(numbersFound)].sort((a, b) => a - b);
      for (let i = 0; i < sortedNums.length; i++) {
        if (sortedNums[i] !== i + 1) {
          violations.push({
            ruleId: 'STEP-002',
            severity: 'error',
            message: 'Step numbering in test.step headers is not sequential (gaps or wrong order).',
            category: 'step-coverage',
            autoFixable: true,
            correctionHint: 'Rename step headers to Step 1:, Step 2:, ... with no gaps.',
          });
          break;
        }
      }
      const seen = new Set<number>();
      for (const n of numbersFound) {
        if (seen.has(n)) {
          violations.push({
            ruleId: 'STEP-002',
            severity: 'error',
            message: `Duplicate step number ${n} in test.step headers.`,
            category: 'step-coverage',
            autoFixable: true,
            stepNumber: n,
            correctionHint: 'Ensure each step number appears once.',
          });
          break;
        }
        seen.add(n);
      }
    }

    for (const step of sorted) {
      const range = this.findStepBlockRange(specCode, step);
      if (!range) {
        missingSteps.push(step);
        violations.push({
          ruleId: 'STEP-001',
          severity: 'hard-block',
          message: `No test.step block found for step ${step.stepNumber} (expected header or keyword from action).`,
          category: 'step-coverage',
          autoFixable: false,
          stepNumber: step.stepNumber,
          correctionHint: `Add await test.step("Step ${step.stepNumber}: ...", async () => { ... }); implementing this step.`,
        });
        continue;
      }

      const body = specCode.slice(range.bodyStart, range.bodyEnd);
      if (this.isTodoSharedPageLocatorStep(body)) {
        violations.push({
          ruleId: 'STEP-004',
          severity: 'hard-block',
          message: `Step ${step.stepNumber} uses sharedPage.locator in a TODO-style step.`,
          category: 'step-coverage',
          autoFixable: false,
          stepNumber: step.stepNumber,
          affectedCode: body.slice(0, 200),
          correctionHint: 'Replace with POM methods via pages.<getter>.<method>().',
        });
      }

      if (this.isPlaceholderOnlyBody(body)) {
        violations.push({
          ruleId: 'STEP-003',
          severity: 'hard-block',
          message: `Step ${step.stepNumber} is placeholder-only (no real actions beyond passive waits).`,
          category: 'step-coverage',
          autoFixable: false,
          stepNumber: step.stepNumber,
          correctionHint: 'Add pages.* calls or assertions beyond waitForAllLoadStates.',
        });
        continue;
      }

      if (!this.stepBodyHasPomOrAssert(body)) {
        missingSteps.push(step);
        violations.push({
          ruleId: 'STEP-001',
          severity: 'hard-block',
          message: `Step ${step.stepNumber} body has no pages.* call and no expect( assertion.`,
          category: 'step-coverage',
          autoFixable: false,
          stepNumber: step.stepNumber,
          correctionHint: 'Implement the step with PageManager POM calls or expect().',
        });
        continue;
      }

      implementedSteps++;
      if (/\/\/\s*TODO/i.test(body) && /sharedPage\.locator\s*\(/i.test(body)) {
        todoSteps.push(step);
      }
    }

    return {
      totalSteps,
      implementedSteps,
      missingSteps,
      todoSteps,
    };
  }

  private findStepBlockRange(specCode: string, step: ProcessedStep): StepBlockRange | undefined {
    const n = step.stepNumber;
    const needle = `Step ${n}:`;
    const kwRaw = step.rawAction.replace(/['"`\\]/g, '').trim();
    const kwSlice = kwRaw.length >= 6 ? kwRaw.slice(0, 48) : '';

    let pos = 0;
    while (pos < specCode.length) {
      const ts = specCode.indexOf('test.step', pos);
      if (ts < 0) {
        return undefined;
      }

      const lp = specCode.indexOf('(', ts);
      if (lp < 0) {
        pos = ts + 9;
        continue;
      }

      const firstStr = readStringLiteral(specCode, lp + 1);
      if (!firstStr) {
        pos = ts + 9;
        continue;
      }

      const title = firstStr.text;
      const titleMatch =
        title.includes(needle) ||
        (kwSlice.length >= 6 &&
          title.toLowerCase().includes(kwSlice.toLowerCase().slice(0, Math.min(24, kwSlice.length))));

      if (!titleMatch) {
        pos = ts + 9;
        continue;
      }

      const asyncPos = specCode.indexOf('async', firstStr.end);
      if (asyncPos < 0) {
        pos = ts + 9;
        continue;
      }

      const braceStart = specCode.indexOf('{', asyncPos);
      if (braceStart < 0) {
        return undefined;
      }

      const closeIdx = findClosingBraceIndex(specCode, braceStart);
      if (closeIdx < 0) {
        return undefined;
      }

      return {
        headerStart: ts,
        bodyStart: braceStart + 1,
        bodyEnd: closeIdx,
        stepNumber: n,
      };
    }
    return undefined;
  }

  private isPlaceholderOnlyBody(body: string): boolean {
    const noComment = body.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const lines = noComment
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) {
      return true;
    }
    const onlyWait = lines.every((l) => {
      if (/^await\s+commonReusables\.waitForAllLoadStates\s*\(/.test(l)) {
        return true;
      }
      if (/^await\s+pages\.commonReusables\.waitForAllLoadStates\s*\(/.test(l)) {
        return true;
      }
      return false;
    });
    return onlyWait && lines.every((l) => /waitForAllLoadStates/.test(l));
  }

  private isTodoSharedPageLocatorStep(body: string): boolean {
    return /\/\/\s*TODO/i.test(body) && /sharedPage\.locator\s*\(/i.test(body);
  }

  private stepBodyHasPomOrAssert(body: string): boolean {
    const stripped = body.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const hasPom = /pages\.\w+/.test(stripped);
    const hasExpect = /\bexpect(?:\.soft)?\s*\(\s*/.test(stripped);
    return hasPom || hasExpect;
  }

  private runHardGuardrails(specCode: string, violations: ValidationViolation[]): void {
    const codeNoStrings = specCode;
    const forLocator = stripTsComments(codeNoStrings);
    if (/sharedPage\.locator\s*\(/i.test(forLocator)) {
      const idx = forLocator.search(/sharedPage\.locator\s*\(/i);
      violations.push({
        ruleId: 'HARD-001',
        severity: 'hard-block',
        message: 'sharedPage.locator(...) is not allowed in generated specs.',
        category: 'guardrail',
        autoFixable: false,
        line: lineNumberAt(specCode, idx),
        correctionHint: 'Use PageManager methods on pages.<getter> instead.',
      });
    }

    const evalRe = /sharedPage\.evaluate\s*\(\s*([\s\S]*?)\)/g;
    let em: RegExpExecArray | null;
    while ((em = evalRe.exec(specCode)) !== null) {
      const arg = em[1];
      if (/(querySelector|getElementById|getElementsBy|innerText|innerHTML|textContent)/i.test(arg)) {
        violations.push({
          ruleId: 'HARD-002',
          severity: 'hard-block',
          message: 'sharedPage.evaluate(...) with DOM guessing is not allowed.',
          category: 'guardrail',
          autoFixable: false,
          line: lineNumberAt(specCode, em.index),
          affectedCode: em[0].slice(0, 120),
          correctionHint: 'Use POM methods instead of raw DOM queries in evaluate().',
        });
      }
    }

    const idPatterns = [
      ...Array.from(specCode.matchAll(/getByTestId\s*\(\s*['"]([^'"]+)['"]/gi)),
      ...Array.from(specCode.matchAll(/#([\w-]{20,})/g)),
    ];
    for (const pm of idPatterns) {
      const raw = pm[1] ?? pm[0]?.replace(/^#/, '') ?? '';
      if (!raw) {
        continue;
      }
      const segments = raw.split('_').filter(Boolean);
      const long = raw.length > 30;
      const manySeg = segments.length > 5;
      if ((long || manySeg) && !KNOWN_DOM_ID_KEYS.has(raw)) {
        violations.push({
          ruleId: 'HARD-003',
          severity: 'hard-block',
          message: `Suspected fabricated element id: "${raw.slice(0, 60)}..."`,
          category: 'guardrail',
          autoFixable: false,
          affectedCode: raw,
          correctionHint: 'Use known constants or PageManager methods instead of ad-hoc IDs.',
        });
      }
    }

    const alertKeys = [...specCode.matchAll(/ALERT_PATTERNS\.([A-Z0-9_]+)/g)];
    for (const am of alertKeys) {
      const key = am[1];
      if (!KNOWN_ALERT_PATTERN_KEYS.has(key)) {
        violations.push({
          ruleId: 'HARD-006',
          severity: 'hard-block',
          message: `ALERT_PATTERNS.${key} is not a known alert key.`,
          category: 'guardrail',
          autoFixable: false,
          correctionHint: 'Use only documented ALERT_PATTERNS keys from alertPatterns.ts allowlist.',
        });
      }
    }

    if (/\bforce\s*:\s*true\b/.test(specCode)) {
      violations.push({
        ruleId: 'HARD-004',
        severity: 'hard-block',
        message: 'force: true in locator options is not allowed.',
        category: 'guardrail',
        autoFixable: true,
        correctionHint: 'Remove force: true (auto-fix strips it).',
      });
    }

    if (/(?:^|[^\w.])(?:sharedPage|page)\.waitForTimeout\s*\(/m.test(specCode)) {
      violations.push({
        ruleId: 'HARD-005',
        severity: 'hard-block',
        message: 'Use commonReusables.waitForAllLoadStates(sharedPage) instead of waitForTimeout.',
        category: 'guardrail',
        autoFixable: true,
        correctionHint: 'Replace page.waitForTimeout with waitForAllLoadStates.',
      });
    }
  }

  private runStructural(specCode: string, violations: ValidationViolation[]): void {
    if (!isBalancedGrouping(specCode)) {
      violations.push({
        ruleId: 'STRUCT-001',
        severity: 'error',
        message: 'Unbalanced (), [] or {} in spec.',
        category: 'structural',
        autoFixable: false,
        correctionHint: 'Fix mismatched brackets manually.',
      });
    }

    if (!/test\.describe\.serial\s*\(/.test(specCode)) {
      violations.push({
        ruleId: 'STRUCT-002',
        severity: 'error',
        message: 'Spec must use test.describe.serial() wrapper.',
        category: 'structural',
        autoFixable: false,
      });
    }

    if (!/test\.beforeAll\s*\(/.test(specCode) || !/test\.afterAll\s*\(/.test(specCode)) {
      violations.push({
        ruleId: 'STRUCT-003',
        severity: 'error',
        message: 'Both test.beforeAll and test.afterAll are required.',
        category: 'structural',
        autoFixable: false,
      });
    }

    if (specCode.includes('HEADERS.LOADS')) {
      violations.push({
        ruleId: 'STRUCT-004',
        severity: 'error',
        message: 'Typo HEADERS.LOADS should be HEADERS.LOAD.',
        category: 'structural',
        autoFixable: true,
      });
    }
    if (specCode.includes('LOADS_SUB_MENU')) {
      violations.push({
        ruleId: 'STRUCT-004',
        severity: 'error',
        message: 'Typo LOADS_SUB_MENU should be LOAD_SUB_MENU.',
        category: 'structural',
        autoFixable: true,
      });
    }

    if (/[\u201c\u201d\u2018\u2019]/.test(specCode)) {
      violations.push({
        ruleId: 'STRUCT-005',
        severity: 'error',
        message: 'Curly/smart quotes must be replaced with straight quotes.',
        category: 'structural',
        autoFixable: true,
      });
    }

    const lines = specCode.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const a = lines[i - 1].trim();
      const b = lines[i].trim();
      if (a === b && /pages\./.test(a) && a.length > 10) {
        violations.push({
          ruleId: 'STRUCT-006',
          severity: 'error',
          message: `Duplicate consecutive POM line: ${a.slice(0, 80)}...`,
          category: 'structural',
          autoFixable: true,
          line: i + 1,
        });
      }
    }
  }

  private runPomCompliance(specCode: string, violations: ValidationViolation[]): void {
    const directInteraction =
      /(?:^|[^\w.])(sharedPage)\.(click|dblclick|fill|press|check|uncheck|hover|selectOption|goto|setInputFiles)\s*\(/gm;
    let dm: RegExpExecArray | null;
    while ((dm = directInteraction.exec(specCode)) !== null) {
      violations.push({
        ruleId: 'POM-001',
        severity: 'error',
        message: `Direct ${dm[1]}.${dm[2]}() must be replaced with pages.<getter>.<method>().`,
        category: 'pom-compliance',
        autoFixable: false,
        line: lineNumberAt(specCode, dm.index),
      });
    }

    const bodyOnly = this.extractMainTestCallback(specCode);
    if (bodyOnly) {
      const badLogic = bodyOnly.split('\n').some((line) => {
        const t = line.trim();
        if (/^\s*\/\/|^\s*\/\*/.test(line)) {
          return false;
        }
        if (/if\s*\(\s*await\s+pages\./.test(t)) {
          return false;
        }
        return /\b(if|else|for|while|switch)\s*\(/.test(line) || /\.map\s*\(|\.filter\s*\(/.test(line);
      });
      if (badLogic) {
        violations.push({
          ruleId: 'POM-002',
          severity: 'error',
          message: 'Business logic (if/else/for/while/.map/.filter) is not allowed in the test body outside setup hooks.',
          category: 'pom-compliance',
          autoFixable: false,
          correctionHint: 'Move branching into Page Object methods.',
        });
      }
    }

    const pomGetter = /pages\.([a-zA-Z]\w*)/g;
    let pm: RegExpExecArray | null;
    while ((pm = pomGetter.exec(specCode)) !== null) {
      const g = pm[1];
      if (!KNOWN_PAGE_GETTERS.has(g)) {
        violations.push({
          ruleId: 'POM-003',
          severity: 'error',
          message: `Unknown PageManager getter: pages.${g}`,
          category: 'pom-compliance',
          autoFixable: false,
          line: lineNumberAt(specCode, pm.index),
        });
      }
    }

    if (/\brequire\s*\(\s*['"]/.test(specCode)) {
      violations.push({
        ruleId: 'POM-005',
        severity: 'error',
        message: 'Inline require() is not allowed; use ES imports.',
        category: 'pom-compliance',
        autoFixable: true,
      });
    }

    if (/try\s*\{[\s\S]*?catch\s*\([^)]*\)\s*\{[\s\S]*?console\.log/.test(specCode)) {
      violations.push({
        ruleId: 'POM-006',
        severity: 'error',
        message: 'try/catch that logs to console without rethrowing can hide failures.',
        category: 'pom-compliance',
        autoFixable: false,
      });
    }
  }

  private extractMainTestCallback(specCode: string): string | undefined {
    let s = specCode;
    for (const hook of ['test.beforeAll', 'test.afterAll'] as const) {
      let idx = s.indexOf(hook);
      while (idx >= 0) {
        const op = s.indexOf('(', idx);
        if (op < 0) {
          break;
        }
        const cl = findMatchingParenEnd(s, op);
        if (cl < 0) {
          break;
        }
        s = s.slice(0, idx) + s.slice(cl + 1);
        idx = s.indexOf(hook);
      }
    }
    return s;
  }

  private runDataCompliance(specCode: string, violations: ValidationViolation[]): void {
    const numericInArgs = /pages\.\w+\([^)]*['"](\d+)['"]/;
    const lines = specCode.split('\n');
    lines.forEach((line, idx) => {
      if (!line.includes('pages.')) {
        return;
      }
      if (/testData\.|testcaseID|Step\s/i.test(line)) {
        return;
      }
      if (numericInArgs.test(line)) {
        violations.push({
          ruleId: 'DATA-001',
          severity: 'error',
          message: 'Hardcoded numeric string in POM arguments should use test data or constants.',
          category: 'data-compliance',
          autoFixable: false,
          line: idx + 1,
          affectedCode: line.trim(),
        });
      }
    });

    const carrierValues = Object.values(GlobalConstants.CARRIER_NAME) as string[];
    for (const val of carrierValues) {
      if (val.length < 4) {
        continue;
      }
      const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`['"]${escaped}['"]`);
      if (re.test(specCode) && !specCode.includes(`CARRIER_NAME`)) {
        violations.push({
          ruleId: 'DATA-002',
          severity: 'error',
          message: `Hardcoded carrier name should use CARRIER_NAME.* (${val.slice(0, 40)}...).`,
          category: 'data-compliance',
          autoFixable: true,
        });
        break;
      }
    }

    const alertLiteral = /expect\s*\([^)]*\)\.[.\s\S]{0,80}?\.(?:toContain|toMatch)\s*\(\s*['"]([^'"]{12,})['"]/;
    const am = alertLiteral.exec(specCode);
    if (am && !specCode.slice(Math.max(0, am.index - 20), am.index + 100).includes('ALERT_PATTERNS')) {
      violations.push({
        ruleId: 'DATA-003',
        severity: 'error',
        message: 'Long alert text literals should use ALERT_PATTERNS constants.',
        category: 'data-compliance',
        autoFixable: true,
        affectedCode: am[1].slice(0, 80),
      });
    }

    const isSalesLead = /@aiteam,\s*@salesLead/i.test(specCode) || /@salesLead/i.test(specCode);
    if (!isSalesLead && /userSetup\.salesLeadUser/.test(specCode)) {
      violations.push({
        ruleId: 'DATA-005',
        severity: 'error',
        message: 'Non–sales-lead tests should use userSetup.globalUser, not salesLeadUser.',
        category: 'data-compliance',
        autoFixable: true,
      });
    }
  }

  private runAssertionQuality(
    specCode: string,
    processedSteps: ProcessedStep[],
    violations: ValidationViolation[],
  ): void {
    if (/expect\.soft\s*\([^)]*\)\.(?:\w+\([^)]*\)\.)*toBeTruthy\s*\(/.test(specCode)) {
      violations.push({
        ruleId: 'ASSERT-001',
        severity: 'warning',
        message: 'prefer toBe() / toContain() over expect.soft(...).toBeTruthy() for value checks.',
        category: 'assertion-quality',
        autoFixable: false,
      });
    }

    const reStep = /(?:await\s+)?test\.step\s*\(\s*[`'"]([^`'"]*hard\s*assertion[^`'"]*)[`'"]/gi;
    let sm: RegExpExecArray | null;
    while ((sm = reStep.exec(specCode)) !== null) {
      const rest = specCode.slice(sm.index);
      if (/expect\.soft\s*\(/.test(rest.slice(0, 4000))) {
        violations.push({
          ruleId: 'ASSERT-002',
          severity: 'warning',
          message: 'Steps mentioning "hard assertion" should use expect(), not expect.soft().',
          category: 'assertion-quality',
          autoFixable: true,
          correctionHint: 'Replace expect.soft with expect in this step.',
        });
      }
    }

    if (/console\.log\s*\([^)]*(?:verified|expected|validated)/i.test(specCode)) {
      violations.push({
        ruleId: 'ASSERT-003',
        severity: 'warning',
        message: 'console.log used where an expect() assertion is expected.',
        category: 'assertion-quality',
        autoFixable: false,
      });
    }

    for (const step of processedSteps) {
      if (step.actionType !== 'verify') {
        continue;
      }
      const range = this.findStepBlockRange(specCode, step);
      if (!range) {
        continue;
      }
      const body = specCode.slice(range.bodyStart, range.bodyEnd);
      if (!/\bexpect(?:\.soft)?\s*\(/.test(body.replace(/\/\/[^\n]*/g, ''))) {
        violations.push({
          ruleId: 'ASSERT-004',
          severity: 'error',
          message: `Verify step ${step.stepNumber} has no expect() call.`,
          category: 'assertion-quality',
          autoFixable: false,
          stepNumber: step.stepNumber,
        });
      }
    }

    const hardcodedAssertionRe = /(?:\.toBe|\.toContain|\.toEqual|\.toMatch|\.toHaveText)\(\s*["']([A-Z][A-Za-z\s]{2,})["']\s*\)/g;
    let ham: RegExpExecArray | null;
    while ((ham = hardcodedAssertionRe.exec(specCode)) !== null) {
      violations.push({
        ruleId: 'ASSERT-005',
        severity: 'error',
        message: `Hardcoded assertion value "${ham[1]}" — use a global constant (INVOICE_PROCESS, AUTOPAY_STATUS, PAYABLE_TOGGLE_VALUE, FINANCE_MESSAGES, LOAD_STATUS, etc.) or testData.* instead.`,
        category: 'guardrail',
        autoFixable: false,
        correctionHint: 'Replace the hardcoded string with the appropriate constant from globalConstants.ts or testData from CSV.',
      });
    }
  }

  private runNavigationChecks(specCode: string, violations: ValidationViolation[]): void {
    const lines = specCode.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!/hoverOverHeaderByText\s*\(/.test(lines[i])) continue;
      const precedingLines = lines.slice(Math.max(0, i - 5), i).join('\n');
      if (/navigateToBaseUrl/.test(precedingLines)) continue;
      if (/hoverOverHeaderByText/.test(precedingLines)) continue;

      violations.push({
        ruleId: 'NAV-001',
        severity: 'error',
        message: 'hoverOverHeaderByText() without preceding navigateToBaseUrl(). Detail/form pages do not render the main nav header.',
        category: 'structural',
        autoFixable: true,
        line: i + 1,
        correctionHint: 'Insert await pages.basePage.navigateToBaseUrl(); before the hoverOverHeaderByText call.',
      });
      break;
    }
  }

  private applyAutoFixes(
    specCode: string,
    violations: ValidationViolation[],
    processedSteps?: ProcessedStep[],
  ): string {
    let code = specCode;
    const ids = new Set(violations.map((v) => v.ruleId));

    if (ids.has('HARD-004')) {
      code = code.replace(/\{\s*force\s*:\s*true\s*\}/g, '{}');
      code = code.replace(/,\s*force\s*:\s*true\s*/g, '');
      code = code.replace(/\s*force\s*:\s*true\s*,/g, '');
    }

    if (ids.has('HARD-005')) {
      code = code.replace(
        /await\s+(?:sharedPage|page)\.waitForTimeout\s*\([^)]*\)\s*;?/g,
        'await commonReusables.waitForAllLoadStates(sharedPage);',
      );
    }

    if (ids.has('STRUCT-004')) {
      code = code.replace(/\bHEADERS\.LOADS\b/g, 'HEADERS.LOAD');
      code = code.replace(/\bLOADS_SUB_MENU\b/g, 'LOAD_SUB_MENU');
    }

    if (ids.has('STRUCT-005')) {
      code = code
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");
    }

    if (ids.has('STRUCT-006')) {
      const lines = code.split('\n');
      const out: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
          const a = lines[i - 1].trim();
          const b = lines[i].trim();
          if (a === b && /pages\./.test(a) && a.length > 10) {
            continue;
          }
        }
        out.push(lines[i]);
      }
      code = out.join('\n');
    }

    if (ids.has('ASSERT-002')) {
      const ranges = this.findHardAssertionStepRanges(code).sort((a, b) => b.start - a.start);
      for (const r of ranges) {
        const chunk = code.slice(r.start, r.end);
        const fixed = chunk.replace(/expect\.soft\s*\(/g, 'expect(');
        code = code.slice(0, r.start) + fixed + code.slice(r.end);
      }
    }

    if (ids.has('DATA-002')) {
      const carrierEntries = Object.entries(GlobalConstants.CARRIER_NAME) as [string, string][];
      for (const [cKey, val] of carrierEntries) {
        if (val.length < 4) {
          continue;
        }
        const escaped = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        code = code.replace(new RegExp(`(['"])${escaped}\\1`, 'g'), `CARRIER_NAME.${cKey}`);
      }
    }

    if (ids.has('DATA-003')) {
      const literals = Object.entries(KNOW_ALERT_STRING_TO_KEY).sort((a, b) => b[0].length - a[0].length);
      for (const [literal, key] of literals) {
        const esc = literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        code = code.replace(new RegExp(`\\.toContain\\(\\s*(['"])${esc}\\1\\s*\\)`, 'g'), `.toContain(ALERT_PATTERNS.${key})`);
        code = code.replace(new RegExp(`\\.toMatch\\(\\s*(['"])${esc}\\1\\s*\\)`, 'g'), `.toMatch(ALERT_PATTERNS.${key})`);
      }
    }

    if (ids.has('DATA-005')) {
      const isSalesLead = /@aiteam,\s*@salesLead/i.test(code) || /@salesLead/i.test(code);
      if (!isSalesLead) {
        code = code.replace(/userSetup\.salesLeadUser/g, 'userSetup.globalUser');
      }
    }

    if (ids.has('POM-005')) {
      code = code.replace(/(?:const|let|var)\s+(\w+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;?/g, (_f, name, mod) => {
        return `import ${name} from '${mod}';`;
      });
    }

    if (ids.has('NAV-001')) {
      const lines = code.split('\n');
      const result: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (/await\s+pages\.basePage\.hoverOverHeaderByText\s*\(/.test(lines[i])) {
          const preceding = lines.slice(Math.max(0, i - 5), i).join('\n');
          if (!/navigateToBaseUrl/.test(preceding) && !/hoverOverHeaderByText/.test(preceding)) {
            const indent = lines[i].match(/^(\s*)/)?.[1] || '          ';
            result.push(`${indent}await pages.basePage.navigateToBaseUrl();`);
          }
        }
        result.push(lines[i]);
      }
      code = result.join('\n');
    }

    void processedSteps;
    return code;
  }

  private findHardAssertionStepRanges(code: string): { start: number; end: number }[] {
    const ranges: { start: number; end: number }[] = [];
    const re = /(?:await\s+)?test\.step\s*\(\s*[`'"]([^`'"]*hard\s*assertion[^`'"]*)[`'"]/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code)) !== null) {
      const openAsync = code.indexOf('async', m.index);
      const braceAt = code.indexOf('{', openAsync);
      if (braceAt < 0) {
        continue;
      }
      let depth = 1;
      let i = braceAt + 1;
      for (; i < code.length && depth > 0; i++) {
        const ch = code[i];
        if (ch === '{') {
          depth++;
        } else if (ch === '}') {
          depth--;
        }
      }
      ranges.push({ start: braceAt + 1, end: i - 1 });
    }
    return ranges;
  }

  private buildCorrectionRequests(report: ValidationReport, processedSteps: ProcessedStep[]): CorrectionRequest[] {
    const out: CorrectionRequest[] = [];
    for (const v of report.violations) {
      if (v.autoFixable) {
        continue;
      }
      if (v.severity !== 'hard-block' && v.severity !== 'error') {
        continue;
      }
      const stepIndex =
        v.stepNumber != null ? processedSteps.findIndex((s) => s.stepNumber === v.stepNumber) : -1;
      if (processedSteps.length === 0) continue;
      const processedStep =
        stepIndex >= 0 ? processedSteps[stepIndex] : processedSteps[processedSteps.length - 1];
      const instruction = this.buildInstruction(v);
      out.push({
        stepIndex: stepIndex >= 0 ? stepIndex : 0,
        processedStep,
        violation: v,
        instruction,
      });
    }
    return out;
  }

  private buildInstruction(v: ValidationViolation): string {
    const hint = v.correctionHint ? ` ${v.correctionHint}` : '';
    return `[${v.ruleId}] ${v.message}.${hint}`;
  }

  private replaceStepCode(specCode: string, processedSteps: ProcessedStep[], stepIndex: number, newInnerCode: string): string {
    const step = processedSteps[stepIndex];
    if (!step) {
      return specCode;
    }
    const range = this.findStepBlockRange(specCode, step);
    if (!range) {
      return specCode;
    }
    let inner = newInnerCode.trim();
    if (inner.startsWith('{') && inner.endsWith('}')) {
      inner = inner.slice(1, -1).trim();
    }
    const baseIndent = this.inferIndent(specCode, range.bodyStart);
    const body = inner
      .split('\n')
      .map((line) => (line.trim() ? baseIndent + line.replace(/^\s+/, '') : ''))
      .join('\n');
    return specCode.slice(0, range.bodyStart) + '\n' + body + '\n' + specCode.slice(range.bodyEnd);
  }

  private inferIndent(specCode: string, bodyStart: number): string {
    const lineStart = specCode.lastIndexOf('\n', bodyStart - 1) + 1;
    const line = specCode.slice(lineStart, bodyStart);
    const m = line.match(/^(\s*)/);
    const indent = m ? m[1] : '        ';
    return indent + '  ';
  }
}
