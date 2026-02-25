import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { GlobalConstants } from "@utils/globalConstants";

/**
 * Author name: Parth Rastogi
 * PostAutomationRulePage handles post automation rule verification and management operations
 */
class PostAutomationRulePage {
  private readonly officeConfigLink_LOC: Locator;
  private readonly postAutomationButton_LOC: Locator;
  private readonly searchBoxInput_LOC: Locator;
  private readonly searchResultRecordNotFoundText_LOC: Locator;
  private readonly selectAllPostAutomationRecordsCheckBox_LOC: Locator;
  private readonly clickOnDeleteButton_LOC: Locator;
  private readonly clickOnEditButton_LOC: Locator;
  private readonly emailNotificationInput_LOC: Locator;
  private readonly offerRateInput_LOC: Locator;
  private readonly commodityInput_LOC: Locator;
  private readonly includeCarriersValue_LOC: Locator;
  private readonly excludeCarriersValue_LOC: Locator;
  private readonly includeCarriersSelect_LOC: Locator;
  private readonly excludeCarriersSelect_LOC: Locator;
  private readonly postAutomationFormCloseButton_LOC: Locator;
  private readonly deleteText_LOC: Locator;
  private readonly deletePopupButton_LOC: Locator;
  private readonly customerDropdown_LOC: Locator;
  private readonly emailNotificationDropdown_LOC: Locator;
  private readonly pickLocationDropdown_LOC: Locator;
  private readonly equipmentDropdown_LOC: Locator;
  private readonly loadTypeDropdown_LOC: Locator;
  private readonly showOptionalFieldsButton_LOC: Locator;
  private readonly commodityDropdown_LOC: Locator;
  private readonly dropLocationDropdown_LOC: Locator;
  private readonly locationValue_LOC: (text: string) => Locator;
  private readonly includeCarrierValue_LOC: (text: string) => Locator;
  private readonly ruleSearch_LOC: Locator;
  private readonly postAutomationRuleTable_LOC: Locator;
  private readonly selectSinglePostAutomationRecordCheckBox_LOC: Locator;
  private readonly includeCarrierSelect_LOC: Locator;
  private readonly includeCarrierSearchField_LOC: Locator;
  private readonly selectedIncludeCarriers_LOC: Locator;
  private readonly excludeCarrierSelect_LOC: Locator;
  private readonly excludeCarrierSearchField_LOC: Locator;
  private readonly selectedExcludeCarriers_LOC: Locator;
  private readonly pickLocationStop1Dropdown_LOC: Locator;
  private readonly addStopButton_LOC: Locator;
  private readonly viewDetailsLink_LOC: Locator;
  private readonly commoditySelect_LOC: Locator;
  private readonly noteFieldInput_LOC: Locator;
  private readonly carrierAutoAcceptCheckbox_LOC: Locator;
  private readonly carrierAcceptAsUserDropdown_LOC: Locator;
  private readonly closeIncludeCarrierDetailsModalButton_LOC: Locator;
  private readonly customerSelect2Container_LOC: Locator;
  private readonly textElementOnPostAutomationRule_LOC: (
    text: string
  ) => Locator;
  LoadMenuList: (menuname: string) => Locator;

  constructor(private page: Page) {
    this.officeConfigLink_LOC = page.locator(
      "//a[contains(text(),'Office Config')]"
    );
    this.postAutomationButton_LOC = page.locator(
      "//input[contains(@value,'Post Automation')]"
    );
    this.searchBoxInput_LOC = page.locator("//input[@type='search']");
    this.searchResultRecordNotFoundText_LOC = page.locator(".dataTables_empty");
    this.selectAllPostAutomationRecordsCheckBox_LOC = page.locator(
      "//input[@id='select-all']"
    );
    this.clickOnDeleteButton_LOC = page.locator(
      "//span[contains(text(),'Delete')]//parent::button"
    );
    this.clickOnEditButton_LOC = page.locator(
      "//span[contains(text(),'Edit')]//parent::button"
    );
    this.deletePopupButton_LOC = page.locator(
      "//button[contains(text(),'Delete')]"
    );

    // Post Automation Rule Form Field Locators
    this.emailNotificationInput_LOC = page.locator(
      "li.select2-selection__choice[title*='@']"
    );
    this.offerRateInput_LOC = page.locator("#form_manual_target_rate");
    this.commodityInput_LOC = page
      .locator(
        "#select2-form_commodity-container .select2-selection__choice, li.select2-selection__choice"
      )
      .filter({ hasNotText: "@" })
      .filter({ hasNotText: "LLC" })
      .first();
    this.includeCarriersValue_LOC = page.locator(
      "#form_carrier_whitelist option[selected]"
    );
    this.excludeCarriersValue_LOC = page.locator(
      "#form_carrier_blacklist option[selected]"
    );
    this.includeCarriersSelect_LOC = page.locator("#form_carrier_whitelist");
    this.excludeCarriersSelect_LOC = page.locator("#form_carrier_blacklist");
    this.postAutomationFormCloseButton_LOC = page.locator(
      "//div[@class='DTED_Lightbox_Close']"
    );
    this.deleteText_LOC = page.locator(
      "//div[contains(text(),'Are you sure you want to delete')]"
    );
    this.customerDropdown_LOC = page.locator("#form_customer_id");
    this.emailNotificationDropdown_LOC = page.locator(
      "#form_notification_address"
    );
    this.pickLocationDropdown_LOC = page.locator("#form_origin");
    this.pickLocationStop1Dropdown_LOC = page.locator(
      "//select[@id='form_stop_1']//following-sibling::span[contains(@class,'select2 select2-container')]"
    );
    this.equipmentDropdown_LOC = page.locator("#form_equipment_code");
    this.loadTypeDropdown_LOC = page.locator("#form_load_method");
    this.showOptionalFieldsButton_LOC = page.locator("#show_optional_fields");
    this.commodityDropdown_LOC = page.locator("#form_commodity");
    this.includeCarrierSelect_LOC = page.locator(
      "//*[@id='form_carrier_whitelist']//following-sibling::span//input[@class='select2-search__field']"
    );
    this.includeCarrierSearchField_LOC = page.locator(
      "//*[@id='form_carrier_whitelist']//following-sibling::span"
    );
    this.selectedIncludeCarriers_LOC = page.locator(
      "//*[@id='form_carrier_whitelist']//parent::div//span[@role='presentation']/following-sibling::span"
    );
    this.excludeCarrierSelect_LOC = page.locator(
      "//*[@id='form_carrier_blacklist']//following-sibling::span//input[@class='select2-search__field']"
    );
    this.excludeCarrierSearchField_LOC = page.locator(
      "//*[@id='form_carrier_blacklist']//following-sibling::span"
    );
    this.selectedExcludeCarriers_LOC = page.locator(
      "//*[@id='form_carrier_blacklist']//parent::div//span[@role='presentation']/following-sibling::span"
    );
    this.textElementOnPostAutomationRule_LOC = (text: string) => {
      return this.page.locator(`//*[text()='${text}']`);
    };
    this.pickLocationDropdown_LOC = page.locator(
      "//select[@id='form_origin']//following-sibling::span[contains(@class,'select2 select2-container')]"
    );
    this.dropLocationDropdown_LOC = page.locator(
      "//select[@id='form_destination']//following-sibling::span[contains(@class,'select2 select2-container')]"
    );
    this.commoditySelect_LOC = page.locator(
      "//*[@id='form_commodity']//following-sibling::span"
    );
    this.ruleSearch_LOC = page.locator(
      " //input[@type='search'   and contains(@aria-controls, 'post_automations')]"
    );
    this.locationValue_LOC = (text: string) => {
      return this.page.locator(`//li[contains(text(),'${text}')]`);
    };
    this.includeCarrierValue_LOC = (text: string) => {
      return this.page.locator(`//span[contains(text(),'${text}')]`);
    };
    this.addStopButton_LOC = page.locator("//a[@id='add_stop']");
    this.LoadMenuList = (menuname: string) => {
      return this.page.getByRole("link", { name: menuname });
    };
    this.postAutomationRuleTable_LOC = page.locator(
      "table#post_automations tbody tr"
    );
    this.selectSinglePostAutomationRecordCheckBox_LOC = page.locator(
      "//table[@id='post_automations']//tbody//tr"
    );
    this.noteFieldInput_LOC = page.locator("#form_notes");
    this.carrierAutoAcceptCheckbox_LOC = page.locator("#form_auto_accept");
    this.carrierAcceptAsUserDropdown_LOC = page.locator("#form_accept_as_user");
    this.viewDetailsLink_LOC = page.locator("//a[@id='carrier_whitelist_view_details']");
    this.closeIncludeCarrierDetailsModalButton_LOC = page.locator("//h5[text()='Include Carriers Details']//parent::div//button[@class='close']");
    this.customerSelect2Container_LOC = page.locator(
      "//select[@id='form_customer_id']//following-sibling::span[contains(@class,'select2')]"
    );
  }
  /**
   * @author Parth Rastogi
   * @description Verifies if a customer has no post automation rule associated with it
   * @modified 2025-07-15
   */
  async verifyCustomerPostAutomationRule(customerName: string): Promise<void> {
    try {
      // Navigate to office config
      await this.hoverAndSelectOfficeConfig();
      // Click post automation button
      await this.clickPostAutomationButton();
      // Search for the customer
      await this.inputSearch(customerName);
      // Verify search results
      await this.verifySearchResults();

      console.log(
        `Post automation rule verification completed for customer: ${customerName}`
      );
    } catch (error) {
      console.error(
        `Error in verifyCustomerPostAutomationRule for customer ${customerName}: ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Click on element based on text content
   * @modified 2026-01-12
   * @param text - The text content of the element to click
   */
  async clickElementByText(text: string): Promise<void> {
    try {
      await this.textElementOnPostAutomationRule_LOC(text).waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      const element = this.textElementOnPostAutomationRule_LOC(text);
      await element.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
      await element.click();
      //await this.page.waitForTimeout(WAIT.SPEC_TIMEOUT);
      console.log(`Successfully clicked element with text: "${text}"`);
    } catch (error) {
      console.error(`Error clicking element with text "${text}": ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Get element by text content
   * @modified 2026-01-12
   * @param text - The text content of the element to find
   * @returns Locator - The element matching the text
   */
  async getElementByText(text: string): Promise<Locator> {
    return this.textElementOnPostAutomationRule_LOC(text);
  }

  /**
   * @author Deepak Bohra
   * @description Verify element exists with specific text
   * @modified 2026-01-12
   * @param text - The text content to verify
   * @returns Promise<boolean> - True if element is visible, false otherwise
   */
  async verifyElementByTextExists(text: string): Promise<boolean> {
    try {
      const element = this.textElementOnPostAutomationRule_LOC(text);
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`Element with text "${text}" exists and is visible`);
      } else {
        console.warn(`Element with text "${text}" not found or not visible`);
      }
      return isVisible;
    } catch (error) {
      console.error(`Error verifying element with text "${text}": ${error}`);
      return false;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Select customer from dropdown by text
   * @modified 2026-01-12
   * @param customerText - The text of the customer to select
   */
  async selectCustomerFromDropdown(customerText: string): Promise<void> {
    try {
      await this.textElementOnPostAutomationRule_LOC(
        POST_AUTOMATION_RULE.CREATE_NEW_ENTRY
      ).waitFor({ state: "visible", timeout: WAIT.DEFAULT });
      //await this.page.waitForLoadState("networkidle");
      await this.customerDropdown_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });

      await this.customerDropdown_LOC.selectOption({ label: customerText });
      console.log(`Successfully selected customer: "${customerText}"`);
    } catch (error) {
      console.error(
        `Error selecting customer "${customerText}" from dropdown: ${error}`
      );
      throw error;
    }
  }

  /**
   * Robust customer selection that handles both pre-populated dropdowns
   * and Select2 search-based dropdowns.
   *
   * Strategy:
   *  1. Wait for the CREATE NEW ENTRY pop-up to be visible.
   *  2. Check if a Select2 container is rendered on top of the customer
   *     <select>. If so, click it, type the customer name to search,
   *     and pick the matching result from the list.
   *  3. If Select2 is not present (plain <select>), fall back to the
   *     regular selectOption({ label }) approach.
   *
   * @param customerText - The customer name to search and select
   */
  async selectOrSearchCustomer(customerText: string): Promise<void> {
    try {
      // Wait for the pop-up form to be visible
      await this.textElementOnPostAutomationRule_LOC(
        POST_AUTOMATION_RULE.CREATE_NEW_ENTRY
      ).waitFor({ state: "visible", timeout: WAIT.DEFAULT });
      await this.page.waitForLoadState("networkidle");

      // --- Attempt 1: Select2 search-based selection ---
      const select2Visible = await this.customerSelect2Container_LOC
        .isVisible()
        .catch(() => false);

      if (select2Visible) {
        console.log(
          `Customer field has Select2 widget — using search for "${customerText}"`
        );
        // Click the Select2 container to open the search input
        await this.customerSelect2Container_LOC.click();

        // Type into the Select2 search input that appears
        const searchInput = this.page.locator(
          "input.select2-search__field"
        );
        await searchInput.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
        await searchInput.fill(customerText);

        // Wait for search results and click the matching item
        const resultItem = this.page.locator(
          `//li[contains(@class,'select2-results__option') and contains(text(),'${customerText}')]`
        );
        await resultItem.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
        await resultItem.click();
        console.log(
          `Successfully selected customer via Select2 search: "${customerText}"`
        );
        return;
      }

      // --- Attempt 2: Plain <select> option selection ---
      console.log(
        `Customer field is a plain dropdown — using selectOption for "${customerText}"`
      );
      await this.customerDropdown_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.customerDropdown_LOC.selectOption({ label: customerText });
      console.log(`Successfully selected customer: "${customerText}"`);
    } catch (error) {
      console.error(
        `Error selecting/searching customer "${customerText}": ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Select email notification address from dropdown by text
   * @modified 2026-01-12
   * @param emailText - The text/email to select
   */
  async selectEmailNotificationAddress(emailText: string): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.emailNotificationDropdown_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.emailNotificationDropdown_LOC.selectOption({
        label: emailText,
      });
      console.log(
        `Successfully selected email notification address: "${emailText}"`
      );
    } catch (error) {
      console.error(
        `Error selecting email notification address "${emailText}": ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Select pick location from dropdown by text
   * @modified 2026-01-12
   * @param locationText - The text of the location to select
   */
  async selectPickLocation(locationText: string): Promise<void> {
    try {
      await this.textElementOnPostAutomationRule_LOC("Location")
        .first()
        .waitFor({ state: "visible", timeout: WAIT.SMALL });
      await this.pickLocationDropdown_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.pickLocationDropdown_LOC.click();
      await this.locationValue_LOC(locationText).waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.locationValue_LOC(locationText).click();
      await console.log(
        `Successfully selected pick location: "${locationText}"`
      );
    } catch (error) {
      console.error(
        `Error selecting pick location "${locationText}": ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Parth Rastogi
   * @description Select pick location stop 1 from dropdown by text
   * @created 2026-01-14
   * @param locationText - The text of the stop 1 location to select
   */
  async selectPickLocationStop1(locationText: string): Promise<void> {
    try {
      await this.textElementOnPostAutomationRule_LOC("Location")
        .first()
        .waitFor({ state: "visible", timeout: WAIT.SMALL });
      await this.pickLocationStop1Dropdown_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.pickLocationStop1Dropdown_LOC.click();
      await this.locationValue_LOC(locationText).waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.locationValue_LOC(locationText).click();
      console.log(
        `Successfully selected pick location stop 1: "${locationText}"`
      );
    } catch (error) {
      console.error(
        `Error selecting pick location stop 1 "${locationText}": ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Select destination location from dropdown by text
   * @modified 2026-01-12
   * @param destinationText - The text of the destination to select
   */
  async selectDestination(destinationText: string): Promise<void> {
    try {
      await this.page.waitForTimeout(WAIT.DEFAULT);
      await this.dropLocationDropdown_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.dropLocationDropdown_LOC.click();
      await this.locationValue_LOC(destinationText).waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.locationValue_LOC(destinationText).click();
      await this.page.waitForTimeout(WAIT.DEFAULT);
      console.log(`Successfully selected destination: "${destinationText}"`);
    } catch (error) {
      console.error(
        `Error selecting destination "${destinationText}": ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Select equipment from dropdown by text
   * @modified 2026-01-12
   * @param equipmentText - The text of the equipment to select
   */
  async selectEquipment(equipmentText: string): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.equipmentDropdown_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.equipmentDropdown_LOC.selectOption({ label: equipmentText });
      console.log(`Successfully selected equipment: "${equipmentText}"`);
    } catch (error) {
      console.error(`Error selecting equipment "${equipmentText}": ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Select load type from dropdown by text
   * @modified 2026-01-12
   * @param loadTypeText - The text of the load type to select
   */
  async selectLoadType(loadTypeText: string): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.loadTypeDropdown_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.loadTypeDropdown_LOC.selectOption({ label: loadTypeText });
      console.log(`Successfully selected load type: "${loadTypeText}"`);
    } catch (error) {
      console.error(`Error selecting load type "${loadTypeText}": ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Enter offer rate value into the offer rate field
   * @modified 2026-01-12
   * @param offerRateValue - The offer rate value to enter
   */
  async enterOfferRate(offerRateValue: string): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.offerRateInput_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.offerRateInput_LOC.clear();
      await this.offerRateInput_LOC.fill(offerRateValue);
      console.log(`Successfully entered offer rate: "${offerRateValue}"`);
    } catch (error) {
      console.error(`Error entering offer rate "${offerRateValue}": ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Enter note field value into the note field
   * @modified 2026-01-14
   * @param noteValue - The note value to enter
   */
  async enterNoteField(noteValue: string): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.noteFieldInput_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.noteFieldInput_LOC.clear();
      await this.noteFieldInput_LOC.fill(noteValue);
      console.log(`Successfully entered note: "${noteValue}"`);
    } catch (error) {
      console.error(`Error entering note "${noteValue}": ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Get the note field value
   * @modified 2026-01-14
   * @returns Promise<string> - The note field value
   */
  async getNoteFieldValue(): Promise<string> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.noteFieldInput_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      const noteValue = await this.noteFieldInput_LOC.inputValue();
      console.log(`✅ Note field value: "${noteValue}"`);
      return noteValue;
    } catch (error) {
      console.error(`Error getting note field value: ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Verify that the note field contains the expected value
   * @modified 2026-01-14
   * @param expectedNoteValue - The expected note value to verify
   * @returns Promise<boolean> - True if note value matches expected, false otherwise
   */
  async verifyNoteFieldValue(expectedNoteValue: string): Promise<boolean> {
    try {
      await this.page.waitForLoadState("networkidle");
      const actualNoteValue = await this.getNoteFieldValue();
      
      const trimmedExpected = expectedNoteValue.trim();
      const trimmedActual = actualNoteValue.trim();
      
      const isMatch = trimmedActual === trimmedExpected;
      
      if (isMatch) {
        console.log(`✅ Note field verification passed: "${trimmedExpected}"`);
      } else {
        console.warn(`❌ Note field verification failed`);
        console.log(`Expected: "${trimmedExpected}"`);
        console.log(`Actual: "${trimmedActual}"`);
      }
      
      expect.soft(trimmedActual, `Note field verification - Expected: "${trimmedExpected}", Actual: "${trimmedActual}"`).toBe(trimmedExpected);
      return isMatch;
    } catch (error) {
      console.error(`Error verifying note field value: ${error}`);
      return false;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Check if show optional fields button is enabled and click it
   * @modified 2026-01-12
   */
  async checkAndClickShowOptionalFields(): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.showOptionalFieldsButton_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      const isEnabled = await this.showOptionalFieldsButton_LOC.isEnabled();
      if (isEnabled) {
        console.log(`Show Optional Fields button is enabled`);
        await this.showOptionalFieldsButton_LOC.click();
        console.log(`Successfully clicked Show Optional Fields button`);
      } else {
        console.warn(`Show Optional Fields button is disabled`);
      }
    } catch (error) {
      console.error(
        `Error checking or clicking Show Optional Fields button: ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Parth Rastogi
   * @description Click on the view details link
   * @modified 2026-01-16
   */
  async clickViewDetailsLink(): Promise<void> {
    try {
      await this.viewDetailsLink_LOC.waitFor({
        state: "visible",
        timeout: GlobalConstants.WAIT.DEFAULT,
      });
      await this.viewDetailsLink_LOC.click();
      console.log("Successfully clicked view details link");
    } catch (error) {
      console.error(`Error clicking view details link: ${error}`);
      throw error;
    }
  }

  /**
   * @author Parth Rastogi
   * @description Click on the close button for include carrier details modal
   * @created 2026-01-16
   */
  async clickCloseIncludeCarrierDetailsModal(): Promise<void> {
    try {
      await this.closeIncludeCarrierDetailsModalButton_LOC.waitFor({
        state: "visible",
        timeout: GlobalConstants.WAIT.DEFAULT,
      });
      await this.closeIncludeCarrierDetailsModalButton_LOC.click();
      console.log("Successfully clicked close include carrier details modal button");
    } catch (error) {
      console.error(`Error clicking close include carrier details modal button: ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Select commodity from dropdown by text
   * @modified 2026-01-12
   * @param commodityText - The text of the commodity to select
   */
  async selectCommodity(commodityText: string): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.commodityDropdown_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.commoditySelect_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.commoditySelect_LOC.click();
      await this.locationValue_LOC(commodityText).waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.locationValue_LOC(commodityText).click();

      console.log(`Successfully selected commodity: "${commodityText}"`);
    } catch (error) {
      console.error(`Error selecting commodity "${commodityText}": ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Select include carrier from Select2 dropdown by text
   * @modified 2026-01-14
   * @param includeCarrierText - The text of the include carrier to select
   */
  async selectIncludeCarrier(includeCarrierText: string): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");

      // Wait for the Select2 container to be visible
      await this.includeCarrierSearchField_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });

      // Click the Select2 container to open dropdown
      await this.includeCarrierSearchField_LOC.click();
      await this.page.waitForTimeout(WAIT.DEFAULT);

      // Fill the input field (use force:true since it might be hidden)
      await this.includeCarrierSelect_LOC.fill(includeCarrierText, {
        force: true,
      });
      await this.page.waitForTimeout(WAIT.DEFAULT);

      // Wait for the matching option to appear and click it
      await this.includeCarrierValue_LOC(includeCarrierText).waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.includeCarrierValue_LOC(includeCarrierText).click();

      console.log(
        `Successfully selected include carrier: "${includeCarrierText}"`
      );
    } catch (error) {
      console.error(
        `Error selecting include carrier "${includeCarrierText}": ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Select multiple include carriers from Select2 dropdown by text
   * @modified 2026-01-14
   * @param includeCarrierTexts - Array of include carrier texts to select
   */
  async selectMultipleIncludeCarriers(
    includeCarrierTexts: string[]
  ): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");

      for (const carrierText of includeCarrierTexts) {
        console.log(`Selecting include carrier: "${carrierText}"`);
        await this.includeCarrierSearchField_LOC.waitFor({
          state: "visible",
          timeout: WAIT.DEFAULT,
        });
        await this.includeCarrierSearchField_LOC.click();
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await this.includeCarrierSelect_LOC.fill(carrierText, { force: true });
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await this.includeCarrierValue_LOC(carrierText).waitFor({
          state: "visible",
          timeout: WAIT.DEFAULT,
        });
        await this.includeCarrierValue_LOC(carrierText).click();
        await this.page.waitForTimeout(WAIT.DEFAULT);
      }

      console.log(
        `✅ Successfully selected ${
          includeCarrierTexts.length
        } include carriers: ${includeCarrierTexts.join(", ")}`
      );
    } catch (error) {
      console.error(`Error selecting multiple include carriers: ${error}`);
      throw error;
    }
  }


  /**
   * @author Deepak Bohra
   * @description Select multiple exclude carriers from Select2 dropdown by text
   * @modified 2026-01-14
   * @param excludeCarrierTexts - Array of exclude carrier texts to select
   */
  async selectMultipleExcludeCarriers(
    excludeCarrierTexts: string[]
  ): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");

      for (const carrierText of excludeCarrierTexts) {
        console.log(`Selecting exclude carrier: "${carrierText}"`);
        await this.excludeCarrierSearchField_LOC.waitFor({
          state: "visible",
          timeout: WAIT.DEFAULT,
        });
        await this.excludeCarrierSearchField_LOC.click();
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await this.excludeCarrierSelect_LOC.fill(carrierText, { force: true });
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await this.includeCarrierValue_LOC(carrierText).waitFor({
          state: "visible",
          timeout: WAIT.DEFAULT,
        });
        await this.includeCarrierValue_LOC(carrierText).click();
        await this.page.waitForTimeout(WAIT.DEFAULT);
      }

      console.log(
        `✅ Successfully selected ${
          excludeCarrierTexts.length
        } exclude carriers: ${excludeCarrierTexts.join(", ")}`
      );
    } catch (error) {
      console.error(`Error selecting multiple exclude carriers: ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Generic function to get all selected carriers (include or exclude)
   * @modified 2026-01-14
   * @param carrierType - The carrier type: 'include' or 'exclude'
   * @returns Promise<string[]> - Array of selected carrier names
   */
  async getSelectedCarriers(
    carrierType: "include" | "exclude" = "include"
  ): Promise<string[]> {
    try {
      await this.page.waitForLoadState("networkidle");

      const locator =
        carrierType === "include"
          ? this.selectedIncludeCarriers_LOC
          : this.selectedExcludeCarriers_LOC;

      const carrierCount = await locator.count();

      if (carrierCount === 0) {
        console.warn(`No ${carrierType} carriers selected`);
        return [];
      }

      const carriers: string[] = [];
      for (let i = 0; i < carrierCount; i++) {
        const carrierText = await locator.nth(i).textContent();
        if (carrierText) {
          carriers.push(carrierText.trim());
        }
      }

      console.log(
        `✅ Selected ${carrierType} carriers: ${carriers.join(", ")}`
      );
      return carriers;
    } catch (error) {
      console.error(`Error getting selected ${carrierType} carriers: ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Generic function to verify that a specific carrier is selected
   * @modified 2026-01-14
   * @param expectedCarrier - The carrier name to verify
   * @param carrierType - The carrier type: 'include' or 'exclude'
   * @returns Promise<boolean> - True if carrier is selected, false otherwise
   */
  async verifyCarrierSelected(
    expectedCarrier: string,
    carrierType: "include" | "exclude" = "include"
  ): Promise<boolean> {
    try {
      await this.page.waitForLoadState("networkidle");
      const selectedCarriers = await this.getSelectedCarriers(carrierType);

      const isSelected = selectedCarriers.some((carrier) =>
        carrier.toLowerCase().includes(expectedCarrier.toLowerCase())
      );

      if (isSelected) {
        console.log(
          `✅ ${
            carrierType.charAt(0).toUpperCase() + carrierType.slice(1)
          } carrier "${expectedCarrier}" is selected`
        );
      } else {
        console.warn(
          `❌ ${
            carrierType.charAt(0).toUpperCase() + carrierType.slice(1)
          } carrier "${expectedCarrier}" is NOT selected`
        );
        console.log(
          `Currently selected ${carrierType} carriers: ${selectedCarriers.join(
            ", "
          )}`
        );
      }

      expect
        .soft(
          isSelected,
          `${carrierType} carrier verification - Expected "${expectedCarrier}" to be selected`
        )
        .toBeTruthy();
      return isSelected;
    } catch (error) {
      console.error(
        `Error verifying ${carrierType} carrier "${expectedCarrier}": ${error}`
      );
      return false;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Get all selected include carrier values (wrapper for generic function)
   * @modified 2026-01-14
   * @returns Promise<string[]> - Array of selected include carrier names
   */
  async getSelectedIncludeCarriers(): Promise<string[]> {
    return this.getSelectedCarriers("include");
  }

  /**
   * @author Deepak Bohra
   * @description Verify that a specific include carrier is selected (wrapper for generic function)
   * @modified 2026-01-14
   * @param expectedCarrier - The carrier name to verify
   * @returns Promise<boolean> - True if carrier is selected, false otherwise
   */
  async verifyIncludeCarrierSelected(
    expectedCarrier: string
  ): Promise<boolean> {
    return this.verifyCarrierSelected(expectedCarrier, "include");
  }

  /**
   * @author Deepak Bohra
   * @description Get all selected exclude carrier values (wrapper for generic function)
   * @modified 2026-01-14
   * @returns Promise<string[]> - Array of selected exclude carrier names
   */
  async getSelectedExcludeCarriers(): Promise<string[]> {
    return this.getSelectedCarriers("exclude");
  }

  /**
   * @author Deepak Bohra
   * @description Verify that a specific exclude carrier is selected (wrapper for generic function)
   * @modified 2026-01-14
   * @param expectedCarrier - The carrier name to verify
   * @returns Promise<boolean> - True if carrier is selected, false otherwise
   */
  async verifyExcludeCarrierSelected(
    expectedCarrier: string
  ): Promise<boolean> {
    return this.verifyCarrierSelected(expectedCarrier, "exclude");
  }

  /**
   * @author Deepak Bohra
   * @description Get all selected include carrier values from the select element
   * @modified 2026-01-14
   * @returns Promise<string[]> - Array of all selected carrier names from <option selected>
   */
  async getSelectedIncludeCarriersFromSelect(): Promise<string[]> {
    try {
      await this.page.waitForLoadState("networkidle");

      // Get all selected options from the select element
      const selectedOptions =
        await this.includeCarriersValue_LOC.allTextContents();

      if (selectedOptions.length === 0) {
        console.warn(`No include carriers selected in the select element`);
        return [];
      }

      // Filter and trim the carrier names
      const carriers = selectedOptions
        .map((option) => option.trim())
        .filter((option) => option.length > 0);

      console.log(
        `✅ Selected include carriers from select: ${carriers.join(", ")}`
      );
      return carriers;
    } catch (error) {
      console.error(
        `Error getting selected include carriers from select: ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Verify that specific carriers are selected in the select element
   * @modified 2026-01-14
   * @param expectedCarriers - Array of expected carrier names to verify
   * @returns Promise<boolean> - True if all expected carriers are selected, false otherwise
   */
  async verifyIncludeCarriersInSelect(
    expectedCarriers: string[]
  ): Promise<boolean> {
    try {
      await this.page.waitForLoadState("networkidle");
      const selectedCarriers =
        await this.getSelectedIncludeCarriersFromSelect();

      // Check if all expected carriers are present
      const allFound = expectedCarriers.every((expectedCarrier) =>
        selectedCarriers.some((selected) =>
          selected.toLowerCase().includes(expectedCarrier.toLowerCase())
        )
      );

      if (allFound) {
        console.log(
          `✅ All expected carriers are selected: ${expectedCarriers.join(
            ", "
          )}`
        );
      } else {
        console.warn(`❌ Some carriers are missing`);
        console.log(`Expected: ${expectedCarriers.join(", ")}`);
        console.log(`Selected: ${selectedCarriers.join(", ")}`);
      }

      expect
        .soft(
          allFound,
          `Include carriers verification - Expected: ${expectedCarriers.join(
            ", "
          )}, Found: ${selectedCarriers.join(", ")}`
        )
        .toBeTruthy();
      return allFound;
    } catch (error) {
      console.error(`Error verifying include carriers in select: ${error}`);
      return false;
    }
  }

  /**
   * @author Parth Rastogi
   * @description Handles hovering and clicking the Office Config link
   * @modified 2025-07-15
   */
  async hoverAndSelectOfficeConfig() {
    try {
      const officeConfig = this.officeConfigLink_LOC;
      await officeConfig.waitFor({ state: "visible" });
      await officeConfig.hover();
      await officeConfig.click();
    } catch (error) {
      console.error(`Error Hovering and Clicking Office Config: ${error}`);
      throw error; // rethrow an error if needed
    }
  }

  /**
   * @author Parth Rastogi
   * @description Clicks the Post Automation button
   * @modified 2025-07-15
   */
  async clickPostAutomationButton() {
    try {
      const postAutomationButton = this.postAutomationButton_LOC;
      await postAutomationButton.waitFor({ state: "visible" });
      await postAutomationButton.click();
    } catch (error) {
      console.error(`Error Clicking Post Automation Button: ${error}`);
      throw error; // rethrow an error if needed
    }
  }

  /**
   * @author Parth Rastogi
   * @description Clicks the Add Stop button
   * @created 2026-01-14
   */
  async clickAddStopButton(): Promise<void> {
    try {
      await this.addStopButton_LOC.waitFor({
        state: "visible",
        timeout: GlobalConstants.WAIT.DEFAULT,
      });
      await this.addStopButton_LOC.click();
      console.log('✅ Successfully clicked Add Stop button');
    } catch (error) {
      console.error(`❌ Error clicking Add Stop button: ${error}`);
      throw error;
    }
  }

  /**
   * @author Parth Rastogi
   * @description Inputs the customer name in the search box
   * @modified 2025-07-15
   */
  async ruleInputSearch(CustomerName: string) {
    {
      try {
        await this.page.waitForLoadState("networkidle");
        await commonReusables.waitForAllLoadStates(this.page);
        await this.ruleSearch_LOC.waitFor({
          state: "visible",
          timeout: WAIT.MID,
        });
        const searchInputBox = this.ruleSearch_LOC;
        await searchInputBox.waitFor({ state: "visible" });
        await searchInputBox.click();
        await searchInputBox.fill(CustomerName);
      } catch (error) {
        console.error(`Error Clicking Search Button: ${error}`);
        throw error; // rethrow an error if needed
      }
    }
  }

  /**
   * @author Parth Rastogi
   * @description Inputs the customer name in the search box
   * @modified 2025-07-15
   */
  async inputSearch(CustomerName: string) {
    {
      try {
        await this.page.waitForLoadState("networkidle");
        await commonReusables.waitForAllLoadStates(this.page);
        await this.searchBoxInput_LOC.waitFor({
          state: "visible",
          timeout: WAIT.MID,
        });
        const searchInputBox = this.searchBoxInput_LOC;
        await searchInputBox.waitFor({ state: "visible" });
        await searchInputBox.click();
        await searchInputBox.fill(CustomerName);
      } catch (error) {
        console.error(`Error Clicking Search Button: ${error}`);
        throw error; // rethrow an error if needed
      }
    }
  }

  /**
   * @author Parth Rastogi
   * @description Verifies the search results for post automation rules
   * @modified 2025-07-15
   */
  async verifySearchResults() {
    try {
      await this.page.waitForLoadState("networkidle");

      let searchResult = this.searchResultRecordNotFoundText_LOC;

      let searchResulttext;
      if (await this.searchResultRecordNotFoundText_LOC.isVisible()) {
        searchResulttext = await searchResult.textContent();

        console.log(`Post Automation Search Result Value: ${searchResulttext}`);

        if (
          searchResulttext?.trim() === "No matching records found" ||
          searchResulttext?.trim() === "No data available in table"
        ) {
          console.log(
            "No matching post automation rule found for the customer."
          );
        }
      } else {
        console.log("tested");
        await this.selectAllPostAutomationRecordsCheckBox_LOC.isVisible();
        await this.selectAllPostAutomationRecordsCheckBox_LOC.click();
        await this.clickOnDeleteButton_LOC.isEnabled();
        await this.clickOnDeleteButton_LOC.isVisible();
        await this.clickOnDeleteButton_LOC.click();
        await this.deleteText_LOC.waitFor({
          state: "visible",
          timeout: WAIT.DEFAULT,
        });
        const deleteText = await this.deleteText_LOC.textContent();
        console.log(`Delete Confirmation Text: ${deleteText}`);
        await this.deletePopupButton_LOC.waitFor({ state: "visible" });
        await this.deletePopupButton_LOC.click();
      }
    } catch (error) {
      console.error(`Error Clicking Search Results: ${error}`);
      throw error; // rethrow an error if needed
    }
  }
  /**
   * @author Parth Rastogi
   * @description Verifies the post automation rule for a customer
   * @modified 2025-07-15
   */
  async getPostAutomationRuleValues(CustomerName: string) {
    try {
      // Navigate to office config
      await this.hoverAndSelectOfficeConfig();
      // Click post automation button
      await this.clickPostAutomationButton();
      // Search for the customer
      await this.searchBoxInput_LOC.waitFor({ state: "visible" });
      await this.searchBoxInput_LOC.fill(CustomerName);

      await this.inputSearch(CustomerName);
      await this.page.waitForLoadState("networkidle");
      await this.selectAllPostAutomationRecordsCheckBox_LOC.isVisible();
      await this.selectAllPostAutomationRecordsCheckBox_LOC.click();
      await this.clickOnEditButton_LOC.isVisible();
      await this.clickOnEditButton_LOC.click();
      await this.fetchPostAutomationRuleValues(CustomerName);
      await this.postAutomationFormCloseButton_LOC.click();
    } catch (error) {
      console.error(`Error in getPostAutomationValues: ${error}`);
      throw error; // propagate the error for upstream handling
    }
  }

  /**
   * @author Parth Rastogi
   * @description Fetches post automation rule values for Email Notification, Offer Rate, Commodity, Include Carriers, and Exclude Carriers
   * @created 2025-01-03
   * @param customerName - Name of the customer to search for
   * @returns Promise<{emailNotification: string, offerRate: string, commodity: string, includeCarriers: string, excludeCarriers: string}> - Returns all field values
   */
  async fetchPostAutomationRuleValues(customerName: string): Promise<{
    emailNotification: string;
    offerRate: string;
    commodity: string;
    includeCarriers: string;
    excludeCarriers: string;
  }> {
    try {
      console.log(
        `Fetching post automation rule values for customer: ${customerName}`
      );
      await this.page.waitForLoadState("networkidle");
      // Get field values using textContent with proper wait
      await this.emailNotificationInput_LOC.waitFor({
        state: "visible",
        timeout: WAIT.SMALL,
      });
      let emailNotification =
        (await this.emailNotificationInput_LOC.textContent()) ||
        (await this.emailNotificationInput_LOC.getAttribute("title")) ||
        "";

      // Remove the × character from the beginning if present
      emailNotification = emailNotification.replace(/^×\s*/, "").trim();
      console.log(`Email Notification: "${emailNotification}"`);

      await this.offerRateInput_LOC.waitFor({
        state: "visible",
        timeout: WAIT.SMALL,
      });
      const offerRate =
        (await this.offerRateInput_LOC.inputValue()) ||
        (await this.offerRateInput_LOC.getAttribute("value")) ||
        "";
      console.log(`Offer Rate: "${offerRate}"`);

      // Get commodity value with error handling for empty/missing values
      let commodity = "";
      try {
        // Check if commodity element exists first
        const commodityExists = (await this.commodityInput_LOC.count()) > 0;
        if (commodityExists) {
          await this.commodityInput_LOC.waitFor({
            state: "visible",
            timeout: WAIT.DEFAULT,
          });
          commodity =
            (await this.commodityInput_LOC.getAttribute("title")) || "";
          // Clean up any extra whitespace
          commodity = commodity.trim();
        } else {
          console.warn(`Commodity locator not found in DOM`);
          commodity = "";
        }
      } catch (error) {
        console.warn(`Could not fetch commodity value: ${error}`);
        //commodity = "";
      }
      console.log(`Commodity: "${commodity}"`);

      //include carrier
      let includeCarriers = "";
      try {
        // Wait for the element to be ready
        await this.page.waitForLoadState("networkidle");
        await this.page.waitForTimeout(WAIT.DEFAULT); // Give time for selections to load

        const includeCarrierExists =
          (await this.includeCarriersValue_LOC.count()) > 0;

        if (includeCarrierExists) {
          // Get all selected option text contents
          const allIncludeCarriers =
            await this.includeCarriersValue_LOC.allTextContents();

          // Join all carrier names
          includeCarriers = allIncludeCarriers
            .filter((carrier) => carrier.trim().length > 0) // Remove empty strings
            .join(", ");
        } else {
          // Fallback: try to get the value attribute instead
          const selectedValue = await this.includeCarriersSelect_LOC
            .inputValue()
            .catch(() => "");

          if (selectedValue) {
            // Get the text of the selected option
            const selectedOption = this.includeCarriersSelect_LOC.locator(
              `option[value="${selectedValue}"]`
            );
            const optionText = await selectedOption
              .textContent()
              .catch(() => "");
            includeCarriers = optionText || selectedValue;
          } else {
            includeCarriers = "";
          }
        }
      } catch (error) {
        console.warn(`Could not fetch include carriers value: ${error}`);
        includeCarriers = "";
      }
      console.log(`Include Carriers: "${includeCarriers}"`);

      // Exclude Carriers
      let excludeCarriers = "";
      try {
        const excludeCarrierExists =
          (await this.excludeCarriersValue_LOC.count()) > 0;
        if (excludeCarrierExists) {
          // Get all selected option text contents
          const allExcludeCarriers =
            await this.excludeCarriersValue_LOC.allTextContents();

          // Join all carrier names
          excludeCarriers = allExcludeCarriers
            .filter((carrier) => carrier.trim().length > 0) // Remove empty strings
            .join(", ");
        } else {
          // Fallback: try to get the value attribute instead
          const selectedValue = await this.excludeCarriersSelect_LOC
            .inputValue()
            .catch(() => "");

          if (selectedValue) {
            // Get the text of the selected option
            const selectedOption = this.excludeCarriersSelect_LOC.locator(
              `option[value="${selectedValue}"]`
            );
            const optionText = await selectedOption
              .textContent()
              .catch(() => "");
            excludeCarriers = optionText || selectedValue;
          } else {
            excludeCarriers = "";
          }
        }
      } catch (error) {
        console.warn(`Could not fetch exclude carriers value: ${error}`);
        excludeCarriers = "";
      }
      console.log(`Exclude Carriers: "${excludeCarriers}"`);
      return {
        emailNotification,
        offerRate,
        commodity,
        includeCarriers,
        excludeCarriers,
      };
    } catch (error) {
      console.error(`❌ Failed to fetch post automation rule values: ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @created 2026-01-13
   * @description Get cell value by column name from a table row
   * @param row - The row locator containing cells
   * @param columnName - The name of the column to retrieve
   * @returns Promise<string> - The text content of the cell
   */
  async getCellValue(
    row: Locator,
    columnName: keyof typeof GlobalConstants.POST_AUTOMATION_COLUMNS
  ): Promise<string> {
    const columnIndex = GlobalConstants.POST_AUTOMATION_COLUMNS[columnName];
    const cells = row.locator("td");
    return cells.nth(columnIndex).innerText();
  }

  /**
   * @author Deepak Bohra
   * @created 2026-01-13
   * @description validate single post automation rule row against expected data
   * @param expectedData - Expected data object containing validation fields
   * @author Parth Rastogi
   * @modified 2026-01-14
   * @param stopsCount - Optional parameter to specify stop count (1, 2, 3, etc.) - defaults to 0
   */
  async verifySinglePostAutomationRow(expectedData: any, stopsCount: number = 0) {
    //const rows = this.page.locator("table#post_automations tbody tr");
    const rows = this.postAutomationRuleTable_LOC;
    await rows.first().waitFor();

    // ✅ Check only one row is present
    const rowCount = await rows.count();
    expect(rowCount).toBe(1);
    console.log(`Row count on UI: ${rowCount}`);

    const row = rows.first();

    // ✅ Convert expected stops count to string for comparison
    const expectedStopsCount = stopsCount.toString();

    // ✅ Log actual values before validation
    console.log("UI Row Values:");
    console.log("Origin City:", await this.getCellValue(row, "originCity"));
    console.log("Origin State:", await this.getCellValue(row, "originState"));
    console.log("Origin Zip:", await this.getCellValue(row, "originZip"));
    console.log("Origin EDI:", await this.getCellValue(row, "originEdi"));
    console.log(
      "Destination City:",
      await this.getCellValue(row, "destinationCity")
    );
    console.log(
      "Destination State:",
      await this.getCellValue(row, "destinationState")
    );
    console.log(
      "Destination Zip:",
      await this.getCellValue(row, "destinationZip")
    );
    console.log(
      "Destination EDI:",
      await this.getCellValue(row, "destinationEdi")
    );
    
    const actualStopsValue = await this.getCellValue(row, "stops");
    console.log("Stops:", actualStopsValue);
    console.log(`Expected Stops: ${expectedStopsCount}, Actual Stops: ${actualStopsValue}`);
    
    console.log(
      "Equipment:",
      await this.getCellValue(row, "equipment")
    );
    console.log(
      "Customer Name:",
      await this.getCellValue(row, "customerName")
    );
    console.log("Method:", await this.getCellValue(row, "method"));
    console.log("Offer Rate:", await this.getCellValue(row, "offerRate"));
    console.log("EDI?:", await this.getCellValue(row, "edi"));
    console.log(
      "Date Last Updated:",
      await this.getCellValue(row, "dateLastUpdated")
    );

    // ✅ Validate fields using column map
    expect
      .soft(await this.getCellValue(row, "originCity"))
      .toBe(expectedData.originCity);
    expect
      .soft(await this.getCellValue(row, "originState"))
      .toBe(expectedData.originState);
    expect
      .soft(await this.getCellValue(row, "originZip"))
      .toBe(expectedData.originZip);
    expect
      .soft(await this.getCellValue(row, "originEdi"))
      .toBe(expectedData.originEdi);

    expect.soft(await this.getCellValue(row, "destinationCity")).toBe(
      expectedData.destinationCity
    );
    expect.soft(await this.getCellValue(row, "destinationState")).toBe(
      expectedData.destinationState
    );
    expect.soft(await this.getCellValue(row, "destinationZip")).toBe(
      expectedData.destinationZip
    );
    expect.soft(await this.getCellValue(row, "destinationEdi")).toBe(
      expectedData.destinationEdi
    );
    
    // ✅ Validate stops count with soft assertion
    expect.soft(actualStopsValue, `Stops validation - Expected: "${expectedStopsCount}", Actual: "${actualStopsValue}"`).toBe(expectedStopsCount);
    
    expect.soft(await this.getCellValue(row, "equipment")).toBe(
      expectedData.equipment
    );
    expect.soft(await this.getCellValue(row, "customerName")).toBe(
      expectedData.customerName
    );
    expect.soft(await this.getCellValue(row, "method")).toBe(
      expectedData.method
    );
    expect.soft(await this.getCellValue(row, "offerRate")).toContain(
      String(expectedData.offerRate)
    );
    expect.soft(await this.getCellValue(row, "edi")).toBe(
      POST_AUTOMATION_RULE.NO
    );

    // ✅ Validate date is within acceptable range
    const currentTime = await commonReusables.getCstPlusOneFormatted();
    const uiTimestamp = await this.getCellValue(row, "dateLastUpdated");
    console.log(`UI Timestamp: "${uiTimestamp}"`);
    console.log(`Current Time: "${currentTime}"`);
    expect
      .soft(commonReusables.isWithinTimeRange(uiTimestamp, currentTime, 300))
      .toBeTruthy();
  }

  /**
   * @author Parth Rastogi
   * @description Clicks select all checkbox and then clicks edit button
   * @created 2026-01-13
   */
  async clickSelectSingleRecordAndEdit(): Promise<void> {
    try {
      console.log("Selecting post automation records and clicking edit...");
      await this.page.waitForLoadState("networkidle");

      // Wait for and click the select all checkbox
      await this.selectSinglePostAutomationRecordCheckBox_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.selectSinglePostAutomationRecordCheckBox_LOC.first().click();
      console.log("Successfully clicked checkbox");

      // Wait for and click the edit button
      await this.clickOnEditButton_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.clickOnEditButton_LOC.isEnabled();
      await this.clickOnEditButton_LOC.click();
      console.log("Successfully clicked edit button");
    } catch (error) {
      console.error(`Error in clickSelectAllAndEdit: ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Click on the carrier auto accept checkbox
   * @created 2026-01-16
   */
  async clickCarrierAutoAcceptCheckbox(): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.carrierAutoAcceptCheckbox_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      await this.carrierAutoAcceptCheckbox_LOC.click();
      console.log("✅ Successfully clicked carrier auto accept checkbox");
    } catch (error) {
      console.error(`Error clicking carrier auto accept checkbox: ${error}`);
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Check if carrier auto accept checkbox is enabled
   * @created 2026-01-16
   * @returns Promise<boolean> - True if checkbox is enabled, false otherwise
   */
  async isCarrierAutoAcceptCheckboxEnabled(): Promise<boolean> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.carrierAutoAcceptCheckbox_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      const isEnabled = await this.carrierAutoAcceptCheckbox_LOC.isEnabled();
      console.log(
        `Carrier auto accept checkbox is ${
          isEnabled ? "enabled" : "disabled"
        }`
      );
      return isEnabled;
    } catch (error) {
      console.error(
        `Error checking if carrier auto accept checkbox is enabled: ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Check if carrier auto accept checkbox is checked
   * @created 2026-01-16
   * @returns Promise<boolean> - True if checkbox is checked, false otherwise
   */
  async isCarrierAutoAcceptCheckboxChecked(): Promise<boolean> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.carrierAutoAcceptCheckbox_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      const isChecked = await this.carrierAutoAcceptCheckbox_LOC.isChecked();
      console.log(
        `Carrier auto accept checkbox is ${isChecked ? "checked" : "unchecked"}`
      );
      return isChecked;
    } catch (error) {
      console.error(
        `Error checking if carrier auto accept checkbox is checked: ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Verify that carrier auto accept checkbox is enabled
   * @created 2026-01-16
   */
  async verifyCarrierAutoAcceptCheckboxEnabled(): Promise<void> {
    try {
      const isEnabled = await this.isCarrierAutoAcceptCheckboxEnabled();
      expect.soft(
        isEnabled,
        "Carrier auto accept checkbox should be enabled"
      ).toBeTruthy();
      console.log("✅ Carrier auto accept checkbox verified as enabled");
    } catch (error) {
      console.error(
        `Error verifying carrier auto accept checkbox is enabled: ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Select carrier accept as user from dropdown by value
   * @created 2026-01-16
   * @param userEmail - The email value to select from the dropdown (e.g., "deepak.bohra@modeglobal.com")
   */
  async selectCarrierAcceptAsUser(userEmail: string): Promise<void> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.carrierAcceptAsUserDropdown_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      
      // Select by value attribute
      await this.carrierAcceptAsUserDropdown_LOC.selectOption({ value: userEmail });
      console.log(`✅ Successfully selected carrier accept as user: "${userEmail}"`);
    } catch (error) {
      console.error(
        `Error selecting carrier accept as user "${userEmail}": ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Get the selected carrier accept as user value
   * @created 2026-01-16
   * @returns Promise<string> - The selected user email value
   */
  async getSelectedCarrierAcceptAsUser(): Promise<string> {
    try {
      await this.page.waitForLoadState("networkidle");
      await this.carrierAcceptAsUserDropdown_LOC.waitFor({
        state: "visible",
        timeout: WAIT.DEFAULT,
      });
      
      const selectedValue = await this.carrierAcceptAsUserDropdown_LOC.inputValue();
      console.log(`✅ Selected carrier accept as user: "${selectedValue}"`);
      return selectedValue;
    } catch (error) {
      console.error(
        `Error getting selected carrier accept as user: ${error}`
      );
      throw error;
    }
  }

  /**
   * @author Deepak Bohra
   * @description Verify that a specific carrier accept as user is selected
   * @created 2026-01-16
   * @param expectedEmail - The expected user email to verify
   * @returns Promise<boolean> - True if the email is selected, false otherwise
   */
  async verifyCarrierAcceptAsUserSelected(expectedEmail: string): Promise<boolean> {
    try {
      await this.page.waitForLoadState("networkidle");
      const selectedEmail = await this.getSelectedCarrierAcceptAsUser();
      
      const isMatch = selectedEmail === expectedEmail;
      if (isMatch) {
        console.log(`✅ Carrier accept as user verified: "${expectedEmail}"`);
      } else {
        console.warn(`❌ Carrier accept as user mismatch`);
        console.log(`Expected: "${expectedEmail}"`);
        console.log(`Actual: "${selectedEmail}"`);
      }
      
      expect.soft(selectedEmail, `Carrier accept as user - Expected: "${expectedEmail}", Actual: "${selectedEmail}"`).toBe(expectedEmail);
      return isMatch;
    } catch (error) {
      console.error(`Error verifying carrier accept as user: ${error}`);
      return false;
    }
  }
}


export default PostAutomationRulePage;
