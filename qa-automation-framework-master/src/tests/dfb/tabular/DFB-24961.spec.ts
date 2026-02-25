import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

const testcaseID = "DFB-24961";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let cargoValue: string;
//test.describe.configure({ retries: 1 });
test.describe("Load form in edit mode with United States values that bypass office automation rules for @tabular.", () => {
  test(
    "Case Id: 24961 - Create a load for United States Location with default Cargo Value",
    { tag: "@dfb,@tporegression,@smoke,@greenscreen" },
    async ({ page }) => {
      const pages = new PageManager(page);
      const toggleSettingsValue = pages.toggleSettings.dme_greeenScreen_enabled;

      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });
      const skipUpdateGreenScreenfield = false; // Set to true if you want to skip updating the Green Screen field
      await test.step("Pre-Conditions setup for creating a load", async () => {
        cargoValue = await pages.dfbHelpers.setupDFBTestPreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.allEnabled,
          testData.salesAgent,
          testData.customerName,
          CARGO_VALUES.DEFAULT,
          LOAD_TYPES.NEW_LOAD_TL,
          true,
          skipUpdateGreenScreenfield
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
          pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
          testData.consigneeEarliestTime,
          pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
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
        //console.log(`Cargo Value on Carrier Tab: ${cargoValue}`);
        console.log("Carrier Tab details entered successfully");
      });

      await test.step("Verify default field values and placeholders after creating a load in edit mode", async () => {
        const dollarValuePromise = pages.editLoadFormPage.getDollarValFromAlert(
          ALERT_PATTERNS.OFFER_RATE_SET_BY_GREENSCREENS
        );
        await pages.editLoadLoadTabPage.clickCreateLoadButton();
        const dollarValue = await dollarValuePromise;
        await pages.editLoadPage.validateEditLoadHeadingText();
        console.log(
          "Load created successfully and navigated to Edit Load page"
        );
        await pages.dfbLoadFormPage.validateDFBTextFieldsWithDOM(dollarValue);
        await pages.dfbLoadFormPage.performCompleteLoadValidationGreenScreen(
          cargoValue
        );
        const confidenceValue =
          await pages.dfbLoadFormPage.getGreenScreenConfidenceLevelValue();
        console.log(
          `Green Screen Confidence Level (number): ${confidenceValue}`
        );
        await pages.dfbLoadFormPage.assertGreenScreenConfidenceLevel(
          confidenceValue
        );
      });
    }
  );
});
