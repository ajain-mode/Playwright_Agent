import { Locator, Page } from "@playwright/test";

export default class OfficeCommissionsDetailPage {
    private readonly commissionLoadIdInput_LOC: Locator;
    private readonly searchButton_LOC: Locator;
    private readonly clearButton_LOC: Locator;
    private readonly loadIdColumn_LOC: (loadId: string) => Locator;
    private readonly commStatusColumn_LOC: (loadId: string, status: string) => Locator;
    private readonly loadStatusColumn_LOC: (loadId: string, status: string) => Locator;
    private readonly commissionCheckbox_LOC: (loadId: string) => Locator;
    private readonly hideButton_LOC: Locator;
    private readonly holdUnholdButton_LOC: Locator;
    private readonly holdUnholdDialogButton_LOC: Locator;
    private readonly holdUnholdDialogDescriptionInput_LOC: Locator;
    private readonly successMessage_LOC: Locator;
    private readonly noRecordFoundValue_LOC: Locator;
    private readonly incHiddenToggle_LOC: Locator;
    private readonly incHiddenToggleButton_LOC: Locator;



    constructor(private page: Page) { 
        this.commissionLoadIdInput_LOC = page.locator("#loadsh_id");
        this.searchButton_LOC = page.locator("//input[@class='submit-report-search']");
        this.clearButton_LOC = page.locator("//input[@class='submit-report-search']/following-sibling::input[@value='Clear']");
        this.loadIdColumn_LOC = (loadId: string) => page.locator(`//td[contains(text(),'${loadId}')]`);
        this.commStatusColumn_LOC = (loadId: string, status: string) => page.locator(`//td[contains(text(),'${loadId}')]/preceding-sibling::td[contains(text(),'${status}')]`);
        this.loadStatusColumn_LOC = (loadId: string, status: string) => page.locator(`//td[contains(text(),'${loadId}')]/following-sibling::td[contains(text(),'${status}')]`);
        this.commissionCheckbox_LOC = (loadId: string) => page.locator(`//td[contains(text(),'${loadId}')]/preceding-sibling::td/input[@class='process_checkbox']`);
        this.hideButton_LOC = page.locator("//input[@value='HIDE']");
        this.holdUnholdButton_LOC = page.locator("//input[@value='HOLD / UNHOLD' and @data-toggle='modal']");
        this.holdUnholdDialogButton_LOC = page.locator("//div[@id='holdCommission']//input[@value='HOLD / UNHOLD']");
        this.holdUnholdDialogDescriptionInput_LOC = page.locator("//div[@id='holdCommission']//textarea[@name='hold_commission_description']");
        this.successMessage_LOC = page.locator("//label[text()='Successfully set!']");
        this.noRecordFoundValue_LOC = page.locator("//*[text()='No matching records found']");
        this.incHiddenToggle_LOC = page.locator("#include_hidden_commissions_container");
        this.incHiddenToggleButton_LOC = page.locator("//label[@for='include_hidden_commissions']");

    }
    /**
     * Searches for a specific Load ID in the Office Commissions Detail page.
     * @author Rohit Singh
     * @created 2025-11-28
     * @param loadId 
     */
    async searchLoadId(loadId: string) {
        await this.commissionLoadIdInput_LOC.waitFor({ state: "visible" });
        await this.commissionLoadIdInput_LOC.fill(loadId.toString());
        await this.clickSearchButton();
    }
    /**
     * Clicks on the Search button to execute the search.
     * @author Rohit Singh
     * @created 2025-11-28
     */
    async clickSearchButton() {
        await this.searchButton_LOC.waitFor({ state: "visible" });
        await this.searchButton_LOC.click();
        await this.page.waitForLoadState('networkidle');
    }
    /**
     * Verifies if the specified Load ID is visible in the search results.
     * @param loadId 
     * @returns  True if the Load ID is visible, otherwise false.
     * @author Rohit Singh
     * @created 2025-11-28
     */
    async verifyLoadIdVisible(loadId: string): Promise<boolean> {
        await this.loadIdColumn_LOC(loadId).waitFor({ state: 'visible', timeout: WAIT.SMALL });
        return await this.loadIdColumn_LOC(loadId).isVisible();
    }
    /**
     *  Verifies the Commission Status for a specific Load ID.
     * @author Rohit Singh
     * @created 2025-11-28
     * @param loadId 
     * @param status 
     */
    async verifyCommStatus(loadId: string, status: string): Promise<boolean> {
        await this.commStatusColumn_LOC(loadId, status).waitFor({ state: 'visible', timeout: WAIT.SMALL });
        return await this.commStatusColumn_LOC(loadId, status).isVisible();
    }
    /**
     *  Verifies the Load Status for a specific Load ID.
     * @author Rohit Singh
     * @created 2025-11-28
     * @param loadId 
     * @param status 
     */
    async verifyLoadStatus(loadId: string, status: string): Promise<boolean> {
        await this.loadStatusColumn_LOC(loadId, status).waitFor({ state: 'visible', timeout: WAIT.SMALL });
        return await this.loadStatusColumn_LOC(loadId, status).isVisible();
    }
    /**
     * Selects the commission checkbox for a specific Load ID.
     * @author Rohit Singh
     * @created 2025-11-28
     * @param loadId 
     */
    async selectCommissionCheckbox(loadId: string) {
        await this.commissionCheckbox_LOC(loadId).waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.commissionCheckbox_LOC(loadId).check();
    }
    /**
     * Clicks on the Hold/Unhold button to open the hold/unhold dialog.
     * @author Rohit Singh
     * @created 2025-11-28
     */
    async clickHoldUnholdButton() {
        await this.holdUnholdButton_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.holdUnholdButton_LOC.click();
    }
    /**
     * Confirms the hold/unhold action with a description.
     * @author Rohit Singh
     * @created 2025-11-28
     * @param description 
     */
    async confirmHoldUnholdAction(description: string) {
        await this.holdUnholdDialogDescriptionInput_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.holdUnholdDialogDescriptionInput_LOC.fill(description);
        await this.holdUnholdDialogButton_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        // await commonReusables.dialogHandler(page);
        await this.holdUnholdDialogButton_LOC.click();
        await this.page.waitForLoadState('networkidle');
    }
    /**
     * Clicks on the Hide button to hide selected commissions.
     * @author Rohit Singh
     * @created 2025-11-28
    */
   async clickHideButton() {
       await this.hideButton_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
    //    await commonReusables.dialogHandler(page);
       await this.hideButton_LOC.click();
       await this.page.waitForLoadState('networkidle');
    }
    /**
     * Clicks on the Clear button to clear the search filters.
     * @author Rohit Singh
     * @created 2025-11-28
    */
   async clickClearButton() {

       await this.clearButton_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
       await this.clearButton_LOC.click();
       await this.page.waitForLoadState('networkidle');
    }
    /**
     *  Checks if the "No Record Found" message is visible.
     * @author Rohit Singh
     * @created 2025-11-28
     * @returns True if the message is visible, otherwise false.
     */
    async isNoRecordFoundVisible(): Promise<boolean> {
        await this.noRecordFoundValue_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        return await this.noRecordFoundValue_LOC.isVisible();
    }
    /**
     *  Checks if the success message is visible.
     * @author Rohit Singh
     * @created 2025-11-28
     * @returns True if the message is visible, otherwise false.
     */
    async isSuccessMessageVisible(): Promise<boolean> {
        await this.successMessage_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        return await this.successMessage_LOC.isVisible();
    }
    /**
     * Toggles the "Include Hidden Commissions" option.
     * @author Rohit Singh
     * @created 2025-11-28
     * @param option 'NO' | 'YES'
     */
    async toggleIncludeHiddenCommissions(option: 'NO' | 'YES') {
        await this.incHiddenToggle_LOC.waitFor({ state: 'visible', timeout: WAIT.MID });
        const checked = await this.incHiddenToggle_LOC.getAttribute('class');
        if (option === 'YES' && !checked?.includes('active')) {
            await this.incHiddenToggleButton_LOC.click();
            console.log('Toggled to YES');
        }
        else if (option === 'NO' && checked?.includes('active')) {
            await this.incHiddenToggleButton_LOC.click();
            console.log('Toggled to NO');
        }
    }
}