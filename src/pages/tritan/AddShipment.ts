import { expect, Locator, Page } from "@playwright/test";

export default class AddShipment {

    private readonly saveShipmentBtn_LOC: Locator;

    constructor(private page: Page) {

        this.saveShipmentBtn_LOC = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().getByRole('button', { name: 'SAVE' })
    }

    /**
* Click on Save Shipment button
* @author Aniket Nale
* @created 07-01-2026
*/
    async clickOnSaveShipmentButton() {
        await this.saveShipmentBtn_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await expect.soft(this.saveShipmentBtn_LOC).toBeVisible({ timeout: WAIT.SMALL });
        await this.saveShipmentBtn_LOC.click();
        console.log("Clicked on Save Shipment button");
    }
}