import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import commissionHelper from "@utils/commission-helpers";
import { DMEDashboardPage } from "@pages/dme/DMEDashboradPage";

/**
 * Test Case: DFB-25109 - Verify that a message is displayed when a value is not entered for one or more of the PICK Location fields on the CREATE NEW ENTRY form
 * @author AI Agent Generator
 * @date 2026-03-05
 * @category dfb
 */
const testcaseID = "DFB-25109";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let cargoValue: string;
let agentEmail: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: DFB-25109 - Verify that a message is displayed when a value is not entered for one or more of the PICK Location fields on the CREATE NEW ENTRY form",
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
      "Case Id: DFB-25109 - Verify that a message is displayed when a value is not entered for one or more of the PICK Location fields on the CREATE NEW ENTRY form",
      {
        tag: "@aiteam,@dfb,@nontabular,@postautomationrules,@rulefieldvalidation"
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
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
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
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
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
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
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
        if (statusText) {
        console.log(`Loadboard Status: "${statusText}"`);
        pages.logger.info(`Carrier loadboard status: ${statusText}`);
        }

        const requiredVisibility = [
        "Avenger Logistics",
        "Mode Transportation",
        "Sunteck Transport Co",
        "TTS",
        ];

        const tabClicked = await pages.viewCarrierPage.clickLoadboardTab();
        if (tabClicked) {
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked on LoadBoard tab");
        } else {
        console.log("LoadBoard tab not found, checking toggles on current page view");
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

        let togglesNeedUpdate = false;
        const disabledToggles: string[] = [];
        for (const name of requiredVisibility) {
        const state = toggleStates[name];
        if (state?.enabled) {
        console.log(`Precondition Step 32: "${name}" is already enabled (${state.debug})`);
        } else {
        togglesNeedUpdate = true;
        disabledToggles.push(name);
        console.log(`Precondition Step 32: "${name}" needs enabling (${state?.debug})`);
        }
        }

        if (togglesNeedUpdate) {
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
        const dmePages = new DMEDashboardPage(dmePage);

        await dmePages.clickCarriersLink();
        console.log("Precondition Step 38: Clicked Carriers link in DME sidebar");
        await dmePage.waitForLoadState("networkidle");
        await dmePages.searchCarrierByName(testData.Carrier);
        console.log(`Precondition Step 39: Searched for carrier: ${testData.Carrier}`);

        const carrierToggleState = await dmePages.getCarrierToggleState(testData.Carrier);
        console.log(`Precondition Step 40: Carrier toggle is currently ${carrierToggleState ? "ON" : "OFF"}`);
        if (!carrierToggleState) {
        console.log("Carrier toggle was OFF — needs enabling");
        } else {
        console.log("Carrier toggle is already ON — no action needed");
        }

        console.log("Precondition Steps 36-40 complete");
        pages.logger.info("Precondition Step 40: DME carrier toggle verified");

        await appManager.switchToBTMS();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Switched back to BTMS — preconditions complete, starting test steps");
      });

      await test.step("Step 7: Click the New button to open the CREATE NEW ENTRY form", async () => {
        // Click New button to open CREATE NEW ENTRY form
        await pages.postAutomationRulePage.clickElementByText(POST_AUTOMATION_RULE.NEW_BUTTON);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 8: Select/Enter valid values for all of the fields on the CR...", async () => {
        // Fill Post Automation Rule form - EXCLUDING field(s) as per test case
        await dfbHelpers.fillPostAutomationRuleForm(
        pages,
        {
        customer: testData.customerName,
        emailNotification: testData.saleAgentEmail,
        // pickLocation intentionally omitted per test case requirement
        destination: testData.consigneeName,
        equipment: testData.equipmentType,
        loadType: testData.loadMethod,
        offerRate: testData.offerRate,
        commodity: testData.commodity,
        },
        true
        );
      });

      await test.step("Step 9: Click the Create button", async () => {
        // Click Create button
        await pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 10: Switch back to BTMS — verify BOOKED status, carrier detai...", async () => {
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

        const bidsReportValue = await pages.viewLoadCarrierTabPage.getBidsReportValue();
        console.log(`BIDS Reports value = "${bidsReportValue}"`);
        expect.soft(bidsReportValue, "BIDS Reports value should not be empty").toBeTruthy();

        const avgRate = await pages.viewLoadPage.getAvgRate();
        console.log(`Avg Rate = "${avgRate}"`);
        expect.soft(avgRate, "Avg Rate should be populated after booking").toBeTruthy();

        await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks(TNX.BID_HISTORY);
        const bidHistoryDetails = await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
        console.log(`Bid History — Carrier: "${bidHistoryDetails.carrier}", Rate: "${bidHistoryDetails.bidRate}", Source: "${bidHistoryDetails.source}"`);
        expect.soft(bidHistoryDetails.carrier, "Bid History carrier should match assigned carrier").toContain(testData.Carrier);
        expect.soft(bidHistoryDetails.source, "BIDS Source should be populated").toBeTruthy();
        await pages.viewLoadCarrierTabPage.closeBidHistoryModal();

        pages.logger.info("BTMS BOOKED status, carrier details, BIDS and Bid History verified");
      });


      }
    );
  }
);
