import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";

//test.describe.configure({ retries: 1 });
const testcaseID = 'DFB-25067';
const testData = dataConfig.getTestDataFromCsv(
  dataConfig.dfbData,
  testcaseID
);

test.describe('Case ID: 25067 - Verify that a load is created and displayed in edit mode having the expected results specified', { tag: ['@smoke','@dfb','@tporegression','@greenscreen'] }, () => {
  test('Create a Non Tabular load for Canadian location with specific Cargo Value with Green Screen Validation, confidence level below 76', async ({ page }) => {
    const pages = new PageManager(page);
    let cargoValue: string;
    const toggleSettingsValue = pages.toggleSettings.dme_greeenScreen_enabled
    
    // Login to BTMS
    await test.step('Login BTMS', async () => {
      await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
    });
     const skipUpdateGreenScreenfield = false; // Set to true if you want to skip updating the Green Screen field
          await test.step("Pre-Conditions setup for creating a load", async () => {
            cargoValue = await pages.dfbHelpers.setupDFBTestPreConditions(
              pages,
              testData.officeName,
              toggleSettingsValue,
              pages.toggleSettings.allEnabled, // ← Now passed as argument
              testData.salesAgent,
              testData.customerName,
              CARGO_VALUES.FROM_10001_TO_100000,
              LOAD_TYPES.CREATE_TL_NEW,
              true,
              skipUpdateGreenScreenfield
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
    });

  await test.step("Verify default field values and placeholders after creating a load in edit mode", async () => {
     
      await pages.nonTabularLoadPage.clickCreateLoadButton();
      await pages.editLoadPage.validateEditLoadHeadingText();
      pages.logger.info(
        "Load created successfully and navigated to Edit Load page"
      );
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      await pages.dfbLoadFormPage.performCompleteLoadValidationGreenScreen(cargoValue);
      const confidenceValue = await pages.dfbLoadFormPage.getGreenScreenConfidenceLevelValue();
      console.log(`Green Screen Confidence Level (number): ${confidenceValue}`);
      await pages.dfbLoadFormPage.verifyGreenScreenConfidenceLevelBelow76(confidenceValue);
    });
  });

});
