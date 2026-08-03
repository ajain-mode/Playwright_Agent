import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

/**
 * BTMS Home → Reports page and Special-Access report grids (e.g. LOSLSAM).
 * Locator source: reports.php, report_sizzle.phtml (#example_wrapper table#example).
 * @author AI Agent
 * @created 2026-08-03
 */
export default class HomeReportsPage {
  private readonly searchButton_LOC: Locator;
  private readonly resultsTable_LOC: Locator;
  private readonly tableHeaders_LOC: Locator;
  private readonly dispatchRegionFilterLabel_LOC: Locator;
  private readonly dispatchRegionMultiselect_LOC: Locator;

  constructor(private page: Page) {
    this.searchButton_LOC = this.page.getByRole("button", { name: /^Search$/i });
    this.resultsTable_LOC = this.page.locator("#example_wrapper table#example");
    this.tableHeaders_LOC = this.resultsTable_LOC.locator("thead > tr > th");
    this.dispatchRegionFilterLabel_LOC = this.page.getByText("Dispatch Region", {
      exact: true,
    });
    this.dispatchRegionMultiselect_LOC = this.page.locator("#dispatch_region_magic");
  }

  /**
   * Opens Home → Reports (reports.php).
   * @author AI Agent
   * @created 2026-08-03
   */
  async openReportsFromHome(): Promise<void> {
    await this.page.getByRole("button", { name: /^Home$/i }).hover();
    await this.page.getByRole("link", { name: /^Reports$/i }).first().click();
    await commonReusables.waitForPageStable(this.page);
  }

  /**
   * Clicks a Special-Access / Principal report link by visible name.
   * @author AI Agent
   * @created 2026-08-03
   * @param reportName - Link text, e.g. Load Summary by Account Manager
   */
  async openReportByName(reportName: string): Promise<void> {
    await this.page.getByRole("link", { name: reportName, exact: false }).first().click();
    await commonReusables.waitForPageStable(this.page);
  }

  /**
   * Asserts the Dispatch Region filter control is visible on the report filter panel.
   * Locator source: reports.php filter — label + #dispatch_region_magic
   * @author AI Agent
   * @created 2026-08-03
   */
  async assertDispatchRegionFilterVisible(): Promise<void> {
    await expect(this.dispatchRegionFilterLabel_LOC.first()).toBeVisible({
      timeout: WAIT.LARGE,
    });
    await expect(this.dispatchRegionMultiselect_LOC).toBeVisible({
      timeout: WAIT.LARGE,
    });
  }

  /**
   * Clicks Search on the open report filter form.
   * @author AI Agent
   * @created 2026-08-03
   */
  async clickSearch(): Promise<void> {
    await this.searchButton_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
    await this.searchButton_LOC.click();
    await commonReusables.waitForPageStable(this.page);
  }

  /**
   * Returns normalized result-grid column header labels.
   * Locator source: report_sizzle.phtml — #example_wrapper table#example thead
   * @author AI Agent
   * @created 2026-08-03
   * @returns Header label strings
   */
  async getResultColumnHeaders(): Promise<string[]> {
    await this.resultsTable_LOC.waitFor({ state: "visible", timeout: WAIT.XXLARGE });
    const raw = await this.tableHeaders_LOC.allTextContents();
    return raw.map((h) => h.replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  /**
   * Asserts a result-grid column header is present (case-insensitive).
   * @author AI Agent
   * @created 2026-08-03
   * @param columnLabel - Expected header, e.g. DISPATCH REGION
   */
  async assertResultColumnPresent(columnLabel: string): Promise<void> {
    const headers = await this.getResultColumnHeaders();
    const found = headers.some(
      (h) => h.toLowerCase() === columnLabel.toLowerCase(),
    );
    expect(
      found,
      `Expected column "${columnLabel}" in headers: ${headers.join(", ")}`,
    ).toBe(true);
  }
}
