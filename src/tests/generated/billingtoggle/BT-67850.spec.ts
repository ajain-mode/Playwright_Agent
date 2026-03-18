import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

/**
 * Test Case: BT-67850 - Billing Toggle Validation with Carrier Invoice Upload
 * Preconditions: Load status = Delivered Final, Paperwork received date > delivered date
 * @author AI Agent Generator
 * @date 2026-03-05
 * @category billingtoggle
 */
const testcaseID = "BT-67850";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-67850 - Billing Toggle Validation with Carrier Invoice Upload",
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
      "Case Id: BT-67850 - Billing Toggle Validation with Carrier Invoice Upload",
      {
        tag: "@aiteam,@billingtoggle"
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [CSV 1]: Login to BTMS application", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
            await pages.btmsAcceptTermPage.acceptTermsAndConditions();
          }
          pages.logger.info("Logged in successfully");
        });

        await test.step("Step 2 [CSV 1-5]: Search customer and navigate to CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          console.log("Navigated to BTMS Home");
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          console.log("Hovered to Customers and clicked Search");
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          console.log(`Entered customer name: ${testData.customerName}`);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          console.log("Clicked Search button");
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          console.log("Clicked on Customer profile");
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
          console.log("Clicked CREATE TL *NEW* hyperlink");
          pages.logger.info("Navigated to Enter New Load page");
        });

        await test.step("Step 3 [CSV 6]: Select customer CORP RECONCILIATION on Enter New Load", async () => {
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          const customerName = testData['Customer Value'];

          await pages.editLoadCarrierTabPage.selectCustomerViaSelect2(customerName);
          console.log(`Selected customer via Select2: "${customerName}"`);

          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await pages.editLoadCarrierTabPage.waitForShipperDropdown();
          pages.logger.info(`Customer set to ${customerName}, shipper/consignee dropdowns repopulated`);
        });

        await test.step("Step 4 [CSV 7-19]: Fill shipper, consignee, dates, and times", async () => {
          console.log("CSV 7: Salesperson/Dispatcher pre-selected");
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
          console.log("Shipper, Consignee, dates/times, commodity, equipment fields filled");
          pages.logger.info("Enter New Load form completed");
        });

        await test.step("Step 5 [CSV 20]: Enter Whse Instructions", async () => {
          await pages.editLoadFormPage.fillWhseInstructions("TestData");
          console.log("Entered Whse Instructions: TestData");
        });

        await test.step("Step 6 [CSV 27-29]: Select Mileage Engine, Method, and enter LH Rate", async () => {
          await pages.editLoadFormPage.selectMileageEngine(testData.mileageEngine || "Current");
          console.log(`Selected Mileage Engine: ${testData.mileageEngine || "Current"}`);

          await pages.editLoadFormPage.selectMileageMethod(testData.Method || "Practical");
          console.log(`Selected Method: ${testData.Method || "Practical"}`);

          await pages.editLoadFormPage.enterLinehaulRate(testData.linehaulRate);
          console.log(`Entered LH Rate: ${testData.linehaulRate}`);
        });

        await test.step("Step 7 [CSV 30-31]: Click Create Load and select Rate Type", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          console.log("Clicked Create Load button");

          if (await pages.editLoadFormPage.isRateTypeFieldVisible()) {
            await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
            console.log(`Rate type set to ${testData.rateType}`);
          } else {
            console.log("Rate type field not visible — skipping per CSV step 31");
          }

          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          console.log(`Load Number captured: ${loadNumber}`);
          pages.logger.info("Load created successfully");
        });

        await test.step("Step 8 [CSV 32-33]: Click Carrier tab and enter Offer Rate", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          console.log("Clicked Carrier tab");
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          console.log(`Entered Offer Rate: ${testData.offerRate}`);
        });

        await test.step("Step 9 [CSV 34]: Enter flat rate in Customer as 500", async () => {
          await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
          console.log(`Entered Customer flat rate: ${testData.customerRate}`);
        });

        await test.step("Step 10 [CSV 35]: Enter flat rate in Carrier", async () => {
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
          console.log(`Entered Carrier flat rate: ${testData.carrierRate}`);
        });

        await test.step("Step 11 [CSV 36]: Enter trailer length", async () => {
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
          console.log(`Entered trailer length: ${testData.trailerLength}`);
        });

        await test.step("Step 12 [CSV 37-38]: Enter Expiration Date and Time", async () => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);
          const formattedDate = `${(futureDate.getMonth() + 1).toString().padStart(2, '0')}/${futureDate.getDate().toString().padStart(2, '0')}/${futureDate.getFullYear()}`;
          await pages.editLoadFormPage.enterExpirationDate(formattedDate);
          console.log(`Entered Expiration Date: ${formattedDate}`);
          await pages.editLoadFormPage.enterExpirationTime("18:00");
          console.log("Entered Expiration Time: 18:00");
        });

        await test.step("Step 13 [CSV 39]: Enter Email for notification", async () => {
          await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(testData.saleAgentEmail);
          console.log(`Entered Email for notification: ${testData.saleAgentEmail}`);
        });

        await test.step("Step 14 [CSV 40]: Enter total miles", async () => {
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
          console.log(`Entered total miles: ${testData.miles}`);
        });

        await test.step("Step 15 [CSV 41]: Choose a carrier — XPO TRANS INC", async () => {
          await pages.editLoadCarrierTabPage.selectCarrier1(testData.Carrier);
          console.log(`Selected carrier via Choose Carrier: ${testData.Carrier}`);
          pages.logger.info("Carrier selected via Choose Carrier button");
        });

        await test.step("Step 16 [CSV 42]: Click Save and accept BOOKED alert", async () => {
          const alertPromise = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          const alertMsg = await alertPromise;
          console.log(`Save alert handled: "${alertMsg}"`);
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          console.log("Load saved successfully");
          pages.logger.info("Load saved — BOOKED alert accepted");
        });

        await test.step("Step 17 [CSV 43]: Navigate to Load tab and click on View Billing", async () => {
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          console.log("Clicked View Billing");

          const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
          console.log(`Billing toggle value: ${toggleValue}`);
          expect.soft(toggleValue, "Billing toggle button should be set to 'Agent'").toBe('Agent');
          pages.logger.info("Expected Result 1: Billing toggle validated as Agent");
        });

        await test.step("Step 18 [CSV 44]: Navigate back to View Load and open document upload", async () => {
          await pages.basePage.clickLinkByText('View Load');
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          console.log("Navigated back to View Load page");

          await pages.viewLoadPage.openDocumentUploadDialog();
          console.log("Clicked document upload icon");
        });

        await test.step("Step 19 [CSV 45-46]: Select Payables, Document Type as Carrier Invoice, and upload file", async () => {
          await pages.viewLoadPage.selectPayablesRadio();
          console.log("Selected Payables radio button");

          await pages.viewLoadPage.selectDocumentType('Carrier Invoice');
          console.log("Selected Document Type: Carrier Invoice");
        });

        await test.step("Step 20 [CSV 47]: Enter invoice number, amount, attach, and accept alert", async () => {
          await pages.viewLoadPage.fillCarrierInvoiceNumber(testData.carrierInvoiceNumber);
          console.log(`Entered Invoice Number: ${testData.carrierInvoiceNumber}`);

          await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);
          console.log(`Entered Invoice Amount: ${testData.carrierInvoiceAmount1}`);

          await pages.viewLoadPage.attachCarrierInvoiceFile();

          const alertPromise = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED
          );
          await pages.viewLoadPage.clickSubmitRemote();
          console.log("Clicked Attach/Submit button");

          const alertMsg = await alertPromise;
          console.log(`Invoice alert handled: "${alertMsg}"`);

          await pages.viewLoadPage.waitForUploadSuccess();

          await pages.viewLoadPage.closeDocumentUploadDialogSafe();
          console.log("Closed document upload dialog");
          pages.logger.info("Carrier invoice uploaded and alert accepted");
        });

        await test.step("Step 21 [CSV 48]: Reload the page and validate toggle and Not Deliv Final", async () => {
          await sharedPage.reload();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          console.log("Page reloaded");

          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          console.log("Navigated to View Billing after reload");

          const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
          console.log(`Billing toggle after reload: ${toggleValue}`);
          expect.soft(toggleValue, "Billing toggle should still be 'Agent' after reload").toBe('Agent');

          const isChecked = await pages.loadBillingPage.isNotDeliveredFinalChecked();
          console.log(`Not Delivered Final checkbox is ${isChecked ? "checked" : "NOT checked"}`);
          expect.soft(isChecked, "Finance issue should be marked as 'Not Delivered Final'").toBeTruthy();
          pages.logger.info("Expected Result 2: Not Delivered Final validated");
        });

      }
    );
  }
);
