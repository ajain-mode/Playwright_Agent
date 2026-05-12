import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commonReusables from "@utils/commonReusables";
import LoadBillingPage from "@pages/loads/LoadBillingPage";
import ViewLoadPage from "@pages/loads/viewLoadPage/ViewLoadPage";
import EditLoadFormPage from "@pages/loads/editLoadPage/EditLoadFormPage";
import EditLoadPage from "@pages/loads/editLoadPage/EditLoadPage";
import EditLoadCarrierTabPage from "@pages/loads/editLoadPage/EditLoadCarrierTabPage";

const testcaseID = "BT-74454";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;
/** Tab that hosts View Load / billing after CSV 49+ (may differ from {@link sharedPage} when View Load opens in a new tab). */
let viewWorkPage: Page;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-74454 - Verify the toggle behaviour when the load status is Delivered Final and price difference is resolved.",
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      viewWorkPage = sharedPage;
      appManager = new MultiAppManager(sharedContext, sharedPage);
      pages = appManager.btmsPageManager;
    });

    test.afterAll(async () => {
      if (appManager) await appManager.closeAllSecondaryPages();
      if (sharedContext) await sharedContext.close();
    });

    test(
      "Case Id: BT-74454 - Verify the toggle behaviour when the load status is Delivered Final and price difference is resolved.",
      { tag: "@aiagent,@at_billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        /** View Load from billing may open a new tab; otherwise same tab. Then {@link ViewLoadPage.validateViewLoadHeading}. */
        const resolveViewLoadPageAfterBillingClick = async (billingHostPage: Page): Promise<Page> => {
          try {
            const [newPage] = await Promise.all([
              billingHostPage.context().waitForEvent("page", { timeout: WAIT.XLARGE }),
              new LoadBillingPage(billingHostPage).clickOnViewLoadBtn(),
            ]);
            await newPage.waitForLoadState("load");
            await new ViewLoadPage(newPage).validateViewLoadHeading();
            return newPage;
          } catch {
            await pages.commonReusables.waitForPageStable(billingHostPage);
            await new ViewLoadPage(billingHostPage).validateViewLoadHeading();
            return billingHostPage;
          }
        };

        await test.step("Step 1 [CSV 1-5]: Login and switch to BILLINGTOGGLE_USER", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 2 [CSV 6-10]: Navigate to Customer Search and open CREATE TL *NEW*", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step("Step 3 [CSV 11-34]: Fill Enter New Load and verify default rate type fields", async () => {
          const customerValue = testData["Customer Value"];
          await pages.nonTabularLoadPage.selectCustomerViaSelect2(customerValue);

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
            shipperCountry: testData.shipperCountry,
            shipperZip: testData.shipperZip,
            shipperAddress: testData.shipperAddress,
            shipperNameNew: testData.shipperNameNew,
            shipperCity: testData.shipperCity,
            shipperState: testData.shipperState,
            consigneeCountry: testData.consigneeCountry,
            consigneeZip: testData.consigneeZip,
            consigneeAddress: testData.consigneeAddress,
            consigneeCity: testData.consigneeCity,
            consigneeState: testData.consigneeState,
          });

          await pages.editLoadFormPage.selectMileageEngine(testData.mileageEngine);
          await pages.editLoadFormPage.selectMileageMethod(testData.Method);
          await pages.editLoadFormPage.enterLinehaulRate(testData.linehaulRate);

          const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
          expect.soft(linehaulDefault?.toLowerCase()).toContain(RATE_TYPE.FLAT.toLowerCase());
          const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
          expect.soft(fuelSurchargeDefault?.toLowerCase()).toContain(RATE_TYPE.FLAT.toLowerCase());
        });

        await test.step("Step 4 [CSV 35-43]: Create load, complete Carrier tab, and save to BOOKED", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkRateTypeIfPresent(testData.rateType, pages.editLoadFormPage);
          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          pages.logger.info(`Load number: ${loadNumber}`);

          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
          await pages.editLoadFormPage.enterFutureExpirationDateAndTime(7, "18:00");
          await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(testData.saleAgentEmail);
          await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
          await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_NAME.CARRIER_4);

          const bookedAlert = pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED);
          await pages.editLoadFormPage.clickOnSaveBtn();
          await bookedAlert;
        });

        await test.step("Step 5 [CSV 44-48]: View Billing, upload carrier invoice, and validate toggle/checkbox", async () => {
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await pages.commonReusables.waitForPageStable(sharedPage);

          await pages.viewLoadPage.openDocumentUploadDialog();
          await pages.viewLoadPage.attachCarrierInvoiceFile();
          await pages.viewLoadPage.selectPayablesRadio();
          await pages.viewLoadPage.selectDocumentType(DOCUMENT_TYPE.CARRIER_INVOICE);

          const invoiceNumber = pages.commonReusables.generateRandomInvoiceNumber();
          await pages.viewLoadPage.fillCarrierInvoiceNumber(invoiceNumber);
          await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);

          const invoiceAlert = pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED, 30);
          await pages.viewLoadPage.clickSubmitRemote();
          await invoiceAlert;

          await sharedPage.reload();
          await commonReusables.waitForAllLoadStates(sharedPage);
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();

          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          expect(billingToggle, "Billing toggle should be Agent after invoice upload flow").toBe(PAYABLE_TOGGLE_VALUE.AGENT);
          const notDeliveredFinalChecked = await pages.loadBillingPage.isNotDeliveredFinalChecked();
          expect(notDeliveredFinalChecked, "Not Deliv. Final should be checked after invoice upload flow").toBeTruthy();
          
        });

        await test.step(
          "Step 6 [CSV 49-53]: View Load — Load tab (exp. 49); Delivered Final (51-52); View Billing (53)",
          async () => {
          viewWorkPage = await resolveViewLoadPageAfterBillingClick(sharedPage);
          const loadBillingVl = new LoadBillingPage(viewWorkPage);
          const viewLoadVl = new ViewLoadPage(viewWorkPage);
          const editFormVl = new EditLoadFormPage(viewWorkPage);

          await test.step("CSV 49 expected: Load tab — Waiting On Agent; Not Deliv. Final + Price Difference tags", async () => {
            await viewLoadVl.clickloadTab();
            await viewLoadVl.scrollWaitingOnIntoView();
            const waitingOnOnViewLoad = await viewLoadVl.getBillingIssuesWaitingOnDisplayLabel();
            expect.soft(waitingOnOnViewLoad, "Waiting On on Load tab should be Agent").toBe(PAYABLE_TOGGLE_VALUE.AGENT);
            const notDelivFinalTagVisible = await viewLoadVl.isBillingIssuesNotDelivFinalTagSpanVisible();
            expect.soft(notDelivFinalTagVisible, "Not Deliv. Final tag should be visible on Load tab").toBe(true);
            const hasPriceDiffOnViewLoad = await viewLoadVl.isBillingIssuesPriceDifferenceTagSpanVisible();
            expect.soft(hasPriceDiffOnViewLoad, "Price Difference tag should be visible on Load tab").toBe(true);
          });

          await test.step("CSV 50-51: Open Edit; set status DELIVERED FINAL; Save (confirm alert)", async () => {
            await viewLoadVl.clickEditButton();
            await pages.commonReusables.waitForPageStable(viewWorkPage);

            await editFormVl.selectLoadStatus(LOAD_STATUS.DELIVERED_FINAL);

            const deliveredDialogs = await pages.commonReusables.acceptAllDialogsDuringAction(
              viewWorkPage,
              () => editFormVl.clickOnSaveBtn(),
              WAIT.DEFAULT
            );
            const hasDeliveredFinalConfirm = deliveredDialogs.some((msg) =>
              msg.includes(ALERT_PATTERNS.CONFIRM_CHANGE_TO_DELIVERED_FINAL)
            );
            expect(hasDeliveredFinalConfirm, "Delivered Final confirmation alert should appear").toBeTruthy();

            await pages.commonReusables.waitForPageStable(viewWorkPage);
          });

          await test.step("CSV 52 expected: Load tab — Not Deliv. Final tag absent; Price Difference tag visible", async () => {
            await viewLoadVl.clickloadTab();
            await viewLoadVl.scrollWaitingOnIntoView();
            const notDelivTagVisible = await viewLoadVl.isBillingIssuesNotDelivFinalTagSpanVisible();
            expect.soft(notDelivTagVisible, "Not Deliv. Final tag should not be available on Load tab").toBe(false);
            const priceDiffTagVisible = await viewLoadVl.isBillingIssuesPriceDifferenceTagSpanVisible();
            expect.soft(priceDiffTagVisible, "Price Difference tag should be visible on Load tab").toBe(true);
          });

          await test.step("CSV 53: View Billing — expected: Not Deliv. Final checkbox unchecked", async () => {
            await viewLoadVl.clickViewBillingButton();
            await pages.commonReusables.waitForPageStable(viewWorkPage);
            await loadBillingVl.scrollBillingIssuesBlockIntoView();

            const notDeliveredFinalNow = await loadBillingVl.isNotDeliveredFinalChecked();
            expect(
              notDeliveredFinalNow,
              "Not Deliv. Final checkbox should be unchecked on View Billing after Delivered Final"
            ).toBe(false);
          });
        });

        await test.step(
          "Step 7 [CSV 54-60]: View Load → Edit → carrier rate; assert Billing on Load tab and on View Billing",
          async () => {
            viewWorkPage = await resolveViewLoadPageAfterBillingClick(viewWorkPage);
            const loadBillingVl = new LoadBillingPage(viewWorkPage);
            const viewLoadVl = new ViewLoadPage(viewWorkPage);
            const editFormVl = new EditLoadFormPage(viewWorkPage);
            const editLoadVl = new EditLoadPage(viewWorkPage);
            const carrierTabVl = new EditLoadCarrierTabPage(viewWorkPage);

            await test.step("CSV 54-55: From View Billing open View Load, then Edit", async () => {
              await viewLoadVl.clickEditButton();
              await pages.commonReusables.waitForPageStable(viewWorkPage);
            });

            await test.step("CSV 56-58: Carrier tab — set carrier flat rate to invoice amount; Save", async () => {
              await editLoadVl.clickOnTab(TABS.CARRIER);
              await carrierTabVl.enterCarrierRate(testData.carrierInvoiceAmount1);
              await editFormVl.clickOnSaveBtn();
              await pages.commonReusables.waitForPageStable(viewWorkPage);
            });

            await test.step(
              "CSV 59 expected: View Load — Load tab — Waiting On Billing via #fi_waiting_on (ViewLoadPage)",
              async () => {
                await viewLoadVl.clickloadTab();
                await viewLoadVl.scrollWaitingOnIntoView();
                const waitingOnOnLoad = await viewLoadVl.getBillingIssuesWaitingOnDisplayLabel();
                expect(
                  waitingOnOnLoad,
                  "Waiting On on View Load Load tab should be Billing"
                ).toBe(PAYABLE_TOGGLE_VALUE.BILLING);
              }
            );

            await test.step("CSV 60 expected: View Billing — hard assert Billing toggle is Billing", async () => {
              await viewLoadVl.clickViewBillingButton();
              await pages.commonReusables.waitForPageStable(viewWorkPage);
              await loadBillingVl.scrollBillingIssuesBlockIntoView();
              const waitingOnOnBilling = await loadBillingVl.getBillingToggleValue();
              expect(
                waitingOnOnBilling,
                "Billing toggle should be Billing on View Billing page"
              ).toBe(PAYABLE_TOGGLE_VALUE.BILLING);
            });
          }
        );
      }
    );
  }
);
