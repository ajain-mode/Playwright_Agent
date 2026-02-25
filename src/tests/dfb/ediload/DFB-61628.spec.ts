import { expect, test } from "@playwright/test";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";
import ediHelper from "@utils/ediUtils/ediHelper";
import dynamicDataAPI from "@config/dynamicDataAPI";
import apiRequests from "@api/apiRequests";
import dataConfigAPI from "@config/dataConfigAPI";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import ediReplacementsHelper from "@utils/ediUtils/ediReplacementsHelper";

const testcaseID = "DFB-61628";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let totalMiles: string;
let loadId: string;
let pages: PageManager;
let response: any;
let bolNumber: string;

test.describe.configure({ retries: 2 });
test.describe.serial(
  "Create a load through EDI and post to TNX and Match Bid, with verifications in DME and BTMS",
  { tag: ["@dfb","@loadposting", "@tporegression","@matchbid"] },
  () => {
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

    test("Case Id: 61628 : Create a load through EDI and post to TNX and Match Bid, with verifications in DME and BTMS", async () => {
      const toggleSettingsValue = pages.toggleSettings.enable_DME;
      // Step 1: Login and setup
      await test.step("Login BTMS", async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT);
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        pages.logger.info("BTMS Login Successful");
      });

      await test.step("Setup Customer PreCondition", async () => {
        await ediHelper.disableAutoOverlay(sharedPage, testData.customerName);
        await pages.viewCustomerPage.clickHomeButton();
        await sharedPage.waitForLoadState("networkidle");
      });

      await test.step("Setup DFB Test Environment", async () => {
        await dfbHelpers.setupOfficePreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.verifyDME,
          //pages.toggleSettings.verifyAutoPost
        );
        await pages.officePage.ensureToggleValues(pages.toggleSettings.verifyAutoPost);


        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);
        console.log("Switched user to that has agent as its salesperson");

        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(
          testData.consigneeEDICode
        );

        console.log("Verified no post automation rule for customer");
      });

      // Step 2: Send EDI 204S
      bolNumber = (await dynamicDataAPI.getBolNumber()) + await commonReusables.generateRandomNumber(3).toString();
      console.log("Generated BOL Number:", bolNumber);
      const replacements = await ediReplacementsHelper.getEdi204Replacements(bolNumber, testData);
      const updatedRawData = await dynamicDataAPI.dynamicUpdateEdi204TLRawData(
        dataConfigAPI.inboundEdi204TruckLoad_DFB,
        await replacements
      );

      ({ response } = await apiRequests.sendEDI204Request(updatedRawData));
      console.log("Sent EDI with BOL Number:", bolNumber);
      console.log("Status Code:", response.status);
      expect(response.status).toBe(201);

      // Step 3: Accept Load from Load Tender 204
      await test.step("Auto accept Load from Load Tender 204", async () => {
        await pages.homePage.clickOnLoadButton();
        await pages.loadsPage.clickOnEDI204LoadTender();
        await pages.edi204LoadTendersPage.filterBolNumber(bolNumber);
        await pages.edi204LoadTendersPage.clickRowWithBolNumber(bolNumber);
        await pages.loadTender204Page.acceptLoadTender();
      });

      // Step 4: Enter offer rate, save, and validate DFB form state in view mode
      await test.step("Enter offer rate, save, and validate DFB form state in view mode", async () => {
        await pages.viewLoadPage.clickEditButton();
        //await pages.editLoadPage.selectRateType(testData.rateType);
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
          expirationDate: commonReusables.getNextTwoDatesFormatted().tomorrow,
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
          await dmePages.dmeDashboardPage.searchLoad(loadId);
          await dmePages.dmeLoadPage.validateSingleTableRowPresent();
          await dmePages.dmeLoadPage.validateAndGetSourceIdText(loadId);
          await dmePages.dmeLoadPage.ValidateDMEStatusText(LOAD_STATUS.BTMS_REQUESTED,LOAD_STATUS.TNX_REQUESTED);
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
          await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.MATCH_NOW);
          await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.YES_BUTTON);
          await tnxPages.tnxLandingPage.validateTnxElementVisible(
            TNX.CONGRATS_MESSAGE
          );
          await tnxPages.tnxCarrierTenderPage.validateMatchSuccessToast();
          await tnxPages.tnxCarrierTenderPage.waitForMatchSuccessToastToDisappear();
          await tnxPages.tnxExecutionTenderPage.validateExecutionNotesFieldsPresence();

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
        await dmePages.dmeLoadPage.validateAndGetStatusTextWithRetry(
          LOAD_STATUS.BTMS_CANCELLED,
          LOAD_STATUS.TNX_BOOKED,
          loadId,
          dmePages.dmeDashboardPage
        );
      });

      // Step 8: Refresh BTMS page and validate final load status
      await test.step("Refresh BTMS page and validate final load status", async () => {
        const btmsPages = await appManager.switchToBTMS();
        await btmsPages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.MATCHED);
        await appManager.btmsPage.reload();
        await btmsPages.viewLoadPage.validateLoadStatus(LOAD_STATUS.BOOKED);
        await btmsPages.editLoadCarrierTabPage.clickOnCarrierTab();
        await pages.viewLoadCarrierTabPage.validateBidsReportValue();
        await commonReusables.getCurrentDateTime();
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
          timestamp: commonReusables.formattedDateTime,
          email: userSetup.tnxUser,
          totalMiles: totalMiles,
        });
        // Validate specific fields (you can customize these expected values)
        await btmsPages.viewLoadCarrierTabPage.validateCarrierLinkText(
          TNX.CARRIER_NAME
        );
        await btmsPages.viewLoadCarrierTabPage.validateCarrierDispatchName(
          TNX.CARRIER_DISPATCH_NAME
        );
        await btmsPages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(
          userSetup.tnxUser
        );

        await appManager.closeAllSecondaryPages();
        console.log("Test cleanup completed");
      });
    });
  }
);
