import apiRequests from "@api/apiRequests";
import dataConfig from "@config/dataConfig";
import dataConfigAPI from "@config/dataConfigAPI";
import dynamicDataAPI from "@config/dynamicDataAPI";
import userSetup from "@loginHelpers/userSetup";
import { expect, test } from "@playwright/test";
import banyanHelper from "@utils/banyanUtils/banyanHealper";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

const testCaseID = "BANYAN-74518";
test.describe.configure({ retries: 1 });
test.describe.serial("LTL Imaging - BTMS - Manually Rated LTL Loads", { tag: ['@tporegression', '@smoke'] }, () => {
    let pages: PageManager;
    let testData: any;
    let sharedPage: any;
    let bolNumber: string;
    let response: any;
    let loadId: string;

    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);
            testData = dataConfig.getTestDataFromCsv(dataConfig.banyanData, testCaseID);
            await pages.btmsLoginPage.BTMSLogin(userSetup.banyanUser);
            await pages.homePage.clickOnFinanceButton();
            await pages.financePage.searchCustomerIDViaFinance(testData.customerMasterID);
            await pages.customerMasterListPage.clickOnCustomerName(testData.customerName);
            // Set Banyan as Rating Engine
            await pages.viewMasterCustomerPage.clickEditButton();
            // await pages.editMasterCustomerPage.selctBanyanRatingEngine();

            //Banyan3 Rating Engine selection
            await pages.editMasterCustomerPage.selctBanyan3RatingEngine();
            await pages.editMasterCustomerPage.clickSaveButton();

            // Disable Auto Rate and Auto Dispatch before starting test
            await banyanHelper.enableDisableAutoRate_Dispatch(pages, false);
            pages.logger.info("Starting Change carrier by updating load with LTL quoted rates");
            bolNumber = await dynamicDataAPI.getBolNumber() + commonReusables.generateRandomNumber(3).toString();
            await console.log('Generated BOL Number:', bolNumber);
            const rawdata = await dataConfigAPI.getEDIRawData(dataConfigAPI.inboundEdi204NewHydrofarm)
            const updatedRawData = await dynamicDataAPI.updateEdiRawData(rawdata, bolNumber, '', '', '', true, false, '', '');
            await console.log('Updated EDI 204 Data: ', updatedRawData);
            ({ response } = await apiRequests.sendEDI204Request(updatedRawData));
            await console.log('Sent EDI with BOL Number:', bolNumber);
            await console.log('Status Code:', response.status);
            await expect(response.status).toBe(201);
            pages.logger.info("EDI 204S sent successfully via API");
            await pages.homePage.clickOnLoadButton();
            await pages.loadsPage.clickOnEDI204LoadTender();
            await pages.edi204LoadTendersPage.filterBolNumber(bolNumber);
            //Get Load ID
            loadId = await pages.edi204LoadTendersPage.getLoadIDwithBolNumber(bolNumber);
            await console.log("Created Load ID is: " + loadId);
            await pages.basePage.searchFromMainHeader(loadId);
            await pages.viewLoadPage.clickEditButton();
            await pages.editLoadPage.clickOnCarrierTab();
            await pages.editLoadCarrierTabPage.enterProNumber(testData.proNumber);
            await pages.editLoadCarrierTabPage.selectCarrier1(testData.carrierID);
            await pages.editLoadPage.clickLoadTab();
            await pages.editLoadPage.clickSaveButton();
            pages.logger.info("PRO# added and Load saved successfully");
            const loadMethod = await pages.viewLoadPage.getLoadMethod();
            await expect(loadMethod).toBe('ELTL');
            pages.logger.info("Load Method verified successfully as ELTL");


        } catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    });

    test.afterAll(async () => {
        try {
            if (sharedPage && !sharedPage.isClosed()) {
                await sharedPage.close();
                pages.logger.info("Shared session closed successfully after completing test cases");
            }
        } catch (error) {
            console.warn("Cleanup warning:", error);
        }
    });
    test("Case Id: 74518 - LTL Imaging - BTMS - Manually Rated LTL Loads", { tag: ['@tporegression', '@banyan', '@p44', '@ltlquote'] }, async () => {

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

        //Commented out because hydrofarm didnt have any carrier/customer prices setup

        // await test.step("Verify customer and carrier total is zero", async () => {
        //     await commonReusables.waitForPageStable(sharedPage);
        //     //verifies carrier total is not zero on view load page
        //     await pages.viewLoadPage.verifyCarrierTotalValueIsNotZero();
        //     // //verifies customer total is not zero on view load page
        //     await pages.viewLoadPage.verifyCustomerTotalValueIsNotZero();
        // });
    });
});