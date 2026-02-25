import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";

const testcaseID = "COMM-25227-28";

test.describe.configure({ retries: 2 });
test.describe('Commission Audit Queue - Customer Search and Audit Status Validation', 
    { tag: ['@commission', '@tporegression', '@smoke'] }, () => {
    
    test.describe.configure({ mode: 'serial' }); 
    
    let sharedPages: PageManager;
    let sharedTestData: any;
    
    test.beforeAll(async ({ browser }) => {
        console.log("Starting single login session for both test cases");
        
        const sharedPage = await browser.newPage();
        sharedPages = new PageManager(sharedPage);
        
        sharedTestData = sharedPages.dataConfig.getTestDataFromCsv(sharedPages.dataConfig.commissionData,testcaseID);
        await sharedPages.btmsLoginPage.BTMSLogin(userSetup.UserCommission);
        console.log("Single login successful - session shared for both test cases");
        await sharedPages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await sharedPages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await sharedPages.searchCustomerPage.enterCustomerName(sharedTestData.customerName);
        await sharedPages.searchCustomerPage.searchCustomerAndClickDetails(sharedTestData.customerName);
        // await sharedPages.searchCustomerPage.clickOnActiveCustomer();
        console.log("Shared customer setup completed - ready for both test cases");
    });

    test.afterAll(async () => {
        if (sharedPages) {
            console.log("Closing shared session after both test cases completed");
        }
    });

    test("Case Id: 25228 - Validate commission audit Approve Activation and Search functionality and verification", async () => {
        console.log("Executing Case 25228: Commission Audit Status Validation");
        console.log("Using shared login session - no additional login required");

        try {
            await sharedPages.financePage.validateCommissionAuditStatus(sharedTestData);
            console.log("Commission audit status validation executed successfully");
            console.log("Case 25228: Commission audit status validation completed successfully");
        } catch (error) {
            console.error(`Case 25228 failed: ${error}`);
            throw error;
        }
    });

    test("Case Id: 25227 - Validate customer audit status search and verification", async () => {
        console.log("Executing Case 25227: Customer Audit Status Validation");
        console.log("Using shared login session - no additional login required");

        try {
            await sharedPages.financePage.validateCustomerAuditStatus();
            console.log("Customer audit status search and validation executed successfully");
            console.log("Customer audit status meets all required criteria");
            console.log("Case 25227: Customer audit status validation completed successfully");
        } catch (error) {
            console.error(`Case 25227 failed: ${error}`);
            throw error;
        }
    });
});