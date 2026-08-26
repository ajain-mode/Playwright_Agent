import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commonReusables from "@utils/commonReusables";
import commissionHelper from "@utils/commissionUtils/commissionHelper";

/**
 * Test Case: BT-74421 - Verify the Billing toggle behaviour when Load is "Invoiced or Posted"
 * and billing issues are checked, for Invoice Process as being Central.
 * @author AI Agent
 * @date 2026-04-28
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
  `Case ID: BT-74421 - Verify the Billing toggle behaviour when Load is 'Invoiced or Posted' and billing issues are checked for Invoice Process as being Central.`,
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
      `Case Id: BT-74421 - Verify the Billing toggle behaviour when Load is 'Invoiced or Posted' and billing issues are checked for Invoice Process as being Central.`,
      { tag: "@aiagent,@at_billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1: Login to BTMS and switch to BILLINGTOGGLE_USER", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 1.1: Hover over Admin and click on OFFICE SEARCH", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 2 [CSV 2]: Enter office code CORP and click Search", async () => {
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 3: Click office row and validate Invoice Process is CENTRAL", async () => {
          await pages.officePage.officeSearchRow(testData.officeName);
          await commonReusables.waitForAllLoadStates(sharedPage);

          const invoiceProcess = await pages.officePage.getInvoiceProcessValue();
          pages.logger.info(`Invoice Process: ${invoiceProcess}`);
          expect(
            invoiceProcess.toLowerCase(),
            "Invoice Process should be 'Central'"
          ).toBe(INVOICE_PROCESS.CENTRAL.toLowerCase());
        });

        await test.step("Step 4-6: Check Invoice Process is CENTRAL, edit and save if not", async () => {
          await pages.officePage.ensureInvoiceProcess(INVOICE_PROCESS.CENTRAL);
          await commonReusables.waitForAllLoadStates(sharedPage);

          const invoiceProcess = await pages.officePage.getInvoiceProcessValue();
          pages.logger.info(`Invoice Process after ensure: ${invoiceProcess}`);
          expect(
            invoiceProcess.toLowerCase(),
            "Invoice Process should be 'Central'"
          ).toBe(INVOICE_PROCESS.CENTRAL.toLowerCase());
        });

        await test.step("Step 7: Navigate to Customer Search", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 8-9: Enter customer name ADVANCED COMPOSITES and click Search", async () => {
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 10: Click on the Customer detail row", async () => {
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 11: Click CREATE TL *NEW* on VIEW CUSTOMER page", async () => {
          await commissionHelper.updateAvailableCreditOnCustomer(sharedPage);
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 12-13 [CSV 12-13]: Select customer; Salesperson / Dispatcher", async () => {
          const customerValue = testData["Customer Value"];
          await pages.nonTabularLoadPage.selectCustomerViaSelect2(customerValue);
          await pages.nonTabularLoadPage.ensureEnterNewLoadSalespersonDispatcherSelection();
        });

        await test.step("Step 14-25 [CSV 14-25]: Fill Enter New Load page details (Shipper, Consignee, dates, times)", async () => {
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

        await test.step("Step 33: Select Mileage Engine as Current", async () => {
          await pages.editLoadFormPage.selectMileageEngine(MILEAGE_ENGINE.CURRENT);
        });

        await test.step("Step 34: Select Method as Practical", async () => {
          await pages.editLoadFormPage.selectMileageMethod(MILEAGE_METHOD.PRACTICAL);
        });

        await test.step("Step 35: Verify Linehaul and Fuel Surcharge defaults are Flat Rate", async () => {
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

        await test.step("Step 36-37: Click Create Load and select Rate Type SPOT if visible", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);
          await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
          pages.logger.info("Load created successfully");
        });

        await test.step("Step 38-39: Click Carrier tab and enter Offer Rate 1000", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        });

        await test.step("Step 40: Enter Customer flat rate", async () => {
          await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
        });

        await test.step("Step 41: Enter Carrier flat rate", async () => {
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
        });

        await test.step("Step 42: Enter trailer length", async () => {
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        });

        await test.step("Step 43-44: Enter Expiration Date and Time", async () => {
          await pages.editLoadFormPage.enterFutureExpirationDateAndTime(7, "18:00");
        });

        await test.step("Step 45: Enter Email for notification", async () => {
          await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(testData.saleAgentEmail);
        });

        await test.step("Step 46: Total miles will be auto-populated", async () => {
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
        });

        await test.step("Step 47: Choose carrier XPO TRANS INC", async () => {
          //@ModfiedBy Akshada Ghaytadkar - 04-Dec-2025: Updated carrier selection to use CARRIER_ID instead of CARRIER_NAME for better reliability
          // await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_NAME.CARRIER_XPO_TRANS);
          await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_ID.CARRIER_XPO_TRANS);
          pages.logger.info(`Carrier: ${CARRIER_ID.CARRIER_XPO_TRANS}`);
        });

        await test.step("Step 48: Click Save — Status set to BOOKED", async () => {
          const alertPromise = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          await alertPromise;
          pages.logger.info("Load saved — Status set to BOOKED");
        });

        await test.step("Step 49-50: Click Edit, change status to DELIVERED FINAL, Save and accept alert", async () => {
          await pages.viewLoadPage.clickEditButton();
          await pages.commonReusables.waitForPageStable(sharedPage);
          await pages.editLoadFormPage.selectLoadStatus(LOAD_STATUS.DELIVERED_FINAL);

          const capturedDialogs = await pages.commonReusables.acceptAllDialogsDuringAction(
            sharedPage,
            () => pages.editLoadFormPage.clickOnSaveBtn(),
            WAIT.DEFAULT
          );
          pages.logger.info(`Total dialogs captured: ${capturedDialogs.length}`);

          const confirmDialog = capturedDialogs.find(msg =>
            msg.includes(ALERT_PATTERNS.CONFIRM_CHANGE_TO_DELIVERED_FINAL)
          );
          expect(
            confirmDialog,
            "Expected dialog popup should appear after changing status to Delivered Final"
          ).toContain(ALERT_PATTERNS.CONFIRM_CHANGE_TO_DELIVERED_FINAL);

          await pages.commonReusables.waitForPageStable(sharedPage);
          await test.step("Upload POD and Bill of Lading documents", async () => {
            // POD upload
            await pages.viewLoadPage.uploadPODDocument();
            await pages.viewLoadPage.closeDocumentUploadDialogSafe();

            await pages.commonReusables.reloadPage(sharedPage);
            await pages.commonReusables.waitForPageStable(sharedPage);

            // BOL upload
            await pages.viewLoadPage.uploadBillOfLadingDocument();
            await pages.viewLoadPage.closeDocumentUploadDialogSafe();
            await pages.commonReusables.reloadPage(sharedPage);
            await pages.commonReusables.waitForPageStable(sharedPage);
          });

          const loadStatus = await pages.viewLoadPage.getLoadStatus();
          pages.logger.info(`Load status after save: ${loadStatus}`);
          expect(
            loadStatus.toUpperCase(),
            "Status should be set to INVOICED"
          ).toBe(LOAD_STATUS.INVOICED);
        });

        await test.step("Step 51: Click View Billing and validate billing toggle and billing issues", async () => {
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await pages.commonReusables.waitForPageStable(sharedPage);

          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          pages.logger.info(`Billing toggle: ${billingToggle}`);
          expect(
            billingToggle,
            "Billing toggle should NOT be set to 'Agent'"
          ).not.toBe(PAYABLE_TOGGLE_VALUE.AGENT);

          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();
          const noneChecked = await pages.loadBillingPage.areNoBillingIssuesChecked();
          pages.logger.info(`No billing issue checkboxes checked: ${noneChecked}`);
          expect(
            noneChecked,
            "No checkboxes under Billing Issues should be checked"
          ).toBeTruthy();
        });

        await test.step("Step 52: Select Lumper checkbox and validate it is checked", async () => {
          await pages.loadBillingPage.clickLumperCheckbox();

          const lumperChecked = await pages.loadBillingPage.isLumperChecked();
          pages.logger.info(`Lumper checkbox checked: ${lumperChecked}`);
          expect(
            lumperChecked,
            "Lumper checkbox should get checked after selecting it"
          ).toBeTruthy();
        });

      }
    );
  }
);
