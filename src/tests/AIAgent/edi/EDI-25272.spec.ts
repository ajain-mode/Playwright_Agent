import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import "@utils/globalConstants";

/**
 * Case 25272 — Place new load on hold when 204 auto-accepted dropdown is present on customer EDI Prefs.
 * Source: enriched_test_cases_5_expectedresult.csv / FD-34366.
 * Locators: cust_edi_prefs.php select place_new_load_on_hold_when_204_auto_accepted.
 * @author AI Agent
 * @created 2026-08-03
 * @category edi
 */
const testcaseID = "EDI-25272";
const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 0 });
test.describe.serial(
  "Case ID: EDI-25272 - Verify Place new load on hold when 204 auto-accepted dropdown is added",
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      appManager = new MultiAppManager(sharedContext, sharedPage);
      pages = appManager.btmsPageManager;
    });

    test.afterAll(async () => {
      if (appManager) {
        await appManager.closeAllSecondaryPages();
      }
      if (sharedContext) {
        await sharedContext.close();
      }
    });

    test(
      "Case Id: EDI-25272 - Place new load on hold when 204 auto-accepted field is present as YES/NO dropdown",
      { tag: "@AIAgent,@customersearch,@edi" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT);

        await test.step("Step 1: Login BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        });

        await test.step("Step 2-3: Customers → Search → MARMAXX GROUP → Customer Agent", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
        });

        await test.step("Step 4-5: View Master Record → More EDI Pref's", async () => {
          await pages.viewCustomerPage.clickCustomerMasterLink();
          await pages.customerEdiPrefsPage.clickMoreEdiPrefsLink();
        });

        await test.step("Step 6 [Expected]: Field is present on EDI Preferences", async () => {
          await pages.customerEdiPrefsPage.assertPlaceNewLoadOnHoldFieldVisible();
        });

        await test.step("Step 6 [Expected]: Single-select dropdown with YES/NO; default NO", async () => {
          await pages.customerEdiPrefsPage.clickEdit();
          await pages.customerEdiPrefsPage.assertPlaceNewLoadOnHoldFieldVisible();

          const isSingleSelect =
            await pages.customerEdiPrefsPage.isPlaceNewLoadOnHoldSingleSelectDropdown();
          expect(isSingleSelect).toBe(true);

          const optionLabels =
            await pages.customerEdiPrefsPage.getPlaceNewLoadOnHoldOptionLabels();
          expect(optionLabels.map((l) => l.trim())).toEqual([
            EDI_PREFS.PLACE_NEW_LOAD_ON_HOLD.OPTION_NO,
            EDI_PREFS.PLACE_NEW_LOAD_ON_HOLD.OPTION_YES,
          ]);

          const selected =
            await pages.customerEdiPrefsPage.getPlaceNewLoadOnHoldSelectedLabel();
          expect(selected).toBe(EDI_PREFS.PLACE_NEW_LOAD_ON_HOLD.OPTION_NO);
        });
      },
    );
  },
);
