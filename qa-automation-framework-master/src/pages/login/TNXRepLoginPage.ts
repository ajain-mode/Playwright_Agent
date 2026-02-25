import { Locator, Page } from "@playwright/test";
import loginSetup from "@loginHelpers/loginSetup";
import userSetup from "@loginHelpers/userSetup";

class TNXRepLoginPage {
  private readonly usernameInput_LOC: Locator;
  private readonly passwordInput_LOC: Locator;
  private readonly loginButton_LOC: Locator;

  constructor(private page: Page) {
    this.usernameInput_LOC = page.locator("#username");
    this.passwordInput_LOC = page.locator("#password");
    this.loginButton_LOC = page.locator("//button[text()='Continue']");
  }
  /**
   * Enters the username in the login input field.
   * @author Parth Rastogi
   * @created 2025-11-10
   * @param {string} UserName - The username to enter.
   */
  public async enterUserName(UserName: string) {
    await this.page.waitForLoadState("domcontentloaded");
    await this.usernameInput_LOC.fill(UserName);
  }
  /**
   * Enters the password in the login input field.
   * @author Parth Rastogi
   * @created 2025-11-10
   * @param {string} password - The password to enter.
   */
  public async clickLoginButton() {
    await this.loginButton_LOC.click();
  }
  /**
   * Logs into BTMS based on the environment specified in loginSetup.
   * @author : Parth Rastogi
   * @modified : 2025-11-10
   * @argument {string} userName - The username to log in with, ex. userConfig.ediUserMarmaxx.
   */
  async TNXRepLogin(userName: string): Promise<void> {
    await this.page.goto(loginSetup.tnxRepUrl);
    await this.enterUserName(userName);
    await this.passwordInput_LOC.fill(userSetup.tnxRepPassword);
    await this.loginButton_LOC.click();
    
  }
 
}
export default TNXRepLoginPage;
