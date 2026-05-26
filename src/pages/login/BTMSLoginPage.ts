import { expect, Locator, Page } from "@playwright/test";
import loginSetup from "@loginHelpers/loginSetup";
import HomePage from "@pages/commonPages/HomePage";
import BTMSSSOPage from "./BTMSSSOPage";
import userSetup from "@loginHelpers/userSetup";
import commonReusables from "@utils/commonReusables";
import SSOMicrosoftLoginPage from "./SSOMicrosoftLoginPage";
import AgentAccountsPage from "@pages/commonPages/AgentAccountsPage";
import { PageManager } from "@utils/PageManager";

class BTMSLoginPage {
  private readonly usernameInput_LOC: Locator;
  private readonly passwordInput_LOC: Locator;
  private readonly loginButton_LOC: Locator;
  private readonly ssoButton_LOC: Locator;

  constructor(private page: Page) {
    this.usernameInput_LOC = page.locator("//input[@id='form_agent_login']");
    this.passwordInput_LOC = page.locator("//input[@id='form_agent_password']");
    this.loginButton_LOC = page.locator("//button[@id='form_sign_in']");
    this.ssoButton_LOC = page.locator("//a[text()=' Sign in with Single Sign-On']");
  }
  /**
   * Enters the username in the login input field.
   * @author Rohit Singh
   * @modified 2025-07-21
   * @param {string} UserName - The username to enter.
   */
  public async enterUserName(UserName: string) {
    await this.page.waitForLoadState("domcontentloaded");
    await this.usernameInput_LOC.fill(UserName);
  }
  /**
   * Logs into BTMS based on the environment specified in loginSetup.
   * @author : Rohit Singh
   * @modified : 2025-09-16
   * @argument {string} userName - The username to log in with, ex. userConfig.ediUserMarmaxx.
   */
  async BTMSLogin(userName: string, env?: string): Promise<void> {
    // Determine the login URL based on the environment pass through test case
    //modified by Rohit Singh on 2025-nov-05
    let loginUrl: string;
    loginUrl = loginSetup.btmsUrl;
    if (env) {
      switch (env.toLowerCase()) {
        case "pit":
          if (loginUrl.includes("stage")) {
            loginUrl = loginUrl.replace("stage", "pit");
          }
          break; // Add missing break statement
        case "stage":
          if (loginUrl.includes("pit")) {
            loginUrl = loginUrl.replace("pit", "stage");
          }
          break; // Add missing break statement
        default:
          // Handle unexpected environment values
          console.error(`Unknown environment: ${env}`);
          throw new Error(`Unknown environment: ${env}`);
          break;


          //console.warn(`Unknown environment: ${env}`);
          //break;
      }
    }
    await this.page.goto(loginUrl);
    console.log("Navigated to BTMS URL: " + loginUrl);
    await this.page.waitForLoadState('networkidle');
    if (await this.ssoButton_LOC.isVisible()) {
      console.log("SSO Button is visible, proceeding with SSO login");
      await this.btmsSSOLogin();
      console.log("SSO Login completed");
      await this.selectRequiredUser(userName);
    }
    else {
      console.log("SSO Button not visible");
      //__________________________________________________________________________________________
      const btmsSSOPage = new BTMSSSOPage(this.page);
      // Check if BTMS login page is visible
      if (!(await this.btmsLoginPageVisible())) {
        // Login page not visible - check for SSO skip button and exit
        console.log("Login page not visible, checking for SSO skip button");
        const skipButtonVisible = await btmsSSOPage.isVisibleSkipForNow();
        if (skipButtonVisible) {
          await btmsSSOPage.clickSkipForNow();
          await this.page.waitForLoadState('networkidle');
        }
        console.log("Already logged in, skipping login steps");
        return; // Exit function - already logged in
      }
      console.log("Login page visible, proceeding with login");
      // Login page is visible - proceed with login
      await this.enterUserName(userName);
      await this.passwordInput_LOC.fill(userSetup.globalPassword);
      await this.loginButton_LOC.click();
      await commonReusables.waitForPageStable(this.page);
      // Check for SSO skip button after login
      const skipButtonVisible = await btmsSSOPage.isVisibleSkipForNow();
      if (skipButtonVisible) {
        await btmsSSOPage.clickSkipForNow();
        await this.page.waitForLoadState('networkidle');
      }
      // Validate successful login
      const homePage = new HomePage(this.page);
      await commonReusables.waitForPageStable(this.page);
      const homePageVisible = await homePage.expectServiceTitleToBeVisible("BTMS - Home");
      if (!homePageVisible) {
        this.BTMSLogin(userName, env);  // Retry login
      } else {
        await console.log("Login successful, home page is visible");
      }
      //__________________________________________________________________________________________
    }
  }
  /**
   * Checks if the BTMS login page is visible.
   * @author Rohit Singh
   * @modified 2025-07-30
   * @returns {Promise<boolean>} True if the BTMS login page is visible, false otherwise.
   */
  async btmsLoginPageVisible(): Promise<boolean> {
    await this.page.waitForLoadState('domcontentloaded');
    const isVisible = await this.usernameInput_LOC.isVisible();
    return isVisible;
  }
  /**
   * Performs SSO login for BTMS.
   * @author Rohit Singh
   * @created 09-Jan-2026
   */
  async btmsSSOLogin(): Promise<void> {
    await expect(this.ssoButton_LOC).toBeVisible();
    await this.ssoButton_LOC.click();
    const ssoMicrosoftLoginPage = new SSOMicrosoftLoginPage(this.page);
    await ssoMicrosoftLoginPage.enterEmailClickNext(userSetup.btmsSSOUser);
    await ssoMicrosoftLoginPage.enterPasswordClickSignIn(userSetup.btmsSSOPassword);
    await commonReusables.waitForPageStable(this.page);
  }

  /**
   * Implementation for selecting the required user after SSO login
   * This involves clicking on a user profile and selecting from a list
   * @param userName - The username to select in Upper Case format
   * @author Rohit Singh
   * @created 09-Jan-2026
   */
  async selectRequiredUser(userName: string): Promise<void> {
    const pages = new PageManager(this.page);
    const isOnAcceptTermPage = await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()
    if (isOnAcceptTermPage) {
      console.log("On BTMS Accept Terms Page, accepting terms and conditions");
      await pages.btmsAcceptTermPage.acceptTermsAndConditions();
    }
    console.log('Navigate Home Page to switch account');
    const homePage = new HomePage(this.page);
    await homePage.clickSwitchAccountButton();
    const agentAccountsPage = new AgentAccountsPage(this.page);
    await agentAccountsPage.clickOnUserNameIfVisible(userName.toUpperCase());
    await commonReusables.waitForPageStable(this.page);
    if (await this.ssoButton_LOC.isVisible()) {
      await this.ssoButton_LOC.click({ force: true });
      //@modified: Rohit Singh: 22-Jan-2026: Added wait after clicking SSO button
      await this.page.waitForTimeout(WAIT.DEFAULT)
      if (await this.ssoButton_LOC.isVisible()) {
        await this.ssoButton_LOC.click();
      }
    }
    console.log(`Selected user: ${userName}`);
  }
}

export default BTMSLoginPage;
