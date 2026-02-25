import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
/** 
 * Load Billing Page Class
 * Handles all operations related to the billing page of a load.
 * @author Rohit Singh
 * @created 2025-08-08
 */
class LoadBillingPage {
    private readonly carrierIdValue_LOC: Locator;
    private readonly carrierNameValue_LOC: Locator;
    private readonly carrierTab_LOC: Locator;
    private readonly railTab_LOC: Locator;
    private readonly unassignedInvoiceTab_LOC: Locator;
    // private readonly sourceEdiValue_LOC: Locator;
    private readonly invoiceDetailValue_LOC: Locator;
    // private readonly invoiceAccordionTexts_LOC: Locator;
    private readonly invoiceNumberValue_LOC: Locator;
    private readonly invoiceStatusValue_LOC: Locator;
    private readonly invoiceAmountValue_LOC: Locator;
    private readonly carrier1TypeValue_LOC: Locator;
    private readonly railTypeValue_LOC: Locator;
    private readonly ediAPI410DataValue_LOC: Locator;
    private readonly ediAPI410RawJsonValue_LOC: Locator;
    private noteContainerApproval_LOC: (index: number) => Locator;
    private readonly customerChargeAmount_LOC: Locator;
    private readonly carrierChargeAmount_LOC: Locator;
    private readonly dispatchNotesInput_LOC: Locator;
    private readonly dispatchNotesValue_LOC: Locator;
    private readonly dispatchNotesNewButton_LOC: Locator;
    private readonly financeNotesInput_LOC: Locator;
    private readonly financeNotesValue_LOC: Locator;
    private readonly financeNotesNewButton_LOC: Locator;


    // locators copied from View Billing Page
    private readonly viewLoadButton_LOC: Locator;
    private readonly createInvoiceButton_LOC: Locator;
    private readonly loadIdValue_LOC: Locator;
    private readonly autoBillHistoryIcon_LOC: Locator;
    private readonly autoBillLoadHeader_LOC: string;
    private readonly autoBillLoadHeader: (page?: Page) => Locator;
    private readonly autoBillCarrierHeader_LOC: string;
    private readonly autoBillCarrierHeader: (page?: Page) => Locator;
    private readonly autoBillingSuccessLoad_LOC: string;
    private readonly autoBillingSuccessLoad: (page?: Page) => Locator;
    private readonly autoBillingSuccessCarrier_LOC: string;
    private readonly autoBillingSuccessCarrier: (page?: Page) => Locator;

    constructor(private page: Page) {
        this.carrierIdValue_LOC = this.page.locator("//div[contains(@class,'active')]//strong[text()='Carrier ID:']/parent::p");
        this.carrierNameValue_LOC = this.page.locator("//div[contains(@class,'active')]//strong[text()='Carrier:']/parent::p");
        this.carrierTab_LOC = this.page.locator("//a[text()='Carrier']");
        this.railTab_LOC = this.page.locator("//a[text()='Rail']");
        this.invoiceDetailValue_LOC = this.page.locator("//div[contains(text(),'Source') and contains(text(),'EDI')]/ancestor::div[@class='panel pmts']//p");
        this.invoiceNumberValue_LOC = this.page.locator("//div[@class='tab-pane active']//span[text()='Inv']/parent::p");
        this.invoiceStatusValue_LOC = this.page.locator("//div[@class='tab-pane active']//span[text()='Status']/parent::p");
        this.invoiceAmountValue_LOC = this.page.locator("//div[@class='tab-pane active']//p[contains(@id,'carrier_invoice_amount')]");
        this.carrier1TypeValue_LOC = this.page.locator("//div[@id='accordion_inv_1']//label[text()='TYPE']/parent::p");
        this.railTypeValue_LOC = this.page.locator("//div[@id='accordion_inv_2']//label[text()='TYPE']/parent::p");
        this.unassignedInvoiceTab_LOC = this.page.locator("//a[text()='Unassigned Invoice']");
        this.ediAPI410DataValue_LOC = this.page.locator("//pre[contains(text(),'carr_id')]");
        this.ediAPI410RawJsonValue_LOC = this.page.locator("//td[contains(text(),'Raw Message')]/pre");
        this.noteContainerApproval_LOC = (index: number) =>
            this.page.locator(`(//li[.//div[@class='note-container' and contains(.,'Approved by Intelys API Portal')]])[${index}]//div[@class='note-container']`);
        this.customerChargeAmount_LOC = this.page.locator("//div[@class='note-container'][contains(.,'Customer Charge:')]");
        this.carrierChargeAmount_LOC = this.page.locator("//div[@class='note-container'][contains(.,'Carrier Charge:')]");

        // locators for View Billing Page - Create Invoice and View Load Functionality
        this.viewLoadButton_LOC = page.locator("//*[contains(text(), 'View Load')]");
        this.createInvoiceButton_LOC = page.locator("//button[text()='Create Invoice']");
        this.loadIdValue_LOC = page.locator("//h2[contains(text(),'Load #')]");
        this.autoBillHistoryIcon_LOC = page.locator("//i[@class='fa fa-file-text-o']");
        this.autoBillLoadHeader_LOC = "//h3//b[contains(normalize-space(), 'History of Auto-Bill Attempts')]";
        this.autoBillLoadHeader = (page: Page = this.page) => page.locator(this.autoBillLoadHeader_LOC);
        this.autoBillCarrierHeader_LOC = "//h3//b[contains(normalize-space(), 'Carrier')]";
        this.autoBillCarrierHeader = (page: Page = this.page) => page.locator(this.autoBillCarrierHeader_LOC);
        this.autoBillingSuccessLoad_LOC = "//td[normalize-space()='Auto-Bill Success! (B00)']";
        this.autoBillingSuccessLoad = (page: Page = this.page) => page.locator(this.autoBillingSuccessLoad_LOC);
        this.autoBillingSuccessCarrier_LOC = "//td[normalize-space()='Auto-Pay Success! (P00)']";
        this.autoBillingSuccessCarrier = (page: Page = this.page) => page.locator(this.autoBillingSuccessCarrier_LOC);

        this.dispatchNotesInput_LOC = this.page.locator("//ul[@id='notes_section_disp']//input[@id='disp_note_input_0']");
        this.dispatchNotesValue_LOC = this.page.locator("//ul[@id='notes_section_disp']//div[@class='note-container']");
        this.dispatchNotesNewButton_LOC = this.page.locator("//ul[@id='notes_section_disp']//button[@value='new_note']");
        
        this.financeNotesInput_LOC = this.page.locator("//ul[@id='notes_section_bill']//input[@id='bill_note_input_0']");
        this.financeNotesValue_LOC = this.page.locator("//ul[@id='notes_section_bill']//div[@class='note-container']");
        this.financeNotesNewButton_LOC = this.page.locator("//ul[@id='notes_section_bill']//button[@value='new_note']");

    }
    /**
     * @author Rohit Singh
     * @created 2025-08-08
     * Gets the Carrier ID from the billing page.
     * @returns The Carrier ID as a string.
     */
    async getCarrierId(): Promise<string> {
        return (await this.carrierIdValue_LOC.innerText()).toString().split(':')[1].trim();
    }
    /**
     * @author Rohit Singh
     * @created 2025-08-08
     * Gets the Carrier Name from the billing page.
     * @returns The Carrier Name as a string.
     */
    async getCarrierName(): Promise<string> {
        return (await this.carrierNameValue_LOC.innerText()).toString().split(':')[1].trim();
    }
    /**
     * @author Rohit Singh
     * @created 2025-08-08
     * Clicks on the specified carrier tab.
     * @param tabIndex The index of the tab to click (first, second, or third).
     */
    async clickCarrierTab(tabIndex: string): Promise<void> {
        await this.carrierTab_LOC.elementHandles().then(async (elements) => {
            if (elements.length > 0) {
                switch (await tabIndex.toLocaleLowerCase()) {
                    case 'firsttab':
                        await elements[0].click();
                        break;
                    case 'secondtab':
                        await elements[1].click();
                        break;
                    case 'thirdtab':
                        await elements[2].click();
                        break;
                }
            }
        });
    }
    /**
     * Clicks on the Rail tab.
     * @author Rohit Singh
     * @created 2025-08-08
     */
    async clickRailTab(): Promise<void> {
        await this.railTab_LOC.click();
    }
    /**
     * Reloads the page every 2 seconds until the element is visible or maximum attempts reached.
     * @param element The element to wait for visibility
     * @param maxAttempts Maximum number of reload attempts (default: 5)
     * @author Rohit Singh
     * @created 2025-08-08
     */
    async waitForCompleteCarrierInvoice(): Promise<void> {
        await commonReusables.reloadPageUntilElementVisible(this.page, this.invoiceDetailValue_LOC.nth(8), 15);
        await this.invoiceDetailValue_LOC.nth(8).waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await console.log("Invoice details are now visible.");
    }
    /**
     * Validates given items in the invoice accordion.
     * @param expectedItems Array of items to validate
     * @author Rohit Singh
     * @created 2025-08-08
     */
    async validateInvoiceItems(invoiceNumber: string, invoiceStatus: string, invoiceAmount: string) {
        await expect.soft(await this.invoiceNumberValue_LOC.textContent()).toContain(invoiceNumber);
        await expect.soft(await this.invoiceStatusValue_LOC.textContent()).toContain(invoiceStatus);
        await expect.soft(await this.invoiceAmountValue_LOC.textContent()).toContain(invoiceAmount);
        await expect.soft(await this.carrier1TypeValue_LOC.allTextContents()).toContain(INVOICE_TYPES.INVOICE_TYPE_MIN);
        await expect.soft(await this.carrier1TypeValue_LOC.allTextContents()).toContain(INVOICE_TYPES.INVOICE_TYPE_MSG);
        await expect.soft(await this.carrier1TypeValue_LOC.allTextContents()).toContain(INVOICE_TYPES.INVOICE_TYPE_PDS);
        await expect.soft(await this.carrier1TypeValue_LOC.allTextContents()).toContain(INVOICE_TYPES.INVOICE_TYPE_FUE);
        await expect.soft(await this.carrier1TypeValue_LOC.allTextContents()).toContain(INVOICE_TYPES.INVOICE_TYPE_UNL);
    }
    /**
     * Waits for the rail invoice details to be visible.
     * @author Rohit Singh
     * @created 2025-08-18
     */
    async waitForCompleteRailInvoice(): Promise<void> {
        const maxAttempts = 10;
        for (let i = 0; i < maxAttempts; i++) {
            await this.railTab_LOC.click();
            if (await this.railTypeValue_LOC.nth(2).isVisible()) return;
            if (i === maxAttempts - 1) throw new Error(`Element not visible after ${maxAttempts} attempts`);
            await this.page.waitForLoadState('networkidle');
            await this.page.reload();
            await this.page.waitForLoadState('networkidle');
        }
        await console.log("Rail Invoice details are now visible.");
    }
    /**
     * Validates the rail invoice items.
     * @param invoiceNumber The invoice number.
     * @param invoiceStatus The invoice status.
     * @param invoiceAmount The invoice amount.
     * @author Rohit Singh
     * @created 2025-08-18
     */
    async validateRailInvoiceItems(invoiceNumber: string, invoiceStatus: string, invoiceAmount: string) {
        await expect.soft(await this.invoiceNumberValue_LOC.textContent()).toContain(invoiceNumber);
        await expect.soft(await this.invoiceStatusValue_LOC.textContent()).toContain(invoiceStatus);
        await expect.soft(await this.invoiceAmountValue_LOC.textContent()).toContain(invoiceAmount);
        await expect.soft(await this.railTypeValue_LOC.allTextContents()).toContain(INVOICE_TYPES.INVOICE_TYPE_MIN);
        await expect.soft(await this.railTypeValue_LOC.allTextContents()).toContain(INVOICE_TYPES.INVOICE_TYPE_MSG);
        await expect.soft(await this.railTypeValue_LOC.allTextContents()).toContain(INVOICE_TYPES.INVOICE_TYPE_PDS);
        await expect.soft(await this.railTypeValue_LOC.allTextContents()).toContain(INVOICE_TYPES.INVOICE_TYPE_FUE);
        await expect.soft(await this.railTypeValue_LOC.allTextContents()).toContain(INVOICE_TYPES.INVOICE_TYPE_UNL);
    }
    /**
     * Clicks on the unassigned invoice tab.
     * @author Rohit Singh
     * @created 2025-08-18
     */
    async clickUnassignedInvoiceTab(): Promise<void> {
        await this.page.waitForLoadState('networkidle');
        await this.unassignedInvoiceTab_LOC.click();
    }
    /**
     * @author Rohit Singh
     * @created 2025-08-18
     * Validates the unassigned invoice tab.
     * @param carrierId The carrier ID.
     * @param carrierName The carrier name.
     * @param rawJson The raw JSON.
     */
    async validateUnassignedInvoiceTab(carrierId: string, carrierName: string, loadId: string, invoiceNumber: string, amount: string): Promise<void> {
        await this.page.waitForLoadState('networkidle');
        await this.clickUnassignedInvoiceTab();
        await this.ediAPI410DataValue_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        // await expect.soft(await this.ediAPI410DataValue_LOC.textContent()).toContain(carrierId.toString());
        await expect.soft(await this.ediAPI410DataValue_LOC.textContent()).toContain(carrierName);
        await expect.soft(await this.ediAPI410RawJsonValue_LOC.textContent()).toContain(carrierId.toString());
        await expect.soft(await this.ediAPI410RawJsonValue_LOC.textContent()).toContain(carrierName);
        await expect.soft(await this.ediAPI410RawJsonValue_LOC.textContent()).toContain(loadId);
        await expect.soft(await this.ediAPI410RawJsonValue_LOC.textContent()).toContain(invoiceNumber);
        await expect.soft(await this.ediAPI410RawJsonValue_LOC.textContent()).toContain(amount);
    }

    /**
 * Validates that the approval note is visible for the specified index.
 * @param index The index of the approval note to validate (1 or 2).
 * @author Aniket Nale
 * @created 19-Jan-2026
 */
    async expectApprovalNoteVisibleAndDate(index: 1 | 2): Promise<void> {
        await commonReusables.waitForPageStable(this.page);

        const note = this.noteContainerApproval_LOC(index);
        await note.waitFor({ state: 'visible', timeout: WAIT.MID });

        const noteText = await note.innerText();
        const expectedDate = await commonReusables.getDate('today', 'YYYY-MM-DD');
        expect.soft(noteText).toContain(expectedDate);
    }

    /**
* Gets and verifies the Customer Charge amount from the approval note.
* @returns The Customer Charge amount as a string.
* @author Aniket Nale
* @created 20-Jan-2026
*/
    async getAndVerifyCustomerCharge(): Promise<string> {
        const note = this.customerChargeAmount_LOC

        await note.waitFor({ state: 'visible', timeout: WAIT.MID });
        const text = await note.innerText();
        const match = text.match(/Customer Charge:\s*([0-9]+(?:\.[0-9]{1,2})?)/);

        if (!match) {
            throw new Error(`Customer Charge not found in note:\n${text}`);
        }
        const charge = match[1];
        console.log(`Customer Charge Amount: ${charge}`);
        return charge;
    }

    /**
* Gets and verifies the Carrier Charge amount from the approval note.
* @returns The Carrier Charge amount as a string.
* @author Aniket Nale
* @created 20-Jan-2026
*/
    async getAndVerifyCarrierCharge(): Promise<string> {
        const note = this.carrierChargeAmount_LOC;
        await note.waitFor({ state: 'visible', timeout: WAIT.MID });

        const text = await note.innerText();
        const match = text.match(/Carrier Charge:\s*([0-9]+(?:\.[0-9]{1,2})?)/);
        if (!match) {
            throw new Error(`Carrier Charge not found in note:\n${text}`);
        }
        const charge = match[1];
        console.log(`Carrier Charge Amount: ${charge}`);
        return charge;
    }

    /**
    * Click on View Load Button
    * @author Avanish Srivastava
    * @created : 2025-08-12
    */
    async clickOnViewLoadBtn() {
        await this.viewLoadButton_LOC.nth(0).waitFor({ state: "visible" });
        await this.viewLoadButton_LOC.nth(0).click();
    }

    /**
    * Click on Create Invoice Button to generate the Invoice
    * @author Avanish Srivastava
    * @created : 2025-08-12
    */
    async clickOnCreateInvoiceButton() {
        await this.createInvoiceButton_LOC.waitFor({ state: "visible" });
        await this.createInvoiceButton_LOC.click();
    }

    /**
     * Retrieves the Load ID from the header of the page.
     * @author Rohit Singh
     * @created : 2025-11-13
     * @returns The Load ID as a string.
     */
    async getLoadID(): Promise<string> {
        await this.loadIdValue_LOC.waitFor({ state: "visible", timeout: WAIT.SMALL });
        const loadIdText = await this.loadIdValue_LOC.textContent();
        if (!loadIdText) {
            throw new Error("Load ID element not found or has no text content");
        }
        const parts = loadIdText.split('#');
        if (parts.length < 2) {
            throw new Error(`Invalid load ID format: ${loadIdText}`);
        }
        const loadId = parts[1].trim();
        return loadId;
    }

    /**
     * Checks the current load status by retrieving the Load ID from the page.
     * @author Rohit Singh
     * @created : 08-Dec-2025
     * @returns The Load Status as a string.
     */
    async checkCurrentLoadStatus() {
        await commonReusables.waitForPageStable(this.page);
        await this.page.reload();
        await this.loadIdValue_LOC.waitFor({ state: "visible", timeout: WAIT.SMALL });
        const loadIdText = await this.loadIdValue_LOC.textContent();
        return loadIdText;
    }

    /** 
     * Validates the Auto-Bill header for Load.
     * @author Tejaswini
     * @created : 2025-12-01
     * @expectedHeader The expected header text.
     */
    async validateAutoBillHeaderForLoad(
        pageToCheck: Page,
        expectedHeader: string = 'History of Auto-Bill Attempts for Load'
    ): Promise<void> {
        // Create the locator on the passed-in page so it targets the newly opened window
        const header = this.autoBillLoadHeader(pageToCheck);
        await header.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        const actualHeader = (await header.innerText()).trim();
        if (actualHeader.includes(expectedHeader)) {
            console.log(`✅ Header validated: ${actualHeader}`);
        } else {
            throw new Error(`❌ Expected header to contain "${expectedHeader}" but found "${actualHeader}"`);
        }
    }

    /**
     * Validates the Auto-Bill header for Carrier 1.
     * @author Tejaswini
     * @created : 2025-12-01
     * @expectedHeader The expected header text.
     */
    async validateAutoBillHeaderForCarrier1(
        pageToCheck: Page,
        expectedHeader: string = 'Carrier 1'
    ): Promise<void> {
        const header = this.autoBillCarrierHeader(pageToCheck);
        await header.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        const actualHeader = (await header.innerText()).trim();
        if (actualHeader.includes(expectedHeader)) {
            console.log(`✅ Header validated: ${actualHeader}`);
        } else {
            throw new Error(`❌ Expected header to contain "${expectedHeader}" but found "${actualHeader}"`);
        }
    }

    /**
     * Validates the Auto-Billing success message for Load.
     * @author Tejaswini
     * @created : 2025-12-01
     * @expectedHeader The expected header text.
     */
    async validateAutoBillForLoad(
        page: Page,
        expectedText: string = 'Auto-Bill Success! (B00)'): Promise<void> {
        await this.autoBillHistoryIcon_LOC.first().click();
        const [newPage] = await Promise.all([page.context().waitForEvent('page')]);
        await newPage.waitForLoadState('domcontentloaded');
        await this.validateAutoBillHeaderForLoad(newPage);
        const successLocator = this.autoBillingSuccessLoad(newPage);
        await successLocator.waitFor({ state: 'visible', timeout: WAIT.SPEC_TIMEOUT });
        const actualText = (await successLocator.innerText()).trim();
        if (actualText === expectedText) {
            console.log(`✅ Auto-Bill status validated: ${actualText}`);
        } else {
            throw new Error(`❌ Expected "${expectedText}" but found "${actualText}"`);
        }
        await newPage.close();
        console.log('✅ New window closed successfully.');
    }

    /**
     * Validates the Auto-Billing success message for Carrier 1.
     * @author Tejaswini
     * @created : 2025-12-01
     * @expectedHeader The expected header text.
     */
    async validateAutoBillForCarrier1(
        page: Page,
        expectedText: string = 'Auto-Pay Success! (P00)'): Promise<void> {
        await this.autoBillHistoryIcon_LOC.last().click();
        const [newPage] = await Promise.all([page.context().waitForEvent('page')]);
        await newPage.waitForLoadState('domcontentloaded');
        await this.validateAutoBillHeaderForCarrier1(newPage);
        const successLocator = this.autoBillingSuccessCarrier(newPage);
        await successLocator.waitFor({ state: 'visible', timeout: WAIT.SPEC_TIMEOUT });
        const actualText = (await successLocator.innerText()).trim();
        if (actualText === expectedText) {
            console.log(`✅ Auto-Bill status validated: ${actualText}`);
        } else {
            throw new Error(`❌ Expected "${expectedText}" but found "${actualText}"`);
        }
        await newPage.close();
        console.log('✅ New window closed successfully.');
    }

    /**
     * Enters a dispatch note in the billing page.
     * @author Rohit Singh
     * @created 19-Jan-2026
     * @param note The dispatch note to enter. from ediconstants 
     */
    async enterDispatchNotes(note: string): Promise<void> {
        await this.dispatchNotesInput_LOC.click();
        await this.dispatchNotesInput_LOC.pressSequentially(note);
        await this.dispatchNotesNewButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
        console.log(`Entered dispatch note: ${note}`);
    }

    /**
     * Gets the Dispatch Notes from the billing page.
     * @author Rohit Singh
     * @created 19-Jan-2026
     * @returns The Dispatch Notes as a string.
     */
    async getDispatchNotes(): Promise<string[]> {
        const notes = await this.dispatchNotesValue_LOC.allInnerTexts();
        console.log(`Dispatch Notes: ${notes}`);
        return notes;
    }

    /**
     * Validates the Dispatch Notes contain the expected note.
     * @author Rohit Singh
     * @created 19-Jan-2026
     * @param expectedNote 
     */
    async validateDispatchNotes(expectedNote: string): Promise<void> {
        await this.page.waitForTimeout(WAIT.DEFAULT);
        const actualNotes = await this.getDispatchNotes();
        expect.soft(actualNotes, `Expected dispatch note "${expectedNote}" not found.`).toContain(expectedNote);
    }
}
export default LoadBillingPage;