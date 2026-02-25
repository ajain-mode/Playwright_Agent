import { Locator, Page } from "@playwright/test";

/**
 * CustomerPage handles customer search, cargo value management, and load navigation operations
 */
class CustomerPage {
  private readonly moveToggle_LOC: Locator;
  // private readonly viewCustomerEditButton_LOC: Locator;
  // private readonly viewCustomerSaveButton_LOC: Locator;
  private readonly commissionAuditStatus_LOC: Locator;
  // private readonly customersSiteMenu_LOC: Locator;
  private readonly addInternalShareLink_LOC: Locator;
  private readonly shareAmountInput_LOC: Locator;
  private readonly shareAgentInput_LOC: Locator
  private readonly shareAgentSearchResultInput_LOC: (agentName: string) => Locator;
  // private readonly LoadMenuList: (menuname: string) => Locator;
  // private readonly newSalesLeadLink_LOC: Locator;
  // private readonly leadsLink_LOC: Locator;
  private readonly clearShareButton_LOC: Locator;
  private readonly agentRowValue_LOC: any;
  private readonly agentSearchInput_LOC: any;
  private readonly agentDropdown_LOC: any;
  private readonly agentValue_LOC: any;
  private readonly agentResultValue_LOC: any;
  private readonly searchAgentCombobox_LOC: Locator;
  // Auto-generated locators by AI Agent
  private readonly customerNameInput_LOC: Locator;
  // Auto-generated locators by AI Agent
  private readonly searchCustomer_LOC: Locator;



  constructor(private page: Page) {
    this.moveToggle_LOC = page.locator(
      "//label[contains(@id,'own') and contains(text(),'All')]"
    );
    // this.viewCustomerEditButton_LOC = page.locator(
    //   "//td[contains(text(),'View Customer')]//parent::tr//div//input[contains(@value,'Edit')]"
    // );
    // this.viewCustomerSaveButton_LOC = page.locator(
    //   "//td[contains(text(),'Edit Customer')]//parent::tr//input[@value='  Save  ']"
    // );
    this.commissionAuditStatus_LOC = page.locator("#comm_audit_status");
    // this.customersSiteMenu_LOC = page.locator("//a[normalize-space()='Customers']");
    this.addInternalShareLink_LOC = page.locator("//a[@class='add-share' and contains(@onclick,'true,true')]");
    this.shareAmountInput_LOC = page.locator("#share_frame_internal input.share_amt_field_width");
    this.shareAgentInput_LOC = page.locator(
      "//span[contains(@class,'select2-search--dropdown')]/input[@class='select2-search__field']"
    );
    this.shareAgentSearchResultInput_LOC = (agentName: string) =>
      page.locator('.select2-results__option', { hasText: agentName });
    // this.newSalesLeadLink_LOC = page.locator("//a[normalize-space()='New Lead']");
    // this.leadsLink_LOC = page.locator("//a[normalize-space()='Leads']");
    this.clearShareButton_LOC = page.locator(
      "//div[@class='share_entry is-last share_entry share form-group row']//span[@class='clear-added-two-shares'][contains(text(),'✖')]"
    );

    // this.LoadMenuList = (menuname: string) => {
    //   return this.page.getByRole("link", { name: menuname });
    // };
    this.agentRowValue_LOC = '#share_frame_internal';
    this.agentSearchInput_LOC = '#share_frame_internal .col-xs-5 .select2-container';
    this.agentDropdown_LOC = '.select2-dropdown';
    this.agentValue_LOC = 'span.select2-search.select2-search--dropdown input[role="textbox"]';
    this.agentResultValue_LOC = '.select2-results__option';
    this.searchAgentCombobox_LOC = page.locator(
      "//div[@id='share_frame_internal']//span[@role='combobox' and contains(@aria-labelledby,'commission_internalagent_id')]"
    );
    // Auto-generated locator assignments by AI Agent
    this.customerNameInput_LOC = page.locator("#customerName, [name*='customerName'], [placeholder*='Customer Name']");
    // Auto-generated locator assignments by AI Agent
    this.searchCustomer_LOC = page.locator("//*[contains(text(),'Search Customer')] | //button[contains(text(),'Search Customer')] | //input[contains(@value,'Search Customer')]");
  }
  // /*
  //  * @author Parth Rastogi
  //  * @description This function is used to navigate to a specific load type
  //  * @modified 2025-07-15
  //  */
  // async navigateToLoad(loadType: string) {
  //   try {
  //     await this.LoadMenuList(loadType).click();
  //     await this.page.waitForLoadState("networkidle");
  //   } catch (error) {
  //     console.error(`Error Navigating to Load: ${error}`);
  //     throw error;
  //   }
  // }

  /*
   * @author Parth Rastogi
   * @description This function is used to move the toggle button to select all customers
   * @modified 2025-07-15
   */
  async moveToggle() {
    try {
      const toggle = this.moveToggle_LOC;
      await toggle.waitFor({ state: "visible" });
      await toggle.click();
    } catch (error) {
      console.error(`Error clicking on toggle button: ${error}`);
      throw error;
    }
  }
//   /**
//  * Clicks on the 'Edit Button' to edit Customer Info.
//  * Waits for the element to be visible and clicks using force.
//  *
//  * @author Avanish Srivastava
//  * @modified 2025-08-01
//  */
//   async clickOnEditCustomer(): Promise<void> {
//     await this.viewCustomerEditButton_LOC.waitFor({ state: 'visible' });
//     await this.viewCustomerEditButton_LOC.scrollIntoViewIfNeeded();
//     await Promise.all([
//       this.viewCustomerEditButton_LOC.nth(0).click(),
//     ]);
//   }

//   /**
// * Clicks on the 'Save Button' to save Customer Info.
// * Waits for the element to be visible and clicks using force.
// *
// * @author Avanish Srivastava
// * @modified 2025-08-01
// */
//   async clickOnSaveButton(): Promise<void> {
//     // await Promise.all([
//     //   this.viewCustomerSaveButton_LOC.nth(0).click(),
//     // ]);
  
//     /**
//   * @author Aniket Nale
//   * @modified 2025-10-22
//   */
//     await this.viewCustomerSaveButton_LOC.nth(0).waitFor({ state: 'visible' });
//     await this.viewCustomerSaveButton_LOC.nth(0).waitFor({ state: 'attached' });
//     await this.viewCustomerSaveButton_LOC.nth(0).scrollIntoViewIfNeeded();
//     await expect.soft(this.viewCustomerSaveButton_LOC.nth(0)).toBeEnabled({ timeout: WAIT.SMALL });
//     await this.viewCustomerSaveButton_LOC.nth(0).click();
//     await this.page.waitForLoadState('networkidle');
//     await this.page.waitForLoadState('domcontentloaded');
//   }

  /**
   * Selects "PENDING" from the commission status dropdown (#comm_audit_status)
   * @author Avanish Srivastava
   * @created 2025-08-01
   */
  async selectPendingCommissionStatus(): Promise<void> {
    await this.commissionAuditStatus_LOC.waitFor({ state: "visible" });
    await this.commissionAuditStatus_LOC.selectOption("PENDING");
    console.log("Selected commission status: PENDING");
  }

//   /**
//  * Hover-Over Customer Menu Option
//  * @author Avanish Srivastava
//  * @created 2025-08-06
//  */

//   // async hoverOverCustomersMenu() {
//   //   const customersMenu = this.customersSiteMenu_LOC;
//   //   await customersMenu.waitFor({ state: 'visible' });
//   //   await customersMenu.hover();
//   // }

//   /**
// * Hover-Over Customer Menu Option
// * @author Aniket Nale
// * @modified 2025-10-28
// */
//   async hoverOverCustomersMenu() {
//     const customersMenu = this.customersSiteMenu_LOC;
//     await this.page.waitForLoadState('networkidle');
//     await customersMenu.waitFor({ state: 'visible', timeout: WAIT.LARGE });
//     await customersMenu.scrollIntoViewIfNeeded();
//     await customersMenu.hover({ force: true });
//   }

  /**
   * Select Internal Share Agent from Combo-box
   * @author Avanish Srivastava
   * @created 2025-08-06
   */

  async selectInternalShareAgent(agentName: string | number): Promise<void> {
    const agentNameStr = String(agentName);
    console.log(`Attempting to select Internal Share Agent: ${agentNameStr}`);
    await this.searchAgentCombobox_LOC.first().waitFor({ state: "visible" });
    const comboboxes = this.searchAgentCombobox_LOC;
    const count = await comboboxes.count();
    for (let i = 0; i < count; i++) {
      const combobox = comboboxes.nth(i);
      await combobox.waitFor({ state: "visible" });
      await combobox.waitFor({ state: "attached" });
      const text = (await combobox.textContent())?.trim();
      console.log(`Combobox ${i + 1} current text: "${text}"`);
      if (!text || text === "" || text === "Select...") {
        await combobox.scrollIntoViewIfNeeded();
        await combobox.click();
        await this.shareAgentInput_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await this.shareAgentInput_LOC.clear();
        await this.shareAgentInput_LOC.fill(agentNameStr);
        const searchAgentOption = this.shareAgentSearchResultInput_LOC(agentNameStr);
        await searchAgentOption.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await searchAgentOption.click();
        const selectedText = (await combobox.textContent())?.trim();
        if (selectedText && selectedText.includes(agentNameStr)) {
          console.log(
            `Successfully selected Internal Share Agent: ${agentNameStr} in combobox position ${
              i + 1
            }`
          );
          return;
        } else {
          console.warn(
            `Agent not selected correctly. Expected to contain: ${agentNameStr}, Got: ${selectedText}`
          );
          continue;
        }
      }
    }
  }

  /**
   * Click on Add Internal Share Link
   * @author Avanish Srivastava
   * @created 2025-08-06
   */

  async clickOnAddInternalShare(): Promise<void> {
    await this.addInternalShareLink_LOC.waitFor({ state: "visible" });
    await this.addInternalShareLink_LOC.scrollIntoViewIfNeeded();
    await Promise.all([this.addInternalShareLink_LOC.click()]);
  }

  /**
   * Enter Internal Share Amount
   * @author Avanish Srivastava
   * @created 2025-08-06
   */

  async setInternalShareAmount(amount: string | number): Promise<void> {
    await this.shareAmountInput_LOC.scrollIntoViewIfNeeded();
    await this.shareAmountInput_LOC.waitFor({ state: "visible" });
    await this.shareAmountInput_LOC.fill(amount.toString());
    console.log(`Entered Internal Share Amount: ${amount}`);
  }

//   /**
// * Click on New Sales Leads Link under Customer Menu
// * @author Avanish Srivastava
// * @created 2025-08-05
// */

//   async clickOnNewSalesLeadLink() {
//     await this.newSalesLeadLink_LOC.waitFor({ state: "visible" });
//     await this.newSalesLeadLink_LOC.click();
//   }

//   /**
// * Click on Leads Link under Customer Menu
// * @author Avanish Srivastava
// * @created 2025-08-05
// */

//   async clickOnLeadsLink() {
//     await this.leadsLink_LOC.waitFor({ state: "visible" });
//     await this.leadsLink_LOC.click();
//   }

/**
* Enter Share Amount
* @author Avanish Srivastava
* @created 2025-08-05
*/

  async enterShareAmount(value: string | number): Promise<void> {
    await this.page.locator(this.agentRowValue_LOC).waitFor({ state: "visible", timeout: WAIT.DEFAULT });
    await this.page.locator(this.agentRowValue_LOC).scrollIntoViewIfNeeded();
    await this.shareAmountInput_LOC.waitFor({ state: "visible" });
    await this.shareAmountInput_LOC.scrollIntoViewIfNeeded();
    await this.shareAmountInput_LOC.fill(String(value));
  }

  /**
   * Select Agent from Dropdown
   * @author Avanish Srivastava
   * @created 2025-08-05
   */

  async selectAgent(value: string): Promise<void> {
    console.log(`Attempting to select agent: ${value}`);
    try {
      await this.page.waitForSelector(this.agentRowValue_LOC, {
        state: 'visible',
        timeout: WAIT.SMALL
      });
      const select2Container = this.page.locator(this.agentSearchInput_LOC).first();
      await select2Container.waitFor({ state: 'visible', timeout: WAIT.SMALL });
      await select2Container.scrollIntoViewIfNeeded();
      await select2Container.click();
      await this.page.waitForSelector(this.agentDropdown_LOC, {
        state: 'visible',
        timeout: WAIT.SMALL
      });
      const searchBox = this.page.locator(this.agentValue_LOC).first();
      await searchBox.waitFor({ state: 'visible', timeout: WAIT.SMALL });
      await searchBox.fill(value || '');
      const optionLocator = this.page.locator(this.agentResultValue_LOC).filter({
        hasText: value
      }).first();
      await optionLocator.waitFor({ state: 'visible', timeout: WAIT.SMALL });
      await optionLocator.click();
      await this.page.waitForSelector(this.agentDropdown_LOC, {
        state: 'hidden',
        timeout: WAIT.SMALL
      });
      console.log("Agent selection successful");
    } catch (error) {
      console.error("Failed to select agent:", error);
      throw new Error(`Failed to select agent ${value}: ${error}`);
    }
  }

  /**
   * Clear InterShare Data
   * @author Avanish Srivastava
   * @created 2025-08-05
   */

  async clearShare() {
    await this.clearShareButton_LOC.waitFor({ state: "visible" });
    await this.clearShareButton_LOC.scrollIntoViewIfNeeded();
    await this.clearShareButton_LOC.click();
  }

  /**
   * enterCustomerName - Auto-generated by AI Agent
   * @author AI Agent Generator
   * @created 2026-02-18
   */
  async enterCustomerName(value: string): Promise<void> {
    await this.customerNameInput_LOC.waitFor({ state: 'visible', timeout: 10000 });
    await this.customerNameInput_LOC.fill(value);
    console.log(`Entered ${value} in Customer Name`);
  }

  /**
   * clickOnSearchCustomer - Auto-generated by AI Agent
   * @author AI Agent Generator
   * @created 2026-02-18
   */
  async clickOnSearchCustomer(): Promise<void> {
    await this.searchCustomer_LOC.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchCustomer_LOC.click();
    console.log('Clicked on Search Customer');
  }
}

export default CustomerPage;
