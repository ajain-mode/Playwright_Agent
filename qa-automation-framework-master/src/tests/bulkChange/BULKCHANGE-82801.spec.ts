import { test } from "@playwright/test";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { PageManager } from "@utils/PageManager";

test.describe.configure({ retries: 1 });
test.describe.serial(`Bulk Change`, () => {

    let pages: PageManager;
    let sharedPage: any;
    let testData: any;
    let loadNumbers: string[] = [];

    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);
            const testcaseID = `BULKCHANGE-82801`;
            testData = dataConfig.getTestDataFromCsv(dataConfig.bulkChangeData, testcaseID);
            console.log(testData);
            await pages.btmsLoginPage.BTMSLogin(userSetup.bulkChangeUser);
            pages.logger.info(`BTMS login successful - Shared session initialized`);
            await pages.commonReusables.dialogHandler(sharedPage);
        } catch (error) {
            pages.logger.error("Setup failed:", error);
            throw error;
        }
    });

    test(`Case ID: 82801 - Verify that setting Bulk Change Load Status to DISPATCHED triggers EDI tenders.`, { tag: ['@smoke', '@at_bulkchange'] }, async () => {
        await test.step("Navigate to Customers search and Go to Enter New Loads", async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.enterCustomerName(testData.customerName);
            await pages.searchCustomerPage.clickOnSearchCustomer();
            await pages.searchCustomerPage.selectCustomerByName(testData.customerName);
            await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LOAD_TL);
            pages.logger.info(`Navigated to create new load page`);
        });

        await test.step(`Fill load details and create load with Booked status`, async () => {
            await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
            await pages.editLoadLoadTabPage.selectLoadStatus(LOAD_STATUS.ACTIVE);
            await pages.bulkChangeHelper.updateReferencesOnLoadTab(pages);
            const loadNumber = await pages.bulkChangeHelper.createLoadOnBookedStatus(pages, testData);
            await pages.editLoadFormPage.clickOnSaveBtn();
            loadNumbers.push(loadNumber);
            pages.logger.info(`Load created with number: ${loadNumber}`);
        });

        await test.step(`Duplicate the created load`, async () => {
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
            await pages.logger.info("Duplicate Load created successfully");
            await pages.editLoadPage.validateEditLoadHeadingText();
            await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
            await pages.viewLoadPage.checkAutoLoadTenderCheckbox();
            await pages.editLoadCarrierTabPage.clickOnCarrierTab();
            await pages.editLoadCarrierTabPage.enterOfferRate(testData);
            await pages.editLoadCarrierTabPage.selectCarrier1(testData.carrierID);
            const loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
            await pages.editLoadFormPage.clickOnSaveBtn();
            await pages.viewLoadPage.validateViewLoadHeading();
            loadNumbers.push(loadNumber);
            pages.logger.info(`Load created with number: ${loadNumber}`);
        });

        await test.step(`Perform Bulk Change to update Load Status to Dispatched`, async () => {
            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
            await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
            await pages.allLoadsSearchPage.searchMultipleLoads(loadNumbers, pages);
            pages.logger.info(`Navigated to All Loads Search Page`);
            await pages.allLoadsSearchPage.selectAllLoads();
            await pages.allLoadsSearchPage.clickBulkChangeButton();
            pages.logger.info(`Selected created loads for Bulk Change Operation`);
            await pages.selectChangesPage.verifySelectChangesPage();
            await pages.selectChangesPage.selectStatusChange(LOAD_STATUS.DISPATCHED);
            await pages.selectChangesPage.clickNextButton();
            await pages.myBulkLoadsChangesAndImports.waitForBulkChangeSuccessStatus();
            pages.logger.info(`Bulk Change to Dispatched status Performed successfully`);

            await test.step(`Validate EDI 204 Tenders for the Loads and Load History`, async () => {
                for (const loadNumber of loadNumbers) {
                    pages.logger.info(`Validating EDI 204 Tender for Load: ${loadNumber}`);
                    await pages.basePage.searchFromMainHeader(loadNumber);
                    await pages.viewLoadPage.validateViewLoadHeading();
                    await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.DISPATCHED);
                    await pages.viewLoadPage.clickEDITab();
                    await pages.viewLoadEDITabPage.validateEDIDetails(testData.carrier, EDI_CODE.EDI_204, EDI_IN_OUT.OUT, EDI_STATUS.ORIGINAL);
                    await pages.viewLoadPage.validateLoadHistory('status', LOAD_STATUS.BOOKED, LOAD_STATUS.DISPATCHED);
                    pages.logger.info(`EDI 204 triggered for Load and Load History validated for Load: ${loadNumber}`);
                }
            })
        })
    })
})
