import { expect, FrameLocator, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class ListShipmentTemplate {
    private readonly detailFrame: FrameLocator;
    private readonly truckloadShipmentTemplate_LOC: Locator;
    private readonly templateRowAdd_LOC: (templateName: string) => Locator;


    constructor(private page: Page) {
        this.detailFrame = this.page
            .locator('iframe[name="AppBody"]').contentFrame()
            .locator('#Detail').contentFrame();

        this.truckloadShipmentTemplate_LOC = this.detailFrame.locator(
            "//tr[td[@title='Mode' and normalize-space()='Truckload']]//a[img[@alt='Add Shipment']]"
        );

        this.templateRowAdd_LOC = (templateName: string) => this.detailFrame.locator(
            `//tr[td[@title='Mode' and normalize-space()='LTL'] and contains(normalize-space(.),'${templateName}')]//a[img[@alt='Add Shipment']]`,
        );
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

    /**
     * Clicks the green "+" Add Shipment icon for an LTL template row by template name.
     * @author AI Agent
     * @created 2026-06-01
     * @param templateName - LTL shipment template name (e.g. TEST SHORT PAY LTL ESTES)
     */
    async clickOnLtlShipmentTemplateByName(templateName: string) {
        await commonReusables.waitForPageStable(this.page);
        const templateRowAdd_LOC = this.templateRowAdd_LOC(templateName);
        await templateRowAdd_LOC.first().waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await templateRowAdd_LOC.first().click();
        console.log(`Clicked LTL shipment template: ${templateName}`);
    }
}