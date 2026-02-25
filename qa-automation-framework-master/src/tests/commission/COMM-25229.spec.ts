//@ts-check
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import test, { expect, Page } from "@playwright/test";
import commissionHelper from "@utils/commissionUtils/commissionHelper";
import { PageManager } from "@utils/PageManager";

const testCaseID = "COMM-25229";
test.describe.configure({ retries: 1 });
test.describe.serial("Commission Report", { tag: ['@commission', '@tporegression', '@smoke'] }, () => {

    let page: Page;
    let pages: PageManager;
    let testData: any;
    let loadId: string;
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        pages = new PageManager(page);
        testData = dataConfig.getTestDataFromCsv(dataConfig.commissionData, testCaseID);
        console.log("Starting single login session for commission detail report tests");
        await pages.btmsLoginPage.BTMSLogin(userSetup.UserCommission);
        loadId = await commissionHelper.createTruckLoad(testData, page, false, true);
    });
    /**
     * Case Id: COMM-25229
     * Commission Detail Report - Basic Report Functionality
     * @author Rohit Singh
     * @created 2025-11-28
     */
    test('Case Id: COMM-25229 - Commission Detail Report - Basic Report Functionality', { tag: ['@commission', '@tporegression', '@smoke'] }, async () => {
        await pages.basePage.clickHomeButton();
        await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
        await pages.basePage.clickSubHeaderByText(FINANCE_SUB_MENU.PAYABLES);
        await pages.accountsPayablePage.clickOfficeCommsionDetail();
        pages.logger.info("Office Commission Detail page loaded completely");
        await pages.officeCommissionsDetailPage.searchLoadId(loadId);
        const loadIdVisible = await pages.officeCommissionsDetailPage.verifyLoadIdVisible(loadId);
        const commStatusVisible = await pages.officeCommissionsDetailPage.verifyCommStatus(loadId, COMMISSION_AUDIT_STATUS.OPEN);
        const loadStatusVisible = await pages.officeCommissionsDetailPage.verifyLoadStatus(loadId, LOAD_STATUS.INVOICED);
        expect(loadIdVisible).toBeTruthy();
        expect(commStatusVisible).toBeTruthy();
        expect(loadStatusVisible).toBeTruthy();
        pages.logger.info("Commission Detail Report - Basic Functionality and Operations verified successfully");
    });
    /**
     * Case Id: COMM-25230
     * Commission Detail Report - Hide/Unhide ON HOLD rows
     * @author Rohit Singh
     * @created 2025-11-28
     */
    test('Case Id: COMM-25230 - Commission Detail Report - Hide/Unhide ON HOLD rows', { tag: ['@commission', '@tporegression', '@smoke'] }, async () => {
        //select commission checkbox
        await pages.officeCommissionsDetailPage.selectCommissionCheckbox(loadId);
        //Hold Commission
        await pages.officeCommissionsDetailPage.clickHoldUnholdButton();

        await pages.officeCommissionsDetailPage.confirmHoldUnholdAction("Test Hold Commission");
        let commStatusVisible = await pages.officeCommissionsDetailPage.verifyCommStatus(loadId, COMMISSION_AUDIT_STATUS.HOLD);
        expect(commStatusVisible).toBeTruthy();
        pages.logger.info("Commission set to ON HOLD successfully");
        
        //Hide Commission
        await pages.officeCommissionsDetailPage.selectCommissionCheckbox(loadId);
        await pages.officeCommissionsDetailPage.clickHideButton();
        const isSuccessVisible = await pages.officeCommissionsDetailPage.isSuccessMessageVisible();
        expect.soft(isSuccessVisible).toBeTruthy();
        
        await pages.officeCommissionsDetailPage.clickClearButton();
        await pages.officeCommissionsDetailPage.toggleIncludeHiddenCommissions('NO');
        await pages.officeCommissionsDetailPage.searchLoadId(loadId);
        const isNoRecordFound = await pages.officeCommissionsDetailPage.isNoRecordFoundVisible();
        expect(isNoRecordFound).toBeTruthy();
        pages.logger.info("ON HOLD Commission hidden successfully");
        
        //Unhide Commission
        await pages.officeCommissionsDetailPage.clickClearButton();
        await pages.officeCommissionsDetailPage.toggleIncludeHiddenCommissions('YES');
        await pages.officeCommissionsDetailPage.searchLoadId(loadId);
        let loadIdVisible = await pages.officeCommissionsDetailPage.verifyLoadIdVisible(loadId);
        expect(loadIdVisible).toBeTruthy();
        
        await pages.officeCommissionsDetailPage.selectCommissionCheckbox(loadId);
        await pages.officeCommissionsDetailPage.clickHideButton();
        expect(await pages.officeCommissionsDetailPage.isSuccessMessageVisible()).toBeTruthy();
        loadIdVisible = await pages.officeCommissionsDetailPage.verifyLoadIdVisible(loadId);
        expect(loadIdVisible).toBeTruthy();
        pages.logger.info("ON HOLD Commission unhidden successfully");
    });
    /**
     * Case Id: COMM-25231
     * Commission Detail Report - Set ON HOLD / Remove ON HOLD
     * @author Rohit Singh
     * @created 2025-11-28
     */
    test('Case Id: COMM-25231 - Commission Detail Report - Set ON HOLD / Remove ON HOLD', { tag: ['@commission', '@tporegression', '@smoke'] }, async () => {
        const commStatusVisible = await pages.officeCommissionsDetailPage.verifyCommStatus(loadId, COMMISSION_AUDIT_STATUS.HOLD);
        expect(commStatusVisible).toBeTruthy();
        //Remove Hold Commission
        await pages.officeCommissionsDetailPage.selectCommissionCheckbox(loadId);
        await pages.officeCommissionsDetailPage.clickHoldUnholdButton();
        await pages.officeCommissionsDetailPage.confirmHoldUnholdAction("Test Remove Hold Commission");
        const isSuccessVisible = await pages.officeCommissionsDetailPage.isSuccessMessageVisible();
        expect(isSuccessVisible).toBeTruthy();
        const commStatusVisibleAfter = await pages.officeCommissionsDetailPage.verifyCommStatus(loadId, COMMISSION_AUDIT_STATUS.OPEN);
        expect(commStatusVisibleAfter).toBeTruthy();
        pages.logger.info("ON HOLD Commission removed successfully");
    });
    /**
     * Case Id: COMM-25222
     * Office Commission Summary Report - Basic Report Functionality
     * @author Rohit Singh
     * @created 2025-11-28
     */
    test('Case Id: COMM-25222 - Office Commission Summary Report - Basic Report Functionality', { tag: ['@commission', '@tporegression', '@smoke'] }, async () => {
        const testCaseID = "COMM-25222";
        testData = dataConfig.getTestDataFromCsv(dataConfig.commissionData, testCaseID);

        await pages.basePage.clickHomeButton();
        await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
        await pages.basePage.clickSubHeaderByText(FINANCE_SUB_MENU.PAYABLES);
        // Click office commission summary
        await pages.accountsPayablePage.clickOfficeCommsionSummary();
        pages.logger.info("Office Commission Summary page loaded completely");

        await pages.officeCommissionsSummaryPage.selectDateAsToday();
        await pages.officeCommissionsSummaryPage.selectAgentOffice(testData.agentOffice);
        await pages.officeCommissionsSummaryPage.clickOnSearch();

        const isCheckboxVisible = await pages.officeCommissionsSummaryPage.verifyCommissionCheckboxVisible(testData.agentOffice);
        expect(isCheckboxVisible).toBeTruthy();
        pages.logger.info("Office Commission Summary Report - Basic Report Functionality verified successfully");
    });
    test('Case Id: COMM-25223 - Office Commission Summary Report - Approve Commission Batch', { tag: ['@commission', '@tporegression', '@smoke'] }, async () => {
        const testCaseID = "COMM-25223";
        testData = dataConfig.getTestDataFromCsv(dataConfig.commissionData, testCaseID);
        await pages.officeCommissionsSummaryPage.selectCommissionCheckbox(testData.agentOffice);
        await pages.officeCommissionsSummaryPage.clickOnApproveButton();
        const message = await pages.officeCommissionsSummaryPage.getCheckboxProcessedMessage();
        console.log('Approve message:', message);
        expect.soft(message).toMatch(/^Successfully approved (?:\d+ )?commissions?!$/);
        pages.logger.info("Office Commission Summary Report - Approve Commission Batch verified successfully");
    });
    test('Case Id: COMM-25224 - Office Commission Summary Report - Unapprove Commission Batch', { tag: ['@commission', '@tporegression', '@smoke'] }, async () => {
        const testCaseID = "COMM-25224";
        testData = dataConfig.getTestDataFromCsv(dataConfig.commissionData, testCaseID);
        await pages.officeCommissionsSummaryPage.selectCommissionCheckbox(testData.agentOffice);
        await pages.officeCommissionsSummaryPage.clickOnUnapproveButton();
        const message = await pages.officeCommissionsSummaryPage.getCheckboxProcessedMessage();
        console.log('Unapprove message:', message);
        expect.soft(message).toMatch(/^Successfully unapproved (?:\d+ )?commissions?!$/);
        pages.logger.info("Office Commission Summary Report - Unapprove Commission Batch verified successfully");
    });
    test('Case Id: COMM-25225 - Office Commission Summary Report - Post Commission Batch', { tag: ['@commission', '@tporegression', '@smoke'] }, async () => {
        const testCaseID = "COMM-25225";
        testData = dataConfig.getTestDataFromCsv(dataConfig.commissionData, testCaseID);
        await pages.officeCommissionsSummaryPage.selectCommissionCheckbox(testData.agentOffice);
        await pages.officeCommissionsSummaryPage.clickOnApproveButton();
        const message = await pages.officeCommissionsSummaryPage.getCheckboxProcessedMessage();
        console.log('Approve message:', message);
        expect.soft(message).toMatch(/^Successfully approved (?:\d+ )?commissions?!$/);
        pages.logger.info("Office Commission Summary Report - Approve Commission Batch verified successfully");
        // Post Commission Batch
        await pages.officeCommissionsSummaryPage.selectCommissionCheckbox(testData.agentOffice);
        await pages.officeCommissionsSummaryPage.clickOnProcessCommission();
        await pages.officeCommissionsSummaryPage.clickOnSubmitCommission();
        await pages.officeCommissionsSummaryPage.validateBatchIdAndCommission();
        expect(test.info().errors.length).toBe(0);
        pages.logger.info("Successfully validated batch ID and commission processing results");
    });

    test.afterAll(async () => {
        try {
            if (page) {
                await page.close();
                pages.logger.info("Commission detail report tests - Page closed successfully");
            }
        } catch (error) {
            pages.logger.warn("Commission detail report tests - Cleanup warning:", error);
        }
    });
});
