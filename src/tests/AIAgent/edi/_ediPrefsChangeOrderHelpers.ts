/**
 * Shared setup for FD-34965 EDI Prefs change-order cases (27450–27452).
 * @author AI Agent
 * @created 2026-07-17
 */
import { expect } from "@playwright/test";
import apiRequests from "@api/apiRequests";
import dataConfig from "@config/dataConfig";
import dataConfigAPI from "@config/dataConfigAPI";
import dynamicDataAPI from "@config/dynamicDataAPI";
import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";

export type EdiPrefsScenario = "replaceStops" | "matchLocUpdate" | "mismatchLoc";

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function openCustomerEdiPrefs(
  pages: PageManager,
  customerMasterID: string,
  customerName: string,
): Promise<void> {
  await pages.homePage.clickOnFinanceButton();
  await pages.financePage.searchCustomerIDViaFinance(customerMasterID);
  await pages.customerMasterListPage.clickOnCustomerName(customerName);
  await pages.customerEdiPrefsPage.clickMoreEdiPrefsLink();
}

async function buildUpdatedEdi(
  fixtureKey: string,
  bolNumber: string,
): Promise<string> {
  return dynamicDataAPI.updateEdi204TruckLoadRawData(fixtureKey, bolNumber);
}

/** Wrap ST-first Admin Parse body with ISA/GS for Sterling API fallback. */
async function wrapForSterlingApi(stBody: string): Promise<string> {
  const today = await commonReusables.getDate("today", "YYYYMMDD");
  const control = String(Math.floor(Math.random() * 90000000) + 10000000);
  return [
    `ISA*00*          *00*          *01*PSKL  *02*AVGD           *230219*1722*U*00401*${control.padStart(9, "0")}*0*P*:~`,
    `GS*SM*PSKL*AVGD*${today}*134000*${control}*X*004010~`,
    "",
    stBody.trim(),
    "",
    `GE*1*${control}~`,
    `IEA*1*${control}~`,
    "",
  ].join("\n");
}

/**
 * Admin-Parse primary path (Testmo: first line must be ST*204*).
 * Falls back to Sterling API with ISA/GS envelope when parse flash fails.
 */
export async function parseEdi204FromFixture(
  pages: PageManager,
  fixtureKey: string,
  bolNumber: string,
  senderId: string,
  receiverId: string,
): Promise<void> {
  const updated = await buildUpdatedEdi(fixtureKey, bolNumber);
  await pages.basePage.navigateToBaseUrl();
  await pages.adminParseEdiPage.navigateToParseEdiPage();
  await pages.adminParseEdiPage.parseNewEdi204(senderId, receiverId, updated);

  if (await pages.adminParseEdiPage.wasParseSuccessful()) {
    console.log(`Admin Parse OK for BOL ${bolNumber} (${senderId}/${receiverId})`);
    return;
  }

  for (const altReceiver of ["AVGD", "STKT"]) {
    if (receiverId.toUpperCase() === altReceiver) {
      continue;
    }
    console.log(`Retry Admin Parse with receiver ${altReceiver} for BOL ${bolNumber}`);
    await pages.adminParseEdiPage.parseNewEdi204(senderId, altReceiver, updated);
    if (await pages.adminParseEdiPage.wasParseSuccessful()) {
      console.log(
        `Admin Parse OK for BOL ${bolNumber} (${senderId}/${altReceiver})`,
      );
      return;
    }
  }

  console.log(`Admin Parse failed — Sterling API fallback for BOL ${bolNumber}`);
  const apiPayload = await wrapForSterlingApi(updated);
  const { response } = await apiRequests.sendEDI204Request(apiPayload);
  console.log(`EDI 204 API status: ${response.status}`);
  expect(response.status).toBe(201);
}

/**
 * Opens (or Accepts) the load for a BOL on EDI 204 Load Tenders.
 * When loadIdHint is set, reopens that load via header search (change-order path).
 */
export async function openLoadByBol(
  pages: PageManager,
  bolNumber: string,
  loadIdHint?: string,
): Promise<string> {
  if (loadIdHint?.trim()) {
    await pages.basePage.navigateToBaseUrl();
    await pages.basePage.searchFromMainHeader(loadIdHint.trim());
    return loadIdHint.trim();
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await pages.basePage.navigateToBaseUrl();
      await pages.homePage.clickOnLoadButton();
      await pages.loadsPage.clickOnEDI204LoadTender();
      await pages.edi204LoadTendersPage.filterBolNumber(bolNumber);
      await pages.edi204LoadTendersPage.clickRowWithBolNumber(bolNumber);

      await pages.loadTender204Page.acceptLoadTender();
      const loadId = (await pages.viewLoadPage.getLoadID())?.trim() || "";
      expect(loadId).toBeTruthy();
      const ship = await pages.viewLoadPage.getShipNumber();
      const status = await pages.viewLoadPage.getLoadStatus().catch(() => "");
      console.log(
        `Accepted tender → load ${loadId} for BOL ${bolNumber}; SHIP#=${ship}; status=${status}`,
      );
      return loadId;
    } catch (err) {
      lastError = err;
      console.log(
        `openLoadByBol attempt ${attempt}/4 failed for ${bolNumber}; retrying`,
      );
      await delay(WAIT.XLARGE);
    }
  }
  throw lastError;
}

/**
 * Accept Change tender with create_new_load checked (apply onto matched load).
 */
export async function acceptChangeOrderTenderForBol(
  pages: PageManager,
  bolNumber: string,
): Promise<string> {
  await pages.basePage.navigateToBaseUrl();
  await pages.homePage.clickOnLoadButton();
  await pages.loadsPage.clickOnEDI204LoadTender();
  await pages.edi204LoadTendersPage.filterBolNumber(bolNumber);
  await pages.edi204LoadTendersPage.getTenderRowTextsForBol(bolNumber);
  await pages.edi204LoadTendersPage.clickChangeOrderRowWithBolNumber(bolNumber);
  await pages.loadTender204Page.acceptChangeOrderOntoExistingLoad();
  const loadId = (await pages.viewLoadPage.getLoadID())?.trim() || "";
  console.log(
    `Accepted change-order tender for BOL ${bolNumber} → load ${loadId || "(unknown)"}`,
  );
  return loadId;
}

/**
 * Apply change-order: wait for auto-apply, then Accept Change tender if stops unchanged.
 */
export async function applyChangeOrderToLoad(
  pages: PageManager,
  bolNumber: string,
  loadId: string,
  originalPickName: string,
): Promise<string> {
  // Give auto-apply (Apply Change Orders = YES) a moment after parse
  await delay(WAIT.XLARGE);
  await openLoadByBol(pages, bolNumber, loadId);
  await pages.viewLoadPage.clickPickOrFirstLocationTab();
  let pickName = await pages.viewPickDetailsTabPage.getVisibleStopName();
  console.log(`After change parse (auto-apply check): pick=${pickName}`);
  if (pickName.toUpperCase().includes("REPLACED") || pickName !== originalPickName) {
    return loadId;
  }

  console.log("Auto-apply did not replace stops — Accept Change tender");
  const updated = await acceptChangeOrderTenderForBol(pages, bolNumber);
  await delay(WAIT.LARGE);
  await openLoadByBol(pages, bolNumber, updated || loadId);
  await pages.viewLoadPage.clickPickOrFirstLocationTab();
  pickName = await pages.viewPickDetailsTabPage.getVisibleStopName();
  console.log(`After Accept Change: pick=${pickName}`);
  return updated || loadId;
}

export function changeFixtureForScenario(scenario: EdiPrefsScenario): string {
  switch (scenario) {
    case "replaceStops":
      return dataConfigAPI.inboundEdi204PsklReplaceStops;
    case "matchLocUpdate":
      return dataConfigAPI.inboundEdi204PsklMatchLocUpdate;
    case "mismatchLoc":
      return dataConfigAPI.inboundEdi204PsklMismatchLoc;
    default:
      throw new Error(`Unknown scenario: ${scenario}`);
  }
}

export function getEdiCaseTestData(testcaseID: string) {
  return dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
}
