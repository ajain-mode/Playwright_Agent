import { expect, test } from "@playwright/test";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import { PageManager } from "@utils/PageManager";
import ediHelper from "@utils/ediUtils/ediHelper";
import dynamicDataAPI from "@config/dynamicDataAPI";
import apiRequests from "@api/apiRequests";
import dataConfigAPI from "@config/dataConfigAPI";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import ediReplacementsHelper from "@utils/ediUtils/ediReplacementsHelper";

/**
 * Test Case to Post a load to the TNX (load create by EDI) and check include carrier present and non included carrier offer rate.#
 * @author Deepak Bohra
 * @date 27-Nov-2025
 */

const testcaseID = "DFB-61688";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let totalMiles: string;
let pages: PageManager;
let response: any;
let bolNumber: string;
let loadNumber: string;
let dynamicCarrierCount: number; // Add this to store carrier count

test.describe.configure({ retries: 1 });
test.describe
  .serial("Post a load to the TNX that is only visible to carriers selected(load create by through EDI).", () => {
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
    "Case Id: 61688 - Validate the include carrier present on the load is displaying the load created through EDI.",
    {
      tag: "@dfb,@tporegression,@smoke,@waterfall,@autoposting",
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes

      const toggleSettingsValue = pages.toggleSettings.enable_DME;
      // Step 1: Login and setup
      await test.step("Login BTMS", async () => {
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
          pages.toggleSettings.enabledAutoPost
        );

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
      bolNumber = (await dynamicDataAPI.getBolNumber()) + "2";
      console.log("Generated BOL Number:", bolNumber);
      const replacements = await ediReplacementsHelper.getEdi204Replacements(
        bolNumber,
        testData
      );
      const updatedRawData = await dynamicDataAPI.dynamicUpdateEdi204TLRawData(
        dataConfigAPI.inboundEdi204TruckLoad_Waterfall,
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
        await pages.loadTender204Page.acceptLoadWithOut990();
        
      });

      await test.step("Enter offer rate, save, and perform DFB Validation across app like DME and TNX", async () => {
        await pages.viewLoadPage.clickEditButton();
        //await pages.editLoadPage.selectRateType(testData.rateType);
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(`Load ID: ${loadNumber}`);
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        pages.logger.info(
          "Load created successfully and navigated to Edit Load page"
        );
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      });

      await test.step("Enter offer rate, save, and validate DFB form state in view mode", async () => {
        await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([
          CARRIER_NAME.CARRIER_1,
          CARRIER_NAME.CARRIER_2,
          CARRIER_NAME.CARRIER_3,
        ]);

        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.viewLoadPage.clickIncludeCarriersViewDetailsLink();

        await test.step("Update multiple carriers in loop", async () => {
          const carriersData = [
            {
              name: CARRIER_NAME.CARRIER_1,
              values: [
                PRIORITY.PRIORITY_1,
                CARRIER_TIMING.TIMING_4,
                LOAD_OFFER_RATES.OFFER_RATE_1,
              ],
            },
            {
              name: CARRIER_NAME.CARRIER_2,
              values: [
                PRIORITY.PRIORITY_2,
                CARRIER_TIMING.TIMING_1,
                LOAD_OFFER_RATES.OFFER_RATE_2,
              ],
            },
            {
              name: CARRIER_NAME.CARRIER_3,
              values: [
                PRIORITY.PRIORITY_3,
                CARRIER_TIMING.TIMING_1,
                LOAD_OFFER_RATES.OFFER_RATE_3,
              ],
            },
          ];

          // Set dynamic carrier count based on actual carriersData length
          dynamicCarrierCount = carriersData.length;
          console.log(` Dynamic carrier count set to: ${dynamicCarrierCount}`);

          for (const carrier of carriersData) {
            await pages.dfbIncludeCarriersDataModalWaterfall.clickCarrierPencilIconsAndInputValues(
              carrier.name,
              ...carrier.values // Spread operator to pass array as individual arguments
            );
          }
        });
        await pages.dfbIncludeCarriersDataModalWaterfall.clickPostAllCarrierCheckbox();
        await pages.dfbIncludeCarriersDataModalWaterfall.validatePostAllCarrierCheckboxIsChecked();
        await pages.dfbIncludeCarriersDataModalWaterfall.clickIncludeCarriersDataSaveButton();
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);
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
          includeCarriers: [
            CARRIER_NAME.CARRIER_1,
            CARRIER_NAME.CARRIER_2,
            CARRIER_NAME.CARRIER_3,
          ],
          emailNotification: testData.saleAgentEmail,
        });
        await pages.dfbLoadFormPage.validateFieldsAreNotEditable([
          DFB_FORM_FIELDS.Email_Notification,
          DFB_FORM_FIELDS.Expiration_Date,
          DFB_FORM_FIELDS.Expiration_Time,
          DFB_FORM_FIELDS.Commodity,
          DFB_FORM_FIELDS.NOTES,
          DFB_FORM_FIELDS.Exclude_Carriers,
          DFB_FORM_FIELDS.Include_Carriers,
        ]);

        await pages.dfbLoadFormPage.validateMixedButtonStates({
          [DFB_Button.Post]: false,
          [DFB_Button.Clear_Form]: false,
          [DFB_Button.Create_Rule]: true,
          [DFB_Button.Cancel]: true,
        });

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
          "Load Method": testData.loadMethod,
        });
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
          await tnxRepPages.tnxRepLandingPage.validateLoadRowsBasedOnCarrierCount(
            dynamicCarrierCount,
            loadNumber,
            [
              CARRIER_NAME.CARRIER_1,
              CARRIER_NAME.CARRIER_2,
              CARRIER_NAME.CARRIER_3,
            ],
            [
              LOAD_OFFER_RATES.OFFER_RATE_1,
              LOAD_OFFER_RATES.OFFER_RATE_2,
              LOAD_OFFER_RATES.OFFER_RATE_3,
            ]
          );
          await tnxRepPages.tnxRepLandingPage.validateNonIncludedCarrierRowWaterfall(
            [
              { name: CARRIER_NAME.CARRIER_4, offerRate: TNX.OFFER_RATE },
              { name: CARRIER_NAME.CARRIER_5, offerRate: TNX.OFFER_RATE },
              { name: CARRIER_NAME.CARRIER_7, offerRate: TNX.OFFER_RATE },
            ],
            loadNumber
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
    }
  );
});
