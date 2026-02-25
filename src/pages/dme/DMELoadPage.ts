import { Locator, Page, expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { GlobalConstants } from "@utils/globalConstants";

const { WAIT } = GlobalConstants;

class DMELoadPage {
  private readonly dataTable_LOC: Locator;
  private readonly statusColumnText_LOC: Locator;
  private readonly sourceIdColumnText_LOC: Locator;
  private readonly dataDetailsLink_LOC: Locator;
  private readonly showIconLink_LOC: Locator;
  private readonly auctionAssignedText_LOC: Locator;
  private readonly bidsStatusTableValue_LOC: Locator;
  private readonly bidsStatusDME: Locator;

  constructor(private page: Page) {
    this.dataTable_LOC = page.locator(
      "//*[@class='table datagrid ']//tbody//tr"
    );
    this.statusColumnText_LOC = page.locator(
      "//*[@data-column='status']//span[@title]"
    );
    this.sourceIdColumnText_LOC = page.locator(
      "//*[@data-column='sourceId']//span[@title]"
    );
    this.bidsStatusTableValue_LOC = page.locator(
      `//span[contains(text(),'Bids')]//parent::div//parent::div//following-sibling::div[contains(@id,'content-ea_form_fieldset')]//dt[contains(text(),'Status')]//following-sibling::dd`
    );
    this.dataDetailsLink_LOC = page.locator("//*[@stroke='currentColor']");
    this.showIconLink_LOC = page.locator("//*[text()='Show']");
    this.auctionAssignedText_LOC = page.locator(
      "//*[text()='STATUS_CHANGE > AUCTION_ASSIGNED']"
    );
    this.bidsStatusDME = page.locator(
      "//td[@data-column='vendorStatusesString']//span[text()]"
    );
  }

  DMETableValue(bidsTableValue: string): Locator {
    return this.page.locator(
      `//span[contains(text(),'Bids')]//parent::div//parent::div//following-sibling::div[contains(@id,'content-ea_form_fieldset')]//dd[contains(text(),'${bidsTableValue}')]`
    );
  }
  DMEBidStatusTableValue(bidsStatusTableValue: string): Locator {
    return this.page.locator(
      `//span[contains(text(),'Bids')]//parent::div//parent::div//following-sibling::div[contains(@id,'content-ea_form_fieldset')]//dt[contains(text(),'Status')]//following-sibling::dd[contains(text(),'${bidsStatusTableValue}')]`
    );
  }

  /**
   * @author Deepak Bohra
   * @description This method validates that exactly one table row element is present and shows actual count in assertion
   * @modified 2025-09-07
   */
  async validateSingleTableRowPresent() {
    // Wait for table to be present first to avoid navigation issues
    await this.dataTable_LOC
      .first()
      .waitFor({ state: "visible", timeout: WAIT.SMALL });
    await this.page.waitForLoadState("domcontentloaded");

    // Add a small wait to ensure DOM is stable
    await this.page.waitForTimeout(WAIT.DEFAULT);

    const actualCount = await this.dataTable_LOC.count();
    await expect(this.dataTable_LOC).toBeVisible();
    await expect(
      this.dataTable_LOC,
      `Expected 1 table row element for load posted, but found ${actualCount} elements`
    ).toHaveCount(1);
  }

  /**
   * @author Deepak Bohra
   * @description This method gets the source ID text and validates it against expected value
   * @param expectedSourceId - The expected source ID value to validate against
   * @returns Promise<string> - The actual source ID text content
   * @modified 2025-09-05
   */
  async validateAndGetSourceIdText(expectedSourceId: string): Promise<string> {
    await this.sourceIdColumnText_LOC.waitFor({ state: "visible" });
    const actualSourceId = await this.sourceIdColumnText_LOC.textContent();
    const trimmedSourceId = actualSourceId?.trim() || "";
    await expect(
      this.sourceIdColumnText_LOC,
      `Expected source ID: "${expectedSourceId}", but found: "${trimmedSourceId}"`
    ).toHaveText(expectedSourceId);
    return trimmedSourceId;
  }

  /**
   * @author Deepak Bohra
   * @description This method gets the status column text and validates it against expected value
   * @param expectedStatus - The expected status value to validate against
   * @returns Promise<string> - The actual status text content
   * @modified 2025-09-05
   */
  async validateAndGetStatusText(expectedStatus: string): Promise<string> {
    await this.statusColumnText_LOC.waitFor({ state: "visible" });
    const actualStatus = await this.statusColumnText_LOC.textContent();
    const trimmedStatus = actualStatus?.trim() || "";
    await expect(
      this.statusColumnText_LOC,
      `Expected status: "${expectedStatus}", but found: "${trimmedStatus}"`
    ).toHaveText(expectedStatus);
    return trimmedStatus;
  }

  /**
   * @author Deepak Bohra
   * @description This method validates status with retry logic for slow-changing statuses like MATCHED
   * Checks every second for 30s, then refreshes page and re-searches load, cycles for up to 3 minutes
   * @param expectedStatus - The expected status value to validate against
   * @param loadNumber - The load number to search for during retries
   * @param dmeDashboardPage - The DME dashboard page instance for re-searching loads
   * @returns Promise<string> - The actual status text content
   * @modified 2025-11-04
   */
  async validateAndGetStatusTextWithRetry(
    expectedStatus: string,
    expectedStatusTNX: string,
    loadNumber: string,
    dmeDashboardPage: any
  ): Promise<string> {
    const maxRetryTime = 5 * 60 * 1000; // 2 minutes total
    const checkInterval = 1000; // 1 second between status checks
    const refreshCycle = 5 * 1000; // 30 seconds before refresh
    const startTime = Date.now();

    while (Date.now() - startTime < maxRetryTime) {
      const cycleStartTime = Date.now();

      // Check status every second for 30 seconds
      while (Date.now() - cycleStartTime < refreshCycle) {
        try {
          // Wait for at least one element to be visible
          await this.bidsStatusDME.first().waitFor({
            state: "visible",
            timeout: WAIT.DEFAULT,
          });

          // Get count of matching elements
          const elementCount = await this.bidsStatusDME.count();
          console.log(
            `Found ${elementCount} DME status element(s) using bidsStatusDME locator`
          );

          if (elementCount < 2) {
            throw new Error(
              `Expected at least 2 elements but found only ${elementCount} elements using bidsStatusDME locator`
            );
          }

          // Get text from all elements
          let foundExpectedStatus = false;
          let foundExpectedStatusTNX = false;
          for (let i = 0; i < elementCount; i++) {
            const element = this.bidsStatusDME.nth(i);
            const elementText = await element.textContent();
            const trimmedText = elementText?.trim() || "";
            if (trimmedText === expectedStatus) {
              foundExpectedStatus = true;
            }
            if (trimmedText === expectedStatusTNX) {
              foundExpectedStatusTNX = true;
            }
          }

          if (foundExpectedStatus && foundExpectedStatusTNX) {
            console.log(
              `✅ Status validated successfully: "${expectedStatus}" and "${expectedStatusTNX}" found in elements.`
            );
            return `${expectedStatus},${expectedStatusTNX}`;
          }

          const elapsed = Math.round((Date.now() - startTime) / 1000);
          // Gather actual values from all elements
          const actualValues: string[] = [];
          for (let i = 0; i < elementCount; i++) {
            const element = this.bidsStatusDME.nth(i);
            const elementText = await element.textContent();
            actualValues.push(elementText?.trim() || "");
          }
          console.log(
            `Status: Expected "${expectedStatus}" and "${expectedStatusTNX}" | Actual values: [${actualValues.join(
              ", "
            )}] | Elapsed: ${elapsed}s`
          );

          await this.page.waitForTimeout(checkInterval);
        } catch (error) {
          console.log(`Status check failed, continuing... ${error}`);
          await this.page.waitForTimeout(checkInterval);
        }
      }

      // After 30 seconds, refresh and re-search
      const totalElapsed = Math.round((Date.now() - startTime) / 1000);
      if (Date.now() - startTime < maxRetryTime) {
        console.log(
          `Refreshing page and re-searching load after 30s cycle | Total elapsed: ${totalElapsed}s`
        );

        try {
          await this.refreshAndSearchLoad(loadNumber, dmeDashboardPage);
        } catch (refreshError) {
          console.log(`Refresh and search failed: ${refreshError}`);
          await this.page.waitForTimeout(WAIT.DEFAULT);
        }
      }
    }

    throw new Error(
      `Status "${expectedStatus}" or "${expectedStatusTNX}" not found after ${
        maxRetryTime / 1000
      } seconds of retrying`
    );
  }

  /**
   * @author Deepak Bohra
   * @description Helper method to refresh page and re-search load
   * @private
   */
  private async refreshAndSearchLoad(
    loadNumber: string,
    dmeDashboardPage: any
  ): Promise<void> {
    // Navigate back to loads page or refresh
    await this.page.goBack({ timeout: WAIT.MID });
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(WAIT.DEFAULT);

    // Re-search the load
    console.log(`Re-searching for load: ${loadNumber}`);
    await dmeDashboardPage.searchLoad(loadNumber);
    await this.validateSingleTableRowPresent();
    await this.validateAndGetSourceIdText(loadNumber);
  }

  /**
   * @author Deepak Bohra
   * @description This method clicks on the data details link to view load details
   * @modified 2025-09-07
   */
  async clickOnDataDetailsLink(): Promise<void> {
    await this.dataDetailsLink_LOC.waitFor({
      state: "visible",
      timeout: 10000,
    });
    await expect(this.dataDetailsLink_LOC).toBeVisible();
    await this.dataDetailsLink_LOC.click();
    console.log("✅ Clicked on data details link");
  }

  /**
   * @author Deepak Bohra
   * @description This method clicks on the Show icon link
   * @modified 2025-09-07
   */
  async clickOnShowIconLink(): Promise<void> {
    await this.showIconLink_LOC.waitFor({ state: "visible", timeout: 10000 });
    await expect(this.showIconLink_LOC).toBeVisible();
    await this.showIconLink_LOC.click();
    await this.page.waitForTimeout(WAIT.SMALL);
    console.log("✅ Clicked on Show icon link");
  }

  /**
   * @author Deepak Bohra
   * @description This method validates that the auction assigned status text is present and visible
   * If not found, it will retry by refreshing and searching the load again for up to 2 minutes
   * @param loadNumber - The load number to search for during retries
   * @param dmeDashboardPage - The DME dashboard page instance for re-searching loads
   * @modified 2025-09-07
   */
  async validateAuctionAssignedText(
    loadNumber?: string,
    dmeDashboardPage?: any
  ): Promise<void> {
    const maxRetryTime = 5 * 60 * 1000; // 5 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < maxRetryTime) {
      try {
        return await this.checkAuctionAssignedText();
      } catch (error) {
        const elapsedTime = Date.now() - startTime;
        console.log(
          `Auction assigned text not found. Elapsed: ${Math.round(
            elapsedTime / 1000
          )}s`
        );

        if (elapsedTime < maxRetryTime) {
          console.log("Retrying: Re-searching load...");
          await this.retryLoadSearch(loadNumber, dmeDashboardPage);
        } else {
          throw new Error(
            `Auction assigned status not found after ${
              maxRetryTime / 1000
            }s of retrying`
          );
        }
      }
    }
    throw new Error(
      `Auction assigned status validation failed after ${maxRetryTime / 1000}s`
    );
  }

  /**
   * @author Deepak Bohra
   * @description Helper method to check auction assigned text
   * @private
   */
  private async checkAuctionAssignedText(): Promise<void> {
     // Scroll to the end of the page to bring element into view
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Add a small delay for scroll animation to complete
    await this.page.waitForTimeout(WAIT.SMALL);
    await commonReusables.waitForPageStable(this.page);
    await this.auctionAssignedText_LOC.first().waitFor({
      state: "visible",
      timeout: WAIT.MID,
    });
    const actualText = await this.auctionAssignedText_LOC.first().textContent();
    const trimmedText = actualText?.trim() || "";

    if (trimmedText === "STATUS_CHANGE > AUCTION_ASSIGNED") {
      await expect(this.auctionAssignedText_LOC).toBeVisible();
      await expect(this.auctionAssignedText_LOC).toHaveText(
        "STATUS_CHANGE > AUCTION_ASSIGNED"
      );
      console.log("✅ Auction assigned status text validated successfully");
      return;
    }
    throw new Error(
      `Expected "STATUS_CHANGE > AUCTION_ASSIGNED", found: "${trimmedText}"`
    );
  }

  /**
   * @author Deepak Bohra
   * @description Helper method to retry load search and navigation
   * @private
   */
  private async retryLoadSearch(
    loadNumber?: string,
    dmeDashboardPage?: any
  ): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");

      if (loadNumber && dmeDashboardPage) {
        console.log(`Re-searching for load: ${loadNumber}`);
        await dmeDashboardPage.searchLoad(loadNumber);
        await this.validateSingleTableRowPresent();
        await this.validateAndGetSourceIdText(loadNumber);
        await this.ValidateDMEStatusText(
          LOAD_STATUS.BTMS_REQUESTED,
          LOAD_STATUS.TNX_REQUESTED
        );
      }

      await this.clickOnDataDetailsLink();
      await this.clickOnShowIconLink();
    } catch (retryError) {
      console.log(`Retry navigation failed: ${retryError}`);
      // Fallback: just reload and try basic navigation
      await this.page.reload({ timeout: WAIT.MID });
      await this.page.waitForLoadState("domcontentloaded");
    }
  }

  /**
   * @author Parth Rastogi
   * @description Verifies that a DME load details label contains the expected text
   * @param labelText - The expected text content of the label
   * @returns Promise<boolean> - Returns true if label text matches, throws assertion error if it doesn't
   * @created 2025-10-14
   */
  async verifyDMELoadDetailsLabel(labelText: string): Promise<boolean> {
    try {
      const dmeTableValueLocator = this.DMETableValue(labelText).first();

      // Wait for the element to be visible
      await dmeTableValueLocator.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });

      // Get the actual text content
      const actualText = await dmeTableValueLocator.textContent();
      const trimmedActualText = actualText?.trim() || "";

      // Log the comparison for debugging
      console.log(
        `DME Load Details Label - Expected: "${labelText}", Actual: "${trimmedActualText}"`
      );

      // Assert that the values match
      await expect(
        dmeTableValueLocator,
        `DME Load Details Label mismatch - Expected: "${labelText}", but found: "${trimmedActualText}"`
      ).toHaveText(labelText);

      console.log(
        `✅ DME Load Details Label validation successful: "${trimmedActualText}"`
      );
      return true;
    } catch (error) {
      console.error(
        `❌ DME Load Details Label validation failed for "${labelText}": ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Parth Rastogi
   * @description Verifies that a DME load details label contains the expected text
   * @param labelText - The expected text content of the label
   * @returns Promise<boolean> - Returns true if label text matches, throws assertion error if it doesn't
   * @created 2025-10-28
   */
  async verifyDMEBidStatusDetailsLabel(labelText: string): Promise<boolean> {
    try {
      const dmeTableValueLocator =
        this.DMEBidStatusTableValue(labelText).nth(1);

      // Wait for the element to be visible
      await dmeTableValueLocator.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });

      // Get the actual text content
      const actualText = await dmeTableValueLocator.textContent();
      const trimmedActualText = actualText?.trim() || "";

      // Log the comparison for debugging
      console.log(
        `DME Load Details Label - Expected: "${labelText}", Actual: "${trimmedActualText}"`
      );

      // Assert that the values match
      await expect(
        dmeTableValueLocator,
        `DME Load Details Label mismatch - Expected: "${labelText}", but found: "${trimmedActualText}"`
      ).toHaveText(labelText);

      console.log(
        `✅ DME Load Details Label validation successful: "${trimmedActualText}"`
      );
      return true;
    } catch (error) {
      console.error(
        `❌ DME Load Details Label validation failed for "${labelText}": ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Parth Rastogi
   * @description Checks all bid status elements using bidsStatusTableValue_LOC and fails script if any contains "FAILED" status
   * @returns Promise<boolean> - Returns true if no FAILED status found, throws error if FAILED detected
   * @created 2025-10-28
   */
  async verifyNoBidStatusFailures(): Promise<boolean> {
    try {
      // Wait for at least one element to be visible
      await this.bidsStatusTableValue_LOC.first().waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });

      // Get count of matching elements
      const elementCount = await this.bidsStatusTableValue_LOC.count();
      console.log(
        `Found ${elementCount} bid status element(s) using bidsStatusTableValue_LOC`
      );

      if (elementCount === 0) {
        throw new Error(
          `No bid status elements found using bidsStatusTableValue_LOC`
        );
      }

      // Check each element for FAILED status
      const elementTexts: string[] = [];
      let hasFailedStatus = false;
      let failedElementIndex = -1;

      for (let i = 0; i < elementCount; i++) {
        const element = this.bidsStatusTableValue_LOC.nth(i);
        const elementText = await element.textContent();
        const trimmedText = elementText?.trim() || "";
        elementTexts.push(trimmedText);

        console.log(`Bid Status Element ${i + 1} text: "${trimmedText}"`);

        // Check if this element contains "FAILED" (case-insensitive)
        if (trimmedText.toUpperCase().includes("FAILED")) {
          hasFailedStatus = true;
          failedElementIndex = i + 1;
          console.error(
            ` CRITICAL FAILURE: FAILED status detected in bid status element ${
              i + 1
            }!`
          );
          console.error(` Element text: "${trimmedText}"`);
          console.error(` Element index: ${i + 1}`);
        }
      }

      // If any element has FAILED status, fail the script immediately
      if (hasFailedStatus) {
        console.error(`❌ SCRIPT FAILED DUE TO FAILED BID STATUS`);
        console.error(` Failed element index: ${failedElementIndex}`);
        console.error(` All element texts: [${elementTexts.join(", ")}]`);
        console.error(
          ` This indicates a critical bid processing failure in DME`
        );

        throw new Error(
          `CRITICAL FAILURE: FAILED status detected in DME bid status element ${failedElementIndex}. Element text: "${
            elementTexts[failedElementIndex - 1]
          }". All elements: [${elementTexts.join(", ")}]`
        );
      }

      console.log(
        `✅ Bid status validation successful - No FAILED status found in any of the ${elementCount} element(s)`
      );
      console.log(`✅ All element texts: [${elementTexts.join(", ")}]`);
      return true;
    } catch (error) {
      // Enhanced error logging for FAILED status
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("FAILED status detected")) {
        console.error(`❌ SCRIPT TERMINATION DUE TO BID STATUS FAILURE`);
        console.error(
          ` This indicates a critical system failure in DME bid processing`
        );
      }
      console.error(` Bid status validation failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * @author Parth Rastogi
   * @description This method validates bid status for 2 elements with retry logic for slow-changing statuses
   * Checks every second for 5s, then refreshes page and re-searches load, cycles for up to 5 minutes
   * @param firstExpectedStatus - The expected status value for the first element
   * @param secondExpectedStatus - The expected status value for the second element
   * @param loadNumber - The load number to search for during retries
   * @param dmeDashboardPage - The DME dashboard page instance for re-searching loads
   * @returns Promise<{first: string, second: string}> - The actual status text content for both elements
   * @created 2025-10-31
   */
  async validateBidStatusWithRetry(
    firstExpectedStatus: string,
    secondExpectedStatus: string,
    loadNumber: string,
    dmeDashboardPage: any
  ): Promise<{ first: string; second: string }> {
    const maxRetryTime = 5 * 60 * 1000; // 5 minutes total
    const checkInterval = 1000; // 1 second between status checks
    const refreshCycle = 5 * 1000; // 5 seconds before refresh
    const startTime = Date.now();

    while (Date.now() - startTime < maxRetryTime) {
      const cycleStartTime = Date.now();

      // Check status every second for 5 seconds
      while (Date.now() - cycleStartTime < refreshCycle) {
        try {
          await this.bidsStatusDME.first().waitFor({
            state: "visible",
            timeout: 5000,
          });

          // Get count of matching elements
          const elementCount = await this.bidsStatusDME.count();

          if (elementCount < 2) {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            console.log(
              `Only ${elementCount} elements found, Expected: 2 | Elapsed: ${elapsed}s`
            );
            await this.page.waitForTimeout(checkInterval);
            continue;
          }

          // Get text from both elements
          const firstElement = this.bidsStatusDME.nth(0);
          const secondElement = this.bidsStatusDME.nth(1);

          const firstElementText = await firstElement.textContent();
          const secondElementText = await secondElement.textContent();

          const firstTrimmedStatus = firstElementText?.trim() || "";
          const secondTrimmedStatus = secondElementText?.trim() || "";

          // Check if both statuses match either of the expected values
          const firstStatusMatches =
            firstTrimmedStatus === firstExpectedStatus ||
            firstTrimmedStatus === secondExpectedStatus;
          const secondStatusMatches =
            secondTrimmedStatus === firstExpectedStatus ||
            secondTrimmedStatus === secondExpectedStatus;

          // Ensure both expected values are found (one in each element)
          const hasFirstExpected =
            firstTrimmedStatus === firstExpectedStatus ||
            secondTrimmedStatus === firstExpectedStatus;
          const hasSecondExpected =
            firstTrimmedStatus === secondExpectedStatus ||
            secondTrimmedStatus === secondExpectedStatus;

          if (
            firstStatusMatches &&
            secondStatusMatches &&
            hasFirstExpected &&
            hasSecondExpected
          ) {
            console.log(`✅ Both bid statuses validated successfully:`);
            console.log(
              `   First: "${firstTrimmedStatus}", Second: "${secondTrimmedStatus}"`
            );
            console.log(
              `   Both expected values "${firstExpectedStatus}" and "${secondExpectedStatus}" found`
            );
            return { first: firstTrimmedStatus, second: secondTrimmedStatus };
          }

          const elapsed = Math.round((Date.now() - startTime) / 1000);
          console.log(
            `Bid Status Check | First: "${firstTrimmedStatus}" (Valid: ${firstStatusMatches}), Second: "${secondTrimmedStatus}" (Valid: ${secondStatusMatches}) | Expected: ["${firstExpectedStatus}", "${secondExpectedStatus}"] | Elapsed: ${elapsed}s`
          );

          await this.page.waitForTimeout(checkInterval);
        } catch (error) {
          console.log(`Bid status check failed, continuing... ${error}`);
          await this.page.waitForTimeout(checkInterval);
        }
      }

      // After 5 seconds, refresh and re-search
      const totalElapsed = Math.round((Date.now() - startTime) / 1000);
      if (Date.now() - startTime < maxRetryTime) {
        console.log(
          `Refreshing page and re-searching load after 5s cycle | Total elapsed: ${totalElapsed}s`
        );

        try {
          await this.refreshAndSearchLoad(loadNumber, dmeDashboardPage);
        } catch (refreshError) {
          console.log(`Refresh and search failed: ${refreshError}`);
          await this.page.waitForTimeout(WAIT.DEFAULT);
        }
      }
    }

    throw new Error(
      `Bid statuses "${firstExpectedStatus}" and "${secondExpectedStatus}" not found after ${
        maxRetryTime / 1000
      } seconds of retrying`
    );
  }

  /**
   * @author Parth Rastogi
   * @description Validates DME status text for all elements using bidsStatusDME locator - checks if each element contains either of the expected values
   * @param firstExpectedValue - The first expected text content (can be found in any element)
   * @param secondExpectedValue - The second expected text content (can be found in any element)
   * @returns Promise<boolean> - Returns true if both expected values are found across the elements, throws error if not
   * @created 2025-10-31
   * @modified 2025-11-03 - Updated to use loop iteration through all elements.
   */
  async ValidateDMEStatusText(
    firstExpectedValue: string,
    secondExpectedValue: string
  ): Promise<boolean> {
    try {
      // Wait for at least one element to be visible
      await this.bidsStatusDME.first().waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });

      // Get count of matching elements
      const elementCount = await this.bidsStatusDME.count();
      console.log(
        `Found ${elementCount} DME status element(s) using bidsStatusDME locator`
      );

      if (elementCount === 0) {
        throw new Error(`No elements found using bidsStatusDME locator`);
      }

      // Track which expected values are found and element validation status
      let hasFirstExpectedValue = false;
      let hasSecondExpectedValue = false;
      const validElements: string[] = [];
      const invalidElements: string[] = [];
      const allElementTexts: string[] = [];

      console.log(
        `Expected values: "${firstExpectedValue}" and "${secondExpectedValue}"`
      );

      // Loop through all elements
      for (let i = 0; i < elementCount; i++) {
        const element = this.bidsStatusDME.nth(i);
        const elementText = await element.textContent();
        const trimmedText = elementText?.trim() || "";
        allElementTexts.push(trimmedText);

        console.log(`Element ${i + 1} text: "${trimmedText}"`);

        // Check if this element contains either of the expected values
        const elementMatches =
          trimmedText === firstExpectedValue ||
          trimmedText === secondExpectedValue;

        if (elementMatches) {
          const matchedValue =
            trimmedText === firstExpectedValue
              ? firstExpectedValue
              : secondExpectedValue;
          console.log(
            `✅ Element ${
              i + 1
            } validation successful: "${trimmedText}" matches expected value "${matchedValue}"`
          );
          validElements.push(`Element ${i + 1}: "${trimmedText}"`);

          // Track which expected values we've found
          if (trimmedText === firstExpectedValue) {
            hasFirstExpectedValue = true;
          }
          if (trimmedText === secondExpectedValue) {
            hasSecondExpectedValue = true;
          }
        } else {
          console.error(
            `❌ Element ${
              i + 1
            } validation failed - Found: "${trimmedText}", Expected either: "${firstExpectedValue}" or "${secondExpectedValue}"`
          );
          invalidElements.push(`Element ${i + 1}: "${trimmedText}"`);
        }
      }

      // Check if all elements are valid and both expected values are found
      const allElementsValid = invalidElements.length === 0;
      const bothValuesFound = hasFirstExpectedValue && hasSecondExpectedValue;

      if (allElementsValid && bothValuesFound) {
        console.log(
          `✅ DME Status Text validation successful - All ${elementCount} elements are valid and both expected values found`
        );
        console.log(
          `   "${firstExpectedValue}" and "${secondExpectedValue}" are present in the elements`
        );
        console.log(`✅ Valid elements: [${validElements.join(", ")}]`);
        return true;
      } else {
        let errorMessage = `DME Status Text validation failed. `;
        if (invalidElements.length > 0) {
          errorMessage += `${invalidElements.length} invalid element(s) found. `;
        }
        if (!hasFirstExpectedValue) {
          errorMessage += `Expected value "${firstExpectedValue}" not found in any element. `;
        }
        if (!hasSecondExpectedValue) {
          errorMessage += `Expected value "${secondExpectedValue}" not found in any element. `;
        }
        errorMessage += `All elements: [${allElementTexts.join(", ")}]`;
        if (invalidElements.length > 0) {
          errorMessage += `. Invalid elements: [${invalidElements.join(", ")}]`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ ValidateDMEStatusText failed: ${errorMessage}`);
      throw error;
    }
  }
}
export default DMELoadPage;
