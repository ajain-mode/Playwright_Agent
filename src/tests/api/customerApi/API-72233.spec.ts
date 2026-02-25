import apiAuth from "@api/apiAuth";
import apiRequests from "@api/apiRequests";
import dataConfigAPI from "@config/dataConfigAPI";
import dynamicDataAPI from "@config/dynamicDataAPI";
import test, { expect } from "@playwright/test";
/**
 * @author : Rohit Singh
 * @created : 2025-Nov-18
 * Test Case ID: API-72233
 */
test.describe.serial('Endpoint Customer API', { tag: ['@tporegression', '@smoke', '@api', '@at_customerapi'] }, () => {
    let loadId: string;
    let reference: string;
    test('Case Id: 72233 - Endpoint -  Book Request', async () => {
        const testcaseID = 'API-72233';
        const dateTime = await dynamicDataAPI.generateDateTimeNumber();
        reference = "TEST_NMFC_092325V" + dateTime;
        // Send Book Load without Quote ID API Request
        console.log('Sending Book Load without Quote ID API Request for Test Case ID:', testcaseID);
        const response = await apiRequests.book_RequestLoadFromQuoteIdAPIRequest(dataConfigAPI.book_RequestLoadRequest, apiAuth.user.LogoChair, reference);
        console.log('Response Data:', response.data);
        expect.soft(response.status).toBe(201);
        expect.soft(response.statusText).toBe(API_STATUS.CREATED);
        console.log('Book Load without Quote ID API Response Status Code:', response.status);
        expect.soft(response.data).toHaveProperty('referenceNumber');
        expect.soft(response.data.referenceNumber).toBeDefined();
        loadId = response.data.referenceNumber;
        console.log('Load ID from Book Load without Quote ID API Response:', loadId);

        // Error validation for same reference number
        const duplicateResponse = await apiRequests.book_RequestLoadFromQuoteIdAPIRequest(dataConfigAPI.book_RequestLoadRequest, apiAuth.user.LogoChair, reference);
        console.log('Duplicate Book Load Response Data:', duplicateResponse.data);
        expect.soft(duplicateResponse.status).toBe(409);
        expect.soft(duplicateResponse.statusText).toBe(API_STATUS.CONFLICT);
        expect.soft(duplicateResponse.data).toHaveProperty('error');
        expect.soft(duplicateResponse.data).toHaveProperty('reference');
        expect.soft(duplicateResponse.data.error).toBe(`Load ${reference} already exists`);
        expect.soft(duplicateResponse.data.reference).toBeDefined();
        console.log('Verified that duplicate Book Load request with same reference number returns appropriate error response');
        expect(test.info().errors).toHaveLength(0);
    });
});