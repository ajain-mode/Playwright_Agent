import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";

const testcaseID = 'DFB-25054';
const testData = dataConfig.getTestDataFromCsv(
  dataConfig.dfbData,
  testcaseID
);

test.describe.configure({ retries: 1 });
test.describe('Case ID: 25054 - User should be able to search a customer and click on Create TL NEW link', { tag: ['@dfb', '@tporegression', '@smoke', '@fieldvalidation'] }, () => {
  test('Create a Non Tabular load for Canadian location with default cargo value', async ({ page }) => {
    const pages = new PageManager(page);
    let cargoValue: string;
    const toggleSettingsValue = pages.toggleSettings.enable_DME;
    // Login to BTMS
    await test.step('Login BTMS', async () => {
      await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
    });

    await test.step("Setup DFB Test Environment", async () => {
      cargoValue = await dfbHelpers.setupDFBTestPreConditions(
        pages,
        testData.officeName,
        toggleSettingsValue,
        pages.toggleSettings.verifyDME,
        testData.salesAgent,
        testData.customerName,
        CARGO_VALUES.DEFAULT,
        LOAD_TYPES.CREATE_TL_NEW,
        false,
        true
      );
    });

    await test.step('Create a Non-Tabular Load', async () => {
      await pages.nonTabularLoadPage.createNonTabularLoad({
        shipperValue: testData.shipperName,
        consigneeValue: testData.consigneeName,
        shipperEarliestTime: testData.shipperEarliestTime,
        shipperLatestTime: testData.shipperLatestTime,
        consigneeEarliestTime: testData.consigneeEarliestTime,
        consigneeLatestTime: testData.consigneeLatestTime,
        shipmentCommodityQty: testData.shipmentCommodityQty,
        shipmentCommodityUoM: testData.shipmentCommodityUoM,
        shipmentCommodityDescription: testData.shipmentCommodityDescription,
        shipmentCommodityWeight: testData.shipmentCommodityWeight,
        equipmentType: testData.equipmentType,
        equipmentLength: testData.equipmentLength,
        distanceMethod: testData.Method,
        shipperCountry: testData.shipperCountry,
        shipperZip: testData.shipperZip,
        shipperAddress: testData.shipperAddress,
        shipperNameNew: testData.shipperNameNew
      });
      await pages.nonTabularLoadPage.clickCreateLoadButton();
    });

    await test.step("Verify default field values and placeholders after creating a load in edit mode", async () => {
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      await pages.dfbLoadFormPage.performCompleteLoadValidation(
        cargoValue,
        COUNTRY.CANADA
      );
    });

  });
});