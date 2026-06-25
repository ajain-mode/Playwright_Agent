import { BrowserContext, expect, Page, test } from "@playwright/test";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";
import {
  agentDisplayNameFragment,
  BillingToggleConstants,
  buildManagerPayablesToggleScenario,
  buildNonTabularLoadFieldsFromScenario,
  buildSalesPayablesToggleScenario,
  type PayablesToggleScenario,
} from "@utils/billingToggleUtils/billingToggleConstants";

const testcaseID = "BT-82715";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

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

    test(testTitle, { tag: "@AIAgent,@aiteam,@at_billingtoggle,@payabletoggle" }, async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);
      await runPayablesToggleScenario(pages, sharedPage, scenario);
    });
  });
}

registerPayablesToggleScenario(
  `Case ID: ${testcaseID} — Scenario 1: Manager user (FRISCO TL)`,
  buildManagerPayablesToggleScenario(testData),
  `Case Id: ${testcaseID} — Test Scenario 1: Manager user payables toggle (FRISCO TL)`,
);

registerPayablesToggleScenario(
  `Case ID: ${testcaseID} — Scenario 2: Sales Agent (COMMERCIAL SALES HOUSE)`,
  buildSalesPayablesToggleScenario(),
  `Case Id: ${testcaseID} — Test Scenario 2: Sales Agent payables toggle (COMMERCIAL SALES HOUSE)`,
);

async function runPayablesToggleScenario(
  pages: PageManager,
  sharedPage: Page,
  scenario: PayablesToggleScenario,
): Promise<void> {
  await test.step("Step 1 [82715 1-5]: Login BTMS", async () => {
    await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
    await commonReusables.waitForAllLoadStates(sharedPage);
  });

  await test.step("Step 2 [82715 6-16]: Agent Search — ensure MANAGER/SALES auth and roles", async () => {
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

  await test.step("Step 3 [82715 17-19]: Admin — switch user", async () => {
    await pages.adminPage.hoverAndClickAdminMenu();
    await pages.adminPage.switchUser(scenario.switchUserName);
    await commonReusables.waitForAllLoadStates(sharedPage);
  });

  await test.step("Step 4 [82715 20-23]: HOME — Post Automation rule cleanup for customer", async () => {
    await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
    await pages.postAutomationRulePage.verifyCustomerPostAutomationRuleWhenButtonMayBeDisabled(
      scenario.customerName,
    );
  });

  await test.step("Step 5 [82715 24-28]: Customer search — CREATE TL *NEW*", async () => {
    await pages.basePage.navigateToBaseUrl();
    await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
    await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
    await pages.searchCustomerPage.enterCustomerName(scenario.customerName);
    await pages.searchCustomerPage.selectActiveOnCustomerPage();
    await pages.searchCustomerPage.clickOnSearchCustomer();
    await pages.searchCustomerPage.clickOnActiveCustomer();
    await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
  });

  await test.step("Step 6 [82715 29-54]: Enter New Load — customer, shipper, consignee, commodity", async () => {
    await pages.nonTabularLoadPage.selectCustomerViaSelect2(scenario.customerName);
    const agentSelection = await pages.nonTabularLoadPage.ensureEnterNewLoadSalespersonDispatcherSelection();
    pages.logger.info(
      `Salesperson/Dispatcher after ensure: ${agentSelection.salespersonFinal} / ${agentSelection.dispatcherFinal}`,
    );

    const salespersonFragment = agentDisplayNameFragment(scenario.expectedSalesperson);
    expect(
      agentSelection.salespersonFinal.toUpperCase(),
      `Expected [82715 31]: Salesperson includes ${scenario.expectedSalesperson}`,
    ).toContain(salespersonFragment);
    expect(
      agentSelection.dispatcherFinal.toUpperCase(),
      `Expected [82715 32]: Dispatcher includes ${scenario.expectedDispatcher}`,
    ).toContain(agentDisplayNameFragment(scenario.expectedDispatcher));

    await pages.nonTabularLoadPage.createNonTabularLoad(
      buildNonTabularLoadFieldsFromScenario(testData, scenario),
    );

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
  });

  await test.step("Step 7 [82715 55]: Load tab — ensure Rate Type SPOT", async () => {
    await pages.editLoadLoadTabPage.ensureRateTypeSelected(testData.rateType);
  });

  await test.step("Step 8 [82715 56-58]: Carrier tab — offer rate, Save to BOOKED", async () => {
    await pages.editLoadPage.clickOnTab(TABS.CARRIER);
    await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_NAME.CARRIER_4);
    await pages.editLoadCarrierTabPage.dismissCarrierSelectOverlay();
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

  await test.step("Step 9 [82715 59]: View Load — click View Billing", async () => {
    await pages.viewLoadPage.clickViewBillingButton();
    await pages.loadBillingPage.scrollPayablesToggleIntoView();
  });

  await test.step("Step 10 [82715 60 + Expected]: Payables toggle — move to Payables", async () => {
    await pages.loadBillingPage.setAndAssertPayablesToggle(PAYABLES_TOGGLE_VALUE.PAYABLES);
  });

  await test.step("Step 11 [82715 61 + Expected]: Refresh — move Payables toggle to Agent", async () => {
    await pages.loadBillingPage.reloadBillingPageAndWaitForPayablesToggle();
    await pages.loadBillingPage.setAndAssertPayablesToggle(PAYABLES_TOGGLE_VALUE.AGENT);
  });

  await test.step("Step 12 [82715 62 + Expected]: Refresh — Neutral must NOT apply", async () => {
    await pages.loadBillingPage.assertPayablesToggleNeutralBlocked(
      BillingToggleConstants.PAYABLES_TOGGLE.NEUTRAL_BLOCKED_ALLOWED_VALUES,
    );
  });
}
