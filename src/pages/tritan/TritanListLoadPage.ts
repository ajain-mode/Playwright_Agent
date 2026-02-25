import { FrameLocator, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class TritanListLoadPage {
    private readonly headerFrame : FrameLocator
    private readonly searchBoxInput_LOC : Locator
    private readonly findButton_LOC : Locator
    constructor(private page: Page) {
        this.headerFrame = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Header').contentFrame();
        this.searchBoxInput_LOC = this.headerFrame.getByRole('textbox');
        this.findButton_LOC = this.headerFrame.getByRole('button', { name: 'Find' });
    }
    /**
     * Search Load using Load ID in Tritan List Load Page
     * @author Rohit Singh
     * @created 17-Dec-2025
     * @param loadId - Load ID to be searched
     */
    async searchLoadUsingLoadID(loadId: string) {
        await commonReusables.waitForPageStable(this.page);
        await this.searchBoxInput_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.searchBoxInput_LOC.fill(loadId);
        console.log(`Entered Load ID: ${loadId} in Search box`);
        await this.findButton_LOC.click();
        console.log("Clicked on Find button to search Load");
    }
}