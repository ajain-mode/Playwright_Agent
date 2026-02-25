import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

let cargoValue: string;
let loadNumber: string;

const testcaseID = "DFB-97780-81-84-85-90";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);
test.describe.serial("DFB - Waterfall Posting Validations", () => {
  test.describe.configure({ retries: 1 });
  let pages: PageManager;
  let testPage;

  test.beforeEach(async ({ browser }) => {
    testPage = await browser.newPage();
    pages = new PageManager(testPage);

    await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
    cargoValue = await pages.dfbHelpers.setupDFBTestPreConditions(
      pages,
      testData.officeName,
      pages.toggleSettings.enable_DME,
      pages.toggleSettings.verifyDME,
      testData.salesAgent,
      testData.customerName,
      CARGO_VALUES.DEFAULT,
      LOAD_TYPES.CREATE_TL_NEW,
      true,
      true
    );
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
      shipperNameNew: testData.shipperNameNew,
    });
    await pages.nonTabularLoadPage.clickCreateLoadButton();
    await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
    await pages.editLoadPage.validateEditLoadHeadingText();
    await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
    console.log("Load created successfully and navigated to Edit Load page");
    loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
    console.log(`Load Number: ${loadNumber}`);
    await pages.editLoadPage.clickOnTab(TABS.CARRIER);
    await pages.dfbLoadFormPage.performCompleteLoadValidation(
      cargoValue,
      COUNTRY.USA
    );
    await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
    await pages.editLoadCarrierTabPage.selectCargoValue(
      CARGO_VALUES.FROM_100001_TO_250000
    );
  });

  /**
   * Test Case: DFB-97780 - DFB - Waterfall Cargo value error for 3 carrier without waterfall offer rate
   * @author Parth Rastogi
   * @date 30-Dec-2025
   */
  test(
    "Case Id: 97780 - Should show error when Post-To-All is checked even without waterfall offer rate(3 carrier)",
    {
      tag: "@dfb,@tporegression,@smoke,@cargovalue",
    },
    async () => {
      const carriersData = [
        {
          name: CARRIER_NAME.CARRIER_1,
          values: [
            PRIORITY.PRIORITY_1,
            CARRIER_TIMING.TIMING_4,
            LOAD_OFFER_RATES.OFFER_RATE_1,
          ],
        },
        {
          name: CARRIER_NAME.CARRIER_2,
          values: [
            PRIORITY.PRIORITY_2,
            CARRIER_TIMING.TIMING_1,
            LOAD_OFFER_RATES.OFFER_RATE_2,
          ],
        },
        {
          name: CARRIER_NAME.CARRIER_3,
          values: [
            PRIORITY.PRIORITY_3,
            CARRIER_TIMING.TIMING_1,
            LOAD_OFFER_RATES.OFFER_RATE_3,
          ],
        },
      ];

      await pages.dfbHelpers.configureCarriersDataWithWaterfall(
        pages,
        carriersData,
        {
          enterWaterfallOfferRate: false,
        }
      );

      // Verify error message is displayed even with waterfall offer rate
      const errorMessage = await pages.dfbLoadFormPage.getErrorMessageText();
      console.log(`Retrieved Error Message: "${errorMessage}"`);
      expect(errorMessage).toContain(
        ALERT_PATTERNS.CARRIER_ALREADY_INCLUDED_ERROR
      );
      console.log(`✅ Error message verified: ${errorMessage}`);
    }
  );

  /**
   * Test Case: DFB-97781 - DFB - Waterfall Cargo value error for 3 carrier with waterfall offer rate
   * @author Deepak Bohra
   * @date 30-Dec-2025
   */
  test(
    "Case Id: 97781 - Should show error when Post-To-All is checked even with valid waterfall offer rate",
    {
      tag: "@dfb,@tporegression,@smoke,@cargovalue",
    },
    async () => {
      const carriersData = [
        {
          name: CARRIER_NAME.CARRIER_1,
          values: [
            PRIORITY.PRIORITY_1,
            CARRIER_TIMING.TIMING_4,
            LOAD_OFFER_RATES.OFFER_RATE_1,
          ],
        },
        {
          name: CARRIER_NAME.CARRIER_2,
          values: [
            PRIORITY.PRIORITY_2,
            CARRIER_TIMING.TIMING_1,
            LOAD_OFFER_RATES.OFFER_RATE_2,
          ],
        },
        {
          name: CARRIER_NAME.CARRIER_3,
          values: [
            PRIORITY.PRIORITY_3,
            CARRIER_TIMING.TIMING_1,
            LOAD_OFFER_RATES.OFFER_RATE_3,
          ],
        },
      ];

      await pages.dfbHelpers.configureCarriersDataWithWaterfall(
        pages,
        carriersData,
        {
          enterWaterfallOfferRate: true,
          waterfallOfferRate: TNX.OFFER_RATE,
        }
      );

      // Verify error message is displayed even with waterfall offer rate
      const errorMessage = await pages.dfbLoadFormPage.getErrorMessageText();
      console.log(`Retrieved Error Message: "${errorMessage}"`);
      expect(errorMessage).toContain(
        ALERT_PATTERNS.CARRIER_ALREADY_INCLUDED_ERROR
      );
      console.log(`✅ Error message verified: ${errorMessage}`);
    }
  );

  /**
   * Test Case: DFB-97784 - DFB - Waterfall Cargo value error for 1 carrier without waterfall offer rate
   * @author Deepak Bohra
   * @date 31-Dec-2025
   */
  test(
    "Case Id: 97784 - Should show error when Post-To-All is checked without waterfall offer rate",
    {
      tag: "@dfb,@tporegression,@smoke,@cargovalue",
    },
    async () => {
      const carriersData = [
        {
          name: CARRIER_NAME.CARRIER_1,
          values: [
            PRIORITY.PRIORITY_1,
            CARRIER_TIMING.TIMING_4,
            LOAD_OFFER_RATES.OFFER_RATE_1,
          ],
        },
      ];

      await pages.dfbHelpers.configureCarriersDataWithWaterfall(
        pages,
        carriersData,
        {
          enterWaterfallOfferRate: false, // Do NOT enter waterfall offer rate
        }
      );

      // Verify error message is displayed even with waterfall offer rate
      const errorMessage = await pages.dfbLoadFormPage.getErrorMessageText();
      console.log(`Retrieved Error Message: "${errorMessage}"`);
      expect(errorMessage).toContain(
        ALERT_PATTERNS.CARRIER_ALREADY_INCLUDED_ERROR
      );
      console.log(`✅ Error message verified: ${errorMessage}`);
    }
  );

  /**
   * Test Case: DFB-97785 - DFB - Waterfall Cargo value error for 1 carrier with waterfall offer rate
   * @author Parth Rastogi
   * @date 01-Jan-2026
   */
  test(
    "Case Id: 97785 - Should show error when Post-To-All is checked with waterfall offer rate",
    {
      tag: "@dfb,@tporegression,@smoke,@cargovalue",
    },
    async () => {
      const carriersData = [
        {
          name: CARRIER_NAME.CARRIER_1,
          values: [
            PRIORITY.PRIORITY_1,
            CARRIER_TIMING.TIMING_4,
            LOAD_OFFER_RATES.OFFER_RATE_1,
          ],
        },
      ];

      await pages.dfbHelpers.configureCarriersDataWithWaterfall(
        pages,
        carriersData,
        {
          enterWaterfallOfferRate: true,
          waterfallOfferRate: TNX.OFFER_RATE,
        }
      );

      // Verify error message is displayed even with waterfall offer rate
      const errorMessage = await pages.dfbLoadFormPage.getErrorMessageText();
      console.log(`Retrieved Error Message: "${errorMessage}"`);
      expect(errorMessage).toContain(
        ALERT_PATTERNS.CARRIER_ALREADY_INCLUDED_ERROR
      );
      console.log(`✅ Error message verified: ${errorMessage}`);
    }
  );

  /**
   * Test Case: DFB-97790 - Display an error message relating "Loads with a cargo value greater than $100,000 cannot be posted without a dedicated carrier at this time"Number of included carriers = 0
   * @author Deepak Bohra
   * @date 05-Jan-2026
   */
  test(
    'Case Id: 97790 - Display an error message relating "Loads with a cargo value greater than $100,000 cannot be posted without a dedicated carrier at this time"Number of included carriers = 0',
    {
      tag: "@dfb,@tporegression,@smoke,@cargovalue",
    },
    async () => {
      await pages.editLoadFormPage.clickOnSaveBtn();
      console.log("Load saved");
      await pages.viewLoadPage.validateViewLoadHeading();
      await pages.editLoadPage.clickOnTab(TABS.CARRIER);
      const errorMessage = await pages.dfbLoadFormPage.getErrorMessageText();
      console.log(`Retrieved Error Message: "${errorMessage}"`);
      expect(errorMessage).toContain(ALERT_PATTERNS.CARRIER_NOT_INCLUDED_ERROR);
      console.log(`✅ Error message verified: ${errorMessage}`);
    }
  );
});
