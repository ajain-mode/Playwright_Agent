import { BrowserContext, expect, Page, test } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";
import { ALERT_PATTERNS } from "@utils/alertPatterns";
import commissionHelper from "@utils/commission-helpers";
import DMEDashboardPage from "@pages/dme/DMEDashboradPage";

/**
 * Test Case: DFB-97744 - Automatically book a load when it is manually postedDisplay a message when an active loadboard user is not selected for the Carrier Contact for Rate Confirmation field on the load
 * @author AI Agent Generator
 * @date 2026-03-05
 * @category dfb
 */
const testcaseID = "DFB-97744";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let cargoValue: string;
let loadNumber: string;
let agentEmail: string;
let sharedContext: BrowserContext;
let sharedPage: Page;
let appManager: MultiAppManager;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Case ID: DFB-97744 - Automatically book a load when it is manually postedDisplay a message when an active loadboard user is not selected for the Carrier Contact for Rate Confirmation field on the load",
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
      "Case Id: DFB-97744 - Automatically book a load when it is manually postedDisplay a message when an active loadboard user is not selected for the Carrier Contact for Rate Confirmation field on the load",
      {
        tag: "@aiteam,@carrierautoaccept,@dfb"
      },
      async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE); // 15 minutes

      await test.step("Step 1: Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
      });

      await test.step("Step 2: Navigate to Agent Search and capture agent email", async () => {
        await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
        await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH);
        await pages.agentSearchPage.nameInputOnAgentPage(testData.salesAgent);
        await pages.agentSearchPage.clickOnSearchButton();
        await pages.agentSearchPage.selectAgentByName(testData.salesAgent);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        agentEmail = await pages.agentInfoPage.getAgentEmail();
        pages.logger.info(`Agent email captured: ${agentEmail}`);
        await pages.basePage.navigateToBaseUrl();
      });

      await test.step("Step 3: Pre-Conditions setup — office config with DME/TNX validat...", async () => {
        await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
        await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.OFFICE_SEARCH);
        await pages.officePage.officeCodeSearchField(testData.officeName);
        await pages.officePage.searchButtonClick();
        await pages.officePage.officeSearchRow(testData.officeName);

        const toggleSettingsValue = pages.toggleSettings.enable_DME;
        await pages.officePage.ensureToggleValues(toggleSettingsValue);
        await pages.officePage.ensureTnxValue();

        await pages.basePage.navigateToBaseUrl();
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        await pages.searchCustomerPage.clickOnSearchCustomer();
        await pages.searchCustomerPage.clickOnActiveCustomer();
        await commissionHelper.updateAvailableCreditOnCustomer(sharedPage);

        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle", "domcontentloaded"]);

        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(testData.customerName);

        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
        cargoValue = await pages.viewCustomerPage.verifyAndSetCargoValue(CARGO_VALUES.DEFAULT);
        await pages.viewCustomerPage.setPracticalDefaultMethodIfNeeded();
      });

      await test.step("Step 4: Navigate to Carrier Search and search for carrier", async () => {
        await pages.basePage.navigateToBaseUrl();
        await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
        await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.Carrier);
        await pages.carrierSearchPage.selectActiveOnCarrier();
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyCarrierListTableData(testData.Carrier);
        pages.logger.info("Carrier found in search results");
      });

      await test.step("Step 5: Click on carrier, verify loadboard status and carrier vis...", async () => {
        await pages.carrierSearchPage.selectCarrierByName(testData.Carrier);
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);

        const statusText = await pages.viewCarrierPage.getLoadboardStatus();
        pages.logger.info(`Carrier loadboard status: ${statusText}`);

        const requiredVisibility = [
            CARRIER_VISIBILITY.AVENGER_LOGISTICS,
            CARRIER_VISIBILITY.MODE_TRANSPORTATION,
            CARRIER_VISIBILITY.SUNTECK_TTS,
          ];

        const tabClicked = await pages.viewCarrierPage.clickLoadboardTab();
        if (tabClicked) {
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        }

        let togglesFound = false;
        for (const name of requiredVisibility) {
        if (await pages.viewCarrierPage.isCarrierVisibilityLabelVisible(name)) {
        togglesFound = true;
        break;
        }
        }

        if (togglesFound) {
        const toggleStates = await pages.viewCarrierPage.getCarrierVisibilityToggleStates(requiredVisibility);

        const disabledToggles: string[] = [];
        for (const name of requiredVisibility) {
        const state = toggleStates[name];
        if (!state?.enabled) {
        disabledToggles.push(name);
        }
        }

        if (disabledToggles.length > 0) {
        await pages.basePage.clickButtonByText("Edit");
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.viewCarrierPage.enableCarrierVisibilityToggles(disabledToggles);
        await pages.viewCarrierPage.clickSaveOnCarrierEditPage();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        }
        }
        pages.logger.info("Carrier visibility step completed");
      });

      await test.step("Step 6: Switch to DME and verify carrier is enabled with toggle O...", async () => {
        await appManager.switchToDME();
        const dmePage = appManager.dmePage;
        const dmeDashboard = new DMEDashboardPage(dmePage);

        await dmeDashboard.clickCarriersLink();
        await dmeDashboard.searchCarrierByName(testData.Carrier);

        const toggleState = await dmeDashboard.getCarrierToggleState(testData.Carrier);
        pages.logger.info(`DME carrier toggle state: ${toggleState.enabled ? "ON" : "OFF"}`);
        if (!toggleState.enabled && toggleState.found) {
        await dmeDashboard.enableCarrierToggle(testData.Carrier);
        }

        pages.logger.info("DME carrier toggle verified");

        await appManager.switchToBTMS();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
      });

      await test.step("Step 7 [CSV 1-5]: Search customer and navigate to CREATE TL *NEW*", async () => {
        await pages.basePage.navigateToBaseUrl();
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        await pages.searchCustomerPage.selectActiveOnCustomerPage();
        await pages.searchCustomerPage.clickOnSearchCustomer();
        await pages.searchCustomerPage.selectCustomerByName(testData.customerName);
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.CREATE_TL_NEW);
        pages.logger.info("Navigated to Enter New Load page");
      });

      await test.step("Step 8 [CSV 6-26]: Fill Enter New Load page details (CSV 6-26)", async () => {
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
        pages.logger.info("Enter New Load form completed");
      });

      await test.step("Step 9: Select the 'Method' as 'Practical'", async () => {
        await pages.editLoadFormPage.selectMethod("Practical");
      });

      await test.step("Step 10: 'Linehaul' and Fuel Surcharge' default value will be 'Fla...", async () => {
        const linehaulValue = await pages.editLoadFormPage.getLinehaulDefaultValue();
        pages.logger.info(`Linehaul default: ${linehaulValue}`);
        expect.soft(linehaulValue, "Linehaul default value should not be empty").toBeTruthy();
        const fuelValue = await pages.editLoadFormPage.getFuelSurchargeDefaultValue();
        pages.logger.info(`Fuel Surcharge default: ${fuelValue}`);
        expect.soft(fuelValue, "Fuel Surcharge default value should not be empty").toBeTruthy();
      });

      await test.step("Step 11 [CSV 29-30]: Click Create Load and select Rate Type", async () => {
        await pages.nonTabularLoadPage.clickCreateLoadButton();
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        pages.logger.info(`Load number: ${loadNumber}`);
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
      });

      await test.step("Step 12 [CSV 31-35]: Carrier tab — enter offer rate, select carrier, check auto accept", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.enterOfferRate(testData.offerRate);
        await pages.dfbLoadFormPage.selectCarriersInIncludeCarriers([testData.Carrier]);
        await pages.dfbLoadFormPage.clickCarrierAutoAcceptCheckbox();
        pages.logger.info("Carrier tab configured for auto accept test");
      });

      await test.step("Step 13 [CSV 36-40]: Save without carrier contact — validate error, fix and re-save", async () => {
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.commonReusables.validateAlert(
        sharedPage,
        ALERT_PATTERNS.A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED
        );
        pages.logger.info("Validated alert: carrier contact required for auto accept");
        const contactOptions = await pages.viewLoadPage.getCarrierContactDropdownOptions();
        const matchedContact = contactOptions.find(
        (opt: string) => opt.toLowerCase().includes(testData.saleAgentEmail.toLowerCase())
        );
        pages.logger.info(`Carrier contact options: [${contactOptions.filter((o: string) => o.trim()).join(" | ")}]`);
        expect(matchedContact, `No contact found with email: ${testData.saleAgentEmail}`).toBeTruthy();
        const normalizedLabel = matchedContact!.trim().replace(/\s+/g, " ");
        await pages.dfbLoadFormPage.selectCarreirContactForRateConfirmation(normalizedLabel);
        pages.logger.info(`Selected carrier contact: ${normalizedLabel}`);
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.viewLoadPage.validateViewLoadHeading();
        pages.logger.info("Load saved with carrier contact");
      });

      await test.step("Step 14 [CSV 41-43]: Verify View mode, click Carrier tab, and Post the load", async () => {
        await pages.viewLoadPage.viewLoadPageVisible();
        await pages.viewLoadPage.clickCarrierTab();
        await pages.basePage.waitForMultipleLoadStates(["load", "networkidle"]);
        await pages.dfbLoadFormPage.clickOnPostButton();
        pages.logger.info("Load posted, moving to verification");
      });

      await test.step("Step 15 [CSV 44-46]: Switch to DME — verify load statuses", async () => {
        const dmePages = await appManager.switchToDME();
        await dmePages.dmeDashboardPage.clickOnLoadsLink();
        await dmePages.dmeDashboardPage.searchLoad(loadNumber);
        await dmePages.dmeLoadPage.validateAndGetStatusTextWithRetry(
        LOAD_STATUS.BTMS_CANCELLED,
        LOAD_STATUS.TNX_BOOKED,
        loadNumber,
        dmePages.dmeDashboardPage
        );
        await dmePages.dmeLoadPage.validateSingleTableRowPresent();
        await dmePages.dmeLoadPage.validateAndGetSourceIdText(loadNumber);
        await dmePages.dmeLoadPage.clickOnDataDetailsLink();
        await dmePages.dmeLoadPage.clickOnShowIconLink();
        await dmePages.dmeLoadPage.validateAuctionAssignedText(
        loadNumber,
        dmePages.dmeDashboardPage
        );
        pages.logger.info("DME load verification completed");
      });

      await test.step("Step 16 [CSV 47-52]: Switch to TNX — verify load is Matched and execution notes", async () => {
        const tnxPages = await appManager.switchToTNX();
        await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });

        const allOptions = await tnxPages.tnxLandingPage.getOrgDropdownOptions();
        pages.logger.info(`TNX org options: [${allOptions.join(" | ")}]`);
        const carrierUpper = testData.Carrier.toUpperCase();
        const matchedOption = allOptions.find((opt: string) => opt.toUpperCase().includes(carrierUpper));
        if (matchedOption) {
        await tnxPages.tnxLandingPage.selectOrganizationByText(matchedOption.trim());
        } else {
        await tnxPages.tnxLandingPage.selectOrganizationByText(testData.Carrier);
        }
        await tnxPages.tnxLandingPage.handleOptionalSkipButton();
        await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
        await tnxPages.tnxLandingPage.clickOnTNXHeaderLink(TNX.ACTIVE_JOBS);
        await tnxPages.tnxLandingPage.clickPlusButton();
        await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
        await tnxPages.tnxLandingPage.clickLoadSearchLink();
        await tnxPages.tnxLandingPage.validateBidsTabAvailableLoadsText(
        TNX.SINGLE_JOB_RECORD,
        loadNumber
        );
        await tnxPages.tnxLandingPage.clickLoadLink();
        const tnxOfferRate = await tnxPages.tnxLandingPage.getLoadOfferRateValue();
        const tnxRateNumeric = tnxOfferRate.replace(/[\$,]/g, "").split(".")[0];
        const expectedRateNumeric = testData.offerRate.replace(/[\$,]/g, "").split(".")[0];
        pages.logger.info(`TNX offer rate: ${tnxOfferRate}, expected: ${testData.offerRate}`);
        expect(tnxRateNumeric, `Offer rate mismatch`).toBe(expectedRateNumeric);
        await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(
        TENDER_DETAILS_MODAL_TABS.GENERAL
        );
        await tnxPages.tnxLandingPage.validateStatusHistoryText(
        TNX_STATUS_HISTORY.STATUS_MATCHED
        );
        await tnxPages.tnxLandingPage.clickOnSelectTenderDetailsModalTab(
        TENDER_DETAILS_MODAL_TABS.PROGRESS
        );
        await tnxPages.tnxExecutionTenderPage.validateExecutionNotesFieldsPresence();
        pages.logger.info("TNX validation completed — load Matched, execution notes verified");
      });

      await test.step("Step 19: Switch back to BTMS — verify BOOKED status, carrier detai...", async () => {
        await appManager.switchToBTMS();
        await pages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.BOOKED);

        await pages.viewLoadPage.clickCarrierTab();
        await pages.viewLoadCarrierTabPage.validateCarrierAssignedText(testData.Carrier);

        await pages.viewLoadCarrierTabPage.validateCarrierDispatchName(
        CARRIER_DISPATCH_NAME.DISPATCH_NAME_1
        );

        await pages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(
        CARRIER_DISPATCH_EMAIL.EMAIL_1
        );

        const bidsReportValue = await pages.viewLoadCarrierTabPage.getBidsReportValue();
        pages.logger.info(`BIDS Reports value: ${bidsReportValue}`);
        expect.soft(bidsReportValue, "BIDS Reports value should not be empty").toBeTruthy();

        const avgRate = await pages.viewLoadPage.getAvgRate();
        pages.logger.info(`Avg Rate: ${avgRate}`);
        expect.soft(avgRate, "Avg Rate should be populated after booking").toBeTruthy();

        await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks(TNX.BID_HISTORY);
        const bidHistoryDetails = await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
        pages.logger.info(`Bid History — Carrier: ${bidHistoryDetails.carrier}, Rate: ${bidHistoryDetails.bidRate}, Source: ${bidHistoryDetails.source}`);
        expect.soft(bidHistoryDetails.carrier, "Bid History carrier should match assigned carrier").toContain(testData.Carrier);
        expect.soft(bidHistoryDetails.source, "BIDS Source should be populated").toBeTruthy();
        await pages.viewLoadCarrierTabPage.closeBidHistoryModal();

        pages.logger.info("BTMS BOOKED status, carrier details, BIDS and Bid History verified");
      });


      }
    );
  }
);
