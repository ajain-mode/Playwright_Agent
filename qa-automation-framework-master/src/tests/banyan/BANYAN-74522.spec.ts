import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { expect, test } from "@playwright/test";
import commissionHelper from "@utils/commissionUtils/commissionHelper";
import { PageManager } from "@utils/PageManager";

const testCaseID = "BANYAN-74522";
test.describe.configure({ retries: 2 });
test.describe.serial("LTL Imaging - Legacy Customer Portal", { tag: ['@tporegression', '@smoke'] }, () => {

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
            await pages.lcpQuoteLTL.navigateToLTLQuoteRequest();
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
            await pages.lcpQuoteLTL.verifyTariffTable();
            await pages.lcpQuoteLTL.clickOnPlusIconOfCarrier();
            await pages.lcpQuoteLTL.verifyQuoteDetailsNotEmpty(
                [QUOTE_DETAIL_LABELS.SCAC,
                QUOTE_DETAIL_LABELS.Quote_HASH,
                QUOTE_DETAIL_LABELS.LOAD_ID,
                QUOTE_DETAIL_LABELS.QUOTE_ID]);
            await pages.lcpQuoteLTL.clickOnCreateLoadBtn();
            pages.logger.info("Create Load button clicked from LTL Quote");
            await pages.lcpQuoteLTL.selectShipperFromDropdown(testData.shipperName);
            await pages.lcpQuoteLTL.enterShipperEarliestAndLatestDate();
            await pages.lcpQuoteLTL.selectConsigneeFromDropdown(testData.consigneeName);
            await pages.lcpQuoteLTL.enterConsigneeEarliestAndLatestDate();
            await pages.lcpQuoteLTL.clickOnFinalCreateLoadButton();
            pages.logger.info("Final Create Load button clicked from LTL Quote");
            loadId = await pages.lcpQuoteLTL.clickFirstLoadAndGetId();
            console.log("Clicked Load ID:", loadId);

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
    * Test Case ID: BANYAN-74522
    * Description: LTL Imaging - Legacy Customer Portal
    * @author Aniket Nale
    * @created 20-Nov-2025
    */

    test("Case Id: 74522 - LTL Imaging - Legacy Customer Portal",
        { tag: ['@tporegression', '@banyan', '@p44', '@ltlquote'] }, async () => {

            await test.step("Login to BTMS Portal", async () => {
                await pages.btmsLoginPage.BTMSLogin(userSetup.banyanUser);
                pages.logger.info("BTMS login successful - Shared session initialized for three test cases");
            });

            await test.step("Go to admin and open simulator tool", async () => {
                await pages.adminPage.hoverAndClickAdminMenu();
                await pages.adminPage.clickOnSimulatorToolDocumentUploadLink();
                pages.logger.info("Navigated to Simulator Tool page successfully");
            });

            await test.step("Enter form details and submit", async () => {

                await pages.simulateEDispatchDocumentUploadPage.selectSourceFromDropdown(testData.simulatedSource);
                await pages.simulateEDispatchDocumentUploadPage.enterBTMSLoadID(loadId as string);
                await pages.simulateEDispatchDocumentUploadPage.selectDocTypeDropdown(testData.documentType);
                await pages.simulateEDispatchDocumentUploadPage.setDocumentExtension(DOC_EXTENSIONS.PDF);
                await pages.simulateEDispatchDocumentUploadPage.clickOnUploadDocumentButton();
                await pages.simulateEDispatchDocumentUploadPage.clickOnSubmitButton();
                pages.logger.info("Simulator Tool Document Upload form submitted successfully");
            });

            await test.step("Verify Load ID Retrieval", async () => {
                expect(loadId).toBeDefined();
                pages.logger.info(`Retrieved Load ID: ${loadId}`);
            });

            await test.step("Search and Validate Load in BTMS", async () => {
                await pages.basePage.searchFromMainHeader(loadId as string);
                pages.logger.info(`Load ID: ${loadId} verified successfully in BTMS`);
            });

            await test.step("Verify BOL row with banyan text, date, and document", async () => {
                await pages.viewLoadPage.verifyDocumentVisible(DOCUMENT_TYPE.PROOF_OF_DELIVERY);
                pages.logger.info("POD document is visible in Load Documents section");
                await pages.viewLoadPage.verifyBanyanText(DOCUMENT_TYPE.PROOF_OF_DELIVERY);
                pages.logger.info("Banyan text verified successfully in Proof of Delivery row");
                await pages.viewLoadPage.verifyDocumentDateIsToday(DOCUMENT_TYPE.PROOF_OF_DELIVERY);
                pages.logger.info("Proof of Delivery date verified successfully as today's date");
                await pages.viewLoadPage.clickAndOpenDocument(DOCUMENT_TYPE.PROOF_OF_DELIVERY);
                pages.logger.info("POD document opened successfully");
            });

            await test.step("login to legacy customer portal and search load id", async () => {
                await pages.legacyCustomerPortalLogin.loginLegacyCustomerPortal();
                pages.logger.info("Legacy Customer Portal login successful");
                await pages.lcpQuoteLTL.searchLoadInLCP(loadId as string);
                pages.logger.info(`Load ID: ${loadId} searched successfully in Legacy Customer Portal`);
            });

            await test.step("Validate all documents in LCP", async () => {
                await pages.lcpQuoteLTL.validateDocuments([
                    { type: DOCUMENT_ACTION_TYPE.POPUP, text: DOCUMENT_TEXT.BILL_OF_LADING },
                    { type: DOCUMENT_ACTION_TYPE.POPUP, text: DOCUMENT_TEXT.SHIPPING_LABEL },
                    { type: DOCUMENT_ACTION_TYPE.DOWNLOAD, text: DOCUMENT_TEXT.PROOF_OF_DELIVERY }
                ]);
            });
        });
});