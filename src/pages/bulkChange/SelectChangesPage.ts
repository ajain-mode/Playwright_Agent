import { Locator, Page, expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import * as fs from 'fs';
import * as path from 'path';

/**
 * This class provides utility functions for Bulk Change loads. 
 * Consolidates all bulk change operations including Status, Add/Replace References,
 * Change Pick/Drop Location, Print BOL, Send Carrier Confirmation, and Update Ship/Delivery Date.
 * @author Tejaswini
 * @created 2026-01-08
 * @param pages Page object manager
 * @param testData Test data for the load
 */
export default class SelectChangesPage {
    
    private readonly selectChangesPage_LOC: Locator;
    private readonly selectChangesList: (loadType: string) => Locator;
    private readonly statusSelectOption_LOC: Locator;
    private readonly nextButton_LOC: Locator;
    private readonly selectReferenceType_LOC: Locator;
    private readonly enterReferenceValue_LOC: Locator;
    private readonly proNumber_LOC: (text: string) => Locator;
    private readonly poNumber_LOC: (text: string) => Locator;
    private readonly selectOrigin_LOC: Locator;
    private readonly selectDestination_LOC: Locator;
    private readonly selectOriginOption_LOC: Locator;
    private readonly selectDestinationOption_LOC: Locator;
    private readonly originName_LOC: (text: string) => Locator;
    private readonly destinationName_LOC: (text: string) => Locator;
    private readonly selectBOLDropDown_LOC: Locator;
    private readonly carrierConfirmationCheckbox_LOC: Locator;
    private readonly shipAppointmentDate_LOC: Locator;
    private readonly shipAppointmentTime_LOC: Locator;
    private readonly shipDeadlineDate_LOC: Locator;
    private readonly shipDeadlineTime_LOC: Locator;
    private readonly shipDriverInDate_LOC: Locator;
    private readonly shipDriverInTime_LOC: Locator;
    private readonly shipDriverOutDate_LOC: Locator;
    private readonly shipDriverOutTime_LOC: Locator;
    private readonly deliveryAppointmentDate_LOC: Locator;
    private readonly deliveryAppointmentTime_LOC: Locator;
    private readonly deliveryDeadlineDate_LOC: Locator;
    private readonly deliveryDeadlineTime_LOC: Locator;
    private readonly deliveryDriverInDate_LOC: Locator;
    private readonly deliveryDriverInTime_LOC: Locator;
    private readonly deliveryDriverOutDate_LOC: Locator;
    private readonly deliveryDriverOutTime_LOC: Locator;

    constructor(private page: Page) {
        this.selectChangesPage_LOC = this.page.locator("//h1[@class='page-title']");
        this.selectChangesList = (selectChangesType: string) => this.page.locator(`//a[contains(normalize-space(.), ${selectChangesType})]`);
        this.statusSelectOption_LOC = this.page.locator("//select[@id='bulk_load_operation_form_status_form_status']");
        this.nextButton_LOC = this.page.getByRole("button", { name: "Next" });
        this.selectReferenceType_LOC = this.page.locator("//select[@id='bulk_load_operation_form_load_reference_form_reference_type']");
        this.enterReferenceValue_LOC = this.page.locator("//input[@id='bulk_load_operation_form_load_reference_form_reference_value']");
        this.proNumber_LOC = (text: string) => this.page.locator(`//td[@class='view'][contains(normalize-space(.), '${text}')]`);
        this.poNumber_LOC = (text: string) => this.page.locator(`//td[@class='viewww'][contains(normalize-space(.), '${text}')]`);
        this.selectOrigin_LOC = this.page.locator("//input[@value='ORIGIN']");
        this.selectDestination_LOC = this.page.locator("//input[@value='DESTINATION']");
        this.selectOriginOption_LOC = this.page.locator("//select[@class='form-control origin-location']");
        this.selectDestinationOption_LOC = this.page.locator("//select[@class='form-control destination-location']");
        this.originName_LOC = (text: string) => this.page.locator(`td[title*="${text}"]`);
        this.destinationName_LOC = (text: string) => this.page.locator(`td[title*="${text}"]`);
        this.selectBOLDropDown_LOC = this.page.locator("//select[@class='form-control form-select']");
        this.carrierConfirmationCheckbox_LOC = this.page.locator("//select[@id='bulk_load_operation_form_carrier_confirmation_form_carrier_confirmation']");
        this.shipAppointmentDate_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_ship_appointment_date']");
        this.shipAppointmentTime_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_ship_appointment_time']");
        this.shipDeadlineDate_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_ship_deadline_date']");
        this.shipDeadlineTime_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_ship_deadline_time']");
        this.shipDriverInDate_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_ship_driver_in_date']");
        this.shipDriverInTime_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_ship_driver_in_time']");
        this.shipDriverOutDate_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_ship_driver_out_date']");
        this.shipDriverOutTime_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_ship_driver_out_time']");
        this.deliveryAppointmentDate_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_delivery_appointment_date']");
        this.deliveryAppointmentTime_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_delivery_appointment_time']");
        this.deliveryDeadlineDate_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_delivery_deadline_date']");
        this.deliveryDeadlineTime_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_delivery_deadline_time']");
        this.deliveryDriverInDate_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_delivery_driver_in_date']");
        this.deliveryDriverInTime_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_delivery_driver_in_time']");
        this.deliveryDriverOutDate_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_delivery_driver_out_date']");
        this.deliveryDriverOutTime_LOC = this.page.locator("//input[@id='bulk_load_operation_form_ship_delivery_datetime_form_delivery_driver_out_time']");
    }

    dates = commonReusables.getNextTwoDatesFormatted();

    /**
     * Verifies the Bulk Change Select Changes Page heading is displayed correctly.
     */
    async verifySelectChangesPage(): Promise<void> {
        await this.selectChangesPage_LOC.waitFor({ state: 'visible' });
        const headingText = (await this.selectChangesPage_LOC.innerText()).trim();
        const expectedText = 'Bulk Change: Step 2 - Select Changes';
        expect(headingText.toLowerCase()).toBe(expectedText.toLowerCase());
    }

    /**
     * Selects the specified change type from the Select Changes list
     */
    async selectChangeType(changeType: string): Promise<void> {
        const changeTypeLocator = this.selectChangesList(`'${changeType}'`);
        await changeTypeLocator.waitFor({ state: 'visible' });
        await changeTypeLocator.click();
        console.log(`✅ Selected Change Type: ${changeType}`);
    }

    /**
     * Clicks Next button
     * @author Tejaswini
     */
    async clickNextButton(): Promise<void> {
        await this.nextButton_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await this.nextButton_LOC.first().click();
        await this.nextButton_LOC.click();
    }

    /**
     * Selects status change operation and sets the specified status value.
     * @author Tejaswini
     * @param statusValue 
     */
    async selectStatusChange(statusValue: string): Promise<void> {
        await this.selectChangeType(SELECT_CHANGES_TYPE.STATUS);
        await this.selectChangesPage_LOC.waitFor({ state: 'visible' });
        await this.statusSelectOption_LOC.selectOption({ value: statusValue });
    }

    /**
     * Selects reference change operation and configures the reference type.
     * @author Tejaswini
     * @param referenceType 
     */
    async selectReferenceChange(referenceType: string): Promise<void> {
        await this.statusSelectOption_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await this.selectChangeType(SELECT_CHANGES_TYPE.ADD_REPLACE_REFERENCE);
        await this.selectReferenceType_LOC.waitFor({ state: 'visible' });
        await this.selectReferenceType_LOC.selectOption({ label: referenceType });
        console.log(`✅ Selected Reference Type: ${referenceType}`);
    }

    /**
     * Generate a random PRO number and fill in the Reference value field
     * @author Tejaswini
     * @returns The generated PRO number
     */
    async enterReferenceValue(): Promise<string> {
        const refNumber = commonReusables.generateRandomNumber(8);
        await this.enterReferenceValue_LOC.waitFor({ state: 'visible' });
        await this.enterReferenceValue_LOC.fill(refNumber);
        console.log(`✅ Filled Reference Value with: ${refNumber}`);
        return refNumber;
    }

    /**
     * Verifies that the PRO number has been added to the Loads
     * @author Tejaswini
     * @param proNumber The PRO number to verify
     */
    async verifyProNumber(proNumber: string): Promise<void> {
        const proNumberLocator = this.proNumber_LOC(proNumber);
        await proNumberLocator.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        console.log(`✅ Verified PRO Number ${proNumber} has been added to the Loads`);
    }

    /**
     * Verifies that PO number has been added to the Loads
     * @author Tejaswini
     * @param poNumber 
     */
    async verifyPONumber(poNumber: string): Promise<void> {
        const poNumberLocator = this.poNumber_LOC(poNumber);
        await poNumberLocator.waitFor({ state: 'visible', timeout: WAIT.SMALL });
        console.log(`✅ Verified PO Number ${poNumber} has been added to the Loads`);
    }

    /**
     * Selects ship/delivery date change operation.
     * @author Tejaswini
     */
    async selectShipDeliveryDateChange(): Promise<void> {
        await this.statusSelectOption_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await this.selectChangeType(SELECT_CHANGES_TYPE.UPDATE_SHIP_DELIVERY_DATE);
        console.log('✅ Selected Update Ship/Delivery Date change');
    }

    /**
     * Sets Ship Appointment Date and Time
     * @author Tejaswini
     * @param date Ship Appointment Date
     * @param time Ship Appointment Time
     */
    async setShipAppointment(date: string, time: string): Promise<void> {
        await this.shipAppointmentDate_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await this.shipAppointmentDate_LOC.fill(date);
        await this.shipAppointmentTime_LOC.fill(time);
        console.log(`✅ Set Ship Appointment Date: ${date} and Time: ${time}`);
    }

    /**
     * Sets Ship Deadline Date and Time
     * @author Tejaswini
     * @param date Ship Deadline Date
     * @param time Ship Deadline Time
     */
    async setShipDeadline(date: string, time: string): Promise<void> {
        await this.shipDeadlineDate_LOC.waitFor({ state: 'visible' });
        await this.shipDeadlineDate_LOC.fill(date);
        await this.shipDeadlineTime_LOC.fill(time);
        console.log(`✅ Set Ship Deadline Date: ${date} and Time: ${time}`);
    }

    /**
     * Sets Ship Driver In Date and Time
     * @author Tejaswini
     * @param date Ship Driver In Date
     * @param time Ship Driver In Time
     */
    async setShipDriverIn(date: string, time: string): Promise<void> {
        await this.shipDriverInDate_LOC.waitFor({ state: 'visible' });
        await this.shipDriverInDate_LOC.fill(date);
        await this.shipDriverInTime_LOC.fill(time);
        console.log(`✅ Set Ship Driver In Date: ${date} and Time: ${time}`);
    }

    /**
     * Sets Ship Driver Out Date and Time
     * @author Tejaswini
     * @param date Ship Driver Out Date
     * @param time Ship Driver Out Time
     */
    async setShipDriverOut(date: string, time: string): Promise<void> {
        await this.shipDriverOutDate_LOC.waitFor({ state: 'visible' });
        await this.shipDriverOutDate_LOC.fill(date);
        await this.shipDriverOutTime_LOC.fill(time);
        console.log(`✅ Set Ship Driver Out Date: ${date} and Time: ${time}`);
    }

    /**
     * Sets Delivery Appointment Date and Time
     * @author Tejaswini
     * @param date Delivery Appointment Date
     * @param time Delivery Appointment Time
     */
    async setDeliveryAppointment(date: string, time: string): Promise<void> {
        await this.deliveryAppointmentDate_LOC.waitFor({ state: 'visible' });
        await this.deliveryAppointmentDate_LOC.fill(date);
        await this.deliveryAppointmentTime_LOC.fill(time);
        console.log(`✅ Set Delivery Appointment Date: ${date} and Time: ${time}`);
    }

    /**
     * Sets Delivery Deadline Date and Time
     * @author Tejaswini
     * @param date Delivery Deadline Date
     * @param time Delivery Deadline Time
     */
    async setDeliveryDeadline(date: string, time: string): Promise<void> {
        await this.deliveryDeadlineDate_LOC.waitFor({ state: 'visible' });
        await this.deliveryDeadlineDate_LOC.fill(date);
        await this.deliveryDeadlineTime_LOC.fill(time);
        console.log(`✅ Set Delivery Deadline Date: ${date} and Time: ${time}`);
    }

    /**
     * Sets Delivery Driver In Date and Time
     * @author Tejaswini
     * @param date Delivery Driver In Date
     * @param time Delivery Driver In Time
     */
    async setDeliveryDriverIn(date: string, time: string): Promise<void> {
        await this.deliveryDriverInDate_LOC.waitFor({ state: 'visible' });
        await this.deliveryDriverInDate_LOC.fill(date);
        await this.deliveryDriverInTime_LOC.fill(time);
        console.log(`✅ Set Delivery Driver In Date: ${date} and Time: ${time}`);
    }

    /**
     * Sets Delivery Driver Out Date and Time
     * @author Tejaswini
     * @param date Delivery Driver Out Date
     * @param time Delivery Driver Out Time
     */
    async setDeliveryDriverOut(date: string, time: string): Promise<void> {
        await this.deliveryDriverOutDate_LOC.waitFor({ state: 'visible' });
        await this.deliveryDriverOutDate_LOC.fill(date);
        await this.deliveryDriverOutTime_LOC.fill(time);
        console.log(`✅ Set Delivery Driver Out Date: ${date} and Time: ${time}`);
    }

    /**
     * Selects BOL print option from dropdown and returns the PDF page.
     * @author Tejaswini
     * @param option 
     * @returns Promise<Page> - The newly opened PDF page
     */
    async selectBOLPrintOption(option: string): Promise<Page> {
        await this.statusSelectOption_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await this.selectChangeType(SELECT_CHANGES_TYPE.PRINT_BOL);
        await this.selectBOLDropDown_LOC.waitFor({ state: 'visible' });
        await this.selectBOLDropDown_LOC.selectOption(option);
        await this.nextButton_LOC.click();
        const newPagePromise = this.page.context().waitForEvent('page');
        const pdfPage = await newPagePromise;
        await pdfPage.waitForLoadState('load', { timeout: WAIT.XLARGE });
        console.log('✅ PDF document opened in new tab');
        return pdfPage;
    }

    /**
     * Validates the generated BOL PDF has expected pages and contains correct Load/BOL data
     * @author Tejaswini
     * @param options - Validation options
     */
    async validateBOLPdf(options: { expectedPages?: number;
        loadNumbers?: string[];
        bolNumbers?: string[];
        poNumbers?: string[];
        addresses?: string[];
            } = {}): Promise<void> {
        const { expectedPages = 2, loadNumbers = [], bolNumbers = [], poNumbers = [],
             addresses = [] } = options;
        const allPages = this.page.context().pages();
        console.log(`📋 Total tabs open: ${allPages.length}`);
        allPages.forEach((p, index) => {
            console.log(`Tab ${index + 1}: ${p.url()}`);
        });
        let pdfPage = allPages.find(p => p.url().includes('/api/v3/bulk?bulk_op_id'));
        if (!pdfPage) {
            throw new Error('PDF tab was not found. Expected tab with URL containing "/api/v3/bulk?bulk_op_id"');
        }
        console.log(`✅ Found PDF tab: ${pdfPage.url()}`);
        await pdfPage.waitForLoadState('load', { timeout: WAIT.SPEC_TIMEOUT });
        const pdfUrl = pdfPage.url();
        const response = await this.page.request.get(pdfUrl);
        if (!response.ok()) {
            throw new Error(`Failed to fetch PDF from URL: ${pdfUrl}. Status: ${response.status()}`);
        }
        const buffer = await response.body();
        console.log(`✅ PDF buffer fetched, size: ${buffer.length} bytes`);
        const projectRoot = path.resolve(__dirname, '../../..');
        const tempDir = path.join(projectRoot, 'src', 'data', 'bulkchange');
        const tempPdfPath = path.join(tempDir, `temp_bol_${Date.now()}.pdf`);
        fs.writeFileSync(tempPdfPath, buffer);
        console.log(`✅ Saved PDF temporarily at: ${tempPdfPath}`);
        // validate PDF page count and content
        let pageCount: number;
        let pdfText: string = '';
        try {
            const pdfParse = eval('require')('pdf-parse');
            const dataBuffer = fs.readFileSync(tempPdfPath);
            const pdfData = await pdfParse(dataBuffer);
            pageCount = pdfData.numpages;
            pdfText = pdfData.text;
            console.log(`✅ Extracted text from PDF: ${pdfText.length} characters`);
            console.log(`✅ PDF parsed successfully, pages: ${pageCount}`);
        } finally {
            if (fs.existsSync(tempPdfPath)) {
                fs.unlinkSync(tempPdfPath);
                console.log(`✅ Cleaned up temp PDF file`);
            }
        }
        expect(pageCount, `Expected PDF to have ${expectedPages} pages, but found ${pageCount}`).toBe(expectedPages);
        console.log(`✅ BOL PDF page count validated - PDF has ${expectedPages} pages as expected`);
        //validate Load numbers
        if (loadNumbers && loadNumbers.length > 0) {
            console.log(`\n🔍 Validating Load Numbers in PDF...`);
            const missingLoads: string[] = [];
            for (const loadNumber of loadNumbers) {
                if (pdfText.includes(loadNumber)) {
                    console.log(`✅ Load/BOL Number found in PDF: ${loadNumber}`);
                } else {
                    console.log(`❌ Load/BOL Number NOT found in PDF: ${loadNumber}`);
                    missingLoads.push(loadNumber);
                }
            }
            expect(missingLoads.length, `The following Load/BOL numbers were not found in PDF: ${missingLoads.join(', ')}`).toBe(0);
            console.log(`✅ All ${loadNumbers.length} Load/BOL Numbers validated successfully`);
        }
        //validate BOL numbers
        if (bolNumbers && bolNumbers.length > 0) {
            console.log(`\n🔍 Validating BOL Numbers in PDF...`);
            const missingBols: string[] = [];
            for (const bolNumber of bolNumbers) {
                if (pdfText.includes(bolNumber)) {
                    console.log(`✅ BOL Number found in PDF: ${bolNumber}`);
                } else {
                    console.log(`❌ BOL Number NOT found in PDF: ${bolNumber}`);
                    missingBols.push(bolNumber);
                }
            }
            expect(missingBols.length, `The following BOL numbers were not found in PDF: ${missingBols.join(', ')}`).toBe(0);
            console.log(`✅ All ${bolNumbers.length} BOL Numbers validated successfully`);
        }
        //validate PO numbers
        if (poNumbers && poNumbers.length > 0) {
            console.log(`\n🔍 Validating PO Numbers in PDF...`);
            const missingPOs: string[] = [];
            for (const poNumber of poNumbers) {
                if (pdfText.includes(poNumber)) {
                    console.log(`✅ PO Number found in PDF: ${poNumber}`);
                } else {
                    console.log(`❌ PO Number NOT found in PDF: ${poNumber}`);
                    missingPOs.push(poNumber);
                }
            }
            expect(missingPOs.length, `The following PO numbers were not found in PDF: ${missingPOs.join(', ')}`).toBe(0);
            console.log(`✅ All ${poNumbers.length} PO Numbers validated successfully`);
        }
        //validate Addresses
        if (addresses && addresses.length > 0) {
            console.log(`\n🔍 Validating Addresses in PDF...`);
            const missingAddresses: string[] = [];
            for (const address of addresses) {
                if (pdfText.includes(address)) {
                    console.log(`✅ Address found in PDF: ${address}`);
                } else {
                    console.log(`❌ Address NOT found in PDF: ${address}`);
                    missingAddresses.push(address);
                }
            }
            expect(missingAddresses.length, `The following addresses were not found in PDF: ${missingAddresses.join(', ')}`).toBe(0);
            console.log(`✅ All ${addresses.length} Addresses validated successfully`);
        }
        console.log(`✅ BOL PDF validation completed successfully`);
    }

    /**
     * Selects carrier confirmation change and configures the confirmation type.
     * @author Tejaswini
     * @param ConfirmationType
     */
    async selectCarrierConfirmationChange(ConfirmationType: string): Promise<void> {
        await this.statusSelectOption_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await this.selectChangeType(SELECT_CHANGES_TYPE.SEND_CARRIER_CONFIRMATION);
        await this.carrierConfirmationCheckbox_LOC.waitFor({ state: 'visible' });
        await this.carrierConfirmationCheckbox_LOC.selectOption({ label: ConfirmationType });
        console.log(`✅ Selected Carrier Confirmation Type: ${ConfirmationType}`);
    }

    /**
     * Selects origin location change and configures the new origin.
     * @author Tejaswini 
     */
    async selectOriginChange(testData: any): Promise<void> {
        await this.statusSelectOption_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await this.selectChangeType(SELECT_CHANGES_TYPE.CHANGE_PICK_DROP_LOCATION);
        await this.selectOrigin_LOC.waitFor({ state: 'visible' });
        await this.selectOrigin_LOC.click();
        await this.selectOriginOption_LOC.waitFor({ state: 'visible' });
        await this.selectOriginOption_LOC.click();
        await this.selectOriginOption_LOC.selectOption({ label: testData.newOriginLocation });
    }

    /**
     * Selects destination location change and configures the new destination.
     * @author Tejaswini 
     */
    async selectDestinationChange(testData: any): Promise<void> {
        await this.statusSelectOption_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await this.selectChangeType(SELECT_CHANGES_TYPE.CHANGE_PICK_DROP_LOCATION);
        await this.selectDestination_LOC.waitFor({ state: 'visible' });
        await this.selectDestination_LOC.click();
        await this.selectDestinationOption_LOC.waitFor({ state: 'visible' });
        await this.selectDestinationOption_LOC.click();
        await this.selectDestinationOption_LOC.selectOption({ label: testData.newDestinationLocation });
    }
    
    /**
     * Validates the Origin name on the load pick tab
     * @author Tejaswini
     * @param testData 
     */
    async validateOriginName(testData: { newOriginLocation: string }): Promise<void> {
        const originLocation = testData.newOriginLocation.trim();
        const originName = originLocation.split(' - ')[0].trim();
        const locator = this.originName_LOC(originName).first();
        const originText = (await locator.getAttribute('title')) ?? (await locator.innerText());
        console.log(`Visible text on Load Tab: ${originText} | Origin from testData: ${originName}`);
        if (originText.includes(originName)) {
            console.log('✅ Origin matches');
        } else {
            throw new Error(`❌ Origin mismatch`);
        }
    }

    /**
     * Validate the Destination name on the load drop tab
     * @author Tejaswini
     * @param testData - object containing `newDestinationLocation`
     */
    async validateDestinationName(testData: { newDestinationLocation: string }): Promise<void> {
        const destinationLocation = testData.newDestinationLocation.trim();
        const destinationName = destinationLocation.split(' - ')[0].trim();
        const locator = this.destinationName_LOC(destinationName).first();
        const destinationText = (await locator.getAttribute('title')) ?? (await locator.innerText());
        console.log(`Visible text on Load Tab: ${destinationText} | Destination from testData: ${destinationName}`);
        if (destinationText.includes(destinationName)) {
            console.log('✅ Destination matches');
        } else {
            throw new Error(`❌ Destination mismatch`);
        }
    }
}