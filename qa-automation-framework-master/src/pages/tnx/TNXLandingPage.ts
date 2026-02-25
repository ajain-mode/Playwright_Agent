import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

/**
 * Author name: Deepak Bohra
 */
class TNXLandingPage {
  private readonly orgSelectorDropdown_LOC: Locator;
  private readonly plusSignButton_LOC: Locator;
  private readonly loadSearchText_LOC: Locator;
  private readonly loadSearchLink_LOC: Locator;
  private readonly loadLink_LOC: Locator;
  private readonly skipButton_LOC: Locator;
  private readonly noThanksButton_LOC: Locator;
  private readonly availableLoadsText_LOC: Locator;
  private readonly carrierDropdown_LOC: Locator;
  private readonly searchLoadHeadingText_LOC: Locator;
  private readonly tnxElementByText_LOC: (text: string) => Locator;
  private readonly bidAmountInput_LOC: Locator;
  private readonly loadOfferRateValue_LOC: Locator;
  private readonly temporaryDelayPopUp_LOC: Locator;
  private readonly availableJobsText_LOC: Locator;
  private readonly selectTenderDetailsModalTabs_LOC: (
    tabName: string
  ) => Locator;
  private readonly validateStatusHistoryText_LOC: (
    statusText: string
  ) => Locator;

  constructor(private page: Page) {
    this.skipButton_LOC = page.locator(
      "//*[@data-testid='e2e-rep-app-onboarding-process']//*[text()='Skip']"
    );
    this.noThanksButton_LOC = page.locator("//*[contains(text(),'No Thanks')]");
    this.tnxElementByText_LOC = (text: string) =>
      page.locator(`//*[text()='${text}']`);
    this.orgSelectorDropdown_LOC = page.locator(
      "//select[@data-testid='orgSelector']"
    );
    this.plusSignButton_LOC = page.locator(
      "//*[@data-testid='icon-icon-plus']"
    );
    this.loadSearchText_LOC = page.locator(
      "//*[@data-testid='search-bar-text-input']"
    );
    this.loadSearchLink_LOC = page.locator(
      "//*[contains(@data-testid,'suggestion-cargo-references-list-item')]"
    );
    this.loadLink_LOC = page.locator(
      "//*[contains(@data-testid,'tender-row')]"
    );
    this.availableLoadsText_LOC = page.locator(
      "//*[contains(text(),'Available Loads')]"
    );
    this.carrierDropdown_LOC = page.locator(
      "//select[contains(@data-testid, 'carrier') or contains(@id, 'carrier')]"
    );
    this.bidAmountInput_LOC = page.locator("//input[@name='bidAmount']");
    this.searchLoadHeadingText_LOC = page.locator(
      "//*[text()='1 Available Loads']"
    );
    this.loadOfferRateValue_LOC = page.locator(
      "//*[contains(@class,'Tender__price')]//div[contains(@class,'Spacing__spacing')]//p"
    );
    this.temporaryDelayPopUp_LOC = page.locator("//*[text()='Got it!']");
    this.availableJobsText_LOC = page.locator(
      "//*[@data-testid='e2e-search-results-count']"
    );
    this.selectTenderDetailsModalTabs_LOC = (tabName: string) =>
      page.locator(
        `//a[contains(@class,'Tabs')]//span[contains(text(),'${tabName}')]`
      );
    this.validateStatusHistoryText_LOC = (statusText: string) =>
      page.locator(
        `//div[contains(@class,'TenderDetails')]//p[contains(@class,'Typography') and contains(text(),'${statusText}')]`
      );
  }

  /**
   * @description Select organization from dropdown by visible text
   * @author Deepak Bohra
   * @created 2025-08-28
   */
  async selectOrganizationByText(orgText: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForLoadState("load");
      await this.orgSelectorDropdown_LOC.waitFor({ state: "visible" });
      await this.availableLoadsText_LOC.waitFor({ state: "visible" });
      await this.orgSelectorDropdown_LOC.selectOption({ label: orgText });
      await this.availableLoadsText_LOC.waitFor({ state: "visible" });
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForLoadState("load");
      await this.page.waitForTimeout(WAIT.DEFAULT); // Wait for 2 seconds to ensure the page updates
      //await this.orgSelectorDropdown_LOC.scrollIntoViewIfNeeded();
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
   * @description Generic method to click any button by text
   * @author Deepak Bohra
   * @created 2025-08-28
   */
  async clickButtonByText(buttonText: string): Promise<void> {
    try {
      const buttonLocator = this.page.locator(`//*[text()='${buttonText}']`);
      await buttonLocator.waitFor({ state: "visible" });
      await buttonLocator.click();
      console.log(`✅ Clicked button: ${buttonText}`);
    } catch (error) {
      console.error(`❌ Failed to click button '${buttonText}': ${error}`);
      throw error;
    }
  }

  /**
   * @description Click on load link
   * @author Deepak Bohra
   * @created 2025-08-28
   * @modified 2025-09-30
   */
  async clickLoadLink(): Promise<void> {
    try {
      await this.handleOptionalNoThanksButton();
      await this.page.waitForLoadState("domcontentloaded");
      await this.loadLink_LOC.waitFor({ state: "visible" });
      await this.loadLink_LOC.click();
      console.log(`✅ Clicked on load link`);

      // Wait for page to load after clicking the link
    } catch (error) {
      console.error(`❌ Failed to click load link: ${error}`);
      throw error;
    }
  }

  /**
   * @description Dynamically validate available loads text and extract the number of loads
   * @author Deepak Bohra
   * @created 2025-08-29
   * @modified 2025-09-08 - Added retry mechanism (3 attempts, 5 second intervals)
   * @returns Promise<void>
   * @throws Error if no available loads text is found after all retry attempts
   */
  async validateAvailableLoadsText(loadValue: string): Promise<void> {
    await this.page.waitForTimeout(WAIT.LARGE);
    const maxAttempts = 30;
    const retryDelay = WAIT.SMALL; // 10 seconds (total 5 minutes)

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          ` Attempt ${attempt}/${maxAttempts}: Validating Available Loads Text...`
        );
        await this.page.waitForLoadState("domcontentloaded");
        await this.page.waitForLoadState("load");

        // Look for any "Available Loads" text patterncls

        const availableLoadsPattern = this.searchLoadHeadingText_LOC;
        await availableLoadsPattern.waitFor({
          state: "visible",
          timeout: WAIT.MID,
        });
        console.log(`✅ Available Loads Text found on attempt ${attempt}`);
        console.log(
          `Exactly 1 load found, performing additional validation...`
        );

        return; // Success - exit the function
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log(
          `❌ Attempt ${attempt}/${maxAttempts} failed: ${errorMessage}`
        );

        if (attempt < maxAttempts) {
          console.log(`Reloading page before retrying...`);
          await this.page.reload();
          await this.handleOptionalNoThanksButton();
          await this.clickPlusSignButton();
          await this.searchLoadValue(loadValue);
          await this.clickLoadSearchLink();
          console.log(
            `Waiting ${retryDelay / 1000} seconds before next attempt...`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.error(
            `❌ All ${maxAttempts} attempts failed for validateAvailableLoadsText`
          );
          throw new Error(
            `Failed to validate available loads text after ${maxAttempts} attempts. Last error: ${errorMessage}`
          );
        }
      }
    }
  }

  /**
   * @description Dynamically validate that specified text element is present on the page
   * @author Parth Rastogi
   * @created 2025-10-14
   * @param elementText - The text content of the element that should be present
   * @param loadNumber - The load number to search for during retry attempts (optional)
   * @returns Promise<void>
   * @throws Error if the specified element is not found after all retry attempts
   */
  async validateBidsTabAvailableLoadsText(
    elementText: string,
    loadNumber?: string
  ): Promise<void> {
    await this.page.waitForTimeout(WAIT.LARGE);
    const maxAttempts = 30;
    const retryDelay = WAIT.SMALL; // 10 seconds (total 5 minutes)

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          ` Attempt ${attempt}/${maxAttempts}: Validating element '${elementText}' is present...`
        );
        await this.page.waitForLoadState("domcontentloaded");
        await this.page.waitForLoadState("load");

        // Look for the specified element using tnxElementByText_LOC
        const elementPattern = this.tnxElementByText_LOC(elementText);
        await elementPattern.waitFor({
          state: "visible",
          timeout: WAIT.MID,
        });
        console.log(`✅ Element '${elementText}' found on attempt ${attempt}`);
        console.log(
          `Element validation successful, performing additional validation...`
        );

        return; // Success - exit the function
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log(
          `❌ Attempt ${attempt}/${maxAttempts} failed: ${errorMessage}`
        );

        if (attempt < maxAttempts) {
          console.log(`Reloading page before retrying...`);
          await this.page.reload();

          // If loadNumber is provided, perform load search retry actions
          if (loadNumber) {
            console.log(
              `Performing load search retry actions for load: ${loadNumber}`
            );
            try {
              await this.handleOptionalNoThanksButton();
              await this.clickPlusSignButton();
              await this.searchLoadValue(loadNumber);
              await this.clickLoadSearchLink();
              console.log(
                `✅ Load search retry actions completed successfully`
              );
            } catch (retryError) {
              console.log(`⚠️ Load search retry actions failed: ${retryError}`);
              // Continue with the retry loop even if search actions fail
            }
          }

          console.log(
            `Waiting ${retryDelay / 1000} seconds before next attempt...`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.error(
            `❌ All ${maxAttempts} attempts failed for validateAvailableLoadsText`
          );
          throw new Error(
            `Failed to validate element '${elementText}' is available after ${maxAttempts} attempts. Last error: ${errorMessage}`
          );
        }
      }
    }
  }

  /**
   * @description Dynamically validate available loads text and extract the number of loads
   * @author Deepak Bohra
   * @created 2025-08-29
   * @modified 2025-09-08 - Added retry mechanism (3 attempts, 5 second intervals)
   * @returns Promise<void>
   * @throws Error if no available loads text is found after all retry attempts
   */
  async validateUnavailableLoadsText(): Promise<void> {
    await this.page.waitForTimeout(WAIT.SMALL);
    const maxAttempts = 5;
    const retryDelay = WAIT.SMALL; // 5 seconds (total 25 seconds)

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          `Attempt ${attempt}/${maxAttempts}: Validating that no load is present...`
        );
        await this.page.waitForLoadState("domcontentloaded");
        await this.page.waitForLoadState("load");

        // Try to find the "1 Available Loads" heading
        const availableLoadsPattern = this.searchLoadHeadingText_LOC;
        const isVisible = await availableLoadsPattern
          .isVisible({ timeout: WAIT.MID })
          .catch(() => false);
        if (isVisible) {
          // If found, this is a failure
          throw new Error("Load is present but should not be.");
        }
        console.log(`✅ No load present for Carrier on TNX Page as expected`);
        return; // Success - exit the function
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.log(
          `Attempt ${attempt}/${maxAttempts} result: ${errorMessage}`
        );

        if (attempt < maxAttempts) {
          console.log(`Reloading page before retrying...`);
          await this.page.reload();
          console.log(
            `Waiting ${retryDelay / 1000} seconds before next attempt...`
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          console.error(
            `❌ All ${maxAttempts} attempts failed for validateUnavailableLoadsText`
          );
          throw new Error(
            `Failed to validate unavailable loads after ${maxAttempts} attempts. Last error: ${errorMessage}`
          );
        }
      }
    }
  }

  /**
   * @description Click on plus sign button
   * @author Deepak Bohra
   * @created 2025-08-29
   */
  async clickPlusSignButton(): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForLoadState("load");
      await this.handleOptionalSkipButton();
      await this.handleOptionalNoThanksButton();
      await commonReusables.waitForAllLoadStates(this.page);
      await this.plusSignButton_LOC.waitFor({ state: "visible" });
      await this.plusSignButton_LOC.click();
      console.log(`✅ Clicked on plus sign button`);
    } catch (error) {
      console.error(`❌ Failed to click plus sign button: ${error}`);
      throw error;
    }
  }

  /**
   * @description Enter load value in the search text field
   * @author Deepak Bohra
   * @created 2025-08-29
   * @param loadValue - The load value to search for
   */
  async searchLoadValue(loadValue: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.loadSearchText_LOC.waitFor({ state: "visible" });
      await this.loadSearchText_LOC.clear();
      await this.loadSearchText_LOC.fill(loadValue);
      console.log(`✅ Successfully entered load value: ${loadValue}`);
    } catch (error) {
      console.error(`❌ Failed to search load value '${loadValue}': ${error}`);
      throw error;
    }
  }

  async getLoadOfferRateValue(): Promise<string> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.loadOfferRateValue_LOC.waitFor({ state: "visible" });
      const offerRate = await this.loadOfferRateValue_LOC.innerText();
      console.log(`✅ Load offer rate value retrieved: ${offerRate}`);
      return offerRate;
    } catch (error) {
      console.error(`❌ Failed to get load offer rate value: ${error}`);
      throw error;
    }
    this.loadOfferRateValue_LOC;
  }

  /**
   * @description Click on load search suggestion link
   * @author Deepak Bohra
   * @created 2025-08-29
   */
  async clickLoadSearchLink(): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.loadSearchLink_LOC.waitFor({ state: "visible" });
      await this.loadSearchLink_LOC.click();
      console.log(`✅ Clicked on load search suggestion link`);
    } catch (error) {
      console.error(`❌ Failed to click load search suggestion link: ${error}`);
      throw error;
    }
  }

  /**
   * @description Click on TNX bidding button with specific button name
   * @author Deepak Bohra
   * @created 2025-08-29
   * @param buttonName - The name/text of the bidding button to click
   */
  async clickTnxBiddingButton(buttonName: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
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

  /**
   * @description Validate that TNX element is visible on the page (Hard assertion - fails test if not visible)
   * @author Deepak Bohra
   * @created 2025-08-29
   * @param elementText - The text of the element to validate
   * @throws Error if element is not visible
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

  /**
   * @description Click on any TNX element by its text content
   * @author Deepak Bohra
   * @created 2025-08-29
   * @param elementText - The text of the element to click
   */
  async clickTnxElementByText(elementText: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      const element = this.tnxElementByText_LOC(elementText);
      await element.waitFor({ state: "visible" });
      await element.click();
      console.log(`✅ Clicked on TNX element: ${elementText}`);
    } catch (error) {
      console.error(
        `❌ Failed to click TNX element '${elementText}': ${error}`
      );
      throw error;
    }
  }

  /**
   * @description Select carrier from dropdown in TNX and return the selected carrier name
   * @author Deepak Bohra
   * @created 2025-08-29
   * @param carrierName - The name of the carrier to select
   * @returns Promise<string> - The selected carrier name for verification
   */
  async selectCarrierInTnx(carrierName: string): Promise<string> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      const carrierDropdown = this.carrierDropdown_LOC;
      await carrierDropdown.waitFor({
        state: "visible",
        timeout: WAIT.MID,
      });
      await carrierDropdown.selectOption({ label: carrierName });
      console.log(`✅ Selected carrier in TNX: ${carrierName}`);

      return carrierName;
    } catch (error) {
      console.error(
        `❌ Failed to select carrier '${carrierName}' in TNX: ${error}`
      );
      throw error;
    }
  }

  /**
   * @description Handle optional Skip button in onboarding process - click if present, ignore if not
   * @author Deepak Bohra
   * @created 2025-08-29
   */
  async handleOptionalSkipButton(): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForLoadState("load");
      await this.availableLoadsText_LOC.waitFor({ state: "visible" });
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
   * @description Handle optional No Thanks button - click if present, ignore if not
   * @author Deepak Bohra
   * @created 2025-08-29
   */
  async handleOptionalNoThanksButton(): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForTimeout(WAIT.DEFAULT); // Give popup time to appear

      const noThanksButton = this.noThanksButton_LOC; // Remove 'await' here
      const isNoThanksButtonVisible = await noThanksButton
        .isVisible({ timeout: WAIT.SMALL / 2 })
        .catch(() => false);

      if (isNoThanksButtonVisible) {
        await noThanksButton.click(); // Add 'await' and remove extra visibility check
        console.log(`✅ No Thanks button found and clicked successfully`);
        await this.page.waitForTimeout(WAIT.DEFAULT); // Wait after click
      } else {
        console.log(`No Thanks button not present - proceeding with next step`);
      }
    } catch (error) {
      console.log(
        `No Thanks button handling completed (may not have been present): ${error}`
      );
    }
    // this.handleTemporaryDelayPopUp();
  }

  /**
   * @description Handle optional No Thanks button - click if present, ignore if not
   * @author Deepak Bohra
   * @created 2025-08-29
   */
  async handleTemporaryDelayPopUp(): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForTimeout(WAIT.DEFAULT); // Give popup time to appear

      const temporaryDelayPopUp = this.temporaryDelayPopUp_LOC; // Remove 'await' here
      const isTemporaryDelayPopUpVisible = await temporaryDelayPopUp
        .isVisible({ timeout: WAIT.SMALL / 2 })
        .catch(() => false);

      if (isTemporaryDelayPopUpVisible) {
        await temporaryDelayPopUp.click(); // Add 'await' and remove extra visibility check
        console.log(
          `✅ Temporary Processing Delays Pop up found and clicked successfully`
        );
        await this.page.waitForTimeout(WAIT.DEFAULT); // Wait after click
      } else {
        console.log(
          `Temporary Processing Delays Pop Up not present - proceeding with next step`
        );
      }
    } catch (error) {
      console.log(
        `Temporary Processing Delays handling completed (may not have been present): ${error}`
      );
    }
  }

  /**
   * @description Enter bid amount value in the bid amount input field
   * @author Parth Rastogi
   * @created 2025-01-06
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
   * @description Validate that the bid value is visible on the page using tnxElementByText_LOC
   * @author Parth Rastogi
   * @created 2025-10-14
   * @param bidValue - The bid value text to validate (e.g., "$1,500.00", "1500", etc.)
   * @returns Promise<void>
   * @throws Error if bid value is not found or not visible
   */
  async validateBidValue(bidValue: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      console.log(
        `Validating bid value: '${bidValue}' is visible on the page...`
      );
      const bidValueElement = this.tnxElementByText_LOC(bidValue);
      await bidValueElement.waitFor({
        state: "visible",
        timeout: WAIT.SMALL,
      });

      const isVisible = await bidValueElement.isVisible();
      if (isVisible) {
        console.log(
          `✅ Bid value '${bidValue}' is successfully validated and visible on the page`
        );
      } else {
        throw new Error(
          `❌ VALIDATION FAILED: Bid value '${bidValue}' is not visible on the page`
        );
      }
    } catch (error) {
      console.error(`❌ Error validating bid value '${bidValue}': ${error}`);
      throw error; // Re-throw to fail the test
    }
  }

  /**
   * @description Click on TNX header link with specific link text
   * @author Parth Rastogi
   * @created 2025-10-14
   * @param linkText - The text of the TNX header link to click
   * @returns Promise<void>
   * @throws Error if the link is not found or not visible
   */
  async clickOnTNXHeaderLink(linkText: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      const headerLink = this.tnxElementByText_LOC(linkText);
      await headerLink.waitFor({ state: "visible", timeout: WAIT.SMALL });
      await headerLink.click();
      console.log(`✅ Clicked on TNX header link: ${linkText}`);
    } catch (error) {
      console.error(
        `❌ Failed to click on TNX header link '${linkText}': ${error}`
      );
      throw error;
    }
  }

  /**
   * @description Click on plus sign button
   * @author Parth Rastogi
   * @created 2025-12-23
   */
  async clickPlusButton(): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForLoadState("load");
      await this.handleActiveJobsSkipButton();
      await this.handleOptionalNoThanksButton();
      await commonReusables.waitForAllLoadStates(this.page);
      await this.plusSignButton_LOC.waitFor({ state: "visible" });
      await this.plusSignButton_LOC.click();
      console.log(`✅ Clicked on plus sign button`);
    } catch (error) {
      console.error(`❌ Failed to click plus sign button: ${error}`);
      throw error;
    }
  }

  /**
   * @description Handle optional Skip button in onboarding process - click if present, ignore if not
   * @author Parth Rastogi
   * @created 2025-12-23
   */
  async handleActiveJobsSkipButton(): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForLoadState("load");
      await this.availableJobsText_LOC.waitFor({ state: "visible" });
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
   * @description Click on Select Tender Details modal tab with specific tab name
   * @author Parth Rastogi
   * @created 2025-12-22
   * @param tabName - The name of the tab to click
   * @returns Promise<void>
   * @throws Error if the tab is not found or not visible
   */
  async clickOnSelectTenderDetailsModalTab(tabName: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForTimeout(WAIT.SMALL);
      const tabLocator = this.selectTenderDetailsModalTabs_LOC(tabName);
      await tabLocator.waitFor({ state: "visible", timeout: WAIT.SMALL });
      await tabLocator.click();
      console.log(`✅ Clicked on Select Tender Details modal tab: ${tabName}`);
    } catch (error) {
      console.error(
        `❌ Failed to click on Select Tender Details modal tab '${tabName}': ${error}`
      );
      throw error;
    }
  }

  /**
   * @description Validate that the status text is visible in the tender details section
   * @author Parth Rastogi
   * @created 2025-12-22
   * @param statusText - The status text to validate (e.g., "Matched" etc.)
   * @returns Promise<void>
   * @throws Error if status text is not found or not visible
   */
  async validateStatusHistoryText(statusText: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      console.log(
        `Validating status history text: '${statusText}' is visible...`
      );
      const statusElement = this.validateStatusHistoryText_LOC(statusText);
      await statusElement.waitFor({
        state: "visible",
        timeout: WAIT.SMALL,
      });

      const isVisible = await statusElement.isVisible();
      if (isVisible) {
        console.log(
          `✅ Status history text '${statusText}' is successfully validated and visible`
        );
      } else {
        throw new Error(
          `❌ VALIDATION FAILED: Status history text '${statusText}' is not visible`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error validating status history text '${statusText}': ${error}`
      );
      throw error; // Re-throw to fail the test
    }
  }
}
export default TNXLandingPage;
