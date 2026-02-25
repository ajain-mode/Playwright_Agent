import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
/**
 * @author Rohit Singh
 * @created 2025-07-19
 * @description View Master Customer Page Object - Handles actions related to the view master customer page
 */
export default class ViewMasterCustomerPage {
    private readonly customerNameLink_LOC: (customerId: string) => Locator;
    private readonly editButton_LOC: Locator;
    private readonly homeButton_LOC: Locator;
    private readonly manageExternalIdValue_LOC: Locator;
    private readonly activeStatus_LOC: Locator;
    private readonly custID_LOC: Locator;
    private readonly duplicateButton_LOC: Locator;
    private readonly operatingOfficeDropdown_LOC: Locator;
    private readonly duplicateCustomerSaveButton_LOC: Locator;

    constructor(private page: Page) {
        this.customerNameLink_LOC = (customerId: string) => page.locator(`//a[contains(@href,'custform.php?custa_id=${customerId}')]`);
        this.editButton_LOC = page.locator("//td[contains(text(),'View Master Customer')]/following-sibling::td//input[@value='  Edit  ']")
        this.homeButton_LOC = page.locator("//a/span[text()='Home']");
        this.manageExternalIdValue_LOC = page.locator("#external_id_pairs");
        this.activeStatus_LOC = page.locator("//b[normalize-space()='ACTIVE']");
        this.custID_LOC = page.locator("//td[@class='fn' and contains(string(.),'Cust ID')] /following-sibling::td[1]");
        this.duplicateButton_LOC = page.locator("#duplicate_button");
        this.operatingOfficeDropdown_LOC = page.locator("#duplicateoffice");
        this.duplicateCustomerSaveButton_LOC = page.locator("#duplicate-save-btn");
    }
    /**
     * @author Rohit Singh
     * @created 2025-07-19
     * @description Clicks on the customer name link in the view master customer page.
     */
    async clickCustomerNameLink(customerId: string = "") {
        await this.page.waitForLoadState("domcontentloaded");
        await this.customerNameLink_LOC(customerId).waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
        await this.customerNameLink_LOC(customerId).click();
    }
    /**
     * @author Rohit Singh
     * @created 2025-10-13
     * @description Clicks on the Edit button to navigate to Edit Master Customer page.
     */
    async clickEditButton(): Promise<void> {
        await this.page.waitForLoadState("networkidle");
        await this.editButton_LOC.click();
        await this.page.waitForLoadState("networkidle");
    }
    /**
     * @author Rohit Singh
     * @created 2025-11-04
     * @description Clicks on the Home button to navigate to Home page.
     */
    async clickHomeButton(): Promise<void> {
        await this.page.waitForLoadState("networkidle");
        await this.homeButton_LOC.click();
        await this.page.waitForLoadState("networkidle");
    }

    /**
* @author Aniket Nale
* @created 22-Dec-25
* @description Checks if the Manage External ID is present in the UI
*/

    async isManageExternalIdPresent() {
        await commonReusables.waitForPageStable(this.page);
        await this.manageExternalIdValue_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await expect.soft(this.manageExternalIdValue_LOC).toBeVisible();
        const text = (await this.manageExternalIdValue_LOC.textContent())?.trim();
        expect.soft(text).not.toBe('(none)');
    }

    /**
* @author Aniket Nale
* @created 22-Dec-25
* @description Checks if the customer is active in the UI
*/

    async isCustomerActive() {
        await commonReusables.waitForPageStable(this.page);
        await this.activeStatus_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await expect.soft(this.activeStatus_LOC).toBeVisible();
    }

    /**
  * @author Aniket Nale
  * @created 01-Jan-26
  * @description Gets the CustID from the Master Customer Page
  * @return The CustID as a string
  */
    async getCustID(): Promise<string> {
        await commonReusables.waitForPageStable(this.page);
        await this.custID_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await expect.soft(this.custID_LOC).toBeVisible();
        const masterLoginID = await this.custID_LOC.textContent();
        console.log(`Master Login ID: ${masterLoginID?.trim()}`);
        return masterLoginID?.trim() || "";
    }
    /**
  * @author Aniket Nale
  * @created 01-Jan-26
  * @description Clicks on the Duplicate Customer Button
  */
    async clickOnDuplicateCustomerButton(): Promise<void> {
        await commonReusables.waitForPageStable(this.page);
        const duplicateButton = this.duplicateButton_LOC.first();
        await duplicateButton.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await expect.soft(duplicateButton).toBeVisible();
        await duplicateButton.click();
        await commonReusables.waitForPageStable(this.page);
    }
    /**
  * @author Aniket Nale
  * @created 01-Jan-26
  * @description Selects the Operating Office from the dropdown
  * @param officeName - The name of the operating office to select
  */
    async selectOperatingOffice(officeName: string): Promise<void> {
        await this.operatingOfficeDropdown_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await expect.soft(this.operatingOfficeDropdown_LOC).toBeVisible();
        await this.operatingOfficeDropdown_LOC.selectOption({ label: officeName });
        await commonReusables.waitForPageStable(this.page);
    }
    /**
  * @author Aniket Nale
  * @created 01-Jan-26
  * @description Clicks on the Duplicate Customer Save Button
  */

    async clickOnDuplicateCustomerSaveButton(): Promise<void> {
        await this.duplicateCustomerSaveButton_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await expect.soft(this.duplicateCustomerSaveButton_LOC).toBeVisible();
        await this.duplicateCustomerSaveButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
        await commonReusables.waitForAllLoadStates(this.page);
        await this.duplicateCustomerSaveButton_LOC.waitFor({ state: 'hidden', timeout: WAIT.LARGE });
    }
}