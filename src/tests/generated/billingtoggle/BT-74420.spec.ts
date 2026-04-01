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
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        await pages.searchCustomerPage.selectActiveOnCustomerPage();
        await pages.searchCustomerPage.clickOnSearchCustomer();
        await pages.searchCustomerPage.clickOnActiveCustomer();
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        pages.logger.info("Navigated to Enter New Load page");
      });

      await test.step("Step 3: Select customer value on Enter New Load form", async () => {
        const customerName = testData['Customer Value'];

        await pages.nonTabularLoadPage.selectCustomerViaSelect2(customerName);
      });

      await test.step("Step 4 [CSV 6-26]: Fill Enter New Load page details (CSV 6-26)", async () => {
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
        pages.logger.info("Enter New Load form completed");
      });

      await test.step("Step 5: Select the 'Method' as 'Practical'", async () => {
        await pages.nonTabularLoadPage.selectMethod("Practical");
      });

      await test.step("Step 6: 'Linehaul' and Fuel Surcharge' default value will be 'Flat'", async () => {
        const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
        pages.logger.info(`Linehaul default: ${linehaulDefault}`);
        expect.soft(linehaulDefault, "Linehaul should default to 'Flat'").toBe("Flat");

        const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
        pages.logger.info(`Fuel Surcharge default: ${fuelSurchargeDefault}`);
        expect.soft(fuelSurchargeDefault, "Fuel Surcharge should default to 'Flat'").toBe("Flat");
      });

      await test.step("Step 7: Click Create Load and select Rate Type", async () => {
        await pages.nonTabularLoadPage.clickCreateLoadButton();
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        pages.logger.info(`Load number: ${loadNumber}`);
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        pages.logger.info("Load created successfully");
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
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const mm = (futureDate.getMonth() + 1).toString().padStart(2, '0');
        const dd = futureDate.getDate().toString().padStart(2, '0');
        const yyyy = futureDate.getFullYear();
        await pages.editLoadFormPage.enterExpirationDate(`${mm}/${dd}/${yyyy}`);
        await pages.editLoadFormPage.enterExpirationTime("18:00");
      });

      await test.step("Step 13: Enter Email for notification", async () => {
        const emailValue = testData.saleAgentEmail;
        await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(emailValue);
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
      });

      // ===== Step 17: Navigate to View Billing and validate toggle =====
      await test.step("Step 17: Navigate to View Billing and validate toggle is set to Agent", async () => {
        await pages.editLoadPage.clickOnTab(TABS.LOAD);
        await pages.editLoadFormPage.clickOnViewBillingBtn();

        const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
        pages.logger.info(`Billing toggle: ${toggleValue}`);
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

        await pages.viewLoadPage.closeDocumentUploadDialogSafe();
      });

      // ===== Step 51: Validate payable toggle (Expected: Billing toggle is at the Agent) =====
      await test.step("Step 22: Refresh and validate billing toggle is set to Agent (Step 51)", async () => {
        await sharedPage.reload();

        const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
        pages.logger.info(`Billing toggle: ${toggleValue}`);
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

        await sharedPage.reload();

        const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
        pages.logger.info(`Billing toggle after save: ${toggleValue}`);
        expect.soft(toggleValue, "Expected: Billing should get moved to the Agent").toBe('Agent');
      });

      // ===== Step 55: View History — check price difference for first invoice =====
      // Expected: The system should recalculate the discrepancy to show the correct price difference
      await test.step("Step 25: Click View History and check price difference for first invoice (Step 55)", async () => {
        const historyPopup = await pages.loadBillingPage.clickViewHistoryAndGetPopup();

        const allText = await pages.loadBillingPage.getPopupBodyText(historyPopup);

        const hasPriceDiff = (allText || "").toLowerCase().includes("price difference") ||
                             (allText || "").toLowerCase().includes("discrepancy");
        expect.soft(hasPriceDiff, "Expected: System should show price difference message for first invoice").toBeTruthy();

        await historyPopup.close();

        const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
        pages.logger.info(`Billing toggle after View History: ${toggleValue}`);
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

        await pages.viewLoadPage.attachCarrierInvoiceFile();

        const alertPromise = pages.commonReusables.validateAlert(
          sharedPage,
          ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED
        );
        await pages.viewLoadPage.clickSubmitRemote();

        // Handle duplicate invoice confirmation if it appears
        await pages.viewLoadPage.clickConfirmDuplicateInvoiceDialog();

        await alertPromise;

        await pages.viewLoadPage.closeDocumentUploadDialogSafe();
      });

      await test.step("Step 28: Check price difference message for secondary invoice (Step 56)", async () => {
        await sharedPage.reload();

        // Check finance messages on the billing page
        const messages = await pages.loadBillingPage.getFinanceMessages();
        pages.logger.info(`Finance messages found: ${messages.length}`);

        let foundSecondaryPriceDiff = await pages.loadBillingPage.hasFinanceMessageContaining("price difference") ||
                                      await pages.loadBillingPage.hasFinanceMessageContaining("discrepancy");

        // Click View History to see payable messages for secondary invoice in popup window
        const historyPopup = await pages.loadBillingPage.clickViewHistoryAndGetPopup();
        const historyText = await pages.loadBillingPage.getPopupBodyText(historyPopup);

        if ((historyText || "").toLowerCase().includes("price difference") ||
            (historyText || "").toLowerCase().includes("discrepancy")) {
          foundSecondaryPriceDiff = true;
        }

        await historyPopup.close();

        expect.soft(foundSecondaryPriceDiff, "Expected: Price difference message for secondary invoice should be present").toBeTruthy();
      });

      }
    );
  }
);
