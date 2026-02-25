import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";

test.describe.configure({ retries: 1 });
const testcaseID = 'DFB-25102';
const testData = dataConfig.getTestDataFromCsv(
  dataConfig.dfbData,
  testcaseID
);
const getLoadData = () => ({
  shipperName: testData.shipperName,
  consigneeName: testData.consigneeName,
  consigneeNameUS: testData.consigneeNameUS,
  consigneeNameCA: testData.consigneeNameCA,
  shipperAddress: testData.shipperAddress,
  shipperEarliestTime: testData.shipperEarliestTime,
  shipperLatestTime: testData.shipperLatestTime,
  consigneeAddress: testData.consigneeAddress,
  consigneeEarliestTime: testData.consigneeEarliestTime,
  consigneeLatestTime: testData.consigneeLatestTime,
  shipmentCommodityQty: testData.shipmentCommodityQty,
  shipmentCommodityUoM: testData.shipmentCommodityUoM,
  consigneeCity: testData.consigneeCity,
  equipmentLength: testData.equipmentLength,
  consigneeState: testData.consigneeState,
  shipperState: testData.shipperState,
  shipperCountry: testData.shipperCountry,
  consigneeZip: testData.consigneeZip,
  shipperCity: testData.shipperCity,
  shipperZip: testData.shipperZip,
  shipmentCommodityDescription: testData.shipmentCommodityDescription,
  shipmentCommodityWeight: testData.shipmentCommodityWeight,
  equipmentType: testData.equipmentType,
  length: testData.equipmentLength,
  lhRate: testData.lhRate,
  distanceMethod: testData.Method
});
// Global state to track if setup is complete
let isSetupComplete = false;
let sharedPages: any = null;
// Setup function for common test steps (runs only once)
async function setupTestEnvironmentOnce(pages: any) {
  if (isSetupComplete && sharedPages) {
    console.log(" Using existing setup - skipping login and navigation");
    return sharedPages;
  }
  // Login to BTMS
  await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
  pages.logger.info("BTMS Login Successful");
  const toggleSettingsValue = pages.toggleSettings.enable_DME;
  // Use the DFB helper for setup
  await dfbHelpers.setupDFBTestPreConditions(
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
  isSetupComplete = true;
  sharedPages = pages;
  console.log("✅ One-time setup completed successfully");
  return pages;
}

test.describe('Case ID: 25102 - Individual Field Validation Tests for Non-Tabular Load - Consignee ZIP Validation',{tag: ['@smoke','@dfb', '@tporegression','@fieldvalidation']}, () => {
  let globalPages: any = null;
  // Setup that runs only once for the entire test suite
  test.beforeAll(async ({ browser }) => {
    console.log(" Starting one-time setup for all consignee field validation tests...");
    const context = await browser.newContext();
    const page = await context.newPage();
    globalPages = new PageManager(page);
    // Perform the setup once
    await setupTestEnvironmentOnce(globalPages);
    console.log(" One-time setup completed for all consignee tests");
  });
  // Helper function to prepare for each test
  async function prepareForTest() {
    if (!globalPages) {
      throw new Error("Global setup not completed. Please check beforeAll hook.");
    }
    // Use the page object method for navigation
    return await globalPages.nonTabularLoadPage.prepareForTest(globalPages, testData);
  }
  test('Validate Invalid Consignee ZIP/Postal Code with all mandatory fields filled for US, Canada, and Mexico Locations', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    // Use a clearly invalid ZIP code for testing
    const invalidZipCode = testData.invalidZipCode || "INVALID";
    const countries = [
      { code: 'US', name: 'United States', fieldType: 'ZIP code' },
      { code: 'CA', name: 'Canada', fieldType: 'Postal Code' },
      { code: 'MX', name: 'Mexico', fieldType: 'ZIP code' }
    ];
    for (const country of countries) {
      const validationResult = await pages.nonTabularLoadPage.validateConsigneeInvalidZipCodeWithMandatoryFields(
        country.code,
        loadData
      );
      // Handle validation result logging and page reloading
      await pages.nonTabularLoadPage.handleValidationResultAndReload(
        country,
        invalidZipCode,
        validationResult,
        pages,
        testData,
        countries
      );
    }
    pages.logger.info(`\n✅ All validation tests completed successfully for US, Canada, and Mexico!`);
  });
});
