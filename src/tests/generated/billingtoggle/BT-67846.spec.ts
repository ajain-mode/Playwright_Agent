import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

const testcaseID = "BT-67846";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-67846 - Billing Toggle Validation with Carrier Invoice Upload",
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
      "Case Id: BT-67846 - Billing Toggle Validation with Carrier Invoice Upload",
      { tag: "@aiteam,@billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        // Preconditions (informational): Load status = 'Delivered Final', Paperwork received date = delivered date

        await test.step("Step 1: Login to BTMS application", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        });

        await test.step("Step 2: Search customer and navigate to CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step("Step 3: Select customer on Enter New Load", async () => {
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          const customerName = testData['Customer Value'];

          await pages.nonTabularLoadPage.selectCustomerViaSelect2(customerName);

          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        });

        await test.step("Step 4: Fill shipper, consignee, dates, and times", async () => {
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

        // await test.step("Step 5: Enter Whse Instructions", async () => {
        //   await pages.editLoadFormPage.fillWhseInstructions("TestData");
        // });

        await test.step("Step 6: Select Mileage Engine, Method, and enter LH Rate", async () => {
          await pages.editLoadFormPage.selectMileageEngine(testData.mileageEngine);
          console.log(`Method: ${testData.Method}`);
          await pages.editLoadFormPage.selectMileageMethod(testData.Method);
          await pages.editLoadFormPage.enterLinehaulRate(testData.linehaulRate);
        });

        await test.step("Step 7: Click Create Load and select Rate Type", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();

          await pages.editLoadLoadTabPage.checkRateTypeIfPresent(testData.rateType, pages.editLoadFormPage);

          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);
        });

        await test.step("Step 8: Click Carrier tab and enter Offer Rate", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        });

        await test.step("Step 9: Enter Customer flat rate as 500", async () => {
          await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
        });

        await test.step("Step 10: Enter Carrier flat rate", async () => {
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
        });

        await test.step("Step 11: Enter trailer length", async () => {
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        });

        await test.step("Step 12: Enter Expiration Date and Time", async () => {
          await pages.editLoadFormPage.enterFutureExpirationDateAndTime(7, "18:00");
        });

        await test.step("Step 13: Enter Email for notification", async () => {
          await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(testData.saleAgentEmail);
        });

        await test.step("Step 14: Enter total miles", async () => {
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
        });

        await test.step("Step 15: Choose carrier", async () => {
          await pages.editLoadCarrierTabPage.selectCarrier1(testData.Carrier);
          pages.logger.info(`Carrier: ${testData.Carrier}`);
        });

        await test.step("Step 16: Click Save and accept BOOKED alert", async () => {
          const alertPromise = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          await alertPromise;
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        });

        await test.step("Step 17: Navigate to View Billing and validate toggle is set to Agent", async () => {
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

          // Validate: Billing Issues toggle should be set to "Agent"
          const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
          pages.logger.info(`Billing toggle: ${toggleValue}`);
          expect.soft(toggleValue, "Billing Issues toggle should be set to 'Agent'").toBe('Agent');
        });

        await test.step("Step 18: Click upload icon in Load Documents", async () => {
          await pages.viewLoadPage.openDocumentUploadDialog();
        });

        await test.step("Step 19: Select Payables and Document Type as Carrier Invoice", async () => {
          await pages.viewLoadPage.selectPayablesRadio();
          await pages.viewLoadPage.selectDocumentType('Carrier Invoice');
        });

        await test.step("Step 20: Enter invoice details, attach file, and accept alert", async () => {
          const invoiceNumber = pages.loadBillingPage.generateRandomInvoiceNumber();
          await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNumber);
          await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);

          await pages.viewLoadPage.attachCarrierInvoiceFile();

          const alertPromise = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED
          );
          await pages.viewLoadPage.clickSubmitRemote();

          // Handle duplicate invoice confirmation if it appears
          await pages.viewLoadPage.clickConfirmDuplicateInvoiceDialog();

          await alertPromise;

          // Close the Document Upload Utility dialog
          await pages.viewLoadPage.closeDocumentUploadDialogSafe();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        });

        await test.step("Step 21: Reload and validate toggle and Not Deliv. Final checkbox", async () => {
          await sharedPage.reload();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

          await pages.viewLoadPage.scrollToBillingIssuesSection();

          // Validate: Toggle should still be "Agent" after reload
          const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
          pages.logger.info(`Billing toggle after reload: ${toggleValue}`);
          expect.soft(toggleValue, "Billing Issues toggle should still be 'Agent' after reload").toBe('Agent');

          // Validate: "Not Deliv. Final" checkbox should be checked
          const notDelivChecked = await pages.loadBillingPage.isNotDeliveredFinalChecked();
          pages.logger.info(`Not Deliv. Final checked: ${notDelivChecked}`);
          expect.soft(notDelivChecked, "Not Deliv. Final should be checked").toBeTruthy();
        });

      }
    );
  }
);
