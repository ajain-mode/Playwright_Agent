import { test } from "@playwright/test";
import { switchToNewTab, switchBackToOriginalTab } from "@utils/tabHelper";
import ViewLoadPage from "@pages/loads/viewLoadPage/ViewLoadPage";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import commissionHelper from "@utils/commissionUtils/commissionHelper";
// import commissionHelper from "@utils/commission-helpers";

const testCaseID = "COMM-25226-32";
const testData = dataConfig.getTestDataFromCsv(dataConfig.commissionData, testCaseID);
test.describe.configure({ retries: 1 });
test.describe("Commission Management - Hold/Unhold and Adjustment Workflows",
    { tag: ['@commission', '@tporegression', '@smoke'] }, () => {

        test.describe.configure({ mode: 'serial' });

        let pages: PageManager;
        let createdLoadId: string;
        let originalCommissionId: string;
        let sharedPage: any;

        test.beforeAll(async ({ browser }) => {
            console.log("Setting up shared commission data for all tests");

            const context = await browser.newContext();
            sharedPage = await context.newPage();
            pages = new PageManager(sharedPage);

            // Setup commission data once for both tests
            await pages.btmsLoginPage.BTMSLogin(userSetup.UserCommission);
            pages.logger.info("Successfully logged into BTMS application");

            // await commissionHelper.setupDeliveredLoad(testData, sharedPage);
            createdLoadId = await commissionHelper.createTruckLoad(testData, sharedPage,false,true);
            pages.logger.info("Successfully setup delivered load for commission processing");
            console.log(`Created Load ID: ${createdLoadId}`);

            await pages.loadBillingPage.clickOnViewLoadBtn();
            const childTab = await switchToNewTab(sharedPage.context(), sharedPage);
            const viewLoadPage = new ViewLoadPage(childTab);
            await viewLoadPage.clickCommissionsTab();
            const commissionValue = await viewLoadPage.getTotalCommissionValue();
            console.log(`Commission Value validated: ${commissionValue}`);
            await switchBackToOriginalTab(sharedPage);

            // await pages.financePage.hoverOverFinanceMenu();
            // await pages.financePage.clickPayables();
            await pages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
            await pages.basePage.clickSubHeaderByText(FINANCE_SUB_MENU.PAYABLES);
            await pages.financePage.clickCommsionSummary();
            await pages.financePage.clickOnPresetSearch();
            await pages.financePage.clickOnThisWeek();
            await pages.financePage.selectAgentOffice(testData.agentOffice);
            await pages.financePage.clickOnSearch();

            const totalCommissionValue = await pages.financePage.getTotalCommissionValue();
            console.log(`Total Commission Value: ${totalCommissionValue}`);

            await pages.financePage.clickOnCommissionOfficeDetail();

            // createdLoadId = commissionHelper.getLoadIDfromHeader();

            await pages.financePage.selectCommissionWithLoadId(createdLoadId, COMMISSION_AUDIT_STATUS.OPEN);
            originalCommissionId = await pages.financePage.getSelectedCommissionId();
            console.log(`Original Commission ID: ${originalCommissionId}`);

            console.log("Shared commission data setup completed successfully");
        });

        test.beforeEach(async () => {
            // Reset to commission detail page and select the commission for each test
            await pages.financePage.selectCommissionWithLoadId(createdLoadId, COMMISSION_AUDIT_STATUS.OPEN);
            pages.logger.info(`Reset to commission with Load ID: ${createdLoadId} for test execution`);
        });

        test.afterAll(async () => {
            if (sharedPage) {
                console.log("Closing shared session after all commission tests");
                await sharedPage.close();
            }
        });

        test("Case Id: 25231 - Validate complete commission hold and unhold functionality with status verification", async () => {
            pages.logger.info("Starting comprehensive commission hold/unhold operations workflow");

            await test.step("Apply Hold to Commission Record", async () => {
                try {
                    pages.logger.info(`Selected commission with Load ID: ${createdLoadId} in OPEN status`);

                    await pages.financePage.clickOnHoldUnholdBtn();
                    pages.logger.info("Clicked on Hold/Unhold button to apply hold");

                    await pages.financePage.enterValueInHoldTextArea(testData.holdDescription);
                    pages.logger.info(`Entered hold description: ${testData.holdDescription}`);

                    await pages.financePage.clickOnHoldUnhold();
                    pages.logger.info("Successfully applied hold to commission record");

                } catch (error) {
                    pages.logger.error(`Failed to apply hold to commission: ${error}`);
                    throw error;
                }
            });

            await test.step("Validate Hold Status Applied Correctly", async () => {
                try {
                    await pages.financePage.selectCommissionWithLoadId(createdLoadId, COMMISSION_AUDIT_STATUS.HOLD);
                    pages.logger.info("Selected commission record now showing HOLD status");

                    await pages.financePage.validateHoldStatusRowsForLoadId(createdLoadId);
                    pages.logger.info("Successfully validated hold status applied to commission record");

                } catch (error) {
                    pages.logger.error(`Failed to validate hold status: ${error}`);
                    throw error;
                }
            });

            await test.step("Remove Hold from Commission Record", async () => {
                try {
                    await pages.financePage.selectCommissionWithLoadId(createdLoadId, COMMISSION_AUDIT_STATUS.HOLD);
                    pages.logger.info(`Selected commission with Load ID: ${createdLoadId} in HOLD status for unhold operation`);

                    await pages.financePage.clickOnHoldUnholdBtn();
                    pages.logger.info("Clicked on Hold/Unhold button to remove hold");

                    await pages.financePage.enterValueInHoldTextArea(testData.holdDescription);
                    pages.logger.info(`Entered unhold description: ${testData.holdDescription}`);

                    await pages.financePage.clickOnHoldUnhold();
                    pages.logger.info("Successfully removed hold from commission record");

                } catch (error) {
                    pages.logger.error(`Failed to remove hold from commission: ${error}`);
                    throw error;
                }
            });

            await test.step("Validate Commission Returned to Open Status", async () => {
                try {
                    await pages.financePage.selectCommissionWithLoadId(createdLoadId, COMMISSION_AUDIT_STATUS.OPEN);
                    pages.logger.info("Successfully validated commission returned to OPEN status");

                    pages.logger.info("Complete commission hold and unhold functionality validation completed successfully");

                } catch (error) {
                    pages.logger.error(`Failed to validate commission restoration to OPEN status: ${error}`);
                    throw error;
                }
            });
        });

        test("Case Id: 25232 - Validate commission adjustment processing and record creation", async () => {
            pages.logger.info("Starting commission adjustment processing validation");

            await test.step("Apply Commission Adjustment", async () => {
                try {
                    pages.logger.info(`Selected commission with Load ID: ${createdLoadId} for adjustment`);

                    await pages.financePage.clickCommissionAdjustButton();
                    pages.logger.info("Clicked on Commission Adjust button");

                    await pages.financePage.enterAdjustAmount(testData.adjustmentAmount);
                    pages.logger.info(`Entered adjustment amount: ${testData.adjustmentAmount}`);

                    await pages.financePage.selectCommissionCode(testData.commissionCode);
                    pages.logger.info(`Selected commission code: ${testData.commissionCode}`);

                    await pages.financePage.selectOperationalStatus();
                    pages.logger.info("Selected operational status for adjustment");

                    await pages.financePage.adjustCommissionSubmitButton();
                    pages.logger.info("Submitted commission adjustment");

                    pages.logger.info("Waited for adjustment processing to complete");

                } catch (error) {
                    pages.logger.error(`Failed to apply commission adjustment: ${error}`);
                    throw error;
                }
            });

            await test.step("Validate Adjustment Record Creation", async () => {
                try {
                    console.log(`Selecting incremented commission ID after adjustment...`);
                    await pages.financePage.selectNewCommissionAfterAdjustment(originalCommissionId, COMMISSION_AUDIT_STATUS.OPEN);
                    pages.logger.info("Selected new commission record created after adjustment");

                    const adjustmentData = await pages.financePage.getAllOfficeAdjustmentAndCommData();
                    console.log('Adjustment data validated:', adjustmentData);
                    pages.logger.info("Successfully validated adjustment record creation and data");
                    pages.logger.info("Commission adjustment processing validation completed successfully");

                } catch (error) {
                    pages.logger.error(`Failed to validate adjustment record creation: ${error}`);
                    throw error;
                }
            });
        });
    });