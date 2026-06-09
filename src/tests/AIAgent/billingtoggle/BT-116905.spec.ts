import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";
import {
  BtmsDbClient,
  formatDbToggleDateForLog,
  isDbToggleDateEmpty,
  uiToggleDateMatchesDb,
} from "@utils/db/BtmsDbClient";

const testcaseID = "BT-116905";
dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;
let loadId = "";

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-116905 - Validate initial_billing_toggle_date captures first toggle movement",
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
      "Case Id: BT-116905 - Validate initial_billing_toggle_date captures first toggle movement",
      { tag: "@AIAgent,@aiteam,@billingtoggle,@loadsearch" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [116905 1-5]: Login to BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 2 [116905 6]: Hover Loads and click Search", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
          await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 3 [116905 7-8]: Select BOOKED status and click Search", async () => {
          await pages.allLoadsSearchPage.selectLoadStatus(LOAD_STATUS.BOOKED);
          await pages.allLoadsSearchPage.clickSearchButton();
        });

        await test.step("Step 4 [116905 9]: Click load row with empty BILLING ACTIVITY", async () => {
          await pages.allLoadsSearchPage.clickLoadDetailRowWithEmptyBillingActivity();
        });

        await test.step("Step 5 [116905 10]: Extract loadId and open View Billing", async () => {
          loadId = await pages.viewLoadPage.getLoadID();
          expect(loadId, "Expected: Load ID extracted from View Load heading").toBeTruthy();
          await pages.viewLoadPage.clickViewBillingButton();
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();
        });

        await test.step(
          "Step 6 [116905 11 + Expected before toggle]: Initial and Current Toggle Date N/A in UI",
          async () => {
            const initialDate = await pages.loadBillingPage.getInitialToggleDateDisplayValue();
            const currentDate = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();
            expect(initialDate, "Expected: Initial Toggle Date displays N/A").toBe(
              TOGGLE_DATE_DISPLAY.NOT_APPLICABLE
            );
            expect(currentDate, "Expected: Current Toggle Date displays N/A").toBe(
              TOGGLE_DATE_DISPLAY.NOT_APPLICABLE
            );
          }
        );

        await test.step(
          "Step 7 [116905 12-13 + Expected]: DB — initial_billing_toggle_date and last_finance_contact_date NULL",
          async () => {
            const db = new BtmsDbClient();
            await db.connect();
            try {
              const row = await db.getLoadToggleDates(loadId);
              expect(
                isDbToggleDateEmpty(row.initial_billing_toggle_date),
                `Expected: initial_billing_toggle_date NULL (got ${formatDbToggleDateForLog(row.initial_billing_toggle_date)})`
              ).toBe(true);
              expect(
                isDbToggleDateEmpty(row.last_finance_contact_date),
                `Expected: last_finance_contact_date NULL (got ${formatDbToggleDateForLog(row.last_finance_contact_date)})`
              ).toBe(true);
            } finally {
              await db.disconnect();
            }
          }
        );

        await test.step(
          "Step 8 [116905 14 + Expected after first move]: Move toggle, refresh, UI dates populated",
          async () => {
            await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.BILLING);
            await pages.loadBillingPage.reloadBillingPageAndWaitForToggleBlock();

            const uiInitial = await pages.loadBillingPage.getInitialToggleDateDisplayValue();
            const uiCurrent = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();
            expect(uiInitial, "Expected: Initial Toggle Date set after first toggle move").not.toBe(
              TOGGLE_DATE_DISPLAY.NOT_APPLICABLE
            );
            expect(uiCurrent, "Expected: Current Toggle Date set after first toggle move").not.toBe(
              TOGGLE_DATE_DISPLAY.NOT_APPLICABLE
            );
          }
        );

        await test.step(
          "Step 9 [116905 15-16 + Expected]: DB dates populated and match UI after first toggle move",
          async () => {
            const uiInitial = await pages.loadBillingPage.getInitialToggleDateDisplayValue();
            const uiCurrent = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();

            const db = new BtmsDbClient();
            await db.connect();
            try {
              const row = await db.getLoadToggleDates(loadId);
              expect(
                isDbToggleDateEmpty(row.initial_billing_toggle_date),
                "Expected: initial_billing_toggle_date populated after first toggle move"
              ).toBe(false);
              expect(
                isDbToggleDateEmpty(row.last_finance_contact_date),
                "Expected: last_finance_contact_date populated after first toggle move"
              ).toBe(false);
              expect(
                uiToggleDateMatchesDb(uiInitial, row.initial_billing_toggle_date, TOGGLE_DATE_DISPLAY.NOT_APPLICABLE),
                "Expected: UI Initial Toggle Date matches DB initial_billing_toggle_date"
              ).toBe(true);
              expect(
                uiToggleDateMatchesDb(uiCurrent, row.last_finance_contact_date, TOGGLE_DATE_DISPLAY.NOT_APPLICABLE),
                "Expected: UI Current Toggle Date matches DB last_finance_contact_date"
              ).toBe(true);
              expect(
                formatDbToggleDateForLog(row.initial_billing_toggle_date),
                "Expected: initial and current DB dates equal on first toggle movement"
              ).toBe(formatDbToggleDateForLog(row.last_finance_contact_date));
            } finally {
              await db.disconnect();
            }
          }
        );
      }
    );
  }
);
