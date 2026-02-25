/**
     * @description Implimented MySalesLeadPage
     * @author Avanish Srivastava
     * @created 2025-09-01
     */

import { Locator, Page, expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class MySalesLeadPage {

    private readonly salesLeadTable_LOC: Locator;
    private readonly tableRows_LOC: Locator;
    private readonly rowValue_LOC: any;
    private readonly clearedRowValue_LOC: any;
    private readonly leadsFilterButton_LOC: Locator;
    private readonly customerNameInput_LOC: Locator;
    private readonly customerSearchButton_LOC: Locator;
    // private readonly customerValue_LOC: Locator;
    // private readonly customerRowValue: any;
    private readonly salesLeadNameValue_LOC: (leadName: string) => Locator;
    private readonly customerValueRow_LOC: (customerName: string) => Locator;
    private readonly clearFilterButton_LOC: Locator;
    private readonly statusInput_LOC: Locator;
    private readonly statusOption_LOC: (statusName: string) => Locator;
    private readonly statusValue_LOC: (statusName: string) => Locator;

    constructor(private page: Page) {
        this.salesLeadTable_LOC = page.locator('#example');
        this.tableRows_LOC = page.locator('#example tbody tr');
        this.rowValue_LOC = 'td';
        this.clearedRowValue_LOC = 'table#example tbody tr';
        this.leadsFilterButton_LOC = page.locator("//button[@id='btnFilter']");
        this.customerNameInput_LOC = page.locator("//*[@id='search_name']");
        this.customerSearchButton_LOC = page.locator("//input[@class='submit-report-search']");
        // this.customerValue_LOC = page.locator("#example tbody tr");
        // this.customerRowValue = 'td';
        this.salesLeadNameValue_LOC = (leadName: string) => page.locator(`//table[@id='example']//td[contains(text(),'${leadName}')]`);
        this.customerValueRow_LOC = (customerName: string) => page.locator(`//tr[td[normalize-space()='${customerName}']]//td[6]`);
        this.clearFilterButton_LOC = page.locator("//div[@class='col-md-12 col-sm-12 radio-flex col-md-offset-0 col-ms-offset-0']//input[@value='Clear']");
        this.statusInput_LOC = page.locator("//div[@id='search_status_magic']//div[@class='ms-trigger']");
        this.statusOption_LOC = (statusName: string) => page.locator('.ms-res-ctn .ms-res-item span', { hasText: statusName });
        this.statusValue_LOC = (statusName: string) => page.locator(`//tr[td[normalize-space()='${statusName}']]//td[normalize-space()='${statusName}']`);
    }

    // private getCustomerRow(customerName: string, status: string = 'NEW'): Locator {
    //     return this.customerValue_LOC
    //         .filter({ has: this.page.locator('td').nth(2).filter({ hasText: customerName }) })
    //         .filter({ has: this.page.locator('td').nth(1).filter({ hasText: status }) });
    // }

    /**
     * Quick validation of sales lead name and today's date
     * @author Avanish Srivastava
     * @created 2025-09-01
     */
    async validateNewSalesLead(customerName: string): Promise<boolean> {
        try {
            console.log(`Validating sales lead: ${customerName}`);
            await this.salesLeadTable_LOC.waitFor({ state: "visible" });
            const today = this.getCurrentDateFormatted();
            const todayAlternate = this.getCurrentDateFormattedAlternate();
            console.log(`Searching for date formats: ${today} OR ${todayAlternate}`);
            const allRows = await this.tableRows_LOC.all();
            console.log(`Total rows found: ${allRows.length}`);
            let foundMatchingName = false;
            let foundMatchingDate = false;
            let foundBoth = false;
            for (let i = 0; i < allRows.length; i++) {
                const cells = await allRows[i].locator(this.rowValue_LOC).all();

                if (cells.length > 13) {
                    const name = (await cells[2].textContent())?.trim() || '';
                    const createdDateTime = (await cells[13].textContent())?.trim() || '';
                    if (i < 3) {
                        console.log(`Row ${i + 1}: Name="${name}", Created="${createdDateTime}"`);
                    }
                    if (name.includes(customerName)) {
                        foundMatchingName = true;
                        console.log(`Found matching name in row ${i + 1}: "${name}"`);
                        console.log(`Created date for this record: "${createdDateTime}"`);

                        if (this.isDateMatch(createdDateTime, today, todayAlternate)) {
                            foundMatchingDate = true;
                            foundBoth = true;
                            console.log(`Date also matches! Record found.`);
                            break;
                        } else {
                            console.log(`Date doesn't match. Expected: ${today} or ${todayAlternate}, Found: ${createdDateTime}`);
                        }
                    }
                }
            }

            expect.soft(foundMatchingName,
                `Customer name "${customerName}" should be found in the table`).toBe(true);
            expect.soft(foundMatchingDate,
                `A record with today's date (${today}) should exist for customer "${customerName}"`).toBe(true);
            expect.soft(foundBoth,
                `Sales lead "${customerName}" should be found for today (${today})`).toBe(true);
            if (foundBoth) {
                console.log(`Sales lead validated: ${customerName} created on ${today}`);
                return true;
            } else {
                console.error(`Sales lead not found: ${customerName} for ${today}`);
                if (foundMatchingName && !foundMatchingDate) {
                    console.error(`   → Customer name exists but not for today's date`);
                } else if (!foundMatchingName) {
                    console.error(`   → Customer name not found in any records`);
                }
                return false;
            }

        } catch (error) {
            console.error(`Validation error:`, error);
            expect.soft(false, `Sales lead validation should not throw errors: ${error}`).toBe(true);
            return false;
        }
    }

    /**
     * Flexible date matching - checks multiple format variations
     * @author Avanish Srivastava
     * @created 2025-09-01
     */
    private isDateMatch(actualDateTime: string, expectedDate1: string, expectedDate2: string): boolean {
        // Check if the actual date contains any of the expected formats
        return actualDateTime.includes(expectedDate1) ||
            actualDateTime.includes(expectedDate2) ||
            this.isToday(actualDateTime);
    }

    /**
     * Checks if the given date string represents today
     * @author Avanish Srivastava
     * @created 2025-09-01
     */
    private isToday(dateTimeString: string): boolean {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const year = today.getFullYear();

        const patterns = [
            `${month}/${day}/${year}`,           // 9/1/2025
            `${month}/${day.toString().padStart(2, '0')}/${year}`,  // 9/01/2025
            `${month.toString().padStart(2, '0')}/${day}/${year}`,  // 09/1/2025
            `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}` // 09/01/2025
        ];

        return patterns.some(pattern => dateTimeString.includes(pattern));
    }

    /**
     * Gets current date in primary table format (M/DD/YYYY)
     * @author Avanish Srivastava
     * @created 2025-09-01
     */
    private getCurrentDateFormatted(): string {
        const today = new Date();
        return this.formatDateForTable(today);
    }

    /**
     * Gets current date in alternate format (M/D/YYYY)
     * @author Avanish Srivastava
     * @created 2025-08-30
     */
    private getCurrentDateFormattedAlternate(): string {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const year = today.getFullYear();
        return `${month}/${day}/${year}`;
    }

    /**
  * Formats date to match table format (with zero-padded day)
  * @author Avanish Srivastava
  * @created 2025-08-30
     */

    private formatDateForTable(date: Date): string {
        const month = date.getMonth() + 1;
        const day = date.getDate().toString().padStart(2, '0'); // Zero-pad the day
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    /**
* Select the Latest Cleared Row
* @author Avanish Srivastava
* @created 2025-08-30
*/

    async selectLatestClearedRow(): Promise<void> {
        console.log('Attempting to select the latest cleared row...');
        const rows = this.page.locator(this.clearedRowValue_LOC);
        await rows.first().waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        const rowCount = await rows.count();
        console.log(`Found ${rowCount} total rows`);
        let latestRowIndex = -1;
        let latestDateTime = new Date(0);
        let latestRowData = {
            status: '',
            clearedDate: '',
            expirationDate: '',
            createdDate: ''
        };
        for (let i = 0; i < rowCount; i++) {
            const row = rows.nth(i);
            const statusCell = row.locator(this.rowValue_LOC).nth(1);
            const status = (await statusCell.textContent() || '').trim();
            if (status === 'CLEARED') {
                const clearedDateCell = row.locator(this.rowValue_LOC).nth(17);
                const clearedDate = (await clearedDateCell.textContent() || '').trim();
                const expirationDateCell = row.locator(this.rowValue_LOC).nth(18);
                const expirationDate = (await expirationDateCell.textContent() || '').trim();
                const createdDateCell = row.locator(this.rowValue_LOC).nth(13);
                const createdDateText = (await createdDateCell.textContent() || '').trim();
                if (clearedDate && expirationDate) {
                    const createdDate = new Date(createdDateText.replace('&nbsp;', ' '));
                    console.log(createdDate);
                    console.log(latestDateTime);
                    if (createdDate > latestDateTime) {
                        latestDateTime = createdDate;
                        latestRowIndex = i;
                        latestRowData = {
                            status,
                            clearedDate,
                            expirationDate,
                            createdDate: createdDateText
                        };
                    }
                }
            }
        }
        if (latestRowIndex === -1) {
            throw new Error('No rows found with CLEARED status and both Cleared/Expiration dates');
        }
        const latestRow = rows.nth(latestRowIndex);
        console.log('Latest cleared row details:', latestRowData);
        await expect(latestRow).toBeVisible({ timeout: WAIT.DEFAULT });
        const statusCell = latestRow.locator(this.rowValue_LOC).nth(1);
        await expect(statusCell).toHaveText('CLEARED');
        const datePattern = /^\d{2}\/\d{2}\/\d{2}$/;
        expect(latestRowData.clearedDate).toMatch(datePattern);
        expect(latestRowData.expirationDate).toMatch(datePattern);
        expect(latestRowData.clearedDate).toContain('25');
        expect(latestRowData.expirationDate).toContain('25');
        console.log(`Clicking row ${latestRowIndex + 1} with creation date: ${latestDateTime.toLocaleString()}`);
        await latestRow.scrollIntoViewIfNeeded();
        await latestRow.click();
        console.log('Successfully selected the latest cleared row');
    }

    /**
* Validate the New Created Customer Name
* @author Avanish Srivastava
* @created 2025-08-29
*/

    async validateNewSalesLeadforCustomer(customerName: string): Promise<boolean> {
        try {
            console.log(`Validating sales lead by customer name: ${customerName}`);
            await this.salesLeadTable_LOC.waitFor({ state: "visible" });
            await this.salesLeadTable_LOC.scrollIntoViewIfNeeded();
            const allRows = await this.tableRows_LOC.all();
            console.log(`Total rows found: ${allRows.length}`);

            if (allRows.length === 0) {
                console.error('No rows found in the sales lead table');
                return false;
            }
            let foundMatchingName = false;
            let matchedRowIndex = -1;
            let matchedCustomerName = '';

            for (let i = 0; i < allRows.length; i++) {
                const cells = await allRows[i].locator(this.rowValue_LOC).all();
                if (cells.length > 2) {
                    await allRows[i].scrollIntoViewIfNeeded();
                    const name = (await cells[2].textContent())?.trim() || '';
                    if (i < 3) {
                        console.log(`Row ${i + 1}: Name="${name}"`);
                    }
                    if (name === customerName) {
                        foundMatchingName = true;
                        matchedRowIndex = i + 1;
                        matchedCustomerName = name;
                        console.log(`Found exact matching customer name in row ${matchedRowIndex}: "${matchedCustomerName}"`);
                        await allRows[i].scrollIntoViewIfNeeded();
                        break;
                    }
                }
            }
            await expect.soft(foundMatchingName,
                `Random customer name "${customerName}" should be found in the sales lead table`).toBe(true);

            if (foundMatchingName) {
                console.log(`Sales lead validation successful: Customer "${matchedCustomerName}" found in row ${matchedRowIndex}`);
                return true;
            } else {
                console.error(`Sales lead validation failed: Customer "${customerName}" not found in any table rows`);
                console.log('Available customer names in table (first 5 rows):');
                for (let i = 0; i < Math.min(allRows.length, 5); i++) {
                    const cells = await allRows[i].locator(this.rowValue_LOC).all();
                    if (cells.length > 2) {
                        await allRows[i].scrollIntoViewIfNeeded();
                        const name = (await cells[2].textContent())?.trim() || '';
                        console.log(`  - Row ${i + 1}: "${name}"`);
                    }
                }
                return false;
            }

        } catch (error) {
            console.error(`Sales lead validation error:`, error);
            await expect.soft(false, `Sales lead validation should not throw errors: ${error}`).toBe(true);
            return false;
        }
    }

    /**
* Clicks the 'Filter' button 
* @author Avanish Srivastava
* @created 2025-08-29
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
                // Wait for the button to be visible after reload
                await this.leadsFilterButton_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
                await this.leadsFilterButton_LOC.click();
                console.log("Successfully clicked on Leads Filter Button after reload");
            }
        } catch (error) {
            console.error(`Failed to click on Leads Filter Button: ${error}`);
            throw new Error(`Unable to interact with Leads Filter Button: ${error}`);
        }
    }

    /**
  * Search Customer By Name 
  * @author Avanish Srivastava
  * @created 2025-09-11
  * @author Aniket Nale
  * @modified 23-Dec-2025
  */

    async searchCustomerByName(customerName: string): Promise<void> {
        console.log(`Searching for customer: ${customerName}`);
        await this.customerNameInput_LOC.waitFor({ state: "visible" });
        await this.customerNameInput_LOC.fill(customerName);
        await this.customerSearchButton_LOC.waitFor({ state: 'visible' });
        await this.customerSearchButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
        console.log(`Search executed for customer: ${customerName}`);
    }

    /**
  * Click on Customer Search 
  * @author Avanish Srivastava
  * @created 2025-09-11
  */

    async clickOnCustomerSearch() {
        await this.customerSearchButton_LOC.waitFor({ state: 'visible' });
        await Promise.all([
            this.customerSearchButton_LOC.click(),
            this.page.waitForLoadState('domcontentloaded'),
        ]);
    }

    /**description Validate Customer Name On My Sales Leads Page
         * @author Rohit Singh
         * @created 2025-12-22
         * @param leadName
         */
    async validateCustomerName(leadName: string) {
        await this.page.waitForLoadState('networkidle');
        const salesLeadNameValue = this.salesLeadNameValue_LOC(leadName);
        await salesLeadNameValue.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await expect.soft(salesLeadNameValue).toBeVisible({ timeout: WAIT.LARGE });
        console.log(`Validated Sales Lead Name: ${leadName} on My Sales Leads Page`);
    }

    async clickOnCustomerRow(customerName: string): Promise<void> {
        console.log(`Clicking on customer row for customer: ${customerName}`);
        const customerRow = this.customerValueRow_LOC(customerName).first();
        await customerRow.waitFor({ state: 'visible' });
        await customerRow.scrollIntoViewIfNeeded();
        await customerRow.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
* @description Click on Clear Filter Button
* @author Aniket Nale
* @created 26-12-2025
*/

    async clickOnClearFilterButton(): Promise<void> {
        await this.clearFilterButton_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await this.clearFilterButton_LOC.click();
        console.log("Successfully clicked on Clear Filter Button");
    }

    /**
* @description Select Leads Filter Status
* @author Aniket Nale
* @created 26-12-2025
*/

    async selectLeadsFilterStatus(statusName: string): Promise<void> {
        await this.statusInput_LOC.waitFor({ state: 'visible' });
        await this.statusInput_LOC.click();
        const statusOption = this.statusOption_LOC(statusName);
        await statusOption.waitFor({ state: 'visible' });
        await statusOption.click();
        console.log(`Status selected: ${statusName}`);
    }
    /**
* @description Verify that 'DENIED' status is selected on View Sales Lead Page
* @author Aniket Nale
* @created 26-12-2025
*/
    async verifyCustomerStatus(status: string): Promise<void> {
        const statusValue = this.statusValue_LOC(status);
        await statusValue.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await expect.soft(statusValue).toBeVisible();
        const statusText = await statusValue.textContent();
        expect.soft(statusText?.trim()).toBe(status);
        console.log(`Verified that customer status is: ${status}`);
    }
}