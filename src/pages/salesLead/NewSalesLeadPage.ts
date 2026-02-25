/**
     * @description Implimented page objects and Functions for ViewSalesLeadPage
     * @author Avanish Srivastava
     * @created 2025-09-03
     */

import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class NewSalesLeadPage {

    private readonly customerNameInput_LOC: Locator;
    private readonly customerAliasInput_LOC: Locator;
    private readonly customerParentInput_LOC: Locator;
    private readonly customerContactInput_LOC: Locator;
    private readonly customerPhoneInput_LOC: Locator;
    private readonly customerFaxInput_LOC: Locator;
    private readonly customerCellInput_LOC: Locator;
    private readonly customerTollFreeInput_LOC: Locator;
    private readonly customerEmailInput_LOC: Locator;
    private readonly customerWebsiteInput_LOC: Locator;
    private readonly customerDunsNumberInput_LOC: Locator;
    private readonly customerCreditInput_LOC: Locator;
    private readonly customerEstimatedLoadInput_LOC: Locator;
    private readonly customerAddressInput_LOC: Locator;
    private readonly customerAddress2Input_LOC: Locator;
    private readonly customerCityInput_LOC: Locator;
    private readonly customerPhone1Input_LOC: Locator;
    private readonly customerFax1Input_LOC: Locator;
    private readonly customerBillingInput_LOC: Locator;
    private readonly customerPayableContactInput_LOC: Locator;
    private readonly customerPayablesPhoneInput_LOC: Locator;
    private readonly customerPayablesEmailInput_LOC: Locator;
    private readonly customerFinanceNotesInput_LOC: Locator;
    private readonly customerStateDropdown_LOC: Locator;
    private readonly salesSaveButton_LOC: Locator;
    private readonly operatingOfficeDropdown_LOC: Locator;
    private readonly addShareLink_LOC: Locator;
    private readonly defaultShareInput_LOC: Locator;
    private readonly addAnotherOfficeLink_LOC: Locator;
    private readonly addShareAnotherOfficeLink_LOC: Locator;
    private readonly defaultShareAnotherOfficeInput_LOC: Locator;
    private readonly agentRowValue_LOC: any;
    private readonly selectAgentValue_LOC: any;
    private readonly agentDropdown_LOC: any;
    private readonly agentSearchInput_LOC: any;
    private readonly agentSearchValue_LOC: any;
    private readonly agentRowAnotherOfficeValue_LOC: any;
    private readonly agentforAnotherOfficeDropdown_LOC: any;
    private readonly agentAnotherOfficeSearchInput_LOC: any;
    private readonly operatingOfficeSearchValue_LOC: any;
    private readonly operatingOfficeInput_LOC: any;
    private readonly statusCombobox_LOC: Locator;
    private readonly agentSerachSuggestionInput_LOC: any;
    private readonly agentSuggestionValue_LOC: any;
    private readonly naicCodeDropdown_LOC: Locator;
    private readonly invoiceDeliveryPreferenceDropdown_LOC: Locator;
    // private readonly dropdownSearch_LOC: Locator;
    private readonly anotherOfficeOperatingOfficeDropdown_LOC: Locator;
    private readonly anotherOfficeOperatingOfficeInput_LOC: any;

    constructor(private page: Page) {
        this.customerNameInput_LOC = page.locator("input[name='name']");
        this.customerAliasInput_LOC = page.locator("input[name='alias']");
        this.customerParentInput_LOC = page.locator("input[name='parent']");
        this.customerContactInput_LOC = page.locator("input[name='contact']");
        this.customerPhoneInput_LOC = page.locator("input[name='tel_1']");
        this.customerFaxInput_LOC = page.locator("input[name='fax_1']");
        this.customerCellInput_LOC = page.locator("input[name='tel_cel']");
        this.customerTollFreeInput_LOC = page.locator("input[name='tel_800']");
        this.customerEmailInput_LOC = page.locator("input[name='email']");
        this.customerWebsiteInput_LOC = page.locator("input[name='website']");
        this.customerDunsNumberInput_LOC = page.locator("input[name='duns_number']");
        this.customerCreditInput_LOC = page.locator("input[name='credit_requirement']");
        this.customerEstimatedLoadInput_LOC = page.locator("input[name='est_loads_per_month']");
        this.customerAddressInput_LOC = page.locator("input[name='addr1']");
        this.customerAddress2Input_LOC = page.locator("input[name='addr2']");
        this.customerCityInput_LOC = page.locator("input[name='city']");
        this.customerPhone1Input_LOC = page.locator("input[name='phone']");
        this.customerFax1Input_LOC = page.locator("input[name='fax']");
        this.customerBillingInput_LOC = page.locator("textarea[name='customer_billing_requirements']");
        this.customerPayableContactInput_LOC = page.locator("input[name='payables_contact']");
        this.customerPayablesPhoneInput_LOC = page.locator("input[name='payables_tel_1']");
        this.customerPayablesEmailInput_LOC = page.locator("input[name='payables_email']")
        this.customerFinanceNotesInput_LOC = page.locator("textarea#fin_notes");
        this.customerStateDropdown_LOC = page.locator('select[name="state"]');
        this.salesSaveButton_LOC = page.locator("(//button[@type='submit' and @value='Save'])[last()]");
        this.operatingOfficeDropdown_LOC = page.locator('#select2-operating_office_agent_id-container');
        this.addShareLink_LOC = page.locator("a.add-share");
        this.defaultShareInput_LOC = page.locator(
            "div[id='share_frame'] div[class='col-xs-3 table-resp-fix share_amt_div_width'] input[name='commission[amount][]']");
        this.addAnotherOfficeLink_LOC = page.locator(
            "//div[contains(@class, 'col-xs-12')]//a[contains(text(), 'Add another operating office')]");
        this.addShareAnotherOfficeLink_LOC = page.locator(
            "//div[contains(@class, 'share_parent2')]//a[@class='add-share']");
        this.defaultShareAnotherOfficeInput_LOC = page.locator(
            "div[id='share_frame'] div[class='col-xs-3 table-resp-fix share_amt_div_width'] input[name='commission2[amount][]']");
        this.agentRowValue_LOC = '#share_frame';
        this.selectAgentValue_LOC = '.select2-container';
        this.agentDropdown_LOC = '.select2-dropdown';
        this.agentforAnotherOfficeDropdown_LOC = 'span.select2-dropdown.select2-dropdown--below';
        this.agentSuggestionValue_LOC = 'span.select2-dropdown';
        this.agentSerachSuggestionInput_LOC = '.select2-dropdown--below';
        this.agentSearchInput_LOC = '.select2-search__field';
        this.agentAnotherOfficeSearchInput_LOC = '.select2-dropdown--below .select2-search__field';
        this.agentSearchValue_LOC = '.select2-selection__rendered';
        this.agentRowAnotherOfficeValue_LOC = '.share_parent2 #share_frame';
        this.operatingOfficeSearchValue_LOC = '.select2-results';
        this.operatingOfficeInput_LOC = '.select2-results__option';
        this.statusCombobox_LOC = page.getByRole('combobox', { name: /status/i });

        this.naicCodeDropdown_LOC = page.locator("//select[@name='naic_code']");
        this.invoiceDeliveryPreferenceDropdown_LOC = page.locator('select[name="invoice_delivery_preference"]');
        // this.dropdownSearch_LOC = page.locator("//input[@class='select2-search__field']");
        this.anotherOfficeOperatingOfficeDropdown_LOC = page.locator('#select2-operating_office_agent_id2-container');
        this.anotherOfficeOperatingOfficeInput_LOC = page.locator('.select2-results__option');
    }

    /**
 * Enters all customer basic information at once
 * @param customerData Object containing customer information
 * @author Avanish Srivastava
 * @created 2025-09-03
 */
    async enterCustomerBasicInfo(customerData: {
        name?: string | number;
        alias?: string | number;
        parent?: string | number;
        contact?: string | number;
        phone?: string | number;
        fax?: string | number;
        cell?: string | number;
        tollFree?: string | number;
        email?: string | number;
        website?: string | number;
        dunsNumber?: string | number;
        credit?: string | number;
        estimatedLoad?: string | number;
    }): Promise<void> {
        if (customerData.name !== undefined) {
            await this.customerNameInput_LOC.waitFor({ state: "visible" });
            await this.customerNameInput_LOC.fill(String(customerData.name));
        }

        if (customerData.alias !== undefined) {
            await this.customerAliasInput_LOC.waitFor({ state: "visible" });
            await this.customerAliasInput_LOC.fill(String(customerData.alias));
        }

        if (customerData.parent !== undefined) {
            await this.customerParentInput_LOC.waitFor({ state: "visible" });
            await this.customerParentInput_LOC.fill(String(customerData.parent));
        }

        if (customerData.contact !== undefined) {
            await this.customerContactInput_LOC.waitFor({ state: "visible" });
            await this.customerContactInput_LOC.fill(String(customerData.contact));
        }

        if (customerData.phone !== undefined) {
            await this.customerPhoneInput_LOC.waitFor({ state: "visible" });
            await this.customerPhoneInput_LOC.fill(String(customerData.phone));
        }

        if (customerData.fax !== undefined) {
            await this.customerFaxInput_LOC.waitFor({ state: "visible" });
            await this.customerFaxInput_LOC.fill(String(customerData.fax));
        }

        if (customerData.cell !== undefined) {
            await this.customerCellInput_LOC.waitFor({ state: "visible" });
            await this.customerCellInput_LOC.fill(String(customerData.cell));
        }

        if (customerData.tollFree !== undefined) {
            await this.customerTollFreeInput_LOC.waitFor({ state: "visible" });
            await this.customerTollFreeInput_LOC.fill(String(customerData.tollFree));
        }

        if (customerData.email !== undefined) {
            await this.customerEmailInput_LOC.waitFor({ state: "visible" });
            await this.customerEmailInput_LOC.fill(String(customerData.email));
        }

        if (customerData.website !== undefined) {
            await this.customerWebsiteInput_LOC.waitFor({ state: "visible" });
            await this.customerWebsiteInput_LOC.fill(String(customerData.website));
        }

        if (customerData.dunsNumber !== undefined) {
            await this.customerDunsNumberInput_LOC.waitFor({ state: "visible" });
            await this.customerDunsNumberInput_LOC.fill(String(customerData.dunsNumber));
        }

        if (customerData.credit !== undefined) {
            await this.customerCreditInput_LOC.waitFor({ state: "visible" });
            await this.customerCreditInput_LOC.fill(String(customerData.credit));
        }

        if (customerData.estimatedLoad !== undefined) {
            await this.customerEstimatedLoadInput_LOC.waitFor({ state: "visible" });
            await this.customerEstimatedLoadInput_LOC.fill(String(customerData.estimatedLoad));
        }
    }

    /**
 * Enters all customer address and billing information at once
 * @param addressData Object containing address and billing information
 * @author Avanish Srivastava
 * @created 2025-09-03
 */
    async enterCustomerBillingInfo(billingData: {
        address?: string | number;
        fullAddress?: string | number;  // address2
        city?: string | number;
        state?: string | number;
        zip?: string | number;
        phone?: string | number;
        fax?: string | number;
        billingDetails?: string | number;
    }): Promise<void> {
        if (billingData.address !== undefined) {
            await this.customerAddressInput_LOC.waitFor({ state: "visible" });
            await this.customerAddressInput_LOC.fill(String(billingData.address));
        }

        if (billingData.fullAddress !== undefined) {
            await this.customerAddress2Input_LOC.waitFor({ state: "visible" });
            await this.customerAddress2Input_LOC.fill(String(billingData.fullAddress));
        }

        if (billingData.city !== undefined) {
            await this.customerCityInput_LOC.waitFor({ state: "visible" });
            await this.customerCityInput_LOC.fill(String(billingData.city));
        }

        if (billingData.state !== undefined) {
            await this.customerStateDropdown_LOC.waitFor({ state: "visible" });
            await this.customerStateDropdown_LOC.selectOption({ value: String(billingData.state) });
        }

        if (billingData.phone !== undefined) {
            await this.customerPhone1Input_LOC.waitFor({ state: "visible" });
            await this.customerPhone1Input_LOC.click();
            await this.customerPhone1Input_LOC.fill(String(billingData.phone));
        }

        if (billingData.fax !== undefined) {
            await this.customerFax1Input_LOC.waitFor({ state: "visible" });
            await this.customerFax1Input_LOC.fill(String(billingData.fax));
        }

        if (billingData.billingDetails !== undefined) {
            await this.customerBillingInput_LOC.waitFor({ state: "visible" });
            await this.customerBillingInput_LOC.fill(String(billingData.billingDetails));
        }
    }

    /**
 * Enters multiple customer payable fields at once
 * @param payableData Object containing payable information
 * @author Avanish Srivastava
 * @created 2025-09-03
 */
    async enterAllCustomerPayableInfo(payableData: {
        contact?: string | number;
        phone?: string | number;
        email?: string | number;
    }): Promise<void> {
        if (payableData.contact !== undefined) {
            await this.customerPayableContactInput_LOC.waitFor({ state: "visible" });
            await this.customerPayableContactInput_LOC.fill(String(payableData.contact));
        }

        if (payableData.phone !== undefined) {
            await this.customerPayablesPhoneInput_LOC.waitFor({ state: "visible" });
            await this.customerPayablesPhoneInput_LOC.fill(String(payableData.phone));
        }

        if (payableData.email !== undefined) {
            await this.customerPayablesEmailInput_LOC.waitFor({ state: "visible" });
            await this.customerPayablesEmailInput_LOC.fill(String(payableData.email));
        }
    }

    /**
     * @description Enter Customer Finance Notes 
     * @author Avanish Srivastava
     * @created 2025-09-03
     */

    async enterCustomerFinanceNotes(value: string | number): Promise<void> {
        await this.customerFinanceNotesInput_LOC.waitFor({ state: "visible" });
        await this.customerFinanceNotesInput_LOC.fill(String(value));
    }

    /**
     * @description Click on Sales Save Button
     * @author Avanish Srivastava
     * @created 2025-09-03
     * @author Aniket Nale
     * @modified 23-Dec-2025
     */

    async clickOnSalesSaveButton() {
        await this.salesSaveButton_LOC.waitFor({ state: 'visible' });
        await this.salesSaveButton_LOC.scrollIntoViewIfNeeded();
        // commonReusables.clickElementWithRetry(this.salesSaveButton_LOC, 3);
        await this.page.waitForLoadState('networkidle');
        await this.salesSaveButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
     * @description Select Operating Office
     * @author Avanish Srivastava
     * @created 2025-09-03
     */
    async selectOperatingOffice(officeValue: string) {
        try {
            await this.operatingOfficeDropdown_LOC.waitFor({ state: "visible" });
            await this.operatingOfficeDropdown_LOC.click();
            await this.page.waitForSelector(this.operatingOfficeSearchValue_LOC);
            await this.page.locator(this.operatingOfficeInput_LOC, { hasText: officeValue.toString() }).click();
        } catch (error) {
            throw new Error(`Failed to select operating office '${officeValue}': ${error}`);
        }
    }

    /**
     * @description Select Customer Required Status
     * @author Avanish Srivastava
     * @created 2025-09-03
     * @author Aniket Nale
     * @modified 24-Dec-2025
     */

    async selectSalesLeadStatus(statusValue: string): Promise<void> {
        try {
            await this.statusCombobox_LOC.waitFor({ state: 'visible' });
            await this.statusCombobox_LOC.selectOption({ label: statusValue });
        } catch (error) {
            throw new Error(`Failed to select status '${statusValue}' from status dropdown: ${error}`);
        }
    }

    /**
     * @description Click on Add Share Link 
     * @author Avanish Srivastava
     * @created 2025-09-03
     * @author Aniket Nale
     * @modified 23-Dec-2025
     */
    async clickOnAddShareLink() {
        try {
            const addShareLink = this.addShareLink_LOC.first();
            await addShareLink.waitFor({ state: 'visible' });
            await addShareLink.scrollIntoViewIfNeeded();
            await this.clickWithStrategies(addShareLink);
            console.log("Add Share link clicked successfully");
        } catch (error) {
            console.error(`Failed to click Add Share link: ${error}`);
            throw error;
        }
    }

    /**
     * @description Click on Add Share Link with diffrent Strategies
     * @author Avanish Srivastava
     * @created 2025-09-23
     */

    async clickWithStrategies(locator: Locator) {
        const strategies = [
            async () => await locator.click(),
            async () => await locator.click({ force: true }),
            async () => await locator.evaluate((element: HTMLElement) => element.click()),
            async () => await locator.dispatchEvent('click')
        ];
        for (let i = 0; i < strategies.length; i++) {
            try {
                await strategies[i]();
                console.log(`Click successful with strategy ${i + 1}`);
                return;
            } catch (error) {
                console.log(`Strategy ${i + 1} failed: ${error}`);
                if (i === strategies.length - 1) {
                    throw error;
                }
            }
        }
    }

    /**
     * @description Enter Share Amount
     * @author Avanish Srivastava
     * @created 2025-09-03
     */

    async enterShareAmount(value: string | number): Promise<void> {
        await this.defaultShareInput_LOC.waitFor({ state: "visible" });
        await this.defaultShareInput_LOC.fill(String(value));
    }

    /**
     * @description Select the Agent for an office
     * @author Avanish Srivastava
     * @created 2025-09-03
     */

    async selectAgent(value: string | number): Promise<void> {
        console.log(`Attempting to select agent: ${value}`);
        try {
            const searchValue = String(value || '');
            await this.page.waitForSelector(this.agentRowValue_LOC, {
                state: 'visible',
                timeout: WAIT.SMALL
            });
            const shareFrame = this.page.locator(this.agentRowValue_LOC);
            const select2Container = shareFrame.locator(this.selectAgentValue_LOC).first();
            await select2Container.waitFor({ state: 'visible', timeout: WAIT.SMALL });
            await select2Container.click();
            await this.page.waitForSelector(this.agentDropdown_LOC, {
                state: 'visible',
                timeout: WAIT.SMALL
            });
            const searchBox = this.page.locator(this.agentSearchInput_LOC).first();
            await searchBox.waitFor({ state: 'visible', timeout: WAIT.SMALL });
            await searchBox.fill(searchValue);
            await searchBox.press('Enter');
            const selectedText = await select2Container
                .locator(this.agentSearchValue_LOC)
                .textContent();
            console.log(`Selected agent: ${selectedText}`);
            if (!selectedText || (value && !selectedText.includes(searchValue))) {
                throw new Error(`Selection verification failed. Expected: ${searchValue}, Got: ${selectedText}`);
            }
            console.log('Agent selection successful');
        } catch (error) {
            console.error('Failed to select agent:', error);
            throw new Error(`Failed to select agent ${value}: ${error}`);
        }
    }

    /**
     * @description Click on Add anothet office Link 
     * @author Avanish Srivastava
     * @created 2025-09-03
     * @author Aniket Nale
     * @modified 23-Dec-2025
     */

    async clickOnAddAnotherOfficeLink() {
        await this.addAnotherOfficeLink_LOC.waitFor({ state: 'visible' });
        this.addAnotherOfficeLink_LOC.click();
    }

    /**
     * @description Click on Add Share Link for another Office
     * @author Avanish Srivastava
     * @created 2025-09-03
     */

    /*async clickOnAddShareLinkforAnotherOffice() {
        await this.addShareAnotherOfficeLink_LOC.waitFor({ state: 'visible' });
        await this.addShareAnotherOfficeLink_LOC.scrollIntoViewIfNeeded();
        await Promise.all([
            this.addShareAnotherOfficeLink_LOC.click(),
            this.page.waitForLoadState('networkidle'),
        ]);
    }*/

    // async clickOnAddShareLinkforAnotherOffice() {
    //     try {
    //         await this.addShareAnotherOfficeLink_LOC.waitFor({ state: 'visible' });
    //         await this.addShareAnotherOfficeLink_LOC.scrollIntoViewIfNeeded();
    //         await Promise.all([
    //             this.clickWithStrategies(this.addShareAnotherOfficeLink_LOC),
    //             this.page.waitForLoadState('networkidle', { timeout: WAIT.DEFAULT }).catch(() => {
    //                 console.log("Network idle timeout - continuing");
    //             })
    //         ]);
    //         console.log("Add Share link clicked successfully");
    //     } catch (error) {
    //         console.error(`Failed to click Add Share link: ${error}`);
    //         throw error;
    //     }
    // }


    /**
     * @description Click on Add Share Link for another Office
     * @author Avanish Srivastava
     * @created 2025-09-03
     * @author Aniket Nale
     * @modified 23-Dec-2025
     */

    async clickOnAddShareLinkForAnotherOffice(): Promise<void> {
        try {
            const addShareAnotherOfficeLink = this.addShareAnotherOfficeLink_LOC.first();
            await addShareAnotherOfficeLink.waitFor({ state: 'visible' });
            await addShareAnotherOfficeLink.scrollIntoViewIfNeeded();
            await this.clickWithStrategies(addShareAnotherOfficeLink);
            console.log("Add Share (Another Office) link clicked successfully");
        } catch (error) {
            console.error(`Failed to click Add Share (Another Office) link: ${error}`);
            throw error;
        }
    }

    /**
     * @description Enter Share Amount for another office
     * @author Avanish Srivastava
     * @created 2025-09-03
     */

    async enterShareAmountForAnotherOffice(value: string | number): Promise<void> {
        await this.defaultShareAnotherOfficeInput_LOC.waitFor({ state: "visible" });
        await this.defaultShareAnotherOfficeInput_LOC.fill(String(value));
    }

    /**
     * @description Select the Agent for another Office
     * @author Avanish Srivastava
     * @created 2025-09-03
     */

    async selectAgentforAnotherOffice(value: string | number): Promise<void> {
        console.log(`Attempting to select agent: ${value}`);
        try {
            const searchValue = String(value || '');

            console.log(`Waiting for secondary office share frame: ${this.agentRowAnotherOfficeValue_LOC}`);
            await this.page.waitForSelector(this.agentRowAnotherOfficeValue_LOC, {
                state: 'visible',
                timeout: WAIT.SMALL
            });
            const shareFrame = this.page.locator(this.agentRowAnotherOfficeValue_LOC);
            const select2Container = shareFrame.locator(this.selectAgentValue_LOC).first();
            console.log(`Waiting for select2 container to be visible`);
            await select2Container.waitFor({ state: 'visible', timeout: WAIT.SMALL });
            console.log(`Clicking on select2 container`);
            await select2Container.click();
            console.log(`Waiting for dropdown: ${this.agentforAnotherOfficeDropdown_LOC}`);
            try {
                await this.page.waitForSelector(this.agentforAnotherOfficeDropdown_LOC, {
                    state: 'visible',
                    timeout: WAIT.SMALL
                });
            } catch (dropdownError) {
                console.log(`Primary dropdown selector failed, trying fallback selectors`);
                const fallbackSelectors = [
                    this.agentDropdown_LOC,
                    this.agentSerachSuggestionInput_LOC,
                    this.agentSuggestionValue_LOC
                ];
                let dropdownFound = false;
                for (const selector of fallbackSelectors) {
                    try {
                        await this.page.waitForSelector(selector, {
                            state: 'visible',
                            timeout: WAIT.SMALL
                        });
                        console.log(`Dropdown found with fallback selector: ${selector}`);
                        dropdownFound = true;
                        break;
                    } catch (e) {
                        console.log(`Fallback selector ${selector} failed`);
                        continue;
                    }
                }

                if (!dropdownFound) {
                    throw dropdownError;
                }
            }
            console.log(`Looking for search input: ${this.agentAnotherOfficeSearchInput_LOC}`);
            let searchBox;
            try {
                searchBox = this.page.locator(this.agentAnotherOfficeSearchInput_LOC).first();
                await searchBox.waitFor({ state: 'visible', timeout: WAIT.SMALL });
            } catch (searchError) {
                console.log(`Primary search input failed, trying fallback`);
                searchBox = this.page.locator(this.agentSearchInput_LOC).last();
                await searchBox.waitFor({ state: 'visible', timeout: WAIT.SMALL });
            }
            console.log(`Filling search box with: ${searchValue}`);
            await searchBox.fill(searchValue);
            await searchBox.press('Enter');
            const selectedText = await select2Container
                .locator(this.agentSearchValue_LOC)
                .textContent();
            console.log(`Selected agent: ${selectedText}`);
            if (!selectedText || (value && !selectedText.includes(searchValue))) {
                throw new Error(`Selection verification failed. Expected: ${searchValue}, Got: ${selectedText}`);
            }
            console.log('Agent selection successful');
        } catch (error) {
            console.error('Failed to select agent:', error);
            try {
                const availableDropdowns = await this.page.locator(this.agentDropdown_LOC).count();
                const availableSearchInputs = await this.page.locator(this.agentSearchInput_LOC).count();
                console.log(`Debug info - Dropdowns found: ${availableDropdowns}, Search inputs found: ${availableSearchInputs}`);
            } catch (debugError) {
                console.log('Debug information collection failed');
            }
            throw new Error(`Failed to select agent ${value}: ${error}`);
        }
    }


    // async selectNAICCode(value: string | number): Promise<void> {
    //     const searchValue = String(value).trim();
    //     console.log(`Selecting NAIC Code: ${searchValue}`);
    //     try {
    //         const naicDropdown = this.page.locator('select[name="naic_code"]').locator('..').locator('.select2-selection');
    //         await naicDropdown.waitFor({ state: 'visible', timeout: WAIT.SMALL });
    //         await naicDropdown.click();
    //         console.log('NAIC Dropdown clicked');
    //         const searchField = this.page.locator('.select2-search__field');
    //         await searchField.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
    //         await searchField.clear();
    //         await searchField.fill(searchValue);
    //         console.log(`Search value entered: ${searchValue}`);
    //         await new Promise(resolve => setTimeout(resolve, WAIT.DEFAULT));
    //         const option = this.page.locator('.select2-results__option').filter({ hasText: searchValue }).first();
    //         await option.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
    //         await option.click();
    //         console.log('NAIC Code selected successfully');
    //     } catch (error) {
    //         console.error(`Selection failed: ${error}`);
    //         await this.page.keyboard.press('Escape');
    //         throw error;
    //     }
    // }

    /**
     * Select the NAIC code from the dropdown
     * @author Rohit Singh
     * @created 2024-09-29
     * @param naicCodeText - The NAIC code text to select (e.g., "1234 - Sample NAIC Code")
     */
    async selectNAICCode(naicCodeText: string) {
        try {
            await this.naicCodeDropdown_LOC.waitFor({ state: 'visible' });
            await this.naicCodeDropdown_LOC.selectOption({ label: naicCodeText });
            console.log(`NAIC Code selected by text: ${naicCodeText}`);
        } catch (error) {
            console.error(`Failed to select NAIC Code by text '${naicCodeText}': ${error}`);
            throw error;
        }
    }

    // /**
    // * Select from the second operating office dropdown with fallback strategies
    // * @param officeValue - The office value to select (string or number from external data)
    // */
    // async selectAnotherOperatingOffice(officeValue: string | number): Promise<void> {
    //     const searchValue = String(officeValue);
    //     console.log(`🎯 Selecting operating office 2: ${searchValue}`);

    //     const strategies = [
    //         // Strategy 1: Select2 approach (enhanced dropdown)
    //         async () => {
    //             console.log('⏳ Trying Select2 approach...');
    //             await this.page.locator('#select2-operating_office_agent_id2-container').waitFor({ state: 'visible', timeout: 10000 });
    //             await this.page.locator('#select2-operating_office_agent_id2-container').click();

    //             // Wait for dropdown options to appear
    //             await this.page.waitForSelector('.select2-results__option', { state: 'visible', timeout: 5000 });

    //             // Try to find and click the matching option
    //             await this.page.locator('.select2-results__option').filter({ hasText: searchValue }).first().click();
    //             console.log('✅ Selected using Select2 approach');
    //         },

    //         // Strategy 2: Regular dropdown by value
    //         async () => {
    //             console.log('⏳ Trying regular dropdown by value...');
    //             const dropdown = this.page.locator('select[name="operating_office_agent_id2"]');
    //             await dropdown.waitFor({ state: 'visible', timeout: 5000 });
    //             await dropdown.selectOption({ value: searchValue });
    //             console.log('✅ Selected using dropdown value');
    //         },

    //         // Strategy 3: Regular dropdown by text match
    //         async () => {
    //             console.log('⏳ Trying regular dropdown by text match...');
    //             const dropdown = this.page.locator('select[name="operating_office_agent_id2"]');
    //             await dropdown.waitFor({ state: 'visible', timeout: 5000 });

    //             // Find option that contains the search value
    //             const option = dropdown.locator(`option:has-text("${searchValue}")`).first();
    //             const optionValue = await option.getAttribute('value');

    //             if (optionValue) {
    //                 await dropdown.selectOption({ value: optionValue });
    //                 console.log('✅ Selected using text match');
    //             } else {
    //                 throw new Error('No matching option found');
    //             }
    //         },

    //         // Strategy 4: Select2 with exact text search
    //         async () => {
    //             console.log('⏳ Trying Select2 with exact text search...');
    //             await this.page.locator('#select2-operating_office_agent_id2-container').click();

    //             // Wait for search field and type
    //             const searchField = this.page.locator('.select2-search__field');
    //             if (await searchField.count() > 0) {
    //                 await searchField.fill(searchValue);
    //                 await this.page.waitForTimeout(1000);
    //             }

    //             // Select first available option
    //             await this.page.locator('.select2-results__option:visible').first().click();
    //             console.log('✅ Selected using Select2 search');
    //         }
    //     ];

    //     // Try each strategy until one succeeds
    //     for (let i = 0; i < strategies.length; i++) {
    //         try {
    //             await strategies[i]();
    //             console.log(`✅ Operating office 2 selected successfully using strategy ${i + 1}`);
    //             return;
    //         } catch (error) {
    //             console.log(`❌ Strategy ${i + 1} failed: ${error}`);

    //             // Close any open dropdowns before trying next strategy
    //             await this.page.keyboard.press('Escape');
    //             await this.page.waitForTimeout(500);

    //             if (i === strategies.length - 1) {
    //                 // All strategies failed
    //                 console.error(`❌ All strategies failed for operating office 2: ${searchValue}`);
    //                 throw new Error(`Failed to select operating office 2 '${searchValue}' after trying ${strategies.length} strategies. Last error: ${error}`);
    //             }
    //         }
    //     }
    // }

    async selectAnotherOperatingOffice(officeValue: string): Promise<void> {
        try {
            await this.anotherOfficeOperatingOfficeDropdown_LOC.waitFor({ state: 'visible' });
            await this.anotherOfficeOperatingOfficeDropdown_LOC.click();
            await this.anotherOfficeOperatingOfficeInput_LOC.first().waitFor({ state: 'visible' });
            await this.anotherOfficeOperatingOfficeInput_LOC.filter({ hasText: officeValue }).first().click();
        } catch (error) {
            throw new Error(`Failed to select operating office '${officeValue}': ${error}`);
        }
    }

    async enterCustomerName(name: string | number): Promise<void> {
        await this.customerNameInput_LOC.waitFor({ state: "visible" });
        await this.customerNameInput_LOC.fill(String(name));
    }

    async enterCustomerCity(name: string | number): Promise<void> {
        await this.customerCityInput_LOC.waitFor({ state: "visible" });
        await this.customerCityInput_LOC.fill(String(name));
    }

    /**
 * @description click Save and Enter Customer Name
 * @author Aniket Nale
 * @modified 26-12-2025
 */

    async clickSaveAndEnterCustomerName(name: string | number): Promise<void> {
        commonReusables.dialogHandler(this.page);
        await this.salesSaveButton_LOC.waitFor({ state: 'visible' });
        await this.salesSaveButton_LOC.scrollIntoViewIfNeeded();
        await commonReusables.clickElementWithRetry(this.salesSaveButton_LOC, 3);
        await this.page.waitForLoadState('networkidle');
        await this.customerNameInput_LOC.waitFor({ state: "visible" });
        await this.customerNameInput_LOC.fill(String(name));
    }
    /**
 * @description click Save and Enter Customer City
 * @author Aniket Nale
 * @modified 26-12-2025
 */
    async clickSaveAndEnterCity(city: string | number): Promise<void> {
        await this.salesSaveButton_LOC.waitFor({ state: 'visible' });
        await this.salesSaveButton_LOC.scrollIntoViewIfNeeded();
        await commonReusables.clickElementWithRetry(this.salesSaveButton_LOC, 3);
        await this.page.waitForLoadState('networkidle');
        await this.customerCityInput_LOC.waitFor({ state: "visible" });
        await this.customerCityInput_LOC.fill(String(city));
    }
    /**
 * @description click Save and Select State
 * @author Aniket Nale
 * @modified 26-12-2025
 */
    async clickSaveAndSelectState(state: string | number): Promise<void> {
        await this.salesSaveButton_LOC.waitFor({ state: 'visible' });
        await this.salesSaveButton_LOC.scrollIntoViewIfNeeded();
        await commonReusables.clickElementWithRetry(this.salesSaveButton_LOC, 3);
        await this.page.waitForLoadState('networkidle');
        await this.customerStateDropdown_LOC.waitFor({ state: "visible" });
        await this.customerStateDropdown_LOC.selectOption({ value: String(state) });
    }

    async selectInvoiceDeliveryPreference(value: string | number): Promise<void> {
        try {
            const preference = String(value);
            console.log(`Selecting ${preference} from invoice delivery preference dropdown...`);
            await this.invoiceDeliveryPreferenceDropdown_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
            await this.invoiceDeliveryPreferenceDropdown_LOC.selectOption({ value: preference });
            console.log(`${preference} selected successfully`);
        } catch (error) {
            console.error(`Failed to select ${value}:`, error);
            throw error;
        }
    }
}