import { test } from "@playwright/test";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { PageManager } from "@utils/PageManager";

test.describe.configure({ retries: 1 });
test.describe.serial(`Bulk Change`, () => {

    let pages: PageManager;
    let sharedPage: any;
    let testData: any;
    let loadNumbers: string[] = [];

    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);
            const testcaseID = `BULKCHANGE-27610`;
            testData = dataConfig.getTestDataFromCsv(dataConfig.bulkChangeData, testcaseID);
            console.log(testData);
            await pages.btmsLoginPage.BTMSLogin(userSetup.bulkChangeUser);
            pages.logger.info(`BTMS login successful - Shared session initialized`);
            await pages.commonReusables.dialogHandler(sharedPage);
            
        } catch (error) {
            pages.logger.info("Setup failed:", error);
            throw error;
        }
    });

    test(`Case ID: 27610 - Verify Bulk Change role assignment and status change to Delivered Final`, { tag: ['@smoke', '@at_bulkchange'] }, async () => {
        await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
        await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
        await pages.agentSearchPage.nameInputOnAgentPage(userSetup.bulkChangeUser);
        await pages.agentSearchPage.clickOnSearchButton();
        await pages.agentSearchPage.selectAgentByName(userSetup.bulkChangeUser);
        await pages.agentInfoPage.validateBulkChangeRole(USER_ROLES.BULK_CHANGE_LOADS_MGR, pages)
        pages.logger.info("Bulk Change role assignment verified/assigned successfully");

        for (let i = 1; i <= 2; i++) {
            pages.logger.info(`Iteration ${i}: Starting test steps`);

            await test.step("Navigate to Customers search and Go to Enter New Loads", async () => {
                await pages.basePage.clickHomeButton();
                await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
                await pages.searchCustomerPage.enterCustomerName(testData.customerName);
                await pages.searchCustomerPage.clickOnSearchCustomer();
                await pages.searchCustomerPage.selectCustomerByName(testData.customerName);
                await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LOAD_TL);
                pages.logger.info(`Iteration ${i}: Navigated to create new load page`);
            });

            await test.step(`Fill load details and create load with Booked status`, async () => {
                await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
                await pages.editLoadLoadTabPage.selectLoadStatus(LOAD_STATUS.ACTIVE);
                await pages.bulkChangeHelper.updateReferencesOnLoadTab(pages);
                const loadNumber = await pages.bulkChangeHelper.createLoadOnBookedStatus(pages, testData);
                loadNumbers.push(loadNumber);
                pages.logger.info(`Iteration ${i}: Load created with number: ${loadNumber}`);
            });

            await test.step(`Edit load and update Driver In Out Date times on Drop tab and upload documents`, async () => {
                await pages.editLoadPage.clickOnTab(TABS.DROP);
                pages.logger.info(`Iteration ${i}: Navigated to Drop tab`);
                await pages.editLoadDropTabPage.updateDriverInOutDateTime(pages, testData);
                await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.DELIVERED);
                await pages.editLoadPage.clickOnTab(TABS.LOAD);
                await pages.viewLoadPage.uploadPODDocument();
                await pages.viewLoadPage.uploadCarrierInvoiceDocument(testData);
                pages.logger.info(`Iteration ${i}: Filled Driver In and Driver Out date/time with current date and time`);
            });

            pages.logger.info(`Iteration ${i}: Completed all steps`);
        }
        pages.logger.info(`Created Loads are : ${loadNumbers}`);

        await test.step(`Navigate to All Loads Search Page and Bulk Change loads to Delivered Final`, async () => {
            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
            await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
            await pages.allLoadsSearchPage.searchMultipleLoads(loadNumbers, pages);
            pages.logger.info(`Navigated to All Loads Search Page`);
            await pages.allLoadsSearchPage.selectAllLoads();
            await pages.allLoadsSearchPage.clickBulkChangeButton();
            pages.logger.info(`Selected created loads for Bulk Change Operation`);
            await pages.selectChangesPage.verifySelectChangesPage();
            await pages.selectChangesPage.selectStatusChange(LOAD_STATUS.DELIVERED_FINAL);
            await pages.selectChangesPage.clickNextButton();
            await pages.myBulkLoadsChangesAndImports.waitForBulkChangeSuccessStatus();
            pages.logger.info(`Bulk Change to Delivered Final status Performed successfully`);
        });

        await test.step(`Validate Load Invoiced, Auto-Bill for Load and Carrier 1`, async () => {
            for (const loadNumber of loadNumbers) {
                pages.logger.info(`Validating Auto-Bill for Load: ${loadNumber}`);
                await pages.basePage.searchFromMainHeader(loadNumber);
                await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.INVOICED);
                await pages.editLoadFormPage.clickOnViewBillingBtn();
                await pages.loadBillingPage.validateAutoBillForLoad(sharedPage);
                await pages.loadBillingPage.validateAutoBillForCarrier1(sharedPage);
                pages.logger.info(`Auto-Billing validated successfully for Load: ${loadNumber}`);
            };
        });
    })
});