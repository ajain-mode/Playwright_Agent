import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

/**
 * @author Mukul Khan
 * @created 01-Dec-25
 * @description AgentSearch Page Object - Handles actions related to the agent search page
 */
export default class AgentSearchPage {
    private readonly clickOnSearchButton_LOC: Locator;
    private readonly agentNameInput_LOC: Locator;
    private readonly selectAgentByName_LOC:(text: string) => Locator;

    constructor(private page: Page) {
        this.clickOnSearchButton_LOC = page.locator('//input[@class=\'submit-report-search\']');
        this.agentNameInput_LOC = page.locator('#agent_name');
        this.selectAgentByName_LOC = (text: string) => page.locator(`//td[normalize-space()='${text}']`);
    }

    /**
    * @author Mukul Khan
    * @created 01-Dec-25
    * @description This Helper Fills the Agent search input with the provided value.
    */
    private async fillSearchInput(locator: Locator, value: string, label: string): Promise<void> {
        await commonReusables.waitForPageStable(this.page);
        await locator.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await locator.fill(value);
        console.log(`Entered ${label}: ${value} in agent search page`);
    }

    /**
    * @author Mukul Khan
    * @created 01-Dec-25
    * @description Clicks on the search button to perform the agent search.
    */
    async clickOnSearchButton(): Promise<void> {
        await commonReusables.waitForPageStable(this.page);
        await this.clickOnSearchButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
    * @author Mukul Khan
    * @created 01-Dec-25
    * @description Searches for a Agent using the provided name.
    */
    async nameInputOnAgentPage(agentName: string): Promise<void> {
        await this.fillSearchInput(this.agentNameInput_LOC, agentName, "Agent Name");
    }

    /**
     * @author Mukul Khan
     * @created 01-Dec-25
     * @description This function selects a agent by name from the search results
      */
    async selectAgentByName(agentName: string) {
        const agentNameLocator = this.selectAgentByName_LOC(agentName);
        await agentNameLocator.waitFor({ state: "visible"});
        await agentNameLocator.click();
    }
}