import { expect, Locator, Page } from "@playwright/test";

/**
 * Page Object Model for the Edit Master Customer Page.
 * Provides methods to interact with the page elements.
 * @author Rohit Singh
 * @created 13/Oct/2025
 */

class EditMasterCustomerPage {
    private readonly corpCreditLimitInput_LOC: Locator;
    private readonly saveButton_LOC: Locator;
    private readonly modeRatingEngineCheckbox_LOC: Locator;
    private readonly banyanRatingEngineCheckbox_LOC: Locator;
    private readonly banyan3RatingEngineCheckbox_LOC: Locator;
    private readonly allowVolumeQuotingCheckbox_LOC: Locator;
    private readonly enableAutoRateDropDown_LOC: Locator;
    private readonly enableAutoDispatchDropDown_LOC: Locator;
    //editMasterCustomerPage_LOC is from viewMasterCustomerPage
    private readonly editMasterCustomerPage_LOC: Locator;

    constructor(private page: Page) {
        this.corpCreditLimitInput_LOC = page.locator("input#credit_limit");
        this.saveButton_LOC = page.locator("//td[contains(text(),'Edit Master Customer')]/following-sibling::td//input[@value='  Save  ']")
        this.modeRatingEngineCheckbox_LOC = page.locator("#use_mode");
        this.banyanRatingEngineCheckbox_LOC = page.locator("#use_banyan");
        this.banyan3RatingEngineCheckbox_LOC = page.locator("#use_banyan3");
        this.allowVolumeQuotingCheckbox_LOC = page.locator("#allow_banyan_volume_quoting");
        this.enableAutoRateDropDown_LOC = page.locator("#banyan_auto_rate");
        this.enableAutoDispatchDropDown_LOC = page.locator("#banyan_auto_dispatch");
        //editMasterCustomerPage_LOC is from viewMasterCustomerPage
        this.editMasterCustomerPage_LOC = page.locator("//td[contains(text(),'View Master Customer')]/following-sibling::td//input[@value='  Edit  ']");
    }
    /**
     * Gets the current corporate credit limit from the input field.
     * @author Rohit Singh
     * @created 13/Oct/2025
     * @returns The current corporate credit limit as a number.
     */
    async getCorpCreditLimit(): Promise<number> {
        await this.page.waitForLoadState("networkidle");
        const currentValue = await this.corpCreditLimitInput_LOC.getAttribute('value');
        return parseFloat(currentValue || '0');
    }
    /**
     * Sets a new corporate credit limit in the input field.
     * @author Rohit Singh
     * @created 13/Oct/2025
     * @param newLimit The new corporate credit limit to set.
     */
    async setCorpCreditLimit(newLimit: number): Promise<void> {
        await this.page.waitForLoadState("networkidle");
        await this.corpCreditLimitInput_LOC.click().then(() => this.corpCreditLimitInput_LOC.clear());
        await this.corpCreditLimitInput_LOC.fill(await newLimit.toString());
        await this.corpCreditLimitInput_LOC.press('Tab');
    }
    /**
     * Clicks the Save button to save changes.
     * @author Rohit Singh
     * @created 13/Oct/2025
     */
    async clickSaveButton(): Promise<void> {
        await this.saveButton_LOC.click();
        await this.page.waitForLoadState("networkidle");
        /**
        * modified to handle occasional delay in page load after save
        * Added try-catch to avoid test failure due to timeout
        * editMasterCustomerPage_LOC is from viewMasterCustomerPage
        * @author: Aniket Nale
        * @created: 10-Nov-25
         */
        await this.page.waitForLoadState("domcontentloaded");
        try {
            await this.editMasterCustomerPage_LOC.waitFor({ state: 'visible', timeout: WAIT.MID });
            console.log("Edit Master Customer page became visible.");
        } catch (error) {
            console.log("Edit Master Customer page not visible, continuing execution...");
        }
    }
    /**
     * Checks the status of the Auto Rate dropdown.
     * @author Rohit Singh
     * @created 04/Nov/2025
     * @returns The current status of the Auto Rate dropdown.
     */
    async checkAutoRateStatus(): Promise<string> {
        await this.page.waitForLoadState("domcontentloaded");
        const status = await this.enableAutoRateDropDown_LOC.inputValue();
        return status;
    }
    /**
     * Checks the status of the Auto Dispatch dropdown.
     * @author Rohit Singh
     * @created 04/Nov/2025
     * @returns The current status of the Auto Dispatch dropdown.
     */
    async checkAutoDispatchStatus(): Promise<string> {
        await this.page.waitForLoadState("domcontentloaded");
        const status = await this.enableAutoDispatchDropDown_LOC.inputValue();
        return status;
    }
    /**
     * Sets the status of the Auto Rate dropdown.
     * @author Rohit Singh
     * @created 04/Nov/2025
     * @param enable Whether to enable or disable the Auto Rate feature.
     */
    async setAutoRateStatus(enable: boolean): Promise<void> {
        const status = enable ? '1' : '0';
        await this.enableAutoRateDropDown_LOC.selectOption({ value: status });
    }
    /**
     * Sets the status of the Auto Dispatch dropdown.
     * @author Rohit Singh
     * @created 04/Nov/2025
     * @param enable Whether to enable or disable the Auto Dispatch feature.
     */
    async setAutoDispatchStatus(enable: boolean): Promise<void> {
        const status = enable ? '1' : '0';
        await this.enableAutoDispatchDropDown_LOC.selectOption({ value: status });
    }

    /**
     * verify Allow Volume Quoting logic based on rating engine selections.
     * @author Aniket Nale
     * @created 2025-11-07
     */

    /**
 * Helper to reset all rating engine checkboxes and verify Allow Volume Quoting logic.
 * includes tests for:
 * - Mode only
 * - Banyan only
 * - Banyan3 only
 */
    private async resetAllCheckboxes(): Promise<void> {
        const checkboxes = [
            this.modeRatingEngineCheckbox_LOC,
            this.banyanRatingEngineCheckbox_LOC,
            this.banyan3RatingEngineCheckbox_LOC,
        ];
        for (const cb of checkboxes) {
            if (await cb.isChecked()) await cb.uncheck();
        }
    }

    private async isAllowVolumeDisabled(): Promise<boolean> {
        return await this.allowVolumeQuotingCheckbox_LOC.evaluate(el => el.hasAttribute("disabled"));
    }

    private async expectAllowVolumeEnabled(): Promise<void> {
        expect(await this.isAllowVolumeDisabled()).toBe(false);
    }

    private async expectAllowVolumeDisabled(): Promise<void> {
        expect(await this.isAllowVolumeDisabled()).toBe(true);
    }

    /**
     * Verifies logic when Banyan checkbox is used
     */
    async verifyBanyanLogic(): Promise<void> {
        await this.resetAllCheckboxes();

        // 1️. Only Banyan -> allow volume enabled
        await this.banyanRatingEngineCheckbox_LOC.check();
        await this.expectAllowVolumeEnabled();

        // 2️. Banyan + Mode -> allow volume enabled
        await this.modeRatingEngineCheckbox_LOC.check();
        await this.expectAllowVolumeEnabled();

        // 3️. Banyan + Banyan3 -> invalid
        await this.banyan3RatingEngineCheckbox_LOC.check();
        const bothChecked =
            (await this.banyanRatingEngineCheckbox_LOC.isChecked()) &&
            (await this.banyan3RatingEngineCheckbox_LOC.isChecked());
        expect(bothChecked).toBe(false);
    }

    /**
     * Verifies logic when Banyan3 checkbox is used
     */
    async verifyBanyan3Logic(): Promise<void> {
        await this.resetAllCheckboxes();

        // 1️. Only Banyan3 -> allow volume enabled
        await this.banyan3RatingEngineCheckbox_LOC.check();
        await this.expectAllowVolumeEnabled();

        // 2️. Banyan3 + Mode -> allow volume enabled
        await this.modeRatingEngineCheckbox_LOC.check();
        await this.expectAllowVolumeEnabled();

        // 3️. Banyan3 + Banyan -> invalid
        await this.banyanRatingEngineCheckbox_LOC.check();
        const bothChecked =
            (await this.banyanRatingEngineCheckbox_LOC.isChecked()) &&
            (await this.banyan3RatingEngineCheckbox_LOC.isChecked());
        expect(bothChecked).toBe(false);
    }

    /**
     * Verifies logic when Mode checkbox is used
     */
    async verifyModeLogic(): Promise<void> {
        await this.resetAllCheckboxes();

        // 1️. Only Mode -> allow volume disabled
        await this.modeRatingEngineCheckbox_LOC.check();
        await this.expectAllowVolumeDisabled();

        // 2️. Mode + Banyan -> allow volume enabled
        await this.banyanRatingEngineCheckbox_LOC.check();
        await this.expectAllowVolumeEnabled();

        // 3️. Mode + Banyan3 -> allow volume enabled
        await this.banyanRatingEngineCheckbox_LOC.uncheck();
        await this.banyan3RatingEngineCheckbox_LOC.check();
        await this.expectAllowVolumeEnabled();
    }

    /**
 * disable Allow Volume Quoting
 * @author Aniket Nale
 * @created 2025-11-10
 */
    async disableAllowVolumeQuoting(): Promise<void> {
        // await this.resetAllCheckboxes();
        // await this.banyanRatingEngineCheckbox_LOC.check();
        const isChecked = await this.allowVolumeQuotingCheckbox_LOC.isChecked();
        if (isChecked) {
            await this.allowVolumeQuotingCheckbox_LOC.uncheck();
        }
        await expect.soft(this.allowVolumeQuotingCheckbox_LOC).not.toBeChecked();
    }

    /**
* Enable Allow Volume Quoting
* @author Aniket Nale
* @created 2025-11-11
*/
    async enableAllowVolumeQuoting(): Promise<void> {
        // await this.resetAllCheckboxes();
        // await this.banyanRatingEngineCheckbox_LOC.check();
        await this.allowVolumeQuotingCheckbox_LOC.check();
        await expect.soft(this.allowVolumeQuotingCheckbox_LOC).toBeChecked();
    }

    /**
     * Selects Banyan as the rating engine.
     * @author Rohit Singh
     * @created 24-Dec-2025
     */
    async selctBanyanRatingEngine(): Promise<void> {
        await this.resetAllCheckboxes();
        await this.banyanRatingEngineCheckbox_LOC.check();
    }

    /**
* Selects Banyan3 as the rating engine.
* @author Aniket Nale
* @created 15-Jan-2026
*/
    async selctBanyan3RatingEngine(): Promise<void> {
        await this.resetAllCheckboxes();
        await this.banyan3RatingEngineCheckbox_LOC.check();
    }
}
export default EditMasterCustomerPage;