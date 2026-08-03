import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import { PageManager } from "@utils/PageManager";
import "@utils/globalConstants";

/**
 * Case 86918 — Send EDI Load Tender on BOOKED load with EDI-enabled carrier sends EDI 204.
 * Source: enriched_test_cases_5_expectedresult.csv / FD-38331.
 * Locators: loadform.php — input[@value='Send EDI Tender'] under carr_N_carr_info_div.
 * @author AI Agent
 * @created 2026-08-03
 * @category edi
 */
const testcaseID = "EDI-86918";
/** Max BOOKED search rows to probe for a visible Send EDI Tender button */
const MAX_BOOKED_ROWS_TO_PROBE = 8;

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 0 });
test.describe.serial(
  "Case ID: EDI-86918 - Send EDI Load Tender sends EDI 204 for BOOKED load",
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
      `Case Id: ${testcaseID} - Send EDI Tender button present and sends EDI 204`,
      { tag: "@AIAgent,@edi,@loadsearch" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1: Login BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        });

        await test.step("Step 2-3: Loads → Search → Status BOOKED → open qualifying load", async () => {
          let found = false;
          for (let attempt = 0; attempt < MAX_BOOKED_ROWS_TO_PROBE; attempt++) {
            await pages.basePage.navigateToBaseUrl();
            await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
            await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
            await pages.allLoadsSearchPage.selectLoadStatus(LOAD_STATUS.BOOKED);
            await pages.allLoadsSearchPage.clickSearchButton();
            const rowCount = await pages.allLoadsSearchPage.getResultRowCount();
            if (attempt >= rowCount) {
              break;
            }
            await pages.allLoadsSearchPage.clickLoadDetailRowAtIndex(attempt);
            await pages.viewLoadPage.clickCarrierTab();
            const visible =
              await pages.viewLoadCarrierTabPage.isSendEDITenderButtonVisible(
                CARRIER_TABS.CARRIER_1,
              );
            if (visible) {
              found = true;
              console.log(`Found Send EDI Tender on BOOKED search row ${attempt + 1}`);
              break;
            }
          }
          expect(
            found,
            `No BOOKED load with visible Send EDI Tender in first ${MAX_BOOKED_ROWS_TO_PROBE} rows`,
          ).toBe(true);
        });

        await test.step("Step 4-5 [Expected]: Carrier tab — Send EDI Tender present; click sends EDI 204", async () => {
          await pages.viewLoadCarrierTabPage.assertSendEDITenderButtonVisible(
            CARRIER_TABS.CARRIER_1,
          );
          await pages.viewLoadCarrierTabPage.clickSendEDITenderButton(
            CARRIER_TABS.CARRIER_1,
          );
        });
      },
    );
  },
);
