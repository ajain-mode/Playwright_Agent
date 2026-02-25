import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import userSetup from "@loginHelpers/userSetup";

//test.describe.configure({ retries: 1 });
const testcaseID = 'DFB-25065';
const testData = dataConfig.getTestDataFromCsv(
  dataConfig.dfbData,
  testcaseID
);

test.describe('Case ID: 25065 - User should be able to search a customer and click on Create TL NEW link', { tag: ['@smoke','@dfb','@tporegression','@greenscreen'] }, () => {
  test('Create a Non Tabular load for US location selecting Cargo Value from drop down with Green Screen Validation', async ({ page }) => {
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
              CARGO_VALUES.FROM_250001_TO_500000,
              LOAD_TYPES.CREATE_TL_NEW,
              true,
              skipUpdateGreenScreenfield
            );
          });

    await test.step("Search for an active customer that has the agent as its salesperson", async () => {
      await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
      await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
      await pages.searchCustomerPage.searchCustomerAndClickDetails(
        testData.customerName
      );
      cargoValue = await pages.viewCustomerPage.verifyAndSetCargoValue(
        CARGO_VALUES.FROM_100001_TO_250000
      );
      await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
      pages.logger.info("Customer search and load navigation successful");
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
      const dollarValuePromise = pages.editLoadFormPage.getDollarValFromAlert(ALERT_PATTERNS.OFFER_RATE_SET_BY_GREENSCREENS);
      await pages.nonTabularLoadPage.clickCreateLoadButton();
      const dollarValue = await dollarValuePromise;
      await pages.editLoadPage.validateEditLoadHeadingText();
      pages.logger.info(
        "Load created successfully and navigated to Edit Load page"
      );
      await pages.dfbLoadFormPage.validateDFBTextFieldsWithDOM(dollarValue);
      await pages.dfbLoadFormPage.performCompleteLoadValidationGreenScreen(cargoValue);
      const confidenceValue = await pages.dfbLoadFormPage.getGreenScreenConfidenceLevelValue();
      console.log(`Green Screen Confidence Level (number): ${confidenceValue}`);
      await pages.dfbLoadFormPage.assertGreenScreenConfidenceLevel(confidenceValue);
    });
  });

});
