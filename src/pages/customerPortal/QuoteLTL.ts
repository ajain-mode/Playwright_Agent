import { Page, Locator, expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import fs from "fs";

export default class QuoteLTL {

    /**
 * LTLQuoteRequestPage - Page Object Model for LTL Quote Request Page on Customer Portal
 *
 * @description This class handles validation of LTL Quote Requests in the application across customer portal.
 *
 * @author Aniket Nale
 */

    readonly page: Page;
    private readonly ltlQuoteRequestButton: Locator;
    private readonly selectCustomerDropdown: Locator;
    private readonly pickupZipInput: Locator;
    private readonly deliveryZipInput: Locator;
    private readonly continueButton: Locator;
    private readonly commodityDescriptionInput: Locator;
    private readonly nfmcInput: Locator;
    private readonly subMNFCInput: Locator;
    private readonly lengthInput: Locator;
    private readonly widthInput: Locator;
    private readonly heightInput: Locator
    private readonly weightInput: Locator;
    private readonly quantityInput: Locator;
    private readonly typeDropdown: Locator;
    private readonly requestTariffsButton: Locator;
    private readonly quoteTableValue_LOC: (label: string) => Locator;
    private readonly viewDetailsLink: Locator;
    private readonly createLoadButton: Locator;
    private readonly shipperNameInput: Locator;
    private readonly shipperAddressInput: Locator;
    // private readonly verifyAddressButton: Locator;
    // private readonly okButton: Locator;
    private readonly earliestDateDropTabInput_LOC: Locator;
    private readonly consigneeNameInput: Locator;
    private readonly consigneeAddressInput: Locator;
    private readonly ltlLoadCreationSuccessMessage: Locator;
    private readonly closeQuoteDetailsButton: Locator;
    private readonly loadNumberLink: Locator;
    private readonly pickupCityInput: Locator;
    private readonly deliveryCityInput: Locator;
    private readonly ltlCreationOkButton: Locator;
    private readonly loadSearchInput: Locator;
    private readonly bolPDFLink: Locator;
    private readonly shippingLabelPDFLink: Locator;
    private readonly loadingSpinner_LOC: Locator;

    /**
* Constructor to initialize page locators for form validation elements
* @param page - Playwright Page instance for web interactions
*/

    constructor(page: Page) {
        this.page = page;
        this.ltlQuoteRequestButton = page.locator('//a[contains(@class,"nav-link cp-header-tab-sty mx-1")][normalize-space()="Quote LTL"]');
        this.selectCustomerDropdown = page.locator('#qutltl-customer');
        this.pickupZipInput = page.locator('#qutltl-shipinfo-shipmentinfo-puzipcode');
        this.deliveryZipInput = page.locator('#qutltl-shipinfo-shipmentinfo-dezipcode');
        this.continueButton = page.locator('//button[@type="button"][normalize-space()="Continue"]');
        this.commodityDescriptionInput = page.locator('input[id="description:0"]');
        this.nfmcInput = page.locator('.cp-link');
        this.subMNFCInput = page.locator('//a[normalize-space()="Sub 7"]');
        this.lengthInput = page.locator('//input[@placeholder="Enter Length"]');
        this.widthInput = page.locator('//input[@placeholder="Enter Width"]');
        this.heightInput = page.locator('//input[@placeholder="Enter Height"]');
        this.weightInput = page.locator('//input[@placeholder="Enter Weight"]');
        this.quantityInput = page.locator('//input[@placeholder="Enter Quantity"]');
        this.typeDropdown = page.locator('//select[@id="typeInput:0"]');
        this.requestTariffsButton = page.locator('//button[normalize-space()="Request Tariff Rates"]');
        this.quoteTableValue_LOC = (label: string) =>
            this.page.locator(`//td[normalize-space(text())='${label}']/following-sibling::td[1]`);
        this.viewDetailsLink = page.locator('//a[@class="pointer underLine-remover"]');
        this.createLoadButton = page.locator('//button[contains(text(),"Create Load")]');
        this.shipperNameInput = page.locator('#qotto-book-shipper-name');
        this.shipperAddressInput = page.locator('#qotto-book-shipper-address1');
        // this.verifyAddressButton = page.locator('//button[@title="verify-address"]');
        // this.okButton = page.locator('//body/div[@id="root"]/div/div[@class="container-fluid"]/div[@class="mb-5"]/div[6]/div[1]/div[1]/div[3]/button[1]');
        this.earliestDateDropTabInput_LOC = page.locator('#qotto-book-shipper-earliestdate');
        this.consigneeNameInput = page.locator('#qotto-book-consignee-name');
        this.consigneeAddressInput = page.locator('#qotto-book-consignee-address1');
        this.ltlLoadCreationSuccessMessage = page.locator('//h5[normalize-space()="LTL Creation Success!"]');
        this.closeQuoteDetailsButton = page.locator('//div[contains(@class, "modal-header") and contains(@class, "border-0") and contains(@class, "p-3") and contains(@class, "pb-0")]//button[@aria-label="Close"]');
        this.loadNumberLink = page.locator('//a[@class="text-decoration-none ctl-link-color"]');
        this.pickupCityInput = page.locator('#qutltl-shipinfo-shipmentinfo-pucity');
        this.deliveryCityInput = page.locator('#qutltl-shipinfo-shipmentinfo-decity');
        this.ltlCreationOkButton = page.locator('//div[@class="modal-dialog modal-dialog-centered success-popup-width"]//button[@type="button"][normalize-space()="OK"]');
        this.loadSearchInput = page.locator('#al-search-grp');
        this.bolPDFLink = page.locator('//a[normalize-space()="Bill of Lading"]//img[@alt="table-pdf-icon"]');
        this.shippingLabelPDFLink = page.locator('//a[normalize-space()="Shipping label"]//img[@alt="table-pdf-icon"]');
        this.loadingSpinner_LOC = page.locator('//div[@role="status"]');
    }

    /**
* @author Aniket Nale
* @description click on LTL Quote Request Button on Customer Portal
* @created : 2025-11-03
*/

    async clickOnquoteLTLRequestButton() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await expect(this.ltlQuoteRequestButton).toBeVisible({ timeout: WAIT.MID });
        await this.ltlQuoteRequestButton.click();
    }

    /**
 * @author Aniket Nale
 * @description Select customer from dropdown in LTL Quote Request form
 * @created : 2025-11-03
 */
    async selectCustomerFromDropdown(customerName: string) {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle');
        await expect.soft(this.selectCustomerDropdown).toBeVisible({ timeout: WAIT.MID });
        await this.selectCustomerDropdown.selectOption({ label: customerName });
    }


    /**
* @author Aniket Nale
* @description Enter Pickup and Delivery Zip codes in LTL Quote Request form on Customer Portal
* @created : 2025-11-03
*/

    async enterPickUpAndDeliveryZip(pickupZip: string, deliveryZip: string) {
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle');

        await expect.soft(this.pickupZipInput).toBeVisible({ timeout: WAIT.MID });
        await this.pickupZipInput.fill(pickupZip);
        await this.pickupZipInput.press('Tab');

        await expect(this.pickupCityInput).toHaveValue(/.+/, { timeout: WAIT.LARGE });

        await expect.soft(this.deliveryZipInput).toBeVisible({ timeout: WAIT.MID });
        await this.deliveryZipInput.fill(deliveryZip);
        await this.deliveryZipInput.press('Tab');

        await expect(this.deliveryCityInput).toHaveValue(/.+/, { timeout: WAIT.LARGE });
    }


    /**
* @author Aniket Nale
* @description Click on Continue button in LTL Quote Request form on Customer Portal
* @created : 2025-11-03
*/
    async clickOnContinueButton(index: number = 0) {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');

        const continueBtn = this.continueButton.nth(index);
        await continueBtn.waitFor({ state: 'visible', timeout: WAIT.MID });
        await expect.soft(continueBtn).toBeVisible({ timeout: WAIT.MID });
        await continueBtn.click();

        console.log(`Clicked Continue button at index ${index}`);
    }

    /**
* @author Aniket Nale
* @description Enter Commodity Description in LTL Quote Request form on Customer Portal
* @created : 2025-11-03
*/
    async enterCommodityDescription(description: string) {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await expect.soft(this.commodityDescriptionInput).toBeVisible({ timeout: WAIT.MID });
        await this.commodityDescriptionInput.fill(description);
        await this.commodityDescriptionInput.press('Tab');
    }

    /**
* @author Aniket Nale
* @description Select NMFC and Sub NMFC in LTL Quote Request form on Customer Portal
* @created : 2025-11-03
*/

    async selectNMFCAndSubNMFC() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForTimeout(WAIT.DEFAULT);
        try {
            const errorText = "Try revising your search, entering fewer words for more results";
            const isErrorVisible = await this.page.getByText(errorText).isVisible();

            if (isErrorVisible) {
                throw new Error(`${errorText}`);
            }
        } catch (error) {
            try {
                await this.page.locator("//div[@id='nmfc-search-popup']//img[contains(@alt,'search icon')]").click();
            } catch (clickError) {
                console.log("Failed to click search icon:", clickError);
            }
            console.log(`Error while entering commodity description: ${error}`);
            throw error;
        }
        await expect.soft(this.nfmcInput).toBeVisible({ timeout: WAIT.XXLARGE });
        await this.nfmcInput.first().click();

        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await expect.soft(this.subMNFCInput).toBeVisible({ timeout: WAIT.LARGE });
        await this.subMNFCInput.first().click();
    }

    /**
* @author Aniket Nale
* @description Enter Dimensions in LTL Quote Request form on Customer Portal
* @created : 2025-11-03
*/

    async enterDimensions(length: string, width: string, height: string, weight: string, quantity: string, type: string) {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');

        await this.lengthInput.fill(length);
        await this.lengthInput.press('Tab');
        await this.widthInput.fill(width);
        await this.widthInput.press('Tab');
        await this.heightInput.fill(height);
        await this.heightInput.press('Tab');

        await this.weightInput.fill(weight);
        await this.weightInput.press('Tab');
        await this.quantityInput.fill(quantity);
        await this.quantityInput.press('Tab');
        await this.typeDropdown.selectOption(type);
    }

    /**
* @author Aniket Nale
* @description Click on Request Tariffs button in LTL Quote Request form on Customer Portal
* @created : 2025-11-03
*/
    async clickOnRequestTariffsButton() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await expect.soft(this.requestTariffsButton).toBeVisible({ timeout: WAIT.LARGE });
        await this.requestTariffsButton.click();
    }

    /**
* @author Aniket Nale
* @description Verify Quote Details visibility in LTL Quote Request form on Customer Portal
* @created : 2025-11-04
*/
    async verifyQuoteDetailsVisibility(labels: string[]): Promise<void> {
        await this.page.waitForLoadState("domcontentloaded");

        for (const label of labels) {
            const valueCell = this.quoteTableValue_LOC(label);

            await expect(valueCell).toHaveCount(1, { timeout: WAIT.MID });
            await expect(valueCell).toBeVisible({ timeout: WAIT.MID });

            console.log(`'${label}' value cell is visible`);
        }

        await this.closeQuoteDetailsButton.click();
    }


    /**
* @author Aniket Nale
* @description Click on View Details link in LTL Quote Request form on Customer Portal
* @created : 2025-11-04
*/
    async clickOnViewDetailsLink() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await expect.soft(this.viewDetailsLink.first()).toBeVisible({ timeout: WAIT.XLARGE });
        await this.viewDetailsLink.first().click();
    }

    /**
* @author Aniket Nale
* @description Click on Create Load button in LTL Quote Request form on Customer Portal
* @created : 2025-11-04
*/
    async clickOnCreateLoadBtn() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await expect.soft(this.createLoadButton.first()).toBeVisible({ timeout: WAIT.MID });
        await this.createLoadButton.first().click();
    }

    /**
* @author Aniket Nale
* @description  Enter Shipper Details in LTL Quote Request form on Customer Portal
* @created : 2025-11-04
*/

    async enterShipperDetails(shipperName: string, shipperAddress: string) {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');

        await expect.soft(this.shipperNameInput).toBeVisible({ timeout: WAIT.MID });
        await this.shipperNameInput.fill(shipperName);

        await expect.soft(this.shipperAddressInput).toBeVisible({ timeout: WAIT.MID });
        await this.shipperAddressInput.fill(shipperAddress);
        // await this.verifyAddressButton.click();

        // await expect.soft(this.page.getByText("Address has been verified successfully"))
        //     .toBeVisible({ timeout: WAIT.MID });

        // await this.okButton.click();
    }

    /**
* @author Aniket Nale
* @description  Enter Earliest Date in LTL Quote Request form on Customer Portal
* @created : 2025-11-04
*/
    async enterEarliestDateValue(pickDate: string | number) {
        await this.earliestDateDropTabInput_LOC.waitFor({ state: "visible" });
        let formattedDate: string;
        if (typeof pickDate === "string" && pickDate.includes("/")) {
            const parts = pickDate.split("/");
            if (parts[0].length === 2 && parts[2].length === 4) {
                formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            } else {
                formattedDate = pickDate;
            }
        } else {
            formattedDate = new Date(pickDate).toISOString().split("T")[0];
        }

        await this.earliestDateDropTabInput_LOC.fill(formattedDate);
    }


    /**
* @author Aniket Nale
* @description  Enter Consignee Details in LTL Quote Request form on Customer Portal
* @created : 2025-11-04
*/
    async enterConsigneeDetails(consigneeName: string, consigneeAddress: string) {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');

        await expect.soft(this.consigneeNameInput).toBeVisible({ timeout: WAIT.MID });
        await this.consigneeNameInput.fill(consigneeName);

        await expect.soft(this.consigneeAddressInput).toBeVisible({ timeout: WAIT.MID });
        await this.consigneeAddressInput.fill(consigneeAddress);
        // await this.verifyAddressButton.click();

        // await expect.soft(this.page.getByText("Address has been verified successfully"))
        //     .toBeVisible({ timeout: WAIT.MID });

        // await this.okButton.click();
    }

    /**
* @author Aniket Nale
* @description  Verify LTL Load Creation Success message in LTL Quote Request form on Customer Portal
* @created : 2025-11-04
*/
    async verifyLTLLoadCreationSuccess() {
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await expect.soft(this.ltlLoadCreationSuccessMessage).toBeVisible({ timeout: WAIT.LARGE });
        if (await this.ltlLoadCreationSuccessMessage.isVisible()) {
            await this.ltlCreationOkButton.click();
        }
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
* @author Aniket Nale
* @description  Get load Number from LTL Quote Request form on Customer Portal
* @created : 2025-11-04
*/
    async getLoadID(): Promise<string> {
        await this.loadNumberLink.waitFor({ state: 'visible' });
        const linkText = await this.loadNumberLink.textContent();
        if (!linkText) throw new Error("Link text not found");

        const trimmedText = linkText.trim();
        console.log(`Extracted load ID: ${trimmedText}`);
        return trimmedText;
    }

    /**
* @author Aniket Nale
* @description  Search load by ID from LTL Quote Request form on Customer Portal
* @created : 2025-11-06
*/

    async searchLoadByID(loadID: string) {
        await this.loadingSpinner_LOC.first().waitFor({ state: 'hidden', timeout: WAIT.LARGE });
        await expect.soft(this.loadingSpinner_LOC.first()).not.toBeVisible({ timeout: WAIT.LARGE });
        await commonReusables.waitForPageStable(this.page);
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await this.loadSearchInput.waitFor({ state: 'visible', timeout: WAIT.MID });
        await expect.soft(this.loadSearchInput).toBeVisible({ timeout: WAIT.MID });
        await this.loadSearchInput.fill(loadID);
        await this.loadSearchInput.press('Enter');
        await this.loadingSpinner_LOC.first().waitFor({ state: 'hidden', timeout: WAIT.LARGE });
        await expect.soft(this.loadingSpinner_LOC.first()).not.toBeVisible({ timeout: WAIT.LARGE });
    }

    /**
* @author Aniket Nale
* @description  Verify BOL PDF in LTL Quote Request form on Customer Portal
* @created : 2025-11-06
*/

    async verifyBOLPDF() {
        const [newPage] = await Promise.all([
            this.page.waitForEvent("popup"),
            this.bolPDFLink.click()
        ]);

        await newPage.waitForLoadState("load");

        const pdfUrl = newPage.url();
        console.log(`Opened BOL PDF URL: ${pdfUrl}`);

        // Fetch the file using API request
        const response = await this.page.request.get(pdfUrl);
        expect(response.ok()).toBeTruthy();

        // ✅ Validate the server returned a PDF, not by URL but by content-type header
        const contentType = response.headers()["content-type"];
        expect(contentType).toContain("pdf");

        // ✅ Validate PDF has content
        const buffer = await response.body();
        const pdfSizeKB = buffer.length / 1024;

        console.log(`PDF Size: ${pdfSizeKB.toFixed(2)} KB`);
        expect(pdfSizeKB).toBeGreaterThan(0);

        console.log("✅ PDF opened successfully and has valid content.");
    }

    /**
* @author Aniket Nale
* @description  Verify Shipping Label PDF download in LTL Quote Request form on Customer Portal
* @created : 2025-11-06
*/

    async verifyShippingLabelPDFDownload(): Promise<void> {
        // Wait for the download to start after clicking the link
        const [download] = await Promise.all([
            this.page.waitForEvent("download"),
            this.shippingLabelPDFLink.click()
        ]);

        // Get temporary file path of the downloaded file
        const filePath = await download.path();
        expect(filePath).not.toBeNull();

        // Get file details
        const stats = fs.statSync(filePath!);
        const fileSizeKB = stats.size / 1024;

        console.log(`Downloaded Shipping Label PDF Size: ${fileSizeKB.toFixed(2)} KB`);

        // Validate file size is > 0 KB
        expect(fileSizeKB).toBeGreaterThan(0);

        // Optional: Validate the file name format
        const suggestedName = download.suggestedFilename();
        expect(suggestedName).toContain(".pdf");

        console.log(`'${suggestedName}' downloaded successfully and has valid content.`);
    }
}