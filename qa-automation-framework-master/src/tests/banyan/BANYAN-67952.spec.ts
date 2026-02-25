import apiRequests from "@api/apiRequests";
import dataConfig from "@config/dataConfig";
import dataConfigAPI from "@config/dataConfigAPI";
import dynamicDataAPI from "@config/dynamicDataAPI";
import userSetup from "@loginHelpers/userSetup";
import { expect, test } from "@playwright/test";
import banyanHelper from "@utils/banyanUtils/banyanHealper";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

const testCaseID = "BANYAN-67952";
test.describe.configure({ retries: 2 });
/**
 * Test Case to Create LTL load and update mode to ELTL by adding PRO#
 * @author Rohit Singh
 * @date 03-Nov-2025
 */
test.describe.serial("Create LTL load and update mode to ELTL by adding PRO#", { tag: ['@tporegression', '@smoke'] }, () => {
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
    test("Case Id: 67952 - Create LTL load and update mode to ELTL by adding PRO#", { tag: ['@tporegression', '@banyan', '@p44', '@ltlquote'] }, async () => {
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
        await test.step('Open Created Load', async () => {
            await pages.basePage.searchFromMainHeader(loadId);
        });
        await test.step('Add PRO# to Load', async () => {
            await pages.viewLoadPage.clickEditButton();
            await pages.editLoadPage.clickOnCarrierTab();
            await pages.editLoadCarrierTabPage.enterProNumber(testData.proNumber);
            await pages.editLoadCarrierTabPage.selectCarrier1(testData.carrierID);
            await pages.editLoadPage.clickLoadTab();
            await pages.editLoadPage.clickSaveButton();
            pages.logger.info("PRO# added and Load saved successfully");
        });
        await test.step('Verify Load Method is updated to ELTL', async () => {
            const loadMethod = await pages.viewLoadPage.getLoadMethod();
            await expect(loadMethod).toBe(LOAD_METHOD.ELTL);
            pages.logger.info("Load Method verified successfully as ELTL");
        });
        //@modified: Skipping this validation as per discussion with Greg Farnsworth on 23-Jan-2026
        // await test.step('Verify Carrier and Customer Totals are not zero', async () => {

        //     await pages.viewLoadPage.clickEditButton();

        //     //verifies carrier total is not zero on edit load page
        //     await pages.editLoadLoadTabPage.verifyCarrierTotalValueIsNotZero();
        //     //verifies customer total is not zero on edit load page
        //     await pages.editLoadLoadTabPage.verifyCustomerTotalValueIsNotZero();

        //     await pages.editLoadPage.clickSaveButton();

        //     //verifies carrier total is not zero on view load page
        //     await pages.viewLoadPage.verifyCarrierTotalValueIsNotZero();
        //     //verifies customer total is not zero on view load page
        //     await pages.viewLoadPage.verifyCustomerTotalValueIsNotZero();
        // });
    });
});