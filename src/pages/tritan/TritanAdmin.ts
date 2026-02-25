import { expect, FrameLocator, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

/**
 * @class TritanAdmin
 * This page class represents the TRITAN Admin Page in the application.
 * @description This class provides methods to interact with various elements on the TRITAN Admin Page,
 * including navigating to the Loads section, searching for shipments, selecting actions from dropdowns,
 * verifying load statuses, and clicking buttons.
 * @author Aniket Nale
 * @created 17-Nov-2025
 */

class TritanAdmin {

    private readonly frame: FrameLocator;
    private readonly loadsButton_LOC: Locator;
    private readonly textboxReference_LOC: Locator;
    private readonly actionBox: Locator;
    private readonly loadStatusValue_LOC: Locator;
    private readonly planButton_LOC: Locator;
    private readonly plusPickupButton_LOC: Locator;
    private proInputBox_LOC!: Locator;
    private pickupSaveButton_LOC!: Locator;
    private popupPage!: Page;
    private readonly detailButton_LOC: Locator;
    private readonly serviceValue_LOC: Locator;
    private readonly editItemButton_LOC: Locator;
    private readonly addRateButton_LOC: Locator;
    private editItemPopup?: Page;
    private readonly carrierRateComboBox_LOC: Locator;
    private readonly carrierRateSelectOption_LOC: Locator;
    private readonly rateAmountLinks_LOC: Locator;
    private readonly unableToProcessError_LOC: Locator;

    constructor(private page: Page) {
        this.frame = page.locator('iframe[name="AppBody"]').contentFrame().locator('#Header').contentFrame();
        this.loadsButton_LOC = page.locator("//div[@class='tB' and span[text()='Loads']]")
        this.textboxReference_LOC = this.frame.getByRole('textbox');
        this.frame = page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame();
        this.actionBox = this.frame.locator('iframe').contentFrame().getByRole('combobox');
        this.loadStatusValue_LOC = this.frame.locator('#Detail-innerCt iframe').contentFrame().locator("//b[text()='Status:']/parent::td");
        this.planButton_LOC = this.frame.getByRole('button', { name: 'Plan' });
        this.plusPickupButton_LOC = this.frame.locator('#Plan-innerCt iframe').contentFrame().locator('.right > a').first()
        this.proInputBox_LOC = page.locator('#PRO');
        this.pickupSaveButton_LOC = page.locator("//input[@onclick='doSubmit()']");
        this.detailButton_LOC = this.frame.getByRole('button', { name: 'Detail' })
        this.serviceValue_LOC = this.frame.locator('#Detail-innerCt iframe').contentFrame().locator("td.DetailBodyTableRowOdd");
        this.editItemButton_LOC = page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('iframe').contentFrame().locator('#itemsWin').contentFrame().getByRole('link', { name: 'Edit Item' })
        this.addRateButton_LOC = page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('iframe').contentFrame().locator('#carrRatesWin').contentFrame().getByRole('link', { name: 'Add Rate' })
        this.carrierRateComboBox_LOC = page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('iframe').contentFrame().locator('#carrRatesWin').contentFrame().getByRole('combobox');
        this.carrierRateSelectOption_LOC = page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('iframe').contentFrame().locator('#carrRatesWin').contentFrame().locator('#addSpan select');
        this.frame = page.frameLocator('iframe#AppBody').frameLocator('frame#Detail').frameLocator('iframe[src^="editTransportOrig.jsp"]').frameLocator('iframe#carrRatesWin');
        this.rateAmountLinks_LOC = this.frame.locator('td.total >> a');
        this.unableToProcessError_LOC = page.frameLocator('iframe#AppBody').frameLocator('frame#Detail').frameLocator('iframe[src*="editTransportOrig.jsp"]').locator('text=Unable to process request. This issue has been reported to the System Administrator.');
    }
    /**
 * click on Loads Section
 * @author Aniket Nale
 * @created 17-Nov-2025
 */

    async clickOnLoadsSection() {
        await commonReusables.waitForPageStable(this.page);
        await this.loadsButton_LOC.click();
        console.log("Navigated to Loads section in TRITAN Admin");
    }

    /**
* Search shipment by reference number
* @param reference - Shipment reference number to search
* @author Aniket Nale
* @created 17-Nov-2025
*/

    async searchShipment(reference: string) {
        await commonReusables.waitForPageStable(this.page);
        await this.textboxReference_LOC.fill(reference);
        await this.textboxReference_LOC.press('Enter');
        console.log(`Searched for shipment with reference: ${reference}`);
    }

    /**
* select action from Action dropdown
* @param action - Action to select from dropdown
* @author Aniket Nale
* @created 17-Nov-2025
*/

    async selectAction(action: string) {
        await commonReusables.waitForPageStable(this.page);
        await this.actionBox.selectOption({ label: action });
        console.log(`Selected action: ${action} from Action dropdown`);
    }

    /**
* Verify load status
* @param expectedStatus - Expected status to verify
* @author Aniket Nale
* @created 17-Nov-2025
*/
//Not seen to be use anywhere else but keeping once ensure will be deleted
    async verifyStatus(expectedStatus: string) {
        const statusLocator = this.loadStatusValue_LOC;
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await statusLocator.first().waitFor({ state: 'visible', timeout: WAIT.LARGE });
        const actualStatus = (await statusLocator.first().innerText())
            .replace("Status:", "")
            .trim();
        expect(actualStatus.toUpperCase()).toBe(expectedStatus);
    }

    /**
*  Click on Plan button
* @author Aniket Nale
* @created 17-Nov-2025
*/
    async clickPlanButton() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.planButton_LOC.click();
        console.log("Clicked on Plan button");
    }

    /**
*  Click on Plus Pickup button and handle popup
* @author Aniket Nale
* @created 18-Nov-2025
*/
    async clickPlusPickupButton() {
        const popupPromise = this.page.waitForEvent("popup");

        await this.plusPickupButton_LOC.click();

        this.popupPage = await popupPromise;
        await this.popupPage.waitForLoadState("domcontentloaded");

        // Assign locators on popup root page
        this.proInputBox_LOC = this.popupPage.locator('#PRO');
        this.pickupSaveButton_LOC = this.popupPage.locator("//input[@onclick='doSubmit()']");
    }

    /**
*  Enter Pro Number in Pickup popup
* @author Aniket Nale
* @created 18-Nov-2025
*/

    async enterProNumber() {
        const proNumber = commonReusables.generateRandomNumber(6);
        await this.proInputBox_LOC.waitFor({ state: 'visible' });
        await this.proInputBox_LOC.fill('');
        await this.proInputBox_LOC.fill(proNumber);
        await this.proInputBox_LOC.press('Tab');
    }

    /**
*  Enter Date and Time in Pickup popup
* @author Aniket Nale
* @created 18-Nov-2025
*/

    async enterDateAndTime(date: string, time: string) {
        const dateInput = this.popupPage.locator('#extDate2-inputEl');
        const timeInput = this.popupPage.locator('#extTime2-inputEl');

        await dateInput.waitFor({ state: 'visible' });
        await dateInput.fill(date);
        await dateInput.press('Tab');

        await timeInput.waitFor({ state: 'visible' });
        await timeInput.fill(time);
        await timeInput.press('Tab');
    }

    /**
*  Click on Pickup Save button in Pickup popup
* @author Aniket Nale
* @created 18-Nov-2025
*/

    async clickPickupSaveButton() {
        await commonReusables.dialogHandler(this.popupPage);
        const popupClosePromise = this.popupPage.waitForEvent("close");
        await this.pickupSaveButton_LOC.click();
        await popupClosePromise; //wait for popup to close
    }

    /**
*  Click on Detail button
* @author Aniket Nale
* @created 18-Nov-2025
*/
    async clickDetailButton() {
        if (this.popupPage && !this.popupPage.isClosed()) {
            throw new Error("Popup is still open — expected it to be closed before clicking Detail button.");
        }
        await this.page.waitForLoadState('domcontentloaded');
        await this.detailButton_LOC.click();
    }

    /**
*  Click on Detail button
* @author Aniket Nale
* @created 19-Nov-2025
*/

    async verifyAccessorialsServices(...expectedValues: string[]): Promise<void> {

        const td = this.serviceValue_LOC.filter({
            has: this.page.locator('b', { hasText: "Services:" })
        });

        let raw = (await td.textContent()) || "";
        raw = raw.replace(/\u00A0/g, " ").trim();

        const labelText = "Services:";
        const actual = raw.replace(labelText, "").trim();

        // Check each expected value is present in the actual text
        for (const expected of expectedValues) {
            await expect(actual).toContain(expected);
        }
    }

    /**
*  Click on Edit Item button to open Edit Item popup
* @author Aniket Nale
* @created 22-Nov-2025
*/

    async clickOnEditItem() {
        const popupPromise = this.page.waitForEvent('popup');
        await this.editItemButton_LOC.click();

        this.editItemPopup = await popupPromise;
        await this.editItemPopup.waitForLoadState('domcontentloaded');

        console.log("Edit Item popup opened");
    }


    /**
*   Select Class value from dropdown in Edit Item popup
* @param classValue - Class value to select
* @author Aniket Nale
* @created 22-Nov-2025
*/

    async selectClassValue(classValue: string) {
        if (!this.editItemPopup) throw new Error("Edit Item popup not initialized");

        const dropdown = this.editItemPopup.locator('#fFreightClass');

        await dropdown.waitFor({ state: 'visible' });
        await dropdown.selectOption({ label: classValue });

        console.log(`Selected Class: ${classValue}`);
    }

    /**
* Change Weight value in Edit Item popup
* @author Aniket Nale
* @created 22-Nov-2025
*/

    async changeWeightValue(weight: string) {
        const el = this.editItemPopup!.locator('#fActualWeight');
        await el.fill(weight);
    }

    /**
* Change Quantity value in Edit Item popup
* @author Aniket Nale
* @created 22-Nov-2025
*/
    async changeQuantityValue(qty: string) {
        const el = this.editItemPopup!.locator('#fActualQuantity');
        await el.fill(qty);
    }

    /**
* Save item changes in Edit Item popup
* @author Aniket Nale
* @created 22-Nov-2025
*/

    async saveItemChanges() {
        if (!this.editItemPopup) {
            throw new Error("Edit Item popup not initialized");
        }
        const saveBtn = this.editItemPopup.locator("input[value=' Save ']");
        await saveBtn.click();
        await this.editItemPopup.waitForEvent("close");

        console.log("Edit Item popup closed after saving.");
    }

    /**
* Click on Add Rate link in Carrier Rates section
* @author Aniket Nale
* @created 22-Nov-2025
*/

    async clickOnAddRate() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.addRateButton_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await this.addRateButton_LOC.click();
        console.log("Clicked on Add Rate link");
    }

    /**
* Click on Carrier Rate combobox
* @author Aniket Nale
* @created 24-Nov-2025
*/

    async clickOnCarrierRateComboBox() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.carrierRateComboBox_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await this.carrierRateComboBox_LOC.click();
        console.log("Clicked on Carrier Rate combobox");
    }

    /**
* Select "ReRate Selected" option from Carrier Rate dropdown
* @param action - Action to select from dropdown
* @author Aniket Nale
* @created 24-Nov-2025
*/

    async selectReRateSelectedOption() {
        await this.page.waitForLoadState('domcontentloaded');

        await this.carrierRateSelectOption_LOC.waitFor({
            state: 'visible',
            timeout: WAIT.LARGE
        });

        await this.carrierRateSelectOption_LOC.selectOption({ label: 'ReRate Selected' });
        await this.page.waitForTimeout(WAIT.SMALL);
        await commonReusables.waitForPageStable(this.page);
        console.log("Selected 'ReRate Selected' option");
    }

    /**
* Handle 'Unable to process request' error if it appears
* @author Aniket Nale
* @created 24-Nov-2025
*/

    async unableToProcessErrorHandling() {
        if (
            await this.unableToProcessError_LOC.isVisible().catch(() => false)
        ) {
            await this.page.waitForLoadState('domcontentloaded');
            await this.page.waitForTimeout(WAIT.SMALL);
            console.log("Handling 'Unable to process request' error by clicking Detail button again.");
            await this.clickPlanButton();
            await this.clickDetailButton();
        }

    }

    /**
* Verify that two rate amounts are different after rerating
* @author Aniket Nale
* @created 24-Nov-2025
*/
    async verifyTwoRateAmountsAreDifferent() {

        await this.page.waitForLoadState('domcontentloaded');
        await this.rateAmountLinks_LOC.first().waitFor({ state: 'visible', timeout: WAIT.XLARGE });
        const texts = await this.rateAmountLinks_LOC.allTextContents();

        if (texts.length < 2) {
            throw new Error(`Expected at least 2 rate amounts, but found ${texts.length}`);
        }

        // Convert text → numeric values
        const amounts = texts.map(t => parseFloat(t.replace(/[^0-9.]/g, '')));

        const [firstAmount, secondAmount] = amounts;

        console.log("Rate Amount 1:", firstAmount);
        console.log("Rate Amount 2:", secondAmount);

        // Ensure the 2 values are not equal
        expect(firstAmount).not.toBe(secondAmount);

        console.log("Old rate and rerated amount are different.");
    }
}
export default TritanAdmin;