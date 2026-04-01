import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

/**
 * Test Case: BT-67847 - Billing Toggle Validation with Carrier Invoice Upload
 * @author AI Agent Generator
 * @date 2026-03-02
 * @category billingtoggle
 */
const testcaseID = "BT-67847";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-67847 - Billing Toggle Validation with Carrier Invoice Upload",
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      appManager = new MultiAppManager(sharedContext, sharedPage);
      pages = appManager.btmsPageManager;
    });

    test.afterAll(async () => {
      if (appManager) {
        await appManager.closeAllSecondaryPages();
      }
      if (sharedContext) {
        await sharedContext.close();
      }
    });

    test(
      "Case Id: BT-67847 - Billing Toggle Validation with Carrier Invoice Upload",
      {
        tag: "@aiteam,@billingtoggle"
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [CSV 1]: Login to BTMS application", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          pages.logger.info("Logged in successfully");
        });

        await test.step("Step 2 [CSV 1-5]: Search customer and navigate to CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
          pages.logger.info("Navigated to Enter New Load page");
        });

        await test.step("Step 3 [CSV 6]: Select customer CORP RECONCILIATION on Enter New Load", async () => {
          const customerName = testData['Customer Value'];

          await pages.nonTabularLoadPage.selectCustomerViaSelect2(customerName);
          pages.logger.info(`Customer set to ${customerName}, shipper/consignee dropdowns repopulated`);
        });

        await test.step("Step 4 [CSV 7-19]: Fill shipper, consignee, dates, and times", async () => {
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
            shipperCity: testData.shipperCity,
            shipperState: testData.shipperState,
            consigneeCountry: testData.consigneeCountry,
            consigneeZip: testData.consigneeZip,
            consigneeAddress: testData.consigneeAddress,
            consigneeCity: testData.consigneeCity,
            consigneeState: testData.consigneeState,
          });
          pages.logger.info("Enter New Load form completed");
        });

        await test.step("Step 5 [CSV 20]: Enter Whse Instructions", async () => {
          await pages.editLoadFormPage.fillWhseInstructions("TestData");
        });

        await test.step("Step 6 [CSV 27-29]: Select Mileage Engine, Method, and enter LH Rate", async () => {
          await pages.editLoadFormPage.selectMileageEngine(testData.mileageEngine || "Current");

          await pages.editLoadFormPage.selectMileageMethod(testData.Method || "Practical");

          await pages.editLoadFormPage.enterLinehaulRate(testData.linehaulRate);
        });

        await test.step("Step 7 [CSV 30-31]: Click Create Load and select Rate Type", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();

          if (await pages.editLoadFormPage.isRateTypeFieldVisible()) {
            await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          } else {
            console.log("Rate type field not visible — skipping");
          }

          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);
        });

        await test.step("Step 8 [CSV 32-33]: Click Carrier tab and enter Offer Rate", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        });

        await test.step("Step 9 [CSV 34]: Enter flat rate in Customer as 500", async () => {
          await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
        });

        await test.step("Step 10 [CSV 35]: Enter flat rate in Carrier", async () => {
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
        });

        await test.step("Step 11 [CSV 36]: Enter trailer length", async () => {
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        });

        await test.step("Step 12 [CSV 37-38]: Enter Expiration Date and Time", async () => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);
          const formattedDate = `${(futureDate.getMonth() + 1).toString().padStart(2, '0')}/${futureDate.getDate().toString().padStart(2, '0')}/${futureDate.getFullYear()}`;
          await pages.editLoadFormPage.enterExpirationDate(formattedDate);
          await pages.editLoadFormPage.enterExpirationTime("18:00");
        });

        await test.step("Step 13 [CSV 39]: Enter Email for notification", async () => {
          await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(testData.saleAgentEmail);
        });

        await test.step("Step 14 [CSV 40]: Enter total miles", async () => {
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
        });

        await test.step("Step 15 [CSV 41]: Choose a carrier — XPO TRANS INC", async () => {
          await pages.editLoadCarrierTabPage.selectCarrier1(testData.Carrier);
          pages.logger.info(`Carrier: ${testData.Carrier}`);
        });

        await test.step("Step 16 [CSV 42]: Click Save and accept BOOKED alert", async () => {
          const alertPromise = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          await alertPromise;
          pages.logger.info("Load saved — BOOKED alert accepted");
        });

        await test.step("Step 17 [CSV 43]: Navigate to Load tab and click on View Billing", async () => {
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.editLoadFormPage.clickOnViewBillingBtn();

          const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
          pages.logger.info(`Billing toggle: ${toggleValue}`);
          expect.soft(toggleValue, "Billing toggle button should be set to 'Agent'").toBe('Agent');
          pages.logger.info("Expected Result 1: Billing toggle validated as Agent");
        });

        await test.step("Step 18 [CSV 44]: Navigate back to View Load and open document upload", async () => {
          await pages.loadBillingPage.clickOnViewLoadBtn();

          await pages.viewLoadPage.openDocumentUploadDialog();
        });

        await test.step("Step 19 [CSV 45-46]: Select Payables, Document Type as Carrier Invoice, and upload file", async () => {
          await pages.viewLoadPage.selectPayablesRadio();

          await pages.viewLoadPage.selectDocumentType('Carrier Invoice');
        });

        await test.step("Step 20 [CSV 47]: Enter invoice number, amount, attach, and accept alert", async () => {
          await pages.viewLoadPage.fillCarrierInvoiceNumber(testData.carrierInvoiceNumber);

          await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);

          await pages.viewLoadPage.attachCarrierInvoiceFile();

          const alertPromise = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED
          );
          await pages.viewLoadPage.clickSubmitRemote();

          await alertPromise;

          await pages.viewLoadPage.waitForUploadSuccess();

          await pages.viewLoadPage.closeDocumentUploadDialogSafe();
          pages.logger.info("Carrier invoice uploaded and alert accepted");
        });

        await test.step("Step 21 [CSV 48]: Reload the page and validate toggle and Not Deliv Final", async () => {
          await sharedPage.reload();

          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.editLoadFormPage.clickOnViewBillingBtn();

          const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
          pages.logger.info(`Billing toggle after reload: ${toggleValue}`);
          expect.soft(toggleValue, "Billing toggle should still be 'Agent' after reload").toBe('Agent');

          const isChecked = await pages.loadBillingPage.isNotDeliveredFinalChecked();
          pages.logger.info(`Not Delivered Final checked: ${isChecked}`);
          expect.soft(isChecked, "Finance issue should be marked as 'Not Delivered Final'").toBeTruthy();
          pages.logger.info("Expected Result 2: Not Delivered Final validated");
        });

      }
    );
  }
);
