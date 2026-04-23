import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commonReusables from "@utils/commonReusables";

const testcaseID = "BT-72258";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-72258 - Verify the Payable Toggle setting when the Carrier remainder amount >= Carrier invoice amount for Autopay load.",
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
      "Case Id: BT-72258 - Verify the Payable Toggle setting when the Carrier remainder amount >= Carrier invoice amount for Autopay load.",
      { tag: "@aiteam,@billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1: Login to BTMS and navigate to Office Search", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 2: Enter office code GA-LE790 and click Search", async () => {
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 3: Click office row", async () => {
          await pages.officePage.officeSearchRow(testData.officeName);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 4-6.1: Check Invoice Process and Auto Pay — edit if not correct, then validate", async () => {
          // Step 4: Check values — if not correct, steps 5-6.1 will edit and save
          await pages.officePage.ensureInvoiceProcessAndAutoPay(INVOICE_PROCESS.OFFICE, AUTOPAY_STATUS.ENABLED);
          await commonReusables.waitForAllLoadStates(sharedPage);

          // Validate after potential edit (Step 6.1 expected result)
          const invoiceProcess = await pages.officePage.getInvoiceProcessValue();
          pages.logger.info(`Invoice Process: ${invoiceProcess}`);
          expect(
            invoiceProcess.toLowerCase(),
            "Invoice Process should be 'Office'"
          ).toContain(INVOICE_PROCESS.OFFICE.toLowerCase());

          const autopayValue = await pages.officePage.getAutopayDisabledValue();
          pages.logger.info(`Enable Auto-Pay value: ${autopayValue}`);
          expect(
            autopayValue.toUpperCase(),
            "Enable Auto Pay for GA-LE790 should be YES"
          ).toBe(AUTOPAY_STATUS.ENABLED);
        });

        await test.step("Step 7: Navigate to Customer Search", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 8-9: Enter customer name and click Search", async () => {
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 10: Click on the Customer detail row", async () => {
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 11: Click NEW LOAD - LTL and accept alert", async () => {
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LOAD_LTL);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 11.1: Select Rate Type as SPOT if visible", async () => {
          const isRateTypeVisible = await pages.editLoadFormPage.isRateTypeFieldVisible();
          if (isRateTypeVisible) {
            await pages.editLoadPage.selectRateType(testData.rateType);
            pages.logger.info("Rate Type set to SPOT");
          } else {
            pages.logger.info("Rate Type dropdown not visible — skipped");
          }
        });

        await test.step("Step 12: Navigate to Carrier tab and choose carrier XPO TRANS INC", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_NAME.CARRIER_XPO_TRANS);
          pages.logger.info(`Carrier selected: ${CARRIER_NAME.CARRIER_XPO_TRANS}`);
        });

        await test.step("Step 13: Enter Customer flat rate as 500", async () => {
          await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
        });

        await test.step("Step 14: Enter Carrier flat rate as 600", async () => {
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
        });

        await test.step("Step 15: Enter trailer length as 20", async () => {
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        });

        await test.step("Step 16: Navigate to the PICK tab", async () => {
          await pages.editLoadPage.clickOnTab(TABS.PICK);
        });

        await test.step("Step 17: Select shipper location — AAK USA LLC", async () => {
          await pages.editLoadPickTabPage.selectShipperAddress();
          await pages.editLoadPickTabPage.selectClientByName(testData.shipperName);
        });

        await test.step("Step 18: Select Actual Date (tomorrow)", async () => {
          const dates = commonReusables.getNextTwoDatesFormatted();
          await pages.editLoadPickTabPage.enterActualDateValue(dates.tomorrow);
        });

        await test.step("Step 19: Enter Actual Time 09:00", async () => {
          await pages.editLoadPickTabPage.enterActualTimeValue(testData.shipperEarliestTime);
        });

        await test.step("Step 20: Enter item details — QTY, Type, Description, Dims, Weight", async () => {
          await pages.editLoadPickTabPage.enterQtyValue(testData.shipmentCommodityQty);
          await pages.editLoadPickTabPage.selectItemType(testData.shipmentCommodityUoM);
          await pages.editLoadPickTabPage.enterDescriptionValue(testData.shipmentCommodityDescription);
          await pages.editLoadPickTabPage.closeNmfcPopupIfVisible();
          await pages.editLoadPickTabPage.enterItemDimensions(DEFAULT_ITEM_DIMENSIONS.LENGTH, DEFAULT_ITEM_DIMENSIONS.WIDTH, DEFAULT_ITEM_DIMENSIONS.HEIGHT);
          await pages.editLoadPickTabPage.closeNmfcPopupIfVisible();
          await pages.editLoadPickTabPage.enterWeightValue(testData.shipmentCommodityWeight);
        });

        await test.step("Step 21: Navigate to the DROP tab", async () => {
          await pages.editLoadPage.clickOnTab(TABS.DROP);
        });

        await test.step("Step 22-23: Select consignee — GHIRARDELL CHOCLATE CO. and accept alert", async () => {
          await pages.editLoadDropTabPage.selectConsigneeAddress();
          await pages.editLoadDropTabPage.selectConsigneeByNameConsignee(testData.consigneeName);
          await pages.editLoadDropTabPage.alertPopUp();
        });

        await test.step("Step 24: Select Actual Date (tomorrow)", async () => {
          const dates = commonReusables.getNextTwoDatesFormatted();
          await pages.editLoadDropTabPage.enterActualDateValue(dates.tomorrow);
        });

        await test.step("Step 25: Enter Actual Time 09:00", async () => {
          await pages.editLoadDropTabPage.enterActualTimeValue(testData.consigneeEarliestTime);
        });

        await test.step("Step 26-27: Click SAVE and validate BOOKED alert", async () => {
          const alertPromise = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          const alertMessage = await alertPromise;
          expect(
            alertMessage,
            "Alert should contain 'Status has been set to BOOKED'"
          ).toMatch(ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED);
          await commonReusables.waitForAllLoadStates(sharedPage);
          const loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load saved — Status has been set to BOOKED. Load ID: ${loadNumber}`);
        });

        await test.step("Step 28: Click upload icon against Payable in Load Documents", async () => {
          await pages.viewLoadPage.openDocumentUploadDialog();
        });

        await test.step("Step 29: Select Payables radio, Document Type as Carrier Invoice, and upload file", async () => {
          await pages.viewLoadPage.selectPayablesRadio();
          await pages.viewLoadPage.selectDocumentType(DOCUMENT_TYPE.CARRIER_INVOICE);
          await pages.viewLoadPage.attachCarrierInvoiceFile();
        });

        await test.step("Step 30: Enter Invoice Number, Invoice Amount 600, click Attach and close popup", async () => {
          const invoiceNumber = pages.commonReusables.generateRandomInvoiceNumber();
          await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNumber);
          await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);

          await pages.viewLoadPage.clickSubmitRemote();
          await pages.viewLoadPage.waitForUploadSuccess();
          await pages.viewLoadPage.closeDocumentUploadDialogSafe();
        });

        await test.step("Step 31: Click VIEW BILLING and validate Payable Toggle, message, and Carrier payable status", async () => {
          await pages.viewLoadPage.clickViewBillingButton();
          await commonReusables.waitForAllLoadStates(sharedPage);

          // Validate Payable toggle = Agent
          const payableToggle = await pages.loadBillingPage.getPayableToggleValue();
          pages.logger.info(`Payable toggle value: ${payableToggle}`);
          expect(
            payableToggle,
            "Payable toggle should be set to 'Agent'"
          ).toBe(PAYABLE_TOGGLE_VALUE.AGENT);

          // Validate payable message "Load is not Invoiced"
          const hasNotInvoicedMsg = await pages.loadBillingPage.hasFinanceMessageContaining(FINANCE_MESSAGES.LOAD_NOT_INVOICED);
          pages.logger.info(`FINANCE_MESSAGES.LOAD_NOT_INVOICED message present: ${hasNotInvoicedMsg}`);
          expect(
            hasNotInvoicedMsg,
            "Payable message should contain 'Load is not Invoiced'"
          ).toBeTruthy();

          // Validate Carrier payable status is "Invoice Received"
          const carrierPayableStatus = await pages.loadBillingPage.getCarrierPayableStatus();
          pages.logger.info(`Carrier payable status: ${carrierPayableStatus}`);
          expect(
            carrierPayableStatus,
            "Carrier payable status should be 'Invoice Received'"
          ).toBe(CARRIER_PAYABLE_STATUS.INVOICE_RECEIVED);
        });

        await test.step("Step 32: Validate Carrier REMAINDER >= TOTAL INVOICES", async () => {
          const remainder = await pages.loadBillingPage.getCarrierRemainderAmount();
          const totalInvoices = await pages.loadBillingPage.getCarrierTotalInvoicesAmount();
          pages.logger.info(`Carrier Remainder: ${remainder}, Total Invoices: ${totalInvoices}`);
          expect(
            remainder,
            `Carrier remainder (${remainder}) should be >= total invoices (${totalInvoices})`
          ).toBeGreaterThanOrEqual(totalInvoices);
        });

      }
    );
  }
);
