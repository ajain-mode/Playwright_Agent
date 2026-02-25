import { Page, BrowserContext } from '@playwright/test';

/**
 * Switches to the newly opened tab in the browser context.
 * @param context - Browser context shared across tabs.
 * @param currentPage - The original page before the tab opens.
 * @returns - The newly opened tab as a Page object.
 */

export async function switchToNewTab(context: BrowserContext, currentPage: Page): Promise<Page> {
    const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        currentPage.waitForTimeout(1000), // Optional buffer if the tab takes time to open
    ]);
    await newPage.waitForLoadState('load');
    return newPage;
}

/**
 * Brings the original tab back into focus.
 * @param originalPage - The original Page object to return to.
 */
export async function switchBackToOriginalTab(originalPage: Page): Promise<void> {
    await originalPage.bringToFront();
}


