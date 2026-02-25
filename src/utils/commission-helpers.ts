import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";
import ViewLoadPage from "@pages/loads/viewLoadPage/ViewLoadPage";

class CommissionHelper {
    private createdLoadId?: string;

    async setupDeliveredLoad(testData: any, page: any) {
        const pages = new PageManager(page);
        // Search customer and create new load
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.enterCustomerName(testData.customerName);
        await pages.searchCustomerPage.clickOnSearchCustomer();
        await pages.searchCustomerPage.clickOnActiveCustomer();
        // update available credit on customer if needed
        await this.updateAvailableCreditOnCustomer(page);
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LOAD_TL);
        // Pick Tab Details
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
        await pages.editLoadPickTabPage.enterQtyValue(testData.shipmentCommodityQty);
        await pages.editLoadPickTabPage.selectItemType(testData.shipmentCommodityUoM);
        await pages.editLoadPickTabPage.enterDescriptionValue(testData.shipmentCommodityDescription);
        await pages.editLoadPickTabPage.enterWeightValue(testData.shipmentCommodityWeight);
        // Drop Tab Details
        await pages.editLoadDropTabPage.clickDropTab();
        await pages.editLoadDropTabPage.selectConsigneeAddress();
        await pages.editLoadDropTabPage.selectConsigneeByNameConsignee(testData.consigneeName);
        await commonReusables.dialogHandler(page);
        await pages.editLoadDropTabPage.enterActualDateValue(await commonReusables.getDate("tomorrow","MM/DD/YYYY"));
        await pages.editLoadDropTabPage.enterActualTimeValue(testData.consigneeEarliestTime);
        await pages.editLoadDropTabPage.enterDeadlineDateValue(await commonReusables.getDate("dayAfterTomorrow","MM/DD/YYYY"));
        await pages.editLoadDropTabPage.enterDeadlineTimeValue(testData.consigneeLatestTime);
        // Carrier Tab
        await pages.editLoadCarrierTabPage.clickOnCarrierTab();
        await pages.editLoadCarrierTabPage.clickOnChooseCarrier();
        await pages.editLoadCarrierTabPage.enterCarrierName();
        await pages.editLoadCarrierTabPage.selectCarrier();
        await pages.editLoadCarrierTabPage.clickOnUseCarrierBtn();
        await pages.editLoadCarrierTabPage.enterCustomerRate(testData.flatCustRate);
        await pages.editLoadCarrierTabPage.enterCarrierRate(testData.flatCarrierRate);
        await pages.editLoadCarrierTabPage.selectEquipmentType(testData.equipmentType);
        await pages.editLoadCarrierTabPage.enterValueInTrailerLength(testData.trailerLength);
        await pages.editLoadCarrierTabPage.enterMiles(testData.totalMiles);
        // Create Load
        await pages.editLoadLoadTabPage.clickCreateLoadButton();
        // Change status to DELIVERED FINAL and create invoice
        await pages.editLoadLoadTabPage.clickLoadTab();
        await pages.editLoadFormPage.selectLoadStatus(LOAD_STATUS.DELIVERED_FINAL);
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.editLoadFormPage.clickOnViewBillingBtn();
        await pages.loadBillingPage.clickOnCreateInvoiceButton();
        
        // Get Load ID after creation
        const viewLoadPage = new ViewLoadPage(page);
        const createdLoadId = await viewLoadPage.getLoadIDfromHeader();
        console.log(`Created Load ID: ${createdLoadId}`);
        this.createdLoadId = createdLoadId;
    }

    getLoadIDfromHeader(): string {
        if (!this.createdLoadId) {
            throw new Error("No Load ID found — did you run setupDeliveredLoad()?");
        }
        return this.createdLoadId;
    }
    /**
     * Updates the available credit for a customer.
     * If the available credit is negative, it navigates to the Edit Master Customer page,
     * increases the corporate credit limit by 200,000 plus the absolute value of the current limit,
     * and saves the changes.
     * @author Rohit Singh
     * @created 2025-10-13
     */
    async updateAvailableCreditOnCustomer(page: any) {
        const pages = new PageManager(page);
        const isPositiveAvailableCredit = await pages.viewCustomerPage.getAvailableCredit() >= 0;
        if(isPositiveAvailableCredit){
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
}

const commissionHelper = new CommissionHelper();
export default commissionHelper;