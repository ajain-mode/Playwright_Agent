import { test, expect } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";

/**
 * Test Case: DFB-89167 - Automatically post a load to the TNX for a single included carrier on a waterfallNumber of included carriers = Minimum number (1)
 * @author Deepak Bohra
 * @date 05-Dec-2025
 */

const testcaseID = "DFB-89167";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);
let cargoValue: string;
let loadNumber: string;
let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let pages: PageManager;
test.describe.configure({ retries: 1 });
test.describe
  .serial("Post a load to TNX with a single included carrier (waterfall = 1).", () => {
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
    "Case Id: 89167 - Should successfully automatically post a load with exactly one included carrier(waterfall)).",
    {
      tag: "@dfb,@tporegression, @waterfall,@smoke,@autoposting",
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

      await test.step("Open TNX application and perform check the load is visible for the included carrier", async () => {
        // Switch to TNX application (initializes if needed)
        const tnxPages = await appManager.switchToTNX();

        const carrierNames = [CARRIER_NAME.CARRIER_1];
        for (const carrierName of carrierNames) {
          try {
            console.log(
              `Performing TNX operations for carrier: ${carrierName}`
            );
            await tnxPages.tnxLandingPage.selectOrganizationByText(carrierName);
            await tnxPages.tnxLandingPage.handleOptionalSkipButton();
            await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
            await tnxPages.tnxLandingPage.clickPlusSignButton();
            await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadSearchLink();
            await tnxPages.tnxLandingPage.validateAvailableLoadsText(
              loadNumber
            );
            const offerRate =
              await tnxPages.tnxLandingPage.getLoadOfferRateValue();
            // Normalize both actual and expected to two decimals for comparison

            const normActual = await pages.commonReusables.normalizeRate(
              offerRate
            );
            const normExpected = await pages.commonReusables.normalizeRate(
              `$${TNX.OFFER_RATE_5}`
            );
            await expect(normActual).toEqual(normExpected);
            console.log(
              `✅ TNX operations completed successfully for carrier: ${carrierName}`
            );
          } catch (error) {
            console.error(
              `❌ Error in TNX operations for carrier ${carrierName}:`,
              error
            );
            throw error;
          }
        }
      });

      await test.step("Validate the load invisibility for the not included carriers", async () => {
        const tnxPages = await appManager.switchToTNX();
        const carrierNames = [
          CARRIER_NAME.CARRIER_4,
          CARRIER_NAME.CARRIER_5,
          CARRIER_NAME.CARRIER_7,
        ];
        for (const carrierName of carrierNames) {
          try {
            console.log(
              `Performing TNX operations for carrier: ${carrierName}`
            );
            await tnxPages.tnxLandingPage.selectOrganizationByText(carrierName);
            await tnxPages.tnxLandingPage.handleOptionalSkipButton();
            await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
            await tnxPages.tnxLandingPage.clickPlusSignButton();
            await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
            await tnxPages.tnxLandingPage.clickLoadSearchLink();
            await tnxPages.tnxLandingPage.validateUnavailableLoadsText();

            console.log(
              `✅ TNX operations completed successfully for carrier: ${carrierName}`
            );
          } catch (error) {
            console.error(
              `❌ Error in TNX operations for carrier ${carrierName}:`,
              error
            );
            throw error;
          }
        }
      });

      // Cleanup: Close all secondary applications
      await appManager.closeAllSecondaryPages();
      console.log("Test cleanup completed");
    }
  );
});
