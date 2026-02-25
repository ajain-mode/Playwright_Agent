import { expect, FrameLocator, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

class TritanDashboardPage {
    private readonly companyButton_LOC: Locator;
    private readonly headerFrame: FrameLocator;
    private readonly dashboardValue_LOC: Locator;
    private readonly logoutButton_LOC: Locator;
    private readonly viewCells_LOC: Locator;
    private readonly shipmentTemplate_LOC: Locator;
    // private readonly headerFrame_LOC: FrameLocator;
    // private readonly shipmentIDCell_LOC: Locator;
    private readonly activitiesTab_LOC: Locator;
    private readonly listActivitiesTab_LOC: Locator;
    private readonly shipmentTabHeader_LOC: Locator;
    private readonly detailsTab_LOC: Locator;
    // private readonly loadNumberCell_LOC: (loadNumber: string) => Locator;
    private readonly selectLoadActionDropdown_LOC: Locator;
    private readonly loadStatusValue_LOC: Locator;

    constructor(private page: Page) {
        this.companyButton_LOC = this.page.locator("//span[text()='Company']");
        this.headerFrame = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Header').contentFrame();
        this.dashboardValue_LOC = this.headerFrame.locator("//td[text()='Dashboard']");
        this.logoutButton_LOC = page.locator('iframe[name="AppBody"]').contentFrame().locator('#TopModule').contentFrame().getByRole('cell', { name: 'Logout' });
        this.viewCells_LOC = this.page.getByRole('row', { name: 'View', exact: true }).getByRole('cell');
        this.shipmentTemplate_LOC = this.page.getByText('Shipment Templates', { exact: true })
        // this.headerFrame_LOC = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Header').contentFrame();
        // this.shipmentIDCell_LOC = this.headerFrame_LOC.locator("//td[contains(normalize-space(.), 'Shipment') and contains(normalize-space(.), ': Details')]");
        this.activitiesTab_LOC = this.page.getByRole('cell', { name: 'Activities' }).nth(2);
        this.listActivitiesTab_LOC = this.page.getByRole('cell', { name: 'List Activities' }).nth(2);
        this.shipmentTabHeader_LOC = this.page.getByRole('row', { name: 'Shipment', exact: true }).getByRole('cell');
        this.detailsTab_LOC = this.page.getByRole('cell', { name: 'Detail' }).nth(2);
        // this.loadNumberCell_LOC = (loadNumber: string) => this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('#transportsWin').contentFrame().
        //     locator(`//td[@class='priref']/a[normalize-space()='${loadNumber}']`);
        this.selectLoadActionDropdown_LOC = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('iframe').contentFrame().getByRole('combobox');
        this.loadStatusValue_LOC = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('iframe').contentFrame().locator("//b[text()='Status:']/parent::td");
    }

    /**
     * Click on Company button
     * @author Rohit Singh
     * @created 24-Nov-2025
     */
    async clickOnCompanyButton() {
        await this.companyButton_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.companyButton_LOC.click();
        console.log("Clicked on Company button on Tritan Dashboard page");
    }
    /**
     * Verify that Tritan Dashboard page is loaded
     * @author Rohit Singh
     * @created 24-Nov-2025
     */
    async verifyDashboardPageLoaded() {
        await this.dashboardValue_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        console.log("Tritan Dashboard page loaded successfully");
    }

    /**
* Logs out from the TRITAN application.
* @author Aniket Nale
* @created 17-11-2025
*/
    async logoutTritan() {
        await this.logoutButton_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await this.logoutButton_LOC.click();
        console.log("Logged out from TRITAN successfully");
    }

    /**
* CLick on View cell in the dashboard page
* @author Aniket Nale
* @created 07-01-2026
*/
    async clickOnViewCell() {
        await this.viewCells_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.viewCells_LOC.click();
    }
    /**
* Click on Shipment Template link in the dashboard page
* @author Aniket Nale
* @created 07-01-2026
*/
    async clickOnShipmentTemplate() {
        await commonReusables.waitForPageStable(this.page);
        await this.shipmentTemplate_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.shipmentTemplate_LOC.click();
    }

    //     /**
    // * Get Shipment ID from the header section
    // * @returns {Promise<string>} Shipment ID as a string
    // * @author Aniket Nale
    // * @created 07-01-2026
    // */
    //     async getShipmentIdFromHeader(): Promise<string> {
    //         const shipmentCell = this.shipmentIDCell_LOC;
    //         await shipmentCell.waitFor({ state: 'visible' });
    //         const text = ((await shipmentCell.textContent()) ?? '').replace(/\u00a0/g, ' ').trim();
    //         const shipmentId = text.match(/Shipment\s+(\d+)\s*:/)?.[1];
    //         if (!shipmentId) throw new Error(`Unable to extract Shipment ID from header text: "${text}"`);
    //         return shipmentId;
    //     }
    /**
* Hover on Activities tab
* @author Aniket Nale
* @created 07-01-2026
*/
    async hoverOnActivitiesTab() {
        await this.activitiesTab_LOC.first().waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.activitiesTab_LOC.first().hover();
    }
    /**
* Click on List Activities tab
* @author Aniket Nale
* @created 07-01-2026
*/
    async clickOnListActivitiesTab() {
        await this.listActivitiesTab_LOC.first().waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.listActivitiesTab_LOC.first().click();
    }
    /**
* Hover on Shipment tab from header
* @author Aniket Nale
* @created 07-01-2026
*/
    async hoverOnShipmentTemplateFromHeader() {
        await this.shipmentTabHeader_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.shipmentTabHeader_LOC.hover();
    }
    /**
* Click on Details tab
* @author Aniket Nale
* @created 07-01-2026
*/
    async clickOnDetailsTab() {
        await this.detailsTab_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.detailsTab_LOC.click();
    }
    //     /**
    // * Click on Load Number link
    // * @param {string} loadNumber - The load number to click
    // * @author Aniket Nale
    // * @created 07-01-2026
    // */
    //     async clickOnLoadNumber(loadNumber: string) {
    //         const loadNumberCell = this.loadNumberCell_LOC(loadNumber);
    //         await loadNumberCell.waitFor({ state: 'visible', timeout: WAIT.SMALL });
    //         await loadNumberCell.click();
    //         console.log(`Clicked on Load Number: ${loadNumber}`);
    //     }
    /**
* Select action from Load Action dropdown
* @param {string} action - The action to select
* @author Aniket Nale
* @created 07-01-2026
*/
    async selectActionFromLoadDropdown(action: string) {
        await commonReusables.waitForPageStable(this.page);
        await this.selectLoadActionDropdown_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await expect.soft(this.selectLoadActionDropdown_LOC).toBeVisible({ timeout: WAIT.SMALL });
        await this.selectLoadActionDropdown_LOC.selectOption({ label: action });
        console.log(`Selected action "${action}" from Load Action dropdown`);
    }
    /**
* Verify Load Status
* @param {string} expectedStatus - The expected status to verify
* @author Aniket Nale
* @created 07-01-2026
*/
    async verifyStatus(expectedStatus: string) {
        const statusLocator = this.loadStatusValue_LOC;
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await statusLocator.first().waitFor({ state: 'visible', timeout: WAIT.LARGE });
        const actualStatus = (await statusLocator.first().innerText())
            .replace("Status:", "")
            .trim();
        expect(actualStatus.toUpperCase()).toBe(expectedStatus);
    }
}
export default TritanDashboardPage;