/**
 * EditLoadDropTabPage - Page Object Model for Drop Tab in Edit Load Page
 *
 * @description This class handles all interactions with the Drop tab elements
 * in the Edit Load page, including consignee selection, date/time configuration,
 * and alert handling for mile updates.
 *
 * @author Deepak Bohra
 */

import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

class EditLoadDropTabPage {
  private readonly consigneeAddressDropdown_LOC: (carrierNumber: string) => Locator;
  private readonly dropTabLink_LOC: Locator;
  private readonly actualTimeDropTabInput_LOC: (carrNumber: string) => Locator;
  private readonly actualDateDropTabInput_LOC: (carrNumber: string) => Locator;
  private readonly deadlineDateDropTabInput_LOC: (carrNumber: string) => Locator;
  private readonly deadlineTimeDropTabInput_LOC: (carrNumber: string) => Locator;
  private readonly consigneeInput_LOC: Locator;
  private readonly driverInLink_LOC: Locator;
  private readonly driverOutLink_LOC: Locator;
  private readonly driverInInput_LOC: Locator;
  private readonly driverOutInput_LOC: Locator;
  private readonly consigneeDropdownInput_LOC: (clientName: string, carrierNumber: string) => Locator;
  private readonly driverInDate_LOC: Locator;
  private readonly driverInTime_LOC: Locator;
  private readonly driverOutDate_LOC: Locator;
  private readonly driverOutTime_LOC: Locator
  private readonly saveButton_LOC: Locator;
  /**
   * Constructor to initialize page locators for Drop tab elements
   * @author Deepak Bohra
   * @created 2025-07-23
   */
  constructor(private page: Page) {
    this.dropTabLink_LOC = page.locator("//a[normalize-space()='Drop']");
    this.consigneeAddressDropdown_LOC = (carrierNumber: string) => page.locator(
      `#select2-carr_${carrierNumber}_stop_2_choose-container`
    );
    //Need to update and make it dynamic
    this.consigneeInput_LOC = page.locator(
      "//span[@class='select2-search select2-search--dropdown']//input[@class='select2-search__field']"
    );
    this.actualDateDropTabInput_LOC = (carrNumber: string) => page.locator(`#carr_${carrNumber}_stop_2_date_a`);
    this.actualTimeDropTabInput_LOC = (carrNumber: string) => page.locator(`#carr_${carrNumber}_stop_2_time`);
    this.deadlineDateDropTabInput_LOC = (carrNumber: string) => page.locator(`#carr_${carrNumber}_stop_2_date2_a`);
    this.deadlineTimeDropTabInput_LOC = (carrNumber: string) => page.locator(`#carr_${carrNumber}_stop_2_time2`);
    this.driverInLink_LOC = page.locator("//input[@id='carr_3_stop_2_datein_a']/ancestor::tr/td/a/font");
    this.driverOutLink_LOC = page.locator("//input[@id='carr_3_stop_2_dateout_a']/ancestor::tr/td/a/font");
    this.driverInInput_LOC = page.locator("#carr_3_stop_2_timein");
    this.driverOutInput_LOC = page.locator("#carr_3_stop_2_timeout");
    this.consigneeDropdownInput_LOC = (clientName: string, carrierNumber: string) => page.locator(`//*[@id='select2-carr_${carrierNumber}_stop_2_choose-results']//li//span[text()='${clientName}']`);
    this.driverInDate_LOC = this.page.locator("//input[@id='carr_1_stop_2_datein_a']");
    this.driverInTime_LOC = this.page.locator("//input[@id='carr_1_stop_2_timein']");
    this.driverOutDate_LOC = this.page.locator("//input[@id='carr_1_stop_2_dateout_a']");
    this.driverOutTime_LOC = this.page.locator("//input[@id='carr_1_stop_2_timeout']");
    this.saveButton_LOC = this.page.locator("//input[@id='saveButton']");
  }
  dates = commonReusables.getNextTwoDatesFormatted();
  /**
   * Clicks on the Drop tab to navigate to drop-off configuration section
   * @author Deepak Bohra
   * @created 2025-07-23
   */
  async clickDropTab() {
    await this.dropTabLink_LOC.waitFor({ state: "visible" });
    await this.dropTabLink_LOC.click();
  }

  /**
   * Opens the consignee address dropdown for selection
   * @author Deepak Bohra
   * @created 2025-07-23
   */
  async selectConsigneeAddress(carrNumber: "1" | "3" = "1") {
    await this.page.waitForLoadState("networkidle");
    await console.log("Waiting for con address dropdown to be visible");
    await this.consigneeAddressDropdown_LOC(carrNumber).waitFor({ state: "visible" });
    await this.consigneeAddressDropdown_LOC(carrNumber).click();
    await console.log("Waiting for consignee address dropdown to be visible");
    try {
      await this.consigneeInput_LOC.waitFor({ state: "visible", timeout: WAIT.DEFAULT }); // adjust timeout as needed
    } catch (e) {
      // Element not visible, continue without failing
      console.log("Consignee input not visible, continuing...");
    }

  }

  /**
   * Selects a specific consignee by name from the dropdown list
   * @author Deepak Bohra
   * @created 2025-07-23
   */
  async selectConsigneeByNameConsignee(clientName: string, carrNumber: "1" | "3" = "1") {
    //@modified 2025-12-26 - Added carrier number to select specific carriers
    const clientLocator = await this.consigneeDropdownInput_LOC(clientName, carrNumber);
    await clientLocator.waitFor({ state: "visible" });
    await clientLocator.click();
    await console.log("Waiting for shipper address dropdown to be visible");
  }

  /**
   * Handle Alert / Dialogs
   * @author Avanish Srivastava
   * @modified 2025-08-07
   */

  async alert() {
    await this.page.once("dialog", async (dialog) => {
      await this.page.waitForTimeout(WAIT.DEFAULT); // Wait for the dropdown to settle
      await console.log(dialog.message());
      await this.page.waitForTimeout(WAIT.DEFAULT); // Wait for the dropdown to settle
      await dialog.accept(); // Accept the dialog
    });
  }

  /**
   * Handles alert popup that appears when miles need to be updated
   * @author Deepak Bohra
   * @created 2025-07-23
   */
  async alertPopUp() {
    return new Promise((resolve) => {
      let handled = false;
      let seconds = 0;

      // Listen for alert
      this.page.on("dialog", async (dialog) => {
        if (!handled) {
          handled = true;
          const alertMessage = dialog.message();
          console.log(`Alert: ${alertMessage}`);

          // Validate that alert contains "Update Miles to"
          if (alertMessage.includes("Update Miles to")) {
            console.log(
              "✅ Alert validation PASSED: Contains 'Update Miles to'"
            );
          } else {
            console.log(
              "❌ Alert validation FAILED: Does not contain 'Update Miles to'"
            );
            console.log(`Expected: Message containing 'Update Miles to'`);
            console.log(`Actual: ${alertMessage}`);
          }

          await dialog.accept();
          resolve(alertMessage);
        }
      });

      // Check every second for 10 seconds
      const timer = setInterval(() => {
        seconds++;
        console.log(`Waiting for alert... ${seconds}/10s`);

        if (seconds >= 10 || handled) {
          clearInterval(timer);
          if (!handled) resolve(null);
        }
      }, 1000);
    });
  }

  /**
   * Enters the actual drop-off time value
   * @author Deepak Bohra
   * @modified 2025-08-12
   */
  async enterActualTimeValue(dropTime: string, carrNumber: "1" | "3" = "1") {
    await this.actualTimeDropTabInput_LOC(carrNumber).waitFor({ state: "visible" });
    await this.actualTimeDropTabInput_LOC(carrNumber).fill(String(dropTime));
  }

  /**
   * Enters the actual drop-off date value using day after tomorrow's date
   * @author Deepak Bohra
   * @modified 2025-08-12
   */
  async enterActualDateValue(pickDate: string | number, carrNumber: "1" | "3" = "1") {
    await this.actualDateDropTabInput_LOC(carrNumber).waitFor({ state: "visible" });
    await this.actualDateDropTabInput_LOC(carrNumber).fill(String(pickDate));
  }

  /**
   * Enters the deadline date value using day after tomorrow's date
   * @author Deepak Bohra
   *@modified 2025-08-12
   */
  async enterDeadlineDateValue(deadlineDate: string | number, carrNumber: "1" | "3" = "1") {
    await this.deadlineDateDropTabInput_LOC(carrNumber).waitFor({ state: "visible" });
    await this.deadlineDateDropTabInput_LOC(carrNumber).fill(String(deadlineDate));
  }
  /**
   * Enters the deadline time value for drop-off
   * @author Deepak Bohra
   * @modified 2025-07-30
   */
  async enterDeadlineTimeValue(dropTime: string, carrNumber: "1" | "3" = "1") {
    await this.deadlineTimeDropTabInput_LOC(carrNumber).waitFor({ state: "visible" });
    await this.deadlineTimeDropTabInput_LOC(carrNumber).fill(String(dropTime));
  }

  /**
   * Enters complete Drop tab details including consignee selection, dates and times
   * @author Deepak Bohra
   * @modified 2025-08-12
   */
  async enterCompleteDropTabDetails(
    consigneeName: string,
    earliestDate: string | number,
    earliestTime: string,
    latestDate: string | number,
    latestTime: string
  ) {
    await this.selectConsigneeAddress();
    await this.selectConsigneeByNameConsignee(consigneeName);
    const alertMessage = await this.alertPopUp();
    await this.enterActualDateValue(earliestDate);
    await this.enterActualTimeValue(earliestTime);
    await this.enterDeadlineDateValue(latestDate);
    await this.enterDeadlineTimeValue(latestTime);
    return alertMessage; // Return alert message if needed for validation
  }
  /**
   * Clicks on the Driver In & Out link to set the driver in & out date and time
   * @author Rohit Singh
   * @modified 2025-08-01
   */
  async clickDrop2DriverInOutLink() {
    await this.page.waitForLoadState("networkidle");
    await this.driverInLink_LOC.click();
    await this.driverOutLink_LOC.click();
    await this.driverInInput_LOC.click();
    await this.driverOutInput_LOC.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
     * Updates Driver In and Driver Out Date and Time on Drop tab.
     * @param pages 
     * @param testData 
     */
  async updateDriverInOutDateTime(pages: PageManager, testData: any): Promise<void> {
    const { dayAfterTomorrow } = pages.commonReusables.getNextTwoDatesFormatted();
    await this.page.waitForLoadState('networkidle');
    // Enter Driver In Date and Time
    await this.driverInDate_LOC.waitFor({ state: 'visible' });
    await this.driverInDate_LOC.click();
    await this.driverInDate_LOC.fill(dayAfterTomorrow);
    await this.driverInTime_LOC.waitFor({ state: 'visible' });
    await this.driverInTime_LOC.click();
    await this.driverInTime_LOC.fill(testData.consigneeEarliestTime);
    // Enter Driver Out Date and Time
    await this.driverOutDate_LOC.waitFor({ state: 'visible' });
    await this.driverOutDate_LOC.click();
    await this.driverOutDate_LOC.fill(dayAfterTomorrow);
    await this.driverOutTime_LOC.waitFor({ state: 'visible' });
    await this.driverOutTime_LOC.click();
    await this.driverOutTime_LOC.fill(testData.consigneeLatestTime);
    await this.saveButton_LOC.first().click();
    console.log('Status has been set to BOOKED after updating Driver In and Out Date/Time');
  }
}

export default EditLoadDropTabPage;
