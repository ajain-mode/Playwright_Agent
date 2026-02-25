import { PageManager } from "@utils/PageManager";
import commonReusables from "@utils/commonReusables";

/**
 * This class provides utility functions for Bulk Change operations in load management. 
 * @author Tejaswini
 * @param pages Page object manager
 * @param testData Test data for the load
 */
export default class BulkChangeHelper {
   
    dates = commonReusables.getNextTwoDatesFormatted();

    /**
     * Updates PO, BOL, SHIP and Customer Reference numbers on Load tab.
     * @param page
     */
    async updateReferencesOnLoadTab(pages: PageManager): Promise<{ poNumber: string[]; shipRefNumber: string[]; 
        bolNumber: string[]; cusRefNumber: string[] }> {
        const poNumber = commonReusables.generateRandomNumber(8);
        const bolNumber = commonReusables.generateRandomNumber(8);
        const shipRefNumber = commonReusables.generateRandomNumber(8);
        const cusRefNumber = commonReusables.generateRandomNumber(8);
        await pages.editLoadLoadTabPage.enterPONumber(poNumber);
        await pages.editLoadLoadTabPage.enterBLNumber(bolNumber);
        await pages.editLoadLoadTabPage.enterShipNumber(shipRefNumber);
        await pages.editLoadLoadTabPage.enterCustRefNumber(cusRefNumber);
        console.log(`Updated Load Tab References: PO=${poNumber}, BOL=${bolNumber}, 
            ShipRef=${shipRefNumber}, CusRef=${cusRefNumber}`);
        return {
            poNumber: [poNumber],
            shipRefNumber: [shipRefNumber],
            bolNumber: [bolNumber],
            cusRefNumber: [cusRefNumber]
        };
    }

    /**
     * Creates a load with Booked status by filling necessary details in Pick, Drop and Carrier tabs
     * @param pages 
     * @param testData 
     * @returns loadnumber
     */
    async createLoadOnBookedStatus(pages: PageManager, testData: any)
        : Promise<string> {
        await pages.editLoadCarrierTabPage.clickOnCarrierTab();
        await pages.editLoadCarrierTabPage.selectCarrier1(testData.carrierID);
        await pages.editLoadPage.clickOnTab(TABS.PICK);
        await pages.editLoadPickTabPage.enterCompletePickTabDetails(testData);
        await pages.editLoadPage.clickOnTab(TABS.DROP);
        await pages.editLoadDropTabPage.selectConsigneeAddress();
        await pages.editLoadDropTabPage.selectConsigneeByNameConsignee(testData.consigneeName);
        await pages.editLoadDropTabPage.enterActualDateValue(this.dates.dayAfterTomorrow);
        await pages.editLoadDropTabPage.enterActualTimeValue(testData.consigneeEarliestTime);
        await pages.editLoadDropTabPage.enterDeadlineDateValue(this.dates.dayAfterTomorrow);
        await pages.editLoadDropTabPage.enterDeadlineTimeValue(testData.consigneeLatestTime);
        console.log('Status has been set to BOOKED');
        await pages.editLoadLoadTabPage.clickCreateLoadButton();
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.editLoadCarrierTabPage.enterOfferRate(testData);
        await pages.editLoadCarrierTabPage.enterCarrierRate(testData.carrierRate);
        await pages.editLoadPage.validateEditLoadHeadingText();
        const loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(`Load created with number: ${loadNumber}`);
        return loadNumber;
    } 

    /**
     * Creates a LTL load with Booked status by filling necessary details in Pick, Drop and Carrier tabs
     * @param pages 
     * @param testData 
     * @returns loadnumber
     */
    async createLTLLoad(pages: PageManager, testData: any): Promise<string> {
        await pages.editLoadCarrierTabPage.clickOnCarrierTab();
        await pages.editLoadCarrierTabPage.selectCarrier1(testData.carrierID);
        await pages.editLoadPage.clickOnTab(TABS.PICK);
        await pages.editLoadPickTabPage.selectShipperAddress();
        await pages.editLoadPickTabPage.selectClientByNameShipper(testData);
        await pages.editLoadPickTabPage.enterActualDateValue(commonReusables.getNextTwoDatesFormatted().tomorrow);
        await pages.editLoadPickTabPage.enterActualTimeValue(testData.shipperEarliestTime);
        await pages.editLoadPickTabPage.enterDeadlineValue(commonReusables.getNextTwoDatesFormatted().tomorrow);
        await pages.editLoadPickTabPage.enterDeadlineTimeValue(testData.shipperLatestTime);
        await pages.editLoadPickTabPage.enterQtyValue(testData.shipmentCommodityQty);
        await pages.editLoadPickTabPage.selectItemType(testData.shipmentCommodityUoM);
        await pages.editLoadPickTabPage.enterDescriptionValue(testData.shipmentCommodityDescription);
        await pages.editLoadPickTabPage.enterWeightValue(testData.shipmentCommodityWeight);
        await pages.editLoadPickTabPage.selectClassOption(testData.classOption);
        await pages.editLoadPage.clickOnTab(TABS.DROP);
        await pages.editLoadDropTabPage.selectConsigneeAddress();
        await pages.editLoadDropTabPage.selectConsigneeByNameConsignee(testData.consigneeName);
        await pages.editLoadDropTabPage.enterActualDateValue(this.dates.dayAfterTomorrow);
        await pages.editLoadDropTabPage.enterActualTimeValue(testData.consigneeEarliestTime);
        await pages.editLoadDropTabPage.enterDeadlineDateValue(this.dates.dayAfterTomorrow);
        await pages.editLoadDropTabPage.enterDeadlineTimeValue(testData.consigneeLatestTime);
        await pages.editLoadFormPage.clickOnSaveBtn();
        console.log('Status has been set to BOOKED');
        await pages.editLoadPage.clickOnEditLoadButton();
        await pages.editLoadPage.validateEditLoadHeadingText();
        const loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        await pages.editLoadFormPage.clickOnSaveBtn();
        console.log(`Load created with number: ${loadNumber}`);
        return loadNumber;
    }
}
