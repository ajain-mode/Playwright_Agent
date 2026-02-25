import { Page, Locator,expect} from "@playwright/test";
import commonReusables from "@utils/commonReusables";
 
export class DFBIncludeCarriersDataModalWaterfall {
 
  /**
   * @description This class contains locators and methods for interacting with the Include Carriers Data modal in a waterfall load scenario.
   * @author Parth Rastogi
   * @created 2025-11-13
   */
  readonly page: Page;
  private readonly enterCarrierPriorityValue_LOC: Locator;
  private readonly enterCarrierTimingValue_LOC: Locator;
  private readonly enterCarrierOfferRateValue_LOC: Locator;
  private readonly includeCarriersDataPopUpSaveButton_LOC: Locator;
  private readonly postAllCarrierCheckbox_LOC: Locator;
  private readonly checkboxStatusValue_LOC: Locator;
  private readonly formWaterfallOfferRateInput_LOC: Locator;
  private readonly carrierRowLocator: (carrierName: string) => Locator;
 
  /**
   * Constructor to initialize page locators for form validation elements
   * @param page - Playwright Page instance for web interactions
   */
  constructor(page: Page) {
    this.page = page;
    this.enterCarrierPriorityValue_LOC = page.locator("//input[@id='DTE_Field_priority']");
    this.enterCarrierTimingValue_LOC = page.locator("//input[@id='DTE_Field_timing']");
    this.enterCarrierOfferRateValue_LOC = page.locator("//input[@id='DTE_Field_target_rate']");
    this.includeCarriersDataPopUpSaveButton_LOC = page.locator("//h5[contains(text(),'Include Carriers Data')]//parent::div//following-sibling::div//button[text()='Save']");
        this.enterCarrierPriorityValue_LOC = page.locator(
      "//input[@id='DTE_Field_priority']"
    );
    this.enterCarrierTimingValue_LOC = page.locator(
      "//input[@id='DTE_Field_timing']"
    );
    this.enterCarrierOfferRateValue_LOC = page.locator(
      "//input[@id='DTE_Field_target_rate']"
    );
    this.includeCarriersDataPopUpSaveButton_LOC = page.locator(
      "//h5[contains(text(),'Include Carriers Data')]//parent::div//following-sibling::div//button[text()='Save']"
    );
    this.includeCarriersDataPopUpSaveButton_LOC = page.locator(
      "//h5[contains(text(),'Include Carriers Data')]//parent::div//following-sibling::div//button[text()='Save']"
    );
    this.postAllCarrierCheckbox_LOC = page.locator(
      "input#form_post_all_carriers_after_waterfall"
    );
    this.checkboxStatusValue_LOC = page.locator(
      "//select[@id='form_waterfall_carrier_blacklist']/parent::div/parent::div"
    );
    this.formWaterfallOfferRateInput_LOC = page.locator(
      "//input[@id='form_waterfall_offer_rate']"
    );
    this.carrierRowLocator = (carrierName: string) => page.locator(`//td[contains(text(),'${carrierName}')]//parent::tr`);
  }
  private getCarrierPencilIconsLocator(carrierText: string): Locator {
    return this.page.locator(`//td[contains(text(),'${carrierText}')]//parent::tr//td//i[@class='fa fa-pencil']`);
  }
 
  /**
 * Clicks on pencil icons for a specific carrier and inputs values
 * @author Parth Rastogi
 * @created 2025-11-10
 * @param carrierText - The carrier text to locate (e.g., "ZZOO LOGISTICS LLC  (254939)")
 * @param inputValues - Array of values to input for each pencil icon (in order)
 * @returns {Promise<void>}
 */
  async clickCarrierPencilIconsAndInputValues(carrierText: string, ...inputValues: string[]): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
 
      // Create the dynamic locator for the specific carrier
      const carrierPencilIconsLocator = this.getCarrierPencilIconsLocator(carrierText);
 
      // Wait for the pencil icons to be visible
      await carrierPencilIconsLocator.first().waitFor({ state: "visible", timeout: WAIT.DEFAULT });
 
      // Get the count of pencil icons
      const pencilIconCount = await carrierPencilIconsLocator.count();
      console.log(`Found ${pencilIconCount} pencil icon(s) for carrier: "${carrierText}"`);
 
      if (pencilIconCount === 0) {
        throw new Error(`No pencil icons found for carrier: "${carrierText}"`);
      }
 
      // Validate we have enough input values
      if (inputValues.length === 0) {
        throw new Error(`No input values provided. Found ${pencilIconCount} pencil icons but no values to input.`);
      }
 
      // Log information about input values vs available icons
      console.log(`Input values provided: ${inputValues.length}, Pencil icons available: ${pencilIconCount}`);
 
      // Process each pencil icon with corresponding input value
      const actualInputCount = Math.min(pencilIconCount, inputValues.length);
      console.log(`Will process ${actualInputCount} pencil icon(s)`);
 
      for (let i = 0; i < actualInputCount; i++) {
        const pencilIcon = carrierPencilIconsLocator.nth(i);
        const inputValue = inputValues[i];
 
        console.log(`Processing pencil icon ${i + 1}: Inputting value "${inputValue}"`);
 
        // Click the pencil icon
        await pencilIcon.click();
        console.log(`✅ Clicked pencil icon ${i + 1}`);
 
        // Wait for any modal or input field to appear
        await this.page.waitForTimeout(WAIT.DEFAULT/3);
 
        // Use specific locator based on pencil icon position
        let inputField: Locator;
        let fieldName: string;
 
        switch (i) {
          case 0:
            inputField = this.enterCarrierPriorityValue_LOC;
            fieldName = "Priority";
            break;
          case 1:
            inputField = this.enterCarrierTimingValue_LOC;
            fieldName = "Timing";
            break;
          case 2:
            inputField = this.enterCarrierOfferRateValue_LOC;
            fieldName = "Offer Rate";
            break;
          default:
            // Fallback to generic selector for additional pencil icons
            inputField = this.page.locator('input[type="text"]:visible, input[type="number"]:visible').first();
            fieldName = `Field ${i + 1}`;
            break;
        }
 
        console.log(`Using ${fieldName} field for pencil icon ${i + 1}`);
 
        // Wait for the specific input field to be visible
        await inputField.waitFor({ state: "visible", timeout: WAIT.DEFAULT/6 });
 
        // Clear existing value and input new value
        await inputField.clear();
        await inputField.fill(inputValue);
        console.log(`✅ Entered value "${inputValue}" in ${fieldName} field`);
 
        // Verify the value was entered
        const actualValue = await inputField.inputValue();
        console.log(` ${fieldName} field actual value: "${actualValue}"`);
 
        if (actualValue !== inputValue) {
          console.warn(` Warning: Expected "${inputValue}", but ${fieldName} field contains "${actualValue}"`);
        }
 
        // Save/confirm the input (you may need to adjust this based on your save mechanism)
        await this.page.keyboard.press('Enter');
 
        // Wait for the action to complete
        await this.page.waitForTimeout(WAIT.DEFAULT/6);
 
        console.log(`✅ Completed processing pencil icon ${i + 1} (${fieldName})`);
      }
 
      // Warn if we had more input values than pencil icons
      if (inputValues.length > pencilIconCount) {
        console.warn(` Warning: ${inputValues.length - pencilIconCount} extra input value(s) provided but only ${pencilIconCount} pencil icon(s) available`);
      }
 
      console.log(`✅ Successfully processed all ${actualInputCount} pencil icon(s) for carrier: "${carrierText}"`);
 
    } catch (error) {
      console.error(`❌ Error processing pencil icons for carrier "${carrierText}": ${error}`);
      throw error;
    }
  }
 
  /**
   * Clicks the Save button in the Include Carriers Data modal
   * @author Parth Rastogi
   * @created 2025-11-11
   * @returns {Promise<void>}
   */
  async clickIncludeCarriersDataSaveButton(): Promise<void> {
    try {
      console.log(`Clicking Save button to save all carrier data changes...`);
 
      await this.includeCarriersDataPopUpSaveButton_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT
      });
 
      await this.includeCarriersDataPopUpSaveButton_LOC.click();
      console.log(`✅ Clicked Save button - All carrier data saved successfully`);
 
      // Wait for save action to complete
      await this.page.waitForTimeout(WAIT.DEFAULT);
 
    } catch (error) {
      console.error(`❌ Error clicking Save button: ${error}`);
      throw error;
    }
  }
 
  /**
   * Gets only the total carrier count from the Include Carriers table (without extracting mapping data)
   * @author Parth Rastogi
   * @created 2025-11-11
   * @returns {Promise<number>} The total number of carriers available in the table
   */
  async getTotalCarrierCount(): Promise<number> {
    try {
      console.log(` Getting total carrier count from Include Carriers table...`);
 
      // Wait for the carriers table to be visible
      await this.page.waitForSelector("table.table-striped tbody tr", { timeout: WAIT.DEFAULT });
 
      // Get all carrier rows and count them
      const carrierRows = this.page.locator("table.table-striped tbody tr");
      const totalCarrierCount = await carrierRows.count();
 
      console.log(` Total carrier count available: ${totalCarrierCount}`);
 
      return totalCarrierCount;
 
    } catch (error) {
      console.error(`❌ Error getting total carrier count: ${error}`);
      throw error;
    }
  }
 
   /**
     * Click on checkbox for Post all carrire checkbox on waterfall
     * @author Deepak Bohra
     * @created 2025-11-13
     */
    async clickPostAllCarrierCheckbox(): Promise<void> {
      try {

        await this.postAllCarrierCheckbox_LOC.waitFor({
          state: "visible",
          timeout: WAIT.DEFAULT,
        });
        await this.postAllCarrierCheckbox_LOC.check();
 
        // Get all carrier rows and count them
      } catch (error) {
        console.error(
          `❌ Error: Post to all Carriers upon completion of the Waterfall checkbox is not clickable: ${error}`
        );
        throw error;
      }
    }
 
    /**
     * Validate the status of checkbox for Post all carrier checkbox on waterfall
     * @author Deepak Bohra
     * @created 2025-11-13
     */
    async validatePostAllCarrierCheckboxIsChecked(): Promise<void> {
      await this.page.waitForLoadState("domcontentloaded");
      try {
        const classValue = await this.checkboxStatusValue_LOC.getAttribute(
          "class"
        );
        expect(classValue).toContain("show");
        console.log(
          "✅ Checkbox is checked  after clicking on Checkbox of Post to all Carriers upon completion of the Waterfall"
        );

      } catch (error) {
        console.error(
          `❌ Error Checkbox is not checked  after clicking on Checkbox of Post to all Carriers upon completion of the Waterfall : ${error}`
        );
        throw error;
      }
    }

    /**
     * Enter offer rate value in the waterfall form
     * @author Parth Rastogi
     * @created 2025-11-26
     * @param offerRate - The offer rate value to enter
     * @returns {Promise<void>}
     */
    async enterWaterfallOfferRate(offerRate: string): Promise<void> {
      try {
        console.log(`Entering waterfall offer rate: "${offerRate}"`);

        await this.formWaterfallOfferRateInput_LOC.waitFor({
          state: "visible",
          timeout: WAIT.DEFAULT
        });

        await this.formWaterfallOfferRateInput_LOC.clear();
        await this.formWaterfallOfferRateInput_LOC.fill(offerRate);

        // Verify the value was entered correctly
        const actualValue = await this.formWaterfallOfferRateInput_LOC.inputValue();
        console.log(`✅ Entered offer rate: "${actualValue}"`);

        if (actualValue !== offerRate) {
          console.warn(` Warning: Expected "${offerRate}", but field contains "${actualValue}"`);
        }

      } catch (error) {
        console.error(`❌ Error entering waterfall offer rate: ${error}`);
        throw error;
      }
    }

  /**
   * Verifies the input values for carriers by validating the displayed values
   * @author Parth Rastogi
   * @created 2025-01-19
   * @param carriersData - Array of carrier data with name and input values [priority, timing, offerRate]
   * @returns {Promise<void>}
   */
  async verifyCarrierInputValues(carriersData: Array<{ name: string; values: string[] }>): Promise<void> {
    try {
      console.log(`Starting verification of input values for ${carriersData.length} carrier(s)`);
      
      for (const carrier of carriersData) {
        const [priority, timing, offerRate] = carrier.values;
        
        console.log(`Verifying input values for carrier: "${carrier.name}"`);
        console.log(`Expected - Priority: ${priority}, Timing: ${timing}, Offer Rate: ${offerRate}`);
        
        // Use the locator defined in constructor
        const carrierRow = this.carrierRowLocator(carrier.name);
        
        // Wait for the carrier row to be visible
        await carrierRow.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
        
        // Get all values from the carrier row (excluding the first column which is the carrier name)
        const carrierCells = carrierRow.locator('td');
        const cellCount = await carrierCells.count();
        
        if (cellCount < 4) {
          throw new Error(`Expected at least 4 cells for carrier "${carrier.name}", but found ${cellCount}`);
        }
        
        // Extract actual values from the carrier row
        // Assuming the order is: Carrier Name, Priority, Timing, Offer Rate
        const actualPriority = (await carrierCells.nth(1).textContent())?.trim() || "";
        const actualTiming = (await carrierCells.nth(2).textContent())?.trim() || "";
        const actualOfferRate = (await carrierCells.nth(3).textContent())?.trim() || "";
        
        console.log(`  Actual - Priority: "${actualPriority}", Timing: "${actualTiming}", Offer Rate: "${actualOfferRate}"`);
        
        // Verify Priority
        if (actualPriority !== priority) {
          throw new Error(`❌ Priority mismatch for carrier "${carrier.name}": Expected "${priority}", but got "${actualPriority}"`);
        }
        console.log(`✅ Priority verified for carrier "${carrier.name}": ${actualPriority}`);
        
        // Verify Timing
        if (actualTiming !== timing) {
          throw new Error(`❌ Timing mismatch for carrier "${carrier.name}": Expected "${timing}", but got "${actualTiming}"`);
        }
        console.log(`✅ Timing verified for carrier "${carrier.name}": ${actualTiming}`);
        
        // Verify Offer Rate (may need formatting adjustments based on how it's displayed)
        const normalizedActualOfferRate = actualOfferRate.replace(/[$,]/g, ''); // Remove $ and commas
        const normalizedExpectedOfferRate = offerRate.replace(/[$,]/g, ''); // Remove $ and commas
        
        if (normalizedActualOfferRate !== normalizedExpectedOfferRate) {
          // Try with decimal formatting
          const expectedWithDecimals = parseFloat(normalizedExpectedOfferRate).toFixed(2);
          const actualWithDecimals = parseFloat(normalizedActualOfferRate).toFixed(2);
          
          if (actualWithDecimals !== expectedWithDecimals) {
            throw new Error(`❌ Offer Rate mismatch for carrier "${carrier.name}": Expected "${offerRate}", but got "${actualOfferRate}"`);
          }
        }
        console.log(`✅ Offer Rate verified for carrier "${carrier.name}": ${actualOfferRate}`);
        
        console.log(`✅ All input values verified successfully for carrier: "${carrier.name}"`);
      }
      
      console.log(`✅ Successfully verified input values for all ${carriersData.length} carrier(s)`);
      
    } catch (error) {
      console.error(`❌ Error verifying carrier input values: ${error}`);
      throw error;
    }
  }
}
 