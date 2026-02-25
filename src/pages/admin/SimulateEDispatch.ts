import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

class SimulateEDispatchPage {

    /**
     * SimulateEDispatchPage - Page Object Model for Simulate E-Dispatch Page
     * @description This class handles validation of Simulate E-Dispatch in the application.
     * @author Aniket Nale
     */

    private readonly sourceDropdown_LOC: Locator;
    private readonly btmsLoadIdInput_LOC: Locator;
    private readonly eventDropdown_LOC: Locator;
    private readonly submitButton_LOC: Locator;
    private readonly successMessage_LOC: Locator;
    private readonly cityInput_LOC: Locator;
    private readonly stateInput_LOC: Locator;
    private readonly zipInput_LOC: Locator;

    constructor(private page: Page) {
        this.sourceDropdown_LOC = page.locator("#token");
        this.btmsLoadIdInput_LOC = page.locator("//input[@name='load_id']");
        this.eventDropdown_LOC = page.locator("#status_banyan");
        this.submitButton_LOC = page.locator("//input[@value='Submit!']");
        this.successMessage_LOC = page.locator("//div[@id='response_cell' and contains(@class, 'success')]");
        this.cityInput_LOC = page.locator("//input[@name='city']");
        this.stateInput_LOC = page.locator("//input[@name='state']");
        this.zipInput_LOC = page.locator("//input[@name='zip']");
    }

    /**
* @author Aniket Nale
* @description This method handles selecting source from dropdown
* @modified 2025-11-11
*/
    async selectSourceFromDropdown(source: string) {
        await this.sourceDropdown_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.sourceDropdown_LOC.selectOption({ label: source });
        await commonReusables.waitForPageStable(this.page);
    }

    /**
* @author Aniket Nale
* @description This method handles entering BTMS Load ID
* @modified 2025-11-11
*/
    async enterBTMSLoadID(loadID: string) {
        await this.btmsLoadIdInput_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
        await this.btmsLoadIdInput_LOC.fill(loadID);
        await commonReusables.waitForPageStable(this.page);
    }

    async selectEventDropdown(event: string) {
        await this.eventDropdown_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
        await this.eventDropdown_LOC.selectOption({ label: event });
        await commonReusables.waitForPageStable(this.page);
    }

    async enterLocationDetails(city: string, state: string, zip: string) {
        await this.cityInput_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
        await this.cityInput_LOC.fill(city);
        await this.stateInput_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
        await this.stateInput_LOC.fill(state);
        await this.zipInput_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
        await this.zipInput_LOC.fill(zip);
        await commonReusables.waitForPageStable(this.page);
    }

    async clickOnSubmitButton() {
        await this.submitButton_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
        await this.submitButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
        await expect(this.successMessage_LOC).toBeVisible({ timeout: WAIT.LARGE });
    }
}
export default SimulateEDispatchPage;