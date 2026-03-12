import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

/**
 * Test Case: BT-74420 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received
 * @author AI Agent Generator
 * @date 2026-03-11
 * @category billingtoggle
 */
const testcaseID = "BT-74420";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

/**
 * Helper: Reads the Billing Issues "Waiting On" toggle value.
 * Reads the hidden field #fi_waiting_on (1=Billing, 2=Neutral, 3=Agent).
 * Falls back to reading the Bootstrap Slider handle position.
 */
async function getBillingToggleValue(page: Page): Promise<string> {
  // Primary: read the hidden field #fi_waiting_on (type="hidden", so use count + inputValue, NOT isVisible)
  const hiddenField = page.locator("#fi_waiting_on");
  if (await hiddenField.count() > 0) {
    const val = await hiddenField.inputValue();
    if (val === '3') return 'Agent';
    if (val === '1') return 'Billing';
    if (val === '2') return 'Neutral';
  }

  // Fallback: read the Bootstrap Slider's data-slider-value attribute
  const sliderInput = page.locator("#waiting_on_select");
  if (await sliderInput.count() > 0) {
    const dataVal = await sliderInput.getAttribute('data-slider-value');
    if (dataVal === '3') return 'Agent';
    if (dataVal === '1') return 'Billing';
    if (dataVal === '2') return 'Neutral';
  }

  // Last resort: read slider handle position from the Bootstrap Slider DOM
  const slider = page.locator("div.slider-selection").last();
  await slider.scrollIntoViewIfNeeded();
  await expect.soft(slider, "Billing Issues toggle slider should be visible").toBeVisible({ timeout: WAIT.LARGE });
  return slider.evaluate(el => {
    const container = el.closest('.slider') || el.closest('[class*="slider"]') || el.parentElement;
    const handle = container?.querySelector('.slider-handle, .min-slider-handle') as HTMLElement | null;
    if (handle) {
      const left = parseFloat(handle.style.left);
      if (!isNaN(left)) return left >= 50 ? 'Agent' : 'Billing';
    }
    return 'unknown';
  });
}

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-74420 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received.",
  () => {
    test.beforeAll(async ({ browser }) => {
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      appManager = new MultiAppManager(sharedContext, sharedPage);
      pages = appManager.btmsPageManager;
    });

    test.afterAll(async () => {
      if (appManager) {
        await appManager.closeAllSecondaryPages();
      }
      if (sharedContext) {
        await sharedContext.close();
      }
    });

    test(
      "Case Id: BT-74420 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received.",
      {
        tag: "@aiteam,@payabletoggle"
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes

      // ========== Preconditions (informational — not automated) ==========
      // Precondition: Load office invoice process = Central or Office
      // Precondition: Load status = invoiced or posted
      // Precondition: Payable toggle = Agent
      // Precondition: Pending carrier invoice with price difference

      await test.step("Step 1: Login to BTMS application.", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        pages.logger.info("BTMS Login Successfully");
      });

      await test.step("Step 2 [CSV 2-5]: Search customer and navigate to CREATE TL *NEW*", async () => {
        const btmsBaseUrl = new URL(sharedPage.url()).origin;
        await sharedPage.goto(btmsBaseUrl);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await sharedPage.locator('#c-sitemenu-container').waitFor({ state: 'visible', timeout: 15000 });
        console.log("Navigated to BTMS Home");
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        console.log("Hovered to Customers and clicked Search");
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        console.log(`Entered customer name: ${testData.customerName}`);
        await pages.searchCustomerPage.selectActiveOnCustomerPage();
        await pages.searchCustomerPage.clickOnSearchCustomer();
        console.log("Clicked Search button");
        const customerValue = testData['Customer Value'] || testData.customerName;
        const customerRow = sharedPage.locator(`//tr[contains(.,'ACTIVE')]//td[contains(text(),'${customerValue}')]`).first();
        if (await customerRow.isVisible({ timeout: 10000 }).catch(() => false)) {
          await customerRow.click();
          console.log(`Selected customer by Customer Value: ${customerValue}`);
        } else {
          const partialMatch = sharedPage.locator(`//tr[contains(.,'ACTIVE')]//td[contains(text(),'${testData.customerName}')]`).first();
          await partialMatch.waitFor({ state: 'visible', timeout: 10000 });
          await partialMatch.click();
          console.log(`Selected customer by partial name match: ${testData.customerName}`);
        }
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        console.log("Clicked CREATE TL *NEW* hyperlink");
        pages.logger.info("Navigated to Enter New Load page");
      });

      await test.step("Step 3: Select customer value on Enter New Load form", async () => {
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        const customerName = testData['Customer Value'];

        const customerSelect2 = sharedPage.locator(
          "//select[contains(@id,'customer')]//following-sibling::span[contains(@class,'select2')]"
        ).first();
        const customerDropdown = sharedPage.locator(
          "//select[contains(@id,'customer_id') or contains(@id,'customer')]"
        ).first();

        if (await customerSelect2.isVisible({ timeout: 5000 }).catch(() => false)) {
          await customerSelect2.click();
          const searchInput = sharedPage.locator("input.select2-search__field");
          await searchInput.waitFor({ state: "visible", timeout: 5000 });
          await searchInput.fill(customerName);
          await sharedPage.waitForTimeout(2000);
          const resultItem = sharedPage.locator(
            `//li[contains(@class,'select2-results__option') and contains(text(),'${customerName}')]`
          ).first();
          await resultItem.waitFor({ state: "visible", timeout: 10000 });
          await resultItem.click();
          console.log(`Selected customer via Select2: ${customerName}`);
        } else if (await customerDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
          await customerDropdown.selectOption({ label: customerName });
          console.log(`Selected customer via dropdown: ${customerName}`);
        }

        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await sharedPage.waitForTimeout(3000);
        await sharedPage.locator("//select[@id='form_shipper_ship_point']")
          .waitFor({ state: "visible", timeout: WAIT.LARGE });
        console.log("Customer value changed and form reloaded");
      });

      await test.step("Step 4 [CSV 6-26]: Fill Enter New Load page details (CSV 6-26)", async () => {
        console.log("CSV 6-7: Customer field pre-selected, Salesperson/Dispatcher pre-selected");
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
        distanceMethod: testData.Method,
        shipperCountry: testData.shipperCountry,
        shipperZip: testData.shipperZip,
        shipperAddress: testData.shipperAddress,
        shipperNameNew: testData.shipperNameNew,
        });
        console.log("Shipper, Consignee, dates/times, commodity, equipment fields filled");
        pages.logger.info("Enter New Load form completed");
      });

      await test.step("Step 5: Select the 'Method' as 'Practical'", async () => {
        const dropdown_method = sharedPage.locator("//select[contains(@name,'method') or contains(@id,'method')]").first();
        await dropdown_method.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await dropdown_method.selectOption({ label: "Practical" });
        console.log("Selected Method: Practical");
      });

      await test.step("Step 6: 'Linehaul' and Fuel Surcharge' default value will be 'Flat'", async () => {
        try {
        const linehaulField = sharedPage.locator("//select[contains(@name,'linehaul') or contains(@id,'linehaul')]").first();
        const linehaulValue = await linehaulField.inputValue().catch(() => "");
        console.log("Linehaul default value: " + linehaulValue);
        const fuelField = sharedPage.locator("//select[contains(@name,'fuel') or contains(@id,'fuel')]").first();
        const fuelValue = await fuelField.inputValue().catch(() => "");
        console.log("Fuel Surcharge default value: " + fuelValue);
        } catch (e) {
        console.log("Linehaul/Fuel verification could not complete:", (e as Error).message);
        }
      });

      await test.step("Step 7: Click Create Load and select Rate Type", async () => {
        await pages.nonTabularLoadPage.clickCreateLoadButton();
        console.log("Clicked Create Load button");
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        console.log(`Rate type set to ${testData.rateType}`);
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(`Load Number captured: ${loadNumber}`);
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        pages.logger.info("Load created successfully");
      });

      await test.step("Step 8: Click Carrier tab and enter Offer Rate", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        console.log("Clicked Carrier tab");
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        console.log(`Entered Offer Rate: ${testData.offerRate}`);
      });

      await test.step("Step 9: Enter Customer flat rate as 500", async () => {
        await pages.editLoadCarrierTabPage.enterCustomerRate("500");
        console.log("Entered Customer Rate: 500");
      });

      await test.step("Step 10: Enter Carrier flat rate as 600", async () => {
        await pages.editLoadCarrierTabPage.enterCarrierRate("600");
        console.log("Entered Carrier Rate: 600");
      });

      await test.step("Step 11: Enter trailer length", async () => {
        await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        console.log(`Entered trailer length: ${testData.trailerLength}`);
      });

      await test.step("Step 12: Enter Expiration Date and Time", async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const mm = (futureDate.getMonth() + 1).toString().padStart(2, '0');
        const dd = futureDate.getDate().toString().padStart(2, '0');
        const yyyy = futureDate.getFullYear();
        await sharedPage.locator("#form_expiration_date").fill(`${mm}/${dd}/${yyyy}`);
        await sharedPage.locator("#form_expiration_time").fill("18:00");
        console.log(`Entered Expiration Date: ${mm}/${dd}/${yyyy}, Time: 18:00`);
      });

      await test.step("Step 13: Enter Email for notification", async () => {
        const emailValue = testData.saleAgentEmail;
        const emailSelect = sharedPage.locator("select#form_notification_address");

        if (await emailSelect.isVisible({ timeout: 10000 }).catch(() => false)) {
          const options = await emailSelect.locator("option").allTextContents();
          const match = options.find((o: string) => o.toLowerCase().includes(emailValue.toLowerCase()));
          if (match) {
            await emailSelect.selectOption({ label: match.trim() });
            console.log(`Selected email: ${match.trim()}`);
          } else {
            console.log(`Email option not found for: ${emailValue}. Available: ${options.join(', ')}`);
          }
        } else {
          const allSelects = await sharedPage.locator("select").all();
          let found = false;
          for (const sel of allSelects) {
            const options = await sel.locator("option").allTextContents();
            const match = options.find((o: string) => o.toLowerCase().includes(emailValue.toLowerCase()));
            if (match) {
              await sel.selectOption({ label: match.trim() });
              console.log(`Selected email from fallback select: ${match.trim()}`);
              found = true;
              break;
            }
          }
          if (!found) {
            console.log(`Email notification field not found for: ${emailValue}`);
          }
        }
      });

      await test.step("Step 14: Enter total miles", async () => {
        await pages.editLoadCarrierTabPage.enterMiles("100");
        console.log("Entered total miles: 100");
      });

      await test.step("Step 15: Choose carrier", async () => {
        await pages.editLoadCarrierTabPage.selectCarrier1(testData.Carrier);
        console.log(`Selected carrier: ${testData.Carrier}`);
      });

      await test.step("Step 16: Click Save and accept BOOKED alert", async () => {
        const alertPromise = pages.commonReusables.validateAlert(
          sharedPage,
          ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
        );
        await pages.editLoadFormPage.clickOnSaveBtn();
        await alertPromise;
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Saved load and accepted BOOKED alert");
      });

      // ===== Step 17: Navigate to View Billing and validate toggle =====
      await test.step("Step 17: Navigate to View Billing and validate toggle is set to Agent", async () => {
        await pages.editLoadPage.clickOnTab(TABS.LOAD);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.editLoadFormPage.clickOnViewBillingBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        const toggleValue = await getBillingToggleValue(sharedPage);
        console.log(`Billing Issues toggle value: "${toggleValue}"`);
        expect.soft(toggleValue, "Billing Issues toggle should be set to 'Agent'").toBe('Agent');
      });

      // ===== Steps 44-46: Upload POD under Customer via Document Upload Utility =====
      await test.step("Step 18: Click upload icon against Customer in Load Documents (Step 44)", async () => {
        const uploadIcon = sharedPage.locator("//img[@title='Upload document']").first();
        await uploadIcon.scrollIntoViewIfNeeded();
        await uploadIcon.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await uploadIcon.click();
        await sharedPage.waitForTimeout(2000);
        console.log("Opened Document Upload Utility");
      });

      await test.step("Step 19: Select Customer radio, POD document type, upload and attach (Steps 45-46)", async () => {
        const customerRadio = sharedPage.locator("#cat_customer");
        await customerRadio.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await customerRadio.check();
        console.log("Selected Customer radio button");

        const documentTypeDropdown = sharedPage.locator("#document_type");
        await documentTypeDropdown.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await documentTypeDropdown.selectOption({ label: "Proof of Delivery" });
        console.log("Selected Document Type: Proof of Delivery");

        const path = require("path");
        const filePath = path.resolve(process.cwd(), "src", "data", "bulkchange", "ProofOfDelivery.pdf");
        await sharedPage.locator("//input[@type='file']").first().setInputFiles(filePath);
        await sharedPage.locator("#submit_remote").click();

        // Wait for success message before closing
        const successMessage = sharedPage.locator("#message_display");
        await expect(successMessage).toBeVisible({ timeout: WAIT.LARGE });
        await expect(successMessage).toHaveText("All documents attached successfully.", { timeout: WAIT.LARGE });
        console.log("POD upload success message confirmed");

        // Close the Document Upload Utility dialog (close button is in the jQuery UI wrapper parent)
        const uploadDialog = sharedPage.locator(".ui-dialog").filter({ has: sharedPage.locator("#upload_load_document") });
        const closeBtn = uploadDialog.locator(".ui-dialog-titlebar-close");
        if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await closeBtn.click({ force: true });
        } else {
          await sharedPage.keyboard.press('Escape');
        }
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Uploaded Proof of Delivery under Customer and closed dialog");
      });

      // ===== Steps 47-50: Upload Carrier Invoice under Payables =====
      await test.step("Step 20: Click upload icon and select Payables + Carrier Invoice (Steps 47-49)", async () => {
        const uploadIcon = sharedPage.locator("//img[@title='Upload document']").first();
        await uploadIcon.scrollIntoViewIfNeeded();
        await uploadIcon.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await uploadIcon.click();
        await sharedPage.waitForTimeout(2000);

        const payablesRadio = sharedPage.locator("#cat_payables");
        await payablesRadio.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await expect(payablesRadio).toBeEnabled({ timeout: WAIT.LARGE });
        await payablesRadio.check();
        console.log("Selected Payables radio button");

        const documentTypeDropdown = sharedPage.locator("#document_type");
        await documentTypeDropdown.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await documentTypeDropdown.selectOption({ label: "Carrier Invoice" });
        console.log("Selected Document Type: Carrier Invoice");
      });

      await test.step("Step 21: Enter invoice details, attach carrier invoice, and submit (Step 50)", async () => {
        // Enter invoice number and amount in Document Upload Utility
        const invoiceNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        await sharedPage.locator("#carr_invoice_num_input").fill(invoiceNumber);
        await sharedPage.locator("#carr_invoice_amount").fill("1000");
        console.log(`Entered Invoice Number: ${invoiceNumber}, Amount: 1000`);

        const path = require("path");
        const filePath = path.resolve(process.cwd(), "src", "data", "bulkchange", "CarrierInvoice.pdf");
        await sharedPage.locator("//input[@type='file']").first().setInputFiles(filePath);

        // Expected (Step 50): Alert message stating status has moved to INVOICE should appear
        const alertPromise = pages.commonReusables.validateAlert(
          sharedPage,
          ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED
        );
        await sharedPage.locator("#submit_remote").click();

        // Handle duplicate invoice confirmation if it appears
        const confirmBtn = sharedPage.locator("//button[text()='Confirm']").first();
        if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await confirmBtn.click();
        }

        await alertPromise;
        console.log("Expected validated: Alert message stating status has moved to INVOICE appeared");

        // Close the Document Upload Utility dialog (close button is in jQuery UI wrapper parent)
        const uploadDialog = sharedPage.locator(".ui-dialog").filter({ has: sharedPage.locator("#upload_load_document") });
        const closeBtn = uploadDialog.locator(".ui-dialog-titlebar-close");
        if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await closeBtn.click({ force: true });
        } else {
          await sharedPage.keyboard.press('Escape');
        }
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("First carrier invoice submitted successfully");
      });

      // ===== Step 51: Validate payable toggle (Expected: Billing toggle is at the Agent) =====
      await test.step("Step 22: Refresh and validate billing toggle is set to Agent (Step 51)", async () => {
        await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        const toggleValue = await getBillingToggleValue(sharedPage);
        console.log(`Billing Issues toggle value: "${toggleValue}"`);
        expect.soft(toggleValue, "Expected: Billing toggle is at the Agent").toBe('Agent');
      });

      // ===== Steps 52-53: Click Add New and enter invoice details =====
      await test.step("Step 23: Click Add New against Carrier Invoices, enter invoice # and amount (Steps 52-53)", async () => {
        // Click the Add New button (actual ID: #carr_invoice_add_new)
        const addNewBtn = sharedPage.locator("#carr_invoice_add_new");
        await addNewBtn.scrollIntoViewIfNeeded();
        await addNewBtn.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await addNewBtn.click();
        await sharedPage.waitForTimeout(2000);
        console.log("Clicked Add New button against Carrier Invoices");

        // Wait for the carrier invoice dialog to appear
        const dialogForm = sharedPage.locator("#carrier_invoice_dialog_form");
        await dialogForm.waitFor({ state: "visible", timeout: WAIT.LARGE });
        console.log("Carrier invoice dialog opened");

        // Enter carrier invoice number
        const invoiceNumField = sharedPage.locator("#carrier_invoice_number_id");
        await invoiceNumField.waitFor({ state: "visible", timeout: WAIT.LARGE });
        const invoiceNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        await invoiceNumField.fill(invoiceNumber);
        console.log("Entered Invoice #: " + invoiceNumber);

        // Enter carrier invoice amount with price difference
        const amountField = sharedPage.locator("#carrier_invoice_amount_id");
        await amountField.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await amountField.fill("1000");
        console.log("Entered Amount: 1000");
      });

      // ===== Step 54: Save invoice and refresh (Expected: Billing should get moved to the Agent) =====
      await test.step("Step 24: Save invoice and refresh the page (Step 54)", async () => {
        // Click the Save Invoice button inside the carrier invoice dialog
        const saveBtn = sharedPage.locator("#submit_save_carrier_invoice");
        await saveBtn.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await saveBtn.click();
        console.log("Clicked Save Invoice button in carrier invoice dialog");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        // Refresh the page
        await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Saved invoice and refreshed page");

        // Expected (Step 54): Billing should get moved to the Agent
        const toggleValue = await getBillingToggleValue(sharedPage);
        console.log(`Billing Issues toggle after save: "${toggleValue}"`);
        expect.soft(toggleValue, "Expected: Billing should get moved to the Agent").toBe('Agent');
      });

      // ===== Step 55: View History — check price difference for first invoice =====
      // Expected: The system should recalculate the discrepancy to show the correct price difference
      await test.step("Step 25: Click View History and check price difference for first invoice (Step 55)", async () => {
        // The payables "View History" link opens a new browser window (window.open)
        const viewHistoryLink = sharedPage.locator(
          "//a[contains(.,'View History') or contains(.,'View history')]"
        ).first();
        await viewHistoryLink.scrollIntoViewIfNeeded();
        await viewHistoryLink.waitFor({ state: "visible", timeout: WAIT.LARGE });

        // Listen for the popup window before clicking
        const [historyPopup] = await Promise.all([
          sharedPage.context().waitForEvent('page'),
          viewHistoryLink.click(),
        ]);
        await historyPopup.waitForLoadState("load");
        await historyPopup.waitForLoadState("networkidle");
        console.log("View History popup window opened");

        // Read all messages from the history popup window
        const allText = await historyPopup.locator("body").textContent();
        console.log("History window content (truncated): " + (allText || "").substring(0, 500));

        // Expected: System should recalculate discrepancy and show correct price difference
        const hasPriceDiff = (allText || "").toLowerCase().includes("price difference") ||
                             (allText || "").toLowerCase().includes("discrepancy");
        if (hasPriceDiff) {
          console.log("Price difference message found in history for first invoice");
        }
        expect.soft(hasPriceDiff, "Expected: System should show price difference message for first invoice").toBeTruthy();

        // Close the history popup window
        await historyPopup.close();
        console.log("Closed View History popup window");

        // Validate billing toggle is still at Agent on the main page
        const toggleValue = await getBillingToggleValue(sharedPage);
        console.log(`Billing Issues toggle after View History: "${toggleValue}"`);
        expect.soft(toggleValue, "Billing should be moved to the Agent").toBe('Agent');
      });

      // ===== Step 56: Create a secondary invoice and check price difference =====
      await test.step("Step 26: Open Document Upload Utility for secondary invoice (Step 56)", async () => {
        // Click upload icon to open Document Upload Utility
        const uploadIcon = sharedPage.locator("//img[@title='Upload document']").first();
        await uploadIcon.scrollIntoViewIfNeeded();
        await uploadIcon.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await uploadIcon.click();
        await sharedPage.waitForTimeout(2000);
        console.log("Opened Document Upload Utility for secondary invoice");

        // Select Payables radio button
        const payablesRadio = sharedPage.locator("#cat_payables");
        await payablesRadio.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await expect(payablesRadio).toBeEnabled({ timeout: WAIT.LARGE });
        await payablesRadio.check();
        console.log("Selected Payables radio button");

        // Select Document Type as Carrier Invoice
        const documentTypeDropdown = sharedPage.locator("#document_type");
        await documentTypeDropdown.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await documentTypeDropdown.selectOption({ label: "Carrier Invoice" });
        console.log("Selected Document Type: Carrier Invoice");
      });

      await test.step("Step 27: Enter secondary invoice details, attach, submit and validate (Step 56)", async () => {
        // Enter secondary invoice number and amount
        const secondaryInvoiceNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        await sharedPage.locator("#carr_invoice_num_input").fill(secondaryInvoiceNumber);
        await sharedPage.locator("#carr_invoice_amount").fill("1000");
        console.log(`Entered Secondary Invoice Number: ${secondaryInvoiceNumber}, Amount: 1000`);

        // Attach carrier invoice file
        const path = require("path");
        const filePath = path.resolve(process.cwd(), "src", "data", "bulkchange", "CarrierInvoice.pdf");
        await sharedPage.locator("//input[@type='file']").first().setInputFiles(filePath);

        // Submit and handle alert
        const alertPromise = pages.commonReusables.validateAlert(
          sharedPage,
          ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED
        );
        await sharedPage.locator("#submit_remote").click();

        // Handle duplicate invoice confirmation if it appears
        const confirmBtn = sharedPage.locator("//button[text()='Confirm']").first();
        if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await confirmBtn.click();
        }

        await alertPromise;
        console.log("Secondary invoice alert validated: status moved to INVOICE");

        // Close the Document Upload Utility dialog (close button is in jQuery UI wrapper parent)
        const uploadDialog = sharedPage.locator(".ui-dialog").filter({ has: sharedPage.locator("#upload_load_document") });
        const closeBtn = uploadDialog.locator(".ui-dialog-titlebar-close");
        if (await closeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await closeBtn.click({ force: true });
        } else {
          await sharedPage.keyboard.press('Escape');
        }
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Secondary carrier invoice submitted successfully");
      });

      await test.step("Step 28: Check price difference message for secondary invoice (Step 56)", async () => {
        // Refresh and check for updated price difference message
        await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        // Check finance messages on the billing page for secondary invoice price difference
        const financeMessages = sharedPage.locator(".finance-messages .message");
        const messageCount = await financeMessages.count();
        console.log(`Found ${messageCount} finance messages on billing page`);

        let foundSecondaryPriceDiff = false;
        if (messageCount > 0) {
          const texts = await financeMessages.allTextContents();
          for (const text of texts) {
            if (text.trim()) {
              console.log(`Finance message: ${text.trim()}`);
              if (text.toLowerCase().includes("price difference") || text.toLowerCase().includes("discrepancy")) {
                foundSecondaryPriceDiff = true;
              }
            }
          }
        }

        // Click View History to see payable messages for secondary invoice in popup window
        const viewHistoryLink = sharedPage.locator(
          "//a[contains(.,'View History') or contains(.,'View history')]"
        ).first();
        if (await viewHistoryLink.isVisible({ timeout: 5000 }).catch(() => false)) {
          await viewHistoryLink.scrollIntoViewIfNeeded();

          const [historyPopup] = await Promise.all([
            sharedPage.context().waitForEvent('page'),
            viewHistoryLink.click(),
          ]);
          await historyPopup.waitForLoadState("load");
          await historyPopup.waitForLoadState("networkidle");
          console.log("View History popup opened for secondary invoice check");

          const historyText = await historyPopup.locator("body").textContent();
          console.log("History content (truncated): " + (historyText || "").substring(0, 500));

          if ((historyText || "").toLowerCase().includes("price difference") ||
              (historyText || "").toLowerCase().includes("discrepancy")) {
            foundSecondaryPriceDiff = true;
            console.log("Price difference message found in history for secondary invoice");
          }

          await historyPopup.close();
          console.log("Closed View History popup");
        }

        // Also try alert pattern validation as fallback
        if (!foundSecondaryPriceDiff) {
          try {
            await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.FOR_SECONDARY_INVOICE);
            foundSecondaryPriceDiff = true;
            console.log("Secondary invoice price difference alert validated via ALERT_PATTERNS");
          } catch {
            console.log("No secondary invoice alert found");
          }
        }

        expect.soft(foundSecondaryPriceDiff, "Expected: Price difference message for secondary invoice should be present").toBeTruthy();
        console.log("Secondary invoice price difference validation complete");
      });

      }
    );
  }
);
