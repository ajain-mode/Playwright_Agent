import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import test, { expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
/**
 * Test Case ID: COMM-25219
 * Description: Test Adding Internal Shares on a customer - Verify Shares on Load
 * Tags: @commission, @tporegression, @smoke
 * @author Rohit Singh
 * @created 13-Nov-2025
 */
const testCaseID = "COMM-25219";
test.describe.configure({ retries: 2 });
test.describe.serial("Internal Shares Management", { tag: ['@commission', '@tporegression', '@smoke'] }, () => {
   let pages: PageManager;
    let testData: any;
    let sharedPage: any;
    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);
            testData = dataConfig.getTestDataFromCsv(dataConfig.commissionData, testCaseID);
            await pages.btmsLoginPage.BTMSLogin(userSetup.UserCommission);
            pages.logger.info("BTMS login successful");
            //@modified: 28-Nov-2025: Rohit Singh
            await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
            await pages.basePage.clickSubHeaderByText(FINANCE_SUB_MENU.OFFICE_SEARCH);
            // await pages.financePage.hoverOverFinanceMenu();
            // await pages.financePage.clickOfficeSearch();
            await pages.officePage.officeCodeSearchField(testData.officeName);
            await pages.officePage.searchButtonClick();
            await pages.officePage.officeSearchRow(testData.officeName);
            pages.logger.info("Office search and selection completed");
            await pages.viewOfficeInfoPage.clickEditButton();
            await pages.editOfficeInfoPage.enable_DisableInternalShares(INTERNAL_SHARE_STATUS.YES);
            await pages.editOfficeInfoPage.clickSaveButton();
            pages.logger.info("Internal Shares enabled for the office");
            await pages.basePage.clickOnTopMenuLogo();
            pages.logger.info("Navigated back to Home page");

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
    test('Case Id: COMM-25219 - Test Adding Internal Shares on a customer - Verify Shares on', { tag: ['@commission', '@tporegression', '@smoke'] }, async () => {
        
        await test.step(`Add Internal Shares for Customer and verifying Internal Shares should Exist on View Customer`, async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.enterCustomerName(testData.customerName);
            await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
            await console.log("Navigated to Customer Details page");
            // Remove existing Internal Shares if any
            await pages.viewCustomerPage.clickEditButton();
            await pages.editCustomerPage.clearInternalShareEntryandSave();
            //set Internal Shares on Customer As 15%
            await pages.viewCustomerPage.clickEditButton();
            await pages.editCustomerPage.clickOnAddInternalShare();
            await pages.editCustomerPage.enterInternalShareAmount_agent(testData.shareAmount, testData.shareAgent);
            await pages.editCustomerPage.clickSaveButton();
            pages.logger.info("Internal Shares added for the Customer");
            //validate Internal Shares section is present on View Customer Page
            const internalShareValue = await pages.viewCustomerPage.getInternalShareValue();
            expect(internalShareValue).toContain(testData.shareAmount);
            expect(internalShareValue).toContain(testData.shareAgent);
        });

        await test.step(`Verifying Internal Shares should Exist on Create Load`, async () => {
            await pages.viewCustomerPage.clickCreateLoadLink(LOAD_TYPES.NEW_LOAD_TL);
            // validate Internal Shares section is present
            expect(await pages.editLoadLoadTabPage.isInternalSharesTableVisible()).toBeTruthy();
            pages.logger.info("Internal Shares section is visible on Load tab as expected");
            // verify Internal Shares values on Load match those set on Customer
            const loadInternalShareValue = await pages.editLoadLoadTabPage.getInternalShareAmount();
            expect.soft(loadInternalShareValue).toContain(testData.shareAmount);
            const loadInternalShareAgent = await pages.editLoadLoadTabPage.getInternalShareAgent();
            expect.soft(loadInternalShareAgent).toContain(testData.shareAgent);
            await expect(test.info().errors).toHaveLength(0);
            pages.logger.info("Internal Shares values on Load match those set on Customer");
        });
    });

});