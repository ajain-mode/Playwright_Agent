import { test, expect } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";

/**
 * Test Case: DFB-97796 - Automatically post a load to the TNX that:- has a Cargo Value of $100,001 to $250,000- is only visible to a single carrier on a waterfall
 * @author Parth Rastogi
 * @date 29-Dec-2025
 */

const testcaseID = "DFB-97796";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);
let cargoValue: string;
let loadNumber: string;
let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let pages: PageManager;
let dynamicCarrierCount: number; // Add this to store carrier count
let tnxRepPages: PageManager;
test.describe.configure({ retries: 1 });
test.describe
  .serial("Automatically post a load to the TNX that:- has a Cargo Value of $100,001 to $250,000- is only visible to a single carrier on a waterfall", () => {
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
      "Case Id: 97796 - Automatically post a load to the TNX that:- has a Cargo Value of $100,001 to $250,000- is only visible to a single carrier on a waterfall that has been configured on the loadNumber of included carriers",
      {
        tag: "@dfb,@tporegression,@waterfall,@smoke,@cargovalue",
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes
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
            pages.toggleSettings.enabledAutoPost, // ← Now passed as argument
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

          // await pages.nonTabularLoadPage.clickCreateLoadButton();
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
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          console.log(`Load Number: ${loadNumber}`);
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.viewLoadCarrierTabPage.getBidsReportValue();
          await pages.dfbLoadFormPage.performCompleteLoadValidation(
            cargoValue,
            COUNTRY.USA
          );
        });

        await test.step("Enter offer rate, save, and validate DFB form state in view mode", async () => {
          await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
          await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([
            CARRIER_NAME.CARRIER_1,
          ]);
          await pages.editLoadCarrierTabPage.selectCargoValue(
            CARGO_VALUES.FROM_100001_TO_250000
          );
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

          await pages.dfbIncludeCarriersDataModalWaterfall.clickIncludeCarriersDataSaveButton();

          await pages.editLoadFormPage.clickOnSaveBtn();
          await pages.viewLoadPage.validateViewLoadHeading();
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);
          const cargoValueFormatted =
            await pages.viewLoadCarrierTabPage.getCargoValue();
          console.log(`Cargo Value (Formatted): ${cargoValueFormatted}`);
          expect(cargoValueFormatted).toContain(
            CARGO_VALUES.FROM_100001_TO_250000
          );

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

        await test.step("Open TNX Rep application and perform matching", async () => {
          // Switch to TNX Rep application (initializes if needed)
          tnxRepPages = await appManager.switchToTNXRep(); // Assign to the global variable

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
              ],
              [
                LOAD_OFFER_RATES.OFFER_RATE_1,
              ]
            );

            console.log("✅ TNX Rep operations completed successfully");
          } catch (error) {
            console.error("❌ Error in TNX Rep operations:", error);
            throw error;
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
      }
    );
  });
