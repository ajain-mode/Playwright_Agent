import { BrowserContext, expect, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import { INCLUDE_CARRIERS } from "@utils/dfbUtils/dfbGlobalConstants";

/**
 * Test Case: DFB-97788 — Post load blocked when *Post to all Carriers upon completion of Waterfall*
 * is checked with max include carriers (25).
 *
 * **Traceability:** Preconditions follow `src/agent/examples/sample-testcases.csv` (Case ID **97788**) using the
 * same **POM decomposition as DFB-97739** — `setupOfficePreConditions` for office steps **6–14** only; steps **15–31**
 * call the same page objects as the manual case (no `setupDFBTestPreConditions` catch-all).
 * Runtime data: `src/data/dfb/dfbdata.csv` (`testData.*`).
 *
 * @author AI Agent
 * @date 2026-05-12
 * @category dfb
 */

const testcaseID = "DFB-97788";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let loadNumber: string;
let sharedContext: BrowserContext;
let appManager: MultiAppManager;
let pages: PageManager;
/** Include Carriers selected on the load (step 60); used for waterfall modal pencil rows. */
let selectedIncludeCarrierNames: string[] = [];

test.describe.configure({ retries: 0 });
test.describe.serial(
  "Case ID: DFB-97788 — Post load error when Post to all Carriers after Waterfall is checked with max include carriers",
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      appManager = new MultiAppManager(sharedContext, await sharedContext.newPage());
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
      "Case Id: DFB-97788 — Waterfall post-all with 25 include carriers shows validation alert on Post",
      {
        tag: "@aiagent,@dfb,@at_cargovalue",
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        // ═══════════════════════════════════════════════════════════════
        // PRECONDITIONS (sample-testcases 97788 steps 1–31)
        // ═══════════════════════════════════════════════════════════════

        await test.step("Step 1 [97788 1–5]: Login BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          pages.logger.info("BTMS login successful");
        });

        await test.step("Step 2 [97788 6–14]: Office — Match Vendor TNX, Enable DME YES", async () => {
          const toggleSettingsValue = pages.toggleSettings.enable_DME;
          const ensureToggleValues = pages.toggleSettings.verifyAutoPost;
          await pages.dfbHelpers.setupOfficePreConditions(
            pages,
            testData.officeName,
            toggleSettingsValue,
            ensureToggleValues
          );
        });

        await test.step("Step 3 [97788 15–20]: Agent Search — capture agent email", async () => {
          // Step 16: `testData.agentName` from dfbdata.csv, or derived from `salesAgent` when that column is blank (dataConfig).
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
          await pages.agentSearchPage.nameInputOnAgentPage(testData.agentName.trim());
          await pages.agentSearchPage.clickOnSearchButton();
          await pages.agentSearchPage.selectAgentByName(testData.agentName.trim());
          const agentEmail = await pages.agentInfoPage.getAgentEmail();
          pages.logger.info(`Agent email captured (sample step 20): ${agentEmail}`);
        });

        await test.step(
          "Step 4 [97788 21–26]: Switch user — Post Automation rule cleanup for customer",
          async () => {
            await pages.adminPage.hoverAndClickAdminMenu();
            await pages.adminPage.switchUser(testData.salesAgent);
            await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
            await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(
              testData.customerName
            );
          }
        );

        await test.step(
          "Step 5 [97788 27–31]: Customer Search — profile, CREATE TL *NEW*",
          async () => {
            await pages.basePage.navigateToBaseUrl();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.enterCustomerName(testData.customerName);
            await pages.searchCustomerPage.searchCustomerAndClickDetails(
              testData.customerName
            );
            pages.logger.info("Customer profile opened (sample steps 27–30)");

            await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
            pages.logger.info("Navigated to Enter New Load (sample step 31)");
          }
        );

        // ═══════════════════════════════════════════════════════════════
        // TEST STEPS (sample-testcases 97788 steps 32–67)
        // ═══════════════════════════════════════════════════════════════

        await test.step(
          "Step 6 [97788 32–57]: Non-tabular new load — Create Load, rate type, Edit Load (Load tab)",
          async () => {
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
              distanceMethod: testData.Method,
              shipperCountry: testData.shipperCountry,
              shipperZip: testData.shipperZip,
              shipperAddress: testData.shipperAddress,
              shipperNameNew: testData.shipperNameNew,
            });
            await pages.nonTabularLoadPage.clickCreateLoadButton();
            await pages.editLoadPage.selectRateType(testData.rateType);
            await pages.editLoadPage.validateEditLoadHeadingText();
            loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
            await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
            pages.logger.info(`Edit Load opened: ${loadNumber}`);
          }
        );

        await test.step(
          "Step 7 [97788 57–59]: Carrier tab — offer rate, cargo value",
          async () => {
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);
            await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
            await pages.editLoadCarrierTabPage.selectCargoValue(
              CARGO_VALUES.FROM_100001_TO_250000
            );
            pages.logger.info("Carrier tab — offer rate and cargo value per sample steps 58–59");
          }
        );

        const expectedIncludeCarrierCount = INCLUDE_CARRIERS.MAX_COUNT;

        await test.step(
          "Step 8 [97788 60 + Expected]: Select max include carriers via INC/LLC search — assert count",
          async () => {
            await pages.dfbLoadFormPage.selectIncludeCarriersBySearchTerms(
              INCLUDE_CARRIERS.SEARCH_TERMS_INC_THEN_LLC,
              expectedIncludeCarrierCount
            );
            const selectedCount =
              await pages.dfbLoadFormPage.getIncludeCarriersSelectedOptionCount();
            expect(
              selectedCount,
              `Include Carriers must reach ${expectedIncludeCarrierCount} selections (INC search, then LLC if needed)`
            ).toBe(expectedIncludeCarrierCount);
            selectedIncludeCarrierNames =
              await pages.dfbLoadFormPage.getIncludeCarriersSelectedCarrierNames();
            pages.logger.info(
              `Include Carriers selected (${selectedIncludeCarrierNames.length}): ${selectedIncludeCarrierNames.join("; ")}`
            );
          }
        );

        await test.step(
          "Step 9 [97788 61–64]: Include Carriers Data — rows, pencil fields, post-all, save",
          async () => {
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);
            await pages.viewLoadPage.clickIncludeCarriersViewDetailsLink();

            const rowCountBefore =
              await pages.dfbIncludeCarriersDataModalWaterfall.getTotalCarrierCount();
            expect(
              rowCountBefore,
              "Include Carriers Data table should list one row per selected carrier"
            ).toBe(expectedIncludeCarrierCount);

            const modalCarrierNames =
              await pages.dfbIncludeCarriersDataModalWaterfall.getCarrierNamesFromTable();
            if (modalCarrierNames.length > 0) {
              selectedIncludeCarrierNames = modalCarrierNames;
            }

            for (let idx = 0; idx < selectedIncludeCarrierNames.length; idx++) {
              const carrierName = selectedIncludeCarrierNames[idx];
              await pages.dfbIncludeCarriersDataModalWaterfall.clickCarrierPencilIconsAndInputValues(
                carrierName,
                String(idx + 1),
                CARRIER_TIMING.TIMING_0100,
                LOAD_OFFER_RATES.OFFER_RATE_500
              );
            }

            await pages.dfbIncludeCarriersDataModalWaterfall.clickPostAllCarrierCheckbox();
            await pages.dfbIncludeCarriersDataModalWaterfall.validatePostAllCarrierCheckboxIsChecked();
            await pages.dfbIncludeCarriersDataModalWaterfall.enterWaterfallOfferRate(
              String(testData.offerRate)
            );
            await pages.dfbIncludeCarriersDataModalWaterfall.clickIncludeCarriersDataSaveButton();
            pages.logger.info("Include Carriers waterfall modal saved");
          }
        );

        await test.step(
          "Step 10 [97788 Expected after 64]: Reopen View Details — verify saved data, post-all, close",
          async () => {
            await pages.viewLoadPage.clickIncludeCarriersViewDetailsLink();
            expect(
              await pages.dfbIncludeCarriersDataModalWaterfall.getTotalCarrierCount()
            ).toBe(expectedIncludeCarrierCount);

            const carriersData = selectedIncludeCarrierNames.map((name, idx) => ({
              name,
              values: [
                String(idx + 1),
                CARRIER_TIMING.TIMING_0100,
                LOAD_OFFER_RATES.OFFER_RATE_500,
              ],
            }));
            await pages.dfbIncludeCarriersDataModalWaterfall.verifyCarrierInputValues(
              carriersData
            );
            await pages.dfbIncludeCarriersDataModalWaterfall.validatePostAllCarrierCheckboxIsChecked();
            await pages.dfbIncludeCarriersDataModalWaterfall.clickCloseIncludeCarriersDataModal();
            pages.logger.info("Post-save waterfall modal validations complete; modal closed");
          }
        );

        await test.step(
          "Step 11 [97788 65–66]: Save load — View Load (sample: no BOOKED status alert)",
          async () => {
            await pages.editLoadFormPage.clickOnSaveBtn();
            await pages.viewLoadPage.validateViewLoadHeading();
            pages.logger.info("Load saved — View Load heading visible (sample steps 65–66)");
          }
        );

        await test.step(
          "Step 12 [97788 67 + Expected]: Carrier tab — hard assert waterfall error on screen",
          async () => {
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);

            const errorMessage = await pages.dfbLoadFormPage.getErrorMessageText();
            expect(
              errorMessage,
              "Carrier tab (#carr_prexisting_errors) must show Post-to-all waterfall unchecked message (sample step 67 Expected)"
            ).toContain(ALERT_PATTERNS.CARRIER_ALREADY_INCLUDED_ERROR);
            pages.logger.info(`Carrier tab error verified: ${errorMessage}`);
          }
        );
      }
    );
  }
);
