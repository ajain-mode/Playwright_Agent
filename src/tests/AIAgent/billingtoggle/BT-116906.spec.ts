import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";
import {
  BtmsDbClient,
  formatDbToggleDateForLog,
  uiToggleDateMatchesDb,
} from "@utils/db/BtmsDbClient";

const testcaseID = "BT-116906";
dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;
let loadId = "";
let baselineUiInitial = "";
let baselineUiCurrent = "";
let baselineDbInitial: Date | null = null;
let baselineDbCurrent: Date | null = null;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-116906 - Verify Current Toggle Date updates correctly",
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
      "Case Id: BT-116906 - Verify Current Toggle Date updates correctly",
      { tag: "@AIAgent,@aiteam,@billingtoggle,@loadsearch" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [116906 1-5]: Login to BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 2 [116906 6]: Hover Loads and click Search", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
          await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 3 [116906 7-8]: Select BOOKED status and click Search", async () => {
          await pages.allLoadsSearchPage.selectLoadStatus(LOAD_STATUS.BOOKED);
          await pages.allLoadsSearchPage.clickSearchButton();
        });

        await test.step("Step 4 [116906 9]: Click any load detail row", async () => {
          await pages.allLoadsSearchPage.clickFirstLoadDetailRow();
        });

        await test.step("Step 5 [116906 10]: Extract loadId and open View Billing", async () => {
          loadId = await pages.viewLoadPage.getLoadID();
          expect(loadId, "Expected: Load ID extracted from View Load heading").toBeTruthy();
          await pages.viewLoadPage.clickViewBillingButton();
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();
        });

        await test.step(
          "Step 6 [116906 11]: Observe Billing Toggle, Initial Toggle Date, and Current Toggle Date",
          async () => {
            baselineUiInitial = await pages.loadBillingPage.getInitialToggleDateDisplayValue();
            baselineUiCurrent = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();
            expect(baselineUiInitial, "Expected: Initial Toggle Date visible in UI").toBeTruthy();
            expect(baselineUiCurrent, "Expected: Current Toggle Date visible in UI").toBeTruthy();
          }
        );

        await test.step(
          "Step 7 [116906 12-13 + Expected]: DB toggle dates match UI baseline",
          async () => {
            const db = new BtmsDbClient();
            await db.connect();
            try {
              const row = await db.getLoadToggleDates(loadId);
              baselineDbInitial = row.initial_billing_toggle_date;
              baselineDbCurrent = row.last_finance_contact_date;

              expect(
                uiToggleDateMatchesDb(
                  baselineUiInitial,
                  baselineDbInitial,
                  TOGGLE_DATE_DISPLAY.NOT_APPLICABLE
                ),
                "Expected: UI Initial Toggle Date matches DB initial_billing_toggle_date"
              ).toBe(true);
              expect(
                uiToggleDateMatchesDb(
                  baselineUiCurrent,
                  baselineDbCurrent,
                  TOGGLE_DATE_DISPLAY.NOT_APPLICABLE
                ),
                "Expected: UI Current Toggle Date matches DB last_finance_contact_date"
              ).toBe(true);
            } finally {
              await db.disconnect();
            }
          }
        );

        await test.step(
          "Step 8 [116906 14 + Expected after 16]: Move toggle to Billing — Initial unchanged, Current updated",
          async () => {
            await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.BILLING);
            await pages.loadBillingPage.reloadBillingPageAndWaitForToggleBlock();

            const uiInitial = await pages.loadBillingPage.getInitialToggleDateDisplayValue();
            const uiCurrent = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();

            expect(uiInitial, "Expected: Initial Toggle Date unchanged after Billing move").toBe(
              baselineUiInitial
            );
            expect(uiCurrent, "Expected: Current Toggle Date updated after Billing move").not.toBe(
              baselineUiCurrent
            );

            const db = new BtmsDbClient();
            await db.connect();
            try {
              const row = await db.getLoadToggleDates(loadId);
              expect(
                formatDbToggleDateForLog(row.initial_billing_toggle_date),
                "Expected: DB initial_billing_toggle_date unchanged after Billing move"
              ).toBe(formatDbToggleDateForLog(baselineDbInitial));
              expect(
                formatDbToggleDateForLog(row.last_finance_contact_date),
                "Expected: DB last_finance_contact_date updated after Billing move"
              ).not.toBe(formatDbToggleDateForLog(baselineDbCurrent));
              expect(
                uiToggleDateMatchesDb(uiInitial, row.initial_billing_toggle_date, TOGGLE_DATE_DISPLAY.NOT_APPLICABLE),
                "Expected: UI Initial matches DB after Billing move"
              ).toBe(true);
              expect(
                uiToggleDateMatchesDb(uiCurrent, row.last_finance_contact_date, TOGGLE_DATE_DISPLAY.NOT_APPLICABLE),
                "Expected: UI Current matches DB after Billing move"
              ).toBe(true);
              baselineDbCurrent = row.last_finance_contact_date;
            } finally {
              await db.disconnect();
            }

            baselineUiCurrent = uiCurrent;
          }
        );

        await test.step(
          "Step 9 [116906 17 + Expected after 19]: Move toggle to Agent — Initial unchanged, Current updated",
          async () => {
            const uiCurrentBefore = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();

            await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.AGENT);
            await pages.loadBillingPage.reloadBillingPageAndWaitForToggleBlock();

            const uiInitial = await pages.loadBillingPage.getInitialToggleDateDisplayValue();
            const uiCurrent = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();

            expect(uiInitial, "Expected: Initial Toggle Date unchanged after Agent move").toBe(
              baselineUiInitial
            );
            expect(uiCurrent, "Expected: Current Toggle Date updated after Agent move").not.toBe(
              uiCurrentBefore
            );

            const db = new BtmsDbClient();
            await db.connect();
            try {
              const row = await db.getLoadToggleDates(loadId);
              expect(
                formatDbToggleDateForLog(row.initial_billing_toggle_date),
                "Expected: DB initial_billing_toggle_date unchanged after Agent move"
              ).toBe(formatDbToggleDateForLog(baselineDbInitial));
              expect(
                formatDbToggleDateForLog(row.last_finance_contact_date),
                "Expected: DB last_finance_contact_date updated after Agent move"
              ).not.toBe(formatDbToggleDateForLog(baselineDbCurrent));
              expect(
                uiToggleDateMatchesDb(uiInitial, row.initial_billing_toggle_date, TOGGLE_DATE_DISPLAY.NOT_APPLICABLE),
                "Expected: UI Initial matches DB after Agent move"
              ).toBe(true);
              expect(
                uiToggleDateMatchesDb(uiCurrent, row.last_finance_contact_date, TOGGLE_DATE_DISPLAY.NOT_APPLICABLE),
                "Expected: UI Current matches DB after Agent move"
              ).toBe(true);
            } finally {
              await db.disconnect();
            }
          }
        );
      }
    );
  }
);
