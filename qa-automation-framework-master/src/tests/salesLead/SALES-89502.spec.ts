import { expect, test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import dynamicDataAPI from "@config/dynamicDataAPI";

test.describe.configure({ retries: 2 });

test.describe.serial('Extract Customer Outbound Files', () => {
    let pages: PageManager;
    let testData: any;
    let sharedPage: any;
    let customerName: string;

    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();

            const client = await sharedPage.context().newCDPSession(sharedPage);
            await client.send('Network.enable');
            await client.send('Network.setCacheDisabled', { cacheDisabled: true });

            pages = new PageManager(sharedPage);

            await pages.btmsLoginPage.BTMSLogin(userSetup.UserSales, "stage");
            pages.logger.info("Successfully logged into BTMS application with sales user credentials");

        } catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    });

    test.afterAll(async ({ browser }) => {
        try {
            for (const context of browser.contexts()) {
                for (const page of context.pages()) {
                    if (!page.isClosed()) {
                        await page.close();
                    }
                }
                await context.close();
            }
            pages.logger.info("All browser pages and contexts closed successfully");
        } catch (error) {
            console.warn("Cleanup warning:", error);
        }
    });

    /**
* @TestCaseID SALES-89502
* @Description Extract Customer Outbound Files - New Customer - Outbound file creates a new enterprise in TRITAN
* @Tags @tporegression, @sales, @smoke,
* @author Aniket Nale
* @created 31-Dec-2025
*/

    test('Case Id:89502- Extract Customer Outbound Files - New Customer - Outbound file creates a new enterprise in TRITAN',
        { tag: ['@sales', '@tporegression', '@smoke'] }, async ({ browser }) => {

            test.setTimeout(WAIT.XXLARGE * 8);
            const testCaseID = "SALES-89502";
            testData = dataConfig.getTestDataFromCsv(dataConfig.salesleadData, testCaseID);

            const timeStamp = await dynamicDataAPI.generateDateTimeNumber();
            customerName = `Sales_Auto-${timeStamp}`;
            console.log(`Generated customer name: ${customerName}`);

            await test.step("Create a new Customer", async () => {
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
                expect(onViewSalesLeadPage).toBeTruthy();
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
                await pages.viewCustomerPage.validateCustomerNameTest(customerName);
                await pages.viewCustomerPage.isCustomerActive();
                await pages.viewCustomerPage.isManageExternalIdPresent();
                await pages.viewCustomerPage.clickCustomerMasterLink();
                await pages.viewMasterCustomerPage.isManageExternalIdPresent();
                await pages.viewMasterCustomerPage.isCustomerActive();
            });

            await test.step("Tritan login", async () => {
                await pages.tritanLoginPage.LoginTRITAN
                    (userSetup.tritanAdminCustomer,
                        userSetup.tritanAdminCustomerPassword);
            });

            await test.step("Open Tritan Customer Page", async () => {
                let tritanPages = pages;
                const maxAttempts = 20;

                for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                    try {
                        await tritanPages.commonReusables.waitForAllLoadStates(tritanPages.tritanCompanyPage['page']);
                        await tritanPages.tritanDashboardPage.clickOnCompanyButton();
                        await tritanPages.tritanCompanyPage.clickOnExpandAllButton();
                        await tritanPages.tritanCompanyPage.selectSalesLinkByName(customerName);
                        await tritanPages.tritanCompanyPage.verifySalesLeadEnterpriseCreated(customerName);
                        console.log(`Sales lead enterprise verified successfully in TRITAN on attempt ${attempt}`);
                        break;
                    } catch (error) {
                        if (attempt === maxAttempts) throw error;
                        console.warn(`Sales link not visible, creating fresh browser context (attempt ${attempt})`);

                        const context = await browser.newContext();
                        const page = await context.newPage();
                        tritanPages = new PageManager(page);

                        await tritanPages.tritanLoginPage.LoginTRITAN(
                            userSetup.tritanAdminCustomer, userSetup.tritanAdminCustomerPassword);
                    }
                }
            });
        });
});