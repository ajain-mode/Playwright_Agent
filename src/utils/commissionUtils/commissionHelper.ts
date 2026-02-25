import ViewLoadPage from "@pages/loads/viewLoadPage/ViewLoadPage";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";

class CommissionHelper {
    /**
     * Creates a Truck Load with specified details.
     * Optionally adds internal shares and creates an invoice.
     * @author Rohit Singh
     * @created 2025-11-13
     * @param testData - The data required to create the load.  
     * @param page - The Playwright page object to perform actions on.
     * @param addInternalShares - Boolean flag to indicate if internal shares should be added.
     * @param createInvoice - Boolean flag to indicate if an invoice should be created after load creation.
     * @returns The ID of the created load.
     */
    async createTruckLoad(testData: any, page: any, addInternalShares?: boolean, createInvoice?: boolean) {
        const pages = new PageManager(page);
        // Search customer and create new load
        // await pages.basePage.clickOnTopMenuLogo();
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        await pages.searchCustomerPage.clickOnSearchCustomer();
        await pages.searchCustomerPage.clickOnActiveCustomer();
        // update available credit on customer if needed
        await this.updateAvailableCreditOnCustomer(page);
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LOAD_TL);
        // Add Internal Shares to Load if specified
        if (addInternalShares) {
            await pages.editLoadFormPage.clickOnAddInternalShare();
            await pages.editLoadFormPage.enterInternalShareAmount(testData.shareAmount);
            await pages.editLoadFormPage.selectInternalShareAgent(testData.shareAgent);
        }
        // Pick Tab Details
        await pages.editLoadPickTabPage.clickOnPickTab();
        await pages.editLoadPickTabPage.selectShipperAddress();
        await pages.editLoadPickTabPage.selectClientByNameShipper(testData);
        await pages.editLoadPickTabPage.enterActualDateValue(pages.commonReusables.getNextTwoDatesFormatted().tomorrow);
        await pages.editLoadPickTabPage.enterActualTimeValue(testData.shipperEarliestTime);
        await pages.editLoadPickTabPage.enterDeadlineValue(pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow);
        await pages.editLoadPickTabPage.enterDeadlineTimeValue(testData.shipperLatestTime);
        await pages.editLoadPickTabPage.enterQtyValue(testData.shipmentCommodityQty);
        await pages.editLoadPickTabPage.selectItemType(testData.shipmentCommodityUoM);
        await pages.editLoadPickTabPage.enterDescriptionValue(testData.shipmentCommodityDescription);
        await pages.editLoadPickTabPage.enterWeightValue(testData.shipmentCommodityWeight);
        // Drop Tab Details
        await pages.editLoadDropTabPage.clickDropTab();
        await pages.editLoadDropTabPage.selectConsigneeAddress();
        await pages.editLoadDropTabPage.selectConsigneeByNameConsignee(testData.consigneeName);
        await commonReusables.dialogHandler(page);
        await pages.editLoadDropTabPage.enterActualDateValue(await commonReusables.getDate("tomorrow", "MM/DD/YYYY"));
        await pages.editLoadDropTabPage.enterActualTimeValue(testData.consigneeEarliestTime);
        await pages.editLoadDropTabPage.enterDeadlineDateValue(await commonReusables.getDate("dayAfterTomorrow", "MM/DD/YYYY"));
        await pages.editLoadDropTabPage.enterDeadlineTimeValue(testData.consigneeLatestTime);
        // Carrier Tab
        await pages.editLoadCarrierTabPage.clickOnCarrierTab();
        // await pages.editLoadCarrierTabPage.clickOnChooseCarrier();
        // await pages.editLoadCarrierTabPage.enterCarrierName();
        // await pages.editLoadCarrierTabPage.selectCarrier();
        //@modified: Rohit Singh - 2025-11-13 - To select carrier by ID instead of name to avoid ambiguity
        await pages.editLoadCarrierTabPage.selectCarrier1(testData.carrierID.toString());
        await pages.editLoadCarrierTabPage.enterCustomerRate(testData.flatCustRate);
        await pages.editLoadCarrierTabPage.enterCarrierRate(testData.flatCarrierRate);
        await pages.editLoadCarrierTabPage.selectEquipmentType(testData.equipmentType);
        await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        await pages.editLoadCarrierTabPage.enterMiles(testData.totalMiles);
        // Create Load
        await pages.editLoadLoadTabPage.clickCreateLoadButton();
        let createdLoadId: string = "";
        if (createInvoice != true) {
            await page.waitForTimeout(WAIT.DEFAULT); //wait for 5 sec
            await pages.editLoadLoadTabPage.uncheckAutoLoadTenderCheckbox();
            const isEnabled = await pages.editLoadPage.checkSaveButtonEnabled();
            if (isEnabled) {
                await pages.editLoadPage.clickSaveButton();
                console.log("Save button clicked after unchecking Auto Load Tender");
            }
            // Get Load ID after creation
            const viewLoadPage = new ViewLoadPage(page);
            createdLoadId = await viewLoadPage.getLoadID();
            console.log(`Created Load ID: ${createdLoadId}`);
            // return createdLoadId;
        }
        else if (createInvoice == true) {
            // Change status to DELIVERED FINAL and create invoice
            await pages.editLoadLoadTabPage.clickLoadTab();
            await page.waitForTimeout(WAIT.DEFAULT); //wait for 30 sec to ensure all load details are saved
            await pages.editLoadLoadTabPage.selectLoadStatus(LOAD_STATUS.DELIVERED_FINAL);
            await pages.editLoadFormPage.clickOnSaveBtn();
            // await this.setLoadDeliveredFinalStatus(page, LOAD_STATUS.DELIVERED_FINAL);
            await pages.editLoadFormPage.clickOnViewBillingBtn();
            // Create Invoice
            await page.waitForTimeout(WAIT.DEFAULT); //wait for 30 sec to ensure all load details are saved
            await pages.loadBillingPage.clickOnCreateInvoiceButton();
            createdLoadId = await pages.loadBillingPage.getLoadID();
            console.log(`Created Load ID: ${createdLoadId}`);
            // return createdLoadId;
        }
        return createdLoadId;
    }

    /**
     * Updates the available credit for a customer.
     * If the available credit is negative, it navigates to the Edit Master Customer page,
     * increases the corporate credit limit by 200,000 plus the absolute value of the current limit,
     * and saves the changes.
     * @author Rohit Singh
     * @created 2025-11-13
     */
    async updateAvailableCreditOnCustomer(page: any) {
        const pages = new PageManager(page);
        const isPositiveAvailableCredit = await pages.viewCustomerPage.getAvailableCredit() >= 0;
        if (isPositiveAvailableCredit) {
            console.log("Available credit is positive, no update needed.");
            return;
        }
        await pages.viewCustomerPage.clickCustomerMasterLink();
        await pages.viewMasterCustomerPage.clickEditButton();
        const availableCredit = await pages.editMasterCustomerPage.getCorpCreditLimit();
        console.log(`Current Available Credit: ${availableCredit}`);
        const newCreditLimit = Math.abs(availableCredit) + 200000;
        console.log(`Current Available Credit is negative. Updating to New Corp Credit Limit: ${newCreditLimit}`);
        await pages.editMasterCustomerPage.setCorpCreditLimit(newCreditLimit);
        await pages.editMasterCustomerPage.clickSaveButton();
        await page.reload();
        await pages.viewMasterCustomerPage.clickCustomerNameLink();
        console.log('Credit limit updated successfully. Navigate back to customer view page.');
    }
    /**
     * Sets the load status to DELIVERED FINAL if it is not already set.
     * @author Rohit Singh
     * @created 05-Dec-2025
     * @param page 
     * @param loadStatus 
     */
    async setLoadDeliveredFinalStatus(page: any, loadStatus: string) {
        await commonReusables.waitForPageStable(page);
        await page.reload();
        const pages = new PageManager(page);
        const isDeliveredFinal = await pages.viewLoadPage.getLoadStatus() === LOAD_STATUS.DELIVERED_FINAL;
        if (!isDeliveredFinal) {
            await pages.viewLoadPage.clickEditButton();
            await pages.editLoadLoadTabPage.selectLoadStatus(loadStatus);
            await pages.editLoadFormPage.clickOnSaveBtn();
            console.log(`Load status changed to ${loadStatus}`);
        } else {
            console.log(`Load status is already ${loadStatus}, no change needed.`);
        }
    }

    /**
     * Sets the load status to INVOICED by creating an invoice if the current status is DELIVERED FINAL.
     * Retries up to 3 times if the status does not update successfully.
     * @author Rohit Singh
     * @created 08-Dec-2025
     * @param page 
     * @returns 
     */
    async setLoadAsInvoiced(page: any) {
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            await commonReusables.waitForPageStable(page);
            await page.reload();
            const pages = new PageManager(page);
            const loadStatus = await pages.loadBillingPage.checkCurrentLoadStatus();
            if (loadStatus === LOAD_STATUS.DELIVERED_FINAL) {
                await pages.loadBillingPage.clickOnCreateInvoiceButton();
                await commonReusables.waitForPageStable(page);
                await page.reload();
                const updatedLoadStatus = await pages.loadBillingPage.checkCurrentLoadStatus();
                if (updatedLoadStatus === LOAD_STATUS.INVOICED) {
                    console.log("Load status successfully changed to INVOICED");
                    return;
                } else {
                    console.log(`Attempt ${attempt}/${maxRetries}: Load status is still DELIVERED_FINAL, retrying...`);
                    if (attempt === maxRetries) {
                        console.log("Failed to set load as INVOICED after 3 attempts");
                    }
                }
            } else {
                console.log("Load status is not DELIVERED_FINAL, cannot create invoice");
                return;
            }
        }
    }

}
const commissionHelper = new CommissionHelper();
export default commissionHelper;