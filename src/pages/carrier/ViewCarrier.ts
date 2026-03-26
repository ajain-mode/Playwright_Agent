import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

export default class ViewCarrier {

    private readonly mcNumberDetails_LOC: Locator;
    private readonly dotNumberDetails_LOC: Locator;
    private readonly carrierNameDetails_LOC: Locator;
    private readonly instraStateDetails_LOC: Locator;
    private readonly ffNumberDetails_LOC: Locator;
    private readonly carrierIDDetails_LOC: Locator;
    private readonly mxNumberDetails_LOC: Locator;

    private readonly factorValue_LOC: Locator;
    private readonly carbValue_LOC: Locator;
    private readonly intraStateonlyValue_LOC: Locator;
    private readonly eightAValue_LOC: Locator;
    private readonly qStarValue_LOC: Locator;
    private readonly tCertifiedValue_LOC: Locator;
    private readonly uiiaParticipationValue_LOC: Locator;
    private readonly smartWayValue_LOC: Locator;
    private readonly invProcessGroupValue_LOC: Locator;
    private readonly vendorTypeValue_LOC: Locator;
    private readonly carrierModeValue_LOC: Locator;
    private readonly bcaSignedSubmittedCell: Locator;
    private readonly brokerAuthorityCell: Locator;
    private readonly loadboardStatus_LOC: Locator;
    private readonly modeIQTab_LOC: Locator;
    private readonly carrierEditSaveBtn_LOC: Locator;

    constructor(private page: Page) {
        this.mcNumberDetails_LOC = page.locator("//label[@for='mc_num']/parent::td/following-sibling::td[@class='three-across view'][1]");
        this.dotNumberDetails_LOC = page.locator("//label[@for='dot_num']/parent::td/following-sibling::td[@class='three-across view'][1]");
        this.carrierNameDetails_LOC = page.locator("//label[@for='name']/parent::td/following-sibling::td[contains(@class,'one-across')][1]");
        this.instraStateDetails_LOC = page.locator("//label[@for='st_num']/parent::td/following-sibling::td[contains(@class,'three-across view')][1]");
        this.ffNumberDetails_LOC = page.locator("//label[@for='ff_num']/parent::td/following-sibling::td[contains(@class,'three-across view')][1]");
        this.carrierIDDetails_LOC = page.locator("//label[@for='name']/parent::td/following-sibling::td[contains(@class,'three-across')][1]");
        this.mxNumberDetails_LOC = page.locator("//label[@for='mx_num']/parent::td/following-sibling::td[@class='three-across view'][1]");

        this.factorValue_LOC = page.locator("//span[@id='factor_field']/a");
        this.carbValue_LOC = page.locator("//td[text()='CARB']/following-sibling::td");
        this.intraStateonlyValue_LOC = page.locator("//label[@for='intrastate']/parent::td/following-sibling::td[1]");
        this.eightAValue_LOC = page.locator("//td[@class='fn' and normalize-space()='8a']/following-sibling::td[1]");
        this.qStarValue_LOC = page.locator("//td[@class='fn' and normalize-space()='Q-Star']/following-sibling::td[1]");
        this.tCertifiedValue_LOC = page.locator("//td[@class='fn' and normalize-space()='TSA Certified']/following-sibling::td[1]");
        this.uiiaParticipationValue_LOC = page.locator("//td[@class='fn' and normalize-space()='UIIA Participation']/following-sibling::td[1]");
        this.smartWayValue_LOC = page.locator("//td[@class='fn' and normalize-space()='SmartWay']/following-sibling::td[1]");
        this.invProcessGroupValue_LOC = page.locator("//td[text()='Inv Process Group']/following-sibling::td");
        this.vendorTypeValue_LOC = page.locator("//label[normalize-space()='Vendor Type']/parent::td/following-sibling::td[1]");
        this.carrierModeValue_LOC = page.locator("//td[@class='view carrier-mode']");
        this.bcaSignedSubmittedCell = page.locator("//td[normalize-space()='BCA: Signed & Submitted']");
        this.brokerAuthorityCell = page.locator("//tr[@id='statusbox2']//td[contains(normalize-space(text()), 'Broker: Active')]");
        this.loadboardStatus_LOC = page.locator("#carrier_status_label");
        this.modeIQTab_LOC = page.locator("li[id^='carrform_tab'] a").filter({ hasText: /MODE IQ|LoadBoard/i });
        this.carrierEditSaveBtn_LOC = page.locator("input[type='button'][value='  Save  ']");
    }

    /**
* @author Aniket Nale
* @created 25-Nov-25
* @description Verifies that the MC number in the carrier details matches the expected value.
* @param mcNumber - The MC number to verify.
*/

    async verifyMcNumberInDetails(mcNumber: string) {
        await commonReusables.waitForPageStable(this.page);
        const padded = mcNumber.padStart(8, "0");
        await expect.soft(this.mcNumberDetails_LOC).toHaveText(padded);
    }

    /**
* @author Aniket Nale
* @created 25-Nov-25
* @description Verifies that the DOT number in the carrier details matches the expected value.
* @param dotNumber - The DOT number to verify.
*/

    async verifyDotNumberInDetails(dotNumber: string) {
        await commonReusables.waitForPageStable(this.page);
        await expect.soft(this.dotNumberDetails_LOC).toHaveText(dotNumber);
        console.log(`Verified DOT number: ${dotNumber} in carrier details page`);
    }

    /**
* @author Aniket Nale
* @created 26-Nov-25
* @description Verifies that the carrier name in the carrier details matches the expected value.
* @param carrierName - The carrier name to verify.
*/

    async verifyCarrierNameInDetails(carrierName: string) {
        await commonReusables.waitForPageStable(this.page);
        await expect.soft(this.carrierNameDetails_LOC).toHaveText(carrierName);
        console.log(`Verified carrier name: ${carrierName} in carrier details page`);
    }

    /**
* @author Aniket Nale
* @created 27-Nov-25
* @description Verifies that the intra state number in the carrier details matches the expected value.
* @param intraState - The intra state number to verify.
*/

    async verifyIntraStateInDetails(intraState: string) {
        await commonReusables.waitForPageStable(this.page);
        await expect.soft(this.instraStateDetails_LOC).toHaveText(intraState);
        console.log(`Verified intra state: ${intraState} in carrier details page`);
    }

    /**
* @author Aniket Nale
* @created 02-Dec-25
* @description Verifies that the intra state number in the carrier details matches the expected value.
* @param ffNumber - The FF number to verify.
*/

    async verifyFFInDetails(ffNumber: string) {
        await commonReusables.waitForPageStable(this.page);
        await expect.soft(this.ffNumberDetails_LOC).toHaveText(ffNumber);
        console.log(`Verified FF number: ${ffNumber} in carrier details page`);
    }

    /**
* @author Aniket Nale
* @created 28-Nov-25
* @description Verifies that the intra state number in the carrier details matches the expected value.
* @param carrierID - The carrier ID to verify.
*/

    async verifyCarrierIDInDetails(carrierID: string) {
        await commonReusables.waitForPageStable(this.page);
        await expect.soft(this.carrierIDDetails_LOC).toContainText(carrierID);
        console.log(`Verified Carrier ID: ${carrierID} in carrier details page`);
    }

    /**
* @author Aniket Nale
* @created 02-Dec-25
* @description verify the MX number in the carrier details matches the expected value.
* @param mxNumber - The MX number to verify.
*/

    async verifyMxInDetails(mxNumber: string) {
        await commonReusables.waitForPageStable(this.page);
        await expect.soft(this.mxNumberDetails_LOC).toHaveText(mxNumber);
        console.log(`Verified MX number: ${mxNumber} in carrier details page`);
    }
    /**
     * @author Rohit Singh
     * @created 04-Dec-2025
     * 
     */
    async getFactorValue() {
        await commonReusables.waitForPageStable(this.page);
        const factorValue = await this.factorValue_LOC.textContent();
        console.log(`Factor Value retrieved: ${factorValue}`);
        return factorValue;
    }
    /**
     * Gets the CARB value from the carrier details.
     * @author Rohit Singh
     * @created 04-Dec-2025
     * @returns The CARB value as a string.
     */
    async getCarbValue() {
        await commonReusables.waitForPageStable(this.page);
        const carbValue = (await this.carbValue_LOC.textContent())?.trim() || "";
        console.log(`CARB Value retrieved: ${carbValue}`);
        return carbValue;
    }

    /**
* @author Aniket Nale
* @created 10-Dec-25
* @description Gets the Intra State Only value from the carrier details.
* @param intraStateOnly - The Intra State Only value to verify.
*/

    async getInstraStateOnlyValue() {
        await commonReusables.waitForPageStable(this.page);
        const intraStateOnlyValue = (await this.intraStateonlyValue_LOC.textContent())?.trim() || "";
        console.log(`Intra State Only Value retrieved: ${intraStateOnlyValue}`);
        return intraStateOnlyValue;
    }

    /**
* @author Aniket Nale
* @created 11-Dec-25
* @description Gets the 8a value from the carrier details.
* @param eightA - The 8a value to verify.
*/
    async getEightAValue() {
        await commonReusables.waitForPageStable(this.page);
        const eightAValue = (await this.eightAValue_LOC.textContent())?.trim() || "";
        console.log(`8a Value retrieved: ${eightAValue}`);
        return eightAValue;
    }

    /**
* @author Aniket Nale
* @created 11-Dec-25
* @description Gets the Q Star value from the carrier details.
* @param qStar - The Q Star value to verify.
*/
    async getQStarValue() {
        await commonReusables.waitForPageStable(this.page);
        const qStarValue = (await this.qStarValue_LOC.textContent())?.trim() || "";
        console.log(`Q Star Value retrieved: ${qStarValue}`);
        return qStarValue;
    }


    /**
* @author Aniket Nale
* @created 12-Dec-25
* @description Gets the TSA Certified value from the carrier details.
* @param tCertified - The TSA Certified value to verify.
*/
    async getTCertifiedValue() {
        await commonReusables.waitForPageStable(this.page);
        const tCertifiedValue = (await this.tCertifiedValue_LOC.textContent())?.trim() || "";
        console.log(`TSA Certified Value retrieved: ${tCertifiedValue}`);
        return tCertifiedValue;
    }

    /**
* @author Aniket Nale
* @created 12-Dec-25
* @description Gets the UIIA Participation value from the carrier details.
* @param uiiaParticipation - The UIIA Participation value to verify.
*/
    async getUIIAParticipationValue() {
        await commonReusables.waitForPageStable(this.page);
        const uiiaParticipationValue = (await this.uiiaParticipationValue_LOC.textContent())?.trim() || "";
        console.log(`UIIA Participation Value retrieved: ${uiiaParticipationValue}`);
        return uiiaParticipationValue;
    }


    /**
* @author Aniket Nale
* @created 12-Dec-25
* @description Gets the SmartWay value from the carrier details.
* @param smartWay - The SmartWay value to verify.
*/
    async getSmartWayValue() {
        await commonReusables.waitForPageStable(this.page);
        const smartWayValue = (await this.smartWayValue_LOC.textContent())?.trim() || "";
        console.log(`SmartWay Value retrieved: ${smartWayValue}`);
        return smartWayValue;
    }
    /**
     * @author Rohit Singh
     * @created 12-Dec-2025
     * @description Gets the Inventory Process Group value from the carrier details.
     * @returns The Inventory Process Group value as a string.
     */
    async getInvProcessGroupValue() {
        await commonReusables.waitForPageStable(this.page);
        const invProcessGroupValue = (await this.invProcessGroupValue_LOC.textContent())?.trim() || "";
        console.log(`Inventory Process Group Value retrieved: ${invProcessGroupValue}`);
        return invProcessGroupValue;
    }

    /**
 * @author Aniket Nale
 * @created 15-Dec-25
 * @description Gets the Vendor Type value from the carrier details.
 * @returns The Vendor Type value as a string.
 */
    async getVendorTypeValue() {
        await commonReusables.waitForPageStable(this.page);
        const vendorTypeValue = (await this.vendorTypeValue_LOC.textContent())?.trim() || "";
        console.log(`Vendor Type Value retrieved: ${vendorTypeValue}`);
        return vendorTypeValue;
    }

    /**
* @author Aniket Nale
* @created 15-Dec-25
* @description Gets the Carrier Mode value from the carrier details.
* @returns The Carrier Mode value as a string.
*/
    async getCarrierModeValue() {
        await commonReusables.waitForPageStable(this.page);
        const carrierModeValue = (await this.carrierModeValue_LOC.textContent())?.trim() || "";
        console.log(`Carrier Mode Value retrieved: ${carrierModeValue}`);
        return carrierModeValue;
    }

    /**
* @author Aniket Nale
* @created 16-Dec-25
* @description Gets the No BCA value from the carrier details.
* @returns The No BCA value as a string.
*/
    async getNoBCA(): Promise<(typeof TOGGLE_OPTIONS)[keyof typeof TOGGLE_OPTIONS]> {
        await commonReusables.waitForPageStable(this.page);

        const isPresent = await this.bcaSignedSubmittedCell.isVisible().catch(() => false);
        const value = isPresent ? TOGGLE_OPTIONS.NO : TOGGLE_OPTIONS.YES;
        console.log(`No BCA status resolved as: ${value}`);
        return value;
    }

    /**
* @author Aniket Nale
* @created 16-Dec-25
* @description Gets the Broker Authority status from the carrier details.
*/
    async verifyBrokerAuthorityStatus() {
        await commonReusables.waitForPageStable(this.page);

        await this.brokerAuthorityCell.waitFor({ state: 'visible', timeout: WAIT.LARGE });
        await this.brokerAuthorityCell.waitFor({ state: 'attached', timeout: WAIT.LARGE });
        await expect.soft(this.brokerAuthorityCell).toBeVisible();
    }

    /**
     * Gets the Loadboard Status text from the carrier details page.
     * @author AI Agent
     * @created 17-Mar-2026
     */
    async getLoadboardStatus(): Promise<string> {
        if (await this.loadboardStatus_LOC.isVisible({ timeout: WAIT.MID }).catch(() => false)) {
            const text = (await this.loadboardStatus_LOC.textContent())?.trim() || '';
            console.log(`Loadboard/Mode IQ Status: "${text}"`);
            return text;
        }
        console.log('Loadboard/Mode IQ Status element not found — tab may need to be clicked first');
        return '';
    }

    /**
     * Clicks the Mode IQ tab (formerly LoadBoard / Mode ID) on the carrier page.
     * Matches all known tab name variants: "Mode IQ", "Mode ID", "LoadBoard".
     * @author AI Agent
     * @created 17-Mar-2026
     */
    async clickLoadboardTab(): Promise<boolean> {
        if (await this.modeIQTab_LOC.first().isVisible({ timeout: WAIT.SMALL }).catch(() => false)) {
            const tabLi = this.modeIQTab_LOC.first().locator('xpath=ancestor::li[starts-with(@id,"carrform_tab_")]');
            const tabId = await tabLi.getAttribute('id') || '';
            const tabIndex = tabId.replace('carrform_tab_', '');
            await this.page.evaluate((idx) => (window as any).showMainTab(Number(idx)), tabIndex);
            console.log(`Clicked Mode IQ tab (index: ${tabIndex})`);
            return true;
        }
        console.log('Mode IQ tab not found — verify tab name manually');
        return false;
    }

    /**
     * Checks if a carrier visibility label is visible on the page.
     * @author AI Agent
     * @created 17-Mar-2026
     * @param name - The carrier visibility label name to check.
     */
    async isCarrierVisibilityLabelVisible(name: string): Promise<boolean> {
        const label = this.page.locator(`//*[contains(text(),'${name}')]`).first();
        return label.isVisible({ timeout: WAIT.DEFAULT }).catch(() => false);
    }

    /**
     * Gets the toggle states for the given carrier visibility labels by inspecting the DOM.
     * @author AI Agent
     * @created 17-Mar-2026
     * @param carriers - Array of carrier visibility label names to check.
     * @returns Record mapping each carrier name to its enabled state and debug info.
     */
    async getCarrierVisibilityToggleStates(carriers: string[]): Promise<Record<string, { enabled: boolean; debug: string }>> {
        return this.page.evaluate((carrierNames: string[]) => {
            const results: Record<string, { enabled: boolean; debug: string }> = {};
            for (const name of carrierNames) {
                results[name] = { enabled: false, debug: "label not found" };
                const labels = document.querySelectorAll("label");
                for (const label of labels) {
                    if (label.textContent?.trim() === name) {
                        const container = label.closest(".slider-select") || label.parentElement;
                        if (!container) { results[name].debug = "no container"; break; }
                        const sel = container.querySelector(".slider-selection");
                        if (sel) {
                            const rect = sel.getBoundingClientRect();
                            const style = window.getComputedStyle(sel);
                            if (rect.width > 2 && style.display !== "none" && style.visibility !== "hidden") {
                                results[name] = { enabled: true, debug: `slider-selection width=${rect.width.toFixed(0)}` };
                                break;
                            }
                            results[name].debug = `slider-selection width=${rect.width.toFixed(0)}, display=${style.display}`;
                        }
                        const cb = container.querySelector("input[type='checkbox']") as HTMLInputElement | null;
                        if (cb?.checked) { results[name] = { enabled: true, debug: "checkbox checked" }; break; }
                        const allEls = container.querySelectorAll("*");
                        for (const el of allEls) {
                            const cls = typeof el.className === "string" ? el.className : "";
                            if (cls.includes("slider-on") || cls.includes("-on") || cls.includes("active")) {
                                results[name] = { enabled: true, debug: `class="${cls}"` }; break;
                            }
                        }
                        if (!results[name].enabled) results[name].debug += " | no enabled indicator";
                        break;
                    }
                }
            }
            return results;
        }, carriers);
    }

    /**
     * Enables carrier visibility toggles for the given carrier names.
     * @author AI Agent
     * @created 17-Mar-2026
     * @param disabledCarriers - Array of carrier names whose toggles need enabling.
     */
    async enableCarrierVisibilityToggles(disabledCarriers: string[]): Promise<void> {
        for (const name of disabledCarriers) {
            const slider = this.page.locator(
                `//div[contains(@class,'slider-select')]//label[text()='${name}']/following-sibling::div//div[contains(@class,'slider-selection')]`
            ).first();
            if (await slider.isVisible({ timeout: WAIT.DEFAULT }).catch(() => false)) {
                await slider.click({ position: { x: 5, y: 5 } });
                console.log(`Enabled toggle for "${name}"`);
            } else {
                const labelEl = this.page.locator(`//label[text()='${name}']`).first();
                const parentDiv = labelEl.locator("xpath=following-sibling::div").first();
                if (await parentDiv.isVisible({ timeout: WAIT.DEFAULT }).catch(() => false)) {
                    await parentDiv.click();
                    console.log(`Enabled toggle for "${name}" (via sibling div)`);
                }
            }
        }
    }

    /**
     * Clicks the Save button on the carrier edit page.
     * @author AI Agent
     * @created 17-Mar-2026
     */
    async clickSaveOnCarrierEditPage(): Promise<void> {
        await this.carrierEditSaveBtn_LOC.waitFor({ state: "visible", timeout: WAIT.SMALL });
        await this.carrierEditSaveBtn_LOC.click();
        console.log('Clicked Save on carrier edit page');
    }

    /**
     * High-level method that checks carrier visibility toggles and enables any that are disabled.
     * Encapsulates all conditional/loop logic so specs remain clean.
     * @author AI Agent
     * @created 26-Mar-2026
     * @param requiredVisibility - Array of carrier visibility label names to ensure are enabled.
     * @param basePage - BasePage instance for clicking Edit and waiting for load states.
     */
    async ensureCarrierVisibilityTogglesEnabled(
        requiredVisibility: string[],
        basePage: { clickButtonByText: (text: string) => Promise<void>; waitForMultipleLoadStates: (states: string[]) => Promise<void> }
    ): Promise<void> {
        const tabClicked = await this.clickLoadboardTab();
        if (!tabClicked) {
            console.log('Mode IQ tab not found — carrier visibility check skipped');
            return;
        }
        await basePage.waitForMultipleLoadStates(['load', 'networkidle']);

        let togglesFound = false;
        for (const name of requiredVisibility) {
            if (await this.isCarrierVisibilityLabelVisible(name)) {
                togglesFound = true;
                break;
            }
        }

        if (!togglesFound) {
            console.log('Carrier visibility labels not found — toggle check skipped');
            return;
        }

        const toggleStates = await this.getCarrierVisibilityToggleStates(requiredVisibility);
        const disabledToggles: string[] = [];
        for (const name of requiredVisibility) {
            const state = toggleStates[name];
            if (!state?.enabled) {
                disabledToggles.push(name);
            }
        }

        if (disabledToggles.length > 0) {
            console.log(`${disabledToggles.length} toggle(s) need updating`);
            await basePage.clickButtonByText('Edit');
            await basePage.waitForMultipleLoadStates(['load', 'networkidle']);
            await this.enableCarrierVisibilityToggles(disabledToggles);
            await this.clickSaveOnCarrierEditPage();
            await basePage.waitForMultipleLoadStates(['load', 'networkidle']);
        } else {
            console.log('All carrier visibility toggles already enabled');
        }
    }
}
