import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { expect, test } from "@playwright/test";
import commissionHelper from "@utils/commissionUtils/commissionHelper";
import { PageManager } from "@utils/PageManager";
/**
 * Test Case ID: COMM-25220
 * Description: Test Adding Internal Shares on a customer - Verify Shares on Load
 * @author Rohit Singh
 * @created 13-Nov-2025
 */
const testCaseID = "COMM-25220";
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
            //modified: 28-Nov-2025: Rohit Singh
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
            // Navigate to Customer
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.enterCustomerName(testData.customerName);
            await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
            await console.log("Navigated to Customer Details page");
            // Remove existing Internal Shares if any
            await pages.viewCustomerPage.clickEditButton();
            await pages.editCustomerPage.clearInternalShareEntryandSave();

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

    test("Case Id: 25220 - Validate internal shares integration in load creation", { tag: ['@commission', '@tporegression', '@smoke'] }, async () => {
        await test.step("Add Internal Share to Load Creation", async () => {
            try {
                // create Truck load with internal share
                await pages.basePage.clickOnTopMenuLogo();
                pages.logger.info("Navigated back to Home page");
                await commissionHelper.createTruckLoad(testData, sharedPage, true, false);
                pages.logger.info("Truck Load created with Internal Share successfully");
                const internalShares = await pages.viewLoadPage.getInternalShareTableDetails();
                console.log("Internal Share Details on Load:", internalShares);
                expect.soft(internalShares.amount).toContain(testData.shareAmount);
                expect.soft(internalShares.agentName).toContain(testData.shareAgent);
                expect(test.info().errors).toHaveLength(0);
                pages.logger.info("Internal Share details verified on Load successfully");
            } catch (error) {
                pages.logger.error(`Failed to add internal share to load: ${error}`);
                throw error;
            }
        });
    });
});