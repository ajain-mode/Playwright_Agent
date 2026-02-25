import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { expect, test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";

const testCaseID = "BANYAN-67949";
test.describe.configure({ retries: 1 });
test.describe("Volume Quote - Rates returned for volume quotes when Allow Volume is enabled",
    { tag: ['@tporegression', '@smoke'] }, () => {

        let pages: PageManager;
        let testData: any;
        let sharedPage: any;

        test.beforeAll(async ({ browser }) => {
            try {
                sharedPage = await browser.newPage();
                pages = new PageManager(sharedPage);

                testData = dataConfig.getTestDataFromCsv(
                    dataConfig.banyanData,
                    testCaseID
                );

                await pages.btmsLoginPage.BTMSLogin(userSetup.banyanUser);
                pages.logger.info("BTMS login successful - Shared session initialized for three test cases");

                await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
                await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
                await pages.searchCustomerPage.enterCustomerName(testData.customerName);
                await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
                await pages.viewCustomerPage.clickCustomerMasterLink();
                await pages.viewMasterCustomerPage.clickEditButton();

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

        test("Case Id: 67949 - Volume Quote - Rates returned for volume quotes when Allow Volume is enabled",
            { tag: ['@tporegression', '@banyan', '@p44'] }, async () => {

                await test.step("Enable Allow Volume", async () => {
                    //Banyan3 Rating Engine selection
                    await pages.editMasterCustomerPage.selctBanyan3RatingEngine();
                    await pages.editMasterCustomerPage.enableAllowVolumeQuoting();
                    await pages.editMasterCustomerPage.clickSaveButton();
                    pages.logger.info("Enabled Allow Volume quoting and saved changes successfully");
                    await pages.viewMasterCustomerPage.clickCustomerNameLink();
                    pages.logger.info("Navigated back to View Customer successfully");
                });

                await test.step("Enter Volume Quote Details and verify Volume Quote Note", async () => {
                    await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LTL_QUOTE);
                    await pages.ltlQuoteRequestPage.enterPickUpAndDeliveryZip(testData.shipperZip, testData.consigneeZip);
                    await pages.ltlQuoteRequestPage.selectCommodityAndAddDetails(testData.commDesc, testData.commClass, testData.commLength, testData.commWidth, testData.commHeight, testData.commWeight, testData.commQuantity);
                    await pages.ltlQuoteRequestPage.verifyVolumeQuoteOptionAvailability();
                    await pages.ltlQuoteRequestPage.clickOnRequestTariffsButton();
                });

                await test.step("Verify Rates Returned for Volume Quote", async () => {
                    await pages.ltlQuoteRequestPage.verifyTariffTable();
                    pages.logger.info("Verified rates are returned for volume quotes as expected");
                    expect(test.info().errors).toHaveLength(0);
                });
            });
    });