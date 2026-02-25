import { Locator, Page } from '@playwright/test';

class LoadsPage {

    private readonly edi204LoadTenderLink_LOC: Locator;
    /**
     * Constructor to initialize page locators for Loads page
     * @author Rohit Singh
     * @created 2025-07-18
     */
    constructor(private page: Page) {
        this.edi204LoadTenderLink_LOC = page.locator("//a[text()='EDI 204 Load Tenders']");
    }
    /**
     * Clicks on the EDI 204 Load Tender link
     * @author Rohit Singh
     * @created 2025-07-18
     */
    async clickOnEDI204LoadTender() {
        await this.edi204LoadTenderLink_LOC.click();
        await this.page.waitForLoadState('networkidle'); // Wait for the page to load
    }
}
export default LoadsPage;