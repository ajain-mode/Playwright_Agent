import { Locator, Page, expect } from "@playwright/test";
/**
 * @author Rohit Singh
 * @created 2025-07-18
 */
export default class HomePage {
    private readonly loadButton_LOC: any;
    private readonly financeButton_LOC: any;
    private readonly userProfileLink_LOC: Locator;
    private readonly logoutButton_LOC: Locator;
    private readonly switchAccountButton_LOC: Locator;

    constructor(private page: Page) {
        this.loadButton_LOC = page.locator("//a[contains(text(),'Loads')]");
        this.financeButton_LOC = page.locator("//a[contains(text(),'Finance')]");
        this.userProfileLink_LOC = page.locator("//a[@id='js-usermenu-toggle']");
        this.logoutButton_LOC = page.locator("//a[text()='Log Out']");
        this.switchAccountButton_LOC = page.locator("//a[text()='Switch Account']");
    }
    /**
     * @author Rohit Singh
     * @created 2025-07-18
     * @description Clicks on the Loads button in the home page.
     */
    async expectServiceTitleToBeVisible(expectedTitle: string): Promise<boolean> {
        let actualTitle;
        try {
            actualTitle = await this.page.title();
            await expect(actualTitle).toBe(expectedTitle);
            return true; // If assertion passes, return true
        } catch (error) {
            console.log(`Title mismatch. Expected: "${expectedTitle}", Actual: "${actualTitle}"`);
            return false; // If assertion fails, return false
        }
    }
    /**
     * @author Rohit Singh
     * @created 2025-07-18
     * @description Clicks on the Loads button in the home page.
     */
    async clickOnLoadButton() {
        await this.page.waitForLoadState('domcontentloaded'); // Wait for the page to load completely
        await this.loadButton_LOC.click();
        await this.page.waitForLoadState('networkidle'); // Wait for the page to load completely
    }
    /**
     * @author Rohit Singh
     * @created 2025-07-18
     * @description Clicks on the Finance button in the home page.
     */
    async clickOnFinanceButton() {
        await this.page.waitForLoadState('networkidle'); // Wait for the page to load completely
        await this.financeButton_LOC.click();
        await this.page.waitForLoadState('networkidle'); // Wait for the page to load completely
    }

    /**
     * @author Rohit Singh
     * @created 2025-09-09
     * @description Clicks on the User Profile icon in the home page and click logout.
     */
    async clickLogoutButton() {
        await this.page.waitForLoadState('networkidle'); // Wait for the page to load completely
        await this.userProfileLink_LOC.click();
        await this.logoutButton_LOC.click();
        await this.page.waitForLoadState('networkidle'); // Wait for the page to load completely
    }

    /**
     * @author Rohit Singh
     * @created 09-Jan-2026
     * @description Clicks on the User Profile icon in the home page and click Switch Account.
     */
    async clickSwitchAccountButton() {
        await this.page.waitForLoadState('networkidle');
        await this.userProfileLink_LOC.click();
        await this.switchAccountButton_LOC.click();
        console.log("Clicked on Switch Account button");
        await this.page.waitForLoadState('networkidle');
    }

}