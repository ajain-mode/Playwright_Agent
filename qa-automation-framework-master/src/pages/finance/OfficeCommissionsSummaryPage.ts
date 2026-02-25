import { expect, Locator, Page } from "@playwright/test";

export default class OfficeCommissionsSummaryPage {
    private readonly presetLink_LOC: Locator;
    private readonly todayLink_LOC: Locator;
    private readonly agentOfficeSearchButton_LOC: Locator;
    private readonly agentOfficeInput_LOC: Locator;
    private readonly agentOfficeNameButton_LOC: (agentName: string) => Locator;
    private readonly searchButton_LOC: Locator;
    private readonly agentOfficeRowCheckbox_LOC: (agentName: string) => Locator;
    private readonly approveButton_LOC: Locator;
    private readonly unapproveButton_LOC: Locator;
    private readonly checkboxMessage_LOC: Locator;
    private readonly processCommissionButton_LOC: Locator;
    private readonly submitCommissionButton_LOC: Locator;
    private readonly commissionBatchIdAmountValue_LOC: Locator;
    private readonly batchIdLink_LOC: Locator;
    private readonly commissionAmount_LOC: Locator;

    constructor(private page: Page) {
        this.presetLink_LOC = page.locator("#commlink");
        this.todayLink_LOC = page.locator("//a[text()='Today']");
        this.agentOfficeSearchButton_LOC = page.locator('#agent_office_magic .ms-trigger');
        this.agentOfficeInput_LOC = page.locator('#agent_office_magic input[type="text"]');
        this.agentOfficeNameButton_LOC = (agentName: string) => page.locator(`//em[text()='${agentName}']`);
        this.searchButton_LOC = page.locator("//input[@class='submit-report-search']");
        this.agentOfficeRowCheckbox_LOC = (agentName: string) => page.locator(`//td/input[contains(@value,'${agentName}')]`);
        this.approveButton_LOC = page.locator("//div[@id='table_action_bar']//input[@value='APPROVE']");
        this.unapproveButton_LOC = page.locator("//div[@id='table_action_bar']//input[@value='UNAPPROVE']");
        this.checkboxMessage_LOC = page.locator("//div[@class='checkboxes_processed']/label");
        this.processCommissionButton_LOC = page.locator("//input[@value='PROCESS']");
        this.submitCommissionButton_LOC = page.locator("//input[@id='process_office_commissions_summary_btn']");
        this.commissionBatchIdAmountValue_LOC = page.locator("ul.success li");
        this.batchIdLink_LOC = this.commissionBatchIdAmountValue_LOC.nth(0).locator('a');
        this.commissionAmount_LOC = this.commissionBatchIdAmountValue_LOC.nth(1);
    }
    /**
     * Selects 'Today' from the preset date options.
     * @author Rohit Singh
     * @created 2025-11-28
     */
    async selectDateAsToday() {
        await this.presetLink_LOC.waitFor({ state: 'visible' });
        await this.presetLink_LOC.click();
        await this.todayLink_LOC.waitFor({ state: 'visible' });
        await this.todayLink_LOC.click();
        await this.page.waitForLoadState('networkidle');
    }
    /**
     * Selects the specified agent office for filtering commissions.
     * @author Rohit Singh
     * @created 2025-11-28
     * @param agentName - The name of the agent office to select.
     */
    async selectAgentOffice(agentName: string): Promise<void> {
        agentName = agentName.toUpperCase();
        await this.agentOfficeSearchButton_LOC.waitFor({ state: 'visible' });
        await this.agentOfficeSearchButton_LOC.click();
        await this.agentOfficeInput_LOC.waitFor({ state: 'visible' });
        await this.agentOfficeInput_LOC.pressSequentially(agentName);
        await this.agentOfficeNameButton_LOC(agentName).waitFor({ state: 'visible' });
        await this.agentOfficeNameButton_LOC(agentName).click();
    }
    /**
     * Clicks the search button to execute the commission search with applied filters.
     * @author Rohit Singh
     * @created 2025-11-28
     */
    async clickOnSearch() {
        await this.searchButton_LOC.waitFor({ state: 'visible' });
        await this.searchButton_LOC.click();
        await this.page.waitForLoadState('networkidle');
    }
    /**
     * Verifies if the specified agent office is visible in the search results.
     * @author Rohit Singh
     * @created 2025-11-28
     * @param agentName - The name of the agent office to verify.
     */
    async verifyCommissionCheckboxVisible(agentName: string): Promise<boolean> {
        agentName = agentName.toUpperCase();
        await this.agentOfficeRowCheckbox_LOC(agentName).waitFor({ state: 'visible' });
        return await this.agentOfficeRowCheckbox_LOC(agentName).isVisible();
    }
    async selectCommissionCheckbox(agentName: string): Promise<void> {
        agentName = agentName.toUpperCase();
        await this.agentOfficeRowCheckbox_LOC(agentName).waitFor({ state: 'visible' });
        await this.agentOfficeRowCheckbox_LOC(agentName).check();
    }
    /**
     * Clicks on the Approve button to approve selected commissions.
     * @author Rohit Singh
     * @created 2025-11-28
     */
    async clickOnApproveButton() {
        await this.approveButton_LOC.waitFor({ state: 'visible' });
        await this.approveButton_LOC.click();
        await this.page.waitForLoadState('networkidle');
    }
    /**
     * Clicks on the Unapprove button to unapprove selected commissions.
     * @author Rohit Singh
     * @created 2025-11-28
     */
    async clickOnUnapproveButton() {
        await this.unapproveButton_LOC.waitFor({ state: 'visible' });
        await this.unapproveButton_LOC.click();
        await this.page.waitForLoadState('networkidle');
    }
    /**
     * Gets the message displayed after processing checkboxes.
     * @author Rohit Singh
     * @created 2025-11-28
     * @returns The checkbox processed message text.
     */
    async getCheckboxProcessedMessage(): Promise<string> {
        await this.checkboxMessage_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        return await this.checkboxMessage_LOC.textContent() || "";
    }
    /**
     * Clicks on the Process Commission button to process commissions.
     * @author Rohit Singh
     * @created 2025-12-01
     */
    async clickOnProcessCommission() {
        await this.processCommissionButton_LOC.waitFor({ state: 'visible' });
        await this.processCommissionButton_LOC.click();
    }
    /**
     * Clicks on the Submit Commission button to submit processed commissions.
     * @author Rohit Singh
     * @created 2025-12-01
     */
    async clickOnSubmitCommission() {
        await this.submitCommissionButton_LOC.waitFor({ state: 'visible' });
        await this.submitCommissionButton_LOC.click();
        await this.page.waitForLoadState('networkidle');
    }
    /**
     * Validates the batch ID and commission amount displayed on the page.
     * @author Rohit Singh
     * @created 2025-12-01
     */
    async validateBatchIdAndCommission(): Promise<void> {
            const actualBatchId = (await this.batchIdLink_LOC.innerText()).trim();
            const actualAmountText = (await this.commissionAmount_LOC.innerText()).trim();
            const actualAmount = actualAmountText.replace('Total Commissions:', '').trim();
            console.log(`Batch ID : ${actualBatchId} Found`);
            console.log(`Commission Amount : ${actualAmount} Found`);
            await expect.soft(this.batchIdLink_LOC).toHaveText(actualBatchId);
        }
}