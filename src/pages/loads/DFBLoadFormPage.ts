import { Page, Locator, expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

// Commonly used selectors
export class DFBLoadFormPage {
  // Selector constants
  /**
   * DFBLoadFormPage - Page Object Model for Load Form Validation in DFB Load Page
   *
   * @description This class handles validation of form fields, predicted rates,
   * confidence levels, and cargo values in the Edit Load form. Includes comprehensive
   * field validation with soft assertions for continuous test execution.
   *
   * @author Deepak Bohra
   */
  readonly page: Page;
  private readonly predictedRateValue_LOC: Locator;
  private readonly confidenceLevelValue_LOC: Locator;
  private readonly cargoValue_LOC: Locator;
  private readonly editLoadValue_LOC: Locator;
  private readonly offerRateValue_LOC: Locator;
  private readonly expirationDateValue_LOC: Locator;
  private readonly expirationTimeValue_LOC: Locator;
  private readonly includeCarriersValue_LOC: Locator;
  private readonly excludeCarriersValue_LOC: Locator;
  private readonly emailNotificationValue_LOC: Locator;
  private readonly commodityDropdown_LOC: Locator;
  private readonly notesValue_LOC: Locator;
  private readonly greenScreenConfidenceLevelValue_LOC: Locator;
  private readonly postStatusValue_LOC: Locator;
  private readonly postButton_LOC: Locator;
  private readonly dfbButton_LOC: (text: string) => Locator;
  private readonly hoverOver_LOC: Locator;
  private readonly dataTableText_LOC: Locator;
  private readonly dataTableRows_LOC: Locator;
  private readonly includeCarriersInput_LOC: Locator;
  private readonly carrierHighlighted_LOC: Locator;
  private readonly optionSelectedDropdown_LOC: string;
  private readonly carrierErrorMessage_LOC: Locator;  
  private readonly carrierAutoAcceptCheckBox_LOC: Locator;
  private readonly carrierContactForRateConfirmationDropdown_LOC: Locator;

  /**
   * Constructor to initialize page locators for form validation elements
   * @param page - Playwright Page instance for web interactions
   */
  constructor(page: Page) {
    this.page = page;
    this.postStatusValue_LOC = page.locator("span#tnx_post_status_badge");
    this.predictedRateValue_LOC = page.locator("#predicted-rate-1");
    this.confidenceLevelValue_LOC = page.locator("#confidence-level-text-1");
    this.postButton_LOC = page.locator("//*[text()='Post']");
    this.cargoValue_LOC = page.locator("#carr_1_cargo_value_opt_id");
    this.offerRateValue_LOC = page.locator("#carr_1_target_rate");
    this.editLoadValue_LOC = page.locator(
      "//td[contains(@class, 'hedbar0') and contains(normalize-space(), 'Edit Load #')]"
    );
    this.hoverOver_LOC = page.locator("#hoverImage");
    //this.postedPopUP = page.locator("#lastPostedDetailsTable");
    this.expirationDateValue_LOC = page.locator(
      '//*[text()="Expiration Date"]/following-sibling::input[@id="form_expiration_date"]'
    );
    this.expirationTimeValue_LOC = page.locator(
      '//*[text()="Expiration Time"]/following-sibling::input[@id="form_expiration_time"]'
    );
    this.notesValue_LOC = page.locator('//*[@id="tnx_load_board"]//textarea');
    this.includeCarriersValue_LOC = page.locator("#form_carriers_whitelist");
    this.excludeCarriersValue_LOC = page.locator("#form_carriers_blacklist");
    this.emailNotificationValue_LOC = page.locator("#form_notification_email");
    this.commodityDropdown_LOC = page.locator("#form_commodity");
    this.greenScreenConfidenceLevelValue_LOC = page
      .locator("#target-buy-rate-1")
      .getByText("Confidence level")
      .locator("xpath=following-sibling::div");
    this.dfbButton_LOC = (buttonSuffix: string) =>
      page.locator(`#form_${buttonSuffix}`);
    this.dataTableText_LOC = page.locator("#lastPostedDetailsTable");
    this.dataTableRows_LOC = page.locator("#lastPostedDetailsTable tr");
    this.includeCarriersInput_LOC = page.locator(
      "//*[@id='form_carriers_whitelist']//parent::div//input"
    );
    this.carrierHighlighted_LOC = page.locator(
      "//*[@class='select2-results__option select2-results__option--highlighted']"
    );
    this.optionSelectedDropdown_LOC = "option[selected]";
    this.carrierErrorMessage_LOC = page.locator("#carr_prexisting_errors");
    this.carrierAutoAcceptCheckBox_LOC = page.locator("//input[@id='form_auto_accept']");
    this.carrierContactForRateConfirmationDropdown_LOC = page.locator("//select[@id='form_accept_as_user']");

  }

  /**
   * @description Wait for post status to change to expected status and validate
   * @author Deepak Bohra
   * @created : 2025-08-28
   * @param expectedStatus - The expected status to validate (e.g., "POSTED", "DRAFT", "ACTIVE")
   * @param timeoutMs - Optional timeout in milliseconds (default: 60000ms = 60 seconds)
   */
  async validatePostStatus(
    expectedStatus: string,
    timeoutMs: number = 150000
  ): Promise<void> {
    console.log(`Waiting for post status to change to '${expectedStatus}'...`);
    await this.postStatusValue_LOC.waitFor({ state: "visible" });
    // Poll until status matches expected status or ERROR
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const status =
        (await this.postStatusValue_LOC.textContent())?.trim() || "";
      console.log(`Current post status: ${status}`);
      if (status === expectedStatus) {
        console.log(
          `✅ Post status successfully changed to '${expectedStatus}'`
        );
        return;
      }
      if (status === "ERROR") {
        throw new Error("❌ Post failed with ERROR status");
      }
      await this.page.waitForTimeout(WAIT.DEFAULT);
    }
    const finalStatus =
      (await this.postStatusValue_LOC.textContent())?.trim() || "";
    throw new Error(
      `❌ Timeout: Expected '${expectedStatus}' but status is still '${finalStatus}' after ${
        timeoutMs / 1000
      } seconds`
    );
  }

  /**
   *
   * @author Deepak Bohra
   * @description Enter value into the Offer Rate
   * @created : 2025-08-28
   */
  async enterOfferRate(offerRateValue: string | number): Promise<void> {
    await this.offerRateValue_LOC.fill(String(offerRateValue));
  }

  /**
   *
   * @author Deepak Bohra
   * @description Select multiple carriers in Include Carriers field
   * @created : 2025-08-28
   */
  async selectCarriersInIncludeCarriers(carrierNames: string[]): Promise<void> {
    for (const carrierName of carrierNames) {
      const carrierLocator = this.includeCarriersInput_LOC;
      await carrierLocator.fill(carrierName);
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForTimeout(WAIT.DEFAULT);
      await this.carrierHighlighted_LOC.click();
    }
  }

  /**
   * @description Extract load number from Edit Load or View Load page
   * @author Deepak Bohra
   * @created : 2025-08-29
   * @returns Promise<string> - Returns the extracted load number
   */
  async getLoadNumber(): Promise<string> {
    try {
      // Try to get from Edit Load page first
      let loadText: string | null = null;

      if (await this.editLoadValue_LOC.isVisible()) {
        loadText = await this.editLoadValue_LOC.textContent();
        console.log(`Found Edit Load text: ${loadText}`);
      } else if (await this.editLoadValue_LOC.isVisible()) {
        loadText = await this.editLoadValue_LOC.textContent();
        console.log(`Found View Load text: ${loadText}`);
      } else {
        throw new Error("Neither Edit Load nor View Load header is visible");
      }
      // Extract load number using regex
      const loadNumberMatch = loadText?.match(/(?:Edit|View) Load #(\w+)/);
      let extractedLoadNumber = loadNumberMatch ? loadNumberMatch[1] : "";
      // Remove "Centralized" suffix if present
      if (extractedLoadNumber.endsWith("Centralized")) {
        extractedLoadNumber = extractedLoadNumber.replace("Centralized", "");
        console.log(
          `Removed "Centralized" suffix. Clean load number: ${extractedLoadNumber}`
        );
      }
      if (!extractedLoadNumber) {
        throw new Error(`Could not extract load number from text: ${loadText}`);
      }
      console.log(`✅ Extracted load number: ${extractedLoadNumber}`);
      return extractedLoadNumber;
    } catch (error) {
      console.error(`❌ Failed to extract load number: ${error}`);
      throw error;
    }
  }

  /**
   * Validates predicted rate and confidence level values with flexible expectations
   * @author Deepak Bohra
   *  @description Validates predicted rate and confidence level values with flexible expectations
   * @modified : 2025-07-30
   */
  async validatePredictedRateAndConfidence(countryName: string) {
    await this.editLoadValue_LOC.waitFor({ state: "visible" });
    await this.predictedRateValue_LOC.waitFor({ state: "visible" });
    const predictedRateText = await this.predictedRateValue_LOC.evaluate((el) =>
      el.textContent?.trim()
    );
    const confidenceLevelText = await this.confidenceLevelValue_LOC.evaluate(
      (el) => el.textContent?.trim()
    );
    console.log(`Predicted Rate: ${predictedRateText}`);
    console.log(`Confidence Level: ${confidenceLevelText}`);
    console.log(`Country: ${countryName}`);

    if (countryName === "UNITED STATES") {
      console.log("Validating for United States...");
      // For United States - Expect dollar amount and confidence value
      const hasDollarAmount = predictedRateText?.includes("$");
      const hasConfidenceValue =
        confidenceLevelText !== "--" && confidenceLevelText !== "";
      await expect
        .soft(
          hasDollarAmount,
          `Expected dollar amount for ${countryName} found: "${predictedRateText}"`
        )
        .toBe(true);
      await expect
        .soft(
          hasConfidenceValue,
          `Expected confidence value for ${countryName} found: "${confidenceLevelText}"`
        )
        .toBe(true);
      console.log(
        hasDollarAmount
          ? `✅ ${countryName} - Has dollar value: ${predictedRateText}`
          : `❌ ${countryName} - No dollar value: ${predictedRateText}`
      );
      console.log(
        hasConfidenceValue
          ? `✅ ${countryName} - Has confidence: ${confidenceLevelText}`
          : `❌ ${countryName} - No confidence value: ${confidenceLevelText}`
      );
    } else {
      // For Canada and other countries - Expect "Unavailable" and "--"
      console.log("Validating for Canada...");

      // Use soft assertions - continues execution even if they fail
      await expect
        .soft(
          predictedRateText,
          `Expected "Unavailable" for ${countryName} found : "${predictedRateText}"`
        )
        .toBe("Unavailable");
      await expect
        .soft(
          confidenceLevelText,
          `Expected "--" for ${countryName} found: "${confidenceLevelText}"`
        )
        .toBe("--");

      console.log(
        predictedRateText === "Unavailable"
          ? `✅ ${countryName} - Rate is 'Unavailable'`
          : `❌ ${countryName} - Rate is '${predictedRateText}'`
      );
      console.log(
        confidenceLevelText === "--"
          ? `✅ ${countryName} - Confidence is '--'`
          : `❌ ${countryName} - Confidence is '${confidenceLevelText}'`
      );
    }
  }

  /**
   * @description Validates the cargo value field and returns the selected option text
   * @author Deepak Bohra
   * @modified : 2025-07-30
   */
  async validateCargoValue() {
    await this.cargoValue_LOC.waitFor({
      state: "visible",
      timeout: WAIT.DEFAULT,
    });
    const value = await this.cargoValue_LOC.inputValue();
    console.log(`Cargo Value: ${value}`);
    const numericValue = Number(value.replace(/[^0-9.]/g, ""));
    // Use soft assertion for numeric value validation
    const optionText = await this.cargoValue_LOC
      .locator(`option[value="${numericValue}"]`)
      .textContent();
    console.log(`Selected Option Text: ${optionText}`);
    // Log validation results
    console.log(
      "Cargo Value validation completed - check test results for any failures"
    );
    return optionText;
  }

  /**
   * @description Validates Offer Rate, Expiration Date, and Expiration Time using direct DOM access
   * @author Deepak Bohra
   */
  async validateDFBTextFieldsWithDOM(dollarValue: string): Promise<{
    offerRate: string;
    expirationDate: string;
    expirationTime: string;
  }> {
    const offerRateValue = await this.page.evaluate(
      (id) => (document.getElementById(id) as HTMLInputElement)?.value || "",
      DFBLOAD_FORM.CARRIER
    );
    

      const expirationDateValue = await this.page.evaluate(
      (id) => (document.getElementById(id) as HTMLInputElement)?.value || "",
      DFBLOAD_FORM.EXPIRATION_DATE
    );
   
      const expirationTimeValue = await this.page.evaluate(
      (id) => (document.getElementById(id) as HTMLInputElement)?.value || "",
      DFBLOAD_FORM.EXPIRATION_TIME
    );
    console.log(`Offer Rate Field Value: ${offerRateValue}`);
    console.log(`Expiration Date Field Value: ${expirationDateValue}`);
    console.log(`Expiration Time Field Value: ${expirationTimeValue}`);

    expect(
      offerRateValue,
      `Offer Rate should be ${dollarValue} and found ${offerRateValue}`
    ).toBe(dollarValue);
    expect(
      expirationDateValue,
      `Expiration Date should be empty and found ${expirationDateValue}`
    ).toBe("");
    expect(
      expirationTimeValue,
      `Expiration Time should be empty and found${expirationTimeValue}`
    ).toBe("");

    return {
      offerRate: offerRateValue,
      expirationDate: expirationDateValue,
      expirationTime: expirationTimeValue,
    };
  }
  /**
   * @description Validates that DFB text fields are empty
   * @author Deepak Bohra
   * @modified : 2025-07-30
   */
  async validateDFBTextFieldAreEmpty() {
    const locators = [
      { name: "Offer Rate", locator: this.offerRateValue_LOC },
      { name: "Expiration Date", locator: this.expirationDateValue_LOC },
      { name: "Expiration Time", locator: this.expirationTimeValue_LOC },
    ];

    for (const { name, locator } of locators) {
      await locator.waitFor({ state: "visible" });
      const fieldValue = await locator.evaluate((element) => {
        const hasValueAttribute = element.hasAttribute("value");
        if (hasValueAttribute) {
          return element.getAttribute("value") || "";
        } else {
          return ""; // Return blank if value attribute is not present
        }
      });
      console.log(`${name} Field Value: "${fieldValue}"`);
      // Use soft assertion - continues execution even if it fails
      await expect
        .soft(
          fieldValue,
          `${name} field should be empty found: "${fieldValue}"`
        )
        .toBe("");
      if (fieldValue === "") {
        console.log(`✅ ${name} field is empty as expected`);
      } else {
        console.log(
          `❌ ${name} field is NOT empty - contains: "${fieldValue}"`
        );
      }
    }
  }

  /**
   * @description Validates that DFB text fields have expected values
   * @author Deepak Bohra
   * @created : 2025-09-04
   * @param expectedValues - Object containing expected values for each field
   */
  async validateDFBTextFieldHaveExpectedValues(expectedValues: {
    offerRate: string;
    expirationDate: string;
    expirationTime: string;
  }): Promise<void> {
    const locators = [
      {
        name: "Offer Rate",
        locator: this.offerRateValue_LOC,
        expected: expectedValues.offerRate,
      },
      {
        name: "Expiration Date",
        locator: this.expirationDateValue_LOC,
        expected: expectedValues.expirationDate,
      },
      {
        name: "Expiration Time",
        locator: this.expirationTimeValue_LOC,
        expected: expectedValues.expirationTime,
      },
    ];

    for (const { name, locator, expected } of locators) {
      await locator.waitFor({ state: "visible" });
      const fieldValue = await locator.evaluate((element) => {
        const hasValueAttribute = element.hasAttribute("value");
        if (hasValueAttribute) {
          return element.getAttribute("value") || "";
        } else {
          return "";
        }
      });

      console.log(
        `${name} Field Value: "${fieldValue}" | Expected: "${expected}"`
      );

      // Use soft assertion - continues execution even if it fails
      await expect
        .soft(
          fieldValue,
          `${name} field should have value "${expected}" but found: "${fieldValue}"`
        )
        .toBe(expected);

      if (fieldValue === expected) {
        console.log(`✅ ${name} field has expected value: "${fieldValue}"`);
      } else {
        console.log(
          `❌ ${name} field mismatch - Expected: "${expected}", Found: "${fieldValue}"`
        );
      }
    }
  }

  /**
   * @description Validates that form fields are empty or blank
   * @author Deepak Bohra
   * @modified : 2025-07-30
   */
  async getFieldValueOrBlank(): Promise<void> {
    const locators = [
      { name: "Include Carriers", locator: this.includeCarriersValue_LOC },
      { name: "Exclude Carriers", locator: this.excludeCarriersValue_LOC },
      { name: "Email Notification", locator: this.emailNotificationValue_LOC },
      { name: "Commodity", locator: this.commodityDropdown_LOC },
    ];

    for (const { name, locator } of locators) {
      await locator.waitFor({ state: "visible" });
      const fieldValue = await locator.evaluate((element, selector) => {
        const tagName = element.tagName.toLowerCase();

        // Handle dropdown/select elements
        if (tagName === "select") {
          const selectedOption = element.querySelector(selector);
          return selectedOption
            ? selectedOption.getAttribute("value") || ""
            : "";
        } // Handle input fields
        const hasValueAttribute = element.hasAttribute("value");
        return hasValueAttribute ? element.getAttribute("value") || "" : "";
      }, this.optionSelectedDropdown_LOC);

      console.log(`${name} Field Value: "${fieldValue}"`);
      await expect
        .soft(
          fieldValue,
          `${name} field should be empty found contains: "${fieldValue}"`
        )
        .toBe("");

      if (fieldValue === "") {
        console.log(`✅ ${name} field is empty as expected`);
      } else {
        console.log(
          `❌ ${name} field is NOT empty - contains: "${fieldValue}"`
        );
      }
    }
  }

  /**
   * @description Simple validation for form fields - checks expected values (undefined means should be empty)
   * @author Deepak Bohra
   * @modified : 2025-10-10
   * @param expectedValues - Object with expected values (undefined = should be empty)
   */
  async validateFormFieldsState(expectedValues?: {
    includeCarriers?: string | string[];
    excludeCarriers?: string;
    emailNotification?: string;
    commodity?: string;
  }): Promise<void> {
    const fields = [
      {
        name: "Include Carriers",
        locator: this.includeCarriersValue_LOC,
        key: "includeCarriers",
      },
      {
        name: "Exclude Carriers",
        locator: this.excludeCarriersValue_LOC,
        key: "excludeCarriers",
      },
      {
        name: "Email Notification",
        locator: this.emailNotificationValue_LOC,
        key: "emailNotification",
      },
      {
        name: "Commodity",
        locator: this.commodityDropdown_LOC,
        key: "commodity",
      },
    ];

    for (const { name, locator, key } of fields) {
      await locator.waitFor({ state: "visible" });

      let value: string | string[];
      if (key === "includeCarriers") {
        // For multi-select, get all selected options as array
        value = await locator.evaluate((el) => {
          if (el.tagName.toLowerCase() === "select") {
            const selectEl = el as HTMLSelectElement;
            const selectedOptions = Array.from(
              selectEl.selectedOptions
            ) as HTMLOptionElement[];
            return selectedOptions.map((opt) => opt.textContent?.trim() || "");
          }
          // For input, fallback to value attribute as array
          const val = el.getAttribute("value") || "";
          return val ? [val] : [""];
        });
      } else {
        value = await locator.evaluate((el, selector) => {
          return el.tagName.toLowerCase() === "select"
            ? el.querySelector(selector)?.getAttribute("value") || ""
            : el.getAttribute("value") || "";
        }, this.optionSelectedDropdown_LOC);
      }

      // Default expected to "" if not provided
      let expected = expectedValues?.[key as keyof typeof expectedValues];
      if (expected === undefined) {
        expected = "";
      }

      if (key === "includeCarriers" && Array.isArray(value)) {
        // If expected is "" (empty string), treat [] (empty array) as equal
        if (expected === "" && value.length === 0) {
          console.log(`${name}: [] | Expected: "" (treated as equal)`);
          await expect
            .soft(
              "",
              `${name} validation for empty array treated as empty string`
            )
            .toBe("");
          console.log(`✅ ${name} empty as expected`);
        } else if (Array.isArray(expected)) {
          // Extract only carrier names before '(' and trim
          const actualNames = value.map((v) => v.split("(")[0].trim());
          const expectedNames = expected.map((v) => v.trim());
          const missing = expectedNames.filter(
            (carrier) => !actualNames.includes(carrier)
          );
          console.log(`${name}:`, actualNames, "| Expected:", expectedNames);
          await expect
            .soft(
              missing.length,
              `${name} missing expected carriers: ${missing.join(", ")}`
            )
            .toBe(0);
          const isCorrect = missing.length === 0;
          console.log(
            `${isCorrect ? "✅" : "❌"} ${name} ${
              isCorrect ? "correct" : "missing: " + missing.join(", ")
            }`
          );
        } else {
          // Fallback: compare joined string
          const actualStr = value.join(", ");
          console.log(`${name}: "${actualStr}" | Expected: "${expected}"`);
          await expect
            .soft(actualStr, `${name} validation failed`)
            .toBe(expected ?? "");
          const isCorrect = actualStr === expected;
          console.log(
            `${isCorrect ? "✅" : "❌"} ${name} ${
              isCorrect ? "correct" : "failed"
            }`
          );
        }
      } else {
        console.log(`${name}: "${value}" | Expected: "${expected}"`);
        await expect
          .soft(value, `${name} validation failed`)
          .toBe(expected ?? "");
        const isCorrect = value === expected;
        console.log(
          `${isCorrect ? "✅" : "❌"} ${name} ${
            isCorrect ? "correct" : "failed"
          }`
        );
      }
    }
  }

  /**
   * @description Validates that the notes field is empty
   * @author Deepak Bohra
   *  @modified : 2025-07-30
   */
  async validateNotesFieldIsEmpty(): Promise<void> {
    await this.notesValue_LOC.waitFor({ state: "visible" });
    const notesValue = await this.notesValue_LOC.evaluate((element) => {
      return (element.textContent || "").trim();
    });
    console.log(`Notes Field Value: "${notesValue}"`);

    // Use soft assertion - continues execution even if it fails
    await expect
      .soft(
        notesValue,
        `Notes field should be empty and found : "${notesValue}"`
      )
      .toBe("");

    if (notesValue === "") {
      console.log(`✅ Notes field is empty as expected`);
    } else {
      console.log(`❌ Notes field is NOT empty - contains: "${notesValue}"`);
    }
  }

  /**
   * @description Performs complete load validation after creation including all field validations
   * @author Deepak Bohra
   * @modified : 2025-07-30
   */
  async performCompleteLoadValidation(
    expectedCargoValue: string,
    countryValue: string
  ) {
    await this.validatePredictedRateAndConfidence(countryValue);
    const value = await this.validateCargoValue();

    await expect
      .soft(
        value,
        `Cargo Value Field - Expected: "${expectedCargoValue}", Found: "${value}"`
      )
      .toBe(expectedCargoValue);
    if (value === expectedCargoValue) {
      console.log(
        `✅ Cargo value matches - Expected: "${expectedCargoValue}", Found: "${value}"`
      );
    } else {
      console.log(
        `❌ Cargo value mismatch - Expected: "${expectedCargoValue}", Found: "${value}"`
      );
    }
    await this.validateDFBTextFieldAreEmpty();
    await this.getFieldValueOrBlank();
    await this.validateNotesFieldIsEmpty();
    return value;
  }

  /**
   * @description Performs complete load validation after creation including all field validations (Green Screen)
   * @author Deepak Bohra
   * @modified : 2025-07-30
   */
  async performCompleteLoadValidationGreenScreen(expectedCargoValue: string) {
    const value = await this.validateCargoValue();
    await expect
      .soft(
        value,
        `Cargo Value Field - Expected: "${expectedCargoValue}", Found: "${value}"`
      )
      .toBe(expectedCargoValue);
    if (value === expectedCargoValue) {
      console.log(
        `✅ Cargo value matches - Expected: "${expectedCargoValue}", Found: "${value}"`
      );
    } else {
      console.log(
        `❌ Cargo value mismatch - Expected: "${expectedCargoValue}", Found: "${value}"`
      );
    }
    await this.getFieldValueOrBlank();
    await this.validateNotesFieldIsEmpty();
    return value;
  }

  // Function to get the Green Screen confidence level as a number
  /**
   * @description Gets the Green Screen confidence level as a number
   * @author Deepak Bohra
   * @modified : 2025-07-30
   */
  async getGreenScreenConfidenceLevelValue(): Promise<number> {
    await this.greenScreenConfidenceLevelValue_LOC.waitFor({
      state: "visible",
    });
    const confidenceText =
      await this.greenScreenConfidenceLevelValue_LOC.textContent();
    console.log(`Green Screen Confidence Level: ${confidenceText}`);
    return Number(confidenceText?.replace(/[^0-9.]/g, ""));
  }

  // Function to assert the confidence level is >= minValue (pure validation, value must be passed in)
  /**
   * @description Asserts the Green Screen confidence level is greater than or equal to a minimum value
   * @author Deepak Bohra
   * @modified : 2025-07-30
   */
  async assertGreenScreenConfidenceLevel(
    confidenceNumber: number,
    minValue: number = 76
  ): Promise<void> {
    expect
      .soft(
        confidenceNumber,
        `Green Screen Confidence Level should be >= ${minValue}, and  found ${confidenceNumber}`
      )
      .toBeGreaterThanOrEqual(minValue);
  }

  /**
   * @description Asserts the Green Screen confidence level is less than a minimum value
   * @author Parth Rastogi
   * @modified : 2025-10-27
   */
  async verifyGreenScreenConfidenceLevelBelow76(
    confidenceNumber: number,
    minValue: number = 76
  ): Promise<void> {
    expect
      .soft(
        confidenceNumber,
        `Green Screen Confidence Level should be < ${minValue}, and  found ${confidenceNumber}`
      )
      .toBeLessThan(minValue);
  }

  /**
   * @description Validates alert and extracts dollar value from the alert message
   * @author Deepak Bohra
   * @modified : 2025-07-30
   */
  async getDollarValueFromAlert(pattern: string | RegExp): Promise<string> {
    const message = await commonReusables.validateAlert(this.page, pattern);
    if (!message) throw new Error("No alert message received.");
    const dollarValue = commonReusables.extractAndLogDollarValue(message);
    if (!dollarValue)
      throw new Error(
        "Dollar value could not be extracted from the alert message."
      );
    return dollarValue;
  }

  /**
   *
   * @author Deepak Bohra
   * @description Enter value into the Offer Rate
   * @created : 2025-08-28
   */
  async clickOnPostButton() {
    await this.postButton_LOC.click();
  }
  /**
   * @description Validates that specified fields ARE editable
   * @author Deepak Bohra
   * @created : 2025-09-04
   * @param fieldNames - Array of field names to check for editability
   */
  async validateFieldsAreEditable(fieldNames: string[]): Promise<void> {
    const fieldMap = {
      [DFB_FORM_FIELDS.Include_Carriers]: this.includeCarriersValue_LOC,
      [DFB_FORM_FIELDS.Exclude_Carriers]: this.excludeCarriersValue_LOC,
    };

    for (const fieldName of fieldNames) {
      const locator = fieldMap[fieldName as keyof typeof fieldMap];
      if (!locator) continue;

      await locator.waitFor({ state: "visible" });

      // Simple check: field should not be disabled
      const isEditable = await locator.evaluate(
        (el) => !el.hasAttribute("disabled") && !el.hasAttribute("readonly")
      );

      console.log(
        `${fieldName}: ${isEditable ? "✅ Editable" : "❌ Not editable"}`
      );

      await expect
        .soft(isEditable, `${fieldName} should be editable`)
        .toBe(true);
    }
  }

  /**
   * @description Validates that specified fields are NOT editable (disabled/readonly)
   * @author Deepak Bohra
   * @created : 2025-09-09
   * @param fieldNames - Array of field names to check for non-editability
   */
  async validateFieldsAreNotEditable(fieldNames: string[]): Promise<void> {
    const fieldMap = {
      [DFB_FORM_FIELDS.Email_Notification]: this.emailNotificationValue_LOC,
      [DFB_FORM_FIELDS.Expiration_Date]: this.expirationDateValue_LOC,
      [DFB_FORM_FIELDS.Expiration_Time]: this.expirationTimeValue_LOC,
      [DFB_FORM_FIELDS.Commodity]: this.commodityDropdown_LOC,
      [DFB_FORM_FIELDS.NOTES]: this.notesValue_LOC,
      [DFB_FORM_FIELDS.Include_Carriers]: this.includeCarriersValue_LOC,
      [DFB_FORM_FIELDS.Exclude_Carriers]: this.excludeCarriersValue_LOC,
    };

    for (const fieldName of fieldNames) {
      const locator = fieldMap[fieldName as keyof typeof fieldMap];
      if (!locator) continue;

      await locator.waitFor({ state: "visible" });

      // Check if field is disabled using multiple methods
      const isNotEditable = await locator.evaluate((el) => {
        // Check for traditional disabled/readonly attributes
        const hasDisabledAttribute =
          el.hasAttribute("disabled") || el.hasAttribute("readonly");

        // Check for CSS-based disabled states
        const computedStyle = window.getComputedStyle(el);
        const hasPointerEventsNone = computedStyle.pointerEvents === "none";
        const hasNotAllowedCursor = computedStyle.cursor === "not-allowed";

        // Check for disabled property (for form elements)
        const isPropertyDisabled = (
          el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        ).disabled;

        return (
          hasDisabledAttribute ||
          hasPointerEventsNone ||
          hasNotAllowedCursor ||
          isPropertyDisabled
        );
      });

      console.log(
        `${fieldName}: ${isNotEditable ? "✅ Not editable" : "❌ Editable"}`
      );

      await expect
        .soft(isNotEditable, `${fieldName} should NOT be editable`)
        .toBe(true);
    }
  }

  /**
   * @description Validates if a button with specific text is activated/enabled or disabled
   * @author Deepak Bohra
   * @created : 2025-09-04
   * @param buttonText - The text of the button to check (e.g., "Clear Form", "Post", "Create Rule")
   * @param shouldBeActivated - true if button should be enabled, false if should be disabled
   */
  async validateButtonActivation(
    buttonText: string,
    shouldBeActivated: boolean = true
  ): Promise<void> {
    const buttonLocator = this.dfbButton_LOC(buttonText);
    await buttonLocator.waitFor({ state: "visible" });
    const isDisabled = await buttonLocator.evaluate((el) => {
      return (
        el.hasAttribute("disabled") ||
        (el as HTMLButtonElement).disabled ||
        el.getAttribute("disabled") === "disabled"
      );
    });
    const isActivated = !isDisabled;
    console.log(
      `${buttonText} Button: ${isActivated ? "Activated" : "Disabled"}`
    );
    await expect
      .soft(
        isActivated,
        `${buttonText} button should be ${
          shouldBeActivated ? "activated" : "disabled"
        }`
      )
      .toBe(shouldBeActivated);
  }


   /**
   * @description Get the current values of DFB form fields including Email Notification, Offer Rate, Commodity, Include/Exclude Carriers, and Notes
   * @author Deepak Bohra
   * @created : 2025-01-02
   * @returns Promise<{emailNotification: string, offerRate: string, commodity: string, includeCarriers: string, excludeCarriers: string, notes: string}> - Returns all field values
   */
  async getDFBFormFieldValues(): Promise<{
    emailNotification: string;
    offerRate: string;
    commodity: string;
    includeCarriers: string;
    excludeCarriers: string;
    notes: string;
  }> {
    try {
      // Wait for all fields to be visible
      await this.emailNotificationValue_LOC.waitFor({ state: "visible" });
      await this.offerRateValue_LOC.waitFor({ state: "visible" });
      await this.commodityDropdown_LOC.waitFor({ state: "visible" });
      await this.includeCarriersValue_LOC.waitFor({ state: "visible" });
      await this.excludeCarriersValue_LOC.waitFor({ state: "visible" });
      await this.notesValue_LOC.waitFor({ state: "visible" });

      // Get all field values in parallel
      const [
        emailNotificationValue,
        offerRateValue,
        commodityValue,
        includeCarriersValue,
        excludeCarriersValue,
        notesValue,
      ] = await Promise.all([
        this.emailNotificationValue_LOC.evaluate((element) => {
          const hasValueAttribute = element.hasAttribute("value");
          return hasValueAttribute ? element.getAttribute("value") || "" : "";
        }),
        this.offerRateValue_LOC.evaluate((element) => {
          const hasValueAttribute = element.hasAttribute("value");
          return hasValueAttribute ? element.getAttribute("value") || "" : "";
        }),
        this.commodityDropdown_LOC.evaluate((element) => {
          const tagName = element.tagName.toLowerCase();
          if (tagName === "select") {
            const selectElement = element as HTMLSelectElement;
            const selectedOption =
              selectElement.querySelector("option[selected]") ||
              selectElement.options[selectElement.selectedIndex];
            return selectedOption
              ? selectedOption.textContent?.trim() || ""
              : "";
          }
          const hasValueAttribute = element.hasAttribute("value");
          return hasValueAttribute ? element.getAttribute("value") || "" : "";
        }),
        this.includeCarriersValue_LOC.evaluate((element) => {
          const hasValueAttribute = element.hasAttribute("value");
          return hasValueAttribute ? element.getAttribute("value") || "" : "";
        }),
        this.excludeCarriersValue_LOC.evaluate((element) => {
          const hasValueAttribute = element.hasAttribute("value");
          return hasValueAttribute ? element.getAttribute("value") || "" : "";
        }),
        this.notesValue_LOC.evaluate((element) => {
          const tagName = element.tagName.toLowerCase();
          if (tagName === "textarea") {
            const textareaElement = element as HTMLTextAreaElement;
            return (
              textareaElement.textContent?.trim() || textareaElement.value || ""
            );
          }
          const hasValueAttribute = element.hasAttribute("value");
          return hasValueAttribute ? element.getAttribute("value") || "" : "";
        }),
      ]);

      console.log(
        `Email Notification Field Value: "${emailNotificationValue}"`
      );
      console.log(`Offer Rate Field Value: "${offerRateValue}"`);
      console.log(`Commodity Field Value: "${commodityValue}"`);
      console.log(`Include Carriers Field Value: "${includeCarriersValue}"`);
      console.log(`Exclude Carriers Field Value: "${excludeCarriersValue}"`);
      console.log(`Notes Field Value: "${notesValue}"`);

      return {
        emailNotification: emailNotificationValue,
        offerRate: offerRateValue,
        commodity: commodityValue,
        includeCarriers: includeCarriersValue,
        excludeCarriers: excludeCarriersValue,
        notes: notesValue,
      };
    } catch (error) {
      console.error(`❌ Failed to get DFB form field values: ${error}`);
      throw error;
    }
  }

  /* * @description Validates multiple buttons activation state
   * @author Deepak Bohra
   * @created : 2025-09-04
   * @param buttonTexts - Array of button texts to validate
   * @param shouldBeActivated - Expected state for all buttons
   */
  async validateMultipleButtonActivation(
    buttonTexts: string[],
    shouldBeActivated: boolean = true
  ): Promise<void> {
    console.log(
      `Validating ${buttonTexts.length} buttons: ${buttonTexts.join(", ")}`
    );
    for (const buttonText of buttonTexts) {
      try {
        await this.validateButtonActivation(buttonText, shouldBeActivated);
      } catch (error) {
        console.log(`❌Failed to validate button "${buttonText}": ${error}`);
        throw error;
      }
    }
    console.log(`✅ Completed validation of all ${buttonTexts.length} buttons`);
  }

  /**
   * @description Validates mixed button states (some activated, some disabled)
   * @author Deepak Bohra
   * @created : 2025-09-04
   * @param buttonStates - Object with button text as key and expected state as value (true = activated, false = disabled)
   */
  async validateMixedButtonStates(
    buttonStates: Record<string, boolean>
  ): Promise<void> {
    console.log(" Validating mixed button states...");
    await commonReusables.waitForAllLoadStates(this.page);
    for (const [buttonText, shouldBeActivated] of Object.entries(
      buttonStates
    )) {
      try {
        await this.validateButtonActivation(buttonText, shouldBeActivated);
      } catch (error) {
        console.log(`❌ Failed to validate button "${buttonText}": ${error}`);
        throw error;
      }
    }

    console.log("Mixed button states validation completed");
  }

  /**
   * @description Hovers over the posted icon to reveal additional information
   * @author Deepak Bohra
   * @created : 2025-09-04
   */
  async hoverOverPostedIcon() {
    await this.hoverOver_LOC.waitFor({ state: "visible", timeout: WAIT.SMALL });
    await this.hoverOver_LOC.hover();
  }

  /**
   * @description Validates table fields against expected values
   * @author Deepak Bohra
   * @created : 2025-09-04
   * @created: 2025-10-06
   */
  async validateTableFields(
    page: Page,
    expectedValues: Record<string, string | ((actual: string) => boolean)>
  ) {
    // Wait for table to be visible
    await this.dataTableText_LOC.waitFor({ state: "visible" });
    await page.waitForLoadState("domcontentloaded");
    const tableRows = this.dataTableRows_LOC;
    const rowCount = await tableRows.count();
    console.log(`Found ${rowCount} rows in the table.`);
    // Print first row data if it exists
    if (rowCount > 0) {
      const firstRowCells = tableRows.first().locator("td");
      const firstRowCellCount = await firstRowCells.count();
      if (firstRowCellCount >= 2) {
        const firstLabel = await firstRowCells.nth(0).textContent();
        const firstValue = await firstRowCells.nth(1).textContent();
        console.log(
          `First row data - Label: "${firstLabel?.trim()}", Value: "${firstValue?.trim()}"`
        );
      }
    }

    // Validate each row
    for (let i = 0; i < rowCount; i++) {
      const row = tableRows.nth(i);
      const cells = row.locator("td");
      const cellCount = await cells.count();

      if (cellCount === 2) {
        const label = (await cells.nth(0).textContent())?.trim() || "";
        const value = (await cells.nth(1).textContent())?.trim() || "";

        console.log(`Row ${i + 1}: Label="${label}", Value="${value}"`);

        if (label in expectedValues) {
          const expected = expectedValues[label];
          if (label === "Load Method") {
            // Case-insensitive comparison for Load Method
            const actualLower = value.toLowerCase();
            const expectedLower =
              typeof expected === "string" ? expected.toLowerCase() : expected;
            expect.soft(actualLower).toBe(expectedLower);
            console.log(
              `✅ ${label} (case-insensitive) is valid - Expected: "${expectedLower}", Found: "${actualLower}"`
            );
          } else if (typeof expected === "function") {
            const result = expected(value);
            expect.soft(result).toBe(true);
            console.log(
              `✅ ${label} custom validation result: ${result} - Value: "${value}"`
            );
          } else {
            expect.soft(value).toBe(expected);
            console.log(
              `✅ ${label} is valid - Expected: "${expected}", Found: "${value}"`
            );
          }
        } else {
          console.log(`"${label}" not in expected values, skipping validation`);
          console.log(
            `   Available expected keys: [${Object.keys(expectedValues).join(
              ", "
            )}]`
          );
        }
      }
    }
  }


 /**
   * @description Gets the error message text displayed on the DFB Load Form Page
   * @author Deepak Bohra
   * @created : 2025-12-31
   */

  async getErrorMessageText(): Promise<string> {
    await this.carrierErrorMessage_LOC.waitFor({ state: "visible" });
    const errorMessage = await this.carrierErrorMessage_LOC.textContent();
    console.log(`Error Message Text: "${errorMessage}"`);
    return errorMessage ? errorMessage.trim() : "";
  }


  /**
   * @description Clicks on the Carrier Auto Accept checkbox if not already selected
   * @author Parth Rastogi
   * @created : 2025-12-22
   */
  async clickCarrierAutoAcceptCheckbox() {
    await this.carrierAutoAcceptCheckBox_LOC.isVisible();
    await this.carrierAutoAcceptCheckBox_LOC.isEnabled();
    if(await this.carrierAutoAcceptCheckBox_LOC.isChecked()===false){
      await this.carrierAutoAcceptCheckBox_LOC.click();
      console.log("Clicked on Carrier Auto Accept Checkbox");
    }
  }


   /**
   * @description Selects a carrier contact for rate confirmation from the dropdown
   * @author Parth Rastogi
   * @created : 2025-12-22
   */
  async selectCarreirContactForRateConfirmation(contactName:string){
    //await commonReusables.waitForAllLoadStates(this.page);
    await this.page.waitForTimeout(WAIT.SMALL);
    await this.carrierContactForRateConfirmationDropdown_LOC.waitFor({state:'visible'});
    await this.carrierContactForRateConfirmationDropdown_LOC.isEnabled();
    await this.carrierContactForRateConfirmationDropdown_LOC.selectOption({label:contactName});
    console.log(`Selected Carrier Contact For Rate Confirmation: ${contactName}`);
  }

}

export default DFBLoadFormPage;
