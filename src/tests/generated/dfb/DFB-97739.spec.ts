import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commissionHelper from "@utils/commission-helpers";
import DMEDashboardPage from "@pages/dme/DMEDashboradPage";
import DFBLoadFormPage from "@pages/loads/DFBLoadFormPage";
import commonReusables from "@utils/commonReusables";
import postMarkUtils from "@utils/emailUtils/postMarkUtils";

/**
 * Test Case: DFB-97739 - Automatically book a load when it is manually posted
 * Display a message when an active loadboard user is not selected for the
 * Carrier Contact for Rate Confirmation field on the load
 * @author AI Agent Generator
 * @date 2026-04-10
 * @category dfb
 */
const testcaseID = "DFB-97739";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let cargoValue: string;
let loadNumber: string;
let agentEmail: string;
let initialBidsCount: number;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 0 });
test.describe.serial(
  "Case ID: DFB-97739 - Automatically book a load when it is manually posted and display a message when an active loadboard user is not selected for the Carrier Contact for Rate Confirmation field on the load",
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
      "Case Id: DFB-97739 - Automatically book a load when it is manually posted and display a message when an active loadboard user is not selected for the Carrier Contact for Rate Confirmation field on the load",
      {
        tag: "@aiteam,@carrierautoaccept,@dfb"
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        // ═══════════════════════════════════════════════════════════════
        // PRECONDITIONS (Steps 1-6)
        // ═══════════════════════════════════════════════════════════════

        await test.step("Step 1 [Precond 1-5]: Login BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        });

        await test.step("Step 2 [Precond 6-14]: Office config — verify Match Vendor=TNX, Enable DME=YES", async () => {
          const toggleSettingsValue = pages.toggleSettings.enable_DME;
          await pages.dfbHelpers.setupOfficePreConditions(
            pages,
            testData.officeName,
            toggleSettingsValue,
            pages.toggleSettings.verifyAutoPost
          );
        });

        await test.step("Step 3 [Precond 15-20]: Agent Search — capture agent email", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
          await pages.agentSearchPage.nameInputOnAgentPage(testData.salesAgent);
          await pages.agentSearchPage.clickOnSearchButton();
          await pages.agentSearchPage.selectAgentByName(testData.salesAgent);
          agentEmail = await pages.agentInfoPage.getAgentEmail();
          pages.logger.info(`Agent email captured: ${agentEmail}`);
        });

        await test.step("Step 4 [Precond 21-26]: Switch user, Post Automation rule cleanup, customer credit and cargo", async () => {
          await pages.adminPage.hoverAndClickAdminMenu();
          await pages.adminPage.switchUser(testData.salesAgent);

          // Precond 24-26: HOME → OFFICE CONFIG → POST AUTOMATION → delete rule if exists
          await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
          await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName);

          // Customer credit and cargo value setup
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await commissionHelper.updateAvailableCreditOnCustomer(sharedPage);

          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
          cargoValue = await pages.viewCustomerPage.verifyAndSetCargoValue(CARGO_VALUES.DEFAULT);
          await pages.viewCustomerPage.setPracticalDefaultMethodIfNeeded();
        });

        await test.step("Step 5 [Precond 27-39]: Carrier — search, profile, MODE IQ, statuses, visibility", async () => {
          // Precond 27-29: Carrier Search — enter name
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
          await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
          await pages.carrierSearchPage.nameInputOnCarrierPage(CARRIER_NAME.CARRIER_18_KING);

          // Precond 30: Click on Search
          await pages.carrierSearchPage.clickOnSearchButton();
          await pages.carrierSearchPage.verifyCarrierListTableData(CARRIER_NAME.CARRIER_18_KING);

          // Precond 31: Click on carrier profile
          await pages.carrierSearchPage.selectCarrierByName(CARRIER_NAME.CARRIER_18_KING);
          // Precond 31: MODE IQ tab (LoadBoard tab in CSV)
          await pages.viewCarrierPage.clickLoadboardTab();
         

          // Precond 32: Carrier Status ACTIVE — hard assertion as specified in test case
          const carrierBtmsStatus = await pages.viewCarrierPage.getCarrierBtmsStatusValue();
          expect(carrierBtmsStatus, "Carrier BTMS Status must be Active").toBe(CARRIER_STATUS.ACTIVE.toUpperCase());

          // Precond 33: Loadboard Status Active — soft assertion (no hard assertion specified)
          const loadboardStatus = await pages.viewCarrierPage.getLoadboardStatus();
          expect.soft(loadboardStatus, "Loadboard Status should be Active").toBe(CARRIER_STATUS.ACTIVE);

          // Precond 35-39: Carrier Visibility toggles — check, enable if needed, update
          await pages.viewCarrierPage.ensureCarrierVisibilityTogglesEnabled([
            CARRIER_VISIBILITY.AVENGER_LOGISTICS,
            CARRIER_VISIBILITY.MODE_TRANSPORTATION,
            CARRIER_VISIBILITY.SUNTECK_TTS,
          ]);

          // Precond 40: Verify toggles are turned on
          const toggleStates = await pages.viewCarrierPage.getCarrierVisibilityToggleStates([
            CARRIER_VISIBILITY.AVENGER_LOGISTICS,
            CARRIER_VISIBILITY.MODE_TRANSPORTATION,
            CARRIER_VISIBILITY.SUNTECK_TTS,
          ]);
          expect.soft(toggleStates[CARRIER_VISIBILITY.AVENGER_LOGISTICS]?.enabled, "Avenger Logistics toggle should be enabled").toBe(true);
          expect.soft(toggleStates[CARRIER_VISIBILITY.MODE_TRANSPORTATION]?.enabled, "Mode Transportation toggle should be enabled").toBe(true);
          expect.soft(toggleStates[CARRIER_VISIBILITY.SUNTECK_TTS]?.enabled, "Sunteck TTS toggle should be enabled").toBe(true);
          pages.logger.info("Carrier visibility toggles verified/enabled");
        });

        await test.step("Step 6 [Precond 40-43]: Switch to DME — verify carrier toggle is enabled", async () => {
          await appManager.switchToDME();
          const dmePage = appManager.dmePage;
          const dmeDashboard = new DMEDashboardPage(dmePage);

          await dmeDashboard.ensureCarrierToggleEnabled(CARRIER_NAME.CARRIER_18_KING);
          pages.logger.info("DME carrier toggle verified");

          await appManager.switchToBTMS();
        });

        // ═══════════════════════════════════════════════════════════════
        // TEST STEPS (Steps 7-21)
        // ═══════════════════════════════════════════════════════════════

        await test.step("Step 7 [CSV 1-5]: Search customer and navigate to CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.selectCustomerByName(testData.customerName);
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
          pages.logger.info("Navigated to Enter New Load page");
        });

        await test.step("Step 8 [CSV 6-28]: Fill Enter New Load page details", async () => {
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

        await test.step("Step 9 [CSV 29]: Validate Linehaul and Fuel Surcharge defaults are Flat Rate", async () => {
          const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
          pages.logger.info(`Linehaul default: ${linehaulDefault}`);
          expect.soft(linehaulDefault, "Linehaul should default to 'Flat Rate'").toBe(DFB_RATE_DEFAULTS.LINEHAUL);

          const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
          pages.logger.info(`Fuel Surcharge default: ${fuelSurchargeDefault}`);
          expect.soft(fuelSurchargeDefault, "Fuel Surcharge should default to 'FLAT'").toBe(DFB_RATE_DEFAULTS.FUEL_SURCHARGE);
        });

        await test.step("Step 10 [CSV 30-31]: Click Create Load and select Rate Type", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);
          await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
          pages.logger.info("Load created successfully");
        });

        await test.step("Step 11 [CSV 32-34]: Carrier tab — enter offer rate, select carrier", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([CARRIER_NAME.CARRIER_18_KING]);
          pages.logger.info("Carrier tab — offer rate and carrier configured");
        });

        await test.step("Step 12 [CSV 35]: Check Carrier Auto Accept checkbox", async () => {
          await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
          // Expiration Date/Time auto-populate from origin pick deadline when Auto Accept is checked
          pages.logger.info("Carrier Auto Accept checked");
        });

        await test.step("Step 13 [CSV 36-39]: Save without carrier contact — validate error", async () => {
          // CSV Step 36: Do NOT select an active loadboard user for the Carrier Contact
          // CSV Step 37: Click Save
          await pages.editLoadFormPage.clickOnSaveBtn();
          // CSV Step 38-39: Validate alert and click OK
          await pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED
          );
          pages.logger.info("Validated alert: carrier contact required for auto accept");
        });

        await test.step("Step 14 [CSV 40]: Select active loadboard user for Carrier Contact", async () => {
          await pages.dfbLoadFormPage.selectCarrierContactForRateConfirmation(CARRIER_CONTACT.CONTACT_1);
          pages.logger.info("Carrier contact selected for rate confirmation");
        });

        await test.step("Step 15 [CSV 41]: Click Save button", async () => {
          await pages.editLoadFormPage.clickOnSaveBtn();
          await pages.viewLoadPage.validateViewLoadHeading();
          pages.logger.info("Load saved successfully");
        });

        await test.step("Step 16 [Ensure after CSV 41-42]: Validate view mode — DFB fields after save", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await commonReusables.waitForAllLoadStates(sharedPage);
          await pages.viewLoadPage.scrollToDFBSection();

          const formattedOfferRate = commonReusables.formatRateForDisplay(testData.offerRate);
          await pages.dfbLoadFormPage.validateDFBTextFieldHaveExpectedValues({
            offerRate: formattedOfferRate,
            expirationDate: pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
            expirationTime: testData.shipperLatestTime.padStart(5, "0"),
          });

          await pages.dfbLoadFormPage.validateFormFieldsState({
            includeCarriers: [CARRIER_NAME.CARRIER_18_KING],
            emailNotification: agentEmail,
          });

          // Validate Email for Notifications matches agent email captured in Step 3 (precond 20)
          pages.logger.info(`Email for Notifications should match agent email: ${agentEmail}`);

          const isAutoAcceptChecked = await pages.viewLoadPage.isAutoAcceptChecked();
          expect.soft(isAutoAcceptChecked, "Auto Accept should be checked").toBe(true);

          const carrierContactValue = await pages.viewLoadPage.getCarrierContactDropdownValue();
          expect.soft(carrierContactValue, "Carrier Contact should match the selected loadboard user").toContain(commonReusables.extractEmailFromContact(CARRIER_CONTACT.CONTACT_1));

          // All fields are not editable except the Include Carriers field (which remains editable)
          await pages.dfbLoadFormPage.validateFieldsAreNotEditable([
            DFB_FORM_FIELDS.Email_Notification,
            DFB_FORM_FIELDS.Expiration_Date,
            DFB_FORM_FIELDS.Expiration_Time,
            DFB_FORM_FIELDS.Commodity,
            DFB_FORM_FIELDS.NOTES,
            DFB_FORM_FIELDS.Exclude_Carriers,
            DFB_FORM_FIELDS.Include_Carriers,
          ]);
          

          pages.logger.info("View-mode field validations completed");
        });

        await test.step("Step 17 [Ensure after CSV 42-43]: Validate NOT POSTED status, activated buttons, capture BIDS baseline", async () => {
          await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.NOT_POSTED);

          await pages.dfbLoadFormPage.validateMultipleButtonActivation(
            [DFB_Button.Post, DFB_Button.Create_Rule, DFB_Button.Clear_Form],
            true
          );

          // Step 44.1 prep: Capture baseline BIDS count before posting (also stores in capturedBidsValue for validateBidsReportValue)
          const bidsBaseline = await pages.viewLoadCarrierTabPage.getBidsReportValue();
          initialBidsCount = parseInt(bidsBaseline) || 0;
          pages.logger.info(`Pre-post BIDS baseline count: ${initialBidsCount}`);

          pages.logger.info("NOT POSTED status and button states validated");
        });

        await test.step("Step 18 [CSV 44]: Click Post button", async () => {
          await pages.dfbLoadFormPage.clickOnPostButton();
          pages.logger.info("Load posted, moving to verification");
        });

        await test.step("Step 19 [Ensure after CSV 44]: Validate BTMS BOOKED, carrier assigned, dispatcher details", async () => {
          // Ensure after step 44: Status = BOOKED
          await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.BOOKED);

          // Carrier assigned to the load
          await pages.viewLoadPage.clickCarrierTab();
          await pages.viewLoadCarrierTabPage.validateCarrierAssignedText(CARRIER_NAME.CARRIER_18_KING);

          // Carrier Dispatcher Name and Email auto-populated from selected carrier contact
          await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(
            CARRIER_DISPATCH_NAME.DISPATCH_NAME_1
          );
          await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(
            CARRIER_DISPATCH_EMAIL.EMAIL_1
          );
          pages.logger.info("BTMS BOOKED status, carrier assigned, dispatcher details verified");
        });

        await test.step("Step 20 [CSV 44.1]: Validate BIDS count incremented by 1", async () => {
          // Step 44.1: BIDS report count should increment by 1 from baseline captured in Step 17
          // Uses capturedBidsValue (set by getBidsReportValue in Step 17) — polls with page refresh retries
          await pages.viewLoadCarrierTabPage.validateBidsReportValueWithRefresh();
          pages.logger.info("BIDS count increment validated");
        });

        await test.step("Step 21 [CSV 44.1-44.3]: Open BID HISTORY — validate entry count, avg rate calculation, and all columns", async () => {
          // Capture displayed Avg Rate from Carrier tab before opening popup
          const avgRateText = await pages.viewLoadPage.getAvgRate();
          pages.logger.info(`Displayed Avg Rate: ${avgRateText}`);

          // Open BID HISTORY popup
          await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks(TNX.BID_HISTORY);

          // Step 44.1: Total entry count in popup must equal BIDS report count
          const expectedBidsCount = initialBidsCount + 1;
          await pages.viewLoadCarrierTabPage.validateBidHistoryEntryCount(expectedBidsCount);

          // Step 44.2: Validate first row columns (must run BEFORE pagination moves to last page)
          await pages.viewLoadCarrierTabPage.validateBidHistoryFirstRow({
            shipCity: testData.shipperCity,
            shipState: testData.shipperState,
            consCity: testData.consigneeCity,
            consState: testData.consigneeState,
            carrier: CARRIER_NAME.CARRIER_18_KING,
            bidRate: testData.offerRate,
            equipment: DFB_BID_HISTORY_FIELDS.EQUIPMENT_1,
            source: DFB_BID_HISTORY_FIELDS.SOURCE,
            email: DFB_BID_HISTORY_FIELDS.TNX_SERVICE_EMAIL,
          });

          // Step 44.3: Paginate through ALL pages, sum ALL bid rates, validate entry count against BIDS, calculate avg
          const avgResult = await pages.viewLoadCarrierTabPage.calculateAndValidateAvgRate(avgRateText, expectedBidsCount);
          pages.logger.info(
            `Avg Rate — sum: ${avgResult.sum}, entries: ${avgResult.entryCount}, calculated: ${avgResult.calculatedAvg}`
          );

          await pages.viewLoadCarrierTabPage.closeBidHistoryModal();
          pages.logger.info("BID HISTORY entry count, avg rate calculation, and all columns verified");
        });

        await test.step("Step 22 [CSV 44.4]: Validate notification emails", async () => {
          // 1. Validate Rate Confirmation email sent to carrier contact
          const carrierContactEmail = commonReusables.extractEmailFromContact(CARRIER_CONTACT.CONTACT_1);
          const rateConfMsgId = await postMarkUtils.getMessageID(carrierContactEmail);
          const rateConfData = await postMarkUtils.getMessageData(rateConfMsgId);
          const rateConfBody = postMarkUtils.convertHtmlToPlainText(rateConfData.HtmlBody);

          expect.soft(rateConfData.Subject, "Rate Confirmation email subject should contain load number")
            .toContain(loadNumber);
          expect.soft(rateConfBody, "Rate Confirmation email body should not be empty")
            .toBeTruthy();
          pages.logger.info(`Rate Confirmation email validated — Subject: ${rateConfData.Subject}, To: ${carrierContactEmail}`);

          // 2. Validate notification email sent to agent email (captured in Step 3)
          const notifMsgId = await postMarkUtils.getMessageID(agentEmail);
          const notifData = await postMarkUtils.getMessageData(notifMsgId);

          expect.soft(notifData.Subject, "Notification email subject should contain load number")
            .toContain(loadNumber);
          pages.logger.info(`Agent notification email validated — Subject: ${notifData.Subject}, To: ${agentEmail}`);
        });

        await test.step("Step 23 [CSV 45-47]: Switch to DME — verify load statuses", async () => {
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

        await test.step("Step 24 [CSV 48-55]: Switch to TNX — verify load is Matched and execution notes", async () => {
          const tnxPages = await appManager.switchToTNX();
          await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });

          // CSV 51: Select carrier from dropdown
          await tnxPages.tnxLandingPage.selectOrganizationByText(CARRIER_NAME.CARRIER_18_KING);
          await tnxPages.tnxLandingPage.handleOptionalSkipButton();
          await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();

          // CSV 52: Click on Active Jobs
          await tnxPages.tnxLandingPage.clickOnTNXHeaderLink(TNX.ACTIVE_JOBS);

          // CSV 53: Click plus icon and search the load
          await tnxPages.tnxLandingPage.clickPlusButton();
          await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
          await tnxPages.tnxLandingPage.clickLoadSearchLink();
          await tnxPages.tnxLandingPage.validateBidsTabAvailableLoadsText(
            TNX.SINGLE_JOB_RECORD,
            loadNumber
          );

          // CSV 54: Click the load — ensure Matched and offer rate matches Step 11
          await tnxPages.tnxLandingPage.clickLoadLink();
          const tnxRateNumeric = await tnxPages.tnxLandingPage.getLoadOfferRateNumeric();
          const expectedRateNumeric = DFBLoadFormPage.normalizeRateToInteger(testData.offerRate);
          pages.logger.info(`TNX offer rate (numeric): ${tnxRateNumeric} | Expected: ${expectedRateNumeric}`);
          expect.soft(tnxRateNumeric, "Offer rate mismatch").toBe(expectedRateNumeric);

          // Validate status is MATCHED
          await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(
            TENDER_DETAILS_MODAL_TABS.GENERAL
          );
          await tnxPages.tnxLandingPage.validateStatusHistoryText(
            TNX_STATUS_HISTORY.STATUS_MATCHED
          );

          // CSV 55: Click on Progress and check execution notes fields are displayed
          // Validates all 14 fields: Carrier Dispatch Name/Email/Phone, Driver Name/Cell,
          // Truck/Trailer Number, Is Empty, Current/Empty Location City/State/Zip
          await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(
            TENDER_DETAILS_MODAL_TABS.PROGRESS
          );
          await tnxPages.tnxExecutionTenderPage.validateExecutionNotesFieldsPresence();
          pages.logger.info("TNX validation completed — load Matched, execution notes verified");
        });
      }
    );
  }
);
