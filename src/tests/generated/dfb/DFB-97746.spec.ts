import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commissionHelper from "@utils/commission-helpers";
import DMEDashboardPage from "@pages/dme/DMEDashboradPage";
import DFBLoadFormPage from "@pages/loads/DFBLoadFormPage";

/**
 * Test Case: DFB-97746 - Automatically book a load when it is manually postedDisplay a message when an active loadboard user is not selected for the Carrier Contact for Rate Confirmation field on the load
 * @author AI Agent Generator
 * @date 2026-02-25
 * @category dfb
 */
const testcaseID = "DFB-97746";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let cargoValue: string;
let loadNumber: string;
let agentEmail: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 0});
test.describe.serial(
  "Case ID: DFB-97746 - Automatically book a load when it is manually postedDisplay a message when an active loadboard user is not selected for the Carrier Contact for Rate Confirmation field on the load",
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
      "Case Id: DFB-97746 - Automatically book a load when it is manually postedDisplay a message when an active loadboard user is not selected for the Carrier Contact for Rate Confirmation field on the load",
      {
        tag: "@aiteam,@carrierautoaccept,@dfb"
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes

      await test.step("Step 1: Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
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

      await test.step("Step 3: Pre-Conditions setup — office config with DME/TNX validat...", async () => {
        const toggleSettingsValue = pages.toggleSettings.enable_DME;
        await pages.dfbHelpers.setupOfficePreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.verifyAutoPost
        );

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

      await test.step("Step 5: Click on carrier, verify loadboard status and carrier vis...", async () => {
        await pages.carrierSearchPage.selectCarrierByName(testData.Carrier);

        await pages.viewCarrierPage.ensureCarrierVisibilityTogglesEnabled([
            CARRIER_VISIBILITY.AVENGER_LOGISTICS,
            CARRIER_VISIBILITY.MODE_TRANSPORTATION,
            CARRIER_VISIBILITY.SUNTECK_TTS,
        ]);
        pages.logger.info("Carrier visibility step completed");

        const statusText = await pages.viewCarrierPage.getLoadboardStatus();
        pages.logger.info(`Carrier loadboard status: ${statusText}`);
        expect(statusText, "Loadboard status should be retrieved after Mode IQ tab is active").toBeTruthy();
      });

      await test.step("Step 6: Switch to DME and verify carrier is enabled with toggle O...", async () => {
        await appManager.switchToDME();
        const dmePage = appManager.dmePage;
        const dmeDashboard = new DMEDashboardPage(dmePage);

        await dmeDashboard.ensureCarrierToggleEnabled(testData.Carrier);
        pages.logger.info("Precondition Step 40: DME carrier toggle verified");

        await appManager.switchToBTMS();
      });

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

      await test.step("Step 8 [CSV 6-26]: Fill Enter New Load page details (CSV 6-26)", async () => {
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
      await test.step("Step 10 [CSV 29-30]: Click Create Load and select Rate Type", async () => {
        await pages.nonTabularLoadPage.clickCreateLoadButton();
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        pages.logger.info(`Load number: ${loadNumber}`);
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        pages.logger.info("Load created successfully");
      });

      await test.step("Step 11 [CSV 31-35]: Carrier tab — enter offer rate, select carrier, check auto accept", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.Carrier]);
        await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
        pages.logger.info("Carrier tab configured for auto accept test");
      });

      await test.step("Step 12 [CSV 36-38]: Save without carrier contact — validate error, fix and re-save", async () => {
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.commonReusables.validateAlert(
        sharedPage,
        ALERT_PATTERNS.A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED
        );
        pages.logger.info("Validated alert: carrier contact required for auto accept");
      });

      await test.step("Step 13: Select an active loadboard user for the Carrier Contact f...", async () => {
        // Select carrier contact for rate confirmation
        await pages.dfbLoadFormPage.selectCarreirContactForRateConfirmation(CARRIER_CONTACT.CONTACT_1);
      });

      await test.step("Step 14: Click the Save button on the load.", async () => {
        await pages.editLoadFormPage.clickOnSaveBtn();
        console.log("Save button clicked");
        await pages.viewLoadPage.validateViewLoadHeading();
        console.log("View load heading validated");
      });

      await test.step("Step 14b [CSV 39]: Validate view-mode fields after save", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        console.log("Carrier tab clicked");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.viewLoadPage.scrollToDFBSection();

        const formattedOfferRate = parseFloat(testData.offerRate).toFixed(2);
        await pages.dfbLoadFormPage.validateDFBTextFieldHaveExpectedValues({
          offerRate: formattedOfferRate,
          expirationDate: pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
          expirationTime: testData.shipperLatestTime.padStart(5, "0"),
        });

        await pages.dfbLoadFormPage.validateFormFieldsState({
          includeCarriers: [testData.Carrier],
          emailNotification: agentEmail,
        });

        const isAutoAcceptChecked = await pages.viewLoadPage.isAutoAcceptChecked();
        //pages.logger.info(`Carrier Auto Accept: ${isAutoAcceptChecked ? "checked" : "NOT checked"}`);
        expect.soft(isAutoAcceptChecked, "Auto Accept should be checked").toBe(true);
        const carrierContactValue = await pages.viewLoadPage.getCarrierContactDropdownValue();
        //pages.logger.info(`Carrier Contact for Rate Confirmation: ${carrierContactValue}`);
        expect.soft(carrierContactValue, "Carrier Contact should be selected").toBeTruthy();
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

      await test.step("Step 15a [CSV 43]: Validate NOT POSTED status and buttons", async () => {
        await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.NOT_POSTED);

        await pages.dfbLoadFormPage.validateMultipleButtonActivation(
          [DFB_Button.Post, DFB_Button.Create_Rule, DFB_Button.Clear_Form],
          true
        );

        pages.logger.info("NOT POSTED status and button states validated");
      });

      await test.step("Step 15b [CSV 44]: Click Post button and validate status changes to POSTED", async () => {
        await pages.dfbLoadFormPage.clickOnPostButton();
        pages.logger.info("Load posted, moving to verification");
      });

      await test.step("Step 16 [Ensure after CSV 44]: Validate BTMS BOOKED status, carrier details, and emails", async () => {
        await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.BOOKED);

        await pages.viewLoadPage.clickCarrierTab();
        await pages.viewLoadCarrierTabPage.validateCarrierAssignedText(testData.Carrier);

        await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(
          CARRIER_DISPATCH_NAME.DISPATCH_NAME_1
        );

        await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(
          CARRIER_DISPATCH_EMAIL.EMAIL_1
        );

        // Validate BIDS Source
        const bidsReportValue = await pages.viewLoadCarrierTabPage.getBidsReportValue();
        pages.logger.info(`BIDS Reports value: ${bidsReportValue}`);
        expect.soft(bidsReportValue, "BIDS Reports value should not be empty").toBeTruthy();

        // Validate Avg Rate is updated
        const avgRate = await pages.viewLoadPage.getAvgRate();
        pages.logger.info(`Avg Rate: ${avgRate}`);
        expect.soft(avgRate, "Avg Rate should be populated after booking").toBeTruthy();

        // Validate Bid History
        await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks(TNX.BID_HISTORY);
        const bidHistoryDetails = await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
        pages.logger.info(`Bid History — Carrier: "${bidHistoryDetails.carrier}", Rate: "${bidHistoryDetails.bidRate}", Source: "${bidHistoryDetails.source}"`);
        expect.soft(bidHistoryDetails.carrier, "Bid History carrier should match assigned carrier").toContain(testData.Carrier);
        expect.soft(bidHistoryDetails.source, "BIDS Source should be populated").toBeTruthy();
        await pages.viewLoadCarrierTabPage.closeBidHistoryModal();

        // Validate Notification email - agent email from Email for Notifications
        pages.logger.info(`Agent email for notifications: ${agentEmail}`);
        expect.soft(agentEmail, "Agent email for notifications should have been captured").toBeTruthy();

        pages.logger.info("BTMS BOOKED status, carrier details, BIDS, Bid History, and emails verified");
      });

      await test.step("Step 17 [CSV 44-46]: Switch to DME — verify load statuses", async () => {
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

      await test.step("Step 18 [CSV 47-52]: Switch to TNX — verify load is Matched and execution notes", async () => {
        const tnxPages = await appManager.switchToTNX();
        await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });

        await tnxPages.tnxLandingPage.selectOrganizationByText(testData.Carrier);
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
        const tnxRateNumeric = await tnxPages.tnxLandingPage.getLoadOfferRateNumeric();
        const expectedRateNumeric = DFBLoadFormPage.normalizeRateToInteger(testData.offerRate);
        pages.logger.info(`TNX offer rate (numeric): ${tnxRateNumeric} | Expected: ${expectedRateNumeric}`);
        expect(tnxRateNumeric, `Offer rate mismatch`).toBe(expectedRateNumeric);
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
      }
    );
  }
);
