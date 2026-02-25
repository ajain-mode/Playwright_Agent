// src/pages/editLoadPage/EditLoadCommomFunctionPage.ts
import { Page } from "@playwright/test";

import { Locator } from "@playwright/test";

export class EditLoadValidationFieldPage {
 
private readonly page: Page;
private readonly shipperNameInput_LOC: Locator;
private readonly consigneeNameInput_LOC: Locator;
private readonly shipperAddress1Input_LOC: Locator;
private readonly consigneeAddress1Input_LOC: Locator;
private readonly shipperCityInput_LOC: Locator;
private readonly consigneeCityInput_LOC: Locator;
private readonly shipperStateDropdown_LOC: Locator;
private readonly consigneeStateDropdown_LOC: Locator;
private readonly shipperZipInput_LOC: Locator;
private readonly consigneeZipInput_LOC: Locator;
private readonly earliestDateInput_LOC: Locator;
private readonly earliestTimeInput_LOC: Locator;
private readonly latestDateInput_LOC: Locator;
private readonly latestTimeInput_LOC: Locator;
private readonly commodityQuantityInput_LOC: Locator;
private readonly commodityUoMDropdown_LOC: Locator;
private readonly commodityDescriptionInput_LOC: Locator;
private readonly commodityWeightInput_LOC: Locator;
private readonly earliestDateConsigneeInput_LOC: Locator;
private readonly earliestTimeConsigneeInput_LOC: Locator;
private readonly latestDateConsigneeInput_LOC: Locator;
private readonly latestTimeConsigneeInput_LOC: Locator;
private readonly trailerLengthInput_LOC: Locator;
private readonly equipmentTypeDropdown_LOC: Locator;
private readonly milesInput_LOC: Locator;
private readonly shipperCountryDropdown_LOC: Locator;
// private readonly consigneeCountryDropdown_LOC: Locator;
 
  constructor(page: Page) {
    this.page = page;
    this.shipperNameInput_LOC = page.locator("#carr_1_stop_1_name");
    this.consigneeNameInput_LOC = page.locator("#carr_1_stop_2_name");
    this.shipperAddress1Input_LOC = page.locator("#carr_1_stop_1_addr1");
    this.consigneeAddress1Input_LOC = page.locator("#carr_1_stop_2_addr1");
    this.shipperCityInput_LOC = page.locator("#carr_1_stop_1_city");
    this.consigneeCityInput_LOC = page.locator("#carr_1_stop_2_city");
    this.shipperStateDropdown_LOC = page.locator("#carr_1_stop_1_state");
    this.consigneeStateDropdown_LOC = page.locator("#carr_1_stop_2_state");
    this.shipperZipInput_LOC = page.locator("#carr_1_stop_1_flex_main span input");
    this.consigneeZipInput_LOC = page.locator("#carr_1_stop_2_flex_main span input");
    this.earliestDateInput_LOC = page.locator("#carr_1_stop_1_date_a");
    this.earliestTimeInput_LOC = page.locator("#carr_1_stop_1_time");
    this.latestDateInput_LOC = page.locator("#carr_1_stop_1_date2_a");
    this.latestTimeInput_LOC = page.locator("#carr_1_stop_1_time2");
    this.commodityQuantityInput_LOC = page.locator("#carr_1_stop_1_item_1_qty");
    this.commodityUoMDropdown_LOC = page.locator("#carr_1_stop_1_item_1_type");
    this.commodityDescriptionInput_LOC = page.locator("#carr_1_stop_1_item_1_descrip");
    this.commodityWeightInput_LOC = page.locator("#carr_1_stop_1_item_1_weight");
    this.earliestDateConsigneeInput_LOC = page.locator("#carr_1_stop_2_date_a");
    this.earliestTimeConsigneeInput_LOC = page.locator("#carr_1_stop_2_time");
    this.latestDateConsigneeInput_LOC = page.locator("#carr_1_stop_2_date2_a");
    this.latestTimeConsigneeInput_LOC = page.locator("#carr_1_stop_2_time2");
    this.trailerLengthInput_LOC = page.locator("#carr_1_trailer_length");
    this.equipmentTypeDropdown_LOC = page.locator("#carr_1_equip");
    this.milesInput_LOC = page.locator("#carr_1_miles_total");
    this.shipperCountryDropdown_LOC = page.locator("#carr_1_stop_1_country");
    // this.consigneeCountryDropdown_LOC = page.locator("#carr_1_stop_2_country")
  }
 
  /**
   * Fill a field by its logical name using the class property Locators.
   * @param fieldName Logical field name (e.g., "shipperName")
   * @author Deepak Bohra
   * @created 2025-07-27
   * @modified 2025-07-28
   * @param value Value to fill in the field
   */
  async fillFieldByName(
    fieldName:
      | "shipperNameInput_LOC"
      | "consigneeNameInput_LOC"
      | "shipperAddress1Input_LOC"
      | "consigneeAddress1Input_LOC"
      | "shipperCityInput_LOC"
      | "consigneeCityInput_LOC"
      | "shipperStateDropdown_LOC"
      | "consigneeStateDropdown_LOC"
      | "shipperZipInput_LOC"
      | "consigneeZipInput_LOC"
      | "earliestDateInput_LOC"
      | "earliestTimeInput_LOC"
      | "latestDateInput_LOC"
      | "latestTimeInput_LOC"
      | "commodityQuantityInput_LOC"
      | "commodityUoMDropdown_LOC"
      | "commodityDescriptionInput_LOC"
      | "commodityWeightInput_LOC"
      | "earliestDateConsigneeInput_LOC"
      | "earliestTimeConsigneeInput_LOC"
      | "latestDateConsigneeInput_LOC"
      | "latestTimeConsigneeInput_LOC"
      | "trailerLengthInput_LOC"
      | "equipmentTypeDropdown_LOC"
      | "milesInput_LOC",
    value: string
  ) {
    const locator = this[fieldName] as Locator;
    if (!locator) throw new Error(`No locator found for field: ${fieldName}`);
    await locator.waitFor({ state: "visible" });
    await locator.fill(value);
  }
 
  /**
   * Selects an option in a dropdown field by logical name and option value
   * @param fieldName Logical field name (e.g., "shipperState")
   * @param optionValue Value to select in the dropdown
   * @author Deepak Bohra
   * @created 2025-07-27
   * @modified 2025-07-28
   */
  async selectDropdownByName(
    fieldName:
      | "shipperStateDropdown_LOC"
      | "consigneeStateDropdown_LOC"
      | "commodityUoMDropdown_LOC"
      | "equipmentTypeDropdown_LOC"
      | "shipperCountryDropdown_LOC",     // ← Add this
     // | "consigneeCountryDropdown_LOC"
    optionValue: string
  ) {
    const locator = this[fieldName] as Locator;
    if (!locator) throw new Error(`No locator found for field: ${fieldName}`);
    await locator.waitFor({ state: "visible" });
    await locator.selectOption(optionValue);
  }
  /**
   * @author Deepak Bohra
   * @created 2025-07-27
   * @modified 2025-07-28
   */
  async enterCompletePickTabDetailsManualAddress(
    shipperName: string,
    shipperAddress: string,
    shipperCity: string,
    shipperState: string,
    shipperZip: string | number,
    earliestDate: string | number,
    earliestTime: string,
    latestDate: string | number,
    latestTime: string,
    commodityQty: string | number,
    commodityUoM: string,
    commodityDescription: string,
    commodityWeight: string | number
  ) {
    await this.fillFieldByName("shipperNameInput_LOC", String(shipperName));
    await this.fillFieldByName("shipperAddress1Input_LOC", String(shipperAddress));
    await this.fillFieldByName("shipperCityInput_LOC", String(shipperCity));
    await this.selectDropdownByName("shipperStateDropdown_LOC", String(shipperState));
    await this.page.waitForTimeout(WAIT.DEFAULT / 3);
    await this.fillFieldByName("shipperZipInput_LOC", String(shipperZip ?? ""));
    await this.fillFieldByName("earliestDateInput_LOC", String(earliestDate));
    await this.fillFieldByName("earliestTimeInput_LOC", String(earliestTime));
    await this.fillFieldByName("latestDateInput_LOC", String(latestDate));
    await this.fillFieldByName("latestTimeInput_LOC", String(latestTime));
    await this.fillFieldByName("commodityQuantityInput_LOC", String(commodityQty));
    await this.selectDropdownByName("commodityUoMDropdown_LOC", String(commodityUoM));
    await this.fillFieldByName("commodityDescriptionInput_LOC", String(commodityDescription));
    await this.fillFieldByName("commodityWeightInput_LOC", String(commodityWeight));
  }
  /**
   * @author Deepak
   * @created 2025-07-28
   */
  async enterCompleteConsigneeTabDetailsManualAddress(
    consigneeName: string,
    consigneeAddress: string,
    consigneeCity: string,
    consigneeState: string,
    consigneeZip: string | number,
    actualDate: string | number,
    actualTime: string,
    deadlineDate: string | number,
    deadlineTime: string
  ) {
    await this.fillFieldByName("consigneeNameInput_LOC", String(consigneeName));
    await this.fillFieldByName("consigneeAddress1Input_LOC", String(consigneeAddress));
    await this.fillFieldByName("consigneeCityInput_LOC", String(consigneeCity));
    await this.selectDropdownByName("consigneeStateDropdown_LOC", String(consigneeState));
    await this.page.waitForTimeout(WAIT.DEFAULT / 3);
    await this.fillFieldByName("consigneeZipInput_LOC", String(consigneeZip ?? ""));
    await this.fillFieldByName("earliestDateConsigneeInput_LOC", String(actualDate));
    await this.fillFieldByName("earliestTimeConsigneeInput_LOC", String(actualTime));
    await this.fillFieldByName("latestDateConsigneeInput_LOC", String(deadlineDate));
    await this.fillFieldByName("latestTimeConsigneeInput_LOC", String(deadlineTime));
  }

   /**
   * @author Deepak
   * @created 2025-07-30
   */
  async enterCompleteCarrierDetails(
    equipmentType: string | number,
    trailerLength: string | number,
    miles: string | number
  ) {
    await this.selectDropdownByName("equipmentTypeDropdown_LOC", String(equipmentType));
    await this.fillFieldByName("trailerLengthInput_LOC", String(trailerLength));
    await this.fillFieldByName("milesInput_LOC", String(miles));
  }
}
export default EditLoadValidationFieldPage;