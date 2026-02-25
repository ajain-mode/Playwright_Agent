import { Locator, Page } from "@playwright/test";

export default class AgentEditPage {
    private readonly saveButton_LOC: Locator;
    private readonly userRolesdropdown_LOC: Locator
    private readonly selectBulkChangeRole_LOC: (text: string) => Locator;
    private readonly authLevelDropdown_LOC: Locator;

    constructor(private page: Page) {
        this.saveButton_LOC = this.page.getByRole("button", { name: "Save" }).first();
        this.userRolesdropdown_LOC = this.page.locator("//span[contains(text(), 'selected')]");
        this.selectBulkChangeRole_LOC = (text: string) => this.page.locator(`//label[span[contains(text(),'${text}')]]`);
        this.authLevelDropdown_LOC = page.locator("#agent_auth_level");
    }

    /**
     * @author Tejaswini
     * @param roleName Assign User Role to agent
     */
    async assignRole(roleName: string) {
        await this.userRolesdropdown_LOC.click();
        await this.selectBulkChangeRole_LOC(roleName).click();
        await this.saveButton_LOC.click();
        console.log(`${roleName} role assigned successfully.`);
    }

    
    /**
     * Selects the Auth Level dropdown
     * 
     * @param authLevel - The auth level to select (NOACCESS, SALES, DISPATCH, MANAGER, FINANCE, EXECUTIVE, ADMIN)
     * 
     * @author Suhaib
     * @created 2025-12-21
     */
    async selectAuthLevel(authLevel: string): Promise<void> {
        await this.authLevelDropdown_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await this.authLevelDropdown_LOC.selectOption({ value: authLevel });
    }

    /**
     * Clicks the Save button to save agent changes
     * 
     * @author Suhaib
     * @created 2025-12-21
     */
    async clickSaveButton(): Promise<void> {
        await this.saveButton_LOC.waitFor({ state: 'visible', timeout: WAIT.XXLARGE });
        await this.saveButton_LOC.click();
    }

    /**
     * Updates agent auth level - selects auth level and saves (requires edit mode to be active)
     * 
     * @param authLevel - The auth level to update to (NOACCESS, SALES, DISPATCH, MANAGER, FINANCE, EXECUTIVE, ADMIN)
     * 
     * @author Suhaib
     * @created 2025-12-22
     */
    async updateAuthLevel(authLevel: string): Promise<void> {
        await this.selectAuthLevel(authLevel);
        await this.clickSaveButton();
    }
}