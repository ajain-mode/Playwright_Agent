import loginSetup from "@loginHelpers/loginSetup";
import { Locator, Page } from "@playwright/test";


class CustomerPortalLogin {

    // Implementation for Tritan login page
    private readonly usernameInput_LOC: Locator;
    private readonly passwordInput_LOC: Locator;
    private readonly signInButton_LOC: Locator;
    private readonly userProfileNavbar_LOC: Locator;
    private readonly userSignInButton_LOC: Locator;

    constructor(private page: Page) {
        this.usernameInput_LOC = page.locator("#email");
        this.passwordInput_LOC = page.locator("#password");
        this.signInButton_LOC = page.locator("//button[@type='button']");
        this.userProfileNavbar_LOC = page.locator("#userprofilenavbar");
        this.userSignInButton_LOC = page.locator("#next");
    }

    async LoginCustomerPortal(userName: string, password: string) {
        await this.page.goto(loginSetup.customerPortalUrl);
        console.log("Navigated to Customer Portal URL: " + loginSetup.customerPortalUrl);
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState("domcontentloaded");
        await this.signInButton_LOC.click();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState("domcontentloaded");
        await this.usernameInput_LOC.waitFor({ state: 'visible', timeout: WAIT.XLARGE });
        await this.usernameInput_LOC.fill(userName);
        await this.passwordInput_LOC.fill(password);
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle');
        //Added wait to avoid Something Went Wrong error on New Customer portal
        await this.page.waitForTimeout(WAIT.SMALL / 2);
        await this.userSignInButton_LOC.click();
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle');
        await this.userProfileNavbar_LOC.waitFor({ state: 'visible', timeout: WAIT.XXLARGE });
        console.log("Customer Portal login successful for user: " + userName);
    }

}
export default CustomerPortalLogin;
