import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

/** 
 * Billing Adjustments Queue Page Object Model
 * Handles all operations related to the billing adjustments queue page.
 * @author Aniket Nale
 * @created 20-Jan-2026
 */

export default class BillingAdjustmentsQueuePage {

    private readonly clearFiltersButton_LOC: Locator;
    private readonly sourceIDInput_LOC: Locator;
    private readonly searchButton_LOC: Locator;
    private readonly approvedStatusCell_LOC: (index: number) => Locator;
    private readonly reviewedByIntelys_LOC: (index: number) => Locator;

    constructor(private page: Page) {

        this.clearFiltersButton_LOC = this.page.locator("//div[@class='col-md-12 col-sm-12 radio-flex col-md-offset-0 col-ms-offset-0']//input[@value='Clear']");
        this.sourceIDInput_LOC = this.page.locator("#search_loadsh_import_source_id");
        this.searchButton_LOC = this.page.locator("//input[@class='submit-report-search']");
        this.approvedStatusCell_LOC = (index: number) => this.page.locator(`(//tbody/tr[td[normalize-space()='APPROVED']])[${index}]/td[3]`);
        this.reviewedByIntelys_LOC = (index: number) => this.page.locator(`(//tbody/tr)[${index}]/td[20][normalize-space()='Intelys API Portal']`);
    }

    /**
* Click on Clear Filters button in Billing Adjustments Queue page
* @author Aniket Nale
* @created 20-Jan-2026
*/

    async clickClearFiltersButton() {
        await commonReusables.waitForPageStable(this.page);
        await this.clearFiltersButton_LOC.waitFor({ state: 'visible', timeout: WAIT.MID });
        await this.clearFiltersButton_LOC.click();
        await this.page.waitForLoadState('networkidle');
    }
    /**
* Enter Source ID in Search input box in Billing Adjustments Queue page
* @author Aniket Nale
* @created 20-Jan-2026
*/
    async enterSourceIDInSearch(sourceID: string) {
        await commonReusables.waitForPageStable(this.page);
        await this.sourceIDInput_LOC.waitFor({ state: 'visible', timeout: WAIT.MID });
        await this.sourceIDInput_LOC.fill(sourceID);
        await commonReusables.waitForPageStable(this.page);
    }
    /**
* Click on Search button in Billing Adjustments Queue page
* @author Aniket Nale
* @created 20-Jan-2026
*/
    async clickSearchButton() {
        await commonReusables.waitForPageStable(this.page);
        await this.searchButton_LOC.waitFor({ state: 'visible', timeout: WAIT.MID });
        await this.searchButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
    }
    /**
* Get Approved status from specific row in Billing Adjustments Queue page
* @author Aniket Nale
* @created 20-Jan-2026
*/
    async getApprovedStatusFromRow(index: number): Promise<void> {
        await commonReusables.waitForPageStable(this.page);
        const status = this.approvedStatusCell_LOC(index);
        await expect(status).toBeVisible({ timeout: WAIT.MID });
        const statusText = await status.innerText();
        expect(statusText).toBeTruthy();
    }
    /**
* Verify Reviewed By as 'Intelys API Portal' from specific row in Billing Adjustments Queue page
* @author Aniket Nale
* @created 20-Jan-2026
*/
    async expectReviewedByIntelysAtRow(index: number): Promise<void> {
        await commonReusables.waitForPageStable(this.page);
        const reviewedBy = this.reviewedByIntelys_LOC(index);
        await expect(reviewedBy).toBeVisible({ timeout: WAIT.MID });
        await expect(reviewedBy).toHaveText(REVIEWED_BY.INTELYS_API_PORTAL);
    }
}