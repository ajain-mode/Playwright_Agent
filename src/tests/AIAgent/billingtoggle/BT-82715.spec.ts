import { BrowserContext, expect, Page, test } from "@playwright/test";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import type { AgentAuthRolesExpectation } from "@pages/admin/agent/AgentInfoPage";
import commonReusables from "@utils/commonReusables";

const testcaseID = "BT-82715";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

type PayablesToggleScenario = {
  label: string;
  agentSearchName: string;
  switchUserName: string;
  authExpectation: AgentAuthRolesExpectation;
  customerName: string;
  shipperName: string;
  /** Required when shipper is not in the customer ship-point dropdown (manual entry). */
  shipperAddress?: string;
  shipperCity?: string;
  shipperState?: string;
  shipperZip?: string;
  consigneeName: string;
  expectedSalesperson: string;
};

const MANAGER_SCENARIO: PayablesToggleScenario = {
  label: "Manager (FRISCO TL)",
  agentSearchName: "FRISCO TL",
  switchUserName: testData.salesAgent,
  authExpectation: {
    authLevel: AGENT_AUTH_LEVEL.MANAGER,
    requiredRoles: [AGENT_USER_ROLES.BTMS_USER, AGENT_USER_ROLES.PRINCIPAL],
    forbiddenRoles: [AGENT_USER_ROLES.ADMIN, AGENT_USER_ROLES.SYSTEM_ADMIN],
  },
  customerName: testData.customerName,
  shipperName: testData.shipperName,
  consigneeName: testData.consigneeName,
  expectedSalesperson: testData.salesAgent,
};

const SALES_SCENARIO: PayablesToggleScenario = {
  label: "Sales Agent (COMMERCIAL SALES HOUSE)",
  agentSearchName: "COMMERCIAL SALES HOUSE (SALES)",
  switchUserName: "COMMERCIAL SALES HOUSE (SALES)",
  authExpectation: {
    authLevel: AGENT_AUTH_LEVEL.SALES,
    requiredRoles: [
      AGENT_USER_ROLES.BTMS_USER,
      AGENT_USER_ROLES.PRINCIPAL,
      AGENT_USER_ROLES.PAYABLES_MANAGER,
    ],
    forbiddenRoles: [AGENT_USER_ROLES.ADMIN, AGENT_USER_ROLES.SYSTEM_ADMIN],
  },
  customerName: "CRESCENT SPECIALTY FOODS INC",
  shipperName: "BLB VERGINIA LLC",
  shipperAddress: "8422 WELLINGTON RD",
  shipperCity: "MANASSAS",
  shipperState: "VA",
  shipperZip: "20109",
  consigneeName: "|CRESCENT SPECIALTY FOODS|EVERETT|WA",
  expectedSalesperson: "COMMERCIAL SALES HOUSE (SALES)",
};

function registerPayablesToggleScenario(
  describeTitle: string,
  scenario: PayablesToggleScenario,
  testTitle: string,
): void {
  test.describe.configure({ retries: 1 });
  test.describe.serial(describeTitle, () => {
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
      if (appManager) await appManager.closeAllSecondaryPages();
      if (sharedContext) await sharedContext.close();
    });

    test(testTitle, { tag: "@AIAgent,@aiteam,@billingtoggle,@payabletoggle" }, async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);
      await runPayablesToggleScenario(pages, sharedPage, scenario);
    });
  });
}

registerPayablesToggleScenario(
  "Case ID: BT-82715 — Scenario 1: Manager user (FRISCO TL)",
  MANAGER_SCENARIO,
  "Case Id: BT-82715 — Test Scenario 1: Manager user payables toggle (FRISCO TL)",
);

registerPayablesToggleScenario(
  "Case ID: BT-82715 — Scenario 2: Sales Agent (COMMERCIAL SALES HOUSE)",
  SALES_SCENARIO,
  "Case Id: BT-82715 — Test Scenario 2: Sales Agent payables toggle (COMMERCIAL SALES HOUSE)",
);
async function runPayablesToggleScenario(
  pages: PageManager,
  sharedPage: Page,
  scenario: PayablesToggleScenario,
): Promise<void> {
  await test.step(`[82715 1-5] Login BTMS — ${scenario.label}`, async () => {
    await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
    await commonReusables.waitForAllLoadStates(sharedPage);
  });

  await test.step(`[82715 6-16] Agent Search — ensure auth/roles — ${scenario.label}`, async () => {
    await pages.basePage.navigateToBaseUrl();
    await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
    await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
    await pages.agentSearchPage.nameInputOnAgentPage(scenario.agentSearchName);
    await pages.agentSearchPage.clickOnSearchButton();
    await pages.agentSearchPage.selectAgentByName(scenario.agentSearchName);
    await commonReusables.waitForPageStable(sharedPage);

    await pages.agentInfoPage.ensureAgentAuthAndRoles(
      pages.agentEditPage,
      scenario.authExpectation,
      { pages, loginUser: userSetup.globalUser },
    );
    await pages.agentInfoPage.validateAuthLevel(scenario.authExpectation.authLevel);
    await pages.agentInfoPage.validateDisplayedUserRoles({
      requiredRoles: scenario.authExpectation.requiredRoles,
      forbiddenRoles: scenario.authExpectation.forbiddenRoles,
    });
  });

  await test.step(`[82715 17-23] Switch user + Post Automation cleanup — ${scenario.label}`, async () => {
    await pages.adminPage.hoverAndClickAdminMenu();
    await pages.adminPage.switchUser(scenario.switchUserName);
    await commonReusables.waitForAllLoadStates(sharedPage);

    await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
    await pages.postAutomationRulePage.verifyCustomerPostAutomationRuleWhenButtonMayBeDisabled(
      scenario.customerName,
    );
  });

  await test.step(`[82715 24-54] Customer + Enter New Load + Create — ${scenario.label}`, async () => {
    await pages.basePage.navigateToBaseUrl();
    await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
    await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
    await pages.searchCustomerPage.enterCustomerName(scenario.customerName);
    await pages.searchCustomerPage.selectActiveOnCustomerPage();
    await pages.searchCustomerPage.clickOnSearchCustomer();
    await pages.searchCustomerPage.clickOnActiveCustomer();
    await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);

    await pages.nonTabularLoadPage.selectCustomerViaSelect2(scenario.customerName);
    const agentSelection = await pages.nonTabularLoadPage.ensureEnterNewLoadSalespersonDispatcherSelection();
    pages.logger.info(
      `Salesperson/Dispatcher after ensure: ${agentSelection.salespersonFinal} / ${agentSelection.dispatcherFinal}`,
    );
    expect(
      agentSelection.salespersonFinal.toUpperCase(),
      `Expected [82715 31]: Salesperson includes ${scenario.expectedSalesperson}`,
    ).toContain(scenario.expectedSalesperson.toUpperCase().split("(")[0].trim());

    await pages.nonTabularLoadPage.createNonTabularLoad({
      shipperValue: scenario.shipperName,
      shipperAddress: scenario.shipperAddress,
      shipperCity: scenario.shipperCity,
      shipperState: scenario.shipperState,
      shipperZip: scenario.shipperZip,
      consigneeValue: scenario.consigneeName,
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
    });

    await pages.editLoadFormPage.selectMileageEngine(
      testData.mileageEngine || MILEAGE_ENGINE.CURRENT,
    );
    await pages.editLoadFormPage.selectMileageMethod(testData.Method || MILEAGE_METHOD.PRACTICAL);

    const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
    expect(linehaulDefault?.toLowerCase(), "Expected [82715 53]: Linehaul default Flat Rate").toContain(
      RATE_TYPE.FLAT.toLowerCase(),
    );
    const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
    expect(
      fuelSurchargeDefault?.toLowerCase(),
      "Expected [82715 53]: Fuel Surcharge default Flat Rate",
    ).toContain(RATE_TYPE.FLAT.toLowerCase());

    await pages.nonTabularLoadPage.clickCreateLoadButton();
    await pages.editLoadLoadTabPage.ensureRateTypeSelected(testData.rateType);
  });

  await test.step(`[82715 56-58] Carrier tab offer rate + Save — ${scenario.label}`, async () => {
    await pages.editLoadPage.clickOnTab(TABS.CARRIER);
    await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_NAME.CARRIER_4);
    await sharedPage.keyboard.press("Escape");
    await commonReusables.waitForPageStable(sharedPage);
    await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
    await pages.editLoadCarrierTabPage.enterCustomerRate(testData.offerRate);
    await pages.editLoadCarrierTabPage.enterCarrierRate(testData.offerRate);
    await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
    await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
    const bookedAlert = pages.commonReusables.validateAlert(
      sharedPage,
      ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED,
    );
    await pages.editLoadFormPage.clickOnSaveBtn();
    await bookedAlert;
    await pages.viewLoadPage.validateViewLoadHeading();
  });

  await test.step(`[82715 59 + Expected 60] View Billing — move Payables toggle to Payables — ${scenario.label}`, async () => {
    await pages.viewLoadPage.clickViewBillingButton();
    await pages.loadBillingPage.scrollPayablesToggleIntoView();
    await pages.loadBillingPage.setAndAssertPayablesToggle(PAYABLES_TOGGLE_VALUE.PAYABLES);
    const payablesToggle = await pages.loadBillingPage.getPayableToggleValue();
    expect(payablesToggle, "Expected after 60: Payables toggle set to Payables").toBe(
      PAYABLES_TOGGLE_VALUE.PAYABLES,
    );
  });

  await test.step(`[82715 61 + Expected] Refresh — move Payables toggle to Agent — ${scenario.label}`, async () => {
    await pages.loadBillingPage.reloadBillingPageAndWaitForPayablesToggle();
    await pages.loadBillingPage.setAndAssertPayablesToggle(PAYABLES_TOGGLE_VALUE.AGENT);
    const payablesToggle = await pages.loadBillingPage.getPayableToggleValue();
    expect(payablesToggle, "Expected after 61: Payables toggle set to Agent").toBe(
      PAYABLES_TOGGLE_VALUE.AGENT,
    );
  });

  await test.step(`[82715 62 + Expected] Refresh — Neutral must NOT apply — ${scenario.label}`, async () => {
    await pages.loadBillingPage.reloadBillingPageAndWaitForPayablesToggle();
    try {
      await pages.loadBillingPage.setPayablesToggle(PAYABLES_TOGGLE_VALUE.NEUTRAL);
    } catch {
      pages.logger.info("Neutral payables toggle move blocked or did not apply (expected)");
    }
    const payablesToggle = await pages.loadBillingPage.getPayableToggleValue();
    expect(payablesToggle, "Expected after 62: Payables toggle must NOT be Neutral").not.toBe(
      PAYABLES_TOGGLE_VALUE.NEUTRAL,
    );
    expect(
      [PAYABLES_TOGGLE_VALUE.PAYABLES, PAYABLES_TOGGLE_VALUE.AGENT],
      "Expected after 62: toggle remains Payables or Agent",
    ).toContain(payablesToggle);
  });
}
