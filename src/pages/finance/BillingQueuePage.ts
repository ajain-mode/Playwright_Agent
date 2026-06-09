import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { REGEX_PATTERNS } from "@utils/regexPatterns";

/**
 * Billing Queue report page (Finance → Billing Queue, rptname=BILLINGQUEUE).
 * Locator source: loadlist.php, report_sizzle.phtml, ReportFilterManager.php, DatePresetBuilder.php.
 * @author AI Agent
 * @created 2026-06-03
 */
export default class BillingQueuePage {
    private readonly searchButton_LOC: Locator;
    private readonly resultsTable_LOC: Locator;
    private readonly resultsDataRows_LOC: Locator;
    private readonly tableHeaders_LOC: Locator;

    private readonly initialToggleDateStart_LOC: Locator;
    private readonly initialToggleDateEnd_LOC: Locator;
    private readonly initialTogglePresetLink_LOC: Locator;
    private readonly initialTogglePresetOptions_LOC: Locator;

    private readonly agentToggleDateStart_LOC: Locator;
    private readonly agentToggleDateEnd_LOC: Locator;
    private readonly agentTogglePresetLink_LOC: Locator;
    private readonly agentTogglePresetOptions_LOC: Locator;

    private readonly docsRecdDateStart_LOC: Locator;
    private readonly docsRecdDateEnd_LOC: Locator;
    private readonly docsRecdPresetLink_LOC: Locator;
    private readonly docsRecdPresetOptions_LOC: Locator;

    /** Date filter field prefixes — `search_{name}start` / `search_{name}end` / `span#{prefix}link` */
    static readonly DATE_FILTER_PREFIX = {
        DOCS_RECD: "search_carr_bill_recd_date",
        INITIAL_TOGGLE: "search_initialbillingtoggle_date",
        AGENT_TOGGLE: "search_agenttobillingtoggle_date",
    } as const;

    constructor(private page: Page) {
        this.searchButton_LOC = this.page.locator("//input[@class='submit-report-search']");
        this.resultsTable_LOC = this.page.locator("#example_wrapper table#example");
        this.tableHeaders_LOC = this.resultsTable_LOC.locator("thead > tr > th");
        this.resultsDataRows_LOC = this.resultsTable_LOC.locator("tbody > tr[role='row']");

        const initialPrefix = BillingQueuePage.DATE_FILTER_PREFIX.INITIAL_TOGGLE;
        this.initialToggleDateStart_LOC = this.page.locator(`#${initialPrefix}start`);
        this.initialToggleDateEnd_LOC = this.page.locator(`#${initialPrefix}end`);
        this.initialTogglePresetLink_LOC = this.page.locator(`span#${initialPrefix}link`);
        this.initialTogglePresetOptions_LOC = this.page.locator(
            `div.dateblock:has(#${initialPrefix}start) a.datelink`
        );

        const agentPrefix = BillingQueuePage.DATE_FILTER_PREFIX.AGENT_TOGGLE;
        this.agentToggleDateStart_LOC = this.page.locator(`#${agentPrefix}start`);
        this.agentToggleDateEnd_LOC = this.page.locator(`#${agentPrefix}end`);
        this.agentTogglePresetLink_LOC = this.page.locator(`span#${agentPrefix}link`);
        this.agentTogglePresetOptions_LOC = this.page.locator(
            `div.dateblock:has(#${agentPrefix}start) a.datelink`
        );

        const docsPrefix = BillingQueuePage.DATE_FILTER_PREFIX.DOCS_RECD;
        this.docsRecdDateStart_LOC = this.page.locator(`#${docsPrefix}start`);
        this.docsRecdDateEnd_LOC = this.page.locator(`#${docsPrefix}end`);
        this.docsRecdPresetLink_LOC = this.page.locator(`span#${docsPrefix}link`);
        this.docsRecdPresetOptions_LOC = this.page.locator(`div.dateblock:has(#${docsPrefix}start) a.datelink`);
    }

    private resolveDateFilterLocators(datePrefix: string): {
        presetLink: Locator;
        presetOptions: Locator;
        dateStart: Locator;
        dateEnd: Locator;
    } {
        switch (datePrefix) {
            case BillingQueuePage.DATE_FILTER_PREFIX.INITIAL_TOGGLE:
                return {
                    presetLink: this.initialTogglePresetLink_LOC,
                    presetOptions: this.initialTogglePresetOptions_LOC,
                    dateStart: this.initialToggleDateStart_LOC,
                    dateEnd: this.initialToggleDateEnd_LOC,
                };
            case BillingQueuePage.DATE_FILTER_PREFIX.AGENT_TOGGLE:
                return {
                    presetLink: this.agentTogglePresetLink_LOC,
                    presetOptions: this.agentTogglePresetOptions_LOC,
                    dateStart: this.agentToggleDateStart_LOC,
                    dateEnd: this.agentToggleDateEnd_LOC,
                };
            case BillingQueuePage.DATE_FILTER_PREFIX.DOCS_RECD:
                return {
                    presetLink: this.docsRecdPresetLink_LOC,
                    presetOptions: this.docsRecdPresetOptions_LOC,
                    dateStart: this.docsRecdDateStart_LOC,
                    dateEnd: this.docsRecdDateEnd_LOC,
                };
            default:
                throw new Error(`Unknown Billing Queue date filter prefix: ${datePrefix}`);
        }
    }

    /**
     * Opens Presets for a date filter block and selects the preset label (e.g. Last Week).
     * @author AI Agent
     * @created 2026-06-03
     * @returns Saved start/end date strings from the datepicker inputs
     */
    async selectDateFilterPreset(
        datePrefix: string,
        presetLabel: string
    ): Promise<{ start: string; end: string }> {
        const { presetLink, presetOptions, dateStart, dateEnd } = this.resolveDateFilterLocators(datePrefix);

        await presetLink.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await presetLink.hover();
        await presetLink.click();

        const presetOption = presetOptions.filter({ hasText: new RegExp(`^${presetLabel}$`, "i") }).first();
        await presetOption.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await presetOption.click();
        await commonReusables.waitForPageStable(this.page);

        const start = ((await dateStart.inputValue()) || "").trim();
        const end = ((await dateEnd.inputValue()) || "").trim();
        console.log(`Date filter ${datePrefix}: preset=${presetLabel}, start=${start}, end=${end}`);
        return { start, end };
    }

    /**
     * True if a date filter block is available on the page (start datepicker visible).
     * Initial Toggle: `#search_initialbillingtoggle_datestart`
     * Agent Toggle: `#search_agenttobillingtoggle_datestart`
     * Locator source: ReportFilterManager.php showFilterDate (~3090).
     * @author AI Agent
     * @created 2026-06-03
     */
    async isFilterDateLabelVisible(filterLabel: string): Promise<boolean> {
        const dateStart =
            filterLabel === BILLING_QUEUE_FILTER_LABELS.INITIAL_TOGGLE
                ? this.initialToggleDateStart_LOC
                : filterLabel === BILLING_QUEUE_FILTER_LABELS.AGENT_TOGGLE
                  ? this.agentToggleDateStart_LOC
                  : null;
        if (!dateStart) {
            throw new Error(`Unknown Billing Queue date filter label: ${filterLabel}`);
        }
        try {
            await dateStart.scrollIntoViewIfNeeded();
        } catch {
            return false;
        }
        return dateStart.isVisible();
    }

    /**
     * Clicks Search on the Billing Queue report.
     * @author AI Agent
     * @created 2026-06-03
     */
    async clickSearch(): Promise<void> {
        await this.searchButton_LOC.scrollIntoViewIfNeeded();
        await this.searchButton_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.searchButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
     * Count of data rows in the results grid.
     * @author AI Agent
     * @created 2026-06-03
     */
    async getResultsRowCount(): Promise<number> {
        await this.resultsTable_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        return await this.resultsDataRows_LOC.count();
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
     * Resolves a column index (0-based) from UI column label(s); supports alternate header names.
     * @author AI Agent
     * @created 2026-06-03
     * @param columnLabels - Exact on-screen labels (e.g. BILLING_QUEUE_COLUMNS.INITIAL_TOGGLE_DATE)
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
     * Reads non-empty cell values for a column identified by header label(s).
     * @author AI Agent
     * @created 2026-06-03
     * @param columnLabels - Exact on-screen labels (e.g. BILLING_QUEUE_COLUMNS.INITIAL_TOGGLE_DATE)
     */
    async getColumnCellValues(columnLabels: string[]): Promise<string[]> {
        const colIdx = await this.getColumnIndex(columnLabels);
        const columnHeader = this.normalizeReportHeader(await this.tableHeaders_LOC.nth(colIdx).innerText());
        console.log(
            `Billing Queue column found: "${columnHeader}" (index ${colIdx}, labels: ${columnLabels.join(", ")})`
        );

        const rowCount = await this.getResultsRowCount();
        const values: string[] = [];
        for (let r = 0; r < rowCount; r++) {
            const cell = this.resultsDataRows_LOC.nth(r).locator("td").nth(colIdx);
            const text = ((await cell.innerText()) || "")
                .replace(REGEX_PATTERNS.TEXT.WHITESPACE_RUNS, " ")
                .trim();
            if (text) {
                values.push(text);
            }
        }
        return values;
    }

    /**
     * Parses mm/dd/yyyy or mm/dd/yyyy hh:mm:ss into a Date (local).
     * @author AI Agent
     * @created 2026-06-03
     */
    parseReportDate(value: string): Date | null {
        const trimmed = value.trim();
        if (!trimmed || trimmed.toUpperCase() === TOGGLE_DATE_DISPLAY.NOT_APPLICABLE) {
            return null;
        }
        const match = trimmed.match(REGEX_PATTERNS.DATE.US_REPORT_DATETIME);
        if (!match) {
            return null;
        }
        const [, mm, dd, yyyy, hh = "0", min = "0", sec = "0"] = match;
        return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), Number(sec));
    }

    /**
     * Parses mm/dd/yyyy datepicker input to start-of-day Date.
     * @author AI Agent
     * @created 2026-06-03
     */
    parseFilterDateInput(value: string, endOfDay = false): Date | null {
        const match = value.trim().match(REGEX_PATTERNS.DATE.US_FILTER_DATE);
        if (!match) {
            return null;
        }
        const [, mm, dd, yyyy] = match;
        if (endOfDay) {
            return new Date(Number(yyyy), Number(mm) - 1, Number(dd), 23, 59, 59);
        }
        return new Date(Number(yyyy), Number(mm) - 1, Number(dd), 0, 0, 0);
    }

    /**
     * Asserts every populated cell in the column falls within the saved filter date range.
     * @author AI Agent
     * @created 2026-06-03
     */
    async expectColumnDatesWithinRange(
        columnLabels: string[],
        rangeStart: string,
        rangeEnd: string
    ): Promise<void> {
        const rangeStartDate = this.parseFilterDateInput(rangeStart, false);
        const rangeEndDate = this.parseFilterDateInput(rangeEnd, true);
        expect(rangeStartDate, "Filter start date should be parseable").not.toBeNull();
        expect(rangeEndDate, "Filter end date should be parseable").not.toBeNull();

        const cellValues = await this.getColumnCellValues(columnLabels);
        expect(cellValues.length, "Expected at least one row in results").toBeGreaterThan(0);

        for (const cellValue of cellValues) {
            const cellDate = this.parseReportDate(cellValue);
            if (!cellDate) {
                continue;
            }
            expect(
                cellDate.getTime(),
                `Cell date "${cellValue}" should be on/after filter start ${rangeStart}`
            ).toBeGreaterThanOrEqual(rangeStartDate!.getTime());
            expect(
                cellDate.getTime(),
                `Cell date "${cellValue}" should be on/before filter end ${rangeEnd}`
            ).toBeLessThanOrEqual(rangeEndDate!.getTime());
        }
    }
}
