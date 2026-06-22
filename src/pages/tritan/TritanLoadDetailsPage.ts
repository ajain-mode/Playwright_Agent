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
    private readonly carrierInvoicesFrame_LOC: FrameLocator;

    // Carrier invoice popup selectors (used via `carrierPopup.locator(...)` — popup Page is not bound at construction).
    private readonly EDIT_CHARGES_LINK_SELECTOR = "//a[normalize-space()='[edit charges]']";
    private readonly QUEUE_DROPDOWN_SELECTOR = "#sQueue";
    private readonly SETTLE_REASON_DROPDOWN_SELECTOR = "#sSettleReason";
    private readonly COMMENTS_INPUT_SELECTOR = "#sComments";
    private readonly FUEL_SURCHARGE_RATE_INPUT_SELECTOR = "#BilledCharge3Rate";
    private readonly SAVE_BUTTON_SELECTOR = "//input[@value=' Save ']";

    constructor(private page: Page) {
        this.detailsFrame = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame();
        this.loadStatusValue_LOC = this.detailsFrame.locator('#Detail-innerCt iframe').contentFrame().locator("//b[text()='Status:']/parent::td");
        this.linksTab_LOC = this.detailsFrame.getByRole('button', { name: 'Links' });
        this.planTab_LOC = this.detailsFrame.getByRole('button', { name: 'Plan' });
        this.detailsTab_LOC = this.detailsFrame.getByRole('button', { name: 'Detail' });
        this.loadNumberCell_LOC = (loadNumber: string) => this.detailsFrame.locator('#Plan-innerCt iframe').contentFrame()
            .getByRole('link', { name: loadNumber }).first();
        this.carrierInvoicesFrame_LOC = this.detailsFrame.locator('iframe').contentFrame()
        this.carrierTotalAmount_LOC = this.carrierInvoicesFrame_LOC.locator('#carrRatesWin').contentFrame().locator("//td[@class='total']/a");
        this.customerTotalAmount_LOC = this.carrierInvoicesFrame_LOC.locator('#custRatesWin').contentFrame().locator("//table//tr[td[normalize-space()='Mode Transportation - TL']]//td[5]/a");
        
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

    /**
     * Carrier Invoices sub-window inside shipment/load Detail frame.
     * @author AI Agent
     * @created 2026-06-10
     * @returns FrameLocator scoped to #carrInvoicesWin
     */
    private carrierInvoicesFrame(): FrameLocator {
        return this.detailsFrame
            .locator('iframe[src*="editTransport"]')
            .contentFrame()
            .locator("#carrInvoicesWin")
            .contentFrame();
    }

    /**
     * Clicks the green "+" under Carrier Invoices on the Tritan load page.
     * @author AI Agent
     * @created 2026-06-01
     */
    async clickAddCarrierInvoicePlusIcon(): Promise<void> {
        await commonReusables.waitForPageStable(this.page);
        // const transportFrame = this.detailsFrame.locator('iframe[src*="editTransport"]').contentFrame();
        // await transportFrame.locator("body").waitFor({ state: "attached", timeout: WAIT.XXLARGE });
        const invoiceWindowIds = ['#carrInvoicesWin', '#vendInvoicesWin', '#invoicesWin'];
        for (const winId of invoiceWindowIds) {
            const addIcon =this.detailsFrame.locator('iframe').contentFrame().locator('#invoicesWin').contentFrame().getByRole('link', { name: 'Add Invoice' });
            try {
                await addIcon.waitFor({ state: 'visible', timeout: WAIT.LARGE }); 
                await addIcon.click();
                await commonReusables.waitForPageStable(this.page);
                console.log(`Clicked Carrier Invoices add (+) icon via ${winId}`);
                return;
            } catch {
                // try next known invoice sub-window
            }
        }
        throw new Error('Carrier Invoices add (+) icon not found in any known invoice window');
    }

    /**
     * Returns the latest carrier invoice number and bill total from the load page table.
     * @author AI Agent
     * @created 2026-06-01
     */
   async getLatestCarrierInvoiceDetails(): Promise<{ invoiceNumber: string; billTotal: string }> {
        const invoicesFrame = this.detailsFrame.locator('iframe').contentFrame().locator('#invoicesWin').contentFrame();
        const dataRows = invoicesFrame.locator('tr:has(td.number)');

        await dataRows.first().waitFor({ state: 'visible', timeout: WAIT.LARGE });
        const latestRow = dataRows.last();

        const invoiceNumber = ((await latestRow.locator('td.number').textContent()) ?? '').trim();
        const billTotalText = ((await latestRow.locator('td.total a').textContent()) ?? '').trim();
        const billTotal = billTotalText.match(/\d+(?:\.\d+)?/)?.[0] ?? billTotalText;

        console.log(`Latest carrier invoice: ${invoiceNumber}, bill total: ${billTotal}`);
        return { invoiceNumber, billTotal };
    }

    /**
     * Selects an `<option>` in a native `<select>` using a whitespace-tolerant match.
     * Resolves the live option list, normalizes inner whitespace, and selects by the
     * exact `value` attribute. This avoids the silent `did not find some options`
     * failure when a label has different spacing than the constant.
     * @author AI Agent
     * @created 2026-06-20
     */
    private async selectOptionByLabelLoose(
        select: Locator,
        wantedLabel: string,
    ): Promise<void> {
        await select.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
        const target = norm(wantedLabel);
        const options = await select.locator('option').evaluateAll((els) =>
            (els as HTMLOptionElement[]).map((o) => ({ value: o.value, text: o.textContent ?? '' })),
        );
        const match = options.find((o) => norm(o.text) === target || norm(o.value) === target);
        if (!match) {
            const available = options.map((o) => `'${o.text.trim()}'`).join(', ');
            throw new Error(
                `selectOptionByLabelLoose: no option matching '${wantedLabel}' in select. Available: [${available}]`,
            );
        }
        await select.selectOption({ value: match.value });
    }

    /**
     * Opens carrier rate popup Edit Charges and applies short-pay settlement fields:
     * Settlement Total (`#sSettleTotal`), Queue (`#sQueue`), Settlement Reason (`#sSettleReason`),
     * Comments (`#sComments`), then clicks Save and waits for the popup to close.
     * @param carrierPopup carrier invoice popup Page returned by clickOnCarrierInvoiceBillTotalAmount
     * @param queueLabel Queue dropdown label (e.g., '40 Valid / Approved')
     * @param settlementReason Settlement Reason dropdown label (e.g., 'Short Pay - Accessorial')
     * @param comment value for the Comments input
     * @param settlementTotal amount to enter in the Settlement Total input (e.g., '125.00')
     * @author AI Agent
     * @created 2026-06-01
     */
    async applyCarrierShortPaySettlement(
        carrierPopup: Page,
        queueLabel: string,
        settlementReason: string,
        comment: string,
        fuelSurchargeAmount: string,
    ): Promise<void> {
        const editCharges = carrierPopup.locator(this.EDIT_CHARGES_LINK_SELECTOR);
        await editCharges.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await editCharges.click();

        await this.selectOptionByLabelLoose(carrierPopup.locator(this.QUEUE_DROPDOWN_SELECTOR), queueLabel);
        await this.selectOptionByLabelLoose(carrierPopup.locator(this.SETTLE_REASON_DROPDOWN_SELECTOR), settlementReason);
        await carrierPopup.locator(this.COMMENTS_INPUT_SELECTOR).fill(comment);

        const fuelSurcharge = carrierPopup.locator(this.FUEL_SURCHARGE_RATE_INPUT_SELECTOR);
        await fuelSurcharge.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await fuelSurcharge.fill(fuelSurchargeAmount);

        await Promise.all([
            carrierPopup.waitForEvent('close'),
            carrierPopup.locator(this.SAVE_BUTTON_SELECTOR).click(),
        ]);
        console.log(
            `Applied carrier short-pay settlement: queue='${queueLabel}', reason='${settlementReason}', fuelSurchargeAmount='${fuelSurchargeAmount}'`,
        );
    }

/**
 * Click the Bill Total link on the latest Carrier Invoice row and return the opened popup.
 * @author AI Agent
 * @created 2026-06-20
 */
async clickOnCarrierInvoiceBillTotalAmount(): Promise<Page> {
    await commonReusables.waitForPageStable(this.page);

    const billTotalLink = this.detailsFrame.locator('iframe').contentFrame().locator('#invoicesWin').contentFrame().locator('tr:has(td.number)').last().locator('td.total a');
    await billTotalLink.waitFor({ state: 'visible', timeout: WAIT.SMALL });

    const [carrierInvoicePage] = await Promise.all([
        this.page.waitForEvent('popup'),
        billTotalLink.click(),
    ]);

    await carrierInvoicePage.waitForLoadState('domcontentloaded');
    return carrierInvoicePage;
}
}