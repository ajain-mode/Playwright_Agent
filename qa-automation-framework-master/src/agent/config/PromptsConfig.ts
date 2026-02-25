/**
 * Prompts Configuration
 * Centralized configuration for all AI Agent prompts, templates, and generation rules
 * 
 * Modify this file to customize:
 * - System prompts for code generation
 * - Code templates and patterns
 * - Action-to-code mappings
 * - Validation messages
 * 
 * @author AI Agent Generator
 * @created 2026-02-09
 */

export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
}

export interface ActionMapping {
  keywords: string[];
  pageObject: string;
  method: string;
  codeTemplate: string;
  requiresData?: boolean;
}

export interface GuardrailRule {
  name: string;
  description: string;
  validate: (input: any) => boolean;
  errorMessage: string;
}

/**
 * System Prompts - Instructions for code generation behavior
 * Reference patterns: DFB-97739.spec.ts (multi-app) and DFB-25103.spec.ts (BTMS-only)
 */
export const SYSTEM_PROMPTS = {
  // Main system prompt for understanding test case context
  MAIN: `You are a Playwright test script generator for the SunTeck TMS QA Automation Framework.
Your role is to convert test case descriptions into executable Playwright test scripts.

Key guidelines:
- Follow the Page Object Model (POM) pattern
- Use existing page objects from the PageManager
- Include proper test.step() blocks for organization
- Add appropriate assertions using expect()
- Handle async/await correctly
- Use test data from CSV files via dataConfig

CRITICAL WORKFLOW — Follow this order for every test case:
1. Read ALL preconditions, test steps, AND expected results FULLY before generating any code.
2. Map each expected result to the test step number it validates (CSV column mapping).
3. Generate ALL precondition steps first — login, office config, agent email capture,
   carrier search, carrier visibility, DME toggle checks, customer/cargo verification.
4. Generate test steps in order. For each step, embed its matched expected validations
   INLINE as assertions — never group expected results at the end.
5. Use try/catch for optional or risky verifications (BIDS reports, bid history, avg rate).
6. Never skip a step. If a step cannot be mapped, generate the best possible code from
   the natural language description using generateCodeFromAction().`,

  // Prompt for code generation style
  CODE_STYLE: `Generate code following these conventions:
- Use TypeScript with proper typing
- Follow the serial test pattern with shared context
- Include beforeAll and afterAll hooks
- Use soft assertions where appropriate
- Include timeout configurations

TYPING RULES:
- For multi-app tests: use BrowserContext and Page types (not any)
  let sharedContext: BrowserContext;  let sharedPage: Page;
- For single-app tests: any is acceptable for sharedContext/sharedPage

STEP NAMING CONVENTION:
- Preconditions: "Step N: <description> (Precondition Steps X-Y)"
- Test steps with CSV mapping: "Step N [CSV X-Y]: <description>"
- Test steps without CSV: "Step N: <description>"

LOGGING:
- console.log for step-level progress and CSV mapping: console.log("CSV 38: Validated alert...")
- pages.logger.info for key milestones at end of major steps
- Precondition logs: console.log("Precondition Step 32: ...")`,

  // Prompt for error handling
  ERROR_HANDLING: `Handle errors appropriately:
- Use try-catch blocks for optional/risky operations (BIDS reports, bid history, avg rate)
- Add meaningful error messages in catch blocks
- Include retry logic where needed
- Log important state changes

DEFENSIVE PATTERNS:
- Optional element checks: if (await locator.isVisible({ timeout: 5000 }).catch(() => false))
- BTMS recovery after app switching: navigate to absolute base URL, never use page.goto("/")
  const btmsBaseUrl = new URL(sharedPage.url()).origin; await sharedPage.goto(btmsBaseUrl);
- Guard against closed pages: check page.isClosed() before bringToFront()
- After switchToBTMS(), always waitForMultipleLoadStates(["load", "networkidle"])`,

  // Self-check instructions run after code generation
  SELF_CHECK: `After generating the complete script, verify internally:
1. All imports resolve — no missing module references
2. No testData.undefined references — every testData.* field must exist in the data CSV
3. Step numbering is sequential with no gaps (Step 1, Step 2, ..., Step N)
4. All ALERT_PATTERNS.* constants referenced actually exist in alertPatterns.ts
5. Multi-app tests include closeAllSecondaryPages() in afterAll
6. No page.goto("/") — all goto calls use absolute URLs
7. No duplicate consecutive steps (same executable code emitted twice)
8. Every precondition from the CSV is represented by a step — none skipped
9. Expected results are embedded inline in their corresponding steps, not grouped at end
10. Multi-app tests use BrowserContext/Page types, not any`,
};

/**
 * Code Generation Templates
 */
export const CODE_TEMPLATES = {
  // Import statements template
  IMPORTS: {
    standard: `import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";`,

    multiApp: `import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";`,

    withHelpers: `import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import commonReusables from "@utils/commonReusables";`,
  },

  // Test structure template
  TEST_STRUCTURE: `
const testcaseID = "{{TEST_CASE_ID}}";
const testData = dataConfig.getTestDataFromCsv(dataConfig.{{DATA_FILE}}, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
{{ADDITIONAL_VARIABLES}}

test.describe.configure({ retries: {{RETRY_COUNT}} });
test.describe.serial("{{TEST_TITLE}}", () => {
  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    pages = new PageManager(sharedPage);
  });

  test.afterAll(async () => {
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: {{TEST_CASE_ID}} - {{TEST_TITLE}}",
    { tag: "{{TAGS}}" },
    async () => {
      test.setTimeout({{TIMEOUT}});
      
{{TEST_STEPS}}
    }
  );
});`,

  // Step wrapper template
  STEP_WRAPPER: `      await test.step("{{STEP_NAME}}", async () => {
{{STEP_CODE}}
      });`,

  // Comment block template
  COMMENT_BLOCK: `/**
 * Test Case: {{TEST_CASE_ID}} - {{TEST_TITLE}}
 * @author {{AUTHOR}}
 * @date {{DATE}}
 * @category {{CATEGORY}}
 * {{ADDITIONAL_TAGS}}
 */`,
};

/**
 * Action to Code Mappings
 * Maps natural language actions to Playwright code
 */
export const ACTION_MAPPINGS: ActionMapping[] = [
  // Login Actions
  {
    keywords: ['login', 'sign in', 'authenticate', 'log in'],
    pageObject: 'btmsLoginPage',
    method: 'BTMSLogin',
    codeTemplate: `await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);`,
  },
  {
    keywords: ['login btms', 'btms login'],
    pageObject: 'btmsLoginPage',
    method: 'BTMSLogin',
    codeTemplate: `await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);`,
  },
  {
    keywords: ['login tnx', 'tnx login'],
    pageObject: 'tnxLoginPage',
    method: 'TNXLogin',
    codeTemplate: `await pages.tnxLoginPage.TNXLogin(userSetup.tnxUser);`,
  },
  {
    keywords: ['login dme', 'dme login'],
    pageObject: 'dmeLoginPage',
    method: 'DMELogin',
    codeTemplate: `await pages.dmeLoginPage.DMELogin(userSetup.dmeUser);`,
  },
  {
    keywords: ['accept terms'],
    pageObject: 'btmsAcceptTermPage',
    method: 'acceptTermsAndConditions',
    codeTemplate: `if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
  await pages.btmsAcceptTermPage.acceptTermsAndConditions();
}`,
  },

  // Navigation Actions
  {
    keywords: ['navigate to loads', 'go to loads', 'open loads'],
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    codeTemplate: `await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);`,
  },
  {
    keywords: ['navigate to customers', 'go to customers', 'open customers'],
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    codeTemplate: `await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);\n        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);`,
  },
  {
    keywords: ['navigate to admin', 'go to admin', 'open admin'],
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    codeTemplate: `await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);`,
  },
  {
    keywords: ['navigate to finance', 'go to finance', 'open finance'],
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    codeTemplate: `await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);`,
  },
  {
    keywords: ['search customer', 'find customer'],
    pageObject: 'searchCustomerPage',
    method: 'searchCustomer',
    codeTemplate: `await pages.searchCustomerPage.searchCustomer(testData.customerName);`,
    requiresData: true,
  },

  // Load Creation Actions
  {
    keywords: ['create load', 'new load', 'create non-tabular', 'non tabular load'],
    pageObject: 'nonTabularLoadPage',
    method: 'createLoad',
    codeTemplate: `await pages.loadsPage.clickNewLoadDropdown();
await pages.loadsPage.selectNonTabularTL();`,
  },
  {
    keywords: ['create tabular load', 'tabular load'],
    pageObject: 'loadsPage',
    method: 'createTabularLoad',
    codeTemplate: `await pages.loadsPage.clickNewLoadDropdown();
await pages.loadsPage.selectTabularTL();`,
  },
  {
    keywords: ['duplicate load', 'copy load', 'clone load'],
    pageObject: 'duplicateLoadPage',
    method: 'duplicateLoad',
    codeTemplate: `await pages.duplicateLoadPage.duplicateLoad(loadNumber);`,
  },
  {
    keywords: ['save load', 'save and close'],
    pageObject: 'nonTabularLoadPage',
    method: 'saveLoad',
    codeTemplate: `await pages.nonTabularLoadPage.clickSaveAndClose();`,
  },

  // Form Field Actions
  {
    keywords: ['enter offer rate', 'set offer rate', 'offer rate'],
    pageObject: 'dfbLoadFormPage',
    method: 'enterOfferRate',
    codeTemplate: `await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);`,
    requiresData: true,
  },
  {
    keywords: ['enter cargo value', 'set cargo value', 'cargo value'],
    pageObject: 'nonTabularLoadPage',
    method: 'enterCargoValue',
    codeTemplate: `await pages.nonTabularLoadPage.enterCargoValue(testData.cargoValue);`,
    requiresData: true,
  },
  {
    keywords: ['select equipment', 'equipment type'],
    pageObject: 'nonTabularLoadPage',
    method: 'selectEquipmentType',
    codeTemplate: `await pages.nonTabularLoadPage.selectEquipmentType(testData.equipmentType);`,
    requiresData: true,
  },

  // Validation Actions
  {
    keywords: ['verify post status', 'check post status', 'validate post status'],
    pageObject: 'dfbLoadFormPage',
    method: 'validatePostStatus',
    codeTemplate: `await pages.dfbLoadFormPage.validatePostStatus("{{EXPECTED_STATUS}}");`,
  },
  {
    keywords: ['verify load created', 'check load created', 'load created'],
    pageObject: 'viewLoadPage',
    method: 'verifyLoadExists',
    codeTemplate: `expect(loadNumber).toBeTruthy();
await pages.viewLoadPage.verifyLoadNumber(loadNumber);`,
  },
  {
    keywords: ['verify', 'validate', 'check', 'assert', 'should'],
    pageObject: 'basePage',
    method: 'validate',
    codeTemplate: `expect.soft({{ACTUAL}}, "{{EXPECTED}}").toBeTruthy();`,
  },

  // TNX Actions
  {
    keywords: ['post to tnx', 'tnx post', 'post load'],
    pageObject: 'dfbLoadFormPage',
    method: 'postToTNX',
    codeTemplate: `await pages.dfbLoadFormPage.clickPostToTNX();`,
  },
  {
    keywords: ['verify in tnx', 'check tnx', 'tnx verification'],
    pageObject: 'tnxLandingPage',
    method: 'verifyLoad',
    codeTemplate: `await appManager.switchToTNX();
await pages.tnxLandingPage.searchLoad(loadNumber);
await pages.tnxLandingPage.verifyLoadExists(loadNumber);`,
  },

  // DME Actions
  {
    keywords: ['verify in dme', 'check dme', 'dme verification'],
    pageObject: 'dmeDashboardPage',
    method: 'verifyLoad',
    codeTemplate: `await appManager.switchToDME();
await pages.dmeDashboardPage.searchLoad(loadNumber);
await pages.dmeDashboardPage.verifyLoadExists(loadNumber);`,
  },

  // Carrier Actions
  {
    keywords: ['select carrier', 'choose carrier', 'include carrier'],
    pageObject: 'dfbLoadFormPage',
    method: 'selectCarriersInIncludeCarriers',
    codeTemplate: `await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.carrierName]);`,
    requiresData: true,
  },
  {
    keywords: ['configure waterfall', 'waterfall setup', 'carrier waterfall'],
    pageObject: 'dfbIncludeCarriersDataModalWaterfall',
    method: 'configureWaterfall',
    codeTemplate: `await pages.dfbHelpers.configureCarriersDataWithWaterfall(pages, carriersData);`,
  },

  // Precondition Actions
  {
    keywords: ['setup preconditions', 'configure office', 'office settings'],
    pageObject: 'dfbHelpers',
    method: 'setupDFBTestPreConditions',
    codeTemplate: `await pages.dfbHelpers.setupDFBTestPreConditions(
  pages,
  testData.officeName,
  toggleSettings,
  ensureToggleValue,
  testData.salesAgent,
  testData.customerName
);`,
    requiresData: true,
  },

  // Wait Actions
  {
    keywords: ['wait', 'pause', 'delay'],
    pageObject: 'commonReusables',
    method: 'wait',
    codeTemplate: `await pages.commonReusables.wait(WAIT.MEDIUM);`,
  },
];

/**
 * Guardrail Rules
 * Validation rules to ensure quality code generation
 */
export const GUARDRAIL_RULES: GuardrailRule[] = [
  {
    name: 'testCaseIdRequired',
    description: 'Test case must have a valid ID',
    validate: (input) => {
      return input.id && typeof input.id === 'string' && input.id.length > 0;
    },
    errorMessage: 'Test case ID is required and must be a non-empty string',
  },
  {
    name: 'titleRequired',
    description: 'Test case must have a title',
    validate: (input) => {
      return input.title && typeof input.title === 'string' && input.title.length > 0;
    },
    errorMessage: 'Test case title is required',
  },
  {
    name: 'stepsRequired',
    description: 'Test case must have at least one step',
    validate: (input) => {
      return input.steps && Array.isArray(input.steps) && input.steps.length > 0;
    },
    errorMessage: 'Test case must have at least one step',
  },
  {
    name: 'validCategory',
    description: 'Category must be a valid test category',
    validate: (input) => {
      const validCategories = ['dfb', 'edi', 'commission', 'salesLead', 'banyan', 
        'carrier', 'bulkChange', 'dat', 'nonOperationalLoads', 'api', 'custom'];
      return !input.category || validCategories.includes(input.category);
    },
    errorMessage: 'Invalid test category. Use: dfb, edi, commission, salesLead, etc.',
  },
  {
    name: 'validPriority',
    description: 'Priority must be a valid value',
    validate: (input) => {
      const validPriorities = ['critical', 'high', 'medium', 'low'];
      return !input.priority || validPriorities.includes(input.priority);
    },
    errorMessage: 'Invalid priority. Use: critical, high, medium, low',
  },
  {
    name: 'noEmptySteps',
    description: 'Steps cannot have empty actions',
    validate: (input) => {
      if (!input.steps) return true;
      return input.steps.every((step: any) => 
        step.action && typeof step.action === 'string' && step.action.trim().length > 0
      );
    },
    errorMessage: 'All steps must have non-empty action descriptions',
  },
  {
    name: 'maxStepsLimit',
    description: 'Test case should not exceed maximum steps',
    validate: (input) => {
      const MAX_STEPS = 50;
      return !input.steps || input.steps.length <= MAX_STEPS;
    },
    errorMessage: 'Test case has too many steps (max 50). Consider splitting into multiple tests.',
  },
  {
    name: 'validTags',
    description: 'Tags should start with @',
    validate: (input) => {
      if (!input.tags) return true;
      return input.tags.every((tag: string) => 
        typeof tag === 'string' && (tag.startsWith('@') || tag.length === 0)
      );
    },
    errorMessage: 'Tags should start with @ symbol (e.g., @smoke, @regression)',
  },
  {
    name: 'noRelativeGoto',
    description: 'Generated code must not use page.goto("/") — requires absolute URL',
    validate: (input) => {
      if (!input._generatedCode) return true;
      return !(/\.goto\s*\(\s*["']\s*\/\s*["']\s*\)/.test(input._generatedCode));
    },
    errorMessage: 'page.goto("/") uses a relative URL which fails at runtime. Use an absolute URL: new URL(sharedPage.url()).origin',
  },
  {
    name: 'noUntypedVariablesInMultiApp',
    description: 'Multi-app tests should use BrowserContext/Page types, not any',
    validate: (input) => {
      if (!input._generatedCode || !input._isMultiApp) return true;
      return !(
        /let\s+sharedContext\s*:\s*any/.test(input._generatedCode) ||
        /let\s+sharedPage\s*:\s*any/.test(input._generatedCode)
      );
    },
    errorMessage: 'Multi-app tests must use typed variables: let sharedContext: BrowserContext; let sharedPage: Page;',
  },
  {
    name: 'allExpectedResultsMapped',
    description: 'Every expected result should map to a test step, not be grouped at end',
    validate: (input) => {
      if (!input._generatedCode || !input.expectedResults || input.expectedResults.length === 0) return true;
      return !(/await test\.step\("Verify Expected Results"/.test(input._generatedCode));
    },
    errorMessage: 'Expected results should be embedded inline in their corresponding test steps, not grouped in a trailing "Verify Expected Results" block.',
  },
];

/**
 * Default Values Configuration
 */
export const DEFAULTS = {
  timeout: 300000,           // 5 minutes
  multiAppTimeout: 900000,   // 15 minutes
  retryCount: 1,
  dataFile: 'dfbData',
  author: 'AI Agent Generator',
  category: 'custom',
  priority: 'medium',
  tags: ['@automated'],
};

/**
 * GENERATION RULES — Standard practices for all generated Playwright scripts.
 * Reference: DFB-25103.spec.ts
 *
 * These rules MUST be followed by the CodeGenerator at all times:
 */
export const GENERATION_RULES = {
  // 1. NEVER hardcode precondition values in spec files.
  //    Use testData.* from dataConfig.getTestDataFromCsv() instead.
  //    BAD:  const PRECONDITION = { officeCode: "TX-RED", ... };
  //    GOOD: testData.officeName, testData.salesAgent, testData.customerName
  NO_HARDCODED_VALUES: true,

  // 2. ALWAYS reuse existing helper functions. Only create new functions if none exist.
  //    Existing helpers to use:
  REUSE_HELPERS: {
    login:            'pages.btmsLoginPage.BTMSLogin(userSetup.globalUser)',
    acceptTerms:      'pages.btmsAcceptTermPage.acceptTermsAndConditions()',
    setupOffice:      'dfbHelpers.setupOfficePreConditions(pages, testData.officeName, toggleSettingsValue, verifyConfig)',
    switchUser:       'pages.adminPage.switchUser(testData.salesAgent)',
    navigateHome:     'pages.basePage.hoverOverHeaderByText(HEADERS.HOME)',
    verifyCustomerPA: 'pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName)',
    fillPAForm:       'dfbHelpers.fillPostAutomationRuleForm(pages, { ... }, true)',
    validateAlert:    'pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.XYZ)',
  },

  // 3. Alert/dialog verification MUST use pages.commonReusables.validateAlert()
  //    from src/utils/commonReusables.ts — the original production function.
  //    NEVER use basePage.verifyAlertMessage() or basePage.verifyMessageDisplayed()
  //    (those were agent-created duplicates and have been removed).
  //    Alert messages MUST come from ALERT_PATTERNS (import from @utils/alertPatterns).
  //    NEVER hardcode alert strings in spec files.
  ALERT_FROM_PATTERNS: true,

  // 4. Form filling MUST use dfbHelpers.fillPostAutomationRuleForm() with testData.*
  //    NEVER call individual page methods (selectPickLocation, selectEquipment, etc.)
  //    directly in the spec file for standard form fills.
  USE_FORM_HELPERS: true,

  // 5. Standard imports for DFB tests:
  STANDARD_IMPORTS_DFB: [
    'import { test } from "@playwright/test";',
    'import { PageManager } from "@utils/PageManager";',
    'import userSetup from "@loginHelpers/userSetup";',
    'import dataConfig from "@config/dataConfig";',
    'import dfbHelpers from "@utils/dfbUtils/dfbHelpers";',
    'import { ALERT_PATTERNS } from "@utils/alertPatterns";',
  ],

  // 6. PRECONDITION RULES — Mandatory for all test cases
  PRECONDITION_RULES: {
    // ALL precondition steps MUST generate real executable code.
    // Never emit an empty step with only waitForMultipleLoadStates as a placeholder.
    // If a precondition cannot be mapped to a known pattern, use generateCodeFromAction()
    // to produce the best possible code from the natural language description.
    ALL_PRECONDITIONS_MUST_GENERATE_CODE: true,

    // ALL precondition steps MUST be fully completed before moving to test steps.
    // The generator must process every precondition in order — no skipping.
    // The only exception is login preconditions (handled by the mandatory login step).
    COMPLETE_ALL_BEFORE_TEST_STEPS: true,

    // Composite blocks (office setup, switch user, post automation navigation) may
    // collapse multiple related sub-steps into a single reusable helper call.
    // However, only sub-steps that are SPECIFICALLY about the same operation may be
    // collapsed. Carrier steps, customer steps, and other unrelated preconditions
    // must NOT be skipped just because a composite block was emitted.
    NARROW_COMPOSITE_SKIP: true,
  },

  // 7. DEDUPLICATION RULES — Mandatory for all test cases
  DEDUP_RULES: {
    // Consecutive steps with identical executable code MUST be deduplicated.
    // Only ONE instance of a repeated step should appear in the output.
    // This prevents duplicate navigation steps (e.g., two identical "Navigate to Carrier Search").
    NO_CONSECUTIVE_DUPLICATE_STEPS: true,

    // Keyword matching for routing preconditions must use word-boundary checks
    // for short keywords (edi, dat, lead) to avoid false positives:
    //   BAD:  groupText.includes('edi')  — matches "edit", "credit", "media"
    //   GOOD: /\bedi\b/i.test(groupText) — only matches the word "edi"
    //   BAD:  groupText.includes('dat')  — matches "date", "update", "validate"
    //   GOOD: /\bdat\b/i.test(groupText) — only matches the word "dat"
    WORD_BOUNDARY_KEYWORD_MATCHING: true,
  },

  // 8. INLINE EXPECTED VALIDATIONS — Reference: DFB-97739.spec.ts
  //    Expected results MUST be generated INSIDE the test step they validate.
  //    NEVER group expected results into a trailing "Verify Expected Results" block.
  //    Map CSV expected step numbers to their corresponding test step and embed
  //    assertions inline: expect(...).toBe(...), validatePostStatus(), etc.
  INLINE_EXPECTED_VALIDATIONS: true,

  // 9. MULTI-APP RECOVERY — Reference: DFB-97739.spec.ts line 344-347
  //    After switchToBTMS(), always navigate to the BTMS base URL using an absolute URL.
  //    NEVER use page.goto("/") — it causes "Cannot navigate to invalid URL" errors.
  //    Pattern: const btmsBaseUrl = new URL(sharedPage.url()).origin;
  //             await sharedPage.goto(btmsBaseUrl);
  MULTI_APP_RECOVERY: true,

  // 10. TYPED VARIABLES — Reference: DFB-97739.spec.ts lines 28-31
  //     Multi-app tests MUST use BrowserContext and Page types from @playwright/test.
  //     NEVER use sharedContext: any or sharedPage: any in multi-app tests.
  //     let sharedContext: BrowserContext;  let sharedPage: Page;
  TYPED_VARIABLES: true,

  // 11. TRY/CATCH FOR OPTIONAL STEPS — Reference: DFB-97739.spec.ts lines 451-456
  //     Wrap optional/risky verification steps in try/catch blocks.
  //     Examples: BIDS reports, bid history, average rate, loadboard status.
  //     In the catch block, log the failure without failing the test.
  TRY_CATCH_OPTIONAL_STEPS: true,

  // 12. STEP-CSV MAPPING — Reference: DFB-97739.spec.ts step naming
  //     Step names should reference CSV row numbers for traceability.
  //     Format: "Step N [CSV X-Y]: description"
  //     Inside steps, log: console.log("CSV 38: Validated alert — ...")
  STEP_CSV_MAPPING: true,

  // 13. FORBIDDEN PATTERNS — Patterns that must NEVER appear in generated code.
  //     selfCheckAndFix automatically detects and replaces these.
  FORBIDDEN_PATTERNS: [
    {
      pattern: 'clickHomeButton',
      replacement: 'URL-based navigation: new URL(sharedPage.url()).origin + sharedPage.goto()',
      reason: 'Unreliable — sidebar does not render consistently after page loads',
    },
    {
      pattern: 'fillFieldByLabel',
      replacement: 'Specific POM field methods (e.g., createNonTabularLoad)',
      reason: 'AI-generated stub with a generic locator — not production quality',
    },
    {
      pattern: 'navigateToHeader',
      replacement: 'basePage.hoverOverHeaderByText() + basePage.clickSubHeaderByText()',
      reason: 'Method does not exist on any page object',
    },
    {
      pattern: 'dfbHelpers.setupOfficePreConditions',
      replacement: 'Inline office config matching DFB-97739 Step 3',
      reason: 'Helper does not match reference multi-app pattern',
    },
    {
      pattern: 'basePage.verifyMessageDisplayed',
      replacement: 'commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.*)',
      reason: 'Agent-created duplicate — use the existing production function',
    },
    {
      pattern: 'basePage.verifyAlertMessage',
      replacement: 'commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.*)',
      reason: 'Agent-created duplicate — use the existing production function',
    },
  ],

  // 14. REFERENCE SPECS — Category to reference spec file mapping.
  //     ReferenceSpecAnalyzer uses these to clone structural templates.
  REFERENCE_SPECS: {
    dfb: [
      'src/tests/generated/dfb/DFB-97739.spec.ts',
      'src/tests/generated/dfb/DFB-97741.spec.ts',
    ],
    commission: [
      'src/tests/generated/dfb/DFB-25103.spec.ts',
    ],
  } as Record<string, string[]>,

  // 15. METHOD ALIASES — Common misgenerated method → correct method mapping.
  //     selfCheckAndFix uses these to auto-correct bad POM calls.
  METHOD_ALIASES: {
    'basePage.clickButton': 'basePage.clickButtonByText',
    'basePage.navigateToHeader': 'basePage.hoverOverHeaderByText',
    'basePage.verifyMessageDisplayed': 'commonReusables.validateAlert',
    'basePage.verifyAlertMessage': 'commonReusables.validateAlert',
    'postAutomationRulePage.hoverAndSelectOfficeConfig': 'basePage.hoverOverHeaderByText',
    'newSalesLeadPage.enterCustomerName': 'searchCustomerPage.enterCustomerName',
  } as Record<string, string>,

  // 16. REFERENCE PATTERNS — Actual working code snippets from DFB-97739.spec.ts
  //     These patterns MUST be used when generating code for similar scenarios.
  REFERENCE_PATTERNS: {
    // Multi-app scaffold: how to set up MultiAppManager correctly
    MULTI_APP_SCAFFOLD: `
      let sharedContext: BrowserContext;
      let sharedPage: Page;
      let appManager: MultiAppManager;
      let pages: PageManager;

      test.beforeAll(async ({ browser }) => {
        sharedContext = await browser.newContext();
        sharedPage = await sharedContext.newPage();
        appManager = new MultiAppManager(sharedContext, sharedPage);
        pages = appManager.btmsPageManager;
      });
      test.afterAll(async () => {
        if (appManager) { await appManager.closeAllSecondaryPages(); }
        if (sharedContext) { await sharedContext.close(); }
      });`,

    // Agent email capture: navigate to Agent Search, extract email
    AGENT_EMAIL_CAPTURE: `
      await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
      await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
      await pages.agentSearchPage.nameInputOnAgentPage(testData.salesAgent);
      await pages.agentSearchPage.clickOnSearchButton();
      await pages.agentSearchPage.selectAgentByName(testData.salesAgent);
      const emailLocator = sharedPage.locator("//td[contains(text(),'Email')]/following-sibling::td").first();
      agentEmail = (await emailLocator.textContent())?.trim() || "";`,

    // DFB form fill: use createNonTabularLoad, never individual fillFieldBySelector calls
    DFB_FORM_FILL: `
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
      });`,

    // DME carrier toggle check: switch to DME, search carrier, verify toggle
    DME_CARRIER_TOGGLE: `
      await appManager.switchToDME();
      const dmePages = appManager.dmePageManager!;
      await dmePages.basePage.hoverOverHeaderByText("Carriers");
      const dmeSearchInput = appManager.dmePage!.locator("input[type='search']").first();
      await dmeSearchInput.fill(testData.Carrier || testData.carrierName || "");
      await appManager.dmePage!.keyboard.press("Enter");
      // Verify toggle and switch back
      await appManager.switchToBTMS();`,

    // Carrier tab validation: click tab, validate assigned, dispatch name, email
    CARRIER_TAB_VALIDATION: `
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      await pages.viewLoadCarrierTabPage.validateCarrierAssignedText();
      await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(CARRIER_DISPATCH_NAME.DISPATCH_NAME_1);
      await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(CARRIER_DISPATCH_EMAIL.DISPATCH_EMAIL_1);`,

    // BTMS recovery after app switching: use absolute URL, never relative
    BTMS_RECOVERY: `
      await appManager.switchToBTMS();
      await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      const btmsBaseUrl = new URL(sharedPage.url()).origin;
      await sharedPage.goto(btmsBaseUrl);
      await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,

    // Carrier auto-accept: click checkbox and validate
    CARRIER_AUTO_ACCEPT: `
      await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
      console.log("Carrier auto-accept checkbox clicked");`,

    // TNX switching: switch to TNX, select org, check active jobs
    TNX_SWITCHING: `
      const tnxPages = await appManager.switchToTNX();
      await tnxPages.tnxLandingPage.selectOrganization(testData.customerName);
      await tnxPages.tnxLandingPage.clickActiveJobs();`,

    // Negative test: deliberately NOT selecting carrier contact
    NEGATIVE_CARRIER_CONTACT: `
      // Deliberately NOT selecting carrier contact — testing missing contact scenario
      console.log("Skipped carrier contact selection — testing missing contact");`,
  },
};

/**
 * MANDATORY STEPS Configuration
 * These steps are ALWAYS injected at the beginning of every generated test script,
 * regardless of whether the input test case includes them.
 * 
 * Login step is always first. Category-specific preconditions follow.
 */
export const MANDATORY_STEPS = {
  // Login step - always injected as the first step in every test
  LOGIN: {
    stepName: 'Login BTMS',
    code: `await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
          await pages.btmsAcceptTermPage.acceptTermsAndConditions();
        }`,
  },

  // Category-specific precondition steps
  // These are injected after Login and before the actual test steps
  PRECONDITIONS: {
    dfb: {
      // DFB Post Automation Rule tests
      postAutomation: {
        stepName: 'Setup DFB Test Environment',
        code: `const toggleSettingsValue = pages.toggleSettings.enable_DME;
        await dfbHelpers.setupOfficePreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.verifyAutoPost
        );
        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);
        console.log("Switched user to sales agent");`,
      },
      // DFB Non-Tabular / Tabular / Template load tests
      loadCreation: {
        stepName: 'Setup DFB Test Environment',
        code: `const toggleSettingsValue = pages.toggleSettings.enable_DME;
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
      },
      // DFB Include Carrier tests
      includeCarrier: {
        stepName: 'Setup DFB Test Environment',
        code: `const toggleSettingsValue = pages.toggleSettings.enable_DME;
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
      },
      // Default DFB precondition
      default: {
        stepName: 'Setup DFB Test Environment',
        code: `const toggleSettingsValue = pages.toggleSettings.enable_DME;
        await dfbHelpers.setupOfficePreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.verifyAutoPost
        );
        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);`,
      },
    },
    carrier: {
      default: {
        stepName: 'Navigate to Carrier Search',
        code: `await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
        await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
      },
    },
    commission: {
      default: {
        stepName: 'Navigate to Commission Audit',
        code: `await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
        await pages.basePage.clickSubHeaderByText(FINANCE_SUB_MENU.COMMISSION_AUDIT);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
      },
    },
    salesLead: {
      default: {
        stepName: 'Navigate to Sales Lead',
        code: `await pages.basePage.hoverOverHeaderByText(HEADERS.SALES_LEAD);
        await pages.basePage.clickSubHeaderByText(SALES_LEAD_SUB_MENU.MY_LEADS);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
      },
    },
    edi: {
      default: {
        stepName: 'Navigate to EDI Load Tenders',
        code: `await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.EDI_204);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
      },
    },
    banyan: {
      default: {
        stepName: 'Navigate to Banyan',
        code: `await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.BANYAN);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
      },
    },
    dat: {
      default: {
        stepName: 'Navigate to DAT',
        code: `await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.DAT);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
      },
    },
    bulkChange: {
      default: {
        stepName: 'Navigate to Bulk Change',
        code: `await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.BULK_CHANGE);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
      },
    },
    nonOperationalLoads: {
      default: {
        stepName: 'Navigate to Non-Operational Loads',
        code: `await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.NON_OPERATIONAL);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);`,
      },
    },
    api: {
      default: null, // API tests may not need navigation preconditions
    },
    custom: {
      default: null, // Custom tests - no default preconditions
    },
  } as Record<string, Record<string, { stepName: string; code: string } | null>>,
};

/**
 * Category-specific Configurations
 */
export const CATEGORY_CONFIG: Record<string, {
  dataFile: string;
  timeout: number;
  defaultTags: string[];
  requiredImports: string[];
}> = {
  dfb: {
    dataFile: 'dfbData',
    timeout: 300000,
    defaultTags: ['@dfb'],
    requiredImports: ['dfbHelpers'],
  },
  edi: {
    dataFile: 'ediData',
    timeout: 300000,
    defaultTags: ['@edi'],
    requiredImports: [],
  },
  commission: {
    dataFile: 'commissionData',
    timeout: 300000,
    defaultTags: ['@commission'],
    requiredImports: ['commissionHelper'],
  },
  salesLead: {
    dataFile: 'salesLeadData',
    timeout: 300000,
    defaultTags: ['@salesLead'],
    requiredImports: [],
  },
  carrier: {
    dataFile: 'carrierData',
    timeout: 300000,
    defaultTags: ['@carrier'],
    requiredImports: [],
  },
  api: {
    dataFile: 'apiData',
    timeout: 120000,
    defaultTags: ['@api'],
    requiredImports: ['axios'],
  },
  custom: {
    dataFile: 'dfbData',
    timeout: 300000,
    defaultTags: ['@custom'],
    requiredImports: [],
  },
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  PARSE_ERROR: 'Failed to parse test case input',
  INVALID_FORMAT: 'Invalid input format. Expected text description or structured object',
  GENERATION_FAILED: 'Failed to generate test script',
  FILE_NOT_FOUND: 'Input file not found',
  UNSUPPORTED_FORMAT: 'Unsupported file format',
  TEMPLATE_NOT_FOUND: 'Template not found for specified test type',
  VALIDATION_FAILED: 'Test case validation failed',
  NO_STEPS: 'No steps could be extracted from the test case',
  MAPPING_FAILED: 'Could not map action to code',
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  SCRIPT_GENERATED: 'Script generated successfully',
  FILE_SAVED: 'File saved to',
  BATCH_COMPLETE: 'Batch generation complete',
  VALIDATION_PASSED: 'Test case validation passed',
};

/**
 * Helper function to get action mapping for a given action text
 */
export function getActionMapping(actionText: string): ActionMapping | null {
  const lowerAction = actionText.toLowerCase();
  
  for (const mapping of ACTION_MAPPINGS) {
    if (mapping.keywords.some(keyword => lowerAction.includes(keyword))) {
      return mapping;
    }
  }
  
  return null;
}

/**
 * Helper function to validate test case against all guardrails
 */
export function validateTestCase(testCase: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const rule of GUARDRAIL_RULES) {
    if (!rule.validate(testCase)) {
      errors.push(`[${rule.name}] ${rule.errorMessage}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper function to get category-specific configuration
 */
export function getCategoryConfig(category: string) {
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG.custom;
}

export default {
  SYSTEM_PROMPTS,
  CODE_TEMPLATES,
  ACTION_MAPPINGS,
  GUARDRAIL_RULES,
  GENERATION_RULES,
  DEFAULTS,
  CATEGORY_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  getActionMapping,
  validateTestCase,
  getCategoryConfig,
};
