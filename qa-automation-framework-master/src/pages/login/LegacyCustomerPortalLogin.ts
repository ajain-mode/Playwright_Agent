import loginSetup from "@loginHelpers/loginSetup";
import userSetup from "@loginHelpers/userSetup";
import { Locator, Page } from "@playwright/test";

/**
* Class: LegacyCustomerPortalLogin
* @description This class contains methods to interact with the Legacy Customer Portal Login page.
* @author Aniket Nale
*/

class LegacyCustomerPortalLogin {

    private readonly usernameInput_LOC: Locator;
    private readonly passwordInput_LOC: Locator;
    private readonly logInButton_LOC: Locator;
    private readonly userProfileNavbar_LOC: Locator;

    constructor(private page: Page) {
        this.usernameInput_LOC = page.locator("#form_customer_id");
        this.passwordInput_LOC = page.locator("#form_password");
        this.logInButton_LOC = page.locator("#form_sign_in");
        this.userProfileNavbar_LOC = page.locator("//li[@class='navbar-text text-uppercase']");
    }

    /**
* Login to Legacy Customer Portal
* @description This method logs into the Legacy Customer Portal using the provided username and password.
* @author Aniket Nale
* @created 20-Nov-2025
*/
    async loginLegacyCustomerPortal() {
        await this.page.goto(loginSetup.legacyCustomerPortalUrl);
        console.log("Navigated to Legacy Customer Portal URL: " + loginSetup.legacyCustomerPortalUrl);

        const loginVisible = await this.usernameInput_LOC.isVisible().catch(() => false);

        // If already logged in or redirected
        if (!loginVisible) {
            console.log("Login form not found — user is already logged in.");
            return;
        }

        //@odified : Rohit Singh - 17-Dec-2025 -> Dynamic user selection based on environment
        const envConfig = loginSetup.Execution_Env.toLocaleLowerCase();
        const userName = envConfig === 'pit' ? userSetup.legacyCustomerPortalUser_pit : userSetup.legacyCustomerPortalUser_stage;
        const password = userSetup.legacyCustomerPortalPassword;

        await this.usernameInput_LOC.fill(userName);
        await this.passwordInput_LOC.fill(password);
        await this.logInButton_LOC.click();
        await this.userProfileNavbar_LOC.waitFor({ state: 'visible', timeout: WAIT.XXLARGE });
        console.log("Legacy Customer Portal login successful for user: " + userName);
    }
}
export default LegacyCustomerPortalLogin;
