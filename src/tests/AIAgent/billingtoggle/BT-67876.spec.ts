import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import type { AgentAuthRolesExpectation } from "@pages/admin/agent/AgentInfoPage";
import commonReusables from "@utils/commonReusables";

const testcaseID = "BT-67876";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);
const AGENT_SEARCH_NAME = "MATT BROWN";

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
      { tag: "@AIAgent,@aiteam,@billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        await test.step("Step 1 [67876 1-5]: Login to BTMS as admin (global user)", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          await commonReusables.waitForAllLoadStates(sharedPage);
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

        await test.step("Step 3 [67876 18]: Verify Auth Level is MANAGER", async () => {
          const authLevel = await pages.agentInfoPage.getAuthLevel();
          expect.soft(authLevel, "CSV 18: Auth Level must be MANAGER").toBe(
            AGENT_AUTH_LEVEL.MANAGER
          );
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
          "Step 3 [67876 19]: Verify user roles BTMS_USER, PRINCIPAL — not ADMIN, SYSTEM_ADMIN",
          async () => {
            await pages.agentInfoPage.validateDisplayedUserRoles({
              requiredRoles: AGENT_AUTH_ROLES_EXPECTATION.requiredRoles,
              forbiddenRoles: AGENT_AUTH_ROLES_EXPECTATION.forbiddenRoles,
              soft: true,
            });
          }
        );

        await test.step(
          "Step 3 [67876 20-23]: Skip or correct agent when 18-19 not met — Edit, roles, Save",
          async () => {
            const preconditionsMet = await pages.agentInfoPage.isAgentAuthAndRolesMet(
              AGENT_AUTH_ROLES_EXPECTATION
            );
            if (preconditionsMet) {
              pages.logger.info("Steps 18-19 met — skipping steps 21-23");
              return;
            }

            pages.logger.info("Steps 18-19 not met — executing steps 21-23 (Edit, roles, Save)");
            await pages.agentInfoPage.ensureAgentAuthAndRoles(
              pages.agentEditPage,
              AGENT_AUTH_ROLES_EXPECTATION,
              { pages, loginUser: userSetup.globalUser },
            );

            const authLevel = await pages.agentInfoPage.getAuthLevel();
            expect(authLevel, "CSV 18: Auth Level must be MANAGER after correction").toBe(
              AGENT_AUTH_LEVEL.MANAGER
            );

            await pages.agentInfoPage.validateDisplayedUserRoles({
              requiredRoles: AGENT_AUTH_ROLES_EXPECTATION.requiredRoles,
              forbiddenRoles: AGENT_AUTH_ROLES_EXPECTATION.forbiddenRoles,
            });
          }
        );

        await test.step("Step 4 [67876 24-26]: Switch user to MATT BROWN (NY OFFIC) -1752", async () => {
          await pages.adminPage.hoverAndClickAdminMenu();
          await pages.adminPage.switchUser(testData.salesAgent);
          await commonReusables.waitForAllLoadStates(sharedPage);
        });

        await test.step("Step 5 [67876 27-29]: Loads Search DELIVERED FINAL — open load and View Billing", async () => {
          await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
          await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
          await pages.allLoadsSearchPage.selectLoadStatus(LOAD_STATUS.DELIVERED_FINAL);
          await pages.allLoadsSearchPage.clickSearchButton();
          await pages.allLoadsSearchPage.clickFirstLoadDetailRow();
          await pages.viewLoadPage.clickViewBillingButton();
          await pages.loadBillingPage.scrollBillingIssuesBlockIntoView();
        });

        await test.step("Step 6 [67876 30 + Expected]: Move billing toggle to Agent — hard assert Agent", async () => {
          await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.AGENT);
          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          expect(billingToggle, "Expected after 30: Billing toggle set to Agent").toBe(
            PAYABLE_TOGGLE_VALUE.AGENT
          );
        });

        await test.step("Step 7 [67876 31 + Expected]: Refresh, move toggle to Billing — hard assert Billing", async () => {
          await pages.loadBillingPage.reloadBillingPageAndWaitForToggleBlock();
          await pages.loadBillingPage.setAndAssertBillingIssuesToggle(PAYABLE_TOGGLE_VALUE.BILLING);
          const billingToggle = await pages.loadBillingPage.getBillingToggleValue();
          expect(billingToggle, "Expected after 31: Billing toggle set to Billing").toBe(
            PAYABLE_TOGGLE_VALUE.BILLING
          );
        });

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
