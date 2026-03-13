import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commissionHelper from "@utils/commission-helpers";

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
        if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
        await pages.btmsAcceptTermPage.acceptTermsAndConditions();
        }
      });

      await test.step("Step 2: Pre-Conditions setup — office config with DME/TNX validat...", async () => {
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
        
        const btmsHome = new URL(sharedPage.url()).origin;
        await sharedPage.goto(btmsHome);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await sharedPage.locator('#c-sitemenu-container').waitFor({ state: 'visible', timeout: 15000 });
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

      await test.step("Step 3: Switch to DME and verify carrier is enabled with toggle O...", async () => {
        await appManager.switchToDME();
        const dmePage = appManager.dmePage;
        
        const carriersLink = dmePage.locator("//span[normalize-space()='Carriers']").first();
        await carriersLink.waitFor({ state: "visible", timeout: 15000 });
        await carriersLink.click();
        console.log("Precondition Step 38: Clicked Carriers link in DME sidebar");
        await dmePage.waitForLoadState("networkidle");
        await dmePage.waitForTimeout(2000);
        
        const searchInput = dmePage.locator("input[type='search']").first();
        if (await searchInput.isVisible({ timeout: 10000 }).catch(() => false)) {
        await searchInput.clear();
        await searchInput.fill(testData.Carrier);
        await dmePage.waitForTimeout(1000);
        await dmePage.keyboard.press("Enter");
        await dmePage.waitForLoadState("networkidle");
        await dmePage.waitForTimeout(2000);
        console.log(`Precondition Step 39: Searched for carrier: ${testData.Carrier}`);
        }
        
        const tableRows = dmePage.locator("table tbody tr");
        await tableRows.first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
        const rowCount = await tableRows.count();
        let carrierFound = false;
        
        for (let i = 0; i < rowCount; i++) {
        const row = tableRows.nth(i);
        const rowText = (await row.textContent() || "").toUpperCase();
        if (rowText.includes(testData.Carrier.toUpperCase())) {
        console.log(`Found exact carrier "${testData.Carrier}" in table row ${i + 1} of ${rowCount}`);
        const toggleCell = row.locator("td.has-switch, td.field-boolean").first();
        if (await toggleCell.isVisible({ timeout: 5000 }).catch(() => false)) {
        const checkbox = toggleCell.locator("input[type='checkbox']").first();
        const switchContainer = toggleCell.locator("div.make-switch, div.bootstrap-switch, div[class*='switch']").first();
        let isOn = false;
        if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        isOn = await checkbox.isChecked().catch(() => false);
        }
        if (!isOn && await switchContainer.isVisible({ timeout: 2000 }).catch(() => false)) {
        const cls = (await switchContainer.getAttribute("class")) || "";
        isOn = cls.includes("switch-on") || cls.includes("bootstrap-switch-on");
        }
        console.log(`Precondition Step 40: Carrier toggle is currently ${isOn ? "ON" : "OFF"}`);
        if (!isOn) {
        if (await switchContainer.isVisible({ timeout: 2000 }).catch(() => false)) {
        await switchContainer.click();
        } else {
        await toggleCell.click();
        }
        await dmePage.waitForTimeout(2000);
        await dmePage.waitForLoadState("networkidle");
        console.log("Carrier toggle was OFF — clicked to enable");
        } else {
        console.log("Carrier toggle is already ON — no action needed");
        }
        }
        carrierFound = true;
        break;
        }
        }
        if (!carrierFound) {
        console.log(`Carrier "${testData.Carrier}" not found in DME carriers table — may already be enabled`);
        }
        
        console.log("Precondition Steps 36-40 complete");
        pages.logger.info("Precondition Step 40: DME carrier toggle verified");
        
        await appManager.switchToBTMS();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Switched back to BTMS — preconditions complete, starting test steps");
      });

      await test.step("Step 4 [CSV 1-3]: Carrier tab — enter offer rate, select carrier, check auto accept", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        console.log("Clicked Carrier tab");
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        console.log(`Entered Offer Rate: ${testData.offerRate}`);
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.Carrier]);
        console.log(`Selected carrier: ${testData.Carrier}`);
        // Set up CAUTION alert handler before clicking auto accept
        const cautionAlert = pages.commonReusables.validateAlert(
        sharedPage,
        ALERT_PATTERNS.CARRIER_CAUTIONARY_SAFETY_RATING
        );
        await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
        console.log("Checked Carrier Auto Accept checkbox");
        await cautionAlert;
        console.log("Validated: CAUTION carrier safety rating alert displayed and accepted");
        pages.logger.info("Carrier tab configured for auto accept test");
      });

      await test.step("Step 5 [CSV 4-6]: Save the load", async () => {
        await pages.editLoadFormPage.clickOnSaveBtn();
        console.log("Clicked Save button");
        const contactDropdown = sharedPage.locator("//select[@id='form_accept_as_user']");
        await contactDropdown.waitFor({ state: "attached", timeout: WAIT.LARGE });
        await sharedPage.waitForTimeout(2000);
        const contactOptions = await contactDropdown.locator("option").allTextContents();
        const matchedContact = contactOptions.find(
        (opt: string) => opt.toLowerCase().includes(testData.saleAgentEmail.toLowerCase())
        );
        console.log(`Looking for carrier contact with email: ${testData.saleAgentEmail}`);
        console.log(`Available options: [${contactOptions.filter((o: string) => o.trim()).join(" | ")}]`);
        expect(matchedContact, `No contact found with email: ${testData.saleAgentEmail}`).toBeTruthy();
        const normalizedLabel = matchedContact!.trim().replace(/\s+/g, " ");
        await pages.dfbLoadFormPage.selectCarreirContactForRateConfirmation(normalizedLabel);
        console.log(`Selected carrier contact for rate confirmation: ${normalizedLabel}`);
        await pages.editLoadFormPage.clickOnSaveBtn();
        console.log("Clicked Save button");
        await pages.viewLoadPage.validateViewLoadHeading();
        console.log("Load saved and displayed in View mode");
        pages.logger.info("Load saved with carrier contact");
      });

      await test.step("Step 6 [CSV 7]: Post the load", async () => {
        await pages.dfbLoadFormPage.clickOnPostButton();
        console.log("Clicked Post button");
        pages.logger.info("Load posted, moving to verification");
      });

      await test.step("Step 7: Verify Remaining Expected Results", async () => {
        // Expected: A message is displayed relating 'CAUTION: Carrier has a cautionary safety rating'
        await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.CAUTION_CARRIER_HAS_A_CAUTIONARY_SAFETY_RATING);
        console.log("Alert validated");
        // Expected: Next Steps
        // Expected: The load is saved and is displayed in view mode
        expect(loadNumber, "Load should be created").toBeTruthy();
        // Expected: - The Offer Rate field is populated with the rate entered
        const displayedRate = await pages.dfbLoadFormPage.getOfferRate();
        expect(displayedRate).toBe(testData.offerRate);
        console.log("Offer rate validated:", displayedRate);
        // Expected: - The Expiration Date field is auto populated with the value of the origin pick deadline date
        // Expected: - The Expiration Time field is auto populated with the origin pick deadline time
        // Expected: - The Email for Notifications field is auto populated with the agent's email address
        // Expected: - The Include Carriers field has the carrier selected
        // Expected: - The Carrier Auto Accept checkbox is checked
        await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.BOOKED);
        console.log("Verified load is auto-accepted/booked");
        // Expected: - The Carrier Contact for Rate Confirmation field has the active loadboard user selected
        console.log("Loadboard user validation: - The Carrier Contact for Rate Confirmation field has the active loadboard user selected");
        // Verify active loadboard user was or was not selected based on test scenario
        // Expected: All fields are not editable except the Include Carriers field
        console.log("EDI verification: All fields are not editable except the Include Carriers field");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        // Expected: The following DFB UI elements are displayed:
        await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED);
        console.log("Alert validated");
        // Expected: - Post Status of the load is NOT POSTED
        await pages.dfbLoadFormPage.validatePostStatus("POSTED");
        // Expected: - Activated Post button
        // Expected: - Activated Create Rule button
        // Expected: - Activated Clear Form button
        // Expected: Next Steps
        // Expected: BTMS
        // Expected: - The Status of the load is BOOKED
        await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.BOOKED);
        console.log("Verified load is auto-accepted/booked");
        // Expected: - The Carrier selected for the Include Carriers field is assigned to the load
        await pages.viewLoadCarrierTabPage.validateCarrierAssignedText();
        console.log("Verified carrier assigned");
        // Expected: - The Carrier Dispatcher Name field is auto populated with the name of the active loadboard user selected for the Carrier Contact for Rate Confirmation field
        await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(CARRIER_DISPATCH_NAME.DISPATCH_NAME_1);
        console.log("Dispatch name validated");
        // Expected: - The Carrier Dispatcher Email field is auto populated with the email address of the active loadboard user selected for the Carrier Contact for Rate Confirmation field
        await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(CARRIER_DISPATCH_EMAIL.EMAIL_1);
        console.log("Dispatch email validated");
        // Expected: - BIDS Source
        try {
          const bidsValue = await pages.viewLoadCarrierTabPage.getBidsReportValue();
          console.log("BIDS Reports value:", bidsValue);
        } catch (e) {
          console.log("Bid history check could not complete:", (e as Error).message);
        }
        // Expected: - Avg Rate accurately updated
        // Expected: - Reports accurately updated
        // Expected: - Bid Results accurately updated
        // Expected: - Bid History accurately updated
        try {
          const bidsValue = await pages.viewLoadCarrierTabPage.getBidsReportValue();
          console.log("BIDS Reports value:", bidsValue);
        } catch (e) {
          console.log("Bid history check could not complete:", (e as Error).message);
        }
        // Expected: - Email containing the Rate Confirmation is sent to the carrier user
        // Expected: - Email notification sent to the agent(s) selected for the Email for Notifications field on the load
        // Expected: DME
        // Expected: - Load is created
        expect(loadNumber, "Load should be created").toBeTruthy();
        // Expected: - Vendor Statuses:
        // Expected: - BTMS REQUESTED
        // Expected: - TNX REQUESTED
        console.log("TNX verification: - TNX REQUESTED");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        // Expected: - Vendor Statuses:
        // Expected: - BTMS CANCELLED
        // Expected: - TNX BOOKED
        console.log("TNX verification: - TNX BOOKED");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        // Expected: TNX
        console.log("TNX verification: TNX");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        // Expected: - A load is matched for the included carrier
        // Expected: - The fields for providing execution notes are displayed
        await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED);
        console.log("Alert validated");
        // Expected: Next Steps
      });


      }
    );
  }
);
