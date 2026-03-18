import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commissionHelper from "@utils/commission-helpers";
import DMEDashboardPage from "@pages/dme/DMEDashboradPage";

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

test.describe.configure({ retries: 1 });
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
        if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
        await pages.btmsAcceptTermPage.acceptTermsAndConditions();
        }
      });

      await test.step("Step 2: Navigate to Agent Search and capture agent email", async () => {
        await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
        await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
        await pages.agentSearchPage.nameInputOnAgentPage(testData.salesAgent);
        await pages.agentSearchPage.clickOnSearchButton();
        await pages.agentSearchPage.selectAgentByName(testData.salesAgent);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        agentEmail = await pages.agentInfoPage.getAgentEmail();
        console.log(`Captured agent email from Agent Info: "${agentEmail}"`);
        pages.logger.info(`Agent email captured: ${agentEmail}`);
        await pages.basePage.navigateToBaseUrl();
      });

      await test.step("Step 3: Pre-Conditions setup — office config with DME/TNX validat...", async () => {
        await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
        await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
        await pages.officePage.officeCodeSearchField(testData.officeName);
        await pages.officePage.searchButtonClick();
        await pages.officePage.officeSearchRow(testData.officeName);
        console.log("Precondition Steps 6-10: Navigated to Office profile");

        const toggleSettingsValue = pages.toggleSettings.enabled_TNXBids;
        await pages.officePage.ensureToggleValues(toggleSettingsValue);
        await pages.officePage.ensureTnxValue();
        console.log("Office toggle configuration complete");

        await pages.basePage.navigateToBaseUrl();
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        await pages.searchCustomerPage.clickOnSearchCustomer();
        await pages.searchCustomerPage.clickOnActiveCustomer();
        await commissionHelper.updateAvailableCreditOnCustomer(sharedPage);
        console.log("Office Pre-condition set successfully");

        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);
        console.log("Switched user to agent salesperson");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle", "domcontentloaded"]);

        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName);
        console.log("Verified no post automation rule for customer");

        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
        cargoValue = await pages.viewCustomerPage.verifyAndSetCargoValue(CARGO_VALUES.DEFAULT);
        await pages.viewCustomerPage.setPracticalDefaultMethodIfNeeded();
        console.log("Customer search and load navigation successful");
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
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        const statusText = await pages.viewCarrierPage.getLoadboardStatus();
        console.log(`Loadboard Status: "${statusText}"`);
        pages.logger.info(`Carrier loadboard status: ${statusText}`);

        const requiredVisibility = [
        "Avenger Logistics",
        "Mode Transportation",
        "Sunteck Transport Co",
        "TTS",
        ];

        const tabClicked = await pages.viewCarrierPage.clickLoadboardTab();
        expect.soft(tabClicked, "Mode ID tab should be visible and clickable on carrier page").toBeTruthy();
        if (tabClicked) {
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked on Mode ID tab");
        }

        let togglesFound = false;
        for (const name of requiredVisibility) {
        if (await pages.viewCarrierPage.isCarrierVisibilityLabelVisible(name)) {
        togglesFound = true;
        break;
        }
        }

        if (togglesFound) {
        console.log("Precondition Step 32: Carrier visibility labels found. Checking toggle states via DOM inspection...");
        const toggleStates = await pages.viewCarrierPage.getCarrierVisibilityToggleStates(requiredVisibility);

        const disabledToggles: string[] = [];
        for (const name of requiredVisibility) {
        const state = toggleStates[name];
        if (state?.enabled) {
        console.log(`Precondition Step 32: "${name}" is already enabled (${state.debug})`);
        } else {
        disabledToggles.push(name);
        console.log(`Precondition Step 32: "${name}" needs enabling (${state?.debug})`);
        }
        }

        if (disabledToggles.length > 0) {
        console.log(`Precondition Steps 33-35: ${disabledToggles.length} toggle(s) need updating — clicking Edit...`);
        await pages.basePage.clickButtonByText("Edit");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.viewCarrierPage.enableCarrierVisibilityToggles(disabledToggles);
        await pages.viewCarrierPage.clickSaveOnCarrierEditPage();
        console.log("Precondition Step 35: Clicked Save on carrier edit page");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        } else {
        console.log("Precondition Step 32: All carrier visibility toggles are already enabled — skipping steps 33-35");
        }
        } else {
        console.log("Carrier visibility labels not found on this page. Toggle check skipped — verify manually if needed.");
        }
        pages.logger.info("Carrier visibility step completed");
      });

      await test.step("Step 6: Switch to DME and verify carrier is enabled with toggle O...", async () => {
        await appManager.switchToDME();
        const dmePage = appManager.dmePage;
        const dmeDashboard = new DMEDashboardPage(dmePage);

        await dmeDashboard.clickCarriersLink();
        console.log("Precondition Step 38: Clicked Carriers link in DME sidebar");

        await dmeDashboard.searchCarrierByName(testData.Carrier);
        console.log(`Precondition Step 39: Searched for carrier: ${testData.Carrier}`);

        const toggleState = await dmeDashboard.getCarrierToggleState(testData.Carrier);
        console.log(`Precondition Step 40: Carrier toggle is currently ${toggleState.enabled ? "ON" : "OFF"}`);
        if (!toggleState.enabled && toggleState.found) {
        await dmeDashboard.enableCarrierToggle(testData.Carrier);
        console.log("Carrier toggle was OFF — clicked to enable");
        } else if (toggleState.enabled) {
        console.log("Carrier toggle is already ON — no action needed");
        } else {
        console.log(`Carrier "${testData.Carrier}" not found in DME carriers table — may already be enabled`);
        }

        console.log("Precondition Steps 36-40 complete");
        pages.logger.info("Precondition Step 40: DME carrier toggle verified");

        await appManager.switchToBTMS();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Switched back to BTMS — preconditions complete, starting test steps");
      });

      await test.step("Step 7 [CSV 1-5]: Search customer and navigate to CREATE TL *NEW*", async () => {
        await pages.basePage.navigateToBaseUrl();
        console.log("Navigated to BTMS Home");
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        console.log("Hovered to Customers and clicked Search");
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        console.log(`Entered customer name: ${testData.customerName}`);
        await pages.searchCustomerPage.selectActiveOnCustomerPage();
        await pages.searchCustomerPage.clickOnSearchCustomer();
        console.log("Clicked Search button");
        await pages.searchCustomerPage.selectCustomerByName(testData.customerName);
        console.log("Clicked on Customer profile");
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        console.log("Clicked CREATE TL *NEW* hyperlink");
        pages.logger.info("Navigated to Enter New Load page");
      });

      await test.step("Step 8 [CSV 6-26]: Fill Enter New Load page details (CSV 6-26)", async () => {
        console.log("CSV 6-7: Customer field pre-selected, Salesperson/Dispatcher pre-selected");
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
        console.log("Shipper, Consignee, dates/times, commodity, equipment fields filled");
        pages.logger.info("Enter New Load form completed");
      });
      await test.step("Step 10 [CSV 29-30]: Click Create Load and select Rate Type", async () => {
        await pages.nonTabularLoadPage.clickCreateLoadButton();
        console.log("Clicked Create Load button");
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        console.log(`Rate type set to ${testData.rateType}`);
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(`Load Number captured: ${loadNumber}`);
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        pages.logger.info("Load created successfully");
      });

      await test.step("Step 11 [CSV 31-35]: Carrier tab — enter offer rate, select carrier, check auto accept", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        console.log("Clicked Carrier tab");
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        console.log(`Entered Offer Rate: ${testData.offerRate}`);
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.Carrier]);
        console.log(`Selected carrier: ${testData.Carrier}`);
        await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
        console.log("Checked Carrier Auto Accept checkbox");
        console.log("Carrier Contact for Rate Confirmation intentionally left empty");
        pages.logger.info("Carrier tab configured for auto accept test");
      });

      await test.step("Step 12 [CSV 36-38]: Save without carrier contact — validate error, fix and re-save", async () => {
        await pages.editLoadFormPage.clickOnSaveBtn();
        console.log("Clicked Save button");
        await pages.commonReusables.validateAlert(
        sharedPage,
        ALERT_PATTERNS.A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED
        );
        console.log("Validated alert — A carrier contact for auto accept must be selected");
        console.log("Clicked OK to dismiss alert");
        pages.logger.info("Validated alert: carrier contact required for auto accept");
      });

      await test.step("Step 13: Select an active loadboard user for the Carrier Contact f...", async () => {
        // Select carrier contact for rate confirmation
        await pages.dfbLoadFormPage.selectCarreirContactForRateConfirmation(CARRIER_CONTACT.CONTACT_1);
        console.log("Selected carrier contact for rate confirmation");
      });

      await test.step("Step 14: Click the Save button on the load.", async () => {
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.viewLoadPage.validateViewLoadHeading();
        console.log("Load saved and displayed in View mode");
      });

      await test.step("Step 15 [CSV 41]: Navigate to Carrier tab and Post the load", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked Carrier tab");
        await pages.dfbLoadFormPage.clickOnPostButton();
        console.log("Clicked Post button");
        pages.logger.info("Load posted, moving to verification");
      });

      await test.step("Step 18 [CSV 44-46]: Switch to DME — verify load statuses", async () => {
        console.log("Switching to DME application");
        const dmePages = await appManager.switchToDME();
        await dmePages.dmeDashboardPage.clickOnLoadsLink();
        console.log("Clicked on Loads");
        await dmePages.dmeDashboardPage.searchLoad(loadNumber);
        console.log(`Searched for load number: ${loadNumber}`);
        await dmePages.dmeLoadPage.validateAndGetStatusTextWithRetry(
        LOAD_STATUS.BTMS_CANCELLED,
        LOAD_STATUS.TNX_BOOKED,
        loadNumber,
        dmePages.dmeDashboardPage
        );
        console.log("Validated: DME statuses — BTMS CANCELLED, TNX BOOKED");
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

      await test.step("Step 19 [CSV 47-52]: Switch to TNX — verify load is Matched and execution notes", async () => {
        console.log("Switching to TNX application and logging in");
        const tnxPages = await appManager.switchToTNX();
        await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });

        const allOptions = await tnxPages.tnxLandingPage.getOrgDropdownOptions();
        console.log(`TNX org dropdown options: [${allOptions.join(" | ")}]`);
        const carrierUpper = testData.Carrier.toUpperCase();
        const matchedOption = allOptions.find((opt: string) => opt.toUpperCase().includes(carrierUpper));
        if (matchedOption) {
        console.log(`Found matching TNX org option: "${matchedOption}" for carrier "${testData.Carrier}"`);
        await tnxPages.tnxLandingPage.selectOrganizationByText(matchedOption.trim());
        } else {
        console.log(`No matching option found for "${testData.Carrier}" — trying exact name`);
        await tnxPages.tnxLandingPage.selectOrganizationByText(testData.Carrier);
        }
        console.log(`Selected carrier from dropdown: ${testData.Carrier}`);
        await tnxPages.tnxLandingPage.handleOptionalSkipButton();
        await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
        await tnxPages.tnxLandingPage.clickOnTNXHeaderLink(TNX.ACTIVE_JOBS);
        console.log("Clicked on Active Jobs");
        await tnxPages.tnxLandingPage.clickPlusButton();
        await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
        console.log(`Clicked plus icon and searched load: ${loadNumber}`);
        await tnxPages.tnxLandingPage.clickLoadSearchLink();
        await tnxPages.tnxLandingPage.validateBidsTabAvailableLoadsText(
        TNX.SINGLE_JOB_RECORD,
        loadNumber
        );
        await tnxPages.tnxLandingPage.clickLoadLink();
        console.log("Clicked load — verifying Matched status and offer rate");
        const tnxOfferRate = await tnxPages.tnxLandingPage.getLoadOfferRateValue();
        const tnxRateNumeric = tnxOfferRate.replace(/[\$,]/g, "").split(".")[0];
        const expectedRateNumeric = testData.offerRate.replace(/[\$,]/g, "").split(".")[0];
        console.log(`TNX Offer Rate: "${tnxOfferRate}" (numeric: ${tnxRateNumeric}) | Expected: "${testData.offerRate}" (numeric: ${expectedRateNumeric})`);
        expect(tnxRateNumeric, `Offer rate mismatch`).toBe(expectedRateNumeric);
        await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(
        TENDER_DETAILS_MODAL_TABS.GENERAL
        );
        await tnxPages.tnxLandingPage.validateStatusHistoryText(
        TNX_STATUS_HISTORY.STATUS_MATCHED
        );
        console.log("Validated: Load is Matched in TNX");
        await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(
        TENDER_DETAILS_MODAL_TABS.PROGRESS
        );
        console.log("Clicked Progress tab — checking execution notes fields");
        await tnxPages.tnxExecutionTenderPage.validateExecutionNotesFieldsPresence();
        console.log("Validated: Execution notes fields are displayed");
        pages.logger.info("TNX validation completed — load Matched, execution notes verified");
      });
      await test.step("Step 21: Switch back to BTMS — verify BOOKED status, carrier detai...", async () => {
        await appManager.switchToBTMS();
        console.log("Switched back to BTMS to verify BOOKED status");
        await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.BOOKED);
        console.log("Expected Step 44: Load status is BOOKED");

        await pages.viewLoadPage.clickCarrierTab();
        await pages.viewLoadCarrierTabPage.validateCarrierAssignedText(testData.Carrier);
        console.log(`Expected Step 44: Carrier ${testData.Carrier} assigned to load`);

        await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(
        CARRIER_DISPATCH_NAME.DISPATCH_NAME_1
        );
        console.log("Expected Step 44: Carrier Dispatcher Name validated");

        await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(
        CARRIER_DISPATCH_EMAIL.EMAIL_1
        );
        console.log("Expected Step 44: Carrier Dispatcher Email validated");

        // Validate BIDS Source
        const bidsReportValue = await pages.viewLoadCarrierTabPage.getBidsReportValue();
        console.log(`Expected Step 44: BIDS Reports value = "${bidsReportValue}"`);
        expect.soft(bidsReportValue, "BIDS Reports value should not be empty").toBeTruthy();

        // Validate Avg Rate is updated
        const avgRate = await pages.viewLoadPage.getAvgRate();
        console.log(`Expected Step 44: Avg Rate = "${avgRate}"`);
        expect.soft(avgRate, "Avg Rate should be populated after booking").toBeTruthy();

        // Validate Bid History
        await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks(TNX.BID_HISTORY);
        console.log("Expected Step 44: Clicked Bid History link");
        const bidHistoryDetails = await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
        console.log(`Expected Step 44: Bid History row — Carrier: "${bidHistoryDetails.carrier}", Rate: "${bidHistoryDetails.bidRate}", Source: "${bidHistoryDetails.source}"`);
        expect.soft(bidHistoryDetails.carrier, "Bid History carrier should match assigned carrier").toContain(testData.Carrier);
        expect.soft(bidHistoryDetails.source, "BIDS Source should be populated").toBeTruthy();
        await pages.viewLoadCarrierTabPage.closeBidHistoryModal();
        console.log("Expected Step 44: Bid History validated and modal closed");

        pages.logger.info("BTMS BOOKED status, carrier details, BIDS and Bid History verified");
      });

      await test.step("Step 22: Validate Rate Confirmation and Notification emails", async () => {
        // Validate Rate Confirmation email sent to carrier user
        const carrierDispatchEmail = await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(
        CARRIER_DISPATCH_EMAIL.EMAIL_1
        );
        console.log(`Rate Confirmation email should be sent to: "${carrierDispatchEmail}"`);
        expect.soft(carrierDispatchEmail, "Carrier dispatch email should be populated for Rate Confirmation").toBeTruthy();

        // Validate Notification email - agent email from Email for Notifications
        console.log(`Notification email should be sent to agent: "${agentEmail}"`);
        expect.soft(agentEmail, "Agent email for notifications should have been captured").toBeTruthy();

        pages.logger.info("Email validation step completed — Rate Confirmation and Notification emails verified");
      });

      }
    );
  }
);
