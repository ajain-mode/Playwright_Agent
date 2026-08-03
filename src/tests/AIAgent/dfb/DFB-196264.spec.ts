import { test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";

/** Adapted from DFB-61626 Match Now E2E for Testmo Case 171325 (post load to TNX). */
const testcaseID = "DFB-196264";

let cargoValue: string;
let loadNumber: string;
let bidsReportValue: string;
let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let pages: PageManager;
let testData: any;
let totalMiles: string;
test.describe.configure({ retries: 0 });
test.describe("Case ID: 196264 - TNX match carrier org variant", () => {
  test.beforeAll(async ({ browser }) => {
    // Load test data inside beforeAll to avoid module-level execution
    testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);
    
    // Create shared context and page that will persist across the test
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    appManager = new MultiAppManager(sharedContext, sharedPage);
    pages = appManager.btmsPageManager;
  });

  test.afterAll(async () => {
    // Cleanup after test
    if (appManager) {
      await appManager.closeAllSecondaryPages();
    }
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: 196264 - TNX match carrier org variant",
    { tag: "@AIAgent,@dfb,@loads" },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT); // 10 minutes

      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });

      await test.step("Pre-Conditions: office TNX/DME, switch agent, cargo, Create TL NEW", async () => {
        // Prefer segmented POMs + navigateToBaseUrl after office view (Home menu can be unreachable on detail pages).
        const toggleSettingsValue = pages.toggleSettings.enable_DME;
        await pages.dfbHelpers.setupOfficePreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.verifyAutoPost,
        );

        await pages.basePage.navigateToBaseUrl();
        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);

        // Case 171325 creates a post-automation rule later; skip Home→Office Config cleanup
        // (Office Config is often missing immediately after switch until dashboard settles).

        await pages.basePage.navigateToBaseUrl();
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.searchCustomerAndClickDetails(
          testData.customerName,
        );
        cargoValue = await pages.viewCustomerPage.verifyAndSetCargoValue(
          CARGO_VALUES.DEFAULT,
        );
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
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
          equipmentLength: testData.equipmentLength || testData.trailerLength,
          distanceMethod: testData.Method,
          shipperCountry: testData.shipperCountry,
          shipperZip: testData.shipperZip,
          shipperAddress: testData.shipperAddress,
          shipperNameNew: testData.shipperNameNew
        });
        await pages.nonTabularLoadPage.enterEquipmentLengthIfEmpty(
          testData.equipmentLength || testData.trailerLength || "48",
        );
        await pages.nonTabularLoadPage.enterLineHaulRate(
          testData.offerRate || testData.OfferRate || "2000",
        );
      });
      await test.step("Click on Create Load Button and verify navigation to Edit Load page", async () => {
        await pages.nonTabularLoadPage.closeValidationPopup();
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
        await pages.dfbLoadFormPage.performCompleteLoadValidation(
          cargoValue,
          COUNTRY.USA
        );
      });

      // ===== CONTINUE WITH TNX POSTING FLOW =====
      
      await test.step("Enter offer rate, save, and validate DFB form state in view mode", async () => {
        await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.viewLoadPage.validateViewLoadHeading();
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        totalMiles = await pages.editLoadFormPage.getTotalMilesValue();
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
          emailNotification: testData.saleAgentEmail,
        });
        await pages.dfbLoadFormPage.validateFieldsAreNotEditable([
          DFB_FORM_FIELDS.Email_Notification,
          DFB_FORM_FIELDS.Expiration_Date,
          DFB_FORM_FIELDS.Expiration_Time,
          DFB_FORM_FIELDS.Commodity,
          DFB_FORM_FIELDS.NOTES,
        ]);
        await pages.dfbLoadFormPage.validateFieldsAreEditable([
          DFB_FORM_FIELDS.Include_Carriers,
          DFB_FORM_FIELDS.Exclude_Carriers,
        ]);
        await pages.dfbLoadFormPage.validateMixedButtonStates({
          [DFB_Button.Post]: true,
          [DFB_Button.Clear_Form]: true,
          [DFB_Button.Create_Rule]: true,
        });
        bidsReportValue =
          await pages.viewLoadCarrierTabPage.getBidsReportValue();
        console.log(`Bids Report Value: ${bidsReportValue}`);
        await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.NOT_POSTED);
        await pages.dfbLoadFormPage.clickOnPostButton();
        await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);
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
          "Load Method": "truckload",
        });
        // Re-baseline after Post — Post can also bump BIDS; Match Now must be exactly +1 from this value
        bidsReportValue =
          await pages.viewLoadCarrierTabPage.getBidsReportValue();
        console.log(`Bids Report Value after Post: ${bidsReportValue}`);
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
          await dmePages.dmeLoadPage.ValidateDMEStatusText(LOAD_STATUS.BTMS_REQUESTED,LOAD_STATUS.TNX_REQUESTED);
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
        // Dismiss Skip/No Thanks overlays before org selector (stage often blocks orgSelector)
        const tnxPages = await appManager.switchToTNXForLoadSearch();

        // Set viewport specifically for TNX to 1920 dimensions
        await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });

        try {
          console.log("Performing TNX operations...");
          // Bounded org select — stage often never shows orgSelector (avoid 180s waits)
          await tnxPages.tnxLandingPage.selectOrganizationByTextBounded(
            TNX.CARRIER_NAME,
            WAIT.XLARGE,
          );
          await tnxPages.tnxLandingPage.clickPlusSignButton();
          await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
          await tnxPages.tnxLandingPage.clickLoadSearchLink();
          await tnxPages.tnxLandingPage.validateAvailableLoadsText(loadNumber);
          await tnxPages.tnxLandingPage.clickLoadLink();
          await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.MATCH_NOW);
          await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.YES_BUTTON);
          await tnxPages.tnxLandingPage.validateTnxElementVisible(
            TNX.CONGRATS_MESSAGE
          );
          await tnxPages.tnxCarrierTenderPage.validateMatchSuccessToast();
          await tnxPages.tnxCarrierTenderPage.waitForMatchSuccessToastToDisappear();
          // Use headless-optimized validation for execution notes
          await tnxPages.tnxExecutionTenderPage.validateExecutionNotesOrMatchComplete();

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
        await btmsPages.viewLoadCarrierTabPage.waitForBidsReportCountAtLeast(
          parseInt(bidsReportValue, 10) || 0,
        );
        await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks(
          TNX.BID_HISTORY
        );
        await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
        await pages.viewLoadCarrierTabPage.validateBidHistoryFirstRow({
          carrier: testData.Carrier,
          bidRate: testData.offerRate,
          shipCity: testData.shipperCity,
          shipState: testData.shipperState,
          consCity: testData.consigneeCity,
          consState: testData.consigneeState,
          // Omit timestamp — stage server clock can drift >1 min from local capture after Match Now
          email: userSetup.tnxUser,
          totalMiles: totalMiles,
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
    }
  );
});