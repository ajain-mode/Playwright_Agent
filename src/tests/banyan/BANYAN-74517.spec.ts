import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { expect, test } from "@playwright/test";
import commissionHelper from "@utils/commission-helpers";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

const testCaseID = "BANYAN-74517";
test.describe.configure({ retries: 1 });
test.describe("LTL Imaging - BTMS", { tag: ['@tporegression', '@smoke'] }, () => {

    let pages: PageManager;
    let testData: any;
    let sharedPage: any;
    let loadId: string;

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
            await pages.viewCustomerPage.clickEditButton();
            await pages.editCustomerPage.selectUseLTLCustRates('YES');
            await pages.editCustomerPage.selectFlatRate(testData.rateTypeFlat);
            await pages.editCustomerPage.selectAdjustment(testData.adjustmentValue);
            pages.logger.info("Flat rate type and adjustment selected for customer");
            await pages.editCustomerPage.clickSaveButton();
            await commissionHelper.updateAvailableCreditOnCustomer(sharedPage);

            //Banyan3 Rating Engine selection
            await pages.viewCustomerPage.clickCustomerMasterLink();
            await pages.viewMasterCustomerPage.clickEditButton();
            await pages.editMasterCustomerPage.selctBanyan3RatingEngine();
            await pages.editMasterCustomerPage.clickSaveButton();
            await pages.viewMasterCustomerPage.clickCustomerNameLink();

            pages.logger.info("Shared setup completed - Customer ready for all three test case validations");
            await test.step("Click on LTL Quote Request Button", async () => {
                await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LTL_QUOTE);
                pages.logger.info("Navigated to NEW LTL QUOTE creation form");
            });
            await test.step("Enter details in LTL Quote Request form and Request Tariffs", async () => {
                try {
                    await pages.ltlQuoteRequestPage.enterPickUpAndDeliveryZip(testData.shipperZip, testData.consigneeZip);
                    await pages.ltlQuoteRequestPage.selectCommodityAndAddDetails(testData.commDesc, testData.commClass, testData.commLength, testData.commWidth, testData.commHeight, testData.commWeight, testData.commQuantity);
                    await pages.ltlQuoteRequestPage.clickOnRequestTariffsButton();
                    pages.logger.info("LTL Quote Request form filled successfully and requested tariffs");
                } catch (error) {
                    pages.logger.error("Error filling LTL Quote Request form and tariff request:", error);
                }
            });

            await test.step("Verification of tariff table", async () => {
                await pages.ltlQuoteRequestPage.verifyTariffTable();
                pages.logger.info("Tariff table verified successfully");
            });

            await test.step("Select tariff and create LTL Quote and verify Booked Status", async () => {
                try {
                    await pages.ltlQuoteRequestPage.clickOnCreateLoadBtn();
                    pages.logger.info("Clicked on Create Load button to create LTL Quote");
                } catch (error) {
                    pages.logger.error("Error clicking on Create Load button:", error);
                }

                await pages.editLoadLoadTabPage.closeMarginPopupIfVisible();

                try {
                    await pages.ltlQuoteRequestPage.verifyBookedStatus();
                    pages.logger.info("LTL Quote created successfully and status verified as Booked");
                } catch (error) {
                    pages.logger.error("Error verifying Booked status of LTL Quote:", error);
                }
            });

            await test.step("Enter pick up drop details on edit load page", async () => {
                //verifies carrier total is not zero on edit load page
                await pages.editLoadLoadTabPage.verifyCarrierTotalValueIsNotZero();
                //verifies customer total is not zero on edit load page
                await pages.editLoadLoadTabPage.verifyCustomerTotalValueIsNotZero();
                await pages.editLoadLoadTabPage.selectRateCardValue(testData.RateValue);
                await pages.editLoadPickTabPage.clickOnPickTab();
                await pages.editLoadPickTabPage.selectShipperAddress();
                await pages.editLoadPickTabPage.selectClientByNameShipper(testData);
                await pages.editLoadPickTabPage.enterActualDateValue(
                    pages.commonReusables.getNextTwoDatesFormatted().tomorrow
                );
                await pages.editLoadPickTabPage.enterActualTimeValue(testData.shipperEarliestTime);
                await pages.editLoadPickTabPage.enterDeadlineValue(
                    pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow
                );
                await pages.editLoadPickTabPage.enterDeadlineTimeValue(testData.shipperLatestTime);
                await pages.editLoadDropTabPage.clickDropTab();
                await pages.editLoadDropTabPage.selectConsigneeAddress();
                await pages.editLoadDropTabPage.selectConsigneeByNameConsignee(testData.consigneeName);
                await pages.editLoadDropTabPage.enterActualDateValue(await commonReusables.getDate("tomorrow", "MM/DD/YYYY"));
                await pages.editLoadDropTabPage.enterActualTimeValue(testData.consigneeEarliestTime);
                await pages.editLoadDropTabPage.enterDeadlineDateValue(await commonReusables.getDate("dayAfterTomorrow", "MM/DD/YYYY"));
                await pages.editLoadDropTabPage.enterDeadlineTimeValue(testData.consigneeLatestTime);
            });

            loadId = await test.step("Save load and fetch Load ID", async () => {
                await pages.editLoadFormPage.clickOnSaveBtn();
                const id = await pages.viewLoadPage.getLoadID();
                return id;
            });


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

    test("Case Id: 74517 - LTL Imaging - BTMS",
        { tag: ['@tporegression', '@banyan', '@p44', '@ltlquote'] }, async () => {
            pages.logger.info("Starting LTL Imaging - BTMS as load is already created in beforeAll hook with booked status");

            await test.step("Go to admin and open simulator tool", async () => {
                await pages.adminPage.hoverAndClickAdminMenu();
                await pages.adminPage.clickOnSimulatorToolDocumentUploadLink();
                pages.logger.info("Navigated to Simulator Tool page successfully");
            });

            await test.step("Enter form details and submit", async () => {

                await pages.simulateEDispatchDocumentUploadPage.selectSourceFromDropdown(testData.simulatedSource);
                await pages.simulateEDispatchDocumentUploadPage.enterBTMSLoadID(loadId);
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

            await test.step("Search and open Load ID in BTMS", async () => {
                await pages.basePage.searchFromMainHeader(loadId);
                pages.logger.info(`Load ID: ${loadId} verified successfully in BTMS`);
                //verifies carrier total is not zero on view load page
                await pages.viewLoadPage.verifyCarrierTotalValueIsNotZero();
                //verifies customer total is not zero on view load page
                await pages.viewLoadPage.verifyCustomerTotalValueIsNotZero();
            });

            await test.step("Verify BOL row with banyan text, date, and document", async () => {
                await pages.viewLoadPage.verifyDocumentVisible(DOCUMENT_TYPE.BILL_OF_LADING);
                pages.logger.info("BOL document is visible in Load Documents section");
                await pages.viewLoadPage.verifyBanyanText(DOCUMENT_TYPE.BILL_OF_LADING);
                pages.logger.info("Banyan text verified successfully in Bill of Lading row");
                await pages.viewLoadPage.verifyDocumentDateIsToday(DOCUMENT_TYPE.BILL_OF_LADING);
                pages.logger.info("Bill of Lading date verified successfully as today's date");
                await pages.viewLoadPage.clickAndOpenDocument(DOCUMENT_TYPE.BILL_OF_LADING);
                pages.logger.info("BOL document opened successfully");
            });
        });
});