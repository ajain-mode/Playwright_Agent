import { Locator, Page } from "@playwright/test";

/**
 * CustomerPage handles customer search, cargo value management, and load navigation operations
 */
class SearchCustomerPage {
  private readonly enterCustomerInput_LOC: Locator;
  private readonly searchCustomerButton_LOC: Locator;
  private readonly selectActiveOnCustomerPageInput_LOC: Locator;
  private readonly statusDropdownIconButton_LOC: Locator;
  private readonly activeText: Locator;
  // private readonly searchCustomerLink_LOC: Locator;
  private readonly customerDetails_LOC: Locator;
  private readonly agentNameInput_LOC: Locator;
  private readonly toggleStatusValue_LOC: (toggleName: string) => Locator;
  private readonly toggleButton_LOC: (toggleName: string) => Locator;

  constructor(private page: Page) {
    this.searchCustomerButton_LOC = page.locator("//input[@class='submit-report-search']");
    this.enterCustomerInput_LOC = page.locator("//input[@id='search_name']");
    this.selectActiveOnCustomerPageInput_LOC = page.locator("//*[@id='search_status_magic']//input");
    // this.searchCustomerLink_LOC = page.locator("//a[@href='/fats/custlist.php?p=flt&rptname=CASEARCH&own=m']");
    this.statusDropdownIconButton_LOC = page.locator("//*[@id='search_status_magic']//div[@class='ms-trigger']");
    this.activeText = page.locator("//span[text()='Active']");
    this.customerDetails_LOC = page.locator("//td[normalize-space()='ACTIVE']");
    this.agentNameInput_LOC = page.locator("//div[@id='search_sales_id_magic']//input");
    this.toggleStatusValue_LOC = (toggleName: string) => page.locator(`//label[text()='${toggleName}?']/../div[contains(@class,'radio')]`);
    this.toggleButton_LOC = (toggleName: string) => page.locator(`//label[text()='${toggleName}?']/..//label[@for='own_active']`);
  }

  /*
   * @author Deepak Bohra
   * @description This function clicks on the search customer button
   * @modified 2025-07-15
   */
  async clickOnSearchCustomer() {
    await this.searchCustomerButton_LOC.click().catch((error: unknown) => {
      console.error(`Error Clicking Agent Search: ${error}`);
      throw error;
    });
  }

  /*
   * @author Deepak Bohra
   * @description This function searches for a customer by name and clicks on the customer details
   * @modified 2025-07-15
   */
  async searchCustomerAndClickDetails(customerName: string): Promise<void> {
    await this.selectActiveOnCustomerPage();
    await this.clickOnSearchCustomer();
    await this.selectCustomerByName(customerName);
  }
  /*
   * @author Deepak Bohra
   * @description This function selects the 'Active' status on the customer page
   * @modified 2025-07-15
   */
  async selectActiveOnCustomerPage() {
    await this.selectActiveOnCustomerPageInput_LOC.waitFor({
      state: "visible",
    });
    await this.statusDropdownIconButton_LOC.click();
    await this.activeText.click();
  }

  /**
   * @author Deepak Bohra
   * @description This function selects a customer by name from the search results
   * @modified 2025-07-15
   */
  async selectCustomerByName(customerName: string) {
    await this.page
      .locator(`//td[normalize-space()='${customerName}']`)
      .click();
  }

  /**
   * @author Deepak Bohra
   * @description Enters the customer name into the search input field
   * @modified 2025-07-15
   */
  async enterCustomerName(value: string | number): Promise<void> {
    await this.enterCustomerInput_LOC.waitFor({ state: "visible" });
    await this.enterCustomerInput_LOC.fill(String(value));
  }
  /**
   * Clicks on the 'ACTIVE' customer row.
   * Waits for the element to be visible and clicks using force.
   * @author Avanish Srivastava
   * @modified 2025-08-01
   */
  async clickOnActiveCustomer() {
    //@modified: Aniket Nale - 2025-10-23
    await this.customerDetails_LOC.first().waitFor({ state: 'visible' });
    await this.customerDetails_LOC.first().click();
  }
  /**
   * @author Rohit Singh
   * @description Enters the agent name into the search input field
   * @created 2025-11-15
   * @param agentName 
   */
  async enterAgentName(agentName: string) {
    await this.agentNameInput_LOC.waitFor({ state: "visible" });
    await this.agentNameInput_LOC.pressSequentially(agentName).then(async () => {
      await this.page.waitForTimeout(WAIT.DEFAULT);
      await this.page.keyboard.press('Enter');
    });
  }
  /**
   * Toggles a specified option to 'Yes' or 'No'.
   * @author Rohit Singh
   * @created 18-Dec-2025
   * @param toggleName - The name of the toggle option to change.
   * @param status - The desired status ('Yes' or 'No').
   */
  async toggleUpdate(toggleName: string, status: 'Yes' | 'No') {
    await this.toggleStatusValue_LOC(toggleName).waitFor({ state: 'visible' });
    let toggleCurrentState = await this.toggleStatusValue_LOC(toggleName).getAttribute('class');
    if (toggleCurrentState?.includes('active')) {
      // Toggle is currently 'Yes'
      toggleCurrentState = 'yes';
    }else{
      // Toggle is currently 'No'
      toggleCurrentState = 'no';
    }
    if (toggleCurrentState.toLowerCase() !== status.toLowerCase()) {
      await this.toggleButton_LOC(toggleName).click();
      console.log(`Toggled ${toggleName} to ${status}`);
    }

  }
}

export default SearchCustomerPage;
