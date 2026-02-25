import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";

const testCaseID = "BANYAN-67948";
test.describe.configure({ retries: 1 });
test.describe.serial("Volume Quote - Allow Volume configuration is only available for Banyan rating engine",
    { tag: ['@tporegression', '@smoke'] }, () => {

        let pages: PageManager;
        let testData: any;
        let sharedPage: any;

        test.beforeAll(async ({ browser }) => {
            try {
                sharedPage = await browser.newPage();
                pages = new PageManager(sharedPage);
                testData = dataConfig.getTestDataFromCsv(dataConfig.banyanData, testCaseID);
                await pages.btmsLoginPage.BTMSLogin(userSetup.banyanUser);
                pages.logger.info("BTMS login successful - Shared session initialized for three test cases");
                await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
                await pages.searchCustomerPage.enterCustomerName(testData.customerName);
                await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
                // await pages.searchCustomerPage.clickOnActiveCustomer();
            } catch (error) {
                console.error("Setup failed:", error);
                throw error;
            }
        });

        test.afterAll(async () => {
            try {
                if (sharedPage && !sharedPage.isClosed()) {
                    await sharedPage.close();
                    pages.logger.info("Shared session closed successfully after completing all three test cases");
                }
            } catch (error) {
                console.warn("Cleanup warning:", error);
            }
        });

        test("Case Id: 67948 - Volume Quote - Allow Volume configuration is only available for Banyan rating engine",
            { tag: ['@tporegression', '@banyan', '@p44'] }, async () => {

                await test.step("Navigate to Edit Master Customer Page", async () => {
                    await pages.viewCustomerPage.clickCustomerMasterLink();
                    await pages.viewMasterCustomerPage.clickEditButton();
                    pages.logger.info("Navigated to Edit Master Customer Page successfully");
                });

                await test.step("Validate Mode rating engine logic", async () => {
                    await pages.editMasterCustomerPage.verifyModeLogic();
                    pages.logger.info("Mode rating engine logic verified: Allow Volume disabled unless Banyan engines are used");
                });

                await test.step("Validate Banyan rating engine logic", async () => {
                    await pages.editMasterCustomerPage.verifyBanyanLogic();
                    pages.logger.info("Banyan rating engine logic verified: Allow Volume enabled when Banyan selected");
                });

                await test.step("Validate Banyan3 rating engine logic", async () => {
                    await pages.editMasterCustomerPage.verifyBanyan3Logic();
                    pages.logger.info("Banyan3 rating engine logic verified: Allow Volume enabled when Banyan3 selected");
                });

                pages.logger.info("All test cases for Volume Quote - Allow Volume configuration verified successfully");
            });
    });