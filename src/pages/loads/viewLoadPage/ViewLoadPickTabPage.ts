import { Page, Locator } from "@playwright/test";
import commonReusables from "@utils/commonReusables";


export default class ViewLoadPickTabPage {

    private readonly pickOneEDIIDValue_LOC: Locator;
    private readonly pickOneActualDateValue_LOC: Locator;
    private readonly pickOneActualTimeValue_LOC: Locator;
    private readonly pickOneDeadlineTimeValue_LOC: Locator;
    private readonly pickOneNameValue_LOC: Locator;
    private readonly pickOneAddressValue_LOC: Locator;
    private readonly pickOneCityValue_LOC: Locator;
    private readonly pickOneStateValue_LOC: Locator;
    private readonly pickOneZipValue_LOC: Locator;

    private readonly pickOneContactValue_LOC: Locator;
    private readonly pickOneEmailValue_LOC: Locator;
    private readonly pickOnePhoneValue_LOC: Locator;

    private readonly pickOneItemOneQtyValue_LOC: Locator;
    private readonly pickOneItemOnePOValue_LOC: Locator;
    private readonly pickOneItemOneWeightValue_LOC: Locator;
    private readonly pickOneItemTwoQtyValue_LOC: Locator;
    private readonly pickOneItemTwoPOValue_LOC: Locator;
    private readonly pickOneItemTwoWeightValue_LOC: Locator;
    private readonly pickOneItem3QtyValue_LOC: Locator;
    private readonly pickOneItem3POValue_LOC: Locator;
    private readonly pickOneItem3WeightValue_LOC: Locator;
    private readonly pickOneItem4QtyValue_LOC: Locator;
    private readonly pickOneItem4POValue_LOC: Locator;
    private readonly pickOneItem4WeightValue_LOC: Locator;
    private readonly sendAppointmentPick1Button_LOC: Locator;
    private readonly pickInMinutesValue_LOC: Locator;
    private readonly pickOutMinutesValue_LOC: Locator;

    constructor(private page: Page) {
        this.pickOneEDIIDValue_LOC = page.locator("//table[@id='carr_1_stop_1_addrtbl']//td[text()='EDI ID']/following-sibling::td[1]");
        this.pickOneActualDateValue_LOC = page.locator("//td[text()='PU#']//ancestor::td/a/..//td[text()='Actual Date']/following-sibling::td[@class='view']");
        this.pickOneActualTimeValue_LOC = page.locator("//td[text()='PU#']//ancestor::td/a/..//td[text()='Actual Time']/following-sibling::td[@class='view']");
        this.pickOneDeadlineTimeValue_LOC = page.locator("//td[text()='PU#']//ancestor::td/a/..//td[contains(text(),'Deadline')]/following-sibling::td[@class='view'][2]");
        this.pickOneNameValue_LOC = page.locator("//label[@for='carr_1_stop_1_name']/parent::td/following-sibling::td");
        this.pickOneAddressValue_LOC = page.locator("//td[@id='carr_1_stop_1_addr1_cell']");
        this.pickOneCityValue_LOC = page.locator("//td[@id='carr_1_stop_1_city_cell']");
        this.pickOneStateValue_LOC = page.locator("//td[@id='carr_1_stop_1_state_cell']");
        this.pickOneZipValue_LOC = page.locator("//td[@id='carr_1_stop_1_zip_cell']");
        this.pickOneContactValue_LOC = page.locator("//a[@name='carr_1_stop_1']/parent::td//td[contains(text(),'Contact')]/following-sibling::td");
        this.pickOneEmailValue_LOC = page.locator("//a[@name='carr_1_stop_1']/parent::td//td[contains(text(),'Email')]/following-sibling::td/a");
        this.pickOnePhoneValue_LOC = page.locator("//a[@name='carr_1_stop_1']/parent::td//td[contains(text(),'Phone')]/following-sibling::td");

        this.pickOneItemOneQtyValue_LOC      = page.locator("//table[@id='carr_1_stop_1_item_tbl']//td[contains(text(),'#1')]/following-sibling::td[@data-qty]");
        this.pickOneItemOnePOValue_LOC       = page.locator("//table[@id='carr_1_stop_1_item_tbl']//td[contains(text(),'#1')]/following-sibling::td[@title]");
        this.pickOneItemOneWeightValue_LOC   = page.locator("//table[@id='carr_1_stop_1_item_tbl']//td[contains(text(),'#1')]/following-sibling::td[@data-weight]");
        this.pickOneItemTwoQtyValue_LOC      = page.locator("//table[@id='carr_1_stop_1_item_tbl']//td[contains(text(),'#2')]/following-sibling::td[@data-qty]");
        this.pickOneItemTwoPOValue_LOC       = page.locator("//table[@id='carr_1_stop_1_item_tbl']//td[contains(text(),'#2')]/following-sibling::td[@title]");
        this.pickOneItemTwoWeightValue_LOC   = page.locator("//table[@id='carr_1_stop_1_item_tbl']//td[contains(text(),'#2')]/following-sibling::td[@data-weight]");
        this.pickOneItem3QtyValue_LOC      = page.locator("//table[@id='carr_1_stop_1_item_tbl']//td[contains(text(),'#3')]/following-sibling::td[@data-qty]");
        this.pickOneItem3POValue_LOC       = page.locator("//table[@id='carr_1_stop_1_item_tbl']//td[contains(text(),'#3')]/following-sibling::td[@title]");
        this.pickOneItem3WeightValue_LOC   = page.locator("//table[@id='carr_1_stop_1_item_tbl']//td[contains(text(),'#3')]/following-sibling::td[@data-weight]");
        this.pickOneItem4QtyValue_LOC      = page.locator("//table[@id='carr_1_stop_1_item_tbl']//td[contains(text(),'#4')]/following-sibling::td[@data-qty]");
        this.pickOneItem4POValue_LOC       = page.locator("//table[@id='carr_1_stop_1_item_tbl']//td[contains(text(),'#4')]/following-sibling::td[@title]");
        this.pickOneItem4WeightValue_LOC   = page.locator("//table[@id='carr_1_stop_1_item_tbl']//td[contains(text(),'#4')]/following-sibling::td[@data-weight]");
        this.sendAppointmentPick1Button_LOC    = page.locator("#edi214_carr_1_stop_1_appt_frm_btn");
        this.pickInMinutesValue_LOC = page.locator("//div[@id='pick_1_1_tab']//td[contains(text(),'In')]/following-sibling::td[contains(text(),':')]");
        this.pickOutMinutesValue_LOC = page.locator("//div[@id='pick_1_1_tab']//td[contains(text(),'Out')]/following-sibling::td[contains(text(),':')]");
    }    
    /**
     * Gets the EDI ID from the Pick 1 tab
     * @author Rohit Singh
     * @modified 2025-07-29
     * @returns {Promise<string>} The EDI ID as a string
     * */
    async getPickAddressDetails(): Promise<{
        actPickOneEDIID: string ;
        actPickOneActualDate: string ;
        actPickOneActualTime: string ;
        actPickOneDeadlineTime: string ;
        actPickOneName: string ;
        actPickOneAddress: string ;
        actPickOneCity: string ;
        actPickOneState: string ;
        actPickOneZip: string ;
    }> {
        try {
            // Get text values
            const actPickOneEDIID = (await this.pickOneEDIIDValue_LOC.textContent())?.trim() ?? "";
            const actPickOneActualDate = (await this.pickOneActualDateValue_LOC.textContent())?.trim() ?? "";
            const actPickOneActualTime = (await this.pickOneActualTimeValue_LOC.textContent())?.trim() ?? "";
            const actPickOneDeadlineTime = (await this.pickOneDeadlineTimeValue_LOC.textContent())?.trim() ?? "";
            const actPickOneName = (await this.pickOneNameValue_LOC.textContent())?.trim() ?? "";
            const actPickOneAddress = (await this.pickOneAddressValue_LOC.textContent())?.trim() ?? "";
            const actPickOneCity = (await this.pickOneCityValue_LOC.textContent())?.trim() ?? "";
            const actPickOneState = (await this.pickOneStateValue_LOC.textContent())?.trim() ?? "";
            const actPickOneZip = (await this.pickOneZipValue_LOC.textContent())?.trim() ?? "";
            console.log(actPickOneDeadlineTime);
            return { actPickOneEDIID, actPickOneActualDate, actPickOneActualTime, actPickOneDeadlineTime, actPickOneName, actPickOneAddress, actPickOneCity, actPickOneState, actPickOneZip};
        
        } catch (error) {
            console.error(`Error verifying Pick details: ${error}`);
            throw error;
        }
    };
    /**
     * Gets the contact details for Pick 1
     * @author Rohit Singh
     * @modified 2025-07-29
     * @returns {Promise<{actPickOneContact: string, actPickOneEmail: string, actPickOnePhone: string}>} The contact details
     */
    async getPickContactDetails(): Promise<{
        actPickOneContact: string ;
        actPickOneEmail: string ;
        actPickOnePhone: string ;
    }> {
        try {
            // Get text values
            const actPickOneContact = (await this.pickOneContactValue_LOC.textContent())?.trim() ?? "";
            const actPickOneEmail = (await this.pickOneEmailValue_LOC.textContent())?.trim() ?? "";
            const actPickOnePhone = (await this.pickOnePhoneValue_LOC.textContent())?.trim() ?? "";
            return { actPickOneContact, actPickOneEmail, actPickOnePhone};
        
        } catch (error) {
            console.error(`Error verifying Pick details: ${error}`);
            throw error;
        }
    };
    /**
     * Gets the details of the items for Pick 1
     * @author Rohit Singh
     * @modified 2025-07-29
     * @returns {Promise<{pickOneItemOneQty: string, pickOneItemOnePO: string, pickOneItemOneWeight: string, pickOneItemTwoQty: string, pickOneItemTwoPO: string, pickOneItemTwoWeight: string}>} The item details
     */
    async getPickItemsDetails(): Promise<{
        pickOneItemOneQty   : String;   
        pickOneItemOnePO    : String;   
        pickOneItemOneWeight: String;
        pickOneItemTwoQty   : String;
        pickOneItemTwoPO    : String;
        pickOneItemTwoWeight: String;
    }> {
        try {
            // Get text values\
            const pickOneItemOneQty    = (await this.pickOneItemOneQtyValue_LOC.textContent())?.trim() ?? "";
            const pickOneItemOnePO     = (await this.pickOneItemOnePOValue_LOC.textContent())?.trim() ?? "";
            const pickOneItemOneWeight = (await this.pickOneItemOneWeightValue_LOC.textContent())?.trim() ?? "";
            const pickOneItemTwoQty    = (await this.pickOneItemTwoQtyValue_LOC.textContent())?.trim() ?? "";
            const pickOneItemTwoPO     = (await this.pickOneItemTwoPOValue_LOC.textContent())?.trim() ?? "";
            const pickOneItemTwoWeight = (await this.pickOneItemTwoWeightValue_LOC.textContent())?.trim() ?? "";
            return { pickOneItemOneQty, pickOneItemOnePO, pickOneItemOneWeight, pickOneItemTwoQty, pickOneItemTwoPO, pickOneItemTwoWeight};
        
        } catch (error) {
            console.error(`Error verifying Pick details: ${error}`);
            throw error;
        }
    };
    /**
     * Gets the details of the items for Pick 1
     * @author Rohit Singh
     * @modified 2025-09-16
     * @returns {Promise<{pickItemQty: string, pickItemPO: string, pickItemWeight: string}>} The item details
     */
    async getPickItemsThree(): Promise<{
        pickItemQty   : String;   
        pickItemPO    : String;   
        pickItemWeight: String;
    }> {
        try {
            // Get text values\
            const pickItemQty    = (await this.pickOneItem3QtyValue_LOC.textContent())?.trim() ?? "";
            const pickItemPO     = (await this.pickOneItem3POValue_LOC.textContent())?.trim() ?? "";
            const pickItemWeight = (await this.pickOneItem3WeightValue_LOC.textContent())?.trim() ?? "";
            return { pickItemQty, pickItemPO, pickItemWeight};
        } catch (error) {
            console.error(`Error verifying Pick details: ${error}`);
            throw error;
        }
    };
    /**
     * Gets the details of the items for Pick 1
     * @author Rohit Singh
     * @modified 2025-09-16
     * @returns {Promise<{pickItemQty: string, pickItemPO: string, pickItemWeight: string}>} The item details
     */
    async getPickItemsFour(): Promise<{
        pickItemQty   : String;   
        pickItemPO    : String;   
        pickItemWeight: String;
    }> {
        try {
            // Get text values
            const pickItemQty    = (await this.pickOneItem4QtyValue_LOC.textContent())?.trim() ?? "";
            const pickItemPO     = (await this.pickOneItem4POValue_LOC.textContent())?.trim() ?? "";
            const pickItemWeight = (await this.pickOneItem4WeightValue_LOC.textContent())?.trim() ?? "";
            return { pickItemQty, pickItemPO, pickItemWeight};
        } catch (error) {
            console.error(`Error verifying Pick details: ${error}`);
            throw error;
        }
    };
    /**
     * @description Clicks the "Send Appointment" button for Pick 1.
     * @author Rohit Singh
     * @modified 2025-07-29
     */
    async clickPick1SendAppointmentButton() {
        await this.sendAppointmentPick1Button_LOC.click();
        await commonReusables.validateAlert(this.page, "AA: PICK-UP APPT");
        await this.page.waitForLoadState('networkidle');
    }
     /**
   * Gets the driver out minutes value from the Drop tab
   * @author Rohit Singh
   * @modified 2025-08-07
   * @returns {Promise<string>} The driver out minutes value
   */
  async getPickDriverOutTimeValue(): Promise<string> {
    return await this.pickOutMinutesValue_LOC.innerText();
  }
    /**
   * Gets the driver In minutes value from the Drop tab
   * @author Rohit Singh
   * @modified 2025-09-19
   * @returns {Promise<string>} The driver In minutes value
   */
  async getPickDriverInTimeValue(): Promise<string> {
    return await this.pickInMinutesValue_LOC.innerText();
  }

}