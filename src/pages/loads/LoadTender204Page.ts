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

  /**
   * Accepts a matched Change/Replace tender onto its existing LOAD#.
   * Do not check `create_new_load` when the tender already has a LOAD# — that only
   * opens the load without applying stop replacements from the change EDI.
   * @author AI Agent
   * @created 2026-07-17
   * Locator source: edi_204 accept form `#acdc_a`, `#create_new_load`, `#reply_submit`
   */
  /**
   * Accepts a matched Change/Replace tender onto its existing LOAD#.
   * Must check `#apply_change_order` — otherwise Accept only ACKs and leaves stops unchanged.
   * @author AI Agent
   * @created 2026-07-17
   * Locator source: edi_204 accept form `#acdc_a`, `#apply_change_order`, `#create_new_load`
   */
  async acceptChangeOrderOntoExistingLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
    await this.acceptButton_LOC.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
    await this.acceptButton_LOC.click();

    const applyChangeOrder = this.page.locator("#apply_change_order");
    await applyChangeOrder.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
    await applyChangeOrder.check();
    console.log("Checked #apply_change_order");

    // Matched change tenders already show LOAD# — keep create_new_load OFF
    if (
      (await this.createLoadCheckbox_LOC.isVisible().catch(() => false)) &&
      (await this.createLoadCheckbox_LOC.isChecked().catch(() => false))
    ) {
      await this.createLoadCheckbox_LOC.uncheck();
    }
    if (
      (await this.send990ReplyCheckBox_LOC.isVisible().catch(() => false)) &&
      (await this.send990ReplyCheckBox_LOC.isChecked().catch(() => false))
    ) {
      await this.send990ReplyCheckBox_LOC.uncheck();
    }
    console.log(
      `Change Accept submit: apply_change_order=${await applyChangeOrder.isChecked()} create_new_load=${await this.createLoadCheckbox_LOC.isChecked().catch(() => false)}`,
    );
    await this.submitButton_LOC.click();
    await this.page.waitForLoadState("networkidle");
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