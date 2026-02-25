import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
/**
 * Test Case: 25103 - Verify that a message is displayed when a value is not
 * entered for the Email for Notifications field on the CREATE NEW ENTRY form
 *
 * @author AI Agent Generator
 * @date 2026-02-16
 * @category dfb
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * PRECONDITIONS (15 steps from test case CSV):
 *   Step 1:  Login to BTMS url (env from config.json)
 *   Step 2:  Enter credentials <username> / <password>
 *   Step 3:  Click Login button
 *   Step 4:  Hover ADMIN tab > click OFFICE SEARCH
 *   Step 5:  Enter "MS-BD" in Office Code Search > click Search
 *   Step 6:  Click on the returned data row
 *   Step 7:  User is navigated to the office form page
 *   Step 8:  Validate: Match vendors = TNX, Enable DME = YES
 *            (if mismatch → Edit, update, Save)
 *   Step 9:  Hover ADMIN tab and click it
 *   Step 10: On Switch User enter "BRENT DURHAM(TX-RED)"
 *   Step 11: Click suggestion "BRENT DURHAM(TX-RED)"
 *   Step 12: Hover HOME tab > select OFFICE CONFIG
 *   Step 13: Click POST AUTOMATION button
 *   Step 14: Search "BONDED CHEMICAL" in post automation search
 *   Step 15: If data visible → delete; if not click NEW button
 *
 * TEST STEPS (with explicit values from CSV):
 *   1. Click the New button to open the CREATE NEW ENTRY form
 *   2. On CREATE NEW ENTRY popup, enter all mandatory fields
 *      EXCEPT Email for Notifications:
 *        Customer Name:       BONDED CHEMICAL
 *        Pickup Location:     ALCHEM - MEDINA, OH (44215)
 *        Drop Location:       BLEACHTECH - PETERSBURG, VA (23805)
 *        LoadMethod/TYPE:     TL
 *        Equipment Type:      FLATBED
 *        Offer Rate:          1000 (numeric value)
 *   3. Click the Create button
 *
 * EXPECTED RESULT:
 *   A message is displayed: "Enter at least one email for notifications"
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Precondition values (from CSV test case, used across all steps) ──────────
const PRECONDITION = {
  loginUser: userSetup.globalUser,
  officeCode: "MS-BD",
  switchToUser: "BRENT DURHAM(TX-RED)",
  customerName: "BONDED CHEMICAL",
  officeSettings: {
    matchVendors: "TNX",
    enableDigitalMatchingEngine: "YES",
  },
  verifyToggleConfig: {
    "Enable Digital Matching Engine": "YES",
    "Enable TNX Bids": "NO",
    "Enable Greenscreens": "NO",
    "Enable Auto Post with Minimum Fields": "NO",
  },
} as const;

// ── Test Step values (explicit from CSV test case, used for form filling) ────
const FORM_VALUES = {
  customerName: "BONDED CHEMICAL",
  pickLocation: "ALCHEM - MEDINA, OH",
  dropLocation: "BLEACHTECH - PETERSBURG, VA",
  loadType: "TL",
  equipmentType: "FLATBED",
  offerRate: "1000",
} as const;

const EXPECTED_VALIDATION_MESSAGE =
  "Enter at least one email for notifications";

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let testPassed = true;
let failureReason = "";

test.describe.configure({ retries: 1 });
test.describe.serial(
  "25103 - Verify Email for Notifications validation on CREATE NEW ENTRY form",
  {
    tag: ["@aiteam", "@dfb", "@nontabular", "@postautomationrules", "@rulefieldvalidation"],
  },
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      pages = new PageManager(sharedPage);
    });

    test.afterAll(async () => {
      if (sharedContext) {
        await sharedContext.close();
      }
    });

    test(
      "Case Id: 25103 - Verify Email for Notifications field validation message",
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT);

        // ════════════════════════════════════════════════════════════════════
        //  PHASE 1: PRECONDITIONS (Steps 1–15 from CSV)
        // ════════════════════════════════════════════════════════════════════

        // ── Steps 1-3: Login to BTMS ─────────────────────────────────────
        await test.step(
          "Precondition Steps 1-3: Login to BTMS with valid credentials",
          async () => {
            await pages.btmsLoginPage.BTMSLogin(PRECONDITION.loginUser);
            if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
              await pages.btmsAcceptTermPage.acceptTermsAndConditions();
            }
            await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
            pages.logger.info(
              `Steps 1-3 complete: Logged in as ${PRECONDITION.loginUser}`
            );
          }
        );

        // ── Step 4: Hover ADMIN > click OFFICE SEARCH ────────────────────
        await test.step(
          "Precondition Step 4: Hover ADMIN tab > click OFFICE SEARCH",
          async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
            await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
            await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
            pages.logger.info("Step 4 complete: On Office Search page");
          }
        );

        // ── Step 5: Enter "MS-BD" in Office Code Search > click Search ───
        await test.step(
          `Precondition Step 5: Enter "${PRECONDITION.officeCode}" in Office Code Search and click Search`,
          async () => {
            await pages.officePage.officeCodeSearchField(PRECONDITION.officeCode);
            await pages.officePage.searchButtonClick();
            await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
            pages.logger.info(
              `Step 5 complete: Searched for office code "${PRECONDITION.officeCode}"`
            );
          }
        );

        // ── Steps 6-7: Click on the row > navigate to office form page ───
        await test.step(
          `Precondition Steps 6-7: Click on "${PRECONDITION.officeCode}" row to open office form page`,
          async () => {
            await pages.officePage.officeSearchRow(PRECONDITION.officeCode);
            await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
            pages.logger.info(
              `Steps 6-7 complete: Navigated to office form page for "${PRECONDITION.officeCode}"`
            );
          }
        );

        // ── Step 8: Validate Match vendors = TNX, Enable DME = YES ───────
        await test.step(
          "Precondition Step 8: Validate Match vendors = TNX and Enable DME = YES (edit if needed)",
          async () => {
            await pages.officePage.ensureTnxValue();
            pages.logger.info(
              `Match vendors verified/set to: ${PRECONDITION.officeSettings.matchVendors}`
            );
            await pages.officePage.ensureToggleValues(PRECONDITION.verifyToggleConfig);
            pages.logger.info(
              `Enable DME verified/set to: ${PRECONDITION.officeSettings.enableDigitalMatchingEngine}`
            );
            pages.logger.info("Step 8 complete: Office settings validated");
          }
        );

        // ── Step 9: Hover ADMIN tab and click it ─────────────────────────
        await test.step(
          "Precondition Step 9: Hover ADMIN tab and click to navigate to Admin main page",
          async () => {
            await pages.adminPage.hoverAndClickAdminMenu();
            await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
            pages.logger.info("Step 9 complete: On Admin main page");
          }
        );

        // ── Steps 10-11: Enter "BRENT DURHAM(TX-RED)" and select ─────────
        await test.step(
          `Precondition Steps 10-11: Enter "${PRECONDITION.switchToUser}" in Switch User and select suggestion`,
          async () => {
            await pages.adminPage.switchUser(PRECONDITION.switchToUser);
            await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
            pages.logger.info(
              `Steps 10-11 complete: User switched to "${PRECONDITION.switchToUser}"`
            );
          }
        );

        // ── Step 12: Hover HOME tab > select OFFICE CONFIG ───────────────
        await test.step(
          "Precondition Step 12: Hover HOME tab > select OFFICE CONFIG sub tab",
          async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
            await pages.postAutomationRulePage.hoverAndSelectOfficeConfig();
            await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
            pages.logger.info("Step 12 complete: Navigated to Office Config page");
          }
        );

        // ── Step 13: Click POST AUTOMATION button ────────────────────────
        await test.step(
          "Precondition Step 13: Click POST AUTOMATION button",
          async () => {
            await pages.postAutomationRulePage.clickPostAutomationButton();
            await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
            pages.logger.info("Step 13 complete: Post Automation page loaded");
          }
        );

        // ── Step 14: Search for "BONDED CHEMICAL" ────────────────────────
        await test.step(
          `Precondition Step 14: Search "${PRECONDITION.customerName}" in Post Automation search`,
          async () => {
            await pages.postAutomationRulePage.inputSearch(PRECONDITION.customerName);
            await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
            pages.logger.info(
              `Step 14 complete: Searched for "${PRECONDITION.customerName}"`
            );
          }
        );

        // ── Step 15: If data visible → delete; then click NEW ────────────
        await test.step(
          `Precondition Step 15: Delete existing "${PRECONDITION.customerName}" rules if present, then click NEW`,
          async () => {
            // verifySearchResults handles:
            //   "No matching records found" → no action (clean slate)
            //   Records exist → select all → delete → confirm popup
            await pages.postAutomationRulePage.verifySearchResults();
            await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
            pages.logger.info("Existing rules handled (deleted if present)");
          }
        );

        pages.logger.info(
          "All 15 precondition steps completed — moving to test steps"
        );

        // ════════════════════════════════════════════════════════════════════
        //  PHASE 2: TEST STEPS (from CSV with explicit values)
        // ════════════════════════════════════════════════════════════════════

        // ── Test Step 1: Click NEW button to open CREATE NEW ENTRY form ──
        await test.step(
          "Test Step 1: Click the New button to open the CREATE NEW ENTRY form",
          async () => {
            await pages.postAutomationRulePage.clickElementByText(
              POST_AUTOMATION_RULE.NEW_BUTTON
            );
            await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
            pages.logger.info("Test Step 1 complete: CREATE NEW ENTRY form opened");
          }
        );

        // ── Test Step 2: Fill all mandatory fields EXCEPT Email ──────────
        await test.step(
          "Test Step 2: Enter all mandatory fields EXCEPT Email for Notifications",
          async () => {
            // Uses explicit values from CSV test case:
            //   Customer:     BONDED CHEMICAL
            //   Pickup:       ALCHEM - MEDINA, OH (44215)
            //   Drop:         BLEACHTECH - PETERSBURG, VA (23805)
            //   LoadMethod:   TL
            //   Equipment:    FLATBED
            //   Offer Rate:   1000
            //   Email:        *** INTENTIONALLY OMITTED ***
            await pages.dfbHelpers.fillPostAutomationRuleForm(
              pages,
              {
                customer: FORM_VALUES.customerName,
                // emailNotification intentionally OMITTED per test case requirement
                pickLocation: FORM_VALUES.pickLocation,
                destination: FORM_VALUES.dropLocation,
                equipment: FORM_VALUES.equipmentType,
                loadType: FORM_VALUES.loadType,
                offerRate: FORM_VALUES.offerRate,
              },
              true
            );
            pages.logger.info(
              `Test Step 2 complete: Form filled with — ` +
                `Customer: ${FORM_VALUES.customerName}, ` +
                `Pick: ${FORM_VALUES.pickLocation}, ` +
                `Drop: ${FORM_VALUES.dropLocation}, ` +
                `Type: ${FORM_VALUES.loadType}, ` +
                `Equipment: ${FORM_VALUES.equipmentType}, ` +
                `Rate: $${FORM_VALUES.offerRate} — ` +
                `Email for Notifications: OMITTED`
            );
          }
        );

        // ── Test Step 3: Click the Create button ─────────────────────────
        await test.step("Test Step 3: Click the Create button", async () => {
          await pages.postAutomationRulePage.clickElementByText(BUTTONS.CREATE);
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          pages.logger.info(
            "Test Step 3 complete: Create button clicked — awaiting validation"
          );
        });

        // ════════════════════════════════════════════════════════════════════
        //  PHASE 3: EXPECTED RESULT VALIDATION
        // ════════════════════════════════════════════════════════════════════

        await test.step(
          `Validate Expected: "${EXPECTED_VALIDATION_MESSAGE}" message is displayed`,
          async () => {
            try {
              const messageLocator = sharedPage.locator(
                `//*[contains(text(),"${EXPECTED_VALIDATION_MESSAGE}")]`
              );
              await expect(
                messageLocator,
                `Expected validation message: "${EXPECTED_VALIDATION_MESSAGE}"`
              ).toBeVisible({ timeout: 10000 });

              pages.logger.info(
                `Validation PASSED — Message displayed: "${EXPECTED_VALIDATION_MESSAGE}"`
              );
            } catch (error) {
              testPassed = false;
              failureReason =
                `Expected message "${EXPECTED_VALIDATION_MESSAGE}" was NOT displayed`;
              throw error;
            }
          }
        );

        // ════════════════════════════════════════════════════════════════════
        //  PHASE 4: TEST RESULT SUMMARY
        // ════════════════════════════════════════════════════════════════════

        if (testPassed) {
          console.log(
            `\n╔══════════════════════════════════════════════════════════════╗` +
              `\n║  TEST CASE 25103: PASSED                                    ║` +
              `\n║  Email for Notifications validation message verified         ║` +
              `\n╚══════════════════════════════════════════════════════════════╝\n`
          );
        } else {
          console.log(
            `\n╔══════════════════════════════════════════════════════════════╗` +
              `\n║  TEST CASE 25103: FAILED                                    ║` +
              `\n║  Reason: ${failureReason.padEnd(49)}║` +
              `\n╚══════════════════════════════════════════════════════════════╝\n`
          );
        }
      }
    );
  }
);
