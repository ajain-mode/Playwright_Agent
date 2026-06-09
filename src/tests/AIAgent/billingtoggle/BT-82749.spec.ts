import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commonReusables from "@utils/commonReusables";

const testcaseID = "BT-82749";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-82749 - Verify Billing Toggle switches to Agent when Missing Paperwork is marked",
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
      "Case Id: BT-82749 - Verify Billing Toggle switches to Agent when Missing Paperwork is marked",
      { tag: "@AIAgent,@aiteam,@billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [82749 1-5]: Login to BTMS", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 2 [82749 6]: Switch to SVC_TESTAUTOMATION user", async () => {
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible("SVC_TESTAUTOMATION");
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 3 [82749 7-14]: Office CORP — ensure Invoice Process is Central", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await pages.officePage.officeSearchRow(testData.officeName);
          await pages.officePage.ensureInvoiceProcess(INVOICE_PROCESS.CENTRAL);
        });

        await test.step("Step 4 [82749 15-19]: Customer BALLOHKNEE COLDCUTS — search and CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step(
          "Step 5 [82749 20-43]: Enter New Load — BALLOHKNEE COLDCUTS, shipper ALASKA, consignee AMPORTS JACKSONVILLE",
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

        await test.step("Step 6 [82749 44-50]: Create load, Carrier tab — offer rate, ZONA, Save to BOOKED", async () => {
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

        await test.step("Step 7 [82749 51-55]: Load tab — upload Payables Carrier Invoice", async () => {
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.viewLoadPage.openDocumentUploadDialog();
          await pages.viewLoadPage.attachCarrierInvoiceFile();
          await pages.viewLoadPage.selectPayablesRadio();
          await pages.viewLoadPage.selectDocumentType(DOCUMENT_TYPE.CARRIER_INVOICE);

          const invoiceNumber = pages.commonReusables.generateRandomInvoiceNumber();
          await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNumber);
          await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);

          await pages.viewLoadPage.submitDocumentUploadWithOptionalInvoiceAlert();
          await pages.viewLoadPage.closeDocumentUploadDialogSafe();
        });

        await test.step("Step 8 [82749 56 + Expected]: Save load and open View Billing — Agent toggle and $700 message", async () => {
          await pages.editLoadFormPage.clickOnSaveBtn();
          await commonReusables.waitForPageStable(sharedPage);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await commonReusables.waitForPageStable(sharedPage);
          await pages.commonReusables.reloadAndAcceptDialogs(sharedPage, WAIT.SMALL);
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();

          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          expect(billingToggle, "Expected after 56: Billing toggle automatically set to Agent").toBe(
            PAYABLE_TOGGLE_VALUE.AGENT
          );

          const billingMsg = await pages.loadBillingPage.findBillingIssuesMessageContaining(
            ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_700_OVER_TOTAL_CHARGE
          );
          expect(
            billingMsg,
            `Expected after 56: ${ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_700_OVER_TOTAL_CHARGE}`
          ).toContain(ALERT_PATTERNS.ZONA_TRUCKING_LLC_INVOICED_700_OVER_TOTAL_CHARGE);
        });

        await test.step("Step 9 [82749 57 + Expected]: Move billing toggle towards Billing", async () => {
          await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.BILLING);
          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          expect(billingToggle, "Expected after 57: Billing toggle moves to Billing").toBe(
            PAYABLE_TOGGLE_VALUE.BILLING
          );
        });

        await test.step(
          "Step 10 [82749 58 + Expected]: Check Miscellaneous — toggle returns to Agent",
          async () => {
            if (!(await pages.loadBillingPage.isMiscellaneousChecked())) {
              await pages.loadBillingPage.clickMiscellaneousCheckbox();
            }
            expect(
              await pages.loadBillingPage.isMiscellaneousChecked(),
              "Expected: Miscellaneous checkbox checked"
            ).toBe(true);
            await commonReusables.waitForPageStable(sharedPage);

            const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
            expect(
              billingToggle,
              "Expected after 58: Billing toggle automatically set back to Agent"
            ).toBe(PAYABLE_TOGGLE_VALUE.AGENT);
          }
        );

        await test.step("Step 11 [82749 59 + Expected]: Repeat move toggle to Billing", async () => {
          await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.BILLING);
          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          expect(billingToggle, "Expected after 59: Billing toggle moves to Billing").toBe(
            PAYABLE_TOGGLE_VALUE.BILLING
          );
        });

        await test.step(
          "Step 12 [82749 60 + Expected]: Check Lumper — toggle returns to Agent",
          async () => {
            if (!(await pages.loadBillingPage.isLumperChecked())) {
              await pages.loadBillingPage.clickLumperCheckbox();
            }
            expect(await pages.loadBillingPage.isLumperChecked(), "Expected: Lumper checkbox checked").toBe(
              true
            );
            await commonReusables.waitForPageStable(sharedPage);

            const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
            expect(
              billingToggle,
              "Expected after 60: Billing toggle automatically set back to Agent"
            ).toBe(PAYABLE_TOGGLE_VALUE.AGENT);
          }
        );
      }
    );
  }
);
