import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import "@utils/globalConstants";

/**
 * Case 349979 — Persistence when Pay Commission set to NO.
 * Source: enriched_test_cases_5_expectedresult.csv / FD-44421.
 * Locators: officeform.php — #pay_commission / td.fn "Pay Commission".
 * @author AI Agent
 * @created 2026-08-03
 * @category custom
 */
const testcaseID = "TC-349979";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 0 });
test.describe.serial(
  "Case ID: TC-349979 - Persistence when Pay Commission set to NO",
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
      `Case Id: ${testcaseID} - Pay Commission persists as NO after save`,
      { tag: "@AIAgent,@offices,@reports" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT);

        await test.step("Step 1: Login BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        });

        await test.step("Step 2-3: Admin → Office Search → open office", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await pages.officePage.officeSearchRow(testData.officeName);
        });

        await test.step("Step 4 [Expected]: Pay Commission field present; default/view NO", async () => {
          await pages.officePage.assertPayCommissionFieldVisible();
          const viewValue = await pages.officePage.getPayCommissionViewValue();
          expect(viewValue).toBe(OFFICE_PAY_COMMISSIONS.OPTION_NO);
        });

        await test.step("CSV Persistence: set Pay Commission = NO, Save, reopen, still NO", async () => {
          await pages.officePage.setPayCommissionAndSave(
            OFFICE_PAY_COMMISSIONS.OPTION_NO,
          );

          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await pages.officePage.officeSearchRow(testData.officeName);

          await pages.officePage.assertPayCommissionFieldVisible();
          const persisted = await pages.officePage.getPayCommissionViewValue();
          expect(persisted).toBe(OFFICE_PAY_COMMISSIONS.OPTION_NO);
        });
      },
    );
  },
);
