import { test, expect } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import commissionHelper from "@utils/commission-helpers";


/**
 * Test Case to Post a load to the TNX (load created by Template) and check include carrier present on the load is displaying the load created through EDI.#
 * @author Deepak Bohra
 * @date 11-Nov-2025
 */
const testcaseID = "DFB-61666";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);
let loadNumber: string;
let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let pages: PageManager;
let totalMiles: string;
test.describe.configure({ retries: 1 });
test.describe
  .serial("Post a load to the TNX through Enable auto post with minimum field  (load create through template).", () => {
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
    "Case Id: 61666 - Load Posted that is only visible to carriers selected for the Include Carriers field on the load.",
    { tag: "@dfb,@tporegression,@smoke,@includecarrier,@autoposting" },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT); // 10 minutes

      let cargoValue: string;
      const toggleSettingsValue = pages.toggleSettings.enable_DME;
      // Login to BTMS
      await test.step("Login BTMS", async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT);
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        pages.logger.info("BTMS Login Successful");
      });

      // Set skipNavigateToLoad to true or false as needed for your test scenario
      const skipNavigateToLoad = true; // Change to true to skip navigation
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
          true,
          skipNavigateToLoad
        );
      });

      await test.step("Post a Load manually through a template", async () => {
        await pages.basePage.hoverOverClickOnLoads();
        await pages.basePage.clickOnTemplateSubMenu();
        await pages.loadTemplateSearchPage.searchTemplate(
          undefined,
          undefined,
          LOAD_TEMPLATE_SEARCH_PAGE.TEMPLATE_VALUE_6,
          undefined
        );
        await pages.loadTemplateSearchPage.selectTemplateRecord(
          LOAD_TEMPLATE_SEARCH_PAGE.TEMPLATE_VALUE_6
        );
        await pages.editTemplatePage.clickHeaderButton(BUTTONS.EDIT);
        await test.step("Enter the details for Pick Tab", async () => {
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
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

        pages.logger.info("Click on Save buttton and Create Load button");
        await pages.editTemplatePage.clickOnSaveBtn();
        await pages.editTemplatePage.clickHeaderButton(BUTTONS.CREATE_LOAD);

        await test.step("Click on Create Load Button and verify navigation to Edit Load page", async () => {
          //await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(
            testData.rateType
          );
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
          await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
          await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([
            CARRIER_NAME.CARRIER_1,
            CARRIER_NAME.CARRIER_2,
            CARRIER_NAME.CARRIER_3,
          ]);
          await pages.editLoadFormPage.clickOnSaveBtn();
          await pages.viewLoadPage.validateViewLoadHeading();
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          totalMiles = await pages.editLoadFormPage.getTotalMilesValue();
          console.log(`Total Miles: ${totalMiles}`);
          await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);
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
            DFB_FORM_FIELDS.Include_Carriers,
            DFB_FORM_FIELDS.Exclude_Carriers,
          ]);

          await pages.dfbLoadFormPage.validateMixedButtonStates({
            [DFB_Button.Post]: false,
            [DFB_Button.Clear_Form]: false,
            [DFB_Button.Create_Rule]: true,
            [DFB_Button.Cancel]: true,
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

        await test.step("Open TNX application and perform check the load is visible for the included carrier", async () => {
          // Switch to TNX application (initializes if needed)
          const tnxPages = await appManager.switchToTNX();

          const carrierNames = [
            CARRIER_NAME.CARRIER_1,
            CARRIER_NAME.CARRIER_2,
            CARRIER_NAME.CARRIER_3,
          ];
          for (const carrierName of carrierNames) {
            try {
              console.log(
                `Performing TNX operations for carrier: ${carrierName}`
              );
              await tnxPages.tnxLandingPage.selectOrganizationByText(
                carrierName
              );
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
                `$${TNX.OFFER_RATE}`
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
          const carrierNames = [CARRIER_NAME.CARRIER_4, CARRIER_NAME.CARRIER_5];
          for (const carrierName of carrierNames) {
            try {
              console.log(
                `Performing TNX operations for carrier: ${carrierName}`
              );
              await tnxPages.tnxLandingPage.selectOrganizationByText(
                carrierName
              );
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
      });
      // });
    }
  );
});
