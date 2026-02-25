import { BrowserContext, Page, test } from "@playwright/test";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";

const testcaseID = 'DFB-61642';
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let totalMiles: string;
let loadId: string;
let pages: PageManager;


test.describe.configure({ retries: 1 });
test.describe('Case ID: 61642 - Enter a Bid for a Load posted manually to the TNX(load create through Template)', { tag: ['@smoke','@dfb', '@tporegression', '@manualposting', '@bidding'] }, () => {

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

  test('Enter a Bid for a Load posted manually to the TNX(load create through Template)', async () => {
    let cargoValue: string;
    const toggleSettingsValue = pages.toggleSettings.verifyAutoPost;
    // Login to BTMS
    await test.step('Login BTMS', async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT);
      await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
      pages.logger.info("BTMS Login Successful");
    });
    // Set skipNavigateToLoad to true or false as needed for your test scenario
    const skipNavigateToLoad = true; // Change to true to skip navigation
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
        true,
        skipNavigateToLoad
      );
    });

    await test.step('Post a Load manually through a template', async () => {
      await pages.basePage.hoverOverClickOnLoads();
      await pages.basePage.clickOnTemplateSubMenu();
      await pages.loadTemplateSearchPage.searchTemplate(undefined, undefined, undefined, CUSTOMER_NAME.CUSTOMER_1);
      await pages.loadTemplateSearchPage.selectTemplateRecord(LOAD_TEMPLATE_SEARCH_PAGE.TEMPLATE_VALUE_1);
      await pages.editTemplatePage.clickHeaderButton(BUTTONS.EDIT);

      await test.step("Enter the details for Pick Tab", async () => {
        await pages.editTemplatePage.clickViewTemplateTabs(TABS.PICK);
        await pages.editTemplatePage.enterCompletePickTabDetails(
          pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
          testData.shipperEarliestTime,
          pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
          testData.shipperLatestTime

        );
        pages.logger.info("Pick Tab details entered successfully");
      });

      await test.step("Enter the details for Drop Tab", async () => {
        await pages.editTemplatePage.clickViewTemplateTabs(TABS.DROP);
        await pages.editTemplatePage.enterCompleteDropTabDetails(
          pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
          testData.consigneeEarliestTime,
          pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
          testData.consigneeLatestTime
        );
        pages.logger.info("Drop Tab details entered successfully");
      });

      await pages.editTemplatePage.clickOnSaveBtn();
      await pages.editTemplatePage.clickHeaderButton(BUTTONS.CREATE_LOAD);

      // Step 4: Enter offer rate, save, and validate DFB form state in view mode
      await test.step("Enter offer rate, save, and validate DFB form state in view mode", async () => {

        await pages.editLoadPage.selectRateType(testData.rateType);
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadId = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(`Load ID: ${loadId}`);
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        pages.logger.info(
          "Load created successfully and navigated to Edit Load page"
        );
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE_4);
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.viewLoadPage.validateViewLoadHeading();
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        totalMiles = await pages.editLoadFormPage.getTotalMilesValue();
        const expectedValues = {
          offerRate: TNX.OFFER_RATE_4,
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
          "Offer Rate": `$${TNX.OFFER_RATE_4}`,
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
          await dmePages.dmeDashboardPage.searchLoad(loadId);
          await dmePages.dmeLoadPage.validateSingleTableRowPresent();
          await dmePages.dmeLoadPage.validateAndGetSourceIdText(loadId);

          await dmePages.dmeLoadPage.ValidateDMEStatusText(LOAD_STATUS.BTMS_REQUESTED, LOAD_STATUS.TNX_REQUESTED);
          await dmePages.dmeLoadPage.clickOnDataDetailsLink();
          await dmePages.dmeLoadPage.clickOnShowIconLink();
          await dmePages.dmeLoadPage.validateAuctionAssignedText(
            loadId,
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
          await tnxPages.tnxLandingPage.searchLoadValue(loadId);
          await tnxPages.tnxLandingPage.clickLoadSearchLink();
          await tnxPages.tnxLandingPage.validateAvailableLoadsText(loadId);
          await tnxPages.tnxLandingPage.clickLoadLink();
          await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.BID_BUTTON);
          await tnxPages.tnxLandingPage.enterBidAmount(TNX.BID_RATE_2);
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
        await dmePages.dmeDashboardPage.searchLoad(loadId);
        await dmePages.dmeLoadPage.validateSingleTableRowPresent();
        await dmePages.dmeLoadPage.validateAndGetSourceIdText(loadId);
        await dmePages.dmeLoadPage.validateBidStatusWithRetry(
          LOAD_STATUS.BTMS_REQUESTED, LOAD_STATUS.TNX_REQUESTED,
          loadId,
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
          email: TNX.CARRIER_EMAIL,
          totalMiles: totalMiles
        });
        await appManager.closeAllSecondaryPages();
        console.log("Test cleanup completed");
      });
    });
  });
});
