import { Locator, Page } from '@playwright/test';
import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";
import { REGEX_PATTERNS } from "@utils/regexPatterns";

/**
 * All Loads Search page (Loads → Search, loadlist.php).
 * Locator source: loadlist.php, ReportFilterManager.php.
 * @author Tejaswini
 * @created 2026-02-25
 */
export default class AllLoadsSearchPage {

    private readonly checkAll_LOC: Locator;
    private readonly bulkChange_LOC: Locator;
    private readonly searchbutton_LOC: Locator;
    private readonly searchLoads_LOC: Locator;
    private readonly statusMultiselectContainer_LOC: Locator;
    private readonly statusMultiselectTrigger_LOC: Locator;
    /** First LOADSEARCH data row — `#example_wrapper table#example` → `tbody > tr.dnd-moved` */
    private readonly resultsTableFirstDataRow_LOC: Locator;
    private readonly resultsDataRows_LOC: Locator;
    private readonly tableHeaders_LOC: Locator;

    constructor(private page: Page) {
        this.checkAll_LOC = this.page.locator("//input[@id='master_cb']");
        this.bulkChange_LOC = this.page.locator("//button[@id='bulk-change-button']");
        this.searchbutton_LOC = this.page.locator("//input[@class='submit-report-search']");
        this.searchLoads_LOC = this.page.locator("//input[@id='search_loadsh_ids']");
        this.statusMultiselectContainer_LOC = this.page.locator("#search_status_magic");
        this.statusMultiselectTrigger_LOC = this.statusMultiselectContainer_LOC.locator(".ms-trigger");
        const resultsTable = this.page.locator("#example_wrapper table#example");
        this.resultsDataRows_LOC = resultsTable.locator("tbody > tr.dnd-moved");
        this.resultsTableFirstDataRow_LOC = this.resultsDataRows_LOC.first();
        this.tableHeaders_LOC = resultsTable.locator("thead > tr > th");
    }

    /**
     * True when a LOADSEARCH grid cell has no display value (empty, dash, or whitespace).
     * @author AI Agent
     * @created 2026-06-04
     */
    private isReportCellEmpty(cellText: string): boolean {
        const normalized = (cellText || "").replace(REGEX_PATTERNS.TEXT.WHITESPACE_RUNS, " ").trim();
        return !normalized || normalized === "-" || normalized === "—";
    }

    /**
     * Normalizes report grid header text for case-insensitive exact label matching.
     * @author AI Agent
     * @created 2026-06-09
     */
    private normalizeReportHeader(headerText: string): string {
        return (headerText || "").replace(REGEX_PATTERNS.TEXT.WHITESPACE_RUNS, " ").trim().toUpperCase();
    }

    /**
     * Resolves a column index (0-based) from UI column label(s).
     * Locator source: report_sizzle.phtml — `#example_wrapper table#example` → `thead > tr > th`
     * @author AI Agent
     * @created 2026-06-04
     * @param columnLabels - Exact on-screen labels (e.g. LOAD_SEARCH_COLUMNS.BILLING_ACTIVITY)
     */
    async getColumnIndex(columnLabels: string[]): Promise<number> {
        const headerCount = await this.tableHeaders_LOC.count();
        for (let i = 0; i < headerCount; i++) {
            const text = this.normalizeReportHeader(await this.tableHeaders_LOC.nth(i).innerText());
            if (columnLabels.some((label) => text === this.normalizeReportHeader(label))) {
                return i;
            }
        }
        throw new Error(`Column not found: ${columnLabels.join(", ")}`);
    }

    /**
     * Selects a load status in the Status multiselect (`#search_status_magic`).
     * Locator source: loadlist.php / ReportFilterManager.php
     * @author AI Agent
     * @created 2026-06-03
     * @param status - Status label to select (e.g. BOOKED)
     */
    async selectLoadStatus(status: string): Promise<void> {
        await this.statusMultiselectTrigger_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.statusMultiselectTrigger_LOC.click();
        const statusOption = this.statusMultiselectContainer_LOC.getByText(status, { exact: true });
        await statusOption.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await statusOption.click();
        await this.page.keyboard.press("Escape");
    }

    /**
     * Clicks Search on the Load Search report.
     * @author AI Agent
     * @created 2026-06-03
     */
    async clickSearchButton(): Promise<void> {
        await this.searchbutton_LOC.scrollIntoViewIfNeeded();
        await this.searchbutton_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.searchbutton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
     * Waits until the first LOADSEARCH sizzle result row is visible.
     * Locator source: report_sizzle.phtml:1580 — `#example_wrapper table#example` → `tbody > tr.dnd-moved`
     * @author AI Agent
     * @created 2026-06-03
     */
    async waitForSearchResults(): Promise<void> {
        await this.resultsTableFirstDataRow_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
    }

    /**
     * Clicks the first LOADSEARCH result row (`tr.dnd-moved` row onClick → loadform.php linkurl).
     * Locator source: `#example_wrapper table#example` → `tbody > tr.dnd-moved`; rptdefs.inc.php LOADSEARCH linkurl
     * @author AI Agent
     * @created 2026-06-03
     */
    async clickFirstLoadDetailRow(): Promise<void> {
        await this.waitForSearchResults();
        await this.resultsTableFirstDataRow_LOC.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
     * Returns the number of LOADSEARCH data rows currently shown.
     * @author AI Agent
     * @created 2026-08-03
     * @returns Row count
     */
    async getResultRowCount(): Promise<number> {
        await this.waitForSearchResults();
        return this.resultsDataRows_LOC.count();
    }

    /**
     * Clicks the LOADSEARCH data row at the given 0-based index.
     * @author AI Agent
     * @created 2026-08-03
     * @param index - Zero-based row index
     */
    async clickLoadDetailRowAtIndex(index: number): Promise<void> {
        await this.waitForSearchResults();
        const row = this.resultsDataRows_LOC.nth(index);
        await row.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await row.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
     * Clicks the first LOADSEARCH row whose BILLING ACTIVITY cell is empty.
     * Locator source: loadsearch.inc.php — `BILLING ACTIVITY` column; `#example_wrapper table#example` → `tbody > tr.dnd-moved`
     * @author AI Agent
     * @created 2026-06-04
     */
    async clickLoadDetailRowWithEmptyBillingActivity(): Promise<void> {
        await this.waitForSearchResults();

        const billingActivityIdx = await this.getColumnIndex([LOAD_SEARCH_COLUMNS.BILLING_ACTIVITY]);

        const rowCount = await this.resultsDataRows_LOC.count();
        for (let r = 0; r < rowCount; r++) {
            const row = this.resultsDataRows_LOC.nth(r);
            const activityText = ((await row.locator("td").nth(billingActivityIdx).innerText()) || "")
                .replace(REGEX_PATTERNS.TEXT.WHITESPACE_RUNS, " ")
                .trim();

            if (this.isReportCellEmpty(activityText)) {
                console.log(
                    `LOADSEARCH: clicking row ${r + 1} with empty ${LOAD_SEARCH_COLUMNS.BILLING_ACTIVITY}`
                );
                await row.click();
                await commonReusables.waitForPageStable(this.page);
                return;
            }
        }

        throw new Error(
            `No LOADSEARCH row found with empty ${LOAD_SEARCH_COLUMNS.BILLING_ACTIVITY}`
        );
    }

    /**
     * Selects all available loads in the All Load Search results page.
     * @author Tejaswini
     * @created 2026-02-25
     */
    async selectAllLoads(): Promise<void> {
        await this.checkAll_LOC.check();
    }

    /**
     * Clicks on the Bulk Change button on All Load Search results page.
     * @author Tejaswini
     * @created 2026-02-25
     */
    async clickBulkChangeButton(): Promise<void> {
        await this.bulkChange_LOC.click();
    }

    /**
     * Searches for multiple loads using their load numbers.
     * Retries when the server returns a PHP implode error on bad input.
     * @author Tejaswini
     * @created 2026-02-25
     * @param loadNumbers - Load numbers to search (comma-joined in `#search_loadsh_ids`)
     * @param pages - PageManager for navigation retry via Loads → Search
     */
    async searchMultipleLoads(loadNumbers: string[], pages: PageManager): Promise<void> {
        const cleaned = loadNumbers.map(n => (n || '').toString().trim()).filter(Boolean);
        const loadsToSearch = cleaned.join(',');
        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            console.log(`searchMultipleLoads attempt ${attempt}/${maxAttempts}`);
            await this.searchLoads_LOC.fill(loadsToSearch);
            await this.searchbutton_LOC.scrollIntoViewIfNeeded();
            await this.searchbutton_LOC.waitFor({ state: 'visible' });
            await Promise.all([
                this.searchbutton_LOC.click(),
                this.page.waitForLoadState('networkidle', { timeout: WAIT.SPEC_TIMEOUT })
            ]);

            const bodyText = await this.page.content();
            if (bodyText.includes("TypeError: implode(): Argument #2" ) || bodyText.includes('implode(')) {
                console.warn('Detected server implode error after search. Retrying...');
                try {
                    await this.page.goBack({ waitUntil: 'domcontentloaded' });
                } catch (e) {
                    console.warn('goBack failed or no history available:', e ?? e);
                }
                await this.page.waitForTimeout(WAIT.DEFAULT * attempt);
                await pages.basePage.clickHomeButton();
                await pages.basePage.waitForMultipleLoadStates(['networkidle']);
                await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
                await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);

                continue;
            }
            return;
        }
        throw new Error('searchMultipleLoads: server returned PHP implode error after multiple attempts');
    }

}
