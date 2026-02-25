import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import test, { expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";

const testcaseID = 'EDI-25183';
const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
test.describe.configure({ retries: 2 });
test.describe('Editing/Saving "Auto-Send EDI Events"', { tag: ['@at_edi', '@tporegression', '@smoke'] }, () => {
    test('Case Id: 25183 - Editing/Saving “Auto-Send EDI Events” field on the customer agent form', async ({ page }) => {
        const pages = new PageManager(page);
        await pages.btmsLoginPage.BTMSLogin(userSetup.ediUserMarmaxx);
        await pages.homePage.clickOnFinanceButton();
        await pages.financePage.searchCustomerIDViaFinance(testData.customerMasterID);
        await pages.searchCustomerPage.selectCustomerByName(testData.customerName);
        await pages.viewMasterCustomerPage.clickCustomerNameLink(testData.customerId);
        let viewEvents = await pages.viewCustomerPage.getAutoSendEDIEventsValue();
        await pages.viewCustomerPage.validateEventStatus(viewEvents);
        await expect(test.info().errors).toHaveLength(0);
        await console.log("Auto-Send EDI Events:", viewEvents);
        await pages.viewCustomerPage.clickEditButton();
        const editEvents = await pages.viewCustomerPage.getAutoSendEDIEventsValue();
        await pages.editCustomerPage.validateEditEventStatus(editEvents);
        await expect(test.info().errors).toHaveLength(0);
        await console.log("Edit Auto-Send EDI Events:", editEvents);
        await pages.editCustomerPage.clickSaveButton();
        viewEvents = await pages.viewCustomerPage.getAutoSendEDIEventsValue();
        await pages.viewCustomerPage.validateEventStatus(viewEvents);
        await expect(test.info().errors).toHaveLength(0);
        await console.log("Auto-Send EDI Events:", viewEvents);
    });
});