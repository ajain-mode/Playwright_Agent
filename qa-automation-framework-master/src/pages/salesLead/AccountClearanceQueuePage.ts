/**
* @description Implimented Page Objects and Functions for account Clearance Page
* @author Avanish Srivastava
* @created 2025-09-05
*/

import { expect, Locator, Page } from "@playwright/test";

export default class AccountClearanceQueuePage {

    private readonly accountClearanceButton_LOC: Locator;
    private readonly denyWithInfoButton_LOC: Locator;
    private readonly denyWithNoInfoButton_LOC: Locator;
    private readonly searchButton_LOC: Locator;
    private readonly rowValue_LOC: any;
    private readonly customerTableValue_LOC: Locator;
    private readonly customerSearchInput_LOC: Locator;
    private readonly customersValue_LOC: Locator;
    private readonly customerReqClearanceValue_LOC: Locator;
    private readonly customerEmptyTable_LOC: any;
    private readonly customerNameInput_LOC: Locator;
    private readonly customerSearchButton_LOC: Locator;
    // private readonly customerValue_LOC: Locator;
    private readonly leadsFilterButton_LOC: Locator;
    private readonly customerValueRow_LOC: (customerName: string) => Locator;

    constructor(private page: Page) {
        this.accountClearanceButton_LOC = page.locator("#account_clearance_form_clear_account");
        this.denyWithInfoButton_LOC = page.locator("//button[@id='account_clearance_form_deny_w_info']");
        this.denyWithNoInfoButton_LOC = page.locator("//button[@id='account_clearance_form_deny_no_info']");
        this.searchButton_LOC = page.locator("//button[@id='account_clearance_form_search_active_customers']");
        this.rowValue_LOC = 'td';
        this.customerTableValue_LOC = page.locator('#customers_table tbody tr.active-customer-row');
        this.customerSearchInput_LOC = page.locator("//input[@id='account_clearance_form_active_customer_search_name']");
        this.customersValue_LOC = page.locator('#customers_table');
        this.customerReqClearanceValue_LOC = page.locator('table#example tbody tr');
        this.customerEmptyTable_LOC = "#customers_table tbody .dataTables_empty";
        this.customerNameInput_LOC = page.locator("//*[@id='cust_agent_name']");
        this.customerSearchButton_LOC = page.locator("//input[@class='submit-report-search']");
        // this.customerValue_LOC = page.locator("#example tbody tr");
        this.leadsFilterButton_LOC = page.locator("//button[@id='btnFilter']");
        this.customerValueRow_LOC = (customerName: string) => page.locator(`//tr[td[normalize-space()='${customerName}']]//td[6]`);
    }

    /**
   * Select the Request Clearance
   * @author Avanish Srivastava
   * @created 2025-09-05
   */

    async selectRequestClearance(): Promise<void> {
        console.log('Attempting to select the latest row based on Created Date and Requested Date...');
        const rows = this.customerReqClearanceValue_LOC;
        try {
            await rows.first().waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
            const rowCount = await rows.count();
            console.log(`Found ${rowCount} rows in the table`);
            if (rowCount === 0) {
                throw new Error('Table is loaded but contains no rows');
            }
            let latestRowIndex = 0;
            let latestDateTime = new Date(0);
            for (let i = 0; i < rowCount; i++) {
                const row = rows.nth(i);
                await row.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
                const createdDateCell = row.locator(this.rowValue_LOC).nth(12);
                const createdDateText = (await createdDateCell.textContent() || '').trim();
                const requestedDateCell = row.locator(this.rowValue_LOC).last();
                const requestedDateText = (await requestedDateCell.textContent() || '').trim();
                console.log(`Row ${i + 1} - Created: ${createdDateText}, Requested: ${requestedDateText}`);
                if (createdDateText || requestedDateText) {
                    const createdDate = createdDateText ? new Date(createdDateText.replace('&nbsp;', ' ')) : new Date(0);
                    const requestedDate = requestedDateText ? new Date(requestedDateText.replace('&nbsp;', ' ')) : new Date(0);
                    const laterDate = new Date(Math.max(createdDate.getTime(), requestedDate.getTime()));
                    if (laterDate > latestDateTime) {
                        latestDateTime = laterDate;
                        latestRowIndex = i;
                    }
                }
            }
            if (latestDateTime.getTime() === 0) {
                throw new Error('No valid dates found in any row');
            }
            const latestRow = rows.nth(latestRowIndex);
            console.log(`Clicking row ${latestRowIndex + 1} with latest date: ${latestDateTime.toLocaleString()}`);
            await latestRow.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
            await latestRow.scrollIntoViewIfNeeded();
            const isVisible = await latestRow.isVisible();
            if (!isVisible) {
                throw new Error('Selected row is not visible after scroll');
            }
            await latestRow.click();
            console.log('Successfully clicked the latest row');
        } catch (error) {
            console.error('Error in selectRequestClearance:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to select request clearance: ${error.message}`);
            }
            throw error;
        }
    }

    /**
 * Click on the Account Clearance Button
 * @author Avanish Srivastava
 * @created 2025-09-05
 */

    async clickOnAccountClearanceButton() {
        await this.page.waitForLoadState('domcontentloaded');
        await this.accountClearanceButton_LOC.click();
    }

    /**
 * Click on the Deny with Info
 * @author Avanish Srivastava
 * @created 2025-09-05
 */

    async clickOnDenyWithInfo() {
        await this.denyWithInfoButton_LOC.waitFor({ state: 'visible' });
        await this.denyWithInfoButton_LOC.scrollIntoViewIfNeeded();
        await expect.soft(this.denyWithInfoButton_LOC).toBeEnabled();
        await this.denyWithInfoButton_LOC.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
   * Click on the Deny with No Info
   * @author Avanish Srivastava
   * @created 2025-09-05
   */

    async clickOnDenyWithNoInfo() {
        await this.denyWithNoInfoButton_LOC.waitFor({ state: 'visible' });
        await this.denyWithNoInfoButton_LOC.scrollIntoViewIfNeeded();
        await expect.soft(this.denyWithNoInfoButton_LOC).toBeEnabled();
        await this.denyWithNoInfoButton_LOC.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
  * Click on the Search Button
  * @author Avanish Srivastava
  * @created 2025-09-05
  */

    async clickOnSearchButton() {
        await this.searchButton_LOC.waitFor({ state: 'visible' });
        await this.searchButton_LOC.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
  * validates the results for no customer found
  * @author Avanish Srivastava
  * @created 2025-09-05
  */

    async validateNoCustomersFound(): Promise<void> {
        console.log('Checking if no customers are found...');
        await this.customersValue_LOC.waitFor({ state: 'visible' });
        const emptyMessage = this.page.locator(this.customerEmptyTable_LOC);
        await emptyMessage.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await emptyMessage.scrollIntoViewIfNeeded();
        const messageText = await emptyMessage.textContent();
        await expect.soft(messageText).toContain('No Active Customers Found');
        if (!messageText?.includes('No Active Customers Found')) {
            console.error(`Expected "No Active Customers Found" message, but got: ${messageText}`);
        } else {
            console.log('Confirmed: No active customers found');
        }
    }

    /**
   * Searches for a specific customer 
   * @author Avanish Srivastava
   * @created 2025-09-05
   * @modified 2025-09-22
   */

    async searchForSpecificCustomer(customerName: string | number): Promise<void> {
        console.log(`Performing additional validation by searching for specific customer: ${customerName}`);
        try {
            const searchInput = this.customerSearchInput_LOC;
            await searchInput.waitFor({ state: 'visible' });
            await searchInput.scrollIntoViewIfNeeded();
            await searchInput.clear();
            await searchInput.fill(String(customerName));
            console.log(`Entered customer name: ${customerName}`);
            await this.clickOnSearchButton();
            console.log('Clicked search button for specific customer');
            await this.validateCustomerSearch(customerName);  // Pass the customer name to validation
        } catch (error) {
            console.error(`Error during specific customer search for ${customerName}:`, error);
            throw error;
        }
    }

    /**
 * Validates the customer search results
 * @author Avanish Srivastava
 * @created 2025-09-05
 * @modified 2025-09-22
 */

    async validateCustomerSearch(expectedCustomerName: string | number): Promise<void> {
        const customerName = String(expectedCustomerName).toUpperCase();

        console.log(`Validating customer search results for: ${customerName}`);
        try {
            await this.customersValue_LOC.waitFor({ state: 'visible' });
            await this.customersValue_LOC.scrollIntoViewIfNeeded();
            const tableRows = this.customerTableValue_LOC;
            const rowCount = await tableRows.count();
            console.log(`Found ${rowCount} customer records`);

            if (rowCount === 0) {
                throw new Error(`No customer records found for ${customerName}`);
            }

            let foundExpectedCustomer = false;

            for (let i = 0; i < rowCount; i++) {
                const row = tableRows.nth(i);
                await row.scrollIntoViewIfNeeded();
                const customerNameCell = row.locator(this.rowValue_LOC).nth(3);
                const currentCustomerName = (await customerNameCell.textContent())?.trim() || '';

                console.log(`Row ${i + 1}: Customer="${currentCustomerName}"`);

                if (currentCustomerName.toUpperCase().includes(customerName)) {
                    foundExpectedCustomer = true;
                    console.log(`Found expected customer: ${currentCustomerName}`);
                    await row.scrollIntoViewIfNeeded();
                    break;
                }
            }

            await expect.soft(foundExpectedCustomer,
                `Should find ${customerName} customer`).toBe(true);

            if (foundExpectedCustomer) {
                console.log(`Successfully validated ${customerName} customer`);
            } else {
                console.error(`${customerName} customer validation failed`);
            }
        } catch (error) {
            console.error(`Error validating ${customerName} customer:`, error);
            await expect.soft(false, `${customerName} customer validation should not fail: ${error}`).toBe(true);
            throw error;
        }
    }

    /**
  * Validates the customer search 
  * @author Avanish Srivastava
  * @created 2025-09-05
  * @modified 2025-09-24
  * @author Aniket Nale
  */

    async searchCustomerByName(customerName: string): Promise<void> {
        console.log(`Searching for customer: ${customerName}`);
        await this.customerNameInput_LOC.waitFor({ state: "visible" });
        await this.customerNameInput_LOC.fill(customerName);
        await this.customerSearchButton_LOC.waitFor({ state: 'visible' });
        await this.customerSearchButton_LOC.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    //     /**
    // * Click on First Customer Row
    // * @author Avanish Srivastava
    // * @created 2025-09-05
    // */

    //     async clickOnFirstCustomerRow(): Promise<void> {
    //         console.log(`Clicking on first customer row in table`);
    //         await this.customerValue_LOC.waitFor({ state: 'visible' });
    //         const firstRow = this.customerValue_LOC.first();

    //         await Promise.all([
    //             firstRow.click(),
    //             this.page.waitForLoadState('domcontentloaded')
    //         ]);

    //         console.log(`Successfully clicked on first customer row`);
    //     }

    async clickOnCustomerRow(customerName: string): Promise<void> {
        console.log(`Clicking on customer row for customer: ${customerName}`);
        const customerRow = this.customerValueRow_LOC(customerName).first();
        await customerRow.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await customerRow.scrollIntoViewIfNeeded();
        await customerRow.click();
    }

    /**
* Clicks the 'Filter' button 
* @author Aniket Nale
* @created 24-12-2025
*/
    async clickOnLeadsFilter() {
        try {
            console.log("Attempting to click on Leads Filter Button");
            await this.page.waitForLoadState('networkidle');
            const filterButton = await this.leadsFilterButton_LOC.isVisible();
            if (filterButton) {
                await this.leadsFilterButton_LOC.click();
                console.log("Successfully clicked on Leads Filter Button");
            } else {
                console.log("Leads Filter Button is not visible, attempting page reload");
                await this.page.reload();
                await this.page.waitForLoadState('networkidle');
                await this.leadsFilterButton_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
                await this.leadsFilterButton_LOC.click();
                console.log("Successfully clicked on Leads Filter Button after reload");
            }
        } catch (error) {
            console.error(`Failed to click on Leads Filter Button: ${error}`);
            throw new Error(`Unable to interact with Leads Filter Button: ${error}`);
        }
    }
}

