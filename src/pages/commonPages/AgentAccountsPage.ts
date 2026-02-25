import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class AgentAccountsPage {
    private readonly agentNameLink_LOC: (userName: string) =>Locator;
    constructor(private page: Page) {
        this.agentNameLink_LOC = (userName: string) => this.page.locator(`//a[contains(text(),'${userName}')]`);
    }

    /**
     * @author Rohit Singh
     * @created 09-Jan-2026
     * @param userName - Agent User Name
     * @throws Error if username is not visible on the page
     */
    async clickOnUserNameIfVisible(userName: string): Promise<void> {
        console.log(`Clicking on user name: ${userName}`);
        await commonReusables.waitForPageStable(this.page);
        if(userName.toUpperCase() === "SVC.TESTAUTOMATION")
        {
            userName = "SVC_TESTAUTOMATION";
        }
        const isVisible = await this.agentNameLink_LOC(userName).isVisible();
        if (!isVisible) {
            throw new Error(`Username not found in Agent Accounts Page: ${userName}`);
        }
        await this.agentNameLink_LOC(userName).click();
    }

}