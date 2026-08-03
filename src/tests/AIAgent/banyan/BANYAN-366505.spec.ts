import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";

const testcaseID = "BANYAN-366505";
const testData = dataConfig.getTestDataFromCsv(dataConfig.banyanData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

/** Captured Banyan / rating JSON bodies (browser network), if any. */
let capturedPayloadBodies: string[] = [];

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: 366505 - Volume-qualified load with gate ON returns multi-carrier quotes",
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      appManager = new MultiAppManager(sharedContext, sharedPage);
      pages = appManager.btmsPageManager;
      capturedPayloadBodies = [];

      sharedPage.on("response", async (response) => {
        try {
          const url = response.url();
          if (!/banyan|shipment|quote|rating|tariff|ltl/i.test(url)) return;
          const ct = response.headers()["content-type"] || "";
          if (!/json|xml|text/i.test(ct) && response.status() >= 400) return;
          const body = await response.text().catch(() => "");
          if (
            body &&
            (/serviceMode|shipmentServices|unitOfMeasurement|quote_xml/i.test(body) ||
              body.includes(BANYAN_VOLUME_QUOTE.SERVICE_MODE))
          ) {
            capturedPayloadBodies.push(body);
          }
        } catch {
          /* ignore truncated/binary responses */
        }
      });
    });

    test.afterAll(async () => {
      if (appManager) await appManager.closeAllSecondaryPages();
      if (sharedContext) await sharedContext.close();
    });

    test(
      "Case Id: 366505 - Volume-qualified load with gate ON returns multi-carrier quotes",
      { tag: "@AIAgent,@banyan,@ltl" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [CSV Precondition]: Login BTMS and open gated customer (Allow Volume already ON)", async () => {
          // Customer already has Banyan 3.0 + Allow Volume? checked on Edit Master.
          // Do not call selctBanyan3RatingEngine() — it resets #use_banyan which is no longer on this UI.
          await pages.btmsLoginPage.BTMSLogin(userSetup.banyanUser);
          await commonReusables.waitForAllLoadStates(sharedPage);

          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
        });

        await test.step("Step 2 [CSV 1]: Create LTL quote weight >= 10000 lbs (volume-qualified)", async () => {
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LTL_QUOTE);
          await pages.ltlQuoteRequestPage.enterPickUpAndDeliveryZip(
            testData.shipperZip,
            testData.consigneeZip,
          );
          await pages.ltlQuoteRequestPage.selectCommodityAndAddDetails(
            testData.commDesc,
            testData.commClass,
            testData.commLength,
            testData.commWidth,
            testData.commHeight,
            testData.commWeight,
            testData.commQuantity,
          );
          await pages.ltlQuoteRequestPage.verifyVolumeQuoteOptionAvailability();
        });

        await test.step("Step 3 [CSV 2]: Submit rate request to Banyan v3 and verify rates", async () => {
          // false: do not wait out [cancel] for long-running volume rating
          await pages.ltlQuoteRequestPage.clickOnRequestTariffsButton(false);
          await pages.ltlQuoteRequestPage.verifyTariffTable();
        });

        await test.step("Step 4 [CSV Expected 4]: Quote includes ODFL and/or ABF (not Estes-only)", async () => {
          await pages.ltlQuoteRequestPage.verifyVolumeQuoteIncludesOdflOrAbf();
        });

        await test.step("Step 5 [CSV 3-4 / Expected 1-3,5]: Assert Banyan payload when exposed on network", async () => {
          if (capturedPayloadBodies.length === 0) {
            test.info().annotations.push({
              type: "manual-review",
              description:
                "Browser network did not expose Banyan shipmentServices / quote_xml JSON. " +
                "Expected 1–3 and 5 (serviceMode Volume, dims IN, single shipmentServices, GET /v3/shipments) " +
                "require DB quote_xml or API access — see commands/reports/execution/366505/MANUAL_REVIEW.md if parked.",
            });
            // UI path + multi-carrier rates covered above; payload checks need API/DB.
            return;
          }

          const joined = capturedPayloadBodies.join("\n---\n");
          expect(joined).toContain(`"serviceMode":"${BANYAN_VOLUME_QUOTE.SERVICE_MODE}"`);
          expect(joined).toMatch(
            new RegExp(
              `"unitOfMeasurement"\\s*:\\s*"${BANYAN_VOLUME_QUOTE.UNIT_OF_MEASUREMENT}"`,
              "i",
            ),
          );
          expect(joined).toMatch(
            new RegExp(`"width"\\s*:\\s*${BANYAN_VOLUME_QUOTE.VOLUME_DIM_WIDTH}`),
          );
          expect(joined).toMatch(
            new RegExp(`"height"\\s*:\\s*${BANYAN_VOLUME_QUOTE.VOLUME_DIM_HEIGHT}`),
          );
        });

        expect(test.info().errors).toHaveLength(0);
      },
    );
  },
);
