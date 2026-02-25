import { Locator, Page } from "@playwright/test";

export default class ViewOfficeInfoPage {
    private readonly editButton_LOC: Locator;
    constructor(private page: Page) {
        this.editButton_LOC = page.locator("//td[contains(text(),'View Office Info')]/following-sibling::td/div/input[contains(@value,'Edit')]");
    }
    /**
     * @author Rohit Singh
     * @description This method handles clicking the Edit button on View Office Info page
     * @created 2025-11-12
     */
    async clickEditButton() {
        await this.page.waitForLoadState('networkidle', { timeout: WAIT.LARGE });
        await this.editButton_LOC.click();
        await this.page.waitForLoadState('networkidle', { timeout: WAIT.LARGE });
    }
}