import { expect, FrameLocator, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import * as fs from 'fs';

export default class ShipmentDetailsPage {

    popupPage: Page | undefined;
    private readonly shipmentIDCell_LOC: Locator;
    private readonly headerFrame_LOC: FrameLocator;
    private readonly loadNumberCell_LOC: (loadNumber: string) => Locator;
    private readonly loadStatusValue_LOC: Locator;
    private readonly printInvoiceIcon_LOC: Locator;
    private readonly invoiceOptionRadio_LOC: (optionName: string) => Locator;
    private readonly cancelInvoiceBtn_LOC: () => Locator;
    private readonly invoiceBillTotalValue_LOC: Locator;
    private readonly editChargesBtn_LOC: () => Locator;
    private readonly selectQueueDropdown_LOC: () => Locator;
    private readonly saveQueueBtn_LOC: () => Locator;
    private readonly invoiceExtractDate_LOC: Locator;
    private readonly customerChargesDropdown_LOC: () => Locator;
    private readonly customerInvoiceChargesAmountInput_LOC: () => Locator;
    private readonly settlementReasonDropdown_LOC: () => Locator;
    private readonly commentInput_LOC: () => Locator;

    constructor(private page: Page) {
        this.headerFrame_LOC = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Header').contentFrame();
        this.shipmentIDCell_LOC = this.headerFrame_LOC.locator("//td[contains(normalize-space(.), 'Shipment') and contains(normalize-space(.), ': Details')]");
        this.loadNumberCell_LOC = (loadNumber: string) => this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('#transportsWin').contentFrame().
            locator(`//td[@class='priref']/a[normalize-space()='${loadNumber}']`);
        this.loadStatusValue_LOC = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator("//td[.//b[normalize-space()='Reference:']]/following-sibling::td [.//b[normalize-space()='Status:']]");
        this.printInvoiceIcon_LOC = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('#invoicesWin').contentFrame().getByRole('link', { name: 'Print Invoice' });
        this.invoiceOptionRadio_LOC = (optionName: string) => this.popupPage!.locator(`//td[normalize-space(.)='${optionName}']/preceding-sibling::td[1]//input[@type='radio']`);
        this.cancelInvoiceBtn_LOC = () => this.popupPage!.locator("//input[@value='Cancel']");
        this.invoiceBillTotalValue_LOC = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('#invoicesWin').contentFrame()
            .locator("//td[@class='type' and normalize-space()='Invoice']/parent::tr//td[@class='total']//a");
        this.editChargesBtn_LOC = () => this.popupPage!.locator("//a[normalize-space()='[edit charges]']");
        this.selectQueueDropdown_LOC = () => this.popupPage!.locator('#sQueue');
        this.saveQueueBtn_LOC = () => this.popupPage!.locator("//input[@value=' Save ']");
        this.invoiceExtractDate_LOC = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('#invoicesWin').contentFrame()
            .locator("//td[@class='type' and normalize-space()='Invoice']/parent::tr//td[@class='invoiceExtractDate']");
        this.customerChargesDropdown_LOC = () => this.popupPage!.locator('//select[@id="InvoiceCharge6EDICode"]');
        this.customerInvoiceChargesAmountInput_LOC = () => this.popupPage!.locator('//input[@id="InvoiceCharge6Rate"]');
        this.settlementReasonDropdown_LOC = () => this.popupPage!.locator('#sSettleReason');
        this.commentInput_LOC = () => this.popupPage!.locator('#sComments');
    }

    /**
* Get Shipment ID from the header section
* @returns {Promise<string>} Shipment ID as a string
* @author Aniket Nale
* @created 07-01-2026
*/
    async getShipmentIdFromHeader(): Promise<string> {
        const shipmentCell = this.shipmentIDCell_LOC;
        await shipmentCell.waitFor({ state: 'visible' });
        const text = ((await shipmentCell.textContent()) ?? '').replace(/\u00a0/g, ' ').trim();
        const shipmentId = text.match(/Shipment\s+(\d+)\s*:/)?.[1];
        if (!shipmentId) throw new Error(`Unable to extract Shipment ID from header text: "${text}"`);
        return shipmentId;
    }

    /**
* Click on Load Number link
* @param {string} loadNumber - The load number to click
* @author Aniket Nale
* @created 07-01-2026
*/
    async clickOnLoadNumber(loadNumber: string) {
        const loadNumberCell = this.loadNumberCell_LOC(loadNumber);
        await loadNumberCell.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await loadNumberCell.click();
        console.log(`Clicked on Load Number: ${loadNumber}`);
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
* Click on Print Invoice icon and handle popup
* @author Aniket Nale
* @created 19-01-2026
*/

    async clickOnPrintInvoiceIcon() {
        const [popup] = await Promise.all([
            this.page.waitForEvent('popup'),
            this.printInvoiceIcon_LOC.click(),
        ]);
        await popup.waitForLoadState('domcontentloaded');
        await popup.waitForLoadState('networkidle');
        this.popupPage = popup;
    }

    /**
* Select invoice option and validate download
* @param {string} optionName - The name of the invoice option to select
* @author Aniket Nale
* @created 19-01-2026
*/

    async selectInvoiceOptionAndValidateDownload(optionName: string) {
        if (!this.popupPage)
            throw new Error('Print Invoice popup not opened');

        const [download] = await Promise.all([
            this.popupPage.waitForEvent('download'),
            this.invoiceOptionRadio_LOC(optionName).click(),
        ]);

        const filePath = await download.path();
        expect(filePath).not.toBeNull();

        const size = fs.statSync(filePath!).size;
        expect(size).toBeGreaterThan(0);
    }

    /**
* Click on Cancel Invoice button in popup
* @author Aniket Nale
* @created 19-01-2026
*/

    async clickOnCancelInvoiceButton() {
        await Promise.all([
            this.popupPage?.waitForEvent('close'),
            this.cancelInvoiceBtn_LOC().click(),
        ]);
    }

    /**
* Click on Invoice Bill Total link and handle popup
* @author Aniket Nale
* @created 19-01-2026
*/

    async clickOnInvoiceBillTotal() {
        await this.invoiceBillTotalValue_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });

        await commonReusables.dialogHandler(this.page);
        const [popup] = await Promise.all([
            this.page.waitForEvent('popup'),
            this.invoiceBillTotalValue_LOC.click()
        ]);
        await popup.waitForLoadState('domcontentloaded');
        await popup.waitForLoadState('networkidle');
        this.popupPage = popup;
    }

    /**
* Click on Edit Charges button in popup
* @author Aniket Nale
* @created 19-01-2026
*/

    async clickOnEditChargesButton() {
        if (!this.popupPage) throw new Error('Popup page not set. Open the popup before calling this method.');
        const editChargesBtn = this.editChargesBtn_LOC();
        await editChargesBtn.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await editChargesBtn.click();
    }

    /**
  * Select Queue from dropdown in popup
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async selectQueue(queueName: string) {
        if (!this.popupPage) throw new Error('Popup page not set. Open the popup before calling this method.');
        const queueDropdown = this.selectQueueDropdown_LOC();
        await queueDropdown.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await queueDropdown.selectOption({ label: queueName });
    }
    /**
  * Select Customer Invoice Charges from dropdown in popup
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async selectCustomerInvoiceChargesFromDropdown(chargeType: string) {
        if (!this.popupPage) throw new Error('Popup page not set. Open the popup before calling this method.');
        const customerChargesDropdown = this.customerChargesDropdown_LOC();
        await customerChargesDropdown.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await customerChargesDropdown.selectOption({ label: chargeType });
    }
    /**
  * Fill Customer Invoice Charges Amount in popup
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async fillCustomerInvoiceChargesAmount(amount: string) {
        if (!this.popupPage) throw new Error('Popup page not set. Open the popup before calling this method.');
        const amountInput = this.customerInvoiceChargesAmountInput_LOC();
        await amountInput.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await amountInput.fill(amount);
    }
    /**
  * Select Settlement Reason from dropdown in popup
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async selectSettlermentReason(reason: string) {
        if (!this.popupPage) throw new Error('Popup page not set. Open the popup before calling this method.');
        const settlementReasonDropdown = this.settlementReasonDropdown_LOC();
        await settlementReasonDropdown.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await settlementReasonDropdown.selectOption({ label: reason });
    }
    /**
  * Fill Customer Invoice Comments in popup
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async customerInvoiceComments(commentText: string) {
        if (!this.popupPage) throw new Error('Popup page not set. Open the popup before calling this method.');
        const commentInput = this.commentInput_LOC();
        await commentInput.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await commentInput.fill(commentText);
    }
    /**
  * Click on Save Queue button in popup
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async clickOnSaveQueueButton() {
        if (!this.popupPage) throw new Error('Popup page not set. Open the popup before calling this method.');
        const saveQueueBtn = this.saveQueueBtn_LOC();
        await saveQueueBtn.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await Promise.all([
            this.popupPage.waitForEvent('close'),
            saveQueueBtn.click(),
        ]);
    }
    /**
  * Get Invoice Extract Date from popup
  * @author Aniket Nale
  * @created 19-01-2026
  */
    async getInvoiceExtractDate(): Promise<string> {
        await this.invoiceExtractDate_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        const extractDate = (await this.invoiceExtractDate_LOC.innerText()).trim();
        return extractDate;
    }
}
