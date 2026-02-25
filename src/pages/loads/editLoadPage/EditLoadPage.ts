import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";


class EditLoadPage {
  private readonly LoadTab_LOC: Locator;
  private readonly saveButton_LOC: Locator;
  private readonly carrierTab_LOC: Locator;
  private readonly carrier2Tab_LOC: Locator;
  private readonly carrier3Tab_LOC: Locator;
  private readonly editLoadText_LOC: Locator;
  private readonly currentTab_LOC: Locator;
  private readonly pick1Tab_LOC: Locator;
  private readonly drop2Tab_LOC: Locator;
  private readonly rateTypeDropdown_LOC: Locator;
  private readonly editLoadBtn_LOC: Locator;
  private readonly accessorialTypeFields: Locator;
  private readonly customerTab_LOC: Locator;

  LoadMenuList: (menuname: string) => Locator;
  constructor(private page: Page) {
    // this.carrierTab_LOC = page.locator("//ul//a[contains(text(),'Carrier')]");
    this.carrierTab_LOC = page.locator("#tab_carr_1_hyperlink");
    this.carrier2Tab_LOC = page.locator("#tab_carr_2_hyperlink");
    this.carrier3Tab_LOC = page.locator("#tab_carr_3_hyperlink");
    this.LoadTab_LOC = page.locator("//a[text()='Load']");
    this.saveButton_LOC = page.locator("#saveButton");
    this.editLoadText_LOC = page.locator("//td[contains(@class, 'hedbar0') and contains(normalize-space(), 'Edit Load #')]");
    this.currentTab_LOC = page.locator("#current_tab");
    this.rateTypeDropdown_LOC = page.locator("//select[@id='load_rate_type_select']");
    this.LoadMenuList = (menuname: string) => {
      return this.page.getByRole("link", { name: menuname });
    };
    this.pick1Tab_LOC = page.locator("//a[contains(@href,'Pick_1_1')]");
    this.drop2Tab_LOC = page.locator("//a[contains(@href,'Drop_3_2')]");
    this.editLoadBtn_LOC = page.getByRole("button", { name: /edit/i });
    this.accessorialTypeFields = page.locator("[id^='carr_1_stop_'][id*='_fee_'][id*='_type']");
    this.customerTab_LOC = page.locator("//a[text()='Customer']");
  }
  async selectCarrierTab() {
    try {
      const carrierTab = this.carrierTab_LOC;
      await carrierTab.waitFor({ state: "visible" });
      await carrierTab.click();
    } catch (error) {
      console.error("Error selecting carrier tab", error);
      throw error;
    }
  }
  /**
   * Clicks on the Carrier 2 tab
   * @author Rohit Singh
   * @modified 2025-07-28
   */
  async clickCarrier2Tab() {
    await this.carrier2Tab_LOC.waitFor({ state: "visible" });
    await this.carrier2Tab_LOC.click();
  }
  /**
   * Clicks on the Carrier 3 tab
   * @author Rohit Singh
   * @modified 2025-07-28
   */
  async clickCarrier3Tab() {
    await this.carrier3Tab_LOC.waitFor({ state: "visible" });
    await this.carrier3Tab_LOC.click();
  }
  /**
   * Clicks on the Load tab
   * @author Rohit Singh
   * @modified 2025-07-28
   */
  async clickLoadTab() {
    // await this.page.waitForLoadState("networkidle");
    await this.LoadTab_LOC.waitFor({ state: "visible" });
    await this.LoadTab_LOC.click();
  }
  /**
   * Clicks the Save button to save the load details
   * @author Rohit Singh
   * @modified 2025-07-28
   */
  async clickSaveButton() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.saveButton_LOC.first().waitFor({ state: "visible" });
    await this.saveButton_LOC.first().click();
    // Wait for the page to load after clicking the Save button
    await this.page.waitForLoadState("networkidle");
    console.log("Clicked on Save Button");
  }
  /**
   * checks if the Save button is enabled
   * @author Rohit Singh
   * @created 2025-11-13
   * @returns {Promise<boolean>}
   */
  async checkSaveButtonEnabled(): Promise<boolean> {
    await this.page.waitForLoadState("domcontentloaded");
    const isEnabled = await this.saveButton_LOC.first().isEnabled();
    return isEnabled;
  }

  async clickOnCarrierTab() {
    await this.carrierTab_LOC.waitFor({ state: "visible" });
    await this.carrierTab_LOC.click();
  }
  /**
   * validate the heading of Page
   * @author Deepak Bohra
   * @created : 2025-07-30
   * @modified : 2025-08-28
   */
  async validateEditLoadHeadingText() {
    await this.editLoadText_LOC.waitFor({ state: "visible", timeout: 90000 });
    await this.page.waitForLoadState("domcontentloaded");
    await expect.soft(this.editLoadText_LOC).toBeVisible();
  }
  /**
   * Gets the current tab value and validates it against expected value
   * @author Deepak Bohra
   * @created : 2025-07-30
   */
  async validateCurrentTabValue(expectedTabValue: string) {
    await expect
      .soft(this.currentTab_LOC)
      .toHaveAttribute("value", expectedTabValue);
    const actualTabValue = await this.currentTab_LOC.getAttribute("value");
    console.log(`Current Tab Value: ${actualTabValue}`);
    await expect.soft(actualTabValue).toBe(expectedTabValue);
  }
  /**
   * Click on tab based on the tab name
   * @author Deepak Bohra
   * @created : 2025-07-30
   */
  async clickOnTab(tabName: string) {
    //await this.page.waitForLoadState("networkidle");
    await commonReusables.waitForPageStable(this.page);
    const tabLocator = this.page.locator(
      `//*[self::a or self::span][normalize-space()='${tabName}']`
    );
    await tabLocator.waitFor({ state: "visible" });
    await tabLocator.click();
  }
  /**
   * Click on Pick 1 tab
   * @author Rohit Singh
   * @modified 2023-08-01
   */
  async clickOnPick1Tab() {
    await this.page.waitForLoadState('networkidle');
    await this.pick1Tab_LOC.waitFor({ state: "visible" });
    await this.pick1Tab_LOC.click();
    console.log("Clicked on Pick 1 Tab");
  }
  /**
   * Click on Drop 2 tab
   * @author Rohit Singh
   * @modified 2023-08-01
   */
  async clickOnDrop2Tab() {
    await this.page.waitForLoadState('networkidle');
    await this.drop2Tab_LOC.waitFor({ state: "visible" });
    await this.drop2Tab_LOC.click();
  }

  /**
 * Selects a rate type from the Rate Type dropdown.
 * @author Parth Rastogi
 * @modified 2025-09-0
 */
  async selectRateType(rateType: string) {
    await this.page.waitForLoadState('networkidle');
    await this.rateTypeDropdown_LOC.waitFor({ state: "visible" });
    await this.rateTypeDropdown_LOC.selectOption({ label: rateType });
  }

  /**
* Click on the Edit Load button.
* @author Aniket Nale
* @created 2025-10-07
*/
  async clickOnEditLoadButton() {
    await this.editLoadBtn_LOC.first().waitFor({ state: "visible" });
    await this.editLoadBtn_LOC.first().click();
  }


  /**
  *  Private helper to collect Accessorial Type values from the current tab
  * @author Aniket Nale
  * @created 2025-10-16
  */
  private async collectAccessorialTypeValuesFromCurrentTab(): Promise<string[]> {
    const count = await this.accessorialTypeFields.count();
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      const field = this.accessorialTypeFields.nth(i);
      if (await field.isVisible()) {
        const selectedOption = field.locator('option:checked');
        if (await selectedOption.count()) {
          const val = (await selectedOption.textContent())?.trim();
          if (val) values.push(val);
        }
      }
    }
    return values;
  }

  /**
  *  Verify Accessorial Type values in the current tab against expected values
  * @author Aniket Nale
  * @created 2025-10-16
  */
  async verifyAccessorialTypeValues(expectedValues: string[]) {
    const actualValues = await this.collectAccessorialTypeValuesFromCurrentTab();
    console.log(`Found Accessorial Type Values: ${actualValues.join(', ')}`);

    for (const expected of expectedValues) {
      const isPresent = actualValues.some(val => val.includes(expected));

      if (isPresent) {
        console.log(`Verified "${expected}" is present`);
      } else {
        expect.soft(false, `Expected "${expected}" not found in ${actualValues}`).toBeTruthy();
      }
    }
  }
  /**
   * Click on Customer Tab
   * @author Rohit Singh
   * @created 2025-12-05
   */
  async clickOnCustomerTab() {
    await this.page.waitForLoadState('networkidle');
    await this.customerTab_LOC.waitFor({ state: "visible" });
    await this.customerTab_LOC.click();
  }
}
export default EditLoadPage;
