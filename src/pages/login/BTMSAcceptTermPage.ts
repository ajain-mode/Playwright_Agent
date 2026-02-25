import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class BTMSAcceptTermPage {
    private readonly acceptTermsCheckbox: Locator;
    private readonly acceptButton: Locator;

    constructor(private page: Page) {
        this.acceptTermsCheckbox = this.page.locator('#usage_acceptance_terms_of_service');
        this.acceptButton = this.page.locator("//input[@value='Accept']");
    }
    /**
     * Validate on BTMS Accept Terms Page
     * @author Rohit Singh
     * @created 19-Jan-2026
     * @returns 
     */
    async validateOnBTMSAcceptTermPage(): Promise<boolean> {
        console.log("Validating on BTMS Accept Terms Page");
        await commonReusables.waitForPageStable(this.page);
        return await this.acceptTermsCheckbox.isVisible();
    }
    /**
     * Accept Terms and Conditions
     * @author Rohit Singh
     * @created 19-Jan-2026
     */
    async acceptTermsAndConditions(): Promise<void> {
        console.log("Accepting Terms and Conditions on BTMS Accept Terms Page");
        await this.acceptTermsCheckbox.check();
        await this.acceptButton.click();
        console.log("Clicked on Accept button");
        await commonReusables.waitForPageStable(this.page);
    }
}