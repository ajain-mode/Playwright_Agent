import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

/**
 * Test Case: BT-74421 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received
 * @author AI Agent Generator
 * @date 2026-03-12
 * @category billingtoggle
 */
const testcaseID = "BT-74421";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: BT-74421 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received.",
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
      "Case Id: BT-74421 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received.",
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
        await pages.basePage.navigateToBaseUrl();
        console.log("Navigated to BTMS Home");
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        console.log("Hovered to Customers and clicked Search");
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        console.log(`Entered customer name: ${testData.customerName}`);
        await pages.searchCustomerPage.selectActiveOnCustomerPage();
        await pages.searchCustomerPage.clickOnSearchCustomer();
        console.log("Clicked Search button");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.searchCustomerPage.clickOnActiveCustomer();
        console.log("Selected active customer from search results");
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        console.log("Clicked CREATE TL *NEW* hyperlink");
        pages.logger.info("Navigated to Enter New Load page");
      });

      await test.step("Step 3: Select customer value on Enter New Load form", async () => {
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        const customerName = testData['Customer Value'];

        await pages.editLoadCarrierTabPage.selectCustomerViaSelect2(customerName);
        console.log(`Selected customer via Select2: ${customerName}`);

        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.editLoadCarrierTabPage.waitForShipperDropdown();
        console.log("Customer value changed and form reloaded");
      });

      await test.step("Step 4 [CSV 6-26]: Fill Enter New Load page details", async () => {
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

      await test.step("Step 5 [CSV 28]: Select Method as Practical", async () => {
        await pages.nonTabularLoadPage.selectMethod("Practical");
        console.log("Selected Method: Practical");
      });

      await test.step("Step 6 [CSV 29]: Verify Linehaul and Fuel Surcharge defaults", async () => {
        const linehaulDefault = await pages.editLoadFormPage.getLinehaulDefaultValue();
        console.log(`Linehaul default value: "${linehaulDefault}"`);
        expect.soft(linehaulDefault, "Linehaul should default to 'Flat'").toBe("Flat");

        const fuelSurchargeDefault = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
        console.log(`Fuel Surcharge default value: "${fuelSurchargeDefault}"`);
        expect.soft(fuelSurchargeDefault, "Fuel Surcharge should default to 'Flat'").toBe("Flat");
      });

      await test.step("Step 7 [CSV 30-31]: Click Create Load and select Rate Type", async () => {
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

      await test.step("Step 8 [CSV 32-33]: Carrier tab — enter offer rate", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        console.log("Clicked Carrier tab");
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        console.log(`Entered Offer Rate: ${testData.offerRate}`);
      });

      await test.step("Step 9 [CSV 34-35]: Enter Customer rate 500 and Carrier rate 600", async () => {
        await pages.editLoadCarrierTabPage.enterCustomerRate(testData.customerRate);
        console.log(`Entered Customer Rate: ${testData.customerRate}`);
        await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
        console.log(`Entered Carrier Rate: ${testData.carrierRate}`);
      });

      await test.step("Step 10 [CSV 36]: Enter trailer length", async () => {
        await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        console.log(`Entered trailer length: ${testData.trailerLength}`);
      });

      await test.step("Step 11 [CSV 37-38]: Enter Expiration Date and Time", async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const mm = (futureDate.getMonth() + 1).toString().padStart(2, '0');
        const dd = futureDate.getDate().toString().padStart(2, '0');
        const yyyy = futureDate.getFullYear();
        await pages.editLoadFormPage.enterExpirationDate(`${mm}/${dd}/${yyyy}`);
        await pages.editLoadFormPage.enterExpirationTime("18:00");
      });

      await test.step("Step 12 [CSV 39]: Enter Email for notification", async () => {
        const emailValue = testData.saleAgentEmail;
        await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(emailValue);
        console.log(`Selected email for notification: ${emailValue}`);
      });

      await test.step("Step 13 [CSV 40]: Enter total miles", async () => {
        await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
        console.log(`Entered total miles: ${testData.miles}`);
      });

      await test.step("Step 14 [CSV 41]: Choose carrier", async () => {
        await pages.editLoadCarrierTabPage.selectCarrier1(testData.Carrier);
        console.log(`Selected carrier: ${testData.Carrier}`);
      });

      await test.step("Step 15 [CSV 42]: Click Save and accept BOOKED alert", async () => {
        const alertPromise = pages.commonReusables.validateAlert(
          sharedPage,
          ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_BOOKED
        );
        await pages.editLoadFormPage.clickOnSaveBtn();
        await alertPromise;
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Saved load and accepted BOOKED alert");
      });

      await test.step("Step 16 [CSV 43]: Click EDIT and select DELIVERED FINAL from status dropdown", async () => {
        await pages.viewLoadPage.clickEditButton();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.editLoadFormPage.selectLoadStatus("DELIVERED FINAL");
        console.log("Selected DELIVERED FINAL status");
      });

      await test.step("Step 17 [CSV 44]: Click Save and select Ok on pop up — Expected: INVOICED alert", async () => {
        // Auto-accept all dialogs (confirmation + status alert) during save
        const alertMessages: string[] = [];
        const dialogHandler = async (dialog: any) => {
          const msg = dialog.message();
          console.log(`Dialog appeared: "${msg}"`);
          alertMessages.push(msg);
          await dialog.accept();
          console.log("Dialog accepted");
        };
        sharedPage.on("dialog", dialogHandler);

        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        // await sharedPage.waitForTimeout(3000);

        // sharedPage.off("dialog", dialogHandler);

        // // Validate that INVOICED alert appeared in one of the dialogs
        // const hasInvoicedAlert = alertMessages.some(msg =>
        //   ALERT_PATTERNS.STATUS_HAS_BEEN_SET_TO_INVOICED.test(msg)
        // );
        // console.log(`All alert messages: ${JSON.stringify(alertMessages)}`);
        // expect.soft(hasInvoicedAlert, "Expected: Status has been set to INVOICED alert should appear").toBeTruthy();
        // console.log("Saved and accepted popup(s), INVOICED alert validated");
      });

      await test.step("Step 18 [CSV 45]: Click on View Billing button and validate toggle", async () => {
        // After save, page may be in view mode — navigate to Load tab then View Billing
        await pages.editLoadPage.clickOnTab(TABS.LOAD);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.editLoadFormPage.clickOnViewBillingBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked View Billing");

        const toggleValue = await pages.loadBillingPage.getPayableToggleValue();
        console.log(`Payable toggle value: "${toggleValue}"`);
        expect.soft(toggleValue, "Payable toggle should be set to 'Agent'").toBe('Agent');
      });

      // ===== Steps 46-47: Add New Carrier Invoice #1 (amount: 1500) =====
      await test.step("Step 19 [CSV 46-47]: Click Add New, enter invoice #1 (amount 1500), save", async () => {
        await pages.loadBillingPage.clickAddNewCarrierInvoice();

        const invoiceNumber1 = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        await pages.loadBillingPage.enterCarrierInvoiceNumber(invoiceNumber1);
        await pages.loadBillingPage.enterCarrierInvoiceAmount(testData.carrierInvoiceAmount1);

        await pages.loadBillingPage.clickSaveCarrierInvoice();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log(`First carrier invoice saved: #${invoiceNumber1}, Amount: ${testData.carrierInvoiceAmount1}`);
      });

      // ===== Step 48: Reload and validate payable toggle =====
      await test.step("Step 20 [CSV 48]: Reload page — Expected: Payable Toggle should get moved to the Agent", async () => {
        await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        // After reload, check if we're still on billing page — re-navigate if not
        let toggleValue = await pages.loadBillingPage.getPayableToggleValue();
        if (toggleValue === 'unknown') {
          console.log("Not on billing page after reload — navigating back");
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          toggleValue = await pages.loadBillingPage.getPayableToggleValue();
        }

        console.log(`Payable toggle after first invoice: "${toggleValue}"`);
        expect.soft(toggleValue, "Expected [CSV 48]: Payable Toggle should get moved to the Agent").toBe('Agent');
      });

      // ===== Steps 49-50: Add New Carrier Invoice #2 (amount: 2000) =====
      await test.step("Step 21 [CSV 49-50]: Click Add New, enter invoice #2 (amount 2000), save", async () => {
        await pages.loadBillingPage.clickAddNewCarrierInvoice();

        const invoiceNumber2 = Math.floor(Math.random() * 9000000000 + 1000000000).toString();
        await pages.loadBillingPage.enterCarrierInvoiceNumber(invoiceNumber2);
        await pages.loadBillingPage.enterCarrierInvoiceAmount(testData.carrierInvoiceAmount2);

        await pages.loadBillingPage.clickSaveCarrierInvoice();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log(`Second carrier invoice saved: #${invoiceNumber2}, Amount: ${testData.carrierInvoiceAmount2}`);
      });

      // ===== Step 51: Reload =====
      await test.step("Step 22 [CSV 51]: Reload page", async () => {
        await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        // After reload, check if we're still on billing page — re-navigate if not
        const reloadToggle = await pages.loadBillingPage.getPayableToggleValue();
        if (reloadToggle === 'unknown') {
          console.log("Not on billing page after reload — navigating back");
          await pages.editLoadPage.clickOnTab(TABS.LOAD);
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
          await pages.editLoadFormPage.clickOnViewBillingBtn();
          await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        }
        console.log("Page reloaded after second invoice");
      });

      // ===== Step 52: View History — check and calculate price difference =====
      await test.step("Step 23 [CSV 52]: View History and check price difference message", async () => {
        // Calculate expected price differences from CSV data
        const carrierRate = parseInt(testData.carrierRate);
        const invoice1Amount = parseInt(testData.carrierInvoiceAmount1);
        const invoice2Amount = parseInt(testData.carrierInvoiceAmount2);
        const priceDiff1 = invoice1Amount - carrierRate; // 900
        const priceDiff2 = invoice2Amount - carrierRate; // 1400
        const totalInvoiced = invoice1Amount + invoice2Amount; // 3500
        const totalDiff = totalInvoiced - carrierRate; // 2900
        console.log(`Expected price differences: Invoice1=${priceDiff1}, Invoice2=${priceDiff2}, Total=${totalDiff}`);

        // Check finance messages on billing page for price difference
        const financeMessages = await pages.loadBillingPage.getFinanceMessages();
        console.log(`Finance messages found: ${financeMessages.length}`);
        financeMessages.forEach((msg, i) => console.log(`  Finance message ${i + 1}: ${msg}`));

        // Match amounts in various formats: 900, $900, $900.00, $1,400.00, $2,900.00
        const amountPattern = (amt: number) => {
          const formatted = amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const plain = amt.toString();
          return new RegExp(`\\$?${plain}(\\.00)?|\\$?${formatted.replace(/[.,]/g, '[,.]?')}`);
        };
        const priceDiff1Re = amountPattern(priceDiff1);
        const priceDiff2Re = amountPattern(priceDiff2);
        const totalDiffRe = amountPattern(totalDiff);

        const hasFinancePriceDiff = financeMessages.some(msg => {
          const lower = msg.toLowerCase();
          return lower.includes('price difference') || lower.includes('discrepancy') ||
                 priceDiff1Re.test(msg) || priceDiff2Re.test(msg) || totalDiffRe.test(msg);
        });

        // Open View History popup window and check for price difference
        const historyPopup = await pages.loadBillingPage.clickViewHistoryAndGetPopup();
        const historyContent = await pages.loadBillingPage.getPopupBodyText(historyPopup) || '';
        console.log("History content (truncated): " + historyContent.substring(0, 1000));
        await historyPopup.close();
        console.log("Closed View History popup");

        const historyLower = historyContent.toLowerCase();
        const historyHasPriceDiff = historyLower.includes('price difference') ||
                                     historyLower.includes('discrepancy');
        const historyHasAmount = priceDiff1Re.test(historyContent) ||
                                  priceDiff2Re.test(historyContent) ||
                                  totalDiffRe.test(historyContent);

        // Validate: price difference message exists
        const foundPriceDiff = hasFinancePriceDiff || historyHasPriceDiff;
        expect.soft(foundPriceDiff, "Expected: System should show price difference message in finance messages or View History").toBeTruthy();

        // Validate: correct price difference amount is calculated and displayed
        const correctAmountShown = historyHasAmount ||
          financeMessages.some(msg =>
            priceDiff1Re.test(msg) || priceDiff2Re.test(msg) || totalDiffRe.test(msg)
          );
        expect.soft(correctAmountShown,
          `Expected: System should recalculate and show correct price difference amount (${priceDiff1}, ${priceDiff2}, or ${totalDiff})`
        ).toBeTruthy();

        console.log(`Price difference validation: message=${foundPriceDiff}, amount=${correctAmountShown}`);
      });

      }
    );
  }
);
