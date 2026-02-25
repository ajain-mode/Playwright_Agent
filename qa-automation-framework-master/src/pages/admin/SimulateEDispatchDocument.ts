import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import path from "path";

export default class SimulateEDispatchDocumentUploadPage {

    /**
     * SimulateEDispatchDocumentUploadPage - Page Object Model for Simulate E-Dispatch document Page
     * @description This class handles validation of Simulate E-Dispatch document upload in the application.
     * @author Aniket Nale
     */

    private readonly simulatedSourceDropdown_LOC: Locator
    private readonly btmsLoadIdInput_LOC: Locator;
    private readonly docTypeDropdown_LOC: Locator;
    private readonly documentExtensionValue_LOC: Locator;
    private readonly uploadDocFileButton_LOC: Locator;
    private readonly submitButton_LOC: Locator;
    private readonly successMessage_LOC: Locator;

    constructor(private page: Page) {
        this.simulatedSourceDropdown_LOC = page.locator("//select[@name='token']");
        this.btmsLoadIdInput_LOC = page.locator("//input[@name='load_id']");
        this.docTypeDropdown_LOC = page.locator("//select[@name='type']");
        this.documentExtensionValue_LOC = page.locator("//input[@name='extension']");
        this.uploadDocFileButton_LOC = page.locator("#base64_input");
        this.submitButton_LOC = page.locator("//input[@value='Submit!']");
        this.successMessage_LOC = page.locator("//div[@id='response_cell' and contains(@class, 'success')]");
    }

    /**
* @author Aniket Nale
* @description This method handles selecting source from dropdown
* @modified 2025-11-14
*/
    async selectSourceFromDropdown(source: string) {
        await commonReusables.waitForPageStable(this.page);
        await this.simulatedSourceDropdown_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await this.simulatedSourceDropdown_LOC.selectOption({ label: source });
        await commonReusables.waitForPageStable(this.page);
    }

    /**
* @author Aniket Nale
* @description This method handles entering BTMS Load ID
* @modified 2025-11-14
*/
    async enterBTMSLoadID(loadID: string) {
        await this.btmsLoadIdInput_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
        await this.btmsLoadIdInput_LOC.fill(loadID);
        await commonReusables.waitForPageStable(this.page);
    }

    /**
* @author Aniket Nale
* @description Select Document Type from dropdown
* @modified 2025-11-14
*/
    async selectDocTypeDropdown(docType: string) {
        await this.docTypeDropdown_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
        await this.docTypeDropdown_LOC.selectOption({ label: docType });
        await commonReusables.waitForPageStable(this.page);
    }

    /**
* @author Aniket Nale
* @description set Document Extension value
* @modified 2025-11-14
*/

    async setDocumentExtension(value: string) {
        const currentValue = await this.documentExtensionValue_LOC.inputValue();
        if (currentValue !== value) {
            await this.documentExtensionValue_LOC.fill(value);
        }
    }

    /**
* @author Aniket Nale
* @description Click on Upload Document button and upload file
* @modified 2025-11-14
*/
    async clickOnUploadDocumentButton() {
        await this.uploadDocFileButton_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
        const filePath = path.resolve(__dirname, '../../data/sampleUploads/sample.pdf');
        console.log("Resolved file path:", filePath);
        await this.uploadDocFileButton_LOC.setInputFiles(filePath);
        await commonReusables.waitForPageStable(this.page);
    }

    /**
* @author Aniket Nale
* @description Click on Submit button
* @modified 2025-11-14
*/
    async clickOnSubmitButton() {
        await this.submitButton_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
        await this.submitButton_LOC.click();
        await commonReusables.waitForPageStable(this.page);
        await this.successMessage_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
        await expect.soft(this.successMessage_LOC).toBeVisible({ timeout: WAIT.LARGE });
    }
}