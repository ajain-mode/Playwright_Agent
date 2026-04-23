/**
 * Declarative regex → page-object code mappings for rule-based step generation.
 * Order in STEP_MAPPINGS is significant: first match wins (specific before generic).
 */

export interface StepMapping {
  pattern: RegExp;
  pageObject: string;
  method: string;
  code: string;
  args?: string[];
  confidence: number;
  requiresContext?: string;
  multiLine?: boolean;
  category: string;
}

function tabConstantFromLabel(label: string): string {
  return label
    .replace(/^(?:the|a|an)\s+/i, '')
    .replace(/[\u201C\u201D\u201E\u201F\u2018\u2019\u201A\u201B\u2033\u2036\u2032\u2035"'""]/g, '')
    .replace(/[^a-zA-Z0-9\s_]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
}

/**
 * Replaces `{$1}`, `{$2}`, `{$1_UPPER}`, etc., and `{testData.fieldName}` in emitted code.
 * Braced `testData.*` placeholders become the TS expression `testData.fieldName` (identifiers preserved).
 */
export function resolveCodePlaceholders(
  code: string,
  captures: RegExpMatchArray | null,
  testData?: Record<string, unknown>,
): string {
  let out = code;
  if (captures) {
    out = out.replace(/\{\$(\d+)_UPPER\}/g, (_, idx: string) => {
      const n = Number(idx);
      const raw = captures[n]?.trim() ?? '';
      return tabConstantFromLabel(raw);
    });
    out = out.replace(/\{\$(\d+)\}/g, (_, idx: string) => {
      const n = Number(idx);
      return captures[n]?.trim() ?? '';
    });
  }
  out = out.replace(/\{testData\.([a-zA-Z0-9_]+)\}/g, (_full, key: string) => {
    if (testData && key in testData && testData[key] !== undefined && testData[key] !== null) {
      const v = testData[key];
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        return JSON.stringify(v);
      }
    }
    return `testData.${key}`;
  });
  return out;
}

/**
 * Compute a specificity score for a regex match against an action string.
 * Rewards: longer literal prefix, more capture groups, narrower patterns.
 * This eliminates ordering sensitivity — mappings can be added anywhere
 * without worrying about position.
 */
function specificityScore(pattern: RegExp, action: string, matchArray: RegExpMatchArray): number {
  const src = pattern.source;

  // Estimate literal character count in the regex (non-metacharacter chars)
  const literalChars = src.replace(/\\[.*+?^${}()|[\]\\dswDSWbB]/g, '')
    .replace(/[.*+?^${}()|[\]\\]/g, '').length;
  const literalRatio = Math.min(literalChars / Math.max(action.length, 1), 1);

  // Capture groups indicate the pattern is extracting specific sub-parts
  const captureCount = (matchArray.length - 1);
  const captureBonus = Math.min(captureCount * 0.05, 0.15);

  // How much of the action string the match covers
  const matchCoverage = matchArray[0].length / Math.max(action.length, 1);

  // Anchored patterns (^ or $) are more specific
  const anchorBonus = (src.startsWith('^') ? 0.05 : 0) + (src.endsWith('$') ? 0.05 : 0);

  return literalRatio * 0.4 + matchCoverage * 0.4 + captureBonus + anchorBonus;
}

/**
 * Returns the best matching StepMapping by scoring all matches, not just the first.
 * Each candidate is scored by: mapping.confidence * specificityScore(pattern, action).
 * This eliminates ordering fragility — adding new mappings anywhere is safe.
 */
export function matchStepMapping(action: string): StepMapping | null {
  const lower = action.toLowerCase();

  let bestMapping: StepMapping | null = null;
  let bestScore = -1;
  let bestMatch: RegExpExecArray | null = null;

  for (const mapping of STEP_MAPPINGS) {
    const pattern = mapping.pattern;
    pattern.lastIndex = 0;
    const m = pattern.exec(lower);
    if (!m) {
      continue;
    }
    const score = mapping.confidence * specificityScore(pattern, lower, m);
    if (score > bestScore) {
      bestScore = score;
      bestMapping = mapping;
      bestMatch = m;
    }
  }

  if (!bestMapping || !bestMatch) {
    return null;
  }

  const m = bestMatch;
  const caps = m.slice(1).filter((c) => c !== undefined);
  let resolvedArgs: string[] | undefined;
  if (bestMapping.args?.length) {
    resolvedArgs = bestMapping.args.map((arg) => {
      if (arg === '$1') {
        return m[1] ?? '';
      }
      if (arg === '$2') {
        return m[2] ?? '';
      }
      if (arg === '$3') {
        return m[3] ?? '';
      }
      if (typeof arg === 'string' && arg.startsWith('testData.')) {
        return arg;
      }
      return arg;
    });
  } else if (caps.length > 0) {
    resolvedArgs = caps;
  }
  return { ...bestMapping, args: resolvedArgs };
}

export const STEP_MAPPINGS: StepMapping[] = [
  // --- LOGIN ---
  {
    pattern: /login.*tnx/i,
    pageObject: 'tnxLoginPage',
    method: 'TNXLogin',
    code: 'await pages.tnxLoginPage.TNXLogin(userSetup.tnxUser);',
    confidence: 1,
    category: 'LOGIN',
  },
  {
    pattern: /login.*dme/i,
    pageObject: 'dmeLoginPage',
    method: 'DMELogin',
    code: 'await pages.dmeLoginPage.DMELogin(userSetup.dmeUser);',
    confidence: 1,
    category: 'LOGIN',
  },
  {
    pattern: /^.*\blogin\b/i,
    pageObject: 'btmsLoginPage',
    method: 'BTMSLogin',
    code: `await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
  await pages.btmsAcceptTermPage.acceptTermsAndConditions();
}`,
    confidence: 1,
    multiLine: true,
    category: 'LOGIN',
  },

  // --- MULTI-APP SWITCHING ---
  {
    pattern: /switch\s*(?:to|back\s+to)?\s*dme/i,
    pageObject: 'MultiAppManager',
    method: 'switchToDME',
    code: `await appManager.switchToDME();
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 1,
    multiLine: true,
    category: 'MULTI_APP',
  },
  {
    pattern: /switch\s*(?:to|back\s+to)?\s*tnx/i,
    pageObject: 'MultiAppManager',
    method: 'switchToTNX',
    code: `const tnxPages = await appManager.switchToTNX();
await commonReusables.waitForAllLoadStates(appManager.tnxPage);`,
    confidence: 1,
    multiLine: true,
    category: 'MULTI_APP',
  },
  {
    pattern: /switch\s*(?:to|back\s+to)?\s*btms|switch\s*back\s+to\s*btms/i,
    pageObject: 'MultiAppManager',
    method: 'switchToBTMS',
    code: `await appManager.switchToBTMS();
await commonReusables.waitForAllLoadStates(sharedPage);
const btmsBaseUrl = new URL(sharedPage.url()).origin;
await sharedPage.goto(btmsBaseUrl);
await commonReusables.waitForAllLoadStates(sharedPage);
await sharedPage.locator('#c-sitemenu-container').waitFor({ state: 'visible', timeout: 15000 });`,
    confidence: 1,
    multiLine: true,
    category: 'MULTI_APP',
  },

  // --- HOVER (specific headers before generic) ---
  // RULE: Always navigateToBaseUrl() before hoverOverHeaderByText() — detail pages don't render nav header
  {
    pattern: /hover\s+(?:to|over|on)\s+(?:the\s+)?admin/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.95,
    multiLine: true,
    category: 'HOVER',
  },
  {
    pattern: /hover\s+(?:to|over|on)\s+(?:the\s+)?load/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.95,
    multiLine: true,
    category: 'HOVER',
  },
  {
    pattern: /hover\s+(?:to|over|on)\s+(?:the\s+)?customer/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.95,
    multiLine: true,
    category: 'HOVER',
  },
  {
    pattern: /hover\s+(?:to|over|on)\s+(?:the\s+)?carrier/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.95,
    multiLine: true,
    category: 'HOVER',
  },
  {
    pattern: /hover\s+(?:to|over|on)\s+(?:the\s+)?finance/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.95,
    multiLine: true,
    category: 'HOVER',
  },
  {
    pattern: /hover\s+(?:to|over|on)\s+(?:the\s+)?home/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.95,
    multiLine: true,
    category: 'HOVER',
  },
  {
    pattern: /hover\s+(?:to|over|on)\s+(?:the\s+)?agent/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.AGENT);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.95,
    multiLine: true,
    category: 'HOVER',
  },
  {
    pattern: /hover\s+(?:to|over|on)\s+(?:the\s+)?(.+?)\.?\s*$/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText("{$1}");
await commonReusables.waitForAllLoadStates(sharedPage);`,
    args: ['$1'],
    confidence: 0.95,
    multiLine: true,
    category: 'HOVER',
  },

  // --- NAVIGATION (specific routes first) ---
  // RULE: Always navigateToBaseUrl() before hoverOverHeaderByText() — detail pages don't render nav header
  {
    pattern: /(?:navigate|go\s+to).*post\s*automation/i,
    pageObject: 'postAutomationRulePage',
    method: 'clickPostAutomationButton',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
await pages.postAutomationRulePage.clickPostAutomationButton();
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /(?:navigate|go\s+to).*carrier\s*search/i,
    pageObject: 'basePage',
    method: 'hoverAndClickCarrierSearch',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /(?:navigate|go\s+to).*office\s*config/i,
    pageObject: 'basePage',
    method: 'clickHeaderAndSubMenu',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.clickHeaderAndSubMenu(HEADERS.HOME, ADMIN_SUB_MENU.OFFICE_CONFIG);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /(?:navigate|go\s+to).*agent\s*search/i,
    pageObject: 'basePage',
    method: 'navigateAgentSearch',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /(?:navigate|go\s+to).*sales\s*lead/i,
    pageObject: 'basePage',
    method: 'navigateSalesLeads',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.AGENT);
await pages.basePage.clickSubHeaderByText("My Sales Leads");
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /(?:navigate|go\s+to).*customer/i,
    pageObject: 'basePage',
    method: 'hoverCustomerSearch',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /(?:navigate|go\s+to).*carrier/i,
    pageObject: 'basePage',
    method: 'hoverCarrierSearch',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /(?:navigate|go\s+to).*admin/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /(?:navigate|go\s+to).*finance/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /(?:navigate|go\s+to).*load/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /(?:navigate|go\s+to).*home/i,
    pageObject: 'basePage',
    method: 'clickHomeButton',
    code: `await pages.basePage.navigateToBaseUrl();`,
    confidence: 0.9,
    category: 'NAVIGATION',
  },

  // --- CLICK (specific buttons / patterns before generic) ---
  {
    pattern: /click\s+(?:on\s+)?(?:the\s+)?save\s+button/i,
    pageObject: 'editLoadFormPage',
    method: 'clickOnSaveBtn',
    code: 'await pages.editLoadFormPage.clickOnSaveBtn();',
    confidence: 0.9,
    category: 'CLICK',
  },
  {
    pattern: /click\s+(?:on\s+)?(?:the\s+)?post\s+button/i,
    pageObject: 'dfbLoadFormPage',
    method: 'clickOnPostButton',
    code: 'await pages.dfbLoadFormPage.clickOnPostButton();',
    confidence: 0.9,
    category: 'CLICK',
  },
  {
    pattern: /click\s+(?:on\s+)?(?:the\s+)?create\s*load\s+button/i,
    pageObject: 'basePage',
    method: 'clickButtonByText',
    code: `await pages.basePage.clickButtonByText("Create Load");
await commonReusables.waitForAllLoadStates(sharedPage);
loadNumber = await pages.dfbLoadFormPage.getLoadNumber();`,
    confidence: 0.9,
    multiLine: true,
    category: 'CLICK',
  },
  {
    pattern: /click\s+(?:on\s+)?(?:the\s+)?search/i,
    pageObject: 'basePage',
    method: 'clickButtonByText',
    code: `await pages.basePage.clickButtonByText("Search");
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'CLICK',
  },
  {
    pattern: /click\s+(?:on\s+)?(?:the\s+)?(.+?)\s+tab/i,
    pageObject: 'editLoadPage',
    method: 'clickOnTab',
    code: `await pages.editLoadPage.clickOnTab(TABS.{$1_UPPER});`,
    args: ['$1'],
    confidence: 0.9,
    category: 'CLICK',
  },
  {
    pattern: /click\s+(?:on\s+)?(?:the\s+)?(.+?)\s+(?:link|menu)/i,
    pageObject: 'basePage',
    method: 'clickLinkByText',
    code: `await pages.basePage.clickLinkByText("{$1}");
await commonReusables.waitForAllLoadStates(sharedPage);`,
    args: ['$1'],
    confidence: 0.9,
    multiLine: true,
    category: 'CLICK',
  },
  {
    pattern: /click\s+(?:on\s+)?(?:the\s+)?(.+?)\s+button/i,
    pageObject: 'basePage',
    method: 'clickButtonByText',
    code: `await pages.basePage.clickButtonByText("{$1}");
await commonReusables.waitForAllLoadStates(sharedPage);`,
    args: ['$1'],
    confidence: 0.85,
    multiLine: true,
    category: 'CLICK',
  },

  // --- SAVE ---
  {
    pattern: /save.*close/i,
    pageObject: 'nonTabularLoadPage',
    method: 'clickSaveAndClose',
    code: `await pages.nonTabularLoadPage.clickSaveAndClose();
await commonReusables.waitForAllLoadStates(sharedPage);
loadNumber = await pages.dfbLoadFormPage.getLoadNumber();`,
    confidence: 0.95,
    multiLine: true,
    category: 'SAVE',
  },
  {
    pattern: /save.*office|save.*setting/i,
    pageObject: 'editOfficeInfoPage',
    method: 'clickSaveButton',
    code: `await pages.editOfficeInfoPage.clickSaveButton();
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.95,
    multiLine: true,
    category: 'SAVE',
  },
  {
    pattern: /\bsave\b/i,
    pageObject: 'editLoadFormPage',
    method: 'clickOnSaveBtn',
    code: `await pages.editLoadFormPage.clickOnSaveBtn();
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.95,
    multiLine: true,
    category: 'SAVE',
  },

  // --- CARRIER TAB & RATES ---
  {
    pattern: /carrier\s*tab/i,
    pageObject: 'editLoadPage',
    method: 'clickOnTab',
    code: `await pages.editLoadPage.clickOnTab(TABS.CARRIER);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'CARRIER_TAB',
  },
  {
    pattern: /enter.*customer.*rate|flat\s*rate.*customer/i,
    pageObject: 'editLoadCarrierTabPage',
    method: 'enterCustomerRate',
    code: `await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);`,
    confidence: 0.9,
    category: 'CARRIER_TAB',
  },
  {
    pattern: /enter.*carrier.*rate|flat\s*rate.*carrier/i,
    pageObject: 'editLoadCarrierTabPage',
    method: 'enterCarrierRate',
    code: `await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);`,
    confidence: 0.9,
    category: 'CARRIER_TAB',
  },
  {
    pattern: /enter.*(?:total\s*)?miles/i,
    pageObject: 'editLoadCarrierTabPage',
    method: 'enterMiles',
    code: `await pages.editLoadCarrierTabPage.enterMiles(testData.miles);`,
    confidence: 0.9,
    category: 'CARRIER_TAB',
  },
  {
    pattern: /enter.*trailer\s*length/i,
    pageObject: 'editLoadCarrierTabPage',
    method: 'enterValueInTrailerLength',
    code: 'await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);',
    confidence: 0.9,
    category: 'CARRIER_TAB',
  },
  {
    pattern: /choose\s*carrier/i,
    pageObject: 'editLoadCarrierTabPage',
    method: 'clickOnChooseCarrier',
    code: `await pages.editLoadCarrierTabPage.clickOnChooseCarrier();
await sharedPage.locator("#carr_1_carr_auto").waitFor({ state: "visible" });
await sharedPage.locator("#carr_1_carr_auto").pressSequentially(testData.Carrier ?? testData.carrierName ?? "", { delay: 50 });
await sharedPage.keyboard.press("Tab");
await sharedPage.waitForTimeout(3000);
const carrierOption = sharedPage.locator("#carr_1_carr_select > option");
if (await carrierOption.isVisible({ timeout: 5000 }).catch(() => false)) {
  await carrierOption.click();
}
await pages.editLoadCarrierTabPage.clickOnUseCarrierBtn();`,
    confidence: 0.9,
    multiLine: true,
    category: 'CARRIER_TAB',
  },
  {
    pattern: /carrier.*assigned|carrier.*dispatch/i,
    pageObject: 'viewLoadCarrierTabPage',
    method: 'validateCarrierAssignedText',
    code: `await pages.viewLoadCarrierTabPage.validateCarrierAssignedText();
await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(CARRIER_DISPATCH_NAME.DISPATCH_NAME_1);
await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(CARRIER_DISPATCH_EMAIL.DISPATCH_EMAIL_1);`,
    confidence: 0.9,
    multiLine: true,
    category: 'CARRIER_TAB',
  },
  {
    pattern: /carrier\s*tab.*(?:dispatch|name)/i,
    pageObject: 'viewLoadCarrierTabPage',
    method: 'validateCarrierDispatch',
    code: `await pages.viewLoadPage.clickCarrierTab();
await commonReusables.waitForAllLoadStates(sharedPage);
await pages.viewLoadCarrierTabPage.validateCarrierAssignedText();
await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(testData.dispatchName);
await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(testData.dispatchEmail);`,
    confidence: 0.9,
    multiLine: true,
    category: 'CARRIER_TAB',
  },
  {
    pattern: /include\s*carrier/i,
    pageObject: 'dfbLoadFormPage',
    method: 'selectCarriersInIncludeCarriers',
    code: `await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.carrierName]);`,
    confidence: 0.9,
    category: 'CARRIER_TAB',
  },

  // --- ALERT / MESSAGE ---
  {
    pattern: /accept.*alert|alert.*accept|alert.*ok/i,
    pageObject: 'commonReusables',
    method: 'validateAlert',
    code: `await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.EXPECTED_MESSAGE);`,
    confidence: 0.9,
    category: 'ALERT_MESSAGE',
  },
  {
    pattern: /validate.*(?:alert|message)/i,
    pageObject: 'commonReusables',
    method: 'validateAlert',
    code: `await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.EXPECTED_MESSAGE);
console.log("Alert validated");`,
    confidence: 0.9,
    multiLine: true,
    category: 'ALERT_MESSAGE',
  },

  // --- LOAD FORM ---
  {
    pattern: /fill.*(?:form|dfb|load\s*form)/i,
    pageObject: 'nonTabularLoadPage',
    method: 'createNonTabularLoad',
    code: `await pages.nonTabularLoadPage.createNonTabularLoad({
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
});
loadNumber = await pages.dfbLoadFormPage.getLoadNumber();`,
    confidence: 0.9,
    multiLine: true,
    category: 'LOAD_FORM',
  },
  {
    pattern: /create.*(?:load|non.?tabular)/i,
    pageObject: 'loadsPage',
    method: 'clickNewLoadDropdown',
    code: `await pages.loadsPage.clickNewLoadDropdown();
await pages.loadsPage.selectNonTabularTL();
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
});
loadNumber = await pages.dfbLoadFormPage.getLoadNumber();`,
    confidence: 0.9,
    multiLine: true,
    category: 'LOAD_FORM',
  },
  {
    pattern: /validate.*load.*status/i,
    pageObject: 'viewLoadPage',
    method: 'refreshAndValidateLoadStatus',
    code: 'await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.BOOKED);',
    confidence: 0.9,
    category: 'LOAD_FORM',
  },
  {
    pattern: /search.*load/i,
    pageObject: 'allLoadsSearchPage',
    method: 'searchByLoadNumber',
    code: `await pages.allLoadsSearchPage.searchByLoadNumber(loadNumber);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'LOAD_FORM',
  },
  {
    pattern: /get.*load\s*number/i,
    pageObject: 'dfbLoadFormPage',
    method: 'getLoadNumber',
    code: `loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
console.log("Load Number:", loadNumber);`,
    confidence: 0.9,
    multiLine: true,
    category: 'LOAD_FORM',
  },

  // --- TOGGLE / SETTINGS (office) ---
  {
    pattern: /(?:toggle|enable|disable|set|ensure).*carrier\s*auto\s*accept.*(yes|no|on|off)/i,
    pageObject: 'editOfficeInfoPage',
    method: 'setToggle',
    code: `await pages.editOfficeInfoPage.setToggle("Carrier Auto Accept", /^(yes|on|enable)$/i.test("{$1}"));`,
    args: ['$1'],
    confidence: 0.9,
    category: 'TOGGLE_SETTINGS',
  },
  {
    pattern: /(?:toggle|enable|disable|set|ensure).*tnx\s*bid.*(yes|no|on|off)/i,
    pageObject: 'editOfficeInfoPage',
    method: 'setToggle',
    code: `await pages.editOfficeInfoPage.setToggle("Enable TNX Bids", /^(yes|on|enable)$/i.test("{$1}"));`,
    args: ['$1'],
    confidence: 0.9,
    category: 'TOGGLE_SETTINGS',
  },
  {
    pattern: /(?:toggle|enable|disable|set|ensure).*digital\s*matching.*(yes|no|on|off)/i,
    pageObject: 'editOfficeInfoPage',
    method: 'setToggle',
    code: `await pages.editOfficeInfoPage.setToggle("Enable Digital Matching Engine", /^(yes|on|enable)$/i.test("{$1}"));`,
    args: ['$1'],
    confidence: 0.9,
    category: 'TOGGLE_SETTINGS',
  },
  {
    pattern: /(?:toggle|enable|disable|set|ensure).*auto\s*post.*(yes|no|on|off)/i,
    pageObject: 'editOfficeInfoPage',
    method: 'setToggle',
    code: `await pages.editOfficeInfoPage.setToggle("Auto Post", /^(yes|on|enable)$/i.test("{$1}"));`,
    args: ['$1'],
    confidence: 0.9,
    category: 'TOGGLE_SETTINGS',
  },
  {
    pattern: /(?:toggle|enable|disable|set|ensure).*greenscreen.*(yes|no|on|off)/i,
    pageObject: 'editOfficeInfoPage',
    method: 'setToggle',
    code: `await pages.editOfficeInfoPage.setToggle("Greenscreen", /^(yes|on|enable)$/i.test("{$1}"));`,
    args: ['$1'],
    confidence: 0.9,
    category: 'TOGGLE_SETTINGS',
  },

  // --- OFFICE ---
  {
    pattern: /office\s*profile|office\s*info/i,
    pageObject: 'editOfficeInfoPage',
    method: 'clickOnOfficeProfile',
    code: `await pages.editOfficeInfoPage.clickOnOfficeProfile();
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'OFFICE',
  },
  {
    pattern: /click.*edit.*(?:office|profile|setting)/i,
    pageObject: 'editOfficeInfoPage',
    method: 'clickEditButton',
    code: `await pages.editOfficeInfoPage.clickEditButton();
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'OFFICE',
  },

  // --- DFB SPECIFIC ---
  {
    pattern: /validate.*dfb.*(?:field|form)/i,
    pageObject: 'dfbLoadFormPage',
    method: 'validateDFBTextFieldHaveExpectedValues',
    code: `await pages.viewLoadPage.scrollToDFBSection();
const formattedOfferRate = parseFloat(testData.offerRate).toFixed(2);
await pages.dfbLoadFormPage.validateDFBTextFieldHaveExpectedValues({
  offerRate: formattedOfferRate,
  expirationDate: pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
  expirationTime: testData.shipperLatestTime.padStart(5, "0"),
});
await pages.dfbLoadFormPage.validateFormFieldsState({
  includeCarriers: [testData.Carrier],
  emailNotification: agentEmail,
});
await pages.dfbLoadFormPage.validateFieldsAreNotEditable([
  DFB_FORM_FIELDS.Email_Notification, DFB_FORM_FIELDS.Expiration_Date,
  DFB_FORM_FIELDS.Expiration_Time, DFB_FORM_FIELDS.Commodity,
  DFB_FORM_FIELDS.NOTES, DFB_FORM_FIELDS.Exclude_Carriers,
  DFB_FORM_FIELDS.Include_Carriers,
]);`,
    confidence: 0.85,
    multiLine: true,
    category: 'DFB',
  },
  {
    pattern: /validate.*post\s*status/i,
    pageObject: 'dfbLoadFormPage',
    method: 'validatePostStatus',
    code: 'await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);',
    confidence: 0.9,
    category: 'DFB',
  },
  {
    pattern: /carrier\s*auto.?accept/i,
    pageObject: 'dfbLoadFormPage',
    method: 'clickCarrierAutoAcceptCheckbox',
    code: 'await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();',
    confidence: 0.85,
    category: 'DFB',
  },
  {
    pattern: /bid\s*history|bids\s*report/i,
    pageObject: 'viewLoadCarrierTabPage',
    method: 'clickViewLoadPageLinks',
    code: `try {
  const bidsReportValue = await pages.viewLoadCarrierTabPage.getBidsReportValue();
  await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks("Bid History");
  await commonReusables.waitForAllLoadStates(sharedPage);
  const bidDetails = await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
  console.log("Bid History details:", JSON.stringify(bidDetails));
  await pages.viewLoadCarrierTabPage.closeBidHistoryModal();
} catch (e) {
  console.log(\`Bid history check — could not complete: \${(e as Error).message}\`);
}`,
    confidence: 0.85,
    multiLine: true,
    category: 'DFB',
  },
  {
    pattern: /offer\s*rate/i,
    pageObject: 'dfbLoadFormPage',
    method: 'enterOfferRate',
    code: 'await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);',
    confidence: 0.85,
    category: 'DFB',
  },
  {
    pattern: /cargo\s*value/i,
    pageObject: 'nonTabularLoadPage',
    method: 'enterCargoValue',
    code: 'await pages.nonTabularLoadPage.enterCargoValue(String(testData.cargoValue));',
    confidence: 0.85,
    category: 'DFB',
  },

  // --- BILLING ---
  {
    pattern: /view\s*billing/i,
    pageObject: 'editLoadFormPage',
    method: 'clickOnViewBillingBtn',
    code: `await pages.editLoadPage.clickOnTab(TABS.LOAD);
await commonReusables.waitForAllLoadStates(sharedPage);
await pages.editLoadFormPage.clickOnViewBillingBtn();
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.85,
    multiLine: true,
    category: 'BILLING',
  },
  {
    pattern: /payable.*radio|select.*payable/i,
    pageObject: 'viewLoadPage',
    method: 'selectPayablesRadio',
    code: `await pages.viewLoadPage.selectPayablesRadio();`,
    confidence: 0.85,
    category: 'BILLING',
  },
  {
    pattern: /document\s*type.*carrier\s*invoice/i,
    pageObject: 'viewLoadPage',
    method: 'selectDocumentType',
    code: `await pages.viewLoadPage.selectDocumentType(DOCUMENT_TYPE.CARRIER_INVOICE);`,
    confidence: 0.85,
    category: 'BILLING',
  },
  {
    pattern: /document\s*type.*proof/i,
    pageObject: 'viewLoadPage',
    method: 'selectDocumentType',
    code: `await pages.viewLoadPage.selectDocumentType(DOCUMENT_TYPE.PROOF_OF_DELIVERY);`,
    confidence: 0.85,
    category: 'BILLING',
  },
  {
    pattern: /enter.*invoice\s*number/i,
    pageObject: 'viewLoadPage',
    method: 'fillCarrierInvoiceNumber',
    code: `const invoiceNumber = pages.commonReusables.generateRandomInvoiceNumber();
await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNumber);`,
    confidence: 0.85,
    multiLine: true,
    category: 'BILLING',
  },
  {
    pattern: /enter.*invoice\s*amount/i,
    pageObject: 'viewLoadPage',
    method: 'fillCarrierInvoiceAmount',
    code: `await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);`,
    confidence: 0.85,
    category: 'BILLING',
  },
  {
    pattern: /upload.*(?:carrier\s*invoice|invoice\s*document|invoice\s*file)/i,
    pageObject: 'viewLoadPage',
    method: 'uploadCarrierInvoiceDocument',
    code: 'await pages.viewLoadPage.uploadCarrierInvoiceDocument(testData);',
    confidence: 0.85,
    category: 'BILLING',
  },
  {
    pattern: /upload.*(?:pod|proof\s*of\s*delivery)/i,
    pageObject: 'viewLoadPage',
    method: 'uploadPODDocument',
    code: 'await pages.viewLoadPage.uploadPODDocument();',
    confidence: 0.85,
    category: 'BILLING',
  },
  {
    pattern: /(?:attach|browse).*(?:file|document|invoice)/i,
    pageObject: 'viewLoadPage',
    method: 'attachCarrierInvoiceFile',
    code: `await pages.viewLoadPage.attachCarrierInvoiceFile();`,
    confidence: 0.85,
    category: 'BILLING',
  },
  {
    pattern: /(?:attach|submit).*(?:click|accept)/i,
    pageObject: 'viewLoadPage',
    method: 'clickSubmitRemote',
    code: `await pages.viewLoadPage.clickSubmitRemote();
await pages.viewLoadPage.waitForUploadSuccess();`,
    confidence: 0.85,
    multiLine: true,
    category: 'BILLING',
  },
  {
    pattern: /close.*(?:dialog|upload|popup|modal)/i,
    pageObject: 'viewLoadPage',
    method: 'closeDocumentUploadDialogSafe',
    code: `await pages.viewLoadPage.closeDocumentUploadDialogSafe();`,
    confidence: 0.85,
    category: 'BILLING',
  },
  {
    pattern: /view\s*load.*(?:click|navigate|back)/i,
    pageObject: 'loadBillingPage',
    method: 'clickOnViewLoadBtn',
    code: `await pages.loadBillingPage.clickOnViewLoadBtn();
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.85,
    multiLine: true,
    category: 'BILLING',
  },
  {
    pattern: /add\s*new.*(?:invoice|carrier)/i,
    pageObject: 'loadBillingPage',
    method: 'clickAddNewCarrierInvoice',
    code: `await pages.loadBillingPage.clickAddNewCarrierInvoice();`,
    confidence: 0.85,
    category: 'BILLING',
  },
  {
    pattern: /view\s*history/i,
    pageObject: 'loadBillingPage',
    method: 'clickViewHistoryAndGetPopup',
    code: `const historyPopup = await pages.loadBillingPage.clickViewHistoryAndGetPopup();`,
    confidence: 0.85,
    category: 'BILLING',
  },

  // --- TAB (keyword style) ---
  {
    pattern: /tab.*load|load.*tab/i,
    pageObject: 'editLoadPage',
    method: 'clickOnTab',
    code: 'await pages.editLoadPage.clickOnTab(TABS.LOAD);',
    confidence: 0.9,
    category: 'TAB',
  },
  {
    pattern: /tab.*pick|pick.*tab/i,
    pageObject: 'editLoadPage',
    method: 'clickOnTab',
    code: 'await pages.editLoadPage.clickOnTab(TABS.PICK);',
    confidence: 0.9,
    category: 'TAB',
  },
  {
    pattern: /tab.*drop|drop.*tab/i,
    pageObject: 'editLoadPage',
    method: 'clickOnTab',
    code: 'await pages.editLoadPage.clickOnTab(TABS.DROP);',
    confidence: 0.9,
    category: 'TAB',
  },
  {
    pattern: /tab.*carrier|carrier.*tab/i,
    pageObject: 'editLoadPage',
    method: 'clickOnTab',
    code: 'await pages.editLoadPage.clickOnTab(TABS.CARRIER);',
    confidence: 0.9,
    category: 'TAB',
  },
  {
    pattern: /tab.*customer|customer.*tab/i,
    pageObject: 'editLoadPage',
    method: 'clickOnTab',
    code: 'await pages.editLoadPage.clickOnTab(TABS.CUSTOMER);',
    confidence: 0.9,
    category: 'TAB',
  },

  // --- SWITCH USER ---
  {
    pattern: /switch\s*user|change\s*user/i,
    pageObject: 'adminPage',
    method: 'switchUser',
    code: `await pages.adminPage.hoverAndClickAdminMenu();
await pages.adminPage.switchUser(testData.salesAgent);`,
    confidence: 0.95,
    multiLine: true,
    category: 'SWITCH_USER',
  },

  // --- REFRESH ---
  {
    pattern: /refresh.*status/i,
    pageObject: 'viewLoadPage',
    method: 'refreshAndValidateLoadStatus',
    code: 'await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.BOOKED);',
    confidence: 0.95,
    category: 'REFRESH',
  },
  {
    pattern: /\brefresh\b/i,
    pageObject: 'Page',
    method: 'reload',
    code: `await sharedPage.reload();
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.95,
    multiLine: true,
    category: 'REFRESH',
  },

  // --- WAIT ---
  {
    pattern: /\bwait\b/i,
    pageObject: 'commonReusables',
    method: 'waitForAllLoadStates',
    code: 'await commonReusables.waitForAllLoadStates(sharedPage);',
    confidence: 1,
    category: 'WAIT',
  },

  // --- TNX ---
  {
    pattern: /tnx.*organization/i,
    pageObject: 'tnxLandingPage',
    method: 'selectOrganization',
    code: `const tnxPages = await appManager.switchToTNX();
await commonReusables.waitForAllLoadStates(appManager.tnxPage);
await tnxPages.tnxLandingPage.selectOrganization(testData.customerName);`,
    confidence: 0.9,
    multiLine: true,
    category: 'TNX',
  },
  {
    pattern: /tnx.*active\s*jobs/i,
    pageObject: 'tnxLandingPage',
    method: 'clickActiveJobs',
    code: `const tnxPages = await appManager.switchToTNX();
await tnxPages.tnxLandingPage.clickActiveJobs();
await commonReusables.waitForAllLoadStates(appManager.tnxPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'TNX',
  },

  // --- PICK / DROP ---
  {
    pattern: /enter.*(?:details.*pick|pick.*details)/i,
    pageObject: 'editLoadPickTabPage',
    method: 'enterCompletePickTabDetails',
    code: 'await pages.editLoadPickTabPage.enterCompletePickTabDetails(testData);',
    confidence: 0.85,
    category: 'PICK_DROP',
  },
  {
    pattern: /enter.*(?:details.*drop|drop.*details)/i,
    pageObject: 'editLoadDropTabPage',
    method: 'enterCompleteDropTabDetails',
    code: 'await pages.editLoadDropTabPage.enterCompleteDropTabDetails(testData);',
    confidence: 0.85,
    category: 'PICK_DROP',
  },

  // --- POST AUTOMATION RULE ---
  {
    pattern: /post\s*automation.*new|create\s*new\s*entry/i,
    pageObject: 'postAutomationRulePage',
    method: 'clickElementByText',
    code: `await pages.postAutomationRulePage.clickElementByText(POST_AUTOMATION_RULE.NEW_BUTTON);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'POST_AUTOMATION',
  },
  {
    pattern: /post\s*automation.*(?:fill|enter|select)/i,
    pageObject: 'dfbHelpers',
    method: 'fillPostAutomationRuleForm',
    code: `await dfbHelpers.fillPostAutomationRuleForm(
  pages,
  {
    customer: testData.customerName,
    emailNotification: testData.saleAgentEmail,
    pickLocation: testData.shipperName,
    destination: testData.consigneeName,
    equipment: testData.equipmentType,
    loadType: testData.loadMethod,
    offerRate: testData.offerRate,
    commodity: testData.commodity,
  },
  true
);`,
    confidence: 0.9,
    multiLine: true,
    category: 'POST_AUTOMATION',
  },
  {
    pattern: /post\s*automation.*create\s*button/i,
    pageObject: 'postAutomationRulePage',
    method: 'clickElementByText',
    code: `await pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.9,
    multiLine: true,
    category: 'POST_AUTOMATION',
  },
  {
    pattern: /post\s*automation.*(?:verify|validate|check)/i,
    pageObject: 'postAutomationRulePage',
    method: 'verifySinglePostAutomationRow',
    code: `await pages.postAutomationRulePage.ruleInputSearch(testData.customerName);
await pages.postAutomationRulePage.verifySinglePostAutomationRow({
  customerName: testData.customerName,
  equipment: testData.equipmentType,
  method: testData.loadMethod,
  offerRate: testData.offerRate,
});`,
    confidence: 0.9,
    multiLine: true,
    category: 'POST_AUTOMATION',
  },
  {
    pattern: /post\s*automation.*delete/i,
    pageObject: 'postAutomationRulePage',
    method: 'selectAllRecordsAndDelete',
    code: `await pages.postAutomationRulePage.ruleInputSearch(testData.customerName);
await pages.postAutomationRulePage.selectAllRecordsAndDelete();`,
    confidence: 0.9,
    multiLine: true,
    category: 'POST_AUTOMATION',
  },
  {
    pattern: /post\s*automation.*search|post\s*automation.*find/i,
    pageObject: 'postAutomationRulePage',
    method: 'ruleInputSearch',
    code: 'await pages.postAutomationRulePage.ruleInputSearch(testData.customerName);',
    confidence: 0.9,
    category: 'POST_AUTOMATION',
  },

  // --- CARRIER SEARCH ---
  {
    pattern: /carrier.*search.*mc/i,
    pageObject: 'carrierSearchPage',
    method: 'mcNoInputOnCarrierPage',
    code: `await pages.carrierSearchPage.mcNoInputOnCarrierPage(testData.mcNumber);
await pages.carrierSearchPage.selectStatusOnCarrier(testData.carrierStatus || CARRIER_STATUS.ACTIVE);
await pages.carrierSearchPage.clickOnSearchButton();`,
    confidence: 0.85,
    multiLine: true,
    category: 'CARRIER_SEARCH',
  },
  {
    pattern: /carrier.*search.*dot/i,
    pageObject: 'carrierSearchPage',
    method: 'dotNoInputOnCarrierPage',
    code: `await pages.carrierSearchPage.dotNoInputOnCarrierPage(testData.dotNumber);
await pages.carrierSearchPage.selectStatusOnCarrier(testData.carrierStatus || CARRIER_STATUS.ACTIVE);
await pages.carrierSearchPage.clickOnSearchButton();`,
    confidence: 0.85,
    multiLine: true,
    category: 'CARRIER_SEARCH',
  },
  {
    pattern: /carrier.*search.*name/i,
    pageObject: 'carrierSearchPage',
    method: 'nameInputOnCarrierPage',
    code: `await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
await pages.carrierSearchPage.selectStatusOnCarrier(testData.carrierStatus || CARRIER_STATUS.ACTIVE);
await pages.carrierSearchPage.clickOnSearchButton();`,
    confidence: 0.85,
    multiLine: true,
    category: 'CARRIER_SEARCH',
  },
  {
    pattern: /carrier.*search.*id/i,
    pageObject: 'carrierSearchPage',
    method: 'carrierIDInputOnCarrierPage',
    code: `await pages.carrierSearchPage.carrierIDInputOnCarrierPage(testData.carrierID);
await pages.carrierSearchPage.selectStatusOnCarrier(testData.carrierStatus || CARRIER_STATUS.ACTIVE);
await pages.carrierSearchPage.clickOnSearchButton();`,
    confidence: 0.85,
    multiLine: true,
    category: 'CARRIER_SEARCH',
  },

  // --- EMAIL / EXPIRATION ---
  {
    pattern: /email.*notification.*(?:enter|value)/i,
    pageObject: 'editLoadCarrierTabPage',
    method: 'selectEmailNotificationAddress',
    code: 'await pages.editLoadCarrierTabPage.selectEmailNotificationAddress(testData.saleAgentEmail);',
    confidence: 0.9,
    category: 'EMAIL',
  },
  {
    pattern: /expiration\s*date/i,
    pageObject: 'editLoadFormPage',
    method: 'enterExpirationDate',
    code: `const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);
const formattedDate = \`\${(futureDate.getMonth() + 1).toString().padStart(2, "0")}/\${futureDate.getDate().toString().padStart(2, "0")}/\${futureDate.getFullYear()}\`;
await pages.editLoadFormPage.enterExpirationDate(formattedDate);`,
    confidence: 0.85,
    multiLine: true,
    category: 'EXPIRATION',
  },
  {
    pattern: /expiration\s*time/i,
    pageObject: 'editLoadFormPage',
    method: 'enterExpirationTime',
    code: 'await pages.editLoadFormPage.enterExpirationTime("18:00");',
    confidence: 0.85,
    category: 'EXPIRATION',
  },

  // --- NEGATIVE TEST ---
  {
    pattern: /do\s*not\s*select|should\s*not\s*select|don'?t\s*select/i,
    pageObject: 'n/a',
    method: 'comment',
    code: `// Negative test — intentional non-selection: skipped per test case.`,
    confidence: 0.95,
    multiLine: true,
    category: 'NEGATIVE',
  },

  // --- Extended coverage (ordering: specific → generic) ---
  {
    pattern: /post\s+to\s+tnx|tnx\s+post|post\s+load.*tnx/i,
    pageObject: 'dfbLoadFormPage',
    method: 'clickOnPostButton',
    code: 'await pages.dfbLoadFormPage.clickOnPostButton();',
    confidence: 0.88,
    category: 'DFB',
  },
  {
    pattern: /verify\s+in\s+tnx|check\s+tnx/i,
    pageObject: 'tnxLandingPage',
    method: 'verifyLoadExists',
    code: `await appManager.switchToTNX();
await pages.tnxLandingPage.searchLoad(loadNumber);
await pages.tnxLandingPage.verifyLoadExists(loadNumber);`,
    confidence: 0.88,
    multiLine: true,
    category: 'MULTI_APP',
  },
  {
    pattern: /verify\s+in\s+dme|check\s+dme/i,
    pageObject: 'dmeDashboardPage',
    method: 'verifyLoadExists',
    code: `await appManager.switchToDME();
await pages.dmeDashboardPage.searchLoad(loadNumber);
await pages.dmeDashboardPage.verifyLoadExists(loadNumber);`,
    confidence: 0.88,
    multiLine: true,
    category: 'MULTI_APP',
  },
  {
    pattern: /search\s+customer|find\s+customer/i,
    pageObject: 'searchCustomerPage',
    method: 'searchCustomerAndClickDetails',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);`,
    confidence: 0.88,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /setup\s+precondition|configure\s+office|office\s+settings/i,
    pageObject: 'dfbHelpers',
    method: 'setupDFBTestPreConditions',
    code: `await pages.dfbHelpers.setupDFBTestPreConditions(
  pages,
  testData.officeName,
  toggleSettings,
  ensureToggleValue,
  testData.salesAgent,
  testData.customerName
);`,
    confidence: 0.85,
    multiLine: true,
    category: 'SETUP',
  },
  {
    pattern: /billing\s+toggle|payable\s+toggle/i,
    pageObject: 'sharedPage',
    method: 'evaluate',
    code: `const billingIssuesSection = sharedPage.locator("#finance_issues_block");
await billingIssuesSection.scrollIntoViewIfNeeded();`,
    confidence: 0.8,
    multiLine: true,
    category: 'BILLING',
  },
  {
    pattern: /not\s+deliv|not\s+delivered\s+final|finance\s+issue/i,
    pageObject: 'sharedPage',
    method: 'evaluate',
    code: `const billingIssuesSection = sharedPage.locator("#finance_issues_block");
await billingIssuesSection.scrollIntoViewIfNeeded();`,
    confidence: 0.8,
    multiLine: true,
    category: 'BILLING',
  },
  {
    pattern: /save\s+invoice|save.*refresh/i,
    pageObject: 'editLoadFormPage',
    method: 'clickOnSaveBtn',
    code: `await pages.editLoadFormPage.clickOnSaveBtn();
await commonReusables.waitForAllLoadStates(sharedPage);
await sharedPage.reload();
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.85,
    multiLine: true,
    category: 'BILLING',
  },
  {
    pattern: /enter\s+amount|amount.*enter/i,
    pageObject: 'viewLoadPage',
    method: 'fillCarrierInvoiceAmount',
    code: `await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);`,
    confidence: 0.85,
    category: 'BILLING',
  },
  {
    pattern: /post\s+automation.*edit/i,
    pageObject: 'postAutomationRulePage',
    method: 'clickSelectSingleRecordAndEdit',
    code: `await pages.postAutomationRulePage.ruleInputSearch(testData.customerName);
await pages.postAutomationRulePage.clickSelectSingleRecordAndEdit();`,
    confidence: 0.88,
    multiLine: true,
    category: 'POST_AUTOMATION',
  },
  {
    pattern: /post\s*automation.*navigate|post\s*automation.*open|post\s*automation.*go\s*to/i,
    pageObject: 'postAutomationRulePage',
    method: 'verifyCustomerPostAutomationRule',
    code: `await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName);`,
    confidence: 0.88,
    multiLine: true,
    category: 'POST_AUTOMATION',
  },
  {
    pattern: /(?:receive|accept|process).*(?:edi\s*204|204).*(?:tender|load)/i,
    pageObject: 'edi204LoadTendersPage',
    method: 'acceptTender',
    code: 'await pages.edi204LoadTendersPage.acceptTender(testData.tenderID);',
    confidence: 0.75,
    category: 'EDI',
  },
  {
    pattern: /verify.*990|990\s+ack/i,
    pageObject: 'edi204LoadTendersPage',
    method: 'verify990Sent',
    code: 'await pages.edi204LoadTendersPage.verify990Sent();',
    confidence: 0.75,
    category: 'EDI',
  },
  {
    pattern: /bulk\s+change/i,
    pageObject: 'sharedPage',
    method: 'locator',
    code: `await sharedPage.locator("//form[contains(@id,'bulk') or contains(@class,'bulk')]").first().waitFor({ state: "visible", timeout: WAIT.LARGE });`,
    confidence: 0.75,
    category: 'BULK',
  },
  {
    pattern: /commission|audit\s+queue/i,
    pageObject: 'homePage',
    method: 'navigateToHeader',
    code: `await pages.homePage.navigateToHeader(HEADERS.FINANCE);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.8,
    multiLine: true,
    category: 'FINANCE',
  },
  {
    pattern: /create\s+(?:a\s+)?sales\s+lead|new\s+sales\s+lead/i,
    pageObject: 'newSalesLeadPage',
    method: 'createSalesLead',
    code: `await pages.newSalesLeadPage.createSalesLead({
  customerName: testData.customerName,
  officeName: testData.officeName,
});`,
    confidence: 0.8,
    multiLine: true,
    category: 'SALES_LEAD',
  },
  {
    pattern: /waterfall|carriers\s+data/i,
    pageObject: 'dfbHelpers',
    method: 'configureCarriersDataWithWaterfall',
    code: 'await pages.dfbHelpers.configureCarriersDataWithWaterfall(pages, carriersData);',
    confidence: 0.8,
    category: 'DFB',
  },
  {
    pattern: /select\s+carrier\s+by\s+name/i,
    pageObject: 'carrierSearchPage',
    method: 'selectCarrierByName',
    code: 'await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);',
    confidence: 0.85,
    category: 'CARRIER_SEARCH',
  },
  {
    pattern: /verify\s+carrier|carrier.*verify/i,
    pageObject: 'viewCarrierPage',
    method: 'verifyCarrierNameInDetails',
    code: `await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
await pages.viewCarrierPage.verifyCarrierNameInDetails(testData.carrierName);`,
    confidence: 0.82,
    multiLine: true,
    category: 'CARRIER_SEARCH',
  },
  {
    pattern: /click\s+(?:on\s+)?(?:the\s+)?(?:upload|document)/i,
    pageObject: 'viewLoadPage',
    method: 'openDocumentUploadDialog',
    code: `await pages.viewLoadPage.openDocumentUploadDialog();`,
    confidence: 0.82,
    category: 'BILLING',
  },
  {
    pattern: /submit.*alert|submit.*dialog|accept.*submit/i,
    pageObject: 'viewLoadPage',
    method: 'clickSubmitRemote',
    code: `await pages.viewLoadPage.clickSubmitRemote();
await pages.viewLoadPage.waitForUploadSuccess();`,
    confidence: 0.82,
    multiLine: true,
    category: 'BILLING',
  },
  {
    pattern: /invoice\s+#.*enter|invoice\s+num.*enter/i,
    pageObject: 'viewLoadPage',
    method: 'fillCarrierInvoiceNumber',
    code: `const invoiceNumber = pages.commonReusables.generateRandomInvoiceNumber();
await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNumber);`,
    confidence: 0.85,
    multiLine: true,
    category: 'BILLING',
  },
  {
    pattern: /radio\s+button/i,
    pageObject: 'viewLoadPage',
    method: 'selectPayablesRadio',
    code: `await pages.viewLoadPage.selectPayablesRadio();`,
    confidence: 0.78,
    category: 'BILLING',
  },
  {
    pattern: /document\s*type/i,
    pageObject: 'viewLoadPage',
    method: 'selectDocumentType',
    code: `await pages.viewLoadPage.selectDocumentType(DOCUMENT_TYPE.CARRIER_INVOICE);`,
    confidence: 0.78,
    category: 'BILLING',
  },
  {
    pattern: /upload.*document|upload.*file/i,
    pageObject: 'viewLoadPage',
    method: 'attachCarrierInvoiceFile',
    code: `await pages.viewLoadPage.attachCarrierInvoiceFile();`,
    confidence: 0.78,
    category: 'BILLING',
  },
  {
    pattern: /enter\s+new\s+load|new\s+load\s+form/i,
    pageObject: 'loadsPage',
    method: 'clickNewLoadDropdown',
    code: `await pages.loadsPage.clickNewLoadDropdown();
await pages.loadsPage.selectNonTabularTL();`,
    confidence: 0.8,
    multiLine: true,
    category: 'LOAD_FORM',
  },
  {
    pattern: /click\s+home|open\s+home/i,
    pageObject: 'basePage',
    method: 'clickHomeButton',
    code: 'await pages.basePage.clickHomeButton();',
    confidence: 0.85,
    category: 'NAVIGATION',
  },
  {
    pattern: /agent\s+search/i,
    pageObject: 'basePage',
    method: 'navigateAgentSearch',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);`,
    confidence: 0.85,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /sales\s+lead/i,
    pageObject: 'basePage',
    method: 'navigateSalesLeads',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.AGENT);
await pages.basePage.clickSubHeaderByText("My Sales Leads");`,
    confidence: 0.82,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /office\s+config|office\s+configuration/i,
    pageObject: 'basePage',
    method: 'clickHeaderAndSubMenu',
    code: `await pages.basePage.clickHeaderAndSubMenu(HEADERS.HOME, ADMIN_SUB_MENU.OFFICE_CONFIG);`,
    confidence: 0.85,
    category: 'NAVIGATION',
  },
  {
    pattern: /go\s+to\s+carriers|navigate\s+to\s+carriers/i,
    pageObject: 'basePage',
    method: 'hoverCarrier',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);`,
    confidence: 0.85,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /go\s+to\s+customers|navigate\s+to\s+customers/i,
    pageObject: 'basePage',
    method: 'hoverCustomer',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);`,
    confidence: 0.85,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /go\s+to\s+loads|navigate\s+to\s+loads|open\s+loads/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.85,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /validate\s+post\s+status.*not\s+posted|not\s+posted/i,
    pageObject: 'dfbLoadFormPage',
    method: 'validatePostStatus',
    code: 'await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.NOT_POSTED);',
    confidence: 0.88,
    category: 'DFB',
  },
  {
    pattern: /dme.*carrier.*toggle|carrier.*dme.*toggle/i,
    pageObject: 'MultiAppManager',
    method: 'switchToDME',
    code: `await appManager.switchToDME();
const dmePages = appManager.dmePageManager!;
await commonReusables.waitForAllLoadStates(appManager.dmePage);
await dmePages.basePage.hoverOverHeaderByText("Carriers");
await appManager.dmePage!.keyboard.press("Enter");
await appManager.switchToBTMS();
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.75,
    multiLine: true,
    category: 'MULTI_APP',
  },
  {
    pattern: /carrier\s+contact.*rate\s+confirmation/i,
    pageObject: 'dfbLoadFormPage',
    method: 'selectCarreirContactForRateConfirmation',
    code: `const contactDropdown = sharedPage.locator("#form_accept_as_user");
await contactDropdown.waitFor({ state: "attached", timeout: WAIT.LARGE });
const contactOptions = await contactDropdown.locator("option").allTextContents();
const matchedContact = contactOptions.find(
  (opt: string) => opt.toLowerCase().includes(testData.saleAgentEmail.toLowerCase())
);
expect(matchedContact).toBeTruthy();
await pages.dfbLoadFormPage.selectCarreirContactForRateConfirmation(matchedContact!.trim());`,
    confidence: 0.8,
    multiLine: true,
    category: 'DFB',
  },
  {
    pattern: /match.*rule|matching.*automation/i,
    pageObject: 'loadsPage',
    method: 'createNonTabularLoad',
    code: `await pages.loadsPage.clickNewLoadDropdown();
await pages.loadsPage.selectNonTabularTL();
await pages.nonTabularLoadPage.createNonTabularLoad({
  shipperValue: testData.shipperName,
  consigneeValue: testData.consigneeName,
  equipmentType: testData.equipmentType,
});
await pages.editLoadFormPage.clickOnSaveBtn();
loadNumber = await pages.dfbLoadFormPage.getLoadNumber();`,
    confidence: 0.8,
    multiLine: true,
    category: 'LOAD_FORM',
  },
  {
    pattern: /reports|open\s+reports|navigate.*reports/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.REPORTS);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.78,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /admin\s+tools|system\s+config/i,
    pageObject: 'basePage',
    method: 'hoverAdminSubMenu',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.ADMIN_TOOLS);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.78,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /finance.*payables|navigate.*payables/i,
    pageObject: 'homePage',
    method: 'navigateToHeader',
    code: `await pages.homePage.navigateToHeader(HEADERS.FINANCE);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.78,
    multiLine: true,
    category: 'FINANCE',
  },
  {
    pattern: /all\s+loads|loads\s+search|open\s+all\s+loads/i,
    pageObject: 'loadsPage',
    method: 'navigate',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.78,
    multiLine: true,
    category: 'NAVIGATION',
  },
  {
    pattern: /logout|log\s*out|sign\s*out/i,
    pageObject: 'btmsLoginPage',
    method: 'logout',
    code: 'await commonReusables.waitForAllLoadStates(sharedPage);',
    confidence: 0.65,
    category: 'LOGIN',
  },
  {
    pattern: /copy\s+load|duplicate\s+load/i,
    pageObject: 'editLoadFormPage',
    method: 'clickOnSaveBtn',
    code: 'await commonReusables.waitForAllLoadStates(sharedPage);',
    confidence: 0.65,
    category: 'LOAD_FORM',
  },
  {
    pattern: /book\s+load|dispatch\s+load|assign\s+carrier/i,
    pageObject: 'viewLoadPage',
    method: 'refreshAndValidateLoadStatus',
    code: 'await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.DISPATCHED);',
    confidence: 0.7,
    category: 'LOAD_FORM',
  },
  {
    pattern: /cancel\s+load|void\s+load/i,
    pageObject: 'editLoadFormPage',
    method: 'clickOnSaveBtn',
    code: 'await commonReusables.waitForAllLoadStates(sharedPage);',
    confidence: 0.65,
    category: 'LOAD_FORM',
  },
  {
    pattern: /edi\s+queue|open\s+edi/i,
    pageObject: 'basePage',
    method: 'hoverOverHeaderByText',
    code: `await pages.basePage.navigateToBaseUrl();
await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.72,
    multiLine: true,
    category: 'EDI',
  },
  {
    pattern: /tnx\s+login|switch.*tnx\s+login/i,
    pageObject: 'tnxLoginPage',
    method: 'TNXLogin',
    code: 'await pages.tnxLoginPage.TNXLogin(userSetup.tnxUser);',
    confidence: 0.9,
    category: 'LOGIN',
  },
  {
    pattern: /dme\s+login/i,
    pageObject: 'dmeLoginPage',
    method: 'DMELogin',
    code: 'await pages.dmeLoginPage.DMELogin(userSetup.dmeUser);',
    confidence: 0.9,
    category: 'LOGIN',
  },
  {
    pattern: /accept\s+terms/i,
    pageObject: 'btmsAcceptTermPage',
    method: 'acceptTermsAndConditions',
    code: `if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
  await pages.btmsAcceptTermPage.acceptTermsAndConditions();
}`,
    confidence: 0.95,
    multiLine: true,
    category: 'LOGIN',
  },
  {
    pattern: /scroll\s+to\s+dfb|dfb\s+section/i,
    pageObject: 'viewLoadPage',
    method: 'scrollToDFBSection',
    code: 'await pages.viewLoadPage.scrollToDFBSection();',
    confidence: 0.8,
    category: 'DFB',
  },
  {
    pattern: /verify\s+cargo|validate\s+cargo/i,
    pageObject: 'dfbLoadFormPage',
    method: 'getCargoValue',
    code: `const displayedCargoValue = await pages.dfbLoadFormPage.getCargoValue();
expect(displayedCargoValue).toBeTruthy();`,
    confidence: 0.8,
    multiLine: true,
    category: 'DFB',
  },
  {
    pattern: /exclude\s+carrier|exclude\s+carriers/i,
    pageObject: 'dfbLoadFormPage',
    method: 'excludeCarriers',
    code: 'await commonReusables.waitForAllLoadStates(sharedPage);',
    confidence: 0.65,
    category: 'DFB',
  },
  {
    pattern: /enter\s+commodity|shipment\s+commodity\s+(?:qty|quantity|weight)/i,
    pageObject: 'nonTabularLoadPage',
    method: 'createNonTabularLoad',
    code: 'await commonReusables.waitForAllLoadStates(sharedPage);',
    confidence: 0.62,
    category: 'LOAD_FORM',
  },
  {
    pattern: /select\s+equipment\s+type|equipment\s+type\s+dropdown/i,
    pageObject: 'nonTabularLoadPage',
    method: 'createNonTabularLoad',
    code: 'await commonReusables.waitForAllLoadStates(sharedPage);',
    confidence: 0.62,
    category: 'LOAD_FORM',
  },
  {
    pattern: /observe|review\s+page|view\s+page/i,
    pageObject: 'commonReusables',
    method: 'waitForAllLoadStates',
    code: 'await commonReusables.waitForAllLoadStates(sharedPage);',
    confidence: 0.7,
    category: 'MISC',
  },
  {
    pattern: /unhide|show\s+column|toggle\s+column/i,
    pageObject: 'commonReusables',
    method: 'waitForAllLoadStates',
    code: 'await commonReusables.waitForAllLoadStates(sharedPage);',
    confidence: 0.7,
    category: 'MISC',
  },
  {
    pattern: /verify\s+load\s+created|load\s+created/i,
    pageObject: 'viewLoadPage',
    method: 'verifyLoadNumber',
    code: `expect(loadNumber).toBeTruthy();
await pages.viewLoadPage.verifyLoadNumber(loadNumber);`,
    confidence: 0.85,
    multiLine: true,
    category: 'LOAD_FORM',
  },
  {
    pattern: /enter\s+value\s+into|fill\s+field/i,
    pageObject: 'sharedPage',
    method: 'locator',
    code: `await commonReusables.waitForAllLoadStates(sharedPage);`,
    confidence: 0.65,
    category: 'GENERIC',
  },
];
