/**
 * LLM Prompt Templates
 * Provides rich, schema-aware prompts for Claude Opus to generate correct Playwright code
 * that reuses existing page objects, utilities, and constants from the framework.
 */

export interface SchemaContext {
  /** Map of PageManager getter name → list of public method names */
  pageObjects: Record<string, string[]>;
  /** Available constant names (HEADERS, TABS, WAIT, etc.) */
  constants: string[];
  /** Detailed constants: GROUP_NAME → { KEY: value } for reverse-lookup */
  constantsDetail?: Record<string, Record<string, string>>;
  /** Available testData field names for the current test case */
  testDataFields?: string[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FRAMEWORK KNOWLEDGE — injected into every LLM prompt
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const FRAMEWORK_KNOWLEDGE = `
## Test File Structure
Every generated spec follows this structure:
\`\`\`
import { BrowserContext, expect, Page, test } from '@playwright/test';
import { MultiAppManager } from '@utils/dfbUtils/MultiAppManager';
import userSetup from '@loginHelpers/userSetup';
import dataConfig from '@config/dataConfig';
import { PageManager } from '@utils/PageManager';
import { ALERT_PATTERNS } from '@utils/alertPatterns';

const testData = dataConfig.getTestDataFromCsv(dataConfig.<category>Data, '<TEST_ID>');
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.serial('Case ID: <TEST_ID>', () => {
  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    appManager = new MultiAppManager(sharedContext, sharedPage);
    pages = appManager.btmsPageManager;
  });
  test.afterAll(async () => {
    await appManager.closeAllSecondaryPages();
    await sharedContext.close();
  });
  test('description', { tag: '@aiteam,@category' }, async () => {
    await test.step('Step 1: ...', async () => { ... });
  });
});
\`\`\`

## Variables Always in Scope
- sharedPage: Playwright Page object
- sharedContext: BrowserContext
- pages: PageManager — access all page objects via pages.<getter>
- testData: Record<string, string> — test data from CSV
- appManager: MultiAppManager — for multi-app switching
- loadNumber: string — captured load ID (when applicable)

## Navigation Patterns (MUST use these, not page.goto)
- Navigate to a header menu: await pages.basePage.hoverOverHeaderByText(HEADERS.<NAME>)
  Then click submenu: await pages.basePage.clickSubHeaderByText(<SUB_MENU>.<KEY>)
- Header constants: HEADERS.ADMIN, HEADERS.HOME, HEADERS.CUSTOMER, HEADERS.LOAD, HEADERS.CARRIER, HEADERS.FINANCE, HEADERS.REPORTS
- Admin submenu: ADMIN_SUB_MENU.OFFICE_SEARCH, ADMIN_SUB_MENU.POST_AUTOMATION, ADMIN_SUB_MENU.AGENT_SEARCH
- Customer submenu: CUSTOMER_SUB_MENU.SEARCH, CUSTOMER_SUB_MENU.NEW_SALES_LEAD, CUSTOMER_SUB_MENU.LEADS
- Load submenu: LOAD_SUB_MENU.SEARCH, LOAD_SUB_MENU.CREATE_TL, LOAD_SUB_MENU.TEMPLATES
- Finance submenu: FINANCE_SUB_MENU.PAYABLES, FINANCE_SUB_MENU.COMMISSION_AUDIT_QUEUE, FINANCE_SUB_MENU.BILLING_ADJUSTMENTS_QUEUE
- Carrier submenu: CARRIER_SUB_MENU.SEARCH

## Login Patterns
- BTMS login: await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser)
- CRITICAL: Always use userSetup.globalUser for BTMSLogin in ALL categories (dfb, billingtoggle, commission, edi, carrier, etc). NEVER use userSetup.UserSales for BTMSLogin — UserSales is ONLY for salesLead category tests.
- TNX login (via appManager): const tnxPages = await appManager.switchToTNX()
- DME login (via appManager): const dmePages = await appManager.switchToDME()
- TNX Rep: const tnxRepPages = await appManager.switchToTNXRep()
- Switch user: await pages.adminPage.hoverAndClickAdminMenu(); await pages.adminPage.switchUser(testData.salesAgent)

## Alert/Dialog Handling (MUST use these patterns)
- Validate alert: await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.<PATTERN_NAME>)
- Accept alert: await pages.commonReusables.dialogHandler(sharedPage)
- Alert patterns available: ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED, ALERT_PATTERNS.POST_AUTOMATION_RULE_MATCHED,
  ALERT_PATTERNS.CARRIER_NOT_INCLUDED_ERROR, ALERT_PATTERNS.OFFER_RATE_SET_BY_GREENSCREENS,
  ALERT_PATTERNS.IN_VIEW_MODE, ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED, etc.

## Wait Patterns (use the WAIT constant, not hardcoded ms)
- await sharedPage.waitForTimeout(WAIT.DEFAULT)  // 3000ms
- await sharedPage.waitForTimeout(WAIT.SMALL)     // 10000ms
- await sharedPage.waitForTimeout(WAIT.MID)       // 15000ms
- await sharedPage.waitForTimeout(WAIT.LARGE)     // 20000ms
- await sharedPage.waitForTimeout(WAIT.XLARGE)    // 30000ms
- await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"])
- await pages.commonReusables.waitForAllLoadStates(sharedPage)
- await pages.commonReusables.waitForPageStable(sharedPage)

## Data Access
- CSV test data: const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID)
- dataConfig categories: dfbData, ediData, commissionData, salesleadData, banyanData, carrierData, datData, bulkChangeData, apiData, nonOperationalLoadsData, billingtoggleData
- testData fields are accessed as: testData.customerName, testData.offerRate, testData.pickCity, etc.

## User Credentials
- userSetup.globalUser, userSetup.globalPassword — main BTMS user
- userSetup.btmsSSOUser, userSetup.btmsSSOPassword — SSO login
- userSetup.tnxUser, userSetup.tnxPassword — TNX
- userSetup.dmeUser, userSetup.dmePassword — DME
- userSetup.ediUserMarmaxx, userSetup.ediUserIBO — EDI users
- userSetup.UserCommission — commission user
- userSetup.UserSales — sales lead user
- userSetup.banyanUser, userSetup.datUser — third party users
- userSetup.bulkChangeUser, userSetup.bulkChangePassword — bulk change

## Load Form Interaction (Edit Load)
- Fill non-tabular field: await pages.nonTabularLoadPage.fillAndTab(fieldId, value)
- Fill tabular field in tab (Load/Pick/Drop/Carrier):
  - Load tab: await pages.editLoadLoadTabPage.<method>(value)
  - Pick tab: await pages.editLoadPickTabPage.<method>(value)
  - Drop tab: await pages.editLoadDropTabPage.<method>(value)
  - Carrier tab: await pages.editLoadCarrierTabPage.<method>(value)
  - Customer tab: await pages.editLoadCustomerTabPage.<method>(value)
- Click tab: await pages.editLoadPage.clickOnLoadTab(TABS.<TAB_NAME>)
  Tab constants: TABS.LOAD, TABS.PICK, TABS.DROP, TABS.CARRIER, TABS.CUSTOMERS
- DFB form: await pages.dfbLoadFormPage.<method>(value)

## Search Pattern
- Search load by ID: await pages.basePage.searchFromMainHeader(loadNumber)
- Search customer: await pages.searchCustomerPage.searchCustomerAndClickDetails(customerName)
- Carrier search: await pages.carrierSearchPage.<method>(value)
- Carrier status filter: await pages.carrierSearchPage.selectStatusOnCarrier(CARRIER_STATUS.<STATUS>)
  Status constants: CARRIER_STATUS.ACTIVE, CARRIER_STATUS.INACTIVE, CARRIER_STATUS.CAUTION, CARRIER_STATUS.DNL, CARRIER_STATUS.ON_HOLD
  IMPORTANT: Always use selectStatusOnCarrier(status) — NEVER use selectActiveOnCarrier()

## DFB Post and Form
- Click DFB Post button: await pages.editLoadFormPage.clickDFBButton(DFB_Button.Post)
- Click DFB Clear: await pages.editLoadFormPage.clickDFBButton(DFB_Button.Clear_Form)
- Set offer rate: use DFB form page or direct locator #carr_1_target_rate

## Load Status Constants
- LOAD_STATUS.ACTIVE, LOAD_STATUS.BOOKED, LOAD_STATUS.DISPATCHED, LOAD_STATUS.POSTED, LOAD_STATUS.MATCHED, etc.

## TNX Patterns
- Match on TNX: const tnxPages = await appManager.switchToTNX()
  await tnxPages.tnxLandingPage.<method>(value)
- TNX constants: TNX.MATCH_NOW, TNX.YES_BUTTON, TNX.CONGRATS_MESSAGE, TNX.CARRIER_NAME

## DFB Constants
- CARRIER_NAME.CARRIER_1 through CARRIER_9
- CARRIER_TIMING.TIMING_1 through TIMING_5
- LOAD_OFFER_RATES.OFFER_RATE_1 through OFFER_RATE_4
- DFB_FORM_FIELDS.Include_Carriers, .Exclude_Carriers, .Email_Notification, etc.

## Utility Functions
- pages.commonReusables.getNextTwoDatesFormatted() — returns { tomorrow, dayAfterTomorrow } in MM/DD/YYYY
- pages.commonReusables.getDate(day, format) — day: "today"|"tomorrow"|"dayAfterTomorrow", format: "MM/DD/YYYY"|"YYYY-MM-DD"
- pages.commonReusables.formatToCurrency(value) — returns "$1,234.56"
- pages.commonReusables.normalizeRate(rate) — removes commas, ensures $X.XX
- pages.commonReusables.generateRandomNumber(digits) — returns random number string
- pages.commonReusables.reloadPage(sharedPage) — reload and wait for networkidle
- pages.commonReusables.verifyTabHeading(sharedPage, expectedTitle) — verify page title

## Multi-App Switching
- Switch to DME: const dmePages = await appManager.switchToDME()
  then use dmePages.<getter>.<method>()
- Switch to TNX: const tnxPages = await appManager.switchToTNX()
  then use tnxPages.<getter>.<method>()
- Switch back to BTMS: const btmsPages = await appManager.switchToBTMS()
  then reassign pages = btmsPages if needed
- Close secondary apps: await appManager.closeAllSecondaryPages()

## DFB Helper (standalone import: import dfbHelpers from "@utils/dfbUtils/dfbHelpers")
- dfbHelpers.fillPostAutomationRuleForm(pages, { customer, emailNotification, pickLocation, destination, equipment, loadType, offerRate, commodity }, true)
  IMPORTANT: dfbHelpers is a standalone import, NOT accessed via pages. Use dfbHelpers.xxx() directly.
- pages.dfbHelpers.setupDFBTestPreConditions(pages, officeName, toggleSettings, ensureToggle, salesAgent, customerName, cargoValue, loadType)
- pages.dfbHelpers.reloadAndNavigateToNewLoad(pages, sharedPage, testData)

## View Load Verification
- Verify load details: await pages.viewLoadPage.viewLoadPageVisible()
- Check status: await pages.viewLoadPage.verifyLoadStatus(LOAD_STATUS.<STATUS>)
- View tabs: pages.viewPickDetailsTabPage, pages.viewDropDetailsTabPage, pages.viewLoadCustomerTabPage, pages.viewLoadCarrierTabPage, pages.viewLoadEDITabPage

## Customer Operations
- Search: pages.searchCustomerPage.searchCustomerAndClickDetails(name)
- View: pages.viewCustomerPage.verifyAndSetCargoValue(CARGO_VALUES.<VALUE>)
- Navigate to new load from customer: await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LOAD_TL)
`;

/**
 * Build the system prompt for Playwright step code generation.
 * Includes full POM schema, framework patterns, coding conventions, and constraints.
 */
export function buildCodeGenSystemPrompt(schema: SchemaContext): string {
  const pomSummary = Object.entries(schema.pageObjects)
    .map(([getter, methods]) => `  pages.${getter}: ${methods.join(', ')}`)
    .join('\n');

  const constantsList = schema.constants.join(', ');

  // Build detailed constants reference if available
  let constantsDetailSection = '';
  if (schema.constantsDetail && Object.keys(schema.constantsDetail).length > 0) {
    const detailLines = Object.entries(schema.constantsDetail)
      .map(([group, keys]) => {
        const keyEntries = Object.entries(keys)
          .map(([k, v]) => `    ${k}: "${v}"`)
          .join('\n');
        return `  ${group}:\n${keyEntries}`;
      })
      .join('\n');
    constantsDetailSection = `\n\n## Constants Reference (use these instead of hardcoding values)\n${detailLines}`;
  }

  return `You are a Playwright test code generator for the SunTeck TMS QA Framework.
You generate ONLY executable TypeScript code for a single test step — no markdown, no explanations, no wrapping.

## Available Page Objects (accessed via "pages.<getter>.<method>()")
${pomSummary}

## Available Constants (global — no import needed)
${constantsList}${constantsDetailSection}

${FRAMEWORK_KNOWLEDGE}

## CRITICAL Rules
1. Output ONLY executable TypeScript code — no markdown fences, no explanations
2. Use testData.* for dynamic values (e.g., testData.customerName, testData.offerRate)
3. ALWAYS use pages.<getter>.<method>() for ALL element interactions.
    FIRST check the Available Page Objects schema above for an existing method that does what you need.
    If a functionally equivalent method already exists (even with a slightly different name), USE IT — do NOT invent a new one.
    For example, if getRateTypeValue() exists, do NOT create getLinehaulDefaultValue() for the same purpose.
    Only if NO existing method covers the functionality, generate the call using a descriptive method name — the pipeline will auto-create it.
    Use naming conventions: clickOn<Element>(), enter<FieldName>(value), select<Option>(value), verify<State>(), get<Value>().
    NEVER use sharedPage.locator() directly in spec files — all locators MUST live in page object files.
4. Use await for all async calls
5. Add console.log() for step progress
6. Use try/catch ONLY for optional verifications (BIDS, bid history)
7. NEVER use page.goto("/") — use pages.basePage navigation methods
8. For alerts use: pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.<NAME>)
9. For navigation: pages.basePage.hoverOverHeaderByText(HEADERS.<NAME>) then clickSubHeaderByText()
10. Available variables in scope: sharedPage, sharedContext, pages, testData, appManager, loadNumber
11. Use WAIT.* constants for timeouts, not hardcoded numbers
12. NEVER use sharedPage.locator() directly in spec files. ALL element interactions MUST go through POM methods.
    If no POM method exists for a field/action, generate a pages.<getter>.<method>() call with a descriptive name —
    the pipeline will auto-create the method in the appropriate POM file under src/pages/.
    Naming conventions for new methods:
    - Fill/enter: pages.<page>.enter<FieldName>(value) — e.g., pages.editLoadFormPage.enterExpirationDate(date)
    - Click: pages.<page>.clickOn<Element>() — e.g., pages.editLoadFormPage.clickOnSaveBtn()
    - Select dropdown: pages.<page>.select<Option>(value) — e.g., pages.editLoadFormPage.selectMethod("Practical")
    - Verify: pages.<page>.verify<State>() — e.g., pages.loadBillingPage.verifyToggleIsAgent()
    - Get value: pages.<page>.get<Value>() — e.g., pages.loadBillingPage.getBillingToggleValue()
    Choose the appropriate page getter based on which page the element belongs to:
    - editLoadFormPage: Edit Load form fields (form_* IDs)
    - editLoadCarrierTabPage: Carrier tab fields ONLY (carrier rates, miles, trailer length, email notification Select2)
    - viewLoadPage: Document Upload Utility, view load operations
    - loadBillingPage: Billing page operations (toggle, invoices, finance messages, view history)
    - nonTabularLoadPage: Enter New Load form operations (customer Select2, shipper/consignee dropdowns, commodity, equipment, dates/times, Create Load button)
    - basePage: Common navigation, headers, menus
    IMPORTANT: Customer selection (form_customer) and shipper dropdown (form_shipper_ship_point) are on the Enter New Load form,
    so they belong on nonTabularLoadPage, NOT editLoadCarrierTabPage. Use pages.nonTabularLoadPage.selectCustomerViaSelect2(customerName).
    NEVER fabricate locator IDs from step description text. If the step is too vague, use a TODO comment:
      console.log("TODO: Manual implementation needed — <step description>");
13. For billingtoggle tests — use pages.editLoadFormPage.clickOnViewBillingBtn() to navigate to billing view.
    Use pages.loadBillingPage for billing-specific operations if available.
14. NEVER import or reference "commonReusables" as a standalone variable. It's only available via pages.commonReusables.
15. commissionHelper is a standalone import: import commissionHelper from "@utils/commission-helpers"
16. For uploading documents on View Billing page — use POM methods, NEVER raw locators:
    - POD: await pages.viewLoadPage.uploadPODDocument() — handles file selection, doc type dropdown, and submit
    - Carrier Invoice: await pages.viewLoadPage.uploadCarrierInvoiceDocument(testData) — handles payables radio, doc type, invoice number (auto-generated), invoice amount from testData.carrierInvoiceAmount, file upload
    - For step-by-step document upload control:
      - await pages.viewLoadPage.openDocumentUploadDialog() — opens the Document Upload Utility
      - await pages.viewLoadPage.selectCustomerRadio() — selects Customer radio button
      - await pages.viewLoadPage.selectPayablesRadio() — selects Payables radio button
      - await pages.viewLoadPage.selectDocumentType("Proof of Delivery") — selects document type dropdown
      - await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNum) — fills invoice number
      - await pages.viewLoadPage.fillCarrierInvoiceAmount(amount) — fills invoice amount
      - await pages.viewLoadPage.attachFile(filePath) — attaches a file
      - await pages.viewLoadPage.clickSubmitRemote() — clicks Submit/Attach button
      - await pages.viewLoadPage.waitForUploadSuccess() — waits for success message
      - await pages.viewLoadPage.closeDocumentUploadDialogSafe() — closes the dialog safely
17. For CHOOSE CARRIER on Carrier tab:
    - await pages.editLoadCarrierTabPage.clickOnChooseCarrier() — opens the carrier search
    - Type carrier name into #carr_1_carr_auto, press Tab, wait for dropdown
    - Select from #carr_1_carr_select > option
    - await pages.editLoadCarrierTabPage.clickOnUseCarrierBtn() — confirms selection
18. Carrier tab rate fields:
    - Customer rate: await pages.editLoadCarrierTabPage.enterCustomerRate(value)
    - Carrier rate: await pages.editLoadCarrierTabPage.enterCarrierRate(value)
    - Miles: await pages.editLoadCarrierTabPage.enterMiles(value)
    - Trailer length: await pages.editLoadCarrierTabPage.enterValueInTrailerLength(value)
19. Billing page operations — use POM methods from pages.loadBillingPage, NEVER raw locators:
    - Billing toggle: await pages.loadBillingPage.getBillingToggleValue() — returns 'Agent', 'Billing', or 'Neutral'
    - Add New carrier invoice: await pages.loadBillingPage.clickAddNewCarrierInvoice() — opens Add Carrier Invoice dialog
    - Invoice number (Add New dialog): await pages.loadBillingPage.enterCarrierInvoiceNumber(invoiceNum)
    - Invoice amount (Add New dialog): await pages.loadBillingPage.enterCarrierInvoiceAmount(amount)
    - Save invoice (Add New dialog): await pages.loadBillingPage.clickSaveCarrierInvoice()
    - Finance messages: await pages.loadBillingPage.getFinanceMessages() — returns string[]
    - Check message content: await pages.loadBillingPage.hasFinanceMessageContaining("text")
    - View History (opens popup window): const popup = await pages.loadBillingPage.clickViewHistoryAndGetPopup()
    For Document Upload Utility invoice fields, use pages.viewLoadPage methods (see rule 16).
20. NEVER use ALERT_PATTERNS.UNKNOWN_MESSAGE — it matches ANY alert containing a colon (catches everything).
    Use the specific pattern constant: A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED, STATUS_HAS_BEEN_SET_TO_BOOKED,
    IN_VIEW_MODE, POST_AUTOMATION_RULE_MATCHED, etc. If no matching constant exists, add a new entry to alertPatterns.ts.
21. NEVER use console.log() as a substitute for assertions or validations. Every "Expected:" result in the test case
    MUST map to either: expect()/expect.soft() assertion, or a POM validation method (e.g., validateCarrierAssignedText()).
    console.log is for progress tracking ONLY (e.g., "Step completed", "Load number captured").
22. When a test step says "Validate X is Y" or "Verify X shows Y", ALWAYS produce an expect() or expect.soft() assertion.
    Pattern: const value = await <get_value>; expect.soft(value).toBe/toContain/toMatch(expected);
23. NEVER hardcode string values that exist in the Constants Reference above. Always use the constant reference.
    Examples of what NOT to do vs what TO do:
    - BAD: "ACTIVE" → GOOD: LOAD_STATUS.ACTIVE or CARRIER_STATUS.ACTIVE (pick the right group)
    - BAD: "Admin" → GOOD: HEADERS.ADMIN
    - BAD: "Search" → GOOD: CARRIER_SUB_MENU.SEARCH or LOAD_SUB_MENU.SEARCH
    - BAD: "ZZOO LOGISTICS LLC" → GOOD: CARRIER_NAME.CARRIER_1
    - BAD: "Avenger Logistics" → GOOD: CARRIER_VISIBILITY.AVENGER_LOGISTICS
    - BAD: "1500" (offer rate) → GOOD: LOAD_OFFER_RATES.OFFER_RATE_1
    - BAD: "Satisfactory" (safety rating) → GOOD: SAFETY_RATING_SFD.SATISFACTORY
    - BAD: "NET 15" → GOOD: paymentTermsOptions.NET_15
    - BAD: "Set Complete" → GOOD: LOAD_ACTIVITIES.SET_COMPLETE
    Use the Constants Reference section to find the correct constant group and key.
    Do NOT invent constant keys that aren't listed in the reference.
24. NEVER use XPath translate() for case-insensitive matching (e.g., translate(text(),'ABC...','abc...')).
    These locators are brittle and break when UI labels change. Instead, use multiple explicit text matchers:
    contains(text(),'LabelA') or contains(text(),'LabelB')
25. NEVER wrap validation/assertion code in try/catch blocks that swallow errors with console.log().
    Swallowing errors creates false positives — the test passes even when the validation fails.
    Use expect.soft() for non-critical assertions that should report failure without stopping the test.
    Pattern: expect.soft(value, "descriptive failure message").toBe/toContain/toBeTruthy(expected);
26. All locators MUST reside in POM files under src/pages/, NEVER inside spec files.
    - Do NOT use sharedPage.locator(), tnxPage.locator(), dmePage.locator() etc. in spec files.
    - Instead, create/use POM methods: pages.<getter>.<method>() or pageInstance.<method>()
    - The pipeline will auto-create missing POM methods via ensurePageObjectMethodsExist().
27. When a tab or label has been renamed in the UI (e.g., "LoadBoard" → "Mode ID" → "Mode IQ"), the POM locator
    must match ALL known name variants to ensure backward compatibility during the transition period.
28. NEVER use page.evaluate() with querySelector, closest, getComputedStyle, or classList.contains to read element state.
    These are DOM-guessing anti-patterns that are fragile and break with CSS/HTML changes.
    Instead, use Playwright built-in methods: isChecked(), inputValue(), getAttribute(), isVisible(), textContent().
29. Every POM method MUST have a JSDoc block with @author and @created tags. Format:
    /** Description. @author AI Agent @created YYYY-MM-DD */
30. NEVER use waitForTimeout() with hardcoded millisecond values in spec files.
    Use Playwright auto-waiting, waitForLoadState(), element.waitFor(), or POM methods with built-in waits.
31. NEVER use require() or path.resolve() inline in spec files.
    For file attachments, use POM methods: pages.viewLoadPage.attachCarrierInvoiceFile() or pages.viewLoadPage.attachPODFile().
32. NEVER use duplicate locating strategies for the same element. Pick one reliable locator per element.
    Prefer CSS selectors and Playwright getByRole/getByLabel over XPath. XPath is slower and more fragile.
33. Before inventing a new POM method name, ALWAYS scan the Available Page Objects schema above for existing methods
    that serve the same purpose. Prefer an existing method even if its name is slightly different from what you would invent.
    Examples of duplicates to AVOID:
    - Do NOT create getLinehaulDefaultValue() when getRateTypeValue() already reads from the same dropdown
    - Do NOT create getFuelSurchargeDefaultValue() when a similar getter already exists
    - Do NOT create enterCarrierLinehaul() when enterCarrierLinehaulRate() already exists
    The pipeline will BLOCK creation of methods that are semantically similar to existing ones.
34. NEVER pass hardcoded numeric strings to POM methods for rates, amounts, miles, or invoice numbers.
    Always use testData.* from CSV: testData.customerRate, testData.carrierRate, testData.miles, testData.linehaulRate,
    testData.carrierInvoiceNumber, testData.carrierInvoiceAmount1, testData.carrierInvoiceAmount2.
36. NEVER use hardcoded string literals in expect() assertions or POM method arguments when a global constant exists.
    FIRST check the Available Constants list above for an existing constant (e.g., RATE_TYPE.FLAT, LOAD_STATUS.BOOKED).
    If no matching constant exists, the pipeline should create one in globalConstants.ts — do NOT hardcode the value.
    Examples: use RATE_TYPE.FLAT instead of "Flat", LOAD_STATUS.BOOKED instead of "Booked".
35. Do NOT use console.log() in spec files. All logging must occur inside Page Object classes via this.logger or similar.
    - Narration logs like "Clicked Save button" or "Navigated to page" are redundant — the test.step() name already describes the action.
    - For runtime values that aid debugging (load numbers, captured emails, toggle states), use pages.logger.info() instead.
    - The ONLY acceptable console.log in a spec is inside conditional branches to log which path was taken (e.g., toggle ON vs OFF).`;
}

/**
 * Build the prompt for full-spec generation from a reference spec.
 * Used when TestCaseMatcher score >= 0.7 — the LLM adapts the entire reference
 * spec in one pass instead of generating step-by-step.
 */
export function buildFullSpecPrompt(
  referenceSpecCode: string,
  testCaseId: string,
  testCaseTitle: string,
  testCaseCategory: string,
  preconditions: string[],
  steps: { stepNumber: number; action: string; expectedResult?: string }[],
  expectedResults: string[],
  testDataFields: string[],
  _schema: SchemaContext,
): { system: string; user: string } {
  // LEAN prompt — no full POM schema or framework knowledge.
  // The reference spec already contains correct methods, imports, and patterns.
  // The LLM just needs to adapt it to the new test case.

  const system = `You are a Playwright test code generator. You adapt an existing working test spec to a new test case.

## Rules
1. Output ONLY the complete .spec.ts file — no markdown fences, no explanations, no commentary before or after
2. Keep ALL steps from the reference spec — do NOT skip, collapse, or remove any steps
3. Keep ALL imports, variable declarations, beforeAll/afterAll blocks from the reference
4. Keep ALL method calls exactly as they appear in the reference — do NOT invent new methods
5. Only change: test case ID, title, and test-specific values (testData fields, constants)
6. Every expected result MUST use expect() or expect.soft() — NEVER use console.log as a substitute for validation
7. Use testData.* for all CSV-derived values
8. NEVER hardcode string values that exist as global constants. Use the constant reference (e.g., CARRIER_DISPATCH_EMAIL.EMAIL_1, CARRIER_VISIBILITY.AVENGER_LOGISTICS, LOAD_STATUS.ACTIVE, CARRIER_STATUS.ACTIVE, SAFETY_RATING_SFD.SATISFACTORY, etc.)
9. NEVER use ALERT_PATTERNS.UNKNOWN_MESSAGE
10. validateCarrierAssignedText() requires argument: validateCarrierAssignedText(testData.Carrier)
11. The const testcaseID must be "${testCaseId}" and dataConfig must use dataConfig.${testCaseCategory}Data
12. Output must compile with TypeScript strict mode (noUnusedLocals, noUnusedParameters)
13. NEVER use sharedPage.locator(), tnxPage.locator(), dmePage.locator() in spec files — all locators must be POM methods
14. NEVER wrap validation code in try/catch that swallows errors with console.log — use expect.soft() instead
15. NEVER use XPath translate() for case-insensitive matching — use explicit text alternatives instead
16. NEVER use page.evaluate() with querySelector/closest/getComputedStyle — use Playwright built-in methods (isChecked, inputValue, getAttribute) instead
17. Every POM method must include JSDoc with @author AI Agent and @created date
18. NEVER use waitForTimeout() with hardcoded delays — use Playwright auto-waiting or waitForLoadState
19. NEVER use require() or path.resolve() inline — use POM methods like attachCarrierInvoiceFile() or attachPODFile()
20. NEVER use duplicate locating strategies for the same element. One reliable locator per element. Prefer CSS/getByRole over XPath
21. NEVER pass hardcoded numeric strings to POM methods for rates, amounts, miles, or invoice numbers.
    Use testData.customerRate, testData.carrierRate, testData.miles, testData.linehaulRate, testData.carrierInvoiceNumber, testData.carrierInvoiceAmount1, testData.carrierInvoiceAmount2
22. Do NOT use console.log() in spec files. Logging belongs inside Page Object classes.
    Use pages.logger.info() for runtime values only (load numbers, emails, statuses). Do not log narration like "Clicked button".`;

  const stepsText = steps.map(s => `  ${s.stepNumber}. ${s.action}${s.expectedResult ? ` → Expected: ${s.expectedResult}` : ''}`).join('\n');
  const expectedText = expectedResults.length > 0
    ? expectedResults.map((e, i) => `  ${i + 1}. ${e}`).join('\n')
    : '  (Same as reference spec)';
  const precondText = preconditions.length > 0 ? preconditions.join('\n  ') : 'Same as reference spec';

  const user = `Adapt this reference spec for test case ${testCaseId}.

REFERENCE SPEC (keep this exact structure, all steps, all method calls):
${referenceSpecCode}

NEW TEST CASE:
- ID: ${testCaseId}
- Title: ${testCaseTitle}
- Category: ${testCaseCategory}
- testData fields: ${testDataFields.join(', ') || 'same as reference'}

Preconditions:
  ${precondText}

Steps:
${stepsText}

Expected Results:
${expectedText}

Output the complete adapted .spec.ts file:`;

  return { system, user };
}

/**
 * Build the user prompt for a single step code generation.
 */
export function buildCodeGenUserPrompt(action: string, testDataFields?: string[]): string {
  let prompt = `Generate Playwright code for this test step action:\n"${action}"`;
  if (testDataFields && testDataFields.length > 0) {
    prompt += `\n\nAvailable testData fields: ${testDataFields.join(', ')}`;
  }
  return prompt;
}

/**
 * Build the prompt for extracting structured values from natural language
 * precondition and test step text.
 */
export function buildValueExtractionPrompt(
  preconditionText: string,
  stepsText: string,
  expectedText: string
): { system: string; user: string } {
  const system = `You are a structured data extractor for the SunTeck TMS QA Framework. Given test case preconditions and steps written in natural language, extract specific field values into a JSON object.

## Output Format (JSON only, no markdown)
{
  "precondition": {
    "officeCode": "string or null — office code like TX-RED, TX-STK",
    "switchToUser": "string or null — user name like BRENT DURHAM(TX-RED)",
    "customerName": "string or null — customer name",
    "carrierName": "string or null — carrier name",
    "matchVendors": "string or null — TNX if match vendors with TNX",
    "enableDME": "string or null — YES if digital matching engine enabled",
    "cargoValue": "string or null — cargo value range like $100,001 to $250,000",
    "loadType": "string or null — TL, LTL, Intermodal",
    "equipmentType": "string or null — Van, Flatbed, Reefer",
    "postAutomationRule": "string or null — YES or NO",
    "greenScreens": "string or null — YES or NO"
  },
  "formFields": {
    "customerName": "string or null",
    "pickLocation": "string or null — shipper name/location",
    "dropLocation": "string or null — consignee name/location",
    "equipmentType": "string or null — e.g. Van, Flatbed, Reefer",
    "offerRate": "string or null — numeric rate value",
    "qty": "string or null — shipment quantity",
    "uom": "string or null — unit of measure",
    "description": "string or null — commodity description",
    "weight": "string or null — commodity weight",
    "trailerLength": "string or null — trailer length",
    "mileageEngine": "string or null",
    "method": "string or null — e.g. Practical, Shortest",
    "rateType": "string or null — e.g. SPOT, CONTRACT",
    "carrierName": "string or null — carrier to choose/select/include (e.g. XPO TRANS INC, 18 WHEELER CARRIER LLC)",
    "customerValue": "string or null — customer value to select in load form, often in [BRACKETS] like [CORP RECONCILIATION]",
    "equipmentLength": "string or null — equipment length on load form (e.g. 54)",
    "shipperEarliestTime": "string or null — time like 09:00",
    "shipperLatestTime": "string or null",
    "consigneeEarliestTime": "string or null",
    "consigneeLatestTime": "string or null",
    "emailNotification": "string or null — email address for notification",
    "salesperson": "string or null",
    "pickCity": "string or null",
    "pickState": "string or null",
    "dropCity": "string or null",
    "dropState": "string or null",
    "priority": "string or null — 1, 2, or 3",
    "includeCarriers": "string or null — carrier names to include",
    "excludeCarriers": "string or null — carrier names to exclude",
    "expirationDate": "string or null",
    "expirationTime": "string or null",
    "customerRate": "string or null — flat rate for customer (e.g. 500)",
    "carrierRate": "string or null — flat rate for carrier (e.g. 600)",
    "totalMiles": "string or null — total miles (e.g. 100)",
    "lhRate": "string or null — linehaul rate (e.g. 500)"
  }
}

Rules:
1. Output ONLY valid JSON — no markdown, no explanation
2. Use null for fields that cannot be determined from the text
3. Preserve exact values as written (names, codes, numbers)
4. For times, use the format found in text (e.g., "09:00", "10:00 AM")
5. For locations in "NAME - CITY, STATE" format, keep the full string
6. Cargo value should match one of: "less than $1000", "$10,001 to $100,000", "$100,001 to $250,000", "$250,001 to $500,000"
7. For carrierName: look for patterns like "choose a carrier...enter value as NAME", "Include Carriers field (NAME)", "typing in NAME", "select carrier NAME"
8. For customerValue: look for "[CUSTOMER NAME]" in brackets, or "select the customer [NAME]" — this is DIFFERENT from customerName (search field)
9. For trailerLength vs equipmentLength: "Enter the length field (54)" = equipmentLength; "Enter trailer length 10" = trailerLength
10. For emailNotification: extract the actual email address, NOT the instruction text (e.g. from "enter value as user@example.com" extract "user@example.com")`;

  const user = `Extract field values from this test case:

PRECONDITIONS:
${preconditionText || '(none)'}

TEST STEPS:
${stepsText || '(none)'}

EXPECTED RESULTS:
${expectedText || '(none)'}`;

  return { system, user };
}

/**
 * Build the prompt for fixing broken generated code using error messages.
 */
export function buildCodeFixPrompt(
  code: string,
  errors: string[],
  schema: SchemaContext
): { system: string; user: string } {
  const pomSummary = Object.entries(schema.pageObjects)
    .slice(0, 40)
    .map(([getter, methods]) => `  pages.${getter}: ${methods.slice(0, 15).join(', ')}`)
    .join('\n');

  const system = `You are a Playwright test code fixer for the SunTeck TMS QA Framework. You receive a generated test script with errors and fix them.

## Available Page Objects
${pomSummary}

${FRAMEWORK_KNOWLEDGE}

## Fix Rules
1. Output the COMPLETE fixed TypeScript file — no markdown, no explanation
2. Fix all reported errors while preserving test logic
3. Only use page object methods that exist in the schema above
4. Never invent new methods — use the closest available one
5. Ensure all braces, parentheses, and brackets are balanced
6. Use testData.* for values, never hardcode
7. Use WAIT.* constants for timeouts
8. Use ALERT_PATTERNS.* for alert validation, not hardcoded strings`;

  const user = `Fix this Playwright test script. It has the following errors:
${errors.map(e => `- ${e}`).join('\n')}

CODE:
${code}`;

  return { system, user };
}
