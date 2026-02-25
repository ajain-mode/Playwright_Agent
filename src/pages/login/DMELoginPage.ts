import { Locator, Page, expect } from "@playwright/test";
import loginSetup from "@loginHelpers/loginSetup";
import userSetup from "@loginHelpers/userSetup";

class DMELoginPage {
  private readonly usernameInput_LOC: Locator;
  private readonly passwordInput_LOC: Locator;
  private readonly loginButton_LOC: Locator;

  constructor(private page: Page) {
    this.usernameInput_LOC = page.locator("#username");
    this.passwordInput_LOC = page.locator("#password");
    this.loginButton_LOC = page.locator("//*[@type='submit']");
  }
  /**
   * Enters the username in the login input field.
   * @author Deepak Bohra
   * @created 2025-09-04
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
  async DMELogin(userName: string): Promise<void> {
    await this.page.goto(loginSetup.dmeUrl);
    await this.page.waitForLoadState("domcontentloaded");
    await this.enterUserName(userName);
    await this.passwordInput_LOC.fill(userSetup.dmePassword);

    // Wait for login button to be visible and enabled
    await this.loginButton_LOC.waitFor({ state: "visible", timeout: WAIT.SMALL });
    // Wait for button to be enabled using Playwright's built-in method
    await expect(this.loginButton_LOC).toBeEnabled({ timeout: WAIT.SMALL });
    console.log("✅ Login button is ready for click");
    await this.loginButton_LOC.click();
    await this.page.waitForLoadState("domcontentloaded");
    // Wait for the page to load completely
  }
  /**
   * Checks if the BTMS login page is visible.
   * @author Deepak Bohra
   * @modified 2025-09-05
   * @returns {Promise<boolean>} True if the BTMS login page is visible, false otherwise.
   */
  async dmeLoginPageVisible(): Promise<boolean> {
    await this.page.waitForLoadState("domcontentloaded");
    const isVisible = await this.usernameInput_LOC.isVisible();
    return isVisible;
  }
}
export default DMELoginPage;
