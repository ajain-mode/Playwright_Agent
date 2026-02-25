import { Page, Locator } from "@playwright/test";
import { PageManager } from "@utils/PageManager";

// import the correct member from globalConstants, update as needed

export default class OfficePage {
  private readonly officeCodeInput_LOC: Locator;
  private readonly searchButton_LOC: Locator;
  private readonly editButton_LOC: Locator;
  private readonly saveButton_LOC: Locator;
  private readonly matchVendor_LOC: Locator;
  private readonly MatchVendorDropDown_LOC: Locator;
  private readonly internalStatusValue_LOC: Locator
  private readonly internalStatusDropdown: Locator;

  constructor(private page: Page) {
    this.officeCodeInput_LOC = page.locator("#search_office_code");
    this.searchButton_LOC = page.getByRole("button", { name: "Search" });
    this.editButton_LOC = page.getByRole("button", { name: "Edit" }).first();
    this.saveButton_LOC = page.getByRole("button", { name: "Save" }).first();
    this.matchVendor_LOC = page.locator(
      "xpath=//*[text()='Match Vendor(s)']/parent::td/following-sibling::td"
    );
    this.MatchVendorDropDown_LOC = page.locator("#match_vendors");
    this.internalStatusValue_LOC = page.locator("//div[.='Enable Internal Shares']/../../td[2]");
    this.internalStatusDropdown = page.locator("#feature_internal_shares");
  }

  /**
   * Fills the office code search field.
   * @author Deepak Bohra
   * @created 2025-08-07
   * @modified 2025-08-07
   * @param officeCode - The office code to fill in the search field.
   */
  async officeCodeSearchField(officeCode: string) {
    try {
      await this.officeCodeInput_LOC.fill(officeCode);
    } catch (error) {
      console.error("Error filling office code input:", error);
      throw error; // Re-throw to handle in test
    }
  }
  /**
   * Clicks the search button.
   * @author Deepak Bohra
   * @created 2025-08-07
   * @modified 2025-08-07
   */
  async searchButtonClick() {
    try {
      await this.searchButton_LOC.click();
    } catch (error) {
      console.error("Search button not found or not clickable:", error);
    }
  }
  /**
   * Gets the office row locator by office name.
   * @author Deepak Bohra
   * @created 2025-08-07
   * @modified 2025-08-07
   * @param officeName - The name of the office.
   * @returns Locator for the office row.
   */
  getOfficeRow(officeName: string): Locator {
    return this.page.getByRole("row", { name: officeName });
  }
  /**
   * Clicks on the office search row by office name.
   * @author Deepak Bohra
   * @created 2025-08-07
   * @modified 2025-08-07
   * @param officeName - The name of the office.
   */
  async officeSearchRow(officeName: string) {
    try {
      const officeRow = this.getOfficeRow(officeName);
      await officeRow.first().click();
    } catch (error) {
      console.error(`Office search row '${officeName}' not found or not clickable:`, error);
      throw error;
    }
  }
  /**
   * Checks the toggle status for a given label.
   * @author Deepak Bohra
   * @created 2025-08-07
   * @modified 2025-08-07
   * @param label - The label of the toggle.
   * @returns True if the toggle is set to NO, false otherwise.
   */
  async checkToggleStatus(label: string): Promise<boolean> {
    try {
      const xpath = `//div[text()='${label}']//../following-sibling::td`;
      const valueRaw = await this.page.locator(xpath).textContent();
      const value = valueRaw?.replace(/\s/g, "") || "";
      return value.toUpperCase() === "NO";
    } catch (error) {
      console.error(
        `Error checking toggle status for label "${label}":`,
        error
      );
      return false;
    }
  }
  /**
   * Sets the toggle to YES for a given label.
   * @author Deepak Bohra
   * @created 2025-08-07
   * @modified 2025-08-07
   * @param label - The label of the toggle.
   */
  async setToggleToYes(label: string): Promise<void> {
    try {
      const dropdownXPath = `//div[text()='${label}']//../following-sibling::td//select`;
      await this.page.locator(dropdownXPath).selectOption({ label: "YES" });
    } catch (error) {
      console.error(`Error setting toggle to YES for label "${label}":`, error);
    }
  }
  /**
   * Ensures all toggles have the expected values, editing if necessary.
   * @author Deepak Bohra
   * @created 2025-08-07
   * @modified 2025-08-07
   * @param toggleMap - A map of toggle labels to their expected values.
   */
  async ensureToggleValues(toggleMap: Record<string, string>): Promise<void> {
    let editRequired = false;

    // First pass: check if any toggle needs to be changed
    for (const [label, expectedValue] of Object.entries(toggleMap)) {
      const isCurrentlyNo = await this.checkToggleStatus(label);
      const shouldBeNo = expectedValue.toUpperCase() === "NO";

      if (isCurrentlyNo !== shouldBeNo) {
        editRequired = true;
        break;
      }
    }

    // If any toggle needs to be changed, enter edit mode and update them
    if (editRequired) {
      await this.editButton_LOC.click();

      for (const [label, expectedValue] of Object.entries(toggleMap)) {
        const dropdownXPath = `//div[text()='${label}']//../following-sibling::td//select`;
        console.log(`Setting toggle for "${label}" to "${expectedValue}"`);
        await this.page
          .locator(dropdownXPath)
          .selectOption({ label: expectedValue.toUpperCase() });
      }

      await this.saveButton_LOC.click();
    }
  }
  /**
   * Ensures all toggles in the provided list are set to YES, editing if necessary.
   * @author Deepak Bohra
   * @created 2025-08-07
   * @modified 2025-08-07
   * @param labels - Array of toggle labels to check and set.
   */
  async ensureTogglesAndEdit(labels: string[]) {
    let editRequired = false;
    for (const label of labels) {
      const isNo = await this.checkToggleStatus(label);
      if (isNo) editRequired = true;
    }
    if (editRequired) {
      await this.editButton_LOC.click();
      for (const label of labels) {
        await this.setToggleToYes(label);
      }
      await this.saveButton_LOC.click();
    }
  }
  /**
   * Clicks the Save button.
   * @author Deepak Bohra
   * @created 2025-08-07
   * @modified 2025-08-07
   */
  async clickOnSaveButton() {
    try {
      await this.saveButton_LOC.click();
    } catch (error) {
      console.error("Error clicking on the Save button:", error);
    }
  }
  /**
   * Ensures the Match Vendor value is set to TNX, editing if necessary.
   * @author Deepak Bohra
   * @created 2025-08-07
   * @modified 2025-08-07
   */
  async ensureTnxValue() {
    try {
      // Get the current text value of the field
      const text = await this.matchVendor_LOC.textContent();

      // Check if the value is already "Tnx"
      if (text?.trim() === "TNX") {
        console.log("Value is already Tnx. No action needed.");
        return;
      }

      await this.editButton_LOC.click();
      await this.MatchVendorDropDown_LOC.selectOption({ label: "TNX" });
      await this.saveButton_LOC.click();
      console.log("Value updated to Tnx.");
    } catch (error) {
      console.error("Error ensuring TNX value:", error);
    }
  }

  /**
   * Configures office pre-conditions for DFB load creation.
   * @author Deepak Bohra
   * @created 2025-08-07
   * @modified 2025-08-07
   * @param officeName - The name of the office.
   * @param toggleSettings - The toggle settings to apply.
   */
  /**
  * Configures office pre-conditions for DFB load creation
  * @author Deepak Bohra
  */
  async configureOfficePreConditions(officeName: string, toggleSettings: any) {
    await this.officeCodeSearchField(officeName);
    await this.searchButtonClick();
    await this.officeSearchRow(officeName);
    await this.ensureToggleValues(toggleSettings);
    await this.ensureTnxValue();
  }

  /**
* Select Internal Share to Yes
*
* @author Avanish Srivastava
* @created 2025-08-12
*/

  async setInternalSharesToYes(): Promise<void> {
    await this.internalStatusDropdown.waitFor({ state: 'visible' });
    await this.internalStatusDropdown.selectOption({ value: '1' });
    console.log("Internal Shares set to YES successfully.");
  }

  /**
 * Handles the internal shares status for a customer.
 *
 * @author Avanish Srivastava
 * @created 2025-08-12
 */

  // Add this constant before using it
  private static readonly INTERNAL_SHARE_STATUS = {
    YES: "YES",
    NO: "NO"
  };

  async getInternalSharesStatus(testData: any): Promise<void> {
    const statusText = (await this.internalStatusValue_LOC.textContent())?.trim().toUpperCase();
    console.log(`Enable Internal Shares status: ${statusText}`);
    const pages = new PageManager(this.page);
    if (statusText === OfficePage.INTERNAL_SHARE_STATUS.NO) {
      console.log("Status is NO → Clicking Edit button");
      await this.editButton_LOC.waitFor({ state: 'visible' });
      await this.editButton_LOC.click();
      await this.setInternalSharesToYes();
      await this.clickOnSaveButton();
    }
    else if (statusText === OfficePage.INTERNAL_SHARE_STATUS.YES) {
      console.log("Status is YES → Navigating to Customer menu");
      await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
      await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
      await pages.searchCustomerPage.enterCustomerName(testData.customerName);
      await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
      await pages.searchCustomerPage.clickOnActiveCustomer();
    }
    else {
      throw new Error(`Unexpected Enable Internal Shares status: ${statusText}`);
    }
  }

  /**
* Enter agent office.
* 
* @param value - The text or number to be entered into the agent office field.
* 
* @author Avanish Srivastava
* @created 2025-08-29
*/
  async enterAgentOffice(value: string | number): Promise<void> {
    await this.officeCodeInput_LOC.waitFor({ state: "visible" });
    await this.officeCodeInput_LOC.fill(String(value));
  }

  /**
  * Configures office pre-conditions for DAT load creation.
  * @author Mukul Khan
  * @created 05-Jan-2026
  */
  async configureOfficePreConditionsDAT(officeName: string) {
    await this.officeCodeSearchField(officeName);
    await this.searchButtonClick();
    await this.officeSearchRow(officeName);
  }
}
