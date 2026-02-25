import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
/**
 * Page Object Model for the Emailed Documents section on the View Load Page -> carrier Tab
 * @author Rohit Singh
 * @created 2025-12-30
 */
export default class EmailedDocumentsForLoadPage {
    private readonly documentTypeDropdown_LOC: Locator;
    private readonly recipientDropdown_LOC: Locator;
    private readonly subjectInput_LOC: Locator;
    private readonly messageTextarea_LOC: Locator;
    private readonly sendEmailButton_LOC: Locator;
    private readonly backToLoadButton_LOC: Locator;
    private readonly removeEmailButton_LOC: Locator;
    private readonly emailInput_LOC: Locator;
    private readonly emailSuccessMessage_LOC: Locator;
    private readonly awaitingAcceptanceValue_LOC: Locator;

    constructor(private page: Page) {
        this.documentTypeDropdown_LOC = page.locator("select#load_document_email_document_type");
        this.recipientDropdown_LOC = page.locator("select#load_document_email_recipient");
        this.subjectInput_LOC = page.locator("input#load_document_email_email_subject");
        this.messageTextarea_LOC = page.locator("textarea#load_document_email_email_body");
        this.sendEmailButton_LOC = page.locator("input#submit_button");
        this.backToLoadButton_LOC = page.locator("//a[text()='Back to Load']");
        this.removeEmailButton_LOC = page.locator("//a[@title='Remove']");
        this.emailInput_LOC = page.locator("//div[@class='multiple_emails-container']//input[@id='load_document_email_recipient_email']");
        this.emailSuccessMessage_LOC = page.locator("//p[text()='Email was successfully created and queued.']");
        this.awaitingAcceptanceValue_LOC = page.locator("//td[text()='Awaiting Acceptance']");
    }
    /**
     * Updates the email subject with the provided text
     * @author Rohit Singh
     * @created 2025-12-30
     * @param subject 
     */
    async updateEmailSubject(subject: string) {
        await this.subjectInput_LOC.waitFor({ state: "visible" });
        const existingText = await this.subjectInput_LOC.inputValue();
        await this.subjectInput_LOC.fill(subject + " " + existingText);
    }
    /**
     * Updates the email message with the provided text
     * @author Rohit Singh
     * @created 2025-12-30
     * @param message 
     */
    async updateEmailMessage(message: string) {
        await this.messageTextarea_LOC.waitFor({ state: "visible" });
        const existingText = await this.messageTextarea_LOC.inputValue();
        await this.messageTextarea_LOC.fill(message + "\n" + existingText);
    }
    /**
     * Clicks the Send Email button to send the email
     * @author Rohit Singh
     * @created 2025-12-30
     */
    async clickSendEmailButton() {
        await this.sendEmailButton_LOC.waitFor({ state: "visible" });
        await this.sendEmailButton_LOC.click();
    }
    /**
     * Clicks the Remove Email button to remove existing email entries
     * @author Rohit Singh
     * @created 2025-12-30
     */
    async clickRemoveEmailButton() {
        await commonReusables.waitForPageStable(this.page);
        while ((await this.removeEmailButton_LOC.count()) > 0) {
            const removeButton = this.removeEmailButton_LOC.first();
            await removeButton.waitFor({ state: "visible" });
            await removeButton.click();
            await this.page.waitForLoadState("networkidle");
        }
        await this.subjectInput_LOC.click(); // Move focus away to update UI
    }
    /**
     * Selects the document type from the dropdown
     * @author Rohit Singh
     * @created 2025-12-30
     * @param documentType
     */
    async selectDocumentType(documentType: string) {
        await this.documentTypeDropdown_LOC.waitFor({ state: "visible" });
        await this.documentTypeDropdown_LOC.selectOption({ label: documentType });
    }
    /**
     * Selects the recipient from the dropdown
     * @author Rohit Singh
     * @created 2025-12-30
     */
    async selectRecipient(recipient: string) {
        await this.recipientDropdown_LOC.waitFor({ state: "visible" });
        await this.recipientDropdown_LOC.selectOption({ label: recipient });
    }
    /**
     * Clicks the Back to Load button to navigate back to the Load page
     * @author Rohit Singh
     * @created 2025-12-30
     */
    async clickBackToLoadButton() {
        await this.backToLoadButton_LOC.waitFor({ state: "visible" });
        await this.backToLoadButton_LOC.click();
    }
    /**
     * Enters an email address into the recipient email input field
     * @author Rohit Singh
     * @created 2025-12-30
     * @param email 
     */
    async enterEmailAddress(email: string) {
        await this.emailInput_LOC.waitFor({ state: "visible" });
        await this.emailInput_LOC.fill(email).then(async () => {
            await this.page.keyboard.press('Enter');
        });
    }
    /**
     * Gets the current email subject text
     * @author Rohit Singh
     * @created 2025-12-30
     * @returns The email subject string
     */
    async getEmailSubject(): Promise<string> {
        await this.subjectInput_LOC.waitFor({ state: "visible" });
        return await this.subjectInput_LOC.inputValue();
    }
    /**
     * Gets the current email message text
     * @author Rohit Singh
     * @created 2025-12-30
     * @returns The email message string
     */
    async getEmailMessage(): Promise<string> {
        await this.messageTextarea_LOC.waitFor({ state: "visible" });
        return await this.messageTextarea_LOC.inputValue();
    }
    /**
     * Checks if the email was sent successfully by verifying the success message
     * @author Rohit Singh
     * @created 2025-12-30
     * @returns True if email sent successfully, false otherwise
     */
    async isEmailSentSuccessfully(): Promise<boolean> {
        try {
            await this.emailSuccessMessage_LOC.waitFor({ state: "visible", timeout: WAIT.SMALL });
            return true;
        } catch {
            return false;
        }
    }
}