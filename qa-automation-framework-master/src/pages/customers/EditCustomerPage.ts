import { expect, Locator, Page } from "@playwright/test";

export default class EditCustomerPage {
    private readonly saveButton_LOC: Locator;
    private readonly rateTypeDropdown_LOC: Locator;
    private readonly adjustment_LOC: Locator;
    private readonly minMarkup_LOC: Locator;
    private readonly maxMarkup_LOC: Locator;
    private readonly useCustLTRateDropdown_LOC: Locator;
    private readonly addInternalShareLink_LOC: Locator;
    private readonly shareAmountInput_LOC: Locator;
    private readonly searchAgentDropDown_LOC: Locator;
    private readonly clearInternalShareButton_LOC: Locator;


    constructor(private page: Page) {
        this.saveButton_LOC = page.locator("//td[contains(text(),'Edit Customer')]/following-sibling::td//input[@value='  Save  ']");
        this.rateTypeDropdown_LOC = page.locator("#ltl_cust_rate_type");
        this.adjustment_LOC = page.locator("#ltl_cust_rate");
        this.minMarkup_LOC = page.locator("#ltl_cust_rate_min_amt");
        this.maxMarkup_LOC = page.locator("#ltl_cust_rate_max_amt");
        this.useCustLTRateDropdown_LOC = page.locator("#use_ltl_cust_rates");
        this.addInternalShareLink_LOC = page.locator("//td[text()='Internal Shares']/following-sibling::td//a[text()='Add Share']");
        this.shareAmountInput_LOC = page.locator("//div[@id='share_frame_internal']//input[@name='commission_internal[amount][]']");
        this.searchAgentDropDown_LOC = page.locator("//div[@id='share_frame_internal']//select[@name='commission_internal[agent_id][]']");
        this.clearInternalShareButton_LOC = page.locator("//div[@id='share_frame_internal']//span[text()='✖']");
    }
    /**
     * @author Rohit Singh
     * @created 2025-08-19
     * Click the save button on the edit customer page.
     */
    async clickSaveButton() {
        await this.page.waitForLoadState("networkidle");
        await this.saveButton_LOC.click();
        await this.page.waitForLoadState("networkidle");
    }
    /**
    * @author Rohit Singh
    * @created 2025-08-19
    * Validate Edit Event Status
    */
    async validateEditEventStatus(events: string[]) {
        expect.soft(events).toContain("×" + INVOICE_EVENTS.AT_ORIGIN);
        expect.soft(events).toContain("×" + INVOICE_EVENTS.PICKED_UP);
        expect.soft(events).toContain("×" + INVOICE_EVENTS.DELIVERY_APPT);
        expect.soft(events).toContain("×" + INVOICE_EVENTS.AT_DESTINATION);
        expect.soft(events).toContain("×" + INVOICE_EVENTS.DELIVERED);
        expect.soft(events).toContain("×" + INVOICE_EVENTS.DELIVERED_FINAL);
    }

    /**
    * @author Aniket Nale
    * @created 2025-10-08
    * Select flat rate
    */
    async selectFlatRate(rateType: string) {
        await this.page.waitForLoadState("networkidle");
        await this.rateTypeDropdown_LOC.click();
        await this.rateTypeDropdown_LOC.selectOption(rateType);
        await this.page.waitForLoadState("networkidle");
    }

    /**
    * @author Aniket Nale
    * @created 2025-10-15
    * Select rate adjustment.
    */
    async selectAdjustment(adjustment: string) {
        await this.page.waitForLoadState("networkidle");
        await this.adjustment_LOC.fill(adjustment);
        await this.adjustment_LOC.press("Tab");
        await this.page.waitForLoadState("networkidle");
    }

    /**
    * @author Aniket Nale
    * @created 2025-10-08
    * Select PCT rate adjustment.
    */
    async selectPCTRateAndAdjustment(rateType: string) {
        await this.page.waitForLoadState("networkidle");
        await this.rateTypeDropdown_LOC.click();
        await this.rateTypeDropdown_LOC.selectOption(rateType);
        await this.page.waitForLoadState("networkidle");

        await this.minMarkup_LOC.fill("50.00");
        await this.minMarkup_LOC.press("Tab");
        await this.page.waitForLoadState("networkidle");

        await this.maxMarkup_LOC.fill("150.00");
        await this.maxMarkup_LOC.press("Tab");
        await this.page.waitForLoadState("networkidle");
    }

    /**
    * @author Aniket Nale
    * @created 2025-10-10
    * Select Use Cust LTR Rate as YES or No dynamically.
    */
    async selectUseLTLCustRates(option: 'YES' | 'NO'): Promise<void> {
        await this.useCustLTRateDropdown_LOC.waitFor({ state: 'visible' });
        await this.useCustLTRateDropdown_LOC.selectOption({ label: option });
        await this.page.waitForLoadState("networkidle");
        const selectedValue = await this.useCustLTRateDropdown_LOC.inputValue();
        console.log(`Selected value for use_ltl_cust_rates: ${selectedValue}`);
    }
    /**
    * @author Rohit Singh
    * @created 2025-11-12
    * Click on Add Internal Share link.
    */
    async clickOnAddInternalShare(): Promise<void> {
        await this.addInternalShareLink_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await this.addInternalShareLink_LOC.click();
        await this.shareAmountInput_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
    }
    /**
    * @author Rohit Singh
    * @created 2025-11-12
    * Enter Share Amount for Internal Share.
    * @param amount - The share amount to be entered.
    * @param agentName - The name of the agent to be searched and selected.
    */
    async enterInternalShareAmount_agent(amount: any, agentName: string): Promise<void> {

        await this.shareAmountInput_LOC.scrollIntoViewIfNeeded();
        await this.shareAmountInput_LOC.fill(amount);
        // Select option that contains the agent name
        const optionToSelect = this.searchAgentDropDown_LOC.locator(`option:has-text("${agentName}")`).first();
        const optionValue = await optionToSelect.getAttribute('value');

        if (optionValue) {
            await this.searchAgentDropDown_LOC.selectOption(optionValue);
        }
    }
    /**
     * @author Rohit Singh
     * @created 2025-11-12
     * Clear Internal Share Entry
     */
    async clearInternalShareEntryandSave(): Promise<void> {
        const isVisible = await this.clearInternalShareButton_LOC.isVisible({ timeout: WAIT.SMALL });
        if (isVisible) {
            await this.clearInternalShareButton_LOC.scrollIntoViewIfNeeded();
            await this.clearInternalShareButton_LOC.click();
            console.log("Internal Share entry cleared successfully.");
        }
        await this.saveButton_LOC.click();
        await this.page.waitForLoadState("networkidle");
        console.log("Clicked on Save button after clearing Internal Share entry.");
    }
}