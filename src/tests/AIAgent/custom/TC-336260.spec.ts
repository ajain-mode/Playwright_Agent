import { BrowserContext, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import { PageManager } from "@utils/PageManager";
import "@utils/globalConstants";

/**
 * Case 336260 — Dispatch Region column on Load Summary by Account Manager report.
 * Source: enriched_test_cases_5_expectedresult.csv / FD-44489.
 * Locators: reports.php?rptname=LOSLSAM, #dispatch_region_magic, #example_wrapper table#example.
 * @author AI Agent
 * @created 2026-08-03
 * @category custom
 */
const testcaseID = "TC-336260";

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 0 });
test.describe.serial(
  "Case ID: TC-336260 - Load Summary By Account Manager Dispatch Region column",
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
      `Case Id: ${testcaseID} - Dispatch Region column is present on Load Summary by Account Manager`,
      { tag: "@AIAgent,@homereports" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT);

        await test.step("Step 1: Login BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        });

        await test.step("Step 2: Home → Reports", async () => {
          await pages.homeReportsPage.openReportsFromHome();
        });

        await test.step("Step 3: Open Load Summary by Account Manager", async () => {
          await pages.homeReportsPage.openReportByName(
            SPECIAL_ACCESS_REPORTS.LOAD_SUMMARY_BY_ACCOUNT_MANAGER,
          );
        });

        await test.step("Step 4: Dispatch Region filter visible; Search; assert column", async () => {
          await pages.homeReportsPage.assertDispatchRegionFilterVisible();
          await pages.homeReportsPage.clickSearch();
          await pages.homeReportsPage.assertResultColumnPresent(
            LOAD_SUMMARY_BY_ACCT_MGR_COLUMNS.DISPATCH_REGION,
          );
        });
      },
    );
  },
);
