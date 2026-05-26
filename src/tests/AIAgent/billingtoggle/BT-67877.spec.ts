import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commonReusables from "@utils/commonReusables";

/**
 * Test Case: BT-67877 — Admin + system admin billing-toggle user; agent roles; load to BOOKED;
 * DELIVERED FINAL; View Billing; observe Billing Issues toggle.
 * @author AI Agent
 * @date 2026-04-30
 * @category billingtoggle
 */
const testcaseID = "BT-67877";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-67877 - Validating the scenario when the user is an admin user w/ system admin role, and the billing toggle is set to any state ...",
  () => {
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

    test(
      "Case Id: BT-67877 - Validating the scenario when the user is an admin user w/ system admin role, and the billing toggle is set to any state ...",
      { tag: "@aiagent,@at_billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [CSV 1]: Login and switch to BILLINGTOGGLE_USER", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 2: Admin > Agent Search, search BILLINGTOGGLE.USER, open agent row", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
          await commonReusables.waitForAllLoadStates(sharedPage);
          await pages.agentSearchPage.nameInputOnAgentPage(USER_ROLES.BILLINGTOGGLE_USER);
          await pages.agentSearchPage.clickOnSearchButton();
          await pages.agentSearchPage.selectAgentForBillingToggle(USER_ROLES.BILLINGTOGGLE_USER);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 3: USER ROLES — hard assert ADMIN and SYSTEM_ADMIN", async () => {
          const rolesText = (await pages.agentInfoPage.getDisplayedUserRolesText()).toUpperCase();
          pages.logger.info(`Agent USER ROLES text: ${rolesText}`);
          expect(
            rolesText,
            "Agent should have ADMIN role in USER ROLES section"
          ).toContain(AGENT_USER_ROLES.ADMIN);
          expect(
            rolesText,
            "Agent should have SYSTEM_ADMIN role in USER ROLES section"
          ).toContain(AGENT_USER_ROLES.SYSTEM_ADMIN);
        });

        await test.step("Step 4: Customers > Search, ADVANCED COMPOSITES, open customer, CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 5: Select customer on Enter New Load", async () => {
          const customerName = testData["Customer Value"];
          await pages.nonTabularLoadPage.selectCustomerViaSelect2(customerName);
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("CSV step 12: Salesperson / Dispatcher — fill from UI default or first dropdown (soft)", async () => {
          const csv12 = await pages.nonTabularLoadPage.ensureEnterNewLoadSalespersonDispatcherSelection();
          pages.logger.info(
            `CSV12 => spAutoSelected=${csv12.salespersonAutoSelected}, dpAutoSelected=${csv12.dispatcherAutoSelected}, ` +
            `Salesperson="${csv12.salespersonFinal}", Dispatcher="${csv12.dispatcherFinal}"`
          );

          expect.soft(
            csv12.salespersonFinal.length,
            "[Soft CSV 12] Salesperson should have a value (preselected or auto-selected)"
          ).toBeGreaterThan(0);
          expect.soft(
            csv12.dispatcherFinal.length,
            "[Soft CSV 12] Dispatcher should have a value (preselected or auto-selected)"
          ).toBeGreaterThan(0);
        });

        await test.step("Step 6: Fill shipper, consignee, dates, times, commodity, equipment", async () => {
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
            shipperCountry: testData.shipperCountry,
            shipperZip: testData.shipperZip,
            shipperAddress: testData.shipperAddress,
            shipperNameNew: testData.shipperNameNew,
            shipperCity: testData.shipperCity,
            shipperState: testData.shipperState,
            consigneeCountry: testData.consigneeCountry,
            consigneeZip: testData.consigneeZip,
            consigneeAddress: testData.consigneeAddress,
            consigneeCity: testData.consigneeCity,
            consigneeState: testData.consigneeState,
          });
        });

        await test.step("Step 7: Mileage Engine, Method, LH rate", async () => {
          await pages.editLoadFormPage.selectMileageEngine(testData.mileageEngine);
          await pages.editLoadFormPage.selectMileageMethod(testData.Method);
          await pages.editLoadFormPage.enterLinehaulRate(testData.linehaulRate);
        });

        await test.step("Step 8: Verify Linehaul and Fuel Surcharge default to Flat Rate (CSV 34)", async () => {
          const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
          pages.logger.info(`Linehaul default: ${linehaulDefault}`);
          expect.soft(linehaulDefault?.toLowerCase(), "Linehaul should default to Flat Rate").toContain(
            RATE_TYPE.FLAT.toLowerCase()
          );
          const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
          pages.logger.info(`Fuel Surcharge default: ${fuelSurchargeDefault}`);
          expect.soft(
            fuelSurchargeDefault?.toLowerCase(),
            "Fuel Surcharge should default to Flat Rate"
          ).toContain(RATE_TYPE.FLAT.toLowerCase());
        });

        await test.step("Step 9: Create Load, rate type SPOT if shown", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkRateTypeIfPresent(testData.rateType, pages.editLoadFormPage);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);
        });

        await test.step("Step 10: Carrier tab — offer, customer, carrier rates, trailer, expiration, email, miles, carrier", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
          await pages.editLoadFormPage.enterFutureExpirationDateAndTime(7, "18:00");
          await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(testData.saleAgentEmail);
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
          await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_NAME.CARRIER_XPO_TRANS);
          pages.logger.info(`Carrier: ${CARRIER_NAME.CARRIER_XPO_TRANS}`);
        });

        await test.step("Step 11: Save — status BOOKED", async () => {
          const alertPromise = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          await alertPromise;
        });

        await test.step("Step 12: Edit, set status DELIVERED FINAL, save and accept confirmation (CSV 48)", async () => {
          await pages.viewLoadPage.clickEditButton();
          await pages.editLoadFormPage.selectLoadStatus(LOAD_STATUS.DELIVERED_FINAL);

          const capturedDialogs = await pages.commonReusables.acceptAllDialogsDuringAction(
            sharedPage,
            () => pages.editLoadFormPage.clickOnSaveBtn(),
            WAIT.DEFAULT
          );
          pages.logger.info(`Dialogs captured: ${capturedDialogs.length}`);

          const confirmDialog = capturedDialogs.find((msg) =>
            msg.includes(ALERT_PATTERNS.CONFIRM_CHANGE_TO_DELIVERED_FINAL)
          );
          expect(
            confirmDialog,
            "Expected Delivered Final confirmation after status change"
          ).toContain(ALERT_PATTERNS.CONFIRM_CHANGE_TO_DELIVERED_FINAL);

          await pages.commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 13: View Billing (CSV 49)", async () => {
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await pages.commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 14 [CSV 50]: Observe Billing Toggle", async () => {
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();
          const observedToggle = await pages.loadBillingPage.getBillingToggleValue();
          pages.logger.info(`Observed Billing Issues toggle: ${observedToggle}`);
        });

        await test.step("Step 15 [CSV 51 / Expected 51]: Move Waiting On toggle to Billing and hard assert", async () => {
          await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.BILLING);
        });

        await test.step("Step 16 [CSV 52 / Expected 52]: Move Waiting On toggle to Agent and hard assert", async () => {
          await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.AGENT);
        });

        await test.step("Step 17 [CSV 53 / Expected 53]: Move Waiting On toggle to Neutral and hard assert", async () => {
          await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.NEUTRAL);
        });
      }
    );
  }
);
