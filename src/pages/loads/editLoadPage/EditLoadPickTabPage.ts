/**
 * EditLoadPickTabPage - Page Object Model for Pick Tab in Edit Load Page
 *
 * @description This class handles all interactions with the Pick tab elements
 * in the Edit Load page, including shipper selection, commodity details,
 * quantity, weight, and pickup scheduling configuration.
 *
 * @author Deepak Bohra
 */

import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import EditLoadValidationFieldPage from "./EditLoadValidationFieldPage";


class EditLoadPickTabPage {
  private readonly shipperAddressDropdown_LOC: Locator;
  private readonly qtyPickTabValue_LOC: Locator;
  private readonly itemTypePickTabDropdown_LOC: Locator;
  private readonly itemDescriptionPickTabValue_LOC: Locator;
  private readonly itemWeightPickTabValue_LOC: Locator;
  private readonly pickTabLink_LOC: Locator;
  private readonly deadlineBoxPickTabValue_LOC: Locator;
  private readonly deadlineBoxTimePickTabValue_LOC: Locator;
  private readonly actualTimePickTabValue_LOC: Locator;
  private readonly actualDatePickTabValue_LOC: Locator;
  private readonly shipperInput_LOC: Locator;
  private readonly shipmentItemValue_LOC: Locator;
  private readonly customCharges_LOC: Locator;
  private readonly feeTypeValue_LOC: Locator;
  private readonly driverInLink_LOC: Locator;
  private readonly driverOutLink_LOC: Locator;
  private readonly driverInInput_LOC: Locator;
  private readonly driverOutInput_LOC: Locator;
  private readonly clientNameValue_LOC: (text: string) => Locator;
  private readonly validationFieldPage: EditLoadValidationFieldPage;
  private readonly chooseShipperText_LOC: Locator;
  private readonly qtyInput_LOC: Locator;
  private readonly weightInput_LOC: Locator;
  private readonly comodityCodeDropIcon_LOC: Locator;
  private readonly dropdownInput_LOC: Locator;
  private readonly dropdownOption_LOC: (comodity: string) => Locator;
  private readonly closeNmfcDialog_LOC: Locator;
  private readonly selectClassDropDown_LOC: Locator;

  /**
   * Constructor to initialize page locators for Pick tab elements
   * @author Deepak Bohra
   * @created 2025-07-23
   */
  constructor(private page: Page) {
    this.validationFieldPage = new EditLoadValidationFieldPage(page);
    this.shipperAddressDropdown_LOC = page.locator("#select2-carr_1_stop_1_choose-container");
    this.pickTabLink_LOC = page.locator("//a[normalize-space()='Pick']");
    this.qtyPickTabValue_LOC = page.locator("#carr_1_stop_1_item_1_qty");
    this.itemTypePickTabDropdown_LOC = page.locator("#carr_1_stop_1_item_1_type");
    this.itemDescriptionPickTabValue_LOC = page.locator("#carr_1_stop_1_item_1_descrip");
    this.itemWeightPickTabValue_LOC = page.locator("#carr_1_stop_1_item_1_weight");
    this.shipperInput_LOC = page.locator("//span[@class='select2-search select2-search--dropdown']//input[@class='select2-search__field']");
    this.shipmentItemValue_LOC = page.locator("#carr_1_stop_1_item_1_value");
    this.customCharges_LOC = page.locator("#carr_1_stop_1_fee_1_cust_charge");
    this.feeTypeValue_LOC = page.locator("#carr_1_stop_1_fee_1_type");
    this.actualTimePickTabValue_LOC = page.locator("#carr_1_stop_1_time");
    this.actualDatePickTabValue_LOC = page.locator("#carr_1_stop_1_date_a");
    this.deadlineBoxPickTabValue_LOC = page.locator("#carr_1_stop_1_date2_a");
    this.deadlineBoxTimePickTabValue_LOC = page.locator("#carr_1_stop_1_time2");
    this.driverInLink_LOC = page.locator("//input[@id='carr_1_stop_1_datein_a']/ancestor::tr/td/a/font");
    this.driverOutLink_LOC = page.locator("//input[@id='carr_1_stop_1_dateout_a']/ancestor::tr/td/a/font");
    this.driverInInput_LOC = page.locator("#carr_1_stop_1_timein");
    this.driverOutInput_LOC = page.locator("#carr_1_stop_1_timeout");
    this.clientNameValue_LOC = (text: string) => page.locator(`//*[@id='select2-carr_1_stop_1_choose-results']//li//span[text()='${text}']`);
    this.chooseShipperText_LOC = page.locator("//span[text()='CHOOSE A SHIPPER OR ENTER ONE BELOW']");

    this.qtyInput_LOC = this.page.locator('#carr_1_stop_1_item_1_qty');
    this.weightInput_LOC = this.page.locator('#carr_1_stop_1_item_1_weight');
    this.comodityCodeDropIcon_LOC = this.page.locator("#select2-carr_1_stop_1_item_1_intermodal_commodity_code_id-container");
    this.dropdownInput_LOC = this.page.locator("//span[contains(@class,'select2-search--dropdown')]/input[@class='select2-search__field']");
    this.dropdownOption_LOC = (comodity: string)=> this.page.locator(`//ul[@id='select2-carr_1_stop_1_item_1_intermodal_commodity_code_id-results']/li[contains(text(),'${comodity}')]`);
    this.closeNmfcDialog_LOC = this.page.locator("//span[@class='ui-button-icon ui-icon ui-icon-closethick']");
    this.selectClassDropDown_LOC = this.page.locator("//select[@id='carr_1_stop_1_item_1_class']");
  }

  get qtyInput(): Locator {
    return this.qtyInput_LOC;
  }

  get weightInput(): Locator {
    return this.weightInput_LOC;
  }

  dates = commonReusables.getNextTwoDatesFormatted();

  /**
   * Clicks on the Pick tab to navigate to pickup configuration section
   * @author Deepak Bohra
   * @created 2025-07-23
   */
  async clickOnPickTab() {
    await this.pickTabLink_LOC.waitFor({ state: "visible" });
    await this.pickTabLink_LOC.click();
  }

  /**
   * Opens the shipper address dropdown for selection
   * @author Deepak Bohra
   * @created 2025-07-23
   * @modfied 2025-10-07
   */
  async selectShipperAddress() {
    await this.shipperAddressDropdown_LOC.waitFor({ state: "visible" });
    await this.shipperAddressDropdown_LOC.click();

    try {
      await this.shipperInput_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      }); // adjust timeout as needed
    } catch (e) {
      console.log("Shipper input not visible, continuing...");
    }
  }
  /**
  * Selects a specific shipper client by name from the dropdown list
  * @author Deepak Bohra
  * @created 2025-07-23
  */
  async selectClientByName(clientName: string) {
    const clientLocator = this.page.locator(
      `//*[@id='select2-carr_1_stop_1_choose-results']//li//span[text()='${clientName}']`
    );
    await clientLocator.waitFor({ state: "visible" });
    await clientLocator.click();
  }

  /**
   * Selects a specific shipper client by name from the dropdown list and fills details if not found
   * @author Deepak Bohra
   * @created 2025-10-07
   */
  async selectClientByNameShipper(testData: any) {
    const clientLocator = this.clientNameValue_LOC(testData.shipperName);
    try {
      await this.page.waitForLoadState("networkidle");
      await this.page.waitForLoadState("domcontentloaded");
      await clientLocator.waitFor({ state: "visible", timeout: WAIT.LARGE }); // adjust timeout as needed
      await clientLocator.click();
    } catch (e) {
      await this.chooseShipperText_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.chooseShipperText_LOC.click();
      if (testData.shipperCountry === "Canada") {
        await this.validationFieldPage.selectDropdownByName(
          "shipperCountryDropdown_LOC",
          testData.shipperCountry
        );
        await this.fillShipperDetails(
          testData.shipperName,
          testData.shipperAddress,
          testData.shipperCity,
          testData.Shipper_Prov,
          testData.Shipper_StateCode
        );
      } else {
        await this.fillShipperDetails(
          testData.shipperName,
          testData.shipperAddress,
          testData.shipperCity,
          testData.shipperState,
          testData.shipperZip
        );
      }
    }
  }

  /**
   * Selects a specific shipper client by name from the dropdown list
   * @author Deepak Bohra
   * @created 2025-10-07
   */
  async fillShipperDetails(
    name: string,
    address: string,
    city: string,
    state: string,
    zip: string
  ) {
    await this.validationFieldPage.fillFieldByName(
      "shipperNameInput_LOC",
      name
    );
    await this.validationFieldPage.fillFieldByName(
      "shipperAddress1Input_LOC",
      address
    );
    await this.validationFieldPage.fillFieldByName(
      "shipperCityInput_LOC",
      city
    );
    await this.validationFieldPage.selectDropdownByName(
      "shipperStateDropdown_LOC",
      state
    );

    await this.validationFieldPage.fillFieldByName("shipperZipInput_LOC", zip);
  }

  /**
   * Selects item type from the commodity type dropdown
   * @author Deepak Bohra
   * @created 2025-07-23
   */
  async selectItemType(option: string) {
    await this.itemTypePickTabDropdown_LOC.waitFor({ state: "visible" });
    await this.itemTypePickTabDropdown_LOC.selectOption(option);
  }

  async selectFeeType(option: any) {
    await this.feeTypeValue_LOC.waitFor({ state: "visible" });
    await this.feeTypeValue_LOC.selectOption(option);
  }
  /**
   * Enters description value for the commodity/item
   * @author Deepak Bohra
   * @created 2025-07-23
   */
  async enterDescriptionValue(descriptionValue: string) {
    await this.itemDescriptionPickTabValue_LOC.waitFor({ state: "visible" });
    await this.itemDescriptionPickTabValue_LOC.fill(descriptionValue);
  }

  /**
   * Enters quantity value for the commodity
   * @author Deepak Bohra
   * @created 2025-07-23
   */
  async enterQtyValue(value: string | number) {
    await this.qtyPickTabValue_LOC.waitFor({ state: "visible" });
    await this.qtyPickTabValue_LOC.fill(String(value));
  }

  /**
   * Enters weight value for the commodity
   * @author Deepak Bohra
   * @modified 2025-07-28
   */
  async enterWeightValue(value: string | number) {
    await this.itemWeightPickTabValue_LOC.fill(String(value));
  }

  async enterItemValue(value: string | number) {
    await this.shipmentItemValue_LOC.fill(String(value));
  }

  async enterCustomCharges(value: string | number) {
    await this.customCharges_LOC.fill(String(value));
  }

  /**
   * Enters deadline date value using tomorrow's date from common utilities
   * @author Deepak Bohra
   * @modified 2025-07-28
   */
  async enterDeadlineValue(deadlineTime: string | number) {
    await this.deadlineBoxPickTabValue_LOC.waitFor({ state: "visible" });
    await this.deadlineBoxPickTabValue_LOC.fill(String(deadlineTime));
  }

  /**
   * Enters actual pickup time value
   * @author Deepak Bohra
   * @modified 2025-07-28
   */
  async enterActualTimeValue(pickTime: string) {
    await this.actualTimePickTabValue_LOC.waitFor({ state: "visible" });
    await this.actualTimePickTabValue_LOC.fill(String(pickTime));
  }
  /**
   * Enters actual pickup date value using tomorrow's date from common utilities
   * @author Deepak Bohra
   * @modified 2025-07-28
   */
  async enterActualDateValue(pickDate: string | number) {
    await this.actualDatePickTabValue_LOC.waitFor({ state: "visible" });
    await this.actualDatePickTabValue_LOC.fill(String(pickDate));
  }
  /**
   * Enters deadline time value for pickup
   * @author Deepak Bohra
   * @modified 2025-07-28
   */
  async enterDeadlineTimeValue(pickTime: string) {
    await this.deadlineBoxTimePickTabValue_LOC.waitFor({ state: "visible" });
    await this.deadlineBoxTimePickTabValue_LOC.fill(String(pickTime));
  }

  /**
   * Enters complete Pick tab details including shipper selection, dates, times, and commodity information
   * @author Deepak Bohra
   * @created 2025-07-30
   */
  async enterCompletePickTabDetails(
    testData: any

  ) {
    await this.selectShipperAddress();
    await this.selectClientByNameShipper(testData);
    await this.enterActualDateValue(
      commonReusables.getNextTwoDatesFormatted().tomorrow
    );
    await this.enterActualTimeValue(testData.shipperEarliestTime);
    await this.enterDeadlineValue(
      commonReusables.getNextTwoDatesFormatted().tomorrow
    );
    await this.enterDeadlineTimeValue(testData.shipperLatestTime);
    await this.enterQtyValue(testData.shipmentCommodityQty);
    await this.selectItemType(testData.shipmentCommodityUoM);
    await this.enterDescriptionValue(testData.shipmentCommodityDescription);
    await this.enterWeightValue(testData.shipmentCommodityWeight);
  }
  /**
   * @author Rohit Singh
   * @description Clicks on the Driver In & Out link to set the driver in & Out date and time
   * @modified 2025-08-01
   */
  async clickDriverInOutLink() {
    await this.driverInLink_LOC.waitFor({ state: "visible" });
    await this.driverInLink_LOC.click();
    await this.driverOutLink_LOC.click();
    await this.driverInInput_LOC.click();
    await this.driverOutInput_LOC.click();
    await this.page.waitForLoadState("networkidle");
  }
  
  /**
   * @author Rohit Singh
   * @description Clicks on the Driver In link to set the driver in date and time for Pick 1 Tab
   * @modified 14-Jan-2026
   */
  async clickDriverInLink() {
    await this.driverInLink_LOC.waitFor({ state: "visible" });
    await this.driverInLink_LOC.click();
    await this.driverInInput_LOC.click();
    await commonReusables.waitForPageStable(this.page);
    console.log("Clicked on Driver In link successfully.");
  }

  /**
   * @author Rohit Singh
   * @description Clicks on the Driver In link to set the driver in date and time for Pick 1 Tab
   * @modified 16-Jan-2026
   */
  async clickDriverOutLink() {
    await this.driverOutLink_LOC.waitFor({ state: "visible" });
    await this.driverOutLink_LOC.click();
    await this.driverOutInput_LOC.click();
    await this.page.waitForLoadState("networkidle");
    console.log("Clicked on Driver Out link successfully.");
  }


  /**
  * Enters complete Pick tab details including shipper selection, dates, times, and commodity information
  * @author Deepak Bohra
  * @created 2025-07-30
  */
  async enterPickTabDetails(
    shipperName: string,
    earliestDate: string | number,
    earliestTime: string,
    latestDate: string | number,
    latestTime: string,
    commodityQty: string | number,
    commodityUoM: string,
    commodityDescription: string,
    commodityWeight: string | number
  ) {
    await this.selectShipperAddress();
    await this.selectClientByName(shipperName);
    await this.enterActualDateValue(earliestDate);
    await this.enterActualTimeValue(earliestTime);
    await this.enterDeadlineValue(latestDate);
    await this.enterDeadlineTimeValue(latestTime);
    await this.enterQtyValue(commodityQty);
    await this.selectItemType(commodityUoM);
    await this.enterDescriptionValue(commodityDescription);
    await this.enterWeightValue(commodityWeight);
  }

  /**
* Update numeric input field by incrementing or doubling its value based on the operation specified
* @author Aniket Nale
* @created 2025-10-29
*/
  async updateNumericInput(locator: Locator, operation: "increment" | "double") {
    await locator.waitFor({ state: "visible" });
    const currentValue = await locator.evaluate((el) => {
      const input = el as HTMLInputElement;
      return parseFloat(input.value || "0");
    });
    const newValue = operation === "increment" ? currentValue + 1 : currentValue * 2;
    await locator.fill(newValue.toString());
    console.log(`Updated value: From ${currentValue} to ${newValue}`);
  }
  /**
  * Selects commodity code from the dropdown list
  * @author Rohit Singh
  * @created 22-Dec-2025
  */
  async selectCommodityCode(commodityCode: string) {
    await this.comodityCodeDropIcon_LOC.waitFor({ state: "visible" });
    await this.comodityCodeDropIcon_LOC.click();
    await this.dropdownInput_LOC.waitFor({ state: "visible" });
    await this.dropdownInput_LOC.fill(commodityCode);
    await this.dropdownOption_LOC(commodityCode).waitFor({ state: "visible" });
    await this.dropdownOption_LOC(commodityCode).click();
  }

  /**
     * Selects Class Option from Dropdown
     * @author Tejaswini
     * @param option 
     */
    async selectClassOption(option: string): Promise<void> {
        await this.selectClassDropDown_LOC.waitFor({ state: 'visible' });
        await this.selectClassDropDown_LOC.selectOption(option);
        await this.closeNmfcDialog_LOC.last().click();
    }
}

export default EditLoadPickTabPage;
