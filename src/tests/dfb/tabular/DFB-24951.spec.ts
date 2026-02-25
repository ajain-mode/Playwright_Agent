import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import commonReusables from "@utils/commonReusables";
import userSetup from "@loginHelpers/userSetup";

const testcaseID = "DFB-24951";
const testData = dataConfig.getTestDataFromCsv(
  dataConfig.dfbData,
  testcaseID
);
test.describe.configure({ retries: 1 });
test.describe("Load form in edit mode with Canadian location  values that bypass office automation rules for @tabular.", () => {
  test(
    "Case Id: 24951 - Create a load for Canadian location with default Cargo Value",
    { tag: "@dfb,@smoke,@tporegression,@fieldvalidation"},
    async ({ page }) => {
      const pages = new PageManager(page);
      let cargoValue: string;
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
          pages.toggleSettings.verifyDME, // ← Now passed as argument
          testData.salesAgent,
          testData.customerName,
          CARGO_VALUES.DEFAULT,
          LOAD_TYPES.NEW_LOAD_TL,
          false,
          true,
        );
      });

      await test.step("Enter the details for Load Tab", async () => {
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        console.log("Load Tab details entered successfully");
      });

      await test.step("Enter the details for Pick Tab", async () => {
        await pages.editLoadPage.clickOnTab(TABS.PICK);
        await pages.editLoadPickTabPage.enterCompletePickTabDetails(testData);
        console.log("Pick Tab details entered successfully");
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
        console.log("Drop Tab details entered successfully");
      });

      await test.step("Enter the details for Carrier Tab", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.editLoadCarrierTabPage.enterCompleteCarrierTabDetails(
          testData.equipmentType,
          testData.trailerLength
        );
        console.log("Carrier Tab details entered successfully");
      });

      await test.step("Click on Create Load Button and verify navigation to Edit Load page", async () => {
        await pages.editLoadLoadTabPage.clickCreateLoadButton();
        await pages.editLoadPage.validateEditLoadHeadingText();
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        console.log(
          "Load created successfully and navigated to Edit Load page"
        );
      });

      await test.step("Verify default field values and placeholders after creating a load in edit mode", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.performCompleteLoadValidation(
          cargoValue,
          COUNTRY.CANADA
        );
      });
    }
  );
});
