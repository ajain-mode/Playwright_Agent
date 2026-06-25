import { BrowserContext, expect, Page, test } from "@playwright/test";
import apiHeaders from "@api/apiHeader";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import loginSetup from "@loginHelpers/loginSetup";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";

const testcaseID = "BT-86999";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let loadNumber = "";
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;


test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-86999 - Payables toggle and message for EDI Exception (carrier not booked)",
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
      "Case Id: BT-86999 - Validate payables toggle and message for EDI Exception Carrier is not Booked on Load",
      { tag: "@AIAgent,@aiteam,@at_billingtoggle,@payabletoggle" },
      async ({ request }) => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [86999 1-5]: Login BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 2 [86999 6-13]: Office NY OFFIC — ensure Invoice Process Central", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await pages.officePage.officeSearchRow(testData.officeName);
          await pages.officePage.ensureInvoiceProcess(INVOICE_PROCESS.CENTRAL);
        });

        await test.step("Step 3 [86999 14-16]: Admin — switch user to NATASHA TINSLEY NY", async () => {
          await pages.adminPage.hoverAndClickAdminMenu();
          await pages.adminPage.switchUser(testData.salesAgent);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 4 [86999 17-21]: Customer search and CREATE TL *NEW*", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step("Step 5 [86999 22-46]: Enter New Load — shipper/consignee/commodity", async () => {
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

        await test.step("Step 6 [86999 47-51]: Rate Type SPOT, Carrier tab, offer/miles, Save — capture Load ID", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
          await pages.editLoadFormPage.clickOnSaveBtn();
          await pages.viewLoadPage.validateViewLoadHeading();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          expect(loadNumber, "Expected: Load ID captured in step 51").toBeTruthy();
          pages.logger.info(`Load ID: ${loadNumber}`);
        });

        await test.step("Step 7 [86999 52]: POST EDI 210 API — carrier not booked on load", async () => {
          const payload = commonReusables.buildEdi210Payload(loadNumber);
          const response = await request.post(
            `${loginSetup.tmsApiBaseUrl}edi/${EDI_CODE.EDI_210}`,
            {
              headers: apiHeaders.getHeaders(),
              data: payload,
            },
          );
          pages.logger.info(`EDI 210 response status: ${response.status()}`);
          expect(response.status(), "Expected: EDI 210 ingest succeeds").toBeLessThan(500);
        });

        await test.step("Step 8 [86999 53-54 + Expected]: View Billing — Unassigned Invoice tab validations", async () => {
          await pages.viewLoadPage.clickViewBillingButton();
          await pages.loadBillingPage.assertUnassignedInvoiceEdi210Details({
            source: EDI_EXCEPTION.SOURCE_API_210,
            loadId: loadNumber,
            carrierName: CARRIER_NAME.CARRIER_XPO_LOGISTICS_FREIGHT,
            description: EDI_EXCEPTION.DESCRIP_CARRIER_NOT_BOOKED_ON_LOAD,
            expectedPayablesToggle: PAYABLES_TOGGLE_VALUE.AGENT,
          });
        });

        await test.step("Step 9 [86999 55 + Expected]: View History — carrier not assigned message", async () => {
          const expectedMessage = commonReusables.expectedUnassignedHistoryMessage(testData);
          await pages.loadBillingPage.assertUnassignedInvoiceViewHistoryMessage(expectedMessage);
        });
      },
    );
  },
);
