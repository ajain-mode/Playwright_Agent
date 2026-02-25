import { Page, Locator } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
/**
 * @author Rohit Singh
 * @created 2025-07-24
 * @description This class contains methods to interact with the View Load Drop Tab Page.
 */

export default class ViewLoadDropTabPage {

    private readonly dropOneActualDateValue_LOC: Locator;
    private readonly dropOneActualTimeValue_LOC: Locator;
    private readonly dropOneDeadlineTimeValue_LOC: Locator;

    private readonly dropOneEDIIDValue_LOC: Locator;
    private readonly dropOneNameValue_LOC: Locator;
    private readonly dropOneAddressValue_LOC: Locator;
    private readonly dropOneCityValue_LOC: Locator;
    private readonly dropOneStateValue_LOC: Locator;
    private readonly dropOneZipValue_LOC: Locator;

    private readonly dropOneContactValue_LOC: Locator;
    private readonly dropOneEmailValue_LOC: Locator;
    private readonly dropOnePhoneValue_LOC: Locator;

    private readonly dropOneItemOneQtyValue_LOC: Locator;
    private readonly dropOneItemOnePOValue_LOC: Locator;
    private readonly dropOneItemOneWeightValue_LOC: Locator;
    private readonly dropOneItemTwoQtyValue_LOC: Locator;
    private readonly dropOneItemTwoPOValue_LOC: Locator;
    private readonly dropOneItemTwoWeightValue_LOC: Locator;
    private readonly sendAppointmentDrop3Button_LOC: Locator;
    private readonly dropInMinutesValue_LOC: Locator;
    private readonly dropOutMinutesValue_LOC: Locator;

    constructor(private page: Page) {
        this.dropOneActualDateValue_LOC = page.locator("//div[@id='drop_1_2_tab']//td[text()='Actual Date']/following-sibling::td");
        this.dropOneActualTimeValue_LOC = page.locator("//div[@id='drop_1_2_tab']//td[text()='Actual Time']/following-sibling::td");
        this.dropOneDeadlineTimeValue_LOC = page.locator("//div[@id='drop_1_2_tab']//td[contains(text(),'Deadline')]/following-sibling::td[2]");

        this.dropOneEDIIDValue_LOC = page.locator("//div[@id='drop_1_2_tab']//td[text()='EDI ID']/following-sibling::td[1]");
        this.dropOneNameValue_LOC = page.locator("//label[@for='carr_1_stop_2_name']/parent::td/following-sibling::td");
        this.dropOneAddressValue_LOC = page.locator("//td[@id='carr_1_stop_2_addr1_cell']");
        this.dropOneCityValue_LOC = page.locator("//td[@id='carr_1_stop_2_city_cell']");
        this.dropOneStateValue_LOC = page.locator("//td[@id='carr_1_stop_2_state_cell']");
        this.dropOneZipValue_LOC = page.locator("//td[@id='carr_1_stop_2_zip_cell']");

        this.dropOneContactValue_LOC = page.locator("//a[@name='carr_1_stop_2']/parent::td//td[contains(text(),'Contact')]/following-sibling::td");
        this.dropOneEmailValue_LOC = page.locator("//a[@name='carr_1_stop_2']/parent::td//td[contains(text(),'Email')]/following-sibling::td/a");
        this.dropOnePhoneValue_LOC = page.locator("//a[@name='carr_1_stop_2']/parent::td//td[contains(text(),'Phone')]/following-sibling::td");

        this.dropOneItemOneQtyValue_LOC = page.locator("//table[@id='carr_1_stop_2_item_tbl']//td[contains(text(),'#1')]/following-sibling::td[@data-qty]");
        this.dropOneItemOnePOValue_LOC = page.locator("//table[@id='carr_1_stop_2_item_tbl']//td[contains(text(),'#1')]/following-sibling::td[@title]");
        this.dropOneItemOneWeightValue_LOC = page.locator("//table[@id='carr_1_stop_2_item_tbl']//td[contains(text(),'#1')]/following-sibling::td[@data-weight]");
        this.dropOneItemTwoQtyValue_LOC = page.locator("//table[@id='carr_1_stop_2_item_tbl']//td[contains(text(),'#2')]/following-sibling::td[@data-qty]");
        this.dropOneItemTwoPOValue_LOC = page.locator("//table[@id='carr_1_stop_2_item_tbl']//td[contains(text(),'#2')]/following-sibling::td[@title]");
        this.dropOneItemTwoWeightValue_LOC = page.locator("//table[@id='carr_1_stop_2_item_tbl']//td[contains(text(),'#2')]/following-sibling::td[@data-weight]");
        this.sendAppointmentDrop3Button_LOC = page.locator("#edi214_carr_3_stop_2_appt_frm_btn");
        this.dropInMinutesValue_LOC = page.locator("//div[@id='drop_3_2_tab']//td[contains(text(),'In')]/following-sibling::td[contains(text(),':')]");
        this.dropOutMinutesValue_LOC = page.locator("//div[@id='drop_3_2_tab']//td[contains(text(),'Out')]/following-sibling::td[contains(text(),':')]");
        
    }
    /**
     * Clicks on the Send Appointment button for Drop 3
     * @author Rohit Singh
     * @modified 2025-07-24
     */
    async verifyDropDetails(): Promise<{
        actDropOneEDIID: string | null;
        actDropOneActualDate: string | null;
        actDropOneActualTime: string;
        actDropOneDeadlineTime: string;
        actDropOneName: string | null;
        actDropOneAddress: string | null;
        actDropOneCity: string | null;
        actDropOneState: string | null;
        actDropOneZip: string | null;
    }> {
        try {
            // Get text values
            const actDropOneEDIID = (await this.dropOneEDIIDValue_LOC.textContent())?.trim() ?? null;
            const actDropOneActualDate = (await this.dropOneActualDateValue_LOC.textContent())?.trim() ?? null;
            const actDropOneActualTime = (await this.dropOneActualTimeValue_LOC.textContent())?.trim() ?? "";
            const actDropOneDeadlineTime = (await this.dropOneDeadlineTimeValue_LOC.textContent())?.trim() ?? "";
            const actDropOneName = (await this.dropOneNameValue_LOC.textContent())?.trim() ?? null;
            const actDropOneAddress = (await this.dropOneAddressValue_LOC.textContent())?.trim() ?? null;
            const actDropOneCity = (await this.dropOneCityValue_LOC.textContent())?.trim() ?? null;
            const actDropOneState = (await this.dropOneStateValue_LOC.textContent())?.trim() ?? null;
            const actDropOneZip = (await this.dropOneZipValue_LOC.textContent())?.trim() ?? null;


            return { actDropOneEDIID, actDropOneActualDate, actDropOneActualTime, actDropOneDeadlineTime,
                     actDropOneName, actDropOneAddress, actDropOneCity, actDropOneState, actDropOneZip};
        
        } catch (error) {
            console.error(`Error verifying Pick details: ${error}`);
            throw error;
        }
    };
    /**
     * Gets the contact details for Drop 1
     * @author Rohit Singh
     * @modified 2025-07-24
     * @returns {Promise<{actDropOneContact: string, actDropOneEmail: string, actDropOnePhone: string}>} The contact details
     */
    async getDropContactDetails(): Promise<{
        actDropOneContact: string ;
        actDropOneEmail: string ;
        actDropOnePhone: string ;
    }> {
        try {
            // Get text values
            const actDropOneContact = (await this.dropOneContactValue_LOC.textContent())?.trim() ?? "";
            const actDropOneEmail = (await this.dropOneEmailValue_LOC.textContent())?.trim() ?? "";
            const actDropOnePhone = (await this.dropOnePhoneValue_LOC.textContent())?.trim() ?? "";
            return { actDropOneContact, actDropOneEmail, actDropOnePhone};
        
        } catch (error) {
            console.error(`Error verifying Pick details: ${error}`);
            throw error;
        }
    };
    /**
     * Gets the item details for Drop 1
     * @author Rohit Singh
     * @modified 2025-07-24
     * @returns {Promise<{dropOneItemOneQty: string, dropOneItemOnePO: string, dropOneItemOneWeight: string, dropOneItemTwoQty: string, dropOneItemTwoPO: string, dropOneItemTwoWeight: string}>} The item details
     */
    async getDropItemsDetails(): Promise<{
        dropOneItemOneQty   : String;   
        dropOneItemOnePO    : String;   
        dropOneItemOneWeight: String;
        dropOneItemTwoQty   : String;
        dropOneItemTwoPO    : String;
        dropOneItemTwoWeight: String;
    }> {
        try {
            // Get text values\
            const dropOneItemOneQty    = (await this.dropOneItemOneQtyValue_LOC.textContent())?.trim() ?? "";
            const dropOneItemOnePO     = (await this.dropOneItemOnePOValue_LOC.textContent())?.trim() ?? "";
            const dropOneItemOneWeight = (await this.dropOneItemOneWeightValue_LOC.textContent())?.trim() ?? "";
            const dropOneItemTwoQty    = (await this.dropOneItemTwoQtyValue_LOC.textContent())?.trim() ?? "";
            const dropOneItemTwoPO     = (await this.dropOneItemTwoPOValue_LOC.textContent())?.trim() ?? "";
            const dropOneItemTwoWeight = (await this.dropOneItemTwoWeightValue_LOC.textContent())?.trim() ?? "";
            return { dropOneItemOneQty, dropOneItemOnePO, dropOneItemOneWeight, dropOneItemTwoQty, dropOneItemTwoPO, dropOneItemTwoWeight};
        
        } catch (error) {
            console.error(`Error verifying Pick details: ${error}`);
            throw error;
        }
    };
    /**
     * Gets the item details for Drop 1
     * @author Rohit Singh
     * @modified 2025-07-24
     * @returns {Promise<{dropOneItemOneQty: string, dropOneItemOnePO: string, dropOneItemOneWeight: string, dropOneItemTwoQty: string, dropOneItemTwoPO: string, dropOneItemTwoWeight: string}>} The item details
     */
    async getDropItemOne(): Promise<{
        dropOneItemOneQty   : String;   
        dropOneItemOnePO    : String;   
        dropOneItemOneWeight: String;
    }> {
        try {
            const dropOneItemOneQty    = (await this.dropOneItemOneQtyValue_LOC.textContent())?.trim() ?? "";
            const dropOneItemOnePO     = (await this.dropOneItemOnePOValue_LOC.textContent())?.trim() ?? "";
            const dropOneItemOneWeight = (await this.dropOneItemOneWeightValue_LOC.textContent())?.trim() ?? "";
            return { dropOneItemOneQty, dropOneItemOnePO, dropOneItemOneWeight};
        
        } catch (error) {
            console.error(`Error verifying Pick details: ${error}`);
            throw error;
        }
    };

    /**
     * @description Clicks the "Send Appointment" button for Drop 3.
     * @author Rohit Singh
     * @modified 2025-07-29
     */
    async clickDrop3SendAppointmentButton() {
        await this.sendAppointmentDrop3Button_LOC.click();
        await commonReusables.validateAlert(this.page, "AG: DELIVERY APPT");
        await this.page.waitForLoadState('networkidle');
    }
    /**
   * Gets the driver out minutes value from the Drop tab
   * @author Rohit Singh
   * @modified 2025-08-07
   * @returns {Promise<string>} The driver out minutes value
   */
  async getDriverOutTimeValue(): Promise<string> {
    return await this.dropOutMinutesValue_LOC.innerText();
  }
    /**
   * Gets the driver In minutes value from the Drop tab
   * @author Rohit Singh
   * @modified 2025-09-19
   * @returns {Promise<string>} The driver In minutes value
   */
  async getDriverInTimeValue(): Promise<string> {
    return await this.dropInMinutesValue_LOC.innerText();
  }



}