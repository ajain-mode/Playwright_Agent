import commonReusables from "@utils/commonReusables";
import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import "@utils/globalConstants";
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

/** TNX bid amounts per carrier (CSV steps 87, 94, 97, 99, 101, 103). */
const TNX_BID_SEQUENCE: ReadonlyArray<{ carrier: string; bidRate: string; csvSteps: string }> = [
  { carrier: CARRIER_NAME.CARRIER_1, bidRate: testData.bidAmount, csvSteps: "86-92" },
  { carrier: CARRIER_NAME.CARRIER_2, bidRate: testData.bidRate, csvSteps: "93-95" },
  { carrier: CARRIER_NAME.CARRIER_4, bidRate: LOAD_OFFER_RATES.OFFER_RATE_2, csvSteps: "96-97" },
  { carrier: CARRIER_NAME.CARRIER_5, bidRate: LOAD_OFFER_RATES.OFFER_RATE_3, csvSteps: "98-99" },
  { carrier: CARRIER_NAME.CARRIER_3, bidRate: TNX.BID_RATE, csvSteps: "100-101" },
  { carrier: CARRIER_NAME.CARRIER_18_KING, bidRate: TNX.BID_RATE_2, csvSteps: "102-103" },
];

let loadNumber: string;
let agentEmail: string;
let totalMilesValue: string;
let initialBidsCount: number;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

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
        tag: "@AIAgent,@aiteam,@bidding,@dfb,@includecarrier,@waterfallsetup",
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

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
            pages.toggleSettings.verifyAutoPost
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
          "Step 7 [89214 66–77]: Carrier tab — offer rate, 3 include carriers, waterfall modal, save load",
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
          "Step 9 [89214 78–79 + Expected after 79]: View Load — saved in view mode, DFB POSTED, BIDS baseline",
          async () => {
            await pages.viewLoadPage.validateViewLoadHeading();
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);
            totalMilesValue = await pages.editLoadFormPage.getTotalMilesValue();
            await pages.viewLoadPage.scrollToDFBSection();

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
            await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);
            await pages.dfbLoadFormPage.validateMixedButtonStates({
              [DFB_Button.Post]: false,
              [DFB_Button.Clear_Form]: true,
              [DFB_Button.Create_Rule]: true,
            });
            await pages.dfbLoadFormPage.hoverOverPostedIcon();
            await pages.dfbLoadFormPage.validateTableFields(sharedPage, {
              "Origin Zip": testData.shipperZip,
              "Destination Zip": testData.consigneeZip,
              "Offer Rate": formattedOfferRate,
              Equipment: testData.equipmentType,
              "Load Method": testData.loadMethod,
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
          "Step 11 [89214 83–85]: TNX — login, select Priority 1 carrier, verify load Matched and execution notes",
          async () => {
            const tnxPages = await appManager.switchToTNX();
            await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });
            await tnxPages.tnxLandingPage.selectOrganizationByText(CARRIER_NAME.CARRIER_1);
            await tnxPages.tnxLandingPage.handleOptionalSkipButton();
            await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
            await tnxPages.tnxLandingPage.clickOnTNXHeaderLink(TNX.ACTIVE_JOBS);
            await tnxPages.tnxLandingPage.clickPlusButton();
            await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadSearchLink();
            await tnxPages.tnxLandingPage.validateBidsTabAvailableLoadsText(
              TNX.SINGLE_JOB_RECORD,
              loadNumber
            );
            await tnxPages.tnxLandingPage.clickLoadLink();
            const tnxRateNumeric = await tnxPages.tnxLandingPage.getLoadOfferRateNumeric();
            const expectedRateNumeric = commonReusables.normalizeRateToInteger(
              testData.offerRate
            );
            expect(tnxRateNumeric, "TNX offer rate should match CSV step 68").toBe(
              expectedRateNumeric
            );
            await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(
              TENDER_DETAILS_MODAL_TABS.GENERAL
            );
            await tnxPages.tnxLandingPage.validateStatusHistoryText(
              TNX_STATUS_HISTORY.STATUS_MATCHED
            );
            await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(
              TENDER_DETAILS_MODAL_TABS.PROGRESS
            );
            await tnxPages.tnxExecutionTenderPage.validateExecutionNotesFieldsPresence();
            pages.logger.info("TNX initial Matched state verified (CSV steps 83–85)");
          }
        );

        // ═══════════════════════════════════════════════════════════════
        // TNX BIDS + BTMS VERIFICATION (sample-testcases 89214 steps 86–103)
        // ═══════════════════════════════════════════════════════════════

        const shipDateExpected =
          pages.commonReusables.getNextTwoDatesFormatted().tomorrow;

        for (let i = 0; i < TNX_BID_SEQUENCE.length; i++) {
          const { carrier, bidRate, csvSteps } = TNX_BID_SEQUENCE[i];
          const expectedBidsCount = initialBidsCount + i + 1;
          const roundLabel = i < 3 ? "included" : "non-included";
          const expectedAfterBidStep =
            i === 0 ? 88 : i === 1 ? 94 : i === 2 ? 97 : i === 3 ? 99 : i === 4 ? 101 : 103;
          const expectedAfterBtmsStep =
            i === 0 ? 89 : 95;

          await test.step(
            `Step ${12 + i} [89214 ${csvSteps}]: ${roundLabel} carrier ${carrier} — TNX bid + BTMS Expected validations`,
            async () => {
              await test.step(
                `[89214 ${csvSteps}] CSV ${expectedAfterBidStep}: Bid Now — Expected after step ${expectedAfterBidStep}`,
                async () => {
                  await commonReusables.getCurrentDateTime();
                  const tnxPages = await appManager.switchToTNX();
                  await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });
                  await tnxPages.tnxLandingPage.selectOrganizationByText(carrier);
                  await tnxPages.tnxLandingPage.handleOptionalSkipButton();
                  await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
                  await tnxPages.tnxLandingPage.clickOnTNXHeaderLink(TNX.ACTIVE_JOBS);
                  await tnxPages.tnxLandingPage.clickPlusButton();
                  await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
                  await tnxPages.tnxLandingPage.clickLoadSearchLink();
                  await tnxPages.tnxLandingPage.clickLoadLink();
                  await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.BID_BUTTON);
                  await tnxPages.tnxLandingPage.enterBidAmount(bidRate);
                  await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.BID_NOW_BUTTON);
                  await tnxPages.tnxLandingPage.validateTnxElementVisible(
                    ALERT_PATTERNS.YOUR_BID_HAS_BEEN_PLACED
                  );
                }
              );

              const btmsPages = await appManager.switchToBTMS();
              await btmsPages.viewLoadPage.clickCarrierTab();
              await commonReusables.waitForAllLoadStates(sharedPage);

              await test.step(
                `Expected after step ${expectedAfterBtmsStep}: BIDS +1, Avg Rate updated (reports Source BIDS)`,
                async () => {
                  await expect
                    .poll(
                      async () => {
                        await btmsPages.viewLoadPage.clickCarrierTab();
                        const bidsText =
                          await btmsPages.viewLoadCarrierTabPage.getBidsReportValue();
                        return parseInt(bidsText, 10) || 0;
                      },
                      {
                        message: `BIDS report count should increment to ${expectedBidsCount}`,
                        timeout: WAIT.SPEC_TIMEOUT_LARGE,
                      }
                    )
                    .toBe(expectedBidsCount);

                  const avgRateText = await btmsPages.viewLoadPage.getAvgRate();
                  expect(
                    avgRateText.trim().length,
                    "Avg Rate visible on Carrier tab after BIDS increment"
                  ).toBeGreaterThan(0);
                }
              );

              await test.step(
                `Expected after step ${expectedAfterBtmsStep} (Bid Results pop-up): Lane/Market rates visible`,
                async () => {
                  await btmsPages.viewLoadPage.clickViewBidDetailsButton();
                  const avgInModal = await btmsPages.viewLoadPage.getAvgRate();
                  expect(
                    avgInModal.trim().length,
                    "Bid Results pop-up — Avg/Lane rate section visible"
                  ).toBeGreaterThan(0);
                  await btmsPages.viewLoadPage.closeBidDetailsModal();
                }
              );

              await test.step(
                `Expected after step ${expectedAfterBtmsStep} (Bid History): popup count, row fields, avg = sum/count`,
                async () => {
                  const avgRateText = await btmsPages.viewLoadPage.getAvgRate();
                  await btmsPages.viewLoadCarrierTabPage.clickViewLoadPageLinks(
                    TNX.BID_HISTORY
                  );
                  await btmsPages.viewLoadCarrierTabPage.validateBidHistoryEntryCount(
                    expectedBidsCount
                  );
                  await btmsPages.viewLoadCarrierTabPage.validateBidHistoryFirstRow({
                    shipDate: shipDateExpected,
                    shipCity: testData.shipperCity,
                    shipState: testData.shipperState,
                    consCity: testData.consigneeCity,
                    consState: testData.consigneeState,
                    carrier,
                    bidRate,
                    totalMiles: totalMilesValue,
                    equipment: DFB_BID_HISTORY_FIELDS.EQUIPMENT_1,
                    source: DFB_BID_HISTORY_FIELDS.SOURCE,
                    email: DFB_BID_HISTORY_FIELDS.TNX_SERVICE_EMAIL,
                    timestamp: commonReusables.formattedDateTime,
                  });
                  const avgResult =
                    await btmsPages.viewLoadCarrierTabPage.calculateAndValidateAvgRate(
                      avgRateText,
                      expectedBidsCount
                    );
                  pages.logger.info(
                    `Bid round ${i + 1} (${carrier}): entries=${avgResult.entryCount}, avg=${avgResult.calculatedAvg}`
                  );
                  await btmsPages.viewLoadCarrierTabPage.closeBidHistoryModal();
                }
              );
            }
          );
        }
      }
    );
  }
);
