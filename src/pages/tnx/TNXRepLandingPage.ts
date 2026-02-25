import { Locator, Page, expect } from "@playwright/test";
import { DFBIncludeCarriersDataModalWaterfall } from "@pages/loads/DFBIncludeCarriersDataModalWaterfall";
import commonReusables from "@utils/commonReusables";

/**
 * Author name: Parth Rastogi
 */
class TNXRepLandingPage {
  private readonly orgSelectorDropdown_LOC: Locator;
  private readonly skipButton_LOC: Locator;
  private readonly loadIdFilterValue_LOC: Locator;
  private readonly tnxRepCarrierNameText_LOC: Locator;
  private readonly tnxRepOfferRateText_LOC: Locator;
  private readonly selectLoadRow_LOC: Locator;
  private readonly nonIncludedCarrierOfferRate_LOC: Locator;
  private readonly nonIncludedCarrierName_LOC: Locator;
  private readonly carrierDetailsTable_LOC: Locator;
  private readonly carrierSearchField_LOC: Locator;
  private readonly searchedCarrierNameText_LOC: Locator;
  private readonly nonIncludedCarrierRowNameText_LOC: Locator;
  private readonly noCarrierText_LOC: Locator;
  private readonly noResultsText_LOC: Locator;
  private readonly bidAmountInput_LOC: Locator;
  private readonly tnxElementByText_LOC: (text: string) => Locator;
  private readonly carrierRowTable_LOC: (loadIndex: number) => Locator;

  constructor(private page: Page) {
    this.tnxElementByText_LOC = (text: string) =>
      page.locator(`//*[text()='${text}']`);
    this.carrierRowTable_LOC = (loadIndex: number) =>
      page.locator(
        "//div[contains(@class,'DataTable') and @role='row'][" + loadIndex + "]"
      );
    this.skipButton_LOC = page.locator(
      "//*[@data-testid='e2e-rep-app-onboarding-process']//*[text()='Skip']"
    );
    this.orgSelectorDropdown_LOC = page.locator(
      "//select[@data-testid='orgSelector']"
    );
    this.loadIdFilterValue_LOC = page.locator(
      "//input[@data-testid='loadId-column-filter']"
    );
    // this.tnxRepCarrierNameText_LOC = page.locator(
    //   "//div[@class='Level__level-left___k_HJ3']//p[contains(text(),'')]"
    // );

    this.selectLoadRow_LOC = page.locator(
      "//div[contains(@class,'DataTable') and @role='row']"
    );

    this.tnxRepCarrierNameText_LOC = page.locator(
      "//p[contains(text(),'Offered to')]//following-sibling::div//p[contains(text(),'')]"
    );
    this.tnxRepOfferRateText_LOC = page.locator(
      "(//div[@data-testid='e2e-current-offer-price']//p[contains(text(),'')][1])"
    );
    this.carrierDetailsTable_LOC = page.locator(
      "//p[contains(text(),'carriers')]"
    );
    this.carrierSearchField_LOC = page.locator(
      "//input[@data-testid='search-bar-text-input']"
    );
    this.searchedCarrierNameText_LOC = page.locator(
      "//*[@data-testid='suggestion-td1']"
    );
    this.nonIncludedCarrierOfferRate_LOC = page.locator(
      "(//*[@data-testid='offer-list-table']//p)[2]"
    );
    this.nonIncludedCarrierName_LOC = page.locator(
      "(//*[@data-testid='offer-list-table']//p)[1]"
    );
    this.nonIncludedCarrierRowNameText_LOC = page.locator("//*[text()='Spot']");
    this.noCarrierText_LOC = page.locator(
      "//*[contains(text(),'No carrier received')]"
    );
    this.bidAmountInput_LOC = page.locator("//input[@name='bidAmount']");
    this.noResultsText_LOC = page.locator(
      "//h1[text()='There are no results']"
    );
  }

  /**
   * @description Handle optional Skip button in onboarding process - click if present, ignore if not
   * @author Parth Rastogi
   * @created 2025-11-10
   */
  async handleOptionalSkipButton(): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForLoadState("load");

      const skipButton = this.skipButton_LOC;
      const isSkipButtonVisible = await skipButton
        .isVisible({ timeout: WAIT.DEFAULT })
        .catch(() => false);

      if (isSkipButtonVisible) {
        await skipButton.click();
        console.log(`✅ Skip button found and clicked successfully`);
        await this.page.waitForLoadState("domcontentloaded");
      } else {
        console.log(`Skip button not present - proceeding with next step`);
      }
    } catch (error) {
      console.log(
        ` Skip button handling completed (may not have been present): ${error}`
      );
    }
  }

  /**
   * @description Enter Load ID filter value in the Load ID filter input field
   * @author Parth Rastogi
   * @created 2025-11-10
   * @param loadId - The Load ID filter value to enter
   */
  async enterLoadIdFilterValue(loadId: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.loadIdFilterValue_LOC.waitFor({ state: "visible" });
      await this.loadIdFilterValue_LOC.clear();
      await this.page.waitForTimeout(WAIT.DEFAULT);
      await this.loadIdFilterValue_LOC.fill(loadId);
      await this.page.waitForTimeout(WAIT.SMALL);
      console.log(`✅ Successfully entered Load ID filter value: ${loadId}`);
    } catch (error) {
      console.error(
        `❌ Failed to enter Load ID filter value '${loadId}': ${error}`
      );
      throw error;
    }
  }
  /**
   * @description Select organization from dropdown by visible text
   * @author Parth Rastogi
   * @created 2025-11-11
   */
  async selectOrganizationByText(orgText: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForLoadState("load");
      await this.orgSelectorDropdown_LOC.waitFor({ state: "visible" });
      await this.orgSelectorDropdown_LOC.selectOption({ label: orgText });
      await this.page.waitForTimeout(WAIT.DEFAULT); // Wait for 3 seconds to ensure the page updates
      const dropdownHandle = await this.orgSelectorDropdown_LOC.elementHandle();
      if (dropdownHandle) {
        await dropdownHandle.scrollIntoViewIfNeeded();
      }
      console.log(`✅ Selected organization: ${orgText}`);
    } catch (error) {
      console.error(`❌ Failed to select organization: ${error}`);
      throw error;
    }
  }

  /**
   * @description Validates and clicks on load rows based on totalCarrierCount from ViewLoadPage
   * @author Parth Rastogi
   * @created 2025-11-12
   * @modified 2025-11-12 - Added loadId parameter, carrier names, and offer rates validation
   * @param viewLoadPageOrCount - Instance of ViewLoadPage to get totalCarrierCount OR direct carrier count number
   * @param loadId - Load ID to filter by after each page refresh (optional)
   * @param expectedCarrierNames - Array of expected carrier names to validate against (optional)
   * @param expectedOfferRates - Array of expected offer rates to validate against (optional)
   * @returns Promise<void>
   * @throws Error if load rows are not found after retry attempts
   */
  async validateLoadRowsBasedOnCarrierCount(
    viewLoadPageOrCount: DFBIncludeCarriersDataModalWaterfall | number,
    loadId?: string,
    expectedCarrierNames?: string[],
    expectedOfferRates?: string[]
  ): Promise<void> {
    try {
      console.log(
        ` Starting validation of load rows based on carrier count...`
      );

      // Get the total carrier count either from ViewLoadPage instance or direct number
      let totalCarrierCount: number;

      if (typeof viewLoadPageOrCount === "number") {
        totalCarrierCount = viewLoadPageOrCount;
        console.log(` Using provided carrier count: ${totalCarrierCount}`);
      } else {
        totalCarrierCount = await viewLoadPageOrCount.getTotalCarrierCount();
        console.log(
          ` Retrieved carrier count from ViewLoadPage: ${totalCarrierCount}`
        );
      }

      if (totalCarrierCount === 0) {
        console.log(` No carriers found, skipping load row validation`);
        return;
      }

      const maxAttempts = 20; // 20 attempts
      const retryDelay = 10000; // 10 seconds

      // Process each row based on carrier count
      for (let rowIndex = 0; rowIndex < totalCarrierCount; rowIndex++) {
        const currentRowNumber = rowIndex + 1;
        console.log(
          `\n Processing load row ${currentRowNumber}/${totalCarrierCount}...`
        );

        let rowFound = false;

        // Try to find and click the current row
        for (let attempt = 1; attempt <= maxAttempts && !rowFound; attempt++) {
          console.log(
            ` Row ${currentRowNumber} - Attempt ${attempt}/${maxAttempts}: Looking for load row...`
          );

          try {
            await this.page.waitForLoadState("domcontentloaded");
            await this.page.waitForLoadState("load");

            // If loadId is provided and this is not the first attempt, re-enter the load ID filter
            if (loadId && attempt > 1) {
              console.log(` Re-entering Load ID filter: ${loadId}`);
              await this.enterLoadIdFilterValue(loadId);
            }

            // Check if we have enough rows available
            const availableRows = await this.selectLoadRow_LOC.count();
            console.log(` Available rows on page: ${availableRows}`);

            // Wait for the expected number of rows based on current iteration
            // First iteration needs 1 row, second needs 2 rows, third needs 3 rows, etc.
            const expectedRowsForThisIteration = currentRowNumber;

            if (availableRows >= expectedRowsForThisIteration) {
              console.log(
                `✅ Expected ${expectedRowsForThisIteration} row(s) available, found ${availableRows} - proceeding`
              );

              // Enhanced 'Contracted' text validation with retry logic for the specific first row
              // Third carrier and beyond may take longer to load "Contracted" status
              const isThirdCarrierOrLater = currentRowNumber >= 3;
              const contractedTimeout = isThirdCarrierOrLater
                ? WAIT.MID
                : WAIT.SMALL; // 15s for 3rd+ carrier, 10s for others
              const maxContractedRetries = isThirdCarrierOrLater ? 5 : 3;

              let contractedFound = false;
              let targetRow = this.selectLoadRow_LOC.first(); // Initialize target row

              for (
                let contractedAttempt = 1;
                contractedAttempt <= maxContractedRetries;
                contractedAttempt++
              ) {
                console.log(
                  `Contracted check attempt ${contractedAttempt}/${maxContractedRetries} for row ${currentRowNumber}${isThirdCarrierOrLater
                    ? " (Extended timeout for 3rd+ carrier)"
                    : ""
                  }`
                );

                try {
                  // Check if 'Contracted' text is visible specifically within the target row
                  const contractedTextInRow = targetRow.locator(
                    "//p[text()='Contracted']"
                  );
                  const isContractedTextVisible =
                    await contractedTextInRow.isVisible({
                      timeout: contractedTimeout,
                    });

                  if (isContractedTextVisible) {
                    console.log(
                      `✅ 'Contracted' text found in first row for iteration ${currentRowNumber} on attempt ${contractedAttempt}`
                    );
                    contractedFound = true;
                    break;
                  } else {
                    console.log(
                      `❌ 'Contracted' text not visible in first row on attempt ${contractedAttempt} for row ${currentRowNumber}`
                    );
                  }
                } catch (contractedError) {
                  console.log(
                    `❌ 'Contracted' check error on attempt ${contractedAttempt} for row ${currentRowNumber}: ${contractedError}`
                  );
                }

                if (contractedAttempt < maxContractedRetries) {
                  console.log(
                    `Waiting and retrying 'Contracted' check for row ${currentRowNumber} (attempt ${contractedAttempt + 1
                    }/${maxContractedRetries})...`
                  );
                  await this.page.waitForTimeout(
                    isThirdCarrierOrLater ? WAIT.DEFAULT : WAIT.SMALL / 5
                  ); // Extra wait for 3rd+ carrier

                  // Refresh page if we're on the last few attempts
                  if (contractedAttempt >= maxContractedRetries - 1) {
                    console.log(
                      `Refreshing page before final 'Contracted' check attempt for row ${currentRowNumber}...`
                    );
                    await this.page.reload();
                    await this.page.waitForLoadState("domcontentloaded");
                    await this.page.waitForLoadState("load");

                    // Re-enter load ID filter after refresh if provided
                    if (loadId) {
                      console.log(
                        `Re-entering Load ID filter after refresh: ${loadId}`
                      );
                      await this.enterLoadIdFilterValue(loadId);
                    }

                    // Wait for rows to appear again after refresh
                    await this.page.waitForTimeout(WAIT.DEFAULT);
                    // Update target row reference after page refresh
                    targetRow = this.selectLoadRow_LOC.first();
                  }
                }
              }

              if (!contractedFound) {
                console.log(
                  `❌ 'Contracted' text not found for row ${currentRowNumber} after ${maxContractedRetries} attempts - continuing to next attempt...`
                );
                continue; // Continue to next attempt to check for rows and contracted text again
              }

              console.log(
                `✅ 'Contracted' text is confirmed visible for row ${currentRowNumber} - proceeding to click`
              );

              // Use the same targetRow that was validated for 'Contracted' text
              await targetRow.waitFor({
                state: "visible",
                timeout: WAIT.DEFAULT,
              });

              const isRowVisible = await targetRow.isVisible();
              if (isRowVisible) {
                await targetRow.click();
                console.log(
                  `✅ Successfully clicked on first load row (iteration ${currentRowNumber}/${totalCarrierCount}) - latest row always appears first`
                );

                // Wait for page to load after clicking the row
                await this.page.waitForLoadState("domcontentloaded");
                await this.page.waitForTimeout(WAIT.DEFAULT); // Wait for elements to be visible

                // Validate carrier name match if expected carrier names are provided
                if (expectedCarrierNames && expectedCarrierNames.length > 0) {
                  const carrierValidation = await this.validateCarrierNameMatch(
                    ...expectedCarrierNames
                  );
                  console.log(
                    ` Carrier validation result for row ${currentRowNumber}:`,
                    carrierValidation
                  );
                } else {
                  console.log(
                    ` No expected carrier names provided for row ${currentRowNumber}, skipping carrier validation`
                  );
                }

                // Validate offer rate match if expected offer rates are provided
                if (expectedOfferRates && expectedOfferRates.length > 0) {
                  const offerRateValidation = await this.validateOfferRateMatch(
                    ...expectedOfferRates
                  );
                  console.log(
                    ` Offer rate validation result for row ${currentRowNumber}:`,
                    offerRateValidation
                  );
                } else {
                  console.log(
                    ` No expected offer rates provided for row ${currentRowNumber}, skipping offer rate validation`
                  );
                }

                // Press Escape key to close any modal/dialog that might have opened
                await this.page.keyboard.press("Escape");
                console.log(
                  ` Pressed Escape key after clicking row ${currentRowNumber}`
                );

                rowFound = true;

                // Wait for any resulting navigation or page changes and escape key effect
                await this.page.waitForTimeout(WAIT.DEFAULT);

                // Navigate back or refresh to prepare for next row processing
                // if (rowIndex < totalCarrierCount - 1) {
                //   console.log(` Preparing for next row processing...`);
                //   // Reload page to get fresh state for next row
                //   await this.page.reload();
                //   await this.page.waitForLoadState("domcontentloaded");
                //   await this.page.waitForLoadState("load");
                //   console.log(` Page refreshed for next row processing`);

                //   // Re-enter load ID filter after refresh if provided
                //   if (loadId) {
                //     console.log(` Re-entering Load ID filter after refresh: ${loadId}`);
                //     await this.enterLoadIdFilterValue(loadId);
                //   }
                // }

                break; // Exit the retry loop for this row
              } else {
                console.log(
                  `❌ Target row not visible for row ${currentRowNumber} - continuing to next attempt...`
                );
                continue; // Continue to next attempt if row is not visible
              }
            } else {
              console.log(
                ` Waiting for ${expectedRowsForThisIteration} row(s)... Current: ${availableRows}, Iteration: ${currentRowNumber}, Attempt: ${attempt}`
              );
            }

            if (!rowFound) {
              console.log(
                `❌ Row ${currentRowNumber} not found on attempt ${attempt} (need ${expectedRowsForThisIteration} rows, have ${availableRows})`
              );

              if (attempt < maxAttempts) {
                console.log(` Reloading page before next attempt...`);
                await this.page.reload();
                console.log(
                  ` Waiting ${retryDelay / 1000} seconds before next attempt...`
                );
                await this.page.waitForTimeout(retryDelay);
              }
            }
          } catch (error) {
            console.log(
              `❌ Error on row ${currentRowNumber}, attempt ${attempt}: ${error}`
            );

            if (attempt < maxAttempts) {
              console.log(` Reloading page due to error...`);
              await this.page.reload();
              await this.page.waitForTimeout(retryDelay);
            }
          }
        }

        if (!rowFound) {
          const errorMessage = `❌ Load row ${currentRowNumber} not found after ${maxAttempts} attempts (2 minutes)`;
          console.error(errorMessage);
          throw new Error(
            `Load row ${currentRowNumber} (selectLoadRow_LOC) not visible after 2 minutes of retrying`
          );
        }
      }

      console.log(
        ` Successfully processed all ${totalCarrierCount} load rows based on carrier count`
      );
    } catch (error) {
      console.error(
        `❌ Error in validateLoadRowsBasedOnCarrierCount: ${error}`
      );
      throw error;
    }
  }

  /**
   * @description Validates if any of the provided carrier names matches with the carrier name displayed on TNX Rep page
   * @author Parth Rastogi
   * @created 2025-11-12
   * @param carrierNames - Variable number of carrier names to check against the displayed carrier name
   * @returns Promise<{isMatch: boolean, displayedCarrier: string, matchedCarrier?: string}> - Result object containing match status and carrier details
   * @throws Error if unable to retrieve carrier name from the page
   */
  async validateCarrierNameMatch(...carrierNames: string[]): Promise<{
    isMatch: boolean;
    displayedCarrier: string;
    matchedCarrier?: string;
  }> {
    try {
      console.log(
        ` Validating carrier name match against ${carrierNames.length
        } provided carrier(s): [${carrierNames.join(", ")}]`
      );

      await this.page.waitForLoadState("domcontentloaded");

      // Wait for the carrier name element to be visible
      await this.tnxRepCarrierNameText_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });

      // Get the displayed carrier name text
      const displayedCarrierText = await this.tnxRepCarrierNameText_LOC
        .first()
        .innerText();
      const displayedCarrier = displayedCarrierText?.trim() || "";

      console.log(
        ` Displayed carrier name on TNX Rep page: "${displayedCarrier}"`
      );

      if (!displayedCarrier) {
        throw new Error(
          "❌ No carrier name found on the page or carrier name is empty"
        );
      }

      // Check if any of the provided carrier names match (case-insensitive)
      for (const carrierName of carrierNames) {
        const cleanCarrierName = carrierName.trim();

        // Exact match (case-insensitive)
        if (displayedCarrier.toLowerCase() === cleanCarrierName.toLowerCase()) {
          console.log(
            `✅ Exact match found: "${cleanCarrierName}" matches displayed carrier "${displayedCarrier}"`
          );
          return {
            isMatch: true,
            displayedCarrier: displayedCarrier,
            matchedCarrier: cleanCarrierName,
          };
        }

        // Partial match (case-insensitive) - check if displayed carrier contains the provided name
        if (
          displayedCarrier
            .toLowerCase()
            .includes(cleanCarrierName.toLowerCase())
        ) {
          console.log(
            `✅ Partial match found: "${cleanCarrierName}" is contained in displayed carrier "${displayedCarrier}"`
          );
          return {
            isMatch: true,
            displayedCarrier: displayedCarrier,
            matchedCarrier: cleanCarrierName,
          };
        }

        // Reverse partial match - check if provided name contains the displayed carrier
        if (
          cleanCarrierName
            .toLowerCase()
            .includes(displayedCarrier.toLowerCase())
        ) {
          console.log(
            `✅ Reverse partial match found: Displayed carrier "${displayedCarrier}" is contained in provided name "${cleanCarrierName}"`
          );
          return {
            isMatch: true,
            displayedCarrier: displayedCarrier,
            matchedCarrier: cleanCarrierName,
          };
        }
      }

      console.log(
        `❌ No match found: None of the provided carriers [${carrierNames.join(
          ", "
        )}] match the displayed carrier "${displayedCarrier}"`
      );

      // Hard assertion - throw error to fail the test
      throw new Error(
        `❌ CARRIER VALIDATION FAILED: None of the expected carrier names [${carrierNames.join(
          ", "
        )}] match the displayed carrier "${displayedCarrier}". Please verify the carrier names are correct.`
      );
    } catch (error) {
      console.error(`❌ Error validating carrier name match: ${error}`);
      throw error;
    }
  }

  /**
   * @description Validates if any of the provided offer rate values matches with the offer rate displayed on TNX Rep page
   * @author Parth Rastogi
   * @created 2025-11-12
   * @param offerRateValues - Variable number of offer rate values to check against the displayed offer rate
   * @returns Promise<{isMatch: boolean, displayedOfferRate: string, matchedOfferRate?: string}> - Result object containing match status and offer rate details
   * @throws Error if unable to retrieve offer rate from the page
   */
  async validateOfferRateMatch(...offerRateValues: string[]): Promise<{
    isMatch: boolean;
    displayedOfferRate: string;
    matchedOfferRate?: string;
  }> {
    try {
      console.log(
        ` Validating offer rate match against ${offerRateValues.length
        } provided offer rate(s): [${offerRateValues.join(", ")}]`
      );

      await this.page.waitForLoadState("domcontentloaded");

      // Wait for the offer rate element to be visible
      await this.tnxRepOfferRateText_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });

      // Get the displayed offer rate text
      const displayedOfferRateText = await this.tnxRepOfferRateText_LOC
        .first()
        .innerText();
      const displayedOfferRate = displayedOfferRateText?.trim() || "";

      console.log(
        ` Displayed offer rate on TNX Rep page: "${displayedOfferRate}"`
      );

      if (!displayedOfferRate) {
        throw new Error(
          "❌ No offer rate found on the page or offer rate is empty"
        );
      }

      // Extract numeric value from displayed offer rate (remove $, commas, and decimal part)
      // First remove $ and commas, then split by decimal point and take the whole number part
      let displayedNumericValue = displayedOfferRate.replace(/[\$,]/g, "");
      if (displayedNumericValue.includes(".")) {
        displayedNumericValue = displayedNumericValue.split(".")[0];
      }
      console.log(
        ` Extracted numeric value from displayed offer rate: "${displayedNumericValue}"`
      );

      if (!displayedNumericValue) {
        throw new Error("❌ No numeric value found in displayed offer rate");
      }

      // Check if any of the provided offer rate values match (numeric comparison only)
      for (const offerRateValue of offerRateValues) {
        const cleanOfferRateValue = offerRateValue.trim();

        // Extract numeric value from provided offer rate (remove $, commas, and decimal part)
        // First remove $ and commas, then split by decimal point and take the whole number part
        let providedNumericValue = cleanOfferRateValue.replace(/[\$,]/g, "");
        if (providedNumericValue.includes(".")) {
          providedNumericValue = providedNumericValue.split(".")[0];
        }
        console.log(
          ` Extracted numeric value from provided offer rate "${cleanOfferRateValue}": "${providedNumericValue}"`
        );

        if (!providedNumericValue) {
          console.log(
            ` Skipping "${cleanOfferRateValue}" - no numeric value found`
          );
          continue;
        }

        // Exact numeric match
        if (displayedNumericValue === providedNumericValue) {
          console.log(
            `✅ Numeric match found: "${providedNumericValue}" matches displayed numeric value "${displayedNumericValue}"`
          );
          console.log(
            `   Original values: "${cleanOfferRateValue}" matches displayed "${displayedOfferRate}"`
          );
          return {
            isMatch: true,
            displayedOfferRate: displayedOfferRate,
            matchedOfferRate: cleanOfferRateValue,
          };
        }
      }

      console.log(
        `❌ No numeric match found: None of the provided offer rates [${offerRateValues.join(
          ", "
        )}] match the displayed offer rate "${displayedOfferRate}"`
      );
      console.log(`   Displayed numeric value: "${displayedNumericValue}"`);
      console.log(
        `   Provided numeric values: [${offerRateValues
          .map((val) => val.replace(/[\$,]/g, "").split(".")[0])
          .join(", ")}]`
      );

      // Hard assertion - throw error to fail the test
      throw new Error(
        `❌ OFFER RATE VALIDATION FAILED: None of the expected offer rates [${offerRateValues.join(
          ", "
        )}] match the displayed offer rate "${displayedOfferRate}" (numeric: "${displayedNumericValue}"). Expected numeric values: [${offerRateValues
          .map((val) => val.replace(/[\$,]/g, "").split(".")[0])
          .join(", ")}]`
      );
    } catch (error) {
      console.error(`❌ Error validating offer rate match: ${error}`);
      throw error;
    }
  }
  /**
   * @description Validates non-included carrier for waterfall scenario by ensuring at least 4 load rows are present
   * @author Deepak Bohra
   * @created 2025-11-13
   * @modified 2025-11-18
   * @param expectedCarrierName - The name of the expected non-included carrier
   * @returns Promise<void>
   * @throws Error if the count of load rows does not reach 4 within the timeout
   */

  async validateNonIncludedCarrierRowWaterfall(
    carriers: { name: string; offerRate?: string }[],
    loadId?: string,
    expectedCount: number = 4
  ): Promise<void> {
    try {
      const timeout = 5 * 60 * 1000; // 5 minutes
      const startTime = Date.now();
      let count = await this.selectLoadRow_LOC.count();

      while (count < expectedCount && Date.now() - startTime < timeout) {
        console.log(
          `Current count: ${count}. Waiting for count to reach ${expectedCount}...`
        );

        await this.page.reload({ waitUntil: "domcontentloaded" });
        console.log("Page reloaded successfully.");

        if (loadId) {
          console.log(`Re-entering loadId filter value: ${loadId}`);
          await this.enterLoadIdFilterValue(loadId);
        }

        await this.page.waitForTimeout(WAIT.DEFAULT);
        count = await this.selectLoadRow_LOC.count();
      }

      if (count === expectedCount) {
        let targetRowVisible = false;

        while (!targetRowVisible && Date.now() - startTime < timeout) {
          try {
            const targetRow = this.nonIncludedCarrierRowNameText_LOC;
            await targetRow.waitFor({
              state: "visible",
              timeout: WAIT.DEFAULT,
            });
            targetRowVisible = true;

            console.log("✅ Target row is visible.");
            await this.page.waitForLoadState("domcontentloaded");
            await this.page.waitForLoadState("load");
            await targetRow.click();

            for (const carrier of carriers) {
              await this.validateNonIncludedCarrierField(
                carrier.name,
                carrier.offerRate,
                loadId
              );
            }
          } catch (err) {
            console.warn(
              "Target row not visible yet. Refreshing and retrying..."
            );
            await this.page.reload({ waitUntil: "domcontentloaded" });
            if (loadId) {
              await this.enterLoadIdFilterValue(loadId);
            }
            await this.page.waitForTimeout(WAIT.DEFAULT);
          }
        }

        if (!targetRowVisible) {
          throw new Error(
            `❌ Timeout: Target row did not appear within 5 minutes after count reached ${expectedCount}.`
          );
        }
      } else {
        throw new Error(
          `❌ Timeout: Count did not reach ${expectedCount} within 5 minutes.`
        );
      }
    } catch (error) {
      console.error(`❌ Error validating non-included carriers: ${error}`);
      throw error;
    }

    await this.page.keyboard.press("Escape");
    console.log(` Pressed Escape key after clicking row }`);
  }

  /**
   * @description validates non-included carrier for waterfall field
   * @author Deepak Bohra
   * @created 2025-11-13
   * @modified 2025-11-18 - Added loadId parameter to reapply filter if needed
   * @param expectedCarrierName - The name of the expected non-included carrier
   * @param expectedOfferRate - The expected offer rate for the non-included carrier (optional)
   */
  async validateNonIncludedCarrierField(
    expectedCarrierName: string,
    expectedOfferRate?: string,
    loadId?: string
  ): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    // Trim expected carrier name to eliminate any spaces
    const trimmedExpectedCarrierName = expectedCarrierName.trim();
    console.log(
      ` Starting validation for trimmed carrier: "${trimmedExpectedCarrierName}"`
    );

    while (attempt < maxRetries) {
      attempt++;
      console.log(
        `Attempt ${attempt} to validate carrier: "${trimmedExpectedCarrierName}"`
      );

      await this.page.waitForTimeout(WAIT.SMALL);
      const noCarrierVisible = await this.noCarrierText_LOC.isVisible();

      if (noCarrierVisible) {
        console.warn(
          "'No carrier received' text found. Performing escape, reload, and retry..."
        );
        await this.page.keyboard.press("Escape");
        await this.page.reload({ waitUntil: "domcontentloaded" });

        if (loadId) {
          await this.enterLoadIdFilterValue(loadId);
        }

        await this.page.waitForTimeout(WAIT.DEFAULT);
        continue; // Retry the loop
      }

      // ✅ If noCarrierVisible is false, proceed with validation
      await this.carrierDetailsTable_LOC.waitFor({
        state: "visible",
        timeout: WAIT.LARGE,
      });
      await this.carrierDetailsTable_LOC.click();

      await this.carrierSearchField_LOC.waitFor({
        state: "visible",
        timeout: WAIT.LARGE,
      });
      await this.carrierSearchField_LOC.clear();
      await this.carrierSearchField_LOC.fill(trimmedExpectedCarrierName);
      // Special handling for ZONA TRUCKING LLC which loads slowly
      const isZonaTrucking = trimmedExpectedCarrierName === "ZONA TRUCKING LLC";
      const searchTimeout = isZonaTrucking ? WAIT.XLARGE * 2 : WAIT.LARGE; // Extended timeout for ZONA TRUCKING
      const retryCount = isZonaTrucking ? 5 : 2;

      console.log(
        `Searching for carrier: "${trimmedExpectedCarrierName}"${isZonaTrucking ? " (ZONA TRUCKING - using extended timeout)" : ""
        }`
      );

      // Retry logic for search visibility and carrier validation
      let carrierValidated = false;
      let lastFoundCarrier = "";

      for (
        let attempt = 1;
        attempt <= retryCount && !carrierValidated;
        attempt++
      ) {
        try {
          console.log(
            `Search attempt ${attempt}/${retryCount} for "${trimmedExpectedCarrierName}"`
          );

          // Wait for search results with extended timeout for ZONA TRUCKING
          await this.searchedCarrierNameText_LOC.waitFor({
            state: "visible",
            timeout: searchTimeout,
          });

          console.log(
            `✅ Search results appeared for "${trimmedExpectedCarrierName}" on attempt ${attempt}`
          );
          await this.searchedCarrierNameText_LOC.click();

          await this.page.waitForLoadState("domcontentloaded");
          await this.page.waitForTimeout(
            isZonaTrucking ? WAIT.DEFAULT : WAIT.SMALL
          );

          // Validate the loaded carrier
          await this.nonIncludedCarrierName_LOC.waitFor({
            state: "visible",
            timeout: searchTimeout,
          });

          const carrierName =
            (await this.nonIncludedCarrierName_LOC.textContent()) || "";
          lastFoundCarrier = carrierName.trim();

          if (lastFoundCarrier === trimmedExpectedCarrierName) {
            console.log(
              `✅ Correct carrier validated: "${trimmedExpectedCarrierName}" on attempt ${attempt}`
            );
            carrierValidated = true;
            break;
          } else {
            console.log(
              `❌ Wrong carrier found on attempt ${attempt}: Expected "${trimmedExpectedCarrierName}", Found "${lastFoundCarrier}"`
            );

            if (attempt < retryCount) {
              console.log(
                `Retrying search for "${trimmedExpectedCarrierName}" (attempt ${attempt + 1
                }/${retryCount})...`
              );

              // Reset and search again
              await this.carrierDetailsTable_LOC.click();
              await this.page.waitForTimeout(1000);

              await this.carrierSearchField_LOC.clear();
              await this.page.waitForTimeout(isZonaTrucking ? 1500 : 500);
              await this.carrierSearchField_LOC.fill(
                trimmedExpectedCarrierName
              );
              await this.page.waitForTimeout(isZonaTrucking ? 2000 : 1000); // Extra wait for ZONA TRUCKING
            }
          }
        } catch (searchError) {
          console.log(
            `❌ Search error on attempt ${attempt} for "${trimmedExpectedCarrierName}": ${searchError}`
          );

          if (attempt < retryCount) {
            console.log(
              `Retrying due to search error (attempt ${attempt + 1
              }/${retryCount})...`
            );
            await this.page.waitForTimeout(isZonaTrucking ? 2000 : 1000);

            // Clear and re-enter search
            await this.carrierSearchField_LOC.clear();
            await this.page.waitForTimeout(500);
            await this.carrierSearchField_LOC.fill(trimmedExpectedCarrierName);
            await this.page.waitForTimeout(isZonaTrucking ? 2000 : 1000);
          }
        }
      }
      if (!carrierValidated) {
        // Use soft assertion instead of throwing error after max retries
        const errorMessage = `❌ Failed to find and validate carrier "${trimmedExpectedCarrierName}" after ${retryCount} attempts. Last found carrier: "${lastFoundCarrier}"`;
        console.error(errorMessage);
        await expect.soft(carrierValidated).toBe(true);

        // Continue with validation even if carrier search failed
        console.log(
          `Continuing with validation despite carrier search failure...`
        );
      }

      // At this point, we have the correct carrier loaded, get the carrier name for final validation
      const carrierName = lastFoundCarrier;

      // Trim both expected and found carrier names for comparison (using already trimmed expected name)
      const trimmedFoundCarrierName = carrierName.trim();

      // Validate carrier name with soft assertion
      if (trimmedFoundCarrierName !== trimmedExpectedCarrierName) {
        console.log(
          `❌ Carrier name mismatch! Expected: "${trimmedExpectedCarrierName}", Found: "${trimmedFoundCarrierName}"`
        );
      } else {
        console.log(
          `✅ Carrier name matches! Expected and Found: "${trimmedExpectedCarrierName}"`
        );
      }
      await expect
        .soft(trimmedFoundCarrierName)
        .toBe(trimmedExpectedCarrierName);

      // Validate offer rate if provided
      if (expectedOfferRate) {
        const offerRate =
          await this.nonIncludedCarrierOfferRate_LOC.textContent();
        const displayedNumericValue =
          await commonReusables.normalizeCurrencyValue(offerRate || "");

        if (displayedNumericValue !== expectedOfferRate) {
          console.log(
            `❌ Offer rate mismatch! Expected: "${expectedOfferRate}", Found: "${displayedNumericValue}"`
          );
        } else {
          console.log(
            `✅ Offer rate matches! Expected and Found: "${expectedOfferRate}"`
          );
        }
        await expect.soft(displayedNumericValue).toBe(expectedOfferRate);
      }

      console.log(
        `✅ Validation completed for carrier: "${trimmedExpectedCarrierName}" (using soft assertions)`
      );
      return; // ✅ Exit after validation
    }

    // Use soft assertion instead of throwing error after max retries
    const errorMessage = `❌ Validation failed after ${maxRetries} attempts. 'No carrier received' persisted.`;
    console.error(errorMessage);
    await expect.soft(false).toBe(true); // This will always fail but won't stop test execution
    console.log(` Continuing test execution despite validation failure...`);
  }

  /**
   * @description Validates that the number of rows available on the page equals the totalCarrierCount
   * @author Parth Rastogi
   * @created 2025-12-08
   * @param totalCarrierCount - Expected number of carrier rows
   * @param loadId - Load ID to re-enter after page refresh (optional)
   * @returns Promise<void>
   * @throws Soft assertion if row count exceeds expected count
   */
  async validateRowCountMatchesTotalCarriers(
    totalCarrierCount: number,
    loadId?: string
  ): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForLoadState("load");

      const currentRowCount = await this.selectLoadRow_LOC.count();

      if (currentRowCount > totalCarrierCount) {
        console.log(
          `❌ Row count validation failed: Found ${currentRowCount} rows, expected ${totalCarrierCount}`
        );
        await expect.soft(currentRowCount).toBe(totalCarrierCount);
      }

      // Wait 1 minute to ensure stability
      await this.page.waitForTimeout(WAIT.DEFAULT * 2);

      // Refresh and verify
      await this.page.reload({ waitUntil: "domcontentloaded" });
      await this.page.waitForLoadState("load");

      if (loadId) {
        await this.enterLoadIdFilterValue(loadId);
        await this.page.waitForTimeout(WAIT.DEFAULT);
      }

      const finalRowCount = await this.selectLoadRow_LOC.count();

      if (finalRowCount === totalCarrierCount) {
        console.log(
          `✅ Row count validation passed: ${finalRowCount} rows match expected count`
        );
      } else {
        console.log(
          `❌ Final validation failed: Found ${finalRowCount} rows, expected ${totalCarrierCount}`
        );
        await expect.soft(finalRowCount).toBe(totalCarrierCount);
      }
    } catch (error) {
      console.error(`❌ Row count validation error: ${error}`);
      await expect.soft(false).toBe(true);
    }
  }

  /**
   * @description validates non-included carrier for field for 'No carrier received' text
   * @author Deepak Bohra
   * @created 2025-11-18
   * @param expectedCarrierName - The name of the expected non-included carrier
   * @param expectedOfferRate - The expected offer rate for the non-included carrier (optional)
   */

  async validateNoCarrierReceivedText(): Promise<void> {
    try {
      console.log(`Validating 'No carrier received' text presence`);
      await this.noCarrierText_LOC.waitFor({
        state: "visible",
        timeout: WAIT.LARGE,
      });
      const noCarrierText = await this.noCarrierText_LOC.textContent();
      console.log(`Text found: "${noCarrierText}". Validation successful.`);
      await expect.soft(noCarrierText).toContain("No carrier received");
    } catch (error) {
      console.error(`❌ Error validating 'No carrier received' text: ${error}`);
      throw error;
    }
  }

  /**
   * @description Validates that 'There are no results' text is present on the page
   * @author Parth Rastogi
   * @created 2025-12-09
   * @returns Promise<void>
   * @throws Error if text is not found
   */
  async validateNoResultsText(): Promise<void> {
    try {
      console.log(`Validating 'There are no results' text presence`);
      await this.noResultsText_LOC.waitFor({
        state: "visible",
        timeout: WAIT.LARGE,
      });
      const noResultsText = await this.noResultsText_LOC.textContent();
      console.log(`✅ No results text found: "${noResultsText}"`);
      await expect.soft(noResultsText).toBe("There are no results");
    } catch (error) {
      console.error(
        `❌ Error validating 'There are no results' text: ${error}`
      );
      throw error;
    }
  }

  /**
   * @description Enter bid amount value in the bid amount input field
   * @author Parth Rastogi
   * @created 2025-12-18
   * @param bidAmount - The bid amount value to enter
   */
  async enterBidAmount(bidAmount: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.bidAmountInput_LOC.waitFor({ state: "visible" });
      // Clear any existing value and enter the new bid amount
      await this.bidAmountInput_LOC.clear();
      await this.bidAmountInput_LOC.fill(bidAmount);
      console.log(`✅ Successfully entered bid amount: ${bidAmount}`);
    } catch (error) {
      console.error(`❌ Failed to enter bid amount '${bidAmount}': ${error}`);
      throw error;
    }
  }
  /**
   * @description Validates load row with correct data based on indexing
   * @author Deepak Bohra
   * @created 2025-12-17
   * @returns Promise<void>
   * @throws Error if text is not found
   */
  async validateAndClickLoadRowsBasedOnCarrierCount(
    viewLoadPageOrCount: DFBIncludeCarriersDataModalWaterfall | number,
    loadId?: string,
    loadIndex?: number,
    expectedCarrierNames?: string[],
    expectedOfferRates?: string[],
    bid?: true
  ): Promise<void> {
    try {
      console.log(
        ` Starting validation of load rows based on carrier count...`
      );

      // Get the total carrier count either from ViewLoadPage instance or direct number
      let totalCarrierCount: number;

      if (typeof viewLoadPageOrCount === "number") {
        totalCarrierCount = viewLoadPageOrCount;
        console.log(` Using provided carrier count: ${totalCarrierCount}`);
      } else {
        totalCarrierCount = await viewLoadPageOrCount.getTotalCarrierCount();
        console.log(
          ` Retrieved carrier count from ViewLoadPage: ${totalCarrierCount}`
        );
      }

      if (totalCarrierCount === 0) {
        console.log(` No carriers found, skipping load row validation`);
        return;
      }

      const maxAttempts = 20; // 20 attempts
      const retryDelay = 10000; // 10 seconds

      // Process each row based on carrier count
      for (let rowIndex = 0; rowIndex < totalCarrierCount; rowIndex++) {
        const currentRowNumber = rowIndex + 1;
        console.log(
          `\n Processing load row ${currentRowNumber}/${totalCarrierCount}...`
        );

        let rowFound = false;

        // Try to find and click the current row
        for (let attempt = 1; attempt <= maxAttempts && !rowFound; attempt++) {
          console.log(
            ` Row ${currentRowNumber} - Attempt ${attempt}/${maxAttempts}: Looking for load row...`
          );

          try {
            await this.page.waitForLoadState("domcontentloaded");
            await this.page.waitForLoadState("load");

            // If loadId is provided and this is not the first attempt, re-enter the load ID filter
            if (loadId && attempt > 1) {
              console.log(` Re-entering Load ID filter: ${loadId}`);
              await this.enterLoadIdFilterValue(loadId);
            }

            // Check if we have enough rows available
            const availableRows = await this.selectLoadRow_LOC.count();
            console.log(` Available rows on page: ${availableRows}`);

            // Wait for the expected number of rows based on current iteration
            // First iteration needs 1 row, second needs 2 rows, third needs 3 rows, etc.
            const expectedRowsForThisIteration = currentRowNumber;

            if (availableRows >= expectedRowsForThisIteration) {
              console.log(
                `✅ Expected ${expectedRowsForThisIteration} row(s) available, found ${availableRows} - proceeding`
              );

              // Enhanced 'Contracted' text validation with retry logic for the specific first row
              // Third carrier and beyond may take longer to load "Contracted" status
              const isThirdCarrierOrLater = currentRowNumber >= 3;
              const contractedTimeout = isThirdCarrierOrLater
                ? WAIT.MID
                : WAIT.SMALL; // 15s for 3rd+ carrier, 10s for others
              const maxContractedRetries = isThirdCarrierOrLater ? 5 : 3;

              let contractedFound = false;
              //let targetRow = this.selectLoadRow_LOC.first(); // Initialize target row
              let targetRow = this.carrierRowTable_LOC(loadIndex || 1);

              for (
                let contractedAttempt = 1;
                contractedAttempt <= maxContractedRetries;
                contractedAttempt++
              ) {
                console.log(
                  `Contracted check attempt ${contractedAttempt}/${maxContractedRetries} for row ${currentRowNumber}${isThirdCarrierOrLater
                    ? " (Extended timeout for 3rd+ carrier)"
                    : ""
                  }`
                );

                try {
                  // Check if 'Contracted' text is visible specifically within the target row
                  const contractedTextInRow = targetRow.locator(
                    "//p[text()='Contracted']"
                  );
                  const isContractedTextVisible =
                    await contractedTextInRow.isVisible({
                      timeout: contractedTimeout,
                    });

                  if (isContractedTextVisible) {
                    console.log(
                      `✅ 'Contracted' text found in first row for iteration ${currentRowNumber} on attempt ${contractedAttempt}`
                    );
                    contractedFound = true;
                    break;
                  } else {
                    console.log(
                      `❌ 'Contracted' text not visible in first row on attempt ${contractedAttempt} for row ${currentRowNumber}`
                    );
                  }
                } catch (contractedError) {
                  console.log(
                    `❌ 'Contracted' check error on attempt ${contractedAttempt} for row ${currentRowNumber}: ${contractedError}`
                  );
                }

                if (contractedAttempt < maxContractedRetries) {
                  console.log(
                    `Waiting and retrying 'Contracted' check for row ${currentRowNumber} (attempt ${contractedAttempt + 1
                    }/${maxContractedRetries})...`
                  );
                  await this.page.waitForTimeout(
                    isThirdCarrierOrLater ? WAIT.DEFAULT : WAIT.SMALL / 5
                  ); // Extra wait for 3rd+ carrier

                  // Refresh page if we're on the last few attempts
                  if (contractedAttempt >= maxContractedRetries - 1) {
                    console.log(
                      `Refreshing page before final 'Contracted' check attempt for row ${currentRowNumber}...`
                    );
                    await this.page.reload();
                    await this.page.waitForLoadState("domcontentloaded");
                    await this.page.waitForLoadState("load");

                    // Re-enter load ID filter after refresh if provided
                    if (loadId) {
                      console.log(
                        `Re-entering Load ID filter after refresh: ${loadId}`
                      );
                      await this.enterLoadIdFilterValue(loadId);
                    }

                    // Wait for rows to appear again after refresh
                    await this.page.waitForTimeout(WAIT.DEFAULT);
                    // Update target row reference after page refresh
                    targetRow = this.carrierRowTable_LOC(loadIndex || 1);
                  }
                }
              }

              if (!contractedFound) {
                console.log(
                  `❌ 'Contracted' text not found for row ${currentRowNumber} after ${maxContractedRetries} attempts - continuing to next attempt...`
                );
                continue; // Continue to next attempt to check for rows and contracted text again
              }

              console.log(
                `✅ 'Contracted' text is confirmed visible for row ${currentRowNumber} - proceeding to click`
              );

              // Use the same targetRow that was validated for 'Contracted' text
              await targetRow.waitFor({
                state: "visible",
                timeout: WAIT.DEFAULT,
              });

              const isRowVisible = await targetRow.isVisible();
              if (isRowVisible) {
                await targetRow.click();
                console.log(
                  `✅ Successfully clicked on first load row (iteration ${currentRowNumber}/${totalCarrierCount}) - latest row always appears first`
                );

                // Wait for page to load after clicking the row
                await this.page.waitForLoadState("domcontentloaded");
                await this.page.waitForTimeout(WAIT.DEFAULT); // Wait for elements to be visible

                // Validate carrier name match if expected carrier names are provided
                if (expectedCarrierNames && expectedCarrierNames.length > 0) {
                  const carrierValidation = await this.validateCarrierNameMatch(
                    ...expectedCarrierNames
                  );
                  console.log(
                    ` Carrier validation result for row ${currentRowNumber}:`,
                    carrierValidation
                  );
                } else {
                  console.log(
                    ` No expected carrier names provided for row ${currentRowNumber}, skipping carrier validation`
                  );
                }

                // Validate offer rate match if expected offer rates are provided
                if (expectedOfferRates && expectedOfferRates.length > 0) {
                  const offerRateValidation = await this.validateOfferRateMatch(
                    ...expectedOfferRates
                  );
                  console.log(
                    ` Offer rate validation result for row ${currentRowNumber}:`,
                    offerRateValidation
                  );
                } else {
                  console.log(
                    ` No expected offer rates provided for row ${currentRowNumber}, skipping offer rate validation`
                  );
                }

                await this.page.keyboard.press("Escape");
                console.log(
                  ` Pressed Escape key after clicking row ${currentRowNumber}`
                );

                rowFound = true;

                // Wait for any resulting navigation or page changes and escape key effect
                await this.page.waitForTimeout(WAIT.DEFAULT);
                break; // Exit the retry loop for this row
              } else {
                console.log(
                  `❌ Target row not visible for row ${currentRowNumber} - continuing to next attempt...`
                );

                continue; // Continue to next attempt if row is not visible
              }
            } else {
              console.log(
                ` Waiting for ${expectedRowsForThisIteration} row(s)... Current: ${availableRows}, Iteration: ${currentRowNumber}, Attempt: ${attempt}`
              );
            }

            if (!rowFound) {
              console.log(
                `❌ Row ${currentRowNumber} not found on attempt ${attempt} (need ${expectedRowsForThisIteration} rows, have ${availableRows})`
              );

              if (attempt < maxAttempts) {
                console.log(` Reloading page before next attempt...`);
                await this.page.reload();
                console.log(
                  ` Waiting ${retryDelay / 1000} seconds before next attempt...`
                );
                await this.page.waitForTimeout(retryDelay);
              }
            }
          } catch (error) {
            console.log(
              `❌ Error on row ${currentRowNumber}, attempt ${attempt}: ${error}`
            );

            if (attempt < maxAttempts) {
              console.log(` Reloading page due to error...`);
              await this.page.reload();
              await this.page.waitForTimeout(retryDelay);
            }
          }
        }

        if (!rowFound) {
          const errorMessage = `❌ Load row ${currentRowNumber} not found after ${maxAttempts} attempts (2 minutes)`;
          console.error(errorMessage);
          throw new Error(
            `Load row ${currentRowNumber} (selectLoadRow_LOC) not visible after 2 minutes of retrying`
          );
        }
      }

      console.log(
        ` Successfully processed all ${totalCarrierCount} load rows based on carrier count`
      );
    } catch (error) {
      console.error(
        `❌ Error in validateLoadRowsBasedOnCarrierCount: ${error}`
      );
      throw error;
    }
  }

  /*
  author: Deepak BohraS
  created: 2025-12-17
  This function clicks on the carrier row for bidding based on the provided load index.

  */
  async clickOnCarrierForBidding(loadIndex?: any): Promise<void> {
    try {
      let targetRow = this.carrierRowTable_LOC(loadIndex || 1);

      targetRow.click();
    } catch (e) {
      console.log("not able to click on the carrier for bid");
    }
  }

  /*
  author: Deepak Bohra
  created: 2025-12-17
  This function clicks on the element based on text.
  */
  async clickTnxBiddingButton(buttonName: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await commonReusables.waitForPageStable(this.page);
      const biddingButton = this.tnxElementByText_LOC(buttonName);
      await biddingButton.waitFor({ state: "visible", timeout: WAIT.SMALL });
      await biddingButton.click();
      console.log(`✅ Clicked on TNX bidding button: ${buttonName}`);
    } catch (error) {
      console.error(
        `❌ Failed to click TNX bidding button '${buttonName}': ${error}`
      );
      throw error;
    }
  }

  /*
  author: Deepak BohraS
  created: 2025-12-17
  This function validate the visibility of element
  */
  async validateTnxElementVisible(elementText: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.tnxElementByText_LOC(elementText).waitFor({
        state: "visible",
        timeout: WAIT.SMALL,
      });
      const element = this.tnxElementByText_LOC(elementText);
      const isVisible = await element.isVisible();
      if (isVisible) {
        console.log(`✅ TNX element '${elementText}' is visible on the page`);
      } else {
        throw new Error(
          `❌ VALIDATION FAILED: TNX element '${elementText}' is not visible on the page`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error validating TNX element '${elementText}': ${error}`
      );
      throw error; // Re-throw to fail the test
    }
  }
}
export default TNXRepLandingPage;
