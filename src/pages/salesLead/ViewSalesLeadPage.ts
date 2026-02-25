/**
     * @description Implimented page objects and Functions for ViewSalesLeadPage
     * @author Avanish Srivastava
     * @created 2025-09-01
     */

import { expect, Locator, Page } from "@playwright/test";

export default class ViewSalesLeadPage {
    // private readonly generalReportTableSelector: Locator;
    // private readonly allRows_LOC: Locator;

    private readonly expirationDateValue_LOC: Locator;
    private readonly customerNameFieldValue_LOC: Locator;
    private readonly editCustomerButton_LOC: Locator;
    // private readonly saveButton_LOC: Locator;
    private readonly viewSalesLeadPageHeader_LOC: Locator;
    private readonly activateStatusValue_LOC: Locator;

    constructor(private page: Page) {
        // this.allRows_LOC = this.page.locator('.general-report table tr:has(td:nth-child(4))');
        this.expirationDateValue_LOC = this.page.locator('span.pull-right.text-right span');
        this.customerNameFieldValue_LOC = page.locator("//div[contains(text(),'salesAutomationCustomer')]");
        this.editCustomerButton_LOC = page.locator("(//div[@class='btn-group' and @role='group']/button[@value='Edit'])[1]");
        // this.saveButton_LOC = page.locator("(//button[@type='submit' and @value='Save'])[1]");
        this.viewSalesLeadPageHeader_LOC = page.locator("//h2[text()='View Sales Lead']");
        this.activateStatusValue_LOC = page.locator('//strong[normalize-space()="ACTIVATE"]');
        // this.generalReportTableSelector = this.page.locator('.general-report table');
    }

    /**
     * validation of Expiration Date
     * @author Aniket Nale
     * @created 26-12-2025
     */

    async validateExpirationDate(): Promise<void> {
        console.log('Validating expiration date...');

        const todayUTC = new Date();
        const expectedDate = new Date(todayUTC);
        expectedDate.setUTCDate(todayUTC.getUTCDate() + 90);

        const expectedDateFormatted = this.formatDate(expectedDate);
        console.log(`Expected Expiration Date: ${expectedDateFormatted}`);

        await this.expirationDateValue_LOC.waitFor({ state: 'visible', timeout: WAIT.XLARGE });

        const actualDateText = (await this.expirationDateValue_LOC.textContent()) ?? '';
        const actualDate = actualDateText.replace('Expires:', '').trim();

        console.log(`Actual Expiration Date: ${actualDate}`);
        const dateFormatRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        expect.soft(actualDate, 'Expiration date format').toMatch(dateFormatRegex);
        expect.soft(actualDate, 'Expiration date should be 90 days from today').toBe(expectedDateFormatted);

        console.log('Expiration date validation passed');
    }


    // /**
    //  * Formats date and time as YYYY-MM-DD HH:MM:SS
    //  * @param date - Date object
    //  * @returns string in YYYY-MM-DD HH:MM:SS format
    //  * @author Avanish Srivastava
    //  * @created 2025-09-02
    //  */
    // private formatDateTimeUTC(date: Date): string {
    //     return date.toISOString()
    //         .replace('T', ' ')
    //         .replace(/\.\d{3}Z$/, '');
    // }

    /**
     * Formats date as MM/DD/YYYY
     * @param date - Date object
     * @returns string in MM/DD/YYYY format
     * @author Avanish Srivastava
     * @created 2025-09-02
     */
    private formatDate(date: Date): string {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    /**
     * validation of Customer Name
     * @author Avanish Srivastava
     * @created 2025-09-03
     */
    async validateCustomerName(expectedName: string): Promise<void> {
        await this.customerNameFieldValue_LOC.waitFor({ state: 'visible' });
        const customerName = await this.customerNameFieldValue_LOC.textContent();
        const trimmedName = customerName?.trim() || '';
        const trimmedExpected = expectedName?.trim() || '';
        console.log(`Expected: "${trimmedExpected}"`);
        console.log(`Actual: "${trimmedName}"`);
        await expect.soft(trimmedName, `Customer name should match "${trimmedExpected}"`).toBe(trimmedExpected);
        console.log(`Customer name validated successfully: "${trimmedName}"`);
    }

    async clickOnEditCustomerButton() {
        await this.editCustomerButton_LOC.waitFor({ state: 'visible' });
        await this.editCustomerButton_LOC.scrollIntoViewIfNeeded();
        await this.editCustomerButton_LOC.click();
        await this.page.waitForLoadState('load');
    }


    // async selectActivateStatus(): Promise<void> {
    //     try {
    //         console.log('Selecting ACTIVATE from status dropdown...');
    //         const statusDropdown = this.page.locator('select[name="status"]');
    //         await statusDropdown.waitFor({ state: 'visible', timeout: WAIT.DEFAULT * 3 });
    //         await statusDropdown.selectOption({ value: 'ACTIVATE' });
    //         console.log('ACTIVATE selected successfully');
    //     } catch (error) {
    //         console.error('Failed to select ACTIVATE:', error);
    //         throw error;
    //     }
    // }

    // async selectActiveStatus(): Promise<void> {
    //     try {
    //         console.log('Selecting ACTIVE from status dropdown...');
    //         const statusDropdown = this.page.locator('select[name="status"]');
    //         await statusDropdown.waitFor({ state: 'visible', timeout: WAIT.LARGE });
    //         await statusDropdown.selectOption({ value: 'ACTIVE' });
    //         console.log('ACTIVE selected successfully');
    //     } catch (error) {
    //         console.error('Failed to select ACTIVE:', error);
    //         throw error;
    //     }
    // }

    // async clickOnSaveCustomerButton() {
    //     await this.saveButton_LOC.waitFor({ state: 'visible' });
    //     await this.saveButton_LOC.scrollIntoViewIfNeeded();
    //     await Promise.all([
    //         this.saveButton_LOC.click(),
    //     ]);
    //     await this.page.waitForLoadState('load');
    // }

    // async clickOnSaveCustomerButtonAndWaitForPopup() {
    //     await this.saveButton_LOC.waitFor({ state: 'visible' });
    //     await this.saveButton_LOC.scrollIntoViewIfNeeded();

    //     const [popup] = await Promise.all([
    //         this.page.waitForEvent('popup'),
    //         this.saveButton_LOC.click()
    //     ]);

    //     await popup.waitForLoadState('load');

    //     console.log(`Popup opened and loaded successfully with URL: ${popup.url()}`);

    //     await popup.close();
    //     await commonReusables.waitForPageStable(this.page);
    // }


    // async selectInvoiceDeliveryPreference(value: string | number): Promise<void> {
    //     try {
    //         const preference = String(value);
    //         console.log(`Selecting ${preference} from invoice delivery preference dropdown...`);
    //         const statusDropdown = this.page.locator('select[name="invoice_delivery_preference"]');
    //         await statusDropdown.waitFor({ state: 'visible', timeout: WAIT.DEFAULT * 3 });
    //         await statusDropdown.selectOption({ value: preference });
    //         console.log(`${preference} selected successfully`);
    //     } catch (error) {
    //         console.error(`Failed to select ${value}:`, error);
    //         throw error;
    //     }
    // }

    // async findAndClickCustomerByName(customerName: string): Promise<void> {
    //     try {
    //         console.log(`Reliable search for customer: ${customerName}`);
    //         await this.page.waitForSelector(this.generalReportTableSelector, { state: 'visible', timeout: WAIT.LARGE });
    //         const rowCount = await this.allRows_LOC.count();

    //         let targetRowIndex = -1;
    //         let foundCustomerName = '';

    //         // Search through all rows to find exact match
    //         for (let i = 0; i < rowCount; i++) {
    //             const row = this.allRows_LOC.nth(i);
    //             const customerCell = row.locator('td:nth-child(4)');
    //             if (await customerCell.count() > 0) {
    //                 const cellText = await customerCell.textContent();
    //                 const trimmedText = cellText?.trim() || '';
    //                 console.log(`Checking row ${i}: "${trimmedText}"`);
    //                 if (trimmedText === customerName) {
    //                     targetRowIndex = i;
    //                     foundCustomerName = trimmedText;
    //                     console.log(`Exact match found at row ${i}: "${trimmedText}"`);
    //                     break;
    //                 }
    //             }
    //         }
    //         if (targetRowIndex === -1) {
    //             throw new Error(`Customer "${customerName}" not found in ${rowCount} rows`);
    //         }
    //         const targetRow = this.allRows_LOC.nth(targetRowIndex);
    //         const finalVerification = await targetRow.locator('td:nth-child(4)').textContent();
    //         console.log(`Final verification: "${finalVerification?.trim()}"`);
    //         if (finalVerification?.trim() !== customerName) {
    //             throw new Error(`Final verification failed! Expected: "${customerName}", Got: "${finalVerification?.trim()}"`);
    //         }
    //         await targetRow.evaluate(el => {
    //             el.style.backgroundColor = 'yellow';
    //             el.style.border = '2px solid red';
    //         });
    //         await new Promise(resolve => setTimeout(resolve, WAIT.DEFAULT));
    //         await targetRow.scrollIntoViewIfNeeded();
    //         await targetRow.click();
    //         console.log(`Successfully clicked verified customer: "${customerName}" at row ${targetRowIndex}`);
    //     } catch (error) {
    //         console.error(`Reliable search failed for ${customerName}:`, error);
    //         throw error;
    //     }
    // }

    // async selectPaymentTerms(): Promise<void> {
    //     try {
    //         console.log('Selecting NET 15 from payment terms dropdown...');
    //         const paymentTermsDropdown = this.page.locator('select[name="payment_terms"]');
    //         await paymentTermsDropdown.waitFor({ state: 'visible', timeout: WAIT.SMALL });
    //         await paymentTermsDropdown.selectOption({ value: 'NET 15' });
    //         console.log('NET 15 selected successfully');
    //     } catch (error) {
    //         console.error('Failed to select NET 15:', error);
    //         throw error;
    //     }
    // }

    // async validateCustomerNameTest(expectedCustomerName: string): Promise<void> {
    //     try {
    //         console.log(`Validating customer name: ${expectedCustomerName}`);
    //         const customerNameCell = this.page.locator('tr:has(td.fn:text-is("Name")) td.view').first();
    //         await customerNameCell.waitFor({ state: 'visible', timeout: WAIT.SMALL });
    //         const actualCustomerName = (await customerNameCell.textContent())?.trim() || '';
    //         console.log(`Expected: "${expectedCustomerName}"`);
    //         console.log(`Actual: "${actualCustomerName}"`);
    //         if (actualCustomerName === expectedCustomerName) {
    //             console.log('Customer name validation passed');
    //         } else {
    //             throw new Error(`Customer name mismatch! Expected: "${expectedCustomerName}", but found: "${actualCustomerName}"`);
    //         }
    //     } catch (error) {
    //         console.error(`Customer name validation failed: ${error}`);
    //         throw error;
    //     }
    // }
    /**
     * @returns boolean - true if on View Sales Lead page, else throws error
     * @author Rohit Singh
     * @created 2025-09-29
     */
    async verifyOnViewSalesLeadPage(): Promise<boolean> {
        await this.viewSalesLeadPageHeader_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        const isVisible = await this.viewSalesLeadPageHeader_LOC.isVisible();
        if (isVisible) {
            console.log("View Sales Lead page is displayed");
        } else {
            throw new Error("View Sales Lead page is not displayed");
        }
        return isVisible;
    }

    /**
 * @description Verify that customer status is ACTIVE
 * @author Aniket Nale
 * @created 26-12-2025
 */
    async verifyActivateStatusSelecteded(): Promise<void> {
        await this.activateStatusValue_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        await expect.soft(this.activateStatusValue_LOC).toBeVisible();
    }
}