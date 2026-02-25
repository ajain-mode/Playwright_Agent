import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { expect, test } from "@playwright/test";
import commissionHelper from "@utils/commissionUtils/commissionHelper";
import { PageManager } from "@utils/PageManager";

const testCaseID = "BANYAN-74496";
test.describe.configure({ retries: 2 });
test.describe.serial("Legacy Customer Portal - Rate Requests via Legacy Customer Portal", { tag: ['@tporegression', '@smoke'] }, () => {

    let pages: PageManager;
    let testData: any;
    let sharedPage: any;
    let loadId: string | undefined;

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
            await commissionHelper.updateAvailableCreditOnCustomer(sharedPage);

            //Banyan3 Rating Engine selection
            await pages.viewCustomerPage.clickCustomerMasterLink();
            await pages.viewMasterCustomerPage.clickEditButton();
            await pages.editMasterCustomerPage.selctBanyan3RatingEngine();
            await pages.editMasterCustomerPage.clickSaveButton();
            await pages.viewMasterCustomerPage.clickCustomerNameLink();

            await pages.legacyCustomerPortalLogin.loginLegacyCustomerPortal();
            pages.logger.info("Legacy Customer Portal login successful - Shared session initialized for three test cases");

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

    /**
* Test Case ID: BANYAN-74496
* Description: Legacy Customer Portal - Rate Requests via Legacy Customer Portal
* @author Aniket Nale
* @created 20-Nov-2025
*/

    test("Case Id: 74496 - Legacy Customer Portal - Rate Requests via Legacy Customer Portal",
        { tag: ['@tporegression', '@banyan', '@p44', '@ltlquote'] }, async () => {

            await test.step("Navigate to LTL Quote Request Page", async () => {
                await pages.lcpQuoteLTL.navigateToLTLQuoteRequest();
            });

            await test.step("Enter LTL Quote Request Details and Request Tariffs", async () => {
                await pages.lcpQuoteLTL.enterPickAndDropDetails(testData.shipperZip, testData.consigneeZip);
                await pages.lcpQuoteLTL.selectCommodityAndAddDetails(
                    testData.commDesc,
                    testData.commClass,
                    testData.commLength,
                    testData.commWidth,
                    testData.commHeight,
                    testData.commWeight,
                    testData.commQuantity
                );
                await pages.lcpQuoteLTL.clickOnRequestTariffsButton();
                await pages.lcpQuoteLTL.waitForQuoteResults();
            });

            await test.step("Verify Tariff Table Create Load from LTL Quote", async () => {
                await pages.lcpQuoteLTL.verifyTariffTable();
                await pages.lcpQuoteLTL.clickOnPlusIconOfCarrier();
                await pages.lcpQuoteLTL.verifyQuoteDetailsNotEmpty(
                    [QUOTE_DETAIL_LABELS.SCAC,
                    QUOTE_DETAIL_LABELS.Quote_HASH,
                    QUOTE_DETAIL_LABELS.LOAD_ID,
                    QUOTE_DETAIL_LABELS.QUOTE_ID]);
                await pages.lcpQuoteLTL.clickOnCreateLoadBtn();
                pages.logger.info("Create Load button clicked from LTL Quote");
            });

            await test.step("Select Shipper from Shipper Dropdown and set dates", async () => {
                await pages.lcpQuoteLTL.selectShipperFromDropdown(testData.shipperName);
                await pages.lcpQuoteLTL.enterShipperEarliestAndLatestDate();
            });

            await test.step("Select consignee from Dropdown and set dates", async () => {
                await pages.lcpQuoteLTL.selectConsigneeFromDropdown(testData.consigneeName);
                await pages.lcpQuoteLTL.enterConsigneeEarliestAndLatestDate();
            });

            await test.step("Finalize Load Creation from LTL Quote", async () => {
                await pages.lcpQuoteLTL.clickOnFinalCreateLoadButton();
                pages.logger.info("Final Create Load button clicked from LTL Quote");
            });

            await test.step("Click First Load and Get ID", async () => {
                loadId = await pages.lcpQuoteLTL.clickFirstLoadAndGetId();
                console.log("Clicked Load ID:", loadId);
            });

            await test.step("Login to BTMS Portal", async () => {
                await pages.btmsLoginPage.BTMSLogin(userSetup.banyanUser);
                pages.logger.info("BTMS login successful - Shared session initialized for three test cases");
            });

            await test.step("Verify Load ID Retrieval", async () => {
                expect(loadId).toBeDefined();
                pages.logger.info(`Retrieved Load ID: ${loadId}`);
            });

            await test.step("Search and Validate Load in BTMS", async () => {
                await pages.basePage.searchFromMainHeader(loadId as string);
                pages.logger.info(`Load ID: ${loadId} verified successfully in BTMS`);
            });

            await test.step("Verify Created By Customer Portal on Load Page", async () => {
                await pages.viewLoadPage.createdByPortalName(CREATED_BY.LEGACY_CUSTOMER_PORTAL);
                pages.logger.info("Verified 'Created By Customer Portal' on Load Page successfully in BTMS");
            });

            await test.step("Verify Banyan Quote ID on Load Page", async () => {
                await pages.editLoadCarrierTabPage.clickOnCarrierTab();
                await pages.viewLoadCarrierTabPage.banyanQuoteId();
                pages.logger.info("Verified 'Banyan Quote ID' on Load Page successfully in BTMS");
                await pages.viewLoadCarrierTabPage.getBanyanLoadId();
                pages.logger.info("Verified 'Banyan Load ID' on Load Page successfully in BTMS");
            });
        });
});