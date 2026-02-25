import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import datHelpers from "@utils/datUtils/datHelpers";

const testcaseID = 'DAT-61568';
const testData = dataConfig.getTestDataFromCsv(
  dataConfig.datData,
  testcaseID
);

test.describe.configure({ retries: 1 });
test.describe.serial('Verify visibility and options of DAT Contact Preference field when DAT Load Board Post Method is set to API', { tag: ['@at_dat', '@high'] }, () => {

  test('Case ID:61568-Verify visibility and options of DAT Contact Preference field when DAT Load Board Post Method is set to API', async ({ page }) => {
    const pages = new PageManager(page);
    await test.step(`Login BTMS`, async () => {
      await pages.btmsLoginPage.BTMSLogin(userSetup.datUser);
    });

    await test.step("Configuring DAT Office prerequisites", async () => {
      await datHelpers.setupOfficePreConditionsDAT(
        pages,
        testData.officeName
      );
      pages.logger.info("DAT Office prerequisites configured successfully");
    });

    await pages.viewOfficeInfoPage.clickEditButton();
    await pages.editOfficeInfoPage.navigateToThirdPartyCredentials();

    if (await pages.editOfficeInfoPage.isTranscoreDATEnabledSelected()) {
      pages.logger.info('Transcore DAT is already Enabled');
    } else {
      await pages.editOfficeInfoPage.ensureTranscoreDATEnabled();
      pages.logger.info('Transcore DAT has been set to Enabled');
    }
    await test.step(`Set DAT Load Board Post Method to API and save changes`, async () => {
      await pages.editOfficeInfoPage.checkAndSetDatPostMethod(DAT_POST_METHOD.API);
      pages.logger.info(`DAT Post Method set to API`);
    });
    await pages.editOfficeInfoPage.clickSaveButton();
    await pages.basePage.clickHomeButton();
    await test.step(`Navigate to Customer Search page under Customer menu`, async () => {
      await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
      await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
      await pages.searchCustomerPage.enterCustomerName(testData.customerName);
      await pages.searchCustomerPage.clickOnSearchCustomer();
      await pages.searchCustomerPage.selectCustomerByName(testData.customerName);
      await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LOAD_TL);
      pages.logger.info(`Navigated to Create New Load Page`);
    });

    await test.step(`Verify DAT Contact Preference field's visibility and options`, async () => {
      await pages.editLoadLoadTabPage.verifyDatContactPreference();
      pages.logger.info(`DAT Contact Preference field is visible with correct dropdown options when DAT Post Method is set to API`);
    });

  });
});