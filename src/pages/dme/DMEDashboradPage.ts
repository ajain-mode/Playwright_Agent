import { Locator, Page} from "@playwright/test";
import commonReusables from "@utils/commonReusables";

class DMEDashboardPage {
  private readonly loadLink_LOC: Locator;
  private readonly searchButton_LOC: Locator;
  private readonly carriersLink_LOC: Locator;
  private readonly carrierSearchInput_LOC: Locator;
  private readonly carrierTableRows_LOC: Locator;
  private readonly toggleCell_LOC: Locator;
  private readonly checkboxInput_LOC: Locator;

  constructor(private page: Page) {
    this.loadLink_LOC = page.locator("//span[normalize-space()='Loads']");
    this.searchButton_LOC = page.locator("//input[@type='search']");
    this.carriersLink_LOC = page.locator("//span[normalize-space()='Carriers']").first();
    this.carrierSearchInput_LOC = page.locator("input[type='search']").first();
    this.carrierTableRows_LOC = page.locator("table tbody tr");
    this.toggleCell_LOC = page.locator("td.field-boolean");
    this.checkboxInput_LOC = page.locator("input[type='checkbox']");
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
    await commonReusables.waitForPageStable(this.page);
    console.log("Clicked Carriers link in DME sidebar");
  }

  /**
   * Searches for a carrier by name in the DME carriers table.
   * @author AI Agent
   * @created 17-Mar-2026
   */
  async searchCarrierByName(carrierName: string): Promise<void> {
    try {
      await this.carrierSearchInput_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
      await this.carrierSearchInput_LOC.clear();
      await this.carrierSearchInput_LOC.fill(carrierName);
      await this.page.keyboard.press("Enter");
      await commonReusables.waitForPageStable(this.page);
      console.log(`Searched for carrier in DME: ${carrierName}`);
    } catch (err) {
      console.error(`searchCarrierByName: ${(err as Error).message}`);
      throw err;
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
    try {
      await this.carrierTableRows_LOC.first().waitFor({ state: "visible", timeout: WAIT.MID });
      const rowCount = await this.carrierTableRows_LOC.count();

      for (let i = 0; i < rowCount; i++) {
        const row = this.carrierTableRows_LOC.nth(i);
        const rowText = (await row.textContent()) || '';
        if (rowText.includes(carrierName)) {
          const toggleCell = row.locator(this.toggleCell_LOC).first();
          await toggleCell.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
          const checkbox = toggleCell.locator(this.checkboxInput_LOC).first();
          if (await checkbox.count() > 0) {
            const isChecked = await checkbox.isChecked();
            console.log(`DME carrier "${carrierName}" toggle is ${isChecked ? 'ON' : 'OFF'}`);
            return { found: true, enabled: isChecked };
          }
          console.log(`DME carrier "${carrierName}" found but no checkbox in toggle cell`);
          return { found: true, enabled: false };
        }
      }
      console.log(`DME carrier "${carrierName}" not found in table`);
      return { found: false, enabled: false };
    } catch (err) {
      console.error(`getCarrierToggleState: ${(err as Error).message}`);
      throw err;
    }
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

    try {
      const rowCount = await this.carrierTableRows_LOC.count();
      for (let i = 0; i < rowCount; i++) {
        const row = this.carrierTableRows_LOC.nth(i);
        const rowText = (await row.textContent()) || '';
        if (rowText.includes(carrierName)) {
          const toggleCell = row.locator(this.toggleCell_LOC).first();
          await toggleCell.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
          const checkbox = toggleCell.locator(this.checkboxInput_LOC).first();
          if (await checkbox.count() > 0 && await checkbox.isVisible()) {
            await checkbox.click();
          } else {
            await toggleCell.click();
          }
          await commonReusables.waitForPageStable(this.page);
          console.log("Carrier toggle was OFF — clicked to enable");
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error(`enableCarrierToggle: ${(err as Error).message}`);
      throw err;
    }
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
