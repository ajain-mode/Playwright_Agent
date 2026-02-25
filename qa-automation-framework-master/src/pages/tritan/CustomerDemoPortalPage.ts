import { FrameLocator, Locator, Page } from "@playwright/test";

class CustomerDemoPortalPage {
    private readonly addquickQuoteButton_LOC: Locator;
    private readonly frame: FrameLocator;

    constructor(private page: Page) {
        this.page = page;
        this.frame = page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame();
        this.addquickQuoteButton_LOC = this.frame.getByRole('button', { name: 'Add Quick Quote' });
    }
    /**
     * Validates that the Customer Demo Portal page has loaded successfully.
     * @author Rohit Singh
     * @created 2025-Oct-27
     */
    async validateCustomerDemoPortalPageLoaded(): Promise<boolean> {
        await this.page.waitForLoadState('networkidle');
        return await this.addquickQuoteButton_LOC.isVisible();
    }
    /**
     * Clicks the "Add Quick Quote" button on the Customer Demo Portal page.
     * @author Rohit Singh
     * @created 2025-Oct-27
     */
    async clickAddQuickQuote() {
        await this.addquickQuoteButton_LOC.waitFor({ state: 'visible', timeout: WAIT.XLARGE*3 });
        await this.addquickQuoteButton_LOC.click();
    }

}
export default CustomerDemoPortalPage;