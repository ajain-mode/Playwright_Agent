import { test } from "@playwright/test";
import userSetup from "@loginHelpers/userSetup";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import ediHelper from "@utils/ediUtils/ediHelper";

test.describe.configure({ retries: 1 });
test.describe.serial(`Bulk Change - Intermodal Loads`, () => {

    let pages: PageManager;
    let sharedPage: any;
    let loadNumbers: string[] = [];
    let poNumber: string;
    let testData: any;

    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);
            await pages.btmsLoginPage.BTMSLogin(userSetup.bulkChangeUser);
            pages.logger.info(`BTMS login successful - Shared session initialized for multiple test cases`);
        } catch (error) {
            pages.logger.error("Setup failed:", error);
            throw error;
        }
    });

    test(`Case ID: 82730 - Verify Bulk Change applies to Intermodal loads without restrictions`, { tag: ['@smoke', '@at_bulkchange'] }, async () => {
        test.setTimeout(WAIT.XXLARGE * 12); 
        const testcaseID = `BULKCHANGE-82730`;
        testData = dataConfig.getTestDataFromCsv(dataConfig.bulkChangeData, testcaseID);
        console.log(testData);
        await test.step("Navigate to Customers search and Go to Intermodal", async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.enterCustomerName(testData.customerName);
            await pages.searchCustomerPage.clickOnSearchCustomer();
            await pages.searchCustomerPage.selectCustomerByName(testData.customerName);
            await pages.viewCustomerPage.clickCreateLoadLink(LOAD_TYPES.NEW_LOAD_INTERMODAL);
            pages.logger.info(`Navigated to create new load page`);
        });

        await test.step("Create Intermodal Load", async () => {
            const loadNumber = await ediHelper.createIntermodalLoadWithBookedStatus(sharedPage, testData);
            await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.BOOKED);
            loadNumbers.push(loadNumber);
            pages.logger.info(`Load created with number: ${loadNumber}`);
        })

        await test.step(`Duplicate the created load`, async () => {
            await pages.duplicateLoadPage.clickOnDuplicateButton();
            await pages.duplicateLoadPage.selectDuplicateIconCheckBox([
                DUPLICATE_LOAD_CHECKBOX.OFFICE_INFO,
                DUPLICATE_LOAD_CHECKBOX.REFERENCES_INFO,
                DUPLICATE_LOAD_CHECKBOX.CUSTOMER_INFO,
                DUPLICATE_LOAD_CHECKBOX.STOP_INFO,
                DUPLICATE_LOAD_CHECKBOX.CARRIER_INFO,
                DUPLICATE_LOAD_CHECKBOX.VENDOR_INFO,
                DUPLICATE_LOAD_CHECKBOX.CUSTOMS_INFO,
                DUPLICATE_LOAD_CHECKBOX.RAIL_INFO
            ]);
            await pages.duplicateLoadPage.clickOkButton();
            await pages.logger.info("Duplicate Load created successfully");
            await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
            await pages.editLoadPage.validateEditLoadHeadingText();
            const loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
            await pages.editLoadFormPage.clickOnSaveBtn();
            await pages.viewLoadPage.validateViewLoadHeading();
            loadNumbers.push(loadNumber);
            pages.logger.info(`Load created with number: ${loadNumber}`);
        })

        await test.step(`Bulk Change Loads status to DISPATCHED`, async () => {
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

            //Validate the status change on load tab
            for (const loadNumber of loadNumbers) {
                pages.logger.info(`Validating the load status to be DISPATCHED: ${loadNumber}`);
                await pages.basePage.searchFromMainHeader(loadNumber);
                await pages.viewLoadPage.validateViewLoadHeading();
                await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.DISPATCHED);
            }
            pages.logger.info(`All loads validated - DISPATCHED status completed for ${loadNumbers.length} loads`);
        });

        await test.step(`Bulk Change Loads status to DELIVERED`, async () => {
            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
            await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
            await pages.allLoadsSearchPage.searchMultipleLoads(loadNumbers, pages);
            pages.logger.info(`Navigated to All Loads Search Page`);
            await pages.allLoadsSearchPage.selectAllLoads();
            await pages.allLoadsSearchPage.clickBulkChangeButton();
            pages.logger.info(`Selected created loads for Bulk Change Operation`);
            await pages.selectChangesPage.verifySelectChangesPage();
            await pages.selectChangesPage.selectStatusChange(LOAD_STATUS.DELIVERED);
            await pages.selectChangesPage.clickNextButton();
            await pages.myBulkLoadsChangesAndImports.waitForBulkChangeSuccessStatus();
            pages.logger.info(`Bulk Change to Delivered status Performed successfully`);

            //Validate the status change on load tab
            for (const loadNumber of loadNumbers) {
                pages.logger.info(`Validating the load status to be DELIVERED: ${loadNumber}`);
                await pages.basePage.searchFromMainHeader(loadNumber);
                await pages.viewLoadPage.validateViewLoadHeading();
                await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.DELIVERED);
            }
            pages.logger.info(`All loads validated - DELIVERED status completed for ${loadNumbers.length} loads`);
        });

        await test.step(`Bulk Change Loads status to DELIVERED FINAL`, async () => {
            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
            await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
            await pages.allLoadsSearchPage.searchMultipleLoads(loadNumbers, pages);
            pages.logger.info(`Navigated to All Loads Search Page`);
            await pages.allLoadsSearchPage.selectAllLoads();
            await pages.allLoadsSearchPage.clickBulkChangeButton();
            pages.logger.info(`Selected created loads for Bulk Change Operation`);
            await pages.selectChangesPage.verifySelectChangesPage();
            await pages.selectChangesPage.selectStatusChange(LOAD_STATUS.DELIVERED_FINAL);
            await pages.selectChangesPage.clickNextButton();
            await pages.myBulkLoadsChangesAndImports.waitForBulkChangeSuccessStatus();
            pages.logger.info(`Bulk Change to Delivered Final status Performed successfully`);

            //Validate the status change on load tab
            for (const loadNumber of loadNumbers) {
                pages.logger.info(`Validating the load status to be INVOICED: ${loadNumber}`);
                await pages.basePage.searchFromMainHeader(loadNumber);
                await pages.viewLoadPage.validateViewLoadHeading();
                await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.INVOICED);
            }
            pages.logger.info(`All loads validated - INVOICED status completed for ${loadNumbers.length} loads`);
        });

        await test.step("Navigate to Load Search and Perform Bulk Change for Add Reference.", async () => {
            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
            await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
            await pages.allLoadsSearchPage.searchMultipleLoads(loadNumbers, pages);
            pages.logger.info(`Navigated to All Loads Search Page`);
            await pages.allLoadsSearchPage.selectAllLoads();
            await pages.allLoadsSearchPage.clickBulkChangeButton();
            pages.logger.info(`Selected created loads for Bulk Change Operation`);
            await pages.selectChangesPage.verifySelectChangesPage();
            await pages.selectChangesPage.selectReferenceChange(REFERENCE_TYPE.PO);
            poNumber = await pages.selectChangesPage.enterReferenceValue();
            await pages.selectChangesPage.clickNextButton();
            await pages.myBulkLoadsChangesAndImports.waitForBulkChangeSuccessStatus();
            pages.logger.info(`Bulk Change to Add References Performed successfully`);

            //Validate the Added Reference on Load tab
            for (const loadNumber of loadNumbers) {
                pages.logger.info(`Validating the add references for Load: ${loadNumber}`);
                await pages.basePage.searchFromMainHeader(loadNumber);
                await pages.viewLoadPage.validateViewLoadHeading();
                await pages.selectChangesPage.verifyPONumber(poNumber);
            }
            pages.logger.info(`All loads validated - Add Reference completed for ${loadNumbers.length} loads`);
        });

        await test.step("Navigate to Load Search and Perform Bulk Change for Replace Reference.", async () => {
            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
            await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
            await pages.allLoadsSearchPage.searchMultipleLoads(loadNumbers, pages);
            pages.logger.info(`Navigated to All Loads Search Page`);
            await pages.allLoadsSearchPage.selectAllLoads();
            await pages.allLoadsSearchPage.clickBulkChangeButton();
            pages.logger.info(`Selected created loads for Bulk Change Operation`);
            await pages.selectChangesPage.verifySelectChangesPage();
            await pages.selectChangesPage.selectReferenceChange(REFERENCE_TYPE.PO);
            const poNumberReplace = await pages.selectChangesPage.enterReferenceValue();
            await pages.selectChangesPage.clickNextButton();
            await pages.myBulkLoadsChangesAndImports.waitForBulkChangeSuccessStatus();
            pages.logger.info(`Bulk Change to Replace References Performed successfully`);

            //Validate the Replaced Reference on load tab
            for (const loadNumber of loadNumbers) {
                pages.logger.info(`Validating the add references for Load: ${loadNumber}`);
                await pages.basePage.searchFromMainHeader(loadNumber);
                await pages.viewLoadPage.validateViewLoadHeading();
                await pages.selectChangesPage.verifyPONumber(poNumberReplace);
                pages.logger.info(`All loads validated - Replace Reference completed for ${loadNumbers.length} loads`);
            }
        });

        await test.step(`Validate generated BOL PDF for Intermodal loads`, async () => {
            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
            await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
            await pages.allLoadsSearchPage.searchMultipleLoads(loadNumbers, pages)
            pages.logger.info(`Navigated to All Loads Search Page`);
            await pages.allLoadsSearchPage.selectAllLoads();
            await pages.allLoadsSearchPage.clickBulkChangeButton();
            pages.logger.info(`Selected created loads for Bulk Change Operation`);
            await pages.selectChangesPage.selectBOLPrintOption(BOL_HEADER_STYLE.BOL);
            pages.logger.info(`PDF is generated and open in new tab...`);
        });

        await test.step(`Validate BOL PDF contains 2 pages for each load`, async () => {
            pages.logger.info(`Validating PDF for Intermodal Loads: ${loadNumbers}`);
            await pages.selectChangesPage.validateBOLPdf();
            pages.logger.info(`Verified BOL PDF for Intermodal loads`);
        });

        await test.step(`Close PDF tab and return to main browser`, async () => {
            const allPages = sharedPage.context().pages();
            pages.logger.info(`📋 Total tabs before cleanup: ${allPages.length}`);

            // Close all tabs except the first one (main BTMS tab)
            for (let i = allPages.length - 1; i > 0; i--) {
                await allPages[i].close();
                pages.logger.info(`✅ Closed tab ${i + 1}: ${allPages[i].url()}`);
            }
            await allPages[0].bringToFront();
            pages.logger.info(`✅ Returned to main BTMS browser tab`);

            await pages.basePage.clickHomeButton();
            pages.logger.info(`PDF tab closed and returned to main browser successfully`);
        });

        await test.step(`Change the Origin Location for Intermodal Loads`, async () => {
            await pages.btmsLoginPage.BTMSLogin(userSetup.bulkChangeUser);
            await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
            await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
            await pages.allLoadsSearchPage.searchMultipleLoads(loadNumbers, pages);
            pages.logger.info(`Navigated to All Loads Search Page`);
            await pages.allLoadsSearchPage.selectAllLoads();
            await pages.allLoadsSearchPage.clickBulkChangeButton();
            pages.logger.info(`Selected created loads for Bulk Change Operation`);
            await pages.selectChangesPage.verifySelectChangesPage();
            await pages.selectChangesPage.selectOriginChange(testData);
            await pages.selectChangesPage.clickNextButton();
            await pages.myBulkLoadsChangesAndImports.waitForBulkChangeSuccessStatus();
        });

        await test.step(`Change the Destination Location for Intermodal Loads`, async () => {
            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
            await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
            await pages.allLoadsSearchPage.searchMultipleLoads(loadNumbers, pages);
            pages.logger.info(`Navigated to All Loads Search Page`);
            await pages.allLoadsSearchPage.selectAllLoads();
            await pages.allLoadsSearchPage.clickBulkChangeButton();
            pages.logger.info(`Selected created loads for Bulk Change Operation`);
            await pages.selectChangesPage.verifySelectChangesPage();
            await pages.selectChangesPage.selectDestinationChange(testData);
            await pages.selectChangesPage.clickNextButton();
            await pages.myBulkLoadsChangesAndImports.waitForBulkChangeSuccessStatus();
        })

        //Validate the Updated Origin and Destination locations on Pick 1 and Drop 1 tabs
        await test.step(`Validate Origin and Destination locations for Intermodal loads`, async () => {
            for (const loadNumber of loadNumbers) {
                pages.logger.info(`Validating Origin/Destination for Load: ${loadNumber}`);
                await pages.basePage.searchFromMainHeader(loadNumber);
                await pages.viewLoadPage.clickPickTab();
                await pages.selectChangesPage.validateOriginName({ newOriginLocation: testData.newOriginLocation });
                await pages.viewLoadPage.selectDrop1OnLoadTab();
                await pages.selectChangesPage.validateDestinationName({ newDestinationLocation: testData.newDestinationLocation });
                pages.logger.info(`Origin and Destination locations are validated successfully for Load: ${loadNumber}`);
            }
        });
    });
})

