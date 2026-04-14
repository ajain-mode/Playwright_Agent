/**
 * Form Step Grouper
 *
 * Pre-processes the list of parsed CSV steps to detect consecutive sequences
 * that collectively represent a single composite operation (e.g. filling the
 * "Enter New Load" form, switching to DME, TNX verification flow).
 *
 * Instead of generating one `test.step()` per CSV line — which produces
 * invented selectors and placeholder code — the grouper collapses these
 * sequences into a single composite step with the correct helper method call.
 *
 * Recognised composite groups:
 *   1. LOAD_FORM_FILL  — individual form fields → createNonTabularLoad()
 *   2. CREATE_LOAD     — create button + rate type selection
 *   3. CARRIER_TAB     — offer rate, include carriers, auto accept, contact
 *   4. SAVE_ALERT_FIX  — save → alert → OK → fix → save again
 *   5. DME_SEQUENCE    — log into DME / click Loads / search load
 *   6. TNX_SEQUENCE    — log into TNX / select carrier / Active Jobs / search
 *   7. BTMS_RECOVERY   — switch back to BTMS and validate booked status
 *
 * @author AI Agent Generator
 * @created 2026-02-24
 */

import { TestStep } from '../types/TestCaseTypes';

// ─────────────────────────── Types ───────────────────────────

export type StepCategory =
  | 'form-field'         // Enter/select a form field value
  | 'form-auto'          // Informational: field auto-populates
  | 'form-preselected'   // Informational: field already has value
  | 'create-load'        // Click Create Load button
  | 'rate-type'          // Select rate type
  | 'carrier-tab-click'  // Click Carrier tab
  | 'offer-rate'         // Enter offer rate
  | 'include-carriers'   // Select include carriers
  | 'auto-accept'        // Check auto accept checkbox
  | 'carrier-contact'    // Select/skip carrier contact for rate confirmation
  | 'save-button'        // Click Save
  | 'alert-message'      // Alert is displayed
  | 'click-ok'           // Click OK to dismiss alert
  | 'view-mode'          // Load is in view mode
  | 'post-button'        // Click Post button
  | 'dme-login'          // Log into DME
  | 'dme-action'         // DME: click Loads, search, etc.
  | 'tnx-login'          // Log into TNX
  | 'tnx-action'         // TNX: select carrier, Active Jobs, search, etc.
  | 'btms-switch'        // Switch back to BTMS
  | 'customer-search'    // Customer search sequence
  | 'navigate-create'    // Navigate to CREATE TL *NEW*
  | 'carrier-rate-setup' // Carrier tab: customer rate, carrier rate, trailer length, expiration, email, miles
  | 'choose-carrier'     // CHOOSE CARRIER and select carrier
  | 'single';            // No grouping — generate individually

export interface CompositeGroup {
  /** Composite group type */
  type: 'load-form-fill' | 'create-load-and-rate' | 'carrier-tab-setup'
    | 'carrier-rate-and-details' | 'save-alert-fix' | 'dme-verification' | 'tnx-verification'
    | 'customer-to-create' | 'post-load' | 'btms-switch' | 'single';
  /** Original steps in this group */
  steps: TestStep[];
  /** CSV step numbers covered by this group */
  csvStepRange: number[];
  /** Pre-generated composite code for the group (null = generate individually) */
  compositeCode: string | null;
  /** Step name for the composite test.step wrapper */
  compositeStepName: string | null;
}

// ─────────────────────────── Classifier ───────────────────────────

function classifyStep(action: string): StepCategory {
  const a = action.toLowerCase();

  // ── Customer / Navigation ──
  if ((a.includes('hover') && a.includes('customer')) || (a.includes('click') && a.includes('search') && a.includes('customer'))) return 'customer-search';
  if (/enter.*(customer\s*name|name.*customer)/i.test(action)) return 'customer-search';
  if (/click.*['"]?search['"]?\s*(button|btn)/i.test(action) && !a.includes('carrier') && !a.includes('office') && !a.includes('agent')) return 'customer-search';
  if (/click.*customer.*profile/i.test(action) || (a.includes('click') && a.includes('customer') && !a.includes('carrier'))) return 'customer-search';
  if (a.includes('create tl') || (a.includes('click') && a.includes('hyperlink') && a.includes('create'))) return 'navigate-create';

  // ── Form: auto-populate / preselected (informational, no action needed) ──
  if (a.includes('will be automatically') || a.includes('automatically update')) return 'form-auto';
  if (a.includes('preselected') || a.includes('already selected') || a.includes('default value will be')) return 'form-preselected';

  // ── Form fields (these are the core form-fill steps) ──
  if (a.includes('enter new load') && a.includes('customer')) return 'form-preselected';
  if (/select\s+(the\s+)?(location|.*field)/i.test(action) &&
      (a.includes('shipper') || a.includes('consignee') || a.includes('equipment') ||
       a.includes('uom') || a.includes('mileage') || a.includes('method'))) return 'form-field';
  if (/enter\s+(the\s+)?['""]?\w+/i.test(action) &&
      (a.includes('earliest') || a.includes('latest') || a.includes('qty') ||
       a.includes('quantity') || a.includes('description') || a.includes('weight') ||
       a.includes('lenght') || a.includes('length') || a.includes('time'))) return 'form-field';
  if (/select\s+(the\s+)?['""]?(earliest|latest)\s+date/i.test(action)) return 'form-field';
  if (a.includes('linehaul') || a.includes('fuel surcharge')) return 'form-preselected';

  // ── Create Load / Rate Type ──
  if (a.includes('create load') && a.includes('button')) return 'create-load';
  if (a.includes('rate type') && (a.includes('select') || a.includes('spot'))) return 'rate-type';

  // ── Carrier tab operations ──
  if (a.includes('carrier tab') && (a.includes('click') || a.includes('navigate'))) return 'carrier-tab-click';
  if (a.includes('offer rate') && (a.includes('enter') || a.includes('value'))) return 'offer-rate';
  if (a.includes('include carriers') && a.includes('select')) return 'include-carriers';
  if (a.includes('auto accept') && a.includes('check')) return 'auto-accept';
  if (a.includes('carrier contact') && a.includes('rate confirmation')) {
    if (a.includes('do not') || a.includes('don\'t') || a.includes('not select')) return 'carrier-contact';
    return 'carrier-contact';
  }

  // ── CAUTION alert (part of carrier-tab flow, not save-alert flow) ──
  if (a.includes('caution') && (a.includes('safety rating') || a.includes('carrier has a'))) return 'auto-accept';
  if (a.includes('click ok') && a.includes('popup')) return 'auto-accept';

  // ── Save / Alert / OK ──
  if (a.includes('save') && a.includes('button') && a.includes('click')) return 'save-button';
  if (a.includes('message') && a.includes('displayed') && a.includes('carrier contact')) return 'alert-message';
  if (/click\s+ok/i.test(action)) return 'click-ok';

  // ── View mode + post-save carrier tab + post ──
  if (a.includes('view mode') || (a.includes('load is') && a.includes('view'))) return 'view-mode';

  // ── Post ──
  if (a.includes('post') && (a.includes('button') || a.includes('the load'))) return 'post-button';
  // Carrier tab click that mentions "post status" is a post-save navigation, not carrier-tab-setup
  if (a.includes('carrier tab') && a.includes('post status')) return 'post-button';

  // ── DME ──
  if (a.includes('log into dme') || a.includes('login') && a.includes('dme')) return 'dme-login';
  if ((a.includes('click on loads') || a.includes('load number') || a.includes('search it')) &&
      !a.includes('carrier') && !a.includes('tnx')) return 'dme-action';

  // ── TNX ──
  if (a.includes('log into tnx') || a.includes('login') && a.includes('tnx')) return 'tnx-login';
  if (a.includes('email') && a.includes('password') && !a.includes('notification')) return 'tnx-action';
  if (a.includes('click continue') || a.includes('click on continue')) return 'tnx-action';
  if (a.includes('select') && a.includes('carrier') && a.includes('dropdown')) return 'tnx-action';
  if (a.includes('active jobs')) return 'tnx-action';
  if (a.includes('plus icon') && a.includes('search')) return 'tnx-action';
  if (a.includes('matched') && a.includes('offer rate')) return 'tnx-action';
  if (a.includes('progress') && a.includes('execution notes')) return 'tnx-action';

  // ── Switch to BTMS ──
  if (a.includes('switch') && a.includes('btms')) return 'btms-switch';

  // ── Carrier rate/details setup (customer rate, carrier rate, trailer length, expiration, email, miles) ──
  if ((a.includes('flat rate') || a.includes('customer rate') || a.includes('carrier rate'))
    && (a.includes('enter') || a.includes('eg') || a.includes('e.g'))) return 'carrier-rate-setup';
  if (a.includes('trailer length') && (a.includes('enter') || a.includes('value'))) return 'carrier-rate-setup';
  if (a.includes('expiration date') || a.includes('expiration time')) return 'carrier-rate-setup';
  if (a.includes('email') && a.includes('notification') && (a.includes('enter') || a.includes('value'))) return 'carrier-rate-setup';
  if (a.includes('total miles') || (a.includes('miles') && (a.includes('enter') || a.includes('eg')))) return 'carrier-rate-setup';

  // ── CHOOSE CARRIER ──
  if (a.includes('choose carrier') || (a.includes('choose') && a.includes('carrier') && a.includes('active'))) return 'choose-carrier';

  return 'single';
}

// ─────────────────────────── Grouping Rules ───────────────────────────

const GROUP_COMPATIBLE: Record<string, StepCategory[]> = {
  'load-form-fill': ['form-field', 'form-auto', 'form-preselected'],
  'create-load-and-rate': ['create-load', 'rate-type'],
  'carrier-tab-setup': ['carrier-tab-click', 'offer-rate', 'include-carriers', 'auto-accept', 'carrier-contact'],
  'carrier-rate-and-details': ['carrier-rate-setup'],
  'save-alert-fix': ['save-button', 'alert-message', 'click-ok', 'carrier-contact'],
  'dme-verification': ['dme-login', 'dme-action'],
  'tnx-verification': ['tnx-login', 'tnx-action'],
  'customer-to-create': ['customer-search', 'navigate-create'],
  'btms-switch': ['btms-switch'],
  'post-load': ['post-button', 'view-mode'],
};

function findGroupType(category: StepCategory): string | null {
  for (const [groupType, compatibleCategories] of Object.entries(GROUP_COMPATIBLE)) {
    if (compatibleCategories.includes(category)) {
      return groupType;
    }
  }
  return null;
}

// ─────────────────────────── Composite Code Generators ───────────────────────────

function generateLoadFormFillCode(): string {
  return `console.log("CSV 6-7: Customer field pre-selected, Salesperson/Dispatcher pre-selected");
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
            shipperCountry: testData.shipperCountry,
            shipperZip: testData.shipperZip,
            shipperAddress: testData.shipperAddress,
            shipperNameNew: testData.shipperNameNew,
          });
          console.log("Shipper, Consignee, dates/times, commodity, equipment fields filled");
          pages.logger.info("Enter New Load form completed");`;
}

function generateCreateLoadAndRateCode(): string {
  return `await pages.nonTabularLoadPage.clickCreateLoadButton();
          console.log("Clicked Create Load button");
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          console.log(\`Rate type set to \${testData.rateType}\`);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          console.log(\`Load Number captured: \${loadNumber}\`);
          await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
          pages.logger.info("Load created successfully");`;
}

function generateCarrierTabSetupCode(steps: TestStep[]): string {
  const hasNoSelectContact = steps.some(s =>
    s.action.toLowerCase().includes('do not') || s.action.toLowerCase().includes('not select')
  );

  // Detect if a CAUTION alert step follows the auto-accept checkbox
  const hasCautionAlert = steps.some(s => {
    const a = s.action.toLowerCase();
    return a.includes('caution') || (a.includes('message') && a.includes('safety rating'));
  });

  // Detect if auto-accept checkbox is in this group
  const hasAutoAccept = steps.some(s => s.action.toLowerCase().includes('auto accept'));

  let code = `await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          console.log("Clicked Carrier tab");
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          console.log(\`Entered Offer Rate: \${testData.offerRate}\`);
          await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.Carrier]);
          console.log(\`Selected carrier: \${testData.Carrier}\`);`;

  if (hasAutoAccept && hasCautionAlert) {
    // Set up alert handler BEFORE clicking the checkbox that triggers the dialog
    code += `
          // Set up CAUTION alert handler before clicking auto accept
          const cautionAlert = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.CARRIER_CAUTIONARY_SAFETY_RATING
          );
          await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
          console.log("Checked Carrier Auto Accept checkbox");
          await cautionAlert;
          console.log("Validated: CAUTION carrier safety rating alert displayed and accepted");`;
  } else if (hasAutoAccept) {
    code += `
          await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
          console.log("Checked Carrier Auto Accept checkbox");`;
  }

  if (hasNoSelectContact) {
    code += `\n          console.log("Carrier Contact for Rate Confirmation intentionally left empty");`;
  }

  code += `\n          pages.logger.info("Carrier tab configured for auto accept test");`;
  return code;
}

function generateSaveAlertFixCode(steps: TestStep[]): string {
  const alertStep = steps.find(s => s.action.toLowerCase().includes('message') && s.action.toLowerCase().includes('displayed'));
  const hasSelectContact = steps.some(s =>
    s.action.toLowerCase().includes('select') &&
    s.action.toLowerCase().includes('active loadboard') &&
    !s.action.toLowerCase().includes('do not')
  );

  let code = `await pages.editLoadFormPage.clickOnSaveBtn();
          console.log("Clicked Save button");`;

  if (alertStep) {
    code += `
          await pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED
          );
          console.log("Validated alert — A carrier contact for auto accept must be selected");
          console.log("Clicked OK to dismiss alert");
          pages.logger.info("Validated alert: carrier contact required for auto accept");`;
  }

  if (hasSelectContact) {
    code += `
          const contactDropdown = sharedPage.locator("//select[@id='form_accept_as_user']");
          await contactDropdown.waitFor({ state: "attached", timeout: WAIT.LARGE });
          await sharedPage.waitForTimeout(2000);
          const contactOptions = await contactDropdown.locator("option").allTextContents();
          const matchedContact = contactOptions.find(
            (opt: string) => opt.toLowerCase().includes(testData.saleAgentEmail.toLowerCase())
          );
          console.log(\`Looking for carrier contact with email: \${testData.saleAgentEmail}\`);
          console.log(\`Available options: [\${contactOptions.filter((o: string) => o.trim()).join(" | ")}]\`);
          expect(matchedContact, \`No contact found with email: \${testData.saleAgentEmail}\`).toBeTruthy();
          const normalizedLabel = matchedContact!.trim().replace(/\\s+/g, " ");
          await pages.dfbLoadFormPage.selectCarreirContactForRateConfirmation(normalizedLabel);
          console.log(\`Selected carrier contact for rate confirmation: \${normalizedLabel}\`);
          await pages.editLoadFormPage.clickOnSaveBtn();
          console.log("Clicked Save button");
          await pages.viewLoadPage.validateViewLoadHeading();
          console.log("Load saved and displayed in View mode");
          pages.logger.info("Load saved with carrier contact");`;
  }

  return code;
}

function generateDMEVerificationCode(): string {
  const lines = [
    'console.log("Switching to DME application");',
    'const dmePages = await appManager.switchToDME();',
    'await dmePages.dmeDashboardPage.clickOnLoadsLink();',
    'console.log("Clicked on Loads");',
    'await dmePages.dmeDashboardPage.searchLoad(loadNumber);',
    'console.log(`Searched for load number: ${loadNumber}`);',
    'await dmePages.dmeLoadPage.validateAndGetStatusTextWithRetry(',
    '  LOAD_STATUS.BTMS_CANCELLED,',
    '  LOAD_STATUS.TNX_BOOKED,',
    '  loadNumber,',
    '  dmePages.dmeDashboardPage',
    ');',
    'console.log("Validated: DME statuses — BTMS CANCELLED, TNX BOOKED");',
    'await dmePages.dmeLoadPage.validateSingleTableRowPresent();',
    'await dmePages.dmeLoadPage.validateAndGetSourceIdText(loadNumber);',
    'await dmePages.dmeLoadPage.clickOnDataDetailsLink();',
    'await dmePages.dmeLoadPage.clickOnShowIconLink();',
    'await dmePages.dmeLoadPage.validateAuctionAssignedText(',
    '  loadNumber,',
    '  dmePages.dmeDashboardPage',
    ');',
    'pages.logger.info("DME load verification completed");',
  ];
  return lines.join('\n          ');
}

function generateTNXVerificationCode(): string {
  const lines = [
    'console.log("Switching to TNX application and logging in");',
    'const tnxPages = await appManager.switchToTNX();',
    'await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });',
    '',
    'await tnxPages.tnxLandingPage.selectOrganizationByText(testData.Carrier);',
    'console.log(`Selected carrier from dropdown: ${testData.Carrier}`);',
    'await tnxPages.tnxLandingPage.handleOptionalSkipButton();',
    'await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();',
    'await tnxPages.tnxLandingPage.clickOnTNXHeaderLink(TNX.ACTIVE_JOBS);',
    'console.log("Clicked on Active Jobs");',
    'await tnxPages.tnxLandingPage.clickPlusButton();',
    'await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);',
    'console.log(`Clicked plus icon and searched load: ${loadNumber}`);',
    'await tnxPages.tnxLandingPage.clickLoadSearchLink();',
    'await tnxPages.tnxLandingPage.validateBidsTabAvailableLoadsText(',
    '  TNX.SINGLE_JOB_RECORD,',
    '  loadNumber',
    ');',
    'await tnxPages.tnxLandingPage.clickLoadLink();',
    'console.log("Clicked load — verifying Matched status and offer rate");',
    'const tnxOfferRate = await tnxPages.tnxLandingPage.getLoadOfferRateValue();',
    'const tnxRateNumeric = tnxOfferRate.replace(/[\\$,]/g, "").split(".")[0];',
    'const expectedRateNumeric = testData.offerRate.replace(/[\\$,]/g, "").split(".")[0];',
    'console.log(`TNX Offer Rate: "${tnxOfferRate}" (numeric: ${tnxRateNumeric}) | Expected: "${testData.offerRate}" (numeric: ${expectedRateNumeric})`);',
    'expect(tnxRateNumeric, `Offer rate mismatch`).toBe(expectedRateNumeric);',
    'await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(',
    '  TENDER_DETAILS_MODAL_TABS.GENERAL',
    ');',
    'await tnxPages.tnxLandingPage.validateStatusHistoryText(',
    '  TNX_STATUS_HISTORY.STATUS_MATCHED',
    ');',
    'console.log("Validated: Load is Matched in TNX");',
    'await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(',
    '  TENDER_DETAILS_MODAL_TABS.PROGRESS',
    ');',
    'console.log("Clicked Progress tab — checking execution notes fields");',
    'await tnxPages.tnxExecutionTenderPage.validateExecutionNotesFieldsPresence();',
    'console.log("Validated: Execution notes fields are displayed");',
    'pages.logger.info("TNX validation completed — load Matched, execution notes verified");',
  ];
  return lines.join('\n          ');
}

function generateCustomerToCreateCode(): string {
  const lines = [
    'const btmsBaseUrl = new URL(sharedPage.url()).origin;',
    'await sharedPage.goto(btmsBaseUrl);',
    'await commonReusables.waitForAllLoadStates(sharedPage);',
    'await sharedPage.locator(\'#c-sitemenu-container\').waitFor({ state: \'visible\', timeout: 15000 });',
    'console.log("Navigated to BTMS Home");',
    'await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);',
    'await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);',
    'console.log("Hovered to Customers and clicked Search");',
    'await pages.searchCustomerPage.enterCustomerName(testData.customerName);',
    'console.log(`Entered customer name: ${testData.customerName}`);',
    'await pages.searchCustomerPage.selectActiveOnCustomerPage();',
    'await pages.searchCustomerPage.clickOnSearchCustomer();',
    'console.log("Clicked Search button");',
    'await pages.searchCustomerPage.selectCustomerByName(testData.customerName);',
    'console.log("Clicked on Customer profile");',
    'await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);',
    'console.log("Clicked CREATE TL *NEW* hyperlink");',
    'pages.logger.info("Navigated to Enter New Load page");',
  ];
  return lines.join('\n          ');
}

function generateCarrierRateAndDetailsCode(steps: TestStep[]): string {
  const lines: string[] = [];

  // Extract values from step text where "eg X" or "e.g. X" patterns exist
  const extractValue = (text: string): string | null => {
    const match = text.match(/(?:eg|e\.g\.?|as|=|:)\s*(\d+(?:\.\d+)?)/i);
    return match ? match[1] : null;
  };

  for (const step of steps) {
    const a = step.action.toLowerCase();

    if ((a.includes('flat rate') && a.includes('customer')) || a.includes('customer rate')) {
      const val = extractValue(step.action) || '500';
      lines.push(`await pages.editLoadCarrierTabPage.enterCustomerRate("${val}");`);
      lines.push(`console.log("Entered Customer Rate: ${val}");`);
    } else if ((a.includes('flat rate') && a.includes('carrier')) || (a.includes('carrier rate') && !a.includes('customer'))) {
      const val = extractValue(step.action) || '600';
      lines.push(`await pages.editLoadCarrierTabPage.enterCarrierRate("${val}");`);
      lines.push(`console.log("Entered Carrier Rate: ${val}");`);
    } else if (a.includes('trailer length')) {
      lines.push('await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);');
      lines.push('console.log(`Entered trailer length: ${testData.trailerLength}`);');
    } else if (a.includes('expiration date')) {
      lines.push('const futureDate = new Date();');
      lines.push('futureDate.setDate(futureDate.getDate() + 7);');
      lines.push("const formattedDate = `${(futureDate.getMonth() + 1).toString().padStart(2, '0')}/${futureDate.getDate().toString().padStart(2, '0')}/${futureDate.getFullYear()}`;");
      lines.push('await sharedPage.locator("#form_expiration_date").fill(formattedDate);');
      lines.push('console.log(`Entered Expiration Date: ${formattedDate}`);');
    } else if (a.includes('expiration time')) {
      const timeMatch = step.action.match(/(?:as|=|:)\s*(\d{1,2}:\d{2})/i);
      const timeValue = timeMatch ? timeMatch[1] : '18:00';
      lines.push(`await sharedPage.locator("#form_expiration_time").fill("${timeValue}");`);
      lines.push(`console.log("Entered Expiration Time: ${timeValue}");`);
    } else if (a.includes('email') && a.includes('notification')) {
      lines.push(`// Dynamic email notification field lookup — #form_notification_email is a label, not an input`);
      lines.push(`const emailValue = testData.saleAgentEmail;`);
      lines.push(`const notifSelect = sharedPage.locator("select#form_notification_address").first();`);
      lines.push(`const notifSelectAlt = sharedPage.locator("//*[@id='form_notification_email']//following::select[1]").first();`);
      lines.push(`const notifSelect2 = sharedPage.locator("//*[@id='form_notification_email']//following::span[contains(@class,'select2')][1]").first();`);
      lines.push(`if (await notifSelect.isVisible({ timeout: 5000 }).catch(() => false)) {`);
      lines.push(`  const options = await notifSelect.locator("option").allTextContents();`);
      lines.push(`  const match = options.find((o: string) => o.toLowerCase().includes(emailValue.toLowerCase()));`);
      lines.push(`  await notifSelect.selectOption({ label: match ? match.trim() : emailValue });`);
      lines.push(`  console.log("Selected email notification via dropdown: " + (match || emailValue));`);
      lines.push(`} else if (await notifSelectAlt.isVisible({ timeout: 3000 }).catch(() => false)) {`);
      lines.push(`  const options = await notifSelectAlt.locator("option").allTextContents();`);
      lines.push(`  const match = options.find((o: string) => o.toLowerCase().includes(emailValue.toLowerCase()));`);
      lines.push(`  await notifSelectAlt.selectOption({ label: match ? match.trim() : emailValue });`);
      lines.push(`  console.log("Selected email notification via sibling select: " + (match || emailValue));`);
      lines.push(`} else if (await notifSelect2.isVisible({ timeout: 3000 }).catch(() => false)) {`);
      lines.push(`  await notifSelect2.click();`);
      lines.push(`  const searchInput = sharedPage.locator("input.select2-search__field").first();`);
      lines.push(`  await searchInput.waitFor({ state: "visible", timeout: 5000 });`);
      lines.push(`  await searchInput.fill(emailValue);`);
      lines.push(`  await sharedPage.waitForTimeout(2000);`);
      lines.push(`  const resultItem = sharedPage.locator("//li[contains(@class,'select2-results__option') and contains(text(),'" + emailValue + "')]").first();`);
      lines.push(`  await resultItem.waitFor({ state: "visible", timeout: 10000 });`);
      lines.push(`  await resultItem.click();`);
      lines.push(`  console.log("Selected email notification via Select2: " + emailValue);`);
      lines.push(`} else {`);
      lines.push(`  console.log("Email notification field not found via known selectors");`);
      lines.push(`}`);
    } else if (a.includes('miles')) {
      const val = extractValue(step.action) || '100';
      lines.push(`await pages.editLoadCarrierTabPage.enterMiles("${val}");`);
      lines.push(`console.log("Entered total miles: ${val}");`);
    }
  }

  return lines.join('\n          ');
}

function generateBTMSSwitchCode(): string {
  const lines = [
    'await appManager.switchToBTMS();',
    'const btmsBaseUrl = new URL(sharedPage.url()).origin;',
    'await sharedPage.goto(btmsBaseUrl);',
    'await commonReusables.waitForAllLoadStates(sharedPage);',
    'await sharedPage.locator(\'#c-sitemenu-container\').waitFor({ state: \'visible\', timeout: 15000 });',
    'console.log("Switched back to BTMS via URL-based navigation");',
  ];
  return lines.join('\n          ');
}

function generatePostLoadCode(steps: TestStep[]): string {
  const hasViewMode = steps.some(s => {
    const a = s.action.toLowerCase();
    return a.includes('view mode') || (a.includes('load is') && a.includes('view'));
  });
  const hasCarrierTab = steps.some(s => {
    const a = s.action.toLowerCase();
    return a.includes('carrier tab') && !a.includes('offer rate');
  });

  const lines: string[] = [];

  if (hasViewMode) {
    lines.push(
      'await pages.viewLoadPage.viewLoadPageVisible();',
      'console.log("Load is in View mode");',
    );
  }
  if (hasCarrierTab) {
    lines.push(
      'await pages.viewLoadPage.clickCarrierTab();',
      'await commonReusables.waitForAllLoadStates(sharedPage);',
      'console.log("Clicked Carrier tab");',
    );
  }
  lines.push(
    'await pages.dfbLoadFormPage.clickOnPostButton();',
    'console.log("Clicked Post button");',
    'pages.logger.info("Load posted, moving to verification");',
  );
  return lines.join('\n          ');
}

// ─────────────────────────── Composite name generators ───────────────────────────

const GROUP_NAMES: Record<string, (steps: TestStep[]) => string> = {
  'load-form-fill': (steps) => {
    const first = steps[0].stepNumber;
    const last = steps[steps.length - 1].stepNumber;
    return `Fill Enter New Load page details (CSV ${first}-${last})`;
  },
  'create-load-and-rate': () => 'Click Create Load and select Rate Type',
  'carrier-tab-setup': () => 'Carrier tab — enter offer rate, select carrier, check auto accept',
  'carrier-rate-and-details': () => 'Carrier tab — enter rates, trailer length, expiration, email, miles',
  'save-alert-fix': (steps) => {
    const hasAlert = steps.some(s => s.action.toLowerCase().includes('message'));
    return hasAlert
      ? 'Save without carrier contact — validate error, fix and re-save'
      : 'Save the load';
  },
  'dme-verification': () => 'Switch to DME — verify load statuses',
  'tnx-verification': () => 'Switch to TNX — verify load is Matched and execution notes',
  'customer-to-create': () => 'Search customer and navigate to CREATE TL *NEW*',
  'post-load': (steps: TestStep[]) => {
    const hasViewMode = steps.some(s => s.action.toLowerCase().includes('view mode'));
    const hasCarrierTab = steps.some(s => s.action.toLowerCase().includes('carrier tab'));
    if (hasViewMode && hasCarrierTab) return 'Verify View mode, click Carrier tab, and Post the load';
    if (hasViewMode) return 'Verify View mode and Post the load';
    if (hasCarrierTab) return 'Click Carrier tab and Post the load';
    return 'Post the load';
  },
  'btms-switch': () => 'Switch back to BTMS',
  'single': (steps) => steps[0].action.substring(0, 60),
};

// ─────────────────────────── Main Grouper ───────────────────────────

export class FormStepGrouper {

  /**
   * Groups consecutive compatible steps into composite groups.
   * Returns an ordered array of CompositeGroup entries — some with pre-generated
   * composite code, others as 'single' (to be generated individually).
   */
  groupSteps(steps: TestStep[]): CompositeGroup[] {
    if (!steps || steps.length === 0) return [];

    const classified = steps.map(step => ({
      step,
      category: classifyStep(step.action),
      groupType: findGroupType(classifyStep(step.action)),
    }));

    // Context-aware reclassification: a carrier-tab-click that appears between
    // view-mode/save-button and post-button is a post-save navigation step,
    // NOT a new carrier-tab-setup. Reclassify it into the post-load group.
    for (let k = 1; k < classified.length; k++) {
      if (classified[k].category === 'carrier-tab-click') {
        const prevCat = classified[k - 1].category;
        const nextCat = k + 1 < classified.length ? classified[k + 1].category : null;
        const isAfterSaveOrView = prevCat === 'view-mode' || prevCat === 'save-button';
        const isBeforePost = nextCat === 'post-button';
        if (isAfterSaveOrView || isBeforePost) {
          classified[k].category = 'post-button';
          classified[k].groupType = 'post-load';
        }
      }
    }

    const groups: CompositeGroup[] = [];
    let i = 0;

    while (i < classified.length) {
      const current = classified[i];

      if (!current.groupType) {
        // Ungrouped step → single
        groups.push({
          type: 'single',
          steps: [current.step],
          csvStepRange: [current.step.stepNumber],
          compositeCode: null,
          compositeStepName: null,
        });
        i++;
        continue;
      }

      // Collect consecutive steps compatible with the current group type.
      // A step joins the group if its CATEGORY is listed in the group's compatible categories,
      // even if its default groupType differs. This handles cases like carrier-contact being
      // compatible with both carrier-tab-setup and save-alert-fix.
      const currentGroupType = current.groupType!;
      const compatibleCategories = GROUP_COMPATIBLE[currentGroupType] || [];
      const groupSteps: TestStep[] = [current.step];
      let j = i + 1;
      while (j < classified.length &&
        (classified[j].groupType === currentGroupType ||
         compatibleCategories.includes(classified[j].category))) {
        groupSteps.push(classified[j].step);
        j++;
      }

      // Create a composite group if 2+ steps, or for group types that are meaningful as singletons
      const singletonGroups = ['btms-switch', 'post-load', 'customer-to-create'];
      if (groupSteps.length >= 2 || singletonGroups.includes(current.groupType!)) {
        const groupType = current.groupType as CompositeGroup['type'];
        const csvRange = groupSteps.map(s => s.stepNumber);
        const nameFn = GROUP_NAMES[groupType] || GROUP_NAMES['single'];
        const compositeStepName = nameFn(groupSteps);

        let compositeCode: string | null = null;
        switch (groupType) {
          case 'load-form-fill':
            compositeCode = generateLoadFormFillCode();
            break;
          case 'create-load-and-rate':
            compositeCode = generateCreateLoadAndRateCode();
            break;
          case 'carrier-tab-setup':
            compositeCode = generateCarrierTabSetupCode(groupSteps);
            break;
          case 'carrier-rate-and-details':
            compositeCode = generateCarrierRateAndDetailsCode(groupSteps);
            break;
          case 'save-alert-fix':
            compositeCode = generateSaveAlertFixCode(groupSteps);
            break;
          case 'dme-verification':
            compositeCode = generateDMEVerificationCode();
            break;
          case 'tnx-verification':
            compositeCode = generateTNXVerificationCode();
            break;
          case 'customer-to-create':
            compositeCode = generateCustomerToCreateCode();
            break;
          case 'btms-switch':
            compositeCode = generateBTMSSwitchCode();
            break;
          case 'post-load':
            compositeCode = generatePostLoadCode(groupSteps);
            break;
          default:
            compositeCode = null;
        }

        groups.push({
          type: groupType,
          steps: groupSteps,
          csvStepRange: csvRange,
          compositeCode,
          compositeStepName,
        });
      } else {
        groups.push({
          type: 'single',
          steps: groupSteps,
          csvStepRange: [current.step.stepNumber],
          compositeCode: null,
          compositeStepName: null,
        });
      }

      i = j;
    }

    this.logGroupingSummary(groups);
    return groups;
  }

  private logGroupingSummary(groups: CompositeGroup[]): void {
    const compositeCount = groups.filter(g => g.type !== 'single').length;
    const singleCount = groups.filter(g => g.type === 'single').length;
    const totalStepsCovered = groups.reduce((sum, g) => sum + g.steps.length, 0);
    const compositeStepsCovered = groups
      .filter(g => g.type !== 'single')
      .reduce((sum, g) => sum + g.steps.length, 0);

    if (compositeCount > 0) {
      console.log(`   📦 FormStepGrouper: ${compositeCount} composite group(s) collapsing ${compositeStepsCovered} CSV steps, ${singleCount} single step(s), ${totalStepsCovered} total`);
      for (const g of groups) {
        if (g.type !== 'single') {
          console.log(`      ├─ ${g.type}: CSV steps ${g.csvStepRange[0]}-${g.csvStepRange[g.csvStepRange.length - 1]} (${g.steps.length} steps → 1 composite)`);
        }
      }
    }
  }
}
