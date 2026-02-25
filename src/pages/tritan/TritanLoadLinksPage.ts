import { FrameLocator, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

class TritanLoadLinksPage {
    private detailsFrame: FrameLocator;
    private readonly popupPageFrame: FrameLocator;
    private readonly addDocumentsButton_LOC: Locator;
    private readonly addLinkInput_LOC: string;
    private readonly DocTypeDropdown_LOC: string;
    private readonly saveButton_LOC: string;
    //Not in use currently
    // private readonly isPODCheckbox_LOC: string;
    // private readonly dropEventDropdown_LOC: string;
    // private readonly dropEventOption_LOC: string;


    constructor(private page: Page) {
        this.detailsFrame = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame();
        this.popupPageFrame = this.detailsFrame.locator('#Links-innerCt iframe').contentFrame();
        this.addDocumentsButton_LOC = this.popupPageFrame.locator("//a[contains(@onclick,'doAddLink()')]");
        this.addLinkInput_LOC = "//input[@name='sURI']";
        this.DocTypeDropdown_LOC = "//select[@id='sDisplayType']";
        this.saveButton_LOC = "//input[@value='Save']";
        //Not in use currently
        // this.isPODCheckbox_LOC = "//input[@id='bIsPOD']";
        // this.dropEventDropdown_LOC = "//select[@name='oidEvent']";
        // this.dropEventOption_LOC = "//option[contains(text(),'')]";
    }
    // /**
    //  * Click on Links tab in Load Details
    //  * @author Rohit Singh
    //  * @created 20-Nov-2025
    //  */
    // async clickOnLinksTab() {
    //     await this.linksTab_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
    //     await this.linksTab_LOC.click();
    //     console.log("Clicked on Links tab in Load Details");
    // }

    async addDocuments(documentLink: string, documentType: string) {
        const page2Promise = this.page.waitForEvent('popup');
        await this.addDocumentsButton_LOC.click();
        const page2 = await page2Promise;
        await page2.locator(this.addLinkInput_LOC).clear().then(() => {
            console.log("Cleared existing value in Link URL input box");
            page2.locator(this.addLinkInput_LOC).fill(documentLink);
            console.log("Entered Link URL in input box");
        });
        
        await page2.locator(this.DocTypeDropdown_LOC).selectOption({ label: documentType.toUpperCase() });
        console.log(`Selected Document Type as ${documentType} from dropdown`);

        await commonReusables.dialogHandler(page2);
        const popupClosePromise = page2.waitForEvent("close");
        await page2.locator(this.saveButton_LOC).click();
        await popupClosePromise; //wait for popup to close
    }
}
export default TritanLoadLinksPage;