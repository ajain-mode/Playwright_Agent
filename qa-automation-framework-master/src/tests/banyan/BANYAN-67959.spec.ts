import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import test, { expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";
import reusableData from "@utils/reusableData";

const testCaseID = "BANYAN-67959";
test.describe.configure({ retries: 1 });
test.describe.serial("(TRITAN) Load Rerating - Mode Rating Engine - Change vital load information prior to dispatch to trigger rerating when load is dispatched",
    { tag: ['@tporegression', '@smoke'] }, () => {

        let pages: PageManager;
        let testData: any;
        let sharedPage: any;
        let shipmentId: string;

        test.beforeAll(async ({ browser }) => {
            try {
                sharedPage = await browser.newPage();
                pages = new PageManager(sharedPage);

                testData = dataConfig.getTestDataFromCsv(
                    dataConfig.banyanData,
                    testCaseID
                );

                await pages.tritanLoginPage.LoginTRITAN(userSetup.tritanCustomer, userSetup.tritanCustomerPassword);
                pages.logger.info("TRITAN login successful");
                await pages.customerDemoPortalPage.clickAddQuickQuote();
                await pages.addQuickQuotePage.enterPickDetails(testData.shipperZip);
                await pages.addQuickQuotePage.enterDestinationDetails(testData.consigneeZip);
                await pages.addQuickQuotePage.enterItemDetails(testData.commQuantity, testData.commLength, testData.commWidth, testData.commHeight, testData.commWeight, testData.commDesc);
                await pages.addQuickQuotePage.clickGetRatesButton();
                await expect(test.info().errors).toHaveLength(0);
                console.log("Rates Fetched Successfully. Quote Displayed in Quote Grid");
                await pages.addQuickQuotePage.bookLowestRateQuote();
                await pages.addQuickQuotePage.enterPickupDetails(testData.shipperName, testData.shipperAddress, testData.shipperName, reusableData.generatePhoneNumber(), reusableData.generateEmailAddress());
                await pages.addQuickQuotePage.enterDeliveryDetails(testData.consigneeName, testData.consigneeAddress, testData.consigneeName, reusableData.generatePhoneNumber(), reusableData.generateEmailAddress());
                await pages.addQuickQuotePage.acceptTermsAndBookShipment();
                shipmentId = await pages.addQuickQuotePage.validateShipmentBookingSuccessMessage();
                console.log(`Shipment booked successfully with Shipment ID: ${shipmentId}`);
                await pages.tritanDashboardPage.logoutTritan();
                await pages.tritanLoginPage.LoginTRITAN(userSetup.tritanAdminCustomer, userSetup.tritanAdminCustomerPassword);

                await pages.tritanDashboardPage.clickOnCompanyButton();
                await pages.tritanCompanyPage.clickOnExpandAllButton();
                await pages.tritanCompanyPage.selectCustomerByName(testData.companyName);

                await pages.tritanAdminPage.clickOnLoadsSection();
                await pages.tritanAdminPage.searchShipment(shipmentId);
                await pages.tritanAdminPage.selectAction(CARRIER_ACTION.BOOK);
                await pages.tritanAdminPage.verifyStatus(LOAD_STATUS.BOOKED);

            } catch (error) {
                console.error("Setup failed:", error);
                throw error;
            }
        });

        test.afterAll(async () => {
            try {
                if (sharedPage && !sharedPage.isClosed()) {
                    await sharedPage.close();
                    pages.logger.info("Shared session closed successfully after completing all three test cases");
                }
            } catch (error) {
                console.warn("Cleanup warning:", error);
            }
        });

        /**
        * Test Case ID: BANYAN-67959
        * Description: Load Rerating - Mode Rating Engine - Change vital load information prior to dispatch to trigger rerating when load is dispatched
        * @author Aniket Nale
        * @created 24-Nov-2025
        */

        test("Case Id: 67959 - Load Rerating - Mode Rating Engine - Change vital load information prior to dispatch to trigger rerating when load is dispatched",
            { tag: ['@tporegression', '@banyan', '@p44', '@ltlquote'] }, async () => {

                await test.step("Update weight to trigger rerate", async () => {
                    await pages.tritanAdminPage.clickOnEditItem();
                    await pages.tritanAdminPage.selectClassValue(testData.updatedClass);
                    await pages.tritanAdminPage.changeWeightValue(testData.updatedWeight);
                    await pages.tritanAdminPage.changeQuantityValue(testData.updatedQuantity);
                    await pages.tritanAdminPage.saveItemChanges();
                });

                await test.step("Add Rate to view Rerated amount and validate it", async () => {
                    await pages.tritanAdminPage.clickOnAddRate();
                    await pages.tritanAdminPage.clickOnCarrierRateComboBox();
                    await pages.tritanAdminPage.selectReRateSelectedOption();
                    await pages.tritanAdminPage.unableToProcessErrorHandling();
                    await pages.tritanAdminPage.verifyTwoRateAmountsAreDifferent();
                });

                await test.step("Add pickup detail and marked in transit", async () => {
                    await pages.tritanAdminPage.clickPlanButton();
                    await pages.tritanAdminPage.clickPlusPickupButton();
                    await pages.tritanAdminPage.enterProNumber();
                    await pages.tritanAdminPage.enterDateAndTime(
                        await commonReusables.getDate("today", "MM/DD/YYYY"), testData.consigneeEarliestTime);
                    await pages.tritanAdminPage.clickPickupSaveButton();
                    await pages.tritanAdminPage.clickDetailButton();
                    await pages.tritanAdminPage.verifyStatus(LOAD_STATUS.IN_TRANSIT);
                });
            });
    });