import { expect, test } from "@playwright/test";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import { PageManager } from "@utils/PageManager";
import ediHelper from "@utils/ediUtils/ediHelper";
import dynamicDataAPI from "@config/dynamicDataAPI";
import apiRequests from "@api/apiRequests";
import dataConfigAPI from "@config/dataConfigAPI";
import dfbHelpers from "@utils/dfbUtils/dfbHelpers";
import ediReplacementsHelper from "@utils/ediUtils/ediReplacementsHelper";
import dfbCrossAppValidator from "@utils/dfbUtils/dfbCrossAppValidation";
import commonReusables from "@utils/commonReusables";

const testcaseID = "DFB-61634";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let totalMiles: string;
let pages: PageManager;
let response: any;
let bolNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial(
  "Create a load through EDI and post to TNX through enable auto post feature  and Match Bid, with verifications in DME and BTMS",
  {
    tag: ["@dfb","@loadposting","@tporegression","@matchbid"],
  },
  () => {
    test.beforeAll(async ({ browser }) => {
      // Create shared context and page that will persist across tests
      sharedContext = await browser.newContext();
      sharedPage = await sharedContext.newPage();
      appManager = new MultiAppManager(sharedContext, sharedPage);
      pages = appManager.btmsPageManager;
    });

    test.afterAll(async () => {
      // Cleanup after all tests
      if (appManager) {
        await appManager.closeAllSecondaryPages();
      }
      if (sharedContext) {
        await sharedContext.close();
      }
    });

    test("Case Id: 61634 :Create a load through EDI and post to TNX through enable auto post feature  and Match Bid, with verifications in DME and BTMS", async () => {
      const toggleSettingsValue = pages.toggleSettings.enable_DME;
      // Step 1: Login and setup
      await test.step("Login BTMS", async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT);
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        pages.logger.info("BTMS Login Successful");
      });

      await test.step("Setup Customer PreCondition", async () => {
        await ediHelper.disableAutoOverlay(sharedPage, testData.customerName);
        await pages.viewCustomerPage.clickHomeButton();
        await sharedPage.waitForLoadState("networkidle");
      });

      await test.step("Setup DFB Test Environment", async () => {
        await dfbHelpers.setupOfficePreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.enabledAutoPost
        );

        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.salesAgent);
        console.log("Switched user to that has agent as its salesperson");

        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        await pages.postAutomationRulePage.verifyCustomerPostAutomationRule(
          testData.consigneeEDICode
        );

        console.log("Verified no post automation rule for customer");
      });

      // Step 2: Send EDI 204S
      bolNumber = (await dynamicDataAPI.getBolNumber()) + await commonReusables.generateRandomNumber(3).toString();
      console.log("Generated BOL Number:", bolNumber);
      const replacements = await ediReplacementsHelper.getEdi204Replacements(
        bolNumber,
        testData
      );
      const updatedRawData = await dynamicDataAPI.dynamicUpdateEdi204TLRawData(
        dataConfigAPI.inboundEdi204TruckLoad_Waterfall,
        await replacements
      );

      ({ response } = await apiRequests.sendEDI204Request(updatedRawData));
      console.log("Sent EDI with BOL Number:", bolNumber);
      console.log("Status Code:", response.status);
      expect(response.status).toBe(201);

      // Step 3: Accept Load from Load Tender 204
      await test.step("Auto accept Load from Load Tender 204", async () => {
        await pages.homePage.clickOnLoadButton();
        await pages.loadsPage.clickOnEDI204LoadTender();
        await pages.edi204LoadTendersPage.filterBolNumber(bolNumber);
        await pages.edi204LoadTendersPage.clickRowWithBolNumber(bolNumber);
        await pages.loadTender204Page.acceptLoadWithOut990();
      });

      await test.step("Enter offer rate, save, and perform DFB Validation across app like DME and TNX", async () => {
        await pages.viewLoadPage.clickEditButton();
        //await pages.editLoadPage.selectRateType(testData.rateType);
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
         await pages.editLoadPage.validateEditLoadHeadingText();
        let loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(`Load ID: ${loadNumber}`);
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        pages.logger.info(
          "Load created successfully and navigated to Edit Load page"
        );
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.viewLoadPage.validateViewLoadHeading();
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        totalMiles = await pages.editLoadFormPage.getTotalMilesValue();
        await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);
        await dfbCrossAppValidator.completePostSaveAndCrossAppValidation({
          pages,
          appManager,
          sharedPage: sharedPage,
          testData,
          loadNumber,
          totalMiles,
        });
      });
    });
  }
);
