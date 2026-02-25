import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import test, { Page, Browser } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";
import reusableData from "@utils/reusableData";
test.describe.configure({ retries: 2 });
test.describe.serial("LTL Quotes with Accessorials - Mode Rating Engine - Quote from Mode (TRITAN)", { tag: ['@tporegression', '@smoke'] }, () => {

    let pages: PageManager;
    let testData: any;
    let page: Page;
    let browser: Browser;
    let shipmentId: string;

    test.beforeAll(async ({ browser: browserInstance }) => {
        try {
            browser = browserInstance;
            page = await browser.newPage();
            pages = new PageManager(page);
            await pages.tritanLoginPage.LoginTRITAN(userSetup.tritanCustomer, userSetup.tritanCustomerPassword);
            pages.logger.info("TRITAN login successful");

        } catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    });

    test.afterAll(async () => {
        try {
            if (browser) {
                // Close all contexts and pages
                const contexts = browser.contexts();
                await Promise.all(
                    contexts.map(context =>
                        Promise.all(context.pages().map(page =>
                            page.isClosed() ? Promise.resolve() : page.close()
                        ))
                    )
                );
                pages?.logger?.info("All pages closed successfully");
            }
        } catch (error) {
            pages?.logger?.warn("Cleanup warning:", error);
        }
    });
    /**
     * Test Case ID: BANYAN-67957
     * Description: LTL Quotes with Accessorials - Mode Rating Engine - Create load from quote
     * Tags: @tporegression, @banyan, @p44, @ltlquote
     * @author Rohit Singh
     * @created 10-11-2025
     */
    test("Case Id: 67957 - LTL Quotes with Accessorials - Mode Rating Engine - Create load from quote", { tag: ['@tporegression', '@banyan', '@p44', '@ltlquote'] }, async () => {
        const testCaseID = "BANYAN-67957";
        testData = dataConfig.getTestDataFromCsv(dataConfig.banyanData, testCaseID);
        await test.step('Create Quote', async () => {
            await pages.customerDemoPortalPage.clickAddQuickQuote();
            await pages.addQuickQuotePage.enterPickDetails(testData.shipperZip);
            await pages.addQuickQuotePage.enterDestinationDetails(testData.consigneeZip);
            await pages.addQuickQuotePage.enterItemDetails(testData.commQuantity, testData.commLength, testData.commWidth, testData.commHeight, testData.commWeight, testData.commDesc);
            // await pages.addQuickQuotePage.selectAssessorials(ACCESSORIALS_NAME.LIFT_GATE_ORIGIN, ACCESSORIALS_NAME.LIFT_GATE_DESTINATION);
            await pages.addQuickQuotePage.selectAssessorials(ACCESSORIALS_NAME.CONSTRUCTION_SITE_PICKUP, ACCESSORIALS_NAME.CONSTRUCTION_SITE_DELIVERY);
            await pages.addQuickQuotePage.clickGetRatesButton();
            console.log("Rates Fetched Successfully. Quote Displayed in Quote Grid");
        });
        await test.step('Book Shipment from Quote', async () => {
            await page.waitForTimeout(WAIT.MID); // Wait for 15 seconds to ensure the booking process is completed
            await pages.addQuickQuotePage.bookLowestRateQuote();
            await pages.addQuickQuotePage.enterPickupDetails(testData.shipperName, testData.shipperAddress, testData.shipperName, reusableData.generatePhoneNumber(), reusableData.generateEmailAddress());
            await pages.addQuickQuotePage.enterDeliveryDetails(testData.consigneeName, testData.consigneeAddress, testData.consigneeName, reusableData.generatePhoneNumber(), reusableData.generateEmailAddress());
            await pages.addQuickQuotePage.acceptTermsAndBookShipment();
            shipmentId = await pages.addQuickQuotePage.validateShipmentBookingSuccessMessage();
            console.log(`Shipment booked successfully with Shipment ID: ${shipmentId}`);
        });
    });

    /**
 * Test Case ID: BANYAN-67958
 * Description: LTL Quotes with Accessorials - Mode Rating Engine - eDispatch load
 * @author Aniket Nale
 * @created 19-Nov-2025
 */
    test("Case Id: 67958 - LTL Quotes with Accessorials - Mode Rating Engine - eDispatch load",
        { tag: ['@tporegression', '@banyan', '@p44', '@ltlquote'] }, async () => {
            const testCaseID = "BANYAN-67958";
            testData = dataConfig.getTestDataFromCsv(dataConfig.banyanData, testCaseID);

            await test.step("Logout and login with another user", async () => {
                await pages.tritanDashboardPage.logoutTritan();
                await pages.tritanLoginPage.LoginTRITAN(
                    userSetup.tritanAdminCustomer,
                    userSetup.tritanAdminCustomerPassword);
            });

            await test.step("Navigate to Loads section and search for the shipment", async () => {
                await pages.tritanAdminPage.clickOnLoadsSection();
                await pages.tritanAdminPage.searchShipment(shipmentId);
            });

            await test.step("Book shipment and Verify status", async () => {
                await pages.tritanAdminPage.selectAction(CARRIER_ACTION.BOOK);
                await pages.tritanAdminPage.verifyStatus(LOAD_STATUS.BOOKED);
            });

            await test.step("Plan and add pickup details", async () => {
                await pages.tritanAdminPage.clickPlanButton();
                await pages.tritanAdminPage.clickPlusPickupButton();
                await pages.tritanAdminPage.enterProNumber();
                await pages.tritanAdminPage.enterDateAndTime(
                    await commonReusables.getDate("today", "MM/DD/YYYY"), testData.consigneeEarliestTime);
                await pages.tritanAdminPage.clickPickupSaveButton();
                await pages.tritanAdminPage.clickDetailButton();
                await pages.tritanAdminPage.verifyStatus(LOAD_STATUS.IN_TRANSIT);
                // await pages.tritanAdminPage.verifyAccessorialsServices(
                //     ACCESSORIALS_NAME.LIFT_GATE_ORIGIN, ACCESSORIALS_NAME.LIFT_GATE_DESTINATION);
                await pages.tritanAdminPage.verifyAccessorialsServices(
                    ACCESSORIALS_NAME.CONSTRUCTION_SITE_PICKUP, ACCESSORIALS_NAME.CONSTRUCTION_SITE_DELIVERY);
            });
        });
});