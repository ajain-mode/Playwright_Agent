import { expect, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import commonReusables from "@utils/commonReusables";

/**
 * Test Case: DFB-89179 - Match a load that is manually posted to the TNX by an included carrier on a waterfall:
 * @author Deepak Bohra
 * @date 11-Dec-2025
 */

const testcaseID = "DFB-89179";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);
let cargoValue: string;
let loadNumber: string;
let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let pages: PageManager;
let totalMiles: string;
let offerRateValue: string;
test.describe.configure({ retries: 1 });
test.describe
  .serial("Match a load that is manually posted to the TNX by an included carrier on a waterfall:", () => {
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
    "Case Id: 89179 - Should able to match on TNX by an included carrier on a waterfall.",
    {
      tag: "@dfb,@tporegression,@waterfall,@smoke,@manualposting",
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes
      // Use shared appManager and pages
      const toggleSettingsValue = pages.toggleSettings.enable_DME;
      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });
      await test.step("Pre-Conditions setup for creating a load", async () => {
        cargoValue = await pages.dfbHelpers.setupDFBTestPreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.verifyAutoPost, // ← Now passed as argument
          testData.salesAgent,
          testData.customerName,
          CARGO_VALUES.DEFAULT,
          LOAD_TYPES.CREATE_TL_NEW,
          false,
          true
        );
      });
      await test.step("Create a Non-Tabular Load", async () => {
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
      });
      await test.step("Click on Create Load Button and verify navigation to Edit Load page", async () => {
        await pages.nonTabularLoadPage.clickCreateLoadButton();
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.editLoadPage.validateEditLoadHeadingText();
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        console.log(
          "Load created successfully and navigated to Edit Load page"
        );
      });

      await test.step("Verify default field values and placeholders after creating a load in edit mode", async () => {
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(`Load Number: ${loadNumber}`);
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.viewLoadCarrierTabPage.getBidsReportValue();
        await pages.dfbLoadFormPage.performCompleteLoadValidation(
          cargoValue,
          COUNTRY.USA
        );
      });

      await test.step("Enter offer rate, save, and validate DFB form state in view mode", async () => {
        const result = await dfbHelpers.enterOfferRateSaveAndValidate(pages, {
          offerRate: TNX.OFFER_RATE,
          includeCarriers: [CARRIER_NAME.CARRIER_1],
          carriersData: [
            {
              name: CARRIER_NAME.CARRIER_1,
              values: [
                PRIORITY.PRIORITY_1,
                CARRIER_TIMING.TIMING_1, // or TIMING_1 depending on spec
                LOAD_OFFER_RATES.OFFER_RATE_1,
              ],
            },
          ],
          clickSave: true,
          validatePostBefore: LOAD_STATUS.NOT_POSTED,
          clickPost: true,
          validatePostAfter: LOAD_STATUS.POSTED,
          expectedValues: {
            offerRate: TNX.OFFER_RATE,
            expirationDate:
              pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
            expirationTime: testData.shipperLatestTime,
          },
          formState: {
            includeCarriers: [CARRIER_NAME.CARRIER_1],
            emailNotification: testData.saleAgentEmail,
          },
          notEditableFields: [
            DFB_FORM_FIELDS.Email_Notification,
            DFB_FORM_FIELDS.Expiration_Date,
            DFB_FORM_FIELDS.Expiration_Time,
            DFB_FORM_FIELDS.Commodity,
            DFB_FORM_FIELDS.NOTES,
            DFB_FORM_FIELDS.Exclude_Carriers,
          ],
          editableFields: [DFB_FORM_FIELDS.Include_Carriers],
          mixedButtonStatesAfter: {
            [DFB_Button.Post]: false,
            [DFB_Button.Clear_Form]: false,
            [DFB_Button.Create_Rule]: true,
            [DFB_Button.Cancel]: true,
          },
          sharedPage,
          shipperZip: testData.shipperZip,
          consigneeZip: testData.consigneeZip,
          equipmentType: testData.equipmentType,
          loadMethod: testData.loadMethod,
        });
        totalMiles = result.totalMiles || "";
        console.log("Total Miles from helper:", totalMiles);
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

      await test.step("Open TNX application and perform matching", async () => {
        // Switch to TNX application (initializes if needed)
        const tnxPages = await appManager.switchToTNX();

        // Set viewport specifically for TNX to 1920 dimensions
        await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });

        try {
          console.log("Performing TNX operations...");
          await tnxPages.tnxLandingPage.selectOrganizationByText(
            TNX.CARRIER_NAME
          );
          await tnxPages.tnxLandingPage.handleOptionalSkipButton();
          await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
          await tnxPages.tnxLandingPage.clickPlusSignButton();
          await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
          await tnxPages.tnxLandingPage.clickLoadSearchLink();
          await tnxPages.tnxLandingPage.validateAvailableLoadsText(loadNumber);
          offerRateValue =
            await tnxPages.tnxLandingPage.getLoadOfferRateValue();

          offerRateValue = offerRateValue.includes(".")
            ? offerRateValue
            : `${offerRateValue}.00`;

          // Normalize both actual and expected to two decimals for comparison
          console.log(`Offer Rate fetched from TNX: ${offerRateValue}`);
          const normActual = await pages.commonReusables.normalizeRate(
            offerRateValue
          );
          console.log;
          const normExpected = await pages.commonReusables.normalizeRate(
            `$${LOAD_OFFER_RATES.OFFER_RATE_1}`
          );
          await expect(normActual).toEqual(normExpected);
          console.log(
            `✅ TNX operations completed successfully for carrier: ${TNX.CARRIER_NAME} with Offer Rate: ${normActual}`
          );

          await tnxPages.tnxLandingPage.clickLoadLink();
          await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.MATCH_NOW);
          await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.YES_BUTTON);
          await tnxPages.tnxLandingPage.validateTnxElementVisible(
            TNX.CONGRATS_MESSAGE
          );
          await tnxPages.tnxCarrierTenderPage.validateMatchSuccessToast();
          await tnxPages.tnxCarrierTenderPage.waitForMatchSuccessToastToDisappear();
          // Use headless-optimized validation for execution notes
          await tnxPages.tnxExecutionTenderPage.validateExecutionNotesFieldsPresence();

          console.log("✅ TNX operations completed successfully");
        } catch (error) {
          console.error("❌ Error in TNX operations:", error);
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
        await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
        await pages.viewLoadCarrierTabPage.validateBidHistoryFirstRow({
          carrier: testData.Carrier,
          bidRate: offerRateValue,
          shipCity: testData.shipperCity,
          shipState: testData.shipperState,
          consCity: testData.consigneeCity,
          consState: testData.consigneeState,
          timestamp: pages.commonReusables.formattedDateTime,
          email: userSetup.tnxUser,
          totalMiles: totalMiles,
          shipDate: commonReusables.getNextTwoDatesFormatted().tomorrow,
          equipment: DFB_BID_HISTORY_FIELDS.EQUIPMENT_1,
          source: DFB_BID_HISTORY_FIELDS.SOURCE,
        });

        await btmsPages.viewLoadCarrierTabPage.validateCarrierLinkText(
          TNX.CARRIER_NAME
        );
        await btmsPages.viewLoadCarrierTabPage.validateCarrierDispatchName(
          TNX.CARRIER_DISPATCH_NAME
        );
        await btmsPages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(
          userSetup.tnxUser
        );

        // Cleanup: Close all secondary applications
        await appManager.closeAllSecondaryPages();
        console.log("Test cleanup completed");
      });

      // Cleanup: Close all secondary applications
      await appManager.closeAllSecondaryPages();
      console.log("Test cleanup completed");
    }
  );
});
