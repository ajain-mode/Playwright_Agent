import { test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import dfbCrossAppValidator from "@utils/dfbUtils/dfbCrossAppValidation";
import loadCreationUtils from "@utils/dfbUtils/loadCreationUtils";
import { PageManager } from "@utils/PageManager";

const testcaseID = "DFB-61633";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let cargoValue: string;
let loadNumber: string;
let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let pages: PageManager;
let totalMiles: string;
test.describe.configure({ retries: 1 });
test.describe("Create a load and post it to TNX and validate the load status in DME and TNX applications.", () => {
  test.beforeAll(async ({ browser }) => {
    // Create shared context and page that will persist across tests
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    appManager = new MultiAppManager(sharedContext, sharedPage);
    pages = appManager.btmsPageManager;
  });

  test.afterAll(async () => {
    // Cleanup after all tests
    if (appManager) {
      await appManager.closeAllSecondaryPages();
    }
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: 61633 - Create a load  through duplicate and post it to TNX and validate the load status in DME and TNX applications.",
    { tag: "@dfb,@smoke,@loadposting,@tporegression,@matchbid" },
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
          LOAD_TYPES.NEW_LOAD_TL,
          false,
          true,
        );
      });

      await test.step("Enter all details and create load", async () => {
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.viewLoadPage.getSelectedLoadStatusText(LOAD_STATUS.ACTIVE);
        loadNumber = await loadCreationUtils.fillTabsAndCreateLoad(
          pages,
          testData
        );
        console.log(`Load Number: ${loadNumber}`);
        console.log(
          "Load created successfully and navigated to Edit Load page"
        );
      });

      await test.step("Verify default field values and placeholders after creating a load in edit mode for US Location", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.performCompleteLoadValidation(
          cargoValue,
          COUNTRY.USA
        );
      });

      await test.step("Enter offer rate, save, and validate DFB form state in view mode and create duplicate load", async () => {
        await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.viewLoadPage.validateViewLoadHeading();
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.duplicateLoadPage.clickOnDuplicateButton();
        await pages.duplicateLoadPage.selectDuplicateIconCheckBox([
          DUPLICATE_LOAD_CHECKBOX.OFFICE_INFO,
          DUPLICATE_LOAD_CHECKBOX.REFERENCES_INFO,
          DUPLICATE_LOAD_CHECKBOX.CUSTOMER_INFO,
          DUPLICATE_LOAD_CHECKBOX.STOP_INFO,
          DUPLICATE_LOAD_CHECKBOX.CARRIER_INFO,
          DUPLICATE_LOAD_CHECKBOX.VENDOR_INFO,
        ]);
        await pages.duplicateLoadPage.clickOkButton();
        await console.log("Duplicate Load created successfully");
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(`Load Number: ${loadNumber}`);
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.viewLoadPage.getSelectedLoadStatusText(LOAD_STATUS.ACTIVE);
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.performCompleteLoadValidation(
          cargoValue,
          COUNTRY.USA
        );
      });

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
