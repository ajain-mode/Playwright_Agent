import { Locator, Page } from "@playwright/test";
import loginSetup from "@loginHelpers/loginSetup";
import userSetup from "@loginHelpers/userSetup";

class TNXLoginPage {
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
   * @author Deepak Bohra
   * @created 2025-08-29
   * @param {string} UserName - The username to enter.
   */
  public async enterUserName(UserName: string) {
    await this.page.waitForLoadState("domcontentloaded");
    await this.usernameInput_LOC.fill(UserName);
  }
  /**
   * Enters the password in the login input field.
   * @author Deepak Bohra
   * @created 2025-09-04
   * @param {string} password - The password to enter.
   */
  public async clickLoginButton() {
    await this.loginButton_LOC.click();
  }
  /**
   * Logs into BTMS based on the environment specified in loginSetup.
   * @author : Deepak Bohra
   * @modified : 2025-09-04
   * @argument {string} userName - The username to log in with, ex. userConfig.ediUserMarmaxx.
   */
  async TNXLogin(userName: string): Promise<void> {
    await this.page.goto(loginSetup.tnxUrl);
    await this.enterUserName(userName);
    await this.passwordInput_LOC.fill(userSetup.tnxPassword);
    await this.loginButton_LOC.click();
    
  }
  /**
   * Checks if the BTMS login page is visible.
   * @author Deepak Bohra
   * @modified 2025-09-04
   * @returns {Promise<boolean>} True if the BTMS login page is visible, false otherwise.
   */
  async tnxLoginPageVisible(): Promise<boolean> {
    await this.page.waitForLoadState("domcontentloaded");
    const isVisible = await this.usernameInput_LOC.isVisible();
    return isVisible;
  }
}
export default TNXLoginPage;
