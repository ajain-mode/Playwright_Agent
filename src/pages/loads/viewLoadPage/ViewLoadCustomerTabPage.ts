import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
/**
 * @author Rohit Singh
 * @created 2025-07-28
 * @description This class contains methods to interact with the View Load Customer Tab Page.
 */ 
export default class ViewLoadCustomerTabPage {

    private readonly customerValue_LOC: Locator;

    constructor(private page: Page) {
        this.customerValue_LOC = this.page.locator("//b[text()='PRIMARY CUSTOMER']/../b/a[contains(@href,'custa_id')]");
    }
    /**
     * Gets the customer name from the Customer tab
     * @author Rohit Singh
     * @created 2025-07-28
     * @returns {Promise<string>} The customer name
     */
    async getCustomerName() {
        const customerName =  await commonReusables.getElementText(this.customerValue_LOC);
        return customerName;
    }
    

    





}