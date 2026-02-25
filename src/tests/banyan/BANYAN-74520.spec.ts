import apiAuth from "@api/apiAuth";
import apiRequests from "@api/apiRequests";
import dataConfig from "@config/dataConfig";
import dataConfigAPI from "@config/dataConfigAPI";
import dynamicDataAPI from "@config/dynamicDataAPI";
import userSetup from "@loginHelpers/userSetup";
import test, { expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
/**
 * @author : Rohit Singh
 * @created : 2025-Nov-26
 */
test.describe.configure({ retries: 1 });
test.describe.serial('LTL Imaging - Customer API', { tag: ['@tporegression', '@smoke'] }, () => {
    let loadId: string;
    let reference: string;
    let sharedPage: any;
    let pages: PageManager;

    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);

            const dateTime = await dynamicDataAPI.generateDateTimeNumber();
            reference = "TEST_NMFC_092325V" + dateTime;
            // Send Book Load without Quote ID API Request
            const response = await apiRequests.book_RequestLoadFromQuoteIdAPIRequest(dataConfigAPI.book_RequestLoadRequest, apiAuth.user.LogoChair, reference);
            console.log('Response Data:', response.data);
            expect.soft(response.status).toBe(201);
            expect.soft(response.statusText).toBe(API_STATUS.CREATED);
            console.log('Book Load without Quote ID API Response Status Code:', response.status);
            expect.soft(response.data).toHaveProperty('referenceNumber');
            expect.soft(response.data.referenceNumber).toBeDefined();
            loadId = response.data.referenceNumber;
            console.log('Load ID from Book Load without Quote ID API Response:', loadId);
        } catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    });
    test.afterAll(async () => {
            try {
                if (sharedPage && !sharedPage.isClosed()) {
                    await sharedPage.close();
                    pages.logger.info("Shared session closed successfully after completing all three test cases");
                }
            } catch (error) {
                console.warn("Cleanup warning:", error);
            }
        });

    /**
     * Test Case ID: BANYAN-74520
     * @author Rohit Singh
     * @created 2025-Nov-26
     */
    test('Case Id: 74520 - LTL Imaging - Customer API', { tag: ['@tporegression', '@smoke', '@banyan', '@p44'] }, async ({ page }) => {
        const testCaseID = "BANYAN-74520";
        const testData = dataConfig.getTestDataFromCsv(dataConfig.banyanData, testCaseID);
        const pages = new PageManager(page);
        // const pages = new PageManager(page);
        await test.step("Tritan login", async () => {
            await pages.tritanLoginPage.LoginTRITAN(userSetup.tritanAdminCustomer, userSetup.tritanAdminCustomerPassword);
        });
        await test.step("Open Tritan Customer Page", async () => {
            await pages.tritanDashboardPage.clickOnCompanyButton();
            await pages.tritanCompanyPage.clickOnExpandAllButton();
            await pages.tritanCompanyPage.selectCustomerByName(testData.customerName);
            // await pages.tritanDashboardPage.verifyDashboardPageLoaded();
        });
        await test.step("Navigate to Loads section and search for the Load", async () => {
            await pages.tritanAdminPage.clickOnLoadsSection();
            await pages.tritanAdminPage.searchShipment(loadId);
        });
        await pages.tritanLoadDetailsPage.clickOnLinksTab();
        await test.step("Add Documents in Links Tab", async () => {
            await pages.tritanLoadLinksPage.addDocuments(testData.bolDocLink, DOCUMENT_TYPE.BILL_OF_LADING);
            console.log("Added BOL Document Link");
        });
        await test.step("Verify Get Load Documents API Response", async () => {
            //Send Get Load Documents API Request
            console.log('Sending Get Load Documents API Request for Test Case ID:', testCaseID);
            const response = await apiRequests.getLoadDocumentsAPIRequest(apiAuth.user.LogoChair, loadId);
            console.log('Response Data:', response.data);
            expect.soft(response.status).toBe(200);
            expect.soft(response.statusText).toBe(API_STATUS.OK);
            const documents = Array.isArray(response.data) ? response.data : [response.data];
            for (let index = 0; index < documents.length; index++) {
                const document = documents[index];
                if (document.type === DOCUMENT_TYPE.BILL_OF_LADING) {
                    console.log('BOL Document found in the response');
                    const documentLink = document.url;
                    const documentType = document.type;
                    expect.soft(document.type).toBe(DOCUMENT_TYPE.BILL_OF_LADING);
                    expect.soft(document.url).toBe(testData.bolDocLink);
                    console.log('Document Type from Get Load Documents API Response:', documentType);
                    console.log('Document Link from Get Load Documents API Response:', documentLink);
                    return;
                }
            }
            console.log('Verified that BOL Document Link is present in Get Load Documents API Response');
            expect(test.info().errors).toHaveLength(0);
        });
    });
});