import { expect } from "@playwright/test";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import { PageManager } from "@utils/PageManager";
import ediHelper from "@utils/ediUtils/ediHelper";
import dynamicDataAPI from "@config/dynamicDataAPI";
import apiRequests from "@api/apiRequests";
import dataConfigAPI from "@config/dataConfigAPI";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import { BrowserContext, Page, test } from "@playwright/test";
import ediReplacementsHelper from "@utils/ediUtils/ediReplacementsHelper";
import commonReusables from "@utils/commonReusables";

/**
 * Test Case: DFB-61670 - Post a load to the TNX for each carrier on a waterfall that has been configured on the load(load create through EDI).
 * @author Parth Rastogi
 * @date 13-Nov-2025
 */

const testcaseID = 'DFB-61670';
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let dynamicCarrierCount: number; // Add this to store carrier count
let loadId: string;
let pages: PageManager;
let response: any;
let bolNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial('Case ID: DFB-61670 - Post a load to the TNX for each carrier on a waterfall that has been configured on the load(load create through EDI)', { tag: ['@smoke','@dfb', '@tporegression', '@waterfall','@manualposting'] }, () => {

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

  test('DFB-EDI End-to-End: Inbound EDI, Outbound EDI, and TNX Bid', async () => {
    const toggleSettingsValue = pages.toggleSettings.verifyDME;
    // Step 1: Login and setup
    await test.step("Login BTMS", async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);
      await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
      pages.logger.info("BTMS Login Successful");
    });
    await test.step('Setup Customer PreCondition', async () => {
      await ediHelper.disableAutoOverlay(sharedPage, testData.customerName);
      await pages.viewCustomerPage.clickHomeButton();
      await sharedPage.waitForLoadState("networkidle");
    });
    await test.step("Setup DFB Test Environment", async () => {

      await dfbHelpers.setupOfficePreConditions(
        pages,
        testData.officeName,
        toggleSettingsValue,
        pages.toggleSettings.verifyAutoPost,
      );
      await pages.viewCustomerPage.clickHomeButton();
    });
    // Step 2: Send EDI 204S
    bolNumber = (await dynamicDataAPI.getBolNumber()) + await commonReusables.generateRandomNumber(3).toString();
    console.log("Generated BOL Number:", bolNumber);
    const replacements = await ediReplacementsHelper.getEdi204Replacements(
      bolNumber,
      testData
    );
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
      await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
      await pages.editLoadPage.validateEditLoadHeadingText();
      loadId = await pages.dfbLoadFormPage.getLoadNumber();
      console.log(`Load ID: ${loadId}`);
      await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
      pages.logger.info(
        "Load created successfully and navigated to Edit Load page"
      );
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE_4);
      await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([
        CARRIER_NAME.CARRIER_1,
        CARRIER_NAME.CARRIER_2,
        CARRIER_NAME.CARRIER_3,
      ]);
      await pages.editLoadFormPage.clickOnSaveBtn();
      await pages.viewLoadPage.validateViewLoadHeading();
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      await pages.viewLoadPage.clickIncludeCarriersViewDetailsLink();

      await test.step("Update multiple carriers in loop", async () => {
        const carriersData = [
          {
            name: CARRIER_NAME.CARRIER_1,
            values: [PRIORITY.PRIORITY_1, CARRIER_TIMING.TIMING_4, LOAD_OFFER_RATES.OFFER_RATE_1]
          },
          {
            name: CARRIER_NAME.CARRIER_2,
            values: [PRIORITY.PRIORITY_2, CARRIER_TIMING.TIMING_1, LOAD_OFFER_RATES.OFFER_RATE_2]
          },
          {
            name: CARRIER_NAME.CARRIER_3,
            values: [PRIORITY.PRIORITY_3, CARRIER_TIMING.TIMING_1, LOAD_OFFER_RATES.OFFER_RATE_3]
          }
        ];

        // Set dynamic carrier count based on actual carriersData length
        dynamicCarrierCount = carriersData.length;
        console.log(` Dynamic carrier count set to: ${dynamicCarrierCount}`);

        for (const carrier of carriersData) {
          await pages.dfbIncludeCarriersDataModalWaterfall.clickCarrierPencilIconsAndInputValues(
            carrier.name,
            ...carrier.values  // Spread operator to pass array as individual arguments
          );
        }
      });
      await pages.dfbIncludeCarriersDataModalWaterfall.clickIncludeCarriersDataSaveButton();
      const expectedValues = {
        offerRate: TNX.OFFER_RATE_4,
        expirationDate:
          commonReusables.getNextTwoDatesFormatted().tomorrow,
        expirationTime: testData.shipperLatestTime,
      };
      await pages.dfbLoadFormPage.validateDFBTextFieldHaveExpectedValues(
        expectedValues
      );

      await pages.dfbLoadFormPage.validateFieldsAreNotEditable([
        DFB_FORM_FIELDS.Email_Notification,
        DFB_FORM_FIELDS.Expiration_Date,
        DFB_FORM_FIELDS.Expiration_Time,
        DFB_FORM_FIELDS.Commodity,
        DFB_FORM_FIELDS.NOTES,
        DFB_FORM_FIELDS.Exclude_Carriers,
      ]);
      await pages.dfbLoadFormPage.validateFormFieldsState({
        includeCarriers: [
          CARRIER_NAME.CARRIER_1,
          CARRIER_NAME.CARRIER_2,
          CARRIER_NAME.CARRIER_3,
        ],
        emailNotification: testData.saleAgentEmail,
      });
      await pages.dfbLoadFormPage.validateFieldsAreEditable([
        DFB_FORM_FIELDS.Include_Carriers,
      ]);
      await pages.dfbLoadFormPage.validateMixedButtonStates({
        [DFB_Button.Post]: true,
        [DFB_Button.Clear_Form]: true,
        // [DFB_Button.Create_Rule]: true,
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

    await test.step("Open TNX Rep application and perform matching", async () => {
      // Switch to TNX Rep application (initializes if needed)
      const tnxRepPages = await appManager.switchToTNXRep();

      // Set viewport specifically for TNX Rep to 1920 dimensions
      await appManager.tnxRepPage.setViewportSize({ width: 1920, height: 1080 });
      try {
        await tnxRepPages.tnxRepLandingPage.selectOrganizationByText(
          TNX.CARRIER_BRAND_1
        );
        await tnxRepPages.tnxRepLandingPage.handleOptionalSkipButton();
        await tnxRepPages.tnxRepLandingPage.enterLoadIdFilterValue(loadId);
        await tnxRepPages.tnxRepLandingPage.validateLoadRowsBasedOnCarrierCount(
          dynamicCarrierCount,
          loadId,
          [CARRIER_NAME.CARRIER_1, CARRIER_NAME.CARRIER_2, CARRIER_NAME.CARRIER_3],
          [LOAD_OFFER_RATES.OFFER_RATE_1, LOAD_OFFER_RATES.OFFER_RATE_2, LOAD_OFFER_RATES.OFFER_RATE_3]
        );
        console.log("✅ TNX Rep operations completed successfully");
      } catch (error) {
        console.error("❌ Error in TNX Rep operations:", error);
        throw error;
      }
    });

    // Cleanup: Close all secondary applications
    await appManager.closeAllSecondaryPages();
    console.log("Test cleanup completed");

  });
});