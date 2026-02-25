import { Locator, Page } from "@playwright/test";
/**
 * @author Rohit Singh
 * @created 2025-Nov-06
 * @description Customer Master List Page Object - Handles actions related to the customer master list page
 */
export default class CustomerMasterListPage {
    private readonly customerNameRow_LOC: (customerName: string) => Locator;
    constructor(private page: Page) {
        this.customerNameRow_LOC = (customerName: string) => this.page.locator(`//td[contains(text(),'${customerName}')]`);
    }
    /**
     * @author Rohit Singh
     * @created 2025-10-13
     * @description Clicks on the customer name link in the customer master list page.
     * @param customerName - The name of the customer to click.
     */
    async clickOnCustomerName(customerName: string): Promise<void> {
        await this.customerNameRow_LOC(customerName).first().click();
    }
}