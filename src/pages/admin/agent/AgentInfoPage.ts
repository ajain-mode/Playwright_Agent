import { expect, Locator, Page } from "@playwright/test";
import { PageManager } from "@utils/PageManager";

export default class AgentInfoPage {
  private readonly editButton_LOC: Locator;
  private readonly checkCredentialsButton_LOC: Locator;
  private readonly datUsernameView_LOC: Locator;
  private readonly datUsernameInput_LOC: Locator;
  private readonly bulkChangeRole_LOC: Locator;
  private readonly duplicateButton_LOC: Locator;
  private readonly agentNameView_LOC: Locator;
  private readonly authValue_LOC: Locator;


  constructor(private page: Page) {

    this.editButton_LOC = this.page.locator("//td[contains(text(),'Agent Info')]/following-sibling::td/div/input[contains(@value,'Edit')]");
    this.checkCredentialsButton_LOC = this.page.locator('#dat-check-credentials, input[value="Check Credentials"]');
    this.datUsernameView_LOC = this.page.locator('//td[text()="DAT Username"]/following-sibling::td[contains(@class,"view")]');
    this.datUsernameInput_LOC = this.page.locator('#agent_dat_username');
    this.duplicateButton_LOC = this.page.locator("//td[contains(text(),'Agent Info')]/following-sibling::td/div/input[contains(normalize-space(@value),'Duplicate')]");
    this.agentNameView_LOC = this.page.locator("//td[label[normalize-space()='Name']]/following-sibling::td[contains(@class,'addr-block-name-cell')]");
    this.bulkChangeRole_LOC = page.locator("td.viewww");
    this.authValue_LOC = this.page.locator(
      "//td[@class='fn' and contains(normalize-space(translate(., '\u00A0', ' ')), 'Auth Level')]/following-sibling::td[@class='view' and not (preceding-sibling::td[@class='view'])]"
    );

  }

  /**
   * @author Mukul Khan
   * @description This method handles clicking the Edit button on View Agent Info page
   * @created 01-Dec-25
   */
  async clickEditButton() {
    await this.editButton_LOC.waitFor({ state: "visible" });
    await this.editButton_LOC.click();
  }

  /**
   * @author Mukul Khan
   * @description This method handles clicking the Edit button on View Agent Info page
   * @created 01-Jan-26
   */
  async clickDuplicateButton() {
    await this.duplicateButton_LOC.waitFor({ state: "visible" });
    await this.duplicateButton_LOC.click();
  }

  /**
    * @author Mukul Khan
    * @description This method handles CheckCredentials button is Visible And Enabled In Edit Agent page
    * @created 01-Dec-25
    */
  async expectCheckCredentialsVisibleAndEnabledInEdit() {
    await expect(this.checkCredentialsButton_LOC, 'Check Credentials button should be present in Edit mode').toBeVisible({ timeout: WAIT.SMALL });
    await expect(this.checkCredentialsButton_LOC, 'Check Credentials button should be enabled in Edit mode').toBeEnabled();
  }

  /**
    * @author Mukul Khan
    * @description This method handles to validate DAT Username  fields value is blank on agent info page in view mode
    * @created 01-Dec-25
    */
  async validateDatUsernameBlankInView() {
    const datUsernameInput = this.datUsernameView_LOC;
    if (await datUsernameInput.count()) {
      await expect(datUsernameInput, 'DAT Username input should be blank in View mode').toHaveText('');
      return;
    }
  }

  /**
    * @author Mukul Khan
    * @description This method handles to validate DAT Username  fields value is blank on agent page in Edit mode
    * @created 01-Dec-25
    */
  async validateDatUsernameBlankInEdit() {
    const datUsernameInput = this.datUsernameInput_LOC;
    if (await datUsernameInput.count()) {
      await expect(datUsernameInput, 'DAT Username input should be blank in Edit mode').toHaveValue('');
      return;
    }
  }

  /**
   * @author Tejaswini
   * @description This method validates and assigns Bulk Change Loads Manager role to agent if not already assigned
   * @param roleName - The name of the role to validate and assign
   * @param pages - The PageManager instance for accessing other page objects
   * @created 02-Dec-25
   */
  async validateBulkChangeRole(roleName: string, pages: PageManager): Promise<void> {
    try {
      const rolesText = await this.bulkChangeRole_LOC.first().innerText();
      if (rolesText.includes(roleName)) {
        console.log(`${roleName} role is already assigned.`);
        return;
      }
      await this.duplicateButton_LOC.click();
      console.log(`${roleName} role not found. Assigning...`);
      await pages.agentEditPage.assignRole(roleName);
    } catch (error) {
      console.error(`Error checking or assigning ${roleName}:`, error);
      throw error;
    }
  }

  /**  
    * @author Mukul Khan
    * @description This method gets the displayed agent name from the agent info page
    * @created 29-Dec-25
    */
  async getAgentName() {
    const nameText = await this.agentNameView_LOC.innerText();
    return nameText.trim();
  }

  /**
   * Reads and returns the Auth Level text normalized to uppercase without NBSPs
   * 
   * @returns Promise<string> - The normalized auth level in uppercase
   * 
   * @author Suhaib
   * @created 2025-12-21
   */
  async getAuthLevel(): Promise<string> {
    await this.authValue_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
    const raw = (await this.authValue_LOC.textContent()) ?? "";
    return raw.replace(/\u00A0/g, " ").trim().toUpperCase();
  }

  /**
   * getAgentEmail - Auto-generated by AI Agent
   * @author AI Agent Generator
   * @created 2026-02-24
   */
  async getAgentEmail(): Promise<string> {
    const element = this.page.locator('[data-field="agentEmail"]').first();
    const text = await element.textContent() || '';
    console.log('Got Agent Email:', text);
    return text.trim();
  }
}