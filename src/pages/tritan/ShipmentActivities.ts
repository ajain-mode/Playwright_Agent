import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class ShipmentActivities {

    private readonly BTMSExtractCheckbox_LOC: Locator;
    private readonly shipmentActivitiesSelectActionDropdown_LOC: Locator;
    private readonly submitButton_LOC: Locator;

    constructor(private page: Page) {
        this.BTMSExtractCheckbox_LOC = page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator("(//tr[td[@title='Type' and normalize-space()='BTMS Extract']])[1]//input[@type='checkbox']");
        this.shipmentActivitiesSelectActionDropdown_LOC = page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('#sAction');
        this.submitButton_LOC = page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().getByRole('button', { name: 'Submit' });
    }
    /**
* Select BTMS Extract checkbox
* @author Aniket Nale
* @created 07-01-2026
*/
    async selectBTMSExtractCheckbox() {
        await commonReusables.waitForPageStable(this.page);
        await this.BTMSExtractCheckbox_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await expect.soft(this.BTMSExtractCheckbox_LOC).toBeVisible({ timeout: WAIT.SMALL });
        const isChecked = await this.BTMSExtractCheckbox_LOC.isChecked();
        if (!isChecked) {
            await this.BTMSExtractCheckbox_LOC.click();
            console.log("BTMS Extract checkbox selected");
        }
    }
    /**
* Select action from Shipment Activities Select Action dropdown
* @param {string} action - The action to select
* @author Aniket Nale
* @created 07-01-2026
*/
    async selectActionFromDropdown(action: string) {
        await commonReusables.waitForPageStable(this.page);
        await this.shipmentActivitiesSelectActionDropdown_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await expect.soft(this.shipmentActivitiesSelectActionDropdown_LOC).toBeVisible({ timeout: WAIT.SMALL });
        await this.shipmentActivitiesSelectActionDropdown_LOC.selectOption({ label: action });
        console.log(`Selected action "${action}" from Shipment Activities Select Action dropdown`);
    }
    /**
* Click on Submit button in Shipment Activities page
* @author Aniket Nale
* @created 07-01-2026
*/
    async clickOnSubmitButton() {
        await commonReusables.waitForPageStable(this.page);
        await this.submitButton_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await expect.soft(this.submitButton_LOC).toBeVisible({ timeout: WAIT.SMALL });
        await this.submitButton_LOC.click();
        console.log("Clicked on Submit button in Shipment Activities page");
        await commonReusables.waitForPageStable(this.page);
        await this.page.waitForTimeout(WAIT.DEFAULT * 2); // Additional wait to ensure action is processed
    }

    /**
     * Verifies an activities row shows COMPLETE for the given activity Type.
     * @author AI Agent
     * @created 2026-06-01
     * @param activityType - Activity type label (e.g. BTMS Extract, Invoice Extract)
     */
    async expectActivityStatusComplete(activityType: string): Promise<void> {
        const statusCell = this.page
            .locator('iframe[name="AppBody"]')
            .contentFrame()
            .locator('#Detail')
            .contentFrame()
            .locator(
                `(//tr[td[@title='Type' and normalize-space()='${activityType}']])[1]//td[@title='Status']`,
            );
        await statusCell.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        const status = ((await statusCell.textContent()) || '').trim().toUpperCase();
        expect(status, `Expected ${activityType} status COMPLETE`).toContain('COMPLETE');
    }
}