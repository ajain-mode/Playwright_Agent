import { expect, test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import dynamicDataAPI from "@config/dynamicDataAPI";

test.describe.configure({ retries: 2 });

test.describe.serial('Activate Sales Lead', () => {
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

    test('Case Id:72184- Activate Sales Lead',
        { tag: ['@sales', '@tporegression', '@smoke'] }, async () => {

            const testCaseID = "SALES-72184";
            testData = dataConfig.getTestDataFromCsv(dataConfig.salesleadData, testCaseID);

            const timeStamp = await dynamicDataAPI.generateDateTimeNumber();
            customerName = `Sales_Auto-${timeStamp}`;
            console.log(`Generated customer name: ${customerName}`);

            await test.step("Create a new sales lead and Activate", async () => {
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
            });
        });
});