import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

/**
 * Test Case: BT-74421 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received
 * @author AI Agent Generator
 * @date 2026-03-12
 * @category billingtoggle
 */
const testcaseID = "BT-74421";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-74421 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received.",
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
      "Case Id: BT-74421 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received.",
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
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.searchCustomerPage.clickOnActiveCustomer();
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        pages.logger.info("Navigated to Enter New Load page");
      });

      await test.step("Step 3: Select customer value on Enter New Load form", async () => {
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        const customerName = testData['Customer Value'];

        await pages.nonTabularLoadPage.selectCustomerViaSelect2(customerName);

        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 4 [CSV 8-26]: Fill Enter New Load page details", async () => {
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
        pages.logger.info("Enter New Load form completed");
      });

      await test.step("Step 5 [CSV 27]: Select Mileage Engine as Current", async () => {
        await pages.editLoadFormPage.selectMileageEngine(testData.mileageEngine || "Current");
      });

      await test.step("Step 6 [CSV 28]: Select Method as Practical", async () => {
        await pages.editLoadFormPage.selectMileageMethod("Practical");
      });

      await test.step("Step 7 [CSV 29]: Verify Linehaul and Fuel Surcharge defaults", async () => {
        const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
        pages.logger.info(`Linehaul default: ${linehaulDefault}`);
        expect.soft(
          linehaulDefault?.toLowerCase(),
          "Linehaul should default to 'Flat Rate'"
        ).toContain("flat");

        const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
        pages.logger.info(`Fuel Surcharge default: ${fuelSurchargeDefault}`);
        expect.soft(
          fuelSurchargeDefault?.toLowerCase(),
          "Fuel Surcharge should default to 'Flat Rate'"
        ).toContain("flat");
      });

      await test.step("Step 8 [CSV 30-31]: Click Create Load and select Rate Type", async () => {
        await pages.nonTabularLoadPage.clickCreateLoadButton();
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        pages.logger.info(`Load number: ${loadNumber}`);
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        pages.logger.info("Load created successfully");
      });

      await test.step("Step 9 [CSV 32-33]: Carrier tab — enter offer rate", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.enterOfferRate(testData['Offer Rate'] || testData.offerRate);
      });

      await test.step("Step 10 [CSV 34-35]: Enter Customer rate 500 and Carrier rate 600", async () => {
        await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
        await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
      });

      await test.step("Step 11 [CSV 36]: Enter trailer length", async () => {
        await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
      });

      await test.step("Step 12 [CSV 37-38]: Enter Expiration Date and Time", async () => {
        await pages.editLoadFormPage.enterFutureExpirationDateAndTime(7, "18:00");
      });

      await test.step("Step 13 [CSV 39]: Enter Email for notification", async () => {
        const emailValue = testData.saleAgentEmail;
        await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(emailValue);
      });

      await test.step("Step 14 [CSV 40]: Enter total miles", async () => {
        await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
      });

      await test.step("Step 15 [CSV 41]: Choose carrier", async () => {
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
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 17 [CSV 43]: Click EDIT and select DELIVERED FINAL from status dropdown", async () => {
        await pages.viewLoadPage.clickEditButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.editLoadFormPage.selectLoadStatus(LOAD_STATUS.DELIVERED_FINAL);
      });

      await test.step("Step 18 [CSV 44]: Click Save and select Ok on pop up — Expected: INVOICED alert", async () => {
        const result = await pages.loadBillingPage.saveAndCaptureInvoicedAlert(
          sharedPage,
          () => pages.editLoadFormPage.clickOnSaveBtn(),
          () => pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]),
          ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_INVOICED
        );
        expect.soft(result.hasInvoicedAlert, "Expected: Status has been set to INVOICED alert should appear").toBeTruthy();
      });

      await test.step("Step 19 [CSV 45]: Click on View Billing button", async () => {
        // After save, page may be in view mode — navigate to Load tab then View Billing
        await pages.editLoadPage.clickOnTab(TABS.LOAD);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.editLoadFormPage.clickOnViewBillingBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      // ===== Steps 46-47: Add New Carrier Invoice #1 (amount: 1500) =====
      await test.step("Step 20 [CSV 46-47]: Click Add New, enter invoice #1 (amount 1500), save", async () => {
        await pages.loadBillingPage.clickAddNewCarrierInvoice();

        const invoiceNumber1 = pages.loadBillingPage.generateRandomInvoiceNumber();
        await pages.loadBillingPage.enterCarrierInvoiceNumber(invoiceNumber1);
        await pages.loadBillingPage.enterCarrierInvoiceAmount(testData.carrierInvoiceAmount1);

        await pages.loadBillingPage.clickSaveCarrierInvoice();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      // ===== Step 48: Reload and validate payable toggle =====
      await test.step("Step 21 [CSV 48]: Reload page — Expected: Payable Toggle should get moved to the Agent", async () => {
        // Wait for backend to process the invoice and update payable toggle before reloading
        await sharedPage.waitForTimeout(WAIT.SMALL);

        const reloadDialogHandler = async (dialog: { accept: () => Promise<void> }) => { await dialog.accept(); };
        sharedPage.on("dialog", reloadDialogHandler);

        await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        sharedPage.off("dialog", reloadDialogHandler);

        // Page reloads on billing — validate payable toggle directly
        const toggleValue = await pages.loadBillingPage.getPayableToggleValue();
        pages.logger.info(`Payable toggle after first invoice: ${toggleValue}`);
        expect.soft(toggleValue, "Expected [CSV 48]: Payable Toggle should get moved to the Agent").toBe('Agent');
      });

      // ===== Steps 49-50: Add New Carrier Invoice #2 (amount: 2000) =====
      await test.step("Step 22 [CSV 49-50]: Click Add New, enter invoice #2 (amount 2000), save", async () => {
        await pages.loadBillingPage.clickAddNewCarrierInvoice();

        const invoiceNumber2 = pages.loadBillingPage.generateRandomInvoiceNumber();
        await pages.loadBillingPage.enterCarrierInvoiceNumber(invoiceNumber2);
        await pages.loadBillingPage.enterCarrierInvoiceAmount(testData.carrierInvoiceAmount2);

        await pages.loadBillingPage.clickSaveCarrierInvoice();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      // ===== Step 51: Reload =====
      await test.step("Step 23 [CSV 51]: Reload page", async () => {
        // Wait for backend to process the second invoice before reloading
        await sharedPage.waitForTimeout(WAIT.SMALL);

        const reloadDialogHandler2 = async (dialog: { accept: () => Promise<void> }) => { await dialog.accept(); };
        sharedPage.on("dialog", reloadDialogHandler2);

        await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        sharedPage.off("dialog", reloadDialogHandler2);
      });

      // ===== Step 52: Click View History, read payable messages, validate price difference =====
      await test.step("Step 24 [CSV 52]: Click View History and check price difference message", async () => {
        const result = await pages.loadBillingPage.validateViewHistoryPriceDifference(
          testData.carrierRate,
          [testData.carrierInvoiceAmount1, testData.carrierInvoiceAmount2]
        );
        expect.soft(result.hasPriceDiffMessage,
          "Expected [CSV 52]: View History should contain a price difference message"
        ).toBeTruthy();
        expect.soft(result.hasCorrectAmount,
          `Expected [CSV 52]: View History should show recalculated price difference (${result.expectedDiffs.join(', ')})`
        ).toBeTruthy();
      });

      }
    );
  }
);
