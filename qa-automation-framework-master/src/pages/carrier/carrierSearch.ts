import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

/**
 * @author Aniket Nale
 * @created 25-Nov-25
 * @description CarrierSearch Page Object - Handles actions related to the carrier search page
 */

export default class CarrierSearch {

    private readonly mcCarrierSearchInput: Locator;
    private readonly clickOnSearchButton_LOC: Locator;
    private readonly statusDropdownIconButton_LOC: Locator;
    private readonly activeText: Locator;
    private readonly carrierNameCell_LOC: (carrierName: string) => Locator;
    private readonly getMcCellLocator: (padded: string) => Locator;
    private readonly getDotCellLocator: (dot: string) => Locator;
    private readonly dotCarrierSearchInput: Locator;
    private readonly carrierNameInput: Locator;
    private readonly getNameCellLocator: (carrierName: string) => Locator;
    private readonly intraStateCarrierSearchInput: Locator;
    private readonly getIntraStateCellLocator: (fullValue: string) => Locator;
    private readonly activeCarrierStateCell: Locator;
    private readonly ffCarrierSearchInput: Locator;
    private readonly getFFCellLocator: (ffNumber: string) => Locator;
    private readonly carrierIDCarrierSearchInput: Locator;
    private readonly getCarrierIDCellLocator: (carrierID: string) => Locator;
    private readonly mxCarrierSearchInput: Locator;
    private readonly getMxCellLocator: (mxNumber: string) => Locator;

    private readonly noRecordsFoundValue_LOC: Locator;
    private readonly carrierStatusValue_LOC: (carrierStatus: string) => Locator;
    private readonly clearButton_LOC: Locator;
    private readonly carrierListTableData_LOC: (dataToViisible: string) => Locator;
    private readonly factorNameInput_LOC: Locator;
    private readonly factorValue_LOC: (factorName: string) => Locator;
    private readonly toggleSelection_LOC: (toggleName: string) => Locator;
    private readonly expandFilterButton_LOC: Locator;
    private readonly searchDropDownExpandButton_LOC: (filterName: string) => Locator;
    private readonly dropdownValues_LOC: (value: string) => Locator;
    private readonly checkToggleGroup_LOC: (toggleName: string) => Locator;
    private readonly checkToggleInput_LOC: (toggleName: string) => Locator;
    private readonly checkToggleClickTarget_LOC: (toggleName: string) => Locator;

    constructor(private page: Page) {
        this.mcCarrierSearchInput = page.locator('#search_mc_num');
        this.clickOnSearchButton_LOC = page.locator('//input[@class=\'submit-report-search\']');
        this.activeText = page.locator("//span[text()='Active']");
        this.statusDropdownIconButton_LOC = page.locator("//div[@id='search_status_magic']//div[@class='ms-trigger-ico']");
        this.carrierNameCell_LOC = (carrierName: string) => page.locator(`//td[normalize-space()='${carrierName}']`);
        this.getMcCellLocator = (padded: string) => page.locator(`//tr[td[normalize-space()='${padded}'] and td//div[normalize-space()='ACTIVE']]//td[2]`);
        this.dotCarrierSearchInput = page.locator('#search_dot_num');
        this.getDotCellLocator = (dot: string) => page.locator(`//tr[td[normalize-space()='${dot}'] and td//div[normalize-space()='ACTIVE']]//td[3]`);
        this.carrierNameInput = page.locator('#search_name');
        this.getNameCellLocator = (carrierName: string) => page.locator(`//tr[td[normalize-space()='${carrierName}'] and td//div[normalize-space()='ACTIVE']]//td[6]`);
        this.intraStateCarrierSearchInput = page.locator('#search_st_num');
        this.activeCarrierStateCell = page.locator("//tr[td//div[normalize-space()='ACTIVE']]//td[10]");
        this.getIntraStateCellLocator = (fullValue: string) => page.locator(`//tr[td[normalize-space()='${fullValue}'] and td//div[normalize-space()='ACTIVE']]//td[4]`);
        this.ffCarrierSearchInput = page.locator('#search_ff_num');
        this.getFFCellLocator = (ffNumber: string) => page.locator(`//tr[td[normalize-space()='${ffNumber}'] and td//div[normalize-space()='ACTIVE']]//td[30]`);
        this.carrierIDCarrierSearchInput = page.locator('#search_carrier_id');
        this.getCarrierIDCellLocator = (carrierID: string) => page.locator(`//tr[td[normalize-space()='${carrierID}'] and td//div[normalize-space()='ACTIVE']]//td[31]`);
        this.mxCarrierSearchInput = page.locator('#search_mx_num');
        this.getMxCellLocator = (mxNumber: string) => page.locator(`//tr[td[normalize-space()='${mxNumber}'] and td//div[normalize-space()='ACTIVE']]//td[29]`);

        this.noRecordsFoundValue_LOC = page.locator("//h4[text()='No matching records found']");
        this.carrierStatusValue_LOC = (carrierStatus: string) => page.locator(`//span[text()='${carrierStatus}']`);
        this.clearButton_LOC = page.locator("//input[@class='submit-report-search']/following-sibling::input[@value='Clear']");
        this.carrierListTableData_LOC = (dataToViisible: string) => page.locator(`//td[contains(text(),'${dataToViisible}')]`);
        this.factorNameInput_LOC = page.locator("//div[@id='search_factor_ids_magic']//input");
        this.factorValue_LOC = (factorName: string) => page.locator(`//em[text()='${factorName}']`);
        this.toggleSelection_LOC = (toggleName: string) => page.locator(`//div[@class='slider-select']/label[text()='${toggleName}']/following-sibling::div//div[@class='slider-selection']`);
        this.expandFilterButton_LOC = page.locator("#btnFilter");
        this.searchDropDownExpandButton_LOC = (filterName: string) => page.locator(`//label[text()='${filterName}']/parent::div/following-sibling::div//div[@class='ms-trigger-ico']`);
        this.dropdownValues_LOC = (value: string) => page.locator(`//span[text()='${value}']`);
        this.checkToggleGroup_LOC = (toggleName: string) => page.locator(`//div[contains(@class,'radio-select')][label[normalize-space()='${toggleName}']]`);
        this.checkToggleInput_LOC = (toggleName: string) => this.checkToggleGroup_LOC(toggleName).locator('input[type="checkbox"]');
        this.checkToggleClickTarget_LOC = (toggleName: string) => this.checkToggleGroup_LOC(toggleName).locator('div.radio > label[for]');
    }

    /**
* @author Aniket Nale
* @created 26-Nov-25
* @description This Helper Fills the search input with the provided value.
* @param locator - The locator of the input field.
* @param value - The value to fill in the input field.
* @param label - The label of the input field for logging purposes.
*/

    private async fillSearchInput(locator: Locator, value: string, label: string): Promise<void> {
        await commonReusables.waitForPageStable(this.page);
        await locator.waitFor({ state: "visible", timeout: WAIT.LARGE });
        //@modified: Rohit Singh - 2025-12-02 - To clear the input field before filling to avoid concatenation issue
        await locator.clear().then(() => locator.fill(value));
        // await locator.fill(value);
        console.log(`Entered ${label}: ${value} in carrier search page`);
    }


    /**
 * @author Aniket Nale
 * @created 25-Nov-25
 * @description Searches for a carrier using the provided MC number.
 * @param mcNumber - The MC number of the carrier to search for.
 * @param locator - The locator of the input field.
 * @param label - The label of the input field for logging purposes.
 */

    async mcNoInputOnCarrierPage(mcNumber: string): Promise<void> {
        await this.fillSearchInput(this.mcCarrierSearchInput, mcNumber, "MC Number");
    }

    /**
* @author Aniket Nale
* @created 25-Nov-25
* @description Selects 'Active' status from the status dropdown on the carrier search page.
*/

    async selectActiveOnCarrier() {
        await this.statusDropdownIconButton_LOC.click();
        await this.activeText.click();
    }

    /**
* @author Aniket Nale
* @created 25-Nov-25
* @description Clicks on the search button to perform the carrier search.
*/

    async clickOnSearchButton(): Promise<void> {
        await commonReusables.waitForPageStable(this.page);
        await this.clickOnSearchButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
* @author Aniket Nale
* @created 25-Nov-25
* @description Verifies that the MC number input on the carrier search page matches the expected value.
* @param mcNumber - The MC number to verify.
*/
    async verifyMCNoInputOnCarrierSearchPage(mcNumber: string) {
        await commonReusables.waitForPageStable(this.page);
        const padded = mcNumber.padStart(8, "0");
        const mcCell = this.getMcCellLocator(padded);
        await expect(mcCell).toHaveText(padded, { timeout: WAIT.LARGE });
        console.log(`Verified MC number: ${padded} in carrier search results`);
    }

    /**
* @author Aniket Nale
* @created 25-Nov-25
* @description Searches for a carrier by name and clicks on it to view details.
* @param carrierName - The name of the carrier to search for.
*/
    async selectCarrierByName(carrierName: string) {
        await this.carrierNameCell_LOC(carrierName).waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.carrierNameCell_LOC(carrierName).click();
        console.log(`Clicked on carrier with name: ${carrierName} to view details`);
    }

    /**
* @author Aniket Nale
* @created 25-Nov-25
* @description Searches for a carrier using the provided DOT number.
* @param locator - The locator of the input field.
* @param dotNumber - The DOT number of the carrier to search for.
* @param label - The label of the input field for logging purposes.
*/

    async dotNoInputOnCarrierPage(dotNumber: string): Promise<void> {
        await this.fillSearchInput(this.dotCarrierSearchInput, dotNumber, "DOT Number");
    }

    /**
* @author Aniket Nale
* @created 25-Nov-25
* @description Verifies that the DOT number input on the carrier search page matches the expected value.
* @param dotNumber - The DOT number to verify.
*/
    async verifyDotNoInputOnCarrierSearchPage(dotNumber: string) {
        await commonReusables.waitForPageStable(this.page);
        const dotCell = this.getDotCellLocator(dotNumber);
        await expect(dotCell).toHaveText(dotNumber, { timeout: WAIT.LARGE });
    }

    /**
* @author Aniket Nale
* @created 26-Nov-25
* @description Searches for a carrier using the provided name.
* @param locator - The locator of the input field.
* @param value - The value to fill in the input field.
* @param label - The label of the input field for logging purposes.
*/
    async nameInputOnCarrierPage(carrierName: string): Promise<void> {
        await this.fillSearchInput(this.carrierNameInput, carrierName, "Carrier Name");
    }

    /**
* @author Aniket Nale
* @created 26-Nov-25
* @description Verifies that the name input on the carrier search page matches the expected value.
* @param carrierName - The name of the carrier to verify.
*/
    async verifyNameInputOnCarrierSearchPage(carrierName: string) {
        await commonReusables.waitForPageStable(this.page);
        const nameCell = this.getNameCellLocator(carrierName);
        await expect(nameCell).toHaveText(carrierName, { timeout: WAIT.LARGE });
    }

    /**
* @author Aniket Nale
* @created 26-Nov-25
* @description Searches for a carrier using the provided name.
* @param locator - The locator of the input field.
* @param value - The value to fill in the input field.
* @param label - The label of the input field for logging purposes.
*/
    async intraStateInputOnCarrierPage(intraStateNumber: string): Promise<void> {
        await this.fillSearchInput(this.intraStateCarrierSearchInput, intraStateNumber, "Intrastate Number");
    }

    /**
* @author Aniket Nale
* @created 27-Nov-25
* @description Get state code for active carrier from search result and verify Intrastate number input on the carrier search page.
* @param text - Get state code text.
*/
    async getStateCodeForActiveCarrier(): Promise<string> {
        const text = await this.activeCarrierStateCell.textContent();
        return text?.trim() || "";
    }

    /**
* @author Aniket Nale
* @created 27-Nov-25
* @description Verifies that the Intrastate number input on the carrier search page matches the expected value.
* @param expected - The Intrastate number to verify using state code.
*/

    async verifyIntraStateInputOnCarrierSearchPage(intraStateNumber: string) {
        await commonReusables.waitForPageStable(this.page);

        const stateCode = await this.getStateCodeForActiveCarrier();
        const expected = `${stateCode} ${intraStateNumber}`;
        const cell = this.getIntraStateCellLocator(expected);
        await expect(cell).toHaveText(expected, { timeout: WAIT.LARGE });
        console.log(`Verified Intrastate number: ${expected} in carrier search results`);
    }

    /**
* @author Aniket Nale
* @created 02-Dec-25
* @description Searches for a carrier using the provided FF number.
* @param locator - The locator of the input field.
* @param value - The value to fill in the input field.
* @param label - The label of the input field for logging purposes.
*/
    async ffInputOnCarrierPage(ffNumber: string): Promise<void> {
        await this.fillSearchInput(this.ffCarrierSearchInput, ffNumber, "FF Number");
    }

    /**
* @author Aniket Nale
* @created 02-Dec-25
* @description Verifies that the FF number input on the carrier search page matches the expected value.
* @param ffNumber - The FF number of the carrier to verify.
*/
    async verifyFFInputOnCarrierSearchPage(ffNumber: string) {
        await commonReusables.waitForPageStable(this.page);
        const ffCell = this.getFFCellLocator(ffNumber);
        await expect(ffCell).toHaveText(ffNumber, { timeout: WAIT.LARGE });
        console.log(`Verified FF number: ${ffNumber} in carrier search results`);
    }

    /**
* @author Aniket Nale
* @created 2525
* @description Searches for a carrier using the provided Carrier ID.
* @param locator - The locator of the input field.
* @param value - The value to fill in the input field.
* @param label - The label of the input field for logging purposes.
*/
    async carrierIDInputOnCarrierPage(carrierID: string): Promise<void> {
        await this.fillSearchInput(this.carrierIDCarrierSearchInput, carrierID, "Carrier ID");
    }


    /**
* @author Aniket Nale
* @created 28-Nov-25
* @description Verifies that the Carrier ID input on the carrier search page matches the expected value.
* @param carrierID - The Carrier ID of the carrier to verify.
*/
    async verifyCarrierIDInputOnCarrierSearchPage(carrierID: string) {
        await commonReusables.waitForPageStable(this.page);
        const carrierIDCell = this.getCarrierIDCellLocator(carrierID);
        await expect(carrierIDCell).toHaveText(carrierID, { timeout: WAIT.LARGE });
        console.log(`Verified Carrier ID: ${carrierID} in carrier search results`);
    }

    /**
* @author Aniket Nale
* @created 02-Dec-25
* @description Searches for a carrier using the provided MX Number.
* @param locator - The locator of the input field.
* @param value - The value to fill in the input field.
* @param label - The label of the input field for logging purposes.
*/
    async mxInputOnCarrierPage(mxNumber: string): Promise<void> {
        await this.fillSearchInput(this.mxCarrierSearchInput, mxNumber, "MX Number");
    }

    /**
* @author Aniket Nale
* @created 02-Dec-2025
* @description Verifies that the MX Number input on the carrier search page matches the expected value.
* @param mxNumber - The MX Number of the carrier to verify.
*/

    async verifyMxInputOnCarrierSearchPage(mxNumber: string) {
        await commonReusables.waitForPageStable(this.page);
        const mxCell = this.getMxCellLocator(mxNumber);
        await expect(mxCell).toHaveText(mxNumber, { timeout: WAIT.LARGE });
        console.log(`Verified MX number: ${mxNumber} in carrier search results`);
    }

    /**
     * @author Rohit Singh
     * @created 04-Dec-2025
     * @description Verifies that no records are found in the carrier search results.
     */
    async verifyNoRecordsFoundInCarrierSearch() {
        await commonReusables.waitForPageStable(this.page);
        await expect(this.noRecordsFoundValue_LOC).toBeVisible({ timeout: WAIT.LARGE });
        console.log("Verified that no records are found in the carrier search results");
    }
    /**
     * @author Rohit Singh
     * @created 04-Dec-2025
     * @description Selects the carrier status from the status dropdown on the carrier search page.
     * @param carrierStatus Pick carrier status From Global Constant,
     *  i.e. CARRIER_STATUS.ACTIVE / CARRIER_STATUS.INACTIVE
     */
    async carrierStatus(carrierStatus: string) {
        await commonReusables.waitForPageStable(this.page);
        await this.statusDropdownIconButton_LOC.click();
        await this.carrierStatusValue_LOC(carrierStatus).click();
    }
    /**
     * @author Rohit Singh
     * @created 04-Dec-2025
     * @description Clicks on the Clear button to reset the search fields on the carrier search page.
     */
    async clickOnClearButton(): Promise<void> {
        await commonReusables.waitForPageStable(this.page);
        await this.clearButton_LOC.click();
    }
    async verifyCarrerListTableData(dataToViisible: string) {
        await commonReusables.waitForPageStable(this.page);
        const cell = this.carrierListTableData_LOC(dataToViisible);
        await expect(cell).toBeVisible({ timeout: WAIT.LARGE });
        console.log(`Verified data: ${dataToViisible} is visible in carrier search results`);
    }
    /**
     * @author Rohit Singh
     * @created 04-Dec-2025
     * @description Selects a factor by its name from the factor dropdown on the carrier search page.
     * @param factorName 
     */
    async selectFactorByName(factorName: string) {
        await commonReusables.waitForPageStable(this.page);
        await this.factorNameInput_LOC.pressSequentially(factorName);
        await this.factorValue_LOC(factorName).waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.factorValue_LOC(factorName).click();
        console.log(`Selected factor with name: ${factorName}`);
    }
    /**
     * @author Rohit Singh
     * @created 04-Dec-2025
     * @description Selects a toggle option (Yes, No, Default) for a given toggle name on the carrier search page.
     * @param toggleName 
     * @param toggleValue  The value to set for the toggle, expected to be 'yes', 'no', or 'default'.
     */
    async setSliderValue(toggleName: string, toggleValue: string) {
        await commonReusables.waitForPageStable(this.page);
        await this.toggleSelection_LOC(toggleName).waitFor({ state: 'visible', timeout: WAIT.SMALL });
        if (toggleValue.toLowerCase() === 'yes') {
            await this.toggleSelection_LOC(toggleName).click({ position: { x: 5, y: 5 } });
        }
        else if (toggleValue.toLowerCase() === 'no') {
            await this.toggleSelection_LOC(toggleName).click({ position: { x: 45, y: 5 } });
        }
        else if (toggleValue.toLowerCase() === 'default') {
            await this.toggleSelection_LOC(toggleName).click({ position: { x: 25, y: 5 } });
        }
        else {
            throw new Error(`Invalid toggle value: ${toggleValue}. Expected 'yes', 'no', or 'default'.`);
        }
    }

    /**
 * @author Aniket Nale
 * @created 12-Dec-25
 * @description Set the opposite slider value for a given toggle name on the carrier search page.
 * @helper to flip the slider from Yes to No or No to Yes
 * @param toggleName - The name of the toggle to set.
 * @param currentValue - The current value of the toggle (Yes/No).
 */

    async setOppositeSliderValue(toggleName: string, currentValue: string) {
        const v = currentValue.toLowerCase().trim();

        let opposite: 'yes' | 'no';
        if (v === 'yes') opposite = 'no';
        else if (v === 'no') opposite = 'yes';
        else throw new Error(`Invalid slider value: ${currentValue}. Expected Yes/No.`);

        await this.setSliderValue(toggleName, opposite);
    }

    /**
     * @author Rohit Singh
     * @created 04-Dec-2025
     * @description Expands or collapses the filter section on the carrier search page.
     * @param expand 
     */
    async expandCollapseFilter(expand: boolean) {
        const isFilterExpanded = await this.expandFilterButton_LOC.getAttribute("aria-expanded");
        if (expand && isFilterExpanded === "false") {
            await this.expandFilterButton_LOC.click();
            console.log("Filter expanded");
        } else if (!expand && isFilterExpanded === "true") {
            await this.expandFilterButton_LOC.click();
            console.log("Filter collapsed");
        }
        else {
            console.log("Filter is already in the desired state");
        }

    }
    /**
     * @author Rohit Singh
     * @created 05-Dec-2025
     * @description Selects a value from a dropdown filter on the carrier search page.
     * @param filterName get filter name from Carrier Constants CARRIER_SEARCH_FILTERS
     * @param value required value to select from dropdown, 
     */
    async selectValueFromDropdownFilter(filterName: string, value: string) {
        await commonReusables.waitForPageStable(this.page);
        await this.searchDropDownExpandButton_LOC(filterName).click();
        await this.dropdownValues_LOC(value).waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await this.dropdownValues_LOC(value).click();
        console.log(`Selected value: ${value} from dropdown filter: ${filterName}`);
    }

    /**
 * @author Aniket Nale
 * @created 10-Dec-25
 * @description Set the opposite toggle value for a given toggle name on the carrier search page.
 * @param toggleName - The name of the toggle to set.
 * @param currentValue - The current value of the toggle (Yes/No).
 */

    async setOppositeToggleValue(toggleName: string, currentValue: string) {
        const v = currentValue.toLowerCase().trim();

        if (v === 'yes') {
            // opposite should be "no"
            // On Carrier Search page default is already NO,
            // and we call this right after navigation,
            // so we don't need to click at all hence returning
            return;
        } else if (v === 'no') {
            // opposite should be "yes" hence we DO need to click
            await this.setToggleValue(toggleName, 'yes');
        } else {
            throw new Error(`Invalid toggle value: ${currentValue}. Expected Yes/No.`);
        }
    }

    /**
* @author Aniket Nale
* @created 10-Dec-25
* @description Set the toggle value for a given toggle name on the carrier search page.
* @param toggleName - The name of the toggle to set.
* @param toggleValue - The value to set for the toggle, expected to be 'yes', 'no', or 'default'.
*/

    async setToggleValue(toggleName: string, toggleValue: string) {
        const value = toggleValue.toLowerCase().trim();
        await commonReusables.waitForPageStable(this.page);
        const group = this.checkToggleGroup_LOC(toggleName);
        await group.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        const checkbox = this.checkToggleInput_LOC(toggleName);
        const clickTarget = this.checkToggleClickTarget_LOC(toggleName);
        const isChecked = await checkbox.isChecked();

        if (value === 'yes') {
            if (!isChecked) {
                await clickTarget.click();
            }
        } else if (value === 'no') {
            if (isChecked) {
                await clickTarget.click();
            }
        } else if (value === 'default') {
            // leave current state as-is
            return;
        } else {
            throw new Error(`Invalid toggle value: ${toggleValue}. Expected 'yes', 'no', or 'default'.`);
        }
    }
}