import apiHeaders from "@api/apiHeader";
import dataConfigAPI from "@config/dataConfigAPI";
import loginSetup from "@loginHelpers/loginSetup";
import { expect, test } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import axios from "axios";

/**
 * @author : Rohit Singh
 * @created : 2025-Nov-24
 * Test Case ID: API-72237
 */
test.describe.configure({ retries: 1 });
test.describe.serial('Endpoint Customer API', { tag: ['@tporegression', '@smoke', '@api', '@at_customerapi'] }, () => {

    test('Case Id: 72237 - Endpoint - All non-prod credentials are working as expected', async () => {
        const data = await dataConfigAPI.getNonProdJsonData();
        const parsedData = Object.entries(data);

        for (let index = 0; index < parsedData.length; index++) {
            const [key, item] = parsedData[index];
            const itemData = typeof item === 'string' ? JSON.parse(item) : item;
            const userId = itemData.id;
            const userSecret = itemData.secret;
            console.log(`User ${index + 1}: Name: ${key}`);

            const header = await apiHeaders.ltlQuoteRequestMultiAuthHeader(userId, userSecret);

            let EarliestDateTime1 = await commonReusables.getDate('today', 'YYYY-MM-DD');
            EarliestDateTime1 = EarliestDateTime1 + 'T13:00:00.000Z';
            let EarliestDateTime2 = await commonReusables.getDate('tomorrow', 'YYYY-MM-DD');
            EarliestDateTime2 = EarliestDateTime2 + 'T15:00:00.000Z';
            const ltlRequestRatesRawData = (await dataConfigAPI.getEDIRawData(dataConfigAPI.ltlRequestRates))
                .replace(/\{EarliestDateTime1\}/g, EarliestDateTime1)
                .replace(/\{EarliestDateTime2\}/g, EarliestDateTime2);
            // send the request and capture the response    
            const response = await axios.post(loginSetup.apiUrl + 'rate/v1/ltl?timeout=25', ltlRequestRatesRawData, {
                headers: header,
                validateStatus: () => true,
            });

            console.log(`Response Code:`, response.status);
            console.log(`Response Status:`, response.statusText);
            test.expect.soft([200, 202]).toContain(response.status);
            test.expect.soft([API_STATUS.OK, API_STATUS.ACCEPTED]).toContain(response.statusText);
            test.expect.soft(response.data).toHaveProperty('id');
            test.expect.soft(response.data).toHaveProperty('priceSheets');
            test.expect.soft(response.data).toHaveProperty('status');
            console.log(`Quote Request ID:`, response.data.id);
            console.log(`Quote Request Status:`, response.data.status + '\n');
        }
        await expect(test.info().errors.length).toEqual(0);
    });
});