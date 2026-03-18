import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

/**
 * Test Case: BT-74420 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received
 * @author AI Agent Generator
 * @date 2026-03-11
 * @category billingtoggle
 */
const testcaseID = "BT-74420";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-74420 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received.",
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
      "Case Id: BT-74420 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received.",
      {
        tag: "@aiteam,@payabletoggle"
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes

      // ========== Preconditions (informational — not automated) ==========
      // Precondition: Load office invoice process = Central or Office
      // Precondition: Load status = invoiced or posted
      // Precondition: Payable toggle = Agent
      // Precondition: Pending carrier invoice with price difference

      await test.step("Step 1: Login to BTMS application.", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        pages.logger.info("BTMS Login Successfully");
      });

      await test.step("Step 2 [CSV 2-5]: Search customer and navigate to CREATE TL *NEW*", async () => {
        await pages.basePage.navigateToBaseUrl();
        console.log("Navigated to BTMS Home");
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        console.log("Hovered to Customers and clicked Search");
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        console.log(`Entered customer name: ${testData.customerName}`);
        await pages.searchCustomerPage.selectActiveOnCustomerPage();
        await pages.searchCustomerPage.clickOnSearchCustomer();
        console.log("Clicked Search button");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.searchCustomerPage.clickOnActiveCustomer();
        console.log("Selected active customer from search results");
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        console.log("Clicked CREATE TL *NEW* hyperlink");
        pages.logger.info("Navigated to Enter New Load page");
      });

      await test.step("Step 3: Select customer value on Enter New Load form", async () => {
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        const customerName = testData['Customer Value'];

        await pages.editLoadCarrierTabPage.selectCustomerViaSelect2(customerName);
        console.log(`Selected customer via Select2: ${customerName}`);

        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.editLoadCarrierTabPage.waitForShipperDropdown();
        console.log("Customer value changed and form reloaded");
      });

      await test.step("Step 4 [CSV 6-26]: Fill Enter New Load page details (CSV 6-26)", async () => {
        console.log("CSV 6-7: Customer field pre-selected, Salesperson/Dispatcher pre-selected");
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
        pages.logger.info("Enter New Load form completed");
      });

      await test.step("Step 5: Select the 'Method' as 'Practical'", async () => {
        await pages.nonTabularLoadPage.selectMethod("Practical");
        console.log("Selected Method: Practical");
      });

      await test.step("Step 6: 'Linehaul' and Fuel Surcharge' default value will be 'Flat'", async () => {
        const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
        console.log(`Linehaul default value: "${linehaulDefault}"`);
        expect.soft(linehaulDefault, "Linehaul should default to 'Flat'").toBe("Flat");

        const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
        console.log(`Fuel Surcharge default value: "${fuelSurchargeDefault}"`);
        expect.soft(fuelSurchargeDefault, "Fuel Surcharge should default to 'Flat'").toBe("Flat");
      });

      await test.step("Step 7: Click Create Load and select Rate Type", async () => {
        await pages.nonTabularLoadPage.clickCreateLoadButton();
        console.log("Clicked Create Load button");
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        console.log(`Rate type set to ${testData.rateType}`);
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(`Load Number captured: ${loadNumber}`);
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        pages.logger.info("Load created successfully");
      });

      await test.step("Step 8: Click Carrier tab and enter Offer Rate", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        console.log("Clicked Carrier tab");
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        console.log(`Entered Offer Rate: ${testData.offerRate}`);
      });

      await test.step("Step 9: Enter Customer flat rate as 500", async () => {
        await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
        console.log(`Entered Customer Rate: ${testData.customerRate}`);
      });

      await test.step("Step 10: Enter Carrier flat rate", async () => {
        await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
        console.log(`Entered Carrier Rate: ${testData.carrierRate}`);
      });

      await test.step("Step 11: Enter trailer length", async () => {
        await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        console.log(`Entered trailer length: ${testData.trailerLength}`);
      });

      await test.step("Step 12: Enter Expiration Date and Time", async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const mm = (futureDate.getMonth() + 1).toString().padStart(2, '0');
        const dd = futureDate.getDate().toString().padStart(2, '0');
        const yyyy = futureDate.getFullYear();
        await pages.editLoadFormPage.enterExpirationDate(`${mm}/${dd}/${yyyy}`);
        await pages.editLoadFormPage.enterExpirationTime("18:00");
        console.log(`Entered Expiration Date: ${mm}/${dd}/${yyyy}, Time: 18:00`);
      });

      await test.step("Step 13: Enter Email for notification", async () => {
        const emailValue = testData.saleAgentEmail;
        await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(emailValue);
        console.log(`Selected email for notification: ${emailValue}`);
      });

      await test.step("Step 14: Enter total miles", async () => {
        await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
        console.log(`Entered total miles: ${testData.miles}`);
      });

      await test.step("Step 15: Choose carrier", async () => {
        await pages.editLoadCarrierTabPage.selectCarrier1(testData.Carrier);
        console.log(`Selected carrier: ${testData.Carrier}`);
      });

      await test.step("Step 16: Click Save and accept BOOKED alert", async () => {
        const alertPromise = pages.commonReusables.validateAlert(
          sharedPage,
          ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
        );
        await pages.editLoadFormPage.clickOnSaveBtn();
        await alertPromise;
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Saved load and accepted BOOKED alert");
      });

      // ===== Step 17: Navigate to View Billing and validate toggle =====
      await test.step("Step 17: Navigate to View Billing and validate toggle is set to Agent", async () => {
        await pages.editLoadPage.clickOnTab(TABS.LOAD);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.editLoadFormPage.clickOnViewBillingBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
        console.log(`Billing Issues toggle value: "${toggleValue}"`);
        expect.soft(toggleValue, "Billing Issues toggle should be set to 'Agent'").toBe('Agent');
      });

      // ===== Steps 44-46: Upload POD under Customer via Document Upload Utility =====
      await test.step("Step 18: Click upload icon against Customer in Load Documents (Step 44)", async () => {
        await pages.viewLoadPage.openDocumentUploadDialog();
      });

      await test.step("Step 19: Select Customer radio, POD document type, upload and attach (Steps 45-46)", async () => {
        await pages.viewLoadPage.selectCustomerRadio();
        await pages.viewLoadPage.selectDocumentType("Proof of Delivery");

        await pages.viewLoadPage.attachPODFile();
        await pages.viewLoadPage.clickSubmitRemote();
        await pages.viewLoadPage.waitForUploadSuccess();

        await pages.viewLoadPage.closeDocumentUploadDialogSafe();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Uploaded Proof of Delivery under Customer and closed dialog");
      });

      // ===== Steps 47-50: Upload Carrier Invoice under Payables =====
      await test.step("Step 20: Click upload icon and select Payables + Carrier Invoice (Steps 47-49)", async () => {
        await pages.viewLoadPage.openDocumentUploadDialog();
        await pages.viewLoadPage.selectPayablesRadio();
        await pages.viewLoadPage.selectDocumentType("Carrier Invoice");
      });

      await test.step("Step 21: Enter invoice details, attach carrier invoice, and submit (Step 50)", async () => {
        const invoiceNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNumber);
        await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);
        console.log(`Entered Invoice Number: ${invoiceNumber}, Amount: ${testData.carrierInvoiceAmount1}`);

        await pages.viewLoadPage.attachCarrierInvoiceFile();

        // Expected (Step 50): Alert message stating status has moved to INVOICE should appear
        const alertPromise = pages.commonReusables.validateAlert(
          sharedPage,
          ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED
        );
        await pages.viewLoadPage.clickSubmitRemote();

        // Handle duplicate invoice confirmation if it appears
        await pages.viewLoadPage.clickConfirmDuplicateInvoiceDialog();

        await alertPromise;
        console.log("Expected validated: Alert message stating status has moved to INVOICE appeared");

        await pages.viewLoadPage.closeDocumentUploadDialogSafe();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("First carrier invoice submitted successfully");
      });

      // ===== Step 51: Validate payable toggle (Expected: Billing toggle is at the Agent) =====
      await test.step("Step 22: Refresh and validate billing toggle is set to Agent (Step 51)", async () => {
        await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
        console.log(`Billing Issues toggle value: "${toggleValue}"`);
        expect.soft(toggleValue, "Expected: Billing toggle is at the Agent").toBe('Agent');
      });

      // ===== Steps 52-53: Click Add New and enter invoice details =====
      await test.step("Step 23: Click Add New against Carrier Invoices, enter invoice # and amount (Steps 52-53)", async () => {
        await pages.loadBillingPage.clickAddNewCarrierInvoice();

        const invoiceNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        await pages.loadBillingPage.enterCarrierInvoiceNumber(invoiceNumber);
        await pages.loadBillingPage.enterCarrierInvoiceAmount(testData.carrierInvoiceAmount2);
      });

      // ===== Step 54: Save invoice and refresh (Expected: Billing should get moved to the Agent) =====
      await test.step("Step 24: Save invoice and refresh the page (Step 54)", async () => {
        await pages.loadBillingPage.clickSaveCarrierInvoice();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Saved invoice and refreshed page");

        const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
        console.log(`Billing Issues toggle after save: "${toggleValue}"`);
        expect.soft(toggleValue, "Expected: Billing should get moved to the Agent").toBe('Agent');
      });

      // ===== Step 55: View History — check price difference for first invoice =====
      // Expected: The system should recalculate the discrepancy to show the correct price difference
      await test.step("Step 25: Click View History and check price difference for first invoice (Step 55)", async () => {
        const historyPopup = await pages.loadBillingPage.clickViewHistoryAndGetPopup();

        const allText = await pages.loadBillingPage.getPopupBodyText(historyPopup);
        console.log("History window content (truncated): " + (allText || "").substring(0, 500));

        const hasPriceDiff = (allText || "").toLowerCase().includes("price difference") ||
                             (allText || "").toLowerCase().includes("discrepancy");
        if (hasPriceDiff) {
          console.log("Price difference message found in history for first invoice");
        }
        expect.soft(hasPriceDiff, "Expected: System should show price difference message for first invoice").toBeTruthy();

        await historyPopup.close();
        console.log("Closed View History popup window");

        const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
        console.log(`Billing Issues toggle after View History: "${toggleValue}"`);
        expect.soft(toggleValue, "Billing should be moved to the Agent").toBe('Agent');
      });

      // ===== Step 56: Create a secondary invoice and check price difference =====
      await test.step("Step 26: Open Document Upload Utility for secondary invoice (Step 56)", async () => {
        await pages.viewLoadPage.openDocumentUploadDialog();
        await pages.viewLoadPage.selectPayablesRadio();
        await pages.viewLoadPage.selectDocumentType("Carrier Invoice");
      });

      await test.step("Step 27: Enter secondary invoice details, attach, submit and validate (Step 56)", async () => {
        const secondaryInvoiceNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        await pages.viewLoadPage.fillCarrierInvoiceNumber(secondaryInvoiceNumber);
        await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount2);
        console.log(`Entered Secondary Invoice Number: ${secondaryInvoiceNumber}, Amount: ${testData.carrierInvoiceAmount2}`);

        await pages.viewLoadPage.attachCarrierInvoiceFile();

        const alertPromise = pages.commonReusables.validateAlert(
          sharedPage,
          ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED
        );
        await pages.viewLoadPage.clickSubmitRemote();

        // Handle duplicate invoice confirmation if it appears
        await pages.viewLoadPage.clickConfirmDuplicateInvoiceDialog();

        await alertPromise;
        console.log("Secondary invoice alert validated: status moved to INVOICE");

        await pages.viewLoadPage.closeDocumentUploadDialogSafe();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Secondary carrier invoice submitted successfully");
      });

      await test.step("Step 28: Check price difference message for secondary invoice (Step 56)", async () => {
        await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        // Check finance messages on the billing page
        const messages = await pages.loadBillingPage.getFinanceMessages();
        console.log(`Found ${messages.length} finance messages on billing page`);
        messages.forEach(msg => console.log(`Finance message: ${msg}`));

        let foundSecondaryPriceDiff = await pages.loadBillingPage.hasFinanceMessageContaining("price difference") ||
                                      await pages.loadBillingPage.hasFinanceMessageContaining("discrepancy");

        // Click View History to see payable messages for secondary invoice in popup window
        const historyPopup = await pages.loadBillingPage.clickViewHistoryAndGetPopup();
        const historyText = await pages.loadBillingPage.getPopupBodyText(historyPopup);
        console.log("History content (truncated): " + (historyText || "").substring(0, 500));

        if ((historyText || "").toLowerCase().includes("price difference") ||
            (historyText || "").toLowerCase().includes("discrepancy")) {
          foundSecondaryPriceDiff = true;
          console.log("Price difference message found in history for secondary invoice");
        }

        await historyPopup.close();
        console.log("Closed View History popup");

        expect.soft(foundSecondaryPriceDiff, "Expected: Price difference message for secondary invoice should be present").toBeTruthy();
        console.log("Secondary invoice price difference validation complete");
      });

      }
    );
  }
);
