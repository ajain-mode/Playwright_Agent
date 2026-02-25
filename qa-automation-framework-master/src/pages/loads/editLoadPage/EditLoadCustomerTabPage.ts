import { Locator, Page } from "@playwright/test";

export default class EditLoadCustomerTabPage {
    private readonly fuelSurchargeInput_LOC: Locator;
    private readonly customerLinehaulInput_LOC: Locator;

    constructor(private page: Page) {
        this.fuelSurchargeInput_LOC = this.page.locator("#customer_fuel_surcharge");
        this.customerLinehaulInput_LOC = this.page.locator("#customer_linehaul_rate");
    }
    /**
     * Enters fuel surcharge value in Customer Tab
     * @param fuelSurcharge Fuel Surcharge value to be entered
     * @author Rohit Singh
     * @created 2025-12-22
     */
    async enterFuelSurcharge(fuelSurcharge: string) {
        await this.fuelSurchargeInput_LOC.waitFor({ state: "visible" });
        await this.fuelSurchargeInput_LOC.clear().then(() => this.fuelSurchargeInput_LOC.fill(fuelSurcharge));
    }
    /**
     * Enters customer linehaul rate value in Customer Tab
     * @param linehaulRate Linehaul Rate value to be entered
     * @author Rohit Singh
     * @created 2025-12-22
     */
    async enterCustomerLinehaulRate(linehaulRate: string) {
        await this.customerLinehaulInput_LOC.waitFor({ state: "visible" });
        await this.customerLinehaulInput_LOC.fill(linehaulRate);
    }
}