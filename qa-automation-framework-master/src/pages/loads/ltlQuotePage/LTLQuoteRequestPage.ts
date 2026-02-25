import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class LTLQuoteRequestPage {
    /**
     * LTLQuoteRequestPage - Page Object Model for LTL Quote Request Page
     *
     * @description This class handles validation of LTL Quote Requests in the application.
     *
     * @author Aniket Nale
     */

    readonly page: Page;
    private readonly pickUpZipInput_LOC: Locator;
    private readonly deliveryZipInput_LOC: Locator;
    private readonly addCommodityButton_LOC: Locator;
    private readonly commodityDescription_LOC: Locator;
    private readonly commodityLWHInput_LOC: Locator;
    private readonly commodityWeightInput_LOC: Locator;
    private readonly commodityQuantityInput_LOC: Locator;
    private readonly NMFC_LOC: Locator;
    private readonly closeIconBtn: Locator;
    private readonly commClassDropdown_LOC: Locator;
    private readonly requestTariffsButton_LOC: Locator;
    private readonly tariffTable: Locator;
    private readonly createLoadButton_LOC: Locator;
    private readonly loadStatus_LOC: Locator;
    private readonly chooseCarrierButton_LOC: Locator;
    private readonly expandQuotedRatesTable_LOC: Locator;
    private readonly quoteDetailsValue_LOC: (details: string) => Locator;
    private readonly volumeQuoteNote_LOC: Locator;
    private readonly noRatesMessage_LOC: Locator;
    private readonly linearFeetInput_LOC: Locator;
    private readonly sub1ClassLink_LOC: Locator;

    /**
 * Constructor to initialize page locators for form validation elements
 * @param page - Playwright Page instance for web interactions
 */

    constructor(page: Page) {
        this.page = page;
        this.pickUpZipInput_LOC = page.locator("#ship_zip");
        this.deliveryZipInput_LOC = page.locator("#cons_zip");
        this.addCommodityButton_LOC = page.locator("button[class='btn btn-primary btn-xs add-new-commodity']");
        this.commodityDescription_LOC = page.locator("#item1_cell1 .form-control");
        this.NMFC_LOC = page.locator(".col-xs-3");
        this.commodityLWHInput_LOC = page.locator(".norm .form-control");
        this.commodityWeightInput_LOC = page.locator("#item1_weight");
        this.commodityQuantityInput_LOC = page.locator("#item1_qty");
        this.closeIconBtn = page.locator("span[class='ui-button-icon ui-icon ui-icon-closethick']");
        this.commClassDropdown_LOC = page.locator("#select2-item1_class-container");
        this.requestTariffsButton_LOC = page.locator("#submit_tariff");
        this.tariffTable = page.locator("#rating_engine_results_table");
        this.createLoadButton_LOC = page.locator("//input[@value='Create Load']");
        this.loadStatus_LOC = page.locator("#loadsh_status");
        this.chooseCarrierButton_LOC = page.locator("//input[@value='Choose']");
        this.expandQuotedRatesTable_LOC = page.locator("//a[@title='Toggle rate details']");
        this.quoteDetailsValue_LOC = (details: string) => page.locator(`//span[contains(text(),'${details}:')]/following-sibling::strong[1]`);
        this.volumeQuoteNote_LOC = page.locator("#volume_quote_note");
        this.noRatesMessage_LOC = page.locator("#rating_error_text");
        this.linearFeetInput_LOC = page.locator("#linear_feet_usr");
        this.sub1ClassLink_LOC = page.locator("//a[normalize-space()='Sub 1']");
    }

    private accessorialCheckbox(value: string): Locator {
        return this.page.locator(`//label[input[@value='${value}']]`);
    }

    /**
 *
 * @author Aniket Nale
 * @description Enter value into the LTL Quote Request form fields i.e., PickUp and Delivery Zip
 * @created : 2025-10-06
 */

    async enterPickUpAndDeliveryZip(pickUpZip: string, deliveryZip: string) {
        await this.page.waitForLoadState("networkidle");
        await this.pickUpZipInput_LOC.fill(pickUpZip);
        await this.pickUpZipInput_LOC.press('Tab');
        await this.deliveryZipInput_LOC.fill(deliveryZip);
        await this.deliveryZipInput_LOC.press('Tab');
        const enteredPickUpZip = await this.pickUpZipInput_LOC.inputValue();
        const enteredDeliveryZip = await this.deliveryZipInput_LOC.inputValue();
        expect.soft(enteredPickUpZip).toBe(pickUpZip);
        expect.soft(enteredDeliveryZip).toBe(deliveryZip);
    }

    /**
*
* @author Aniket Nale
* @description Enter value into the LTL Quote Request form fields i.e., Commodity Details, NMFC Code, Class, LWH, Weight, Quantity
* @created : 2025-10-06
*/

    async selectCommodityAndAddDetails(description: string, commClass: string, length: string, width: string, height: string, weight: string, quantity: string) {
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

    async enterLinearFeet(length: string) {
        await this.page.waitForLoadState("networkidle");
        if (await this.linearFeetInput_LOC.isVisible({ timeout: WAIT.LARGE })) {
            await this.linearFeetInput_LOC.fill(length);
            await this.linearFeetInput_LOC.press('Tab');
            const enteredLinearFeet = await this.linearFeetInput_LOC.inputValue();
            expect.soft(enteredLinearFeet).toBe(length);
        } else {
            console.log("Linear Feet input not visible, skipping entry.");
        }
    }

    /**
*
* @author Aniket Nale
* @description Request Tariffs by clicking on the Request Tariffs button
* @created : 2025-10-06
*/

    async clickOnRequestTariffsButton(verifyCancelHidden = true) {
        await commonReusables.waitForPageStable(this.page);
        await this.page.waitForLoadState("domcontentloaded");
        await this.requestTariffsButton_LOC.scrollIntoViewIfNeeded({ timeout: WAIT.LARGE });
        await expect.soft(this.requestTariffsButton_LOC).toBeVisible({ timeout: WAIT.LARGE });
        await expect.soft(this.requestTariffsButton_LOC).toBeEnabled({ timeout: WAIT.LARGE });
        await commonReusables.waitForPageStable(this.page);
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await this.requestTariffsButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);

        /**
        * @author Aniket Nale
        * @description Handle verification of [cancel] button visibility based on parameter as per test case requirement
        * @modified 10-Nov-25
        */
        if (verifyCancelHidden) {
            await expect.soft(this.page.getByText('[cancel]')).not.toBeVisible({ timeout: WAIT.SPEC_TIMEOUT });
        }
    }

    /**
*
* @author Aniket Nale
* @description Verify whether Tariff Table is visible after requesting tariffs
* @created : 2025-10-06
* @modified : 2025-11-01 - Added extra validation as per test case requirement
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
        await Promise.race([
            this.chooseCarrierButton_LOC.first().waitFor({ state: "visible", timeout: WAIT.XLARGE }),
            this.createLoadButton_LOC.first().waitFor({ state: "visible", timeout: WAIT.XLARGE })
        ]);
    }

    /**
*
* @author Aniket Nale
* @description CLick on Create Load button
* @created : 2025-10-06
*/

    async clickOnCreateLoadBtn() {
        await this.page.waitForLoadState("domcontentloaded");
        await this.createLoadButton_LOC.first().click();
        await this.page.waitForLoadState("domcontentloaded");
    }

    /**
*
* @author Aniket Nale
* @description Verify whether load status is BOOKED after creating load
* @created : 2025-10-06
*/

    async verifyBookedStatus() {
        await this.page.waitForLoadState("networkidle");
        await expect(this.loadStatus_LOC).toHaveValue(LOAD_STATUS.BOOKED);
    }

    /**
*
* @author Aniket Nale
* @description Verify whether load status is DISPATCHED after dispatching load
* @created : 2025-10-08
*/

    async verifyDispatchedStatus() {
        await this.page.waitForLoadState("domcontentloaded");
        await this.page.waitForLoadState("networkidle");
        await this.loadStatus_LOC.waitFor({ state: 'attached', timeout: WAIT.LARGE });
        await this.page.waitForFunction(() => {
            const el = document.querySelector('#loadsh_status');
            return el && el.textContent?.trim() === 'DISPATCHED';
        });
        await expect(this.loadStatus_LOC).toHaveText(LOAD_STATUS.DISPATCHED);
    }

    /**
*
* @author Aniket Nale
* @description select Accessorials from the list of available accessorials on LTL Quote Request Page
* @param targetTexts - Array of accessorial names to be selected
* @created : 2025-10-16
*/

    async selectAccessorialsByValue(targetValues: string[]) {
        for (const value of targetValues) {
            const checkboxLabel = this.accessorialCheckbox(value);
            const input = this.page.locator(`input[type="checkbox"][value='${value}']`);

            await checkboxLabel.waitFor({ state: 'visible', timeout: WAIT.LARGE });
            await input.waitFor({ state: 'attached', timeout: WAIT.LARGE });

            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                attempts++;
                await checkboxLabel.scrollIntoViewIfNeeded();

                try {
                    await checkboxLabel.click({ force: true });
                } catch {
                    await checkboxLabel.click({ force: true });
                }

                const isChecked = await input.isChecked();
                if (isChecked) {
                    console.log(`Checkbox with value ${value} is checked after ${attempts} attempt(s)`);
                    break;
                }

                await this.page.waitForTimeout(WAIT.DEFAULT / 6);
            }
            await expect(input).toBeChecked({ timeout: WAIT.LARGE });
        }
    }


    /**
*
* @author Aniket Nale
* @description  Choose Carrier from the tariff table on LTL Quote Request Page
* @created : 2025-10-31
*/
    async chooseCarrier(first?: string) {
        await this.page.waitForLoadState("networkidle");
        //@modified: Rohit Singh - 04-Oct-2025 - Added logic to choose first or last carrier based on parameter
        // const carrierButton = this.chooseCarrierButton_LOC.last();
        let carrierButton;
        if (first?.toLowerCase() === 'first') {
            carrierButton = this.chooseCarrierButton_LOC.first();
        } else {
            carrierButton = this.chooseCarrierButton_LOC.last();
        }

        await carrierButton.scrollIntoViewIfNeeded();
        await expect.soft(carrierButton).toBeVisible({ timeout: WAIT.MID });
        await expect.soft(carrierButton).toBeEnabled({ timeout: WAIT.MID });
        await this.page.waitForLoadState("domcontentloaded");

        await Promise.all([
            this.page.waitForEvent("dialog").then(async (dialog) => {
                console.log(`Alert Message: ${dialog.message()}`);
                await dialog.accept();
                console.log("Alert accepted");
            }),
            carrierButton.click(),
        ]);

        await this.page.waitForLoadState("networkidle");
        await this.page.waitForLoadState("domcontentloaded");
    }
    /**
     * @author Rohit Singh
     * @description Expands the quoted rates table to show detailed rate information
     * @created  : 2025-11-03
     */
    async expandQuotedRatesTable() {
        await this.page.waitForLoadState("networkidle");
        await this.expandQuotedRatesTable_LOC.first().waitFor({ state: "visible", timeout: WAIT.MID });
        await this.expandQuotedRatesTable_LOC.first().click();
    }
    /**
     * @author Rohit Singh
     * @description Retrieves the value of a specific quote detail from the expanded quoted rates table
     * @param details - The specific detail to retrieve (e.g., "Quote #", "Rate", etc.)
     * @created  : 2025-11-03
     * @return The text content of the specified quote detail
     */
    async getQuoteDetailsValue(details: string, requiredDetail?: boolean): Promise<string | boolean> {
        await this.page.waitForLoadState("networkidle");
        if (requiredDetail) {
            const detailText = await this.quoteDetailsValue_LOC(details).first().textContent();
            return detailText || "";
        } else {
            const isVisible = await this.quoteDetailsValue_LOC(details).first().isVisible();
            console.log(`Is "${details}" detail visible? : ${isVisible}`);
            return isVisible;
        }
    }

    /**
 * @author Aniket Nale
 * @description Verify Volume Quote Note availability on LTL Quote Request Page
 * @created  : 10-Nov-25
 */

    async verifyVolumeQuoteOptionAvailability() {
        await commonReusables.waitForPageStable(this.page);
        await expect.soft(this.volumeQuoteNote_LOC).toBeVisible({ timeout: WAIT.MID });
        console.log("Volume Quote Note is available as expected.");
    }

    /**
* @author Aniket Nale
* @description Verify No Rates Returned for Volume Quote on LTL Quote Request Page
* @created  : 10-Nov-25
*/
    async noRatesReturnedForVolumeQuote() {
        await commonReusables.waitForPageStable(this.page);
        const isTariffTableVisible = await this.tariffTable.isVisible();
        expect.soft(isTariffTableVisible).toBeFalsy();
        console.log("No rates returned for volume quote as expected.");
        await expect.soft(this.noRatesMessage_LOC).toBeVisible({ timeout: WAIT.MID });
    }
}