import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import test, { expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
/**
 * Test Case ID: COMM-25218
 * Description: Test Toggling Internal Shares on an office - Verify On/Off
 * Tags: @commission, @tporegression, @smoke
 * @author Rohit Singh
 * @created 12-Nov-2025
 */
const testCaseID = "COMM-25218";
test.describe.configure({ retries: 2 });
test.describe.serial("Internal Shares Management", { tag: ['@commission', '@tporegression', '@smoke'] }, () => {
   let pages: PageManager;
    let testData: any;
    let sharedPage: any;
    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);

            // const testCaseID = "COMM-25218";
            testData = dataConfig.getTestDataFromCsv(dataConfig.commissionData, testCaseID);
            await pages.btmsLoginPage.BTMSLogin(userSetup.UserCommission);
            pages.logger.info("BTMS login successful");
            await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
            await pages.basePage.clickSubHeaderByText(FINANCE_SUB_MENU.OFFICE_SEARCH);
            // await pages.financePage.hoverOverFinanceMenu();
            // await pages.financePage.clickOfficeSearch();
            await pages.officePage.officeCodeSearchField(testData.officeName);
            await pages.officePage.searchButtonClick();
            await pages.officePage.officeSearchRow(testData.officeName);
            pages.logger.info("Office search and selection completed");
        } catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    });
    test.afterAll(async () => {
            try {
                if (sharedPage && !sharedPage.isClosed()) {
                    await sharedPage.close();
                    pages.logger.info("Shared session closed successfully");
                }
            } catch (error) {
                console.warn("Cleanup warning:", error);
            }
        });
    test('Case Id: COMM-25218 - Test Toggling Internal Shares on an office - Verify On/Off', { tag: ['@commission', '@tporegression', '@smoke'] }, async () => {
        const testCaseID = "COMM-25218";
        testData = await dataConfig.getTestDataFromCsv(dataConfig.commissionData, testCaseID);
        await test.step(`Enabling Internal Shares for office and verifying Internal Shares should Exist on Load`, async () => {
            await pages.viewOfficeInfoPage.clickEditButton();
            await pages.editOfficeInfoPage.enable_DisableInternalShares(INTERNAL_SHARE_STATUS.YES);
            await pages.editOfficeInfoPage.clickSaveButton();
            pages.logger.info("Internal Shares enabled for the office");
            await pages.basePage.clickOnTopMenuLogo();
            pages.logger.info("Navigated back to Home page");
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.enterCustomerName(testData.customerName);
            await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
            await console.log("Navigated to Customer Details page");
            await pages.viewCustomerPage.clickCreateLoadLink(LOAD_TYPES.NEW_LOAD_TL);
            // validate Internal Shares section is present
            expect(await pages.editLoadLoadTabPage.isInternalSharesTableVisible()).toBeTruthy();
            pages.logger.info("Internal Shares section is visible on Load tab as expected");
        });
        await test.step(`Disabling Internal Shares for office and verifying Internal Shares should NOT Exist on Load`, async () => {
            await pages.basePage.clickOnTopMenuLogo();
            pages.logger.info("Navigated back to Home page");
            await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
            await pages.basePage.clickSubHeaderByText(FINANCE_SUB_MENU.OFFICE_SEARCH);
            // await pages.financePage.hoverOverFinanceMenu();
            // await pages.financePage.clickOfficeSearch();
            await pages.officePage.officeCodeSearchField(testData.officeName);
            await pages.officePage.searchButtonClick();
            await pages.officePage.officeSearchRow(testData.officeName);
            pages.logger.info("Office search and selection completed for disabling Internal Shares");
            // Disable Internal Shares
            await pages.viewOfficeInfoPage.clickEditButton();
            await pages.editOfficeInfoPage.enable_DisableInternalShares(INTERNAL_SHARE_STATUS.NO);
            await pages.editOfficeInfoPage.clickSaveButton();
            pages.logger.info("Internal Shares disabled for the office");
            await pages.basePage.clickOnTopMenuLogo();
            pages.logger.info("Navigated back to Home page");
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.enterCustomerName(testData.customerName);
            await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
            await console.log("Navigated to Customer Details page");
            await pages.viewCustomerPage.clickCreateLoadLink(LOAD_TYPES.NEW_LOAD_TL);
            // validate Internal Shares section is present
            expect(await pages.editLoadLoadTabPage.isInternalSharesTableVisible()).toBeFalsy();
            pages.logger.info("Internal Shares section is NOT visible on Load tab as expected");
        }); 
    });

});