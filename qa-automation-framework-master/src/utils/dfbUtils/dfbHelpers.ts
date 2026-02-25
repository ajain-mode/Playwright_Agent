/*
 * @author Deepak Bohra
 * @Created :2025-01-08
 */

import { GlobalConstants } from "@utils/globalConstants";
import { PageManager } from "@utils/PageManager";
import commissionHelper from "@utils/commission-helpers";

const { HEADERS, ADMIN_SUB_MENU, CUSTOMER_SUB_MENU, LOAD_TYPES } =
  GlobalConstants;

class DfbHelpers {
  async reloadAndNavigateToNewLoad(
    pages: PageManager,
    page: any,
    testData: any
  ) {
    await pages.editLoadPage.validateEditLoadHeadingText();
    await page.waitForLoadState("load");
    await page.waitForLoadState("networkidle");
    await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
    //@modified by Rohit Singh: 18-Dec-2025: Updated to use searchCustomerAndClickDetails method
    await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
    // await pages.searchCustomerPage.clickOnSearchCustomerLink();
    await pages.searchCustomerPage.searchCustomerAndClickDetails(
      testData.customerName
    );
    await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LOAD_TL);
    await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
  }
  /**
   * @author Deepak Bohra
   * @description Common setup function for DFB tests - handles office configuration, user switching, post automation rule verification, and customer search
   * @created 2025-08-18
   * @modified 2025-09-27
   * @param pages - PageManager instance
   * @param officeName - Office name for pre-condition setup
   * @param toggleSettingsValue - Toggle settings configuration for office pre-conditions
   * @param ensureToggleValue - Toggle settings value for verification (e.g., pages.toggleSettings.verifyDME)
   * @param salesAgent - Sales agent to switch to
   * @param customerName - Customer name to search and verify
   * @param cargoValueType - Cargo value type (default: CARGO_VALUES.DEFAULT)
   * @param loadType - Load type for navigation (default: LOAD_TYPES.NEW_LOAD_TL)
   * @returns cargo value from customer verification
   */
  async setupDFBTestPreConditions(
    pages: PageManager,
    officeName: string,
    toggleSettingsValue: any,
    ensureToggleValue: any,
    salesAgent: string,
    customerName: string,
    cargoValueType: any = CARGO_VALUES.DEFAULT,
    loadType: any = LOAD_TYPES.NEW_LOAD_TL,
    skipPostAutomationRule: boolean = false, // ← Add this parameter
    skipUpdateGreenScreenfield: boolean = false, // ← New parameter
    skipNavigateToLoad: boolean = false // ← New parameter
  ) {
    let cargoValue;

    await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
    await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
    await pages.officePage.configureOfficePreConditions(
      officeName,
      toggleSettingsValue
    );
    await pages.officePage.ensureToggleValues(ensureToggleValue);

    // Search customer and create new load
    await pages.basePage.clickHomeButton();
    await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
    await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
    await pages.searchCustomerPage.enterCustomerName(customerName);
    await pages.searchCustomerPage.clickOnSearchCustomer();
    await pages.searchCustomerPage.clickOnActiveCustomer();
    await commissionHelper.updateAvailableCreditOnCustomer(pages.page);

    console.log("Office Pre-condition set successfully");
    await pages.adminPage.hoverAndClickAdminMenu();
    await pages.adminPage.switchUser(salesAgent);
    console.log("Switched user to that has agent as its salesperson");
    await pages.basePage.waitForMultipleLoadStates([
      "load",
      "networkidle",
      "domcontentloaded",
    ]);
    if (!skipPostAutomationRule) {
      await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
      await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(
        customerName
      );
      console.log("Verified no post automation rule for customer");
    }
    await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
    await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
    await pages.searchCustomerPage.searchCustomerAndClickDetails(customerName);
    cargoValue = await pages.viewCustomerPage.verifyAndSetCargoValue(
      cargoValueType
    );
    await pages.viewCustomerPage.setPracticalDefaultMethodIfNeeded();
    if (!skipUpdateGreenScreenfield) {
      await pages.viewCustomerPage.getGreenScreenAutoPopulationStatus();
    }

    if (!skipNavigateToLoad) {
      await pages.viewCustomerPage.navigateToLoad(loadType);
    }
    console.log("Customer search and load navigation successful");

    return cargoValue;
  }

  /**
   * @author Parth Rastogi
   * @description Common setup function for DFB tests with Post Automation Rule verification - handles office configuration, user switching, post automation rule verification, and customer search
   * @created 2025-08-18
   * @param pages - PageManager instance
   * @param officeName - Office name for pre-condition setup
   * @param toggleSettingsValue - Toggle settings configuration for office pre-conditions
   * @param ensureToggleValue - Toggle settings value for verification (e.g., pages.toggleSettings.verifyDME)
   * @param salesAgent - Sales agent to switch to
   * @param customerName - Customer name to search and verify
   * @param cargoValueType - Cargo value type (default: CARGO_VALUES.DEFAULT)
   * @param loadType - Load type for navigation (default: LOAD_TYPES.NEW_LOAD_TL)
   * @returns cargo value from customer verification
   */
  async setupDFBTestWithPostAutomationRulePreConditions(
    pages: PageManager,
    officeName: string,
    toggleSettingsValue: any,
    ensureToggleValue: any,
    salesAgent: string,
    customerName: string,
    cargoValueType: any = CARGO_VALUES.DEFAULT,
    loadType: any = LOAD_TYPES.NEW_LOAD_TL,
    skipPostAutomationRule: boolean = false // ← Add this parameter
  ) {
    let cargoValue;

    await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
    await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
    await pages.officePage.configureOfficePreConditions(
      officeName,
      toggleSettingsValue
    );
    await pages.officePage.ensureToggleValues(ensureToggleValue);
    console.log("Office Pre-condition set successfully");
    await pages.adminPage.hoverAndClickAdminMenu();
    await pages.adminPage.switchUser(salesAgent);
    console.log("Switched user to that has agent as its salesperson");

    await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
    await pages.postAutomationRulePage.getPostAutomationRuleValues(
      customerName
    );
    console.log("Values retrieved successfully");

    await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
    await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
    await pages.searchCustomerPage.searchCustomerAndClickDetails(customerName);
    cargoValue = await pages.viewCustomerPage.verifyAndSetCargoValue(
      cargoValueType
    );

    await pages.viewCustomerPage.navigateToLoad(loadType);
    console.log("Customer search and load navigation successful");

    return cargoValue;
  }

  /**
   * @author Parth Rastogi
   * @description Common setup function for DFB tests - handles office configuration
   * @created 2025-08-18
   **/
  async setupOfficePreConditions(
    pages: PageManager,
    officeName: string,
    toggleSettingsValue: any,
    ensureToggleValue: any
  ) {
    await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
    await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
    await pages.officePage.configureOfficePreConditions(
      officeName,
      toggleSettingsValue
    );

    await pages.officePage.ensureToggleValues(ensureToggleValue);
    console.log("Office Pre-condition set successfully");
  }

  /**
   * @author Deepak Bohra
   * @description Common setup function for DFB include carrier and waterfall data validation tests
   * @created 2025-12-09
   **/

  /**
   * Encapsulates the common sequence used by multiple specs:
   * - enter offer rate
   * - optionally select include carriers
   * - open include carriers details and update carriers data
   * - save include-carriers modal and the load
   * - validate post status, expected field values and table fields
   */
  async enterOfferRateSaveAndValidate(
    pages: PageManager,
    options: {
      offerRate?: string;
      includeCarriers?: string[];
      carriersData?: Array<{ name: string; values: any[] }>;
      clickSave?: boolean;
      clickPost?: boolean;
      enterOfferRateOnWaterfall?: boolean;
      validatePostBefore?: string;
      validatePostAfter?: string;
      expectedValues?: {
        offerRate: string;
        expirationDate: string;
        expirationTime: string;
      };
      formState?: { includeCarriers?: string[]; emailNotification?: string };
      notEditableFields?: string[];
      editableFields?: string[];
      mixedButtonStatesBefore?: Record<string, boolean>;
      mixedButtonStatesAfter?: Record<string, boolean>;
      sharedPage?: any;
      shipperZip?: string;
      consigneeZip?: string;
      equipmentType?: string;
      loadMethod?: string;
    } = {}
  ): Promise<{ totalMiles?: string }> {
    const {
      offerRate,
      includeCarriers,
      carriersData,
      clickSave = true,
      clickPost = false,
      enterOfferRateOnWaterfall = false,
      validatePostBefore,
      validatePostAfter,
      expectedValues,
      formState,
      notEditableFields,
      editableFields,
      mixedButtonStatesBefore,
      mixedButtonStatesAfter,
      sharedPage,
      shipperZip,
      consigneeZip,
      equipmentType,
      loadMethod,
    } = options;

    if (offerRate !== undefined) {
      await pages.dfbLoadFormPage.enterOfferRate(offerRate);
    }

    if (Array.isArray(includeCarriers) && includeCarriers.length) {
      await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers(
        includeCarriers
      );
    }
    if (Array.isArray(carriersData) && carriersData.length) {
      await pages.viewLoadPage.clickIncludeCarriersViewDetailsLink();
    }
    if (Array.isArray(carriersData) && carriersData.length) {
      let dynamicCarrierCount = carriersData.length;
      console.log(` Dynamic carrier count set to: ${dynamicCarrierCount}`);
      for (const carrier of carriersData) {
        await pages.dfbIncludeCarriersDataModalWaterfall.clickCarrierPencilIconsAndInputValues(
          carrier.name,
          ...carrier.values
        );
      }
    }

    if (enterOfferRateOnWaterfall) {
      await pages.dfbIncludeCarriersDataModalWaterfall.clickPostAllCarrierCheckbox();
      await pages.dfbIncludeCarriersDataModalWaterfall.enterWaterfallOfferRate(
        LOAD_OFFER_RATES.OFFER_RATE_1
      );
    }
    if (Array.isArray(carriersData) && carriersData.length) {
      await pages.dfbIncludeCarriersDataModalWaterfall.clickIncludeCarriersDataSaveButton();
    }

    // Follow the exact sequence from the spec's original block
    // 1) Enter offer rate and select include carriers (done above)
    // 2) Save the load
    if (clickSave) {
      await pages.editLoadFormPage.clickOnSaveBtn();
    }

    // 3) Validate view load heading and open carrier tab/details
    await pages.viewLoadPage.validateViewLoadHeading();

    // 5) Switch to carrier tab and capture total miles
    await pages.editLoadPage.clickOnTab(TABS.CARRIER);
    const totalMiles = await pages.editLoadFormPage.getTotalMilesValue?.();

    // 6) Validate fields in the same order as the original spec
    if (expectedValues) {
      await pages.dfbLoadFormPage.validateDFBTextFieldHaveExpectedValues(
        expectedValues
      );
    }

    if (formState) {
      await pages.dfbLoadFormPage.validateFormFieldsState(formState);
    }

    if (Array.isArray(notEditableFields) && notEditableFields.length) {
      await pages.dfbLoadFormPage.validateFieldsAreNotEditable(
        notEditableFields
      );
    }

    if (Array.isArray(editableFields) && editableFields.length) {
      await pages.dfbLoadFormPage.validateFieldsAreEditable(editableFields);
    }

    if (mixedButtonStatesBefore) {
      await pages.dfbLoadFormPage.validateMixedButtonStates(
        mixedButtonStatesBefore
      );
    }

    // 7) Post validations: not-posted -> click post -> posted
    if (validatePostBefore) {
      await pages.dfbLoadFormPage.validatePostStatus(validatePostBefore);
    }

    if (clickPost) {
      await pages.dfbLoadFormPage.clickOnPostButton();
    }

    if (validatePostAfter) {
      await pages.dfbLoadFormPage.validatePostStatus(validatePostAfter);
    }

    if (mixedButtonStatesAfter) {
      await pages.dfbLoadFormPage.validateMixedButtonStates(
        mixedButtonStatesAfter
      );
    }

    if (expectedValues) {
      await pages.dfbLoadFormPage.validateDFBTextFieldHaveExpectedValues(
        expectedValues
      );
    }

    if (formState) {
      await pages.dfbLoadFormPage.validateFormFieldsState(formState);
    }

    if (Array.isArray(notEditableFields) && notEditableFields.length) {
      await pages.dfbLoadFormPage.validateFieldsAreNotEditable(
        notEditableFields
      );
    }

    if (mixedButtonStatesAfter) {
      await pages.dfbLoadFormPage.validateMixedButtonStates(
        mixedButtonStatesAfter
      );
    }

    await pages.dfbLoadFormPage.hoverOverPostedIcon();

    if (sharedPage) {
      const tableFieldsToValidate: Record<
        string,
        string | ((actual: string) => boolean)
      > = {};
      if (shipperZip !== undefined)
        tableFieldsToValidate["Origin Zip"] = shipperZip;
      if (consigneeZip !== undefined)
        tableFieldsToValidate["Destination Zip"] = consigneeZip;
      if (offerRate !== undefined)
        tableFieldsToValidate["Offer Rate"] = `$${offerRate}`;
      if (equipmentType !== undefined)
        tableFieldsToValidate["Equipment"] = equipmentType;
      if (loadMethod !== undefined)
        tableFieldsToValidate["Load Method"] = loadMethod;
      await pages.dfbLoadFormPage.validateTableFields(
        sharedPage,
        tableFieldsToValidate
      );
    }

    return { totalMiles };
  }

  /**
   * @author Deepak Bohra
   * @description Reusable function to configure carriers data with waterfall settings
   * @created 2025-12-30
   * @param pages - PageManager instance
   * @param carriersData - Array of carrier configurations with name and values (priority, timing, offer rate)
   * @param options - Configuration options:
   *   - enterWaterfallOfferRate: Whether to enter waterfall offer rate (default: false)
   *   - waterfallOfferRate: The offer rate value to enter on waterfall (optional)
   *   - clickSave: Whether to save after configuration (default: true)
    */
  async configureCarriersDataWithWaterfall(
    pages: PageManager,
    carriersData: Array<{ name: string; values: any[] }>,
    options: {
      enterWaterfallOfferRate?: boolean;
      waterfallOfferRate?: string;
      clickSave?: boolean;
    } = {}
  ) {
    const {
      enterWaterfallOfferRate = false,
      waterfallOfferRate,
      clickSave = true,
    } = options;

    // Step 1: Select carriers in Include Carriers field
    const carrierNames = carriersData.map((c) => c.name);
    await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers(carrierNames);
    console.log(`Selected ${carrierNames.length} carriers`);

    // Step 2: Navigate to Include Carriers modal
    await pages.editLoadPage.clickOnTab(TABS.CARRIER);
    await pages.viewLoadPage.clickIncludeCarriersViewDetailsLink();
    console.log("Opened Include Carriers View Details modal");

    // Step 3: Update carrier data in loop
    for (const carrier of carriersData) {
      await pages.dfbIncludeCarriersDataModalWaterfall.clickCarrierPencilIconsAndInputValues(
        carrier.name,
        ...carrier.values // Spread operator to pass array as individual arguments
      );
      console.log(`Updated carrier data for: ${carrier.name}`);
    }

    // Step 4: Check Post to All Carriers checkbox
    await pages.dfbIncludeCarriersDataModalWaterfall.clickPostAllCarrierCheckbox();
    await pages.dfbIncludeCarriersDataModalWaterfall.validatePostAllCarrierCheckboxIsChecked();
    console.log("Post to All Carriers checkbox checked and validated");

    // Step 5: Optionally enter waterfall offer rate
    if (enterWaterfallOfferRate && waterfallOfferRate) {
      await pages.dfbIncludeCarriersDataModalWaterfall.enterWaterfallOfferRate(
        waterfallOfferRate
      );
      console.log(`Waterfall offer rate entered: ${waterfallOfferRate}`);
    }

    // Step 6: Save modal and load
    await pages.dfbIncludeCarriersDataModalWaterfall.clickIncludeCarriersDataSaveButton();
    console.log("Include Carriers Data modal saved");

    await pages.editLoadFormPage.clickOnSaveBtn();
    console.log("Load saved");
    await pages.viewLoadPage.validateViewLoadHeading();
    await pages.editLoadPage.clickOnTab(TABS.CARRIER);
  }

  /**
   * @author Deepak Bohra
   * @description Fill post automation rule form with dropdown selections and optional fields
   * @created 2026-01-12
   * @param pages - PageManager instance
   * @param formData - Object containing form field values
   * @param showOptionalFields - Whether to show optional fields (default: false)
   * @author Parth Rastogi
   * @modified 2026-01-14
   * @param addStop1 - Whether to add stop 1 location after pick location selection (default: false)
   * @param clickCarrierAutoAccept - Whether to click carrier auto accept checkbox after selecting include carrier (default: false)
   * @param carrierAcceptAsUserEmail - The user email to select from carrier accept as user dropdown (optional)
   */
  async fillPostAutomationRuleForm(
    pages: PageManager,
    formData: {
      customer?: string;
      emailNotification?: string;
      pickLocation?: string;
      pickLocationStop1?: string;
      destination?: string;
      equipment?: string;
      loadType?: string;
      offerRate?: string;
      commodity?: string;
      includeCarrier?: string[];
      excludeCarrier?: string[];
      noteField?: string;
    },
    showOptionalFields: boolean = false,
    addStop1: boolean = false,
    clickCarrierAutoAccept: boolean = false,
    carrierAcceptAsUserEmail?: string
  ): Promise<void> {
    try {
      console.log(`Starting Post Automation Rule form fill...`);
      
      // Select Customer
      if (formData.customer) {
        await pages.postAutomationRulePage.selectCustomerFromDropdown(formData.customer);
      }

      // Select Email Notification
      if (formData.emailNotification) {
        await pages.postAutomationRulePage.selectEmailNotificationAddress(formData.emailNotification);
      }

      // Select Pick Location
      if (formData.pickLocation) {
        await pages.postAutomationRulePage.selectPickLocation(formData.pickLocation);
      }

      // Select Destination
      if (formData.destination) {
        await pages.postAutomationRulePage.selectDestination(formData.destination);
      }

      // Select Equipment
      if (formData.equipment) {
        await pages.postAutomationRulePage.selectEquipment(formData.equipment);
      }

      // Select Load Type
      if (formData.loadType) {
        await pages.postAutomationRulePage.selectLoadType(formData.loadType);
      }

      // Enter Offer Rate
      if (formData.offerRate) {
        await pages.postAutomationRulePage.enterOfferRate(formData.offerRate);
      }
      if (addStop1) {
        await pages.postAutomationRulePage.clickAddStopButton();
        
        if (formData.pickLocationStop1) {
          await pages.postAutomationRulePage.selectPickLocationStop1(formData.pickLocationStop1);
        }
      }
      // Handle Show Optional Fields and Commodity
      if (showOptionalFields) {
        await pages.postAutomationRulePage.checkAndClickShowOptionalFields();
        
        // Select Commodity only after showing optional fields
        if (formData.commodity) {
          await pages.postAutomationRulePage.selectCommodity(formData.commodity);
        }
         // Select include carrier  only after showing optional fields
        if (formData.includeCarrier) {
          await pages.postAutomationRulePage.selectMultipleIncludeCarriers(formData.includeCarrier);
          
          // Click on carrier auto accept checkbox after selecting include carrier
          if (clickCarrierAutoAccept) {
            console.log("Checking if carrier auto accept checkbox is enabled...");
            await pages.postAutomationRulePage.verifyCarrierAutoAcceptCheckboxEnabled();
            console.log("Clicking on carrier auto accept checkbox...");
            await pages.postAutomationRulePage.clickCarrierAutoAcceptCheckbox();
            
            // Select carrier accept as user email if provided
            if (carrierAcceptAsUserEmail) {
              console.log(`Selecting carrier accept as user: "${carrierAcceptAsUserEmail}"...`);
              await pages.postAutomationRulePage.selectCarrierAcceptAsUser(carrierAcceptAsUserEmail);
            }
          }
        }

          // Select exclude carrier  only after showing optional fields
        if (formData.excludeCarrier) {
          await pages.postAutomationRulePage.selectMultipleExcludeCarriers(formData.excludeCarrier);
        
        }
          if (formData.noteField) {
          await pages.postAutomationRulePage.enterNoteField(formData.noteField);
        
        }
          // Add Stop 1 functionality
     
      }

      console.log(`Post Automation Rule form filled successfully`);
    } catch (error) {
      console.error(`Error filling Post Automation Rule form: ${error}`);
      throw error;
    }
  }

}

const dfbHelpers = new DfbHelpers();
export default dfbHelpers;
