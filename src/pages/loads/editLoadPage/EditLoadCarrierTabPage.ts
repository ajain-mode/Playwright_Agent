/**
 * EditLoadCarrierTabPage - Page Object Model for Carrier Tab in Edit Load Page
 *
 * @description This class handles all interactions with the Carrier tab elements
 * in the Edit Load page, including equipment type selection, cargo value management,
 * and trailer length configuration.
 *
 * @author Deepak Bohra
 */

import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

class EditLoadCarrierTabPage {
  private readonly chooseCarrierButton_LOC: Locator;
  private readonly searchCarrierNameInput_LOC: Locator;
  private readonly selectCarrierValue_LOC: Locator;
  private readonly useCarrierButton_LOC: Locator;
  private readonly flatCustomerRateInput_LOC: Locator;
  private readonly flatCarrierRateInput_LOC: Locator;
  private readonly addCarrierButton_LOC: Locator;
  private readonly moveTypeCarr1Dropdown_LOC: Locator;
  private readonly moveTypeCarr2Dropdown_LOC: Locator;
  private readonly moveTypeCarr3Dropdown_LOC: Locator;
  private readonly chooseCarrier1Button_LOC: Locator;
  private readonly chooseCarrier2Button_LOC: Locator;
  private readonly chooseCarrier3Button_LOC: Locator;
  private readonly carrier1Input_LOC: Locator;
  private readonly carrier2Input_LOC: Locator;
  private readonly carrier3Input_LOC: Locator;
  private readonly carrier1DropDown_LOC: Locator;
  private readonly carrier2DropDown_LOC: Locator;
  private readonly carrier3DropDown_LOC: Locator;
  private readonly carrier2ContainerCodeInput_LOC: Locator;
  private readonly carrier2ContainerNumberInput_LOC: Locator;
  private readonly carrierTabLink_LOC: Locator;
  private readonly equipmentTypeDropdown_LOC: Locator;
  private readonly practicalTotalMilesValue_LOC: Locator;
  private readonly cargoValueDropdown_LOC: Locator;
  private readonly carrierTrailerLengthInput_LOC: Locator;
  private readonly cargoValue_LOC: Locator;
  private readonly enableGPSTrackingCheckbox_LOC: Locator;
  //@modified: Rohit Singh - 03/oct/2025 - Pro Number#
  private readonly proNumberInput_LOC: Locator;

  //@modified: Rohit Singh - 22/dec/2025 - carrier
  private readonly carrierLinehaulInput_LOC:(carrier: string) => Locator;
   private readonly offerRateInput_LOC: Locator;



  /**
   * Constructor to initialize page locators for Carrier tab elements
   * @param page - Playwright Page instance for web interactions
   * @author Deepak Bohra
   */
  constructor(private page: Page) {
    this.equipmentTypeDropdown_LOC = page.locator("#carr_1_equip");
    this.practicalTotalMilesValue_LOC = page.locator("#carr_1_miles_total");
    this.cargoValueDropdown_LOC = page.locator("#carr_1_cargo_value_opt_id");
    this.carrierTrailerLengthInput_LOC = page.locator("#carr_1_trailer_length");
    this.addCarrierButton_LOC = page.locator("//input[@value='Add Carrier']");
    this.moveTypeCarr1Dropdown_LOC = page.locator("#carr_1_move_type");
    this.moveTypeCarr2Dropdown_LOC = page.locator("#carr_2_move_type");
    this.moveTypeCarr3Dropdown_LOC = page.locator("#carr_3_move_type");
    this.chooseCarrier1Button_LOC = page.locator(
      "#carr_1_carr_btn_choose_carrier"
    );
    this.chooseCarrier2Button_LOC = page.locator(
      "#carr_2_carr_btn_choose_carrier"
    );
    this.chooseCarrier3Button_LOC = page.locator(
      "#carr_3_carr_btn_choose_carrier"
    );
    this.carrier1Input_LOC = page.locator("#carr_1_carr_auto");
    this.carrier2Input_LOC = page.locator("#carr_2_carr_auto");
    this.carrier3Input_LOC = page.locator("#carr_3_carr_auto");
    this.carrier1DropDown_LOC = page.locator("#carr_1_carr_select");
    this.carrier2DropDown_LOC = page.locator("#carr_2_carr_select");
    this.carrier3DropDown_LOC = page.locator("#carr_3_carr_select");
    this.carrier2ContainerCodeInput_LOC = page.locator(
      "#carr_2_container_codes"
    );
    this.carrier2ContainerNumberInput_LOC = page.locator(
      "#carr_2_container_num"
    );
    this.cargoValue_LOC = page.locator("#carr_1_cargo_value_opt_id");
    this.carrierTabLink_LOC = page.locator("#tab_carr_1_hyperlink");
    this.carrierTrailerLengthInput_LOC = page.locator("#carr_1_trailer_length");
    this.chooseCarrierButton_LOC = page.locator(
      "#carr_1_carr_btn_choose_carrier"
    );
    this.searchCarrierNameInput_LOC = page.locator("#carr_1_carr_auto");
    this.selectCarrierValue_LOC = page.locator("#carr_1_carr_select > option");
    this.useCarrierButton_LOC = page.locator("#carr_1_carr_btn_use_carrier");
    this.flatCustomerRateInput_LOC = page.locator("#carr_1_cust_rate");
    this.flatCarrierRateInput_LOC = page.locator("#carr_1_carr_rate");
    this.enableGPSTrackingCheckbox_LOC = page.locator("#enable_gps_tracking_1");
    this.proNumberInput_LOC = page.locator("#carr_1_pro_number"); // Pro Number# input field
    // this.carrierLinehaulInput_LOC = page.locator("#carr_1_linehaul_rate");

    this.carrierLinehaulInput_LOC = (carrier: string) =>  this.page.locator(`#carr_${carrier}_carr_rate`);
    this.offerRateInput_LOC = this.page.locator("//input[@id='carr_1_target_rate']");


  }
  ediOverrideRadioOption(value: "A" | "R" | "D") {
    return this.page.locator(`input[id='edispatch_acdc_${value}']`);
  }
  /**
   * Clicks on the Carrier tab to navigate to carrier configuration section
   * @author Deepak Bohra
   * @modified 2025-08-07
   */
  async clickOnCarrierTab() {
    await this.carrierTabLink_LOC.waitFor({ state: "visible" });
    await this.carrierTabLink_LOC.click();
  }

  /**
   * Selects equipment type from the dropdown menu
   * @author Deepak Bohra
   * @modified 2025-07-23
   */
  async selectEquipmentType(option: string) {
    await this.equipmentTypeDropdown_LOC.waitFor({ state: "visible" });
    await this.equipmentTypeDropdown_LOC.selectOption(option);
  }

  /**
   * Retrieves the practical total miles value from the form
   * @author Deepak Bohra
   * @modified 2025-07-23
   */
  async getPracticalTotalMilesValue() {
    await this.practicalTotalMilesValue_LOC.waitFor({ state: "visible" });
    const value = await this.practicalTotalMilesValue_LOC.textContent();
    console.log(`Practical Total Miles: ${value}`);
    return value;
  }

  /**
   * Retrieves the cargo value from the dropdown selection
   * @author Deepak Bohra
   * @modified 2025-07-23
   */
  async getCargoValue() {
    await this.cargoValueDropdown_LOC.waitFor({ state: "visible" });
    const cargoValue = await this.cargoValueDropdown_LOC.textContent();
    return cargoValue ?? "";
  }

  /**
   * Enters trailer length value in the trailer length input field
   * @author Deepak Bohra
   * @modified 2025-07-23
   */

  async enterValueInTrailerLength(value: string | number) {
    await this.carrierTrailerLengthInput_LOC.waitFor({ state: "visible" });
    await this.carrierTrailerLengthInput_LOC.fill(String(value));
  }

  /**
   * Click on Choose Carrier details
   * @author Avanish Srivastava
   * @modified 2025-07-20
   */

  async clickOnChooseCarrier() {
    await this.chooseCarrierButton_LOC.waitFor({ state: "visible" });
    await this.chooseCarrierButton_LOC.click();
  }

  /**
   * Enters enter Carrier Rate details
   * @author Avanish Srivastava
   * @modified 2025-07-20
   */

  async enterCarrierName() {
    await this.searchCarrierNameInput_LOC.waitFor({ state: "visible" });
    await this.searchCarrierNameInput_LOC.highlight();
    await this.searchCarrierNameInput_LOC.pressSequentially("TESTED", {
      delay: WAIT.DEFAULT / 10,
    });
    await this.page.keyboard.press("Tab");
    await this.page.waitForTimeout(WAIT.DEFAULT * 3);
  }

  /**
   * Select Carrier Rate
   * @author Avanish Srivastava
   * @modified 2025-07-20
   */

  async selectCarrier() {
    await this.selectCarrierValue_LOC.waitFor({
      state: "visible",
      timeout: WAIT.SMALL,
    });
    await this.selectCarrierValue_LOC.click();
  }

  /**
   * Enters Click on UseCarrier
   * @author Avanish Srivastava
   * @modified 2025-07-20
   */

  async clickOnUseCarrierBtn() {
    await this.useCarrierButton_LOC.waitFor({ state: "visible" });
    await this.useCarrierButton_LOC.click();
  }

  /**
   * Enters enter Miles details
   * @author Avanish Srivastava
   * @modified 2025-07-20
   */

  async enterMiles(value: string | number) {
    await this.practicalTotalMilesValue_LOC.waitFor({ state: "visible" });
    await this.practicalTotalMilesValue_LOC.fill(String(value));
  }

  /**
   * Enters enter Customer Rate details
   * @author Avanish Srivastava
   * @modified 2025-07-20
   */

  async enterCustomerRate(value: string | number) {
    await this.flatCustomerRateInput_LOC.waitFor({ state: "visible" });
    await this.flatCustomerRateInput_LOC.fill(String(value));
  }

  /**
   * Enters enter Carrier Rate details
   * @author Avanish Srivastava
   * @modified 2025-07-20
   */

  async enterCarrierRate(value: string | number) {
    await this.flatCarrierRateInput_LOC.waitFor({ state: "visible" });
    await this.flatCarrierRateInput_LOC.fill(String(value));
  }

  /**
   * Enters complete Carrier tab details with optional cargo value logging
   * @author Deepak Bohra
   * @modified 2025-07-23
   */
  async enterCompleteCarrierTabDetails(
    equipmentType: string,
    trailerLength: string
  ) {
    await this.selectEquipmentType(equipmentType);
    await this.enterValueInTrailerLength(trailerLength);

    const cargoValue = await this.validateCargoValue();

    //if (logCargoValue) {
    if (cargoValue) {
      console.log(`Cargo Value: ${cargoValue}`);
    }

    return cargoValue ?? "";
  }
  /**
   * Enters complete Carrier tab details with optional cargo value logging
   * @author Deepak Bohra
   * @modified 2025-07-23
   */
  async validateCargoValue() {
    const value = await this.cargoValue_LOC.inputValue();
    console.log(`Cargo Value: ${value}`);

    const numericValue = Number(value.replace(/[^0-9.]/g, ""));
    const optionText = await this.cargoValue_LOC
      .locator(`option[value="${numericValue}"]`)
      .textContent();
    console.log(`Selected Option Text: ${optionText}`);
    console.log(
      "Cargo Value validation completed - check test results for any failures"
    );
    return optionText;
  }
  /**
   * Clicks the Add Carrier button to add a new carrier entry
   * @author Rohit Singh
   * @created 2025-07-23
   */
  async clickAddCarrier() {
    await this.addCarrierButton_LOC.waitFor({ state: "visible" });
    await this.addCarrierButton_LOC.click();
  }
  /**
   * Selects the move type for Carrier 1 from the dropdown
   * @param option - The move type option to select
   * @author Rohit Singh
   * @modified 2025-07-23
   */
  async selectMoveTypeCarr1(option: string) {
    await this.moveTypeCarr1Dropdown_LOC.waitFor({ state: "visible" });
    await this.moveTypeCarr1Dropdown_LOC.selectOption(option);
  }

  /**
   * Selects the move type for Carrier 2 from the dropdown
   * @param option - The move type option to select
   * @author Rohit Singh
   * @modified 2025-07-23
   */
  async selectMoveTypeCarr2(option: string) {
    await this.page.waitForTimeout(WAIT.DEFAULT);
    await this.moveTypeCarr2Dropdown_LOC.waitFor({ state: "visible" });
    await commonReusables.alertAcceptWithText(this.page, "Warning:");
    await this.moveTypeCarr2Dropdown_LOC.selectOption(option);
  }
  /**
   * Selects the move type for Carrier 3 from the dropdown
   * @param option - The move type option to select
   * @author Rohit Singh
   * @modified 2025-07-23
   */
  async selectMoveTypeCarr3(option: string) {
    await this.moveTypeCarr3Dropdown_LOC.waitFor({ state: "visible" });
    await this.moveTypeCarr3Dropdown_LOC.selectOption(option);
  }
  /**
   * Selects Carrier 1 from the dropdown by entering the carrier ID
   * @param carrierID - The ID of the carrier to select
   * @author Rohit Singh
   * @modified 2025-07-28
   */
  async selectCarrier1(carrierID: string) {
    this.page.waitForLoadState("domcontentloaded");
    await this.chooseCarrier1Button_LOC.waitFor({ state: "visible" });
    await this.chooseCarrier1Button_LOC.click();
    await this.carrier1Input_LOC.waitFor({ state: "visible" });
    await this.carrier1Input_LOC.pressSequentially(carrierID);
    await this.carrier1DropDown_LOC
      .locator(`option:has-text("${carrierID}")`)
      .waitFor({ state: "visible" });
    const option = await this.carrier1DropDown_LOC.locator(
      `option:has-text("${carrierID}")`
    );
    await option.dblclick();
    await this.page.waitForTimeout(WAIT.DEFAULT);
  }
  /**
   * Selects Carrier 2 from the dropdown by entering the carrier ID
   * @param carrierID - The ID of the carrier to select
   * @author Rohit Singh
   * @modified 2025-07-28
   */
  async selectCarrier2(carrierID: string) {
    await this.chooseCarrier2Button_LOC.waitFor({ state: "visible" });
    await this.chooseCarrier2Button_LOC.click();
    await this.carrier2Input_LOC.waitFor({ state: "visible" });
    await this.carrier2Input_LOC.pressSequentially(carrierID);
    await this.carrier2DropDown_LOC
      .locator(`option:has-text("${carrierID}")`)
      .waitFor({ state: "visible" });
    const option = await this.carrier2DropDown_LOC.locator(
      `option:has-text("${carrierID}")`
    );
    await option.dblclick();
    await this.page.waitForTimeout(WAIT.DEFAULT);
  }
  /**
   * Selects Carrier 3 from the dropdown by entering the carrier ID
   * @param carrierID - The ID of the carrier to select
   * @author Rohit Singh
   * @modified 2025-07-28
   */
  async selectCarrier3(carrierID: string) {
    await this.chooseCarrier3Button_LOC.waitFor({ state: "visible" });
    await this.chooseCarrier3Button_LOC.click();
    await this.carrier3Input_LOC.waitFor({ state: "visible" });
    await this.carrier3Input_LOC.pressSequentially(carrierID);
    await this.carrier3DropDown_LOC
      .locator(`option:has-text("${carrierID}")`)
      .waitFor({ state: "visible" });
    const option = await this.carrier3DropDown_LOC.locator(
      `option:has-text("${carrierID}")`
    );
    await option.dblclick();
    await this.page.waitForTimeout(WAIT.DEFAULT);
  }
  /**
   * Enters container code and number for Carrier 2
   * @param containerCode - The container code to enter
   * @param containerNumber - The container number to enter
   * @author Rohit Singh
   * @modified 2025-07-28
   */
  async enterContainerNumber(containerCode: string, containerNumber: string) {
    await this.carrier2ContainerCodeInput_LOC.waitFor({ state: "visible" });
    await this.carrier2ContainerCodeInput_LOC.fill(containerCode);
    await this.carrier2ContainerNumberInput_LOC.waitFor({ state: "visible" });
    await this.carrier2ContainerNumberInput_LOC.fill(containerNumber);
  }
  /**
   * Disables GPS tracking if it is enabled
   * @author Rohit Singh
   * @modified 2025-09-08
   */
  async disableGPSTrackingifEnabled() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.enableGPSTrackingCheckbox_LOC.waitFor({ state: "visible" });
    const isChecked = await this.enableGPSTrackingCheckbox_LOC.isChecked();
    if (isChecked) {
      await this.enableGPSTrackingCheckbox_LOC.click();
    }
  }
  /**
   * Enters the Pro Number in the Pro Number input field
   * @param proNumber - The Pro Number to enter
   * @author Rohit Singh
   * @modified 03-Nov-2025
   */
  async enterProNumber(proNumber: string) {
    await this.proNumberInput_LOC.waitFor({ state: "visible" });
    await this.proNumberInput_LOC.fill(proNumber);
  }
  /**
   * Accepts/Reject/Decline EDI override to change load status manually
   * @author Aniket Nale
   * @modified 13-Nov-25
   */
  async selectEDIOverrideStatus(value: "A" | "R" | "D") {
    await commonReusables.dialogHandler(this.page);
    await this.ediOverrideRadioOption(value).check();
  }

  /**
   * Select the cargo value from the dropdown selection
   * @author Deepak Bohra
   * @created 2025-12-22
   */
  async selectCargoValue(cargoValue: string) {
    await this.cargoValueDropdown_LOC.waitFor({ state: "visible" });
    const cargoValueDropdown = await this.cargoValueDropdown_LOC;
    await cargoValueDropdown.selectOption(cargoValue);
  }
  /**
   * Enters carrier linehaul rate for the specified carrier
   * @param carrier - The carrier identifier (e.g., "1", "2", "3")
   * @param linehaulRate - The linehaul rate to enter
   * @author Rohit Singh
   * @created 2025-12-22
   */
  async enterCarrierLinehaulRate(carrier: "1" | "2" | "3", linehaulRate: string) {
    const carrierLinehaulLocator = this.carrierLinehaulInput_LOC(carrier);
    await carrierLinehaulLocator.waitFor({ state: "visible" });
    await carrierLinehaulLocator.fill(linehaulRate);
  }

  /**
   * Fills offer rate on Carrier tab
   * @author Tejaswini
   * @param testData 
   */
  async enterOfferRate(testData: any): Promise<void> {
    await this.offerRateInput_LOC.waitFor({ state: 'visible' });
    await this.offerRateInput_LOC.fill(testData.offerRate);
    console.log('Offer Rate filled successfully:', testData.offerRate);
    }


  /**
   * validateEditLoadHeadingText - Auto-generated by AI Agent
   * @author AI Agent Generator
   * @created 2026-02-25
   */
  async validateEditLoadHeadingText(expectedValue?: string): Promise<void> {
    // Verify Edit Load Heading Text
    const element = this.page.locator(`//*[contains(text(),'${expectedValue || ""}')]`);
    await expect(element, `Expected to see: ${expectedValue}`).toBeVisible({ timeout: 10000 });
    console.log('Verified: Edit Load Heading Text');
  }

  /**
   * validateCurrentTabValue - Auto-generated by AI Agent
   * @author AI Agent Generator
   * @created 2026-02-25
   */
  async validateCurrentTabValue(expectedValue?: string): Promise<void> {
    // Verify Current Tab Value
    const element = this.page.locator(`//*[contains(text(),'${expectedValue || ""}')]`);
    await expect(element, `Expected to see: ${expectedValue}`).toBeVisible({ timeout: 10000 });
    console.log('Verified: Current Tab Value');
  }

  /**
   * clickOnTab - Auto-generated by AI Agent
   * @author AI Agent Generator
   * @created 2026-02-25
   */
  async clickOnTab(text: string): Promise<void> {
    const el = this.page.locator(`//button[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${text.toLowerCase()}')] | //*[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'${text.toLowerCase()}')]`);
    await el.waitFor({ state: 'visible', timeout: 10000 });
    await el.click();
    console.log(`Clicked on ${text}`);
  }
}

export default EditLoadCarrierTabPage;
