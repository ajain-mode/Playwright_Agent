import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { REGEX_PATTERNS } from "@utils/regexPatterns";
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

    // Billing Toggle locators
    private readonly billingToggleHiddenField_LOC: Locator;
    private readonly billingToggleTrack_LOC: Locator;
    private readonly billingToggleHandle_LOC: Locator;

    // Payable Toggle locators (top slider)
    private readonly payableToggleHiddenField_LOC: Locator;
    private readonly payableToggleSliderInput_LOC: Locator;
    private readonly payableToggleTrack_LOC: Locator;
    private readonly payableToggleHandle_LOC: Locator;
    private readonly unassignedInvoiceActivePanel_LOC: Locator;
    private readonly unassignedInvoiceViewHistoryLink_LOC: Locator;

    // Not Delivered Final checkbox locators
    private readonly notDeliveredFinalCheckbox_LOC: Locator;
    private readonly priceDifferenceCheckbox_LOC: Locator;

    // Add New Carrier Invoice dialog locators
    private readonly addNewCarrierInvoiceBtn_LOC: Locator;
    private readonly carrierInvoiceDialogForm_LOC: Locator;
    private readonly carrierInvoiceNumberInput_LOC: Locator;
    private readonly carrierInvoiceAmountInput_LOC: Locator;
    private readonly saveCarrierInvoiceBtn_LOC: Locator;

    // Finance Messages locators
    private readonly financeMessagesList_LOC: Locator;
    private readonly payableMessagesList_LOC: Locator;

    // View History links — payables vs billing issues (`#billing-note-container`)
    private readonly payablesViewHistoryLink_LOC: Locator;
    /** Billing Issues View History — billing.php `#billing-note-container` → `show_billing_messages_history` */
    private readonly billingIssuesViewHistoryLink_LOC: Locator;

    // Carrier Payable Status dropdown and charge fields
    private readonly carrierPayableStatusSelect_LOC: Locator;
    private readonly carrierRemainderAmount_LOC: Locator;
    private readonly carrierTotalInvoicesAmount_LOC: Locator;
    private readonly payableReasonDisplay_LOC: Locator;

    // Billing Issues section root + checkboxes (inside #finance_issues_block)
    private readonly financeIssuesBlock_LOC: Locator;
    /** Billing Issues Messages — billing.php `#billing-note-container` inside `#finance_issues_block` */
    private readonly billingIssuesMessagesList_LOC: Locator;
    private readonly allBillingIssueCheckboxes_LOC: Locator;
    private readonly lumperCheckbox_LOC: Locator;
    private readonly lumperLabel_LOC: Locator;
    /** Missing Paperwork — Miscellaneous — billing.php `#Miscellaneouss` (value `mpw`) */
    private readonly miscellaneousCheckbox_LOC: Locator;
    private readonly miscellaneousLabel_LOC: Locator;
    /** Billing Issues — OS/D — billing.php `div#loadsh_fi_block_osd` → `input#OSD1` (value `osd`) */
    private readonly osdCheckbox_LOC: Locator;
    private readonly osdLabel_LOC: Locator;

    // Billing Issues View History popup: table.hist rows with cells (header row uses th).
    private readonly BILLING_ISSUES_HISTORY_TABLE_DATA_ROWS_SELECTOR = 'table.hist tr:has(td)';
    /** Payables View History popup — same table structure, separate from billing issues history. */
    private readonly PAYABLES_HISTORY_TABLE_DATA_ROWS_SELECTOR = 'table.hist tr:has(td)';

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
    private readonly unassignedTabToggleCheckbox: Locator;
    private readonly viewHistoryDialog_LOC: Locator;
    private readonly viewHistoryFirstRowOrEmpty_LOC: Locator;
    /** Unassigned Invoice → View History dialog body rows — used as a child selector via `dialog.locator(...)`. */
    private readonly VIEW_HISTORY_DIALOG_HISTORY_BODY_SELECTOR = "tbody[id^='history_body_'] tr.popup-table-tr";

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

        // Billing Issues "Waiting On" toggle — exact element IDs from BTMS PHP source as indexed for the agent
        // (AppSourceIndexer: modetrans/mono.git → btms/php/src; same IDs listed in src/agent/config/PromptsConfig.ts pomLocators).
        this.billingToggleHiddenField_LOC = this.page.locator("#fi_waiting_on");

        // Payable Toggle — per-carrier slider under Payable Details (billing.php payables_waiting_on).
        this.payableToggleHiddenField_LOC = this.page.locator("input[type='hidden'][name='payables_waiting_on']").first();
        this.payableToggleSliderInput_LOC = this.page.locator("input.payables_waiting_on_select").first();
        this.payableToggleTrack_LOC = this.page
            .locator(
                "xpath=//input[contains(@class,'payables_waiting_on_select')]/ancestor::div[contains(@class,'slider')]//div[contains(@class,'slider-track')]",
            )
            .first();
        this.payableToggleHandle_LOC = this.page
            .locator(
                "xpath=//input[contains(@class,'payables_waiting_on_select')]/ancestor::div[contains(@class,'slider')]//div[contains(@class,'slider-handle') and not(contains(@class,'hide'))]",
            )
            .first();
        this.unassignedInvoiceActivePanel_LOC = this.page.locator("div.tab-pane.active[id^='exception_']");
        this.unassignedInvoiceViewHistoryLink_LOC =
            this.unassignedInvoiceActivePanel_LOC.getByRole("link", { name: /View History/i });
         this.unassignedTabToggleCheckbox = this.unassignedInvoiceActivePanel_LOC.locator("input[type='checkbox'][id^='checkbox_id_']");    

        // Not Delivered Final checkbox
        this.notDeliveredFinalCheckbox_LOC = this.page.locator("#Delivs");
        /** Price Difference billing issue — billing.php `#Differences` (value `price`) */
        this.priceDifferenceCheckbox_LOC = this.page.locator("#Differences");

        // Add New Carrier Invoice dialog
        this.addNewCarrierInvoiceBtn_LOC = this.page.locator("#carr_invoice_add_new");
        this.carrierInvoiceDialogForm_LOC = this.page.locator("#carrier_invoice_dialog_form");
        this.carrierInvoiceNumberInput_LOC = this.page.locator("#carrier_invoice_number_id");
        this.carrierInvoiceAmountInput_LOC = this.page.locator("#carrier_invoice_amount_id");
        this.saveCarrierInvoiceBtn_LOC = this.page.locator("#submit_save_carrier_invoice");

        // Finance Messages — all sections (billing + payables), excluding the input row
        this.financeMessagesList_LOC = this.page.locator(".finance-messages .messages-list > .message");

        // Finance Messages — payables section (scoped to payables container)
        this.payableMessagesList_LOC = this.page.locator("div[id^='payables-note-container_'] .finance-messages .messages-list > .message");

        // View History — payables note container (`show_payables_messages_and_toggle_history`)
        this.payablesViewHistoryLink_LOC = this.page.locator("div[id^='payables-note-container_'] a:has(small)");

        // Billing Issues / Missing Paperwork (#finance_issues_block — same block as fi_waiting_on slider region)
        this.financeIssuesBlock_LOC = this.page.locator("#finance_issues_block");
        this.billingIssuesMessagesList_LOC = this.financeIssuesBlock_LOC.locator(
            "#billing-note-container .finance-messages .messages-list > .message"
        );
        this.billingIssuesViewHistoryLink_LOC = this.financeIssuesBlock_LOC.locator(
            "#billing-note-container a:has(small)"
        );
        this.billingToggleTrack_LOC = this.financeIssuesBlock_LOC.locator(".slider-track").first();
        this.billingToggleHandle_LOC = this.financeIssuesBlock_LOC.locator(".slider-handle").first();
        this.allBillingIssueCheckboxes_LOC = this.financeIssuesBlock_LOC.locator("input.fi_ckb");
        this.lumperCheckbox_LOC = this.page.locator("#Lumpers");
        this.lumperLabel_LOC = this.page.locator("label[for='Lumpers'].ckb");
        this.miscellaneousCheckbox_LOC = this.page.locator("#Miscellaneouss");
        this.miscellaneousLabel_LOC = this.page.locator("label[for='Miscellaneouss'].ckb");
        this.osdCheckbox_LOC = this.financeIssuesBlock_LOC.locator("#loadsh_fi_block_osd input#OSD1");
        this.osdLabel_LOC = this.page.locator("label[for='OSD1'].ckb");

        // Carrier Payable Status dropdown (first carrier), Remainder, and Total Invoices
        this.carrierPayableStatusSelect_LOC = this.page.locator("select[id^='carr_'][id$='_post_status']").first();
        this.carrierRemainderAmount_LOC = this.page.locator("span[id^='carr_'][id$='_carr_balance']").first();
        // Total Invoices label uses &nbsp; in PHP source ("Total&nbsp;Invoices"), so match words separately
        this.carrierTotalInvoicesAmount_LOC = this.page.locator("//span[contains(@class, 'pmt-label')][contains(., 'Total') and contains(., 'Invoices')]/following-sibling::span").first();
        // Payable Reason is a native <select> per carrier row, id pattern: carr_<n>_vendor_invoice_reason_code
        // (also identifiable by class js-carr_vendor_invoice_reason_code). Use the id pattern so the
        // locator is stable regardless of which carrier index (carr_1_*, carr_2_*, ...) renders.
        this.payableReasonDisplay_LOC = this.page.locator(
            "select[id^='carr_'][id$='_vendor_invoice_reason_code']",
        );
        this.viewHistoryDialog_LOC = this.page
            .locator("div.ui-dialog:visible:has(div[id^='view_history_dialog_'])")
            .last();

        this.viewHistoryFirstRowOrEmpty_LOC = this.viewHistoryDialog_LOC
            .locator("tbody[id^='history_body_'] tr.popup-table-tr, div[id^='no_history_']")
            .first();
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
    /**
     * Reads the Billing Issues "Waiting On" toggle value.
     * Returns 'Billing' (1), 'Neutral' (2), or 'Agent' (3).
     * Reads from hidden input `#fi_waiting_on` (source of truth; pairs with bootstrap-slider `#waiting_on_select`).
     * Locator source: BTMS billing PHP as indexed — `#fi_waiting_on`, `#waiting_on_select` (see PromptsConfig pomLocators).
     * @author AI Agent
     * @created 17-Mar-2026
     */
    async getBillingToggleValue(): Promise<string> {
        try {
            const valueMap: Record<string, string> = { '1': 'Billing', '2': 'Neutral', '3': 'Agent' };
            await this.billingToggleHiddenField_LOC.waitFor({ state: "attached", timeout: WAIT.DEFAULT });
            const hiddenVal = await this.billingToggleHiddenField_LOC.inputValue();
            const toggleValue = valueMap[hiddenVal] || 'unknown';
            console.log(`Billing toggle value: ${toggleValue} (raw: ${hiddenVal})`);
            return toggleValue;
        } catch (err) {
            console.error(`getBillingToggleValue: ${(err as Error).message}`);
            throw err;
        }
    }

    /**
     * Scrolls `#finance_issues_block` into view (Billing Issues region containing `#fi_waiting_on` / `#waiting_on_select`).
     * @author AI Agent
     * @created 2026-04-30
     */
    async scrollBillingIssuesBlockIntoView(): Promise<void> {
        await this.financeIssuesBlock_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.financeIssuesBlock_LOC.scrollIntoViewIfNeeded();
    }

    /**
     * Reads Initial Toggle Date display text from `#finance_issues_block` (billing.php).
     * @author AI Agent
     * @created 2026-06-03
     */
    async getInitialToggleDateDisplayValue(): Promise<string> {
        await this.scrollBillingIssuesBlockIntoView();
        const blockText = (await this.financeIssuesBlock_LOC.innerText()) || "";
        const match = blockText.match(REGEX_PATTERNS.BILLING_TOGGLE.INITIAL_TOGGLE_DATE_LABEL);
        return (match?.[1] || "").trim();
    }

    /**
     * Reads Current Toggle Date display text from `#finance_issues_block` (billing.php).
     * @author AI Agent
     * @created 2026-06-03
     */
    async getCurrentToggleDateDisplayValue(): Promise<string> {
        await this.scrollBillingIssuesBlockIntoView();
        const blockText = (await this.financeIssuesBlock_LOC.innerText()) || "";
        const match = blockText.match(REGEX_PATTERNS.BILLING_TOGGLE.CURRENT_TOGGLE_DATE_LABEL);
        return (match?.[1] || "").trim();
    }

    /**
     * Reloads View Billing and waits for the billing issues block.
     * @author AI Agent
     * @created 2026-06-03
     */
    async reloadBillingPageAndWaitForToggleBlock(): Promise<void> {
        await commonReusables.reloadAndAcceptDialogs(this.page, WAIT.SMALL);
        await this.scrollBillingIssuesBlockIntoView();
    }

    /**
     * X position on `.slider-track` for Billing (1), Neutral (2), or Agent (3).
     * bootstrap-slider `#waiting_on_select` / `#fi_waiting_on` — billing.php.
     * @author AI Agent
     * @created 2026-06-11
     */
    private billingToggleTrackSegmentClickX(trackWidth: number, rawValue: string): number {
        const segmentRatio: Record<string, number> = {
            "1": 0.12,
            "2": 0.5,
            "3": 0.88,
        };
        const ratio = segmentRatio[rawValue] ?? 0.5;
        return Math.max(2, Math.min(trackWidth - 2, Math.round(trackWidth * ratio)));
    }

    /**
     * Clicks a proportional segment on the billing issues slider track for the target raw value.
     * @author AI Agent
     * @created 2026-06-11
     */
    private async clickBillingToggleTrackSegment(
        targetRawValue: string,
        trackBox: { width: number; height: number }
    ): Promise<void> {
        const clickX = this.billingToggleTrackSegmentClickX(trackBox.width, targetRawValue);
        const clickY = Math.max(1, Math.round(trackBox.height / 2));
        await this.billingToggleTrack_LOC.click({ position: { x: clickX, y: clickY } });
        await commonReusables.waitForPageStable(this.page);
    }

    /**
     * Clicks a proportional segment on the Payable Details payables slider track.
     * @author AI Agent
     * @created 2026-06-17
     */
    private async clickPayablesToggleTrackSegment(
        targetRawValue: string,
        trackBox: { width: number; height: number },
    ): Promise<void> {
        const clickX = this.billingToggleTrackSegmentClickX(trackBox.width, targetRawValue);
        const clickY = Math.max(1, Math.round(trackBox.height / 2));
        await this.payableToggleTrack_LOC.click({ position: { x: clickX, y: clickY } });
        await commonReusables.waitForPageStable(this.page);
    }

    /**
     * Sets Billing Issues "Waiting On" toggle to Billing, Agent, or Neutral.
     * Clicks slider track and validates hidden source field (`#fi_waiting_on`) reaches target raw value.
     * Uses incremental handle-adjacent clicks first; falls back to proportional track segment when needed
     * (e.g. Agent→Billing as agent user on Delivered Final loads — BT-67876 step 31).
     * @author AI Agent
     * @created 2026-05-06
     * @param expectedToggle - One of PAYABLE_TOGGLE_VALUE.BILLING/AGENT/NEUTRAL
     */
    async setBillingIssuesToggle(expectedToggle: string): Promise<void> {
        const targetRawValueMap: Record<string, string> = {
            [PAYABLE_TOGGLE_VALUE.BILLING]: "1",
            [PAYABLE_TOGGLE_VALUE.NEUTRAL]: "2",
            [PAYABLE_TOGGLE_VALUE.AGENT]: "3",
        };

        const targetRawValue = targetRawValueMap[expectedToggle];
        if (!targetRawValue) {
            throw new Error(`Unsupported billing toggle target: ${expectedToggle}`);
        }

        await this.scrollBillingIssuesBlockIntoView();
        await this.billingToggleHiddenField_LOC.waitFor({ state: "attached", timeout: WAIT.LARGE });
        await this.billingToggleTrack_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.billingToggleHandle_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });

        let currentRawValue = await this.billingToggleHiddenField_LOC.inputValue();
        if (currentRawValue === targetRawValue) return;

        const trackBox = await this.billingToggleTrack_LOC.boundingBox();
        if (!trackBox || trackBox.width <= 4 || trackBox.height <= 2) {
            throw new Error("Billing toggle track is not clickable");
        }

        const maxMoves = 2;
        let incrementalStalled = false;
        for (let move = 0; move < maxMoves && currentRawValue !== targetRawValue; move++) {
            const handleBox = await this.billingToggleHandle_LOC.boundingBox();
            if (!handleBox) {
                throw new Error("Billing toggle handle is not clickable");
            }

            const moveLeft = Number(currentRawValue) > Number(targetRawValue);
            const handleCenterXInTrack = handleBox.x + handleBox.width / 2 - trackBox.x;
            const clickX = moveLeft
                ? Math.max(2, Math.round(handleCenterXInTrack - 12))
                : Math.min(trackBox.width - 2, Math.round(handleCenterXInTrack + 12));
            const clickY = Math.max(1, Math.round(trackBox.height / 2));

            await this.billingToggleTrack_LOC.click({ position: { x: clickX, y: clickY } });
            await commonReusables.waitForPageStable(this.page);

            const beforeRawValue = currentRawValue;
            currentRawValue = await this.billingToggleHiddenField_LOC.inputValue();
            if (currentRawValue === beforeRawValue) {
                incrementalStalled = true;
                break;
            }
        }

        if (currentRawValue !== targetRawValue) {
            await this.clickBillingToggleTrackSegment(targetRawValue, trackBox);
            currentRawValue = await this.billingToggleHiddenField_LOC.inputValue();
            if (incrementalStalled && currentRawValue !== targetRawValue) {
                throw new Error(
                    `Billing toggle did not reach raw value ${targetRawValue} (stuck at ${currentRawValue})`
                );
            }
        }

        await expect
            .poll(async () => await this.billingToggleHiddenField_LOC.inputValue(), {
                timeout: WAIT.LARGE,
                message: `Billing toggle raw value should become ${targetRawValue}`,
            })
            .toBe(targetRawValue);
    }

    /**
     * Hard assertion helper: set Billing Issues toggle and verify resulting state.
     * @author AI Agent
     * @created 2026-05-06
     * @param expectedToggle - Expected resolved display value.
     */
    async setAndAssertBillingIssuesToggle(expectedToggle: string): Promise<void> {
        await this.setBillingIssuesToggle(expectedToggle);
        await expect
            .poll(async () => await this.getBillingToggleValue(), {
                timeout: WAIT.LARGE,
                message: `Billing toggle should resolve to ${expectedToggle}`,
            })
            .toBe(expectedToggle);
    }

    /**
     * Reads the Payable toggle value from the billing page (carrier-level slider).
     * Returns 'Payables' (1), 'Neutral' (2), or 'Agent' (3).
     * Reads from hidden input name="payables_waiting_on" which is the source of truth.
     * @author AI Agent
     * @created 17-Mar-2026
     */
    async getPayableToggleValue(): Promise<string> {
        try {
            const valueMap: Record<string, string> = { '1': 'Payables', '2': 'Neutral', '3': 'Agent' };
            await this.payableToggleHiddenField_LOC.waitFor({ state: "attached", timeout: WAIT.LARGE });
            const hiddenVal = await this.payableToggleHiddenField_LOC.inputValue();
            const toggleValue = valueMap[hiddenVal] || 'unknown';
            console.log(`Payable toggle value: ${toggleValue} (raw: ${hiddenVal})`);
            return toggleValue;
        } catch (err) {
            console.error(`getPayableToggleValue: ${(err as Error).message}`);
            throw err;
        }
    }

    /**
     * Scrolls Payables toggle slider into view on View Billing.
     * @author AI Agent
     * @created 2026-06-16
     */
    async scrollPayablesToggleIntoView(): Promise<void> {
        const payablesDetailsHeading = this.page.getByRole("heading", { name: /Payable Details/i });
        await payablesDetailsHeading.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await payablesDetailsHeading.scrollIntoViewIfNeeded();
        await this.payableToggleSliderInput_LOC.waitFor({ state: "attached", timeout: WAIT.LARGE });
        await this.payableToggleHiddenField_LOC.waitFor({ state: "attached", timeout: WAIT.LARGE });
        await this.payableToggleTrack_LOC.scrollIntoViewIfNeeded();
    }

    /**
     * Reloads View Billing and waits for Payables toggle.
     * @author AI Agent
     * @created 2026-06-16
     */
    async reloadBillingPageAndWaitForPayablesToggle(): Promise<void> {
        await commonReusables.reloadAndAcceptDialogs(this.page, WAIT.SMALL);
        await this.scrollPayablesToggleIntoView();
    }

    /**
     * Sets Payables / Agent / Neutral slider on View Billing Payable details.
     * billing.php: hidden input name="payables_waiting_on" (1=Payables, 2=Neutral, 3=Agent).
     * @author AI Agent
     * @created 2026-06-16
     * @param expectedToggle - PAYABLES_TOGGLE_VALUE.PAYABLES | AGENT | NEUTRAL
     */
    async setPayablesToggle(expectedToggle: string): Promise<void> {
        const targetRawValueMap: Record<string, string> = {
            [PAYABLES_TOGGLE_VALUE.PAYABLES]: "1",
            [PAYABLES_TOGGLE_VALUE.NEUTRAL]: "2",
            [PAYABLES_TOGGLE_VALUE.AGENT]: "3",
        };

        const targetRawValue = targetRawValueMap[expectedToggle];
        if (!targetRawValue) {
            throw new Error(`Unsupported payables toggle target: ${expectedToggle}`);
        }

        await this.scrollPayablesToggleIntoView();
        await this.payableToggleTrack_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.payableToggleHandle_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });

        let currentRawValue = await this.payableToggleHiddenField_LOC.inputValue();
        if (currentRawValue === targetRawValue) {
            return;
        }

        const trackBox = await this.payableToggleTrack_LOC.boundingBox();
        if (!trackBox || trackBox.width <= 4 || trackBox.height <= 2) {
            throw new Error("Payables toggle track is not clickable");
        }

        const rawGap = Math.abs(Number(targetRawValue) - Number(currentRawValue));
        if (rawGap > 1) {
            await this.clickPayablesToggleTrackSegment(targetRawValue, trackBox);
            currentRawValue = await this.payableToggleHiddenField_LOC.inputValue();
        }

        const maxMoves = 2;
        for (let move = 0; move < maxMoves && currentRawValue !== targetRawValue; move++) {
            const handleBox = await this.payableToggleHandle_LOC.boundingBox();
            if (!handleBox) {
                throw new Error("Payables toggle handle is not clickable");
            }

            const moveLeft = Number(currentRawValue) > Number(targetRawValue);
            const handleCenterXInTrack = handleBox.x + handleBox.width / 2 - trackBox.x;
            const clickX = moveLeft
                ? Math.max(2, Math.round(handleCenterXInTrack - 12))
                : Math.min(trackBox.width - 2, Math.round(handleCenterXInTrack + 12));
            const clickY = Math.max(1, Math.round(trackBox.height / 2));

            await this.payableToggleTrack_LOC.click({ position: { x: clickX, y: clickY } });
            await commonReusables.waitForPageStable(this.page);
            currentRawValue = await this.payableToggleHiddenField_LOC.inputValue();
        }

        if (currentRawValue !== targetRawValue) {
            await this.clickPayablesToggleTrackSegment(targetRawValue, trackBox);
            currentRawValue = await this.payableToggleHiddenField_LOC.inputValue();
        }

        await expect
            .poll(async () => await this.payableToggleHiddenField_LOC.inputValue(), {
                timeout: WAIT.LARGE,
                message: `Payables toggle raw value should reach ${targetRawValue}`,
            })
            .toBe(targetRawValue);
    }

    /**
     * Sets Payables toggle and hard-asserts resolved display value.
     * @author AI Agent
     * @created 2026-06-16
     * @param expectedToggle - PAYABLES_TOGGLE_VALUE.*
     */
    async setAndAssertPayablesToggle(expectedToggle: string): Promise<void> {
        await this.setPayablesToggle(expectedToggle);
        await expect
            .poll(async () => await this.getPayableToggleValue(), {
                timeout: WAIT.LARGE,
                message: `Payables toggle should resolve to ${expectedToggle}`,
            })
            .toBe(expectedToggle);
    }

    /**
     * Hard-asserts Unassigned Invoice tab EDI 210 row details (sample steps 54 Expected).
     * @author AI Agent
     * @created 2026-06-16
     */
    async assertUnassignedInvoiceEdi210Details(options: {
        source: string;
        loadId: string;
        carrierName: string;
        description: string;
        expectedPayablesToggle: string;
    }): Promise<void> {
        await this.clickUnassignedInvoiceTab();
        const panel = this.unassignedInvoiceActivePanel_LOC;
        await panel.waitFor({ state: "visible", timeout: WAIT.LARGE });

        await expect(panel, "Expected: Unassigned Invoice source").toContainText(options.source);
        await expect(panel, "Expected: Unassigned Invoice load_number").toContainText(options.loadId);
        await expect(panel, "Expected: Unassigned Invoice carr_name").toContainText(options.carrierName);
        await expect(panel, "Expected: Unassigned Invoice descrip").toContainText(options.description);

        const payablesToggle = await this.getUnassignedInvoicePayablesToggleValue();
        expect(
            payablesToggle,
            `Expected: Payables / Agent toggle set to ${options.expectedPayablesToggle}`,
        ).toBe(options.expectedPayablesToggle);
    }

    /**
     * Opens the Unassigned Invoice "View History" dialog and returns its in-page locator.
     * The dialog is a jQuery UI overlay (NOT a new browser window) rendered as
     * `div.ui-dialog` containing `div#view_history_dialog_<exceptionId>` and a
     * `table.popup-table` with columns: TIMESTAMP | USERNAME | ROLE | MESSAGE.
     * @author AI Agent
     * @created 2026-06-22
     */
    async openUnassignedInvoiceViewHistoryDialog(): Promise<Locator> {
        await this.unassignedInvoiceViewHistoryLink_LOC.scrollIntoViewIfNeeded();
        await this.unassignedInvoiceViewHistoryLink_LOC.waitFor({
            state: "visible",
            timeout: WAIT.LARGE,
        });
        await this.unassignedInvoiceViewHistoryLink_LOC.click();

        const dialog = this.viewHistoryDialog_LOC;
        await dialog.waitFor({ state: "visible", timeout: WAIT.LARGE });
        // Wait for the history body to render at least one row (or the no_history div) before reading.
        await this.viewHistoryFirstRowOrEmpty_LOC.waitFor({ state: "attached", timeout: WAIT.LARGE });
        return dialog;
    }

    /**
     * Closes the View History jQuery UI dialog using its "Back" button (falls back to titlebar close).
     * @author AI Agent
     * @created 2026-06-22
     */
    async closeViewHistoryDialog(dialog: Locator): Promise<void> {
        const backBtn = dialog.locator("input[type='button'][value='Back']");
        if (await backBtn.isVisible().catch(() => false)) {
            await backBtn.click();
        } else {
            await dialog.locator("button.ui-dialog-titlebar-close").click();
        }
        await dialog.waitFor({ state: "hidden", timeout: WAIT.LARGE }).catch(() => undefined);
    }

    /**
     * Asserts a single MESSAGE entry in the Unassigned Invoice View History dialog.
     * Reads only the MESSAGE column (4th `td.td_data`) so noise from TIMESTAMP / USERNAME / ROLE
     * cells (e.g. dates, "Intelys API Portal", "Agent") cannot accidentally satisfy `toContain`.
     *
     * Money comparison is tolerant of trailing zero cents — `$784.00`, `$784.0`, and `$784` are
     * treated as equivalent so CSV-formatted amounts match the UI's whole-dollar display.
     *
     * @author AI Agent
     * @modified 2026-06-22
     * @param expectedMessage - Full message text from sample step 55 Expected
     */
    async assertUnassignedInvoiceViewHistoryMessage(expectedMessage: string): Promise<void> {
        const dialog = await this.openUnassignedInvoiceViewHistoryDialog();

        const rows = dialog.locator(this.VIEW_HISTORY_DIALOG_HISTORY_BODY_SELECTOR);
        const rowCount = await rows.count();
        expect(rowCount, "Expected: at least one row in View History dialog").toBeGreaterThan(0);

        // Normalize: strip trailing zero-cents from any `$<amount>` so "$784.00" === "$784".
        const normalizeMoney = (s: string): string =>
            s.replace(REGEX_PATTERNS.TRAILING_NUMBERS.TRAILING_ZERO_CENTS, "$1");

        const messages: string[] = [];
        for (let i = 0; i < rowCount; i++) {
            // Columns: 0 TIMESTAMP | 1 USERNAME | 2 ROLE | 3 MESSAGE
            const messageCell = rows.nth(i).locator("td.td_data").nth(3);
            const text = ((await messageCell.textContent()) || "").trim();
            if (text) messages.push(text);
        }

        const normalizedExpected = normalizeMoney(expectedMessage);
        const matched = messages.some((m) => normalizeMoney(m).includes(normalizedExpected));
        expect(
            matched,
            `Expected: View History MESSAGE column to contain "${expectedMessage}" (money-normalized: "${normalizedExpected}"). Found rows: ${messages
                .map((m) => `"${m}"`)
                .join(", ") || "(none)"}`,
        ).toBe(true);

        await this.closeViewHistoryDialog(dialog);
    }

    /**
     * Clicks the "Add New" button against Carrier Invoices to open the Add Carrier Invoice dialog.
     * @author AI Agent
     * @created 17-Mar-2026
     */
    async clickAddNewCarrierInvoice(): Promise<void> {
        await this.addNewCarrierInvoiceBtn_LOC.scrollIntoViewIfNeeded();
        await this.addNewCarrierInvoiceBtn_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.addNewCarrierInvoiceBtn_LOC.click();
        await commonReusables.waitForPageStable(this.page);
        await this.carrierInvoiceDialogForm_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        console.log("Opened Add Carrier Invoice dialog");
    }

    /**
     * Fills the carrier invoice number in the Add Carrier Invoice dialog.
     * @author AI Agent
     * @created 17-Mar-2026
     */
    async enterCarrierInvoiceNumber(invoiceNumber: string): Promise<void> {
        await this.carrierInvoiceNumberInput_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.carrierInvoiceNumberInput_LOC.fill(invoiceNumber);
        console.log(`Entered carrier invoice number: ${invoiceNumber}`);
    }

    /**
     * Fills the carrier invoice amount in the Add Carrier Invoice dialog.
     * @author AI Agent
     * @created 17-Mar-2026
     */
    async enterCarrierInvoiceAmount(amount: string): Promise<void> {
        await this.carrierInvoiceAmountInput_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.carrierInvoiceAmountInput_LOC.fill(amount);
        console.log(`Entered carrier invoice amount: ${amount}`);
    }

    /**
     * Clicks the Save Invoice button in the Add Carrier Invoice dialog.
     * @author AI Agent
     * @created 17-Mar-2026
     */
    async clickSaveCarrierInvoice(): Promise<void> {
        await this.saveCarrierInvoiceBtn_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.saveCarrierInvoiceBtn_LOC.click();
        await commonReusables.waitForPageStable(this.page);
        console.log("Clicked Save Invoice button");
    }

    /**
     * Gets all finance messages from the billing page.
     * @author AI Agent
     * @created 17-Mar-2026
     * @returns Array of finance message texts.
     */
    async getFinanceMessages(): Promise<string[]> {
        const count = await this.financeMessagesList_LOC.count();
        const messages: string[] = [];
        for (let i = 0; i < count; i++) {
            const text = await this.financeMessagesList_LOC.nth(i).textContent();
            if (text?.trim()) {
                messages.push(text.trim());
            }
        }
        return messages;
    }

    /**
     * Checks if any finance message contains the given text (case-insensitive).
     * @author AI Agent
     * @created 17-Mar-2026
     */
    async hasFinanceMessageContaining(searchText: string): Promise<boolean> {
        const messages = await this.getFinanceMessages();
        return messages.some(msg => msg.toLowerCase().includes(searchText.toLowerCase()));
    }

    /**
     * Gets all payable-section messages from the billing page.
     * Scoped to div[id^='payables-note-container_'] .finance-messages .messages-list > .message
     * @author AI Agent
     * @created 14-Apr-2026
     * @returns Array of payable message texts.
     */
    async getPayableMessages(): Promise<string[]> {
        const count = await this.payableMessagesList_LOC.count();
        const messages: string[] = [];
        for (let i = 0; i < count; i++) {
            const text = await this.payableMessagesList_LOC.nth(i).textContent();
            if (text?.trim()) {
                messages.push(text.trim());
            }
        }
        return messages;
    }

    /**
     * Finds a payable message matching the given text (case-insensitive substring).
     * Returns the full message text if found, null otherwise.
     * @author AI Agent
     * @created 14-Apr-2026
     * @param searchText - substring to search for in payable messages
     * @returns The full matching message text, or null if not found.
     */
    async findPayableMessageContaining(searchText: string): Promise<string | null> {
        const messages = await this.getPayableMessages();
        const match = messages.find(msg => msg.toLowerCase().includes(searchText.toLowerCase()));
        return match || null;
    }

    /**
     * Gets finance messages from the Billing Issues block (`#finance_issues_block` → `#billing-note-container`).
     * billing.php:828-837 — `build_finance_messages_by_type('billing', ...)`.
     * @author AI Agent
     * @created 2026-06-03
     */
    async getBillingIssuesMessages(): Promise<string[]> {
        await this.scrollBillingIssuesBlockIntoView();
        const count = await this.billingIssuesMessagesList_LOC.count();
        const messages: string[] = [];
        for (let i = 0; i < count; i++) {
            const text = await this.billingIssuesMessagesList_LOC.nth(i).textContent();
            if (text?.trim()) {
                messages.push(text.trim());
            }
        }
        return messages;
    }

    /**
     * Finds a message in the Billing Issues Messages list containing the given text (case-insensitive).
     * Use for Expected validations after reload on View Billing (e.g. carrier over-invoiced in `#billing-note-container`).
     * @author AI Agent
     * @created 2026-06-03
     * @param searchText - Substring to match (e.g. {@link FINANCE_MESSAGES.CARRIER_OVER_INVOICED})
     */
    async findBillingIssuesMessageContaining(searchText: string): Promise<string | null> {
        const messages = await this.getBillingIssuesMessages();
        const match = messages.find((msg) => msg.toLowerCase().includes(searchText.toLowerCase()));
        return match ?? null;
    }

    /**
     * Expected price difference under Billing Issues = total carrier invoice amount(s) − flat carrier rate.
     * billing.php `#billing-note-container` — e.g. BT-97804 Expected (700 − 600 = 100).
     * @author AI Agent
     * @created 2026-06-15
     * @param carrierRate - Flat carrier rate from load (testData.carrierRate)
     * @param invoiceAmounts - One or more carrier invoice amounts (testData.carrierInvoiceAmount*)
     * @returns Absolute price difference in dollars
     */
    calculateExpectedBillingIssuesPriceDifference(
        carrierRate: string,
        invoiceAmounts: string[],
    ): number {
        const totalInvoiced = invoiceAmounts.reduce(
            (sum, amount) => sum + parseFloat(String(amount).replace(/,/g, "")),
            0,
        );
        const charges = parseFloat(String(carrierRate).replace(/,/g, ""));
        return Math.abs(totalInvoiced - charges);
    }

    /**
     * Reads the price-difference dollar value from Billing Issues messages (`#billing-note-container`).
     * @author AI Agent
     * @created 2026-06-15
     * @returns Parsed dollar amount from the first matching message, or null if none found
     */
    async getBillingIssuesPriceDifferenceDisplayValue(): Promise<number | null> {
        const messages = await this.getBillingIssuesMessages();
        for (const msg of messages) {
            const value = commonReusables.extractDollarValue(msg);
            if (value !== null) {
                return value;
            }
        }
        return null;
    }

    /**
     * Clicks Payables "View History" link and returns the popup Page.
     * Scoped to `div[id^='payables-note-container_']` — `show_payables_messages_and_toggle_history`.
     * @author AI Agent
     * @created 17-Mar-2026
     */
    async clickPayablesViewHistoryAndGetPopup(): Promise<import('@playwright/test').Page> {
        await this.payablesViewHistoryLink_LOC.scrollIntoViewIfNeeded();
        await this.payablesViewHistoryLink_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });

        const [historyPopup] = await Promise.all([
            this.page.context().waitForEvent('page'),
            this.payablesViewHistoryLink_LOC.click(),
        ]);
        await historyPopup.waitForLoadState("domcontentloaded", { timeout: WAIT.LARGE });
        await commonReusables.waitForAllLoadStates(historyPopup);
        console.log("Payables View History popup window opened");
        return historyPopup;
    }

    /**
     * Clicks Billing Issues "View History" in `#billing-note-container` and returns the popup Page.
     * billing.php — `show_billing_messages_history`.
     * @author AI Agent
     * @created 2026-06-03
     */
    async clickBillingIssuesViewHistoryAndGetPopup(): Promise<import('@playwright/test').Page> {
        await this.scrollBillingIssuesBlockIntoView();
        await this.billingIssuesViewHistoryLink_LOC.scrollIntoViewIfNeeded();
        await this.billingIssuesViewHistoryLink_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });

        const [billingIssuesHistoryPopup] = await Promise.all([
            this.page.context().waitForEvent('page'),
            this.billingIssuesViewHistoryLink_LOC.click(),
        ]);
        await billingIssuesHistoryPopup.waitForLoadState("domcontentloaded", { timeout: WAIT.LARGE });
        await commonReusables.waitForAllLoadStates(billingIssuesHistoryPopup);
        console.log("Billing Issues View History popup window opened");
        return billingIssuesHistoryPopup;
    }

    /** @deprecated Use {@link clickPayablesViewHistoryAndGetPopup} */
    async clickViewHistoryAndGetPopup(): Promise<import('@playwright/test').Page> {
        return this.clickPayablesViewHistoryAndGetPopup();
    }

    /**
     * Parses one Billing Issues View History data row (`table.hist tr:has(td)`).
     * billing.php: User, attachment time, Message, Inactive Date (last column).
     * Newest over-invoice rows append at the bottom; prior row Inactive Date is set in the last column.
     * @author AI Agent
     * @created 2026-06-01
     * @param row - A data row locator inside the View History popup
     */
    private async parseBillingIssuesViewHistoryDataRow(
        row: Locator
    ): Promise<{ message: string; user: string; attachmentTime: string; inactiveDate: string }> {
        const cells = row.locator('td');
        const cellCount = await cells.count();
        if (cellCount < 2) {
            throw new Error(`Billing Issues View History row has insufficient columns: ${cellCount}`);
        }

        const inactiveIdx = cellCount - 1;
        const messageIdx = cellCount - 2;
        const inactiveDate = ((await cells.nth(inactiveIdx).innerText()) || '').trim();
        const message = ((await cells.nth(messageIdx).innerText()) || '').trim();
        const user = ((await cells.nth(1).innerText()) || '').trim();

        // Time column sits between User and Message when table has 4+ data cells (e.g. 5-column hist).
        let attachmentTime = '';
        if (cellCount >= 4 && messageIdx > 2) {
            attachmentTime = ((await cells.nth(2).innerText()) || '').trim();
        }

        console.log(
            `Billing Issues View History row: user=${user}, time=${attachmentTime}, message=${message}, inactiveDate=${inactiveDate}`
        );
        return { message, user, attachmentTime, inactiveDate };
    }

    /**
     * Reads the message text from the second-to-last column of the last data row in
     * Billing Issues View History popup (`table.hist`).
     * @author AI Agent
     * @created 2026-06-03
     * @param billingIssuesHistoryPopup - Page returned by {@link clickBillingIssuesViewHistoryAndGetPopup}
     */
    async readViewHistoryLastRowMessage(billingIssuesHistoryPopup: import('@playwright/test').Page): Promise<string> {
        const dataRows = billingIssuesHistoryPopup.locator(this.BILLING_ISSUES_HISTORY_TABLE_DATA_ROWS_SELECTOR);
        await dataRows.first().waitFor({ state: 'attached', timeout: WAIT.LARGE });
        const lastRow = dataRows.last();
        const row = await this.parseBillingIssuesViewHistoryDataRow(lastRow);
        console.log(`Billing Issues View History last row message: ${row.message}`);
        return row.message;
    }

    /**
     * Opens Billing Issues View History (`#billing-note-container`), reads the message from the
     * second-to-last column of the last table row, closes popup.
     * Uses {@link billingIssuesViewHistoryLink_LOC} → `show_billing_messages_history`.
     * @author AI Agent
     * @created 2026-06-03
     */
    async getViewHistoryLastRowMessage(): Promise<string> {
        const billingIssuesHistoryPopup = await this.clickBillingIssuesViewHistoryAndGetPopup();
        try {
            return await this.readViewHistoryLastRowMessage(billingIssuesHistoryPopup);
        } finally {
            await billingIssuesHistoryPopup.close();
            await this.page.bringToFront();
        }
    }

    /**
     * Reads the first {@link expectedRowCount} data rows from Billing Issues View History popup (`table.hist`).
     * Uses the same column parsing as {@link readViewHistoryLastRowMessage}.
     * @author AI Agent
     * @created 2026-06-01
     * @param billingIssuesHistoryPopup - Page returned by {@link clickBillingIssuesViewHistoryAndGetPopup}
     * @param expectedRowCount - Number of history entries to read (must match table row count)
     */
    async readViewHistoryRows(
        billingIssuesHistoryPopup: import('@playwright/test').Page,
        expectedRowCount: number
    ): Promise<Array<{ message: string; user: string; attachmentTime: string; inactiveDate: string }>> {
        const dataRows = billingIssuesHistoryPopup.locator(this.BILLING_ISSUES_HISTORY_TABLE_DATA_ROWS_SELECTOR);
        await dataRows.first().waitFor({ state: 'attached', timeout: WAIT.LARGE });
        const rowCount = await dataRows.count();
        if (rowCount !== expectedRowCount) {
            throw new Error(
                `Billing Issues View History: expected ${expectedRowCount} row(s), found ${rowCount}`
            );
        }
        const rows: Array<{ message: string; user: string; attachmentTime: string; inactiveDate: string }> =
            [];
        for (let i = 0; i < expectedRowCount; i++) {
            rows.push(await this.parseBillingIssuesViewHistoryDataRow(dataRows.nth(i)));
        }
        console.log(`Billing Issues View History: read ${rows.length} row(s)`);
        return rows;
    }

    /**
     * Opens Billing Issues View History via {@link billingIssuesViewHistoryLink_LOC},
     * reads {@link expectedRowCount} table rows, closes popup, and restores billing page focus.
     * @author AI Agent
     * @created 2026-06-01
     * @param expectedRowCount - Number of history entries expected in the popup
     */
    async getViewHistoryRows(
        expectedRowCount: number
    ): Promise<Array<{ message: string; user: string; attachmentTime: string; inactiveDate: string }>> {
        const billingIssuesHistoryPopup = await this.clickBillingIssuesViewHistoryAndGetPopup();
        try {
            return await this.readViewHistoryRows(billingIssuesHistoryPopup, expectedRowCount);
        } finally {
            await billingIssuesHistoryPopup.close();
            await this.page.bringToFront();
        }
    }
    /**
     * Checks whether the "Not Deliv. Final" checkbox is checked.
     * Uses Playwright's isChecked() on the actual #Delivs input element.
     * @author AI Agent
     * @created 17-Mar-2026
     */
    async isNotDeliveredFinalChecked(): Promise<boolean> {
        try {
            // #Delivs is a hidden input (class hide-ck) — wait for attached, not visible
            await this.notDeliveredFinalCheckbox_LOC.waitFor({ state: "attached", timeout: WAIT.DEFAULT });
            const checked = await this.notDeliveredFinalCheckbox_LOC.isChecked();
            console.log(`Not Deliv. Final checkbox is ${checked ? 'checked' : 'unchecked'}`);
            return checked;
        } catch (err) {
            console.error(`isNotDeliveredFinalChecked: ${(err as Error).message}`);
            throw err;
        }
    }

    /**
     * Checks whether the Price Difference checkbox (`#Differences`) is checked on View Billing.
     * billing.php:741 — `id="Differences"` / `value="price"`.
     * @author AI Agent
     * @created 2026-06-03
     */
    async isPriceDifferenceChecked(): Promise<boolean> {
        try {
            await this.priceDifferenceCheckbox_LOC.waitFor({ state: "attached", timeout: WAIT.DEFAULT });
            const checked = await this.priceDifferenceCheckbox_LOC.isChecked();
            console.log(`Price Difference checkbox is ${checked ? "checked" : "unchecked"}`);
            return checked;
        } catch (err) {
            console.error(`isPriceDifferenceChecked: ${(err as Error).message}`);
            throw err;
        }
    }

    /**
     * Checks whether ANY billing issue checkbox in the #finance_issues_block is checked.
     * Returns true if all are unchecked, false if any is checked.
     * @author AI Agent
     * @created 28-Apr-2026
     */
    async areNoBillingIssuesChecked(): Promise<boolean> {
        await this.allBillingIssueCheckboxes_LOC.first().waitFor({ state: "attached", timeout: WAIT.DEFAULT });
        const checkboxes = await this.allBillingIssueCheckboxes_LOC.all();
        for (const cb of checkboxes) {
            if (await cb.isChecked()) return false;
        }
        return true;
    }

    /**
     * Clicks the "Lumper" checkbox label in Missing Paperwork section.
     * Caller is responsible for pre/post state; use {@link ensureLumperChecked} to check idempotently.
     * @author AI Agent
     * @created 28-Apr-2026
     */
    async clickLumperCheckbox(): Promise<void> {
        await this.lumperLabel_LOC.scrollIntoViewIfNeeded();
        await this.lumperLabel_LOC.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
     * Ensures the "Lumper" Missing Paperwork checkbox is checked (idempotent).
     * billing.php — Lumper missing-paperwork checkbox.
     * @author AI Agent
     * @created 2026-06-11
     */
    async ensureLumperChecked(): Promise<void> {
        if (!(await this.isLumperChecked())) {
            await this.clickLumperCheckbox();
        }
        await expect(this.lumperCheckbox_LOC).toBeChecked({ timeout: WAIT.DEFAULT });
    }

    /**
     * Checks whether the "Lumper" checkbox is checked.
     * @author AI Agent
     * @created 28-Apr-2026
     */
    async isLumperChecked(): Promise<boolean> {
        await this.lumperCheckbox_LOC.waitFor({ state: "attached", timeout: WAIT.DEFAULT });
        return this.lumperCheckbox_LOC.isChecked();
    }

    /**
     * Clicks the "Miscellaneous" checkbox label in Missing Paperwork section.
     * billing.php — `#Miscellaneouss` / `value="mpw"`.
     * Caller is responsible for pre/post state; use {@link ensureMiscellaneousChecked} to check idempotently.
     * @author AI Agent
     * @created 2026-06-04
     */
    async clickMiscellaneousCheckbox(): Promise<void> {
        await this.miscellaneousLabel_LOC.scrollIntoViewIfNeeded();
        await this.miscellaneousLabel_LOC.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
     * Ensures the "Miscellaneous" Missing Paperwork checkbox is checked (idempotent).
     * billing.php — `#Miscellaneouss` / `value="mpw"`.
     * @author AI Agent
     * @created 2026-06-11
     */
    async ensureMiscellaneousChecked(): Promise<void> {
        if (!(await this.isMiscellaneousChecked())) {
            await this.clickMiscellaneousCheckbox();
        }
        await expect(this.miscellaneousCheckbox_LOC).toBeChecked({ timeout: WAIT.DEFAULT });
    }

    /**
     * Checks whether the "Miscellaneous" Missing Paperwork checkbox is checked.
     * @author AI Agent
     * @created 2026-06-04
     */
    async isMiscellaneousChecked(): Promise<boolean> {
        await this.miscellaneousCheckbox_LOC.waitFor({ state: "attached", timeout: WAIT.DEFAULT });
        return this.miscellaneousCheckbox_LOC.isChecked();
    }

    /**
     * Clicks the "OS/D" checkbox label in Billing Issues section.
     * billing.php — `div#loadsh_fi_block_osd` → `label[for='OSD1'].ckb`.
     * @author AI Agent
     * @created 2026-06-17
     */
    async clickOsdCheckbox(): Promise<void> {
        await this.osdLabel_LOC.scrollIntoViewIfNeeded();
        await this.osdLabel_LOC.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
     * Ensures the "OS/D" Billing Issues checkbox is checked (idempotent).
     * billing.php — `div#loadsh_fi_block_osd` → `input#OSD1` (value `osd`).
     * @author AI Agent
     * @created 2026-06-17
     */
    async ensureOsdChecked(): Promise<void> {
        if (!(await this.isOsdChecked())) {
            await this.clickOsdCheckbox();
        }
        await expect(this.osdCheckbox_LOC).toBeChecked({ timeout: WAIT.DEFAULT });
    }

    /**
     * Checks whether the "OS/D" Billing Issues checkbox is checked.
     * @author AI Agent
     * @created 2026-06-17
     * @returns True when the OS/D checkbox is checked
     */
    async isOsdChecked(): Promise<boolean> {
        await this.osdCheckbox_LOC.waitFor({ state: "attached", timeout: WAIT.DEFAULT });
        return this.osdCheckbox_LOC.isChecked();
    }

    /**
     * Extracts a dollar value from a string. Matches patterns like $1,500.00, $900, $2,000.00, etc.
     * Delegates to commonReusables.extractDollarValue().
     * @param text - The text to extract the dollar value from
     * @returns The extracted numeric dollar value, or null
     * @author AI Agent
     * @created 07-Apr-2026
     * @deprecated Use commonReusables.extractDollarValue() directly
     */
    extractDollarValue(text: string): number | null {
        return commonReusables.extractDollarValue(text);
    }

    /**
     * Reads the price-difference message from View History: second-to-last data row, last column.
     * Last row is typically a toggle audit entry (e.g. payables_waiting_on); the row above holds
     * text like "XPO TRANS INC invoiced $2,900.00 over the total charge" in the rightmost cell.
     *
     * Expected price difference = Total Invoices - MODE Global Total Charges (carrier rate)
     *
     * @param totalCharges - The total charges on the load (carrier rate from testData)
     * @param invoiceAmounts - Array of invoice amount strings (from testData)
     * @returns Object with lastMessage, extracted priceDifference, and expectedPriceDiff
     * @author AI Agent
     * @created 07-Apr-2026
     */
    async validateViewHistoryPriceDifference(
        totalCharges: string,
        invoiceAmounts: string[]
    ): Promise<{ lastMessage: string; priceDifference: number | null; expectedPriceDiff: number }> {
        const charges = parseFloat(totalCharges.replace(/,/g, ''));
        const totalInvoiced = invoiceAmounts.reduce((sum, a) => sum + parseFloat(a.replace(/,/g, '')), 0);
        const expectedPriceDiff = Math.abs(totalInvoiced - charges);
        console.log(`Expected price diff: Total Invoices(${totalInvoiced}) - Total Charges(${charges}) = ${expectedPriceDiff}`);

        const payablesHistoryPopup = await this.clickPayablesViewHistoryAndGetPopup();
        const dataRows = payablesHistoryPopup.locator(this.PAYABLES_HISTORY_TABLE_DATA_ROWS_SELECTOR);
        await dataRows.first().waitFor({ state: 'attached', timeout: WAIT.LARGE });
        const rowCount = await dataRows.count();
        if (rowCount < 2) {
            throw new Error(`View History: expected at least 2 data rows, found ${rowCount}`);
        }

        const priceRow = dataRows.nth(rowCount - 2);
        const priceDiffCell = priceRow.locator('td').last();
        await priceDiffCell.waitFor({ state: 'attached', timeout: WAIT.LARGE });
        let lastMessage = ((await priceDiffCell.innerText()) || '').trim();
        let priceDifference = this.extractDollarValue(lastMessage);

        // Some builds add Inactive Date as a 5th column (empty on price rows); Message is then 4th.
        if (priceDifference === null) {
            const messageCell = priceRow.locator('td').nth(3);
            lastMessage = ((await messageCell.innerText()) || '').trim();
            priceDifference = this.extractDollarValue(lastMessage);
            console.log(`View History second-last row, Message column (fallback): "${lastMessage}"`);
        } else {
            console.log(`View History second-last row, last column: "${lastMessage}"`);
        }
        if (priceDifference === null) {
            console.log('No dollar amount parsed from second-last row');
        }

        await payablesHistoryPopup.close();
        await this.page.bringToFront();
        console.log(`Extracted price difference: ${priceDifference}, expected: ${expectedPriceDiff}`);

        return { lastMessage, priceDifference, expectedPriceDiff };
    }

    /**
     * Gets the carrier payable status from the status dropdown (first carrier).
     * Reads the selected option text (e.g., "Invoice Received", "Pending").
     * Locator: select[id^='carr_'][id$='_post_status'] (billing.php:2187)
     * @author AI Agent
     * @created 2026-04-23
     * @returns The selected payable status text.
     */
    async getCarrierPayableStatus(): Promise<string> {
        await this.carrierPayableStatusSelect_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        const selectedText = await this.carrierPayableStatusSelect_LOC.evaluate(
            (el: HTMLSelectElement) => el.options[el.selectedIndex]?.textContent?.trim() ?? ''
        );
        console.log(`Carrier payable status: ${selectedText}`);
        return selectedText;
    }

    /**
     * Gets the carrier remainder (balance) amount from the Carrier Charges section.
     * Locator: span[id^='carr_'][id$='_carr_balance'] (billing.php:2087)
     * @author AI Agent
     * @created 2026-04-23
     * @returns The remainder amount as a number (e.g., 600.00).
     */
    async getCarrierRemainderAmount(): Promise<number> {
        await this.carrierRemainderAmount_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        const text = await this.carrierRemainderAmount_LOC.textContent();
        const amount = parseFloat((text ?? '').replace(/[$,]/g, ''));
        console.log(`Carrier remainder amount: ${amount}`);
        return amount;
    }

    /**
     * Gets the total invoices amount from the Carrier Invoices section.
     * Locator: //span[pmt-label 'Total Invoices']/following-sibling::span (billing.php:2819-2821)
     * @author AI Agent
     * @created 2026-04-23
     * @returns The total invoices amount as a number (e.g., 600.00).
     */
    async getCarrierTotalInvoicesAmount(): Promise<number> {
        await this.carrierTotalInvoicesAmount_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        const text = await this.carrierTotalInvoicesAmount_LOC.textContent();
        const amount = parseFloat((text ?? '').replace(/[$,]/g, ''));
        console.log(`Carrier total invoices amount: ${amount}`);
        return amount;
    }

    /**
     * Reads the currently selected Payable Reason from the carrier vendor-invoice reason
     * `<select>` in the Payables section on View Billing. Returns the selected option's
     * visible text (falling back to its `value` attribute) so any reason can be validated
     * dynamically — not just Short Pay variants.
     * @returns trimmed selected option text (empty string if no option is selected)
     * @author AI Agent
     * @created 2026-06-01
     */
    async getPayableReasonDisplayValue(): Promise<string> {
        const select = this.payableReasonDisplay_LOC.first();
        await select.waitFor({ state: "attached", timeout: WAIT.LARGE });
        // Prefer the selected <option>'s text; fall back to inputValue (the value attribute).
        const selectedText = (
            (await select.locator("option:checked").first().textContent()) || ""
        ).trim();
        const text = selectedText.length ? selectedText : (await select.inputValue()).trim();
        console.log(`Payable Reason: '${text}'`);
        return text;
    }

    /**
 * Reads the Payables ↔ Agent toggle on the Unassigned Invoice (EDI 210) exception panel.
 * The switch is a checkbox sandwiched between the two labels:
 *   <label id="payables">Payables</label>
 *   <input type="checkbox" id="checkbox_id_<exceptionId>" checked value="on">
 *   <label id="Agent" value="1">Agent</label>
 *
 * checked  → Agent
 * unchecked → Payables
 *
 * @author AI Agent
 * @created 2026-06-22
 * @returns PAYABLES_TOGGLE_VALUE.AGENT | PAYABLES_TOGGLE_VALUE.PAYABLES
 */
async getUnassignedInvoicePayablesToggleValue(): Promise<string> {
    const toggleCheckbox = this.unassignedTabToggleCheckbox;
    await toggleCheckbox.waitFor({ state: "attached", timeout: WAIT.LARGE });

    const isChecked = await toggleCheckbox.isChecked();
    const toggleValue = isChecked
        ? PAYABLES_TOGGLE_VALUE.AGENT
        : PAYABLES_TOGGLE_VALUE.PAYABLES;

    console.log(`Unassigned Invoice toggle: ${toggleValue} (checked=${isChecked})`);
    return toggleValue;
}
}
export default LoadBillingPage;