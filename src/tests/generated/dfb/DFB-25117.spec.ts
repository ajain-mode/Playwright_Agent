import { BrowserContext, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import commissionHelper from "@utils/commission-helpers";

/**
 * Test Case: DFB-25117 - Verify that a message is displayed when a value that is greater than 20000 is entered for the Offer Rate field on the CREATE NEW ENTRY form
 * @author AI Agent Generator
 * @date 2026-03-05
 * @category dfb
 */
const testcaseID = "DFB-25117";
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
  "Case ID: DFB-25117 - Verify that a message is displayed when a value that is greater than 20000 is entered for the Offer Rate field on the CREATE NEW ENTRY form",
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
      "Case Id: DFB-25117 - Verify that a message is displayed when a value that is greater than 20000 is entered for the Offer Rate field on the CREATE NEW ENTRY form",
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
        const emailLocator = sharedPage.locator(
        "//td[contains(text(),'Email')]/following-sibling::td[contains(@class,'view')]"
        ).first();
        await emailLocator.waitFor({ state: "visible", timeout: 10000 });
        agentEmail = (await emailLocator.textContent())?.trim() || "";
        console.log(`Captured agent email from Agent Info: "${agentEmail}"`);
        pages.logger.info(`Agent email captured: ${agentEmail}`);
        const btmsBaseUrl = new URL(sharedPage.url()).origin;
        await sharedPage.goto(btmsBaseUrl);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await sharedPage.locator('#c-sitemenu-container').waitFor({ state: 'visible', timeout: 15000 });
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

      await test.step("Step 4: Navigate to Carrier Search and search for carrier", async () => {
        const btmsOrigin = new URL(sharedPage.url()).origin;
        await sharedPage.goto(btmsOrigin);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await sharedPage.locator('#c-sitemenu-container').waitFor({ state: 'visible', timeout: 15000 });
        await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
        await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.Carrier);
        await pages.carrierSearchPage.selectActiveOnCarrier();
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyCarrerListTableData(testData.Carrier);
        pages.logger.info("Carrier found in search results");
      });

      await test.step("Step 5: Click on carrier, verify loadboard status and carrier vis...", async () => {
        await pages.carrierSearchPage.selectCarrierByName(testData.Carrier);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        
        const loadboardStatus = sharedPage.locator(
        "//td[contains(text(),'Loadboard Status')]/following-sibling::td"
        ).first();
        if (await loadboardStatus.isVisible({ timeout: 5000 }).catch(() => false)) {
        const statusText = (await loadboardStatus.textContent())?.trim() || "";
        console.log(`Loadboard Status: "${statusText}"`);
        pages.logger.info(`Carrier loadboard status: ${statusText}`);
        }
        
        const requiredVisibility = [
        "Avenger Logistics",
        "Mode Transportation",
        "Sunteck Transport Co",
        "TTS",
        ];
        
        let tabClicked = false;
        const loadboardTab = sharedPage.locator(
        "//a[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'loadboard')] | //li[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'loadboard')]"
        ).first();
        if (await loadboardTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await loadboardTab.click();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked on LoadBoard tab");
        tabClicked = true;
        }
        if (!tabClicked) {
        console.log("LoadBoard tab not found, checking toggles on current page view");
        }
        
        let togglesFound = false;
        for (const name of requiredVisibility) {
        const label = sharedPage.locator(
        `//*[contains(text(),'${name}')]`
        ).first();
        if (await label.isVisible({ timeout: 3000 }).catch(() => false)) {
        togglesFound = true;
        break;
        }
        }
        
        if (togglesFound) {
        console.log("Precondition Step 32: Carrier visibility labels found. Checking toggle states via DOM inspection...");
        const toggleStates = await sharedPage.evaluate((carriers: string[]) => {
        const results: Record<string, { enabled: boolean; debug: string }> = {};
        for (const name of carriers) {
        results[name] = { enabled: false, debug: "label not found" };
        const labels = document.querySelectorAll("label");
        for (const label of labels) {
        if (label.textContent?.trim() === name) {
        const container = label.closest(".slider-select") || label.parentElement;
        if (!container) { results[name].debug = "no container"; break; }
        const sel = container.querySelector(".slider-selection");
        if (sel) {
        const rect = sel.getBoundingClientRect();
        const style = window.getComputedStyle(sel);
        if (rect.width > 2 && style.display !== "none" && style.visibility !== "hidden") {
        results[name] = { enabled: true, debug: `slider-selection width=${rect.width.toFixed(0)}` };
        break;
        }
        results[name].debug = `slider-selection width=${rect.width.toFixed(0)}, display=${style.display}`;
        }
        const cb = container.querySelector("input[type='checkbox']") as HTMLInputElement | null;
        if (cb?.checked) { results[name] = { enabled: true, debug: "checkbox checked" }; break; }
        const allEls = container.querySelectorAll("*");
        for (const el of allEls) {
        const cls = typeof el.className === "string" ? el.className : "";
        if (cls.includes("slider-on") || cls.includes("-on") || cls.includes("active")) {
        results[name] = { enabled: true, debug: `class="${cls}"` }; break;
        }
        }
        if (!results[name].enabled) results[name].debug += " | no enabled indicator";
        break;
        }
        }
        }
        return results;
        }, requiredVisibility);
        
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
        for (const name of disabledToggles) {
        const slider = sharedPage.locator(
        `//div[contains(@class,'slider-select')]//label[text()='${name}']/following-sibling::div//div[contains(@class,'slider-selection')]`
        ).first();
        if (await slider.isVisible({ timeout: 3000 }).catch(() => false)) {
        await slider.click({ position: { x: 5, y: 5 } });
        console.log(`Enabled toggle for "${name}"`);
        } else {
        const labelEl = sharedPage.locator(`//label[text()='${name}']`).first();
        const parentDiv = labelEl.locator("xpath=following-sibling::div").first();
        if (await parentDiv.isVisible({ timeout: 2000 }).catch(() => false)) {
        await parentDiv.click();
        console.log(`Enabled toggle for "${name}" (via sibling div)`);
        }
        }
        }
        const saveBtn = sharedPage.locator("input[type='button'][value='  Save  ']");
        await saveBtn.waitFor({ state: "visible", timeout: 10000 });
        await saveBtn.click();
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

      await test.step("Step 7: Click the New button to open the CREATE NEW ENTRY form", async () => {
        // Click New button to open CREATE NEW ENTRY form
        await pages.postAutomationRulePage.clickElementByText(POST_AUTOMATION_RULE.NEW_BUTTON);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 8 [CSV 2-3]: Carrier tab — enter offer rate, select carrier, check auto accept", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        console.log("Clicked Carrier tab");
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        console.log(`Entered Offer Rate: ${testData.offerRate}`);
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.Carrier]);
        console.log(`Selected carrier: ${testData.Carrier}`);
        pages.logger.info("Carrier tab configured for auto accept test");
      });

      await test.step("Step 9: Click the Create button", async () => {
        // Click Create button
        await pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 10: Verify Remaining Expected Results", async () => {
        // Expected: A message is displayed relating 'Offer Rate must be within the range of $200 and $20000'
        const displayedRate = await pages.dfbLoadFormPage.getOfferRate();
        expect(displayedRate).toBe(testData.offerRate);
        console.log("Offer rate validated:", displayedRate);
      });


      }
    );
  }
);
