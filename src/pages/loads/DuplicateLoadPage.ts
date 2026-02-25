/**
 * EditLoadCarrierTabPage - Page Object Model for Carrier Tab in Edit Load Page
 *
 * @description This class handles all interactions with the Carrier tab elements
 * in the Edit Load page, including equipment type selection, cargo value management,
 * and trailer length configuration.
 *
 * @author Deepak Bohra
 */

import { Locator, Page } from "@playwright/test";

class DuplicateLoadPage {
  private readonly duplicate_Button_LOC: Locator;
  private readonly duplicateIconCheckBox_LOC: (text: string) => Locator;
  private readonly OK_BUTTON_LOC: Locator;
  private readonly duplicateHeaderText_LOC: Locator;

  /**
   * Constructor to initialize page locators for Carrier tab elements
   * @param page - Playwright Page instance for web interactions
   * @author Deepak Bohra
   */
  constructor(private page: Page) {
    this.duplicate_Button_LOC = page.locator(
      "//td[contains(text(),'View Load')]//parent::tr//div//input[contains(@value,'Duplicate')]"
    );
    // Updated locator to target the actual checkbox input elements
    this.duplicateIconCheckBox_LOC = (checkBoxText: string) =>
      page.locator(`//h4[text()='${checkBoxText}']`);
    this.OK_BUTTON_LOC = page.locator("button#form_submit");
    this.duplicateHeaderText_LOC = page.locator(
      "//h1[contains(text(),'Duplicate Load')]"
    );
  }

  /**
   * Click on Choose Carrier details
   * @author Deepak Singh Bohra
   * @modified 2025-09-19
   */

  async clickOnDuplicateButton() {
    await this.duplicate_Button_LOC.waitFor({ state: "visible" });
    await this.duplicate_Button_LOC.click();
  }

  /**
   * Enters enter Carrier Rate details
   * @author Deepak Singh Bohra
   * @modified 2025-09-19
   */

  async clickOnCheckBox(checkBoxText: string) {
    await this.duplicateIconCheckBox_LOC(checkBoxText).waitFor({
      state: "visible",
    });
    await this.duplicateIconCheckBox_LOC(checkBoxText).click();
  }

  /**
   * Selects multiple duplicate options by clicking on the text names
   * @param duplicateOptions - String containing comma-separated values or array of option names
   * @author Deepak Singh Bohra
   * @created 2025-09-19
   * @example
   * await selectDuplicateIconCheckBox("Vendor Info,Carrier Info,Stop Info")
   * await selectDuplicateIconCheckBox(["Vendor Info", "Carrier Info", "Stop Info"])
   */
  async selectDuplicateIconCheckBox(duplicateOptions: string | string[]) {
    await this.duplicateHeaderText_LOC.waitFor({
      state: "visible",
      timeout: WAIT.MID,
    });
    let optionsArray: string[];

    // Handle both string and array inputs
    if (typeof duplicateOptions === "string") {
      // Split by comma and trim whitespace
      optionsArray = duplicateOptions.split(",").map((option) => option.trim());
    } else {
      optionsArray = duplicateOptions;
    }
    console.log(`Clicking on duplicate options: ${optionsArray.join(", ")}`);

    // Click on each option text one by one
    for (const option of optionsArray) {
      try {
        console.log(`Clicking on option: ${option}`);

        // Wait for the text element to be visible and click it
        await this.duplicateIconCheckBox_LOC(option).waitFor({
          state: "visible",
          timeout: WAIT.MID,
        });

        await this.duplicateIconCheckBox_LOC(option).click();
        console.log(`✅ Successfully clicked on: ${option}`);

        // Wait a bit between clicks to avoid issues
        await this.page.waitForTimeout(WAIT.DEFAULT);
      } catch (error) {
        console.error(`❌ Error clicking on option '${option}':`, error);
      }
    }
  }

  /**
   * @author Deepak Bohra
   * @description This method handles clicking the Create Load button
   * @modified 2025-09-22
   */
  async clickOkButton() {
    try {
      // First scroll to the bottom of the page
      await this.page.evaluate(() =>
        window.scrollTo(0, document.body.scrollHeight)
      );
      // Then scroll the button into view
      await this.OK_BUTTON_LOC.scrollIntoViewIfNeeded();
      // Wait for the button to be visible
      await this.OK_BUTTON_LOC.waitFor({ state: "visible" });
      // Click the button
      await this.page.waitForTimeout(WAIT.DEFAULT);
      await this.OK_BUTTON_LOC.click();
    } catch (error) {
      console.error("Error clicking Create Load button:", error);
      throw error;
    }
  }
}

export default DuplicateLoadPage;
