import { Page, Locator, expect } from "@playwright/test";
import commonReusables from "../../../utils/commonReusables";

class EDILogPage {
    private readonly ediMsgValue_LOC: Locator;
    private readonly loadNumberValue_LOC: Locator;
    private readonly edi824ReviewdButton_LOC: Locator;
    private readonly reviewedStatus_LOC: Locator;
    private readonly reviewedBy_LOC: Locator;
    private readonly reviewedOn_LOC: (date: string) => Locator;
    
    constructor(page: Page) {
        this.ediMsgValue_LOC = page.locator("//pre[@id='edi_message']")
        this.loadNumberValue_LOC = page.locator("//b[text()='Load']/following-sibling::a[contains(@href,'loadform')]");
        this.edi824ReviewdButton_LOC = page.locator("//button[text()='824 Reviewed']");
        this.reviewedStatus_LOC = page.locator("//b[contains(text(),'COMPLETED')]");
        this.reviewedBy_LOC = page.locator("//b[contains(text(),'824 Reviewed By:')]");
        this.reviewedOn_LOC = (date: string) => page.locator(`//b[contains(text(),"${date}")]`);
    }
    /**
     * Clicks on the EDI message value locator
     * @author Rohit Singh
     * @modified 2025-07-28
     */
    async getLoadId(): Promise<string> {
        const loadId = await this.loadNumberValue_LOC.textContent() ?? "";  
         return loadId;
    }
    /**
     * Returns the EDI message value locator
     * @author Rohit Singh
     * @modified 2025-07-28
     */
    async getEdiTextLocator(): Promise<Locator> {
         return this.ediMsgValue_LOC;
    }
    /**
     * Updates the EDI 204 raw data with the provided BOL number, Load ID, container code, and trailer number
     * @param ediRawData - The raw EDI data to be updated
     * @param bolNumber - The BOL number to be inserted into the EDI data
     * @param loadId - The Load ID to be inserted into the EDI data
     * @param containerCode - The container code to be inserted into the EDI data
     * @param trailerNumber - The trailer number to be inserted into the EDI data
     * @returns Updated EDI 204 raw data as a string
     * @author Rohit Singh
     * @modified 2025-07-29
     */
    async updateEdiRawDataCarrier1(ediRawData:string, bolNumber:string, loadId:string, containerCode:string, trailerNumber:string): Promise<string> { 
        const actualDateP1 = commonReusables.formatDateToYYYYMMDD(commonReusables.today);
        const actualDateP2 = commonReusables.formatDateToYYYYMMDD(commonReusables.tomorrow);
        const expEdi204Carrier1Data = await ediRawData
      .replace(/\{BOLNumber\}/g, bolNumber)
      .replace(/\{LoadID\}/g, loadId)
      .replace(/\{containerCode\}/g, containerCode)
      .replace(/\{trailerNumber\}/g, trailerNumber.toString())
      .replace(/\{ActualDateP1\}/g, actualDateP1)
      .replace(/\{ActualDateP2\}/g, actualDateP2)?.trim() ?? null;
        return expEdi204Carrier1Data;
    }
    /**
     * Updates the EDI raw data with the provided BOL number and Load ID
     * @param ediRawData - The raw EDI data to be updated
     * @param bolNumber - The BOL number to be inserted into the EDI data
     * @param loadId - The Load ID to be inserted into the EDI data
     * @param updateTomorrow - Whether to update the date to tomorrow's date
     * @returns Updated EDI raw data as a string
     * @author Rohit Singh
     * @modified 2025-08-25
     */
    async updateOutboundEdiData(ediRawData:string, bolNumber:string, loadId:string, updateTomorrow: boolean): Promise<string> {
        let expEdi990Data = await ediRawData
      .replace(/\{BOLNumber\}/g, bolNumber)
      .replace(/\{LoadID\}/g, loadId)?.trim() ?? null;
      if(updateTomorrow === true) {
        expEdi990Data = expEdi990Data.replace(/\{Tomorrow\}/g, await commonReusables.getDate("tomorrow","YYYYMMDD"));
      }
      return expEdi990Data;
    }
    /**
     * Clicks on the EDI 824 Reviewed button
     * @author Rohit Singh
     * @created 2025-09-22
     */
    async clickEdi824ReviewedButton(){
        await this.edi824ReviewdButton_LOC.waitFor({ state: 'visible' });
        await this.edi824ReviewdButton_LOC.click();
    }
    async validateEDI824(){
        await this.reviewedStatus_LOC.waitFor({ state: 'visible' });
        await this.reviewedBy_LOC.waitFor({ state: 'visible' });
        const date = await commonReusables.getDate("today","MM/DD/YYYY");
        await this.reviewedOn_LOC(date).waitFor({ state: 'visible' });
        await expect.soft(this.reviewedStatus_LOC).toBeVisible();
        await expect.soft(this.reviewedBy_LOC).toBeVisible();
        await expect.soft(await this.reviewedOn_LOC(date)).toBeVisible();
    }
}
export default EDILogPage;