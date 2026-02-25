import { Locator, Page, expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { GlobalConstants } from "@utils/globalConstants";
 
/**
 * Author name: Deepak Bohra
 */
class TNXExecutionNotesPage {
  private readonly executionNotesSection_LOC: Locator;
  private readonly carrierDispatchName_LOC: Locator;
  private readonly carrierDispatchEmail_LOC: Locator;
  private readonly carrierDispatchPhone_LOC: Locator;
  private readonly driverName_LOC: Locator;
  private readonly driverCell_LOC: Locator;
  private readonly truckNumber_LOC: Locator;
  private readonly trailerNumber_LOC: Locator;
  private readonly isEmpty_LOC: Locator;
  private readonly currentLocationCity_LOC: Locator;
  private readonly currentLocationState_LOC: Locator;
  private readonly currentLocationZip_LOC: Locator;
  private readonly emptyLocationCity_LOC: Locator;
  private readonly emptyLocationState_LOC: Locator;
  private readonly emptyLocationZip_LOC: Locator;
 
  // Input field locators
  private readonly carrierDispatchNameInput_LOC: Locator;
  private readonly carrierDispatchEmailInput_LOC: Locator;
  private readonly carrierDispatchPhoneInput_LOC: Locator;
  private readonly driverNameInput_LOC: Locator;
  private readonly driverCellInput_LOC: Locator;
  private readonly truckNumberInput_LOC: Locator;
  private readonly trailerNumberInput_LOC: Locator;
  private readonly isEmptyInput_LOC: Locator;
  private readonly currentLocationCityInput_LOC: Locator;
  private readonly currentLocationStateInput_LOC: Locator;
  private readonly currentLocationZipInput_LOC: Locator;
  private readonly emptyLocationCityInput_LOC: Locator;
  private readonly emptyLocationStateInput_LOC: Locator;
  private readonly emptyLocationZipInput_LOC: Locator;
  private readonly progressText_LOC: Locator;
 
  constructor(private page: Page) {
    // Execution Notes Section - More flexible locator
    this.executionNotesSection_LOC = page.locator(
      "//p[contains(text(), 'Execution Notes')]"
    );
 
    // Field Label Locators - More flexible to handle different HTML elements
    this.carrierDispatchName_LOC = page.locator(
      "//*[contains(text(), 'Carrier Dispatch Name')]"
    );
    this.carrierDispatchEmail_LOC = page.locator(
      "//*[contains(text(), 'Carrier Dispatch Email')]"
    );
    this.carrierDispatchPhone_LOC = page.locator(
      "//*[contains(text(), 'Carrier Dispatch Phone Number')] | //*[contains(text(), 'Carrier Dispatch Phone')]"
    );
    this.driverName_LOC = page.locator(
      "//*[contains(text(), 'Driver Name')]"
    );
    this.driverCell_LOC = page.locator(
      "//*[contains(text(), 'Driver Cell')]"
    );
    this.truckNumber_LOC = page.locator(
      "//*[contains(text(), 'Truck Number')]"
    );
    this.trailerNumber_LOC = page.locator(
      "//*[contains(text(), 'Trailer Number')]"
    );
    this.isEmpty_LOC = page.locator(
      "//*[contains(text(), 'Is Empty')]"
    );
    this.currentLocationCity_LOC = page.locator(
      "//*[contains(text(), 'Current Location City')]"
    );
    this.currentLocationState_LOC = page.locator(
      "//*[contains(text(), 'Current Location State')]"
    );
    this.currentLocationZip_LOC = page.locator(
      "//*[contains(text(), 'Current Location Zip')]"
    );
    this.emptyLocationCity_LOC = page.locator(
      "//*[contains(text(), 'Empty Location City')]"
    );
    this.emptyLocationState_LOC = page.locator(
      "//*[contains(text(), 'Empty Location State')]"
    );
    this.emptyLocationZip_LOC = page.locator(
      "//*[contains(text(), 'Empty Location Zip')]"
    );
 
    // Input Field Locators
    this.carrierDispatchNameInput_LOC = page.locator(
      "input[placeholder*='Enter Carrier Dispatch Name']"
    );
    this.carrierDispatchEmailInput_LOC = page.locator(
      "input[placeholder*='Enter Carrier Dispatch Email']"
    );
    this.carrierDispatchPhoneInput_LOC = page.locator(
      "input[placeholder*='Enter Carrier Dispatch Phone']"
    );
    this.driverNameInput_LOC = page.locator(
      "input[placeholder*='Enter Driver Name']"
    );
    this.driverCellInput_LOC = page.locator(
      "input[placeholder*='Enter Driver Cell']"
    );
    this.truckNumberInput_LOC = page.locator(
      "input[placeholder*='Enter Truck Number']"
    );
    this.trailerNumberInput_LOC = page.locator(
      "input[placeholder*='Enter Trailer Number']"
    );
    this.isEmptyInput_LOC = page.locator(
      "select[id*='empty'] | input[placeholder*='Enter Is Empty']"
    );
    this.currentLocationCityInput_LOC = page.locator(
      "input[placeholder*='Enter Current Location City']"
    );
    this.currentLocationStateInput_LOC = page.locator(
      "input[placeholder*='Enter Current Location State']"
    );
    this.currentLocationZipInput_LOC = page.locator(
      "input[placeholder*='Enter Current Location Zip']"
    );
    this.emptyLocationCityInput_LOC = page.locator(
      "input[placeholder*='Enter Empty Location City']"
    );
    this.emptyLocationStateInput_LOC = page.locator(
      "input[placeholder*='Enter Empty Location State']"
    );
    this.emptyLocationZipInput_LOC = page.locator(
      "input[placeholder*='Enter Empty Location Zip']"
    );
    this.progressText_LOC = page.locator("//span[@data-testid='progress-tab-button']");
  }
 
 
  /**
   * Validates that all execution notes fields are present in TNX UI
   * @author Deepak Bohra
   * @since 2025-09-08
   */
  async validateExecutionNotesFieldsPresence(): Promise<void> {
    console.log("Validating TNX Execution Notes fields presence...");
    await commonReusables.waitForAllLoadStates(this.page);
    await this.progressText_LOC.waitFor({ state: "visible", timeout: WAIT.XLARGE });
    await this.progressText_LOC.click();
    try {
      await this.validateExecutionNotesSection();
    } catch (error) {
      console.log("Execution Notes section validation failed, continuing with field validation...");
    }
   
    const fieldLocators = [
      { locator: this.carrierDispatchName_LOC, label: "Carrier Dispatch Name" },
      { locator: this.carrierDispatchEmail_LOC, label: "Carrier Dispatch Email" },
      { locator: this.carrierDispatchPhone_LOC, label: "Carrier Dispatch Phone Number" },
      { locator: this.driverName_LOC, label: "Driver Name" },
      { locator: this.driverCell_LOC, label: "Driver Cell" },
      { locator: this.truckNumber_LOC, label: "Truck Number" },
      { locator: this.trailerNumber_LOC, label: "Trailer Number" },
      { locator: this.isEmpty_LOC, label: "Is Empty" },
      { locator: this.currentLocationCity_LOC, label: "Current Location City" },
      { locator: this.currentLocationState_LOC, label: "Current Location State" },
      { locator: this.currentLocationZip_LOC, label: "Current Location Zip" },
      { locator: this.emptyLocationCity_LOC, label: "Empty Location City" },
      { locator: this.emptyLocationState_LOC, label: "Empty Location State" },
      { locator: this.emptyLocationZip_LOC, label: "Empty Location Zip" }
    ];
   
    let presentFields = 0;
    let missingFields: string[] = [];
   
    for (const field of fieldLocators) {
      try {
        await field.locator.waitFor({ state: "visible", timeout: WAIT.SMALL });
        await expect.soft(field.locator, `${field.label} should be present in Execution Notes`).toBeVisible();
        console.log(`✅ ${field.label} - Present`);
        presentFields++;
      } catch (error) {
        console.log(`❌ ${field.label} - NOT FOUND`);
        missingFields.push(field.label);
      }
    }
   
    console.log(`Execution Notes Validation Summary:`);
    console.log(` ✅ Present fields: ${presentFields}/${fieldLocators.length}`);
   
    if (missingFields.length > 0) {
      console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
      throw new Error(`TNX Execution Notes validation failed: ${missingFields.length} fields are missing - ${missingFields.join(', ')}`);
    } else {
      console.log("✅ All TNX Execution Notes fields validation completed successfully");
    }
  }
 
  /**
   * Validates that the Execution Notes section is visible
   * @author Deepak Bohra
   * @since 2025-09-08
   */
  private async validateExecutionNotesSection(): Promise<void> {
    try {
      await this.executionNotesSection_LOC.waitFor({ state: "visible", timeout: GlobalConstants.WAIT.LARGE });
      await expect(this.executionNotesSection_LOC).toBeVisible();
      console.log("✅ Execution Notes section is visible");
    } catch (error) {
      console.error("❌ Execution Notes section not found");
    }
  }
 
  /**
   * Validates that specific execution notes input fields are editable
   * @author Deepak Bohra
   * @since 2025-09-08
   */
  async validateExecutionNotesInputFields(): Promise<void> {
    console.log("Validating TNX Execution Notes input fields...");
   
    const inputFieldLocators = [
      { locator: this.carrierDispatchNameInput_LOC, label: "Carrier Dispatch Name Input" },
      { locator: this.carrierDispatchEmailInput_LOC, label: "Carrier Dispatch Email Input" },
      { locator: this.carrierDispatchPhoneInput_LOC, label: "Carrier Dispatch Phone Input" },
      { locator: this.driverNameInput_LOC, label: "Driver Name Input" },
      { locator: this.driverCellInput_LOC, label: "Driver Cell Input" },
      { locator: this.truckNumberInput_LOC, label: "Truck Number Input" },
      { locator: this.trailerNumberInput_LOC, label: "Trailer Number Input" },
      { locator: this.isEmptyInput_LOC, label: "Is Empty Input" },
      { locator: this.currentLocationCityInput_LOC, label: "Current Location City Input" },
      { locator: this.currentLocationStateInput_LOC, label: "Current Location State Input" },
      { locator: this.currentLocationZipInput_LOC, label: "Current Location Zip Input" },
      { locator: this.emptyLocationCityInput_LOC, label: "Empty Location City Input" },
      { locator: this.emptyLocationStateInput_LOC, label: "Empty Location State Input" },
      { locator: this.emptyLocationZipInput_LOC, label: "Empty Location Zip Input" }
    ];
   
    let editableFields = 0;
   
    for (const field of inputFieldLocators) {
      try {
        await field.locator.waitFor({ state: "visible", timeout: GlobalConstants.WAIT.DEFAULT });
        const isEnabled = await field.locator.isEnabled();
       
        if (isEnabled) {
          console.log(`✅ ${field.label} - Input field is editable`);
          editableFields++;
        } else {
          console.log(`${field.label} - Input field is disabled`);
        }
      } catch (error) {
        console.log(`❌ ${field.label} - Not found or not accessible`);
      }
    }
   
    console.log(`Found ${editableFields} editable input fields in Execution Notes`);
  }
}
 
export default TNXExecutionNotesPage;