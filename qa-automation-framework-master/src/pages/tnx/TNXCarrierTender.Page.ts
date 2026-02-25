import { Locator, Page } from "@playwright/test";

/**
 * Author name: Deepak Bohra
 */
class TNXCarrierTenderPage {
  private readonly tnxElementByText_LOC: (text: string) => Locator;
  private readonly matchSuccessToast_LOC: Locator;

  constructor(private page: Page) {
    this.tnxElementByText_LOC = (text: string) =>
      page.locator(`//*[text()='${text}']`);
    this.matchSuccessToast_LOC = page.locator(
      "//p[@data-testid='e2e-matched-success-toast']"
    );
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
   * @description Click on TNX bidding button with specific button name
   * @author Deepak Bohra
   * @created 2025-08-29
   * @param buttonName - The name/text of the bidding button to click
   */
  async clickTnxBiddingButton(buttonName: string): Promise<void> {
    try {
      await this.page.waitForLoadState("domcontentloaded");
      const biddingButton = this.tnxElementByText_LOC(buttonName);
      await biddingButton.waitFor({ state: "visible" });
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
        timeout: WAIT.DEFAULT,
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
   * @description Validates that the match success toast appears and contains the correct message
   * @author Deepak Bohra
   * @created 2025-09-08
   * @param expectedMessage - The expected success message (default: "You have sucessfully matched the offer.")
   */
  async validateMatchSuccessToast(
    expectedMessage: string = "Matched!"
  ): Promise<void> {
    try {
      console.log("Validating match success toast...");

      // Wait for the toast to appear
      await this.matchSuccessToast_LOC.waitFor({
        state: "visible",
        timeout: WAIT.LARGE,
      });

      // Validate toast is visible
      const isVisible = await this.matchSuccessToast_LOC.isVisible();
      if (!isVisible) {
        throw new Error("Match success toast is not visible");
      }

      console.log("✅ Match success toast is visible");

      // Get the actual message from the toast
      const actualMessage = await this.matchSuccessToast_LOC.textContent();
      const trimmedActualMessage = actualMessage?.trim() || "";

      console.log(`Expected message: "${expectedMessage}"`);
      console.log(`Actual message: "${trimmedActualMessage}"`);

      // Validate the message content
      if (trimmedActualMessage.includes(expectedMessage)) {
        console.log("✅ Match success toast message validation passed");
      } else {
        throw new Error(
          `Match success toast message validation failed. Expected: "${expectedMessage}", but got: "${trimmedActualMessage}"`
        );
      }
    } catch (error) {
      console.error(`❌ Failed to validate match success toast: ${error}`);
      throw error;
    }
  }

  /**
   * @description Waits for the match success toast to disappear (useful for ensuring UI cleanup)
   * @author Deepak Bohra
   * @created 2025-09-08
   * @param timeout - Timeout in milliseconds (default: 15000)
   */
  async waitForMatchSuccessToastToDisappear(
    timeout: number = WAIT.MID
  ): Promise<void> {
    try {
      console.log("Waiting for match success toast to disappear...");

      await this.matchSuccessToast_LOC.waitFor({
        state: "hidden",
        timeout: timeout,
      });

      console.log("✅ Match success toast has disappeared");
    } catch (error) {
      console.log(
        `Match success toast did not disappear within ${timeout}ms - this may be normal behavior`
      );
      // Don't throw error as toast might persist by design
    }
    await this.page.waitForLoadState("domcontentloaded");
  }
}
export default TNXCarrierTenderPage;
