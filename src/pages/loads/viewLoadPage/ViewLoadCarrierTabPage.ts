import { Locator, Page, expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import ViewLoadPage from "./ViewLoadPage";
/**
 * @author Rohit Singh
 * @created 2025-07-28
 * @description This class contains methods to interact with the View Load Carrier Tab Page.
 */
class ViewLoadCarrierTabPage {
  private readonly sendEDITenderButton_LOC: (carrierNumber: string) => Locator;
  // private readonly carrier1SendEdiTenderButton_LOC: Locator;
  private readonly carrier2SendEdiTenderButton_LOC: Locator;
  // private readonly carrier3SendEdiTenderButton_LOC: Locator;
  private readonly railCarrierWaybillNumberText_LOC: Locator;
  private readonly carrierNameLink_LOC: Locator;
  private readonly carrierDispatchNameInput_LOC: Locator;
  private readonly carrierDispatchEmailInput_LOC: Locator;
  private readonly bidsReportValue_LOC: Locator;
  private readonly viewLoadPageLinks_LOC: (text: string) => Locator;
  private readonly bidHistoryFirstRowShipCity_LOC: Locator;
  private readonly bidHistoryFirstRowShipState_LOC: Locator;
  private readonly bidHistoryFirstRowConsCity_LOC: Locator;
  private readonly bidHistoryFirstRowConsState_LOC: Locator;
  private readonly bidHistoryFirstRowCarrier_LOC: Locator;
  private capturedBidsValue: string = "";
  private readonly bidHistoryFirstRowEmail_LOC: Locator;
  private readonly bidHistoryFirstRowBidRate_LOC: Locator;
  private readonly bidHistoryFirstRowMiles_LOC: Locator;
  private readonly bidHistoryFirstRowTimestamp_LOC: Locator;

  private readonly changeCarrierButton_LOC: Locator;
  private readonly banyanQuoteIdValue_LOC: Locator;
  private readonly banyanLoadIdValue_LOC: Locator;
  private readonly getQuotesButton_LOC: Locator;
  private readonly cancelButton_LOC: Locator;
  private readonly bidHistoryFirstRowShipDate_LOC: Locator;
  private readonly bidHistoryFirstRowEquipment_LOC: Locator;
  private readonly bidHistoryFirstRowSource_LOC: Locator;
  private readonly cargoValue_LOC: Locator;
  private readonly closeBidHistoryModalButton_LOC: Locator;
  private readonly carrierAssignedText_LOC: (expectedCarrierText: string) => Locator;

  private readonly sendConfirmationButton_LOC: (carrierNumber: string) => Locator;
  private readonly loadAcceptedButton_LOC: (carrierNumber: string) => Locator;
  private readonly carrierDispatchNameValue_LOC: (carrierNumber: string) => Locator;
  private readonly carrierDispatchNumberValue_LOC: (carrierNumber: string) => Locator;
  private readonly carrierDispatchEmailValue_LOC: (carrierNumber: string) => Locator;
  private readonly driverNameValue_LOC: (carrierNumber: string) => Locator;
  private readonly driverNumberValue_LOC: (carrierNumber: string) => Locator;

  constructor(private page: Page) {
    this.sendEDITenderButton_LOC = (carrierNumber: string) =>
      this.page.locator(
        `//div[@id='carr_${carrierNumber}_carr_info_div']//input[@value='Send EDI Tender']`
      );
    // this.carrier1SendEdiTenderButton_LOC = this.page.locator(
    //   "//div[@id='carr_1_carr_info_div']//input[@value='Send EDI Tender']"
    // );
    this.carrier2SendEdiTenderButton_LOC = this.page.locator(
      "//div[@id='carr_2_carr_info_div']//input[@value='Send EDI Tender']"
    );
    // this.carrier3SendEdiTenderButton_LOC = this.page.locator(
    //   "//div[@id='carr_3_carr_info_div']//input[@value='Send EDI Tender']"
    // );
    this.railCarrierWaybillNumberText_LOC = this.page.locator(
      "//td[contains(text(),'Waybill')]/following-sibling::td"
    );
    this.carrierNameLink_LOC = this.page.locator(
      "//b//a[contains(@href,'carrform')]"
    );
    this.carrierDispatchNameInput_LOC = this.page.locator(
      "#carr_1_booked_with"
    );
    this.carrierDispatchEmailInput_LOC = this.page.locator(
      "#carr_1_booked_with_email"
    );
    this.bidsReportValue_LOC = this.page.locator(
      "//span[@id='bids-num-reports']"
    );
    this.viewLoadPageLinks_LOC = (text: string) =>
      page.locator(`//a[contains(text(),'${text}')]`);

    this.bidHistoryFirstRowShipCity_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[2]"
    );
    this.bidHistoryFirstRowShipState_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[3]"
    );
    this.bidHistoryFirstRowConsCity_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[4]"
    );
    this.bidHistoryFirstRowConsState_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[5]"
    );
    this.bidHistoryFirstRowCarrier_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[6]"
    );
    this.bidHistoryFirstRowEmail_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[7]"
    );
    this.bidHistoryFirstRowBidRate_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[8]"
    );
    this.bidHistoryFirstRowTimestamp_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[9]"
    );
    this.bidHistoryFirstRowEquipment_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[10]"
    );
    this.bidHistoryFirstRowMiles_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[11]"
    );
    this.changeCarrierButton_LOC = this.page.locator(
      "#change_ltl_carrier_button"
    );
    // this.banyanQuoteIdValue_LOC = this.page.locator("//*[@id='carr_1_carr_info_div']/table/tbody/tr[3]/td[2]/table/tbody/tr[3]/td[2]");
    this.banyanQuoteIdValue_LOC = this.page.locator(
      "//td[text()='Banyan Quote ID']/following-sibling::td[@class='viewww']"
    );
    this.banyanLoadIdValue_LOC = this.page.locator(
      "//td[text()='Banyan Load ID']/following-sibling::td[@class='viewww']"
    );
    this.getQuotesButton_LOC = this.page.locator(
      "//input[@value='Get Quotes']"
    );
    this.bidHistoryFirstRowShipDate_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[1]"
    );
    this.bidHistoryFirstRowEquipment_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[10]"
    );
    this.bidHistoryFirstRowSource_LOC = this.page.locator(
      "//table[@id='carrier_bids_show_history']//tbody//tr[1]//td[12]"
    );
    this.closeBidHistoryModalButton_LOC = this.page.locator(
      "//h5[contains(text(),'Bid History')]//parent::div//button[@class='close']"
    );
    this.carrierAssignedText_LOC = (expectedCarrierText: string) =>
      page.locator(
        `//a[@class='quick_link'][contains(text(),'${expectedCarrierText}')]`
      );
    this.cancelButton_LOC = this.page.locator("//button[@id='form_cancel']");
    this.cargoValue_LOC = this.page.locator("//td[contains(text(),'Cargo Value')]//parent::tr//div");
    this.sendConfirmationButton_LOC = (carrierNumber: string) => this.page.locator(`//div[@id='carr_${carrierNumber}_carr_info_div']//input[@value='Send Confirmation']`);
    this.loadAcceptedButton_LOC = (carrierNumber: string) => this.page.locator(`//div[@id='carr_${carrierNumber}_carr_info_div']//input[@value='Load Accepted']`);
    this.carrierDispatchNameValue_LOC = (carrierNumber: string) => this.page.locator(`#carr_${carrierNumber}_booked_with`);
    this.carrierDispatchEmailValue_LOC = (carrierNumber: string) => this.page.locator(`#carr_${carrierNumber}_booked_with_email`);
    this.carrierDispatchNumberValue_LOC = (carrierNumber: string) => this.page.locator(`#carr_${carrierNumber}_booked_with_phone`);
    this.driverNameValue_LOC = (carrierNumber: string) => this.page.locator(`#carrier_${carrierNumber}_tab`).getByRole('cell', { name: 'Driver', exact: true }).locator('xpath=following-sibling::td').first();
    this.driverNumberValue_LOC = (carrierNumber: string) => this.page.locator(`#carrier_${carrierNumber}_tab`).getByRole('cell', { name: 'Driver Cell', exact: true }).locator('xpath=following-sibling::td').first();

  }
  //____________________Consolidated Methods____________________
  /**
   * @description Clicks on the Send EDI Tender button for a specified carrier Tab
   * @author Rohit Singh
   * @created 30-Dec-2025
   * @param carrierNumber - The carrier tab number (1, 2, or 3) to click the button, By default it is set to 1 i.e., Carrier 1
   *
   */
  async clickSendEDITenderButton(carrierNumber: "1" | "2" | "3" = "1") {
    await this.page.waitForLoadState("networkidle");
    await commonReusables.alertAcceptWithText(
      this.page,
      "SUCCESS sending EDI Tender"
    );
    await this.sendEDITenderButton_LOC(carrierNumber).click();
  }

  // /**
  //  * Clicks on the Carrier 1 Send EDI Tender button
  //  * @author Rohit Singh
  //  * @modified 2025-07-21
  //  */
  // async clickCarrier1SendEDITenderButton() {
  //   await this.page.waitForLoadState("networkidle");
  //   await commonReusables.alertAcceptWithText(
  //     this.page,
  //     "SUCCESS sending EDI Tender"
  //   );
  //   await this.carrier1SendEdiTenderButton_LOC.click();
  // }
  /**
   * Clicks on the Carrier 2 Send EDI Tender button
   * @author Rohit Singh
   * @modified 2025-07-22
   */
  async clickCarrier2SendEDITenderButton() {
    await this.page.waitForLoadState("networkidle");
    await commonReusables.alertAcceptWithText(
      this.page,
      "SUCCESS sending EDI Tender"
    );
    await this.carrier2SendEdiTenderButton_LOC.click();
  }
  // /**
  //  * Clicks on the Carrier 3 Send EDI Tender button
  //  * @author Rohit Singh
  //  * @modified 2025-07-22
  //  */
  // async clickCarrier3SendEDITenderButton() {
  //   await this.page.waitForLoadState("networkidle");
  //   await commonReusables.alertAcceptWithText(
  //     this.page,
  //     "SUCCESS sending EDI Tender"
  //   );
  //   await this.carrier3SendEdiTenderButton_LOC.click();
  // }
  //____________________

  /**
   * Gets the rail carrier waybill number from the Carrier 2 tab
   * @author Rohit Singh
   * @modified 2025-07-22
   * @returns {Promise<string>} The rail carrier waybill number
   */
  async getRailCarrierWaybillNumber(): Promise<string> {
    await new ViewLoadPage(this.page).clickCarrier2Tab();
    await this.page.waitForLoadState("networkidle");
    const waybillNumber =
      await this.railCarrierWaybillNumberText_LOC.textContent();
    return waybillNumber?.trim() || "";
  }

  /**
   * @description Validate carrier link text matches expected value
   * @author Deepak Bohra
   * @created 2025-09-03
   * @param expectedText - Expected carrier text to validate
   * @throws Error if text doesn't match
   */
  async validateCarrierLinkText(expectedText: string): Promise<void> {
    await this.page.waitForLoadState("networkidle");
    const carrierLink = this.carrierNameLink_LOC;
    await carrierLink.waitFor({
      state: "visible",
      timeout: WAIT.DEFAULT,
    });
    const actualText = (await carrierLink.textContent())?.trim() || "";
    // Soft assertion - test continues even if this fails
    await expect
      .soft(actualText, `Carrier text should match expected value`)
      .toBe(expectedText.trim());

    console.log(`✅ Carrier link text validated: "${actualText}"`);
  }

  /**
   * Validates the carrier dispatch name input field value
   * @author Deepak Bohra
   * @param expectedName - The expected carrier dispatch name to compare with
   * @returns Promise<string> - The actual carrier dispatch name value
   * @modified 2025-09-07
   */
  async validateCarrierDispatchName(expectedName: string): Promise<string> {
    // Wait for element to be attached to DOM (works for hidden inputs)
    await this.carrierDispatchNameInput_LOC.waitFor({ state: "attached" });
    const actualName =
      (await this.carrierDispatchNameInput_LOC.getAttribute("value")) || "";
    const trimmedName = actualName.trim();
    const trimmedExpected = expectedName.trim();

    console.log(
      `Carrier Dispatch Name - Expected: "${trimmedExpected}", Actual: "${trimmedName}"`
    );

    // Use manual comparison with trimmed values instead of toHaveValue
    await expect
      .soft(
        trimmedName,
        `Expected carrier dispatch name: "${trimmedExpected}", but found: "${trimmedName}"`
      )
      .toBe(trimmedExpected);

    const isValid = trimmedName === trimmedExpected;
    console.log(
      `${isValid ? "✅" : "❌"} Carrier dispatch name validation ${
        isValid ? "successful" : "failed"
      }`
    );
    return trimmedName;
  }

  /**
   * Validates the carrier dispatch email input field value
   * @author Deepak Bohra
   * @param expectedEmail - The expected carrier dispatch email to compare with
   * @returns Promise<string> - The actual carrier dispatch email value
   * @modified 2025-09-07
   */
  async validateCarrierDispatchEmail(expectedEmail: string): Promise<string> {
    console.log(
      `Validating carrier dispatch email: Expected = "${expectedEmail}"`
    );
    // Wait for element to be attached to DOM (works for hidden inputs)
    await this.carrierDispatchEmailInput_LOC.waitFor({ state: "attached" });
    const actualEmail =
      (await this.carrierDispatchEmailInput_LOC.getAttribute("value")) || "";
    const trimmedEmail = actualEmail.trim();
    console.log(
      `Carrier Dispatch Email - Expected: "${expectedEmail}", Actual: "${trimmedEmail}"`
    );
    await expect
      .soft(
        this.carrierDispatchEmailInput_LOC,
        `Expected carrier dispatch email: "${expectedEmail}", but found: "${trimmedEmail}"`
      )
      .toHaveValue(expectedEmail);
    console.log("✅ Carrier dispatch email validation successful");
    return trimmedEmail;
  }

  /**
   * Captures and returns the bids report value text
   * @author Parth Rastogi
   * @created 2025-01-09
   * @modified 2025-10-25 - Added check to highlight values >= 50
   * @returns {Promise<string>} The bids report value text
   */
  async getBidsReportValue(): Promise<string> {
    try {
      await this.page.waitForLoadState("networkidle");

      // Wait for the bids report value element to be visible
      await this.bidsReportValue_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });

      // Get the actual text content and store it in a variable
      const bidsReportText = await this.bidsReportValue_LOC.textContent();
      this.capturedBidsValue = bidsReportText?.trim() || "";

      // Convert to number for comparison
      // const bidsNumber = parseInt(this.capturedBidsValue) || 0;

      // // Check if the value is >= 50 and highlight it
      // if (bidsNumber >= 50) {
      //     console.log(`\n╔════════════════════════════════════════════════════════════════════════════════╗`);
      //     console.log(`║                              ⚠️  HIGH BID ACTIVITY ALERT                        ║`);
      //     console.log(`╠════════════════════════════════════════════════════════════════════════════════╣`);
      //     console.log(`║  Current Bids Count: ${String(bidsNumber).padEnd(10)} │ Threshold: >= 50                    ║`);
      //     console.log(`║  Status: THRESHOLD EXCEEDED   │ Priority: HIGH                             ║`);
      //     console.log(`║  Action: Monitor for unusual activity patterns                                ║`);
      //     console.log(`╚════════════════════════════════════════════════════════════════════════════════╝\n`);
      // }

      console.log(
        `✅ Successfully captured bids report value: "${this.capturedBidsValue}"`
      );
      return this.capturedBidsValue;
    } catch (error) {
      console.error(`❌ Failed to capture bids report value: ${error}`);
      throw error;
    }
  }

  /**
   * Validates that the current bids report value increases by 1 within 30 retries
   * @author Parth Rastogi
   * @created 2025-01-09
   * @modified 2025-01-09 - Added 30-retry counter loop to wait for bids increment with assertion
   * @returns {Promise<boolean>} True if the bids value increases by 1 within 30 retries, throws error otherwise
   */
  async validateBidsReportValue(): Promise<boolean> {
    try {
      // First capture the initial bids report value
      const initialBidsValue = await this.capturedBidsValue;
      console.log(`Initial bids value: ${initialBidsValue}`);

      // Loop for 60 retries to check if bids value increases by 1
      const maxRetries = 60;
      let retryCount = 0;
      let bidsIncremented = false;

      while (retryCount < maxRetries && !bidsIncremented) {
        retryCount++;
        console.log(`Retry attempt ${retryCount}/${maxRetries}`);

        try {
          await this.page.waitForLoadState("networkidle");

          // Wait for the bids report value element to be visible
          await this.bidsReportValue_LOC.waitFor({
            state: "visible",
            timeout: WAIT.DEFAULT,
          });

          // Get the current text content
          const currentValue = await this.bidsReportValue_LOC.textContent();
          const trimmedCurrentValue = currentValue?.trim() || "";

          // Convert values to numbers for comparison
          const initialNumber = parseInt(initialBidsValue) || 0;
          const currentNumber = parseInt(trimmedCurrentValue) || 0;

          // Check if bids value has increased by 1
          if (currentNumber === initialNumber + 1) {
            console.log(
              `✅ Bids value successfully increased from ${initialBidsValue} to ${trimmedCurrentValue} on retry ${retryCount}`
            );
            bidsIncremented = true;
            break;
          }

          console.log(
            `Waiting for bids increment. Current: ${trimmedCurrentValue}, Expected: ${
              initialNumber + 1
            } (Retry ${retryCount}/${maxRetries})`
          );
          await this.page.waitForTimeout(WAIT.DEFAULT); // Wait 3 seconds before next retry
        } catch (pollingError) {
          console.log(
            `Error during retry attempt ${retryCount}: ${pollingError}`
          );
          await this.page.waitForTimeout(WAIT.DEFAULT);
        }
      }

      if (bidsIncremented) {
        console.log(
          `✅ Bids report value validation passed. Value successfully increased by 1 after ${retryCount} retries.`
        );
        return true;
      } else {
        const errorMessage = `❌ CRITICAL FAILURE: Bids value did not increase by 1 after ${maxRetries} retries. Initial: ${initialBidsValue}, Expected: ${
          parseInt(initialBidsValue) + 1
        }`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const criticalError = `❌ Critical error in validateBidsReportValue: ${error}`;
      console.error(criticalError);
      throw new Error(criticalError);
    }
  }

  /**
   * Click on the footer links on view load page
   * @author Parth Rastogi
   * @created 2025-08-09
   * @returns {Promise<string>} The bids report value text
   */
  async clickViewLoadPageLinks(linkName: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      const biddingButton = this.viewLoadPageLinks_LOC(linkName);
      await biddingButton.waitFor({ state: "visible" });
      await biddingButton.click();
      console.log(`✅ Clicked on TNX bidding button: ${linkName}`);
    } catch (error) {
      console.error(
        `❌ Failed to click TNX bidding button '${linkName}': ${error}`
      );
      throw error;
    }
  }

  /**
   * Captures all details from the first row of the bid history table
   * @author Parth Rastogi
   * @created 2025-01-09
   * @returns {Promise<BidHistoryRow>} Object containing all bid history row details
   */
  async getBidHistoryFirstRowDetails(): Promise<BidHistoryRow> {
    try {
      await this.page.waitForLoadState("networkidle");

      const shipCity =
        (await this.bidHistoryFirstRowShipCity_LOC.textContent()) || "";
      const shipState =
        (await this.bidHistoryFirstRowShipState_LOC.textContent()) || "";
      const consCity =
        (await this.bidHistoryFirstRowConsCity_LOC.textContent()) || "";
      const consState =
        (await this.bidHistoryFirstRowConsState_LOC.textContent()) || "";
      const carrier =
        (await this.bidHistoryFirstRowCarrier_LOC.textContent()) || "";
      const email =
        (await this.bidHistoryFirstRowEmail_LOC.textContent()) || "";
      const bidRate =
        (await this.bidHistoryFirstRowBidRate_LOC.textContent()) || "";
      const timestamp =
        (await this.bidHistoryFirstRowTimestamp_LOC.textContent()) || "";
      const shipDate =
        (await this.bidHistoryFirstRowShipDate_LOC.textContent()) || "";
      const equipment =
        (await this.bidHistoryFirstRowEquipment_LOC.textContent()) || "";
      const source =
        (await this.bidHistoryFirstRowSource_LOC.textContent()) || "";

      const miles =
        (await this.bidHistoryFirstRowMiles_LOC.textContent()) || "";
      const bidHistoryRow: BidHistoryRow = {
        shipCity: shipCity.trim(),
        shipState: shipState.trim(),
        consCity: consCity.trim(),
        consState: consState.trim(),
        carrier: carrier.trim(),
        email: email.trim(),
        bidRate: bidRate.trim(),
        totalMiles: miles.trim(),
        timestamp: timestamp.trim(),
        shipDate: shipDate.trim(),
        equipment: equipment.trim(),
        source: source.trim(),
      };

      console.log(
        `✅ Successfully captured bid history first row details:`,
        bidHistoryRow
      );

      return bidHistoryRow;
    } catch (error) {
      console.error(
        `❌ Failed to capture bid history first row details: ${error}`
      );
      throw error;
    }
  }
  /**
   * Validates the first row of bid history table against expected values
   * @author Parth Rastogi
   * @created 2025-01-09
   * @param expectedValues - Object containing expected values to validate against
   * @returns {Promise<boolean>} True if validation passes, false otherwise
   * @modified 2025-11-05 - Enhanced timestamp and totalMiles validation logic
   */
  async validateBidHistoryFirstRow(
    expectedValues: Partial<BidHistoryRow>
  ): Promise<boolean> {
    const actualRow = await this.getBidHistoryFirstRowDetails();
    let validationPassed = true;
    const validationResults: string[] = [];
    // Validate each field that has expected values
    for (const [field, expectedValue] of Object.entries(expectedValues)) {
      const actualValue = actualRow[field as keyof BidHistoryRow];
      // Special handling for timestamp field - compare only hour and minutes with 1-minute tolerance
      if (field === "timestamp" && expectedValue !== undefined) {
        // Handle actual format: "10/27/2025 14:55:14" - extract "14:55"
        const actualTimeParts = actualValue.split(" ");
        const expectedTimeParts = expectedValue.split(" ");

        if (actualTimeParts.length > 1 && expectedTimeParts.length > 1) {
          // Extract hour:minute (HH:MM) from time part "14:55:14" -> "14:55"
          // Use regex to extract HH:MM pattern and remove any trailing colons or characters
          const actualTimeMatch = actualTimeParts[1].match(/^\d{1,2}:\d{2}/);
          const expectedTimeMatch =
            expectedTimeParts[1].match(/^\d{1,2}:\d{2}/);

          if (actualTimeMatch && expectedTimeMatch) {
            const actualHM = actualTimeMatch[0]; // This will be clean "HH:MM" format
            const expectedHM = expectedTimeMatch[0]; // This will be clean "HH:MM" format

            // Parse time strings to minutes for comparison with tolerance
            const parseTimeToMinutes = (timeStr: string): number => {
              const [hours, minutes] = timeStr
                .split(":")
                .map((num) => parseInt(num, 10));
              return hours * 60 + minutes;
            };

            const actualMinutes = parseTimeToMinutes(actualHM);
            const expectedMinutes = parseTimeToMinutes(expectedHM);
            const timeDifferenceMinutes = Math.abs(
              actualMinutes - expectedMinutes
            );

            // Allow up to 1 minute difference
            if (timeDifferenceMinutes > 1) {
              validationPassed = false;
              validationResults.push(
                `❌ ${field}: Expected time "${expectedHM}", but got "${actualHM}" (difference: ${timeDifferenceMinutes} minute(s), max allowed: 1 minute)`
              );
            } else {
              validationResults.push(
                `✅ ${field}: "${actualHM}" matches expected time "${expectedHM}" (difference: ${timeDifferenceMinutes} minute(s), within 1-minute tolerance)`
              );
            }
          } else {
            // Fallback for unexpected time format within timestamp
            validationPassed = false;
            validationResults.push(
              `❌ ${field}: Could not extract HH:MM format from timestamps - Expected: "${expectedValue}", Actual: "${actualValue}"`
            );
          }
        } else {
          // Fallback for unexpected format
          validationPassed = false;
          validationResults.push(
            `❌ ${field}: Unexpected timestamp format - Expected: "${expectedValue}", Actual: "${actualValue}"`
          );
        }
      }
      // Special handling for totalMiles - compare up to one decimal place only
      else if (field === "totalMiles" && expectedValue !== undefined) {
        // Remove any non-numeric characters and parse as float
        const expectedMiles = parseFloat(
          String(expectedValue).replace(/[^\d.]/g, "")
        );
        const actualMiles = parseFloat(
          String(actualValue).replace(/[^\d.]/g, "")
        );
        // Compare up to one decimal place
        if (
          Number.isNaN(expectedMiles) ||
          Number.isNaN(actualMiles) ||
          Math.abs(expectedMiles - actualMiles) > 0.1
        ) {
          validationPassed = false;
          validationResults.push(
            `❌ ${field}: Expected "${expectedMiles.toFixed(
              1
            )}", but got "${actualMiles.toFixed(
              1
            )}" (comparing up to one decimal place)`
          );
        } else {
          validationResults.push(
            `✅ ${field}: "${actualMiles.toFixed(
              1
            )}" matches expected value (comparing up to one decimal place)`
          );
        }
      }
      // Special handling for shipDate - validate date format
      else if (field === "shipDate" && expectedValue !== undefined) {
        const actualDate = actualValue.trim();
        const expectedDate = String(expectedValue).trim();

        // Extract only the date part (before space) from actual value if it contains time
        const actualDateOnly = actualDate.includes(" ")
          ? actualDate.split(" ")[0]
          : actualDate;
        const expectedDateOnly = expectedDate.includes(" ")
          ? expectedDate.split(" ")[0]
          : expectedDate;

        if (actualDateOnly !== expectedDateOnly) {
          validationPassed = false;
          validationResults.push(
            `❌ ${field}: Expected date "${expectedDateOnly}", but got "${actualDateOnly}" (comparing date part only)`
          );
        } else {
          validationResults.push(
            `✅ ${field}: "${actualDateOnly}" matches expected date (comparing date part only)`
          );
        }
      }
      // Special handling for equipment - validate equipment type
      else if (field === "equipment" && expectedValue !== undefined) {
        const actualEquipment = actualValue.trim().toUpperCase();
        const expectedEquipment = String(expectedValue).trim().toUpperCase();

        if (actualEquipment !== expectedEquipment) {
          validationPassed = false;
          validationResults.push(
            `❌ ${field}: Expected "${expectedValue}", but got "${actualValue}"`
          );
        } else {
          validationResults.push(
            `✅ ${field}: "${actualValue}" matches expected equipment type`
          );
        }
      }
      // Special handling for source - validate source field
      else if (field === "source" && expectedValue !== undefined) {
        const actualSource = actualValue.trim();
        const expectedSource = String(expectedValue).trim();

        if (actualSource !== expectedSource) {
          validationPassed = false;
          validationResults.push(
            `❌ ${field}: Expected "${expectedSource}", but got "${actualSource}"`
          );
        } else {
          validationResults.push(
            `✅ ${field}: "${actualSource}" matches expected source`
          );
        }
      }
      // Special handling for shipDate - validate date format
      else if (field === "shipDate" && expectedValue !== undefined) {
        const actualDate = actualValue.trim();
        const expectedDate = String(expectedValue).trim();

        // Extract only the date part (before space) from actual value if it contains time
        const actualDateOnly = actualDate.includes(" ")
          ? actualDate.split(" ")[0]
          : actualDate;
        const expectedDateOnly = expectedDate.includes(" ")
          ? expectedDate.split(" ")[0]
          : expectedDate;

        if (actualDateOnly !== expectedDateOnly) {
          validationPassed = false;
          validationResults.push(
            `❌ ${field}: Expected date "${expectedDateOnly}", but got "${actualDateOnly}" (comparing date part only)`
          );
        } else {
          validationResults.push(
            `✅ ${field}: "${actualDateOnly}" matches expected date (comparing date part only)`
          );
        }
      }
      // Special handling for equipment - validate equipment type
      else if (field === "equipment" && expectedValue !== undefined) {
        const actualEquipment = actualValue.trim().toUpperCase();
        const expectedEquipment = String(expectedValue).trim().toUpperCase();

        if (actualEquipment !== expectedEquipment) {
          validationPassed = false;
          validationResults.push(
            `❌ ${field}: Expected "${expectedValue}", but got "${actualValue}"`
          );
        } else {
          validationResults.push(
            `✅ ${field}: "${actualValue}" matches expected equipment type`
          );
        }
      }
      // Special handling for source - validate source field
      else if (field === "source" && expectedValue !== undefined) {
        const actualSource = actualValue.trim();
        const expectedSource = String(expectedValue).trim();

        if (actualSource !== expectedSource) {
          validationPassed = false;
          validationResults.push(
            `❌ ${field}: Expected "${expectedSource}", but got "${actualSource}"`
          );
        } else {
          validationResults.push(
            `✅ ${field}: "${actualSource}" matches expected source`
          );
        }
      }
      // Regular validation for other fields
      else if (expectedValue !== undefined && actualValue !== expectedValue) {
        validationPassed = false;
        validationResults.push(
          `❌ ${field}: Expected "${expectedValue}", but got "${actualValue}"`
        );
      } else if (expectedValue !== undefined) {
        validationResults.push(
          `✅ ${field}: "${actualValue}" matches expected value`
        );
      }
    }
    // Log all validation results
    console.log(` Bid History First Row Validation Results:`);
    validationResults.forEach((result) => console.log(result));
    if (validationPassed) {
      console.log(`✅ Bid history first row validation passed`);
      return true;
    } else {
      console.log(`❌ Bid history first row validation failed`);
      throw new Error(
        "❌ Bid history validation failed - Test should not continue"
      );
    }
  }

  /**
   * click on Change Carrier button on Carrier Tab Page
   * @author Aniket Nale
   * @created 2025-10-31
   */

  async clickOnChangeCarrier() {
    await this.page.waitForLoadState("networkidle");
    await this.changeCarrierButton_LOC.scrollIntoViewIfNeeded();
    await this.changeCarrierButton_LOC.waitFor({
      state: "visible",
      timeout: WAIT.MID,
    });

    await Promise.all([
      this.page.waitForEvent("dialog").then(async (dialog) => {
        console.log(`Alert Message: ${dialog.message()}`);
        await dialog.accept();
        console.log("Alert accepted");
      }),
      this.changeCarrierButton_LOC.click(),
    ]);

    await this.page.waitForLoadState("networkidle");
    await this.page.waitForLoadState("domcontentloaded");
    await expect
      .soft(this.page.getByText("[cancel]"))
      .not.toBeVisible({ timeout: WAIT.SPEC_TIMEOUT });
  }

  /**
   * Get banyan Quote Id from Carrier Tab Page
   * @author Aniket Nale
   * @created 2025-11-01
   */
  async banyanQuoteId(): Promise<number> {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForLoadState("domcontentloaded");
    await this.banyanQuoteIdValue_LOC.waitFor({
      state: "visible",
      timeout: WAIT.MID,
    });
    const text = await this.banyanQuoteIdValue_LOC.first().textContent();
    return parseFloat(text?.replace(/[^\d.-]/g, "") || "0");
  }
  /**
   * Get banyan Load Id from Carrier Tab Page
   * @author Rohit Singh
   * @created 2025-12-01
   */
  async getBanyanLoadId(): Promise<number> {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForLoadState("domcontentloaded");
    await this.banyanLoadIdValue_LOC.waitFor({
      state: "visible",
      timeout: WAIT.MID,
    });
    const text = await this.banyanLoadIdValue_LOC.first().textContent();
    return parseFloat(text?.replace(/[^\d.-]/g, "") || "0");
  }
  /**
   * Clicks on the Get Quotes button
   * @author Rohit Singh
   * @created 03-Nov-2025
   */
  async clickGetQuotesButton() {
    await this.page.waitForLoadState("networkidle");
    await this.getQuotesButton_LOC.waitFor({
      state: "visible",
      timeout: WAIT.MID,
    });
    await this.getQuotesButton_LOC.click();
  }

  /**
   * Clicks on the Get Quotes button
   * @author Deepak Bohra
   * @created 03-Nov-2025
   */
  async getCargoValue() {
    await this.page.waitForLoadState("networkidle");
    await this.cargoValue_LOC.waitFor({
      state: "visible",
      timeout: WAIT.MID,
    });
    const cargoValueText = await this.cargoValue_LOC.innerText();
    return cargoValueText;
  }

  /**
   * Clicks on the Cancel button
   * @author Parth Rastogi
   * @created 2025-12-08
   */
  async clickCancelButton() {
    await this.page.waitForLoadState("networkidle");
    await this.cancelButton_LOC.waitFor({
      state: "visible",
      timeout: WAIT.MID,
    });

    // Handle the confirmation dialog that appears after clicking cancel
    await Promise.all([
      this.page.waitForEvent("dialog").then(async (dialog) => {
        console.log(`Dialog message: ${dialog.message()}`);
        await dialog.accept(); // Click OK to confirm cancellation
        console.log("Cancel confirmation dialog accepted");
      }),
      this.cancelButton_LOC.click(),
    ]);

    console.log(
      "✅ Cancel button clicked and confirmation dialog handled successfully"
    );
  }

  /**
   * Validates that the Cancel button is not available/visible on the page
   * @author Parth Rastogi
   * @created 2025-12-09
   * @returns Promise<void>
   */
  async validateCancelButtonNotAvailable(): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");

      const isCancelButtonVisible = await this.cancelButton_LOC.isVisible({
        timeout: WAIT.SMALL,
      });

      if (isCancelButtonVisible) {
        console.log(
          "❌ Cancel button validation failed: Button is visible when it should not be"
        );
        await expect.soft(this.cancelButton_LOC).not.toBeVisible();
      } else {
        console.log(
          "✅ Cancel button validation passed: Button is not available as expected"
        );
      }
    } catch (error) {
      console.log(
        "✅ Cancel button validation passed: Button is not available (element not found)"
      );
    }
  }
  /**
   * Clicks on the Send Confirmation button for a specified carrier number
   * @author Rohit Singh
   * @created 2025-12-10
   * @param carrierNumber - The carrier tab number (1, 2, or 3) to click the button, By default it is set to 1 i.e., Carrier 1
   */
  async clickSendConfirmationButton(carrierNumber: "1" | "2" | "3" = "1") {
    await this.page.waitForLoadState("networkidle");
    await this.sendConfirmationButton_LOC(carrierNumber).click();
  }

  /**
   * Validates that the carrier assigned text is visible and matches the expected value
   * @author Parth Rastogi
   * @created 2025-12-24
   * @param expectedCarrierText - The expected carrier text to validate
   * @returns Promise<void>
   * @throws Error if validation fails
   */
  async validateCarrierAssignedText(
    expectedCarrierText: string
  ): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForTimeout(WAIT.DEFAULT); // Small wait to ensure text is updated
      console.log(`Searching for carrier text: "${expectedCarrierText}"`);
      const carrierAssignedElement =
        this.carrierAssignedText_LOC(expectedCarrierText);
      // Wait for element to be attached to DOM (works for hidden elements too)
      await carrierAssignedElement.waitFor({
        state: "attached",
        timeout: WAIT.DEFAULT,
      });
      // Check if element exists and get text content
      const actualText =
        (await carrierAssignedElement.textContent())?.trim() || "";
      const expectedText = expectedCarrierText.trim();
      console.log(`Found element with text: "${actualText}"`);
      console.log(`Expected text: "${expectedText}"`);
      // Validate text content matches (using contains for flexibility)
      if (!actualText.includes(expectedText)) {
        throw new Error(
          `Carrier text mismatch. Expected: "${expectedText}", Found: "${actualText}"`
        );
      }
      // Soft assertion for text content
      await expect
        .soft(actualText, `Carrier assigned text should contain expected value`)
        .toContain(expectedText);
      // Verify it's the correct quick link element
      await expect
        .soft(carrierAssignedElement, `Element should have quick_link class`)
        .toHaveClass(/quick_link/);
      console.log(`✅ Carrier assigned text validated: "${actualText}"`);
      console.log(`✅ Element found with correct class and attributes`);
    } catch (error) {
      console.error(
        `❌ Failed to validate carrier assigned text "${expectedCarrierText}": ${error}`
      );
      throw error;
    }
  }
  /**
   * Clicks on the Load Accepted button for a specified carrier number
   * @author Rohit Singh
   * @created 13-Jan-2026
   * @param carrierNumber - The carrier tab number (1, 2, or 3) to click the button, By default it is set to 1 i.e., Carrier 1
   */
  async clickLoadAcceptedButton(carrierNumber: "1" | "2" | "3" = "1") {
    await this.page.waitForLoadState("networkidle");
    await expect(this.loadAcceptedButton_LOC(carrierNumber)).toBeVisible({ timeout: WAIT.MID });
    console.log(`Clicking Load Accepted button for Carrier ${carrierNumber}`);
    await this.loadAcceptedButton_LOC(carrierNumber).click();
  }

  /**
   * Retrieves carrier dispatch details for a specified carrier number
   * @author Rohit Singh
   * @created 14-Jan-2026
   */
  async getCarrierDispatchDetails(carrierNumber: "1" | "2" | "3" = "1"): Promise<{
    name: string;
    email: string;
    phone: string;
  }> {
    await this.page.waitForLoadState("networkidle");
    const name = await this.carrierDispatchNameValue_LOC(carrierNumber).getAttribute("value") || "";
    const email = await this.carrierDispatchEmailValue_LOC(carrierNumber).getAttribute("value") || "";
    const phone = await this.carrierDispatchNumberValue_LOC(carrierNumber).getAttribute("value") || "";
    return {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };
  }

  /**
   * Retrieves driver details for a specified carrier number
   * @author Rohit Singh
   * @created 14-Jan-2026
   * @param carrierNumber 
   * @returns 
   */
  async getDriverDetails(carrierNumber: "1" | "2" | "3" = "1"): Promise<{
    name: string;
    phone: string;
  }> {
    await this.page.waitForLoadState("networkidle");
    const name = await this.driverNameValue_LOC(carrierNumber).textContent() || "";
    const phone = await this.driverNumberValue_LOC(carrierNumber).textContent() || "";
    return {
      name: name.trim(),
      phone: phone.trim(),
    };
  }

  /**
   * Validates that the current bids report value increases by 1 with page refresh and carrier tab navigation
   * @author Parth Rastogi
   * @created 2025-12-23
   * @param maxRetries - Maximum number of retry cycles (default: 12)
   * @returns {Promise<boolean>} True if the bids value increases by 1, throws error otherwise
   */
  async validateBidsReportValueWithRefresh(
    maxRetries: number = 40
  ): Promise<boolean> {
    try {
      // First capture the initial bids report value
      const initialBidsValue = this.capturedBidsValue;
      console.log(`Initial bids value: ${initialBidsValue}`);

      let retryCount = 0;
      let bidsIncremented = false;

      while (retryCount < maxRetries && !bidsIncremented) {
        retryCount++;
        console.log(`Retry cycle ${retryCount}/${maxRetries}`);

        try {
          // Wait 5 seconds before checking
          await this.page.waitForTimeout(WAIT.SMALL / 2);

          await this.page.waitForLoadState("networkidle");

          // Wait for the bids report value element to be visible
          await this.bidsReportValue_LOC.waitFor({
            state: "visible",
            timeout: WAIT.DEFAULT,
          });

          // Get the current text content
          const currentValue = await this.bidsReportValue_LOC.textContent();
          const trimmedCurrentValue = currentValue?.trim() || "";

          // Convert values to numbers for comparison
          const initialNumber = parseInt(initialBidsValue) || 0;
          const currentNumber = parseInt(trimmedCurrentValue) || 0;

          // Check if bids value has increased by 1
          if (currentNumber === initialNumber + 1) {
            console.log(
              `✅ Bids value successfully increased from ${initialBidsValue} to ${trimmedCurrentValue} on retry cycle ${retryCount}`
            );
            bidsIncremented = true;
            break;
          }

          console.log(
            `Bids not incremented yet. Current: ${trimmedCurrentValue}, Expected: ${
              initialNumber + 1
            } (Cycle ${retryCount}/${maxRetries})`
          );

          // If not the last retry, refresh page and navigate to carrier tab
          if (retryCount < maxRetries) {
            console.log(`Refreshing page and navigating to carrier tab...`);
            await this.page.reload();
            await this.page.waitForLoadState("networkidle");

            // Navigate to carrier tab using ViewLoadPage
            const viewLoadPage = new ViewLoadPage(this.page);
            await viewLoadPage.clickCarrierTab();

            console.log(`✅ Page refreshed and navigated to carrier tab`);
          }
        } catch (pollingError) {
          console.log(
            `Error during retry cycle ${retryCount}: ${pollingError}`
          );

          // Try to recover by refreshing page and navigating to carrier tab
          if (retryCount < maxRetries) {
            try {
              await this.page.reload();
              await this.page.waitForLoadState("networkidle");
              const viewLoadPage = new ViewLoadPage(this.page);
              await viewLoadPage.clickCarrierTab();
            } catch (recoveryError) {
              console.log(`Recovery attempt failed: ${recoveryError}`);
            }
          }
        }
      }

      if (bidsIncremented) {
        console.log(
          `✅ Bids report value validation passed. Value successfully increased by 1 after ${retryCount} retry cycles.`
        );
        return true;
      } else {
        const errorMessage = `❌ CRITICAL FAILURE: Bids value did not increase by 1 after ${maxRetries} retry cycles. Initial: ${initialBidsValue}, Expected: ${
          parseInt(initialBidsValue) + 1
        }`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const criticalError = `❌ Critical error in validateBidsReportValueWithRefresh: ${error}`;
      console.error(criticalError);
      throw new Error(criticalError);
    }
  }

  /**
   * Clicks on the close button to close the bid history modal
   * @author Parth Rastogi
   * @created 2025-12-23
   * @returns Promise<void>
   */
  async closeBidHistoryModal(): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.closeBidHistoryModalButton_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.closeBidHistoryModalButton_LOC.click();
      console.log("✅ Bid history modal closed successfully");
    } catch (error) {
      console.error(`❌ Failed to close bid history modal: ${error}`);
      throw error;
    }
  }
}

// Interface for bid history row data
interface BidHistoryRow {
  shipCity: string;
  shipState: string;
  consCity: string;
  consState: string;
  carrier: string;
  bidRate: string;
  timestamp: string;
  email: string;
  totalMiles: string;
  shipDate: string;
  equipment: string;
  source: string;
}

export default ViewLoadCarrierTabPage;
