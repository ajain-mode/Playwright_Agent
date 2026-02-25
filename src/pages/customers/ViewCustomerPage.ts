
import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class ViewCustomerPage {

  private readonly autoSendEDIEventsValue_LOC: Locator;
  private readonly editButton_LOC: Locator;
  private readonly viewCustomerEditButton_LOC: Locator;
  private readonly viewCustomerSaveButton_LOC: Locator;
  private readonly searchCustomerCargoValue_LOC: Locator;
  private readonly cargoValueDropDown_LOC: Locator;
  private readonly adjustmentFieldInput_LOC: Locator;
  private readonly minMarkupFieldInput_LOC: Locator;
  private readonly maxMarkupFieldInput_LOC: Locator;
  private readonly viewCustomerMasterLink_LOC: Locator;
  private readonly enableAutoOverlayCheckbox_LOC: Locator;
  private readonly homeButton_LOC: Locator;
  private readonly pcMilerDefaultMethodValue_LOC: Locator;
  private readonly pcMilerDefaultMethodDropdown_LOC: Locator;
  private readonly enableGreenScreenAutoPopulationDropDown_LOC: Locator;
  private readonly enableGreenScreenAutoPopulationValue_LOC: Locator;
  private readonly availableCreditInput_LOC: Locator;
  private readonly createLoadLink_LOC: (loadType: string) => Locator;
  private readonly internalShareValue_LOC: Locator;
  private readonly LoadMenuList: (menuname: string) => Locator;
  private readonly corpCreditLimitValue_LOC: Locator;
  private readonly availableCorpCreditValue_LOC: Locator;
  private readonly salesPersonValue_LOC: Locator;
  private readonly operatingSalesPersonValue_LOC: Locator;
  private readonly customerActiveStatus: Locator;
  private readonly manageExternalIdValue_LOC: Locator;
  private readonly customerNameCell_LOC: Locator;
  private readonly masterLoginID_LOC: Locator;

  constructor(private page: Page) {
    this.autoSendEDIEventsValue_LOC = page.locator("//td[contains(text(),'Events')]/..//li");
    this.editButton_LOC = page.locator("//td[contains(text(),'View Customer')]/following-sibling::td//input[contains(@value,'Edit')]");
    this.viewCustomerEditButton_LOC = page.locator(
      "//td[contains(text(),'View Customer')]//parent::tr//div//input[contains(@value,'Edit')]"
    );
    this.viewCustomerSaveButton_LOC = page.locator(
      "//td[contains(text(),'Edit Customer')]//parent::tr//input[@value='  Save  ']"
    );
    this.searchCustomerCargoValue_LOC = page.locator(
      "//tr//td[contains(text(),'Cargo Value')]//following-sibling::td"
    );
    this.cargoValueDropDown_LOC = page.locator(
      "//select[contains(@id,'cargo_insurance')]"
    );
    this.pcMilerDefaultMethodDropdown_LOC = page.locator(
      "//select[contains(@id,'pc_miler_method')]"
    );
    this.adjustmentFieldInput_LOC = page.locator("//input[@id='ltl_cust_rate']");
    this.minMarkupFieldInput_LOC = page.locator("//input[@id='ltl_cust_rate_min_amt']");
    this.maxMarkupFieldInput_LOC = page.locator("//input[@id='ltl_cust_rate_max_amt']");
    this.viewCustomerMasterLink_LOC = page.locator("//a[contains(text(),'MASTER')]");
    this.enableAutoOverlayCheckbox_LOC = page.locator("#enable_auto_overlay");
    this.homeButton_LOC = page.locator("//span[text()='Home']");
    this.pcMilerDefaultMethodValue_LOC = page.locator("//td[@class='fn'][contains(normalize-space(.), 'Method')]//following-sibling::td");
    this.enableGreenScreenAutoPopulationDropDown_LOC = page.locator("//select[@name='enabled_greenscreens_auto_population']");
    this.enableGreenScreenAutoPopulationValue_LOC = page.locator("//td[text()='Enable Greenscreens Auto Population']//following-sibling::td");
    this.availableCreditInput_LOC = page.locator("//td[text()='Available Corp Credit']/following-sibling::td[@class='money']");
    this.createLoadLink_LOC = (loadType: string) => page.getByRole('link', { name: `${loadType}`, exact: true });
    this.internalShareValue_LOC = page.locator("//td[text()='Internal Shares']/following-sibling::td//div[@class='share_strike_div']");
    this.LoadMenuList = (menuname: string) => {
      return this.page.getByRole("link", { name: menuname });
    };
    this.corpCreditLimitValue_LOC = page.locator("//tr[td[contains(.,'Corp') and contains(.,'Credit') and contains(.,'Limit')]]/td[@class='money']");
    this.availableCorpCreditValue_LOC = page.locator("//tr[td[@class='fn' and contains(text(),'Available')]]/td[@class='money']");
    this.salesPersonValue_LOC = page.locator("//tr[td[@class='fn' and normalize-space(text())='Salesperson']] /td[@class='view']");
    this.operatingSalesPersonValue_LOC = page.locator("//tr[td[@class='fn' and normalize-space(text())='Operating Salesperson']] /td[@class='view']");
    this.customerActiveStatus = page.locator("//b[normalize-space()='ACTIVE']");
    this.manageExternalIdValue_LOC = page.locator("#external_id_pairs");
    this.customerNameCell_LOC = page.locator('tr:has(td.fn:text-is("Name")) td.view');
    this.masterLoginID_LOC = page.locator("//td[@class='fn' and contains(string(.),'Master') and not(contains(string(.),'Office'))] /following-sibling::td[1]");
  }
  /**
   * @author Rohit Singh
   * @created 2025-08-19
   * @description Get the list of auto-send EDI events.
   * @returns A promise that resolves to an array of event names.
   */
  async getAutoSendEDIEventsValue(): Promise<string[]> {
    await this.page.waitForLoadState("networkidle");
    return await this.autoSendEDIEventsValue_LOC.evaluateAll(elements => elements.map(element => element.textContent.trim()));
  }
  /**
   * @author Rohit Singh
   * @created 2025-08-19
   * @description Click the edit button on the view customer page.
   */
  async clickEditButton() {
    await this.page.waitForLoadState("networkidle");
    await this.editButton_LOC.click();
    await this.page.waitForLoadState("networkidle");
  }
  async validateEventStatus(events: string[]) {
    expect.soft(events).toContain(INVOICE_EVENTS.AT_ORIGIN);
    expect.soft(events).toContain(INVOICE_EVENTS.PICKED_UP);
    expect.soft(events).toContain(INVOICE_EVENTS.DELIVERY_APPT);
    expect.soft(events).toContain(INVOICE_EVENTS.AT_DESTINATION);
    expect.soft(events).toContain(INVOICE_EVENTS.DELIVERED);
    expect.soft(events).toContain(INVOICE_EVENTS.DELIVERED_FINAL);
  }


  /**
  * @author Deepak
  * @created 2025-10-06
  * @description Sets the PC*Miler Default Method to 'Practical' if not already set.
  */
  async setPracticalDefaultMethodIfNeeded(): Promise<void> {
    const currentMethod = (await this.pcMilerDefaultMethodValue_LOC.textContent())?.trim();
    if (currentMethod?.toLowerCase() !== 'practical') {
      await this.viewCustomerEditButton_LOC.waitFor({ state: "visible" });
      await this.viewCustomerEditButton_LOC.click();
      // Assuming there is a select dropdown for the method, update as needed:
      await this.pcMilerDefaultMethodDropdown_LOC.scrollIntoViewIfNeeded();
      await this.pcMilerDefaultMethodDropdown_LOC.selectOption({ label: 'Practical' });
      await this.viewCustomerSaveButton_LOC.click();
      console.log("PC*Miler Default Method set to 'Practical'.");
    } else {
      console.log("PC*Miler Default Method is already set to 'Practical'.");
    }
  }

  /**
   * @author Parth Rastogi
   * @description This function verifies the cargo value for a customer
   * @modified 2025-07-15
   */
  async verifyAndSetCargoValue(desiredCargoValue: string): Promise<string> {
    let cargoValueText;
    cargoValueText = await this.searchCustomerCargoValue_LOC.textContent();
    console.log(`Current Cargo Value: ${cargoValueText?.trim()}`);


    try {
      if (desiredCargoValue?.trim() === "" && cargoValueText?.trim() === "") {
        console.log("No value currently set for customer cargo value.");
        cargoValueText = "$10,000 or less"; // Default value if empty
      } else {
        await this.viewCustomerEditButton_LOC.waitFor({ state: "visible" });
        await this.viewCustomerEditButton_LOC.click();
        await this.cargoValueDropDown_LOC.scrollIntoViewIfNeeded();
        await this.cargoValueDropDown_LOC.selectOption(desiredCargoValue);
        if (desiredCargoValue?.trim() === "") {
          cargoValueText = "$10,000 or less"; // Default value if empty
        } else {
          cargoValueText = desiredCargoValue;
        }
        console.log(`Setting Cargo Value to: ${cargoValueText}`);
        await this.viewCustomerSaveButton_LOC.click();

        // Primary approach: Check for popup after clicking save
        await this.handleCargoValueAdjustmentPopup(
          CARGO_ADJUSTMENT_VALUES.ADJUSTMENT_AMOUNT,
          CARGO_ADJUSTMENT_VALUES.MIN_MARKUP_AMOUNT,
          CARGO_ADJUSTMENT_VALUES.MAX_MARKUP_AMOUNT
        );

        // Fallback approach: Check if fields are still visible (popup might have been missed)
        const fieldsStillVisible = await this.adjustmentFieldInput_LOC.isVisible().catch(() => false);
        if (fieldsStillVisible) {
          console.log("Using fallback method for popup handling...");
          await this.handlePopupAlternative(
            CARGO_ADJUSTMENT_VALUES.ADJUSTMENT_AMOUNT,
            CARGO_ADJUSTMENT_VALUES.MIN_MARKUP_AMOUNT,
            CARGO_ADJUSTMENT_VALUES.MAX_MARKUP_AMOUNT
          );
        }
      }
    } catch (error) {
      console.error(`Error verifying and setting Cargo Value: ${error}`);
    }
    return cargoValueText ?? "";
  }

  /*
   * @author Parth Rastogi  
   * @description Alternative method to handle popup with direct field checking
   * @created 2025-08-14
   */
  async handlePopupAlternative(adjustmentValue: string, minMarkup: string, maxMarkup: string): Promise<void> {
    try {
      console.log(" Alternative popup handling - checking for adjustment fields directly...");

      // Wait a moment for any popup to appear and be processed
      await this.page.waitForTimeout(WAIT.DEFAULT);

      // Check if adjustment fields are now visible (indicating popup was accepted)
      const adjustmentFieldVisible = await this.adjustmentFieldInput_LOC.isVisible().catch(() => false);

      if (adjustmentFieldVisible) {
        console.log("Adjustment fields detected - filling form...");
        await this.adjustmentFieldInput_LOC.clear();
        await this.adjustmentFieldInput_LOC.fill(adjustmentValue);
        await this.minMarkupFieldInput_LOC.clear();
        await this.minMarkupFieldInput_LOC.fill(minMarkup);
        await this.maxMarkupFieldInput_LOC.clear();
        await this.maxMarkupFieldInput_LOC.fill(maxMarkup);
        await this.viewCustomerSaveButton_LOC.click();
        console.log("Alternative method completed successfully");
      } else {
        console.log(" No adjustment fields visible - no popup handling needed");
      }

    } catch (error) {
      console.error(`Error in alternative popup handling: ${error}`);
    }
  }

  /*
   * @author Parth Rastogi
   * @description This function handles the cargo value adjustment popup if it appears
   * @modified 2025-08-06
   */
  async handleCargoValueAdjustmentPopup(adjustmentValue: string, minMarkup: string, maxMarkup: string): Promise<void> {
    try {
      console.log(" Checking for cargo value adjustment popup...");

      // First check if there are any dialogs or alerts appearing
      let adjustmentRequired = false;

      // Set up a promise to detect if a dialog appears within a short timeframe
      const dialogPromise = new Promise<boolean>((resolve) => {
        const dialogHandler = async (dialog: any) => {
          const message = dialog.message();
          console.log(` Dialog detected: "${message}"`);

          if (message.includes("Please enter a valid Adjustment dollar amount")) {
            console.log("✅ Cargo value adjustment dialog detected");
            adjustmentRequired = true;
            await dialog.accept(); // Accept the alert
            this.page.off('dialog', dialogHandler); // Remove handler
            resolve(true);
          } else {
            console.log(` Different dialog detected: "${message}"`);
            await dialog.accept();
            this.page.off('dialog', dialogHandler); // Remove handler
            resolve(false);
          }
        };

        // Register dialog handler only when checking
        this.page.on('dialog', dialogHandler);

        // Auto-resolve after timeout if no dialog appears
        setTimeout(() => {
          this.page.off('dialog', dialogHandler);
          resolve(false);
        }, WAIT.DEFAULT);
      });

      // Wait for either dialog to appear or timeout
      const hasRelevantDialog = await dialogPromise;

      // Only proceed with adjustment if the specific dialog appeared
      if (hasRelevantDialog && adjustmentRequired) {
        console.log("Adjustment required, looking for adjustment field...");

        // Check if adjustment field exists and is visible
        const isFieldVisible = await this.adjustmentFieldInput_LOC.isVisible().catch(() => false);

        if (isFieldVisible) {
          console.log("Adjustment field found, entering value...");

          // Wait for page to stabilize after dialog acceptance
          await this.page.waitForTimeout(WAIT.DEFAULT / 3);

          await this.adjustmentFieldInput_LOC.waitFor({ state: "visible", timeout: WAIT.DEFAULT / 3 });
          await this.adjustmentFieldInput_LOC.clear();
          await this.adjustmentFieldInput_LOC.fill(adjustmentValue);

          await this.minMarkupFieldInput_LOC.waitFor({ state: "visible" });
          await this.minMarkupFieldInput_LOC.clear();
          await this.minMarkupFieldInput_LOC.fill(minMarkup);

          await this.maxMarkupFieldInput_LOC.waitFor({ state: "visible" });
          await this.maxMarkupFieldInput_LOC.clear();
          await this.maxMarkupFieldInput_LOC.fill(maxMarkup);

          await this.viewCustomerSaveButton_LOC.waitFor({ state: "visible" });
          await this.viewCustomerSaveButton_LOC.click();

        } else {
          console.log("❌ Adjustment field not found in DOM");
        }

      } else {
        console.log("No cargo value adjustment dialog detected - proceeding normally");
      }

    } catch (error) {
      console.error(`❌ Error handling cargo value adjustment popup: ${error}`);
      // Don't throw error as popup might not always appear
    }
  }
  /**
   * @author Rohit Singh
   * @created 2025-09-08
   * @description Click the customer master link on the view customer page.
   */
  async clickCustomerMasterLink() {
    await this.page.waitForLoadState("networkidle");
    await this.viewCustomerMasterLink_LOC.click();
    await this.page.waitForLoadState("networkidle");
  }
  /**
   * @author Rohit Singh
   * @created 2025-09-08
   * @description Check the status of Enable Auto Overlay checkbox.
   * @return A promise that resolves to true if checked, false otherwise.
   */
  async disableAutoOverlayCheckbox() {
    await this.page.waitForLoadState("networkidle");
    const isChecked = await this.enableAutoOverlayCheckbox_LOC.isChecked();
    console.log(`Enable Auto Overlay Checkbox is ${isChecked ? 'checked' : 'unchecked'}`);
    if (isChecked) {
      await this.enableAutoOverlayCheckbox_LOC.uncheck();
    }
  }
  /**
   * @author Rohit Singh
   * @created 2025-09-09
   * @description Clicks on the Home button in the main header.
   **/
  async clickHomeButton() {
    await this.page.waitForLoadState("networkidle");
    await this.homeButton_LOC.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * @author Parth Rastogi
   * @description This function verifies the cargo value for a customer
   * @modified 2025-10-06
   */
  async getGreenScreenAutoPopulationStatus() {
    await this.page.waitForLoadState("networkidle");
    let status = await this.enableGreenScreenAutoPopulationValue_LOC.textContent();
    console.log(`Current Green Screen Auto Population status: ${status}`);
    if (status?.trim() === "NO") {
      console.log("Green Screen Auto Population is set to NO");
      await this.editButton_LOC.click();
      await this.page.waitForLoadState("networkidle");
      await this.enableGreenScreenAutoPopulationDropDown_LOC.selectOption("YES");
      console.log("Changed Green Screen Auto Population to YES");
      await this.viewCustomerSaveButton_LOC.waitFor({ state: "visible", timeout: WAIT.SMALL / 2 });
      await this.viewCustomerSaveButton_LOC.click();
      await this.page.waitForLoadState("networkidle");
      status = await this.enableGreenScreenAutoPopulationValue_LOC.textContent();
      console.log(`Updated Green Screen Auto Population status: ${status}`);
      await this.page.waitForLoadState("networkidle");
    }
  }
  /**
   * Gets the available credit for the customer.
   * @author Rohit Singh
   * @created 2025-10-13
   */
  async getAvailableCredit(): Promise<number> {
    let creditNumber = 0;
    await this.page.waitForLoadState("networkidle");
    const credit = await this.availableCreditInput_LOC.textContent();
    // Remove dollar sign and clean up the value
    let cleanedCredit = credit?.trim() || "";
    if (cleanedCredit) {
      // Remove $ symbol and any whitespace
      cleanedCredit = cleanedCredit.replace(/\$/g, '').trim();
      // Parse as number to check if positive
      creditNumber = parseFloat(cleanedCredit.replace(/,/g, ''));
      if (!isNaN(creditNumber)) {
        const isPositive = creditNumber >= 0;
        if (!isPositive) {
          console.warn(`Warning: Available credit is negative: ${creditNumber}`);
        }
      } else {
        console.error(`Error: Could not parse credit value as number: ${creditNumber}`);
      }
    }
    return creditNumber;
  }

  /**
   * @author Rohit Singh
   * @created 2025-11-12
   * @description Clicks on the Create Load link for a specified load type.
   * @param loadtype - The type of load to create (e.g., "New Load (TL)").
   */
  async clickCreateLoadLink(loadtype: string) {
    await this.page.waitForLoadState("networkidle");
    await this.createLoadLink_LOC(loadtype).click();
    await this.page.waitForLoadState("networkidle");
  }
  /**
   * @author Rohit Singh
   * @created 2025-11-12
   * @description Gets the internal share value displayed on the view customer page.
   * @returns A promise that resolves to the internal share value as a string.
   */
  async getInternalShareValue() {
    await this.page.waitForLoadState("networkidle");
    const shareValue = await this.internalShareValue_LOC.textContent();
    console.log(`Internal Share Value: ${shareValue?.trim()}`);
    return shareValue;
  }
  /*
   * @author Parth Rastogi
   * @description This function is used to navigate to a specific load type
   * @modified 2025-07-15
   */
  async navigateToLoad(loadType: string) {
    try {
      await this.LoadMenuList(loadType).click();
      await this.page.waitForLoadState("networkidle");
    } catch (error) {
      console.error(`Error Navigating to Load: ${error}`);
      throw error;
    }
  }

  /**
   * @author Aniket Nale
   * @created 19-Dec-25
   * @description Helper to parse currency strings from UI into numbers
   * @param value - The currency string to parse
   * @returns The parsed number
   */

  private parseCurrency(value: string | number | null | undefined): number {
    if (value === null || value === undefined) {
      throw new Error('Currency value is null or undefined');
    }

    // If already a number, return it
    if (typeof value === 'number') {
      return value;
    }

    const cleaned = value
      .replace(/[\u00A0\u2000-\u200F\u202F\u205F\u3000\uFFFD]/g, ' ') // all NBSP / bad chars
      .replace(/[^0-9.-]/g, '') // keep digits, dot, minus only
      .trim();

    const parsed = Number(cleaned);

    if (Number.isNaN(parsed)) {
      throw new Error(`Unable to parse currency value: "${value}"`);
    }

    return parsed;
  }

  /**
   * @author Aniket Nale
   * @created 19-Dec-25
   * @description Gets and verifies the Corp Credit Limit from the UI
   * @param expected - The expected Corp Credit Limit value
   */

  async getCorpCreditLimit(expected: string | number) {
    await commonReusables.waitForPageStable(this.page);

    const uiText = await this.corpCreditLimitValue_LOC.textContent();
    const actualValue = this.parseCurrency(uiText);
    console.log(`Corp Credit Limit from UI: ${actualValue}`);
    const expectedValue = this.parseCurrency(expected);

    await expect(actualValue).toBe(expectedValue);
  }

  /**
 * @author Aniket Nale
 * @created 19-Dec-25
 * @description Gets and verifies the Available Corp Credit from the UI
 * @param expected - The expected Available Corp Credit value
 */

  async getAvailableCorpCredit(expected: string | number) {
    await commonReusables.waitForPageStable(this.page);

    const uiText = await this.availableCorpCreditValue_LOC.textContent();
    const actualValue = this.parseCurrency(uiText);
    console.log(`Available Corp Credit from UI: ${actualValue}`);
    const expectedValue = this.parseCurrency(expected);
    await expect(actualValue).toBe(expectedValue);
  }

  /**
   * @author Aniket Nale
   * @created 19-Dec-25
   * @description Gets the Sales Person Name from the UI
   * @param expected - The expected Sales Person Name value
   */

  async getSalesPersonName(): Promise<string> {
    await commonReusables.waitForPageStable(this.page);
    const salesPersonName = await this.salesPersonValue_LOC.textContent();
    return salesPersonName?.trim() || "";
  }

  /**
 * @author Aniket Nale
 * @created 19-Dec-25
 * @description Gets the Operating Sales Person Name from the UI
 * @param expected - The expected Operating Sales Person Name value
 */

  async getOperatingSalesPersonName(): Promise<string> {
    await commonReusables.waitForPageStable(this.page);
    const operatingSalesPersonName = await this.operatingSalesPersonValue_LOC.textContent();
    return operatingSalesPersonName?.trim() || "";
  }

  /**
* @author Aniket Nale
* @created 22-Dec-25
* @description Checks if the customer is active in the UI
*/

  async isCustomerActive() {
    await commonReusables.waitForPageStable(this.page);
    await this.customerActiveStatus.waitFor({ state: 'visible', timeout: WAIT.LARGE });
    await expect.soft(this.customerActiveStatus).toBeVisible();
  }

  /**
* @author Aniket Nale
* @created 22-Dec-25
* @description Checks if the Manage External ID is present in the UI
*/

  async isManageExternalIdPresent() {
    await commonReusables.waitForPageStable(this.page);
    await this.manageExternalIdValue_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
    await expect.soft(this.manageExternalIdValue_LOC).toBeVisible();
    const text = (await this.manageExternalIdValue_LOC.textContent())?.trim();
    expect.soft(text).not.toBe('(none)');
  }

  /**
* @author Aniket Nale
* @created 22-Dec-25
* @description Validates the customer name in the UI against the expected name
* @param expectedCustomerName - The expected customer name to validate against actual name
*/

  async validateCustomerNameTest(expectedCustomerName: string): Promise<void> {
    try {
      console.log(`Validating customer name: ${expectedCustomerName}`);
      await this.customerNameCell_LOC.first().waitFor({ state: 'visible', timeout: WAIT.LARGE });
      const actualCustomerName = (await this.customerNameCell_LOC.first().textContent())?.trim() || '';
      console.log(`Expected: "${expectedCustomerName}"`);
      console.log(`Actual: "${actualCustomerName}"`);

      if (actualCustomerName === expectedCustomerName) {
        console.log('Customer name validation passed');
      } else {
        throw new Error(`Customer name mismatch! Expected: "${expectedCustomerName}", but found: "${actualCustomerName}"`);
      }
    } catch (error) {
      console.error(`Customer name validation failed: ${error}`);
      throw error;
    }
  }

  /**
* @author Aniket Nale
* @created 01-Jan-26
* @description Gets the Master Login ID from the UI
* @return The Master Login ID as a string
*/

  async getMasterLoginID(): Promise<string> {
    await commonReusables.waitForPageStable(this.page);
    await this.masterLoginID_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
    await expect.soft(this.masterLoginID_LOC).toBeVisible();
    const masterLoginID = await this.masterLoginID_LOC.textContent();
    console.log(`Master Login ID: ${masterLoginID?.trim()}`);
    return masterLoginID?.trim() || "";
  }
}