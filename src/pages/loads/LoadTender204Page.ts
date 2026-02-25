import { Locator, Page } from "@playwright/test";
/**
 * @author Rohit Singh
 * @created 2025-07-21
 * @description This class contains methods to interact with the Load Tender 204 Page.
 */
export default class LoadTender204Page {

    private readonly acceptButton_LOC : Locator;
    private readonly send990ReplyCheckBox_LOC : Locator;
    private readonly createLoadCheckbox_LOC   : Locator;
    private readonly submitButton_LOC         : Locator;
    private readonly matchingCustomerErrorValue_LOC : Locator;
    private readonly customerIdInput_LOC : Locator;
    private readonly overrideButton_LOC : Locator;
    constructor(private page: Page) {
        this.acceptButton_LOC = this.page.locator("//input[@id='acdc_a']");
        this.send990ReplyCheckBox_LOC = this.page.locator("//*[@id='send_990_reply']");
        this.createLoadCheckbox_LOC   = this.page.locator("//*[@id='create_new_load']");
        this.submitButton_LOC         = this.page.locator("//input[@id='reply_submit']");
        this.matchingCustomerErrorValue_LOC = this.page.locator("//b[contains(text(),'MATCHING CUSTOMERS!')]");
        this.customerIdInput_LOC = this.page.locator("//input[@name='custm_id_override']");
        this.overrideButton_LOC = this.page.locator("//input[@id='override_submit']");
    }
    /**
     * Clicks on the Accept button to accept the load tender
     * @author Rohit Singh
     * @created 2025-07-21
     */
   async acceptLoadTender(){
        await this.page.waitForLoadState('networkidle');

        await this.acceptButton_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await this.acceptButton_LOC.click();
        await this.createLoadCheckbox_LOC.click();
        await this.send990ReplyCheckBox_LOC.click();
        await this.submitButton_LOC.click();
    }


        /**
     * Clicks on the Accept button to accept the load tender
     * @author Rohit Singh
     * @created 2025-12-15
     */
   async acceptLoadWithOut990(){
        await this.page.waitForLoadState('networkidle');

        await this.acceptButton_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await this.acceptButton_LOC.click();
        await this.submitButton_LOC.click();
    }
    
   async overrideCustomerID(customerMasterId: string) {
        await this.page.waitForLoadState('networkidle');
        if (await this.matchingCustomerErrorValue_LOC.isVisible()) {
            await this.customerIdInput_LOC.waitFor({ state: 'visible' });
            await this.customerIdInput_LOC.fill(customerMasterId.toString());
            await this.overrideButton_LOC.click();
            await this.page.waitForLoadState('networkidle');
        }
    }
    
}