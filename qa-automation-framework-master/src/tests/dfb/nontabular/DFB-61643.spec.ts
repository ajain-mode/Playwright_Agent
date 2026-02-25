import { BrowserContext, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

test.describe.configure({ retries: 1 });
const testcaseID = "DFB-61643";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let cargoValue: string;
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;
let totalMiles: string;

test.describe.serial("Case ID: 61643 - Enter a Bid for a Load auto posted to the TNX(load create through tabular form)", () => {

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
    "Case Id: 61643 - Enter a Bid for a Load auto posted to the TNX(load create through tabular form)",
    { tag: "@smoke,@dfb ,@loadposting,@tporegression, @bidding" },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT); // 10 minutes
      // Use shared appManager and pages
      const toggleSettingsValue = pages.toggleSettings.enabledAutoPost;

      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        pages.logger.info("BTMS Login Successful");
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
          true,
        );
      });

      await test.step("Enter the details for Load Tab", async () => {
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.viewLoadPage.getSelectedLoadStatusText(LOAD_STATUS.ACTIVE);

        pages.logger.info("Load Tab details entered successfully");
      });

      await test.step("Enter the details for Pick Tab", async () => {
        await pages.editLoadPage.clickOnTab(TABS.PICK);
        await pages.editLoadPickTabPage.enterCompletePickTabDetails(
          testData
        );
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
        await pages.dfbLoadFormPage.performCompleteLoadValidation(
          cargoValue,
          COUNTRY.USA
        );
      });

      await test.step("Enter offer rate, save, and validate DFB form state in view mode", async () => {

        await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.viewLoadPage.validateViewLoadHeading();
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        totalMiles = await pages.editLoadFormPage.getTotalMilesValue();
        const expectedValues = {
          offerRate: TNX.OFFER_RATE,
          expirationDate:
            commonReusables.getNextTwoDatesFormatted().tomorrow,
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
          DFB_FORM_FIELDS.Include_Carriers,
          DFB_FORM_FIELDS.Exclude_Carriers,
        ]);
        await pages.dfbLoadFormPage.validateMixedButtonStates({
          [DFB_Button.Post]: false,
          [DFB_Button.Clear_Form]: false,
          [DFB_Button.Create_Rule]: true,
          [DFB_Button.Cancel]: true,
        });

        await pages.viewLoadCarrierTabPage.getBidsReportValue();
       await pages.dfbLoadFormPage.hoverOverPostedIcon();
       await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);
        await pages.dfbLoadFormPage.validateTableFields(sharedPage, {
          "Origin Zip": testData.shipperZip,
          "Destination Zip": testData.consigneeZip,
          "Offer Rate": `$${TNX.OFFER_RATE}`,
          Equipment: testData.equipmentType,
          "Load Method": testData.loadMethod,
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
          await tnxPages.tnxLandingPage.clickLoadLink();
          await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.BID_BUTTON);
          await tnxPages.tnxLandingPage.enterBidAmount(TNX.BID_RATE);
          await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.BID_NOW_BUTTON);

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
        await dmePages.dmeLoadPage.validateBidStatusWithRetry(
          LOAD_STATUS.BTMS_REQUESTED,LOAD_STATUS.TNX_REQUESTED,
          loadNumber,
          dmePages.dmeDashboardPage
        );
      });

      await test.step("Refresh BTMS page and validate final load status", async () => {
        // Switch back to BTMS for final validation
        const btmsPages = await appManager.switchToBTMS();
        await pages.viewLoadCarrierTabPage.validateBidsReportValue();
        await commonReusables.getCurrentDateTime();
        await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks(TNX.BID_HISTORY);
        await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
        await pages.viewLoadCarrierTabPage.validateBidHistoryFirstRow({
          carrier: testData.Carrier,
          bidRate: testData.bidRate,
          shipCity: testData.shipperCity,
          shipState: testData.shipperState,
          consCity: testData.consigneeCity,
          consState: testData.consigneeState,
          timestamp: commonReusables.formattedDateTime,
          email: userSetup.tnxUser,
          totalMiles: totalMiles,
        });

        // Cleanup: Close all secondary applications
        await appManager.closeAllSecondaryPages();
        console.log("Test cleanup completed");
      });
    }
  );
});
});