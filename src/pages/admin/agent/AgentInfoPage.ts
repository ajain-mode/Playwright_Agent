import { expect, Locator, Page } from "@playwright/test";
import AgentEditPage from "@pages/admin/agent/AgentEditPage";
import { PageManager } from "@utils/PageManager";

/** Auth level and user-role expectations for agent view/edit flows. */
export type AgentAuthRolesExpectation = {
  authLevel: string;
  requiredRoles?: string[];
  forbiddenRoles?: string[];
};

export default class AgentInfoPage {
  private readonly editButton_LOC: Locator;
  private readonly checkCredentialsButton_LOC: Locator;
  private readonly datUsernameView_LOC: Locator;
  private readonly datUsernameInput_LOC: Locator;
  private readonly bulkChangeRole_LOC: Locator;
  private readonly userRolesSelect_LOC: Locator;
  private readonly userRolesPlainTextViewCell_LOC: Locator;
  private readonly userRolesViewCell_LOC: Locator;
  private readonly duplicateButton_LOC: Locator;
  private readonly agentNameView_LOC: Locator;
  private readonly authValue_LOC: Locator;
  private readonly agentEmail_LOC: Locator;
  private readonly loginUsernameInput_LOC: Locator;
  private readonly loginSsoButton_LOC: Locator;


  constructor(private page: Page) {

    this.editButton_LOC = this.page.locator("//td[contains(text(),'Agent Info')]/following-sibling::td/div/input[contains(@value,'Edit')]");
    this.checkCredentialsButton_LOC = this.page.locator('#dat-check-credentials, input[value="Check Credentials"]');
    this.datUsernameView_LOC = this.page.locator('//td[text()="DAT Username"]/following-sibling::td[contains(@class,"view")]');
    this.datUsernameInput_LOC = this.page.locator('#agent_dat_username');
    this.duplicateButton_LOC = this.page.locator("//td[contains(text(),'Agent Info')]/following-sibling::td/div/input[contains(normalize-space(@value),'Duplicate')]");
    this.agentNameView_LOC = this.page.locator("//td[label[normalize-space()='Name']]/following-sibling::td[contains(@class,'addr-block-name-cell')]");
    this.bulkChangeRole_LOC = page.locator("td.viewww");
    /** agentform.php: USER ROLES multiselect — id agent_auth_role_ids */
    this.userRolesSelect_LOC = page.locator("#agent_auth_role_ids");
    /** Plain-text USER ROLES cell when view mode does not render the multiselect widget */
    this.userRolesPlainTextViewCell_LOC = page.locator(
      "//td[contains(@class,'fn') and contains(normalize-space(translate(., '\u00A0', ' ')), 'USER ROLES')]/following-sibling::td[contains(@class,'view')]",
    );
    /** USER ROLES jQuery UI multiselect trigger (e.g. "8 selected") — scoped to role widget only */
    this.userRolesViewCell_LOC = page
      .locator("td:has(#agent_auth_role_ids)")
      .getByRole("button", { name: "selected" });
    this.authValue_LOC = this.page.locator(
      "//td[@class='fn' and contains(normalize-space(translate(., '\u00A0', ' ')), 'Auth Level')]/following-sibling::td[@class='view' and not (preceding-sibling::td[@class='view'])]"
    );
    this.agentEmail_LOC = this.page.locator(
      "//td[contains(text(),'Email')]/following-sibling::td[contains(@class,'view')]"
    ).first();
    this.loginUsernameInput_LOC = this.page.locator("#form_agent_login");
    this.loginSsoButton_LOC = this.page.locator("//a[text()=' Sign in with Single Sign-On']");

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
   * Returns true when BTMS legacy login or SSO login page is shown.
   * Edit on legacy agentform.php can redirect here before Rails /agents/:id/edit loads.
   * @author AI Agent
   * @created 2026-06-09
   */
  async isLoginPageVisible(): Promise<boolean> {
    if (await this.loginUsernameInput_LOC.isVisible().catch(() => false)) {
      return true;
    }
    return this.loginSsoButton_LOC.isVisible().catch(() => false);
  }

  /**
   * Builds Rails Edit Agent URL from legacy view (agentform.php?id=) or current /agents/:id path.
   * @author AI Agent
   * @created 2026-06-09
   */
  private resolveAgentEditUrl(): string | null {
    const current = new URL(this.page.url());
    const idFromView = current.searchParams.get("id");
    if (idFromView && current.pathname.includes("agentform.php")) {
      return `/agents/${idFromView}/edit`;
    }
    const railsMatch = current.pathname.match(/\/agents\/(\d+)/);
    if (railsMatch) {
      return `/agents/${railsMatch[1]}/edit`;
    }
    return null;
  }

  /**
   * Clicks Edit on Agent Info and lands on AgentEditPage, re-authenticating if redirected to login.
   * View agent (agentform.php) → Edit agent (/agents/:id/edit) may require a fresh session on staging.
   * @author AI Agent
   * @created 2026-06-09
   * @param agentEditPage - Edit Agent page object
   * @param options.pages - PageManager for BTMSLogin recovery
   * @param options.loginUser - User to re-login as when session expires on Edit navigation
   */
  async openAgentEditForm(
    agentEditPage: AgentEditPage,
    options?: { pages: PageManager; loginUser: string },
  ): Promise<void> {
    const editPath = this.resolveAgentEditUrl();
    if (!editPath) {
      await this.clickEditButton();
    } else {
      const editUrl = new URL(editPath, this.page.url()).href;
      await this.page.goto(editUrl);
      await this.page.waitForLoadState("domcontentloaded");
    }

    if (await this.isLoginPageVisible()) {
      if (!options?.pages || !options?.loginUser) {
        throw new Error(
          "Edit Agent redirected to BTMS login — pass { pages, loginUser } for session recovery",
        );
      }
      await options.pages.btmsLoginPage.reauthenticateOnCurrentPage(options.loginUser);
      if (editPath) {
        await this.page.goto(new URL(editPath, this.page.url()).href);
        await this.page.waitForLoadState("networkidle");
      }
    }

    if (!(await agentEditPage.isEditFormVisible()) && editPath) {
      await this.page.goto(new URL(editPath, this.page.url()).href);
      await this.page.waitForLoadState("networkidle");
    }

    if (await this.isLoginPageVisible()) {
      throw new Error("Edit Agent still on BTMS login after re-authentication");
    }

    await agentEditPage.waitForEditForm();
  }

  /**
   * After Save on Edit Agent, returns to Agent Info view; re-authenticates if login redirect occurs.
   * @author AI Agent
   * @created 2026-06-09
   * @param agentInfoUrl - Agent Info view URL captured before Edit
   * @param options.pages - PageManager for BTMSLogin recovery
   * @param options.loginUser - User to re-login as when session expires
   */
  async recoverAgentInfoViewIfLogin(
    agentInfoUrl: string,
    options?: { pages: PageManager; loginUser: string },
  ): Promise<void> {
    await this.page.waitForLoadState("networkidle");

    if (await this.isLoginPageVisible()) {
      if (!options?.pages || !options?.loginUser) {
        throw new Error(
          "Save redirected to BTMS login — pass { pages, loginUser } for session recovery",
        );
      }
      await options.pages.btmsLoginPage.reauthenticateOnCurrentPage(options.loginUser);
      await this.page.goto(agentInfoUrl);
      await this.page.waitForLoadState("networkidle");
      return;
    }

    if (!this.page.url().includes("agentform.php")) {
      await this.page.goto(agentInfoUrl);
      await this.page.waitForLoadState("networkidle");
    }
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
   * Gets the agent email from the Agent Info page.
   * Reads from the Email row in the agent details table.
   * @author AI Agent
   * @created 26-Mar-2026
   */
  async getAgentEmail(): Promise<string> {
    await this.agentEmail_LOC.waitFor({ state: "visible", timeout: WAIT.SMALL });
    const text = (await this.agentEmail_LOC.textContent())?.trim() || '';
    console.log(`Got Agent Email: ${text}`);
    return text;
  }

  /**
   * Reads selected USER ROLES labels from #agent_auth_role_ids (view or edit).
   * @author AI Agent
   * @created 2026-06-15
   * @returns Role option text keys (e.g. BTMS_USER, PRINCIPAL)
   */
  private async getUserRolesFromSelectElement(): Promise<string[]> {
    if ((await this.userRolesSelect_LOC.count()) === 0) {
      return [];
    }
    return this.userRolesSelect_LOC.evaluate((el) => {
      const select = el as HTMLSelectElement;
      const selected =
        select.selectedOptions.length > 0
          ? Array.from(select.selectedOptions)
          : Array.from(select.querySelectorAll("option:checked"));
      return selected
        .map((option) => (option.textContent ?? "").replace(/\u00A0/g, " ").trim())
        .filter(Boolean);
    });
  }

  /**
   * Returns visible USER ROLES / role assignment text from the agent view page.
   * Prefers #agent_auth_role_ids selected options; waits on multiselect button when present.
   *
   * @author AI Agent
   * @created 2026-04-30
   * @returns Normalized role labels as comma-separated text
   */
  async getDisplayedUserRolesText(): Promise<string> {
    const fromSelect = await this.getUserRolesFromSelectElement();
    if (fromSelect.length > 0) {
      return fromSelect.join(", ");
    }

    if ((await this.userRolesViewCell_LOC.count()) > 0) {
      await this.userRolesViewCell_LOC.first().waitFor({ state: "visible", timeout: WAIT.SMALL });
      const afterWidget = await this.getUserRolesFromSelectElement();
      if (afterWidget.length > 0) {
        return afterWidget.join(", ");
      }
    }

    if ((await this.userRolesPlainTextViewCell_LOC.count()) > 0) {
      await this.userRolesPlainTextViewCell_LOC.first().waitFor({
        state: "visible",
        timeout: WAIT.SMALL,
      });
      const raw = (await this.userRolesPlainTextViewCell_LOC.first().innerText()) ?? "";
      const text = raw.replace(/\u00A0/g, " ").trim();
      if (text && !/^\d+\s+selected$/i.test(text)) {
        return text;
      }
    }

    const rolesCell =
      (await this.bulkChangeRole_LOC.count()) > 0
        ? this.bulkChangeRole_LOC.first()
        : this.userRolesPlainTextViewCell_LOC.first();
    await rolesCell.waitFor({ state: "visible", timeout: WAIT.SMALL });
    const raw = (await rolesCell.innerText()) ?? "";
    return raw.replace(/\u00A0/g, " ").trim();
  }

  /**
   * Parses comma-separated USER ROLES display text into individual role labels.
   * @author AI Agent
   * @created 2026-06-09
   * @param rolesText - Raw USER ROLES cell text
   * @returns Trimmed role display labels
   */
  parseDisplayedUserRoles(rolesText: string): string[] {
    return rolesText
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);
  }

  /**
   * Returns assigned USER ROLES as parsed display labels from the view page.
   * @author AI Agent
   * @created 2026-06-09
   */
  async getDisplayedUserRolesList(): Promise<string[]> {
    return this.parseDisplayedUserRoles(await this.getDisplayedUserRolesText());
  }

  /**
   * Normalizes a role token for comparison (spaces/hyphens → underscores, uppercase).
   * @author AI Agent
   * @created 2026-06-09
   */
  private normalizeRoleToken(role: string): string {
    return role.replace(/[\s-]+/g, "_").toUpperCase();
  }

  /**
   * Returns whether an assigned role satisfies a required role key or display label.
   * @author AI Agent
   * @created 2026-06-09
   */
  private roleIsPresent(assignedRoles: string[], expectedRole: string): boolean {
    const expectedKey = this.normalizeRoleToken(expectedRole);
    return assignedRoles.some((assigned) => {
      const assignedKey = this.normalizeRoleToken(assigned);
      if (expectedKey === AGENT_USER_ROLES.PRINCIPAL) {
        return (
          assignedKey === AGENT_USER_ROLES.PRINCIPAL ||
          assignedKey.startsWith(`${AGENT_USER_ROLES.PRINCIPAL}_`) ||
          assignedKey.includes("PRINCIPAL_ADMIN")
        );
      }
      if (expectedKey === AGENT_USER_ROLES.BTMS_USER) {
        return assignedKey === AGENT_USER_ROLES.BTMS_USER;
      }
      return assignedKey === expectedKey;
    });
  }

  /**
   * Returns whether a forbidden role appears as an exact assigned token (not a substring).
   * @author AI Agent
   * @created 2026-06-09
   */
  private roleIsForbiddenPresent(assignedRoles: string[], forbiddenRole: string): boolean {
    const forbiddenKey = this.normalizeRoleToken(forbiddenRole);
    return assignedRoles.some((assigned) => {
      const assignedKey = this.normalizeRoleToken(assigned);
      if (forbiddenKey === AGENT_USER_ROLES.ADMIN) {
        return assignedKey === AGENT_USER_ROLES.ADMIN;
      }
      if (forbiddenKey === AGENT_USER_ROLES.SYSTEM_ADMIN) {
        return (
          assignedKey === AGENT_USER_ROLES.SYSTEM_ADMIN ||
          assignedKey === "SYSTEM_ADMIN_USER"
        );
      }
      return assignedKey === forbiddenKey;
    });
  }

  /**
   * Matches assigned roles against required/forbidden role keys or display labels.
   * @author AI Agent
   * @created 2026-06-09
   */
  private rolesMatchExpectation(
    assignedRoles: string[],
    expectation: Pick<AgentAuthRolesExpectation, "requiredRoles" | "forbiddenRoles">,
  ): boolean {
    for (const role of expectation.requiredRoles ?? []) {
      if (!this.roleIsPresent(assignedRoles, role)) {
        return false;
      }
    }
    for (const role of expectation.forbiddenRoles ?? []) {
      if (this.roleIsForbiddenPresent(assignedRoles, role)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns whether the agent view page matches the given auth level and role expectations.
   * @author AI Agent
   * @created 2026-06-01
   * @param expectation - Expected auth level and optional required/forbidden role display labels
   */
  async isAgentAuthAndRolesMet(expectation: AgentAuthRolesExpectation): Promise<boolean> {
    const authLevel = await this.getAuthLevel();
    if (authLevel !== expectation.authLevel.toUpperCase()) {
      return false;
    }
    const assignedRoles = await this.getDisplayedUserRolesList();
    return this.rolesMatchExpectation(assignedRoles, expectation);
  }

  /**
   * Hard-asserts Auth Level on the Agent Info view page.
   * @author AI Agent
   * @created 2026-06-01
   * @param expectedAuthLevel - Expected auth level (e.g. MANAGER)
   * @param message - Optional assertion message
   */
  async validateAuthLevel(expectedAuthLevel: string, message?: string): Promise<void> {
    const actual = await this.getAuthLevel();
    expect(
      actual,
      message ?? `Auth Level should be ${expectedAuthLevel.toUpperCase()}`,
    ).toBe(expectedAuthLevel.toUpperCase());
  }

  /**
   * Reads displayed user roles and asserts required/forbidden role lists.
   * @author AI Agent
   * @created 2026-06-01
   * @param options.requiredRoles - Roles that must appear in USER ROLES
   * @param options.forbiddenRoles - Roles that must not appear in USER ROLES
   */
  async validateDisplayedUserRoles(options: {
    requiredRoles?: string[];
    forbiddenRoles?: string[];
    soft?: boolean;
  }): Promise<void> {
    const assignedRoles = await this.getDisplayedUserRolesList();
    const assertFn = options.soft ? expect.soft.bind(expect) : expect;
    for (const role of options.requiredRoles ?? []) {
      assertFn(
        this.roleIsPresent(assignedRoles, role),
        `USER ROLES should include ${role}`,
      ).toBe(true);
    }
    for (const role of options.forbiddenRoles ?? []) {
      assertFn(
        this.roleIsForbiddenPresent(assignedRoles, role),
        `USER ROLES should not include ${role}`,
      ).toBe(false);
    }
  }

  /**
   * When auth/roles do not match, opens Edit, applies auth level and roles, then saves.
   * @author AI Agent
   * @created 2026-06-01
   * @param agentEditPage - Edit Agent page object
   * @param expectation - Target auth level and role display labels to apply when correction is needed
   */
  async ensureAgentAuthAndRoles(
    agentEditPage: AgentEditPage,
    expectation: AgentAuthRolesExpectation,
    options?: { pages: PageManager; loginUser: string },
  ): Promise<void> {
    const authLevel = await this.getAuthLevel();
    const assignedRoles = await this.getDisplayedUserRolesList();
    const authMet = authLevel === expectation.authLevel.toUpperCase();
    const rolesMet = this.rolesMatchExpectation(assignedRoles, expectation);
    if (authMet && rolesMet) {
      return;
    }

    const agentInfoUrl = this.page.url();
    await this.openAgentEditForm(agentEditPage, options);
    if (!authMet) {
      await agentEditPage.selectAuthLevel(expectation.authLevel);
    }
    if (!rolesMet) {
      await agentEditPage.configureUserRoles({
        requiredRoles: expectation.requiredRoles,
        forbiddenRoles: expectation.forbiddenRoles,
      });
    }
    await agentEditPage.clickSaveButton();
    await this.recoverAgentInfoViewIfLogin(agentInfoUrl, options);
  }
}