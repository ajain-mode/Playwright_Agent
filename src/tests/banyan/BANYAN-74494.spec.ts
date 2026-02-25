import apiAuth from "@api/apiAuth";
import apiRequests from "@api/apiRequests";
import test, { expect } from "@playwright/test";
/**
 * @author : Rohit Singh
 * @created : 2025-11-11
 * Test Case ID: BANYAN-74494
 */

const testcaseID = 'BANYAN-74494';
test.describe.configure({ retries: 1 });
test.describe.serial('Customer API - Rate Request via Customer API', { tag: ['@banyan', '@p44', '@tporegression', '@smoke'] }, () => {

    let response: any;
    test('Case Id: 74494 - Rate Request via Customer API', { tag: ['@banyan', '@p44', '@tporegression',] }, async () => {
        // Send LTL Rate Quote API Request
        console.log('Sending LTL Rate Quote API Request for Test Case ID:', testcaseID);
        response = await apiRequests.ltlRateQuoteAPIRequest(apiAuth.user.ELOGISTEK);

        expect(response.status).toBe(202);
        expect(response.statusText).toBe('Accepted');
        console.log('LTL Rate Quote API Response Status Code:', response.status);

        if (response.status === 202 && response.data && response.data.priceSheets) {
            // Extract all pricesheet IDs
            const pricesheetIds = response.data.priceSheets.map((priceSheet: any) => priceSheet.id);
            console.log('Extracted Pricesheet IDs:', pricesheetIds);
            // Optional: Print each ID with carrier name
            response.data.priceSheets.forEach((priceSheet: any, index: number) => {
                console.log(`Pricesheet ${index + 1}: ID=${priceSheet.id}, Carrier=${priceSheet.carrierName}, Total=$${priceSheet.total}`);
            });
        } else {
            console.log('No pricesheets found in response');
        }

    });
});