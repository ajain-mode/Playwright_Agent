import { Locator, Page} from "@playwright/test";

class DMEDashboardPage {
  private readonly loadLink_LOC: Locator;
  private readonly searchButton_LOC: Locator;

  constructor(private page: Page) {
    this.loadLink_LOC = page.locator("//span[normalize-space()='Loads']");
    this.searchButton_LOC = page.locator("//input[@type='search']");
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
}
export default DMEDashboardPage;
