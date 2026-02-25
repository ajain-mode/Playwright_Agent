import { Locator, Page } from "@playwright/test";

/**
 * This class provides utility functions for My Bulk Loads. 
 * @author Tejaswini
 * @created 2026-01-08
 */
export default class MyBulkLoadsChangesAndImports {

    private readonly successLocator_LOC: Locator;

    constructor(private page: Page) {
        this.successLocator_LOC = this.page.locator("//td[normalize-space()='SUCCESS']")
    }

    /**
     * Waits for Bulk Change status to become SUCCESS and logs a message.
     * Reloads page every 3 seconds for a maximum of 30 seconds.
     */
    async waitForBulkChangeSuccessStatus(): Promise<void> {
        const maxWaitTime = WAIT.XLARGE; 
        const reloadInterval = WAIT.DEFAULT;
        const startTime = Date.now();
        let successCount = 0;
        while (Date.now() - startTime < maxWaitTime) {
            try {
                await this.page.reload({ waitUntil: 'domcontentloaded' });
            } catch (error) {
                console.log(`⚠️ Page reload failed (page may have navigated): ${error}`);
            }
            successCount = await this.successLocator_LOC.count();
            if (successCount >= 2) {
                console.log(`✅ Bulk Change Status done for both loads.`);
                break;
            }
            await this.page.waitForTimeout(reloadInterval);
        }
        if (successCount === 1) {
            console.log(`✅ Bulk Change Status done for one load, but still proceeding to validation`);
        } else if (successCount === 0) {
            console.warn(`⚠️ Bulk change status is not done, but processing to validation. Validation may fail`);
        }
    }
}