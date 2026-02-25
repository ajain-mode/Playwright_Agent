import { FrameLocator, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class TritanLoadPlanPage {
    private detailsFrame: FrameLocator;
    private dropFrame: FrameLocator;
    private pickStatusPlusIcon_LOC: Locator;
    private dropStatusPlusIcon_LOC: Locator;
    private readonly pickDateInput_LOC: string;
    private readonly pickTimeInput_LOC: string;
    private readonly dropDateInput_LOC: string;
    private readonly dropTimeInput_LOC: string;
    private saveButton_LOC!: Locator;

    private popupPage!: Page;

    constructor(private page: Page) {
        this.detailsFrame = this.page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame();
        this.dropFrame = this.detailsFrame.locator('#Plan-innerCt iframe').contentFrame();
        this.pickStatusPlusIcon_LOC = this.dropFrame.locator("//td[contains(text(),'Status')]/following-sibling::td[contains(text(),'Pending')]/a").first();
        this.dropStatusPlusIcon_LOC = this.dropFrame.locator("//td[contains(text(),'Status')]/following-sibling::td[contains(text(),'Pending')]/a").last();
        this.pickDateInput_LOC = '#extDate2-inputEl';
        this.pickTimeInput_LOC = '#extTime2-inputEl';
        this.dropDateInput_LOC = 'input[name="dateDate2"]';
        this.dropTimeInput_LOC = 'input[name="dateTime2"]';
        this.saveButton_LOC = page.locator("//input[@onclick='doSubmit()']");
    }
    /**
     * click on Plus icon in Drop Status
     * @author Rohit Singh
     * @created 17-Dec-2025
    */
    async setDropStatus(date: string, time: string) {
        const popupPromise = this.page.waitForEvent("popup");
        await this.dropStatusPlusIcon_LOC.click();
        this.popupPage = await popupPromise;
        await commonReusables.waitForPageStable(this.popupPage);
        console.log("Clicked on Plus icon in Drop Status");

        await this.popupPage.locator(this.dropDateInput_LOC).waitFor({ state: 'visible' });
        await this.popupPage.locator(this.dropDateInput_LOC).fill(date);
        await this.popupPage.locator(this.dropDateInput_LOC).press('Tab');
        await this.popupPage.locator(this.dropTimeInput_LOC).waitFor({ state: 'visible' });
        await this.popupPage.locator(this.dropTimeInput_LOC).fill(time);
        await this.popupPage.locator(this.dropTimeInput_LOC).press('Tab');
        console.log(`Entered Drop Date: ${date} and Time: ${time}`);

        //click save
        this.saveButton_LOC = this.popupPage.locator("//input[@onclick='doSubmit()']");
    }

    async setPickStatus(date: string, time: string) {
        const popupPromise = this.page.waitForEvent("popup");
        await this.pickStatusPlusIcon_LOC.click();
        this.popupPage = await popupPromise;
        await commonReusables.waitForPageStable(this.popupPage);
        console.log("Clicked on Plus icon in Pick Status");

        await this.popupPage.locator(this.pickDateInput_LOC).waitFor({ state: 'visible' });
        await this.popupPage.locator(this.pickDateInput_LOC).fill(date);
        await this.popupPage.locator(this.pickDateInput_LOC).press('Tab');
        await this.popupPage.locator(this.pickTimeInput_LOC).waitFor({ state: 'visible' });
        await this.popupPage.locator(this.pickTimeInput_LOC).fill(time);
        await this.popupPage.locator(this.pickTimeInput_LOC).press('Tab');
        console.log(`Entered Pick Date: ${date} and Time: ${time}`);
        //click save
        this.saveButton_LOC = this.popupPage.locator("//input[@onclick='doSubmit()']");
    }

    async clickSaveButton() {
        await commonReusables.dialogHandler(this.popupPage);
        const popupClosePromise = this.popupPage.waitForEvent("close");
        await this.saveButton_LOC.click();
        await popupClosePromise; //wait for popup to close
    }
}