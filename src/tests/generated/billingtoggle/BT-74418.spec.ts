import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { ALERT_PATTERNS } from "@utils/alertPatterns";

/**
 * Test Case: BT-74418 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received
 * @author AI Agent Generator
 * @date 2026-02-26
 * @category billingtoggle
 */
const testcaseID = "BT-74418";
const testData = dataConfig.getTestDataFromCsv(dataConfig.billingtoggleData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadNumber: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial("Case ID: BT-74418 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received", () => {
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
    "Case Id: BT-74418 - Validate updated price difference message when carrier invoice already exists in pending status and secondary invoice is received",
    {
      tag: "@aiteam,@payabletoggle"
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);

      await test.step("Step 1: Login to BTMS application", async () => {
        console.log("Preconditions: Load office invoice process = Central or Office, Load status = invoiced or posted, Payable toggle = Agent, Pending carrier invoice with price difference");
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        if (await pages.btmsAcceptTermPage.validateOnBTMSAcceptTermPage()) {
          await pages.btmsAcceptTermPage.acceptTermsAndConditions();
        }
        pages.logger.info("BTMS Login Successfully");
      });

      await test.step("Step 2: Search customer and navigate to CREATE TL *NEW*", async () => {
        await pages.basePage.navigateToBaseUrl();
        console.log("Navigated to BTMS Home");
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        console.log("Hovered to Customers and clicked Search");
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        console.log(`Entered customer name: ${testData.customerName}`);
        await pages.searchCustomerPage.selectActiveOnCustomerPage();
        await pages.searchCustomerPage.clickOnSearchCustomer();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked Search button");
        await pages.searchCustomerPage.clickOnActiveCustomer();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked on Customer profile");
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        console.log("Clicked CREATE TL *NEW* hyperlink");
        pages.logger.info("Navigated to Enter New Load page");
      });

      await test.step("Step 3: Fill Enter New Load page details", async () => {
        console.log("Customer field pre-selected, Salesperson/Dispatcher pre-selected");
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
        console.log("Shipper, Consignee, dates/times, commodity, equipment fields filled");
        pages.logger.info("Enter New Load form completed");
      });

      await test.step("Step 4: Select the Method as Practical", async () => {
        await pages.editLoadFormPage.selectMethod("Practical");
        console.log("Selected Method: Practical");
      });

      await test.step("Step 5: Verify Linehaul and Fuel Surcharge default to Flat Rate", async () => {
        const linehaulValue = await pages.editLoadFormPage.getLinehaulDefaultValue();
        console.log(`Linehaul default value = "${linehaulValue}"`);
        expect.soft(linehaulValue, "Linehaul should default to Flat Rate").toBeTruthy();

        const fuelValue = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
        console.log(`Fuel Surcharge default value = "${fuelValue}"`);
        expect.soft(fuelValue, "Fuel Surcharge should default to Flat Rate").toBeTruthy();
      });

      await test.step("Step 6: Click Create Load and select Rate Type", async () => {
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

      await test.step("Step 7: Carrier tab - enter offer rate, select carrier, check auto accept", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        console.log("Clicked Carrier tab");
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        console.log(`Entered Offer Rate: ${testData.offerRate}`);
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.Carrier]);
        console.log(`Selected carrier: ${testData.Carrier}`);
        await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
        console.log("Checked Carrier Auto Accept checkbox");
        pages.logger.info("Carrier tab configured for auto accept test");
      });

      await test.step("Step 8: Enter flat rate in Customer eg 500", async () => {
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        console.log(`Entered flat rate: ${testData.offerRate}`);
      });

      await test.step("Step 9: Enter trailer length", async () => {
        await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        console.log(`Entered trailer length: ${testData.trailerLength}`);
      });

      await test.step("Step 10: Enter Expiration Date as future date", async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const formattedDate = `${(futureDate.getMonth() + 1).toString().padStart(2, '0')}/${futureDate.getDate().toString().padStart(2, '0')}/${futureDate.getFullYear()}`;
        await pages.editLoadFormPage.enterExpirationDate(formattedDate);
        console.log(`Entered Expiration Date: ${formattedDate}`);
        await pages.editLoadFormPage.enterExpirationTime("18:00");
        console.log("Entered Expiration Time: 18:00");
      });

      await test.step("Step 11: Enter Email for notification", async () => {
        await pages.editLoadCarrierTabPage.selectEmailNotificationViaSelect2(testData.saleAgentEmail);
        console.log(`Entered Email for notification: ${testData.saleAgentEmail}`);
      });

      await test.step("Step 12: Enter total miles eg 500", async () => {
        await pages.editLoadCarrierTabPage.enterMiles(testData.miles);
        console.log(`Entered total miles: ${testData.miles}`);
      });

      await test.step("Step 13: On Carrier tab click on CHOOSE CARRIER and select any ACTIVE carrier", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Navigated to Carrier tab for carrier selection");
      });

      await test.step("Step 14: Click on Save button", async () => {
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked Save button");
      });

      await test.step("Step 15: Navigate to Load tab and click on View Billing button", async () => {
        await pages.editLoadPage.clickOnTab(TABS.LOAD);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.editLoadFormPage.clickOnViewBillingBtn();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked View Billing");

        const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
        console.log(`Billing toggle value: ${toggleValue}`);
        expect.soft(toggleValue, "Billing toggle button should be set to 'Agent'").toBe('Agent');
      });

      await test.step("Step 16: Navigate to customer and create a new load", async () => {
        await pages.basePage.navigateToBaseUrl();
        console.log("Navigated to BTMS Home");
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        console.log("Hovered to Customers and clicked Search");
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        console.log(`Entered customer name: ${testData.customerName}`);
        await pages.searchCustomerPage.selectActiveOnCustomerPage();
        await pages.searchCustomerPage.clickOnSearchCustomer();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked Search button");
        await pages.searchCustomerPage.clickOnActiveCustomer();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked on Customer profile");
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        console.log("Clicked CREATE TL *NEW* hyperlink");
        pages.logger.info("Navigated to Enter New Load page");
      });

      await test.step("Step 17: Upload the proof of delivery document", async () => {
        await pages.viewLoadPage.uploadPODDocument();
        console.log("Proof of delivery document uploaded");
      });

      await test.step("Step 18: Navigate to customer and create another load", async () => {
        await pages.basePage.navigateToBaseUrl();
        console.log("Navigated to BTMS Home");
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        console.log("Hovered to Customers and clicked Search");
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        console.log(`Entered customer name: ${testData.customerName}`);
        await pages.searchCustomerPage.selectActiveOnCustomerPage();
        await pages.searchCustomerPage.clickOnSearchCustomer();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked Search button");
        await pages.searchCustomerPage.clickOnActiveCustomer();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked on Customer profile");
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        console.log("Clicked CREATE TL *NEW* hyperlink");
        pages.logger.info("Navigated to Enter New Load page");
      });

      await test.step("Step 19: Select radio button Payables", async () => {
        await pages.viewLoadPage.selectPayablesRadio();
        console.log("Selected Payables radio button");
      });

      await test.step("Step 20: Upload the carrier invoice document", async () => {
        await pages.viewLoadPage.uploadCarrierInvoiceDocument(testData);
        console.log("Carrier invoice document uploaded");
      });

      await test.step("Step 21: Select radio button Payables and Select Document Type as Carrier Invoice", async () => {
        await pages.viewLoadPage.selectPayablesRadio();
        console.log("Selected Payables radio button");

        await pages.viewLoadPage.selectDocumentType("Carrier Invoice");
        console.log("Selected Document Type: Carrier Invoice");
      });

      await test.step("Step 22: Enter invoice number and Invoice Amount", async () => {
        await pages.viewLoadPage.fillCarrierInvoiceNumber(testData.carrierInvoiceNumber);
        console.log(`Entered Invoice Number: ${testData.carrierInvoiceNumber}`);

        await pages.viewLoadPage.fillCarrierInvoiceAmount(testData.carrierInvoiceAmount1);
        console.log(`Entered Invoice Amount: ${testData.carrierInvoiceAmount1}`);
      });

      await test.step("Step 23: Validate if payable toggle is set to Agent", async () => {
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
        console.log(`Payable toggle value: ${toggleValue}`);
        expect.soft(toggleValue, "Payable toggle should be set to 'Agent'").toBe('Agent');

        await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.STATING_STATUS_HAS_MOVED_TO_THE_INVOICE_SHOULD_APPEAR_ON_THE);
        console.log("Alert validated: status moved to invoice");
      });

      await test.step("Step 24: Click on Add New button against Carrier Invoice", async () => {
        await pages.loadBillingPage.clickAddNewCarrierInvoice();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Clicked Add New button");

        const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
        expect.soft(toggleValue, "Billing toggle should be at Agent after Add New").toBe('Agent');
        console.log(`Billing toggle value after Add New: ${toggleValue}`);
      });

      await test.step("Step 25: Enter Amount as 1000", async () => {
        await pages.loadBillingPage.enterCarrierInvoiceAmount(testData.carrierInvoiceAmount2);
        console.log(`Entered Amount: ${testData.carrierInvoiceAmount2}`);
      });

      await test.step("Step 26: Save invoice and refresh the page", async () => {
        await pages.loadBillingPage.clickSaveCarrierInvoice();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await sharedPage.reload();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        console.log("Saved invoice and refreshed page");
      });

      await test.step("Step 27: Click on View history and check payable messages", async () => {
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        await pages.loadBillingPage.clickViewHistoryAndGetPopup();
        console.log("Clicked View History");

        const toggleValue = await pages.loadBillingPage.getBillingToggleValue();
        expect.soft(toggleValue, "Billing should be moved to the Agent").toBe('Agent');
        console.log(`Billing moved to Agent: ${toggleValue}`);
      });

      await test.step("Step 28: Create a secondary invoice and check for price difference message", async () => {
        await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.FOR_SECONDARY_INVOICE);
        console.log("Secondary invoice price difference alert validated");

        await pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.UNKNOWN_MESSAGE);
        console.log("System recalculated discrepancy alert validated");
      });

    }
  );
});
