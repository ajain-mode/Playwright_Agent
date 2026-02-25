import apiRequests from "@api/apiRequests";
import dataConfig from "@config/dataConfig";
import dataConfigAPI from "@config/dataConfigAPI";
import dynamicDataAPI from "@config/dynamicDataAPI";
import userSetup from "@loginHelpers/userSetup";
import { expect, test } from "@playwright/test";
import banyanHelper from "@utils/banyanUtils/banyanHealper";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

const testCaseID = "BANYAN-74495";
/**
 * Test Case to Create LTL load and update mode to ELTL by adding PRO#
 * @author Rohit Singh
 * @date 03-oct-2025
 */
test.describe.configure({ retries: 2 });
test.describe.serial("EDI - Rate Requests via 204", { tag: ['@tporegression', '@smoke'] }, () => {
    let pages: PageManager;
    let testData: any;
    let sharedPage: any;
    let bolNumber: string;
    let response: any;
    let loadId: string;
    let banyanLoadId: string;
    let banyanQuoteId: string;
    let quoteReqNumber: any;
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
            await banyanHelper.enableDisableAutoRate_Dispatch(pages, true);
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
    test("Case Id: 74495 - EDI - Rate Requests via 204", { tag: ['@tporegression', '@banyan', '@p44', '@ltlquote'] }, async () => {
        pages.logger.info("Starting Change carrier by updating load with LTL quoted rates");
        // const testcaseID = 'EDI-25176';
        // Create API Post request to send EDI 204S
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

        await test.step('Auto accept Load from Load Tender 204', async () => {
            await pages.homePage.clickOnLoadButton();
            await pages.loadsPage.clickOnEDI204LoadTender();
            await pages.edi204LoadTendersPage.filterBolNumber(bolNumber);
            //Get Load ID
            loadId = await pages.edi204LoadTendersPage.getLoadIDwithBolNumber(bolNumber);
            await console.log("Created Load ID is: " + loadId);
        });
        await pages.basePage.searchFromMainHeader(loadId);
        await test.step('Wait for load status to be Dispatched & Validate Automation Alerts', async () => {
            await pages.viewLoadPage.waitTillLoadIsDispatched(20, LOAD_STATUS.DISPATCHED);
            await pages.viewLoadPage.validateAutoRateSuccess();
            await pages.viewLoadPage.validateAutoDispatchSuccess();
            await expect(test.info().errors).toHaveLength(0);
            await console.log("Load is Dispatched & Validated Automation Alerts: Auto Rate Success & Auto Dispatch Success");
        });
        quoteReqNumber = await pages.viewLoadPage.getQuoteReqNumber();
        expect(quoteReqNumber).toBeDefined();
        await pages.viewLoadPage.clickCarrierTab();
        banyanLoadId = (await pages.viewLoadCarrierTabPage.getBanyanLoadId()).toString();
        pages.logger.info(`Banyan Load ID: ${banyanLoadId}`);
        expect(banyanLoadId).toBeDefined();
        banyanQuoteId = (await pages.viewLoadCarrierTabPage.banyanQuoteId()).toString();
        pages.logger.info(`Banyan Quote ID: ${banyanQuoteId}`);
        expect(banyanQuoteId).toBeDefined();
    });
    test("Case Id: 74500 - Re-Rating - EDI", { tag: ['@tporegression', '@banyan', '@p44', '@ltlquote'] }, async () => {
        const testcaseID = 'BANYAN-74500';
        testData = dataConfig.getTestDataFromCsv(dataConfig.banyanData, testcaseID);
        const rawdata = await dataConfigAPI.getEDIRawData(dataConfigAPI.inboundEdi204ChangeHydrofarm)
        const updatedRawData = await dynamicDataAPI.updateEdiRawData(rawdata, bolNumber, '', '', '', true, false, '', '');
        await console.log('Updated EDI 204 Data: ', updatedRawData);
        ({ response } = await apiRequests.sendEDI204Request(updatedRawData));
        await console.log('Sent EDI with BOL Number:', bolNumber);
        await console.log('Status Code:', response.status);
        await expect(response.status).toBe(201);

        // Goto Home Page and search Load
        await pages.basePage.searchFromMainHeader(loadId);
        await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.DISPATCHED);
        await pages.viewLoadPage.reloadUntilAutoRateSuccessVisible();

        expect(test.info().errors).toHaveLength(0);
        pages.logger.info("Load Re-Rated successfully via EDI 204 Change");
        const newQuoteReqNumber = await pages.viewLoadPage.getQuoteReqNumber();
        expect(newQuoteReqNumber).toBeDefined();
        expect(newQuoteReqNumber).not.toBe(quoteReqNumber);
        console.log(`Old Quote Request Number: ${quoteReqNumber}, New Quote Request Number: ${newQuoteReqNumber}`);

        await pages.viewLoadPage.clickCarrierTab();
        const newBanyanLoadId = (await pages.viewLoadCarrierTabPage.getBanyanLoadId()).toString();
        pages.logger.info(`Banyan Load ID: ${newBanyanLoadId}`);
        expect(newBanyanLoadId).toBeDefined();
        expect(newBanyanLoadId).toBe(banyanLoadId);
        const newBanyanQuoteId = (await pages.viewLoadCarrierTabPage.banyanQuoteId()).toString();
        pages.logger.info(`Banyan Quote ID: ${newBanyanQuoteId}`);
        console.log(`Old Banyan Quote ID: ${banyanQuoteId}, New Banyan Quote ID: ${newBanyanQuoteId}`);
        expect(newBanyanQuoteId).toBeDefined();
        expect(newBanyanQuoteId).not.toBe(banyanQuoteId);
    });
    test("Case Id: 74503 - LTL Dispatching - BTMS",
        { tag: ['@tporegression', '@banyan', '@p44', '@ltlquote'] }, async () => {
            pages.logger.info("Starting LTL Dispatching - BTMS as load is already created.");
            await pages.basePage.searchFromMainHeader(loadId);
            await sharedPage.reload();
            await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.DISPATCHED);
            await pages.viewLoadPage.validateAutoDispatchSuccess();
            expect(test.info().errors).toHaveLength(0);
            pages.logger.info("Load Dispatched successfully via BTMS");
        });
});