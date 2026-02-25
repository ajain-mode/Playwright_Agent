import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

/**
* LCPQuoteLTL - Page Object Model for LTL Quote Request Page on Customer Portal
* @description This class handles validation of Legacy Customer portal Quote Requests in the application across customer portal.
* @author Aniket Nale
*/

export default class LCPQuoteLTL {

    private readonly quoteLTLRequestButton_LOC: Locator;
    private readonly pickLocationInput_LOC: Locator;
    private readonly dropLocationInput_LOC: Locator;
    private readonly addCommodityButton_LOC: Locator;
    private readonly commodityDescription_LOC: Locator;
    private readonly NMFC_LOC: Locator;
    private readonly closeIconBtn: Locator;
    private readonly commodityLWHInput_LOC: Locator;
    private readonly commodityWeightInput_LOC: Locator;
    private readonly commodityQuantityInput_LOC: Locator;
    private readonly commClassDropdown_LOC: Locator;
    private readonly requestTariffsButton_LOC: Locator;
    private readonly tariffTable: Locator;
    private readonly createLoadButton_LOC: Locator;
    private readonly shipperDropdown_LOC: Locator;
    private readonly shipperEarliestDateInput_LOC: Locator;
    private readonly shipperLatestDateInput_LOC: Locator;
    private readonly consigneeDropdown_LOC: Locator;
    private readonly consigneeEarliestDateInput_LOC: Locator;
    private readonly consigneeLatestDateInput_LOC: Locator;
    private readonly finalCreateLoadButton_LOC: Locator;
    private readonly createdLoadId_LOC: Locator;
    private readonly quoteDetailValue_LOC: (label: string) => Locator;
    private readonly plusIconCarrier_LOC: Locator;
    private readonly todaysDate_LOC: Locator;
    private readonly searchLoadInput_LOC: Locator;
    private readonly linkText: (label: string) => Locator;
    private readonly sub1ClassLink_LOC: Locator;

    constructor(private page: Page) {

        this.quoteLTLRequestButton_LOC = page.locator("//a[normalize-space()='Quote LTL']");
        this.pickLocationInput_LOC = page.locator("#ship_zip");
        this.dropLocationInput_LOC = page.locator("#cons_zip");
        this.addCommodityButton_LOC = page.locator("//button[normalize-space()='Add Commodity']");
        this.commodityDescription_LOC = page.locator("#item1_descrip");
        this.NMFC_LOC = page.locator("//div[@class='col-xs-3 col-sm-2']");
        this.closeIconBtn = page.locator("//button[@type='button']/span[@class='ui-button-icon ui-icon ui-icon-closethick']");
        this.commodityLWHInput_LOC = page.locator(".norm .form-control");
        this.commodityWeightInput_LOC = page.locator("#item1_weight");
        this.commodityQuantityInput_LOC = page.locator("#item1_qty");
        this.commClassDropdown_LOC = page.locator("#select2-item1_class-container");
        this.requestTariffsButton_LOC = page.locator("#submit_tariff");
        this.tariffTable = page.locator("#rating_engine_results_table");
        this.createLoadButton_LOC = page.locator("//input[@value='Create Load']");
        this.shipperDropdown_LOC = page.locator("#form_shipper_ship_point");
        this.shipperEarliestDateInput_LOC = page.locator("#form_shipper_earliest_date");
        this.shipperLatestDateInput_LOC = page.locator("#form_shipper_latest_date");
        this.consigneeDropdown_LOC = page.locator("#form_consignee_ship_point");
        this.consigneeEarliestDateInput_LOC = page.locator("#form_consignee_earliest_date");
        this.consigneeLatestDateInput_LOC = page.locator("#form_consignee_latest_date");
        this.finalCreateLoadButton_LOC = page.locator("#form_submit");
        this.createdLoadId_LOC = page.locator("tbody tr:first-child td:first-child a");
        this.quoteDetailValue_LOC = (label: string) =>
            this.page.locator(
                `//div[starts-with(@id,'res_details_') and not(contains(@style,'display: none'))]
         //span[contains(normalize-space(), '${label}')]/parent::p/strong[1]`
            );
        this.plusIconCarrier_LOC = page.locator("//a[@title='Toggle rate details']");
        this.todaysDate_LOC = page.locator("//td[contains(@class, 'today') or contains(@class, 'current') or contains(@class, 'active')]");
        this.searchLoadInput_LOC = page.locator("#form_load_number");
        this.linkText = (label: string) => this.page.locator(`//a[normalize-space()='${label}']`);
        this.sub1ClassLink_LOC = page.locator("//a[normalize-space()='Sub 1']");
    }

    /**
* Navigate to LTL Quote Request Page
* @description This method navigates to the LTL Quote Request Page on Legacy Customer Portal.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async navigateToLTLQuoteRequest() {
        await this.quoteLTLRequestButton_LOC.click();
        console.log("Navigated to LTL Quote Request Page");
    }

    /**
* Enter LTL Quote Request Details and Request Tariffs
* @description This method enters pick and drop details, commodity details and requests tariffs for LTL Quote Request.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async enterPickAndDropDetails(pickupZip: string, dropZip: string) {
        await this.page.waitForLoadState("networkidle");
        await this.pickLocationInput_LOC.fill(pickupZip);
        await this.pickLocationInput_LOC.press('Tab');
        await this.dropLocationInput_LOC.fill(dropZip);
        await this.dropLocationInput_LOC.press('Tab');
        const enteredPickUpZip = await this.pickLocationInput_LOC.inputValue();
        const enteredDeliveryZip = await this.dropLocationInput_LOC.inputValue();
        expect.soft(enteredPickUpZip).toBe(pickupZip);
        expect.soft(enteredDeliveryZip).toBe(dropZip);
    }

    /**
* Select Commodity And Add Details
* @description This method selects commodity and adds details for LTL Quote Request.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async selectCommodityAndAddDetails(description: string, length: string, width: string, height: string, weight: string, quantity: string, commClass: string) {
        await this.page.waitForLoadState("networkidle");
        await this.addCommodityButton_LOC.click();
        await this.commodityDescription_LOC.fill(description);
        await this.commodityDescription_LOC.press('Tab');
        await this.page.waitForLoadState("networkidle");

        try {
            await Promise.race([
                this.NMFC_LOC.first().waitFor({ state: 'visible', timeout: WAIT.XXLARGE }),
                this.page.getByText('Error retrieving results').waitFor({ state: 'visible', timeout: WAIT.XXLARGE }),
                this.page.getByText('No results found').waitFor({ state: 'visible', timeout: WAIT.XXLARGE }),
            ]);
        } catch (error) {
            console.log('Timeout waiting for NMFC or result messages');
        }

        if (await this.page.getByText('No results found').isVisible()) {
            console.log('No results found — refilling description...');
        } else if (await this.page.getByText('Error retrieving results').isVisible()) {
            console.log('Error retrieving results — refilling description...');
        } else if (!(await this.NMFC_LOC.first().isVisible())) {
            console.log('NMFC not visible — refilling description...');
        }

        if (
            (await this.page.getByText('No results found').isVisible()) ||
            (await this.page.getByText('Error retrieving results').isVisible()) ||
            !(await this.NMFC_LOC.first().isVisible())
        ) {
            await this.closeIconBtn.click();
            await this.commodityDescription_LOC.fill(description);
            await this.commodityDescription_LOC.press('Tab');
        }

        await this.NMFC_LOC.first().click();
        await this.page.waitForLoadState("networkidle");
        await this.page.waitForTimeout(WAIT.DEFAULT);
        if (await this.sub1ClassLink_LOC.isVisible({ timeout: WAIT.SMALL })) {
            await this.sub1ClassLink_LOC.click();
        }
        await this.page.waitForLoadState("networkidle");
        if (await this.closeIconBtn.isVisible()) {
            await this.closeIconBtn.click();
        }
        await this.page.waitForLoadState("networkidle");
        if (await this.commClassDropdown_LOC.isVisible()) {
            await this.commClassDropdown_LOC.click();
            await this.page.getByText(commClass).click();
        }
        await this.commodityLWHInput_LOC.nth(0).fill(length);
        await this.commodityLWHInput_LOC.nth(1).fill(width);
        await this.commodityLWHInput_LOC.nth(2).fill(height);
        await this.commodityWeightInput_LOC.fill(weight);
        await this.commodityQuantityInput_LOC.fill(quantity);
        await this.commodityQuantityInput_LOC.press('Tab');
        await this.page.waitForLoadState("networkidle");
        await this.page.waitForLoadState("domcontentloaded");
        await this.page.waitForTimeout(WAIT.DEFAULT);
    }

    /**
* Click On Request Tariffs Button
* @description This method clicks on Request Tariffs button for LTL Quote Request.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async clickOnRequestTariffsButton() {
        await commonReusables.waitForPageStable(this.page);
        await this.page.waitForLoadState("domcontentloaded");
        await this.requestTariffsButton_LOC.scrollIntoViewIfNeeded();
        await expect.soft(this.requestTariffsButton_LOC).toBeVisible({ timeout: WAIT.LARGE });
        await expect.soft(this.requestTariffsButton_LOC).toBeEnabled({ timeout: WAIT.LARGE });
        await this.page.waitForLoadState("domcontentloaded");
        await this.page.waitForLoadState("networkidle");
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await this.requestTariffsButton_LOC.click();
        await this.page.waitForLoadState("networkidle");
    }
    /**
* Wait For Quote Results
* @description This method waits for quote results to be displayed after requesting tariffs.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async waitForQuoteResults() {
        await expect.soft(this.page.getByText('[cancel]')).not.toBeVisible({ timeout: WAIT.SPEC_TIMEOUT });
    }

    /**
* Verify Tariff Table
* @description This method verifies that the tariff table is displayed with results.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async verifyTariffTable() {
        const MAX_RETRIES = 3;
        let attempt = 0;

        await this.page.waitForLoadState("domcontentloaded");
        await this.page.waitForLoadState("networkidle");
        await this.tariffTable.scrollIntoViewIfNeeded();

        while (attempt < MAX_RETRIES) {
            try {
                attempt++;
                console.log(`Attempt ${attempt}: Waiting for tariff table to be visible...`);

                await this.tariffTable.waitFor({ state: 'attached', timeout: WAIT.XLARGE });
                await expect(this.tariffTable).toBeVisible({ timeout: WAIT.XLARGE });

                console.log("Tariff table is visible and loaded.");
                break;
            } catch (error: unknown) {
                const err = error as Error;
                console.warn(`Attempt ${attempt} failed: ${err.message}`);

                if (attempt >= MAX_RETRIES) {
                    throw new Error(`Tariff table did not become visible after ${MAX_RETRIES} attempts`);
                }
                await this.page.waitForTimeout(WAIT.DEFAULT);
            }
        }
        this.createLoadButton_LOC.first().waitFor({ state: "visible", timeout: WAIT.XLARGE })
    }

    /**
* Click On Create Load Button
* @description This method clicks on Create Load button for LTL Quote Request.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async clickOnCreateLoadBtn() {
        await this.page.waitForLoadState("domcontentloaded");
        await this.createLoadButton_LOC.first().click();
        await this.page.waitForLoadState("domcontentloaded");
    }

    /**
* Select Shipper From Dropdown
* @description This method selects shipper from shipper dropdown for LTL Quote Request.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async selectShipperFromDropdown(shipperName: string) {
        await this.shipperDropdown_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.shipperDropdown_LOC.selectOption({ label: shipperName });
    }

    /**
* Enter Shipper Earliest And Latest Date
* @description Helper method to enter shipper earliest and latest date for LTL Quote Request.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async selectTodayFromDatePicker() {
        // Case 1: There is a "Today" button
        const todayBtn = this.page.getByRole("button", { name: /today/i });
        if (await todayBtn.isVisible().catch(() => false)) {
            await todayBtn.click();
            return;
        }

        // Case 2: Today's date cell is highlighted
        const todayCell = this.todaysDate_LOC;

        if (await todayCell.first().isVisible().catch(() => false)) {
            await todayCell.first().click();
            return;
        }

        throw new Error("Today date cell not found. Send datepicker HTML for exact selector.");
    }

    /**
* Enter Shipper Earliest And Latest Date
* @description This method enters shipper earliest and latest date for LTL Quote Request.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async enterShipperEarliestAndLatestDate() {
        await this.shipperEarliestDateInput_LOC.click();
        await this.selectTodayFromDatePicker();
        await this.shipperLatestDateInput_LOC.click();
        await this.selectTodayFromDatePicker();
    }

    /**
* Select Consignee From Dropdown
* @description This method selects consignee from consignee dropdown for LTL Quote Request.
* @author Aniket Nale
* @created 20-Nov-2025
*/
    async selectConsigneeFromDropdown(consigneeName: string) {
        await this.consigneeDropdown_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.consigneeDropdown_LOC.selectOption({ label: consigneeName });
    }

    /**
* Enter Consignee Earliest And Latest Date
* @description This method enters consignee earliest and latest date for LTL Quote Request.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async enterConsigneeEarliestAndLatestDate() {
        await this.consigneeEarliestDateInput_LOC.click();
        await this.selectTodayFromDatePicker();
        await this.consigneeLatestDateInput_LOC.click();
        await this.selectTodayFromDatePicker();
    }

    /**
* Click On Final Create Load Button
* @description This method clicks on Final Create Load button for LTL Quote Request.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async clickOnFinalCreateLoadButton() {
        await this.page.waitForLoadState("domcontentloaded");
        await this.page.waitForLoadState("networkidle");
        await this.finalCreateLoadButton_LOC.click();
        await this.page.waitForLoadState("networkidle");
    }

    /**
* Click First Load And Get ID
* @description This method clicks on the first load in the created loads list and returns its Load ID.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async clickFirstLoadAndGetId() {
        const firstLoadLink = this.createdLoadId_LOC;
        await firstLoadLink.waitFor({ state: "visible", timeout: WAIT.LARGE });
        const loadId = (await firstLoadLink.textContent())?.trim();
        await firstLoadLink.click();
        return loadId;
    }

    /**
* Click On Plus Icon Of Carrier
* @description This method clicks on the plus icon of the carrier to expand rate details.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async clickOnPlusIconOfCarrier() {
        await this.plusIconCarrier_LOC.first().click();
    }

    /**
* Verify Quote Details Not Empty
* @description This method verifies that the specified quote detail labels have non-empty values.
* @author Aniket Nale
* @created 20-Nov-2025
*/

    async verifyQuoteDetailsNotEmpty(labels: string[]): Promise<void> {
        await this.page.waitForLoadState("domcontentloaded");

        for (const label of labels) {
            const valueElement = this.quoteDetailValue_LOC(label);

            await expect(valueElement.first()).toBeVisible({ timeout: WAIT.SMALL });

            const textValue = (await valueElement.textContent())?.trim() || "";
            if (!textValue) throw new Error(`Value for '${label}' is EMPTY!`);

            console.log(`'${label}' is present and not empty: ${textValue}`);
        }
    }

    /**
* Search Load In LCP
* @description This method searches for a load in the Legacy Customer Portal using the provided Load ID.
* @author Aniket Nale
* @created 21-Nov-2025
*/

    async searchLoadInLCP(loadId: string) {
        await this.page.waitForLoadState("domcontentloaded");
        await this.page.waitForLoadState("networkidle");
        await this.searchLoadInput_LOC.fill(loadId);
        await this.searchLoadInput_LOC.press('Enter');
    }

    /**
* Validate Documents
* @description This method validates documents by checking popup and downloaded documents based on the provided list 
* of document types and texts and route them to respective validation methods.
* @author Aniket Nale
* @created 21-Nov-2025
*/

    async validateDocuments(docs: { type: "popup" | "download"; text: string }[]) {
        for (const doc of docs) {
            if (doc.type === "popup") {
                await this.validatePopupDocument(doc.text);
            } else {
                await this.validateDownloadedDocument(doc.text);
            }
        }
    }

    /**
* Validate Popup Document
* @description This method validates a popup document by checking its size after opening it.
* @author Aniket Nale
* @created 21-Nov-2025
*/

    async validatePopupDocument(linkText: string) {
        const locator = this.linkText(linkText);

        const [popup] = await Promise.all([
            this.page.waitForEvent("popup"),
            locator.click()
        ]);

        await popup.waitForLoadState("load");

        const url = popup.url();
        const response = await this.page.request.get(url);
        expect.soft(response.ok()).toBe(true);

        const size = (await response.body()).length / 1024;
        expect.soft(size).toBeGreaterThan(0);

        console.log(`${linkText} popup document size: ${size.toFixed(2)} KB`);

        await popup.close();
    }

    /**
* Validate Downloaded Document
* @description This method validates a downloaded document by checking its size after downloading it.
* @author Aniket Nale
* @created 21-Nov-2025
*/

    async validateDownloadedDocument(linkText: string) {
        const locator = this.linkText(linkText);

        const [download] = await Promise.all([
            this.page.waitForEvent("download"),
            locator.click()
        ]);

        const filePath = await download.path();
        expect.soft(filePath).not.toBeNull();

        const fs = require("fs");
        const stats = fs.statSync(filePath.toString());
        const size = stats.size / 1024;

        expect.soft(size).toBeGreaterThan(0);
        console.log(`${linkText} downloaded document size: ${size.toFixed(2)} KB`);
    }
}