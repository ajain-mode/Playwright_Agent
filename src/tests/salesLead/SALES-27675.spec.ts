import { expect, test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import dynamicDataAPI from "@config/dynamicDataAPI";

const testcaseID = "SALES-27675";
const testData = dataConfig.getTestDataFromCsv(dataConfig.salesleadData, testcaseID);

test.describe.configure({ retries: 2 });

test.describe('Sales Lead - Multi-Office Creation and Validation', () => {

    test('Case Id:27675 - Create and validate multi-office sales lead with shared responsibility and agent assignments',
        { tag: ['@sales', '@tporegression', '@smoke'] }, async ({ page }) => {
            const pages = new PageManager(page);

            const timeStamp = await dynamicDataAPI.generateDateTimeNumber();
            const randomCustomerName = `Sales_Auto-${timeStamp}`;

            await test.step("Login to BTMS Application", async () => {
                await pages.btmsLoginPage.BTMSLogin(userSetup.UserSales);
                pages.logger.info("Successfully logged into BTMS application with sales user credentials");
            });

            await test.step("Navigate to New Sales Lead Creation", async () => {
                await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.NEW_SALES_LEAD);
                pages.logger.info("Navigated to New Sales Lead creation page under Customer menu");
            });

            await test.step("Enter Complete Customer Basic Information", async () => {
                await pages.newSalesLeadPage.enterCustomerBasicInfo({
                    name: randomCustomerName,
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
            });

            await test.step("Configure Primary Operating Office and Share Allocation", async () => {
                pages.logger.info("Configuring primary operating office with share allocation");
                await pages.newSalesLeadPage.selectOperatingOffice(testData.customerOperatingOffice);
                await pages.newSalesLeadPage.clickOnAddShareLink();
                await pages.newSalesLeadPage.enterShareAmount(testData.shareAmount);
                await pages.newSalesLeadPage.selectAgent(testData.shareAgent);
            });

            await test.step("Add Secondary Office Configuration with Share Allocation", async () => {
                pages.logger.info("Adding secondary operating office with share allocation");
                await pages.newSalesLeadPage.clickOnAddAnotherOfficeLink();
                await pages.newSalesLeadPage.selectAnotherOperatingOffice(testData.customerOperatingOffice);
                await pages.newSalesLeadPage.clickOnAddShareLinkForAnotherOffice();
                await pages.newSalesLeadPage.enterShareAmountForAnotherOffice(testData.shareAmount);
                await pages.newSalesLeadPage.selectAgentforAnotherOffice(testData.shareAgent);
            });

            await test.step("Enter Customer Billing Information", async () => {
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

            await test.step("Save Multi-Office Sales Lead", async () => {
                await pages.newSalesLeadPage.clickOnSalesSaveButton();
                const onViewSalesLeadPage = await pages.viewSalesLeadPage.verifyOnViewSalesLeadPage();
                expect(onViewSalesLeadPage).toBeTruthy();
                pages.logger.info("Sales lead created with primary and secondary office configurations");
            });

            await test.step("Navigate to Sales Leads and Search for Customer", async () => {
                await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.LEADS);
                await pages.mySalesLeadPage.clickOnLeadsFilter();
                await pages.mySalesLeadPage.searchCustomerByName(randomCustomerName);
                await pages.mySalesLeadPage.validateCustomerName(randomCustomerName);
                pages.logger.info(`Customer validation successful in search results: ${randomCustomerName}`);
                pages.logger.info("Sales lead workflow validation completed successfully");
            });
        });
});