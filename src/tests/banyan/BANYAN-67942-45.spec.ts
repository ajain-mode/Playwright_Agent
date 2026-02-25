import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { expect, test } from "@playwright/test";
import commissionHelper from "@utils/commission-helpers";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

const testCaseID = "BANYAN-67942-45";
test.describe.configure({ retries: 1 });
test.describe.serial("LTL Quote with Accessorials - Banyan - no cust rate uplift", { tag: ['@tporegression', '@smoke'] }, () => {

    let pages: PageManager;
    let testData: any;
    let sharedPage: any;

    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);

            testData = dataConfig.getTestDataFromCsv(
                dataConfig.banyanData,
                testCaseID
            );

            await pages.btmsLoginPage.BTMSLogin(userSetup.banyanUser);
            pages.logger.info("BTMS login successful - Shared session initialized for three test cases");
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.enterCustomerName(testData.customerName);
            await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
            // await pages.searchCustomerPage.clickOnActiveCustomer();
            await pages.viewCustomerPage.clickEditButton();;
            await pages.editCustomerPage.selectUseLTLCustRates('NO');
            await pages.editCustomerPage.clickSaveButton();;
            await commissionHelper.updateAvailableCreditOnCustomer(sharedPage);

            //Banyan3 Rating Engine selection
            await pages.viewCustomerPage.clickCustomerMasterLink();
            await pages.viewMasterCustomerPage.clickEditButton();
            await pages.editMasterCustomerPage.selctBanyan3RatingEngine();
            await pages.editMasterCustomerPage.clickSaveButton();
            await pages.viewMasterCustomerPage.clickCustomerNameLink();

            pages.logger.info("Shared setup completed - Customer ready for all three test case validations");

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

    test("Case Id: 67942 - LTL Quote with Accessorials - Banyan - Quotes with no customer rates configured",
        { tag: ['@banyan', '@p44', '@ltlquote', '@tporegression'] }, async () => {
            pages.logger.info("Starting LTL Quote with Accessorials - Banyan - Quotes with no customer rates configured");

            await test.step("Click on LTL Quote Request Button", async () => {
                await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LTL_QUOTE);
                pages.logger.info("Navigated to NEW LTL QUOTE creation form");
            });

            await test.step("Enter details in LTL Quote Request form and Request Tariffs", async () => {
                try {
                    await pages.ltlQuoteRequestPage.enterPickUpAndDeliveryZip(testData.shipperZip, testData.consigneeZip);
                    await pages.ltlQuoteRequestPage.selectCommodityAndAddDetails(testData.commDesc, testData.commClass, testData.commLength, testData.commWidth, testData.commHeight, testData.commWeight, testData.commQuantity);
                    await pages.ltlQuoteRequestPage.selectAccessorialsByValue([ACCESSORIALS_NAME.Blind_Shipment, ACCESSORIALS_NAME.RESIDENTIAL_Pickup, ACCESSORIALS_NAME.Liftgate_Delivery]);
                    pages.logger.info("Accessorials selected successfully");
                    await pages.ltlQuoteRequestPage.clickOnRequestTariffsButton();
                    pages.logger.info("LTL Quote Request form filled successfully and requested tariffs");
                } catch (error) {
                    pages.logger.error("Error filling LTL Quote Request form and tariff request:", error);
                }
            });

            await test.step("Verification of tariff table", async () => {
                await pages.ltlQuoteRequestPage.verifyTariffTable();
                pages.logger.info("Tariff table verified successfully");
            });
        });


    test("Case Id: 67944 - LTL Quote with Accessorials - Banyan - Create load from quotes no customer rates and e-dispatch",
        { tag: ['@banyan', '@p44', '@e-dispatch', '@tporegression'] }, async () => {
            await test.step("Select tariff and create LTL Quote and verify Booked Status", async () => {
                try {
                    await pages.ltlQuoteRequestPage.clickOnCreateLoadBtn();
                    pages.logger.info("Clicked on Create Load button to create LTL Quote");
                } catch (error) {
                    pages.logger.error("Error clicking on Create Load button:", error);
                }

                await pages.editLoadLoadTabPage.closeMarginPopupIfVisible();

                try {
                    await pages.ltlQuoteRequestPage.verifyBookedStatus();
                    pages.logger.info("LTL Quote created successfully and status verified as Booked");
                } catch (error) {
                    pages.logger.error("Error verifying Booked status of LTL Quote:", error);
                }
            });

            await test.step("Profit margin verification on load", async () => {
                await pages.editLoadLoadTabPage.verifyCustomerTotalIsZero();
                pages.logger.info("Profit margin verified successfully on load for no customer rates configured");
            });

            await test.step("Enter pick up drop details on edit load page", async () => {
                //verifies carrier total is not zero on edit load page
                await pages.editLoadLoadTabPage.verifyCarrierTotalValueIsNotZero();

                await pages.editLoadLoadTabPage.selectRateCardValue(testData.RateValue);
                await pages.editLoadPickTabPage.clickOnPickTab();
                await pages.editLoadPage.verifyAccessorialTypeValues([ACCESSORIALS_NAME.verify_Blind_Shipment, ACCESSORIALS_NAME.verify_RESIDENTIAL_Pickup]);
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
                await pages.editLoadPage.verifyAccessorialTypeValues([ACCESSORIALS_NAME.verify_Liftgate_Delivery]);
                await pages.editLoadDropTabPage.selectConsigneeAddress();
                await pages.editLoadDropTabPage.selectConsigneeByNameConsignee(testData.consigneeName);
                await pages.editLoadDropTabPage.enterActualDateValue(await commonReusables.getDate("tomorrow", "MM/DD/YYYY"));
                await pages.editLoadDropTabPage.enterActualTimeValue(testData.consigneeEarliestTime);
                await pages.editLoadDropTabPage.enterDeadlineDateValue(await commonReusables.getDate("dayAfterTomorrow", "MM/DD/YYYY"));
                await pages.editLoadDropTabPage.enterDeadlineTimeValue(testData.consigneeLatestTime);
            });

            await test.step("Click on Save and Edit and dispatch load", async () => {
                await pages.editLoadFormPage.clickOnSaveBtn();
                //verifies carrier total is not zero on view load page
                await pages.viewLoadPage.verifyCarrierTotalValueIsNotZero();

                await pages.editLoadPage.clickOnEditLoadButton();
                await pages.editLoadLoadTabPage.clickOnDispatchLoadCheck();
                await pages.editLoadFormPage.clickOnSaveBtn();
                await pages.commonReusables.dialogHandler(sharedPage);
                await pages.ltlQuoteRequestPage.verifyDispatchedStatus();
                pages.logger.info("Load dispatched successfully and status verified as Dispatched");
            });

            await test.step("Go to Carrier tab and verify LOAD ID, Quote ID, Today's date, Acceppted status", async () => {
                await pages.editLoadCarrierTabPage.clickOnCarrierTab();
                await pages.viewLoadCarrierTabPage.getBanyanLoadId();
                await pages.viewLoadCarrierTabPage.banyanQuoteId();
                await pages.viewLoadPage.eAcknowledgeDatePresent();
                await pages.viewLoadPage.acknowledgeAccepted();
                pages.logger.info("LOAD ID, QUOTE ID, Today's e-acknowledge date and Accepted status verified successfully on Carrier tab");
                expect(test.info().errors).toHaveLength(0);
            });
        });
});