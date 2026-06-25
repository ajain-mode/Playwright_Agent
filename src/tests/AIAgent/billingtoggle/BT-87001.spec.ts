import moment from "moment-timezone";
import { BrowserContext, expect, Page, test } from "@playwright/test";
import apiHeaders from "@api/apiHeader";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import loginSetup from "@loginHelpers/loginSetup";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";
import { BtmsDbClient, parseBtmsDbDateTime } from "@utils/db/BtmsDbClient";

const testcaseID = "BT-87001";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let loadNumber = "";
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;
let ediPostedAt: Date;

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
      { tag: "@AIAgent,@aiteam,@at_billingtoggle,@payabletoggle" },
      async ({ request }) => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

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
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step("Step 5 [87001 22-46]: Enter New Load — shipper/consignee/commodity", async () => {
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

        await test.step("Step 6 [87001 47-51]: Rate Type SPOT, Carrier tab, offer/miles, Save — capture Load ID", async () => {
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

        await test.step("Step 7 [87001 52]: POST EDI 210 API — carrier not booked on load", async () => {
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
          ediPostedAt = new Date();
        });

        await test.step("Step 8 [87001 53-54 + Expected]: View Billing — Unassigned Invoice tab validations", async () => {
          await pages.viewLoadPage.clickViewBillingButton();
          await pages.loadBillingPage.assertUnassignedInvoiceEdi210Details({
            source: EDI_EXCEPTION.SOURCE_API_210,
            loadId: loadNumber,
            carrierName: CARRIER_NAME.CARRIER_XPO_LOGISTICS_FREIGHT,
            description: EDI_EXCEPTION.DESCRIP_CARRIER_NOT_BOOKED_ON_LOAD,
            expectedPayablesToggle: PAYABLES_TOGGLE_VALUE.AGENT,
          });
        });

        const historyMessage = commonReusables.expectedUnassignedHistoryMessage(testData);
        const normalizedHistoryMessage = commonReusables.normalizeMoneyInText(historyMessage);

        await test.step("Step 9 [87001 55 + Expected]: View History — carrier not assigned message", async () => {
          await pages.loadBillingPage.assertUnassignedInvoiceViewHistoryMessage(historyMessage);
        });

        await test.step("Step 10 [87001 56-59 + Expected 57-58]: DB — connect, validate, disconnect", async () => {
          const db = new BtmsDbClient();
          let ediExceptionId: number;
          let exceptionCreatedMoment: moment.Moment;

          await test.step("Step 10a [87001 56]: Connect to Stage BTMS database", async () => {
            await db.connect();
          });

          try {
            await test.step("Step 10b [87001 57 + Expected]: Query edi_exception for load", async () => {
              const exceptionRow = await db.getEdiExceptionByLoadNumber(loadNumber);
              expect(exceptionRow, "Expected: exactly one edi_exception row for load").not.toBeNull();

              const row = exceptionRow!;
              ediExceptionId = row.id;
              exceptionCreatedMoment = parseBtmsDbDateTime(row.created);

              expect(row.load_number, "Expected [57]: load_number matches Load ID from step 51").toBe(
                loadNumber,
              );
              expect(String(row.carr_id), "Expected [57]: carr_id from EDI 210 payload (32467)").toBe(
                String(testData.CarrierID),
              );
              expect(
                Number(row.invoice_total),
                "Expected [57]: invoice_total from EDI 210 payload (784)",
              ).toBe(Number(testData.carrierInvoiceAmount1));
              // CSV Expected 57 references step 55 View History text; DB descrip matches UI descrip (step 54 Expected).
              expect(row.descrip, "Expected [57]: descrip Carrier is not booked on load").toBe(
                EDI_EXCEPTION.DESCRIP_CARRIER_NOT_BOOKED_ON_LOAD,
              );
              expect(row.assigned_to_payables, "Expected [57]: assigned_to_payables = 0").toBe(0);

              const testWindowStart = moment(ediPostedAt).subtract(2, "minutes");
              const testWindowEnd = moment().add(2, "minutes");
              expect(
                exceptionCreatedMoment.isBetween(testWindowStart, testWindowEnd, undefined, "[]"),
                `Expected [57]: created within test execution window (edi posted ${moment(ediPostedAt).format("YYYY-MM-DD HH:mm:ss")}, db created ${exceptionCreatedMoment.format("YYYY-MM-DD HH:mm:ss")})`,
              ).toBe(true);
            });

            await test.step("Step 10c [87001 58 + Expected]: Query edi_exception_toggle_history", async () => {
              const historyAuthorId = await db.getAgentIdByNameFragment(
                LOAD_CREATED_BY.INTELYS_API_PORTAL,
              );
              expect(
                historyAuthorId,
                `Expected [58]: agent id resolvable for EDI API author (${LOAD_CREATED_BY.INTELYS_API_PORTAL})`,
              ).not.toBeNull();

              const historyRows = await db.getEdiExceptionToggleHistory(ediExceptionId!);
              expect(historyRows.length, "Expected [58]: at least one toggle history row").toBeGreaterThan(
                0,
              );

              const matchingHistory = historyRows.find(
                (h) =>
                  h.edi_exception_id === ediExceptionId &&
                  commonReusables.normalizeMoneyInText(h.message).includes(normalizedHistoryMessage) &&
                  h.role === EDI_EXCEPTION.TOGGLE_HISTORY_ROLE_INITIAL,
              );
              expect(
                matchingHistory,
                "Expected [58]: toggle history row with role 0 and View History message from step 55",
              ).toBeTruthy();

              if (matchingHistory && historyAuthorId) {
                expect(
                  matchingHistory.created_by,
                  `Expected [58]: created_by matches EDI API author (${LOAD_CREATED_BY.INTELYS_API_PORTAL})`,
                ).toBe(historyAuthorId);

                const historyCreatedMoment = parseBtmsDbDateTime(matchingHistory.created_at);
                const testWindowStart = moment(ediPostedAt).subtract(2, "minutes");
                const testWindowEnd = moment().add(2, "minutes");
                expect(
                  historyCreatedMoment.isSameOrAfter(exceptionCreatedMoment!),
                  "Expected [58]: created_at on/after edi_exception.created",
                ).toBe(true);
                expect(
                  historyCreatedMoment.isBetween(testWindowStart, testWindowEnd, undefined, "[]"),
                  "Expected [58]: created_at within test execution window",
                ).toBe(true);
              }
            });
          } finally {
            await test.step("Step 10d [87001 59]: Close DB connection", async () => {
              await db.disconnect();
            });
          }
        });
      },
    );
  },
);
