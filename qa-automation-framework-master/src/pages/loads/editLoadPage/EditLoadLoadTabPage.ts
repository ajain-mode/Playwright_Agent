/**
 * EditLoadLoadTabPage - Page Object Model for Load Tab in Edit Load Page
 * 
 * @description This class handles all interactions with the Load tab elements
 * in the Edit Load page, including rate card selection and load creation functionality.
 * 
 * @author Deepak Bohra
 * @modified 2025-07-28 //Just remove the extra space
 */

import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

class EditLoadLoadTabPage {
    private readonly rateCardLoadSubTabDropdown_LOC: Locator;
    private readonly loadTab_LOC: Locator;
    private readonly saveButton_LOC: Locator;
    private readonly createLoadButton_LOC: Locator;
    private readonly autoLoadTenderCheckbox_LOC: Locator;
    private readonly loadStatusDropdown_LOC: Locator;
    private readonly allowAutoStatusUpdateCheckbox: Locator;
    private readonly internalShareTable_LOC: Locator;
    private readonly internalShareAmountInput_LOC: Locator;
    private readonly internalShareAgentDropDown_LOC: Locator;
    private readonly carrierTotalValue_LOC: Locator;
    private readonly customerTotalValue_LOC: Locator;

    private readonly dispatchLoadCheck_LOC: Locator;
    private readonly profitMarginValue_LOC: Locator;
    private readonly closeMarginButton_LOC: Locator;
    private readonly marginCalculatorButton_LOC: Locator;
    private readonly saveMarginAndCloseButton_LOC: Locator;
    private readonly profitPercentage_LOC: Locator;
    private readonly profitAmountVALUE_LOC: Locator;
    private readonly profitPercentageVALUE_LOC: Locator;
    private readonly marginInput: (margin: string) => Locator;
    private readonly poNumberInput_LOC: Locator;
    private readonly blNumberInput_LOC: Locator;
    private readonly shipNumberInput_LOC: Locator;
    private readonly custRefNumberInput_LOC: Locator;
    private readonly containerCodeInput_LOC: Locator;
    private readonly containerNumberInput_LOC: Locator;
    private readonly datContactPrefLabel_LOC: Locator;
    private readonly datContactPrefSelect_LOC: Locator;
    private readonly dispatchNotesTextbox_LOC: Locator;
    private readonly financeNotesTextbox_LOC: Locator;


    constructor(private page: Page) {
        this.rateCardLoadSubTabDropdown_LOC = this.page.locator("#load_rate_type_select");
        this.loadTab_LOC = this.page.locator("//*[text()='Load']");
        this.saveButton_LOC = page.locator("//td[contains(text(),'Edit Load')]/following-sibling::td//input[@id='saveButton']");
        this.createLoadButton_LOC = this.page.locator("//*[text()='Enter New Load']//parent::tr//input[@value='Create Load']");
        this.autoLoadTenderCheckbox_LOC = this.page.locator("#loadsh_auto_edi204");
        this.loadStatusDropdown_LOC = this.page.locator("//select[@id='loadsh_status']");
        this.allowAutoStatusUpdateCheckbox = this.page.locator("#fk_auto_load_status_update");
        this.internalShareTable_LOC = this.page.locator("//b[text()='Internal Shares']/ancestor::table[contains(@class,'share_parent_internal')]");
        this.internalShareAmountInput_LOC = this.page.locator("//tbody[@id='share_frame_internal']//input[@name='commission_internal[amount][]']");
        this.internalShareAgentDropDown_LOC = this.page.locator("//tbody[@id='share_frame_internal']//select[@name='commission_internal[agent_id][]']")
        this.carrierTotalValue_LOC = this.page.locator("#dyn_carr_total");
        this.customerTotalValue_LOC = this.page.locator("#dyn_cust_total");

        this.dispatchLoadCheck_LOC = page.locator("#loadsh_eltl_send");
        this.profitMarginValue_LOC = page.locator("#dyn_profit");
        this.closeMarginButton_LOC = page.locator("//tr[td[@style='text-align:center;background:#cccccc;padding:10px !important;']]//input[@value='Cancel']");
        this.marginCalculatorButton_LOC = page.locator("//input[@value='Margin Calculator']");
        this.saveMarginAndCloseButton_LOC = page.locator("input[value='Save Margin & Close']");
        this.profitPercentage_LOC = page.locator("#dyn_propct");
        this.profitAmountVALUE_LOC = page.locator("#dyn_profit");
        this.profitPercentageVALUE_LOC = page.locator("#dyn_propct");
        this.customerTotalValue_LOC = page.locator("#dyn_cust_total");
        this.marginInput = (margin: string) => this.page.locator(`//input[@value='${margin}']`);

        this.poNumberInput_LOC = page.locator("#loadsh_cust_po");
        this.blNumberInput_LOC = page.locator("#loadsh_ship_bl");
        this.shipNumberInput_LOC = page.locator("#loadsh_cust_shipid");
        this.custRefNumberInput_LOC = page.locator("#loadsh_cust_ref");
        this.containerCodeInput_LOC = page.locator("#container_codes_loadform");
        this.containerNumberInput_LOC = page.locator("#container_num_loadform");
        this.datContactPrefLabel_LOC = this.page.locator("//td[b[normalize-space()='DAT Contact Preference']]");
        this.datContactPrefSelect_LOC = this.page.locator("//select[@id='dat_contact_pref']");

        this.dispatchNotesTextbox_LOC = page.locator("#loadsh_disp_notes");
        this.financeNotesTextbox_LOC = page.locator("#loadsh_billing_notes");
    }
    /**
     * Clicks on the Load tab to navigate to load configuration section
     * @author Deepak Bohra
     * @created : 2025-07-30
     */
    async clickLoadTab() {
        await this.loadTab_LOC.waitFor({ state: "visible" });
        await this.loadTab_LOC.click();
    }
    /**
     * Checks if the Load tab exists and is visible
     * @author Deepak Bohra
     * @created : 2025-07-30
     */
    async checkLoadTabExist() {
        await this.loadTab_LOC.waitFor({ state: "visible" });
    }
    /**
     * Clicks the Create Load button to submit the load form
     * @author Deepak Bohra
     * @created : 2025-07-30
     */
    async clickCreateLoadButton() {
        await this.page.waitForLoadState("networkidle");
        await this.createLoadButton_LOC.waitFor({ state: "visible" });
        await this.createLoadButton_LOC.click();
    }
    /**
     * Selects a rate card value from the dropdown
     * @author Deepak Bohra
     * @created : 2025-07-30
     */
    async selectRateCardValue(option: string) {
        await this.page.waitForTimeout(WAIT.DEFAULT);
        const dropdown = await this.rateCardLoadSubTabDropdown_LOC;
        const isDropdownVisible = await dropdown.isVisible();
        if (await !isDropdownVisible) {
            return;
        }
        const selectedValue = await dropdown.inputValue();
        if (await !selectedValue || selectedValue.trim() === "") {
            await dropdown.selectOption(option);
        }
    }
    async uncheckAutoLoadTenderCheckbox() {
        await this.autoLoadTenderCheckbox_LOC.waitFor({ state: "visible" });
        const isChecked = await this.autoLoadTenderCheckbox_LOC.isChecked();
        if (isChecked) {
            await this.autoLoadTenderCheckbox_LOC.click();
        }
    }
    /**
     * Enters complete Load tab details including rate card selection and tab navigation
     * @author Deepak Bohra
     * @created : 2025-07-30
     */
    async checkLoadTabDetails(rateType: string) {
        await this.clickLoadTab();
        await this.selectRateCardValue(rateType);
    }
    /**
     * Selects the load status from the dropdown
     * @author Rohit Singh
     * modified 2025-08-01
     */
    async selectLoadStatus(option: string) {
        await commonReusables.waitForPageStable(this.page);
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await this.loadStatusDropdown_LOC.waitFor({ state: "visible" });
        await this.loadStatusDropdown_LOC.selectOption(option);
    }
    /**
     * Unchecks the Allow Auto Status Update checkbox if it is checked
     * @author Rohit Singh
     * @created 2025-09-08
     */
    async checkAllowAutoStatusUpdateCheckbox() {
        await this.page.waitForLoadState("networkidle");
        await this.allowAutoStatusUpdateCheckbox.waitFor({ state: "visible" });
        const isChecked = await this.allowAutoStatusUpdateCheckbox.isChecked();
        if (!isChecked) {
            await this.allowAutoStatusUpdateCheckbox.click();
        }
    }

    /**
     * Click Load Tab Retry Function
     * @author Avanish Srivastava
     * @created 2025-09-25
     */

    async clickLoadTabRetry() {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Load tab click attempt ${attempt}/${maxRetries}`);
                await this.loadTab_LOC.waitFor({ state: "visible", timeout: 10000 });
                await this.loadTab_LOC.scrollIntoViewIfNeeded();
                if (attempt === 1) {
                    await this.loadTab_LOC.click();
                } else if (attempt === 2) {
                    console.log("Trying force click...");
                    await this.loadTab_LOC.click({ force: true });
                } else {
                    console.log("Trying JavaScript click...");
                    await this.loadTab_LOC.evaluate((element: HTMLElement) => element.click());
                }
                console.log(`Successfully clicked Load tab on attempt ${attempt}`);
                return;
            } catch (error) {
                console.log(`Attempt ${attempt} failed: ${error}`);

                if (attempt === maxRetries) {
                    throw new Error(`Load tab click failed after ${maxRetries} attempts. Last error: ${error}`);
                }
                await this.page.waitForTimeout(2000);
            }
        }
    }
    /**
     * Verifies if the Internal Shares table is visible on the Load tab
     * @author Rohit Singh
     * @created 2025-11-12
     */
    async isInternalSharesTableVisible(): Promise<boolean> {
        await this.page.waitForLoadState("networkidle");
        return await this.internalShareTable_LOC.isVisible();
    }
    /**
     * Gets the Internal Share Amount from the Load tab
     * @author Rohit Singh
     * @created 2025-11-12
     */
    async getInternalShareAmount(): Promise<string> {
        await this.page.waitForLoadState("networkidle");
        const amount = await this.internalShareAmountInput_LOC.getAttribute("value");
        return amount || '';
    }
    /**
     * Gets the Internal Share Agent from the Load tab
     * @author Rohit Singh
     * @created 2025-11-12
     */
    async getInternalShareAgent(): Promise<string> {
        await this.page.waitForLoadState("networkidle");
        const selectedOption = await this.internalShareAgentDropDown_LOC.locator('option[selected]');
        const selectedText = await selectedOption.textContent();
        return selectedText?.trim() || '';
    }

    /**
 * Verifies that the carrier total value is not zero
 * @author Aniket Nale
 * @created 08-Dec-25
 */

    async verifyCarrierTotalValueIsNotZero(): Promise<void> {
        // Wait for value to be visible
        await expect(this.carrierTotalValue_LOC.first()).toBeVisible({
            timeout: WAIT.MID,
        });

        const text = await this.carrierTotalValue_LOC.first().textContent();
        const value = parseFloat(text?.replace(/[^\d.-]/g, "") || "0");

        // Expect value > 0
        expect(value).toBeGreaterThan(0);

        console.log(`Verified carrier total value is non-zero: ${value}`);
    }

    /**
 * Verifies that the customer total value is not zero
 * @author Aniket Nale
 * @created 08-Dec-25
 */

    async verifyCustomerTotalValueIsNotZero(): Promise<void> {
        // Wait for value to be visible
        await expect(this.customerTotalValue_LOC.first()).toBeVisible({
            timeout: WAIT.MID,
        });

        const text = await this.customerTotalValue_LOC.first().textContent();
        const value = parseFloat(text?.replace(/[^\d.-]/g, "") || "0");

        // Expect value > 0
        expect(value).toBeGreaterThan(0);

        console.log(`Verified customer total value is non-zero: ${value}`);
    }

    /**
     * Click on the dispatch Load checkbox.
     * @author Aniket Nale
     * @created 2025-10-07
     */
    async clickOnDispatchLoadCheck() {
        await this.dispatchLoadCheck_LOC.waitFor({ state: "visible" });
        await this.dispatchLoadCheck_LOC.check();

        const isChecked = await this.dispatchLoadCheck_LOC.isChecked();
        console.log(`Dispatch Load Check is ${isChecked ? "checked" : "unchecked"}`);

        await this.page.waitForLoadState("domcontentloaded");
        await this.page.waitForLoadState("networkidle");

        const isSaveEnabled = await this.saveButton_LOC.isEnabled();
        console.log(`Save Button is ${isSaveEnabled ? "enabled" : "disabled"}`);

        if (!isSaveEnabled) {
            console.log("Save button not enabled. Rechecking Dispatch Load...");
            await this.dispatchLoadCheck_LOC.uncheck();
            await this.page.waitForTimeout(500); // small delay to allow UI refresh
            await this.dispatchLoadCheck_LOC.check();
            console.log("Rechecked Dispatch Load Check");

            const retrySaveEnabled = await this.saveButton_LOC.isEnabled();
            console.log(`After retry, Save Button is ${retrySaveEnabled ? "enabled" : "disabled"}`);
        }
    }

    /**
    * Valid margin for flat rate uplift
    * @author Aniket Nale
    * @created 2025-10-07
    */
    async validateProfitMarginFlat() {
        await this.profitMarginValue_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        let profitText = (await this.profitMarginValue_LOC.textContent())?.trim();
        if (!profitText) {
            throw new Error("Profit margin element not found or has no text content");
        }
        profitText = profitText.replace(/[^\d.]/g, '');
        const profit = parseFloat(profitText);
        if (isNaN(profit)) {
            throw new Error(`Profit value is not a number: "${profitText}"`);
        }
        console.log(`Profit displayed: ${profit}`);
        // expect(profit).toBeCloseTo(100, -1);
        expect(profit).toBeGreaterThanOrEqual(99);
        expect(profit).toBeLessThanOrEqual(100);
    }

    async closeMarginPopupIfVisible() {
        try {
            await this.page.waitForLoadState("domcontentloaded");
            await this.page.waitForLoadState("networkidle");

            const popupAppeared = await this.closeMarginButton_LOC.isVisible({ timeout: WAIT.SMALL });

            if (popupAppeared) {
                await this.closeMarginButton_LOC.click();
                console.log("Closed margin popup");
            } else {
                console.log("Margin popup not present");
            }
        } catch (error) {
            if (error instanceof Error) {
                console.log("Failed to close margin popup:", error.message);
            } else {
                console.log("Failed to close margin popup: Unknown error", error);
            }
        }
    }

    /**
    * validate margin for PCT rate uplift
    * @author Aniket Nale
    * @created 2025-10-15
    */
    async validateProfitMarginPCT() {
        await this.profitAmountVALUE_LOC.waitFor({ state: 'visible' });
        await this.profitPercentageVALUE_LOC.waitFor({ state: 'visible' });

        const profitText = await this.profitAmountVALUE_LOC.textContent();
        const profitPctText = await this.profitPercentageVALUE_LOC.textContent();

        const profitValue = parseFloat(profitText?.replace(/[^\d.-]/g, '') || '0');
        const profitPctValue = parseFloat(profitPctText?.replace(/[^\d.-]/g, '') || '0');

        console.log(`Profit: ${profitValue}, Profit %: ${profitPctValue}`);

        expect(profitValue).toBeGreaterThan(0);
        expect(profitPctValue).toBeGreaterThan(0);
    }

    /**
    * click on Margin Calculator button
    * @author Aniket Nale
    * @created 2025-10-14
    */
    async clickOnMarginCalculator() {
        await this.page.waitForLoadState("networkidle");
        await this.marginCalculatorButton_LOC.waitFor({ state: "visible", timeout: WAIT.SMALL });
        await this.marginCalculatorButton_LOC.click();
        await this.page.waitForLoadState("networkidle");
    }
    /**
    * specify margin percentage
    * @author Aniket Nale
    * @created 2025-10-14
    */
    async specifyMarginPercentage(value: string) {
        await this.marginInput(value).click();
    }
    /**
    * Click on Save Margin & Close button
    * @author Aniket Nale
    * @created 2025-10-14
    */
    async saveMarginAndClose() {
        await this.page.waitForLoadState("networkidle");
        await this.saveMarginAndCloseButton_LOC.waitFor({ state: "visible", timeout: WAIT.SMALL });
        await this.saveMarginAndCloseButton_LOC.click();
        await this.page.waitForLoadState("networkidle");
    }
    /**
    * Verify profit percentage value after save
    * @author Aniket Nale
    * @created 2025-10-14
    */
    async verifyProfitPercentage(value: string) {
        await expect(this.profitPercentage_LOC).toHaveText(value);
    }
    /**
    * Verify customer total is zero
    * @author Aniket Nale
    * @created 2025-10-15
    */
    async verifyCustomerTotalIsZero() {
        await this.customerTotalValue_LOC.waitFor({ state: 'visible' });
        const custTotalText = await this.customerTotalValue_LOC.textContent();
        const custTotalValue = parseFloat(custTotalText?.replace(/[^\d.-]/g, '') || '0');
        expect(custTotalValue).toBe(0);
    }
    /**
     * Enter PO Number in Load Tab
     * @author Rohit Singh
     * @created 22-Dev-2025
     * @param poNumber - PO Number to be entered
     */
    async enterPONumber(poNumber: string) {
        await this.poNumberInput_LOC.waitFor({ state: "visible" });
        await this.poNumberInput_LOC.fill(poNumber);
    }
    /**
     * Enter BL Number in Load Tab
     * @author Rohit Singh
     * @created 22-Dec-2025
     * @param blNumber - BL Number to be entered
     */
    async enterBLNumber(blNumber: string) {
        await this.blNumberInput_LOC.waitFor({ state: "visible" });
        await this.blNumberInput_LOC.fill(blNumber);
    }
    /**
     * Enter Ship Number in Load Tab
     * @author Rohit Singh
     * @created 22-Dec-2025 
     * @param shipNumber - Ship Number to be entered
     */
    async enterShipNumber(shipNumber: string) {
        await this.shipNumberInput_LOC.waitFor({ state: "visible" });
        await this.shipNumberInput_LOC.fill(shipNumber);
    }
    /**
     * Enter Customer Reference Number in Load Tab
     * @author Rohit Singh
     * @created 22-Dec-2025
     * @param custRefNumber - Customer Reference Number to be entered 
     */
    async enterCustRefNumber(custRefNumber: string) {
        await this.custRefNumberInput_LOC.waitFor({ state: "visible" });
        await this.custRefNumberInput_LOC.fill(custRefNumber);
    }
    /**
     * Enter Container Code in Load Tab
     * @author Rohit Singh
     * @created 22-Dec-2025
     * @param containerCode - Container Code to be entered
     * @param containerNumber - Container Number to be entered
     */
    async enterContainerDetails(containerCode: string, containerNumber: string) {
        await this.containerCodeInput_LOC.waitFor({ state: "visible" });
        await this.containerCodeInput_LOC.fill(containerCode);
        await this.containerNumberInput_LOC.fill(containerNumber);
    }

    /**
     * Normalizes text by replacing non-breaking spaces and trimming whitespace. [Replace &nbsp; and trim whitespace]
     * @author Mukul Khan
     * @created 2026-01-16
     */
    private normalizeText(s?: string | null): string {
        return (s ?? '').replace(/\u00a0/g, ' ').trim();
    }

    /**
     * Gets the option labels available in the DAT Contact Preference dropdown.
     * @author Mukul Khan
     * @created 2026-01-16
     */
    private async getDatContactPrefOptionLabels(): Promise<string[]> {
        const texts = await this.datContactPrefSelect_LOC.locator('option').allInnerTexts();
        return texts.map(t => this.normalizeText(t));
    }

    /**
     * Verifies that:
     * -"DAT Contact Preference" label and select are visible
     * -Options are exactly: Primary Phone, Alternate Phone, Email
     * @author Mukul Khan
     */
    async verifyDatContactPreference(): Promise<void> {
        const expectedOptions = [
            DAT_CONTACT_PREF.PRIMARY_PHONE,
            DAT_CONTACT_PREF.ALTERNATE_PHONE,
            DAT_CONTACT_PREF.EMAIL,
        ];
        await this.datContactPrefLabel_LOC.waitFor({ state: 'visible' });
        await this.datContactPrefSelect_LOC.waitFor({ state: 'visible' });

        await expect(this.datContactPrefLabel_LOC).toBeVisible();
        await expect(this.datContactPrefSelect_LOC).toBeVisible();

        const actualLabels = await this.getDatContactPrefOptionLabels();
        console.log('DAT Contact Preference options found:', actualLabels);
        expect(actualLabels).toEqual(expectedOptions);
    }
    
    /**
     * Enter Dispatch Notes in Load Tab
     * @author Rohit Singh
     * @created 19-Dec-2026
     * @param dispatchNotes - Dispatch Notes to be entered
     */
    async enterDispatchNotes(dispatchNotes: string) {
        await this.dispatchNotesTextbox_LOC.waitFor({ state: "visible" });
        await this.dispatchNotesTextbox_LOC.fill(dispatchNotes);
        console.log(`Entered Dispatch Notes: ${dispatchNotes}`);
    }

    /**
     * Enter Finance Notes in Load Tab
     * @author Rohit Singh
     * @created 19-Dec-2026
     * @param financeNotes - Finance Notes to be entered
     */
    async enterFinanceNotes(financeNotes: string) {
        await this.financeNotesTextbox_LOC.waitFor({ state: "visible" });
        await this.financeNotesTextbox_LOC.fill(financeNotes);
        console.log(`Entered Finance Notes: ${financeNotes}`);
    }
}
export default EditLoadLoadTabPage;
