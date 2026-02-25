import { expect, FrameLocator, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

/**
 * Page Object for Add Quick Quote Page in TRITAN Customer Demo Portal
 * @description This class encapsulates all interactions with the Add Quick Quote page,
 * including entering shipping info, item details, selecting assessorials, getting rates,
 * and booking shipments.
 * @author Rohit Singh
 * @created 2025-Oct-28
 */

class AddQuickQuotePage {
    readonly page: Page;
    private readonly frame: FrameLocator;
    private readonly enterShippingInfoText_LOC: Locator;
    private readonly originZipInput_LOC: Locator;
    private readonly pickupDateInput_LOC: Locator;
    private readonly destZipInput_LOC: Locator;
    private readonly qtyInput_LOC: Locator;
    private readonly lengthInput_LOC: Locator;
    private readonly widthInput_LOC: Locator;
    private readonly heightInput_LOC: Locator;
    private readonly weightInput_LOC: Locator;
    private readonly itemDescriptionInput_LOC: Locator;
    private readonly estimateFreightClassButton_LOC: Locator;
    private readonly estimateNoteValue_LOC: Locator;
    private readonly assessorialCheckbox_LOC: (assessorial: string) => Locator;
    private readonly getRateButton_LOC: Locator;
    private readonly waitLoaderSpinner_LOC: Locator;
    private readonly lowestRateBookButton_LOC: Locator;
    private readonly pickNameInput_LOC: Locator;
    private readonly pickAddressInput_LOC: Locator;
    private readonly pickContactNameInput_LOC: Locator;
    private readonly pickPhoneInput_LOC: Locator;
    private readonly pickEmailInput_LOC: Locator;
    private readonly deliveryNameInput_LOC: Locator;
    private readonly deliveryAddressInput_LOC: Locator;
    private readonly deliveryContactNameInput_LOC: Locator;
    private readonly deliveryPhoneInput_LOC: Locator;
    private readonly deliveryEmailInput_LOC: Locator;
    private readonly acceptTermsCheckbox_LOC: Locator;
    private readonly bookButton_LOC: Locator;
    private readonly bookingSuccessMSGValue_LOC: Locator;

    constructor(page: Page) {
        this.page = page;
        this.frame = page.locator('iframe[name="AppBody"]').contentFrame().locator('#Detail').contentFrame().locator('iframe[name="winquickAddQuoteIFrame"]').contentFrame();
        this.enterShippingInfoText_LOC = this.frame.locator("//span[text()='Enter shipping info']");
        this.originZipInput_LOC = this.frame.locator("#originPostal");
        this.pickupDateInput_LOC = this.frame.locator("input#pickupDate");
        this.destZipInput_LOC = this.frame.locator("#destPostal");
        this.qtyInput_LOC = this.frame.locator("#itemQty1");
        this.lengthInput_LOC = this.frame.locator("#itemLen1");
        this.widthInput_LOC = this.frame.locator("#itemWid1");
        this.heightInput_LOC = this.frame.locator("#itemHgt1");
        this.weightInput_LOC = this.frame.locator("#itemWeight1");
        this.itemDescriptionInput_LOC = this.frame.locator("#itemDesc1");
        this.estimateFreightClassButton_LOC = this.frame.locator("#estimateFClass1");
        this.estimateNoteValue_LOC = this.frame.locator("//div[contains(text(),'This is an estimate.')]");
        this.assessorialCheckbox_LOC = (assessorial: string) => this.frame.locator(`//span[text()='${assessorial}']`)
        this.getRateButton_LOC = this.frame.locator("div#getRates");

        this.waitLoaderSpinner_LOC = this.frame.locator("//div[@class='pleasewaitmodal']");
        this.lowestRateBookButton_LOC = this.frame.locator("//div[text()='LOWEST RATE']/ancestor::td/following-sibling::td//div[text()='Book ']");

        this.pickNameInput_LOC = this.frame.locator("#originName");
        this.pickAddressInput_LOC = this.frame.locator("#originAddr1");
        this.pickContactNameInput_LOC = this.frame.locator("#originContactName");
        this.pickPhoneInput_LOC = this.frame.locator("#originContactPhone");
        this.pickEmailInput_LOC = this.frame.locator("#originContactEmail");

        this.deliveryNameInput_LOC = this.frame.locator("#destName");
        this.deliveryAddressInput_LOC = this.frame.locator("#destAddr1");
        this.deliveryContactNameInput_LOC = this.frame.locator("#destContactName");
        this.deliveryPhoneInput_LOC = this.frame.locator("#destContactPhone");
        this.deliveryEmailInput_LOC = this.frame.locator("#destContactEmail");
        this.acceptTermsCheckbox_LOC = this.frame.locator("label#acceptTermsScrollTo");
        this.bookButton_LOC = this.frame.locator("div#bookButton");
        this.bookingSuccessMSGValue_LOC = this.frame.locator("//span[contains(text(),'Your shipment has been successfully booked.')]");
    }
    /**
     * Enters pickup details for the shipment.
     * @param originZip - The origin ZIP code.
     * @author Rohit Singh
     * @created 2025-Oct-28
     */
    async enterPickDetails(originZip: string) {
        await this.enterShippingInfoText_LOC.waitFor({ state: 'visible', timeout: WAIT.XLARGE });
        await this.originZipInput_LOC.fill(originZip);
        await this.pickupDateInput_LOC.fill(await commonReusables.getDate("tomorrow", 'MM/DD/YYYY'));
        console.log("Pickup Zip and Date entered successfully");
    }
    /**
     * Enters destination details for the shipment.
     * @param destZip - The destination ZIP code.
     * @author Rohit Singh
     * @created 2025-Oct-28
     */
    async enterDestinationDetails(destZip: string) {
        await this.destZipInput_LOC.fill(destZip);
        console.log("Destination Zip entered successfully");
    }
    /**
     * Enters item details for the shipment.
     * @param qty - The quantity of the item.
     * @param length - The length of the item.
     * @param width - The width of the item.
     * @param height - The height of the item.
     * @param weight - The weight of the item.
     * @param description - The description of the item.
     * @author Rohit Singh
     * @created 2025-Oct-28
     */
    async enterItemDetails(qty: string, length: string, width: string, height: string, weight: string, description: string) {
        await this.qtyInput_LOC.fill(qty);
        await this.lengthInput_LOC.fill(length);
        await this.widthInput_LOC.fill(width);
        await this.heightInput_LOC.fill(height);
        await this.weightInput_LOC.fill(weight);
        console.log("Item dimensions entered successfully");
        await this.itemDescriptionInput_LOC.fill(description);
        console.log("Item description entered successfully");
        await this.estimateFreightClassButton_LOC.click();
        await this.estimateNoteValue_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        console.log("Freight class estimated successfully");
    }
    /**
     * Selects the specified assessorials for the shipment.
     * @param assessorial1 - The first assessorial to select.
     * @param assessorial2 - The second assessorial to select.
     * @author Rohit Singh
     * @created 2025-Oct-28
     */
    async selectAssessorials(assessorial1: string, assessorial2: string) {
        await this.assessorialCheckbox_LOC(assessorial1).click();
        await this.assessorialCheckbox_LOC(assessorial2).click();
        console.log("Assessorials selected successfully");
    }
    /**
     * Clicks the Get Rates button and waits for rates to be fetched.
     * @author Rohit Singh
     * @created 2025-Oct-28
     */
    async clickGetRatesButton() {
        await this.getRateButton_LOC.click();
        await this.waitLoaderSpinner_LOC.waitFor({ state: 'hidden', timeout: WAIT.XLARGE * 2 });
        console.log("Rates fetched successfully");
    }
    /**
     * Books the lowest rate quote available.
     * @author Rohit Singh
     * @created 2025-Oct-28
     */
    async bookLowestRateQuote() {
        await this.lowestRateBookButton_LOC.waitFor({ state: 'visible', timeout: WAIT.XXLARGE });
        await this.lowestRateBookButton_LOC.click();
        console.log("Lowest rate quote booked successfully");
    }
    /**
     * Enters delivery details for the shipment.
     * @param name 
     * @param address 
     * @param contactName 
     * @param phone 
     * @param email 
     * @author Rohit Singh
     * @created 2025-Oct-28
     */
    async enterPickupDetails(name: string, address: string, contactName: string, phone: string, email: string) {
        await this.pickNameInput_LOC.fill(name);
        await this.pickAddressInput_LOC.fill(address);
        await this.pickContactNameInput_LOC.fill(contactName);
        await this.pickPhoneInput_LOC.fill(phone);
        await this.pickEmailInput_LOC.fill(email);
        console.log("Pickup details entered successfully");
    }
    /**
     * Enters pickup details for the shipment.
     * @param name - The name of the person picking up the shipment.
     * @param address - The address for the pickup location.
     * @param contactName - The contact person's name.
     * @param phone - The contact phone number.
     * @param email - The contact email address.
     * @author Rohit Singh
     * @created 2025-Oct-28
     */
    async enterDeliveryDetails(name: string, address: string, contactName: string, phone: string, email: string) {
        await this.deliveryNameInput_LOC.fill(name);
        await this.deliveryAddressInput_LOC.fill(address);
        await this.deliveryContactNameInput_LOC.fill(contactName);
        await this.deliveryPhoneInput_LOC.fill(phone);
        await this.deliveryEmailInput_LOC.fill(email);
        console.log("Delivery details entered successfully");
    }
    /**
     * Accepts terms and books the shipment.
     * @author Rohit Singh
     * @created 2025-Oct-28
     * @modified 2025-Nov-17
     * @author Aniket Nale
     * @description Modified to handle download event during booking added wait for download event using Promise.all
     */
    async acceptTermsAndBookShipment() {
        await this.acceptTermsCheckbox_LOC.click();
        await Promise.all([
            this.page.waitForEvent("download"),   // catch download BEFORE iframe navigates
            this.bookButton_LOC.click()
        ]);
        console.log("Shipment booking initiated successfully");
    }

    /**
     * Validates the shipment booking success message and extracts the reference number.
     * @returns The shipment reference number if booking is successful.
     * @author Rohit Singh
     * @created 2025-Oct-28
     */
    async validateShipmentBookingSuccessMessage() {
        await this.bookingSuccessMSGValue_LOC.waitFor({ state: 'visible', timeout: WAIT.XLARGE * 2 });
        const isVisible = await this.bookingSuccessMSGValue_LOC.isVisible();
        await expect.soft(isVisible).toBeTruthy();
        const successText = await this.bookingSuccessMSGValue_LOC.textContent();
        if (successText) {
            // Extract the reference number using regex
            const match = successText.match(/reference number is (\d+)/);
            return match ? match[1] : '';
        }
        console.log("Shipment booking success message validated");
        return '';
    }
}
export default AddQuickQuotePage;