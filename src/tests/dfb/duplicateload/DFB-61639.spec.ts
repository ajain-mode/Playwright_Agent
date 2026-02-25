import { BrowserContext, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

const testcaseID = "DFB-61639";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let cargoValue: string;
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;
let totalMiles: string;

test.describe.configure({ retries: 1 });
test.describe("Case ID: 61639 - Enter a Bid for a Load posted manually to the TNX(load create by duplicating the existing load).", () => {
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
    "Case Id: 61639 - Enter a Bid for a Load posted manually to the TNX(load create by duplicating the existing load).",
    { tag: "@smoke, @dfb ,@loadposting,@tporegression, @bidding, @manualposting" },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT); // 10 minutes
      // Use shared appManager and pages
      const toggleSettingsValue = pages.toggleSettings.verifyAutoPost;

      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });

    await test.step("Setup DFB Test Environment", async () => {
      cargoValue = await dfbHelpers.setupDFBTestPreConditions(
        pages,
        testData.officeName,
        toggleSettingsValue,
        pages.toggleSettings.verifyAutoPost,
        testData.salesAgent,
        testData.customerName,
        CARGO_VALUES.DEFAULT,
        LOAD_TYPES.CREATE_TL_NEW,
        false,
        true
      );
    });

    await test.step('Create a Non-Tabular Load', async () => {
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
        shipperNameNew: testData.shipperNameNew
      });
      await pages.nonTabularLoadPage.clickCreateLoadButton();
    });

    await test.step("Verify default field values and placeholders after creating a load in edit mode", async () => {
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      await pages.dfbLoadFormPage.performCompleteLoadValidation(
        cargoValue,
        COUNTRY.USA
      );
    });
      await test.step("Enter offer rate, save, and validate DFB form state in view mode", async () => {
            await pages.editLoadPage.clickOnTab(TABS.LOAD);
             await pages.editLoadPage.selectRateType(testData.rateType);
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);
            await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
            await pages.editLoadFormPage.clickOnSaveBtn();
            await pages.viewLoadPage.validateViewLoadHeading();
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);
            await pages.duplicateLoadPage.clickOnDuplicateButton();
            await pages.duplicateLoadPage.selectDuplicateIconCheckBox([
              DUPLICATE_LOAD_CHECKBOX.OFFICE_INFO,
              DUPLICATE_LOAD_CHECKBOX.REFERENCES_INFO,
              DUPLICATE_LOAD_CHECKBOX.CUSTOMER_INFO,
              DUPLICATE_LOAD_CHECKBOX.STOP_INFO,
              DUPLICATE_LOAD_CHECKBOX.CARRIER_INFO,
              DUPLICATE_LOAD_CHECKBOX.VENDOR_INFO,
            ]);
            await pages.duplicateLoadPage.clickOkButton();
            await console.log("Duplicate Load created successfully");
            await pages.editLoadPage.validateEditLoadHeadingText();
            loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
            console.log(`Load Number: ${loadNumber}`);
            await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
            await pages.viewLoadPage.getSelectedLoadStatusText(LOAD_STATUS.ACTIVE);
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);
            await pages.dfbLoadFormPage.performCompleteLoadValidation(
              cargoValue,
              COUNTRY.USA
            );
          });

          await test.step("Validate DFB form fields and post to TNX", async () => {
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);
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
      await pages.viewLoadCarrierTabPage.getBidsReportValue();
      await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.NOT_POSTED);
      await pages.dfbLoadFormPage.clickOnPostButton();
      await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);
      await pages.dfbLoadFormPage.validateMixedButtonStates({
        [DFB_Button.Create_Rule]: true,
        [DFB_Button.Cancel]: true,
        [DFB_Button.Post]: false,
      });
      await pages.dfbLoadFormPage.hoverOverPostedIcon();
      await pages.dfbLoadFormPage.validateTableFields(sharedPage, {
        "Origin Zip": testData.shipperZip,
        "Destination Zip": testData.consigneeZip,
        "Offer Rate": `$${TNX.OFFER_RATE}`,
        Equipment: testData.equipmentType,
        "Load Method": testData.loadMethod,
      });
    });

    // Step 5: Open DME application and perform operations
    await test.step("Open DME application and perform operations", async () => {
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

    // Step 6: Open TNX application and perform matching
    await test.step("Open TNX application and perform matching", async () => {
      const tnxPages = await appManager.switchToTNX();
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

    // Step 7: Switch to DME, validate final load status
    await test.step("Switch to DME, validate final load status", async () => {
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

    // Step 8: Refresh BTMS page and validate final load status
    await test.step("Refresh BTMS page and validate final load status", async () => {
      await appManager.switchToBTMS();
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
        totalMiles: totalMiles
      });
      await appManager.closeAllSecondaryPages();
      console.log("Test cleanup completed");
    });
  });
});
