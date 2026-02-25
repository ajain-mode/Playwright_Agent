import { Locator, Page } from "@playwright/test";

export default class DuplicateAgentPage {
    private readonly agentNameInput_LOC: Locator;
    private readonly agentLoginInput_LOC: Locator;

    constructor(private page: Page) {
        this.agentNameInput_LOC = this.page.locator('#agent_name');
        this.agentLoginInput_LOC = this.page.locator('#agent_login');
    }

    /**
     * @author Mukul Khan
     * @description This method handles entering agent name in Duplicate Agent mode
     * @created 01-Jan-26
     */
    async enterAgentNameInDuplicateAgentMode(agentName: string) {
        await this.agentNameInput_LOC.waitFor({ state: "visible" });
        await this.agentNameInput_LOC.clear();
        await this.agentNameInput_LOC.fill(agentName);
        await this.agentLoginInput_LOC.waitFor({ state: "visible", timeout: WAIT.SMALL });
        await this.agentLoginInput_LOC.click();
    }
}