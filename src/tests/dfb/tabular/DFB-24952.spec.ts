import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import commonReusables from "@utils/commonReusables";

const testcaseID = "DFB-24952";
const testData = dataConfig.getTestDataFromCsv(
  dataConfig.dfbData,
  testcaseID
);

let cargoValue: string;
test.describe.configure({ retries: 1 });
test.describe("Load form in edit mode with Canada Location  values that bypass office automation rules for @tabular form with different Cargo Value.", () => {
  test("Case Id: 24952 - Create a load for Canada Location with cargo value as FROM_10001_TO_100000",{ tag: "@dfb,@tporegression,@smoke,@fieldvalidation" }, async ({
    page,
  }) => {
    const pages = new PageManager(page);

    const toggleSettingsValue = pages.toggleSettings.enable_DME;

    await test.step("Login BTMS", async () => {
      await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
      pages.logger.info("BTMS Login Successful");
    });

    await test.step("Pre-Conditions setup for creating a load", async () => {
      cargoValue = await pages.dfbHelpers.setupDFBTestPreConditions(
        pages,
        testData.officeName,
        toggleSettingsValue,
        pages.toggleSettings.verifyDME, // ← Now passed as argument
        testData.salesAgent,
        testData.customerName,
        CARGO_VALUES.FROM_10001_TO_100000,
        LOAD_TYPES.NEW_LOAD_TL,
        false,
        true,
      );
    });

    await test.step("Enter the details for Load Tab", async () => {
      await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
      pages.logger.info("Load Tab details entered successfully");
    });

    await test.step("Enter the details for Pick Tab", async () => {
      await pages.editLoadPage.clickOnTab(TABS.PICK);
      await pages.editLoadPickTabPage.enterCompletePickTabDetails(testData);
      pages.logger.info("Pick Tab details entered successfully");
    });

    await test.step("Enter the details for Drop Tab", async () => {
      await pages.editLoadPage.clickOnTab(TABS.DROP);
      await pages.editLoadDropTabPage.enterCompleteDropTabDetails(
        testData.consigneeName,
        commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
        testData.consigneeEarliestTime,
        commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
        testData.consigneeLatestTime
      );
      pages.logger.info("Drop Tab details entered successfully");
    });

    await test.step("Enter the details for Carrier Tab", async () => {
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);

      //cargoValue =
      await pages.editLoadCarrierTabPage.enterCompleteCarrierTabDetails(
        testData.equipmentType,
        testData.trailerLength
      );
      pages.logger.info("Carrier Tab details entered successfully");
    });

    await test.step("Click on Create Load Button and verify navigation to Edit Load page", async () => {
      await pages.editLoadLoadTabPage.clickCreateLoadButton();
      await pages.editLoadPage.validateEditLoadHeadingText();
      await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
      pages.logger.info(
        "Load created successfully and navigated to Edit Load page"
      );
    });

    await test.step("Verify default field values and placeholders after creating a load in edit mode", async () => {
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      await pages.dfbLoadFormPage.performCompleteLoadValidation(
        cargoValue,
        "CA"
      );
    });
  });
});
