import loginSetup from "@loginHelpers/loginSetup";
import { Locator, Page } from "@playwright/test";
/**
 * Tritan Login Page
 * @author Rohit Singh
 * @created 27-10-2025
 */

class TRITANLoginPage {
    // Implementation for Tritan login page
    private readonly usernameInput_LOC: Locator;
    private readonly passwordInput_LOC: Locator;
    private readonly signInButton_LOC: Locator;

    constructor(private page: Page) {
        this.usernameInput_LOC = page.locator("#UserId");
        this.passwordInput_LOC = page.locator("#Password");
        this.signInButton_LOC = page.locator("//input[@name='submitbutton']");
    }

    async LoginTRITAN(userName: string, password: string) {
        await this.page.goto(loginSetup.tritanUrl);
        console.log("Navigated to Tritan URL: " + loginSetup.tritanUrl);
        await this.page.waitForLoadState('networkidle');
        await this.usernameInput_LOC.fill(userName);
        await this.passwordInput_LOC.fill(password);
        await this.signInButton_LOC.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

}
export default TRITANLoginPage;