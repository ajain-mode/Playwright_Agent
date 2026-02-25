import { test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";

/**
 * Test Case: DFB-61697 - Post a load to the TNX for:- each carrier on a waterfall that has been configured on the load- other non-included carriers after the completion of the waterfall - offer rate on waterfall(Load create through the Tabular form)
 * @author Parth Rastogi
 * @date 25-Nov-2025
 */

const testcaseID = "DFB-61697";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);
let cargoValue: string;
let loadNumber: string;
let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let pages: PageManager;
let totalMiles: string;
let dynamicCarrierCount: number; // Add this to store carrier count
let tnxRepPages: PageManager;
test.describe.configure({ retries: 1 });
test.describe("Post a load to the TNX for:- each carrier on a waterfall that has been configured on the load- other non-included carriers after the completion of the waterfall - offer rate on waterfall(Load create through the Tabular form).", () => {
  test.beforeAll(async ({ browser }) => {
    // Create shared context and page that will persist across tests
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    appManager = new MultiAppManager(sharedContext, sharedPage);
    pages = appManager.btmsPageManager;
  });
  test.afterAll(async () => {
    // Cleanup after all tests
    if (appManager) {
      await appManager.closeAllSecondaryPages();
    }
    if (sharedContext) {
      await sharedContext.close();
    }
  });
  test(
    "Case Id: 61697 - Post a load to the TNX for:- each carrier on a waterfall that has been configured on the load- other non-included carriers after the completion of the waterfall - offer rate on waterfall(Load create through the Tabular form).",
    { tag: "@smoke,@dfb,@tporegression,@autoposting,@offerrateonwaterfall" },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes
      // Use shared appManager and pages
      const toggleSettingsValue = pages.toggleSettings.enabledAutoPost;
      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });
      await test.step("Pre-Conditions setup for creating a load", async () => {
        cargoValue = await pages.dfbHelpers.setupDFBTestPreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.enabledAutoPost, // ← Now passed as argument
          testData.salesAgent,
          testData.customerName,
          CARGO_VALUES.DEFAULT,
          LOAD_TYPES.NEW_LOAD_TL,
          false,
          true
        );
      });

      await test.step("Enter the details for Load Tab", async () => {
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.viewLoadPage.getSelectedLoadStatusText(LOAD_STATUS.ACTIVE);

        pages.logger.info("Load Tab details entered successfully");
      });

      await test.step("Enter the details for Pick Tab", async () => {
        await pages.editLoadPage.clickOnTab(TABS.PICK);
        await pages.editLoadPickTabPage.enterCompletePickTabDetails(testData);
        pages.logger.info("Pick Tab details entered successfully");
      });

      await test.step("Enter the details for Drop Tab", async () => {
        await pages.editLoadPage.clickOnTab(TABS.DROP);
        await pages.editLoadDropTabPage.enterCompleteDropTabDetails(
          testData.consigneeName,
          pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
          testData.consigneeEarliestTime,
          pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
          testData.consigneeLatestTime
        );
        pages.logger.info("Drop Tab details entered successfully");
      });

      await test.step("Enter the details for Carrier Tab", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);

        await pages.editLoadCarrierTabPage.enterCompleteCarrierTabDetails(
          testData.equipmentType,
          testData.trailerLength
        );
        pages.logger.info("Carrier Tab details entered successfully");
      });

      await test.step("Click on Create Load Button and verify navigation to Edit Load page", async () => {
        await pages.editLoadLoadTabPage.clickCreateLoadButton();
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(`Load Number: ${loadNumber}`);
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        pages.logger.info(
          "Load created successfully and navigated to Edit Load page"
        );
      });

      await test.step("Verify default field values and placeholders after creating a load in edit mode for US Location", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.viewLoadCarrierTabPage.getBidsReportValue();
        await pages.dfbLoadFormPage.performCompleteLoadValidation(
          cargoValue,
          COUNTRY.USA
        );
      });

      await test.step("Enter offer rate, save, and validate DFB form state in view mode", async () => {
        await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([
          CARRIER_NAME.CARRIER_1,
          CARRIER_NAME.CARRIER_2,
          CARRIER_NAME.CARRIER_3,
        ]);

        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.viewLoadPage.clickIncludeCarriersViewDetailsLink();

        await test.step("Update multiple carriers in loop", async () => {
          const carriersData = [
            {
              name: CARRIER_NAME.CARRIER_1,
              values: [
                PRIORITY.PRIORITY_1,
                CARRIER_TIMING.TIMING_4,
                LOAD_OFFER_RATES.OFFER_RATE_1,
              ],
            },
            {
              name: CARRIER_NAME.CARRIER_2,
              values: [
                PRIORITY.PRIORITY_2,
                CARRIER_TIMING.TIMING_1,
                LOAD_OFFER_RATES.OFFER_RATE_2,
              ],
            },
            {
              name: CARRIER_NAME.CARRIER_3,
              values: [
                PRIORITY.PRIORITY_3,
                CARRIER_TIMING.TIMING_1,
                LOAD_OFFER_RATES.OFFER_RATE_3,
              ],
            },
          ];

          // Set dynamic carrier count based on actual carriersData length
          dynamicCarrierCount = carriersData.length;
          console.log(` Dynamic carrier count set to: ${dynamicCarrierCount}`);

          for (const carrier of carriersData) {
            await pages.dfbIncludeCarriersDataModalWaterfall.clickCarrierPencilIconsAndInputValues(
              carrier.name,
              ...carrier.values // Spread operator to pass array as individual arguments
            );
          }
        });
        await pages.dfbIncludeCarriersDataModalWaterfall.clickPostAllCarrierCheckbox();
        await pages.dfbIncludeCarriersDataModalWaterfall.enterWaterfallOfferRate(
          TNX.OFFER_RATE
        );
        await pages.dfbIncludeCarriersDataModalWaterfall.clickIncludeCarriersDataSaveButton();

        await pages.editLoadFormPage.clickOnSaveBtn();

        await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);
        await pages.viewLoadPage.validateViewLoadHeading();
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        totalMiles = await pages.editLoadFormPage.getTotalMilesValue();
        console.log(`Total Miles: ${totalMiles}`);
        const expectedValues = {
          offerRate: TNX.OFFER_RATE,
          expirationDate:
            pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
          expirationTime: testData.shipperLatestTime,
        };
        await pages.dfbLoadFormPage.validateDFBTextFieldHaveExpectedValues(
          expectedValues
        );
        await pages.dfbLoadFormPage.validateFormFieldsState({
          includeCarriers: [
            CARRIER_NAME.CARRIER_1,
            CARRIER_NAME.CARRIER_2,
            CARRIER_NAME.CARRIER_3,
          ],
          emailNotification: testData.saleAgentEmail,
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

        await pages.dfbLoadFormPage.validateMixedButtonStates({
          [DFB_Button.Create_Rule]: true,
          [DFB_Button.Cancel]: true,
          [DFB_Button.Post]: false,
        });
        // TODO: Add hover and tooltip validation when functions are implemented
        await pages.dfbLoadFormPage.hoverOverPostedIcon();
        await pages.dfbLoadFormPage.validateTableFields(sharedPage, {
          "Origin Zip": testData.shipperZip,
          "Destination Zip": testData.consigneeZip,
          "Offer Rate": `$${TNX.OFFER_RATE}`,
          Equipment: testData.equipmentType,
          "Load Method": testData.loadMethod,
        });
      });

      await test.step("Open DME application and perform operations", async () => {
        // Switch to DME application (initializes if needed)
        const dmePages = await appManager.switchToDME();

        try {
          console.log("Performing DME operations...");
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
          console.log("✅ DME operations completed successfully");
        } catch (error) {
          console.error("❌ Error in DME operations:", error);
          throw error;
        }
      });

      await test.step("Open TNX Rep application and perform matching", async () => {
        // Switch to TNX Rep application (initializes if needed)
        tnxRepPages = await appManager.switchToTNXRep(); // Assign to the global variable

        // Set viewport specifically for TNX Rep to 1920 dimensions
        await appManager.tnxRepPage.setViewportSize({
          width: 1920,
          height: 1080,
        });
        try {
          await tnxRepPages.tnxRepLandingPage.selectOrganizationByText(
            TNX.CARRIER_NAME_1
          );
          await tnxRepPages.tnxRepLandingPage.handleOptionalSkipButton();
          await tnxRepPages.tnxRepLandingPage.enterLoadIdFilterValue(
            loadNumber
          );
          await tnxRepPages.tnxRepLandingPage.validateLoadRowsBasedOnCarrierCount(
            dynamicCarrierCount,
            loadNumber,

            [
              CARRIER_NAME.CARRIER_1,
              CARRIER_NAME.CARRIER_2,
              CARRIER_NAME.CARRIER_3,
            ],
            [
              LOAD_OFFER_RATES.OFFER_RATE_1,
              LOAD_OFFER_RATES.OFFER_RATE_2,
              LOAD_OFFER_RATES.OFFER_RATE_3,
            ]
          );

          await tnxRepPages.tnxRepLandingPage.validateNonIncludedCarrierRowWaterfall(
            [
              { name: CARRIER_NAME.CARRIER_4, offerRate: TNX.OFFER_RATE },
              { name: CARRIER_NAME.CARRIER_5, offerRate: TNX.OFFER_RATE },
              { name: CARRIER_NAME.CARRIER_7, offerRate: TNX.OFFER_RATE },
            ],
            loadNumber
          );

          console.log("✅ TNX Rep operations completed successfully");
        } catch (error) {
          console.error("❌ Error in TNX Rep operations:", error);
          throw error;
        }
      });
    }
  );

  test(
    "Case Id: 89182 -Match a load that is automatically  posted to the TNX by an included carrier on a waterfall:- Post to all Carriers upon completion of the Waterfall- Offer Rate on the waterfallNumber of included carriers(Priority 2 carrier is matched)).",
    {
      tag: "@dfb,@tporegression,@offerrateonwaterfall,@smoke,@autoposting",
    },
    async () => {
      await test.step("Open TNX Rep application and perform matching", async () => {
        try {
          await tnxRepPages.tnxRepLandingPage.clickOnCarrierForBidding(
            PRIORITY.PRIORITY_3
          );

          await tnxRepPages.tnxRepLandingPage.clickTnxBiddingButton(TNX.MATCH);
          await tnxRepPages.tnxRepLandingPage.clickTnxBiddingButton(
            TNX.YES_BUTTON
          );
          await tnxRepPages.tnxRepLandingPage.validateTnxElementVisible(
            TNX.CONGRATS_MESSAGE
          );

          console.log("✅ TNX Rep operations completed successfully");
        } catch (error) {
          console.error("❌ Error in TNX Rep operations:", error);
          throw error;
        }
      });

      await test.step("Switch to DME, validate final load status", async () => {
        // Switch back to DME for final validation
        const dmePages = await appManager.switchToDME();
        await dmePages.dmeDashboardPage.searchLoad(loadNumber);
        await dmePages.dmeLoadPage.validateSingleTableRowPresent();
        await dmePages.dmeLoadPage.validateAndGetSourceIdText(loadNumber);
        await dmePages.dmeLoadPage.validateAndGetStatusTextWithRetry(
          LOAD_STATUS.BTMS_CANCELLED,
          LOAD_STATUS.TNX_BOOKED,
          loadNumber,
          dmePages.dmeDashboardPage
        );
      });

      await test.step("Refresh BTMS page and validate final load status", async () => {
        // Switch back to BTMS for final validation
        const btmsPages = await appManager.switchToBTMS();
        await btmsPages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.MATCHED);
        await appManager.btmsPage.reload();
        await btmsPages.viewLoadPage.validateLoadStatus(LOAD_STATUS.BOOKED);
        await btmsPages.editLoadCarrierTabPage.clickOnCarrierTab();
        await btmsPages.viewLoadCarrierTabPage.validateBidsReportValue();
        await btmsPages.commonReusables.getCurrentDateTime();
        await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks(
          TNX.BID_HISTORY
        );

        const offerRateData = pages.commonReusables.formatToCurrency(LOAD_OFFER_RATES.OFFER_RATE_2);
        
        await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
        await pages.viewLoadCarrierTabPage.validateBidHistoryFirstRow({
          carrier: CARRIER_NAME.CARRIER_9,
          bidRate: offerRateData,
          shipCity: testData.shipperCity,
          shipState: testData.shipperState,
          consCity: testData.consigneeCity,
          consState: testData.consigneeState,
          timestamp: pages.commonReusables.formattedDateTime,
          email: userSetup.tnxRepUser,
          totalMiles: totalMiles,
          shipDate: commonReusables.getNextTwoDatesFormatted().tomorrow,
          equipment: DFB_BID_HISTORY_FIELDS.EQUIPMENT_1,
          source: DFB_BID_HISTORY_FIELDS.SOURCE,
        });

        await btmsPages.viewLoadCarrierTabPage.validateCarrierLinkText(
          CARRIER_NAME.CARRIER_2
        );
        await btmsPages.viewLoadCarrierTabPage.validateCarrierDispatchName(
          TNX.CARRIER_DISPATCH_NAME_1
        );
        await btmsPages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(
          userSetup.tnxRepUser
        );

        // Cleanup: Close all secondary applications
        await appManager.closeAllSecondaryPages();
        console.log("Test cleanup completed");
      });
    }
  );
});
