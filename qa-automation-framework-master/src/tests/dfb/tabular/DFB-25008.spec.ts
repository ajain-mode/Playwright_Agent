import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import commonReusables from "@utils/commonReusables";
import userSetup from "@loginHelpers/userSetup";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

const testcaseID = "DFB-25008";
const testData = dataConfig.getTestDataFromCsv(
  dataConfig.dfbData,
  testcaseID
);
test.describe.configure({ retries: 1 });
test.describe("Date and Time Validation Tests for Load Creation @tabular", () => {
  let pages: PageManager;
  let testPage: any;

  test.beforeAll(async ({ browser }) => {
    testPage = await browser.newPage();
    pages = new PageManager(testPage);

    await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
    await pages.dfbHelpers.setupDFBTestPreConditions(
      pages,
      testData.officeName,
      pages.toggleSettings.enable_DME,
      pages.toggleSettings.verifyDME,
      testData.salesAgent,
      testData.customerName,
      CARGO_VALUES.DEFAULT,
      LOAD_TYPES.NEW_LOAD_TL,
      true,// ← Skip post automation rule
      true
    );
    await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
  });

  test(
    "Case Id: 25008 - Verify error when Shipper's Actual Date is later than Consignee's Actual Date",
    { tag: "@dfb,@tporegression,@fieldvalidation,@smoke" },
    async () => {
      await test.step("Setup Carrier Tab", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.editLoadCarrierTabPage.enterCompleteCarrierTabDetails(
          testData.equipmentType,
          testData.trailerLength
        );
      });

      await test.step("Setup Pick Tab with later actual date", async () => {
        await pages.editLoadPage.clickOnTab(TABS.PICK);
        await pages.editLoadPickTabPage.enterPickTabDetails(
          testData.shipperName,
          commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
          testData.shipperEarliestTime,
          commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
          testData.shipperLatestTime,
          testData.shipmentCommodityQty,
          testData.shipmentCommodityUoM,
          testData.shipmentCommodityDescription,
          testData.shipmentCommodityWeight
        );

        console.log(
          `Shipper's Actual Date set to: ${
            commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow
          }`
        );
      });

      await test.step("Setup Drop Tab with earlier actual date", async () => {
        await pages.editLoadPage.clickOnTab(TABS.DROP);
        await pages.editLoadDropTabPage.enterCompleteDropTabDetails(
          testData.consigneeName,
          commonReusables.getNextTwoDatesFormatted().tomorrow,
          testData.consigneeEarliestTime,
          commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
          testData.consigneeLatestTime
        );

        console.log(
          `Consignee's Actual Date set to: ${
            commonReusables.getNextTwoDatesFormatted().tomorrow
          }`
        );
      });

      await test.step("Verify date validation error message", async () => {
        await Promise.all([
          pages.commonReusables.validateAlert(
            testPage,
            ALERT_PATTERNS.PICKUP_DELIVERY_DATE_ORDER_ERROR
          ),
          pages.editLoadLoadTabPage.clickCreateLoadButton(),
        ]);

        console.log("✅ Date validation completed successfully");
      });
    }
  );
});
