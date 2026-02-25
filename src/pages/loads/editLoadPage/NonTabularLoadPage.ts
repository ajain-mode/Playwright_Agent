/**
 * NonTabularLoadPage - Page for managing non-tabular load operations and interactions.
 * @description This class provides methods to interact with the Non-Tabular Load page,
 * including load creation, field validation, editing, and other related operations.
 *
 * @author Parth Rastogi
 */



import { Locator, Page, Dialog } from "@playwright/test";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commonReusables from "@utils/commonReusables";
import { GlobalConstants } from "@utils/globalConstants";

const { WAIT } = GlobalConstants;

class NonTabularLoadPage {
    private readonly shipperDropdown_LOC: Locator;
    private readonly consigneeDropdownValue_LOC: Locator;
    private readonly shipperEarliestTimeInput_LOC: Locator;
    private readonly shipperLatestTimeInput_LOC: Locator;
    private readonly consigneeEarliestTimeInput_LOC: Locator;
    private readonly consigneeLatestTimeInput_LOC: Locator;
    private readonly shipmentCommodityQtyInput_LOC: Locator;
    private readonly shipmentCommodityUoMDropdown_LOC: Locator;
    private readonly shipmentCommodityDescInput_LOC: Locator;
    private readonly shipmentCommodityWeightInput_LOC: Locator;
    private readonly equipmentTypeDropdown_LOC: Locator;
    private readonly equipmentLengthInput_LOC: Locator;
    private readonly createLoadButton_LOC: Locator;
    private readonly shipperEarliestDate_LOC: Locator;
    private readonly shipperLatestDate_LOC: Locator;
    private readonly consigneeEarliestDate_LOC: Locator;
    private readonly consigneeLatestDate_LOC: Locator;
    private readonly formShipperNameInput_LOC: Locator;
    private readonly formConsigneeNameInput_LOC: Locator;
    private readonly formShipperAddressInput_LOC: Locator;
    private readonly formConsigneeAddressInput_LOC: Locator;
    private readonly formShipperCityInput_LOC: Locator;
    private readonly formConsigneeCityInput_LOC: Locator;
    private readonly formShipperStateInput_LOC: Locator;
    private readonly formShipperZipInput_LOC: Locator;
    private readonly formConsigneeStateInput_LOC: Locator;
    private readonly formConsigneeZipInput_LOC: Locator;
    private readonly lineHaulRateInput_LOC: Locator;
    private readonly distanceMethodDropdown_LOC: Locator;
    private readonly distanceMileageEngineDropdown_LOC: Locator;
    private readonly shipperCountryDropdown_LOC: Locator;
    private readonly consigneeCountryDropdown_LOC: Locator;
    private readonly todayDatePicker_LOC: (today: number) => Locator;
    private readonly nextMonthButton_LOC: Locator;
    private readonly tomorrowDatePicker_LOC: (tomorrowDay: number) => Locator;
    private readonly dayAfterTomorrowDatePicker_LOC: (dayAfterTomorrowDay: number) => Locator;

    LoadMenuList: (menuname: string) => Locator;

    constructor(private page: Page) {
        this.shipperDropdown_LOC = page.locator("//select[@id='form_shipper_ship_point']");
        this.consigneeDropdownValue_LOC = page.locator("//select[@id='form_consignee_ship_point']");
        this.shipperEarliestTimeInput_LOC = page.locator("//input[@id='form_shipper_earliest_time']");
        this.shipperLatestTimeInput_LOC = page.locator("//input[@id='form_shipper_latest_time']");
        this.consigneeEarliestTimeInput_LOC = page.locator("//input[@id='form_consignee_earliest_time']");
        this.consigneeLatestTimeInput_LOC = page.locator("//input[@id='form_consignee_latest_time']");
        this.shipmentCommodityQtyInput_LOC = page.locator("//input[@id='form_items_1_quantity']");
        this.shipmentCommodityUoMDropdown_LOC = page.locator("//select[@id='form_items_1_unit']");
        this.shipmentCommodityDescInput_LOC = page.locator("//input[@id='form_items_1_description']");
        this.shipmentCommodityWeightInput_LOC = page.locator("//input[@id='form_items_1_weight']");
        this.equipmentTypeDropdown_LOC = page.locator("//select[@id='form_carriers_1_equipment_type']");
        this.equipmentLengthInput_LOC = page.locator("//input[@id='form_carriers_1_trailer_length']");
        this.createLoadButton_LOC = page.locator("//button[contains(text(),'Create Load')]");
        this.shipperEarliestDate_LOC = page.locator("//input[@id='form_shipper_earliest_date']");
        this.shipperLatestDate_LOC = page.locator("//input[@id='form_shipper_latest_date']");
        this.consigneeEarliestDate_LOC = page.locator("//input[@id='form_consignee_earliest_date']");
        this.consigneeLatestDate_LOC = page.locator("//input[@id='form_consignee_latest_date']");
        this.formShipperNameInput_LOC = page.locator("//input[@id='form_shipper_name']");
        this.formShipperAddressInput_LOC = page.locator("//input[@id='form_shipper_address']");
        this.formConsigneeNameInput_LOC = page.locator("//input[@id='form_consignee_name']");
        this.formConsigneeAddressInput_LOC = page.locator("//input[@id='form_consignee_address']");
        this.formShipperCityInput_LOC = page.locator("//input[@id='form_shipper_city']");
        this.formConsigneeCityInput_LOC = page.locator("//input[@id='form_consignee_city']");
        this.formShipperStateInput_LOC = page.locator("//select[@id='form_shipper_state']");
        this.formShipperZipInput_LOC = page.locator("//input[@id='form_shipper_zip']//following-sibling::span//input[contains(@class,'custom-combobox')]");
        this.formConsigneeStateInput_LOC = page.locator("//select[@id='form_consignee_state']");
        this.formConsigneeZipInput_LOC = page.locator("//input[@id='form_consignee_zip']//following-sibling::span//input[contains(@class,'custom-combobox')]");
        this.lineHaulRateInput_LOC = page.locator("//input[contains(@id,'linehaul_rate')]");
        this.distanceMethodDropdown_LOC = page.locator("//select[contains(@id,'mileage_method')]");
        this.distanceMileageEngineDropdown_LOC = page.locator("//select[contains(@id,'mileage_engine')]");
        this.shipperCountryDropdown_LOC = page.locator("//select[@id='form_shipper_country']");
        this.consigneeCountryDropdown_LOC = page.locator("//select[@id='form_consignee_country']");
        this.todayDatePicker_LOC = (today: number) => page.locator(`//tr//td[@class='today day' and text()='${today}' and not(contains(@class, 'disabled'))]`);
        this.nextMonthButton_LOC = page.locator("//div[@class='datepicker-days']//th[text()='»']");
        this.tomorrowDatePicker_LOC = (tomorrowDay: number) => page.locator(`//tr//td[@class='day' and text()='${tomorrowDay}' and not(contains(@class, 'disabled'))]`);
        this.dayAfterTomorrowDatePicker_LOC = (dayAfterTomorrowDay: number) => page.locator(`//tr//td[@class='day' and text()='${dayAfterTomorrowDay}' and not(contains(@class, 'disabled'))]`);
        this.LoadMenuList = (menuname: string) => {
            return this.page.getByRole('link', { name: menuname })
        }
    }

    /**
   * @author Parth Rastogi
   * @description This method handles clicking the Create Load button
   * @modified 2025-07-15
   */
    async clickCreateLoadButton() {
        try {

            // First scroll to the bottom of the page
            await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            // Then scroll the button into view
            await this.createLoadButton_LOC.scrollIntoViewIfNeeded();
            // Wait for the button to be visible
            await this.createLoadButton_LOC.waitFor({ state: 'visible' });
            // Click the button
            await this.page.waitForTimeout(WAIT.DEFAULT / 3);
            await this.createLoadButton_LOC.click();
        } catch (error) {
            console.error("Error clicking Create Load button:", error);
            throw error;
        }
    }

    /**
 * @author Parth Rastogi
 * @description This function creates a complete Non-Tabular Load with all required information
 * @modified 2025-07-17
 */
    async createNonTabularLoad(loadData: {
        shipperValue: string;
        consigneeValue: string;
        shipperEarliestTime: string;
        shipperLatestTime: string;
        consigneeEarliestTime: string;
        consigneeLatestTime: string;
        shipmentCommodityQty: string;
        shipmentCommodityUoM: string;
        shipmentCommodityDescription: string;
        shipmentCommodityWeight: string;
        equipmentType: string;
        equipmentLength: string;
        distanceMethod: string;
        shipperCountry: string;
        shipperZip: string;
        shipperAddress: string;
        shipperNameNew: string;
    }) {
        try {
            console.log("Starting Non-Tabular Load creation process...");
            // Step 1: Fill Shipper Information
            console.log("Setting shipper information...");
          
            await this.shipperDropdown_LOC.waitFor({ state: 'visible' });
              // Check if shipper value exists in dropdown
        const shipperOptions = await this.shipperDropdown_LOC.locator('option').allTextContents();
        const shipperExists = shipperOptions.some(option => option.trim() === loadData.shipperValue.trim());
        
        if (shipperExists) {
            await this.shipperDropdown_LOC.selectOption(loadData.shipperValue);
            console.log(`✅ Shipper "${loadData.shipperValue}" selected successfully`);
        } else {
            if(loadData.shipperCountry === "Canada") {
            console.log(`Shipper value for CA "${loadData.shipperValue}" not available in dropdown, adding details manually.`);
            await this.formShipperNameInput_LOC.fill(loadData.shipperNameNew);
            await this.formShipperAddressInput_LOC.fill(loadData.shipperAddress);
            await this.shipperCountryDropdown_LOC.selectOption(loadData.shipperCountry);
            await this.formShipperZipInput_LOC.fill(loadData.shipperZip);
            }
            else {
                console.log(`Shipper value for US "${loadData.shipperValue}" not available in dropdown, adding details manually.`);
            await this.formShipperNameInput_LOC.fill(loadData.shipperNameNew);
            await this.formShipperAddressInput_LOC.fill(loadData.shipperAddress);
            await this.formShipperZipInput_LOC.fill(loadData.shipperZip);
            }
        }
            await this.setShipperDatesAndTimes(loadData);
            console.log("Setting consignee information...");
            await this.consigneeDropdownValue_LOC.waitFor({ state: 'visible' });
            await this.consigneeDropdownValue_LOC.selectOption(loadData.consigneeValue);
            await this.setConsigneeDatesAndTimes(loadData);
            // Step 9: Fill Shipment Commodity Information
            await this.fillShipmentCommodityInformation(loadData);
            // Step 10: Fill Equipment Information
            await this.fillEquipmentInformation(loadData);
            console.log("Non-Tabular Load creation completed successfully!");
        } catch (error) {
            console.error("Error creating Non-Tabular Load:", error);
            throw error;
        }
    }

    /**
   * @author Parth Rastogi
   * @description close any validation popup by accepting alert dialog
   * @modified 2025-08-14
   */
    public async closeValidationPopup(): Promise<void> {
        try {
            console.log(`Attempting to close validation popup using alert.accept()...`);
            // Set up dialog handler to accept any dialog that appears
            let dialogHandled = false;
            const dialogHandler = async (dialog: any) => {
                console.log(`Dialog detected: "${dialog.message()}" - accepting...`);
                dialogHandled = true;
                await dialog.accept();
                console.log(`✅ Dialog accepted successfully`);
            };
            // Register dialog handler
            this.page.on('dialog', dialogHandler);
            try {
                // Wait a moment to see if there's an active dialog
                await this.page.waitForTimeout(WAIT.DEFAULT / 2);
                // If no dialog was handled yet, trigger a check for any pending dialogs
                if (!dialogHandled) {
                    console.log(`No immediate dialog detected, checking for pending alerts...`);
                    // Try to trigger any pending dialog by performing a small action
                    // This helps catch dialogs that might be in the process of appearing
                    await this.page.evaluate(() => {
                        // Check if there are any pending alerts in the browser
                        if (typeof window !== 'undefined') {
                            // Small delay to allow any pending dialogs to surface
                            setTimeout(() => {}, 100);
                        }
                    });
                    
                    // Wait a bit more for any dialog to appear
                    await this.page.waitForTimeout(WAIT.DEFAULT / 3);
                }
                if (dialogHandled) {
                    console.log(`✅ Validation popup closed successfully using alert.accept()`);
                } else {
                    console.log(`No dialog found to accept`);
                }
            } finally {
                // Always remove the dialog handler
                this.page.off('dialog', dialogHandler);
            }
        } catch (error) {
            console.log(`❌ Could not close popup: ${(error as any).message}`);
        }
    }

    /**
     * @author Parth Rastogi
     * @description This function validates a single mandatory field by filling all other fields and leaving the target field empty
     * @modified 2025-08-04
     */
    async validateSingleMandatoryField(
        fieldName: string,
        loadData: {
            shipperName: string;
            consigneeName: string;
            shipperAddress: string;
            shipperEarliestTime: string;
            shipperLatestTime: string;
            shipperState: string;
            consigneeAddress: string;
            consigneeEarliestTime: string;
            consigneeLatestTime: string;
            shipmentCommodityQty: string;
            shipmentCommodityUoM: string;
            consigneeCity: string;
            equipmentLength: string;
            consigneeState: string;
            consigneeZip: string;
            shipperCity: string;
            shipperZip: string;
            shipmentCommodityDescription: string;
            shipmentCommodityWeight: string;
            equipmentType: string;
            length: string;
            lhRate: string;
            distanceMethod: string;
        }
    ): Promise<{ isValid: boolean, validationMessage: string }> {
        console.log(` Starting validation for single field: "${fieldName}"`);
        // Define mandatory fields with their fill actions
        const mandatoryFields = this.getMandatoryFieldsConfig(loadData);
        // Find the target field
        const targetField = mandatoryFields.find(field => field.name === fieldName);
        if (!targetField) {
            throw new Error(`Field "${fieldName}" not found in mandatory fields list`);
        }
        try {
            console.log(` Validating field "${targetField.name}"`);
            // Refresh page to reset form state
            await this.page.reload();
            await this.page.waitForLoadState('networkidle');
            console.log(` Filling all fields EXCEPT "${targetField.name}"...`);
            // Fill ALL fields EXCEPT the target field
            for (const field of mandatoryFields) {
                if (field.name !== targetField.name) {
                    // Check for dependency logic
                    let shouldSkipField = false;
                    // If target field is "Shipper state" and current field is "Shipper zip", skip it
                    if (targetField.skipCondition === "shipperState" && field.dependency === "shipperState") {
                        shouldSkipField = true;
                    }
                    // If target field is "Consignee state" and current field is "Consignee zip", skip it
                    if (targetField.skipCondition === "consigneeState" && field.dependency === "consigneeState") {
                        shouldSkipField = true;
                    }
                    if (!shouldSkipField) {
                        try {
                            await field.locator.scrollIntoViewIfNeeded();
                            await field.locator.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
                            if (field.fillAction) {
                                await field.fillAction();
                            }
                        } catch (fillError) {
                            const errorMessage = fillError instanceof Error ? fillError.message : String(fillError);
                            console.log(` Could not fill "${field.name}": ${errorMessage}`);
                        }
                    }
                }
            }

            // Clear the target field if it has any value
            await this.clearTargetField(targetField);
            console.log(` Testing validation for "${targetField.name}"...`);
            // Test validation based on field type
            const validationResult = await this.testFieldValidation(targetField);
            console.log(`✅ Validation completed for "${targetField.name}": ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
            return validationResult;
        } catch (error) {
            console.error(`❌ Error during validation of field "${targetField.name}":`, error);
            return {
                isValid: false,
                validationMessage: `Error during validation: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * @author Parth Rastogi
     * @description Function to get mandatory fields configuration
     * @modified 2025-08-04
     */
    private getMandatoryFieldsConfig(loadData: any) {
        return [
            {
                name: "Shipper Name",
                locator: this.formShipperNameInput_LOC,
                fillAction: async () => await this.formShipperNameInput_LOC.fill(loadData.shipperName),
                skipCondition: "shipperName",
                validationType: "html5"
            },
            {
                name: "Shipper Address",
                locator: this.formShipperAddressInput_LOC,
                fillAction: async () => await this.formShipperAddressInput_LOC.fill(loadData.shipperAddress),
                skipCondition: "shipperAddress",
                validationType: "html5"
            },
            {
                name: "Shipper city",
                locator: this.formShipperCityInput_LOC,
                fillAction: async () => {
                    const currentValue = await this.formShipperCityInput_LOC.inputValue();
                    if (currentValue && currentValue.trim() !== '') {
                        await this.formShipperCityInput_LOC.clear();
                    }
                    await this.formShipperCityInput_LOC.fill(String(loadData.shipperCity));
                },
                skipCondition: "shipperCity",
                validationType: "html5"
            },
            {
                name: "Shipper state",
                locator: this.formShipperStateInput_LOC,
                fillAction: async () => {
                    await this.formShipperStateInput_LOC.selectOption(loadData.shipperState);
                },
                skipCondition: "shipperState",
                validationType: "html5"
            },
            {
                name: "Shipper zip",
                locator: this.formShipperZipInput_LOC,
                fillAction: async () => {
                    await this.formShipperZipInput_LOC.fill(String(loadData.shipperZip));
                },
                skipCondition: "shipperZip",
                dependency: "shipperState",
                validationType: "dialog"
            },
            {
                name: "Shipper Earliest Date",
                locator: this.shipperEarliestDate_LOC,
                fillAction: async () => {
                    await this.shipperEarliestDate_LOC.click();
                    await this.selectTodayDate("Shipper Earliest Date");
                },
                skipCondition: "shipperEarliestDate",
                validationType: "html5"
            },
            {
                name: "Shipper Latest Date",
                locator: this.shipperLatestDate_LOC,
                fillAction: async () => {
                    await this.shipperLatestDate_LOC.click();
                    await this.selectTodayDate("Shipper Latest Date");
                },
                skipCondition: "shipperLatestDate",
                validationType: "html5"
            },
            {
                name: "Shipper Earliest Time",
                locator: this.shipperEarliestTimeInput_LOC,
                fillAction: async () => await this.shipperEarliestTimeInput_LOC.fill(String(loadData.shipperEarliestTime)),
                skipCondition: "shipperEarliestTime",
                validationType: "dialog"
            },
            {
                name: "Shipper Latest Time",
                locator: this.shipperLatestTimeInput_LOC,
                fillAction: async () => await this.shipperLatestTimeInput_LOC.fill(String(loadData.shipperLatestTime)),
                skipCondition: "shipperLatestTime",
                validationType: "dialog"
            },
            {
                name: "Consignee Name",
                locator: this.formConsigneeNameInput_LOC,
                fillAction: async () => await this.formConsigneeNameInput_LOC.fill(loadData.consigneeName),
                skipCondition: "consigneeName",
                validationType: "html5"
            },
            {
                name: "Consignee Address",
                locator: this.formConsigneeAddressInput_LOC,
                fillAction: async () => await this.formConsigneeAddressInput_LOC.fill(loadData.consigneeAddress),
                skipCondition: "consigneeAddress",
                validationType: "html5"
            },
            {
                name: "Consignee city",
                locator: this.formConsigneeCityInput_LOC,
                fillAction: async () => await this.formConsigneeCityInput_LOC.fill(loadData.consigneeCity),
                skipCondition: "consigneeCity",
                validationType: "html5"
            },
            {
                name: "Consignee state",
                locator: this.formConsigneeStateInput_LOC,
                fillAction: async () => await this.formConsigneeStateInput_LOC.selectOption(loadData.consigneeState),
                skipCondition: "consigneeState",
                validationType: "html5"
            },
            {
                name: "Consignee zip",
                locator: this.formConsigneeZipInput_LOC,
                fillAction: async () => {
                    await this.formConsigneeZipInput_LOC.fill(String(loadData.consigneeZip));
                },
                skipCondition: "consigneeZip",
                dependency: "consigneeState",
                validationType: "dialog"
            },
            {
                name: "Consignee Earliest Date",
                locator: this.consigneeEarliestDate_LOC,
                fillAction: async () => {
                    await this.consigneeEarliestDate_LOC.click();
                    await this.selectTomorrowDate("Consignee Earliest Date");
                },
                skipCondition: "consigneeEarliestDate",
                validationType: "html5"
            },
            {
                name: "Consignee Latest Date",
                locator: this.consigneeLatestDate_LOC,
                fillAction: async () => {
                    await this.consigneeLatestDate_LOC.click();
                    await this.selectTomorrowDate("Consignee Latest Date");
                },
                skipCondition: "consigneeLatestDate",
                validationType: "html5"
            },
            {
                name: "Consignee Earliest Time",
                locator: this.consigneeEarliestTimeInput_LOC,
                fillAction: async () => await this.consigneeEarliestTimeInput_LOC.fill(String(loadData.consigneeEarliestTime)),
                skipCondition: "consigneeEarliestTime",
                validationType: "dialog"
            },
            {
                name: "Consignee Latest Time",
                locator: this.consigneeLatestTimeInput_LOC,
                fillAction: async () => await this.consigneeLatestTimeInput_LOC.fill(String(loadData.consigneeLatestTime)),
                skipCondition: "consigneeLatestTime",
                validationType: "dialog"
            },
            {
                name: "Shipment Commodity Quantity",
                locator: this.shipmentCommodityQtyInput_LOC,
                fillAction: async () => await this.shipmentCommodityQtyInput_LOC.fill(String(loadData.shipmentCommodityQty)),
                skipCondition: "commodityQty",
                validationType: "html5"
            },
            {
                name: "Shipment Commodity UoM",
                locator: this.shipmentCommodityUoMDropdown_LOC,
                fillAction: async () => await this.shipmentCommodityUoMDropdown_LOC.selectOption(loadData.shipmentCommodityUoM),
                skipCondition: "commodityUoM"
            },
            {
                name: "Shipment Commodity Description",
                locator: this.shipmentCommodityDescInput_LOC,
                fillAction: async () => await this.shipmentCommodityDescInput_LOC.fill(loadData.shipmentCommodityDescription),
                skipCondition: "commodityDesc",
                validationType: "html5"
            },
            {
                name: "Shipment Commodity Weight",
                locator: this.shipmentCommodityWeightInput_LOC,
                fillAction: async () => await this.shipmentCommodityWeightInput_LOC.fill(String(loadData.shipmentCommodityWeight)),
                skipCondition: "commodityWeight",
                validationType: "html5"
            },
            {
                name: "Equipment Type",
                locator: this.equipmentTypeDropdown_LOC,
                fillAction: async () => await this.equipmentTypeDropdown_LOC.selectOption(loadData.equipmentType),
                skipCondition: "equipmentType"
            },
            {
                name: "Equipment Length",
                locator: this.equipmentLengthInput_LOC,
                fillAction: async () => {
                    await this.equipmentLengthInput_LOC.clear();
                    await this.equipmentLengthInput_LOC.fill(String(loadData.equipmentLength));
                },
                skipCondition: "equipmentLength",
                validationType: "html5"
            },
            {
                name: "Distance Mileage Engine",
                locator: this.distanceMileageEngineDropdown_LOC,
                skipCondition: "distanceMileageEngine"
            },
            {
                name: "LH Rate",
                locator: this.lineHaulRateInput_LOC,
                fillAction: async () => await this.lineHaulRateInput_LOC.fill(String(loadData.lhRate)),
                skipCondition: "lhRate",
                validationType: "html5"
            },
            {
                name: "Distance Method",
                locator: this.distanceMethodDropdown_LOC,
                fillAction: async () => await this.distanceMethodDropdown_LOC.selectOption(loadData.distanceMethod),
                skipCondition: "distanceMethod",
                validationType: "html5"
            }
        ];
    }

    /**
     * @author Parth Rastogi
     * @description Function to clear target field based on field type
     * @modified 2025-08-04
     */
    private async clearTargetField(targetField: any): Promise<void> {
        try {
            if (targetField.name === "Shipper city" || targetField.name === "Consignee city" ||
                targetField.name === "Shipper zip" || targetField.name === "Consignee zip" ||
                targetField.name === "Equipment Length" || targetField.name === "LH Rate") {
                const currentValue = await targetField.locator.inputValue();
                if (currentValue && currentValue.trim() !== '') {
                    await targetField.locator.clear();
                    if (targetField.name === "Equipment Length" || targetField.name === "LH Rate") {
                    }
                }
            }
            // Handle dropdown clearing for Distance Method
            if (targetField.name === "Distance Method") {
                // Reset dropdown to first/default option (usually empty or default value)
                await targetField.locator.selectOption('Select Mileage Type');
            }
            // Handle dropdown clearing for Distance Mileage Engine
            if (targetField.name === "Distance Mileage Engine") {
                // Reset dropdown to empty option
                console.log(` Clearing Distance Mileage Engine dropdown...`);
                await targetField.locator.selectOption('');
                console.log(` Distance Mileage Engine dropdown cleared`);
            }
        } catch (error) {
            console.log(`Could not clear field "${targetField.name}": ${error}`);
        }
    }

    /**
     * @author Parth Rastogi
     * @description Function to test field validation based on validation type
     * @modified 2025-08-04
     */
    private async testFieldValidation(targetField: any): Promise<{ isValid: boolean, validationMessage: string }> {
        if (targetField.validationType === "dialog") {
            return await this.testDialogValidation(targetField);
        } else {
            return await this.testHtml5FieldValidation(targetField);
        }
    }

    /**
     * @author Parth Rastogi
     * @description Function to test dialog-based validation (for ZIP and TIME fields)
     * @modified 2025-08-04
     */
    private async testDialogValidation(targetField: any): Promise<{ isValid: boolean, validationMessage: string }> {
        let dialogDetected = false;
        let dialogMessage = '';

        const dialogHandler = async (dialog: Dialog) => {
            console.log(` Dialog detected: "${dialog.message()}"`);
            dialogMessage = dialog.message();
            dialogDetected = true;

            // Check for ZIP or TIME validation dialogs
            if (dialog.message().includes("ZIP") ||
                dialog.message().includes("Please enter") ||
                dialog.message().includes("time") ||
                dialog.message().includes("Time") ||
                dialog.message().includes("format") ||
                dialog.message().includes("valid")) {
                console.log(`✅ Validation dialog confirmed for ${targetField.name}`);
                await dialog.accept();
            } else {
                console.log(`❌ Unexpected dialog: "${dialog.message()}"`);
                await dialog.dismiss();
            }
        };

        // Register dialog handler BEFORE clicking button
        this.page.on('dialog', dialogHandler);
        await this.page.waitForTimeout(WAIT.DEFAULT);

        // Click the Create Load button
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.createLoadButton_LOC.scrollIntoViewIfNeeded();
        await this.createLoadButton_LOC.waitFor({ state: 'visible' });
        await this.createLoadButton_LOC.click();
        // Wait for dialog
        await this.page.waitForTimeout(WAIT.DEFAULT);

        // Clean up
        this.page.off('dialog', dialogHandler);

        if (dialogDetected) {
            // Verify the message contains expected text based on field type
            const isValidMessage = this.verifyDialogMessage(targetField.name, dialogMessage);
            return {
                isValid: isValidMessage,
                validationMessage: isValidMessage ? `Dialog validation passed: "${dialogMessage}"` : `Unexpected dialog message: "${dialogMessage}"`
            };
        }
        return { isValid: false, validationMessage: `No validation found for "${targetField.name}"` };
    }

    /**
     * @author Parth Rastogi
     * @description Function to test HTML5 validation
     * @modified 2025-08-04
     */
    private async testHtml5FieldValidation(targetField: any): Promise<{ isValid: boolean, validationMessage: string }> {
        // Click the Create Load button
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await this.createLoadButton_LOC.scrollIntoViewIfNeeded();
        await this.createLoadButton_LOC.waitFor({ state: 'visible' });
        await this.createLoadButton_LOC.click();
        // Check for HTML5 validation on regular fields
        const invalidLocator = this.page.locator('input:invalid, select:invalid, textarea:invalid').first();
        try {
            await invalidLocator.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
            const validationMessage = await invalidLocator.evaluate(el => {
                return (el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).validationMessage;
            });
            const invalidFieldName = await invalidLocator.getAttribute('name') || await invalidLocator.getAttribute('id') || 'Unknown Field';
            console.log(` Found invalid field: "${invalidFieldName}" with message: "${validationMessage}"`);
            const targetFieldId = await targetField.locator.getAttribute('id');
            const targetFieldName = await targetField.locator.getAttribute('name');
            if (invalidFieldName === targetFieldId || invalidFieldName === targetFieldName) {
                const expectedMessage = this.getExpectedValidationMessage(targetField.name);
                const isValid = validationMessage === expectedMessage;
                return {
                    isValid,
                    validationMessage: isValid ? `HTML5 validation passed: "${validationMessage}"` : `Expected "${expectedMessage}" but got "${validationMessage}"`
                };
            } else {
                return {
                    isValid: false,
                    validationMessage: `Expected "${targetField.name}" but found "${invalidFieldName}"`
                };
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('Timeout')) {
                return { isValid: false, validationMessage: `No validation error found for "${targetField.name}"` };
            } else {
                return { isValid: false, validationMessage: `Error during validation: ${errorMessage}` };
            }
        }
    }

    /**
     * @author Parth Rastogi
     * @description Function to verify dialog message content
     * @modified 2025-08-04
     */
    private verifyDialogMessage(fieldName: string, dialogMessage: string): boolean {
        switch (fieldName) {
            case "Shipper zip":
                return dialogMessage.includes("shipper ZIP");
            case "Consignee zip":
                return dialogMessage.includes("consignee ZIP");
            case "Shipper Earliest Time":
                return /shipper.*earliest.*time|time.*format|Please enter.*time/i.test(dialogMessage);
            case "Shipper Latest Time":
                return /shipper.*latest.*time|time.*format|Please enter.*time/i.test(dialogMessage);
            case "Consignee Earliest Time":
                return /consignee.*earliest.*time|time.*format|Please enter.*time/i.test(dialogMessage);
            case "Consignee Latest Time":
                return /consignee.*latest.*time|time.*format|Please enter.*time/i.test(dialogMessage);
            default:
                return false;
        }
    }

    /**
     * @author Parth Rastogi
     * @description Function to get expected validation message for HTML5 validation
     * @modified 2025-08-04
     */
    private getExpectedValidationMessage(fieldName: string): string {
        const validationMessages: { [key: string]: string } = {
            "Equipment Type": "Please select an item in the list.",
            "Shipment Commodity UoM": "Please select an item in the list.",
            "Consignee state": "Please select an item in the list.",
            "Shipper state": "Please select an item in the list.",
            "Distance Method": "Please select an item in the list.",
            "Distance Mileage Engine": "Please select an item in the list.",
            "default": "Please fill out this field."
        };
        return validationMessages[fieldName] || validationMessages["default"];
    }

    /**
     * @author Parth Rastogi
     * @description Navigate to load creation page (smart navigation - only navigates if needed)
     * @created 12-08-2025
     * @param pages - PageManager instance containing all page objects
     * @param testData - Test data containing customer information
     */
    async navigateToLoadCreation(pages: any, testData: any) {
        const { HEADERS, CUSTOMER_SUB_MENU, LOAD_TYPES } = GlobalConstants;

        try {
            // Check if we're already on the load creation page
            const loadFormExists = await this.formShipperNameInput_LOC.isVisible({ timeout: WAIT.DEFAULT });
            if (loadFormExists) {
                console.log(" Already on load creation page");
                return;
            }
            // Navigate back to load creation if needed
            console.log(" Navigating to load creation page...");
            await pages.basePage.clickHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
            await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
            console.log(" Navigation to load creation completed");
        } catch (error) {
            console.log(" Navigation check failed, proceeding with test...");
        }
    }

    /**
     * @author Parth Rastogi
     * @description Prepare for test execution - validates setup and ensures correct page navigation
     * @created 12-08-2025
     * @param globalPages - Global page manager instance from beforeAll setup
     * @param testData - Test data containing customer information
     */
    async prepareForTest(globalPages: any, testData: any) {
        if (!globalPages) {
            throw new Error("Global setup not completed. Please check beforeAll hook.");
        }
        // Quick navigation to ensure we're on the right page
        await this.navigateToLoadCreation(globalPages, testData);
        return globalPages;
    }

    /**
     * @author Parth Rastogi
     * @description Validate invalid shipper zip code after filling all mandatory fields
     * @created 19-08-2025
     * @param loadData - Complete load data with all mandatory fields
     * @param invalidZipCode - Invalid zip code to test
     */
    async validateShipperInvalidZipCodeWithMandatoryFields(Country: string,
        loadData: {
            shipperName: string;
            shipperAddress: string;
            shipperCity: string;
            shipperState: string;
            shipperCountry: string;
            shipperZip: string;
            shipperEarliestTime: string;
            shipperLatestTime: string;
            consigneeName: string;
            consigneeAddress: string;
            consigneeCity: string;
            consigneeState: string;
            consigneeZip: string;
            consigneeEarliestTime: string;
            consigneeLatestTime: string;
            shipmentCommodityQty: string;
            shipmentCommodityUoM: string;
            shipmentCommodityDescription: string;
            shipmentCommodityWeight: string;
            equipmentType: string;
            equipmentLength: string;
            lhRate: string;
            distanceMethod: string;
            shipperNameUS: string,
            shipperNameCA: string,
        }
    ): Promise<{ isValid: boolean, validationMessage: string, actualMessage: string, expectedMessage: string, exactMatch: boolean }> {

        let dialogDetected = false;
        let dialogMessage = '';

        try {
            console.log(` Filling all mandatory fields first...`);

            if (Country === "US") {
                console.log("Setting shipper information...");
                await this.shipperDropdown_LOC.waitFor({ state: 'visible' });
                await this.shipperDropdown_LOC.selectOption(loadData.shipperNameUS);
            } else if (Country === "CA") {
                console.log("Setting shipper information...");
                await this.shipperDropdown_LOC.waitFor({ state: 'visible' });
                await this.shipperDropdown_LOC.selectOption(loadData.shipperNameCA);
            } else if (Country === "MX") {
                await this.fillShipperInformation("MX", loadData);
            }
            // Step 2: Set Shipper Dates and Times
            await this.setShipperDatesAndTimes(loadData);
            // Step 3: Fill Consignee Information
            await this.fillConsigneeInformation("US" , loadData);
            // Step 4: Set Consignee Dates and Times
            await this.setConsigneeDatesAndTimes(loadData);
            // Step 5: Fill Shipment Commodity Information
            await this.fillShipmentCommodityInformation(loadData);
            // Step 6: Fill Equipment Information
            await this.fillEquipmentInformation(loadData);
            // Step 8: Now fill the INVALID shipper ZIP code
            await this.enterInvalidShipperZipCode(loadData.shipperZip);
            // Step 9: Setup dialog handler for validation
            const dialogHandler = async (dialog: Dialog) => {
                console.log(` Dialog detected: "${dialog.message()}"`);
                dialogMessage = dialog.message();
                dialogDetected = true;
                await dialog.accept();
            };
            this.page.on('dialog', dialogHandler);
            // Step 10: Click Create Load button to trigger validation
            console.log(` Triggering validation by clicking Create Load button...`);
            await this.clickCreateLoadButton();
            // Wait for validation popup
            await this.page.waitForTimeout(WAIT.DEFAULT);
            // Clean up dialog handler
            this.page.off('dialog', dialogHandler);
            // Step 11: Check validation results
            if (dialogDetected) {
                const exactValidation = this.validateExactPopupText(dialogMessage, Country);
                return {
                    isValid: exactValidation.isValid,
                    validationMessage: exactValidation.isValid ?
                        `Exact popup text validation PASSED for ${Country}` :
                        `Exact popup text validation FAILED for ${Country}: ${exactValidation.details}`,
                    actualMessage: dialogMessage,
                    expectedMessage: exactValidation.expectedText,
                    exactMatch: exactValidation.textMatch
                };
            }
            // No validation found
            const expectedTexts = {
                'US': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_US,
                'CA': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_CA,
                'MX': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_MX
            };
            const expectedText = expectedTexts[Country as keyof typeof expectedTexts] || 'Unknown expected text';
            console.log(`❌ No validation popup found for invalid shipper ZIP code: "${loadData.shipperZip}"`);
            return {
                isValid: false,
                validationMessage: `No validation message found for invalid shipper ZIP code: "${loadData.shipperZip}"`,
                actualMessage: "No validation message detected",
                expectedMessage: expectedText,
                exactMatch: false
            };
        } catch (error) {
            const expectedTexts = {
                'US': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_US,
                'CA': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_CA,
                'MX': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_MX
            };
            const expectedText = expectedTexts[Country as keyof typeof expectedTexts] || 'Unknown expected text';
            console.error(`❌ Error during shipper ZIP validation:`, error);
            return {
                isValid: false,
                validationMessage: `Error during validation: ${error instanceof Error ? error.message : String(error)}`,
                actualMessage: `Error: ${error instanceof Error ? error.message : String(error)}`,
                expectedMessage: expectedText,
                exactMatch: false
            };
        }
    }

      /**
     * @author Parth Rastogi
     * @description Validate invalid shipper zip code after filling all mandatory fields
     * @created 26-08-2025
     * @param loadData - Complete load data with all mandatory fields
     * @param invalidZipCode - Invalid zip code to test
     */
    async validateConsigneeInvalidZipCodeWithMandatoryFields(Country: string,
        loadData: {
            shipperName: string;
            shipperAddress: string;
            shipperCity: string;
            shipperState: string;
            shipperCountry: string;
            shipperZip: string;
            shipperEarliestTime: string;
            shipperLatestTime: string;
            consigneeName: string;
            consigneeAddress: string;
            consigneeCity: string;
            consigneeState: string;
            consigneeZip: string;
            consigneeEarliestTime: string;
            consigneeLatestTime: string;
            shipmentCommodityQty: string;
            shipmentCommodityUoM: string;
            shipmentCommodityDescription: string;
            shipmentCommodityWeight: string;
            equipmentType: string;
            equipmentLength: string;
            lhRate: string;
            distanceMethod: string;
            consigneeNameCA: string;
            consigneeNameUS: string;
        }
    ): Promise<{ isValid: boolean, validationMessage: string, actualMessage: string, expectedMessage: string, exactMatch: boolean }> {

        let dialogDetected = false;
        let dialogMessage = '';

        try {
            //  console.log(` Starting validation test for invalid shipper ZIP code: "${shipperZip}"`);
            console.log(` Filling all mandatory fields first...`);
            console.log("Setting shipper information...");
             await this.shipperDropdown_LOC.waitFor({ state: 'visible' });
             await this.shipperDropdown_LOC.selectOption(loadData.shipperName);
             await this.setShipperDatesAndTimes(loadData);

              //await this.fillConsigneeInformation(loadData);    
              if (Country === "US") {
                 console.log("Setting consignee information...");
                 await this.consigneeDropdownValue_LOC.waitFor({ state: 'visible' });
                 await this.consigneeDropdownValue_LOC.selectOption(loadData.consigneeNameUS);
             } else if (Country === "CA") {
                 console.log("Setting consignee information...");
                 await this.consigneeDropdownValue_LOC.waitFor({ state: 'visible' });
                 await this.consigneeDropdownValue_LOC.selectOption(loadData.consigneeNameCA);
             } else if (Country === "MX") {
                 await this.fillConsigneeInformation("MX", loadData);
             }
            // Step 4: Set Consignee Dates and Times
            await this.setConsigneeDatesAndTimes(loadData);
            // Step 5: Fill Shipment Commodity Information
            await this.fillShipmentCommodityInformation(loadData);
            // Step 6: Fill Equipment Information
            await this.fillEquipmentInformation(loadData);
            // Step 8: Now fill the INVALID consignee ZIP code
            await this.enterInvalidConsigneeZipCode(loadData.consigneeZip);
            // Step 9: Setup dialog handler for validation
            const dialogHandler = async (dialog: Dialog) => {
                console.log(` Dialog detected: "${dialog.message()}"`);
                dialogMessage = dialog.message();
                dialogDetected = true;
                await dialog.accept();
            };
            this.page.on('dialog', dialogHandler);
            // Step 10: Click Create Load button to trigger validation
            console.log(` Triggering validation by clicking Create Load button...`);
            await this.clickCreateLoadButton();
            // Wait for validation popup
            await this.page.waitForTimeout(WAIT.DEFAULT);
            // Clean up dialog handler
            this.page.off('dialog', dialogHandler);
            // Step 11: Check validation results
            if (dialogDetected) {
                const exactValidation = this.validateExactPopupText(dialogMessage, Country);
                return {
                    isValid: exactValidation.isValid,
                    validationMessage: exactValidation.isValid ?
                        `Exact popup text validation PASSED for ${Country}` :
                        `Exact popup text validation FAILED for ${Country}: ${exactValidation.details}`,
                    actualMessage: dialogMessage,
                    expectedMessage: exactValidation.expectedText,
                    exactMatch: exactValidation.textMatch
                };
            }
            // No validation found
            const expectedTexts = {
                'US': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_US,
                'CA': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_CA,
                'MX': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_MX
            };
            const expectedText = expectedTexts[Country as keyof typeof expectedTexts] || 'Unknown expected text';
            console.log(`❌ No validation popup found for invalid shipper ZIP code: "${loadData.shipperZip}"`);
            return {
                isValid: false,
                validationMessage: `No validation message found for invalid shipper ZIP code: "${loadData.shipperZip}"`,
                actualMessage: "No validation message detected",
                expectedMessage: expectedText,
                exactMatch: false
            };
        } catch (error) {
            const expectedTexts = {
                'US': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_US,
                'CA': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_CA,
                'MX': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_MX
            };
            const expectedText = expectedTexts[Country as keyof typeof expectedTexts] || 'Unknown expected text';
            console.error(`❌ Error during shipper ZIP validation:`, error);
            return {
                isValid: false,
                validationMessage: `Error during validation: ${error instanceof Error ? error.message : String(error)}`,
                actualMessage: `Error: ${error instanceof Error ? error.message : String(error)}`,
                expectedMessage: expectedText,
                exactMatch: false
            };
        }
    }


    /**
     * @author Parth Rastogi
     * @description Validates entire popup text exactly as expected for each country
     * @created 12-08-2025
     * @param country - Country code (US/CA/MX)
     * @returns Validation result with exact text comparison
     */
    private validateExactPopupText(actualMessage: string, country: string): {
        isValid: boolean;
        expectedText: string;
        actualText: string;
        textMatch: boolean;
        details: string;
    } {
        // Define exact expected text for each country
        const expectedTexts = {
                'US': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_US,
                'CA': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_CA,
                'MX': ALERT_PATTERNS.INVALID_SHIPPER_ZIP_CODE_MX
        };

        const expectedText = expectedTexts[country as keyof typeof expectedTexts];

        if (!expectedText) {
            return {
                isValid: false,
                expectedText: 'Unknown country',
                actualText: actualMessage,
                textMatch: false,
                details: `No expected text defined for country: ${country}`
            };
        }

        // Clean both texts for comparison (remove extra whitespace, normalize line breaks)
        const cleanExpected = expectedText.trim().replace(/\s+/g, ' ');
        const cleanActual = actualMessage.trim().replace(/\s+/g, ' ');

        const textMatch = cleanExpected === cleanActual;

        let details = '';
        if (!textMatch) {
            details = `Expected: "${expectedText}" | Actual: "${actualMessage}" | Length Expected: ${expectedText.length} | Length Actual: ${actualMessage.length}`;

            // Character by character comparison for debugging
            if (expectedText.length !== actualMessage.length) {
                details += ` | Length mismatch detected`;
            }

            // Find first difference
            for (let i = 0; i < Math.max(expectedText.length, actualMessage.length); i++) {
                if (expectedText[i] !== actualMessage[i]) {
                    details += ` | First difference at position ${i}: expected '${expectedText[i] || 'END'}' but got '${actualMessage[i] || 'END'}'`;
                    break;
                }
            }
        } else {
            details = `Exact match confirmed for ${country} popup text`;
        }

        return {
            isValid: textMatch,
            expectedText,
            actualText: actualMessage,
            textMatch,
            details
        };
    }

    /**
     * @author Parth Rastogi
     * @description Handles validation result logging and page reloading for multi-country tests
     * @created 19-08-2025
     * @param country - Country object with code, name, and fieldType
     * @param invalidZipCode - The invalid ZIP code being tested
     * @param validationResult - Result from the validation test
     * @param pages - Page manager instance for logging and navigation
     * @param testData - Test data for re-preparation
     * @param countries - Array of all countries to determine if reload is needed
     */
    async handleValidationResultAndReload(
        country: { code: string; name: string; fieldType: string },
        invalidZipCode: string,
        validationResult: { isValid: boolean; validationMessage: string; actualMessage: string; expectedMessage: string; exactMatch: boolean },
        pages: any,
        testData: any,
        countries: { code: string; name: string; fieldType: string }[]
    ): Promise<void> {
        // Log detailed comparison for exact text validation
        console.log(`\n=== EXACT TEXT VALIDATION DETAILS FOR ${country.name} ===`);
        console.log(`Country: ${country.name} (${country.code})`);
        console.log(`Field Type: ${country.fieldType}`);
        console.log(`Invalid Input: "${invalidZipCode}"`);
        console.log(`Validation Status: ${validationResult.isValid ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`Exact Text Match: ${validationResult.exactMatch ? '✅ YES' : '❌ NO'}`);
        console.log(`\nACTUAL POPUP TEXT:`);
        console.log(`"${validationResult.actualMessage}"`);
        console.log(`\nEXPECTED POPUP TEXT:`);
        console.log(`"${validationResult.expectedMessage}"`);
        console.log(`\nActual Length: ${validationResult.actualMessage.length} characters`);
        console.log(`Expected Length: ${validationResult.expectedMessage.length} characters`);
        console.log(`=== END EXACT TEXT VALIDATION DETAILS ===\n`);

        // Throw error if validation failed
        if (!validationResult.isValid) {
            throw new Error(`Exact text validation failed for ${country.name} Invalid Shipper ${country.fieldType}: ${validationResult.validationMessage}`);
        }
        // Determine if this is the last country (no reload needed for last country)
        const currentIndex = countries.findIndex(c => c.code === country.code);
        const isLastCountry = currentIndex === countries.length - 1;
        // Reload page between country tests to reset form state (except for the last country)
        if (!isLastCountry) {
            pages.logger.info(` Reloading page before testing next country...`);
            await pages.page.reload();
            await pages.page.waitForLoadState('networkidle');

            // Re-prepare for the next test
            await this.prepareForTest(pages, testData);
        }
    }

    /**
     * @author Parth Rastogi
     * @description Fills consignee information for load creation
     * @created 20-08-2025
     * @param loadData - Load data containing consignee information
     */
    private async fillConsigneeInformation(Country: string, loadData: any): Promise<void> {
        console.log(` Filling consignee information...`);
        // Fill Consignee Name
        await this.formConsigneeNameInput_LOC.waitFor({ state: 'visible' });
        await this.formConsigneeNameInput_LOC.fill(loadData.consigneeName);
        // Fill Consignee Address
        await this.formConsigneeAddressInput_LOC.waitFor({ state: 'visible' });
        await this.formConsigneeAddressInput_LOC.fill(loadData.consigneeAddress);        
        // Fill Consignee City
        await this.formConsigneeCityInput_LOC.waitFor({ state: 'visible' });
        await this.formConsigneeCityInput_LOC.fill(loadData.consigneeCity); 
       
            if (Country === "MX") {
            await this.consigneeCountryDropdown_LOC.selectOption(loadData.shipperCountry);
        }
        // Select Consignee State
        await this.formConsigneeStateInput_LOC.waitFor({ state: 'visible' });
        await this.formConsigneeStateInput_LOC.selectOption(loadData.consigneeState);      
        // Fill Consignee ZIP
        await this.formConsigneeZipInput_LOC.waitFor({ state: 'visible' });
        await this.formConsigneeZipInput_LOC.fill(String(loadData.consigneeZip));
    }

    /**
     * @author Parth Rastogi
     * @description Sets shipper dates and times for load creation
     * @created 20-08-2025
     * @param loadData - Load data containing shipper time information
     */
    private async setShipperDatesAndTimes(loadData: any): Promise<void> {
        console.log(` Setting shipper dates and times...`);
        // Set Shipper Earliest Date
        await this.shipperEarliestDate_LOC.waitFor({ state: 'visible' });
        await this.shipperEarliestDate_LOC.click();
        await this.selectTomorrowDate("Shipper Earliest Date");
        // Set Shipper Latest Date
        await this.shipperLatestDate_LOC.waitFor({ state: 'visible' });
        await this.shipperLatestDate_LOC.click();
        await this.selectTomorrowDate("Shipper Latest Date");
        // Set Shipper Times
        await this.shipperEarliestTimeInput_LOC.waitFor({ state: 'visible' });
        await this.shipperEarliestTimeInput_LOC.fill(String(loadData.shipperEarliestTime));
        await this.shipperLatestTimeInput_LOC.waitFor({ state: 'visible' });
        await this.shipperLatestTimeInput_LOC.fill(String(loadData.shipperLatestTime));
    }

    /**
     * @author Parth Rastogi
     * @description Sets consignee dates and times for load creation
     * @created 20-08-2025
     * @param loadData - Load data containing consignee time information
     */
    private async setConsigneeDatesAndTimes(loadData: any): Promise<void> {
        console.log(` Setting consignee dates and times...`);
        // Set Consignee Earliest Date
        await this.consigneeEarliestDate_LOC.waitFor({ state: 'visible' });
        await this.consigneeEarliestDate_LOC.click();
        await this.selectDayAfterTomorrowDate("Consignee Earliest Date");
        // Set Consignee Latest Date
        await this.consigneeLatestDate_LOC.waitFor({ state: 'visible' });
        await this.consigneeLatestDate_LOC.click();
        await this.selectDayAfterTomorrowDate("Consignee Latest Date");
        // Set Consignee Times
        await this.consigneeEarliestTimeInput_LOC.waitFor({ state: 'visible' });
        await this.consigneeEarliestTimeInput_LOC.fill(String(loadData.consigneeEarliestTime));
        await this.consigneeLatestTimeInput_LOC.waitFor({ state: 'visible' });
        await this.consigneeLatestTimeInput_LOC.fill(String(loadData.consigneeLatestTime));
    }

    /**
     * @author Parth Rastogi
     * @description Fills shipment commodity information for load creation
     * @created 20-08-2025
     * @param loadData - Load data containing shipment commodity information
     */
    private async fillShipmentCommodityInformation(loadData: any): Promise<void> {
        console.log(` Filling shipment commodity information...`);
        // Scroll to bottom to ensure commodity fields are visible
        await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        // Fill Commodity Quantity
        await this.shipmentCommodityQtyInput_LOC.waitFor({ state: 'visible' });
        await this.shipmentCommodityQtyInput_LOC.scrollIntoViewIfNeeded();
        await this.shipmentCommodityQtyInput_LOC.fill(String(loadData.shipmentCommodityQty));
        // Select Commodity Unit of Measure
        await this.shipmentCommodityUoMDropdown_LOC.waitFor({ state: 'visible' });
        await this.shipmentCommodityUoMDropdown_LOC.selectOption(loadData.shipmentCommodityUoM);
        // Fill Commodity Description
        await this.shipmentCommodityDescInput_LOC.waitFor({ state: 'visible' });
        await this.shipmentCommodityDescInput_LOC.fill(String(loadData.shipmentCommodityDescription));
        // Fill Commodity Weight
        await this.shipmentCommodityWeightInput_LOC.waitFor({ state: 'visible' });
        await this.shipmentCommodityWeightInput_LOC.fill(String(loadData.shipmentCommodityWeight));
    }

    /**
     * @author Parth Rastogi
     * @description Fills equipment information for load creation
     * @created 20-08-2025
     * @param loadData - Load data containing equipment information
     */
    private async fillEquipmentInformation(loadData: any): Promise<void> {
        console.log(` Filling equipment information...`);
        // Select Equipment Type
        await this.equipmentTypeDropdown_LOC.waitFor({ state: 'visible' });
        await this.equipmentTypeDropdown_LOC.scrollIntoViewIfNeeded();
        await this.equipmentTypeDropdown_LOC.selectOption(loadData.equipmentType);
        // Fill Equipment Length
        await this.equipmentLengthInput_LOC.waitFor({ state: 'visible' });
        await this.equipmentLengthInput_LOC.clear();
        await this.equipmentLengthInput_LOC.fill(String(loadData.equipmentLength));
        // Select Distance Method
        await this.distanceMethodDropdown_LOC.waitFor({ state: 'visible' });
        await this.distanceMethodDropdown_LOC.selectOption(loadData.distanceMethod);
    }

    /**
     * @author Parth Rastogi
     * @description Enters invalid shipper ZIP code for validation testing
     * @created 20-08-2025
     * @param invalidZipCode - The invalid ZIP code to enter for testing
     */
    private async enterInvalidShipperZipCode(invalidZipCode: string): Promise<void> {
        console.log(` Entering invalid shipper ZIP code: "${invalidZipCode}"`);
        // Wait for shipper ZIP field to be visible
        await this.formShipperZipInput_LOC.waitFor({ state: 'visible' });
        // Scroll field into view if needed
        await this.formShipperZipInput_LOC.scrollIntoViewIfNeeded();
        // Clear any existing value
        await this.formShipperZipInput_LOC.clear();
        // Fill with the invalid ZIP code
        await this.formShipperZipInput_LOC.fill(String(invalidZipCode));
        // // Wait for any potential validation to trigger
    }

     /**
     * @author Parth Rastogi
     * @description Enters invalid consignee ZIP code for validation testing
     * @created 26-08-2025
     * @param invalidZipCode - The invalid ZIP code to enter for testing
     */
    private async enterInvalidConsigneeZipCode(invalidZipCode: string): Promise<void> {
        console.log(` Entering invalid consignee ZIP code: "${invalidZipCode}"`);
        // Wait for consignee ZIP field to be visible
        await this.formConsigneeZipInput_LOC.waitFor({ state: 'visible' });
        // Scroll field into view if needed
        await this.formConsigneeZipInput_LOC.scrollIntoViewIfNeeded();
        // Clear any existing value
        await this.formConsigneeZipInput_LOC.clear();
        // Fill with the invalid ZIP code
        await this.formConsigneeZipInput_LOC.fill(String(invalidZipCode));
       
    }

    /**
     * @author Parth Rastogi
     * @description Fills Mexico shipper information for load validation testing
     * @created 20-08-2025
     * @param loadData - Load data containing Mexico shipper information
     */
    private async fillShipperInformation(Country: string, loadData: any): Promise<void> {
        console.log("Setting Mexico shipper information...");
        // Fill Shipper Name
        await this.formShipperNameInput_LOC.waitFor({ state: 'visible' });
        await this.formShipperNameInput_LOC.fill(loadData.shipperName);
        // Fill Shipper Address
        await this.formShipperAddressInput_LOC.fill(loadData.shipperAddress);
        // Fill Shipper City
        await this.formShipperCityInput_LOC.fill(loadData.shipperCity);
        // Select Shipper Country (Mexico)
        if (Country === "MX") {
            await this.shipperCountryDropdown_LOC.selectOption(loadData.shipperCountry);
        }
        // Select Shipper State
        await this.formShipperStateInput_LOC.selectOption(loadData.shipperState);
        // Fill Shipper ZIP
        await this.formShipperZipInput_LOC.fill(String(loadData.shipperZip));
    }
     /**
  * @author Parth Rastogi
  * @description Selects a date from a date picker calendar.
  * @date 2025-07-29
 */
  async selectTodayDate(fieldName: string = "Date Field"): Promise<void> {
    try {
      console.log(` Selecting today's date for ${fieldName}...`);

      const today = new Date().getDate();
      console.log(` Today's date: ${today}`);

      // Use the class property locator
      const todayLocator = this.todayDatePicker_LOC(today);

      // Wait for the date element to be visible before clicking
      await todayLocator.waitFor({ timeout: WAIT.DEFAULT });
      await todayLocator.click();

      console.log(` Successfully selected today's date (${today}) for ${fieldName}`);

    } catch (error) {
      if (error instanceof Error) {
        console.error(` Error selecting today's date for ${fieldName}: ${error.message}`);
      } else {
        console.error(` Error selecting today's date for ${fieldName}: ${String(error)}`);
      }
      throw error;
    }
  }

  /**
   * @author Parth Rastogi
   * @description Selects tomorrow's date from a date picker calendar.
   * @modified 2025-07-29
   */
  async selectTomorrowDate(fieldName: string = "Date Field"): Promise<string> {
    try {
      console.log(`Selecting tomorrow's date for ${fieldName}...`);

      const todayDate = new Date();
      const tomorrow = new Date(todayDate);
      tomorrow.setDate(todayDate.getDate() + 1);
      const tomorrowDay = tomorrow.getDate();
      const tomorrowMonth = tomorrow.getMonth() + 1;
      const tomorrowYear = tomorrow.getFullYear();
      // Format as dd/mm/yyyy
      const formattedTomorrow = `${tomorrowDay.toString().padStart(2, '0')}/${tomorrowMonth.toString().padStart(2, '0')}/${tomorrowYear}`;
      console.log(`Today: ${todayDate}, Tomorrow: ${tomorrow}`);
      console.log(`Today: ${todayDate.getDate()}, Tomorrow: ${tomorrowDay}`);

      // Check if tomorrow is the 1st of the month (means we need to go to next month)
      if (tomorrowDay === 1) {
        console.log(`Tomorrow is the 1st of the month, clicking next month button first...`);
        await this.nextMonthButton_LOC.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
        await this.nextMonthButton_LOC.click();
        console.log(`Clicked next month button to navigate to ${tomorrowMonth}/${tomorrowYear}`);
        
        // Wait for calendar to update
        await this.page.waitForTimeout(WAIT.DEFAULT);
      }

      // Use the class property locator
      const tomorrowLocator = this.tomorrowDatePicker_LOC(tomorrowDay);

      // Wait for the date element to be visible before clicking
      await tomorrowLocator.waitFor({ timeout: WAIT.DEFAULT });
      await tomorrowLocator.click();

      console.log(`Successfully selected tomorrow's date (${tomorrowDay}) for ${fieldName}`);
      return formattedTomorrow;
    } catch (error) {
      if (error instanceof Error) {
        console.error(` Error selecting tomorrow's date for ${fieldName}: ${error.message}`);
      } else {
        console.error(` Error selecting tomorrow's date for ${fieldName}: ${String(error)}`);
      }
      throw error;
    }
  }

  /**
   * @author Parth Rastogi
   * @description Selects day after tomorrow's date from a date picker calendar.
   * @created 2025-09-05
   * @modified 2025-09-29
   */
  async selectDayAfterTomorrowDate(fieldName: string = "Date Field"): Promise<string> {
    try {
      console.log(`Selecting day after tomorrow's date for ${fieldName}...`);

      const todayDate = new Date();
      const dayAfterTomorrow = new Date(todayDate);
      dayAfterTomorrow.setDate(todayDate.getDate() + 2);
      const dayAfterTomorrowDay = dayAfterTomorrow.getDate();
      const dayAfterTomorrowMonth = dayAfterTomorrow.getMonth() + 1;
      const dayAfterTomorrowYear = dayAfterTomorrow.getFullYear();
      // Format as dd/mm/yyyy
      const formattedDayAfterTomorrow = `${dayAfterTomorrowDay.toString().padStart(2, '0')}/${dayAfterTomorrowMonth.toString().padStart(2, '0')}/${dayAfterTomorrowYear}`;
      console.log(`Today: ${todayDate}, Day after tomorrow: ${dayAfterTomorrow}`);
      console.log(`Today: ${todayDate.getDate()}, Day after tomorrow: ${dayAfterTomorrowDay}`);

      // Check if day after tomorrow is the 1st or 2nd of the month (means we may need to go to next month)
      if (dayAfterTomorrowDay <= 2 && dayAfterTomorrow.getMonth() !== todayDate.getMonth()) {
        console.log(`Day after tomorrow is in the next month, clicking next month button first...`);
        await this.nextMonthButton_LOC.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
        await this.nextMonthButton_LOC.click();
        console.log(`Clicked next month button to navigate to ${dayAfterTomorrowMonth}/${dayAfterTomorrowYear}`);
        
        // Wait for calendar to update
        await this.page.waitForTimeout(WAIT.DEFAULT);
      }

      // Use the class property locator
      const dayAfterTomorrowLocator = this.dayAfterTomorrowDatePicker_LOC(dayAfterTomorrowDay);

      // Wait for the date element to be visible before clicking
      await dayAfterTomorrowLocator.waitFor({ timeout: WAIT.DEFAULT });
      await dayAfterTomorrowLocator.click();

      console.log(`Successfully selected day after tomorrow's date (${dayAfterTomorrowDay}) for ${fieldName}`);
      return formattedDayAfterTomorrow;
    } catch (error) {
      if (error instanceof Error) {
        console.error(` Error selecting day after tomorrow's date for ${fieldName}: ${error.message}`);
      } else {
        console.error(` Error selecting day after tomorrow's date for ${fieldName}: ${String(error)}`);
      }
      throw error;
    }
  }
}
export default NonTabularLoadPage;