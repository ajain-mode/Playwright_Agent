import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commonReusables from "@utils/commonReusables";
import ViewLoadPage from "@pages/loads/viewLoadPage/ViewLoadPage";

const testcaseID = "BT-67847";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;
/** Tab that hosts View Load after View Billing (may differ from {@link sharedPage} when View Load opens in a new tab). */
let viewWorkPage: Page;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-67847 - LTL load not Delivered Final — paperwork received with price difference",
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      viewWorkPage = sharedPage;
      appManager = new MultiAppManager(sharedContext, sharedPage);
      pages = appManager.btmsPageManager;
    });

    test.afterAll(async () => {
      if (appManager) await appManager.closeAllSecondaryPages();
      if (sharedContext) await sharedContext.close();
    });

    test(
      "Case Id: BT-67847 - Validating the scenario when the LTL load is not in Delivered Final status and paperwork received for the load with price difference",
      { tag: "@aiteam,@aiagent,@at_billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [67847 1-5]: Login to BTMS and switch to billing toggle user", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
        });

        await test.step("Step 2 [67847 6-13]: Office NY OFFIC — ensure Invoice Process is Central", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await pages.officePage.officeSearchRow(testData.officeName);
          await pages.officePage.ensureInvoiceProcess(INVOICE_PROCESS.CENTRAL);
        });

        await test.step("Step 3 [67847 14-16]: Admin — switch user to MATT BROWN (NY OFFIC) - 1752", async () => {
          await pages.adminPage.hoverAndClickAdminMenu();
          await pages.adminPage.switchUser(testData.salesAgent);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 4 [67847 17-21]: Customer search and CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step("Step 5 [67847 22-46]: Fill Enter New Load", async () => {
          await pages.nonTabularLoadPage.selectCustomerViaSelect2(testData["Customer Value"]);
          await pages.nonTabularLoadPage.ensureEnterNewLoadSalespersonDispatcherSelection();
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

          await pages.editLoadFormPage.selectMileageEngine(testData.mileageEngine);
          await pages.editLoadFormPage.selectMileageMethod(testData.Method);
        });

        await test.step("Step 6 [67847 47-51]: Create load, Rate Type SPOT, Carrier offer, ZONA, Save to BOOKED", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);

          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_NAME.CARRIER_4);

          const bookedAlert = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          await bookedAlert;
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 7 [67847 52-55]: View Load — Edit — DISPATCHED and carrier flat rate 1000", async () => {
          await pages.viewLoadPage.clickEditButton();
          await commonReusables.waitForPageStable(sharedPage);

          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.editLoadFormPage.selectLoadStatus(LOAD_STATUS.DISPATCHED);

          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
          await pages.editLoadFormPage.clickOnSaveBtn();
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 8 [67847 56-60]: View Billing — upload carrier invoice (Payables)", async () => {
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await pages.commonReusables.waitForPageStable(sharedPage);

          await pages.viewLoadPage.openDocumentUploadDialog();
          await pages.viewLoadPage.attachCarrierInvoiceFile();
          await pages.viewLoadPage.selectPayablesRadio();
          await pages.viewLoadPage.selectDocumentType(DOCUMENT_TYPE.CARRIER_INVOICE);

          const invoiceNumber = pages.commonReusables.generateRandomInvoiceNumber();
          await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNumber);
          await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);

          await pages.viewLoadPage.submitDocumentUploadWithOptionalInvoiceAlert();
          await pages.viewLoadPage.closeDocumentUploadDialogSafe();
        });

        await test.step("Step 9 [Expected after 67847 61]: Reload View Billing — Agent toggle, checkboxes, $100 message", async () => {
          await pages.commonReusables.reloadAndAcceptDialogs(sharedPage, WAIT.SMALL);
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();

          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          expect(billingToggle, "Expected: Billing Toggle set to Agent").toBe(PAYABLE_TOGGLE_VALUE.AGENT);

          const notDeliveredFinalChecked = await pages.loadBillingPage.isNotDeliveredFinalChecked();
          expect(notDeliveredFinalChecked, "Expected: Not Deliv. Final checkbox is checked").toBe(true);

          const priceDifferenceChecked = await pages.loadBillingPage.isPriceDifferenceChecked();
          expect(priceDifferenceChecked, "Expected: Price Difference checkbox is checked").toBe(true);

          const billingIssuesMsg = await pages.loadBillingPage.findBillingIssuesMessageContaining(
            ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_100_OVER_TOTAL_CHARGE
          );
          expect(
            billingIssuesMsg,
            `Expected: ${ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_100_OVER_TOTAL_CHARGE} under Billing Issues`
          ).toContain(ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_100_OVER_TOTAL_CHARGE);
        });

        await test.step("Step 10 [67847 62 + Expected after 62]: Click View Load — Agent Waiting On, tags, $100 message", async () => {
          viewWorkPage = await ViewLoadPage.resolveViewLoadPageAfterBillingClick(sharedPage);
          const vl = new PageManager(viewWorkPage);

          await vl.viewLoadPage.clickloadTab();
          await vl.viewLoadPage.scrollWaitingOnIntoView();

          const waitingOnOnViewLoad = await vl.viewLoadPage.getBillingIssuesWaitingOnDisplayLabel();
          expect(waitingOnOnViewLoad, "Expected: View Load Waiting on value is Agent").toBe(
            PAYABLE_TOGGLE_VALUE.AGENT
          );

          const notDelivFinalTagVisible =
            await vl.viewLoadPage.isBillingIssuesNotDelivFinalTagSpanVisible();
          expect(notDelivFinalTagVisible, "Expected: Not Deliv. Final tag under Billing section").toBe(
            true
          );

          const hasPriceDiffOnViewLoad =
            await vl.viewLoadPage.isBillingIssuesPriceDifferenceTagSpanVisible();
          expect(hasPriceDiffOnViewLoad, "Expected: Price Difference tag under Billing section").toBe(
            true
          );

          const billingMsgOnViewLoad = await vl.viewLoadPage.findBillingIssuesMessageContaining(
            ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_100_OVER_TOTAL_CHARGE
          );
          expect(
            billingMsgOnViewLoad,
            `Expected: ${ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_100_OVER_TOTAL_CHARGE} on View Load`
          ).toContain(ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_100_OVER_TOTAL_CHARGE);
        });
      }
    );
  }
);
