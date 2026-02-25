import { Page, test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import {
  carrierRequiredFields,
  pickRequiredFields,
  consigneeRequiredFields,
} from "@utils/dfbUtils/dfbFieldValidationConfig";
import dataConfig from "@config/dataConfig";

const testcaseID = "DFB-24971-24994";

let pages: PageManager;
let testPage: any;
let testData: any; // Declare testData here to be accessible in all tests
test.describe.configure({ retries: 1 });
test.describe("Case Id: 24971 to 24994 - Required field alert validations on Create Load", () => {
  test.beforeAll(async ({ browser }) => {
    // Move CSV lookup inside the test hook to avoid module-level execution
    testData = dataConfig.getTestDataFromCsv(
      dataConfig.dfbData,
      testcaseID
    );
    
    testPage = await browser.newPage();
    pages = new PageManager(testPage);
    await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
    // Skip post automation rule check
    await pages.dfbHelpers.setupDFBTestPreConditions(
      pages,
      testData.officeName,
      pages.toggleSettings.enable_DME,
      pages.toggleSettings.verifyDME,
      testData.salesAgent,
      testData.customerName,
      CARGO_VALUES.DEFAULT,
      LOAD_TYPES.NEW_LOAD_TL,
      true, // ← Skip post automation rule
      true,
    );
    await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
  });

  for (const field of pickRequiredFields) {
    test(`Pick tab: should show alert when "${field.name}" is blank`,{ tag: "@dfb,@tporegression,@smoke,@fieldvalidation" }, async () => {
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      await pages.editLoadValidationFieldPage.enterCompleteCarrierDetails(
        testData.equipmentType,
        testData.trailerLength,
        testData.miles
      );
      await pages.editLoadPage.clickOnTab(TABS.PICK);
      await pages.editLoadTabularFieldHelpers.fillPickTabWithOneBlank(
        pages,
        testData, // ← Pass testData parameter
        field.blankIndex
      );
      await pages.editLoadPage.clickOnTab(TABS.DROP);
      await pages.editLoadValidationFieldPage.enterCompleteConsigneeTabDetailsManualAddress(
        testData.consigneeName,
        testData.consigneeAddress,
        testData.consigneeCity,
        testData.consigneeState,
        testData.consigneeZip,
        pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
        testData.consigneeEarliestTime,
        pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
        testData.consigneeLatestTime
      );
      const alertShown =
        await pages.requiredFieldAlertValidator.validateRequiredFieldAlert(
          testPage,
          () => pages.editLoadLoadTabPage.clickCreateLoadButton(),
          field
        );
      if (alertShown === false) {
        await pages.editLoadPage.validateEditLoadHeadingText();
        await pages.dfbHelpers.reloadAndNavigateToNewLoad(
          pages,
          testPage,
          testData
        );
      }
    });
  }

  for (const field of consigneeRequiredFields) {
    test(`Consignee tab: should show alert when "${field.name}" is blank`,{ tag: "@dfb,@tporegression,@smoke, @fieldvalidation" }, async () => {
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      await pages.editLoadValidationFieldPage.enterCompleteCarrierDetails(
        testData.equipmentType,
        testData.trailerLength,
        testData.miles
      );
      await pages.editLoadPage.clickOnTab(TABS.PICK);
      await pages.editLoadValidationFieldPage.enterCompletePickTabDetailsManualAddress(
        testData.shipperName,
        testData.shipperAddress,
        testData.shipperCity,
        testData.shipperState,
        testData.shipperZip,
        pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
        testData.shipperEarliestTime,
        pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
        testData.shipperLatestTime,
        testData.shipmentCommodityQty,
        testData.shipmentCommodityUoM,
        testData.shipmentCommodityDescription,
        testData.shipmentCommodityWeight
      );
      await pages.editLoadPage.clickOnTab(TABS.DROP);
      await pages.editLoadTabularFieldHelpers.fillConsigneeTabWithOneBlank(
        pages,
        testData, // ← Pass testData parameter
        field.blankIndex
      );
      const alertShown =
        await pages.requiredFieldAlertValidator.validateRequiredFieldAlert(
          testPage,
          () => pages.editLoadLoadTabPage.clickCreateLoadButton(),
          field
        );
      if (!alertShown) {
        await pages.editLoadPage.validateEditLoadHeadingText();
        await pages.dfbHelpers.reloadAndNavigateToNewLoad(
          pages,
          testPage,
          testData
        );
      }
    });
  }

  for (const field of carrierRequiredFields) {
    test(`Carrier tab: should show alert when "${field.name}" is blank`,{ tag: "@dfb,@tporegression,@smoke,@fieldvalidation" }, async () => {
      await pages.editLoadPage.clickOnTab(TABS.PICK);
      await pages.editLoadValidationFieldPage.enterCompletePickTabDetailsManualAddress(
        testData.shipperName,
        testData.shipperAddress,
        testData.shipperCity,
        testData.shipperState,
        testData.consigneeZip,
        pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
        testData.shipperEarliestTime,
        pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
        testData.shipperLatestTime,
        testData.shipmentCommodityQty,
        testData.shipmentCommodityUoM,
        testData.shipmentCommodityDescription,
        testData.shipmentCommodityWeight
      );
      await pages.editLoadPage.clickOnTab(TABS.DROP);
      await pages.editLoadValidationFieldPage.enterCompleteConsigneeTabDetailsManualAddress(
        testData.consigneeName,
        testData.consigneeAddress,
        testData.consigneeCity,
        testData.consigneeState,
        testData.consigneeZip,
        pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
        testData.consigneeEarliestTime,
        pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
        testData.consigneeLatestTime
      );
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      await pages.editLoadTabularFieldHelpers.fillCarrierTabWithOneBlank(
        pages,
        testData, // ← Pass testData parameter
        field.blankIndex
      );
      const alertShown =
        await pages.requiredFieldAlertValidator.validateRequiredFieldAlert(
          testPage,
          () => pages.editLoadLoadTabPage.clickCreateLoadButton(),
          field
        );
      if (!alertShown) {
        await pages.editLoadPage.validateEditLoadHeadingText();
        await pages.dfbHelpers.reloadAndNavigateToNewLoad(
          pages,
          testPage,
          testData
        );
      }
    });
  }
});