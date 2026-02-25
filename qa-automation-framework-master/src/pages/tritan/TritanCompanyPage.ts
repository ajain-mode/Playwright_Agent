import { expect, FrameLocator, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

class TritanCompanyPage {
    private readonly detailFrame: FrameLocator;
    private readonly expandAllButton_LOC: Locator;
    private readonly customerName_LOC: (customerName: string) => Locator;
    private readonly salesLeadLink_LOC: (salesName: string) => Locator;
    private readonly salesLeadEnterprise_LOC: (salesName: string) => Locator;

    constructor(private page: Page) {
        this.detailFrame = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame();
        this.expandAllButton_LOC = this.detailFrame.locator("//a[text()='Expand']");
        this.customerName_LOC = (customerName: string) => this.detailFrame.locator(`//a[text()='${customerName}']`);
        this.salesLeadLink_LOC = (salesLeadName: string) => this.detailFrame.getByRole('link', { name: new RegExp(salesLeadName) });
        this.salesLeadEnterprise_LOC = (salesLeadName: string) => this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#TopModule').contentFrame().getByRole('cell', { name: new RegExp(salesLeadName) });
    }
    /**
     * Click on Expand All button
     * @author Rohit Singh
     * @created 24-Nov-2025
     */
    async clickOnExpandAllButton() {
        await this.expandAllButton_LOC.waitFor({ state: 'visible', timeout: WAIT.XLARGE });
        await this.expandAllButton_LOC.click();
        console.log("Clicked on Expand All button on Tritan Company page");
    }
    /**
     * Select customer by name
     * @author Rohit Singh
     * @created 24-Nov-2025
     * @param customerName - Name of the customer to select
     */
    async selectCustomerByName(customerName: string) {
        console.log(`Selecting customer: ${customerName} on Tritan Company page`);
        await this.customerName_LOC(customerName).waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.customerName_LOC(customerName).click();
        console.log(`Selected customer: ${customerName} on Tritan Company page`);
    }

    /**
 * Select sales link by name
 * @author Aniket Nale
 * @created 30-Dec-25
 */

    async selectSalesLinkByName(salesName: string): Promise<void> {
        const salesLeadLink = this.salesLeadLink_LOC(salesName);
        await salesLeadLink.waitFor({ state: 'visible', timeout: WAIT.MID });
        await expect.soft(salesLeadLink).toBeVisible();
        console.log(`Selecting sales link: ${salesName}`);
        await salesLeadLink.click();
    }

    /**
* Verify sales lead enterprise created
* @author Aniket Nale
* @created 30-Dec-25
*/
    async verifySalesLeadEnterpriseCreated(salesName: string): Promise<void> {
        console.log(`Verifying sales lead enterprise created: ${salesName}`);
        const salesLeadEnterprise = this.salesLeadEnterprise_LOC(salesName);
        await commonReusables.waitForPageStable(this.page);
        await salesLeadEnterprise.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await expect.soft(salesLeadEnterprise).toBeVisible();
        console.log(`Verified sales lead enterprise created: ${salesName}`);
    }
}
export default TritanCompanyPage;