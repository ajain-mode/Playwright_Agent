import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { expect, test } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

const testCaseID = "BANYAN-74497";
test.describe.configure({ retries: 1 });
test.describe.serial("New Customer Portal - Rate Requests via New Customer Portal", { tag: ['@tporegression', '@high'] }, () => {

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

            await pages.CustomerPortalLogin.LoginCustomerPortal(userSetup.customerPortalUser, userSetup.customerPortalPassword);
            pages.logger.info("Customer Portal login successful - Shared session initialized for three test cases");


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

    test("Case Id: 74497 - New Customer Portal - Rate Requests via New Customer Portal",
        { tag: ['@tporegression', '@banyan', '@p44', '@ltlquote'] }, async () => {

            await test.step("Shipment information on customer portal", async () => {
                pages.logger.info("Starting New Customer Portal - Rate Requests via New Customer Portal");
                await pages.quoteLTL.clickOnquoteLTLRequestButton();
                await pages.quoteLTL.selectCustomerFromDropdown(testData.customerName);
                await pages.quoteLTL.enterPickUpAndDeliveryZip(testData.shipperZip, testData.consigneeZip);
                await pages.quoteLTL.clickOnContinueButton(0);
            });

            await test.step("Enter commodity information", async () => {
                await pages.quoteLTL.enterCommodityDescription(testData.commDesc);
                await pages.quoteLTL.selectNMFCAndSubNMFC();
                await pages.quoteLTL.enterDimensions(
                    testData.commLength,
                    testData.commWidth,
                    testData.commHeight,
                    testData.commWeight,
                    testData.commQuantity,
                    testData.type
                );
                await pages.quoteLTL.clickOnContinueButton(1)
                await pages.quoteLTL.clickOnRequestTariffsButton();
                pages.logger.info("LTL Quote Request submitted successfully from Customer Portal");
            });

            await test.step("Verify Quote Status and View Details and create load", async () => {
                await pages.quoteLTL.clickOnViewDetailsLink();
                await pages.quoteLTL.verifyQuoteDetailsVisibility(
                    [QUOTE_DETAIL_LABELS.SCAC,
                    QUOTE_DETAIL_LABELS.QUOTE_NO,
                    QUOTE_DETAIL_LABELS.LOAD_ID,
                    QUOTE_DETAIL_LABELS.QUOTE_ID]
                );
                pages.logger.info("LTL Quote Details viewed successfully from Customer Portal");
                await pages.quoteLTL.clickOnCreateLoadBtn();
                pages.logger.info("Clicked on Create Load button successfully from Customer Portal");
            });

            await test.step("Enter Shipper Details and consignee details", async () => {
                await pages.quoteLTL.clickOnContinueButton();
                await pages.quoteLTL.enterShipperDetails(
                    testData.shipperName,
                    testData.shipperAddress
                );
                await pages.quoteLTL.enterEarliestDateValue(await commonReusables.getDate("tomorrow", "YYYY-MM-DD"));
                await pages.quoteLTL.clickOnContinueButton(1);

                await pages.quoteLTL.enterConsigneeDetails(
                    testData.consigneeName,
                    testData.consigneeAddress
                );
                await pages.quoteLTL.clickOnContinueButton(2);
                pages.logger.info("Shipper and Consignee details entered successfully from Customer Portal");

                await pages.quoteLTL.clickOnContinueButton(3);
                pages.logger.info("Navigated to Review page successfully from Customer Portal");
            });

            let loadID: string;

            await test.step("Verify Load Creation", async () => {
                await pages.quoteLTL.clickOnCreateLoadBtn();
                pages.logger.info("Load created successfully from Customer Portal");
                loadID = await pages.quoteLTL.getLoadID();
                pages.logger.info(`Stored Load ID from Customer Portal: ${loadID}`);
                await pages.quoteLTL.verifyLTLLoadCreationSuccess();
                pages.logger.info("LTL Load creation success message verified successfully from Customer Portal");
            });

            await test.step("Login to BTMS Portal", async () => {
                await pages.btmsLoginPage.BTMSLogin(userSetup.banyanUser, "stage");
                pages.logger.info("BTMS login successful - Shared session initialized for three test cases");
            });

            await test.step("Verify Load ID Retrieval", async () => {
                expect(loadID).toBeDefined();
                pages.logger.info(`Retrieved Load ID: ${loadID}`);
            });

            await test.step("Search and Validate Load in BTMS", async () => {
                await pages.basePage.searchFromMainHeader(loadID);
                pages.logger.info(`Load ID: ${loadID} verified successfully in BTMS`);
            });

            await test.step("Verify Created By Customer Portal on Load Page", async () => {
                await pages.viewLoadPage.createdByPortalName(CREATED_BY.CUSTOMER_PORTAL);
                pages.logger.info("Verified 'Created By Customer Portal' on Load Page successfully in BTMS");
            });

            await test.step("Verify Banyan Quote ID on Load Page", async () => {
                await pages.editLoadCarrierTabPage.clickOnCarrierTab();
                await pages.viewLoadCarrierTabPage.banyanQuoteId();
                pages.logger.info("Verified 'Banyan Quote ID' on Load Page successfully in BTMS");
                await pages.viewLoadCarrierTabPage.getBanyanLoadId();
                pages.logger.info("Verified 'Banyan Load ID' on Load Page successfully in BTMS");
            });
        });
});