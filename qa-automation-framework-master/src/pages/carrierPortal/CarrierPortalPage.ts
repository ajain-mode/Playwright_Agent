import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class CarrierPortalPage {
    private readonly driverNameInput_LOC: Locator;
    private readonly driverNumberInput_LOC: Locator;
    private readonly carrierDispatchNameInput_LOC: Locator;
    private readonly carrierDispatchNumberInput_LOC: Locator;
    private readonly carrierDispatchEmailInput_LOC: Locator;
    private readonly agreeTermsCheckbox_LOC: Locator;
    private readonly acceptTenderButton_LOC: Locator;
    private readonly acceptSuccessMessage_LOC: (loadId: string) => Locator;

    constructor(private page: Page) {
        this.driverNameInput_LOC = this.page.locator("#e_confirmation_accept_driver_name");
        this.driverNumberInput_LOC = this.page.locator("#e_confirmation_accept_driver_phone");
        this.carrierDispatchNameInput_LOC = this.page.locator("#e_confirmation_accept_booked_with");
        this.carrierDispatchNumberInput_LOC = this.page.locator("#e_confirmation_accept_booked_with_phone");
        this.carrierDispatchEmailInput_LOC = this.page.locator("#e_confirmation_accept_booked_with_email");
        this.agreeTermsCheckbox_LOC = this.page.locator("#e_confirmation_accept_agree_to_terms");
        this.acceptTenderButton_LOC = this.page.locator("//button[text()='Accept Tender']");
        this.acceptSuccessMessage_LOC = (loadId: string) => this.page.locator(`//h3[text()='Load Tender ${loadId} Has Been Accepted']`);
    }
    /**
     * Enter Driver Name
     * @param driverName 
     * @author Rohit Singh
     * @created 08-Jan-2026
     */
    async enterDriverName(driverName: string): Promise<void> {
        console.log("Entering driver name:", driverName);
        await this.driverNameInput_LOC.fill(driverName);
    }
    /**
     * Enter Driver Name
     * @param driverName 
     * @author Rohit Singh
     * @created 08-Jan-2026
     */
    async enterDriverNumber(driverNumber: string): Promise<void> {
        console.log("Entering driver number:", driverNumber);
        await this.driverNumberInput_LOC.fill(driverNumber);
    }
    /**
     * Check Agree Terms Checkbox
     * @author Rohit Singh
     * @created 08-Jan-2026
     */
    async checkAgreeTermsCheckbox(): Promise<void> {
        console.log("Checking agree terms checkbox");
        await this.agreeTermsCheckbox_LOC.check();
    }
    /**
     * Enter Carrier Details
     * @author Rohit Singh
     * @created 08-Jan-2026
     * @param driverName 
     * @param dispatchName 
     * @param dispatchNumber 
     * @param dispatchEmail 
     */
    async enterCarrierDetails(dispatchName: string, dispatchNumber: string, dispatchEmail: string): Promise<void> {
        await this.carrierDispatchNameInput_LOC.fill(dispatchName);
        await this.carrierDispatchNumberInput_LOC.fill(dispatchNumber);
        await this.carrierDispatchEmailInput_LOC.fill(dispatchEmail);
        console.log("Entered carrier dispatch details:", {
            dispatchName,
            dispatchNumber,
            dispatchEmail
        });
    }
    /**
     * Click Accept Tender Button
     * @author Rohit Singh
     * @created 08-Jan-2026
     */
    async clickAcceptTenderButton(): Promise<void> {
        await this.acceptTenderButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
        console.log("Clicked on Accept Tender button");
    }
    /**
     * Verify Load Tender Accepted Success Message
     * @author Rohit Singh
     * @created 08-Jan-2026
     * @param loadId
    */
    async verifyLoadTenderAcceptedSuccessMessage(loadId: string): Promise<void> {
        await commonReusables.waitForPageStable(this.page);
        await expect(this.acceptSuccessMessage_LOC(loadId)).toBeVisible();
        console.log(`Verified load tender accepted success message for Load ID: ${loadId}`);
    }

}