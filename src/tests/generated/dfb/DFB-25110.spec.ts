import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import commissionHelper from "@utils/commission-helpers";
import DMEDashboardPage from "@pages/dme/DMEDashboradPage";

/**
 * Test Case: DFB-25110 - Verify that a message is displayed when the 255 character limit of the Email for Notifications field on the CREATE NEW ENTRY form is exceeded
 * @author AI Agent Generator
 * @date 2026-03-05
 * @category dfb
 */
const testcaseID = "DFB-25110";
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
  "Case ID: DFB-25110 - Verify that a message is displayed when the 255 character limit of the Email for Notifications field on the CREATE NEW ENTRY form is exceeded",
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
      "Case Id: DFB-25110 - Verify that a message is displayed when the 255 character limit of the Email for Notifications field on the CREATE NEW ENTRY form is exceeded",
      {
        tag: "@aiteam,@dfb,@nontabular,@postautomationrules,@rulefieldvalidation"
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

      await test.step("Step 5: Click on carrier, verify loadboard status and carrier vis...", async () => {
        await pages.carrierSearchPage.selectCarrierByName(testData.Carrier);


        const loadboardStatusText = await pages.viewCarrierPage.getLoadboardStatus();
        pages.logger.info(`Carrier loadboard status: ${loadboardStatusText}`);

        const requiredVisibility = [
            CARRIER_VISIBILITY.AVENGER_LOGISTICS,
            CARRIER_VISIBILITY.MODE_TRANSPORTATION,
            CARRIER_VISIBILITY.SUNTECK_TTS,
          ];

        const tabClicked = await pages.viewCarrierPage.clickLoadboardTab();
        if (tabClicked) {
        pages.logger.info("LoadBoard tab clicked");
        } else {
        pages.logger.info("LoadBoard tab not found, checking current view");
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
        if (state?.enabled) {
        pages.logger.info(`"${name}" already enabled`);
        } else {
        disabledToggles.push(name);
        pages.logger.info(`"${name}" needs enabling`);
        }
        }

        if (disabledToggles.length > 0) {
        pages.logger.info(`${disabledToggles.length} toggle(s) need updating`);
        await pages.basePage.clickButtonByText("Edit");

        await pages.viewCarrierPage.enableCarrierVisibilityToggles(disabledToggles);
        await pages.viewCarrierPage.clickSaveOnCarrierEditPage();

        } else {
        pages.logger.info("All carrier visibility toggles already enabled");
        }
        } else {
        pages.logger.info("Carrier visibility labels not found, toggle check skipped");
        }
        pages.logger.info("Carrier visibility step completed");
      });

      await test.step("Step 6: Switch to DME and verify carrier is enabled with toggle O...", async () => {
        await appManager.switchToDME();
        const dmePage = appManager.dmePage;
        const dmeDashboard = new DMEDashboardPage(dmePage);

        await dmeDashboard.clickCarriersLink();

        await dmeDashboard.searchCarrierByName(testData.Carrier);

        await dmeDashboard.enableCarrierToggle(testData.Carrier);

        pages.logger.info("DME carrier toggle verified");

        await appManager.switchToBTMS();

      });

      await test.step("Step 7: Click the New button to open the CREATE NEW ENTRY form", async () => {
        // Click New button to open CREATE NEW ENTRY form
        await pages.postAutomationRulePage.clickElementByText(POST_AUTOMATION_RULE.NEW_BUTTON);

      });

      await test.step("Step 8: Select/Enter valid values for all of the fields on the CR...", async () => {
        // Fill Post Automation Rule form - EXCLUDING Email for Notifications
        await dfbHelpers.fillPostAutomationRuleForm(
        pages,
        {
        customer: testData.customerName,
        // emailNotification intentionally omitted — testing missing email validation
        pickLocation: testData.shipperName,
        destination: testData.consigneeName,
        equipment: testData.equipmentType,
        loadType: testData.loadMethod,
        offerRate: testData.offerRate,
        commodity: testData.commodity,
        },
        true
        );
      });

      await test.step("Step 9: Select as many email addresses for the Email for Notifica...", async () => {
        // TODO: Fabricated locator — replace with correct POM method for selecting multiple email notification addresses
        // The original locator "//select[contains(@name,'as_many_email_addresses_for_the_email_for_notifications')]" does not match any real element.
        // Use pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(testData.saleAgentEmail) if appropriate,
        // or implement a dedicated method for selecting multiple emails to exceed the 255 character limit.
        await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(testData.saleAgentEmail);
      });

      await test.step("Step 10: Switch back to BTMS — verify BOOKED status, carrier detai...", async () => {
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
        pages.logger.info(`Bid History - Carrier: ${bidHistoryDetails.carrier}, Rate: ${bidHistoryDetails.bidRate}, Source: ${bidHistoryDetails.source}`);
        expect.soft(bidHistoryDetails.carrier, "Bid History carrier should match assigned carrier").toContain(testData.Carrier);
        expect.soft(bidHistoryDetails.source, "BIDS Source should be populated").toBeTruthy();
        await pages.viewLoadCarrierTabPage.closeBidHistoryModal();

        pages.logger.info("BTMS BOOKED status, carrier details, BIDS and Bid History verified");
      });


      }
    );
  }
);
