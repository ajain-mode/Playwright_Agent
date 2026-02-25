import ViewLoadPage from "@pages/loads/viewLoadPage/ViewLoadPage";
import { Locator, Page, expect } from "@playwright/test";

export default class BasePage {
  private readonly mainSearchButton_LOC: Locator;
  private readonly searchInput_LOC: Locator;
  private readonly searchButton_LOC: Locator;
  private readonly homeButton_LOC: Locator;
  private readonly LoadsButton_LOC: Locator;
  private readonly templatesButton_LOC: Locator;
  // private readonly customersSiteMenu_LOC: Locator;
  private readonly topMenuLogo_LOC: Locator;


  constructor(private page: Page) {
    this.mainSearchButton_LOC = page.locator(
      "//button[@class='search-toggle']"
    );
    this.searchInput_LOC = page.locator(
      "//div[@class='searchinput-container']//input[@id='header_search']"

    );
    

    /**
     * @author Aniket Nale
     * @description modified search button locator due to variation issue between pages
     * @modified 2025-11-11
     */
    this.searchButton_LOC = page.locator(
      "//div[@class='searchinput-container']//span[@class='input-group-btn' or @class='input-group-button']/button"
    );
    this.homeButton_LOC = page.locator("a.c-sitemenu-group__group-name", { hasText: "Home" });
    this.LoadsButton_LOC = page.locator("//span[contains(text(),'Loads')]");
    this.templatesButton_LOC = page.locator("//a[text()='Templates']");
    // this.customersSiteMenu_LOC = page.locator("//a[normalize-space()='Customers']");
    this.topMenuLogo_LOC = page.locator("//img[contains(@src,'logo.png')]/parent::a");
  }

  headerAfterUserSwitch(headerBtnText: string): Locator {
    return this.page.locator(`//li//a[contains(text(),'${headerBtnText}')]`);
  }

  subheaderAfterUserSwitch(subHeaderBtnText: string): Locator {
    return this.page.locator(`//a[text()='${subHeaderBtnText}']`);
  }
  /**
   * @author Deepak Bohra
   * @description Hover over header by text
   * @param {string} headerText - The exact text of the header to hover over
   * @created 2025-07-30
   */
  async hoverOverHeaderByText(headerText: string) {

    const heading = this.page.getByRole("button", {
      name: headerText,
      exact: true,
    });
    await expect(heading).toBeVisible({ timeout: WAIT.XLARGE });
    await heading.hover();
    await this.page.waitForTimeout(WAIT.DEFAULT); // holds hover for 2 seconds

  }

  /**
   * @author Deepak Bohra
   * @description Clicks a subheader link by its exact text within the site menu container after ensuring it is visible.
   * @modified 2025-07-28
   */
  async clickSubHeaderByText(subheaderText: string) {
    try {
      const subheading = this.page
        .locator("#c-sitemenu-container")
        .getByRole("link", { name: subheaderText, exact: true });
      await expect(subheading).toBeVisible({
        timeout: WAIT.XLARGE,
      });
      await expect(subheading).toBeVisible({
        timeout: WAIT.LARGE,
      }); // waits up to 10 seconds
      await expect(subheading).toBeEnabled({
        timeout: WAIT.SMALL,
      });
      await expect(subheading).toBeAttached({
        timeout: WAIT.SMALL,
      });
      await subheading.click();
    } catch (error) {
      console.log(
        `Heading with text "${subheaderText}" not found or not clickable`
      );
      throw error; // rethrow an error if needed
    }
  }

  /**
   * @author Rohit Singh
   * @created 2025-08-05
   * @description Searches for a text in the main header search bar and clicks the search button.
   * @param {string} searchText - The text to search for in the main header
   */

  async searchFromMainHeader(searchText: string) {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(WAIT.SMALL);
    await this.mainSearchButton_LOC.click();
    await this.searchInput_LOC.fill(searchText);
    await this.searchButton_LOC.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * @author Aniket Nale
   * @created 08-01-2026
   * @description Refreshes the page and searches for a text in the main header search bar until the load is found or timeout occurs.
   * @param {string} searchText - The text to search for in the main header
   */

  async refreshAndSearchFromMainHeader(searchText: string) {
    const maxWaitMs = WAIT.XXLARGE * 5;
    const pollIntervalMs = WAIT.MID;
    const startTime = Date.now();

    const viewLoadPage = new ViewLoadPage(this.page);

    while (Date.now() - startTime < maxWaitMs) {
      try {
        await this.page.waitForLoadState("networkidle");
        await this.page.waitForTimeout(WAIT.SMALL);

        await this.mainSearchButton_LOC.waitFor({ state: 'visible' });
        await this.mainSearchButton_LOC.click();

        await this.searchInput_LOC.fill(searchText);
        await this.searchButton_LOC.click();

        await this.page.waitForLoadState("networkidle");

        const resultVisible = await viewLoadPage.viewLoadPageVisible().then(() => true).catch(() => false);

        if (resultVisible) {
          return;
        }
      } catch (error) {
        // intentional retry
      }
      await this.page.waitForTimeout(pollIntervalMs);
      await this.page.reload();
    }
    throw new Error(`Load ${searchText} not found after polling for ${maxWaitMs / 60000} minutes`);
  }
  /**
   * @author Mohammed Suhaib
   * @created 2025-12-22
   * @description Hovers over a header menu item and clicks a submenu item in the dropdown
   * @param {string} headerText - The exact text of the header menu to hover over
   * @param {string} subHeaderText - The exact text of the submenu item to click
   */
  async clickHeaderAndSubMenu(headerText: string, subHeaderText: string) {
    try {
      // Hover header span to reveal dropdown
      const headerSpan = this.page.locator(`//a//span[text()='${headerText}']`);
      await headerSpan.waitFor({ state: 'visible', timeout: WAIT.SMALL });
      await headerSpan.hover({ force: true });
      await this.page.waitForTimeout(WAIT.SMALL); // Give dropdown time to appear

      // Click submenu item
      const subMenuItem = this.page.locator(`//a[text()='${subHeaderText}']`);
      await subMenuItem.waitFor({ state: 'visible', timeout: WAIT.SMALL });
      await subMenuItem.scrollIntoViewIfNeeded();
      await subMenuItem.click({ force: true });
    } catch (error) {
      console.error(`Error clicking header '${headerText}' > submenu '${subHeaderText}': ${error}`);
      throw error;
    }
  }

  /**
   * @author Rohit Singh
   * @created 2025-09-09
   * @description Clicks on the Home button in the main header.
   * */
  async clickHomeButton() {
    await this.page.waitForLoadState("networkidle");
    await this.homeButton_LOC.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
    * @author Rohit Singh
    * @created 2025-09-09
    * @description Clicks on the Home button in the main header.
    * */
  async hoverOverClickOnLoads() {
    await this.page.waitForLoadState("networkidle");
    await this.LoadsButton_LOC.hover();
    await this.page.waitForLoadState("networkidle");

  }

  async clickOnTemplateSubMenu() {
    await this.page.waitForLoadState("networkidle");
    await this.templatesButton_LOC.click();
    await this.page.waitForLoadState("networkidle");
  }

  // /**
  // * Hover-Over Customer Menu Option
  // * @author Aniket Nale
  // * @modified 2025-10-28
  // */
  // async hoverOverCustomersMenu() {
  //   const customersMenu = this.customersSiteMenu_LOC;
  //   await this.page.waitForLoadState('networkidle');
  //   await customersMenu.waitFor({ state: 'visible', timeout: WAIT.LARGE });
  //   await customersMenu.scrollIntoViewIfNeeded();
  //   await customersMenu.hover({ force: true });
  // }
  /**
   * @author Rohit Singh
   * @created 2025-11-12
   * @description Clicks on the Top Menu Logo to navigate to the Home page.
   */
  async clickOnTopMenuLogo() {
    await this.page.waitForLoadState("networkidle");
    await this.topMenuLogo_LOC.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * @author Parth Rastogi
   * @created 2025-11-19
   * @description Utility method to wait for multiple load states in sequence
   * @param {string[]} loadStates - Array of load states to wait for (e.g., ['load', 'networkidle', 'domcontentloaded'])
   */
  async waitForMultipleLoadStates(loadStates: string[] = ['load', 'networkidle', 'domcontentloaded']) {
    for (const state of loadStates) {
      await this.page.waitForLoadState(state as any);
    }
  }

  // NOTE: For alert/dialog verification, always use pages.commonReusables.validateAlert()
  // from src/utils/commonReusables.ts. Do NOT add duplicate methods here.

  /**
   * clickButtonByText - Reusable method to click a button by its visible text
   * @author AI Agent Generator
   * @created 2026-02-12
   */
  async clickButtonByText(buttonText: string): Promise<void> {
    const button = this.page.locator(`//button[contains(text(),'${buttonText}')] | //input[contains(@value,'${buttonText}')]`);
    await expect(button).toBeVisible({ timeout: 10000 });
    await button.click();
    console.log(`Clicked button: ${buttonText}`);
  }

  /**
   * clickLinkByText - Reusable method to click a link or element by its text
   * @author AI Agent Generator
   * @created 2026-02-12
   */
  async clickLinkByText(linkText: string): Promise<void> {
    const link = this.page.locator(`//a[contains(text(),'${linkText}')] | //*[contains(text(),'${linkText}')]`).first();
    await expect(link).toBeVisible({ timeout: 10000 });
    await link.click();
    console.log(`Clicked link: ${linkText}`);
  }

  /**
   * clickDropdownById - Reusable method to click on a dropdown by its ID
   * @author AI Agent Generator
   * @created 2026-02-12
   */
  async clickDropdownById(dropdownId: string): Promise<void> {
    const dropdown = this.page.locator(`#${dropdownId}`);
    await expect(dropdown).toBeVisible({ timeout: 10000 });
    await dropdown.click();
    console.log(`Clicked dropdown: ${dropdownId}`);
  }

  /**
   * fillFieldBySelector - Reusable method to fill a field by name/id/placeholder
   * @author AI Agent Generator
   * @created 2026-02-12
   */
  async fillFieldBySelector(fieldIdentifier: string, value: string): Promise<void> {
    const field = this.page.locator(`[name*='${fieldIdentifier}'], [placeholder*='${fieldIdentifier}'], [id*='${fieldIdentifier}']`).first();
    await expect(field).toBeVisible({ timeout: 10000 });
    await field.fill(value);
    console.log(`Filled field '${fieldIdentifier}' with value: ${value}`);
  }

  /**
   * selectOptionByField - Reusable method to select an option from a dropdown by field name
   * @author AI Agent Generator
   * @created 2026-02-12
   */
  async selectOptionByField(fieldIdentifier: string, optionLabel: string): Promise<void> {
    const field = this.page.locator(`[name*='${fieldIdentifier}'], [id*='${fieldIdentifier}']`).first();
    await expect(field).toBeVisible({ timeout: 10000 });
    await field.selectOption({ label: optionLabel });
    console.log(`Selected '${optionLabel}' from field '${fieldIdentifier}'`);
  }

  async clickButton(buttonText: string): Promise<void> {
    const btn = this.page.locator(`//button[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${buttonText.toLowerCase()}')] | //input[contains(translate(@value,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${buttonText.toLowerCase()}')]`);
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    console.log(`Clicked on "${buttonText}" button`);
  }

}
