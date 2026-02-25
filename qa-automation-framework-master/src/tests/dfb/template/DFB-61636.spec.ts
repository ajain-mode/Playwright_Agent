import { test } from "@playwright/test";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import { PageManager } from "@utils/PageManager";
import dfbCrossAppValidator from "@utils/dfbUtils/dfbCrossAppValidation";

const testcaseID = "DFB-61636";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let totalMiles: string;
let pages: PageManager;
//test.describe.configure({ retries: 1 });
test.describe(
  "Create a load through template and validate DME and TNX",
  { tag: ["@dfb","@smoke","@loadposting","@tporegression","@matchbid"] },
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

    test("Case Id: 61636 : Create a load through template and validate DME and TNX", async () => {
     let cargoValue: string;
     const toggleSettingsValue = pages.toggleSettings.enable_DME;
      // Login to BTMS
      await test.step("Login BTMS", async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT);
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        pages.logger.info("BTMS Login Successful");
      });

      // Set skipNavigateToLoad to true or false as needed for your test scenario
      const skipNavigateToLoad = true; // Change to true to skip navigation
      await test.step("Pre-Conditions setup for creating a load", async () => {
        cargoValue = await pages.dfbHelpers.setupDFBTestPreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.enabledAutoPost, // ← Now passed as argument
          testData.salesAgent,
          testData.customerName,
          CARGO_VALUES.DEFAULT,
          LOAD_TYPES.CREATE_TL_NEW,
          false,
          true,
          skipNavigateToLoad
        );
      });

      await test.step("Post a Load manually through a template", async () => {
        await pages.basePage.hoverOverClickOnLoads();
        await pages.basePage.clickOnTemplateSubMenu();
         await pages.loadTemplateSearchPage.searchTemplate(
          undefined,
          undefined,
          undefined,
          CUSTOMER_NAME.CUSTOMER_1

        );
        await pages.loadTemplateSearchPage.selectTemplateRecord(
          LOAD_TEMPLATE_SEARCH_PAGE.TEMPLATE_VALUE_1
        );
        await pages.editTemplatePage.clickHeaderButton(BUTTONS.EDIT);

        await test.step("Enter the details for Pick Tab", async () => {
          await pages.editTemplatePage.clickViewTemplateTabs(TABS.PICK);
          await pages.editTemplatePage.enterCompletePickTabDetails(
            pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
            testData.shipperEarliestTime,
            pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
            testData.shipperLatestTime
          );
          pages.logger.info("Pick Tab details entered successfully");
        });

        await test.step("Enter the details for Drop Tab", async () => {
          await pages.editTemplatePage.clickViewTemplateTabs(TABS.DROP);
          await pages.editTemplatePage.enterCompleteDropTabDetails(
            pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
            testData.consigneeEarliestTime,
            pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
            testData.consigneeLatestTime
          );
          pages.logger.info("Drop Tab details entered successfully");
        });

        pages.logger.info("Click on Save buttton and Create Load button");
        await pages.editTemplatePage.clickOnSaveBtn();
        await pages.editTemplatePage.clickHeaderButton(BUTTONS.CREATE_LOAD);

        await test.step("Enter offer rate, save, and perform DFB Validation across app like DME and TNX", async () => {
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
    });
  }
);
