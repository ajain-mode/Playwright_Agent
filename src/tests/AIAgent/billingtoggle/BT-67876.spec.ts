import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import type { AgentAuthRolesExpectation } from "@pages/admin/agent/AgentInfoPage";
import commonReusables from "@utils/commonReusables";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commissionHelper from "@utils/commissionUtils/commissionHelper";
import ViewLoadPage from "@pages/loads/viewLoadPage/ViewLoadPage";

const testcaseID = "BT-67876";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-67876 - Agent user billing toggle on non-invoiced Delivered Final load",
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
      "Case Id: BT-67876 - Validating agent user billing toggle on Delivered Final load (not Invoiced/Posted)",
      { tag: "@aiagent,@at_billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [67876 1-5]: Login to BTMS and switch to billing toggle user", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
          await pages.homePage.clickSwitchAccountButton();
          await pages.agentAccountsPage.clickOnUserNameIfVisible(USER_ROLES.BILLINGTOGGLE_USER);
        });

        await test.step("Step 2 [67876 6-14]: Office NY OFFIC — ensure Invoice Process is Central", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
          await pages.officePage.officeCodeSearchField(testData.officeName);
          await pages.officePage.searchButtonClick();
          await pages.officePage.officeSearchRow(testData.officeName);
          await pages.officePage.ensureInvoiceProcess(INVOICE_PROCESS.CENTRAL);
        });

        await test.step("Step 3 [67876 15-17]: Agent Search MATT BROWN — open Agent Info page", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
          await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
          await pages.agentSearchPage.nameInputOnAgentPage(AGENT_SEARCH_NAME);
          await pages.agentSearchPage.clickOnSearchButton();
          await pages.agentSearchPage.selectAgentByName(AGENT_SEARCH_NAME);
          await commonReusables.waitForPageStable(sharedPage);
        });

        const AGENT_AUTH_ROLES_EXPECTATION: AgentAuthRolesExpectation = {
          authLevel: AGENT_AUTH_LEVEL.MANAGER,
          requiredRoles: [
            AGENT_USER_ROLES.BTMS_USER,
            AGENT_USER_ROLES.PRINCIPAL,
          ],
          forbiddenRoles: [
            AGENT_USER_ROLES.ADMIN,
            AGENT_USER_ROLES.SYSTEM_ADMIN,
          ],
        };

        await test.step(
          "Step 3 [67876 18-23]: Ensure agent auth/roles — verify MANAGER, BTMS_USER, PRINCIPAL",
          async () => {
            await pages.agentInfoPage.ensureAgentAuthAndRoles(
              pages.agentEditPage,
              AGENT_AUTH_ROLES_EXPECTATION,
              { pages, loginUser: userSetup.globalUser },
            );
            await pages.agentInfoPage.validateAuthLevel(
              AGENT_AUTH_LEVEL.MANAGER,
              "CSV 18: Auth Level must be MANAGER",
            );
            await pages.agentInfoPage.validateDisplayedUserRoles({
              requiredRoles: AGENT_AUTH_ROLES_EXPECTATION.requiredRoles,
              forbiddenRoles: AGENT_AUTH_ROLES_EXPECTATION.forbiddenRoles,
            });
          }
        );

        await test.step("Step 4 [67876 24-26]: Switch user to MATT BROWN (NY OFFIC) - 1752", async () => {
          await pages.adminPage.hoverAndClickAdminMenu();
          await pages.adminPage.switchUser(testData.salesAgent);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        // Step 5 originally searched Loads for an existing DELIVERED FINAL load and opened it.
        // That doesn't work: a load with no active finance issue has nothing driving its toggle
        // away from Neutral, so a manual move in Steps 6-8 doesn't persist past their reloads —
        // and none of the DELIVERED FINAL loads found in search (checked 15 of them) had an active
        // Billing Issue (NDF specifically clears once a load reaches Delivered Final; nothing else
        // was flagged either). So build a fresh load with a price-difference overage instead — that
        // issue does NOT auto-clear on reaching Delivered Final (only clears once the overage itself
        // is resolved — see CarrierInvoice.php / AutoAdjustment.php) — then move it to Delivered Final.

        await test.step("Step 5a [67876 27]: Customer search and CREATE TL *NEW*", async () => {
          await pages.basePage.navigateToBaseUrl();
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await commissionHelper.updateAvailableCreditOnCustomer(sharedPage);
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step("Step 5b [67876 27]: Fill Enter New Load", async () => {
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
            // Consignee delivery must already be in the past for the price/NDF finance-issue
            // calculation to run at all (see BT-67847 / FD-35847 — LoadDocuments::isDeliveryDatePassed).
            shipperPickupDaysAgo: 3,
            consigneeDeliveryDaysAgo: 1,
          });

          await pages.editLoadFormPage.selectMileageEngine(testData.mileageEngine);
          await pages.editLoadFormPage.selectMileageMethod(testData.Method);
        });

        await test.step("Step 5c [67876 27]: Create load, Carrier offer, Save to BOOKED", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();
          await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          await pages.editLoadPage.validateEditLoadHeadingText();

          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
          // Not a Quickpay/factored carrier (e.g. ZONA TRUCKING LLC) — those get routed to a
          // `tcheks` Quickpay request instead of a normal invoice, so no price-difference finance
          // issue is ever computed (see BT-67847). XPO TRANS INC works.
          await pages.editLoadCarrierTabPage.selectCarrier1(CARRIER_ID.CARRIER_XPO_TRANS);

          const bookedAlert = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
          );
          await pages.editLoadFormPage.clickOnSaveBtn();
          await bookedAlert;
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 5d [67876 27]: View Load — Edit — DISPATCHED and carrier flat rate", async () => {
          await pages.viewLoadPage.clickEditButton();
          await commonReusables.waitForPageStable(sharedPage);

          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.editLoadFormPage.selectLoadStatus(LOAD_STATUS.DISPATCHED);

          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
          await pages.editLoadFormPage.clickOnSaveBtn();
          await commonReusables.waitForPageStable(sharedPage);
        });

        await test.step("Step 5e [67876 27]: View Billing — upload carrier invoice with price overage", async () => {
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

          await pages.viewLoadPage.submitDocumentUploadWithOptionalInvoiceAlert();
          await pages.viewLoadPage.closeDocumentUploadDialogSafe();

          await pages.commonReusables.reloadAndAcceptDialogs(sharedPage, WAIT.SMALL);
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();
          const priceDifferenceChecked = await pages.loadBillingPage.isPriceDifferenceChecked();
          expect(priceDifferenceChecked, "Price Difference issue must be active before continuing").toBe(true);
        });

        await test.step("Step 5f [67876 27-29]: Move load to DELIVERED FINAL, reopen View Billing", async () => {
          // clickEditButton()'s Edit control only exists on the View Load toolbar, not View
          // Billing (where Step 5e left off). Clicking "View Load" from View Billing may open a
          // new tab rather than navigating sharedPage itself — resolveViewLoadPageAfterBillingClick
          // (already proven in BT-67847 Step 10) returns whichever page actually hosts View Load.
          const viewWorkPage = await ViewLoadPage.resolveViewLoadPageAfterBillingClick(sharedPage);
          const openedNewTab = viewWorkPage !== sharedPage;
          const vl = new PageManager(viewWorkPage);

          await vl.viewLoadPage.clickEditButton();
          await commonReusables.waitForPageStable(viewWorkPage);

          await vl.editLoadPage.clickOnTab(TABS.LOAD);
          await vl.editLoadFormPage.selectLoadStatus(LOAD_STATUS.DELIVERED_FINAL);
          await vl.editLoadFormPage.clickOnSaveBtn();
          await commonReusables.waitForPageStable(viewWorkPage);

          if (openedNewTab) {
            await viewWorkPage.close();
            await pages.commonReusables.reloadAndAcceptDialogs(sharedPage, WAIT.SMALL);
          } else {
            // Same-tab case: sharedPage now shows View Load (post-save) — go back to View Billing.
            await pages.viewLoadPage.clickViewBillingButton();
          }
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();

          const priceDifferenceStillChecked = await pages.loadBillingPage.isPriceDifferenceChecked();
          expect(
            priceDifferenceStillChecked,
            "Price Difference issue must still be active after moving to Delivered Final"
          ).toBe(true);
        });

        await test.step(
          "Step 6 [67876 30 + Expected]: Move towards Agent — hard assert Agent",
          async () => {
            const currentToggle = await pages.loadBillingPage.getBillingToggleValue();
            if (currentToggle === PAYABLE_TOGGLE_VALUE.AGENT) {
              pages.logger.info(
                "CSV 30: toggle already Agent — skip move, hard assert Agent"
              );
            } else {
              await pages.loadBillingPage.setAndAssertBillingIssuesToggle(
                PAYABLE_TOGGLE_VALUE.AGENT
              );
            }
            const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
            expect(billingToggle, "Expected after 30: Billing toggle set to Agent").toBe(
              PAYABLE_TOGGLE_VALUE.AGENT
            );
          }
        );

        await test.step(
          "Step 7 [67876 31 + Expected]: Refresh, move towards Billing — hard assert Billing",
          async () => {
            await pages.loadBillingPage.reloadBillingPageAndWaitForToggleBlock();
            await pages.loadBillingPage.setAndAssertBillingIssuesToggle(
              PAYABLE_TOGGLE_VALUE.BILLING
            );
            const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
            expect(billingToggle, "Expected after 31: Billing toggle set to Billing").toBe(
              PAYABLE_TOGGLE_VALUE.BILLING
            );
          }
        );

        await test.step(
          "Step 8 [67876 32 + Expected]: Refresh, attempt Neutral — toggle must NOT be Neutral",
          async () => {
            await pages.loadBillingPage.reloadBillingPageAndWaitForToggleBlock();
            try {
              await pages.loadBillingPage.setBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.NEUTRAL);
            } catch {
              pages.logger.info("Neutral toggle move blocked or did not apply (expected for agent user)");
            }
            const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
            expect(
              billingToggle,
              "Expected after 32: Billing toggle must NOT be Neutral"
            ).not.toBe(PAYABLE_TOGGLE_VALUE.NEUTRAL);
            expect(
              [PAYABLE_TOGGLE_VALUE.BILLING, PAYABLE_TOGGLE_VALUE.AGENT],
              "Expected after 32: toggle remains Billing or Agent"
            ).toContain(billingToggle);
          }
        );
      }
    );
  }
);
