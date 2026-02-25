import { expect, test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import dynamicDataAPI from "@config/dynamicDataAPI";

test.describe.configure({ retries: 2 });

test.describe.serial('Activate Sales Lead - Status change to Active creates a new customer agent and customer master', () => {
    let pages: PageManager;
    let testData: any;
    let sharedPage: any;
    let customerName: string;

    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);

            await pages.btmsLoginPage.BTMSLogin(userSetup.UserSales);
            pages.logger.info("Successfully logged into BTMS application with sales user credentials");

        } catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    });

    test.afterAll(async () => {
        try {
            if (sharedPage && !sharedPage.isClosed()) {
                await sharedPage.close();
                pages.logger.info("Shared session closed successfully after completing all test cases");
            }
        } catch (error) {
            console.warn("Cleanup warning:", error);
        }
    });

    /**
* @TestCaseID SALES-89496
* @Description Activate Sales Lead - Status change to Active creates a new customer agent and customer master
* @Tags @tporegression, @sales, @smoke,
* @author Aniket Nale
* @created 22-12-2025
*/

    test('Case Id:89496- Activate Sales Lead - Status change to Active creates a new customer agent and customer master',
        { tag: ['@sales', '@tporegression', '@smoke'] }, async () => {

            const testCaseID = "SALES-89496";
            testData = dataConfig.getTestDataFromCsv(dataConfig.salesleadData, testCaseID);

            const timeStamp = await dynamicDataAPI.generateDateTimeNumber();
            customerName = `Sales_Auto-${timeStamp}`;
            console.log(`Generated customer name: ${customerName}`);

            await test.step("Pre-requisite - Create a new sales lead", async () => {
                await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.NEW_SALES_LEAD);
                await pages.newSalesLeadPage.selectSalesLeadStatus(testData.customerStatus);
                await pages.newSalesLeadPage.enterCustomerBasicInfo({
                    name: customerName,
                    alias: testData.customerAlias,
                    parent: testData.customerParent,
                    contact: testData.customerContact,
                    phone: testData.customerPhone,
                    fax: testData.customerFax,
                    cell: testData.customerCell,
                    tollFree: testData.customerTollFree,
                    email: testData.customerEmail,
                    website: testData.customerWebsite,
                    dunsNumber: testData.customerDunsNumber,
                    credit: testData.customerCredit,
                    estimatedLoad: testData.customerEstimatedLoad
                });
                await pages.newSalesLeadPage.selectNAICCode(testData.selectNAIC);
                await pages.newSalesLeadPage.selectOperatingOffice(testData.customerOperatingOffice);
                await pages.newSalesLeadPage.enterCustomerBillingInfo({
                    address: testData.customerAddress,
                    fullAddress: testData.customerAddress2,
                    city: testData.customerCity,
                    state: testData.customerState,
                    zip: testData.customerZip,
                    phone: testData.customerPhoneNumber,
                    fax: testData.customerFax1,
                    billingDetails: testData.customerBilling
                });
                await pages.newSalesLeadPage.selectInvoiceDeliveryPreference(testData.deliveryPreference);
                await pages.newSalesLeadPage.enterAllCustomerPayableInfo({
                    contact: testData.customerContact,
                    phone: testData.customerPhone,
                    email: testData.customerEmail
                });
                await pages.newSalesLeadPage.enterCustomerFinanceNotes(testData.customerFinanceNotes);
                await pages.newSalesLeadPage.clickOnSalesSaveButton();
                const onViewSalesLeadPage = await pages.viewSalesLeadPage.verifyOnViewSalesLeadPage();
                await expect(onViewSalesLeadPage).toBeTruthy();
                await pages.financePage.clickOnFinanceMenu();
                await pages.financePage.clickOnLeadsRequestingLink();
                await pages.mySalesLeadPage.clickOnLeadsFilter();
                await pages.accountClearanceQueuePage.searchCustomerByName(customerName);
                await pages.accountClearanceQueuePage.clickOnCustomerRow(customerName);
                await pages.accountClearanceQueuePage.clickOnAccountClearanceButton();
                await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.LEADS);
                await pages.mySalesLeadPage.clickOnLeadsFilter();
                await pages.mySalesLeadPage.searchCustomerByName(customerName);
                await pages.mySalesLeadPage.clickOnCustomerRow(customerName);
                // await pages.viewSalesLeadPage.validateExpirationDate();
                await pages.viewSalesLeadPage.clickOnEditCustomerButton();
                await pages.editSalesLeadPage.selectSalesLeadStatus(salesLeadStatuses.ACTIVATE);
                await pages.editSalesLeadPage.clickOnSaveCustomerButton();
                await pages.viewSalesLeadPage.verifyActivateStatusSelecteded();
                await pages.adminPage.hoverAndClickAdminMenu();
                await pages.adminPage.clickOnLeadsActivationLink();
                await pages.leadsRequestingActivationPage.findAndClickCustomerByName(customerName);
                await pages.viewSalesLeadPage.clickOnEditCustomerButton();
                await pages.commonReusables.dialogHandler(sharedPage);
                await pages.editSalesLeadPage.selectSalesLeadStatus(salesLeadStatuses.ACTIVE);
                await pages.editSalesLeadPage.selectPaymentTerms(paymentTermsOptions.NET_15);
                await pages.editSalesLeadPage.clickOnSaveCustomerButtonAndWaitForPopup();
            });

            await test.step("Verify Customer Agent creation", async () => {
                await pages.viewCustomerPage.validateCustomerNameTest(customerName);
                pages.logger.info(`Customer Agent for ${customerName} has been created successfully`);
            });

            await test.step("Validate Customer is Active amd Manage External ID", async () => {
                await pages.viewCustomerPage.isCustomerActive();
                await pages.viewCustomerPage.isManageExternalIdPresent();
                pages.logger.info("Customer is verified to be in ACTIVE status and Manage External ID is present");
            });

            await test.step("Navigate to master and verify Manage External ID and ACTIVE status", async () => {
                await pages.viewCustomerPage.clickCustomerMasterLink();
                await pages.viewMasterCustomerPage.isManageExternalIdPresent();
                await pages.viewMasterCustomerPage.isCustomerActive();
                pages.logger.info("Navigated to Master Customer page and verified Manage External ID presence and ACTIVE status");
            });
        });

    /**
* @TestCaseID SALES-89497
* @Description Activate Sales Lead - New customer is assigned a default credit limit of $5000.00
* @Tags @tporegression, @sales, @smoke,
* @author Aniket Nale
* @created 19-12-2025
*/
    test('Case Id:89497 -Activate Sales Lead - New customer is assigned a default credit limit of $5000.00',
        { tag: ['@sales', '@tporegression', '@smoke'] }, async () => {

            const testCaseID = "SALES-89497";
            testData = dataConfig.getTestDataFromCsv(dataConfig.salesleadData, testCaseID);

            await test.step("Pre-requisite - Navigate to Search Customer Page and search for the created customer",
                async () => {
                    await pages.basePage.clickHomeButton();
                    await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                    await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
                    await pages.searchCustomerPage.enterCustomerName(customerName);
                    await pages.searchCustomerPage.searchCustomerAndClickDetails(customerName);
                });

            await test.step("Validate Corporate Credit Limit and Available Corporate Credit values", async () => {
                await pages.viewCustomerPage.getCorpCreditLimit(testData.corpCreditLimitValue);
                await pages.viewCustomerPage.getAvailableCorpCredit(testData.availableCorpCreditValue);
            });
        });

    /**
* @TestCaseID SALES-89498
* @Description Activate Sales Lead - New customer is assigned an Original salesperson and an Operational salesperson
* @Tags @tporegression, @sales, @smoke,
* @author Aniket Nale
* @created 19-12-2025
*/
    test('Case Id:89498 -Activate Sales Lead - New customer is assigned an Original salesperson and an Operational salesperson',
        { tag: ['@sales', '@tporegression', '@smoke'] }, async () => {

            const testCaseID = "SALES-89498";
            testData = dataConfig.getTestDataFromCsv(dataConfig.salesleadData, testCaseID);

            await test.step("Pre-requisite - Navigate to Search Customer Page and search for the created customer",
                async () => {
                    await pages.basePage.clickHomeButton();
                    await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                    await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
                    await pages.searchCustomerPage.enterCustomerName(customerName);
                    await pages.searchCustomerPage.searchCustomerAndClickDetails(customerName);
                });

            await test.step("Validate Salesperson and Operating Salesperson values", async () => {
                let actualSalesPersonNameValue = await pages.viewCustomerPage.getSalesPersonName();
                expect(actualSalesPersonNameValue).toBe(testData.salesPersonName);
                let actualOperatingSalesPersonNameValue = await pages.viewCustomerPage.getOperatingSalesPersonName();
                expect(actualOperatingSalesPersonNameValue).toBe(testData.operatingSalesPersonName);
            });
        });

    /**
* @TestCaseID SALES-89499
* @Description Activate Sales Lead - Customers assigned to a Mode office operating in TRITAN are assigned external ids to cust agent and cust master
* @Tags @tporegression, @sales, @smoke,
* @author Aniket Nale
* @created 26-12-2025
*/
    test('Case Id:89499 -Activate Sales Lead - Customers assigned to a Mode office operating in TRITAN are assigned external ids to cust agent and cust master',
        { tag: ['@sales', '@tporegression', '@smoke'] }, async () => {

            await test.step("Pre-requisite - Navigate to Search Customer Page and search for the created customer",
                async () => {
                    await pages.basePage.clickHomeButton();
                    await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                    await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
                    await pages.searchCustomerPage.enterCustomerName(customerName);
                    await pages.searchCustomerPage.searchCustomerAndClickDetails(customerName);
                });

            await test.step("Validate Customer is Active amd Manage External ID", async () => {
                await pages.viewCustomerPage.isCustomerActive();
                await pages.viewCustomerPage.isManageExternalIdPresent();
                pages.logger.info("Customer is verified to be in ACTIVE status and Manage External ID is present");
            });

            await test.step("Navigate to master and verify Manage External ID and ACTIVE status", async () => {
                await pages.viewCustomerPage.clickCustomerMasterLink();
                await pages.viewMasterCustomerPage.isManageExternalIdPresent();
                await pages.viewMasterCustomerPage.isCustomerActive();
                pages.logger.info("Navigated to Master Customer page and verified Manage External ID presence and ACTIVE status");
            });
        });
});