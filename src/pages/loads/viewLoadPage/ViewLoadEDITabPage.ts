import test, { Page, Locator, expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import ViewLoadPage from "./ViewLoadPage";

export default class ViewLoadEDITabPage {
    private readonly viewFullEDI990LogLink_LOC:   Locator;    
    private readonly ediLoadLevelStatusesValue_LOC: (tradingPartner: string) => Locator;
    private readonly ediFullLogLink_LOC: (tradingPartner: string) => Locator;
    private readonly ediCustomerStatusLink_LOC: (tradingPartner: string, ediText: string) => Locator;
    private readonly carrier1EdiStatusDropDown_LOC: Locator;
    private readonly carrier1EdiDateInput_LOC: Locator;
    private readonly carrier1EdiTimeInput_LOC: Locator;
    private readonly carrier1EdiSaveButton_LOC: Locator;
    private readonly carrier1EdiStatusesValue_LOC: (tradingPartner: string) => Locator;
    private readonly carrier1EdiFullLogLink_LOC: Locator;
    private readonly carrier3EdiStatusesValue_LOC: (tradingPartner: string) => Locator;
    private readonly fullLogLink_LOC: (tradingPartner: string, ediText: string) => Locator;
    private readonly ediDetailsRow_LOC: (tradingPartner: string, ediCode: string) => Locator;
    private readonly ediFullLogLinkCommon_LOC: (tradingPartner: string, ediStatus: string) => Locator;


    constructor(private page:   Page) {
        this.viewFullEDI990LogLink_LOC  = page.locator("//td[text()='990']/following-sibling::td//img[@title='View Full EDI Message']");
        this.ediCustomerStatusLink_LOC = (tradingPartner: string, ediText: string) => page.locator(`//table[@id='edi_table_load']//td[text()='${tradingPartner}']/following-sibling::td[text()='${ediText}']`);
        this.ediLoadLevelStatusesValue_LOC = (tradingPartner: string) => page.locator(`//table[@id='edi_table_load']//td[text()='${tradingPartner}']/following-sibling::td`);
        this.ediFullLogLink_LOC = (tradingPartner: string) => page.locator(`//table[@id='edi_table_load']//td[text()='${tradingPartner}']/following-sibling::td/a`);
        this.carrier1EdiStatusDropDown_LOC = page.locator("//form[@id='edi214_carr_1_stop_1_form']//select[@id='edi_special_status_hash']");
        this.carrier1EdiDateInput_LOC = page.locator("//form[@id='edi214_carr_1_stop_1_form']//input[@id='edi214_carr_1_stop_1_date']");
        this.carrier1EdiTimeInput_LOC = page.locator("//form[@id='edi214_carr_1_stop_1_form']//input[@id='edi214_carr_1_stop_1_time']");
        this.carrier1EdiSaveButton_LOC = page.locator("//form[@id='edi214_carr_1_stop_1_form']//input[@id='edi214_carr_1_stop_1_btn']");
        this.carrier1EdiStatusesValue_LOC = (tradingPartner: string) => page.locator(`//form[@id='edi214_carr_1_stop_1_form']/following-sibling::table[1]//td[text()='${tradingPartner}']/following-sibling::td`);
        this.carrier1EdiFullLogLink_LOC =  page.locator(`//td[text()='AA']/following-sibling::td/a`);
        this.carrier3EdiStatusesValue_LOC = (tradingPartner: string) => page.locator(`//form[@id='edi214_carr_3_stop_2_form']/following-sibling::table//td[text()='${tradingPartner}']/following-sibling::td`);
        this.fullLogLink_LOC = (tradingPartner: string, ediText: string) => page.locator(`//td[text()='${tradingPartner}']/following-sibling::td[text()='${ediText}']/following-sibling::td/a`);
        this.ediDetailsRow_LOC = (tradingPartner: string, ediCode: string) => page.locator(`//td[text()='${tradingPartner}']/following-sibling::td[text()='${ediCode}']/../td`);
        this.ediFullLogLinkCommon_LOC = (tradingPartner: string, ediStatus: string) => page.locator(`//td[text()='${tradingPartner}']/following-sibling::td[text()='${ediStatus}']/../td/a`);
    }
    /**
     * @author Rohit Singh
     * @modified 2025-07-29
     * @description Validates the lead level statuses for EDI messages.
     * @param tradingPartner 
     * @param nthElement - The nth element to validate (default is 0).
     */
    async validateLeadLevelStatuses(tradingPartner: string, nthElement: number = 0) {   //added nthElement parameter with default value 0 @2025-09-17
        this.ediCustomerStatusLink_LOC(tradingPartner, "204").nth(nthElement).highlight();
        expect.soft(this.ediCustomerStatusLink_LOC(tradingPartner, "204").nth(nthElement)).toBeVisible();
        expect.soft(this.ediCustomerStatusLink_LOC(tradingPartner, "In").nth(nthElement)).toBeVisible();
        expect.soft(this.ediCustomerStatusLink_LOC(tradingPartner, "990").nth(nthElement)).toBeVisible();
        expect.soft(this.ediCustomerStatusLink_LOC(tradingPartner, "Out").nth(nthElement)).toBeVisible();
        await expect(test.info().errors).toHaveLength(0);
        await console.log("Successfully Validated Lead Level Statuses");
    }
    /**
     * Clicks on the View Full EDI 990 Log link
     * @author Rohit Singh
     * @modified 2025-07-29
     * @param nthElement - The nth element to click (default is 0).
     */
    async clickViewFullEDI990Log(nthElement: number = 0) {
        await this.viewFullEDI990LogLink_LOC.nth(nthElement).highlight();   //update
        await this.viewFullEDI990LogLink_LOC.nth(nthElement).click();
    }
    /**
     * Gets the View Full EDI 990 Log link
     * @author Rohit Singh
     * @modified 2025-07-29
     * @returns {Locator} The locator for the View Full EDI 990 Log link
     */
    async getViewFullEDI990LogLink(){
        return this.viewFullEDI990LogLink_LOC;
    }
    /**
     * Gets the EDI status for a given trading partner.
     * @param statusLocator The locator function to get the status for a trading partner.
     * @param tradingPartner The name of the trading partner.
     * @author Rohit Singh
     * @modified 2025-07-29
     * @returns {Promise<string[]>} The EDI status array for the trading partner.
     */
    async getEDIStatus(statusLocator: (tradingPartner: string) => Locator, tradingPartner: string) {
        const statusArray = await statusLocator(tradingPartner).allTextContents();
        await console.log(`EDI Status for ${tradingPartner}:`, statusArray);
        return statusArray;
    }
    /**
     * Validates the EDI status for a given trading partner.
     * @param tradingPartner The name of the trading partner.
     * @author Rohit Singh
     * @description This method checks if the EDI status contains the expected type, in-out status, and overall status.
     * @modified 2025-07-29
     */
    async validateEDIStatus(allEdiStatus: string[], tradingPartner: string, ediType: string, ediInOut: string, ediStatus: string) {
        await expect.soft(allEdiStatus).toContain(ediType.toString());
        await expect.soft(allEdiStatus).toContain(ediInOut.toString());
        await expect.soft(allEdiStatus).toContain(ediStatus.toString());
        await expect(test.info().errors).toHaveLength(0);
        await console.log(`Successfully validated EDI Status: ${tradingPartner} - ${ediType} - ${ediInOut} - ${ediStatus}`);
    }
    /**
     * Clicks on the EDI Full Log link for a given trading partner.
     * @param tradingPartner The name of the trading partner.
     * @author Rohit Singh
     * @modified 2025-07-29
     */
    async clickEDIFullLogLink(tradingPartner: string) {
        const fullLogLink = this.ediFullLogLink_LOC(tradingPartner);
        await fullLogLink.click();
    }
    /**
     * @author Rohit Singh
     * @description Reloads the EDI tab by reloading the page and navigating back to the EDI tab.
     * @modified 2025-07-29
     */
    async reloadEdiTab() {
        await this.page.reload();
        await this.page.waitForLoadState('networkidle');
        await new ViewLoadPage(this.page).clickEDITab();
        await this.page.waitForLoadState('networkidle');
    }
    /** 
     *  @description Sends the Carrier 1 EDI status with the provided status and time.
     * @param status The status to be set for Carrier 1 EDI.
     * @param time The time to be set for Carrier 1 EDI.
     * @author Rohit Singh
     * @modified 2025-07-29
    */
    async sendCarrier1EdiStatus(status: string, time: string) {
        await this.page.waitForLoadState('networkidle');
        await this.carrier1EdiStatusDropDown_LOC.selectOption(status);
        await this.carrier1EdiDateInput_LOC.fill(await commonReusables.getDate("today", "MM/DD/YYYY"));
        await this.carrier1EdiTimeInput_LOC.fill(await time.toString());
        await this.carrier1EdiSaveButton_LOC.click();
        await commonReusables.validateAlert(this.page, "X3: AT ORIGIN");
        await this.page.waitForLoadState('networkidle');
    }
    /**
     * Validates the Carrier 1 EDI status for a given trading partner.
     * @param tradingPartner The name of the trading partner.
     * @author Rohit Singh
     * @description This method checks if the EDI status contains the expected type, in-out status, and overall status.
     * @modified 2025-07-29
     */
    async validateCarrier1EDIStatus(tradingPartner: string, ediType: string, ediInOut:string, ediStatus: string) {
        const allEdiStatus = await this.getEDIStatus(this.carrier1EdiStatusesValue_LOC, tradingPartner);
        await this.validateEDIStatus(allEdiStatus, tradingPartner, ediType, ediInOut, ediStatus);
    }
    /**
     * Validates the Carrier 1 EDI status for a given trading partner.
     * @param tradingPartner The name of the trading partner.
     * @author Rohit Singh
     * @description This method checks if the EDI status contains the expected type, in-out status, and overall status.
     * @modified 2025-07-29
     */
    async validateCarrier3EDIStatus(tradingPartner: string, ediType: string, ediInOut:string, ediStatus: string) {
        const allEdiStatus = await this.getEDIStatus(this.carrier3EdiStatusesValue_LOC, tradingPartner);
        await this.validateEDIStatus(allEdiStatus, tradingPartner, ediType, ediInOut, ediStatus);
    }
    /**
     * Validate EDI Full Log link for a given trading partner for Load Level Statuses.
     * @param tradingPartner The name of the trading partner.
     * @author Rohit Singh
     * @modified 2025-07-29
     */
    async validateLoadLevelEDIStatus(tradingPartner: string, ediType: string, ediInOut:string, ediStatus: string){
        const allEdiStatus = await this.getEDIStatus(this.ediLoadLevelStatusesValue_LOC, tradingPartner);
        await this.validateEDIStatus(allEdiStatus, tradingPartner, ediType, ediInOut, ediStatus);
    }
    /**
     * Clicks the EDI Full Log link for  Carrier 1 with a given trading partner.
     * @author Rohit Singh
     * @modified 2025-07-29
     */
    async clickCarrier1EdiFullLogLink() {
        await this.page.waitForLoadState('networkidle');
        await this.carrier1EdiFullLogLink_LOC.click();
    }
    /**
     * Clicks the EDI Full Log link for  Carrier/Customer with a given trading partner & ediType/ediStatus.
     * @author Rohit Singh
     * @modified 2025-08-06
     */
    async clickCarrierCustomerEdiFullLogLink(tradingPartner: string, ediOption: string) {
        await this.page.waitForLoadState('networkidle');
        this.fullLogLink_LOC(tradingPartner, ediOption).click();
    }
    /**
     * Fetches EDI details for a given trading partner and EDI code.
     * @param tradingPartner The name of the trading partner.
     * @param ediCode The EDI code to fetch details for.
     * @author Rohit Singh
     * @created 2025-09-08
     */
    private async getEDIDetails(tradingPartner: string, ediCode: string) {
        const details = await this.ediDetailsRow_LOC(tradingPartner, ediCode).allTextContents();
        await console.log(`EDI Details for ${tradingPartner} - ${ediCode}:`, details);
        return details;
    }
    /**
     * Validates EDI details for a given trading partner, EDI code, in-out status, and overall status.
     * @param tradingPartner The name of the trading partner.
     * @param ediCode The EDI code to validate details for.
     * @param ediInOut The expected in-out status.
     * @param ediStatus The expected overall status.
     * @author Rohit Singh
     * @created 2025-09-08
     */
    async validateEDIDetails(tradingPartner: string, ediCode: string, ediInOut: string, ediStatus: string) {
        const details = await this.getEDIDetails(tradingPartner, ediCode);
        expect.soft(details.length).toBeGreaterThan(0);
        await details.includes(ediInOut);
        await details.includes(ediStatus);
        await expect(test.info().errors).toHaveLength(0);
        await console.log(`Successfully Validated EDI Details for ${tradingPartner} - ${ediCode}`);
    }
    /** Clicks the EDI Full Log link for a given trading partner & ediStatus.
     * @author Rohit Singh
     * @created 2025-09-08
     */
    async clickEDIFullLogLinkCommon(tradingPartner: string, ediStatus: string, nthElement: number = 0) {
        await this.page.waitForLoadState('networkidle');
        await this.ediFullLogLinkCommon_LOC(tradingPartner, ediStatus).nth(nthElement).click();
    }
    /** Gets the EDI Full Log link for a given trading partner & ediStatus.
     * @author Rohit Singh
     * @created 2025-09-22
     */
    async getEDIFullLogLinkCommonElement(tradingPartner: string, ediStatus: string){
        const element = await this.ediFullLogLinkCommon_LOC(tradingPartner, ediStatus);
        return element;
    }
}