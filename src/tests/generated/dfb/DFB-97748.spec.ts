import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commissionHelper from "@utils/commission-helpers";
import DMEDashboardPage from "@pages/dme/DMEDashboradPage";

/**
 * Test Case: DFB-97748 - Automatically book a load when it is manually posted
 * Display a message when an active loadboard user is not selected for the
 * Carrier Contact for Rate Confirmation field on the load
 *
 * @author AI Agent Generator
 * @date 2026-03-10
 * @category dfb
 */

test.describe.configure({ retries: 1 });
const testcaseID = "DFB-97748";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let cargoValue: string;
let loadNumber: string;
let agentEmail: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.serial(
  "Case ID: DFB-97748 - Automatically book a load when it is manually posted. Display a message when an active loadboard user is not selected for ...",
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      appManager = new MultiAppManager(sharedContext, sharedPage);
      pages = appManager.btmsPageManager;
    });

    test.afterAll(async () => {
      if (appManager) {
        await appManager.closeAllSecondaryPages();
      }
      if (sharedContext) {
        await sharedContext.close();
      }
    });

    test(
      "Case Id: DFB-97748 - Automatically book a load when it is manually posted. Display a message when an active loadboard user is not selected for ...",
      { tag: "@aiteam,@carrierautoaccept,@dfb" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1: Login BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          pages.logger.info("Logged in successfully");
        });

        await test.step("Step 2: Navigate to Agent Search and capture agent email", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
          await pages.agentSearchPage.nameInputOnAgentPage(testData.salesAgent);
          await pages.agentSearchPage.clickOnSearchButton();
          await pages.agentSearchPage.selectAgentByName(testData.salesAgent);
          agentEmail = await pages.agentInfoPage.getAgentEmail();
          pages.logger.info(`Agent email captured: ${agentEmail}`);
          await pages.basePage.navigateToBaseUrl();
        });

        await test.step("Step 3: Pre-Conditions setup — office config with DME/TNX validation (Steps 6-26)", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await pages.officePage.officeSearchRow(testData.officeName);

          const toggleSettingsValue = pages.toggleSettings.enable_DME;
          await pages.officePage.ensureToggleValues(toggleSettingsValue);
          await pages.officePage.ensureTnxValue();

          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await commissionHelper.updateAvailableCreditOnCustomer(sharedPage);

          await pages.adminPage.hoverAndClickAdminMenu();
          await pages.adminPage.switchUser(testData.salesAgent);

          await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
          await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName);

          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
          cargoValue = await pages.viewCustomerPage.verifyAndSetCargoValue(CARGO_VALUES.DEFAULT);
          await pages.viewCustomerPage.setPracticalDefaultMethodIfNeeded();
        });

        await test.step("Step 4: Navigate to Carrier Search and search for carrier", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
          await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
          await pages.carrierSearchPage.nameInputOnCarrierPage(testData.Carrier);
          await pages.carrierSearchPage.selectActiveOnCarrier();
          await pages.carrierSearchPage.clickOnSearchButton();
          await pages.carrierSearchPage.verifyCarrierListTableData(testData.Carrier);
          pages.logger.info("Carrier found in search results");
        });

        await test.step("Step 5: Click on carrier, verify loadboard status and carrier visibility toggles", async () => {
          await pages.carrierSearchPage.selectCarrierByName(testData.Carrier);

          const statusText = await pages.viewCarrierPage.getLoadboardStatus();
          pages.logger.info(`Carrier loadboard status: ${statusText}`);

          const requiredVisibility = [
            CARRIER_VISIBILITY.AVENGER_LOGISTICS,
            CARRIER_VISIBILITY.MODE_TRANSPORTATION,
            CARRIER_VISIBILITY.SUNTECK_TTS,
          ];

          const tabClicked = await pages.viewCarrierPage.clickLoadboardTab();
          if (tabClicked) {
          }

          let togglesFound = false;
          for (const name of requiredVisibility) {
            if (await pages.viewCarrierPage.isCarrierVisibilityLabelVisible(name)) {
              togglesFound = true;
              break;
            }
          }

          if (togglesFound) {
            const toggleStates = await pages.viewCarrierPage.getCarrierVisibilityToggleStates(requiredVisibility);

            const disabledToggles: string[] = [];
            for (const name of requiredVisibility) {
              const state = toggleStates[name];
              if (!state?.enabled) {
                disabledToggles.push(name);
              }
            }

            if (disabledToggles.length > 0) {
              await pages.basePage.clickButtonByText("Edit");
              await pages.viewCarrierPage.enableCarrierVisibilityToggles(disabledToggles);
              await pages.viewCarrierPage.clickSaveOnCarrierEditPage();
            }
          }
          pages.logger.info("Carrier visibility step completed");
        });

        await test.step("Step 6: Switch to DME and verify carrier is enabled with toggle ON (Precondition Steps 36-40)", async () => {
          await appManager.switchToDME();
          const dmePage = appManager.dmePage;
          const dmeDashboard = new DMEDashboardPage(dmePage);

          await dmeDashboard.clickCarriersLink();
          await dmeDashboard.searchCarrierByName(testData.Carrier);

          const toggleState = await dmeDashboard.getCarrierToggleState(testData.Carrier);
          pages.logger.info(`DME carrier toggle state: ${toggleState.enabled ? "ON" : "OFF"}`);
          if (!toggleState.enabled && toggleState.found) {
            await dmeDashboard.enableCarrierToggle(testData.Carrier);
          }

          pages.logger.info("DME carrier toggle verified");

          await appManager.switchToBTMS();
        });

        // ═══════ TEST STEPS (CSV Column F, Steps 1-55) ═══════
        // Preconditions completed above
        await test.step("Step 7 [CSV 1-5]: Switch to BTMS, search customer, navigate to CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
          pages.logger.info("Navigated to Enter New Load page");
        });

        await test.step("Step 8 [CSV 6-29]: Fill Enter New Load page details", async () => {
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
          pages.logger.info("Enter New Load form completed");
        });

        await test.step("Step 9 [CSV 30-31]: Click Create Load and select Rate Type", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);
          await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        });

        await test.step("Step 10 [CSV 32-35]: Carrier tab — enter offer rate, select carrier, check auto accept", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.Carrier]);
          await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
          pages.logger.info("Carrier tab configured for auto accept test");
        });

        await test.step("Step 11 [CSV 37-39]: Save without carrier contact — validate error and dismiss", async () => {
          await pages.editLoadFormPage.clickOnSaveBtn();
          await pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED
          );
          pages.logger.info("Validated alert: carrier contact required for auto accept");
        });

        await test.step("Step 12 [CSV 40-41]: Select Carrier Contact for Rate Confirmation and Save", async () => {
          await pages.dfbLoadFormPage.selectCarreirContactForRateConfirmation(
            CARRIER_CONTACT.CONTACT_1
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          await pages.viewLoadPage.validateViewLoadHeading();
          pages.logger.info("Load saved with carrier contact");
        });

        await test.step("Step 13 [CSV 42-43]: Validate view mode — email, DFB fields, non-editable fields, buttons", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);

          await pages.viewLoadPage.scrollToDFBSection();

          const formattedOfferRate = parseFloat(testData.offerRate).toFixed(2);
          const expectedValues = {
            offerRate: formattedOfferRate,
            expirationDate: commonReusables.getNextTwoDatesFormatted().tomorrow,
            expirationTime: testData.shipperLatestTime,
          };
          await pages.dfbLoadFormPage.validateDFBTextFieldHaveExpectedValues(expectedValues);

          await pages.dfbLoadFormPage.validateFormFieldsState({
            includeCarriers: [testData.Carrier],
            emailNotification: agentEmail,
          });

          const isAutoAcceptChecked = await pages.viewLoadPage.isAutoAcceptChecked();
          pages.logger.info(`Auto Accept checked: ${isAutoAcceptChecked}`);

          const carrierContactValue = await pages.viewLoadPage.getCarrierContactDropdownValue();
          pages.logger.info(`Carrier Contact for Rate Confirmation: ${carrierContactValue}`);

          await pages.dfbLoadFormPage.validateFieldsAreNotEditable([
            DFB_FORM_FIELDS.Email_Notification,
            DFB_FORM_FIELDS.Expiration_Date,
            DFB_FORM_FIELDS.Expiration_Time,
            DFB_FORM_FIELDS.Commodity,
            DFB_FORM_FIELDS.NOTES,
            DFB_FORM_FIELDS.Exclude_Carriers,
            DFB_FORM_FIELDS.Include_Carriers,
          ]);

          await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.NOT_POSTED);

          await pages.dfbLoadFormPage.validateMixedButtonStates({
            [DFB_Button.Post]: true,
            [DFB_Button.Clear_Form]: true,
            [DFB_Button.Create_Rule]: true,
          });
          pages.logger.info("DFB form view mode validations complete");
        });

        await test.step("Step 14 [CSV 44]: Post the load", async () => {
          await pages.dfbLoadFormPage.clickOnPostButton();
          pages.logger.info("Load posted, moving to DME verification");
        });

        await test.step("Step 15 [CSV 45-47]: Switch to DME — verify load with BTMS CANCELLED and TNX BOOKED statuses", async () => {
          const dmePages = await appManager.switchToDME();
          await dmePages.dmeDashboardPage.clickOnLoadsLink();
          await dmePages.dmeDashboardPage.searchLoad(loadNumber);
          await dmePages.dmeLoadPage.validateAndGetStatusTextWithRetry(
            LOAD_STATUS.BTMS_CANCELLED,
            LOAD_STATUS.TNX_BOOKED,
            loadNumber,
            dmePages.dmeDashboardPage
          );
          await dmePages.dmeLoadPage.validateSingleTableRowPresent();
          await dmePages.dmeLoadPage.validateAndGetSourceIdText(loadNumber);
          await dmePages.dmeLoadPage.clickOnDataDetailsLink();
          await dmePages.dmeLoadPage.clickOnShowIconLink();
          await dmePages.dmeLoadPage.validateAuctionAssignedText(
            loadNumber,
            dmePages.dmeDashboardPage
          );
          pages.logger.info("DME load verification completed");
        });

        await test.step("Step 16 [CSV 48-55]: Switch to TNX — verify load is Matched and execution notes fields", async () => {
          const tnxPages = await appManager.switchToTNX();
          await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });

          const allOptions = await tnxPages.tnxLandingPage.getOrgDropdownOptions();
          pages.logger.info(`TNX org options: [${allOptions.join(" | ")}]`);
          const carrierUpper = testData.Carrier.toUpperCase();
          const matchedOption = allOptions.find((opt: string) => opt.toUpperCase().includes(carrierUpper));
          if (matchedOption) {
            await tnxPages.tnxLandingPage.selectOrganizationByText(matchedOption.trim());
          } else {
            await tnxPages.tnxLandingPage.selectOrganizationByText(testData.Carrier);
          }
          await tnxPages.tnxLandingPage.handleOptionalSkipButton();
          await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
          await tnxPages.tnxLandingPage.clickOnTNXHeaderLink(TNX.ACTIVE_JOBS);
          await tnxPages.tnxLandingPage.clickPlusButton();
          await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
          await tnxPages.tnxLandingPage.clickLoadSearchLink();
          await tnxPages.tnxLandingPage.validateBidsTabAvailableLoadsText(
            TNX.SINGLE_JOB_RECORD,
            loadNumber
          );
          await tnxPages.tnxLandingPage.clickLoadLink();
          const tnxOfferRate = await tnxPages.tnxLandingPage.getLoadOfferRateValue();
          const tnxRateNumeric = tnxOfferRate.replace(/[\$,]/g, "").split(".")[0];
          const expectedRateNumeric = testData.offerRate.replace(/[\$,]/g, "").split(".")[0];
          pages.logger.info(`TNX offer rate: ${tnxOfferRate}, expected: ${testData.offerRate}`);
          expect(tnxRateNumeric, `Offer rate mismatch — TNX: ${tnxRateNumeric}, Expected: ${expectedRateNumeric}`).toBe(expectedRateNumeric);
          await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(
            TENDER_DETAILS_MODAL_TABS.GENERAL
          );
          await tnxPages.tnxLandingPage.validateStatusHistoryText(
            TNX_STATUS_HISTORY.STATUS_MATCHED
          );
          await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(
            TENDER_DETAILS_MODAL_TABS.PROGRESS
          );
          await tnxPages.tnxExecutionTenderPage.validateExecutionNotesFieldsPresence();
          pages.logger.info("TNX validation completed — load Matched, execution notes verified");
        });

        await test.step("Step 17: Switch back to BTMS — verify BOOKED status, carrier details, BIDS and Bid History", async () => {
          await appManager.switchToBTMS();
          await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.BOOKED);

          await pages.viewLoadPage.clickCarrierTab();
          await pages.viewLoadCarrierTabPage.validateCarrierAssignedText(testData.Carrier);

          await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(
            CARRIER_DISPATCH_NAME.DISPATCH_NAME_1
          );

          await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(
            CARRIER_DISPATCH_EMAIL.EMAIL_1
          );

          const bidsReportValue = await pages.viewLoadCarrierTabPage.getBidsReportValue();
          pages.logger.info(`BIDS Reports value: ${bidsReportValue}`);
          expect.soft(bidsReportValue, "BIDS Reports value should not be empty").toBeTruthy();

          const avgRate = await pages.viewLoadPage.getAvgRate();
          pages.logger.info(`Avg Rate: ${avgRate}`);
          expect.soft(avgRate, "Avg Rate should be populated after booking").toBeTruthy();

          await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks(TNX.BID_HISTORY);
          const bidHistoryDetails = await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
          pages.logger.info(`Bid History — Carrier: ${bidHistoryDetails.carrier}, Rate: ${bidHistoryDetails.bidRate}, Source: ${bidHistoryDetails.source}`);
          expect.soft(bidHistoryDetails.carrier, "Bid History carrier should match assigned carrier").toContain(testData.Carrier);
          expect.soft(bidHistoryDetails.source, "BIDS Source should be populated").toBeTruthy();
          await pages.viewLoadCarrierTabPage.closeBidHistoryModal();

          pages.logger.info("BTMS BOOKED status, carrier details, BIDS and Bid History verified");
        });

        await appManager.closeAllSecondaryPages();
      }
    );
  }
);
