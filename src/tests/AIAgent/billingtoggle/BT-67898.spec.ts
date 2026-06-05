import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commonReusables from "@utils/commonReusables";

/**
 * Test Case: BT-67898 - Verify that the Billing toggle does not change to
 * Billing when paperwork is received for an Invoiced load.
 * @author AI Agent
 * @date 2026-04-29
 * @category billingtoggle
 */
const testcaseID = "BT-67898";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-67898 - Verify Billing toggle does not change to Billing when paperwork is received for an Invoiced load",
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
      "Case Id: BT-67898 - Verify Billing toggle does not change to Billing when paperwork is received for an Invoiced load",
      { tag: "@aiagent,@at_billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [CSV 1]: Login and switch to BILLINGTOGGLE_USER", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 2-8 [CSV 2-8]: Office CORP — ensure Invoice Process is Central", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await pages.officePage.officeSearchRow(testData.officeName);
          await pages.officePage.ensureInvoiceProcess(INVOICE_PROCESS.CENTRAL);

          const invoiceProcess = await pages.officePage.getInvoiceProcessValue();
          expect(
            invoiceProcess.toLowerCase(),
            "Invoice Process should be Central after office setup"
          ).toBe(INVOICE_PROCESS.CENTRAL.toLowerCase());
        });

        await test.step("Step 9-13 [CSV 9-13]: Customer search, open row, CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 14-15 [CSV 14-15]: Select customer on ENTER NEW LOAD page", async () => {
          const customerName = testData["Customer Value"];
          await pages.nonTabularLoadPage.selectCustomerViaSelect2(customerName);
          await pages.nonTabularLoadPage.ensureEnterNewLoadSalespersonDispatcherSelection();
        });

        await test.step("Step 16-27 [CSV 16-27]: Fill shipper, consignee, dates, times, qty, weight, equipment, length", async () => {
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
        });

        await test.step("Step 8: Select Mileage Engine as Current", async () => {
          await pages.editLoadFormPage.selectMileageEngine(MILEAGE_ENGINE.CURRENT);
        });

        await test.step("Step 9: Select Method as Practical", async () => {
          await pages.editLoadFormPage.selectMileageMethod(MILEAGE_METHOD.PRACTICAL);
        });

        await test.step("Step 10: Verify Linehaul and Fuel Surcharge defaults are Flat Rate", async () => {
          const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
          pages.logger.info(`Linehaul default: ${linehaulDefault}`);
          expect.soft(
            linehaulDefault?.toLowerCase(),
            "Linehaul should default to Flat Rate"
          ).toContain(RATE_TYPE.FLAT.toLowerCase());

          const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
          pages.logger.info(`Fuel Surcharge default: ${fuelSurchargeDefault}`);
          expect.soft(
            fuelSurchargeDefault?.toLowerCase(),
            "Fuel Surcharge should default to Flat Rate"
          ).toContain(RATE_TYPE.FLAT.toLowerCase());
        });

        await test.step("Step 11: Click Create Load and select Rate Type SPOT if visible", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);
          await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
          pages.logger.info("Load created successfully");
        });

        await test.step("Step 12: Click Carrier tab and enter Offer Rate", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        });

        await test.step("Step 13: Enter Customer flat rate", async () => {
          await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
        });

        await test.step("Step 14: Enter Carrier flat rate", async () => {
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
        });

        await test.step("Step 15: Enter trailer length", async () => {
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        });

        await test.step("Step 16: Enter Expiration Date and Time", async () => {
          await pages.editLoadFormPage.enterFutureExpirationDateAndTime(7, "18:00");
        });

        await test.step("Step 17: Enter Email for notification", async () => {
          await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(testData.saleAgentEmail);
        });

        await test.step("Step 18: Total miles will be auto-populated", async () => {
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
        });

        await test.step("Step 19: Choose carrier XPO TRANS INC", async () => {
          //@ModfiedBy Akshada Ghaytadkar - 04-Dec-2025: Updated carrier selection to use CARRIER_ID instead of CARRIER_NAME for better reliability
          // await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_NAME.CARRIER_XPO_TRANS);
          await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_ID.CARRIER_XPO_TRANS);
          pages.logger.info(`Carrier: ${CARRIER_ID.CARRIER_XPO_TRANS}`);
        });

        await test.step("Step 20: Click Save — Status set to BOOKED", async () => {
          const alertPromise = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          await alertPromise;
          pages.logger.info("Load saved — Status set to BOOKED");
        });

        await test.step("Step 51-52 [CSV 51-52]: Edit — DELIVERED FINAL, Save; accept alert", async () => {
          await pages.viewLoadPage.clickEditButton();
          await pages.commonReusables.waitForPageStable(sharedPage);
          await pages.editLoadFormPage.selectLoadStatus(LOAD_STATUS.DELIVERED_FINAL);

          const capturedDialogs = await pages.commonReusables.acceptAllDialogsDuringAction(
            sharedPage,
            () => pages.editLoadFormPage.clickOnSaveBtn(),
            WAIT.DEFAULT
          );
          pages.logger.info(`Total dialogs captured: ${capturedDialogs.length}`);

          const confirmDialog = capturedDialogs.find((msg) =>
            msg.includes(ALERT_PATTERNS.CONFIRM_CHANGE_TO_DELIVERED_FINAL)
          );
          expect(
            confirmDialog,
            "Delivered Final confirmation alert should appear"
          ).toContain(ALERT_PATTERNS.CONFIRM_CHANGE_TO_DELIVERED_FINAL);

          await pages.commonReusables.waitForPageStable(sharedPage);
          await test.step("Upload POD and Bill of Lading documents", async () => {
            await pages.viewLoadPage.uploadPODDocument();
            await pages.viewLoadPage.closeDocumentUploadDialogSafe();
            await pages.viewLoadPage.uploadBillOfLadingDocument();
            await pages.viewLoadPage.closeDocumentUploadDialogSafe();
            await pages.commonReusables.reloadPage(sharedPage);
            await pages.commonReusables.waitForPageStable(sharedPage);
          });

          await test.step("Expected [CSV 52]: Load status is INVOICED", async () => {
            const loadStatus = await pages.viewLoadPage.getLoadStatus();
            pages.logger.info(`Load status after save: ${loadStatus}`);
            expect(
              loadStatus.toUpperCase(),
              "Expected [CSV 52]: Status should be set to INVOICED"
            ).toBe(LOAD_STATUS.INVOICED);
          });
        });

        await test.step("Step 53 [CSV 53]: Open document upload dialog against Payable", async () => {
          await pages.viewLoadPage.openDocumentUploadDialog();
        });

        await test.step("Step 54 [CSV 54]: Select Payables, Carrier Invoice, upload file", async () => {
          await pages.viewLoadPage.selectPayablesRadio();
          await pages.viewLoadPage.selectDocumentType(DOCUMENT_TYPE.CARRIER_INVOICE);
          await pages.viewLoadPage.attachCarrierInvoiceFile();
        });

        await test.step("Step 55 [CSV 55]: Enter invoice details, attach, close popup", async () => {
          const invoiceNumber = pages.commonReusables.generateRandomInvoiceNumber();
          await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNumber);
          await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);

          await pages.viewLoadPage.clickSubmitRemote();
          await pages.viewLoadPage.waitForUploadSuccess();
          await pages.viewLoadPage.closeDocumentUploadDialogSafe();
        });

        await test.step("Step 56 [CSV 56]: Click View Billing", async () => {
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await pages.commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 57 [CSV 57]: Observe Billing Toggle — not Billing", async () => {
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();
          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          pages.logger.info(`Billing toggle: ${billingToggle}`);
          expect(
            billingToggle,
            "Expected [CSV 57]: Billing toggle must not switch to Billing"
          ).not.toBe(PAYABLE_TOGGLE_VALUE.BILLING);
        });

      }
    );
  }
);
