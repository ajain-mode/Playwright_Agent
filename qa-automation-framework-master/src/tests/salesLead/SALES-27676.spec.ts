
import { expect, test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import dynamicDataAPI from "@config/dynamicDataAPI";

const testcaseID = "SALES-27676";
const testData = dataConfig.getTestDataFromCsv(dataConfig.salesleadData, testcaseID);

test.describe.configure({ retries: 2 });

test.describe('Sales Lead Management - Expiration Date Validation and Activate Customer and Account Clearance Processing', () => {

    let pages: PageManager;
    let customerName: string;

    test.beforeEach(async ({ page }) => {
        pages = new PageManager(page);

        await pages.btmsLoginPage.BTMSLogin(userSetup.UserSales);
        pages.logger.info("Successfully logged into BTMS application with sales user credentials");
    });

    test.afterEach(async ({ page }) => {
        // Close the page/session after each test
        await page.close();
    });

    test('Case Id:61614- Verify sales lead expiration date is correctly set to 90 days after account clearance approval And Activate Customer',
        { tag: ['@sales', '@tporegression', '@smoke'] }, async ({ page }) => {

            const timeStamp = await dynamicDataAPI.generateDateTimeNumber();
            customerName = `Sales_Auto-${timeStamp}`;

            await test.step("Navigate to New Sales Lead Creation and Select Request Clearance Status", async () => {
                await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.NEW_SALES_LEAD);
                await pages.newSalesLeadPage.selectSalesLeadStatus(testData.customerStatus);
            });

            await test.step("Enter Customer Basic Information", async () => {
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
            });

            await test.step("Enter Customer Billing Information", async () => {
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
            });

            await pages.newSalesLeadPage.selectInvoiceDeliveryPreference(testData.deliveryPreference);

            await test.step("Enter Customer Payable Information and Finance Notes", async () => {
                await pages.newSalesLeadPage.enterAllCustomerPayableInfo({
                    contact: testData.customerContact,
                    phone: testData.customerPhone,
                    email: testData.customerEmail
                });
                await pages.newSalesLeadPage.enterCustomerFinanceNotes(testData.customerFinanceNotes);
            });

            await test.step("Save Sales Lead", async () => {
                await pages.newSalesLeadPage.clickOnSalesSaveButton();
                const onViewSalesLeadPage = await pages.viewSalesLeadPage.verifyOnViewSalesLeadPage();
                expect(onViewSalesLeadPage).toBeTruthy();
                pages.logger.info("Sales lead saved successfully");
            });

            await test.step("Process Account Clearance Request", async () => {
                await pages.financePage.clickOnFinanceMenu();
                await pages.financePage.clickOnLeadsRequestingLink();
                await pages.accountClearanceQueuePage.clickOnLeadsFilter();
                await pages.accountClearanceQueuePage.searchCustomerByName(customerName);
                await pages.accountClearanceQueuePage.clickOnCustomerRow(customerName);
                await pages.accountClearanceQueuePage.clickOnAccountClearanceButton();
                pages.logger.info("Processed account clearance for the sales lead");
            });

            await test.step("Navigate to Sales Leads and Validate Expiration Date", async () => {
                await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.LEADS);
                await pages.mySalesLeadPage.clickOnLeadsFilter();
                await pages.mySalesLeadPage.searchCustomerByName(customerName);
                await pages.mySalesLeadPage.clickOnCustomerRow(customerName);
                await pages.viewSalesLeadPage.validateExpirationDate();
                pages.logger.info("Successfully validated that expiration date is set to 90 days from clearance date");
            });
            await test.step("Update Customer Status to ACTIVATE", async () => {
                await pages.viewSalesLeadPage.clickOnEditCustomerButton();
                await pages.editSalesLeadPage.selectSalesLeadStatus(salesLeadStatuses.ACTIVATE);
                await pages.editSalesLeadPage.clickOnSaveCustomerButton();
                await pages.viewSalesLeadPage.verifyActivateStatusSelecteded();
                pages.logger.info("Updated customer status to ACTIVATE and saved changes");
            });

            await test.step("Process Customer Activation Request", async () => {
                await pages.adminPage.hoverAndClickAdminMenu();
                await pages.adminPage.clickOnLeadsActivationLink();
                await pages.leadsRequestingActivationPage.findAndClickCustomerByName(customerName);
            });

            await test.step("Complete Final Customer Activation", async () => {
                await pages.viewSalesLeadPage.clickOnEditCustomerButton();
                await pages.commonReusables.dialogHandler(page);
                await pages.editSalesLeadPage.selectSalesLeadStatus(salesLeadStatuses.ACTIVE);
                await pages.editSalesLeadPage.selectPaymentTerms(paymentTermsOptions.NET_15);
                await pages.editSalesLeadPage.clickOnSaveCustomerButtonAndWaitForPopup();
                pages.logger.info("Customer activation process completed with status set to ACTIVE");
            });

            await test.step("Validate Customer Name", async () => {
                try {
                    await pages.viewCustomerPage.validateCustomerNameTest(customerName);
                    pages.logger.info(`Successfully validated customer name: ${customerName}`);

                } catch (error) {
                    pages.logger.error(`Customer name validation failed: ${error}`);
                    throw error;
                }
            });
        });

    test('Case Id:27676- Verify account clearance queue validation, customer search functionality, and denial processing for sales leads', { tag: ['@sales', '@tporegression', '@smoke'] }, async () => {

        const timeStamp = await dynamicDataAPI.generateDateTimeNumber();
        customerName = `Sales_Auto-${timeStamp}`;

        await test.step("Navigate to New Sales Lead Creation and Set Request Clearance Status", async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.NEW_SALES_LEAD);
            pages.logger.info("Navigated to New Sales Lead creation page under Customer menu");

            await pages.newSalesLeadPage.selectSalesLeadStatus(testData.customerStatus);
        });

        await test.step("Enter Complete Customer Basic Information", async () => {
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
            await pages.newSalesLeadPage.selectOperatingOffice(testData.customerOperatingOffice);
        });

        await test.step("Enter Customer Billing and Contact Information", async () => {
            await pages.newSalesLeadPage.enterCustomerBillingInfo({
                address: testData.customerAddress,
                fullAddress: testData.customerAddress2,
                city: testData.customerCity,
                state: testData.customerState,
                zip: testData.customerZip,
                phone: testData.customerPhone1,
                fax: testData.customerFax1,
                billingDetails: testData.customerBilling
            });
            await pages.newSalesLeadPage.enterAllCustomerPayableInfo({
                contact: testData.customerContact,
                phone: testData.customerPhone,
                email: testData.customerEmail
            });
        });

        await test.step("Add Finance Notes and Save Sales Lead", async () => {
            await pages.newSalesLeadPage.enterCustomerFinanceNotes(testData.customerFinanceNotes);
            await pages.newSalesLeadPage.clickOnSalesSaveButton();
        });

        await test.step("Navigate to Account Clearance Queue", async () => {
            await pages.financePage.clickOnFinanceMenu();
            await pages.financePage.clickOnLeadsRequestingLink();
            await pages.mySalesLeadPage.clickOnLeadsFilter();
            await pages.accountClearanceQueuePage.searchCustomerByName(customerName);
            await pages.accountClearanceQueuePage.clickOnCustomerRow(customerName);
        });

        await test.step("Validate Empty Search Results and Perform Specific Customer Search", async () => {
            await pages.accountClearanceQueuePage.clickOnSearchButton();
            await pages.accountClearanceQueuePage.validateNoCustomersFound();
            pages.logger.info("Validated 'No Active Customers Found' message displayed correctly");
            await pages.accountClearanceQueuePage.searchForSpecificCustomer(testData.searchCustomer);
        });

        await test.step("Process Account Clearance Denial", async () => {
            await pages.accountClearanceQueuePage.clickOnDenyWithInfo();
            pages.logger.info("Successfully processed account clearance denial with information");
        });

        await test.step("Re-Search and verify Denial", async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.LEADS);
            await pages.mySalesLeadPage.clickOnLeadsFilter();
            await pages.mySalesLeadPage.clickOnClearFilterButton();
            await pages.mySalesLeadPage.selectLeadsFilterStatus(salesLeadFilters.DENIED);
            pages.logger.info("Filtered sales leads by DENIED status");
            await pages.mySalesLeadPage.searchCustomerByName(customerName);
            await pages.mySalesLeadPage.verifyCustomerStatus(salesLeadStatuses.DENIED);
            pages.logger.info(`Verified that customer: ${customerName} has ${salesLeadStatuses.DENIED} status`);
        });
    });

    test('Case Id:61615 - Verify account clearance queue validation denial processing withNoInfo for sales leads', { tag: ['@sales', '@tporegression', '@smoke'] }, async () => {

        const timeStamp = await dynamicDataAPI.generateDateTimeNumber();
        customerName = `Sales_Auto-${timeStamp}`;

        await test.step("Navigate to New Sales Lead Creation and Set Request Clearance Status", async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.NEW_SALES_LEAD);
            pages.logger.info("Navigated to New Sales Lead creation page under Customer menu");

            await pages.newSalesLeadPage.selectSalesLeadStatus(testData.customerStatus);
        });

        await test.step("Enter Complete Customer Basic Information", async () => {
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
            await pages.newSalesLeadPage.selectOperatingOffice(testData.customerOperatingOffice);
        });

        await test.step("Enter Customer Billing and Contact Information", async () => {
            await pages.newSalesLeadPage.enterCustomerBillingInfo({
                address: testData.customerAddress,
                fullAddress: testData.customerAddress2,
                city: testData.customerCity,
                state: testData.customerState,
                zip: testData.customerZip,
                phone: testData.customerPhone1,
                fax: testData.customerFax1,
                billingDetails: testData.customerBilling
            });

            await pages.newSalesLeadPage.enterAllCustomerPayableInfo({
                contact: testData.customerContact,
                phone: testData.customerPhone,
                email: testData.customerEmail
            });
        });

        await test.step("Add Finance Notes and Save Sales Lead", async () => {
            await pages.newSalesLeadPage.enterCustomerFinanceNotes(testData.customerFinanceNotes);
            await pages.newSalesLeadPage.clickOnSalesSaveButton();
        });

        await test.step("Navigate to Account Clearance Queue", async () => {
            await pages.financePage.clickOnFinanceMenu();
            await pages.financePage.clickOnLeadsRequestingLink();
            await pages.mySalesLeadPage.clickOnLeadsFilter();
            await pages.accountClearanceQueuePage.searchCustomerByName(customerName);
            await pages.accountClearanceQueuePage.clickOnCustomerRow(customerName);
        });

        await test.step("Process Account Clearance Denial", async () => {
            await pages.accountClearanceQueuePage.clickOnDenyWithNoInfo();
            pages.logger.info("Successfully processed account clearance denial with No information");
        });

        await test.step("Re-Search and verify Denial", async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.LEADS);
            await pages.mySalesLeadPage.clickOnLeadsFilter();
            await pages.mySalesLeadPage.clickOnClearFilterButton();
            await pages.mySalesLeadPage.selectLeadsFilterStatus(salesLeadFilters.DENIED);
            pages.logger.info("Filtered sales leads by DENIED status");
            await pages.mySalesLeadPage.searchCustomerByName(customerName);
            await pages.mySalesLeadPage.verifyCustomerStatus(salesLeadStatuses.DENIED);
            pages.logger.info(`Verified that customer: ${customerName} has ${salesLeadStatuses.DENIED} status`);
        });
    });
});