import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

const testcaseID = "BT-67846";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

/**
 * Helper: Reads the Billing Issues toggle value from the Bootstrap Slider.
 * Returns 'Agent' or 'Billing' based on the slider-handle position.
 */
async function getBillingToggleValue(page: Page): Promise<string> {
  const slider = page.locator("div.col-md-6 div.slider-selection").last();
  await slider.scrollIntoViewIfNeeded();
  await expect.soft(slider, "Billing Issues toggle slider should be visible").toBeVisible({ timeout: WAIT.LARGE });
  return slider.evaluate(el => {
    const container = el.closest('.slider') || el.closest('[class*="slider"]') || el.parentElement;
    const handle = container?.querySelector('.slider-handle, .min-slider-handle') as HTMLElement | null;
    if (handle) {
      const left = parseFloat(handle.style.left);
      if (!isNaN(left)) return left >= 50 ? 'Agent' : 'Billing';
    }
    const selWidth = parseFloat(el.style.width || '0');
    if (!isNaN(selWidth) && selWidth > 0) {
      const selLeft = parseFloat(el.style.left || '0');
      return (selLeft + selWidth >= 50) ? 'Agent' : 'Billing';
    }
    const dataVal = container?.getAttribute('data-value') || container?.getAttribute('data-slider-value');
    if (dataVal === '1') return 'Agent';
    if (dataVal === '0') return 'Billing';
    return `unknown(handle-left:${handle?.style.left}, sel-width:${el.style.width}, sel-left:${el.style.left})`;
  });
}

/**
 * Helper: Checks whether the "Not Deliv. Final" checkbox is checked.
 */
async function isNotDelivFinalChecked(page: Page): Promise<boolean> {
  const label = page.locator("label[for='Delivs'].ckb");
  await label.scrollIntoViewIfNeeded();
  await expect.soft(label, "Not Deliv. Final checkbox should be visible").toBeVisible({ timeout: WAIT.LARGE });
  return label.evaluate(el => {
    if (el.classList.contains('checked') || el.classList.contains('active')) return true;
    const forId = el.getAttribute('for');
    if (forId) {
      const input = document.getElementById(forId) as HTMLInputElement | null;
      if (input?.checked || input?.value === '1' || input?.value === 'on') return true;
    }
    const innerInput = el.querySelector('input') as HTMLInputElement | null;
    if (innerInput?.checked) return true;
    const bg = window.getComputedStyle(el).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== 'rgb(255, 255, 255)') return true;
    return false;
  });
}

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-67846 - Billing Toggle Validation with Carrier Invoice Upload",
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
      "Case Id: BT-67846 - Billing Toggle Validation with Carrier Invoice Upload",
      { tag: "@aiteam,@billingtoggle" },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

        // Preconditions (informational): Load status = 'Delivered Final', Paperwork received date = delivered date

        await test.step("Step 1: Login to BTMS application", async () => {
          await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
          if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
            await pages.btmsAcceptTermPage.acceptTermsAndConditions();
          }
        });

        await test.step("Step 2: Search customer and navigate to CREATE TL *NEW*", async () => {
          const btmsBaseUrl = new URL(sharedPage.url()).origin;
          await sharedPage.goto(btmsBaseUrl);
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await sharedPage.locator('#c-sitemenu-container').waitFor({ state: 'visible', timeout: 15000 });
          await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
          await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
          await pages.searchCustomerPage.enterCustomerName(testData.customerName);
          await pages.searchCustomerPage.selectActiveOnCustomerPage();
          await pages.searchCustomerPage.clickOnSearchCustomer();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await pages.searchCustomerPage.clickOnActiveCustomer();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        });

        await test.step("Step 3: Select customer on Enter New Load", async () => {
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
          } else if (await customerDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
            await customerDropdown.selectOption({ label: customerName });
          }

          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await sharedPage.waitForTimeout(3000);
          await sharedPage.locator("//select[@id='form_shipper_ship_point']")
            .waitFor({ state: "visible", timeout: WAIT.LARGE });
        });

        await test.step("Step 4: Fill shipper, consignee, dates, and times", async () => {
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
            shipperCity: testData.shipperCity,
            shipperState: testData.shipperState,
            consigneeCountry: testData.consigneeCountry,
            consigneeZip: testData.consigneeZip,
            consigneeAddress: testData.consigneeAddress,
            consigneeCity: testData.consigneeCity,
            consigneeState: testData.consigneeState,
          });
        });

        await test.step("Step 5: Enter Whse Instructions", async () => {
          const whseInput = sharedPage.locator(
            "//textarea[contains(@id,'shipper_whse') or contains(@name,'shipper_whse')]," +
            "//input[contains(@id,'shipper_whse') or contains(@name,'shipper_whse')]"
          ).first();
          if (await whseInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await whseInput.fill("TestData");
          }
        });

        await test.step("Step 6: Select Mileage Engine, Method, and enter LH Rate", async () => {
          const mileageEngineDropdown = sharedPage.locator("//select[contains(@id,'mileage_engine')]").first();
          if (await mileageEngineDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
            await mileageEngineDropdown.selectOption({ label: testData.mileageEngine || "Current" });
          }

          const methodDropdown = sharedPage.locator("//select[contains(@id,'mileage_method')]").first();
          await methodDropdown.waitFor({ state: "visible", timeout: WAIT.LARGE });
          await methodDropdown.selectOption({ label: testData.Method || "Practical" });

          const lhRateInput = sharedPage.locator("//input[contains(@id,'linehaul_rate')]").first();
          await lhRateInput.waitFor({ state: "visible", timeout: WAIT.LARGE });
          await lhRateInput.clear();
          await lhRateInput.fill("500");
        });

        await test.step("Step 7: Click Create Load and select Rate Type", async () => {
          await pages.nonTabularLoadPage.clickCreateLoadButton();

          const rateTypeField = sharedPage.locator("//select[contains(@id,'rate_type') or contains(@name,'rate_type')]").first();
          if (await rateTypeField.isVisible({ timeout: 5000 }).catch(() => false)) {
            await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
          }

          await pages.editLoadPage.validateEditLoadHeadingText();
          loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
          console.log(`Load Number: ${loadNumber}`);
        });

        await test.step("Step 8: Click Carrier tab and enter Offer Rate", async () => {
          await pages.editLoadPage.clickOnTab(TABS.CARRIER);
          await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        });

        await test.step("Step 9: Enter Customer flat rate as 500", async () => {
          await pages.editLoadCarrierTabPage.enterCustomerRate("500");
        });

        await test.step("Step 10: Enter Carrier flat rate as 600", async () => {
          await pages.editLoadCarrierTabPage.enterCarrierRate("600");
        });

        await test.step("Step 11: Enter trailer length", async () => {
          await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        });

        await test.step("Step 12: Enter Expiration Date and Time", async () => {
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 7);
          const mm = (futureDate.getMonth() + 1).toString().padStart(2, '0');
          const dd = futureDate.getDate().toString().padStart(2, '0');
          const yyyy = futureDate.getFullYear();
          await sharedPage.locator("#form_expiration_date").fill(`${mm}/${dd}/${yyyy}`);
          await sharedPage.locator("#form_expiration_time").fill("18:00");
        });

        await test.step("Step 13: Enter Email for notification", async () => {
          const emailValue = testData.saleAgentEmail;
          const emailSelect = sharedPage.locator("select#form_notification_address");

          if (await emailSelect.count() > 0) {
            const options = await emailSelect.locator("option").allTextContents();
            const match = options.find((o: string) => o.toLowerCase().includes(emailValue.toLowerCase()));
            if (match) {
              await emailSelect.selectOption({ label: match.trim(), force: true });
              console.log(`Selected email: ${match.trim()}`);
            }
          } else {
            // Fallback: scan all selects on page for the email option
            const allSelects = await sharedPage.locator("select").all();
            for (const sel of allSelects) {
              const options = await sel.locator("option").allTextContents();
              const match = options.find((o: string) => o.toLowerCase().includes(emailValue.toLowerCase()));
              if (match) {
                await sel.selectOption({ label: match.trim(), force: true });
                console.log(`Selected email from fallback select: ${match.trim()}`);
                break;
              }
            }
          }
        });

        await test.step("Step 14: Enter total miles", async () => {
          await pages.editLoadCarrierTabPage.enterMiles("100");
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
        });

        await test.step("Step 17: Navigate to View Billing and validate toggle is set to Agent", async () => {
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

          // Validate: Billing Issues toggle should be set to "Agent"
          const toggleValue = await getBillingToggleValue(sharedPage);
          console.log(`Billing Issues toggle value: "${toggleValue}"`);
          expect.soft(toggleValue, "Billing Issues toggle should be set to 'Agent'").toBe('Agent');
        });

        await test.step("Step 18: Click upload icon in Load Documents", async () => {
          const uploadIcon = sharedPage.locator("//img[@title='Upload document']").first();
          await uploadIcon.scrollIntoViewIfNeeded();
          await uploadIcon.waitFor({ state: "visible", timeout: WAIT.LARGE });
          await uploadIcon.click();
          await sharedPage.waitForTimeout(2000);
        });

        await test.step("Step 19: Select Payables and Document Type as Carrier Invoice", async () => {
          const payablesRadio = sharedPage.locator("//input[@id='cat_payables']");
          await payablesRadio.waitFor({ state: "visible", timeout: WAIT.LARGE });
          await expect(payablesRadio).toBeEnabled({ timeout: WAIT.LARGE });
          await payablesRadio.check();

          const documentTypeDropdown = sharedPage.locator("//select[@name='document_type']");
          await documentTypeDropdown.waitFor({ state: "visible", timeout: WAIT.LARGE });
          await documentTypeDropdown.selectOption({ label: "Carrier Invoice" });
        });

        await test.step("Step 20: Enter invoice details, attach file, and accept alert", async () => {
          const invoiceNumber = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
          await sharedPage.locator("//input[@id='carr_invoice_num_input']").fill(invoiceNumber);
          await sharedPage.locator("//input[@id='carr_invoice_amount']").fill("1500");

          const dragDropArea = sharedPage.locator("//div[@class='dz-message']");
          await dragDropArea.click().catch(() => {});
          const path = require("path");
          const filePath = path.resolve(process.cwd(), "src", "data", "bulkchange", "CarrierInvoice.pdf");
          await sharedPage.locator("//input[@type='file']").first().setInputFiles(filePath);

          const alertPromise = pages.commonReusables.validateAlert(
            sharedPage,
            ALERT_PATTERNS.PAYABLE_STATUS_INVOICE_RECEIVED
          );
          await sharedPage.locator("//input[@type='submit']").last().click();

          // Handle duplicate invoice confirmation if it appears
          const confirmBtn = sharedPage.locator("//button[text()='Confirm']").first();
          if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await confirmBtn.click();
          }

          await alertPromise;

          // Close the Document Upload Utility dialog
          const closeBtn = sharedPage.getByRole('dialog', { name: 'Document Upload Utility' }).getByRole('button').first();
          if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await closeBtn.click({ force: true });
          } else {
            await sharedPage.keyboard.press('Escape');
          }
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        });

        await test.step("Step 21: Reload and validate toggle and Not Deliv. Final checkbox", async () => {
          await sharedPage.reload();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

          const billingIssuesSection = sharedPage.locator("//h4[contains(text(),'Billing Issues')]/parent::*").first();
          await billingIssuesSection.scrollIntoViewIfNeeded();

          // Validate: Toggle should still be "Agent" after reload
          const toggleValue = await getBillingToggleValue(sharedPage);
          console.log(`Billing Issues toggle after reload: "${toggleValue}"`);
          expect.soft(toggleValue, "Billing Issues toggle should still be 'Agent' after reload").toBe('Agent');

          // Validate: "Not Deliv. Final" checkbox should be checked
          const notDelivChecked = await isNotDelivFinalChecked(sharedPage);
          console.log(`Not Deliv. Final checked: ${notDelivChecked}`);
          expect.soft(notDelivChecked, "Not Deliv. Final should be checked").toBeTruthy();
        });

      }
    );
  }
);
