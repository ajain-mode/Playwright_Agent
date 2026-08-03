import { expect, test } from "@playwright/test";
import userSetup from "@loginHelpers/userSetup";
import { PageManager } from "@utils/PageManager";
import dataConfigAPI from "@config/dataConfigAPI";
import dynamicDataAPI from "@config/dynamicDataAPI";
import {
  applyChangeOrderToLoad,
  changeFixtureForScenario,
  getEdiCaseTestData,
  openCustomerEdiPrefs,
  openLoadByBol,
  parseEdi204FromFixture,
} from "./_ediPrefsChangeOrderHelpers";

/**
 * Case 27450 — Stops (including fees & items) selected → stops fully replaced.
 * Locators: cust_edi_prefs.php + admintools.php edi_parse_204 (mono).
 * @author AI Agent
 * @created 2026-07-17
 */
const testcaseID = "EDI-27450";

test.describe.configure({ retries: 0 });
test.describe(`Case ID: 27450 - EDI Prefs stop replace (fees & items)`, () => {
  let pages: PageManager;
  let bolNumber: string;
  let loadId: string;
  let originalPickName: string;
  let testData: ReturnType<typeof getEdiCaseTestData>;

  test.beforeEach(async ({ page }) => {
    testData = getEdiCaseTestData(testcaseID);
    pages = new PageManager(page);
    await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
  });

  test(
    "Case Id: 27450 - Stops including fees & items are removed and replaced",
    { tag: "@AIAgent,@edi204,@ediprefs" },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT);

      await test.step("CSV Pre: Configure EDI Prefs — Apply change orders + Stops (including fees & items)", async () => {
        await openCustomerEdiPrefs(
          pages,
          String(testData.customerMasterID).replace(/"/g, ""),
          testData.customerName,
        );
        await pages.customerEdiPrefsPage.configureChangeOrderPreconditions({
          stopDetailValues: [EDI_PREFS.STOP_DETAIL.STOPS_INCLUDING_FEES_ITEMS],
          enableReplaceStopsWhenMismatch: true,
        });
      });

      await test.step("Steps 1–6: Admin Parse original EDI 204", async () => {
        bolNumber = (await dynamicDataAPI.getBolNumber()) + "50";
        await parseEdi204FromFixture(
          pages,
          dataConfigAPI.inboundEdi204PsklOriginal,
          bolNumber,
          testData.sender204ID || "PSKL",
          testData.senderAsID || "AVGD",
        );
      });

      await test.step("Steps 7–9: Accept tender; capture original pick name", async () => {
        loadId = await openLoadByBol(pages, bolNumber);
        await pages.viewLoadPage.clickPickOrFirstLocationTab();
        originalPickName =
          await pages.viewPickDetailsTabPage.getVisibleStopName();
        expect(originalPickName).toBeTruthy();
        console.log(`Original pick name: ${originalPickName}`);
      });

      await test.step("Parse change 204 and apply to load", async () => {
        await parseEdi204FromFixture(
          pages,
          changeFixtureForScenario("replaceStops"),
          bolNumber,
          testData.sender204ID || "PSKL",
          testData.senderAsID || "AVGD",
        );
        loadId = await applyChangeOrderToLoad(
          pages,
          bolNumber,
          loadId,
          originalPickName,
        );
      });

      await test.step("Step 10 [Expected]: Load stops removed and replaced", async () => {
        await openLoadByBol(pages, bolNumber, loadId);
        await pages.viewLoadPage.clickPickOrFirstLocationTab();
        const pickName = await pages.viewPickDetailsTabPage.getVisibleStopName();
        console.log(`Post-change pick name: ${pickName} (was ${originalPickName})`);
        expect.soft(pickName).not.toBe(originalPickName);
        expect.soft(pickName.toUpperCase()).toContain("REPLACED SHIPPER");
        await pages.viewLoadPage.clickDropOrSecondLocationTab();
        const dropName = await pages.viewDropDetailsTabPage.getVisibleStopName();
        console.log(`Post-change drop name: ${dropName}`);
        expect.soft(dropName.toUpperCase()).toContain("REPLACED CONSIGNEE");
        await expect(test.info().errors).toHaveLength(0);
      });
    },
  );
});
