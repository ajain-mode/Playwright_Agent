import { Locator, Page } from "@playwright/test";

export default class AccountsPayablePage {
    private readonly officeCommissionDetailLink_LOC: Locator;
    private readonly officeCommissionSummaryLink_LOC: Locator;
    constructor(private page: Page) {
        this.officeCommissionDetailLink_LOC = this.page.locator("//a[normalize-space(text())='Office Commissions Detail']");
        this.officeCommissionSummaryLink_LOC = this.page.locator("//a[text()='Office Commissions Summary']");

    }

    /**
     * Clicks on the Office Commission Detail link in the Accounts Payable page.
     * @author Rohit Singh
     * @created 2025-11-28
     */
    async clickOfficeCommsionDetail() {
        await this.officeCommissionDetailLink_LOC.waitFor({ state: 'visible' });
        await this.officeCommissionDetailLink_LOC.click();
        await this.page.waitForLoadState('networkidle');
    }
    /**
     * Clicks on the Office Commission Summary link in the Accounts Payable page.
     * @author Rohit Singh
     * @created 2025-11-28
     **/
    async clickOfficeCommsionSummary() {
        await this.officeCommissionSummaryLink_LOC.waitFor({ state: 'visible' });
        await this.officeCommissionSummaryLink_LOC.click();
        await this.page.waitForLoadState('networkidle');
    }
}