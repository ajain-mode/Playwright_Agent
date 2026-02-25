import { BrowserContext, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

test.describe.configure({ retries: 1 });
const testcaseID = "DFB-97745";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let cargoValue: string;
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;
let totalMiles: string;

test.describe("Case ID: 97745 - Automatically book a load when it is automatically posted(carrier auto accept)", () => {
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
    "Case Id: 97745 - Automatically book a load when it is automatically posted(carrier auto accept)",
    { tag: "@dfb, @smoke,@tporegression, @carrierautoaccept" },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 10 minutes
      // Use shared appManager and pages
      const toggleSettingsValue = pages.toggleSettings.enable_DME;
      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        pages.logger.info("BTMS Login Successful");
      });
      await test.step("Pre-Conditions setup for creating a load", async () => {
        cargoValue = await pages.dfbHelpers.setupDFBTestPreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.allEnable_AutoPost, // ← Now passed as argument
          testData.salesAgent,
          testData.customerName,
          CARGO_VALUES.DEFAULT,
          LOAD_TYPES.CREATE_TL_NEW,
          false,
          true,
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
        await test.step("Click on Create Load Button and verify navigation to Edit Load page", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          console.log(`Load Number: ${loadNumber}`);
          await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
          pages.logger.info(
            "Load created successfully and navigated to Edit Load page"
          );
        });
      });
      await test.step("Verify default field values and placeholders after creating a load in edit mode", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.performCompleteLoadValidation(
          cargoValue,
          COUNTRY.USA
        );
      });
      await test.step("Enter offer rate, save, and validate DFB form state in view mode", async () => {
        await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([
          CARRIER_NAME.CARRIER_1
        ]);
        await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
        await pages.dfbLoadFormPage.selectCarreirContactForRateConfirmation(CARRIER_CONTACT.CONTACT_1);
        await pages.editLoadFormPage.clickOnSaveBtn();

        await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.BOOKED);
        await pages.viewLoadPage.clickCarrierTab();
        totalMiles = await pages.editLoadFormPage.getTotalMilesValue();
        await pages.viewLoadCarrierTabPage.getBidsReportValue();
        await pages.viewLoadCarrierTabPage.validateCarrierAssignedText(CARRIER_NAME.CARRIER_1);
        await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(CARRIER_DISPATCH_NAME.DISPATCH_NAME_2);
        await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(CARRIER_DISPATCH_EMAIL.EMAIL_1);
        await pages.viewLoadCarrierTabPage.validateBidsReportValueWithRefresh();
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
          email: userSetup.tnxRepUser,
          totalMiles: totalMiles
        });
        await pages.viewLoadCarrierTabPage.closeBidHistoryModal();
      });

      await test.step("Switch to DME, validate final load status", async () => {
        // Switch back to DME for final validation
        const dmePages = await appManager.switchToDME();
        await dmePages.dmeDashboardPage.clickOnLoadsLink();
        await dmePages.dmeDashboardPage.searchLoad(loadNumber);
        await dmePages.dmeLoadPage.validateSingleTableRowPresent();
        await dmePages.dmeLoadPage.validateAndGetSourceIdText(loadNumber);
        await dmePages.dmeLoadPage.validateAndGetStatusTextWithRetry(
          LOAD_STATUS.BTMS_CANCELLED,
          LOAD_STATUS.TNX_BOOKED,
          loadNumber,
          dmePages.dmeDashboardPage
        );
        await dmePages.dmeLoadPage.clickOnDataDetailsLink();
        await dmePages.dmeLoadPage.clickOnShowIconLink();

        await dmePages.dmeLoadPage.validateAuctionAssignedText(
          loadNumber,
          dmePages.dmeDashboardPage
        );
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
          await tnxPages.tnxLandingPage.clickOnTNXHeaderLink(TNX.ACTIVE_JOBS);
          await tnxPages.tnxLandingPage.clickPlusButton();
          await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
          await tnxPages.tnxLandingPage.clickLoadSearchLink();
          await tnxPages.tnxLandingPage.validateBidsTabAvailableLoadsText(TNX.SINGLE_JOB_RECORD, loadNumber);
          await tnxPages.tnxLandingPage.clickLoadLink();
          await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(TENDER_DETAILS_MODAL_TABS.PROGRESS);
          await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(TENDER_DETAILS_MODAL_TABS.GENERAL);
          await tnxPages.tnxLandingPage.validateStatusHistoryText(TNX_STATUS_HISTORY.STATUS_MATCHED);
          await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(TENDER_DETAILS_MODAL_TABS.GENERAL);
          await tnxPages.tnxExecutionTenderPage.validateExecutionNotesFieldsPresence();
          console.log("✅ TNX operations completed successfully");
        } catch (error) {
          console.error("❌ Error in TNX operations:", error);
          throw error;
        }
      });
      // Cleanup: Close all secondary applications
      await appManager.closeAllSecondaryPages();
      console.log("Test cleanup completed");
    });
}
);