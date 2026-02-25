import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class ListShipmentTemplate {

    private readonly truckloadShipmentTemplate_LOC: Locator;

    constructor(private page: Page) {

        this.truckloadShipmentTemplate_LOC = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator("//tr[td[@title='Mode' and normalize-space()='Truckload']]//a[img[@alt='Add Shipment']]")
    }

    /**
* Click on Truckload Shipment Template link
* @author Aniket Nale
* @created 07-01-2026
*/
    async clickOnTruckloadShipmentTemplate() {
        await commonReusables.waitForPageStable(this.page);
        await this.truckloadShipmentTemplate_LOC.first().waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await expect.soft(this.truckloadShipmentTemplate_LOC.first()).toBeVisible({ timeout: WAIT.SMALL });
        await this.truckloadShipmentTemplate_LOC.first().click();
        console.log("Clicked on first Truckload Shipment Template");
    }
}