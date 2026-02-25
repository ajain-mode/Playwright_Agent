import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import { expect, test } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

const testCaseID = "NONOPLOAD-89244";
test.describe.configure({ retries: 2 });
test.describe.serial("Load Lifecycle (TL) - central",
    { tag: ['@tporegression', '@smoke', '@at_nonoperationalloads'] }, () => {

        let btmsPage: any;
        let btmsPages: PageManager;
        let pages: PageManager;
        let testData: any;
        let sharedPage: any;
        let shipmentId: string;
        let context: any;
        let carrierInitialAmount: string;
        let carrierRateDetailsPage: any;
        let carrierUpdatedAmount: string;
        let customerInitialAmount: string;
        let customerRateDetailsPage: any;
        let customerUpdatedAmount: string;

        test.beforeAll(async ({ browser }) => {
            context = await browser.newContext();
            sharedPage = await context.newPage();
            pages = new PageManager(sharedPage);

            testData = dataConfig.getTestDataFromCsv(dataConfig.nonOperationalLoadsData, testCaseID);
            await pages.tritanLoginPage.LoginTRITAN(
                userSetup.tritanAdminCustomer, userSetup.tritanAdminCustomerPassword);
        });

        test.afterAll(async () => {
            try {
                if (context) {
                    await context.close();
                    pages.logger.info("Browser context closed successfully after completing test cases");
                }
            } catch (error) {
                console.warn("Cleanup warning:", error);
            }
        });

        /**
    * @TestCaseID NON-OP-89244
    * @Description Load Lifecycle (TL) - central - Create Load - Booked
    * @Tags @tporegression, @smoke, @non-operational-loads
    * @author Aniket Nale
    * @created 07-01-2026
    */
        test("Case Id: 89244 - Load Lifecycle (TL) - central - Create Load - Booked",
             async () => {

                test.setTimeout(WAIT.XXLARGE * 8);
                await test.step("Open Tritan Customer Page", async () => {
                    await pages.tritanDashboardPage.clickOnCompanyButton();
                    await pages.tritanCompanyPage.clickOnExpandAllButton();
                    await pages.tritanCompanyPage.selectCustomerByName(testData.customerName);
                });

                await test.step("Go to shipment and click on Truckload Shipment Template", async () => {
                    await pages.tritanDashboardPage.clickOnViewCell();
                    await pages.tritanDashboardPage.clickOnShipmentTemplate();
                    await pages.listShipmentTemplatePage.clickOnTruckloadShipmentTemplate();
                    await pages.addShipment.clickOnSaveShipmentButton();
                    shipmentId = await pages.shipmentDetailsPage.getShipmentIdFromHeader();
                    pages.logger.info(`Shipment ID: ${shipmentId}`);
                });

                await test.step("Go to list activities of " + shipmentId, async () => {
                    await pages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
                    await pages.tritanDashboardPage.hoverOnActivitiesTab();
                    await pages.tritanDashboardPage.clickOnListActivitiesTab();
                });

                await test.step("Select BTMS Extract checkbox", async () => {
                    await pages.shipmentActivitiesPage.selectBTMSExtractCheckbox();
                    await pages.shipmentActivitiesPage.selectActionFromDropdown(LOAD_ACTIVITIES.SET_COMPLETE);
                    await pages.shipmentActivitiesPage.clickOnSubmitButton();
                });

                await test.step("Go back to details and click on Load Number", async () => {
                    await pages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
                    await pages.tritanDashboardPage.clickOnDetailsTab();
                });

                await test.step("Login to BTMS in new tab", async () => {
                    btmsPage = await context.newPage();
                    btmsPages = new PageManager(btmsPage);

                    await btmsPages.btmsLoginPage.BTMSLogin(userSetup.globalUser, "stage");
                });

                await test.step("Verify Load ID Retrieval", async () => {
                    expect(shipmentId).toBeDefined();
                    pages.logger.info(`Retrieved Load ID: ${shipmentId}`);
                });

                await test.step("Search and Validate Load in BTMS", async () => {
                    await btmsPages.basePage.refreshAndSearchFromMainHeader(shipmentId);
                    btmsPages.logger.info(`Load ID: ${shipmentId} verified successfully in BTMS`);
                });

                await test.step("Validate Source System ID and status in View Load Page and Load Status", async () => {
                    const sourceSystemID = await btmsPages.viewLoadPage.getSourceSystemIDValue();
                    expect(sourceSystemID).toBe(shipmentId);
                    await btmsPages.viewLoadPage.validateLoadStatus(LOAD_STATUS.BOOKED);
                });
            });

        /**
    * @TestCaseID NON-OP-89245
    * @Description Load Lifecycle (TL) - central - Create Load - In Transit
    * @Tags @tporegression, @smoke, @non-operational-loads
    * @author Aniket Nale
    * @created 09-01-2026
    */

        test("Case Id: 89245 - Load Lifecycle (TL) - central - Create Load - In Transit",
             async () => {

                test.setTimeout(WAIT.XXLARGE * 8);

                await test.step("Switch back to Tritan", async () => {
                    await sharedPage.bringToFront();
                });

                await test.step("Add pickup detail and marked in transit", async () => {
                    await pages.shipmentDetailsPage.clickOnLoadNumber(shipmentId);
                    await pages.tritanAdminPage.clickPlanButton();
                    await pages.tritanAdminPage.clickPlusPickupButton();
                    await pages.tritanAdminPage.enterProNumber();
                    await pages.tritanAdminPage.enterDateAndTime(
                        await commonReusables.getDate("today", "MM/DD/YYYY"), testData.pickupTime);
                    await pages.tritanAdminPage.clickPickupSaveButton();
                    await pages.tritanLoadDetailsPage.clickOnLoadNumber(shipmentId);
                    await pages.shipmentDetailsPage.verifyStatus(LOAD_STATUS.IN_TRANSIT);
                });

                await test.step("Go to list activities of " + shipmentId, async () => {
                    await pages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
                    await pages.tritanDashboardPage.hoverOnActivitiesTab();
                    await pages.tritanDashboardPage.clickOnListActivitiesTab();
                });

                await test.step("Select BTMS Extract checkbox", async () => {
                    await pages.shipmentActivitiesPage.selectBTMSExtractCheckbox();
                    await pages.shipmentActivitiesPage.selectActionFromDropdown(LOAD_ACTIVITIES.SET_COMPLETE);
                    await pages.shipmentActivitiesPage.clickOnSubmitButton();
                });

                await test.step("Switch back to BTMS", async () => {
                    await btmsPage.bringToFront();
                });

                await test.step("Search and Validate Load in BTMS", async () => {
                    await btmsPages.basePage.refreshAndSearchFromMainHeader(shipmentId);
                    btmsPages.logger.info(`Load ID: ${shipmentId} verified successfully in BTMS`);
                });

                await test.step("Validate Source System ID in View Load Page and Load Status", async () => {
                    const sourceSystemID = await btmsPages.viewLoadPage.getSourceSystemIDValue();
                    expect(sourceSystemID).toBe(shipmentId);
                    await btmsPages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.IN_TRANSIT);
                });
            });

        /**
    * @TestCaseID NON-OP-89246
    * @Description Load Lifecycle (TL) - central - Create Load - Delivered
    * @Tags @tporegression, @smoke, @non-operational-loads
    * @author Aniket Nale
    * @created 12-01-2026
    */
        test("Case Id: 89246 - Load Lifecycle (TL) - central - Create Load - Delivered",
             async () => {

                test.setTimeout(WAIT.XXLARGE * 8);

                await test.step("Switch back to Tritan", async () => {
                    await sharedPage.bringToFront();
                });

                await test.step("Go back to details and click on Load Number", async () => {
                    await pages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
                    await pages.tritanDashboardPage.clickOnDetailsTab();
                    await pages.shipmentDetailsPage.clickOnLoadNumber(shipmentId);
                });

                await test.step("Mark Load as Delivered", async () => {
                    await pages.tritanLoadDetailsPage.clickOnPlanTab();
                    await pages.tritanLoadPlanPage.setDropStatus(
                        await commonReusables.getDate("today", "MM/DD/YYYY"), testData.dropTime);
                    await pages.tritanLoadPlanPage.clickSaveButton();
                    await pages.tritanLoadDetailsPage.clickOnDetailsTab();
                    await pages.tritanLoadDetailsPage.verifyStatus(LOAD_STATUS.DELIVERED);
                });

                await test.step("Go to list activities of " + shipmentId, async () => {
                    await pages.tritanAdminPage.clickPlanButton();
                    await pages.tritanLoadDetailsPage.clickOnLoadNumber(shipmentId);
                    await pages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
                    await pages.tritanDashboardPage.hoverOnActivitiesTab();
                    await pages.tritanDashboardPage.clickOnListActivitiesTab();
                });

                await test.step("Select BTMS Extract checkbox", async () => {
                    await pages.shipmentActivitiesPage.selectBTMSExtractCheckbox();
                    await pages.shipmentActivitiesPage.selectActionFromDropdown(LOAD_ACTIVITIES.SET_COMPLETE);
                    await pages.shipmentActivitiesPage.clickOnSubmitButton();
                });

                await test.step("Switch back to BTMS", async () => {
                    await btmsPage.bringToFront();
                });

                await test.step("Search and Validate Load in BTMS", async () => {
                    await btmsPages.basePage.refreshAndSearchFromMainHeader(shipmentId);
                    btmsPages.logger.info(`Load ID: ${shipmentId} verified successfully in BTMS`);
                });

                await test.step("Validate Source System ID in View Load Page and Load Status", async () => {
                    const sourceSystemID = await btmsPages.viewLoadPage.getSourceSystemIDValue();
                    expect(sourceSystemID).toBe(shipmentId);
                    await btmsPages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.DELIVERED);
                });
            });

        /**
    * @TestCaseID NON-OP-89247
    * @Description Load Lifecycle (TL) - central - Invoice Load
    * @Tags @tporegression, @smoke, @non-operational-loads
    * @author Aniket Nale
    * @created 14-Jan-2026
    */

        test("Case Id: 89247 - Load Lifecycle (TL) - central - Invoice Load",
             async () => {

                test.setTimeout(WAIT.XXLARGE * 8);

                await test.step("Switch back to Tritan", async () => {
                    await sharedPage.bringToFront();
                });

                await test.step("Go back to details", async () => {
                    await pages.tritanDashboardPage.hoverOnShipmentTemplateFromHeader();
                    await pages.tritanDashboardPage.clickOnDetailsTab();
                });

                await test.step("Click on print icon and validate download", async () => {
                    await pages.shipmentDetailsPage.clickOnPrintInvoiceIcon();
                    await pages.shipmentDetailsPage.selectInvoiceOptionAndValidateDownload(INVOICE_OPTIONS.SINGLE_INVOICE);
                    await pages.shipmentDetailsPage.clickOnCancelInvoiceButton();
                    pages.logger.info(`Invoice download validated successfully for Load ID: ${shipmentId}`);
                });

                await test.step("Click on Invoice Bill Total and extract Queue", async () => {
                    await pages.shipmentDetailsPage.clickOnInvoiceBillTotal();
                    await pages.shipmentDetailsPage.clickOnEditChargesButton();
                    await pages.shipmentDetailsPage.selectQueue(SELECT_QUEUE_ACTION.FORTY_EXTRACT);
                    await pages.shipmentDetailsPage.clickOnSaveQueueButton();

                    const invoiceDate = await pages.shipmentDetailsPage.getInvoiceExtractDate();
                    const expectedDate = await commonReusables.getDate("today", "MM/DD/YYYY");
                    expect(invoiceDate.startsWith(expectedDate)).toBeTruthy();
                });

                await test.step("Switch back to BTMS", async () => {
                    await btmsPage.bringToFront();
                });

                await test.step("Search and Validate Load in BTMS", async () => {
                    await btmsPages.basePage.refreshAndSearchFromMainHeader(shipmentId);
                    btmsPages.logger.info(`Load ID: ${shipmentId} verified successfully in BTMS`);
                });

                await test.step("Validate Source System ID in View Load Page and Load Status", async () => {
                    const sourceSystemID = await btmsPages.viewLoadPage.getSourceSystemIDValue();
                    expect(sourceSystemID).toBe(shipmentId);
                    await btmsPages.viewLoadPage.refreshAndValidateLoadStatus(LOAD_STATUS.INVOICED);
                });
            });

        /**
* @TestCaseID NON-OP-89249
* @Description Load Lifecycle (TL) - central - Adjustment - Customer Charge
* @Tags @tporegression, @smoke, @non-operational-loads
* @author Aniket Nale
* @created 19-Jan-2026
*/
        test("Case Id: 89249 - Load Lifecycle (TL) - central - Adjustment - Customer Charge",
             async () => {

                test.setTimeout(WAIT.XXLARGE * 8);

                await test.step("Switch back to Tritan", async () => {
                    await sharedPage.bringToFront();
                });

                await test.step("Get Carrier Total Amount add charges and validate amount update", async () => {
                    await pages.shipmentDetailsPage.clickOnLoadNumber(shipmentId);
                    carrierInitialAmount =
                        await pages.tritanLoadDetailsPage.getCarrierTotalAmount();
                    carrierRateDetailsPage =
                        await pages.tritanLoadDetailsPage.clickOnCarrierTotalAmount();
                    await pages.tritanLoadDetailsPage.clickOnEditOnCarrierRateDetailsPage(carrierRateDetailsPage);
                    await pages.tritanLoadDetailsPage.selectCarrierChargesFromDropdownOnCarrierRateDetailsPage(carrierRateDetailsPage, LOAD_CHARGES.CUSTOM_CHARGES);
                    await pages.tritanLoadDetailsPage.fillCarrierChargesAmountOnCarrierRateDetailsPage(carrierRateDetailsPage, CHARGE_AMOUNTS.EIGHTY_EIGHT);
                    await pages.tritanLoadDetailsPage.clickOnSaveButtonOnCarrierRateDetailsPage(carrierRateDetailsPage);
                    carrierUpdatedAmount =
                        await pages.tritanLoadDetailsPage.getCarrierTotalAmount();
                    expect(carrierInitialAmount).not.toBe(carrierUpdatedAmount);
                    expect(parseFloat(carrierUpdatedAmount)).toBeGreaterThan(parseFloat(carrierInitialAmount));
                    pages.logger.info(`Carrier amount updated from ${carrierInitialAmount} to ${carrierUpdatedAmount} successfully for Load ID: ${shipmentId}`);
                });

                await test.step("Get Customer Total Amount add charges and validate amount update", async () => {
                    customerInitialAmount =
                        await pages.tritanLoadDetailsPage.getCustomerTotalAmount();
                    customerRateDetailsPage =
                        await pages.tritanLoadDetailsPage.clickOnCustomerTotalAmount();
                    await pages.tritanLoadDetailsPage.clickOnEditOnCustomerRateDetailsPage(customerRateDetailsPage);
                    await pages.tritanLoadDetailsPage.selectCustomerChargesFromDropdownOnCustomerRateDetailsPage(customerRateDetailsPage, LOAD_CHARGES.CUSTOM_CHARGES);
                    await pages.tritanLoadDetailsPage.fillCustomerChargesAmountOnCustomerRateDetailsPage(customerRateDetailsPage, CHARGE_AMOUNTS.NINETY_NINE);
                    await pages.tritanLoadDetailsPage.clickOnSaveButtonOnCustomerRateDetailsPage(customerRateDetailsPage);
                    customerUpdatedAmount =
                        await pages.tritanLoadDetailsPage.getCustomerTotalAmount();
                    expect(customerInitialAmount).not.toBe(customerUpdatedAmount);
                    expect(parseFloat(customerUpdatedAmount)).toBeGreaterThan(parseFloat(customerInitialAmount));
                    pages.logger.info(`Customer amount updated from ${customerInitialAmount} to ${customerUpdatedAmount} successfully for Load ID: ${shipmentId}`);
                });

                await test.step("Go to Shipment details page", async () => {
                    await pages.tritanAdminPage.clickPlanButton();
                    await pages.tritanLoadDetailsPage.clickOnLoadNumber(shipmentId);
                });

                await test.step("Click on Invoice Bill Total and extract Queue", async () => {
                    await pages.shipmentDetailsPage.clickOnInvoiceBillTotal();
                    await pages.shipmentDetailsPage.clickOnEditChargesButton();
                    await pages.shipmentDetailsPage.selectCustomerInvoiceChargesFromDropdown(INVOICE_CHARGES_DROPDOWN.ADMINISTRATION_FEE);
                    await pages.shipmentDetailsPage.fillCustomerInvoiceChargesAmount(CHARGE_AMOUNTS.NINETY_NINE);
                    await pages.shipmentDetailsPage.selectSettlermentReason(SETTLEMENT_REASONS.ACCESSORIAL_CHARGE_ADDED);
                    //Used Settlement reason as comment from constants
                    await pages.shipmentDetailsPage.customerInvoiceComments(SETTLEMENT_REASONS.ACCESSORIAL_CHARGE_ADDED);
                    await pages.shipmentDetailsPage.selectQueue(SELECT_QUEUE_ACTION.FORTY_EXTRACT);
                    await pages.shipmentDetailsPage.clickOnSaveQueueButton();

                    const invoiceDate = await pages.shipmentDetailsPage.getInvoiceExtractDate();
                    const expectedDate = await commonReusables.getDate("today", "MM/DD/YYYY");
                    expect(invoiceDate.startsWith(expectedDate)).toBeTruthy();
                });

                await test.step("Switch back to BTMS", async () => {
                    await btmsPage.bringToFront();
                });

                await test.step("Search and Validate Load in BTMS", async () => {
                    await btmsPages.basePage.refreshAndSearchFromMainHeader(shipmentId);
                    btmsPages.logger.info(`Load ID: ${shipmentId} verified successfully in BTMS`);
                });

                await test.step("Validate Adjustment amount for carrier and customer on view load page", async () => {
                    await btmsPages.viewLoadPage.getCustomerTotalAmount();
                    await btmsPages.viewLoadPage.expectCustomerTotalAmountToBe(customerUpdatedAmount);

                    await btmsPages.viewLoadPage.getCarrierTotalAmount();
                    await btmsPages.viewLoadPage.expectCarrierTotalAmountToBe(carrierUpdatedAmount);
                    btmsPages.logger.info(`Adjustment amounts validated successfully for Load ID: ${shipmentId}`);
                });
            });

        /**
* @TestCaseID NON-OP-89250
* @Description Load Lifecycle (TL) - central - Adjustment - Carrier Charge - Auto-Approved
* @Tags @tporegression, @smoke, @non-operational-loads
* @author Aniket Nale
* @created 20-Jan-2026
*/
        test("Case Id: 89250 - Load Lifecycle (TL) - central - Adjustment - Carrier Charge - Auto-Approved",
             async () => {


                await test.step("Navigate to View Billing page", async () => {
                    await btmsPages.viewLoadPage.clickViewBillingButton();
                });

                await test.step("Verify Approval Note for Carrier Charge", async () => {
                    await btmsPages.loadBillingPage.expectApprovalNoteVisibleAndDate(APPROVAL_FOR.CUSTOMER);
                    await btmsPages.loadBillingPage.expectApprovalNoteVisibleAndDate(APPROVAL_FOR.CARRIER);
                    btmsPages.logger.info(`Approval notes verified successfully for Carrier and Customer charges for Load ID: ${shipmentId}`);
                });

                await test.step("Verify Customer And Carrier Charges", async () => {
                    const customerChargeAmount = await btmsPages.loadBillingPage.getAndVerifyCustomerCharge();
                    expect(parseFloat(customerChargeAmount)).toBe(parseFloat(CHARGE_AMOUNTS.NINETY_NINE));

                    const carrierChargeAmount = await btmsPages.loadBillingPage.getAndVerifyCarrierCharge();
                    expect(parseFloat(carrierChargeAmount)).toBe(parseFloat(CHARGE_AMOUNTS.EIGHTY_EIGHT));
                });

                await test.step("Navigate to billing Adjustment Queue", async () => {
                    await btmsPages.basePage.hoverOverHeaderByText(HEADERS.FINANCE);
                    await btmsPages.basePage.clickSubHeaderByText(FINANCE_SUB_MENU.BILLING_ADJUSTMENTS_QUEUE);
                });

                await test.step("Clear Search for Load in Billing Adjustment Queue", async () => {
                    await btmsPages.billingAdjustmentsQueue.clickClearFiltersButton();
                    await btmsPages.billingAdjustmentsQueue.enterSourceIDInSearch(shipmentId);
                    await btmsPages.billingAdjustmentsQueue.clickSearchButton();
                });

                await test.step("Verify approved status for Customer and carrier", async () => {
                    await btmsPages.billingAdjustmentsQueue.getApprovedStatusFromRow(APPROVAL_FOR.CUSTOMER)
                    await btmsPages.billingAdjustmentsQueue.getApprovedStatusFromRow(APPROVAL_FOR.CARRIER)
                });

                await test.step("Verify Reviewed By is Intelys API Portal for Customer and carrier", async () => {
                    await btmsPages.billingAdjustmentsQueue.expectReviewedByIntelysAtRow(APPROVAL_FOR.CUSTOMER)
                    await btmsPages.billingAdjustmentsQueue.expectReviewedByIntelysAtRow(APPROVAL_FOR.CARRIER)
                });
            });
    });