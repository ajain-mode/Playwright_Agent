/**
 * MyLoadTemplateSearchPage - Page object model for View Template Page
 * @description This class is used for view template page operations
 * @author Parth Rastogi
 */

import { Locator, Page } from "@playwright/test";

class EditTemplatePage {

  private readonly deadlineDatePickTabValue_LOC: Locator;
  private readonly deadlineTimePickTabValue_LOC: Locator;
  private readonly actualTimePickTabValue_LOC: Locator;
  private readonly actualDatePickTabValue_LOC: Locator;
  private readonly actualTimeDropTabInput_LOC: Locator;
  private readonly actualDateDropTabInput_LOC: Locator;
  private readonly deadlineDateDropTabInput_LOC: Locator;
  private readonly deadlineTimeDropTabInput_LOC: Locator;
  private readonly saveButton_LOC: Locator;
  
  constructor(private page: Page) {

    this.actualTimePickTabValue_LOC = page.locator("#carr_1_stop_1_time");
    this.actualDatePickTabValue_LOC = page.locator("#carr_1_stop_1_date_a");
    this.deadlineDatePickTabValue_LOC = page.locator("#carr_1_stop_1_date2_a");
    this.deadlineTimePickTabValue_LOC = page.locator("#carr_1_stop_1_time2");
    this.actualDateDropTabInput_LOC = page.locator("#carr_1_stop_2_date_a");
    this.actualTimeDropTabInput_LOC = page.locator("#carr_1_stop_2_time");
    this.deadlineDateDropTabInput_LOC = page.locator("#carr_1_stop_2_date2_a");
    this.deadlineTimeDropTabInput_LOC = page.locator("#carr_1_stop_2_time2");
    this.saveButton_LOC = page.locator("#saveButton");
  }
  headerButton(headerBtnText: string): Locator {
    return this.page.locator(`//td[contains(text(),'View Template')]//following-sibling::td//input[normalize-space(@value)='${headerBtnText}']`);
  }
   viewTemplateTabs(tabOption: string): Locator {
    return this.page.locator(`//a[text()='${tabOption}']`);
  }

  async clickHeaderButton(headerBtnText: string) {
    await this.page.waitForLoadState('networkidle');
    await this.headerButton(headerBtnText).waitFor({ state: "visible", timeout: WAIT.DEFAULT });
    await this.headerButton(headerBtnText).click();
  }

  async clickViewTemplateTabs(tabOption: string) {
    await this.page.waitForLoadState('networkidle');
    await this.viewTemplateTabs(tabOption).waitFor({ state: "visible" });
    await this.viewTemplateTabs(tabOption).click();
  }

  /**
   * Enters actual pickup time value
   * @author Parth Rastogi
   * @modified 2025-09-25
   */ 
  async enterActualPickDateValue(pickDate: string | number) {
    await this.actualDatePickTabValue_LOC.waitFor({ state: "visible" });
    await this.actualDatePickTabValue_LOC.fill(String(pickDate));
  }

   /**
   * Enters actual pickup time value
   * @author Parth Rastogi
   * @modified 2025-07-28
   */
  async enterActualPickTimeValue(pickTime: string) {
    await this.actualTimePickTabValue_LOC.waitFor({ state: "visible" });
    await this.actualTimePickTabValue_LOC.fill(String(pickTime));
  }
   /**
   * Enters deadline date value using tomorrow's date from common utilities
   * @author Parth Rastogi
   * @modified 2025-07-28
   */
  async enterDeadlineDateValue(deadlineTime: string | number) {
    await this.deadlineDatePickTabValue_LOC.waitFor({ state: "visible" });
    await this.deadlineDatePickTabValue_LOC.fill(String(deadlineTime));
  }
   /**
   * Enters deadline time value for pickup
   * @author Parth Rastogi
   * @modified 2025-07-28
   */
  async enterDeadlineTimeValue(pickTime: string) {
    await this.deadlineTimePickTabValue_LOC.waitFor({ state: "visible" });
    await this.deadlineTimePickTabValue_LOC.fill(String(pickTime));
  }

  /**
   * Enters the actual drop-off time value
   * @author Parth Rastogi
   * @modified 2025-09-25
   */
  async enterActualDropTimeValue(dropTime: string) {
    await this.actualTimeDropTabInput_LOC.waitFor({ state: "visible" });
    await this.actualTimeDropTabInput_LOC.fill(String(dropTime));
  }

  /**
   * Enters the actual drop-off date value using day after tomorrow's date
   * @author Parth Rastogi
   * @modified 2025-09-25
   */
  async enterActualDropDateValue(pickDate: string | number) {
    await this.actualDateDropTabInput_LOC.waitFor({ state: "visible" });
    await this.actualDateDropTabInput_LOC.fill(String(pickDate));
  }
    

  /**
   * Enters the deadline date value using day after tomorrow's date
   * @author Parth Rastogi
   * @modified 2025-09-25
   */
  async enterDeadlineDropDateValue(deadlineDate: string | number) {
    await this.deadlineDateDropTabInput_LOC.waitFor({ state: "visible" });
    await this.deadlineDateDropTabInput_LOC.fill(String(deadlineDate));
  }
  /**
   * Enters the deadline time value for drop-off
   * @author Parth Rastogi
   * @modified 2025-09-25
   */
  async enterDeadlineDropTimeValue(dropTime: string) {
    await this.deadlineTimeDropTabInput_LOC.waitFor({ state: "visible" });
    await this.deadlineTimeDropTabInput_LOC.fill(String(dropTime));
  }

   /**
   * Enters complete Pick tab details including shipper selection, dates, times, and commodity information
   * @author Parth Rastogi
   * @created 2025-07-30
   */
  async enterCompletePickTabDetails(
    earliestDate: string | number,
    earliestTime: string,
    latestDate: string | number,
    latestTime: string,
  ) {
    await this.enterActualPickDateValue(earliestDate);
    await this.enterActualPickTimeValue(earliestTime);
    await this.enterDeadlineDateValue(latestDate);
    await this.enterDeadlineTimeValue(latestTime);
  }

    /**
   * Enters complete Pick tab details including shipper selection, dates, times, and commodity information
   * @author Parth Rastogi
   * @created 2025-09-25
   */
  async enterCompleteDropTabDetails(
    earliestDate: string | number,
    earliestTime: string,
    latestDate: string | number,
    latestTime: string,
  ) {
    await this.enterActualDropDateValue(earliestDate);
    await this.enterActualDropTimeValue(earliestTime);
    await this.enterDeadlineDropDateValue(latestDate);
    await this.enterDeadlineDropTimeValue(latestTime);
  }

   /**
   * Click on Save Button
   * @author Parth Rastogi
   * @created : 2025-09-23
   */
  async clickOnSaveBtn() {
    await this.saveButton_LOC.nth(0).waitFor({ state: "visible" });
    try {
      await this.saveButton_LOC.nth(0).click();
    } catch (error) {
      console.log("Standard click failed, trying JavaScript click...");
      await this.saveButton_LOC.nth(0).evaluate((element: HTMLElement) => element.click());
    }
  }

}

export default EditTemplatePage;
