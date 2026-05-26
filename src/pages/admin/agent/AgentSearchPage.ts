import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

/**
 * @author Mukul Khan
 * @created 01-Dec-25
 * @description AgentSearch Page Object - Handles actions related to the agent search page
 */
export default class AgentSearchPage {
    /**
     * AGENTSEARCH results: NAME column index (1-based).
     * rptdefs.inc.php:2976 — colnames[2] = NAME (after ID, STATUS).
     * maketable5.inc.php:157-159 — show_linenum prepends td[1] row number → NAME = td[4].
     * LOGIN is td[16]; do not use generic //td[text()] (matches both NAME and LOGIN).
     */
    private static readonly AGENT_SEARCH_NAME_COLUMN_INDEX = 4;

    private readonly clickOnSearchButton_LOC: Locator;
    private readonly agentNameInput_LOC: Locator;
    private readonly selectAgentByName_LOC:(text: string) => Locator;
    private readonly selectAgentForBillingToggle_LOC: (text: string) => Locator;

    constructor(private page: Page) {
        const nameCol = AgentSearchPage.AGENT_SEARCH_NAME_COLUMN_INDEX;
        this.clickOnSearchButton_LOC = page.locator('//input[@class=\'submit-report-search\']');
        this.agentNameInput_LOC = page.locator('#agent_name');
        this.selectAgentByName_LOC = (text: string) => page.locator(`//td[normalize-space()='${text}']`);
        this.selectAgentForBillingToggle_LOC = (text: string) =>
            page.locator(`//tr[td[${nameCol}][normalize-space()='${text}']]/td[${nameCol}]`);
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

    /**
     * @author AI Agent
     * @created 2026-05-19
     * @description Selects an agent row by the NAME column only (Agent Search results).
     * Use when LOGIN can match the same text as NAME (e.g. BILLINGTOGGLE.USER).
     * @param agentName - Agent display name in the NAME column (e.g. USER_ROLES.BILLINGTOGGLE_USER).
     * @source rptdefs.inc.php:2976; maketable5.inc.php:157-159 — fixed td[4] (NAME), not LOGIN td[16]
     */
    async selectAgentForBillingToggle(agentName: string): Promise<void> {
        const nameCell = this.selectAgentForBillingToggle_LOC(agentName);
        await nameCell.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await nameCell.click();
    }
}