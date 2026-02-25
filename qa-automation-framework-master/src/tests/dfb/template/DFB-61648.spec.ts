import { BrowserContext, Page, test } from "@playwright/test";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";

const testcaseID = 'DFB-61648';
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let totalMiles: string;
let loadId: string;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe('Case ID: DFB-61648 - Enter a Bid for a Load auto posted to the TNX(load create through Template)', { tag: ['@smoke','@dfb', '@tporegression', '@bidding', '@autoposting'] }, () => {
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

  test('Enter a Bid for a Load auto posted to the TNX(load create through Template)', async () => {
    let cargoValue: string;
    const toggleSettingsValue = pages.toggleSettings.enabledAutoPost;
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
        pages.toggleSettings.enabledAutoPost,
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
      await pages.loadTemplateSearchPage.searchTemplate(undefined, undefined, LOAD_TEMPLATE_SEARCH_PAGE.TEMPLATE_VALUE_4);
      await pages.loadTemplateSearchPage.selectTemplateRecord(LOAD_TEMPLATE_SEARCH_PAGE.TEMPLATE_VALUE_4);
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
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadId = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(`Load ID: ${loadId}`);
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        pages.logger.info(
          "Load created successfully and navigated to Edit Load page"
        );
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
        await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);
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
          await tnxPages.tnxLandingPage.searchLoadValue(loadId);
          await tnxPages.tnxLandingPage.clickLoadSearchLink();
          await tnxPages.tnxLandingPage.validateAvailableLoadsText(loadId);
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
        await dmePages.dmeDashboardPage.searchLoad(loadId);
        await dmePages.dmeLoadPage.validateSingleTableRowPresent();
        await dmePages.dmeLoadPage.validateAndGetSourceIdText(loadId);
        await dmePages.dmeLoadPage.validateBidStatusWithRetry(
          LOAD_STATUS.BTMS_REQUESTED, LOAD_STATUS.TNX_REQUESTED,
          loadId,
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
          totalMiles: totalMiles
        });
        // Cleanup: Close all secondary applications
        await appManager.closeAllSecondaryPages();
        console.log("Test cleanup completed");
      });
    });
  });
});
