import commonReusables from "@utils/commonReusables";
import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import "@utils/globalConstants";
import { DFB_LOAD_METHOD_HOVER_LABEL } from "@utils/dfbUtils/dfbGlobalConstants";
import "@utils/dfbUtils/dfbGlobalConstants";

/**
 * Test Case: DFB-89214 — TNX bids by waterfall included carriers and post-waterfall non-included carriers.
 *
 * **Traceability:** `src/agent/examples/sample-testcases.csv` (Case ID **89214**, steps 1–103).
 * Preconditions use explicit POM bands (DFB-97739 / DFB-97788 pattern), not `setupDFBTestPreConditions`.
 * Runtime data: `src/data/dfb/dfbdata.csv` (`testData.*`).
 *
 * @author AI Agent
 * @date 2026-05-25
 * @category dfb
 */
const testcaseID = "DFB-89214";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

const INCLUDED_CARRIERS_WATERFALL = [
  {
    name: CARRIER_NAME.CARRIER_1,
    values: [PRIORITY.PRIORITY_1, CARRIER_TIMING.TIMING_1, LOAD_OFFER_RATES.OFFER_RATE_1],
  },
  {
    name: CARRIER_NAME.CARRIER_2,
    values: [PRIORITY.PRIORITY_2, CARRIER_TIMING.TIMING_1, LOAD_OFFER_RATES.OFFER_RATE_1],
  },
  {
    name: CARRIER_NAME.CARRIER_4,
    values: [PRIORITY.PRIORITY_3, CARRIER_TIMING.TIMING_1, LOAD_OFFER_RATES.OFFER_RATE_1],
  },
] as const;

let loadNumber: string;
let agentEmail: string;
let totalMilesValue: string;
let initialBidsCount: number;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

const INCLUDED_CARRIER_1_BID_RATE = TNX.BID_RATE_INCLUDED_1;
const INCLUDED_CARRIER_2_BID_RATE = TNX.BID_RATE_INCLUDED_2;
const INCLUDED_CARRIER_3_BID_RATE = LOAD_OFFER_RATES.OFFER_RATE_2;
const NON_INCLUDED_CARRIER_1_BID_RATE = LOAD_OFFER_RATES.OFFER_RATE_3;
const NON_INCLUDED_CARRIER_2_BID_RATE = TNX.BID_RATE;
const NON_INCLUDED_CARRIER_3_BID_RATE = TNX.BID_RATE;

test.describe.configure({ retries: 0 });
test.describe.serial(
  "Case ID: DFB-89214 — Waterfall included + non-included carrier TNX bids on auto-posted load",
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
      "Case Id: DFB-89214 — Enter bids by included waterfall carriers and non-included carriers after waterfall",
      {
        tag: "@AIAgent,@aiteam,@at_bidding,@at_dfb,@at_includecarrier,@at_waterfallsetup",
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE * 3);

        // ═══════════════════════════════════════════════════════════════
        // PRECONDITIONS (sample-testcases 89214 steps 1–39)
        // ═══════════════════════════════════════════════════════════════

        await test.step("Step 1 [89214 1–5]: Login BTMS (SSO sub-steps handled by BTMSLogin)", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          pages.logger.info("BTMS login successful");
        });

        await test.step("Step 2 [89214 6–21]: Office — Match Vendor TNX, Enable DME YES, Auto Post YES", async () => {
          await pages.dfbHelpers.setupOfficePreConditions(
            pages,
            testData.officeName,
            pages.toggleSettings.enable_DME,
            pages.toggleSettings.enabledAutoPost
          );
        });

        await test.step("Step 3 [89214 22–27]: Agent Search — capture agent email for notifications", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
          await pages.agentSearchPage.nameInputOnAgentPage(testData.salesAgent);
          await pages.agentSearchPage.clickOnSearchButton();
          await pages.agentSearchPage.selectAgentByName(testData.salesAgent);
          agentEmail = await pages.agentInfoPage.getAgentEmail();
          pages.logger.info(`Agent email captured (CSV step 27): ${agentEmail}`);
        });

        await test.step(
          "Step 4 [89214 28–35]: Switch user — Post Automation rule cleanup for customer",
          async () => {
            await pages.adminPage.hoverAndClickAdminMenu();
            await pages.adminPage.switchUser(testData.salesAgent);
            await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
            await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(
              testData.customerName
            );
            pages.logger.info("Post Automation rule cleared if present (CSV steps 32–34)");
          }
        );

        await test.step(
          "Step 5 [89214 35–39]: Customer Search — profile, CREATE TL *NEW*",
          async () => {
            await pages.basePage.navigateToBaseUrl();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.enterCustomerName(testData.customerName);
            await pages.searchCustomerPage.selectActiveOnCustomerPage();
            await pages.searchCustomerPage.clickOnSearchCustomer();
            await pages.searchCustomerPage.selectCustomerByName(testData.customerName);
            await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
            pages.logger.info("Navigated to Enter New Load (CSV steps 35–39)");
          }
        );

        // ═══════════════════════════════════════════════════════════════
        // LOAD CREATION (sample-testcases 89214 steps 40–78)
        // ═══════════════════════════════════════════════════════════════

        await test.step(
          "Step 6 [89214 40–65]: Non-tabular new load — shipper, consignee, commodity, equipment, Create Load",
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

            const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
            expect.soft(linehaulDefault, "Linehaul should default to Flat Rate (CSV step 64)").toBe(
              DFB_RATE_DEFAULTS.LINEHAUL
            );
            const fuelSurchargeDefault =
              await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
            expect
              .soft(fuelSurchargeDefault, "Fuel Surcharge should default to FLAT (CSV step 64)")
              .toBe(DFB_RATE_DEFAULTS.FUEL_SURCHARGE);

            await pages.nonTabularLoadPage.clickCreateLoadButton();
            await pages.editLoadPage.selectRateType(testData.rateType);
            await pages.editLoadPage.validateEditLoadHeadingText();
            loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
            await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
            pages.logger.info(`Load created: ${loadNumber}`);
          }
        );

        await test.step(
          "Step 7 [89214 66–78]: Carrier tab — offer rate, 3 include carriers, waterfall modal, save load",
          async () => {
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);
            await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
            await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers(
              INCLUDED_CARRIERS_WATERFALL.map((c) => c.name)
            );
            await pages.viewLoadPage.clickIncludeCarriersViewDetailsLink();

            for (const carrier of INCLUDED_CARRIERS_WATERFALL) {
              await pages.dfbIncludeCarriersDataModalWaterfall.clickCarrierPencilIconsAndInputValues(
                carrier.name,
                ...carrier.values
              );
            }

            await pages.dfbIncludeCarriersDataModalWaterfall.clickPostAllCarrierCheckbox();
            await pages.dfbIncludeCarriersDataModalWaterfall.validatePostAllCarrierCheckboxIsChecked();
            await pages.dfbIncludeCarriersDataModalWaterfall.enterWaterfallOfferRate(
              LOAD_OFFER_RATES.OFFER_RATE_1
            );
            await pages.dfbIncludeCarriersDataModalWaterfall.clickIncludeCarriersDataSaveButton();
            pages.logger.info("Include Carriers waterfall modal saved (CSV steps 72–77)");

            await pages.editLoadFormPage.clickOnSaveBtn();
            await pages.viewLoadPage.validateViewLoadHeading();
            pages.logger.info(`Load saved (CSV step 78): ${loadNumber}`);
          }
        );

        await test.step(
          "Step 8 [89214 Expected after 77]: Reopen View Details — 3 carriers, post-all checked, close modal",
          async () => {
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);
            await pages.viewLoadPage.clickIncludeCarriersViewDetailsLink();
            expect(
              await pages.dfbIncludeCarriersDataModalWaterfall.getTotalCarrierCount()
            ).toBe(INCLUDED_CARRIERS_WATERFALL.length);
            await pages.dfbIncludeCarriersDataModalWaterfall.verifyCarrierInputValuesNormalized(
              INCLUDED_CARRIERS_WATERFALL.map((c) => ({
                name: c.name,
                values: [...c.values],
              }))
            );
            await pages.dfbIncludeCarriersDataModalWaterfall.validatePostAllCarrierCheckboxIsChecked();
            await pages.dfbIncludeCarriersDataModalWaterfall.clickCloseIncludeCarriersDataModal();
          }
        );

        await test.step(
          "Step 9 [89214 79 + Expected after 79]: View Load Carrier tab — POSTED waterfall complete, DFB fields, BIDS baseline",
          async () => {
            // CSV step 79: view load, capture load #, Carrier tab
            await pages.viewLoadPage.validateViewLoadHeading();
            loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
            pages.logger.info(`Load number on view load (CSV step 79): ${loadNumber}`);
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);
            totalMilesValue = await pages.editLoadFormPage.getTotalMilesValue();
            await pages.viewLoadPage.scrollToDFBSection();

            await pages.dfbLoadFormPage.validatePostStatus(
              LOAD_STATUS.POSTED,
              WAIT.WATERFALL_POST_STATUS
            );

            const formattedOfferRate = commonReusables.formatRateForDisplay(testData.offerRate);
            await pages.dfbLoadFormPage.validateDFBTextFieldHaveExpectedValues({
              offerRate: formattedOfferRate,
              expirationDate: pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
              expirationTime: testData.shipperEarliestTime.padStart(5, "0"),
            });
            await pages.dfbLoadFormPage.validateFormFieldsState({
              includeCarriers: INCLUDED_CARRIERS_WATERFALL.map((c) => c.name),
              emailNotification: agentEmail,
            });
            await pages.dfbLoadFormPage.validateFieldsAreNotEditable([
              DFB_FORM_FIELDS.Email_Notification,
              DFB_FORM_FIELDS.Expiration_Date,
              DFB_FORM_FIELDS.Expiration_Time,
              DFB_FORM_FIELDS.Commodity,
              DFB_FORM_FIELDS.NOTES,
              DFB_FORM_FIELDS.Exclude_Carriers,
              DFB_FORM_FIELDS.Include_Carriers,
            ]);
            await pages.dfbLoadFormPage.validateMixedButtonStates({
              [DFB_Button.Post]: false,
              [DFB_Button.Clear_Form]: false,
              [DFB_Button.Create_Rule]: true,
              [DFB_Button.Cancel]: true,
            });
            await pages.dfbLoadFormPage.hoverOverPostedIcon();
            await pages.dfbLoadFormPage.validateTableFields(sharedPage, {
              "Origin Zip": testData.shipperZip,
              "Destination Zip": testData.consigneeZip,
              "Offer Rate": `$${formattedOfferRate}`,
              Equipment: testData.equipmentType,
              "Load Method": DFB_LOAD_METHOD_HOVER_LABEL.TL,
            });

            const bidsBaseline = await pages.viewLoadCarrierTabPage.getBidsReportValue();
            initialBidsCount = parseInt(bidsBaseline, 10) || 0;
            pages.logger.info(`Pre-bid BIDS baseline (CSV step 79): ${initialBidsCount}`);
          }
        );

        await test.step("Step 10 [89214 80–82 + Expected]: DME — load created, BTMS/TNX REQUESTED", async () => {
          const dmePages = await appManager.switchToDME();
          await dmePages.dmeDashboardPage.clickOnLoadsLink();
          await dmePages.dmeDashboardPage.searchLoad(loadNumber);
          await dmePages.dmeLoadPage.validateSingleTableRowPresent();
          await dmePages.dmeLoadPage.validateAndGetSourceIdText(loadNumber);
          await dmePages.dmeLoadPage.ValidateDMEStatusText(
            LOAD_STATUS.BTMS_REQUESTED,
            LOAD_STATUS.TNX_REQUESTED
          );
          await dmePages.dmeLoadPage.clickOnDataDetailsLink();
          await dmePages.dmeLoadPage.clickOnShowIconLink();
          await dmePages.dmeLoadPage.validateAuctionAssignedText(
            loadNumber,
            dmePages.dmeDashboardPage
          );
          pages.logger.info("DME vendor statuses verified (CSV Expected after step 82)");
        });

        await test.step(
          "Step 11 [89214 83–86]: TNX — login, select Priority 1 included carrier (ZZOO)",
          async () => {
            const tnxPages = await appManager.switchToTNXForLoadSearch();
            await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });
            await tnxPages.tnxLandingPage.handleOptionalSkipButton();
            await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
            await tnxPages.tnxLandingPage.selectOrganizationByText(CARRIER_NAME.CARRIER_1);
            pages.logger.info(
              `Priority 1 included carrier selected (CSV step 86): ${CARRIER_NAME.CARRIER_1}`
            );
          }
        );

        // ═══════════════════════════════════════════════════════════════
        // TNX BIDS + BTMS (sample-testcases 89214 steps 87–103, sequential)
        // ═══════════════════════════════════════════════════════════════

        let bidsReportCount = initialBidsCount;

        await test.step(
          "Step 12 [89214 87–88 + Expected after 88]: Plus, search load, Bid, enter amount, Bid Now",
          async () => {
            const tnxPages = await appManager.switchToTNXForLoadSearch();
            await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });
            await tnxPages.tnxLandingPage.handleOptionalSkipButton();
            await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
            await tnxPages.tnxLandingPage.clickPlusSignButton();
            await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadSearchLink();
            await tnxPages.tnxLandingPage.validateAvailableLoadsText(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadLink();
            await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.BID_BUTTON);
            await tnxPages.tnxLandingPage.enterBidAmountAndWaitForBidNow(
              INCLUDED_CARRIER_1_BID_RATE
            );
            await tnxPages.tnxLandingPage.clickBidNowWhenEnabled();
            await tnxPages.tnxLandingPage.validateTnxElementVisible(
              ALERT_PATTERNS.YOUR_BID_HAS_BEEN_PLACED
            );
            pages.logger.info(
              `Bid placed (CSV 87–88, amount > offer rate step 68): ${INCLUDED_CARRIER_1_BID_RATE}`
            );
          }
        );

        await test.step(
          "Step 13 [89214 89 + Expected after 89]: BTMS reload, Carrier tab, BIDS report +1",
          async () => {
            const btmsPages = await appManager.switchToBTMS();
            await commonReusables.reloadAndAcceptDialogs(sharedPage);
            await btmsPages.viewLoadPage.clickCarrierTab();
            await commonReusables.waitForAllLoadStates(sharedPage);
            const previousCount = bidsReportCount;
            bidsReportCount =
              await btmsPages.viewLoadCarrierTabPage.waitForBidsReportCountToIncreaseByOne(
                previousCount
              );
            pages.logger.info(
              `BIDS report incremented by 1 (CSV 89): ${previousCount} → ${bidsReportCount}`
            );
            const avgRateText = await btmsPages.viewLoadPage.getAvgRate();
            expect(avgRateText.trim().length, "Avg Rate updated for Source BIDS").toBeGreaterThan(
              0
            );
          }
        );

        await test.step(
          "Step 14 [89214 90 + Expected after 90]: Click BIDS report value — Bid Results pop-up",
          async () => {
            const btmsPages = appManager.btmsPageManager;
            await btmsPages.viewLoadCarrierTabPage.clickBidsReportValue();
            await btmsPages.viewLoadPage.validateBidResultsLaneAndMarketRatesVisible();
          }
        );

        await test.step("Step 15 [89214 91]: Close the Bid results pop-up", async () => {
          await appManager.btmsPageManager.viewLoadPage.closeBidResultsModal();
        });

        await test.step(
          "Step 16 [89214 92 + Expected after 92]: Bid History — first row (after BIDS +1 confirmed)",
          async () => {
            const btmsPages = appManager.btmsPageManager;
            const shipperEarliestDate =
              pages.commonReusables.getNextTwoDatesFormatted().tomorrow;
            await btmsPages.viewLoadCarrierTabPage.validateBidHistoryPopupWithAvgRate({
              shipDate: shipperEarliestDate,
              shipCity: testData.shipperCity,
              shipState: testData.shipperState,
              consCity: testData.consigneeCity,
              consState: testData.consigneeState,
              carrier: CARRIER_NAME.CARRIER_1,
              bidRate: INCLUDED_CARRIER_1_BID_RATE,
              totalMiles: totalMilesValue,
              equipment: DFB_BID_HISTORY_FIELDS.EQUIPMENT_1,
              source: DFB_BID_HISTORY_FIELDS.SOURCE,
              email: userSetup.tnxUser,
            });
          }
        );

        await test.step(
          "Step 17 [89214 93]: TNX — select second included carrier (Priority 2 from step 75)",
          async () => {
            const tnxPages = await appManager.switchToTNXForLoadSearch();
            await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });
            await tnxPages.tnxLandingPage.handleOptionalSkipButton();
            await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
            await tnxPages.tnxLandingPage.selectOrganizationByText(CARRIER_NAME.CARRIER_2);
            pages.logger.info(
              `Priority 2 carrier selected (CSV 93): ${CARRIER_NAME.CARRIER_2}`
            );
          }
        );

        await test.step(
          "Step 18 [89214 94 + Expected after 94]: Plus, search load, open, Bid, enter bid, Bid Now",
          async () => {
            const tnxPages = await appManager.switchToTNXForLoadSearch();
            await tnxPages.page.mouse.click(20, 400);
            await tnxPages.tnxLandingPage.clickPlusSignButton();
            await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadSearchLink();
            await tnxPages.tnxLandingPage.validateAvailableLoadsText(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadLink();
            await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.BID_BUTTON);
            await tnxPages.tnxLandingPage.enterBidAmountAndWaitForBidNow(
              INCLUDED_CARRIER_2_BID_RATE
            );
            await tnxPages.tnxLandingPage.clickBidNowWhenEnabled();
            await tnxPages.tnxLandingPage.validateTnxElementVisible(
              ALERT_PATTERNS.YOUR_BID_HAS_BEEN_PLACED
            );
          }
        );

        await test.step(
          "Step 19 [89214 95 + Expected after 95]: BTMS reload, BIDS +1, Bid Results, Bid History",
          async () => {
            const btmsPages = await appManager.switchToBTMS();
            await commonReusables.reloadAndAcceptDialogs(sharedPage);
            await btmsPages.viewLoadPage.clickCarrierTab();
            await commonReusables.waitForAllLoadStates(sharedPage);
            const previousCount = bidsReportCount;
            bidsReportCount =
              await btmsPages.viewLoadCarrierTabPage.waitForBidsReportCountToIncreaseByOne(
                previousCount
              );
            pages.logger.info(
              `BIDS report incremented by 1 (CSV 95): ${previousCount} → ${bidsReportCount}`
            );
            const avgRateText = await btmsPages.viewLoadPage.getAvgRate();
            expect(avgRateText.trim().length, "Avg Rate updated for Source BIDS").toBeGreaterThan(
              0
            );
            await btmsPages.viewLoadCarrierTabPage.clickBidsReportValue();
            await btmsPages.viewLoadPage.validateBidResultsLaneAndMarketRatesVisible();
            await btmsPages.viewLoadPage.closeBidResultsModal();
            const shipperEarliestDate =
              pages.commonReusables.getNextTwoDatesFormatted().tomorrow;
            await btmsPages.viewLoadCarrierTabPage.validateBidHistoryPopupWithAvgRate({
              shipDate: shipperEarliestDate,
              shipCity: testData.shipperCity,
              shipState: testData.shipperState,
              consCity: testData.consigneeCity,
              consState: testData.consigneeState,
              carrier: CARRIER_NAME.CARRIER_2,
              bidRate: INCLUDED_CARRIER_2_BID_RATE,
              totalMiles: totalMilesValue,
              equipment: DFB_BID_HISTORY_FIELDS.EQUIPMENT_1,
              source: DFB_BID_HISTORY_FIELDS.SOURCE,
              email: userSetup.tnxUser,
            });
          }
        );

        await test.step(
          "Step 20 [89214 96]: TNX — select third included carrier (Priority 3 from step 75)",
          async () => {
            const tnxPages = await appManager.switchToTNXForLoadSearch();
            await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });
            await tnxPages.tnxLandingPage.handleOptionalSkipButton();
            await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
            await tnxPages.tnxLandingPage.selectOrganizationByText(CARRIER_NAME.CARRIER_4);
            pages.logger.info(
              `Priority 3 carrier selected (CSV 96): ${CARRIER_NAME.CARRIER_4}`
            );
          }
        );

        await test.step(
          "Step 21 [89214 97 + Expected after 97]: Repeat bid + BTMS flow (same as steps 94–95)",
          async () => {
            const tnxPages = await appManager.switchToTNXForLoadSearch();
            await tnxPages.page.mouse.click(20, 400);
            await tnxPages.tnxLandingPage.clickPlusSignButton();
            await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadSearchLink();
            await tnxPages.tnxLandingPage.validateAvailableLoadsText(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadLink();
            await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.BID_BUTTON);
            await tnxPages.tnxLandingPage.enterBidAmountAndWaitForBidNow(
              INCLUDED_CARRIER_3_BID_RATE
            );
            await tnxPages.tnxLandingPage.clickBidNowWhenEnabled();
            await tnxPages.tnxLandingPage.validateTnxElementVisible(
              ALERT_PATTERNS.YOUR_BID_HAS_BEEN_PLACED
            );

            const btmsPages = await appManager.switchToBTMS();
            await commonReusables.reloadAndAcceptDialogs(sharedPage);
            await btmsPages.viewLoadPage.clickCarrierTab();
            await commonReusables.waitForAllLoadStates(sharedPage);
            const previousCount = bidsReportCount;
            bidsReportCount =
              await btmsPages.viewLoadCarrierTabPage.waitForBidsReportCountToIncreaseByOne(
                previousCount
              );
            pages.logger.info(
              `BIDS report incremented by 1 (CSV 97): ${previousCount} → ${bidsReportCount}`
            );
            const avgRateText = await btmsPages.viewLoadPage.getAvgRate();
            expect(avgRateText.trim().length, "Avg Rate updated for Source BIDS").toBeGreaterThan(
              0
            );
            await btmsPages.viewLoadCarrierTabPage.clickBidsReportValue();
            await btmsPages.viewLoadPage.validateBidResultsLaneAndMarketRatesVisible();
            await btmsPages.viewLoadPage.closeBidResultsModal();
            const shipperEarliestDate =
              pages.commonReusables.getNextTwoDatesFormatted().tomorrow;
            await btmsPages.viewLoadCarrierTabPage.validateBidHistoryPopupWithAvgRate({
              shipDate: shipperEarliestDate,
              shipCity: testData.shipperCity,
              shipState: testData.shipperState,
              consCity: testData.consigneeCity,
              consState: testData.consigneeState,
              carrier: CARRIER_NAME.CARRIER_4,
              bidRate: INCLUDED_CARRIER_3_BID_RATE,
              totalMiles: totalMilesValue,
              equipment: DFB_BID_HISTORY_FIELDS.EQUIPMENT_1,
              source: DFB_BID_HISTORY_FIELDS.SOURCE,
              email: userSetup.tnxUser,
            });
          }
        );

        await test.step(
          "Step 22 [89214 98]: TNX — select first non-included carrier ZOOMY TRUCKING INC",
          async () => {
            const tnxPages = await appManager.switchToTNXForLoadSearch();
            await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });
            await tnxPages.tnxLandingPage.handleOptionalSkipButton();
            await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
            await tnxPages.tnxLandingPage.selectOrganizationByText(CARRIER_NAME.CARRIER_5);
            pages.logger.info(
              `Non-included carrier 1 selected (CSV 98): ${CARRIER_NAME.CARRIER_5}`
            );
          }
        );

        await test.step(
          "Step 23 [89214 99 + Expected after 99]: Repeat bid + BTMS flow (same as steps 94–95)",
          async () => {
            const tnxPages = await appManager.switchToTNXForLoadSearch();
            await tnxPages.page.mouse.click(20, 400);
            await tnxPages.tnxLandingPage.clickPlusSignButton();
            await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadSearchLink();
            await tnxPages.tnxLandingPage.validateAvailableLoadsText(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadLink();
            await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.BID_BUTTON);
            await tnxPages.tnxLandingPage.enterBidAmountAndWaitForBidNow(
              NON_INCLUDED_CARRIER_1_BID_RATE
            );
            await tnxPages.tnxLandingPage.clickBidNowWhenEnabled();
            await tnxPages.tnxLandingPage.validateTnxElementVisible(
              ALERT_PATTERNS.YOUR_BID_HAS_BEEN_PLACED
            );

            const btmsPages = await appManager.switchToBTMS();
            await commonReusables.reloadAndAcceptDialogs(sharedPage);
            await btmsPages.viewLoadPage.clickCarrierTab();
            await commonReusables.waitForAllLoadStates(sharedPage);
            const previousCount = bidsReportCount;
            bidsReportCount =
              await btmsPages.viewLoadCarrierTabPage.waitForBidsReportCountToIncreaseByOne(
                previousCount
              );
            pages.logger.info(
              `BIDS report incremented by 1 (CSV 99): ${previousCount} → ${bidsReportCount}`
            );
            const avgRateText = await btmsPages.viewLoadPage.getAvgRate();
            expect(avgRateText.trim().length, "Avg Rate updated for Source BIDS").toBeGreaterThan(
              0
            );
            await btmsPages.viewLoadCarrierTabPage.clickBidsReportValue();
            await btmsPages.viewLoadPage.validateBidResultsLaneAndMarketRatesVisible();
            await btmsPages.viewLoadPage.closeBidResultsModal();
            const shipperEarliestDate =
              pages.commonReusables.getNextTwoDatesFormatted().tomorrow;
            await btmsPages.viewLoadCarrierTabPage.validateBidHistoryPopupWithAvgRate({
              shipDate: shipperEarliestDate,
              shipCity: testData.shipperCity,
              shipState: testData.shipperState,
              consCity: testData.consigneeCity,
              consState: testData.consigneeState,
              carrier: CARRIER_NAME.CARRIER_5,
              bidRate: NON_INCLUDED_CARRIER_1_BID_RATE,
              totalMiles: totalMilesValue,
              equipment: DFB_BID_HISTORY_FIELDS.EQUIPMENT_1,
              source: DFB_BID_HISTORY_FIELDS.SOURCE,
              email: userSetup.tnxUser,
            });
          }
        );

        await test.step(
          "Step 24 [89214 100]: TNX — select second non-included carrier SMART WAY TRANSPORT SYSTEMS LLC",
          async () => {
            const tnxPages = await appManager.switchToTNXForLoadSearch();
            await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });
            await tnxPages.tnxLandingPage.handleOptionalSkipButton();
            await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
            await tnxPages.tnxLandingPage.selectOrganizationByText(CARRIER_NAME.CARRIER_3);
            pages.logger.info(
              `Non-included carrier 2 selected (CSV 100): ${CARRIER_NAME.CARRIER_3}`
            );
          }
        );

        await test.step(
          "Step 25 [89214 101 + Expected after 101]: Repeat bid + BTMS flow (same as steps 94–95)",
          async () => {
            const tnxPages = await appManager.switchToTNXForLoadSearch();
            await tnxPages.page.mouse.click(20, 400);
            await tnxPages.tnxLandingPage.clickPlusSignButton();
            await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadSearchLink();
            await tnxPages.tnxLandingPage.validateAvailableLoadsText(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadLink();
            await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.BID_BUTTON);
            await tnxPages.tnxLandingPage.enterBidAmountAndWaitForBidNow(
              NON_INCLUDED_CARRIER_2_BID_RATE
            );
            await tnxPages.tnxLandingPage.clickBidNowWhenEnabled();
            await tnxPages.tnxLandingPage.validateTnxElementVisible(
              ALERT_PATTERNS.YOUR_BID_HAS_BEEN_PLACED
            );

            const btmsPages = await appManager.switchToBTMS();
            await commonReusables.reloadAndAcceptDialogs(sharedPage);
            await btmsPages.viewLoadPage.clickCarrierTab();
            await commonReusables.waitForAllLoadStates(sharedPage);
            const previousCount = bidsReportCount;
            bidsReportCount =
              await btmsPages.viewLoadCarrierTabPage.waitForBidsReportCountToIncreaseByOne(
                previousCount
              );
            pages.logger.info(
              `BIDS report incremented by 1 (CSV 101): ${previousCount} → ${bidsReportCount}`
            );
            const avgRateText = await btmsPages.viewLoadPage.getAvgRate();
            expect(avgRateText.trim().length, "Avg Rate updated for Source BIDS").toBeGreaterThan(
              0
            );
            await btmsPages.viewLoadCarrierTabPage.clickBidsReportValue();
            await btmsPages.viewLoadPage.validateBidResultsLaneAndMarketRatesVisible();
            await btmsPages.viewLoadPage.closeBidResultsModal();
            const shipperEarliestDate =
              pages.commonReusables.getNextTwoDatesFormatted().tomorrow;
            await btmsPages.viewLoadCarrierTabPage.validateBidHistoryPopupWithAvgRate({
              shipDate: shipperEarliestDate,
              shipCity: testData.shipperCity,
              shipState: testData.shipperState,
              consCity: testData.consigneeCity,
              consState: testData.consigneeState,
              carrier: CARRIER_NAME.CARRIER_3,
              bidRate: NON_INCLUDED_CARRIER_2_BID_RATE,
              totalMiles: totalMilesValue,
              equipment: DFB_BID_HISTORY_FIELDS.EQUIPMENT_1,
              source: DFB_BID_HISTORY_FIELDS.SOURCE,
              email: userSetup.tnxUser,
            });
          }
        );

        await test.step(
          "Step 26 [89214 102]: TNX — select third non-included carrier 18 KING TRUCKING LLC",
          async () => {
            const tnxPages = await appManager.switchToTNXForLoadSearch();
            await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });
            await tnxPages.tnxLandingPage.handleOptionalSkipButton();
            await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
            await tnxPages.tnxLandingPage.selectOrganizationByText(CARRIER_NAME.CARRIER_18_KING);
            pages.logger.info(
              `Non-included carrier 3 selected (CSV 102): ${CARRIER_NAME.CARRIER_18_KING}`
            );
          }
        );

        await test.step(
          "Step 27 [89214 103 + Expected after 103]: Repeat bid + BTMS flow (same as steps 94–95)",
          async () => {
            const tnxPages = await appManager.switchToTNXForLoadSearch();
            await tnxPages.page.mouse.click(20, 400);
            await tnxPages.tnxLandingPage.clickPlusSignButton();
            await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadSearchLink();
            await tnxPages.tnxLandingPage.validateAvailableLoadsText(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadLink();
            await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.BID_BUTTON);
            await tnxPages.tnxLandingPage.enterBidAmountAndWaitForBidNow(
              NON_INCLUDED_CARRIER_3_BID_RATE
            );
            await tnxPages.tnxLandingPage.clickBidNowWhenEnabled();
            await tnxPages.tnxLandingPage.validateTnxElementVisible(
              ALERT_PATTERNS.YOUR_BID_HAS_BEEN_PLACED
            );

            const btmsPages = await appManager.switchToBTMS();
            await commonReusables.reloadAndAcceptDialogs(sharedPage);
            await btmsPages.viewLoadPage.clickCarrierTab();
            await commonReusables.waitForAllLoadStates(sharedPage);
            const previousCount = bidsReportCount;
            bidsReportCount =
              await btmsPages.viewLoadCarrierTabPage.waitForBidsReportCountToIncreaseByOne(
                previousCount
              );
            pages.logger.info(
              `BIDS report incremented by 1 (CSV 103): ${previousCount} → ${bidsReportCount}`
            );
            const avgRateText = await btmsPages.viewLoadPage.getAvgRate();
            expect(avgRateText.trim().length, "Avg Rate updated for Source BIDS").toBeGreaterThan(
              0
            );
            await btmsPages.viewLoadCarrierTabPage.clickBidsReportValue();
            await btmsPages.viewLoadPage.validateBidResultsLaneAndMarketRatesVisible();
            await btmsPages.viewLoadPage.closeBidResultsModal();
            const shipperEarliestDate =
              pages.commonReusables.getNextTwoDatesFormatted().tomorrow;
            await btmsPages.viewLoadCarrierTabPage.validateBidHistoryPopupWithAvgRate({
              shipDate: shipperEarliestDate,
              shipCity: testData.shipperCity,
              shipState: testData.shipperState,
              consCity: testData.consigneeCity,
              consState: testData.consigneeState,
              carrier: CARRIER_NAME.CARRIER_18_KING,
              bidRate: NON_INCLUDED_CARRIER_3_BID_RATE,
              totalMiles: totalMilesValue,
              equipment: DFB_BID_HISTORY_FIELDS.EQUIPMENT_1,
              source: DFB_BID_HISTORY_FIELDS.SOURCE,
              email: userSetup.tnxUser,
            });
          }
        );
      }
    );
  }
);
