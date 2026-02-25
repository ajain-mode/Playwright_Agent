import { test } from "@playwright/test";
import userSetup from "@loginHelpers/userSetup";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import commonReusables from "@utils/commonReusables";

test.describe.configure({ retries: 1 });
test.describe.serial(`Bulk Change - Print BOL, Add and Replace References`, { tag: ['@at_bulkchange_run'] }, () => {
    let pages: PageManager;
    let sharedPage: any;
    let testData: any;
    let loadNumbers: string[] = [];
    let poNumbers: string[] = [];  

    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);

            const testcaseID = `BULKCHANGE-74481`;
            testData = dataConfig.getTestDataFromCsv(dataConfig.bulkChangeData, testcaseID);
            console.log(testData);
            await pages.btmsLoginPage.BTMSLogin(userSetup.bulkChangeUser);
            pages.logger.info(`BTMS login successful - Shared session initialized for multiple test cases`);
            await pages.commonReusables.dialogHandler(sharedPage);

        } catch (error) {
            pages.logger.info("Setup failed:", error);
            throw error;
        }
    });

    test(`Case ID: 74481 - Verify Print BOL > BOL generates multi-page printable PDF for Bulk Change with LTL & ELTL loads.`, { tag: ['@smoke', '@at_bulkchange'] }, async () => {
        test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE * 6);
        await test.step("Navigate to Customers search and Go to Enter New Loads", async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.enterCustomerName(testData.customerName);
            await pages.searchCustomerPage.clickOnSearchCustomer();
            await pages.searchCustomerPage.selectCustomerByName(testData.customerName);
            await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LOAD_LTL);
            pages.logger.info(`Navigated to create new load page`);
        });

        await test.step(`Create LTL load with Booked status`, async () => {
            await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
            await pages.editLoadLoadTabPage.selectLoadStatus(LOAD_STATUS.ACTIVE);
            const references = await pages.bulkChangeHelper.updateReferencesOnLoadTab(pages);
            poNumbers.push(...references.poNumber);
            const loadNumber = await pages.bulkChangeHelper.createLTLLoad(pages, testData);
            loadNumbers.push(loadNumber);
        });

        await test.step(`Create ELTL Load via LTL Quote`, async () => {

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.enterCustomerName(testData.customerName);
            await pages.searchCustomerPage.clickOnSearchCustomer();
            await pages.searchCustomerPage.selectCustomerByName(testData.customerName);
            await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LTL_QUOTE);
            pages.logger.info(`Navigated to NEW LTL QUOTE creation form`);

            await pages.ltlQuoteRequestPage.enterPickUpAndDeliveryZip(testData.shipperZip, testData.consigneeZip);
            await pages.ltlQuoteRequestPage.selectCommodityAndAddDetails(
                testData.shipmentCommodityDescription,
                testData.classOption,
                testData.commLength,
                testData.commWidth,
                testData.commHeight,
                testData.shipmentCommodityWeight,
                testData.shipmentCommodityQty);
            await pages.ltlQuoteRequestPage.clickOnRequestTariffsButton();
            await pages.ltlQuoteRequestPage.clickOnCreateLoadBtn();
            pages.logger.info("LTL Quote Request form filled successfully and requested tariffs");

            await test.step("Verification of tariff table", async () => {
                await pages.editLoadLoadTabPage.closeMarginPopupIfVisible();
                try {
                    await pages.ltlQuoteRequestPage.verifyBookedStatus();
                    pages.logger.info("LTL Quote created successfully and status verified as Booked");
                } catch (error) {
                    pages.logger.error("Error verifying Booked status of LTL Quote:", error);
                }
            });

            await test.step("Enter pick up drop details on edit load page", async () => {
                await pages.editLoadLoadTabPage.selectRateCardValue(testData.rateType);
                const references = await pages.bulkChangeHelper.updateReferencesOnLoadTab(pages);
                poNumbers.push(...references.poNumber);     
                await pages.editLoadPickTabPage.clickOnPickTab();
                await pages.editLoadPickTabPage.selectShipperAddress();
                await pages.editLoadPickTabPage.selectClientByNameShipper(testData);
                await pages.editLoadPickTabPage.enterActualDateValue(
                    pages.commonReusables.getNextTwoDatesFormatted().tomorrow
                );
                await pages.editLoadPickTabPage.enterActualTimeValue(testData.shipperEarliestTime);
                await pages.editLoadPickTabPage.enterDeadlineValue(
                    pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow
                );
                await pages.editLoadPickTabPage.enterDeadlineTimeValue(testData.shipperLatestTime);
                await pages.editLoadDropTabPage.clickDropTab();
                await pages.editLoadDropTabPage.selectConsigneeAddress();
                await pages.editLoadDropTabPage.selectConsigneeByNameConsignee(testData.consigneeName);
                await pages.editLoadDropTabPage.enterActualDateValue(await commonReusables.getDate("tomorrow", "MM/DD/YYYY"));
                await pages.editLoadDropTabPage.enterActualTimeValue(testData.consigneeEarliestTime);
                await pages.editLoadDropTabPage.enterDeadlineDateValue(await commonReusables.getDate("dayAfterTomorrow", "MM/DD/YYYY"));
                await pages.editLoadDropTabPage.enterDeadlineTimeValue(testData.consigneeLatestTime);
                await pages.editLoadPage.validateEditLoadHeadingText();
                const loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
                await pages.editLoadFormPage.clickOnSaveBtn();

                // Wait for load to be completely saved
                await pages.viewLoadPage.validateViewLoadHeading();
                pages.logger.info(`Load created with number: ${loadNumber}`);
                loadNumbers.push(loadNumber);
                pages.logger.info(`PO Numbers: ${poNumbers}`);
                pages.logger.info(`Load Numbers: ${loadNumbers}`);
            });
        });

        await test.step(`Generate BOL PDFs for selected loads`, async () => {
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
        })

        await test.step(`Validate BOL PDF contains 2 pages for each load`, async () => {
            for (const loadNumber of loadNumbers) {
                pages.logger.info(`Validating PDF for Load: ${loadNumber}`);
                await pages.selectChangesPage.validateBOLPdf({
                    expectedPages: 2,
                    loadNumbers: loadNumbers,
                    poNumbers: poNumbers,
                });
            }
            pages.logger.info(`Verified that BOL generates multi-page printable PDF for Bulk Change with LTL and ELTL loads`);
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
            pages.logger.info(`✅ Navigated to Home page, ready for next test`);
        });
    });

    test("Case Id: 61521 - Verify that user can select Pro # and Add Reference.",
        { tag: ['@high', '@at_bulkchange'] }, async () => {
            pages.logger.info("Validating that user can select Pro # and Add Reference.");

            await test.step("Navigate to Load Search and Perform Bulk Change for Add Reference.", async () => {
                await pages.btmsLoginPage.BTMSLogin(userSetup.bulkChangeUser);
                await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
                await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.SEARCH);
                await pages.allLoadsSearchPage.searchMultipleLoads(loadNumbers, pages);
                pages.logger.info(`Navigated to All Loads Search Page`);
                await pages.allLoadsSearchPage.selectAllLoads();
                await pages.allLoadsSearchPage.clickBulkChangeButton();
                pages.logger.info(`Selected created loads for Bulk Change Operation`);
                await pages.selectChangesPage.verifySelectChangesPage();
                await pages.selectChangesPage.selectReferenceChange(REFERENCE_TYPE.PRO);
                const proNumber = await pages.selectChangesPage.enterReferenceValue();
                await pages.selectChangesPage.clickNextButton();
                await pages.myBulkLoadsChangesAndImports.waitForBulkChangeSuccessStatus();
                pages.logger.info(`Bulk Change to Add/Replace References Performed successfully`);

                await test.step(`Validate that references are added correctly`, async () => {
                    for (const loadNumber of loadNumbers) {
                        pages.logger.info(`Validating the add references for Load: ${loadNumber}`);
                        await pages.basePage.searchFromMainHeader(loadNumber);
                        await pages.editLoadCarrierTabPage.clickOnCarrierTab();
                        await pages.selectChangesPage.verifyProNumber(proNumber);
                    }
                });
            });
        });

    test("Case Id: BULKCHANGE-61525 - Validate that new PRO value replaces the existing PRO value on Loads after Bulk Change Replace Reference.",
        { tag: ['@high', '@at_bulkchange'] }, async () => {
            pages.logger.info("Updating  PRO value on Loads after Bulk Change for Replace Reference");

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
                await pages.selectChangesPage.selectReferenceChange(REFERENCE_TYPE.PRO);
                const proNumberReplace = await pages.selectChangesPage.enterReferenceValue();
                await pages.selectChangesPage.clickNextButton();
                await pages.myBulkLoadsChangesAndImports.waitForBulkChangeSuccessStatus();
                pages.logger.info(`Bulk Change to Add/Replace References Performed successfully`);

                await test.step(`Validate that references are replaced correctly`, async () => {
                    for (const loadNumber of loadNumbers) {
                        pages.logger.info(`Validating the replace references for Load: ${loadNumber}`);
                        await pages.basePage.searchFromMainHeader(loadNumber);
                        await pages.editLoadCarrierTabPage.clickOnCarrierTab();
                        await pages.selectChangesPage.verifyProNumber(proNumberReplace);
                    }
                });
            });
        });

    test.afterAll(async () => {
        try {
            await sharedPage.close();
            pages.logger.info("Shared browser session closed successfully.");
        } catch (error) {
            pages.logger.info("Error during teardown:", error);
        }
    });

});


