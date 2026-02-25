import { Page, Locator } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
/**
 * @author Rohit Singh
 * @created 2025-07-28
 * @description This class contains methods to interact with the Edit Load Rail Tab Page.
 */
class EditLoadRailTabPage {

    private readonly carrier2Item1QtyInput_LOC: Locator;
    private readonly carrier2Item1TypeDropdown_LOC: Locator;
    private readonly carrier2StccDropdown_LOC: Locator;
    private readonly carrier2Item1WeightInput_LOC: Locator;
    private readonly dropDownSearchInput_LOC: Locator;
    private readonly searchedResultButton_LOC: Locator;
    private readonly spqInput_LOC: Locator;
    private readonly serviceDropdown_LOC: Locator;
    private readonly rrPlanDropdown_LOC: Locator;
    private readonly cofc_TofcDropdown_LOC: Locator;
    private readonly carrier2Stop1Dropdown_LOC: Locator;
    private readonly carrier2Stop2Dropdown_LOC: Locator;
    private readonly routeDropdown_LOC: Locator;
    private readonly notifyPartyDropdown_LOC: Locator;
    private readonly beneficialOwnerDropdown_LOC: Locator;
    private readonly beneficialOwnerValue_LOC: Locator;


    constructor(private page: Page) {
        this.carrier2Item1QtyInput_LOC = this.page.locator("#carr_2_stop_1_item_1_qty");
        this.carrier2Item1TypeDropdown_LOC = this.page.locator("#carr_2_stop_1_item_1_type");
        this.carrier2StccDropdown_LOC = this.page.locator("#select2-carr_2_stop_1_item_1_intermodal_commodity_code_id-container");
        this.carrier2Item1WeightInput_LOC = this.page.locator("#carr_2_stop_1_item_1_weight");
        this.dropDownSearchInput_LOC = this.page.locator("//span[contains(@class,'search--dropdown')]/input[@type='search']");
        this.searchedResultButton_LOC = this.page.locator("//ul[contains(@id,'select2-carr_2')]/li");
        this.spqInput_LOC = this.page.locator("#carr_2_intermodal_spq");
        this.serviceDropdown_LOC = this.page.locator("#carr_2_intermodal_service_type_code");
        this.rrPlanDropdown_LOC = this.page.locator("#carr_2_intermodal_railroad_plan_code");
        this.cofc_TofcDropdown_LOC = this.page.locator("#carr_2_intermodal_fc_type");
        this.carrier2Stop1Dropdown_LOC = this.page.locator("#carr_2_stop_1_choose");
        this.carrier2Stop2Dropdown_LOC = this.page.locator("#carr_2_stop_2_choose");
        this.routeDropdown_LOC = this.page.locator("#select2-carr_2_intermodal_railroad_routing_code_1-container");
        this.notifyPartyDropdown_LOC = this.page.locator("#carr_2_intermodal_notify_party");
        this.beneficialOwnerDropdown_LOC = this.page.locator("#select2-carr_2_beneficial_owner_choose-container");
        this.beneficialOwnerValue_LOC = this.page.locator("//span[text()='*Customer*']");
    }
    /**
     * Enters item 1 details for Carrier 2
     * @param qty - Quantity of the item
     * @param type - Type of the item
     * @param stcc - STCC code for the item
     * @param weight - Weight of the item
     * @author Rohit Singh
     * @modified 2025-07-28
     */
    async enterItem1Details(qty: string, type: string, stcc: string, weight: string) {
        await this.page.waitForLoadState('networkidle');
        await this.carrier2Item1QtyInput_LOC.fill(await qty.toString());
        await this.carrier2Item1TypeDropdown_LOC.selectOption(type);
        await this.carrier2StccDropdown_LOC.click();
        await this.dropDownSearchInput_LOC.waitFor({ state: 'visible' });
        await this.dropDownSearchInput_LOC.pressSequentially(stcc);
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await this.searchedResultButton_LOC.waitFor({ state: 'visible' , timeout: WAIT.SMALL});
        await this.searchedResultButton_LOC.click();
        await this.carrier2Item1WeightInput_LOC.fill(await weight.toString());
    }
    /**
     * Enters routing details for Carrier 2
     * @param spq - SPQ value
     * @param service - Service type
     * @param rrPlan - Railroad plan code
     * @param cofc_Tofc - COFC/TOFC type
     * @param carrier2Stop1 - Carrier 2 Stop 1
     * @param carrier2Stop2 - Carrier 2 Stop 2
     * @author Rohit Singh
     * @modified 2025-08-13
     */
    async enterRoutingDetails(spq: string, service: string, rrPlan: string, cofc_Tofc: string, carrier2Stop1:string, carrier2Stop2: string) {
        await this.spqInput_LOC.fill(await spq.toString());
        await this.serviceDropdown_LOC.selectOption(await service.toString());
        await this.rrPlanDropdown_LOC.selectOption(await rrPlan.toString());
        await this.cofc_TofcDropdown_LOC.selectOption(await cofc_Tofc.toString());
        await commonReusables.alertAcceptWithText(this.page, "Update ");
        await this.carrier2Stop1Dropdown_LOC.selectOption(await carrier2Stop1.toString());
        await commonReusables.alertAcceptWithText(this.page, "Update ");
        await this.carrier2Stop2Dropdown_LOC.selectOption(await carrier2Stop2.toString());
        await commonReusables.dialogHandler(this.page);
        await this.page.waitForTimeout(WAIT.DEFAULT);
    }
    /**
     * Selects the Beneficial Owner from the dropdown
     * @author Rohit Singh
     * @modified 2025-07-28
     */
    async selectBeneficialOwner() {
        await this.beneficialOwnerDropdown_LOC.click();
        await this.beneficialOwnerValue_LOC.waitFor({ state: 'visible' });
        await this.beneficialOwnerValue_LOC.click();
    }
    /**
     * Selects the Route and Notify Party from the dropdown
     * @param routeCode - Route code
     * @param notifyParty - Notify party
     * @author Rohit Singh
     * @modified 2025-08-13
     */
    async selectRouteAndNotifyParty(routeCode: string, notifyParty: string){
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await this.routeDropdown_LOC.click();
        await this.dropDownSearchInput_LOC.waitFor({ state: 'visible' });
        await this.dropDownSearchInput_LOC.pressSequentially(routeCode);
        await this.page.waitForTimeout(WAIT.DEFAULT);
        await this.searchedResultButton_LOC.waitFor({ state: 'visible' , timeout: WAIT.SMALL});
        await this.searchedResultButton_LOC.click();
        await this.notifyPartyDropdown_LOC.selectOption(notifyParty);   
    }
}
export default EditLoadRailTabPage;