import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";


export default class EDI204LoadTendersPage {

    private readonly loadTenderFilterButton_LOC: Locator;
    private readonly bolNumberInput_LOC: Locator;
    private readonly searchButton_LOC: Locator;
    private readonly clearButton_LOC: Locator;
    private readonly bolNumberRow_LOC: (bolNumber: string) => Locator;
    /**
     * @modified : 2025-july-28
     * @author : Rohit Singh
     */
    private readonly recievedDateLink_LOC: Locator;
    private readonly todayFilterButton_LOC: Locator;
    private readonly loadIdLink_LOC: (bolNumber: string) => Locator;        //@modified: 2025-Sept-03

    constructor(private page: Page) {
        this.loadTenderFilterButton_LOC = this.page.locator("//button[@id='btnFilter']");
        this.bolNumberInput_LOC = this.page.locator("//input[@id='search_edi204_shipment_id']");
        this.searchButton_LOC = this.page.locator("//input[@class='submit-report-search']");
        this.clearButton_LOC = this.page.locator("//div[contains(@class,'shorting-slide full')]//input[@value='Clear']");
        this.bolNumberRow_LOC = (bolNumber: string) => this.page.locator(`//tr[@role='row']/td[contains(text(),'${bolNumber}')]`);
        /**
         * @modified : 2025-07-28
         * @author : Rohit Singh
         */
        this.recievedDateLink_LOC = this.page.locator("#search_createdlink");
        this.todayFilterButton_LOC = this.page.locator("//span[@id='search_createdlink']/..//a[text()='Today']");
        this.loadIdLink_LOC = (bolNumber: string) => this.page.locator(`//td[contains(text(),'${bolNumber}')]/preceding-sibling::td/a[contains(@href,'/fats/loadform')]`);  //@modified: 2025-Sept-03
    }

    /**
     * * Filters the EDI 204 Load Tender page by the provided BOL number.
     * @modified : 2025-07-28
     * @author : Rohit Singh
     * @argument {string} bolNumber - The BOL number to filter by.
     */
    async filterBolNumber(bolNumber: string){
        await this.page.waitForLoadState('networkidle');
        await this.loadTenderFilterButton_LOC.click();
        await this.clearButton_LOC.click();
        await this.clickTodayRecievedDateLink();
        await this.bolNumberInput_LOC.fill(bolNumber);
        await this.searchButton_LOC.click();
    }
    /**
     * * Selects a row in the EDI 204 Load Tender page based on the provided BOL number.
     * @modified : 2025-08-07
     * @author : Rohit Singh
     * @argument {string} bolNumber - The BOL number to select.
     */
    async clickRowWithBolNumber(bolNumber: string){
        await this.page.waitForLoadState('networkidle');
        await this.bolNumberRow_LOC(bolNumber).click();
    }
    /**
     * * Clicks on the Received Date link to filter the EDI 204 Load Tender page by today's date.
     * @modified : 2025-07-28
     * @author : Rohit Singh
     */
    async clickTodayRecievedDateLink(){
        await this.page.waitForLoadState('networkidle');
        await this.recievedDateLink_LOC.hover();  // Ensure the link is visible before clicking
        await this.todayFilterButton_LOC.waitFor({ state: 'visible' });
        await this.todayFilterButton_LOC.click();
        // Wait for the page to reload after filtering
        await this.page.waitForLoadState('networkidle');
    }
    /**
     * Clicks on the Load ID link for the specified BOL number.
     * @modified : 2025-09-03
     * @author : Rohit Singh
     * @argument {string} bolNumber - The BOL number to click the Load ID link for.
     */
    async getLoadIDwithBolNumber(bolNumber: string) :Promise<string>{
        await this.page.waitForLoadState('networkidle');
        let loadId : string;
        if(await this.bolNumberRow_LOC(bolNumber).isVisible()){
            loadId = await this.loadIdLink_LOC(bolNumber).textContent() as string;
        }
        else{
            console.log("Load ID link is not visible - Reloading page");
            await commonReusables.reloadPage(this.page);
            loadId = await this.loadIdLink_LOC(bolNumber).textContent() as string;
        }
        return loadId;
    }
}