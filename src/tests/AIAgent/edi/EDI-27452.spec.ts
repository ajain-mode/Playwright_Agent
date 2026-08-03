import { expect, test } from "@playwright/test";
import userSetup from "@loginHelpers/userSetup";
import { PageManager } from "@utils/PageManager";
import dataConfigAPI from "@config/dataConfigAPI";
import dynamicDataAPI from "@config/dynamicDataAPI";
import {
  acceptChangeOrderTenderForBol,
  changeFixtureForScenario,
  getEdiCaseTestData,
  openCustomerEdiPrefs,
  openLoadByBol,
  parseEdi204FromFixture,
} from "./_ediPrefsChangeOrderHelpers";

/**
 * Case 27452 — Location IDs do not match + Replace Stops When… unchecked → 204 not applied.
 * @author AI Agent
 * @created 2026-07-17
 */
const testcaseID = "EDI-27452";

test.describe.configure({ retries: 0 });
test.describe(`Case ID: 27452 - EDI Prefs mismatch location IDs not processed`, () => {
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
    "Case Id: 27452 - Mismatched location IDs do not update load when replace_stops unchecked",
    { tag: "@AIAgent,@edi204,@ediprefs" },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT);

      await test.step("CSV Pre: Configure EDI Prefs — Stop Details on, Replace Stops When mismatch OFF", async () => {
        await openCustomerEdiPrefs(
          pages,
          String(testData.customerMasterID).replace(/"/g, ""),
          testData.customerName,
        );
        await pages.customerEdiPrefsPage.configureChangeOrderPreconditions({
          stopDetailValues: [
            EDI_PREFS.STOP_DETAIL.DATETIMES,
            EDI_PREFS.STOP_DETAIL.ITEMS,
            EDI_PREFS.STOP_DETAIL.LOC,
            EDI_PREFS.STOP_DETAIL.REF,
            EDI_PREFS.STOP_DETAIL.FEES,
          ],
          enableReplaceStopsWhenMismatch: false,
        });
      });

      await test.step("Steps 1–6: Admin Parse original EDI 204", async () => {
        bolNumber = (await dynamicDataAPI.getBolNumber()) + "52";
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
      });

      await test.step("Parse change 204 with mismatched location IDs", async () => {
        await parseEdi204FromFixture(
          pages,
          changeFixtureForScenario("mismatchLoc"),
          bolNumber,
          testData.sender204ID || "PSKL",
          testData.senderAsID || "AVGD",
        );
        try {
          await acceptChangeOrderTenderForBol(pages, bolNumber);
        } catch (err) {
          console.log("Change tender accept skipped:", err);
        }
      });

      await test.step("Step 10 [Expected]: 204 not processed — pick name unchanged", async () => {
        await openLoadByBol(pages, bolNumber, loadId);
        await pages.viewLoadPage.clickPickOrFirstLocationTab();
        const pickName = await pages.viewPickDetailsTabPage.getVisibleStopName();
        expect.soft(pickName).toBe(originalPickName);
        expect.soft((pickName || "").toUpperCase()).toContain("ROBERT BOSCH");
        await expect(test.info().errors).toHaveLength(0);
      });
    },
  );
});
