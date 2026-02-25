import { test } from "@playwright/test";
import userSetup from "@loginHelpers/userSetup";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import loadCreationUtils from "@utils/dfbUtils/loadCreationUtils";

test.describe.configure({ retries: 1 });
test.describe.serial(`Bulk Change - Change Pick/Drop Location`, { tag: ['@at_bulkchange_run'] }, () => {
    let pages: PageManager;
    let sharedPage: any;
    let testData: any;
    let loadNumbers: string[] = [];

    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);

            const testcaseID = `BULKCHANGE-61621`;
            testData = dataConfig.getTestDataFromCsv(dataConfig.bulkChangeData, testcaseID);
            console.log(testData);
            await pages.btmsLoginPage.BTMSLogin(userSetup.bulkChangeUser);
            pages.logger.info(`BTMS login successful - Shared session initialized`);
        } catch (error) {
            pages.logger.error(`Setup failed: ${error}`);
            throw error;
        }
    });

    test(`Case ID: 61621 - Verify user can successfully change the Pick/Drop location for loads belonging to a single customer.`, { tag: ['@smoke', '@at_bulkchange'] }, async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE * 6);
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        await pages.searchCustomerPage.clickOnSearchCustomer();
        await pages.searchCustomerPage.selectCustomerByName(testData.customerName);
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LOAD_TL);
        pages.logger.info(`Navigated to Create New Load Page`);

        await test.step(`Fill load details and create load with Active status`, async () => {
            await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
            await pages.editLoadLoadTabPage.selectLoadStatus(LOAD_STATUS.ACTIVE);
            const loadNumber = await loadCreationUtils.fillTabsAndCreateLoad(pages, testData);
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);
            await pages.editLoadCarrierTabPage.enterOfferRate(testData);
            await pages.editLoadFormPage.clickOnSaveBtn();
            loadNumbers.push(loadNumber);
            pages.logger.info(`Load created with number: ${loadNumber}`);
        });

        await test.step(`Duplicate the recently created load`, async () => {
            await pages.duplicateLoadPage.clickOnDuplicateButton();
            await pages.duplicateLoadPage.selectDuplicateIconCheckBox([
                DUPLICATE_LOAD_CHECKBOX.OFFICE_INFO,
                DUPLICATE_LOAD_CHECKBOX.REFERENCES_INFO,
                DUPLICATE_LOAD_CHECKBOX.CUSTOMER_INFO,
                DUPLICATE_LOAD_CHECKBOX.STOP_INFO,
                DUPLICATE_LOAD_CHECKBOX.CARRIER_INFO,
                DUPLICATE_LOAD_CHECKBOX.VENDOR_INFO,
            ]);
            await pages.duplicateLoadPage.clickOkButton();
            pages.logger.info("Duplicate Load created successfully");
            await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
            await pages.editLoadPage.clickOnTab(TABS.CARRIER);
            await pages.editLoadCarrierTabPage.enterOfferRate(testData);
            await pages.editLoadPage.validateEditLoadHeadingText();
            const loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
            await pages.editLoadFormPage.clickOnSaveBtn();
            await pages.viewLoadPage.validateViewLoadHeading();
            loadNumbers.push(loadNumber);
            pages.logger.info(`Load created with number: ${loadNumber}`);
            pages.logger.info(`Load numbers: ${loadNumbers}`);
        })

        await test.step(`Change the Origin Location of the Loads`, async () => {
            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
            await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
            await pages.allLoadsSearchPage.searchMultipleLoads(loadNumbers, pages)
            pages.logger.info(`Navigated to All Loads Search Page`);
            await pages.allLoadsSearchPage.selectAllLoads();
            await pages.allLoadsSearchPage.clickBulkChangeButton();
            pages.logger.info(`Selected created loads for Bulk Change Operation`);
            await pages.selectChangesPage.verifySelectChangesPage();
            await pages.selectChangesPage.selectOriginChange(testData)
            await pages.selectChangesPage.clickNextButton();
            await pages.myBulkLoadsChangesAndImports.waitForBulkChangeSuccessStatus();
        })

        await test.step(`Change the Destination Location of the Loads`, async () => {
            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
            await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
            await pages.allLoadsSearchPage.searchMultipleLoads(loadNumbers, pages);
            pages.logger.info(`Navigated to All Loads Search Page`);
            await pages.allLoadsSearchPage.selectAllLoads();
            await pages.allLoadsSearchPage.clickBulkChangeButton();
            pages.logger.info(`Selected created loads for Bulk Change Operation`);
            await pages.selectChangesPage.verifySelectChangesPage();
            await pages.selectChangesPage.selectDestinationChange(testData)
            await pages.selectChangesPage.clickNextButton();
            await pages.myBulkLoadsChangesAndImports.waitForBulkChangeSuccessStatus();
        })

        await test.step(`Validate Origin and Destination locations on loads`, async () => {
            for (const loadNumber of loadNumbers) {
                pages.logger.info(`Validating Origin/Destination for Load: ${loadNumber}`);
                await pages.basePage.searchFromMainHeader(loadNumber);
                await pages.viewLoadPage.clickPickTab();
                await pages.selectChangesPage.validateOriginName(testData)
                await pages.viewLoadPage.clickDropTab();
                await pages.selectChangesPage.validateDestinationName(testData);
                pages.logger.info(`Origin and Destination locations validated successfully for Load: ${loadNumber}`);
            }
        })
    });
});