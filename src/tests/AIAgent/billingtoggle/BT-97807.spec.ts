import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commonReusables from "@utils/commonReusables";

const testcaseID = "BT-97807";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-97807 - Additional carrier invoice for same carrier on multi-carrier load",
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
      "Case Id: BT-97807 - Validate when an additional carrier invoice is added for same carrier of a multi carrier load",
      { tag: "@AIAgent,@aiteam,@billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [97807 1-5]: Login to BTMS and switch to billing toggle user", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
        });

        await test.step("Step 2 [97807 6-13]: Office NY OFFIC — ensure Invoice Process is Central", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await pages.officePage.officeSearchRow(testData.officeName);
          await pages.officePage.ensureInvoiceProcess(INVOICE_PROCESS.CENTRAL);
        });

        await test.step("Step 3 [97807 14-16]: Admin — switch user to MATT BROWN (NY OFFIC) - 1752", async () => {
          await pages.adminPage.hoverAndClickAdminMenu();
          await pages.adminPage.switchUser(testData.salesAgent);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 4 [97807 17-21]: Customer search and CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step("Step 5 [97807 22-46]: Fill Enter New Load", async () => {
          await pages.nonTabularLoadPage.selectCustomerViaSelect2(testData["Customer Value"]);
          await pages.nonTabularLoadPage.ensureEnterNewLoadSalespersonDispatcherSelection();
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
          });

          await pages.editLoadFormPage.selectMileageEngine(testData.mileageEngine);
          await pages.editLoadFormPage.selectMileageMethod(testData.Method);
        });

        await test.step("Step 6 [97807 47-54]: Create load, Rate Type SPOT, Carrier tab, Save to BOOKED", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);

          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
          await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_NAME.CARRIER_4);

          const bookedAlert = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          await bookedAlert;
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 7 [97807 55-59]: View Billing — first Payables carrier invoice ($700)", async () => {
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await pages.commonReusables.waitForPageStable(sharedPage);

          await pages.viewLoadPage.openDocumentUploadDialog();
          await pages.viewLoadPage.attachCarrierInvoiceFile();
          await pages.viewLoadPage.selectPayablesRadio();
          await pages.viewLoadPage.selectDocumentType(DOCUMENT_TYPE.CARRIER_INVOICE);

          const invoiceNumber = pages.commonReusables.generateRandomInvoiceNumber();
          await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNumber);
          await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);

          await pages.viewLoadPage.submitDocumentUploadWithOptionalInvoiceAlert();
          await pages.viewLoadPage.closeDocumentUploadDialogSafe();
        });

        await test.step("Step 8 [Expected after 97807 60]: Reload View Billing — Agent toggle and $100 Billing Issues message", async () => {
          await pages.commonReusables.reloadAndAcceptDialogs(sharedPage, WAIT.SMALL);
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();

          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          expect(billingToggle, "Expected: Billing toggle value should be Agent").toBe(
            PAYABLE_TOGGLE_VALUE.AGENT
          );

          const billingIssuesMsg = await pages.loadBillingPage.findBillingIssuesMessageContaining(
            ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_100_OVER_TOTAL_CHARGE
          );
          expect(
            billingIssuesMsg,
            `Expected: ${ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_100_OVER_TOTAL_CHARGE} under Billing Issues`
          ).toContain(ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_100_OVER_TOTAL_CHARGE);
        });

        await test.step("Step 9 [Expected after 97807 61]: View History — one row, $100, System, inactive empty", async () => {
          const historyRows = await pages.loadBillingPage.getViewHistoryRows(1);
          expect(historyRows, "Expected: View History shows 1 over-invoice row").toHaveLength(1);

          const row = historyRows[0];
          expect(row.message, "Expected: $100 overcharge in history").toContain(
            ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_100_OVER_TOTAL_CHARGE
          );
          expect(row.user, "Expected: User as System").toMatch(/system/i);
          expect(row.inactiveDate.trim(), "Expected: Inactive date empty").toBe("");
        });

        await test.step("Step 10 [97807 62-63, Expected after 63]: Second invoice, reload — Agent toggle and $300 Billing Issues message", async () => {
          await pages.viewLoadPage.openDocumentUploadDialog();
          await pages.viewLoadPage.attachCarrierInvoiceFile();
          await pages.viewLoadPage.selectPayablesRadio();
          await pages.viewLoadPage.selectDocumentType(DOCUMENT_TYPE.CARRIER_INVOICE);

          const invoiceNumber2 = pages.commonReusables.generateRandomInvoiceNumber();
          await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNumber2);
          await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount2);

          await pages.viewLoadPage.submitDocumentUploadWithOptionalInvoiceAlert(15);
          await pages.viewLoadPage.closeDocumentUploadDialogSafe();

          await pages.commonReusables.reloadAndAcceptDialogs(sharedPage, WAIT.SMALL);
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();

          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          expect(billingToggle, "Expected after 63: Billing toggle value should be Agent").toBe(
            PAYABLE_TOGGLE_VALUE.AGENT
          );

          const billingIssuesMsg = await pages.loadBillingPage.findBillingIssuesMessageContaining(
            ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_300_OVER_TOTAL_CHARGE
          );
          expect(
            billingIssuesMsg,
            `Expected after 63: ${ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_300_OVER_TOTAL_CHARGE} under Billing Issues`
          ).toContain(ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_300_OVER_TOTAL_CHARGE);
        });

        await test.step("Step 11 [Expected after 97807 64]: View History — two rows, inactive dates", async () => {
          const historyRows = await pages.loadBillingPage.getViewHistoryRows(2);
          expect(historyRows, "Expected: View History shows 2 over-invoice rows").toHaveLength(2);

          // $100 row stays on top; $300 overcharge row is appended as the last row.
          const row100 = historyRows[0];
          const row300 = historyRows[1];

          expect(row100.message, "Expected: 1st row $100 overcharge message").toContain(
            ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_100_OVER_TOTAL_CHARGE
          );
          expect(row100.user, "Expected: 1st row User as System").toMatch(/system/i);
          expect(
            row100.inactiveDate.trim().length,
            "Expected: 1st row Inactive date (last column) set after second invoice"
          ).toBeGreaterThan(0);

          expect(row300.message, "Expected: 2nd row $300 overcharge message").toContain(
            ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_300_OVER_TOTAL_CHARGE
          );
          expect(row300.user, "Expected: 2nd row User as System").toMatch(/system/i);
          expect(row300.inactiveDate.trim(), "Expected: 2nd row Inactive date empty").toBe("");
        });
      }
    );
  }
);
