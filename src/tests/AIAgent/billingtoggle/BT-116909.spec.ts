import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import BillingQueuePage from "@pages/finance/BillingQueuePage";
import commonReusables from "@utils/commonReusables";

const testcaseID = "BT-116909";
dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-116909 - Validate Billing Queue columns",
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      appManager = new MultiAppManager(sharedContext, sharedPage);
      pages = appManager.btmsPageManager;
    });

    test.afterAll(async () => {
      if (appManager) await appManager.closeAllSecondaryPages();
      if (sharedContext) await sharedContext.close();
    });

    test(
      "Case Id: BT-116909 - Validate Billing Queue columns",
      { tag: "@aiteam,@aiagent,@at_billingtoggle,@loadsearch" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [116909 1-5]: Login to BTMS and switch to billing toggle user", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
        });

        await test.step("Step 2 [116909 6]: Hover Finance and click Billing Queue", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
          await pages.basePage.clickSubHeaderByText(FINANCE_SUB_MENU.BILLING_QUEUE);
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 3 [116909 7]: Initial Toggle Date filter — Presets Last Week", async () => {
          await pages.billingQueuePage.selectDateFilterPreset(
            BillingQueuePage.DATE_FILTER_PREFIX.INITIAL_TOGGLE,
            DATE_PRESET.LAST_WEEK
          );
        });

        await test.step("Step 4 [116909 8]: Click Search", async () => {
          await pages.billingQueuePage.clickSearch();
        });

        await test.step("Step 5 [Expected after 116909 9]: Rows displayed; Initial, Current/Agent Toggle Date, Waiting on Billing Count column headers present", async () => {
          const rowCount = await pages.billingQueuePage.getResultsRowCount();
          expect(rowCount, "Expected: Billing Queue rows displayed").toBeGreaterThan(0);

          const initialToggleIdx = await pages.billingQueuePage.getColumnIndex([
            BILLING_QUEUE_COLUMNS.INITIAL_TOGGLE_DATE,
          ]);
          expect(
            initialToggleIdx,
            `Expected: ${BILLING_QUEUE_COLUMNS.INITIAL_TOGGLE_DATE} column header present`
          ).toBeGreaterThanOrEqual(0);

          const currentOrAgentToggleIdx = await pages.billingQueuePage.getColumnIndex([
            BILLING_QUEUE_COLUMNS.AGENT_TOGGLE_DATE,
            BILLING_QUEUE_COLUMNS.CURRENT_TOGGLE_DATE,
          ]);
          expect(
            currentOrAgentToggleIdx,
            "Expected: Current Toggle Date or Agent Toggle Date column header present"
          ).toBeGreaterThanOrEqual(0);

          const waitingOnBillingCountIdx = await pages.billingQueuePage.getColumnIndex([
            BILLING_QUEUE_COLUMNS.WAITING_ON_BILLING_COUNT,
          ]);
          expect(
            waitingOnBillingCountIdx,
            `Expected: ${BILLING_QUEUE_COLUMNS.WAITING_ON_BILLING_COUNT} column header present`
          ).toBeGreaterThanOrEqual(0);
        });
      }
    );
  }
);
