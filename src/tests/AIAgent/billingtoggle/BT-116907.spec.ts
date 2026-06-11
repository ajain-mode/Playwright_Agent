import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";
import { isUiToggleDateDisplayPopulated } from "@utils/db/BtmsDbClient";

const testcaseID = "BT-116907";
dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-116907 - Validate Initial and Current Toggle Date display in BTMS UI",
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
      "Case Id: BT-116907 - Validate Initial and Current Toggle Date display in BTMS UI",
      { tag: "@AIAgent,@aiteam,@billingtoggle,@loadsearch" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [116907 1-5]: Login to BTMS and switch to billing toggle user", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
        });

        await test.step("Step 2 [116907 6]: Hover Loads and click Search", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
          await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 3 [116907 7-8]: Select BOOKED status and click Search", async () => {
          await pages.allLoadsSearchPage.selectLoadStatus(LOAD_STATUS.BOOKED);
          await pages.allLoadsSearchPage.clickSearchButton();
        });

        await test.step(
          "Step 4 [116907 9]: Click load row with empty BILLING ACTIVITY",
          async () => {
            await pages.allLoadsSearchPage.clickLoadDetailRowWithEmptyBillingActivity();
          }
        );

        await test.step("Step 5 [116907 10]: View Load — click View Billing", async () => {
          await pages.viewLoadPage.clickViewBillingButton();
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();
        });

        let initialAfterFirstMove = "";

        await test.step("Step 6 [Expected after 116907 11]: Neutral toggle; Initial and Current Toggle Date N/A", async () => {
          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          expect(billingToggle, "Expected: Billing Toggle in Neutral position").toBe(
            PAYABLE_TOGGLE_VALUE.NEUTRAL
          );

          const initialDate = await pages.loadBillingPage.getInitialToggleDateDisplayValue();
          const currentDate = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();
          expect(initialDate, "Expected: Initial Toggle Date displays N/A").toBe(
            TOGGLE_DATE_DISPLAY.NOT_APPLICABLE
          );
          expect(currentDate, "Expected: Current Toggle Date displays N/A").toBe(
            TOGGLE_DATE_DISPLAY.NOT_APPLICABLE
          );
        });

        await test.step("Step 7 [116907 12 + Expected]: Move toggle to Billing, refresh, dates updated", async () => {
          await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.BILLING);
          await pages.loadBillingPage.reloadBillingPageAndWaitForToggleBlock();

          initialAfterFirstMove = await pages.loadBillingPage.getInitialToggleDateDisplayValue();
          const currentDate = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();
          expect(
            isUiToggleDateDisplayPopulated(initialAfterFirstMove, TOGGLE_DATE_DISPLAY.NOT_APPLICABLE),
            `Expected: Initial Toggle Date MM/DD/YYYY HH:mm:ss when toggle first moved (got "${initialAfterFirstMove}")`
          ).toBe(true);
          expect(
            isUiToggleDateDisplayPopulated(currentDate, TOGGLE_DATE_DISPLAY.NOT_APPLICABLE),
            `Expected: Current Toggle Date MM/DD/YYYY HH:mm:ss when toggle moved to Billing (got "${currentDate}")`
          ).toBe(true);
        });

        await test.step("Step 8 [116907 13 + Expected]: Move toggle to Agent, refresh, Initial unchanged, Current updated", async () => {
          const currentBefore = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();

          await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.AGENT);
          await pages.loadBillingPage.reloadBillingPageAndWaitForToggleBlock();

          expect(
            await pages.loadBillingPage.getInitialToggleDateDisplayValue(),
            "Expected: Initial Toggle Date unchanged after move to Agent"
          ).toBe(initialAfterFirstMove);

          const currentAfter = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();
          expect(
            currentAfter,
            "Expected: Current Toggle Date updated when toggle moved to Agent"
          ).not.toBe(currentBefore);
          expect(
            isUiToggleDateDisplayPopulated(currentAfter, TOGGLE_DATE_DISPLAY.NOT_APPLICABLE),
            `Expected: Current Toggle Date MM/DD/YYYY HH:mm:ss after Agent move (got "${currentAfter}")`
          ).toBe(true);
        });

        await test.step("Step 9 [116907 14 + Expected]: Repeat Billing move — Initial unchanged, Current updated", async () => {
          const currentBefore = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();

          await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.BILLING);
          await pages.loadBillingPage.reloadBillingPageAndWaitForToggleBlock();

          expect(
            await pages.loadBillingPage.getInitialToggleDateDisplayValue(),
            "Expected: Initial Toggle Date unchanged after repeat Billing move"
          ).toBe(initialAfterFirstMove);

          const currentAfter = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();
          expect(
            currentAfter,
            "Expected: Current Toggle Date updated on repeat Billing move"
          ).not.toBe(currentBefore);
          expect(
            isUiToggleDateDisplayPopulated(currentAfter, TOGGLE_DATE_DISPLAY.NOT_APPLICABLE),
            `Expected: Current Toggle Date MM/DD/YYYY HH:mm:ss after repeat Billing move (got "${currentAfter}")`
          ).toBe(true);
        });

        await test.step("Step 10 [116907 15 + Expected]: Repeat Agent move — Initial unchanged, Current updated", async () => {
          const currentBefore = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();

          await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.AGENT);
          await pages.loadBillingPage.reloadBillingPageAndWaitForToggleBlock();

          expect(
            await pages.loadBillingPage.getInitialToggleDateDisplayValue(),
            "Expected: Initial Toggle Date unchanged after repeat Agent move"
          ).toBe(initialAfterFirstMove);

          const currentAfter = await pages.loadBillingPage.getCurrentToggleDateDisplayValue();
          expect(
            currentAfter,
            "Expected: Current Toggle Date updated on repeat Agent move"
          ).not.toBe(currentBefore);
          expect(
            isUiToggleDateDisplayPopulated(currentAfter, TOGGLE_DATE_DISPLAY.NOT_APPLICABLE),
            `Expected: Current Toggle Date MM/DD/YYYY HH:mm:ss after repeat Agent move (got "${currentAfter}")`
          ).toBe(true);
        });
      }
    );
  }
);
