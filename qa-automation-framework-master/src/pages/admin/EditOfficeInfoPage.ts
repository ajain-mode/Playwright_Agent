import { expect, Locator } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class EditOfficeInfoPage {
    private readonly enableInternalShares_LOC: Locator;
    private readonly saveButton_LOC: Locator;
    private readonly thirdPartyCredentials_LOC: Locator;
    private readonly transcoreDATSelect_LOC: Locator;
    private readonly datPostMethodSelect_LOC: Locator;

    constructor(private page: any) {
        this.enableInternalShares_LOC = this.page.locator("#feature_internal_shares");
        this.saveButton_LOC = this.page.locator("//td[contains(text(),'Edit Office Info')]/following-sibling::td/div/input[@value='  Save  ']");
        this.thirdPartyCredentials_LOC = this.page.locator("//a[normalize-space()='3rd Party Credentials']");
        this.transcoreDATSelect_LOC = this.page.locator("//select[@id='use_natl']");
        this.datPostMethodSelect_LOC = this.page.locator("//select[@id='dat_protocol']");

    }
    /**
     * Handles enabling or disabling internal shares on the office edit page.
     * @param option - "YES" to enable internal shares, "NO" to disable.
     * @author Rohit Singh
     * @created 2025-11-12
     */
    async enable_DisableInternalShares(option: string): Promise<void> {
        try {
            // Get the currently selected option
            await this.enableInternalShares_LOC.waitFor({ state: 'visible', timeout: WAIT.DEFAULT });
            const currentSelection = await this.enableInternalShares_LOC.inputValue();
            if (option.toLowerCase() === 'no' && currentSelection === '0') {
                console.log("Internal Shares is already disabled");
                return; // Early return if already set to NO
            }
            // Check if option is "YES" and current selection is already "1" (YES)
            if (option.toLowerCase() === 'yes' && currentSelection === '1') {
                console.log("Internal Shares is already enabled");
                return; // Early return if already set to YES
            }
            await this.enableInternalShares_LOC.selectOption({ label: option });
            console.log(`Internal Shares option set to: ${option}`);
        } catch (error) {
            throw Error(`Error in enable_DisableInternalShares: ${error}`);
        }
    }
    /**
     * Clicks the Save button on the Edit Office Info page.
     * @author Rohit Singh
     * @created 2025-11-12
     */
    async clickSaveButton(): Promise<void> {
        await this.saveButton_LOC.click();
        await this.page.waitForLoadState('networkidle');
    }

    /** Navigate to the Third Party Credentials section
     * @author Mukul Khan
     * @created 1th-Jan-2026
     */
    async navigateToThirdPartyCredentials(): Promise<void> {
        await this.thirdPartyCredentials_LOC.click();
        await commonReusables.waitForPageStable(this.page);
    }

    /**
     * Check if "Enabled" is currently selected
     * @author Mukul Khan
     * @created 1th-Jan-2026
     */
    async isTranscoreDATEnabledSelected(): Promise<boolean> {
        try {
            await this.transcoreDATSelect_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
            const selectedValue = await this.transcoreDATSelect_LOC.inputValue();
            return selectedValue === 'YES';
        }
        catch (err) {
            console.error('Failed to read Transcore DAT selection:', err);
            return false;
        }
    }

    /**
     * Ensure "Enabled" is selected (select if not)
     * @author Mukul Khan
     * @created 15th-Jan-2026
     */
    async ensureTranscoreDATEnabled(): Promise<void> {
        try {
            await this.transcoreDATSelect_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
            const current = await this.transcoreDATSelect_LOC.inputValue();
            if (current === 'YES') {
                return;
            }

            await this.transcoreDATSelect_LOC.selectOption({ value: 'YES' });
            const after = await this.transcoreDATSelect_LOC.inputValue();
            if (after !== 'YES') {
                throw new Error(`Failed to select Enabled. Current value: ${after}`);
            }
        }
        catch (err) {
            console.error('Failed to ensure Transcore DAT is Enabled:', err);
           throw err;
        }
    }

    /**   
     * One-step helper: check and set/ Check and enable Transcore DAT if not already enabled
    * @author Mukul Khan
    * @created 15th-Jan-2026
    */
    async checkAndEnableTranscoreDAT(): Promise<boolean> {
        try {
            const alreadyEnabled = await this.isTranscoreDATEnabledSelected();
            if (!alreadyEnabled) {
                await this.ensureTranscoreDATEnabled();
                return true;
            }
            return false;
        }
        catch (err) {
            console.error('checkAndEnableTranscoreDAT error:', err);
            throw err;
        }
    }

    /**
     * Get the currently selected DAT Post Method // e.g., 'API' | 'FTP'
     * @author Mukul Khan
     * @created 16th-Jan-2026
     */
    async getDatPostMethod(): Promise<string | null> {
        try {
            await this.datPostMethodSelect_LOC.waitFor({ state: 'visible', timeout: WAIT.SMALL });
            return await this.datPostMethodSelect_LOC.inputValue();
        }
        catch (err) {
            console.error('Failed to get DAT Post Method:', err);
            return null;
        }
    }

    /**
     * Sets DAT Load Board Post Method to the desired value (e.g., 'API' or 'FTP').
     * Returns true if the value changed, false if it was already set.
     * @author Mukul Khan
     * @created 16th-Jan-2026
     */
    async setDatPostMethod(value: 'API' | 'FTP'): Promise<boolean> {
        try {
            await this.datPostMethodSelect_LOC.waitFor({ state: 'visible', timeout: 3000 });

            const current = await this.datPostMethodSelect_LOC.inputValue();
            if (current === value)
                return false;

            await this.datPostMethodSelect_LOC.selectOption({ value });
            // Verify the selection took effect
            await expect(this.datPostMethodSelect_LOC).toHaveValue(value);
            return true;
        }
        catch (err) {
            console.error(`Primary selection to ${value} failed:`, err);
            return false;
        }
    }

    /**
     * Ensures the method has the desired value; returns final value for logging.
     * @author Mukul Khan
     * @created 16th-Jan-2026
     */
    async checkAndSetDatPostMethod(value: 'API' | 'FTP'): Promise<string> {
        const before = await this.getDatPostMethod();
        if (before !== value) {
            await this.setDatPostMethod(value);
        }
        const after = await this.getDatPostMethod();
        return after ?? 'UNKNOWN';
    }


  /**
   * officeCodeSearchField - Auto-generated by AI Agent
   * @author AI Agent Generator
   * @created 2026-02-16
   */
  async officeCodeSearchField(searchTerm: string): Promise<void> {
    const searchInput = this.page.locator("input[type='search'], input[id*='search'], input[placeholder*='Search']").first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill(searchTerm);
    console.log(`Searched for: ${searchTerm}`);
  }

  /**
   * searchButtonClick - Auto-generated by AI Agent
   * @author AI Agent Generator
   * @created 2026-02-16
   */
  async searchButtonClick(searchTerm: string): Promise<void> {
    const searchInput = this.page.locator("input[type='search'], input[id*='search'], input[placeholder*='Search']").first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill(searchTerm);
    console.log(`Searched for: ${searchTerm}`);
  }

  /**
   * officeSearchRow - Auto-generated by AI Agent
   * @author AI Agent Generator
   * @created 2026-02-16
   */
  async officeSearchRow(searchTerm: string): Promise<void> {
    const searchInput = this.page.locator("input[type='search'], input[id*='search'], input[placeholder*='Search']").first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill(searchTerm);
    console.log(`Searched for: ${searchTerm}`);
  }

  /**
   * ensureTnxValue - Auto-generated by AI Agent
   * @author AI Agent Generator
   * @created 2026-02-16
   */
  async ensureTnxValue(): Promise<void> {
    // TODO: Implement ensureTnxValue - auto-generated placeholder
    await this.page.waitForLoadState('load');
  }

  /**
   * ensureToggleValues - Auto-generated by AI Agent
   * @author AI Agent Generator
   * @created 2026-02-16
   */
  async ensureToggleValues(): Promise<void> {
    // TODO: Implement ensureToggleValues - auto-generated placeholder
    await this.page.waitForLoadState('load');
  }

  /**
   * configureOfficePreConditions - Auto-generated by AI Agent
   * @author AI Agent Generator
   * @created 2026-02-18
   */
  async configureOfficePreConditions(): Promise<void> {
    // TODO: Implement configureOfficePreConditions - auto-generated placeholder
    await this.page.waitForLoadState('load');
  }
}