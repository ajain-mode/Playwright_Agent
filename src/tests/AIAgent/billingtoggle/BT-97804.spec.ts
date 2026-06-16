import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commonReusables from "@utils/commonReusables";

const testcaseID = "BT-97804";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-97804 - Additional carrier invoice for same carrier as existing invoice",
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
      "Case Id: BT-97804 - Validate when an additional carrier invoice is added for the same carrier as the existing invoice",
      { tag: "@aiagent,@at_billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [97804 1-5]: Login to BTMS and switch to billing toggle user", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
        });

        await test.step("Step 2 [97804 6-13]: Office NY OFFIC — ensure Invoice Process is Central", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await pages.officePage.officeSearchRow(testData.officeName);
          await pages.officePage.ensureInvoiceProcess(INVOICE_PROCESS.CENTRAL);
        });

        await test.step("Step 3 [97804 14-16]: Admin — switch user to MATT BROWN (NY OFFIC) - 1752", async () => {
          await pages.adminPage.hoverAndClickAdminMenu();
          await pages.adminPage.switchUser(testData.salesAgent);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 4 [97804 17-21]: Customer search and CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step("Step 5 [97804 22-45]: Fill Enter New Load", async () => {
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

          const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
          expect(linehaulDefault?.toLowerCase(), "Expected: Linehaul default Flat Rate").toContain(
            RATE_TYPE.FLAT.toLowerCase(),
          );
          const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
          expect(
            fuelSurchargeDefault?.toLowerCase(),
            "Expected: Fuel Surcharge default Flat Rate",
          ).toContain(RATE_TYPE.FLAT.toLowerCase());
        });

        await test.step("Step 6 [97804 46-54]: Create load, Carrier tab, Save to BOOKED", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);

          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_NAME.CARRIER_4);
          await sharedPage.keyboard.press("Escape");
          await commonReusables.waitForPageStable(sharedPage);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);

          const bookedAlert = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED,
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          await bookedAlert;
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 7 [97804 55-59]: View Billing — first Payables carrier invoice", async () => {
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await commonReusables.waitForPageStable(sharedPage);

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

        await test.step("Step 8 [97804 60 + Expected]: Reload — Agent toggle and $100 price difference", async () => {
          await pages.commonReusables.reloadAndAcceptDialogs(sharedPage, WAIT.SMALL);
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();

          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          expect(billingToggle, "Expected after 60: Billing toggle value should be Agent").toBe(
            PAYABLE_TOGGLE_VALUE.AGENT,
          );

          const expectedPriceDiff = pages.loadBillingPage.calculateExpectedBillingIssuesPriceDifference(
            testData.carrierRate,
            [testData.carrierInvoiceAmount1],
          );
          const priceDifference = await pages.loadBillingPage.getBillingIssuesPriceDifferenceDisplayValue();
          expect(
            priceDifference,
            `Expected after 60: price difference under Billing Issues is $${expectedPriceDiff.toFixed(2)} (invoice ${testData.carrierInvoiceAmount1} − carrier rate ${testData.carrierRate})`,
          ).toBe(expectedPriceDiff);
        });

        await test.step("Step 9 [97804 61]: Click View History under Billing Issues — popup opens", async () => {
          const historyPopup = await pages.loadBillingPage.clickBillingIssuesViewHistoryAndGetPopup();
          expect(historyPopup, "Expected after 61: View History popup opens").toBeTruthy();
          await historyPopup.close();
        });

        await test.step(
          "Step 10 [97804 62-63 + Expected after 63]: Second invoice, reload — Agent toggle and $300 price difference",
          async () => {
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
              PAYABLE_TOGGLE_VALUE.AGENT,
            );

            const expectedPriceDiff = pages.loadBillingPage.calculateExpectedBillingIssuesPriceDifference(
              testData.carrierRate,
              [testData.carrierInvoiceAmount1, testData.carrierInvoiceAmount2],
            );
            const priceDifference = await pages.loadBillingPage.getBillingIssuesPriceDifferenceDisplayValue();
            expect(
              priceDifference,
              `Expected after 63: price difference under Billing Issues is $${expectedPriceDiff.toFixed(2)} (invoices ${testData.carrierInvoiceAmount1} + ${testData.carrierInvoiceAmount2} − carrier rate ${testData.carrierRate})`,
            ).toBe(expectedPriceDiff);
          },
        );

        await test.step("Step 11 [97804 64]: Click View History under Billing Issues — popup opens", async () => {
          const historyPopup = await pages.loadBillingPage.clickBillingIssuesViewHistoryAndGetPopup();
          expect(historyPopup, "Expected after 64: View History popup opens").toBeTruthy();
          await historyPopup.close();
        });
      },
    );
  },
);
