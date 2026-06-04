import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import BillingQueuePage from "@pages/finance/BillingQueuePage";
import commonReusables from "@utils/commonReusables";

const testcaseID = "BT-116910";
dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-116910 - Verify Billing Queue filters for Initial and Agent Toggle Date",
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
      "Case Id: BT-116910 - Verify Billing Queue filters for Initial and Agent Toggle Date",
      { tag: "@AIAgent,@aiteam,@billingtoggle,@loadsearch" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [116910 1-5]: Login to BTMS and switch to billing toggle user", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
        });

        await test.step("Step 2 [116910 6]: Hover Finance and click Billing Queue", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
          await pages.basePage.clickSubHeaderByText(FINANCE_SUB_MENU.BILLING_QUEUE);
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 3 [Expected after 116910 7]: Initial Toggle Date and Agent Toggle Date filters available", async () => {
          const initialFilterVisible = await pages.billingQueuePage.isFilterDateLabelVisible(
            BILLING_QUEUE_FILTER_LABELS.INITIAL_TOGGLE
          );
          expect(
            initialFilterVisible,
            `Expected: ${BILLING_QUEUE_FILTER_LABELS.INITIAL_TOGGLE} Date filter visible`
          ).toBe(true);

          const agentFilterVisible = await pages.billingQueuePage.isFilterDateLabelVisible(
            BILLING_QUEUE_FILTER_LABELS.AGENT_TOGGLE
          );
          expect(
            agentFilterVisible,
            `Expected: ${BILLING_QUEUE_FILTER_LABELS.AGENT_TOGGLE} Date filter visible`
          ).toBe(true);
        });

        let initialToggleDateRange = { start: "", end: "" };

        await test.step("Step 4 [116910 8]: Initial Toggle Date filter — Presets Last Week; save dates", async () => {
          initialToggleDateRange = await pages.billingQueuePage.selectDateFilterPreset(
            BillingQueuePage.DATE_FILTER_PREFIX.INITIAL_TOGGLE,
            DATE_PRESET.LAST_WEEK
          );
          expect(initialToggleDateRange.start, "Expected: Initial Toggle Date start saved").not.toBe("");
          expect(initialToggleDateRange.end, "Expected: Initial Toggle Date end saved").not.toBe("");
        });

        await test.step("Step 5 [116910 9]: Click Search", async () => {
          await pages.billingQueuePage.clickSearch();
        });

        await test.step("Step 6 [Expected after 116910 10]: Rows displayed; dates within Initial Toggle Date range", async () => {
          const rowCount = await pages.billingQueuePage.getResultsRowCount();
          expect(rowCount, "Expected: Billing Queue rows displayed").toBeGreaterThan(0);

          await pages.billingQueuePage.expectColumnDatesWithinRange(
            [new RegExp(BILLING_QUEUE_COLUMNS.INITIAL_TOGGLE_DATE, "i")],
            initialToggleDateRange.start,
            initialToggleDateRange.end
          );
        });

        let agentToggleDateRange = { start: "", end: "" };

        await test.step("Step 7 [116910 11]: Repeat Billing Queue nav; Agent Toggle Date filter — Presets Last Week", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
          await pages.basePage.clickSubHeaderByText(FINANCE_SUB_MENU.BILLING_QUEUE);
          await commonReusables.waitForPageStable(sharedPage);

          agentToggleDateRange = await pages.billingQueuePage.selectDateFilterPreset(
            BillingQueuePage.DATE_FILTER_PREFIX.AGENT_TOGGLE,
            DATE_PRESET.LAST_WEEK
          );
          expect(agentToggleDateRange.start, "Expected: Agent Toggle Date start saved").not.toBe("");
          expect(agentToggleDateRange.end, "Expected: Agent Toggle Date end saved").not.toBe("");
        });

        await test.step("Step 8 [116910 12]: Repeat Search and verify rows displayed", async () => {
          await pages.billingQueuePage.clickSearch();
          const rowCount = await pages.billingQueuePage.getResultsRowCount();
          expect(rowCount, "Expected: Billing Queue rows displayed after Agent Toggle filter").toBeGreaterThan(0);
        });

        await test.step("Step 9 [Expected after 116910 12]: Records within Agent Toggle Date range", async () => {
          await pages.billingQueuePage.expectColumnDatesWithinRange(
            [new RegExp(BILLING_QUEUE_COLUMNS.AGENT_TOGGLE_DATE, "i"), /CURRENT TOGGLE DATE/i],
            agentToggleDateRange.start,
            agentToggleDateRange.end
          );
        });
      }
    );
  }
);
