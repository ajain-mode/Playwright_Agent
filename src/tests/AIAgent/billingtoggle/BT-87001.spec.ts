import fs from "fs";
import path from "path";
import moment from "moment-timezone";
import { BrowserContext, expect, Page, test } from "@playwright/test";
import apiHeaders from "@api/apiHeader";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import loginSetup from "@loginHelpers/loginSetup";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";
import { BtmsDbClient } from "@utils/db/BtmsDbClient";

const testcaseID = "BT-87001";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

const EDI210_PAYLOAD_PATH = path.resolve(
  __dirname,
  "../../../data/api/billingtoggle/edi210_carrier_not_booked.json",
);

let loadNumber = "";
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;
let testStartedAt: Date;

function buildEdi210Payload(loadId: string): string {
  const template = fs.readFileSync(EDI210_PAYLOAD_PATH, "utf8");
  return template.replace(/\{LoadId\}/g, loadId);
}

function expectedUnassignedHistoryMessage(): string {
  return `${CARRIER_NAME.CARRIER_XPO_LOGISTICS_FREIGHT} is Billing $${testData.carrierInvoiceAmount1} ${FINANCE_MESSAGES.CARRIER_NOT_ASSIGNED_TO_LOAD}`;
}

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-87001 - Validate EDI exception in database",
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
      "Case Id: BT-87001 - Validate EDI exception and toggle history rows in database",
      { tag: "@AIAgent,@aiteam,@billingtoggle,@payabletoggle" },
      async ({ request }) => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);
        testStartedAt = new Date();

        await test.step("Step 1 [87001 1-5]: Login BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 2 [87001 6-13]: Office NY OFFIC — ensure Invoice Process Central", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await pages.officePage.officeSearchRow(testData.officeName);
          await pages.officePage.ensureInvoiceProcess(INVOICE_PROCESS.CENTRAL);
        });

        await test.step("Step 3 [87001 14-16]: Admin — switch user to NATASHA TINSLEY NY", async () => {
          await pages.adminPage.hoverAndClickAdminMenu();
          await pages.adminPage.switchUser(testData.salesAgent);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 4 [87001 17-21]: Customer search and CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step("Step 5 [87001 22-46]: Enter New Load", async () => {
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

        await test.step("Step 6 [87001 47-51]: Carrier tab, Save — capture Load ID", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
          await pages.editLoadFormPage.clickOnSaveBtn();
          await pages.viewLoadPage.validateViewLoadHeading();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          expect(loadNumber).toBeTruthy();
        });

        await test.step("Step 7 [87001 52]: POST EDI 210 API", async () => {
          const payload = buildEdi210Payload(loadNumber);
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

        const historyMessage = expectedUnassignedHistoryMessage();

        await test.step("Step 8 [87001 53-55 + Expected 54-55]: View Billing UI validations", async () => {
          await pages.viewLoadPage.clickViewBillingButton();
          await pages.loadBillingPage.assertUnassignedInvoiceEdi210Details({
            source: EDI_EXCEPTION.SOURCE_API_210,
            loadId: loadNumber,
            carrierName: CARRIER_NAME.CARRIER_XPO_LOGISTICS_FREIGHT,
            description: EDI_EXCEPTION.DESCRIP_CARRIER_NOT_BOOKED_ON_LOAD,
            expectedPayablesToggle: PAYABLES_TOGGLE_VALUE.AGENT,
          });
          await pages.loadBillingPage.assertUnassignedInvoiceViewHistoryMessage(historyMessage);
        });

        await test.step("Step 9 [87001 56-59 + Expected 57-58]: DB — edi_exception + toggle history", async () => {
          const db = new BtmsDbClient();
          await db.connect();

          try {
            const exceptionRow = await db.getEdiExceptionByLoadNumber(loadNumber);
            expect(exceptionRow, "Expected: exactly one edi_exception row for load").not.toBeNull();

            const row = exceptionRow!;
            expect(row.load_number, "Expected: load_number matches captured Load ID").toBe(loadNumber);
            expect(String(row.carr_id), "Expected: carr_id from EDI 210 payload").toBe(
              String(testData.CarrierID),
            );
            expect(row.invoice_total, "Expected: invoice_total from EDI 210 payload").toBe(
              String(testData.carrierInvoiceAmount1),
            );
            expect(row.descrip, "Expected: descrip matches View History message context").toBe(
              EDI_EXCEPTION.DESCRIP_CARRIER_NOT_BOOKED_ON_LOAD,
            );
            expect(row.assigned_to_payables, "Expected: assigned_to_payables = 0").toBe(0);

            const createdMoment = moment(row.created);
            expect(
              createdMoment.isSameOrAfter(moment(testStartedAt).subtract(2, "minutes")),
              "Expected: edi_exception.created within test execution window",
            ).toBe(true);

            const switchedAgentId = await db.getAgentIdByNameFragment("NATASHA TINSLEY");
            expect(switchedAgentId, "Expected: NATASHA TINSLEY agent id resolvable").not.toBeNull();

            const historyRows = await db.getEdiExceptionToggleHistory(row.id);
            expect(historyRows.length, "Expected: at least one toggle history row").toBeGreaterThan(0);

            const matchingHistory = historyRows.find(
              (h) =>
                h.edi_exception_id === row.id &&
                h.message.includes(historyMessage) &&
                h.role === EDI_EXCEPTION.TOGGLE_HISTORY_ROLE_INITIAL,
            );
            expect(
              matchingHistory,
              "Expected: toggle history row with initial role and View History message",
            ).toBeTruthy();

            if (matchingHistory && switchedAgentId) {
              expect(matchingHistory.created_by, "Expected: created_by matches switched agent id").toBe(
                switchedAgentId,
              );
              expect(
                moment(matchingHistory.created_at).isSameOrAfter(createdMoment),
                "Expected: toggle history created_at on/after edi_exception.created",
              ).toBe(true);
            }
          } finally {
            await db.disconnect();
          }
        });
      },
    );
  },
);
