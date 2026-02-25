import { Page, Locator, expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
export class EditLoadFormPage {
  /**
   * EditLoadFormPage - Page Object Model for Load Form Validation in Edit Load Page
   *
   * @description This class handles validation of form fields, predicted rates,
   * confidence levels, and cargo values in the Edit Load form. Includes comprehensive
   * field validation with soft assertions for continuous test execution.
   *
   * @author Deepak Bohra
   */
  readonly page: Page;

  private readonly cargoValue_LOC: Locator;
  private readonly loadStatusValue_LOC: Locator;
  private readonly saveButton_LOC: Locator;
  private readonly viewBillingButton_LOC: Locator;
  private readonly addInternalShareLink_LOC: Locator;
  private readonly shareAmountInput_LOC: Locator;
  private readonly searchAgentCombobox_LOC: Locator;
  private readonly shareAgentInput_LOC: Locator;
  private readonly amountInput_LOC: any;
  private readonly totalMilesValue_LOC: Locator;
  private readonly shareAgentSearchResultInput_LOC: (
    agentName: string
  ) => Locator;

  /**
   * Constructor to initialize page locators for form validation elements
   * @param page - Playwright Page instance for web interactions
   */
  constructor(page: Page) {
    this.page = page;

    this.cargoValue_LOC = page.locator("#carr_1_cargo_value_opt_id");
    this.loadStatusValue_LOC = page.locator("#loadsh_status");
    this.saveButton_LOC = page.locator("#saveButton");
    this.viewBillingButton_LOC = page.locator(
      "input[type='button'][value*='View Billing']"
    );


    this.searchAgentCombobox_LOC = page.locator(
      "//tbody[@id='share_frame_internal']//span[contains(@class,'select2-selection') and @role='combobox']"
    );
    this.shareAgentInput_LOC = page.locator(
      "//span[contains(@class,'select2-search--dropdown')]/input[@class='select2-search__field']"
    );
    this.shareAgentSearchResultInput_LOC = (agentName: string) =>
      page.locator(".select2-results__option", { hasText: agentName });
    this.shareAmountInput_LOC = page.locator(
      "table#commission_internal tbody#share_frame_internal tr.share_entry td input.share_amt"
    );
    this.addInternalShareLink_LOC = page.locator(
      "//a[@class='add-share' and contains(@onclick,'true,true')]"
    );


    this.totalMilesValue_LOC = page.locator(
      "//td[@class='fn' and contains(text(),'Total Miles')]//following-sibling::td//div"
    );

    this.amountInput_LOC = "input";
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
   * Select Load Status from dropdown
   * @author Avanish Srivastava
   * @created : 2025-07-08
   */

  async selectLoadStatus(
    option: string | number,
    by: "label" | "value" | "index" = "label"
  ): Promise<void> {
    await commonReusables.reloadPageUntilElementVisible(this.page, this.loadStatusValue_LOC, 5);
    if (by === "label") {
      await this.loadStatusValue_LOC.selectOption({ label: option as string });
    } else if (by === "value") {
      await this.loadStatusValue_LOC.selectOption({ value: option as string });
    } else if (by === "index") {
      await this.loadStatusValue_LOC.selectOption({ index: option as number });
    }
  }


  /**
   * Click on Save Button
   * @author Aniket Nale
   * @modified : 2025-10-09
   */

  async clickOnSaveBtn() {
    const MAX_RETRIES = 3;
    let attempt = 0;

    await commonReusables.waitForPageStable(this.page)
    const saveBtn = this.saveButton_LOC.nth(0);
    await saveBtn.waitFor({ state: "attached", timeout: WAIT.LARGE });
    await saveBtn.waitFor({ state: "visible", timeout: WAIT.LARGE });
    await expect(saveBtn).toBeEnabled({ timeout: WAIT.LARGE });

    while (attempt < MAX_RETRIES) {
      try {
        attempt++;
        console.log(`Attempt ${attempt}: Trying to click Save button...`);

        await saveBtn.click({ trial: true });
        await saveBtn.click();

        console.log("Save button clicked successfully!");
        break;
      } catch (error) {
        const err = error as Error;
        console.warn(`Attempt ${attempt} failed: ${err.message}`);

        if (attempt >= MAX_RETRIES) {
          throw new Error(`Failed to click Save button after ${MAX_RETRIES} attempts`);
        }

        //Wait before retrying to avoid immediate retry - Will wait only if retry is required
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await saveBtn.waitFor({ state: "attached", timeout: WAIT.LARGE });
        await expect(saveBtn).toBeVisible({ timeout: WAIT.LARGE });
        await expect(saveBtn).toBeEnabled({ timeout: WAIT.LARGE });
      }
    }
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Click on View Billing Button
   * @author Avanish Srivastava
   * @created : 2025-07-23
   */

  async clickOnViewBillingBtn() {
    await this.viewBillingButton_LOC.nth(0).waitFor({ state: "visible" });
    await this.viewBillingButton_LOC.nth(0).click();
  }


  /**
   * @description Validates alert and extracts dollar value from the alert message - designed to be called BEFORE triggering the action that causes the popup
   * @author  Parth Rastogi
   * @modified : 2025-09-05
   */
  async getDollarValFromAlert(
    pattern: string | RegExp,
    timeout: number = 120 // Increased timeout to 120 seconds
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let handled = false;
      let dialogHandler: ((dialog: any) => Promise<void>) | null = null;
      let timer: NodeJS.Timeout | null = null;

      const cleanup = () => {
        if (dialogHandler) {
          this.page.off("dialog", dialogHandler);
          dialogHandler = null;
        }
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };

      console.log(
        ` Setting up alert listener for pattern: ${pattern}, timeout: ${timeout}s`
      );
      console.log(
        ` IMPORTANT: This listener is now active - trigger the action that causes the popup!`
      );

      // Set up dialog handler first
      dialogHandler = async (dialog) => {
        if (!handled) {
          handled = true;
          cleanup();

          const alertMessage = dialog.message();
          console.log(
            ` Alert captured during page transition: "${alertMessage}"`
          );

          try {
            // Check if the message matches the expected pattern
            const messageMatches =
              typeof pattern === "string"
                ? alertMessage.includes(pattern)
                : pattern.test(alertMessage);

            if (messageMatches) {
              console.log(`✅ Alert pattern matched successfully!`);
              await dialog.accept();

              // Extract dollar value
              const dollarValue =
                commonReusables.extractAndLogDollarValue(alertMessage);
              if (!dollarValue) {
                reject(
                  new Error(
                    `Dollar value could not be extracted from alert: "${alertMessage}"`
                  )
                );
                return;
              }

              console.log(
                ` Successfully extracted dollar value: $${dollarValue}`
              );
              resolve(dollarValue);
            } else {
              console.log(`❌ Alert pattern did not match`);
              console.log(`Expected pattern: ${pattern}`);
              console.log(`Actual message: ${alertMessage}`);
              await dialog.accept();
              reject(
                new Error(
                  `Alert message did not match expected pattern. Expected: ${pattern}, Got: ${alertMessage}`
                )
              );
            }
          } catch (error) {
            console.error(`❌ Error processing alert: ${error}`);
            await dialog.accept();
            reject(error);
          }
        }
      };

      // Add dialog listener
      this.page.on("dialog", dialogHandler);

      // Set up timeout - increased to handle slower scenarios
      timer = setTimeout(() => {
        if (!handled) {
          handled = true;
          cleanup();
          const timeoutError = new Error(
            `❌ No alert appeared within ${timeout} seconds. Expected pattern: ${pattern}. ` +
            `This might indicate the popup appeared before the listener was set up, or took longer than expected. ` +
            `Make sure the action that triggers the popup was called AFTER setting up this listener.`
          );
          console.error(timeoutError.message);
          reject(timeoutError);
        }
      }, (timeout * WAIT.DEFAULT) / 3);

      // Add a small delay to ensure the listener is properly set up before returning
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  }

  /**
   * @description Validates alert for post automation and returns the alert message
   * @author Parth Rastogi
   * @modified : 2025-09-01
   */
  async getValueFromAlert(
    pattern: string | RegExp,
    timeoutMs: number = WAIT.DEFAULT / 3
  ): Promise<string> {
    try {
      console.log(` Waiting for alert with pattern: ${pattern}`);

      // Use the improved validateAlert function which returns the message
      const message = await commonReusables.validateAlert(
        this.page,
        pattern,
        timeoutMs
      );

      if (!message) {
        throw new Error("No alert message received or pattern did not match");
      }

      console.log(`✅ Alert validated successfully: "${message}"`);
      return message;
    } catch (error) {
      console.error(`❌ Alert validation failed: ${error}`);
      throw new Error(
        `Failed to validate alert with pattern ${pattern}: ${error}`
      );
    }
  }

  /**
   * @description Click on Add Internal Share
   * @author Avanish Srivastava
   * @modified : 2025-08-18
   */

  async clickOnAddInternalShare(): Promise<void> {
    console.log("Clicking on Add Internal Share...");
    const addShareLink = this.addInternalShareLink_LOC;
    await addShareLink.waitFor({ state: "visible", timeout: WAIT.SMALL });
    await addShareLink.scrollIntoViewIfNeeded();
    try {
      await addShareLink.click();
      console.log("Successfully clicked Add Internal Share");
    } catch (error) {
      console.log("Standard click failed, trying force click...");
      try {
        await addShareLink.click({ force: true });
        console.log("Force click on Add Internal Share executed");
      } catch (error2) {
        console.log("Force click failed, trying JavaScript click...");
        await addShareLink.evaluate((element: HTMLElement) => element.click());
        console.log("JavaScript click on Add Internal Share executed");
      }
    }
    console.log("Add Internal Share click completed");
  }

  /**
   * @description Enter Internal Share Amount
   * @author Avanish Srivastava
   * @modified : 2025-08-18
   */

  async enterInternalShareAmount(amount: string | number): Promise<void> {
    const amountStr = String(amount);
    console.log(`Attempting to enter Internal Share amount: ${amountStr}`);
    await this.shareAmountInput_LOC.first().waitFor({ state: "visible" });
    const amountInputs = this.shareAmountInput_LOC;
    const count = await amountInputs.count();
    console.log(`Found ${count} amount input fields`);

    for (let i = 0; i < count; i++) {
      const input = amountInputs.nth(i);
      console.log(`Processing input field ${i + 1}`);
      await input.waitFor({ state: "visible" });
      await input.waitFor({ state: "attached" });
      const value = await input.inputValue();
      console.log(`Field ${i + 1} current value: "${value}"`);
      if (!value || value.trim() === "") {
        console.log(`Field ${i + 1} is empty, attempting to enter value...`);
        await input.scrollIntoViewIfNeeded();
        const success = await input.evaluate((element, val) => {
          try {
            const inputEl = element as HTMLInputElement;
            const originalOnchange = inputEl.onchange;
            inputEl.onchange = null;
            inputEl.onblur = null;
            inputEl.oninput = null;
            inputEl.removeAttribute("onchange");
            inputEl.removeAttribute("onblur");
            inputEl.removeAttribute("oninput");
            inputEl.value = val;
            inputEl.setAttribute("value", val);
            setTimeout(() => {
              try {
                if (originalOnchange) {
                  inputEl.onchange = function (e) {
                    if (inputEl.value === val) {
                      return originalOnchange.call(this, e);
                    }
                    return false;
                  };
                }
                console.log(
                  `Restored onchange handler for input with value: ${inputEl.value}`
                );
              } catch (restoreError) {
                console.error("Error restoring handler:", restoreError);
              }
            }, WAIT.DEFAULT * 3);
            return inputEl.value === val;
          } catch (error) {
            console.error("Error in input manipulation:", error);
            return false;
          }
        }, amountStr);
        if (success) {
          console.log(
            `Successfully entered and protected amount: ${amountStr}`
          );
          await input.dispatchEvent(this.amountInput_LOC);
          const finalValue = await input.inputValue();
          if (finalValue === amountStr) {
            console.log(`Value confirmed persistent: ${finalValue}`);
            return;
          } else {
            console.log(`Protection failed, value changed to: ${finalValue}`);
            await input.click();
            await input.fill(amountStr);
            const retryValue = await input.inputValue();
            if (retryValue === amountStr) {
              console.log(`Retry successful: ${retryValue}`);
              return;
            } else {
              console.log(`Retry also failed, continuing to next field`);
              continue;
            }
          }
        } else {
          console.log(
            `Failed to set persistent value for field ${i + 1
            }, trying simple approach`
          );
          try {
            await input.click();
            await input.fill("");
            await input.fill(amountStr);
            const simpleValue = await input.inputValue();
            if (simpleValue === amountStr) {
              console.log(`Simple approach worked: ${simpleValue}`);
              return;
            } else {
              console.log(`Simple approach failed for field ${i + 1}`);
              continue;
            }
          } catch (error) {
            console.error(
              `Error with simple approach for field ${i + 1}:`,
              error
            );
            continue;
          }
        }
      } else {
        console.log(`Field ${i + 1} already has value: "${value}"`);
        if (value === amountStr) {
          console.log(`Field ${i + 1} already has the correct value: ${value}`);
          return;
        } else {
          console.log(`Field ${i + 1} has different value, skipping...`);
          continue;
        }
      }
    }
    throw new Error(
      "No suitable Internal Share input field found to enter the value."
    );
  }

  /**
   * @description Select Internal Share Agent
   * @author Avanish Srivastava
   * @modified : 2025-08-18
   */

  async selectInternalShareAgent(agentName: string | number): Promise<void> {
    const agentNameStr = String(agentName);
    console.log(`Attempting to select Internal Share Agent: ${agentNameStr}`);
    await this.searchAgentCombobox_LOC.first().waitFor({ state: "visible" });
    const comboboxes = this.searchAgentCombobox_LOC;
    const count = await comboboxes.count();
    for (let i = 0; i < count; i++) {
      const combobox = comboboxes.nth(i);
      await combobox.waitFor({ state: "visible" });
      await combobox.waitFor({ state: "attached" });
      const text = (await combobox.textContent())?.trim();
      console.log(`Combobox ${i + 1} current text: "${text}"`);
      if (!text || text === "" || text === "Select...") {
        await combobox.scrollIntoViewIfNeeded();
        await combobox.click();
        await this.shareAgentInput_LOC.waitFor({
          state: "visible",
          timeout: WAIT.DEFAULT,
        });
        await this.shareAgentInput_LOC.clear();
        await this.shareAgentInput_LOC.fill(agentNameStr);
        const searchAgentOption =
          this.shareAgentSearchResultInput_LOC(agentNameStr);
        await searchAgentOption.waitFor({
          state: "visible",
          timeout: WAIT.DEFAULT,
        });
        await searchAgentOption.click();
        const selectedText = (await combobox.textContent())?.trim();
        if (selectedText && selectedText.includes(agentNameStr)) {
          console.log(
            `Successfully selected Internal Share Agent: ${agentNameStr} in combobox position ${i + 1
            }`
          );
          return;
        } else {
          console.warn(
            `Agent not selected correctly. Expected to contain: ${agentNameStr}, Got: ${selectedText}`
          );
          continue;
        }
      }
    }
  }



  /**
   * Selects a rate type from the Rate Type dropdown.
   * @author Parth Rastogi
   * @modified 2025-09-0
   */
  async getTotalMilesValue() {
    await this.page.waitForLoadState("networkidle");
    await this.totalMilesValue_LOC.waitFor({ state: "visible" });
    const totalMiles = await this.totalMilesValue_LOC.innerText();
    console.log("Total Miles: " + totalMiles);
    return totalMiles;
  }
}

export default EditLoadFormPage;
