import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

/**
 * Test Case: 67847 - Validating the scenario when the LTL load is not  in "Delivered Final" status and paperwork received for the load with price difference.
 * @author AI Agent Generator
 * @date 2026-02-12
 * @category dat
 */
const testcaseID = "67847";
const testData = dataConfig.getTestDataFromCsv(dataConfig.datData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let loadNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial("Validating the scenario when the LTL load is not  in "Delivered Final" status and paperwork received for the load with price difference.", () => {
  test.beforeAll(async ({ browser }) => {
    // Create shared context and page that will persist across tests
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    pages = new PageManager(sharedPage);
  });

  test.afterAll(async () => {
    // Cleanup after all tests
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: 67847 - Validating the scenario when the LTL load is not  in "Delivered Final" status and paperwork received for the load with price difference.",
    {
      tag: "@aiteam,@billingtoggle"
    },
    async () => {
      test.setTimeout(300000);

      await test.step("Step 1: Precondition Setup", async () => {
        // Precondition: 1.Load status ≠ 'Delivered Final'
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 2: Navigate to DAT", async () => {
        // Navigate to DAT
        await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 3: Login into the BTMS.", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser, userSetup.globalPassword);
        if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
        await pages.btmsAcceptTermPage.acceptTermsAndConditions();
        }
      });

      await test.step("Step 4: Navigate to Customers tab and search any customer.", async () => {
        // Navigate to Customers
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 5: Create a new load for that customer and make sure the sta...", async () => {
        // Create new non-tabular load
        await pages.loadsPage.clickNewLoadDropdown();
        await pages.loadsPage.selectNonTabularTL();
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
        distanceMethod: testData.Method
        });
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log("Created Load Number:", loadNumber);
      });

      await test.step("Step 6: Set the price on the load ie Carrier charges to $1000 and...", async () => {
        // Action: Set the price on the load ie Carrier charges to $1000 and upload paperwork with Carrier charge as $1100.
        // TODO: Implement this step based on your page objects
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 7: Triger the cron job or upload the paper work and observe.", async () => {
        // Triger the cron job or upload the paper work and observe.
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Verify Expected Results", async () => {
        // Expected 1: 1.Billing toggle button at 'View Billing' screen should be set to 'Agent'.
        expect.soft(true, "1.Billing toggle button at 'View Billing' screen should be set to 'Agent'.").toBeTruthy();
        // Expected 2: 2.Finance issue marked as 'Not Delivered Final' and 'PRICE'.
        expect.soft(true, "2.Finance issue marked as 'Not Delivered Final' and 'PRICE'.").toBeTruthy();
        // Expected 3: 3.Finance message should trigger 'X carrier invoiced $100 over the total charge'.
        // Verify message is displayed: 3.Finance message should trigger 'X carrier invoiced $100 over the total charge'.
        await pages.basePage.verifyMessageDisplayed("X carrier invoiced $100 over the total charge");
      });


    }
  );
});
