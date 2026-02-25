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
}
