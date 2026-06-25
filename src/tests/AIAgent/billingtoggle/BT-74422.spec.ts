import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commonReusables from "@utils/commonReusables";

const testcaseID = "BT-74422";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  'Case ID: BT-74422 - Verify the Billing toggle behaviour when Load is "Booked - Delivered final" and billing issues are checked.',
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
      'Case Id: BT-74422 - Verify the Billing toggle behaviour when Load is "Booked - Delivered final" and billing issues are checked.',
      { tag: "@AIAgent,@aiteam,@at_billingtoggle,@loadsearch" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [74422 1-6]: Login to BTMS and switch to billing toggle user", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
        });

        await test.step("Step 2 [74422 7-14]: Office CORP — ensure Invoice Process is Central", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await pages.officePage.officeSearchRow(testData.officeName);
          await pages.officePage.ensureInvoiceProcess(INVOICE_PROCESS.CENTRAL);

          const invoiceProcess = await pages.officePage.getInvoiceProcessValue();
          expect(
            invoiceProcess.toLowerCase(),
            "Invoice Process should be Central after office setup"
          ).toBe(INVOICE_PROCESS.CENTRAL.toLowerCase());
        });

        await test.step("Step 3 [74422 15-19]: Customer BALLOHKNEE COLDCUTS — search and CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.scrollAndNavigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step(
          "Step 4 [74422 20-43]: Enter New Load — shipper ALASKA, consignee AMPORTS JACKSONVILLE, verify Flat Rate defaults",
          async () => {
            await pages.nonTabularLoadPage.selectCustomerViaSelect2(testData["Customer Value"]);
            await pages.nonTabularLoadPage.ensureEnterNewLoadSalespersonDispatcherSelection();
            await pages.nonTabularLoadPage.createNonTabularLoad({
              shipperValue: testData.shipperName,
              consigneeValue: testData.consigneeName,
              shipperEarliestTime: testData.shipperEarliestTime,
              shipperLatestTime: testData.shipperLatestTime,
              consigneeEarliestTime: testData.consigneeEarliestTime,
              consigneeLatestTime: testData.consigneeLatestTime,
              shipmentCommodityQty: testData.shipmentCommodityQty,
              shipmentCommodityUoM: testData.shipmentCommodityUoM,
              shipmentCommodityDescription: testData.shipmentCommodityDescription,
              shipmentCommodityWeight: testData.shipmentCommodityWeight,
              equipmentType: testData.equipmentType,
              equipmentLength: testData.equipmentLength,
            });

            await pages.editLoadFormPage.selectMileageEngine(testData.mileageEngine);
            await pages.editLoadFormPage.selectMileageMethod(testData.Method);

            const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
            expect(linehaulDefault?.toLowerCase(), "Expected: Linehaul default Flat Rate").toContain(
              RATE_TYPE.FLAT.toLowerCase()
            );
            const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
            expect(
              fuelSurchargeDefault?.toLowerCase(),
              "Expected: Fuel Surcharge default Flat Rate"
            ).toContain(RATE_TYPE.FLAT.toLowerCase());
          }
        );

        await test.step("Step 5 [74422 44-50]: Create load, Carrier tab — offer rate, ZONA, Save to BOOKED", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);

          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
          await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_NAME.CARRIER_4);

          const bookedAlert = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          await bookedAlert;
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 6 [74422 51]: Open View Billing", async () => {
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await commonReusables.waitForPageStable(sharedPage);
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();
        });

        await test.step(
          "Step 7 [74422 52-53 + Expected]: Check OS/D and Miscellaneous — toggle must not be Agent",
          async () => {
            await pages.loadBillingPage.ensureOsdChecked();
            await pages.loadBillingPage.ensureMiscellaneousChecked();
            await commonReusables.waitForPageStable(sharedPage);

            const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
            expect(
              billingToggle,
              "Expected after 53: Billing toggle should not be set to Agent"
            ).not.toBe(PAYABLE_TOGGLE_VALUE.AGENT);
          }
        );
      }
    );
  }
);
