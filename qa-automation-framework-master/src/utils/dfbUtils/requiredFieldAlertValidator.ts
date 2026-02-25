import { expect, Dialog } from "@playwright/test";

/**
 * Common helper for required field alert validation and flow reset
 * @param page Playwright Page object
 * @param field Field config with name and errorMsg
 * @param resetFlowCallback Optional callback to reset flow if Edit Load page is reached
 * @author Deepak Bohra
 * @Created :2025-29-07
 * @modified :2025-14-08
 */
/**
 * @description Validates required field alert and optionally resets the flow if needed
 */
export class RequiredFieldAlertValidator {
  public async validateRequiredFieldAlert(
    page: any,
    createLoadAction: () => Promise<void>,
    field: any,
    resetFlowCallback?: () => Promise<void>
  ) {
    let alertMsg: string | null = null;
    let alertShown = false;
    try {
      await Promise.all([
        page
          .waitForEvent("dialog", { timeout: 3000 })
          .then(async (dialog: Dialog) => {
            alertShown = true;
            alertMsg = dialog.message();
            await expect
              .soft(
                alertMsg,
                `Alert for ${field.name} - Expected: "${field.errorMsg}", Found: "${alertMsg}"`
              )
              .toBe(field.errorMsg);
            //console.log(`\x1b[36m\n=== Alert Validation ===\nField: ${field.name}\nExpected: "${field.errorMsg}"\nFound: "${alertMsg}"\n=======================\x1b[0m`);
            if (alertMsg === field.errorMsg) {
              // Success: print in cyan
              console.log(
                `\x1b[36m\n=== Alert Validation ===\nField: ${field.name}\nExpected: "${field.errorMsg}"\nFound: "${alertMsg}"\n=======================\x1b[0m`
              );
            } else {
              // Failure: print in red
              console.log(
                `\x1b[31m\n=== Alert Validation FAILED ===\nField: ${field.name}\nExpected: "${field.errorMsg}"\nFound: "${alertMsg}"\n===============================\x1b[0m`
              );
            }
            await dialog.accept();
          }),
        createLoadAction(),
      ]);
    } catch (e) {
      console.log(
        `\x1b[33mNo alert appeared for ${field.name} after clicking Create Load.\x1b[0m`
      );
      await expect
        .soft(
          alertMsg,
          `Alert for ${field.name} - Expected: "${field.errorMsg}", Found: "${alertMsg}"`
        )
        .toBe(field.errorMsg);
      if (resetFlowCallback) await resetFlowCallback();
    }
    return alertShown;
  }
  /*
   * @author Deepak Bohra
   * @Created :2025-29-07
   * @modified :2025-14-08
   */
  /**
   * @description Validates invalid required field alert and optionally resets the flow if needed
   */

  public async invalidValidateRequiredFieldAlert(
    page: any,
    createLoadAction: () => Promise<void>,
    field: any,
    resetFlowCallback?: () => Promise<void>
  ) {
    let alertMsg: string | null = null;
    try {
      await Promise.all([
        page
          .waitForEvent("dialog", { timeout: 3000 })
          .then(async (dialog: Dialog) => {
            alertMsg = dialog.message();
            await expect
              .soft(
                alertMsg,
                `Alert for ${field.name} - Expected: "${field.errorMsg}", Found: "${alertMsg}"`
              )
              .toBe(field.errorMsg);
            console.log(
              `\x1b[36m\n=== Alert Validation ===\nField: ${field.name}\nExpected: "${field.errorMsg}"\nFound: "${alertMsg}"\n=======================\x1b[0m`
            );
            await dialog.accept();
          }),
        createLoadAction(),
      ]);
    } catch (e) {
      console.log(
        `\x1b[33mNo alert appeared for ${field.name} after clicking Create Load.\x1b[0m`
      );
      await expect
        .soft(
          alertMsg,
          `Alert for ${field.name} - Expected: "${field.errorMsg}", Found: "${alertMsg}"`
        )
        .toBe(field.errorMsg);
      if (resetFlowCallback) await resetFlowCallback();
    }
  }

  /*
   * @author Deepak Bohra
   * @Created :2025-29-07
   * @modified :2025-14-08
   */
  
  public async validateFieldErrorMessage(
    actual: string,
    expected: string,
    testInfo: string
  ) {
    console.log(`\n ${testInfo}:`);
    console.log(`   Expected: "${expected}"`);
    console.log(`   Actual: "${actual}"`);

    try {
      expect(actual).toContain(expected);
      console.log(`   ✅ PASSED`);
    } catch (error) {
      console.log(`   ❌ FAILED`);
      throw error;
    }
  }
}

const requiredFieldAlertValidator = new RequiredFieldAlertValidator();
export default requiredFieldAlertValidator;
