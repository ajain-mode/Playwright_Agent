import { expect, test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import dynamicDataAPI from "@config/dynamicDataAPI";

test.describe.configure({ retries: 2 });

test.describe.serial('Extract Customer Outbound Files - New Customer - Duplicating the customer creates another instance of the customer and triggers a customer outbound file', () => {
    let pages: PageManager;
    let testData: any;
    let sharedPage: any;
    let customerName: string;
    let initialmasterLoginID: string;
    let initialCustIDOnMasterPage: string;

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
* @TestCaseID SALES-89504
* @Description Extract Customer Outbound Files - New Customer - Duplicating the customer creates another instance of the customer and triggers a customer outbound file
* @Tags @tporegression, @sales, @smoke,
* @author Aniket Nale
* @created 01-Jan-2026
*/

    test('Case Id:89504- Extract Customer Outbound Files - New Customer - Duplicating the customer creates another instance of the customer and triggers a customer outbound file',
        { tag: ['@sales', '@tporegression', '@smoke'] }, async () => {

            const testCaseID = "SALES-89504";
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

            await test.step("Verify ID before Duplicating customer on view and master page", async () => {
                await pages.viewCustomerPage.isCustomerActive();
                await pages.viewCustomerPage.isManageExternalIdPresent();
                initialmasterLoginID = await pages.viewCustomerPage.getMasterLoginID();
                expect(initialmasterLoginID).not.toBeNull();
                expect(initialmasterLoginID).not.toBeUndefined();

                await pages.viewCustomerPage.clickCustomerMasterLink();
                await pages.viewMasterCustomerPage.isManageExternalIdPresent();
                await pages.viewMasterCustomerPage.isCustomerActive();
                initialCustIDOnMasterPage = await pages.viewMasterCustomerPage.getCustID();
                expect(initialCustIDOnMasterPage).toBe(initialmasterLoginID);
            });

            await test.step("Duplicate Customer and Verify Master login ID after Duplicating customer", async () => {
                await pages.viewMasterCustomerPage.clickOnDuplicateCustomerButton();
                await pages.viewMasterCustomerPage.selectOperatingOffice(OPERATING_OFFICE.GA_JS);
                await pages.viewMasterCustomerPage.clickOnDuplicateCustomerSaveButton();
                const duplicatedMasterLoginID = await pages.viewCustomerPage.getMasterLoginID();
                expect(duplicatedMasterLoginID).not.toBe(initialmasterLoginID);

                await pages.viewCustomerPage.clickCustomerMasterLink();
                await pages.viewMasterCustomerPage.isManageExternalIdPresent();
                await pages.viewMasterCustomerPage.isCustomerActive();
                const duplicateCustIDOnMasterPage = await pages.viewMasterCustomerPage.getCustID();
                expect(duplicateCustIDOnMasterPage).not.toBe(initialCustIDOnMasterPage);
            });
        });
});