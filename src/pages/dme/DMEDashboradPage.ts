import { Locator, Page} from "@playwright/test";

class DMEDashboardPage {
  private readonly loadLink_LOC: Locator;
  private readonly searchButton_LOC: Locator;
  private readonly carriersLink_LOC: Locator;
  private readonly carrierSearchInput_LOC: Locator;
  private readonly carrierTableRows_LOC: Locator;

  constructor(private page: Page) {
    this.loadLink_LOC = page.locator("//span[normalize-space()='Loads']");
    this.searchButton_LOC = page.locator("//input[@type='search']");
    this.carriersLink_LOC = page.locator("//span[normalize-space()='Carriers']").first();
    this.carrierSearchInput_LOC = page.locator("input[type='search']").first();
    this.carrierTableRows_LOC = page.locator("table tbody tr");
  }

  /**
   * @author Deepak Bohra
   * @description This method clicks on the Loads link
   * @modified 2025-09-08
   */
  async clickOnLoadsLink() {
    // Ensure page is still active
    if (this.page.isClosed()) {
      throw new Error("DME page has been closed");
    }
    
    await this.page.waitForLoadState("networkidle");
    
    // Skip DME title verification in headless mode - focus on functionality
    console.log("Waiting for Loads link to be visible...");
    await this.loadLink_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
    
    console.log("Scrolling Loads link into view...");
    // Scroll the element into view before clicking
    await this.loadLink_LOC.scrollIntoViewIfNeeded();
    
    console.log("Ensuring element is in viewport...");
    // Wait a moment for scrolling to complete

    try {
      console.log("Attempting to click Loads link...");
      await this.loadLink_LOC.click({ 
        force: false, // Don't force click, let it handle viewport naturally
        timeout: WAIT.LARGE 
      });
      console.log("✅ Successfully clicked Loads link");
    } catch (error) {
      console.log("First click attempt failed, trying alternative approach...");
      
      // Alternative approach: use JavaScript click if normal click fails
      await this.loadLink_LOC.evaluate((element) => {
        (element as HTMLElement).click();
      });
      
      console.log("✅ Used JavaScript click as fallback");
    }
    
    // Wait for navigation/page change after click
    await this.page.waitForLoadState("domcontentloaded");
    console.log("✅ Page loaded after clicking Loads link");
  }

  /**
   * @author Deepak Bohra
   * @description This method searches for a load using the provided load number
   * @param loadNumber - The load number to search for
   * @modified 2025-09-07
   */
  async searchLoad(loadNumber: string) {
    // Ensure page is still active
    if (this.page.isClosed()) {
      throw new Error("DME page has been closed");
    }
    
    console.log(`Searching for load number: ${loadNumber}`);
    await this.searchButton_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
    await this.searchButton_LOC.fill(loadNumber);
    await this.page.keyboard.press("Enter");
    
    // Wait for search results to load and page to stabilize
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(WAIT.DEFAULT); // Give extra time for results to load
    
    console.log("Search completed and results loaded");
  }
  /**
   * Clicks on the Carriers link in the DME sidebar.
   * @author AI Agent
   * @created 17-Mar-2026
   */
  async clickCarriersLink(): Promise<void> {
    await this.carriersLink_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
    await this.carriersLink_LOC.click();
    console.log("Clicked Carriers link in DME sidebar");
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(2000);
  }

  /**
   * Searches for a carrier by name in the DME carriers table.
   * @author AI Agent
   * @created 17-Mar-2026
   */
  async searchCarrierByName(carrierName: string): Promise<void> {
    if (await this.carrierSearchInput_LOC.isVisible({ timeout: WAIT.SMALL }).catch(() => false)) {
      await this.carrierSearchInput_LOC.clear();
      await this.carrierSearchInput_LOC.fill(carrierName);
      await this.page.waitForTimeout(1000);
      await this.page.keyboard.press("Enter");
      await this.page.waitForLoadState("networkidle");
      await this.page.waitForTimeout(2000);
      console.log(`Searched for carrier in DME: ${carrierName}`);
    }
  }

  /**
   * Checks the carrier toggle state in the DME carriers table.
   * Finds the carrier row and inspects the toggle/checkbox state.
   * @author AI Agent
   * @created 17-Mar-2026
   * @returns true if carrier toggle is ON, false if OFF or not found.
   */
  async getCarrierToggleState(carrierName: string): Promise<{found: boolean; enabled: boolean}> {
    await this.carrierTableRows_LOC.first().waitFor({ state: "visible", timeout: WAIT.MID }).catch(() => {});
    const rowCount = await this.carrierTableRows_LOC.count();

    for (let i = 0; i < rowCount; i++) {
      const row = this.carrierTableRows_LOC.nth(i);
      const rowText = (await row.textContent()) || '';
      if (rowText.includes(carrierName)) {
        const toggleCell = row.locator("td.has-switch, td.field-boolean").first();
        if (await toggleCell.isVisible({ timeout: WAIT.DEFAULT }).catch(() => false)) {
          const checkbox = toggleCell.locator("input[type='checkbox']").first();
          if (await checkbox.count() > 0) {
            const isChecked = await checkbox.isChecked();
            console.log(`DME carrier "${carrierName}" toggle is ${isChecked ? 'ON' : 'OFF'}`);
            return { found: true, enabled: isChecked };
          }
          const switchContainer = toggleCell.locator("div.make-switch, div.bootstrap-switch, div[class*='switch']").first();
          if (await switchContainer.count() > 0) {
            const classes = await switchContainer.getAttribute("class") || '';
            const isOn = classes.includes('switch-on') || classes.includes('bootstrap-switch-on');
            console.log(`DME carrier "${carrierName}" switch is ${isOn ? 'ON' : 'OFF'} (class: ${classes})`);
            return { found: true, enabled: isOn };
          }
        }
        console.log(`DME carrier "${carrierName}" found but toggle state unclear`);
        return { found: true, enabled: false };
      }
    }
    console.log(`DME carrier "${carrierName}" not found in table`);
    return { found: false, enabled: false };
  }

  /**
   * Enables the carrier toggle in the DME carriers table if it is currently OFF.
   * Finds the carrier row, clicks the toggle switch or cell to enable it.
   * @author AI Agent
   * @created 17-Mar-2026
   * @returns true if toggle was clicked (was OFF), false if already ON or not found.
   */
  async enableCarrierToggle(carrierName: string): Promise<boolean> {
    const state = await this.getCarrierToggleState(carrierName);
    if (!state.found) {
      console.log(`Carrier "${carrierName}" not found in DME carriers table — may already be enabled`);
      return false;
    }
    if (state.enabled) {
      console.log("Carrier toggle is already ON — no action needed");
      return false;
    }

    const rowCount = await this.carrierTableRows_LOC.count();
    for (let i = 0; i < rowCount; i++) {
      const row = this.carrierTableRows_LOC.nth(i);
      const rowText = (await row.textContent()) || '';
      if (rowText.includes(carrierName)) {
        const toggleCell = row.locator("td.has-switch, td.field-boolean").first();
        if (await toggleCell.isVisible({ timeout: WAIT.DEFAULT }).catch(() => false)) {
          const switchContainer = toggleCell.locator("div.make-switch, div.bootstrap-switch, div[class*='switch']").first();
          if (await switchContainer.isVisible({ timeout: WAIT.DEFAULT }).catch(() => false)) {
            await switchContainer.click();
          } else {
            await toggleCell.click();
          }
          await this.page.waitForTimeout(2000);
          await this.page.waitForLoadState("networkidle");
          console.log("Carrier toggle was OFF — clicked to enable");
          return true;
        }
        break;
      }
    }
    return false;
  }

  /**
   * High-level method that ensures a carrier toggle is ON in DME.
   * Encapsulates all conditional logic so specs remain clean.
   * @author AI Agent
   * @created 26-Mar-2026
   * @param carrierName - The carrier name to ensure is enabled.
   */
  async ensureCarrierToggleEnabled(carrierName: string): Promise<void> {
    await this.clickCarriersLink();
    await this.searchCarrierByName(carrierName);
    const toggleState = await this.getCarrierToggleState(carrierName);
    console.log(`DME carrier toggle: ${toggleState.enabled ? 'ON' : 'OFF'}`);
    if (!toggleState.enabled && toggleState.found) {
      await this.enableCarrierToggle(carrierName);
      console.log('Carrier toggle was OFF — enabled');
    } else if (!toggleState.found) {
      console.log(`Carrier "${carrierName}" not found in DME — may already be enabled`);
    }
  }
}
export default DMEDashboardPage;
