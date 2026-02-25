import { expect, FrameLocator, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class TritanLoadDetailsPage {
    private detailsFrame: FrameLocator;
    private linksTab_LOC: Locator;
    private planTab_LOC: Locator;
    private readonly detailsTab_LOC: Locator;
    private readonly loadStatusValue_LOC: Locator;
    private readonly loadNumberCell_LOC: (loadNumber: string) => Locator;
    private readonly carrierTotalAmount_LOC: Locator;
    private readonly customerTotalAmount_LOC: Locator;

    constructor(private page: Page) {
        this.detailsFrame = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame();
        this.loadStatusValue_LOC = this.detailsFrame.locator('#Detail-innerCt iframe').contentFrame().locator("//b[text()='Status:']/parent::td");
        this.linksTab_LOC = this.detailsFrame.getByRole('button', { name: 'Links' });
        this.planTab_LOC = this.detailsFrame.getByRole('button', { name: 'Plan' });
        this.detailsTab_LOC = this.detailsFrame.getByRole('button', { name: 'Detail' });
        this.loadNumberCell_LOC = (loadNumber: string) => this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('#Plan-innerCt iframe').contentFrame()
            .getByRole('link', { name: loadNumber }).first();

        this.carrierTotalAmount_LOC = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('iframe').contentFrame().locator('#carrRatesWin').contentFrame()
            .locator("//td[@class='total']/a");
        this.customerTotalAmount_LOC = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('iframe').contentFrame().locator('#custRatesWin').contentFrame()
            .locator("//table//tr[td[normalize-space()='Mode Transportation - TL']]//td[5]/a");

    }

    /**
     * Click on Links tab in Load Details
     * @author Rohit Singh
     * @created 17-Dec-2025
     */
    async clickOnLinksTab() {
        await this.linksTab_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.linksTab_LOC.click();
        console.log("Clicked on Links tab in Load Details");
    }
    /**
     * Click on Links tab in Load Details
     * @author Rohit Singh
     * @created 17-Dec-2025
     */
    async clickOnPlanTab() {
        await commonReusables.waitForPageStable(this.page);
        await this.planTab_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.planTab_LOC.click();
        console.log("Clicked on Plan tab in Load Details");
    }
    /**
     * Click on Details tab in Load Details
     * @author Rohit Singh
     * @created 17-Dec-2025
     */
    async clickOnDetailsTab() {
        await commonReusables.waitForPageStable(this.page);
        await this.detailsTab_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.detailsTab_LOC.click();
        console.log("Clicked on Details tab in Load Details");
    }
    /**
    * Verify load status
    * @param expectedStatus - Expected status to verify
    * @author Aniket Nale
    * @created 17-Dec-2025
    */
    async verifyStatus(expectedStatus: string) {
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await this.loadStatusValue_LOC.first().waitFor({ state: 'visible', timeout: WAIT.LARGE });
        const actualStatus = (await this.loadStatusValue_LOC.first().innerText())
            .replace("Status:", "")
            .trim();
        expect(actualStatus.toUpperCase()).toBe(expectedStatus);
    }

    /**
* Click on Load Number under Item Details in Load Details Page
* @param loadNumber - Load Number to click
* @author Aniket Nale
* @created 12-Jan-2026
*/
    async clickOnLoadNumber(loadNumber: string) {
        await commonReusables.waitForPageStable(this.page);
        const loadNumberCell = this.loadNumberCell_LOC(loadNumber);
        await loadNumberCell.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await loadNumberCell.click();
        console.log(`Clicked on Load Number: ${loadNumber}`);
    }
    /**
  * Click on Edit button on Carrier Rate Details Page
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async clickOnEditOnCarrierRateDetailsPage(carrierRateDetailsPage: Page) {
        //Cannot use locator from constructor as it is for popup page
        const editButton = carrierRateDetailsPage.locator("//a[normalize-space()='[edit]']");
        await editButton.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await editButton.click();
        console.log("Clicked on Edit button on Carrier Rate Details Page");
    }
    /**
  * Select Carrier Charges from dropdown on Carrier Rate Details Page
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async selectCarrierChargesFromDropdownOnCarrierRateDetailsPage(carrierRateDetailsPage: Page, chargeType: string) {
        const carrierChargesDropdown = carrierRateDetailsPage.locator('#ChargeCharge5EDICode');
        await carrierChargesDropdown.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await carrierChargesDropdown.selectOption({ label: chargeType });
        console.log(`Selected Carrier Charge Type: ${chargeType} from dropdown on Carrier Rate Details Page`);
    }
    /**
  * Fill Carrier Charges Amount on Carrier Rate Details Page
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async fillCarrierChargesAmountOnCarrierRateDetailsPage(carrierRateDetailsPage: Page, amount: string) {
        const amountInput = carrierRateDetailsPage.locator('//input[@id=\'ChargeCharge5Rate\']');
        await amountInput.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await amountInput.fill(amount);
        console.log(`Filled Carrier Charge Amount: ${amount} on Carrier Rate Details Page`);
    }
    /**
  * Click on Save button on Carrier Rate Details Page
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async clickOnSaveButtonOnCarrierRateDetailsPage(carrierRateDetailsPage: Page) {
        const saveButton = carrierRateDetailsPage.locator("//input[@value=' Save ']");
        await saveButton.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await Promise.all([
            carrierRateDetailsPage.waitForEvent('close'),
            saveButton.click()
        ]);
        console.log("Clicked on Save button and waited for Carrier Rate Details Page to close");
    }
    /**
  * Click on Edit button on Customer Rate Details Page
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async clickOnEditOnCustomerRateDetailsPage(customerRateDetailsPage: Page) {
        //Cannot use locator from constructor as it is for popup page
        const editButton = customerRateDetailsPage.locator("//a[normalize-space()='[edit]']");
        await editButton.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await editButton.click();
        console.log("Clicked on Edit button on Customer Rate Details Page");
    }
    /**
  * Select Customer Charges from dropdown on Customer Rate Details Page
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async selectCustomerChargesFromDropdownOnCustomerRateDetailsPage(customerRateDetailsPage: Page, chargeType: string) {
        const customerChargesDropdown = customerRateDetailsPage.locator('#CostCharge6EDICode');
        await customerChargesDropdown.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await customerChargesDropdown.selectOption({ label: chargeType });
        console.log(`Selected Customer Charge Type: ${chargeType} from dropdown on Customer Rate Details Page`);
    }

    /**
* Fill Customer Charges Amount on Customer Rate Details Page
* @author Aniket Nale
* @created 19-01-2026
*/

    async fillCustomerChargesAmountOnCustomerRateDetailsPage(customerRateDetailsPage: Page, amount: string) {
        const amountInput = customerRateDetailsPage.locator('//input[@id=\'CostCharge6Rate\']');
        await amountInput.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await amountInput.fill(amount);
        console.log(`Filled Customer Charge Amount: ${amount} on Customer Rate Details Page`);
    }

    /**
* Click on Save button on Customer Rate Details Page
* @author Aniket Nale
* @created 19-01-2026
*/

    async clickOnSaveButtonOnCustomerRateDetailsPage(customerRateDetailsPage: Page) {
        const saveButton = customerRateDetailsPage.locator("//input[@value=' Save ']");
        await saveButton.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await Promise.all([
            customerRateDetailsPage.waitForEvent('close'),
            saveButton.click()
        ]);
        console.log("Clicked on Save button and waited for Customer Rate Details Page to close");
    }

    /**
* Click on Carrier Total Amount from the Load page
* @author Aniket Nale
* @created 19-01-2026
*/

    async clickOnCarrierTotalAmount(): Promise<Page> {
        await commonReusables.waitForPageStable(this.page);

        const amount = this.carrierTotalAmount_LOC.first();
        await amount.waitFor({ state: 'visible', timeout: WAIT.SMALL });

        const [carrierRateDetailsPage] = await Promise.all([
            this.page.waitForEvent('popup'),
            amount.click()
        ]);

        await carrierRateDetailsPage.waitForLoadState('domcontentloaded');
        return carrierRateDetailsPage;
    }

    /**
* Get carrier total amount from the Load page
* @author Aniket Nale
* @created 19-01-2026
*/

    async getCarrierTotalAmount(): Promise<string> {
        await commonReusables.waitForPageStable(this.page);

        const amount = this.carrierTotalAmount_LOC.first();
        await amount.waitFor({ state: 'visible', timeout: WAIT.SMALL });

        const text = (await amount.innerText()).replace(/,/g, '');
        console.log(`Carrier Total Amount text: ${text}`);
        return text.match(/\d+\.\d{2}/)?.[0] ?? '';
    }

    /**
* Click on Customer Total Amount from the Load page
* @author Aniket Nale
* @created 19-01-2026
*/

    async clickOnCustomerTotalAmount(): Promise<Page> {

        await commonReusables.waitForPageStable(this.page);

        const amount = this.customerTotalAmount_LOC;
        await amount.waitFor({ state: 'visible', timeout: WAIT.MID });

        const [customerRateDetailsPage] = await Promise.all([
            this.page.waitForEvent('popup'),
            amount.click()
        ]);

        await customerRateDetailsPage.waitForLoadState('domcontentloaded');
        return customerRateDetailsPage;
    }
    /**
  * Get Customer Total Amount from the Load page
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async getCustomerTotalAmount(): Promise<string> {

        await commonReusables.waitForPageStable(this.page);

        // const count = await this.totalAmountRates_LOC.count();
        // expect(count).toBeGreaterThanOrEqual(1);

        const amount = this.customerTotalAmount_LOC;
        await amount.waitFor({ state: 'visible', timeout: WAIT.MID });
        const text = (await amount.innerText()).replace(/,/g, '');
        console.log(`Customer Total Amount text: ${text}`);
        return text.match(/\d+\.\d{2}/)?.[0] ?? '';
    }
}