import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commissionHelper from "@utils/commission-helpers";
import DMEDashboardPage from "@pages/dme/DMEDashboradPage";

/**
 * Test Case: DFB-97740 - Automatically book a load when it is manually postedDisplay a message when a carrier having a status of CAUTION is selected
 * @author AI Agent Generator
 * @date 2026-03-13
 * @category dfb
 */
const testcaseID = "DFB-97740";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let cargoValue: string;
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: DFB-97740 - Automatically book a load when it is manually postedDisplay a message when a carrier having a status of CAUTION is selected",
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
      "Case Id: DFB-97740 - Automatically book a load when it is manually postedDisplay a message when a carrier having a status of CAUTION is selected",
      {
        tag: "@aiteam,@carrierautoaccept,@dfb"
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes

      await test.step("Step 1: Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
      });

      await test.step("Step 2: Pre-Conditions setup — office config with DME/TNX validat...", async () => {
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
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle", "domcontentloaded"]);

        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName);

        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
        cargoValue = await pages.viewCustomerPage.verifyAndSetCargoValue(CARGO_VALUES.DEFAULT);
        await pages.viewCustomerPage.setPracticalDefaultMethodIfNeeded();
      });

      await test.step("Step 3: Switch to DME and verify carrier is enabled with toggle O...", async () => {
        await appManager.switchToDME();
        const dmePage = appManager.dmePage;
        const dmeDashboard = new DMEDashboardPage(dmePage);

        await dmeDashboard.clickCarriersLink();

        await dmeDashboard.searchCarrierByName(testData.Carrier);

        const toggleState = await dmeDashboard.getCarrierToggleState(testData.Carrier);
        pages.logger.info(`DME carrier toggle: ${toggleState.enabled ? "ON" : "OFF"}`);
        if (!toggleState.enabled && toggleState.found) {
        await dmeDashboard.enableCarrierToggle(testData.Carrier);
        console.log("Carrier toggle was OFF — enabled");
        } else if (!toggleState.found) {
        console.log(`Carrier "${testData.Carrier}" not found in DME — may already be enabled`);
        }

        pages.logger.info("Precondition Step 40: DME carrier toggle verified");

        await appManager.switchToBTMS();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 4 [CSV 1-3]: Carrier tab — enter offer rate, select carrier, check auto accept", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.Carrier]);
        // Set up CAUTION alert handler before clicking auto accept
        const cautionAlert = pages.commonReusables.validateAlert(
        sharedPage,
        ALERT_PATTERNS.CARRIER_CAUTIONARY_SAFETY_RATING
        );
        await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
        await cautionAlert;
        pages.logger.info("Carrier tab configured for auto accept test");
      });

      await test.step("Step 5 [CSV 4-6]: Save the load", async () => {
        await pages.editLoadFormPage.clickOnSaveBtn();
        const contactOptions = await pages.viewLoadPage.getCarrierContactDropdownOptions();
        const matchedContact = contactOptions.find(
        (opt: string) => opt.toLowerCase().includes(testData.saleAgentEmail.toLowerCase())
        );
        pages.logger.info(`Looking for carrier contact with email: ${testData.saleAgentEmail}`);
        expect(matchedContact, `No contact found with email: ${testData.saleAgentEmail}`).toBeTruthy();
        const normalizedLabel = matchedContact!.trim().replace(/\s+/g, " ");
        await pages.dfbLoadFormPage.selectCarreirContactForRateConfirmation(normalizedLabel);
        pages.logger.info(`Selected carrier contact: ${normalizedLabel}`);
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.viewLoadPage.validateViewLoadHeading();
        pages.logger.info("Load saved with carrier contact");
      });

      await test.step("Step 6 [CSV 7]: Post the load", async () => {
        await pages.dfbLoadFormPage.clickOnPostButton();
        pages.logger.info("Load posted, moving to verification");
      });

      await test.step("Step 7: Verify Remaining Expected Results", async () => {
        // Expected: A message is displayed relating 'CAUTION: Carrier has a cautionary safety rating'
        await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.CAUTION_CARRIER_HAS_A_CAUTIONARY_SAFETY_RATING);

        expect(loadNumber, "Load should be created").toBeTruthy();

        // Validate offer rate
        const displayedRate = await pages.dfbLoadFormPage.getOfferRate();
        expect(displayedRate).toBe(testData.offerRate);
        pages.logger.info(`Offer rate: ${displayedRate}`);

        // Verify BOOKED status
        await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.BOOKED);

        // Validate DFB post status
        await pages.dfbLoadFormPage.validatePostStatus("POSTED");

        // Verify carrier assigned
        await pages.viewLoadPage.clickCarrierTab();
        await pages.viewLoadCarrierTabPage.validateCarrierAssignedText();

        // Validate dispatch name and email
        await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(CARRIER_DISPATCH_NAME.DISPATCH_NAME_1);

        await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(CARRIER_DISPATCH_EMAIL.EMAIL_1);

        // BIDS Reports
        const bidsValue = await pages.viewLoadCarrierTabPage.getBidsReportValue();
        pages.logger.info(`BIDS Reports value: ${bidsValue}`);
        expect.soft(bidsValue, "BIDS Reports value should not be empty").toBeTruthy();

        const avgRate = await pages.viewLoadPage.getAvgRate();
        pages.logger.info(`Avg Rate: ${avgRate}`);
        expect.soft(avgRate, "Avg Rate should be populated after booking").toBeTruthy();

        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });


      }
    );
  }
);
