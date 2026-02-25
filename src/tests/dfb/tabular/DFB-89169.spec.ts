import { test, expect } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";

/**
 * Test Case: DFB-89169 - Automatically post a load to the TNX for a single included carrier on a waterfallNumber of included carriers = Minimum number (1)
 * @author Deepak Bohra
 * @date 10-Dec-2025
 */

const testcaseID = "DFB-89169";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);
let cargoValue: string;
let loadNumber: string;
let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let pages: PageManager;
test.describe.configure({ retries: 1 });
test.describe.serial("Post a load to TNX with a no included carrier.", () => {
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
    "Case Id: 89169 - Should successfully automatically post a load with exactly no carrier on include carrier.",
    {
      tag: "@dfb,@tporegression, @includecarrier,@smoke,@autoposting",
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
          pages.toggleSettings.enabledAutoPost, // ← Now passed as argument
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
        await pages.dfbLoadFormPage.performCompleteLoadValidation(
          cargoValue,
          COUNTRY.USA
        );
      });

      await test.step("Enter offer rate, save, and validate DFB form state in view mode", async () => {
        const { totalMiles } = await dfbHelpers.enterOfferRateSaveAndValidate(
          pages,
          {
            offerRate: TNX.OFFER_RATE_2,
            clickSave: true,
            validatePostAfter: LOAD_STATUS.POSTED,
            expectedValues: {
              offerRate: TNX.OFFER_RATE_2,
              expirationDate:
                pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
              expirationTime: testData.shipperLatestTime,
            },
            formState: {
              emailNotification: testData.saleAgentEmail,
            },
            notEditableFields: [
              DFB_FORM_FIELDS.Email_Notification,
              DFB_FORM_FIELDS.Expiration_Date,
              DFB_FORM_FIELDS.Expiration_Time,
              DFB_FORM_FIELDS.Commodity,
              DFB_FORM_FIELDS.NOTES,
              DFB_FORM_FIELDS.Exclude_Carriers,
              DFB_FORM_FIELDS.Include_Carriers,
            ],
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
          }
        );
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

      await test.step("Open TNX Rep application and perform matching", async () => {
        // Switch to TNX Rep application (initializes if needed)
        const tnxRepPages = await appManager.switchToTNXRep();

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

          await tnxRepPages.tnxRepLandingPage.validateNonIncludedCarrierRowWaterfall(
            [
              { name: CARRIER_NAME.CARRIER_4, offerRate: TNX.OFFER_RATE_2 },
              { name: CARRIER_NAME.CARRIER_5, offerRate: TNX.OFFER_RATE_2 },
              { name: CARRIER_NAME.CARRIER_7, offerRate: TNX.OFFER_RATE_2 },
            ],
            loadNumber,
            1
          );

          console.log("✅ TNX Rep operations completed successfully");
        } catch (error) {
          console.error("❌ Error in TNX Rep operations:", error);
          throw error;
        }
      });

      
    }
  );
});
