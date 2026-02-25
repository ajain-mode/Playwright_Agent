import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class SSOMicrosoftLoginPage {
    private readonly emailInput_LOC: Locator;
    private readonly nextButton_LOC: Locator;
    private readonly passwordInput_LOC: Locator;
    private readonly signInButton_LOC: Locator;

    constructor(private page: Page) {
        this.emailInput_LOC = this.page.locator("//input[@name='loginfmt']");
        this.nextButton_LOC = this.page.locator("//input[@type='submit' and @value='Next']");
        this.passwordInput_LOC = this.page.locator("//input[@name='passwd']");
        this.signInButton_LOC = this.page.locator("//input[@type='submit' and @value='Sign in']");
    }
    /**
     * Enter email and click Next
     * @author Rohit Singh
     * @created 09-Jan-2026
     * @param email Email address to enter 
     */
    async enterEmailClickNext(email: string): Promise<void> {
        await commonReusables.waitForPageStable(this.page);
        await this.page.waitForTimeout(WAIT.DEFAULT); // Wait for 2 seconds to ensure the password field is loaded
        await this.emailInput_LOC.fill(email);
        await this.nextButton_LOC.click();
        console.log(`Entered email: ${email} and clicked Next`);
        await commonReusables.waitForPageStable(this.page);
        await this.page.waitForTimeout(WAIT.DEFAULT); // Wait for 2 seconds to ensure the password field is loaded
    }
    /**
     * Enter password and click Sign In
     * @author Rohit Singh
     * @created 09-Jan-2026
     * @param password Password to enter
     */
    async enterPasswordClickSignIn(password: string): Promise<void> {
        await commonReusables.waitForPageStable(this.page);
        await this.passwordInput_LOC.fill(password);
        await this.page.waitForTimeout(WAIT.DEFAULT); // Wait for 2 seconds to ensure the next page is loaded
        await this.signInButton_LOC.click();
        console.log(`Entered password and clicked Sign In`);
        await commonReusables.waitForPageStable(this.page);
        await this.page.waitForTimeout(WAIT.DEFAULT); // Wait for 2 seconds to ensure the next page is loaded
    }
    
}