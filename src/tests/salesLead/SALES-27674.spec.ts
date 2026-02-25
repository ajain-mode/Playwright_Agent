    import { expect, test } from "@playwright/test";
    import { PageManager } from "@utils/PageManager";
    import userSetup from "@loginHelpers/userSetup";
    import dataConfig from "@config/dataConfig";
    import dynamicDataAPI from "@config/dynamicDataAPI";

    const testcaseID = "SALES-27674";
    const testData = dataConfig.getTestDataFromCsv(dataConfig.salesleadData, testcaseID);

    test.describe.configure({ retries: 2 });

    test.describe('Sales Lead - Single Office Creation and Validation', () => {

        test('Case Id:27674 - Create and validate new sales lead with customer name',
            { tag: ['@sales', '@tporegression', '@smoke'] }, async ({ page }) => {
                
                const pages = new PageManager(page);
                const timeStamp = await dynamicDataAPI.generateDateTimeNumber();
                const randomCustomerName = `Sales_Auto-${timeStamp}`;

                await test.step("Login to BTMS Application", async () => {
                    await pages.btmsLoginPage.BTMSLogin(userSetup.UserSales);
                    pages.logger.info("BTMS Login Successfully");
                });

                await test.step("Navigate to New Sales Lead and Create Customer", async () => {
                    await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                    await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.NEW_SALES_LEAD);

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
                    await pages.newSalesLeadPage.selectNAICCode(testData.selectNAIC);                   //Function Updated 
                    await pages.newSalesLeadPage.selectOperatingOffice(testData.customerOperatingOffice);
                    await pages.newSalesLeadPage.clickOnAddShareLink();
                    await pages.newSalesLeadPage.enterShareAmount(testData.shareAmount);
                    await pages.newSalesLeadPage.selectAgent(testData.shareAgent);
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

                    pages.logger.info(`Sales lead created successfully with customer name: ${randomCustomerName}`);
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