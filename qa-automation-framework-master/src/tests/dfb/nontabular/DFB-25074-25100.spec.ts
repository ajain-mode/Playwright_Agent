import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import userSetup from "@loginHelpers/userSetup";

test.describe.configure({ retries: 1 });
const testcaseID = 'DFB-25074-25100';
const testData = dataConfig.getTestDataFromCsv(
  dataConfig.dfbData,
  testcaseID
);

// Define load data once for reuse across all tests
const getLoadData = () => ({
  shipperName: testData.shipperName,
  consigneeName: testData.consigneeName,
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
let sharedPages: PageManager | null = null;

// Setup function for common test steps (runs only once)
async function setupTestEnvironmentOnce(pages: PageManager): Promise<PageManager> {
  if (isSetupComplete && sharedPages) {
    console.log(" Using existing setup - skipping login and navigation");
    return sharedPages;
  }

  // Login to BTMS
  await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
  console.log("BTMS Login Successful");

// Define toggleSettingsValue (set to a default or required value)
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

test.describe('Case ID: 25074-25100 - Individual Field Validation Tests for Non-Tabular Load',{tag: ['@smoke','@dfb', '@tporegression','@fieldvalidation']}, () => {
  let globalPages: PageManager | null = null;
  // Setup that runs only once for the entire test suite
  test.beforeAll(async ({ browser }) => {
    console.log(" Starting one-time setup for all field validation tests...");
    const context = await browser.newContext();
    const page = await context.newPage();
    globalPages = new PageManager(page);
    // Perform the setup once
    await setupTestEnvironmentOnce(globalPages);
    console.log(" One-time setup completed for all tests");
  });

  // Helper function to prepare for each test
  async function prepareForTest(): Promise<PageManager> {
    if (!globalPages) {
      throw new Error("Global setup not completed. Please check beforeAll hook.");
    }
    // Use the page object method for navigation
    return await globalPages.nonTabularLoadPage.prepareForTest(globalPages, testData);
  }
  test('Validate Shipper Name field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipper Name",
      loadData
    );

    console.log(`✅ Shipper Name validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipper Name: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Shipper Address field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipper Address",
      loadData
    );
    console.log(`✅ Shipper Address validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipper Address: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Shipper City field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipper city",
      loadData
    );
    console.log(`✅ Shipper City validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipper City: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Shipper State field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipper state",
      loadData
    );
    console.log(`✅ Shipper State validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipper State: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Shipper ZIP field - should show validation dialog when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipper zip",
      loadData
    );

    console.log(`✅ Shipper ZIP validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipper ZIP: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Shipper Earliest Date field - should show time validation dialog when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipper Earliest Date",
      loadData
    );
    console.log(`✅ Shipper Earliest Date validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipper Earliest Date: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Shipper Earliest Time field - should show time validation dialog when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipper Earliest Time",
      loadData
    );
    console.log(`✅ Shipper Earliest Time validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);

    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipper Earliest Time: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Shipper Latest Date field - should show time validation dialog when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipper Latest Date",
      loadData
    );
    console.log(`✅ Shipper Latest Date validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipper Latest Date: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Shipper Latest Time field - should show time validation dialog when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipper Latest Time",
      loadData
    );
    console.log(`✅ Shipper Latest Time validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);

    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipper Latest Time: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Consignee Name field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Consignee Name",
      loadData
    );
    console.log(`✅ Consignee Name validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Consignee Name: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Consignee Address field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Consignee Address",
      loadData
    );
    console.log(`✅ Consignee Address validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Consignee Address: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Consignee City field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Consignee city",
      loadData
    );
    console.log(`✅ Consignee City validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Consignee City: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Consignee State field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Consignee state",
      loadData
    );
    console.log(`✅ Consignee State validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Consignee State: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Consignee ZIP field - should show validation dialog when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Consignee zip",
      loadData
    );
    console.log(`✅ Consignee ZIP validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Consignee ZIP: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Consignee Earliest Date field - should show time validation dialog when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Consignee Earliest Time",
      loadData
    );
    console.log(`✅ Consignee Earliest Date validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Consignee Earliest Date: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Consignee Earliest Time field - should show time validation dialog when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Consignee Earliest Time",
      loadData
    );
    console.log(`✅ Consignee Earliest Time validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Consignee Earliest Time: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Consignee Latest Date field - should show time validation dialog when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Consignee Latest Date",
      loadData
    );
    console.log(`✅ Consignee Latest Date validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Consignee Latest Date: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Consignee Latest Time field - should show time validation dialog when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Consignee Latest Time",
      loadData
    );
    console.log(`✅ Consignee Latest Time validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);

    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Consignee Latest Time: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Shipment Commodity Quantity field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipment Commodity Quantity",
      loadData
    );
    console.log(`✅ Shipment Commodity Quantity validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);

    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipment Commodity Quantity: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Shipment Commodity UoM field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipment Commodity UoM",
      loadData
    );

    console.log(`✅ Shipment Commodity UoM validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);

    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipment Commodity UoM: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Shipment Commodity Description field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipment Commodity Description",
      loadData
    );

    console.log(`✅ Shipment Commodity Description validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);

    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipment Commodity Description: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Shipment Commodity Weight field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Shipment Commodity Weight",
      loadData
    );

    console.log(`✅ Shipment Commodity Weight validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);

    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Shipment Commodity Weight: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Equipment Type field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Equipment Type",
      loadData
    );

    console.log(`✅ Equipment Type validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);

    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Equipment Type: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Equipment Length field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Equipment Length",
      loadData
    );

    console.log(`✅ Equipment Length validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);

    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Equipment Length: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Distance Mileage Engine field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Distance Mileage Engine",
      loadData
    );

    console.log(`✅ Distance Mileage Engine validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);

    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Distance Mileage Engine: ${validationResult.validationMessage}`);
    }
  });

  test('Validate Distance Method field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "Distance Method",
      loadData
    );
    console.log(`✅ Distance Method validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for Distance Method: ${validationResult.validationMessage}`);
    }
  });

  test('Validate LH Rate field - should show validation message when empty', async () => {
    const pages = await prepareForTest();
    const loadData = getLoadData();
    const validationResult = await pages.nonTabularLoadPage.validateSingleMandatoryField(
      "LH Rate",
      loadData
    );
    console.log(`✅ LH Rate validation result: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(` Validation message: ${validationResult.validationMessage}`);
    if (!validationResult.isValid) {
      throw new Error(`Validation failed for LH Rate: ${validationResult.validationMessage}`);
    }
  });
})
