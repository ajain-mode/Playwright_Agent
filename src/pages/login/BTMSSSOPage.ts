import { Page, Locator } from "@playwright/test";


class BTMSSSOPage {
    private readonly skipForNowLink_LOC: Locator;
    constructor(private page: Page) {
        this.skipForNowLink_LOC = this.page.locator("//a[contains(text(),'Skip for now and continue')]");
    }

    /**
     * Clicks on the "Skip for now" link
     * @author Rohit Singh
     * @modified 2025-07-18
     */
    async clickSkipForNow(){
        await this.skipForNowLink_LOC.click();
    }
    /**
     * Checks if the "Skip for now" link is visible
     * @author Rohit Singh
     * @modified 2025-07-18
     * @returns {Promise<boolean>} True if the link is visible, false otherwise
     */
    async isVisibleSkipForNow(): Promise<boolean> {
        const visible = await this.skipForNowLink_LOC.isVisible();
        return visible;
    }
}
export default BTMSSSOPage;