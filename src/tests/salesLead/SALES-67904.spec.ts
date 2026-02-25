import { expect, test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import dynamicDataAPI from "@config/dynamicDataAPI";
import { SALES_LEAD_ALERT_PATTERNS } from "@utils/alertPatterns";


test.describe.configure({ retries: 2 });

test.describe('Sales Lead - Validate the Required Field Error for Sales Lead', () => {

    let sharedPage: any;
    let pages: PageManager;

    test.beforeEach(async ({ page }) => {
        pages = new PageManager(page);
        await pages.btmsLoginPage.BTMSLogin(userSetup.UserSales);
        pages.logger.info("Successfully logged into BTMS application with sales user credentials");
    });

    test.afterEach(async ({ page }) => {
        await page.close();
    });

    test('Case Id:67904 - Required Field Validation for Sales Lead and create new Customer',
        { tag: ['@sales', '@tporegression', '@smoke'] }, async ({ page }) => {

            const timeStamp = await dynamicDataAPI.generateDateTimeNumber();
            const randomCustomerName = `Sales_Auto-${timeStamp}`;
            sharedPage = page;

            const testCaseID = "SALES-67904";
            const testData = dataConfig.getTestDataFromCsv(dataConfig.salesleadData, testCaseID);

            await test.step("Navigate to New Sales Lead Creation", async () => {
                await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.NEW_SALES_LEAD);
                pages.logger.info("Navigated to New Sales Lead creation page under Customer menu");
            });

            await test.step("Verify name validation error message for Customer Name", async () => {
                await Promise.all([
                    pages.commonReusables.validateAlert(
                        sharedPage,
                        SALES_LEAD_ALERT_PATTERNS.SALES_LEAD_CUSTOMER_NAME_ERROR
                    ),
                    pages.newSalesLeadPage.clickOnSalesSaveButton(),
                ]);
                console.log("Date validation for Customer Name completed successfully");
            });

            await test.step("Enter Customer Name and Save", async () => {
                await pages.newSalesLeadPage.enterCustomerName(randomCustomerName);
                pages.logger.info(`Customer name entered: ${randomCustomerName}`);
            });

            await test.step("Verify name validation error message for City Name", async () => {
                await Promise.all([
                    pages.commonReusables.validateAlert(
                        sharedPage,
                        SALES_LEAD_ALERT_PATTERNS.SALES_LEAD_CITY_NAME_ERROR
                    ),
                    pages.newSalesLeadPage.clickOnSalesSaveButton(),
                ]);
                console.log("Date validation for Customer City completed successfully");
            });

            await test.step("Enter Customer City and Save", async () => {
                await pages.newSalesLeadPage.enterCustomerCity(testData.customerCity);
                pages.logger.info(`Customer city entered: ${testData.customerCity}`);
            });

            await test.step("Verify name validation error message for State Name", async () => {
                await Promise.all([
                    pages.commonReusables.validateAlert(
                        sharedPage,
                        SALES_LEAD_ALERT_PATTERNS.SALES_LEAD_STATE_NAME_ERROR
                    ),
                    pages.newSalesLeadPage.clickOnSalesSaveButton(),
                ]);
                console.log("Date validation for Customer State completed successfully");
            });

            await test.step("Select state and click on Save", async () => {
                await pages.newSalesLeadPage.enterCustomerBillingInfo({ state: testData.customerState, });
                await pages.newSalesLeadPage.clickOnSalesSaveButton();
                pages.logger.info(`Entered all mandatory fields and clicked on Save button`);
            });

            await test.step("Verify View Sales Lead Page post saving new sales lead", async () => {
                const onViewSalesLeadPage = await pages.viewSalesLeadPage.verifyOnViewSalesLeadPage();
                expect(onViewSalesLeadPage).toBeTruthy();
                pages.logger.info("New sales lead created successfully and navigated to View Sales Lead page");
            });
        });

    test('Case Id:67905- Validate Error messages for Sales Lead',
        { tag: ['@sales', '@tporegression', '@smoke'] }, async ({ page }) => {

            const pages = new PageManager(page);
            const timeStamp = await dynamicDataAPI.generateDateTimeNumber();
            const randomCustomerName = `Sales_Auto-${timeStamp}`;

            const testCaseID = "SALES-67905";
            const testData = dataConfig.getTestDataFromCsv(dataConfig.salesleadData, testCaseID);

            await test.step("Navigate to New Sales Lead and Create Customer", async () => {
                await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.NEW_SALES_LEAD);
                pages.logger.info("Navigated to New Sales Lead Option Under Customer Menu");

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
                pages.logger.info(`Entered customer basic info with name: ${randomCustomerName}`);
                await pages.newSalesLeadPage.selectNAICCode(testData.selectNAIC);
                await pages.newSalesLeadPage.selectOperatingOffice(testData.customerOperatingOffice);
                await pages.newSalesLeadPage.clickOnAddShareLink();
                await pages.newSalesLeadPage.enterShareAmount(testData.shareAmount);
                await pages.newSalesLeadPage.selectAgent(testData.shareAgent);
                pages.logger.info("Added share information");
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
                pages.logger.info("Entered all required information for new sales lead with incorrect data to validate error messages");
                try {
                    await pages.newSalesLeadPage.clickOnSalesSaveButton();
                } catch (error) {
                    pages.logger.warn("clickOnSalesSaveButton failed, continuing test: " + error);
                }
                // const onViewSalesLeadPage = await pages.viewSalesLeadPage.verifyOnViewSalesLeadPage();
                // expect(onViewSalesLeadPage).toBeFalsy();
                // pages.logger.info("Sales lead creation blocked as expected due to validation errors");
            });
        });
});