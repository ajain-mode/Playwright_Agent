/**
     * @description This class contains methods to interact with the Edit Sales Lead Page
     * @author Aniket Nale
     * @created 24-Dec-2025
     */

import { Page, Locator } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class LeadsRequestingActivationPage {
    private readonly generalReportTableSelector: Locator;
    private readonly allRows_LOC: Locator;

    constructor(private page: Page) {
        this.generalReportTableSelector = this.page.locator('.general-report table');
        this.allRows_LOC = this.page.locator('.general-report table tr:has(td:nth-child(4))');
    }

    /**
* @description Find and click on customer by exact name with reliable search
* @author Aniket Nale
* @modified 26-12-2025
*/

    async findAndClickCustomerByName(customerName: string): Promise<void> {
        try {
            console.log(`Reliable search for customer: ${customerName}`);
            await this.generalReportTableSelector.waitFor({ state: 'visible', timeout: WAIT.LARGE });
            const rowCount = await this.allRows_LOC.count();

            let targetRowIndex = -1;
            let foundCustomerName = '';

            // Search through all rows to find exact match
            for (let i = 0; i < rowCount; i++) {
                const row = this.allRows_LOC.nth(i);
                const customerCell = row.locator('td:nth-child(4)');
                if (await customerCell.count() > 0) {
                    const cellText = await customerCell.textContent();
                    const trimmedText = cellText?.trim() || '';
                    console.log(`Checking row ${i}: "${trimmedText}"`);
                    if (trimmedText === customerName) {
                        targetRowIndex = i;
                        foundCustomerName = trimmedText;
                        console.log(`Exact match found at row ${i}: "${trimmedText}"`);
                        break;
                    }
                }
            }
            if (targetRowIndex === -1) {
                throw new Error(`Customer "${customerName}" not found in ${rowCount} rows`);
            }
            const targetRow = this.allRows_LOC.nth(targetRowIndex);
            const finalVerification = await targetRow.locator('td:nth-child(4)').textContent();
            console.log(`Final verification: "${finalVerification?.trim()}"`);
            if (finalVerification?.trim() !== customerName) {
                throw new Error(`Final verification failed! Expected: "${customerName}", Got: "${finalVerification?.trim()}"`);
            }
            await targetRow.evaluate(el => {
                el.style.backgroundColor = 'yellow';
                el.style.border = '2px solid red';
            });
            await new Promise(resolve => setTimeout(resolve, WAIT.DEFAULT));
            await targetRow.scrollIntoViewIfNeeded();
            await targetRow.click();
            console.log(`Successfully clicked verified customer: "${customerName}" at row ${targetRowIndex}`);
        } catch (error) {
            console.error(`Reliable search failed for ${customerName}:`, error);
            throw error;
        }
    }
}