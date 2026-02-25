
/**
     * @description This class contains methods to interact with the Edit Sales Lead Page
     * @author Aniket Nale
     * @created 24-Dec-2025
     */

import { Page, Locator, expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class EditSalesLeadPage {

    private readonly salesLeadStatusDropdown_LOC: Locator;
    private readonly saveButton_LOC: Locator;
    private readonly paymentTermsDropdown_LOC: Locator;

    constructor(private page: Page) {
        this.salesLeadStatusDropdown_LOC = page.locator('select[name="status"]');
        this.saveButton_LOC = page.locator("(//button[@type='submit' and @value='Save'])[1]");
        this.paymentTermsDropdown_LOC = page.locator('select[name="payment_terms"]');
    }

    /**
* @description Click on Save Customer Button
* @author Aniket Nale
* @modified 26-12-2025
*/

    async clickOnSaveCustomerButton() {
        await commonReusables.waitForPageStable(this.page);
        await this.saveButton_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await this.saveButton_LOC.scrollIntoViewIfNeeded();
        await this.saveButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
* @description Select 'ACTIVE' status from Sales Lead Status dropdown
* @author Aniket Nale
* @modified 26-12-2025
*/

    async selectSalesLeadStatus(leadStatus: string): Promise<void> {
        try {
            console.log(`Selecting ${leadStatus} from status dropdown...`);
            const statusDropdown = this.salesLeadStatusDropdown_LOC;
            await statusDropdown.waitFor({ state: 'visible', timeout: WAIT.LARGE });
            await statusDropdown.selectOption({ value: leadStatus });
            await expect(this.salesLeadStatusDropdown_LOC).toHaveValue(leadStatus);
            console.log(`${leadStatus} selected successfully`);
        } catch (error) {
            console.error(`Failed to select ${leadStatus}:`, error);
            throw error;
        }
    }

    /**
* @description Click on Save Customer Button and wait for popup
* @author Aniket Nale
* @modified 26-12-2025
*/

    async clickOnSaveCustomerButtonAndWaitForPopup() {
        await this.saveButton_LOC.waitFor({ state: 'visible' });
        await this.saveButton_LOC.scrollIntoViewIfNeeded();
        const [popup] = await Promise.all([
            this.page.waitForEvent('popup'),
            this.saveButton_LOC.click()
        ]);
        await popup.waitForLoadState('load');
        console.log(`Popup opened and loaded successfully with URL: ${popup.url()}`);
        await popup.close();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
* @description Select Payment Terms from dropdown
* @author Aniket Nale
* @modified 26-12-2025
*/

    async selectPaymentTerms(paymentTerm: string): Promise<void> {
        try {
            console.log(`Selecting ${paymentTerm} from payment terms dropdown...`);
            const paymentTermsDropdown = this.paymentTermsDropdown_LOC;
            await paymentTermsDropdown.waitFor({ state: 'visible', timeout: WAIT.LARGE });
            await paymentTermsDropdown.selectOption({ value: paymentTerm });
            console.log(`${paymentTerm} selected successfully`);
        } catch (error) {
            console.error(`Failed to select ${paymentTerm}:`, error);
            throw error;
        }
    }
}