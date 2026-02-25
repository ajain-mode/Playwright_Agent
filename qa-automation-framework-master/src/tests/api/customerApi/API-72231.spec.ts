import apiAuth from "@api/apiAuth";
import apiRequests from "@api/apiRequests";
import dataConfig from "@config/dataConfig";
import dynamicDataAPI from "@config/dynamicDataAPI";
import userSetup from "@loginHelpers/userSetup";
import test, { expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { testData } from "@utils/dfbUtils/dfbFieldValidationConfig";
import { PageManager } from "@utils/PageManager";
/**
 * @author : Rohit Singh
 * @created : 2025-Nov-14
 * Test Case ID: API-72231
 */

test.describe.configure({ retries: 2 });
test.describe.serial('Endpoint Customer API', { tag: ['@api', '@at_customerapi', '@tporegression', '@smoke'] }, () => {
    let quoteId: string;
    let loadId: string;
    let priceSheetId: string;
    let carrierName: string;
    let carrierScac: string;
    let serviceDays: number;
    // Determine auth user and customer name
    const authUser = apiAuth.user.KPS;
    const customerName = apiAuth.customerName.KPS; 

    test('Case Id: 72231 - Endpoint - Rate Request', async () => {
        const testcaseID = 'API-72231';
        // Send LTL Rate Quote API Request
        console.log('Sending LTL Rate Quote API Request for Test Case ID:', testcaseID);
        const response = await apiRequests.ltlRateQuoteAPIRequest(authUser);

        expect([200, 202]).toContain(response.status);
        expect([API_STATUS.ACCEPTED, API_STATUS.OK]).toContain(response.statusText);
        console.log('LTL Rate Quote API Response Status Code:', response.status);

        console.log('Response Data:', response.data);
        // Validate response data structures
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('priceSheets');
        expect(response.data).toHaveProperty('status');

        // Validate status is 'Pending or 'Completed'
        expect(["Pending", "Completed", "Complete"]).toContain(response.data.status);
        // Store id in quoteId variable
        quoteId = response.data.id;
        expect(quoteId).toBeDefined();
        expect(typeof quoteId).toBe('string');
        console.log('Quote ID: ', quoteId);
        console.log('Validation completed - Rate Request API Response');
    });
    /**
     * @author : Rohit Singh
     * @created : 2025-Nov-17
     * Test Case ID: API-72232
     * Endpoint - Book Load from Quote ID
     */
    test('Case Id: 72232 - Endpoint -  Book', async ({ page }) => {
        await page.waitForTimeout(WAIT.XLARGE * 2);
        const response = await test.step('Get complete rates from previous quote id', async () => {
            const response = await apiRequests.getRatesFromQuoteIdAPIRequest(quoteId, authUser);
            expect(response.status).toBe(200);
            expect(response.statusText).toBe(API_STATUS.OK);
            console.log('Get Rates from Quote ID API Response Status Code:', response.status);
            return response;
        });
        //@modified : Rohit Singh 17-Dec-2025 - Attempt to book load using each price sheet ID until successful
        // Extract all price sheet IDs from the response and store in array
        const allPriceSheetIds = response.data.priceSheets.map((item: any) => item.id);
        console.log('All Price Sheet IDs:', allPriceSheetIds);
        const dateTime = await dynamicDataAPI.generateDateTimeNumber();
        const reference = `API-72232_` + dateTime + '_Auto';
        let bookLoadResponse;
        let carrierDetails;
        // Attempt to book load using each price sheet ID until successful
        for (const sheetId of allPriceSheetIds) {
            console.log(`Booking load using Quote ID: ${quoteId} and Price Sheet ID: ${sheetId}`);
            bookLoadResponse = await apiRequests.bookLoadFromQuoteIdAPIRequest(authUser, quoteId, sheetId, reference);
            if (bookLoadResponse.status === 201) {
                console.log('Load booked successfully with Price Sheet ID:', sheetId);
                priceSheetId = sheetId;
                carrierDetails = response.data.priceSheets.find((item: any) => item.id === priceSheetId);
                priceSheetId = carrierDetails.id;
                carrierName = carrierDetails.carrierName;
                carrierScac = carrierDetails.carrierScac;
                serviceDays = carrierDetails.serviceDays;
                break;
            }
            console.log(`Booking load failed with Price Sheet ID: ${sheetId}. Trying next price sheet ID...`);
        }
        if (bookLoadResponse.status !== 201) {
            throw new Error('Failed to book load with all available price sheet IDs');
        }

        // Validate first pricesheet structure
        expect(carrierDetails).toHaveProperty('id');
        expect(carrierDetails).toHaveProperty('carrierName');
        expect(carrierDetails).toHaveProperty('carrierScac');
        expect(carrierDetails).toHaveProperty('total');
        expect(carrierDetails).toHaveProperty('subTotal');
        expect(carrierDetails).toHaveProperty('accessorialTotal');
        expect(carrierDetails).toHaveProperty('serviceDays');

        console.log('Body of Book Load from Quote ID API Response:', bookLoadResponse.data);
        expect.soft(bookLoadResponse.status).toBe(201);
        expect.soft(bookLoadResponse.statusText).toBe(API_STATUS.CREATED);
        console.log('Book Load from Quote ID API Response Status Code:', bookLoadResponse.status);
        // Validate booking response structure
        expect.soft(bookLoadResponse.data).toHaveProperty('referenceNumber');
        loadId = bookLoadResponse.data.referenceNumber;
        console.log('Load booked successfully with Load ID:', loadId);
    });
    /**
     * Test Case ID: API-72234
     * @author Rohit Singh
     * @created 2025-Nov-18
     * Test to Get Load Details using Load ID
     */
    test('Case Id: 72234 - Endpoint -  Get Details', async ({ page }) => {
        const testcaseID = 'API-72234';
        //update load to InTransit status using tritan ui and then test get load details api
        const pages = new PageManager(page);
        await test.step("login with another user", async () => {
            await pages.tritanLoginPage.LoginTRITAN(userSetup.tritanAdminCustomer, userSetup.tritanAdminCustomerPassword);
        });
        await test.step("Navigate to Loads section and search for the shipment", async () => {
            await pages.tritanAdminPage.clickOnLoadsSection();
            await pages.tritanAdminPage.searchShipment(loadId);
        });
        await test.step("Book shipment and Verify status", async () => {
            await pages.tritanAdminPage.selectAction(CARRIER_ACTION.BOOK);
            await pages.tritanAdminPage.verifyStatus(LOAD_STATUS.BOOKED);
        });
        await test.step("Plan and add pickup details", async () => {
            await pages.tritanAdminPage.clickPlanButton();
            await pages.tritanAdminPage.clickPlusPickupButton();
            await pages.tritanAdminPage.enterProNumber();
            await pages.tritanAdminPage.enterDateAndTime(
                await commonReusables.getDate("today", "MM/DD/YYYY"), testData.consigneeEarliestTime);
            await pages.tritanAdminPage.clickPickupSaveButton();
            await pages.tritanAdminPage.clickDetailButton();
            await pages.tritanAdminPage.verifyStatus(LOAD_STATUS.IN_TRANSIT);
        });
        // Send Get Load Details with load ID API Request
        console.log('Sending Get Load Details with load ID API Request for Test Case ID:', testcaseID);
        const response = await apiRequests.getLoadDetailsAPIRequest(authUser, loadId);
        console.log('Response Data:', response.data);
        expect.soft(response.status).toBe(200);
        expect.soft(response.statusText).toBe(API_STATUS.OK);
        //add more validations for pick up and drop address 
        const data = response.data;
        const firstCarrier = data.carriers[0];
        console.log('First Carrier Details:', firstCarrier);
        // Validate carrier name
        expect.soft(firstCarrier).toHaveProperty('name');
        expect.soft(firstCarrier.name).toBe(carrierName);
        console.log('Carrier Name validated:', firstCarrier.name);
        // Validate carrier SCAC
        expect.soft(firstCarrier).toHaveProperty('scac');
        expect.soft(firstCarrier.scac).toBe(carrierScac);
        console.log('Carrier SCAC validated:', firstCarrier.scac);
        // Validate service days
        expect.soft(firstCarrier).toHaveProperty('serviceDays');
        expect.soft(firstCarrier.serviceDays).toBe(serviceDays);
        console.log('Service Days validated:', firstCarrier.serviceDays);
        expect(test.info().errors).toHaveLength(0);
    });

    /**
     * Test Case ID: API-72235
     * @author Rohit Singh
     * @created 2025-Nov-19
     * Test to Track Load using Load ID
     */
    test('Case Id: 72235 - Endpoint -  Track Load', async ({ page }) => {
        const testcaseID = 'API-72235';
        const testData = dataConfig.getTestDataFromCsv(dataConfig.apiData, testcaseID);
        //Mark load as Delivered using tritan ui before calling get load tracking details api
        const pages = new PageManager(page);
        await test.step("Tritan login", async () => {
            await pages.tritanLoginPage.LoginTRITAN(userSetup.tritanAdminCustomer, userSetup.tritanAdminCustomerPassword);
        });
        await test.step("Open Tritan Customer Page", async () => {
            await pages.tritanDashboardPage.clickOnCompanyButton();
            await pages.tritanCompanyPage.clickOnExpandAllButton();
            await pages.tritanCompanyPage.selectCustomerByName(customerName);
        });
        await test.step("Navigate to Loads section and search for the Load", async () => {
            await pages.tritanAdminPage.clickOnLoadsSection();
            await pages.tritanListLoadPage.searchLoadUsingLoadID(loadId);
        });
        await test.step("Mark Load as Delivered", async () => {
            await pages.tritanLoadDetailsPage.clickOnPlanTab();
            await pages.tritanLoadPlanPage.setDropStatus(await commonReusables.getDate("today", "MM/DD/YYYY"), "10:00");
            await pages.tritanLoadPlanPage.clickSaveButton();
            await pages.tritanLoadDetailsPage.clickOnDetailsTab();
            await pages.tritanLoadDetailsPage.verifyStatus(LOAD_STATUS.DELIVERED);
        });
        await pages.tritanLoadDetailsPage.clickOnLinksTab();
        await test.step("Add Documents in Links Tab", async () => {
            await pages.tritanLoadLinksPage.addDocuments(testData.podDocLink, DOCUMENT_TYPE.PROOF_OF_DELIVERY);
            console.log("Added POD Document Link");
        });
        // Send Get Load Tracking Details with load ID API Request
        console.log('Sending Get Load Tracking Details with load ID API Request for Test Case ID:', testcaseID);
        const response = await apiRequests.getLoadTrackingDetailsAPIRequest(authUser, loadId);
        console.log('Response Data:', response.data);
        expect.soft(response.status).toBe(200);
        expect.soft(response.statusText).toBe(API_STATUS.OK);
        // Validate load status is Delivered
        expect.soft(response.data.status.toUpperCase()).toBe(LOAD_STATUS.DELIVERED);
       
        const data = response.data;
        const pickStop = data.stops.find((stop: any) => stop.type === 'Pickup');
        const dropStop = data.stops.find((stop: any) => stop.type === 'Drop');
        console.log('Pickup Stop Details:', pickStop);
        console.log('Drop Stop Details:', dropStop);

        // Validate pickup stop details
        console.log('Validating Pickup Stop Details...');
        expect.soft(pickStop.type).toBe('Pickup');
        console.log('Sequence:', pickStop.sequence);
        console.log('Type:', pickStop.type);
        console.log('City:', pickStop.address.city);
        console.log('State:', pickStop.address.state);
        console.log('Zip:', pickStop.address.zip);
        console.log('Country:', pickStop.address.country);

        expect.soft(pickStop.sequence).toBe(1);
        expect.soft(pickStop.address.city).toBe(testData.pickCity);
        expect.soft(pickStop.address.state).toBe(testData.pickState);
        expect.soft(pickStop.address.zip).toBe(testData.pickZip);
        expect.soft(pickStop.address.country).toBe(testData.pickCountry);

        // Validate drop stop details
        console.log('Validating Drop Stop Details...');
        expect.soft(dropStop.type).toBe('Drop');
        console.log('Sequence:', dropStop.sequence);
        console.log('Type:', dropStop.type);
        console.log('City:', dropStop.address.city);
        console.log('State:', dropStop.address.state);
        console.log('Zip:', dropStop.address.zip);
        console.log('Country:', dropStop.address.country);

        expect.soft(dropStop.sequence).toBe(2);
        expect.soft(dropStop.address.city).toBe(testData.dropCity);
        expect.soft(dropStop.address.state).toBe(testData.dropState);
        expect.soft(dropStop.address.zip).toBe(testData.dropZip);
        expect.soft(dropStop.address.country).toBe(testData.dropCountry);
        expect(test.info().errors).toHaveLength(0);
    });

    /**
     * Test Case ID: API-72236
     * @author Rohit Singh
     * @created 2025-Nov-20
     */
    test('Case Id: 72236 - Endpoint -  Documents', async () => {
        const testCaseID = "API-72236";
        const testData = dataConfig.getTestDataFromCsv(dataConfig.apiData, testCaseID);
        await test.step("Verify Get Load Documents API Response", async () => {
            //Send Get Load Documents API Request
            console.log('Sending Get Load Documents API Request for Test Case ID:', testCaseID);
            const response = await apiRequests.getLoadDocumentsAPIRequest(authUser, loadId);
            console.log('Response Data:', response.data);
            expect.soft(response.status).toBe(200);
            expect.soft(response.statusText).toBe(API_STATUS.OK);
            const documents = Array.isArray(response.data) ? response.data : [response.data];
            const document = documents[0];
            const documentLink = document.url;
            const documentType = document.type;
            console.log('Document Link from Get Load Documents API Response:', documentLink);
            console.log('Document Type from Get Load Documents API Response:', documentType);
            expect.soft(documentLink).toBe(testData.podDocLink);
            expect.soft(documentType).toBe(DOCUMENT_TYPE.PROOF_OF_DELIVERY);
            console.log('Verified that POD Document Link is present in Get Load Documents API Response');
            expect(test.info().errors).toHaveLength(0);
        });
    });
});