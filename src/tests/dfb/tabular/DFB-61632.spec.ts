import { test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import dfbCrossAppValidator from "@utils/dfbUtils/dfbCrossAppValidation";
import { PageManager } from "@utils/PageManager";
const testcaseID = "DFB-61632";
let cargoValue: string;
let loadNumber: string;
let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let pages: PageManager;
let testData: any;
let totalMiles: string;
test.describe.configure({ retries: 1 });
test.describe("Complete E2E Load Creation and TNX Posting Flow", () => {
  test.beforeAll(async ({ browser }) => {
    // Load test data inside beforeAll to avoid module-level execution
    testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

    // Create shared context and page that will persist across the test
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    appManager = new MultiAppManager(sharedContext, sharedPage);
    pages = appManager.btmsPageManager;
  });
  test.afterAll(async () => {
    // Cleanup after test
    if (appManager) {
      await appManager.closeAllSecondaryPages();
    }
    if (sharedContext) {
      await sharedContext.close();
    }
  });
  test(
    "Case Id: 61632 : Complete E2E: Create Non-Tabular Load, Post to TNX, and Validate across BTMS/DME/TNX",
    { tag: "@dfb,@loadposting,@tporegression,@matchbidding,@smoke" },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT); // 10 minutes

      // Use shared appManager and pages
      const toggleSettingsValue = pages.toggleSettings.enable_DME;
      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });
      await test.step("Pre-Conditions setup for creating a load", async () => {
        cargoValue = await pages.dfbHelpers.setupDFBTestPreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.enabledAutoPost, // ← Now passed as argument
          testData.salesAgent,
          testData.customerName,
          CARGO_VALUES.DEFAULT,
          LOAD_TYPES.CREATE_TL_NEW,
          false,
          true,
        );
      });
      await test.step("Create a Non-Tabular Load", async () => {
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
      await test.step("Click on Create Load Button and verify navigation to Edit Load page", async () => {
        await pages.nonTabularLoadPage.clickCreateLoadButton();
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.editLoadPage.validateEditLoadHeadingText();
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        console.log(
          "Load created successfully and navigated to Edit Load page"
        );
      });
      await test.step("Verify default field values and placeholders after creating a load in edit mode", async () => {
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(`Load Number: ${loadNumber}`);
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.performCompleteLoadValidation(
          cargoValue,
          COUNTRY.USA
        );
      });
      // ===== CONTINUE WITH TNX POSTING FLOW =====
      // Use shared appManager and pages (already initialized in beforeAll)
      await test.step("Enter offer rate, save, and perform DFB Validation across app like DME and TNX", async () => {
      await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
      await pages.editLoadFormPage.clickOnSaveBtn();
      await pages.viewLoadPage.validateViewLoadHeading();
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      totalMiles = await pages.editLoadFormPage.getTotalMilesValue();
      await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);
      await dfbCrossAppValidator.completePostSaveAndCrossAppValidation({
        pages,
        appManager,
        sharedPage: sharedPage,
        testData,
        loadNumber,
        totalMiles,
      });
    });
     
    }
  );
});
