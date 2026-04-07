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
        await pages.searchCustomerPage.clickOnActiveCustomer();
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        pages.logger.info("Navigated to Enter New Load page");
      });

      await test.step("Step 3: Select customer value on Enter New Load form", async () => {
        const customerName = testData['Customer Value'];

        await pages.nonTabularLoadPage.selectCustomerViaSelect2(customerName);
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
        await pages.editLoadFormPage.selectMileageEngine(testData.mileageEngine || MILEAGE_ENGINE.CURRENT);
      });

      await test.step("Step 6 [CSV 28]: Select Method as Practical", async () => {
        await pages.editLoadFormPage.selectMileageMethod(MILEAGE_METHOD.PRACTICAL);
      });

      await test.step("Step 7 [CSV 29]: Verify Linehaul and Fuel Surcharge defaults", async () => {
        const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
        pages.logger.info(`Linehaul default: ${linehaulDefault}`);
        expect.soft(
          linehaulDefault?.toLowerCase(),
          "Linehaul should default to 'Flat Rate'"
        ).toContain(RATE_TYPE.FLAT.toLowerCase());

        const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
        pages.logger.info(`Fuel Surcharge default: ${fuelSurchargeDefault}`);
        expect.soft(
          fuelSurchargeDefault?.toLowerCase(),
          "Fuel Surcharge should default to 'Flat Rate'"
        ).toContain(RATE_TYPE.FLAT.toLowerCase());
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
      });

      await test.step("Step 17 [CSV 43]: Click EDIT, select DELIVERED FINAL, check Override BTF, click Save", async () => {
        await pages.viewLoadPage.clickEditButton();
        await pages.editLoadFormPage.selectLoadStatus(LOAD_STATUS.DELIVERED_FINAL);
        await pages.editLoadFormPage.checkOverrideBTF();

        // After Save, dialogs may fire (e.g. "Are you sure you want to change this load to Delivered Final?")
        const capturedDialogs = await pages.commonReusables.acceptAllDialogsDuringAction(
          sharedPage,
          () => pages.editLoadFormPage.clickOnSaveBtn(),
          WAIT.DEFAULT
        );
        pages.logger.info(`Total dialogs captured: ${capturedDialogs.length}`);

        // Expected 43: "Are you sure you want to change this load to Delivered Final?" popup
        const hasConfirmDialog = capturedDialogs.some(msg =>
          msg.includes(ALERT_PATTERNS.CONFIRM_CHANGE_TO_DELIVERED_FINAL)
        );
        expect(hasConfirmDialog,
          "Expected [CSV 43]: 'Are you sure you want to change this load to Delivered Final?' popup should appear"
        ).toBeTruthy();

        await pages.commonReusables.waitForPageStable(sharedPage);

        // Expected 43: Status will be set to INVOICED — read from the load status locator on the page
        const loadStatus = await pages.viewLoadPage.getLoadStatus();
        pages.logger.info(`Load status after save: ${loadStatus}`);
        expect(loadStatus.toUpperCase(),
          "Expected [CSV 43]: Status should be set to INVOICED"
        ).toContain(LOAD_STATUS.INVOICED);
      });

      await test.step("Step 18 [CSV 44]: Click on View Billing button", async () => {
        await pages.editLoadPage.clickOnTab(TABS.LOAD);
        await pages.editLoadFormPage.clickOnViewBillingBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.commonReusables.waitForPageStable(sharedPage);
      });

      await test.step("Step 19 [CSV 45]: Click ADD NEW button adjacent to CARRIER INVOICES", async () => {
        await pages.loadBillingPage.clickAddNewCarrierInvoice();
      });

      await test.step("Step 20 [CSV 46]: Enter Invoice Number, Amount as 1500, click SAVE INVOICE", async () => {
        const invoiceNumber1 = pages.loadBillingPage.generateRandomInvoiceNumber();
        await pages.loadBillingPage.enterCarrierInvoiceNumber(invoiceNumber1);
        await pages.loadBillingPage.enterCarrierInvoiceAmount(testData.carrierInvoiceAmount1);
        await pages.loadBillingPage.clickSaveCarrierInvoice();
      });

      await test.step("Step 21 [CSV 47]: Reload the page", async () => {
        await pages.commonReusables.reloadAndAcceptDialogs(sharedPage, WAIT.SMALL);
      });

      await test.step("Step 22 [CSV 48]: Click ADD NEW button adjacent to CARRIER INVOICES", async () => {
        await pages.loadBillingPage.clickAddNewCarrierInvoice();
      });

      await test.step("Step 23 [CSV 49]: Enter Invoice Number, Amount as 2000, click SAVE INVOICE", async () => {
        const invoiceNumber2 = pages.loadBillingPage.generateRandomInvoiceNumber();
        await pages.loadBillingPage.enterCarrierInvoiceNumber(invoiceNumber2);
        await pages.loadBillingPage.enterCarrierInvoiceAmount(testData.carrierInvoiceAmount2);
        await pages.loadBillingPage.clickSaveCarrierInvoice();
      });

      await test.step("Step 24 [CSV 50]: Reload page — Expected: Payable Toggle should get moved to Agent", async () => {
        await pages.commonReusables.reloadAndAcceptDialogs(sharedPage, WAIT.SMALL);

        // Expected 50: Payable Toggle should get moved to the Agent
        const toggleValue = await pages.loadBillingPage.getPayableToggleValue();
        pages.logger.info(`Payable toggle after second invoice: ${toggleValue}`);
        expect(toggleValue, "Expected [CSV 50]: Payable Toggle should get moved to the Agent").toBe(PAYABLE_TOGGLE_VALUE.AGENT);
      });

      await test.step("Step 25 [CSV 51]: Click View History and verify price difference in last message", async () => {
        // Expected 51: Fetch last row of View History, extract dollar value,
        // verify it equals: Total Invoices - MODE Global Total Charges (carrier rate)
        const result = await pages.loadBillingPage.validateViewHistoryPriceDifference(
          testData.carrierRate,
          [testData.carrierInvoiceAmount1, testData.carrierInvoiceAmount2]
        );
        pages.logger.info(`Last View History message: "${result.lastMessage}"`);
        pages.logger.info(`Extracted: $${result.priceDifference}, Expected: $${result.expectedPriceDiff}`);

        expect(result.priceDifference,
          `Expected [CSV 51]: Last message should contain a price difference. Got: "${result.lastMessage}"`
        ).not.toBeNull();
        expect(result.priceDifference,
          `Expected [CSV 51]: Price difference should be $${result.expectedPriceDiff} (Total Invoices - Total Charges)`
        ).toBe(result.expectedPriceDiff);
      });

      }
    );
  }
);
