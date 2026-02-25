import ViewLoadPage from "@pages/loads/viewLoadPage/ViewLoadPage";
import { Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";


class EdiHelper {


    async disableAutoOverlay(page: Page, customerName: string, agentName?: string) {
        const pages = new PageManager(page);
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await page.waitForLoadState("networkidle");
        await pages.searchCustomerPage.enterCustomerName(customerName);
        if (agentName) {
            await pages.searchCustomerPage.enterAgentName(agentName);
        }
        await pages.searchCustomerPage.searchCustomerAndClickDetails(customerName);
        await pages.viewCustomerPage.clickEditButton();;
        await pages.viewCustomerPage.disableAutoOverlayCheckbox();
        await pages.editCustomerPage.clickSaveButton();;
        await page.waitForLoadState("networkidle");
    }
    /**
     * Creates an Intermodal Load with Active Status using provided test data
     * @author Rohit Singh
     * @created 2024-12-26
     */
    async createIntermodalLoadWithActiveStatus(page: Page, testData: any) {
        const pages = new PageManager(page);
        await page.waitForLoadState("networkidle");
        await pages.editLoadLoadTabPage.selectRateCardValue(testData.rateType);
        await pages.editLoadLoadTabPage.enterPONumber(await commonReusables.generateRandomString(6));
        await pages.editLoadLoadTabPage.enterBLNumber(await commonReusables.generateRandomString(6));
        await pages.editLoadLoadTabPage.enterShipNumber(await commonReusables.generateRandomString(6));
        await pages.editLoadLoadTabPage.enterCustRefNumber(await commonReusables.generateRandomString(6));
        await pages.editLoadLoadTabPage.enterContainerDetails(
            await commonReusables.generateRandomString(4), await commonReusables.generateRandomNumber(6).toString());
        await pages.editLoadPage.clickOnCustomerTab();
        await pages.editLoadCustomerTabPage.enterCustomerLinehaulRate(testData.customerLinehaulRate);
        await pages.editLoadCustomerTabPage.enterFuelSurcharge(testData.fuelSurcharge);
        //click carrier tab
        await pages.editLoadPage.clickOnCarrierTab();
        await pages.editLoadCarrierTabPage.enterCarrierLinehaulRate(CARRIER_TABS.CARRIER_1, testData.carrierLinehaulRate);
        //click Pick one tab
        await pages.editLoadPage.clickOnPick1Tab();
        await pages.editLoadPickTabPage.selectShipperAddress();
        await pages.editLoadPickTabPage.selectClientByNameShipper(testData);
        await pages.editLoadPickTabPage.enterActualDateValue(pages.commonReusables.getNextTwoDatesFormatted().tomorrow);
        await pages.editLoadPickTabPage.enterActualTimeValue(testData.actualTimeP1);
        await pages.editLoadPickTabPage.enterDeadlineValue(pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow);
        await pages.editLoadPickTabPage.enterDeadlineTimeValue(testData.actualTimeP2);
        await pages.editLoadPickTabPage.enterQtyValue(testData.pick1Item1Qty);
        await pages.editLoadPickTabPage.selectItemType(testData.item1Type);
        await pages.editLoadPickTabPage.selectCommodityCode(testData.itemDescription);
        await pages.editLoadPickTabPage.enterWeightValue(testData.pick1Item1Weight);

        //click carrier 2 tab
        await pages.editLoadPage.clickCarrier2Tab();
        await pages.editLoadCarrierTabPage.enterCarrierLinehaulRate(CARRIER_TABS.CARRIER_2, testData.carrierLinehaulRate);

        await pages.editLoadRailTabPage.enterItem1Details(
            await testData.item1Qty,
            await testData.item1Type,
            await testData.stcc,
            await testData.item1Weight);
        await pages.editLoadRailTabPage.enterRoutingDetails(
            await testData.spq,
            await testData.service,
            await testData.rrPlan,
            await testData.cofc_Tofc,
            await testData.carrier2Stop1,
            await testData.carrier2Stop2);
        await pages.editLoadRailTabPage.selectRouteAndNotifyParty(await testData.routeCode, await testData.notifyParty);
        await pages.editLoadRailTabPage.selectBeneficialOwner();

        //click carrier 3 tab
        await pages.editLoadPage.clickCarrier3Tab();
        await pages.editLoadCarrierTabPage.enterCarrierLinehaulRate(CARRIER_TABS.CARRIER_3, testData.carrierLinehaulRate);

        //Enter Drop detals
        await pages.editLoadPage.clickOnDrop2Tab();
        await pages.editLoadDropTabPage.selectConsigneeAddress(CARRIER_TABS.CARRIER_3);
        await pages.editLoadDropTabPage.selectConsigneeByNameConsignee(testData.drop1Name, CARRIER_TABS.CARRIER_3);
        // await commonReusables.dialogHandler(page);
        await pages.editLoadDropTabPage.enterActualDateValue(await commonReusables.getDate("tomorrow", "MM/DD/YYYY"), CARRIER_TABS.CARRIER_3);
        await pages.editLoadDropTabPage.enterActualTimeValue(testData.drop1TimeD1, CARRIER_TABS.CARRIER_3);
        await pages.editLoadDropTabPage.enterDeadlineDateValue(await commonReusables.getDate("dayAfterTomorrow", "MM/DD/YYYY"), CARRIER_TABS.CARRIER_3);
        await pages.editLoadDropTabPage.enterDeadlineTimeValue(testData.drop1TimeD2, CARRIER_TABS.CARRIER_3);

        await page.waitForTimeout(WAIT.DEFAULT); //wait for 5 sec
        await pages.editLoadLoadTabPage.uncheckAutoLoadTenderCheckbox();
        await pages.editLoadPage.clickSaveButton();
        // Get Load ID after creation
        const viewLoadPage = new ViewLoadPage(page);
        const createdLoadId = await viewLoadPage.getLoadID();
        console.log(`Created Load ID: ${createdLoadId}`);
        return createdLoadId;
    }

    /**
     * Creates an Intermodal Load with Booked Status using provided test data
     * @author Rohit Singh
     * @created 21-Jan-2026
     * @param page
     * @param testData
     * @returns
     */
    async createIntermodalLoadWithBookedStatus(page: Page, testData: any) {
        const loadId = await this.createIntermodalLoadWithActiveStatus(page, testData);
        const pages = new PageManager(page);
        await pages.viewLoadPage.clickEditButton();
 
        await pages.editLoadPage.clickOnCarrierTab();
        await pages.editLoadCarrierTabPage.selectCarrier1(await testData.carrier1Number);
        console.log(`Selected Carrier 1: ${await testData.carrier1Number}`);
        // Select Railroad
        await pages.editLoadPage.clickCarrier2Tab();
        await pages.editLoadCarrierTabPage.selectCarrier2(await testData.carrier2Number);
        console.log(`Selected Carrier 2: ${await testData.carrier2Number}`);
        // Select Destination Drayman
        await pages.editLoadPage.clickCarrier3Tab();
        await pages.editLoadCarrierTabPage.selectCarrier3(await testData.carrier3Number);
        console.log(`Selected Carrier 3: ${await testData.carrier3Number}`);
        //Save the load after assigning carriers
        await pages.editLoadPage.clickLoadTab();
        await pages.editLoadPage.clickSaveButton();
        await commonReusables.waitForPageStable(page);
        return await loadId;
    }
}
const ediHelper = new EdiHelper();
export default ediHelper;