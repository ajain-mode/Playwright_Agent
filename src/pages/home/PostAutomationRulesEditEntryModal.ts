import { expect, Locator, Page } from "@playwright/test";
import { GlobalConstants } from "@utils/globalConstants";

/**
 * Author name: Parth Rastogi
 * PostAutomationRulePageEditEntryModal handles post automation Edit Entry Modal verification and management operations
 */

class PostAutomationRulePageEditEntryModal {
    private readonly editEntryPickNameText_LOC: Locator;
    private readonly editEntryPickAddressText_LOC: Locator;
    private readonly editEntryPickTypeDropDownText_LOC: Locator;
    private readonly editEntryPickCityText_LOC: Locator;
    private readonly editEntryPickZipText_LOC: Locator;
    private readonly editEntryDropNameText_LOC: Locator;
    private readonly editEntryDropAddressText_LOC: Locator;
    private readonly editEntryDropTypeDropDownText_LOC: Locator;
    private readonly editEntryDropCityText_LOC: Locator;
    private readonly editEntryDropZipText_LOC: Locator;
    private readonly equipmentDropdown_LOC: Locator;
    private readonly loadTypeDropdown_LOC: Locator;
    private readonly offerRateInput_LOC: Locator;
    private readonly editEntryCustomerDropDownText_LOC: (text: string) => Locator;
    private readonly editEntryEmailText_LOC: (text: string) => Locator;
    private readonly editEntryPickLocationDropDownText_LOC: (text: string) => Locator;
    private readonly editEntryStop1LocationDropDownText_LOC: (text: string) => Locator;
    private readonly editEntryDropLocationDropDownText_LOC: (text: string) => Locator;
    private readonly commodityDropdown_LOC: Locator;
    private readonly editEntryStop1NameText_LOC: Locator;
    private readonly editEntryStop1AddressText_LOC: Locator;
    private readonly editEntryStop1TypeDropDownText_LOC: Locator;
    private readonly editEntryStop1CityText_LOC: Locator;
    private readonly editEntryStop1ZipText_LOC: Locator;

    constructor(private page: Page) {
        this.editEntryCustomerDropDownText_LOC = (text: string) => {
            return this.page.locator(
                `//label[contains(text(),'Customer')]//following-sibling::div//span[text()='${text}']`
            );
        };
        this.editEntryEmailText_LOC = (text: string) => {
            return this.page.locator(
                `//label[contains(text(),'Email for Notifications')]//following-sibling::span//li[text()='${text}']`
            );
        };
        this.editEntryPickLocationDropDownText_LOC = (text: string) => {
            return this.page.locator(
                `//span[@id='select2-form_origin-container' and contains(@title,'${text}')]`
            );
        };
         this.editEntryStop1LocationDropDownText_LOC = (text: string) => {
            return this.page.locator(
                `//span[@id='select2-form_stop_1-container' and contains(@title,'${text}')]`
            );
        };
        this.editEntryDropLocationDropDownText_LOC = (text: string) => {
            return this.page.locator(
                `//label[@for='form_destination' and contains(text(),'Location')]//parent::div//span[contains(@title,'${text}')]`
            );
        };
        this.editEntryPickNameText_LOC = page.locator(
            "//label[@for='form_origin_name' and contains(text(),'Name')]//following-sibling::input"
        );
         this.editEntryStop1NameText_LOC = page.locator(
            "//label[@for='form_stop_1_name' and contains(text(),'Name')]//following-sibling::input"
        );
        this.editEntryPickAddressText_LOC = page.locator(
            "//label[@for='form_origin_address' and contains(text(),'Address')]//following-sibling::input"
        );
         this.editEntryStop1AddressText_LOC = page.locator(
            "//label[@for='form_stop_1_address' and contains(text(),'Address')]//following-sibling::input"
        );
        this.editEntryPickTypeDropDownText_LOC = page.locator(
            "//label[text()='Type']//following-sibling::select[@id='form_origin_type']//option[@selected='selected']"
        );
        this.editEntryStop1TypeDropDownText_LOC = page.locator(
            "//label[text()='Type']//following-sibling::select[@id='form_stop_1_type']//option[@value='PICK']"
        );
        this.editEntryPickCityText_LOC = page.locator(
            "//label[@for='form_origin_city' and contains(text(),'City')]//following-sibling::input"
        );
         this.editEntryStop1CityText_LOC = page.locator(
            "//label[@for='form_stop_1_city' and contains(text(),'City')]//following-sibling::input"
        );
        this.editEntryPickZipText_LOC = page.locator(
            "//label[contains(text(),'Zip/Postal code')]//following-sibling::input[@id='form_origin_zip']"
        );
        this.editEntryStop1ZipText_LOC = page.locator(
            "//label[contains(text(),'Zip')]//following-sibling::input[@id='form_stop_1_zip']"
        );
        this.editEntryDropNameText_LOC = page.locator(
            "//label[@for='form_destination_name' and contains(text(),'Name')]//following-sibling::input"
        );
        this.editEntryDropAddressText_LOC = page.locator(
            "//label[@for='form_destination_address' and contains(text(),'Address')]//following-sibling::input"
        );
        this.editEntryDropTypeDropDownText_LOC = page.locator(
            "//label[text()='Type']//following-sibling::select[@id='form_destination_type']//option[@selected='selected']"
        );
        this.editEntryDropCityText_LOC = page.locator(
            "//label[@for='form_destination_city' and contains(text(),'City')]//following-sibling::input"
        );
        this.editEntryDropZipText_LOC = page.locator(
            "//label[contains(text(),'Zip/Postal code')]//following-sibling::input[@id='form_destination_zip']"
        );
        this.commodityDropdown_LOC = page.locator("#form_commodity");
        this.equipmentDropdown_LOC = page.locator("#form_equipment_code");
        this.loadTypeDropdown_LOC = page.locator("#form_load_method");
        this.offerRateInput_LOC = page.locator("#form_manual_target_rate");
    }

    /**
      * @author Parth Rastogi
      * @description Validate that the expected customer text is visible in the form
      * @created 2026-01-12
      * @param expectedCustomerText - The customer text to validate
      * @returns Promise<boolean> - True if customer text is visible, false otherwise
      */
    async validateCustomerSelection(
        expectedCustomerText: string
    ): Promise<boolean> {
        try {
            await this.page.waitForLoadState("networkidle");
            const trimmedCustomerText = expectedCustomerText.trim();
            await this.page.waitForLoadState("networkidle");
            // Check if the customer text is visible using the specific locator
            const customerElement =
                this.editEntryCustomerDropDownText_LOC(trimmedCustomerText);
            await customerElement.waitFor({
                state: "visible",
                timeout: WAIT.DEFAULT,
            });
            const isVisible = await customerElement.isVisible();
            if (isVisible) {
                console.log(
                    `✅ Customer selection validated successfully: "${trimmedCustomerText}"`
                );
                return true;
            } else {
                console.warn(
                    `❌ Customer selection validation failed: "${trimmedCustomerText}" not visible`
                );
                return false;
            }
        } catch (error) {
            console.error(
                `Error validating customer selection for "${expectedCustomerText}": ${error}`
            );
            return false;
        }
    }
    /**
     * @author Parth Rastogi
     * @description Validate that the expected email text is visible in the form
     * @created 2026-01-12
     * @param expectedEmailText - The email text to validate
     * @returns Promise<boolean> - True if email text is visible, false otherwise
     */
    async validateEmailSelection(expectedEmailText: string): Promise<boolean> {
        try {
            const trimmedEmailText = expectedEmailText.trim();
            await this.page.waitForLoadState("networkidle");
            // Check if the email text is visible using the specific locator
            const emailElement = this.editEntryEmailText_LOC(trimmedEmailText);
            await emailElement.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
            const isVisible = await emailElement.isVisible();
            if (isVisible) {
                console.log(
                    `✅ Email selection validated successfully: "${trimmedEmailText}"`
                );
                return true;
            } else {
                console.warn(
                    `❌ Email selection validation failed: "${trimmedEmailText}" not visible`
                );
                return false;
            }
        } catch (error) {
            console.error(
                `Error validating email selection for "${expectedEmailText}": ${error}`
            );
            return false;
        }

    }

    /**
     * @author Parth Rastogi
     * @description Validate that the expected location text is visible in the form
     * @created 2026-01-12
     * @param expectedLocationText - The location text to validate
     * @param locationType - The type of location ("Pick", "Drop", or "Stop1")
     * @returns Promise<boolean> - True if location text is visible, false otherwise
     */
    async validateLocationSelection(
        expectedLocationText: string,
        locationType: "PICK" | "DROP" | "STOP1" = "PICK"
    ): Promise<boolean> {
        try {
            const trimmedLocationText = expectedLocationText.trim();
            await this.page.waitForLoadState("networkidle");

            // Choose the appropriate locator based on location type
            let locationElement;
            if (locationType === "PICK") {
                locationElement = this.editEntryPickLocationDropDownText_LOC(trimmedLocationText);
            } else if (locationType === "STOP1") {
                locationElement = this.editEntryStop1LocationDropDownText_LOC(trimmedLocationText);
            } else {
                locationElement = this.editEntryDropLocationDropDownText_LOC(trimmedLocationText);
            }

            await locationElement.waitFor({
                state: "visible",
                timeout: WAIT.DEFAULT,
            });
            const isVisible = await locationElement.isVisible();

            if (!isVisible) {
                console.warn(
                    `❌ ${locationType} location element not visible for: "${trimmedLocationText}"`
                );
                expect.soft(isVisible, `${locationType} location selection validation - Expected location element to be visible`).toBeTruthy();
                return false;
            }

            // Get actual text content from the element
            const actualLocationText = (await locationElement.getAttribute('title')) || '';
            const trimmedActualText = actualLocationText.trim();
            const isTextMatch = trimmedActualText === trimmedLocationText;

            // Use soft assertion to compare expected and actual text
            expect.soft(trimmedActualText, `${locationType} location text validation - Expected: "${trimmedLocationText}", Actual: "${trimmedActualText}"`).toBe(trimmedLocationText);

            if (isTextMatch) {
                console.log(
                    `✅ ${locationType} location selection validated successfully: "${trimmedLocationText}"`
                );
                return true;
            } else {
                console.warn(
                    `❌ ${locationType} location selection validation failed. Expected: "${trimmedLocationText}", Actual: "${trimmedActualText}"`
                );
                return false;
            }
        } catch (error) {
            console.error(
                `Error validating ${locationType.toLowerCase()} location selection for "${expectedLocationText}": ${error}`
            );
            return false;
        }
    }

    /**
    * @author Parth Rastogi
    * @description Validate all location fields (name, address, type, city, state, zip) for Pick, Drop, or Stop1 locations
    * @created 2026-01-12
    * @modified 2026-01-15
    * @param validationData - Object containing expected values for all location fields
    * @param locationType - The type of location ("Pick", "Drop", or "Stop1")
    * @returns Promise<{isValid: boolean, results: object}> - Validation results for each field
    */
    async validateAllLocationFields(validationData: {
        name?: string;
        address?: string;
        type?: string;
        city?: string;
        state?: string;
        zip?: string;

    }, locationType: "PICK" | "DROP" | "STOP1" = "PICK"): Promise<{
        isValid: boolean;
        results: {
            name?: boolean;
            address?: boolean;
            type?: boolean;
            city?: boolean;
            state?: boolean;
            zip?: boolean;

        };
    }> {
        try {
            await this.page.waitForLoadState("networkidle");
            // Select appropriate locators based on location type
            let nameLocator, addressLocator, typeLocator, cityLocator, zipLocator;
            
            if (locationType === "PICK") {
                nameLocator = this.editEntryPickNameText_LOC;
                addressLocator = this.editEntryPickAddressText_LOC;
                typeLocator = this.editEntryPickTypeDropDownText_LOC;
                cityLocator = this.editEntryPickCityText_LOC;
                zipLocator = this.editEntryPickZipText_LOC;
            } else if (locationType === "STOP1") {
                nameLocator = this.editEntryStop1NameText_LOC;
                addressLocator = this.editEntryStop1AddressText_LOC;
                typeLocator = this.editEntryStop1TypeDropDownText_LOC;
                cityLocator = this.editEntryStop1CityText_LOC;
                zipLocator = this.editEntryStop1ZipText_LOC;
            } else {
                nameLocator = this.editEntryDropNameText_LOC;
                addressLocator = this.editEntryDropAddressText_LOC;
                typeLocator = this.editEntryDropTypeDropDownText_LOC;
                cityLocator = this.editEntryDropCityText_LOC;
                zipLocator = this.editEntryDropZipText_LOC;
            }

            const validationResults: {
                name?: boolean;
                address?: boolean;
                type?: boolean;
                city?: boolean;
                state?: boolean;
                zip?: boolean;
            } = {};

            let allValid = true;
            // Validate Name field (input)
            if (validationData.name !== undefined) {
                try {
                    const trimmedName = validationData.name.trim();
                    await nameLocator.waitFor({
                        state: "visible",
                        timeout: WAIT.DEFAULT,
                    });
                    const actualName = await nameLocator.inputValue();
                    validationResults.name = actualName.trim() === trimmedName;
                    expect.soft(actualName.trim(), `${locationType} name field validation - Expected: "${trimmedName}", Actual: "${actualName}"`).toBe(trimmedName);
                    if (validationResults.name) {
                        console.log(`✅ ${locationType} name validation passed: "${trimmedName}"`);
                    } else {
                        console.warn(
                            `❌ ${locationType} name validation failed. Expected: "${trimmedName}", Actual: "${actualName}"`
                        );
                        allValid = false;
                    }
                } catch (error) {
                    console.error(`❌ ${locationType} name validation error: ${error}`);
                    validationResults.name = false;
                    allValid = false;
                }
            }
            // Validate Address field (input)
            if (validationData.address !== undefined) {
                try {
                    const trimmedAddress = validationData.address.trim();
                    await addressLocator.waitFor({
                        state: "visible",
                        timeout: WAIT.DEFAULT,
                    });
                    const actualAddress = await addressLocator.inputValue();
                    validationResults.address = actualAddress.trim() === trimmedAddress;
                    expect.soft(actualAddress.trim(), `${locationType} address field validation - Expected: "${trimmedAddress}", Actual: "${actualAddress}"`).toBe(trimmedAddress);
                    if (validationResults.address) {
                        console.log(`✅ ${locationType} address validation passed: "${trimmedAddress}"`);
                    } else {
                        console.warn(
                            `❌ ${locationType} address validation failed. Expected: "${trimmedAddress}", Actual: "${actualAddress}"`
                        );
                        allValid = false;
                    }
                } catch (error) {
                    console.error(`❌ ${locationType} address validation error: ${error}`);
                    validationResults.address = false;
                    allValid = false;
                }
            }
            // Validate Type dropdown
            if (validationData.type !== undefined) {
                try {
                    const trimmedType = validationData.type.trim();

                    // For type dropdown, get the parent select element
                    let selectElement;
                    if (locationType === "PICK") {
                        selectElement = this.page.locator("//select[@id='form_origin_type']");
                    } else if (locationType === "STOP1") {
                        selectElement = this.page.locator("//select[@id='form_stop_1_type']");
                    } else {
                        selectElement = this.page.locator("//select[@id='form_destination_type']");
                    }

                    await selectElement.waitFor({
                        state: "visible",
                        timeout: WAIT.DEFAULT,
                    });

                    // Get the selected option text content
                    const actualType = (await typeLocator.textContent()) || "";
                    validationResults.type = actualType.trim() === trimmedType;
                    expect.soft(actualType.trim(), `${locationType} type dropdown validation - Expected: "${trimmedType}", Actual: "${actualType}"`).toBe(trimmedType);
                    if (validationResults.type) {
                        console.log(`✅ ${locationType} type validation passed: "${trimmedType}"`);
                    } else {
                        console.warn(
                            `❌ ${locationType} type validation failed. Expected: "${trimmedType}", Actual: "${actualType}"`
                        );
                        allValid = false;
                    }
                } catch (error) {
                    console.error(`❌ ${locationType} type validation error: ${error}`);
                    validationResults.type = false;
                    allValid = false;
                }
            }
            // Validate City field (input)
            if (validationData.city !== undefined) {
                try {
                    const trimmedCity = validationData.city.trim();
                    await cityLocator.waitFor({
                        state: "visible",
                        timeout: WAIT.DEFAULT,
                    });
                    const actualCity = await cityLocator.inputValue();
                    validationResults.city = actualCity.trim() === trimmedCity;
                    expect.soft(actualCity.trim(), `${locationType} city field validation - Expected: "${trimmedCity}", Actual: "${actualCity}"`).toBe(trimmedCity);
                    if (validationResults.city) {
                        console.log(`✅ ${locationType} city validation passed: "${trimmedCity}"`);
                    } else {
                        console.warn(
                            `❌ ${locationType} city validation failed. Expected: "${trimmedCity}", Actual: "${actualCity}"`
                        );
                        allValid = false;
                    }
                } catch (error) {
                    console.error(`❌ ${locationType} city validation error: ${error}`);
                    validationResults.city = false;
                    allValid = false;
                }
            }
            // Validate State dropdown
            if (validationData.state !== undefined) {
                try {
                    const trimmedState = validationData.state.trim();

                    // Get the appropriate state dropdown element ID based on location type
                    let stateElementId;
                    if (locationType === "PICK") {
                        stateElementId = 'form_origin_state';
                    } else if (locationType === "STOP1") {
                        stateElementId = 'form_stop_1_state';
                    } else {
                        stateElementId = 'form_destination_state';
                    }

                    // Use getSelectedStateValue function to handle disabled dropdowns properly
                    const actualState = await this.getSelectedStateValue(stateElementId);

                    validationResults.state = actualState.trim() === trimmedState;
                    expect.soft(actualState.trim(), `${locationType} state dropdown validation - Expected: "${trimmedState}", Actual: "${actualState}"`).toBe(trimmedState);
                    if (validationResults.state) {
                        console.log(`✅ ${locationType} state validation passed: "${trimmedState}"`);
                    } else {
                        console.warn(
                            `❌ ${locationType} state validation failed. Expected: "${trimmedState}", Actual: "${actualState}"`
                        );
                        allValid = false;
                    }
                } catch (error) {
                    console.error(`❌ ${locationType} state validation error: ${error}`);
                    validationResults.state = false;
                    allValid = false;
                }
            }
            // Validate Zip field (input)
            if (validationData.zip !== undefined) {
                try {
                    const trimmedZip = validationData.zip.trim();
                    await zipLocator.waitFor({
                        state: "visible",
                        timeout: WAIT.DEFAULT,
                    });
                    const actualZip = await zipLocator.inputValue();
                    validationResults.zip = actualZip.trim() === trimmedZip;
                    expect.soft(actualZip.trim(), `${locationType} zip field validation - Expected: "${trimmedZip}", Actual: "${actualZip}"`).toBe(trimmedZip);
                    if (validationResults.zip) {
                        console.log(`✅ ${locationType} zip validation passed: "${trimmedZip}"`);
                    } else {
                        console.warn(
                            `❌ ${locationType} zip validation failed. Expected: "${trimmedZip}", Actual: "${actualZip}"`
                        );
                        allValid = false;
                    }
                } catch (error) {
                    console.error(`❌ ${locationType} zip validation error: ${error}`);
                    validationResults.zip = false;
                    allValid = false;
                }
            }
            if (allValid) {
                console.log(`✅ All ${locationType.toLowerCase()} location validations passed successfully!`);
            } else {
                console.warn(
                    `❌ Some ${locationType.toLowerCase()} location validations failed. Check individual results.`
                );
            }
            return {
                isValid: allValid,
                results: validationResults,
            };
        } catch (error) {
            console.error(
                `❌ Error in comprehensive pick location validation: ${error}`
            );
            return {
                isValid: false,
                results: {},
            };
        }
    }

    /**
    * @author Parth Rastogi
    * @description Validate commodity text using commodityDropdown_LOC
    * @created 2026-01-13
    * @param expectedCommodityText - The expected commodity text to validate
    * @returns Promise<boolean> - True if commodity text matches, false otherwise
    */
    async validateCommodityText(expectedCommodityText: string): Promise<boolean> {
        try {
            const trimmedCommodityText = expectedCommodityText.trim();
            await this.page.waitForLoadState("networkidle");

            // Wait for the commodity dropdown to be visible
            await this.commodityDropdown_LOC.waitFor({
                state: "visible",
                timeout: GlobalConstants.WAIT.DEFAULT,
            });

            let actualCommodityText = '';

            // First try to get the selected value from inputValue()
            try {
                const selectedValue = await this.commodityDropdown_LOC.inputValue({ timeout: WAIT.SMALL / 2 });
                actualCommodityText = selectedValue || '';
            } catch (inputValueError) {
                console.warn(`Could not get input value: ${inputValueError}`);
            }

            // If no value from inputValue, try to get the text content from selected option
            if (!actualCommodityText) {
                try {
                    const selectedOption = this.commodityDropdown_LOC.locator('option:checked');
                    // Wait for the option to exist with a shorter timeout
                    await selectedOption.waitFor({ state: "attached", timeout: WAIT.SMALL / 2 });
                    actualCommodityText = (await selectedOption.textContent({ timeout: WAIT.SMALL / 2 })) || '';
                } catch (optionError) {
                    console.warn(`Could not get selected option text: ${optionError}`);

                    // Final fallback: try to get any selected option text using evaluate
                    try {
                        actualCommodityText = await this.page.evaluate(() => {
                            const select = document.querySelector('#form_commodity') as HTMLSelectElement;
                            if (select && select.selectedOptions.length > 0) {
                                return select.selectedOptions[0].textContent || select.value || '';
                            }
                            return '';
                        });
                    } catch (evaluateError) {
                        console.warn(`Could not get commodity text via evaluate: ${evaluateError}`);
                    }
                }
            }

            actualCommodityText = actualCommodityText.trim();
            const isValid = actualCommodityText === trimmedCommodityText;

            // Use soft assertion to allow test to continue even if validation fails
            expect.soft(actualCommodityText, `Commodity text validation - Expected: "${trimmedCommodityText}", Actual: "${actualCommodityText}"`).toBe(trimmedCommodityText);

            if (isValid) {
                console.log(`✅ Commodity validation passed: "${trimmedCommodityText}"`);
            } else {
                console.warn(
                    `❌ Commodity validation failed. Expected: "${trimmedCommodityText}", Actual: "${actualCommodityText}"`
                );
            }

            return isValid;
        } catch (error) {
            console.error(`❌ Error validating commodity text for "${expectedCommodityText}": ${error}`);
            return false;
        }
    }

    /**
    * @author Parth Rastogi
    * @description Validate form field values for equipment, load type and offer rate
    * @created 2026-01-13
    * @param validationData - Object containing expected values for equipment, loadType and offerRate
    * @returns Promise<{isValid: boolean, results: object}> - Validation results for each field
    */
    async validateEquipmentLoadMethodOfferRateFields(validationData: {
        equipment?: string;
        loadType?: string;
        offerRate?: string;
    }): Promise<{
        isValid: boolean;
        results: {
            equipment?: boolean;
            loadType?: boolean;
            offerRate?: boolean;
        };
    }> {
        try {
            await this.page.waitForLoadState("networkidle");

            const validationResults: {
                equipment?: boolean;
                loadType?: boolean;
                offerRate?: boolean;
            } = {};

            let allValid = true;

            // Validate Equipment field (select dropdown)
            if (validationData.equipment !== undefined) {
                try {
                    const trimmedEquipment = validationData.equipment.trim();

                    // Check if element exists first (don't wait for visibility as it might be hidden)
                    const equipmentExists = (await this.equipmentDropdown_LOC.count()) > 0;

                    if (equipmentExists) {
                        // Get selected option text without waiting for visibility
                        const selectedOption = this.equipmentDropdown_LOC.locator('option:checked');
                        const actualEquipment = (await selectedOption.textContent().catch(() => '')) || '';

                        validationResults.equipment = actualEquipment.trim() === trimmedEquipment;
                        expect.soft(actualEquipment.trim(), `Equipment field validation - Expected: "${trimmedEquipment}", Actual: "${actualEquipment}"`).toBe(trimmedEquipment);

                        if (validationResults.equipment) {
                            console.log(`✅ Equipment validation passed: "${trimmedEquipment}"`);
                        } else {
                            console.warn(`❌ Equipment validation failed. Expected: "${trimmedEquipment}", Actual: "${actualEquipment}"`);
                            allValid = false;
                        }
                    } else {
                        console.warn(`❌ Equipment dropdown element not found`);
                        validationResults.equipment = false;
                        allValid = false;
                    }
                } catch (error) {
                    console.error(`❌ Equipment validation error: ${error}`);
                    validationResults.equipment = false;
                    allValid = false;
                }
            }

            // Validate Load Type field (select dropdown)
            if (validationData.loadType !== undefined) {
                try {
                    const trimmedLoadType = validationData.loadType.trim();

                    // Check if element exists first (don't wait for visibility as it might be hidden)
                    const loadTypeExists = (await this.loadTypeDropdown_LOC.count()) > 0;

                    if (loadTypeExists) {
                        // Get selected option text without waiting for visibility
                        const selectedOption = this.loadTypeDropdown_LOC.locator('option:checked');
                        const actualLoadType = (await selectedOption.textContent().catch(() => '')) || '';

                        validationResults.loadType = actualLoadType.trim() === trimmedLoadType;
                        expect.soft(actualLoadType.trim(), `Load type field validation - Expected: "${trimmedLoadType}", Actual: "${actualLoadType}"`).toBe(trimmedLoadType);

                        if (validationResults.loadType) {
                            console.log(`✅ Load type validation passed: "${trimmedLoadType}"`);
                        } else {
                            console.warn(`❌ Load type validation failed. Expected: "${trimmedLoadType}", Actual: "${actualLoadType}"`);
                            allValid = false;
                        }
                    } else {
                        console.warn(`❌ Load type dropdown element not found`);
                        validationResults.loadType = false;
                        allValid = false;
                    }
                } catch (error) {
                    console.error(`❌ Load type validation error: ${error}`);
                    validationResults.loadType = false;
                    allValid = false;
                }
            }

            // Validate Offer Rate field (input)
            if (validationData.offerRate !== undefined) {
                try {
                    const trimmedOfferRate = validationData.offerRate.trim();

                    // Check if element exists first (don't wait for visibility as it might be hidden)
                    const offerRateExists = (await this.offerRateInput_LOC.count()) > 0;

                    if (offerRateExists) {
                        // Get input value without waiting for visibility
                        const actualOfferRate = (await this.offerRateInput_LOC.inputValue().catch(() => '')) || '';

                        validationResults.offerRate = actualOfferRate.trim() === trimmedOfferRate;
                        expect.soft(actualOfferRate.trim(), `Offer rate field validation - Expected: "${trimmedOfferRate}", Actual: "${actualOfferRate}"`).toBe(trimmedOfferRate);

                        if (validationResults.offerRate) {
                            console.log(`✅ Offer rate validation passed: "${trimmedOfferRate}"`);
                        } else {
                            console.warn(`❌ Offer rate validation failed. Expected: "${trimmedOfferRate}", Actual: "${actualOfferRate}"`);
                            allValid = false;
                        }
                    } else {
                        console.warn(`❌ Offer rate input element not found`);
                        validationResults.offerRate = false;
                        allValid = false;
                    }
                } catch (error) {
                    console.error(`❌ Offer rate validation error: ${error}`);
                    validationResults.offerRate = false;
                    allValid = false;
                }
            }

            if (allValid) {
                console.log(`✅ All form field validations passed successfully!`);
            } else {
                console.warn(`❌ Some form field validations failed. Check individual results.`);
            }

            return {
                isValid: allValid,
                results: validationResults,
            };
        } catch (error) {
            console.error(`❌ Error in form field validation: ${error}`);
            return {
                isValid: false,
                results: {},
            };
        }
    }

    /**
    * @author Parth Rastogi
    * @description Get selected state value from dropdown using page evaluate
    * @created 2026-01-13
    * @param elementId - The ID of the state dropdown element (default: 'form_destination_state')
    * @returns Promise<string> - The selected state value or text content
    */
    async getSelectedStateValue(elementId: string = 'form_destination_state'): Promise<string> {
        try {
            const selectedState = await this.page.evaluate((id) => {
                const select = document.getElementById(id) as HTMLSelectElement;
                if (!select) {
                    console.warn(`Element with ID '${id}' not found`);
                    return '';
                }
                const selectedIdx = select.selectedIndex;
                if (selectedIdx === 0) {
                    // First option is empty/selected, get from form field value or another element
                    return select.value || '';
                }
                return select.options[selectedIdx].textContent?.trim() || '';
            }, elementId);
            return selectedState;
        } catch (error) {
            console.error(`❌ Error getting selected state value from ${elementId}: ${error}`);
            return '';
        }
    }

    /**
     * @author Deepak BohraS
     * @description Get and validate the waterfall offer rate value against an expected value
     * @created 2026-01-19
     * @param expectedOfferRate - The expected offer rate value to validate against
     * @returns Promise<boolean> - True if the offer rate matches the expected value, false otherwise
     */
    async validateWaterfallOfferRate(expectedOfferRate: string): Promise<boolean> {
        try {
            await this.page.waitForLoadState("networkidle");
            // Get the waterfall offer rate input field
            const waterfallOfferRateLocator = this.page.locator("#form_waterfall_offer_rate");
         // Wait for the element to be visible
            await waterfallOfferRateLocator.waitFor({
                state: "visible",
                timeout: WAIT.DEFAULT,
            });
            
            // Get the actual value from the input field
            const actualOfferRate = await waterfallOfferRateLocator.inputValue();
            const trimmedActual = actualOfferRate.trim();
            const trimmedExpected = expectedOfferRate.trim();
            
            // Compare the values
            if (trimmedActual === trimmedExpected) {
                console.log(`✅ Waterfall offer rate validation passed: Expected "${trimmedExpected}", Got "${trimmedActual}"`);
                expect(trimmedActual).toBe(trimmedExpected);
                return true;
            } else {
                console.error(`❌ Waterfall offer rate validation failed: Expected "${trimmedExpected}", Got "${trimmedActual}"`);
                expect(trimmedActual, `Waterfall offer rate validation - Expected: "${trimmedExpected}", Actual: "${trimmedActual}"`).toBe(trimmedExpected);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error validating waterfall offer rate: ${error}`);
            throw error;
        }
    }

}
export default PostAutomationRulePageEditEntryModal;