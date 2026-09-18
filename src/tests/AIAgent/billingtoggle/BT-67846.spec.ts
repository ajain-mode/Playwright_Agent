import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commissionHelper from "@utils/commissionUtils/commissionHelper";
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
      { tag: "@aiagent,@at_billingtoggle" },
      async () => {

        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [CSV 1]: Login to BTMS and switch to billing toggle user", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
        });

        await test.step("Step 2-9 [CSV 2-9]: Office CORP — ensure Invoice Process is Central", async () => {
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

        await test.step("Step 10-14 [CSV 10-14]: Customer search and CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await commissionHelper.updateAvailableCreditOnCustomer(sharedPage);
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step("Step 15-16 [CSV 15-16]: Select customer; Salesperson / Dispatcher", async () => {
          const customerName = testData["Customer Value"];
          await pages.nonTabularLoadPage.selectCustomerViaSelect2(customerName);
          await pages.nonTabularLoadPage.ensureEnterNewLoadSalespersonDispatcherSelection();
        });

        await test.step("Step 17-28 [CSV 17-28]: Fill shipper, consignee, dates, and times", async () => {
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
            // Consignee delivery must already be in the past for the price/NDF finance-issue
            // calculation to run at all (see BT-67847 / FD-35847 — LoadDocuments::isDeliveryDatePassed).
            // Without this, the Billing Toggle never leaves Neutral after the invoice upload below,
            // even though the invoice amount deliberately creates an overage.
            shipperPickupDaysAgo: 3,
            consigneeDeliveryDaysAgo: 1,
          });
        });

        await test.step("Step 30-38 [CSV 30-38]: Qty, equipment, mileage, LH rate", async () => {
          await pages.editLoadFormPage.selectMileageEngine(testData.mileageEngine);
          await pages.editLoadFormPage.selectMileageMethod(testData.Method);
          await pages.editLoadFormPage.enterLinehaulRate(testData.linehaulRate);

          const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
          expect.soft(linehaulDefault?.toLowerCase()).toContain(RATE_TYPE.FLAT.toLowerCase());
          const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
          expect.soft(fuelSurchargeDefault?.toLowerCase()).toContain(RATE_TYPE.FLAT.toLowerCase());
        });

        await test.step("Step 39-40 [CSV 39-40]: Create Load and select Rate Type SPOT if visible", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);
        });

        await test.step("Step 41-51 [CSV 41-51]: Carrier tab, rates, carrier, Save to BOOKED", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
          await pages.editLoadFormPage.enterFutureExpirationDateAndTime(7, "18:00");
          await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(testData.saleAgentEmail);
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
        });

        await test.step("Step 15: Choose carrier", async () => {
          //@ModfiedBy Rohit Singh - 04-Dec-2025: Updated carrier selection to use CARRIER_ID instead of CARRIER_NAME for better reliability
          // await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_NAME.CARRIER_XPO_TRANS);
          await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_ID.CARRIER_XPO_TRANS);
          pages.logger.info(`Carrier: ${CARRIER_ID.CARRIER_XPO_TRANS}`);
        });

        const alertPromise = pages.commonReusables.validateAlert(
          sharedPage,
          ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
        );
        await pages.editLoadFormPage.clickOnSaveBtn();
        await alertPromise;


        await test.step("Step 52 [CSV 52]: Navigate to View Billing", async () => {
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
        });

        await test.step("Step 53-55 [CSV 53-55]: Upload carrier invoice via Customer document icon", async () => {
          await pages.viewLoadPage.openDocumentUploadDialog();
          await pages.viewLoadPage.attachCarrierInvoiceFile();
          await pages.viewLoadPage.selectPayablesRadio();
          await pages.viewLoadPage.selectDocumentType(DOCUMENT_TYPE.CARRIER_INVOICE);
        });

        await test.step("Step 56 [CSV 56]: Enter invoice details, attach, accept alert", async () => {
          const invoiceNumber = pages.commonReusables.generateRandomInvoiceNumber();
          await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNumber);
          await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);

          // Captured for diagnostics only: surfaces the upload endpoint's own response in the
          // trace/logs if a later step fails, instead of only seeing the downstream toggle value.
          const uploadResponsePromise = sharedPage
            .waitForResponse((resp) => resp.url().includes("image_upload_processor.php"), {
              timeout: WAIT.XLARGE,
            })
            .catch(() => null);

          const alertPromise = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED,
            30
          );
          await pages.viewLoadPage.clickSubmitRemote();
          await alertPromise;

          const uploadResponse = await uploadResponsePromise;
          if (uploadResponse) {
            pages.logger.info(
              `Upload endpoint response: status=${uploadResponse.status()} body=${await uploadResponse.text()}`
            );
          }

          // Confirms the document upload itself succeeded server-side (distinct from the
          // "Payable Status" alert above) before we go on to check the toggle it should trigger.
          await pages.viewLoadPage.waitForUploadSuccess();
          await pages.commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 57 [CSV 57]: Reload — Billing toggle Agent; Not Deliv. Final checked", async () => {
          // Polls with a fresh reload each attempt rather than reading the DOM once, in case the
          // server-side NDF/toggle calculation (LoadDocuments::checkNonBanyanLoadRequirements)
          // lags the imaging service's document listing becoming consistent.
          await expect
            .poll(
              async () => {
                await pages.commonReusables.reloadAndAcceptDialogs(sharedPage, WAIT.SMALL);
                await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();
                return pages.loadBillingPage.getBillingToggleValue();
              },
              {
                timeout: WAIT.XXLARGE,
                message: "Billing Issues toggle should reach Agent after invoice upload",
              }
            )
            .toBe(PAYABLE_TOGGLE_VALUE.AGENT);

          const notDelivChecked = await pages.loadBillingPage.isNotDeliveredFinalChecked();
          expect(notDelivChecked, "Not Deliv. Final should be checked").toBeTruthy();
        });
      });
  });