import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import * as fs from 'fs';
import * as path from 'path';

export default class ViewLoadPage {
  private readonly viewLoadPageHeader_LOC: Locator;
  private readonly loadTab_LOC: Locator;
  private readonly customerTab_LOC: Locator;
  private readonly carrierTab_LOC: Locator;
  private readonly pickTab_LOC: Locator;
  private readonly dropTab_LOC: Locator;
  private readonly ediTab_LOC: Locator;
  private readonly shipValue_LOC: Locator;
  private readonly senderAsIDValue_LOC: Locator;
  private readonly senderID204Value_LOC: Locator;
  private readonly editButton_LOC: Locator;
  private readonly carrier2Tab_LOC: Locator;
  private readonly carrier3Tab_LOC: Locator;
  private readonly loadStatusDropdown_LOC: Locator;
  private readonly drop3Tab_LOC: Locator;
  private readonly commissionsTab_LOC: Locator;
  private readonly viewBillingButton_LOC: Locator;
  private readonly viewLoadPageHeaderValue_LOC: Locator;
  private readonly autoRateSuccessValue_LOC: Locator;
  private readonly autoDispatchSuccessValue_LOC: Locator;
  private readonly eAcknowledgeDateValue_LOC: Locator;
  private readonly acknowledgeAcceptedValue_LOC: Locator;
  private readonly viewBidDetailsButton_LOC: Locator;
  private readonly createBidButton_LOC: Locator;
  private readonly searchCarriersButton_LOC: Locator;
  private readonly searchCarriersInput_LOC: Locator;
  private readonly bidAmountInput_LOC: Locator;
  private readonly addBidButton_LOC: Locator;
  private readonly bidSuccessMessage_LOC: Locator;
  private readonly closeBidDetailsButton_LOC: Locator;
  private readonly closeRerateMessageButton_LOC: Locator;
  private readonly flagValue_LOC: Locator;
  private readonly reRateMessage_LOC: Locator;
  private readonly customerTotalValue_LOC: Locator;
  private readonly loadMethodDropdown_LOC: Locator;
  private readonly includeCarriersViewDetailsLink_LOC: Locator;
  private readonly trackingTab_LOC: Locator;
  private readonly trackingEventTable_LOC: Locator;
  private readonly internalShareTable_LOC: Locator;
  private readonly portalName_LOC: (label: string) => Locator;
  private readonly banyanSpan_LOC: Locator;
  private readonly quoteReqNumberLink_LOC: Locator;
  private readonly autoRerateSuccessValue_LOC: Locator;
  private readonly carrierTotalValue_LOC: Locator;
  private readonly viewLoadPage_LOC: Locator;
  private readonly sourceSystemIDValue_LOC: Locator;
  private readonly viewHistory_LOC: Locator;
  private readonly historyHeader_LOC: string;
  private readonly historyHeader: (page?: Page) => Locator;
  private readonly fieldValue_LOC: (text: string) => string;
  private readonly fieldValue: (page: Page, text: string) => Locator;
  private readonly oldValue_LOC: (text: string) => string;
  private readonly oldValue: (page: Page, text: string) => Locator;
  private readonly newValue_LOC: (text: string) => string;
  private readonly newValue: (page: Page, text: string) => Locator;
  private readonly customerTotalAmount_LOC: Locator;
  private readonly carrierTotalAmount_LOC: Locator;
  private readonly notesValue_LOC: Locator;
  private readonly drop1Tab_LOC: Locator;
  private readonly autoLoadTenderCheckbox_LOC: Locator;
  private readonly uploadDocumentIcon_LOC: Locator;
  private readonly selectDocumentType_LOC: Locator;
  private readonly dragDrop_LOC: Locator;
  private readonly uploadTypeFile_LOC: Locator;
  private readonly submitButton_LOC: Locator;
  private readonly successMessage_LOC: Locator;
  private readonly closeDocumentUploadDialog_LOC: Locator;
  private readonly payablesButton_LOC: Locator;
  private readonly carrierInvoiceNumber_LOC: Locator;
  private readonly carrierInvoiceAmount_LOC: Locator;

  constructor(private page: Page) {
    this.viewLoadPageHeader_LOC = this.page.locator("//td[contains(text(),'View Load #')]");
    this.customerTab_LOC = this.page.locator("//a[contains(@href,'Customer')]");
    this.carrierTab_LOC = this.page.locator("#tab_carr_1_hyperlink");
    this.pickTab_LOC = this.page.locator("//a[contains(@href,'Pick_1_1')]");
    this.dropTab_LOC = this.page.locator("//a[text()='Drop']");
    this.ediTab_LOC = this.page.locator("//a[text()='EDI']");
    this.shipValue_LOC = this.page.locator(
      "//td[text()='SHIP#']/following-sibling::td[1]"
    );
    this.senderAsIDValue_LOC = this.page.locator(
      "//td[text()='Send as ID']/following-sibling::td[1]"
    );
    this.senderID204Value_LOC = this.page.locator(
      "//td[text()='204 Sender ID']/following-sibling::td[1]"
    );
    this.editButton_LOC = this.page.locator(
      "//td[contains(text(),'View Load')]/following-sibling::td//input[contains(@value,'Edit')]"
    );
    this.carrier2Tab_LOC = this.page.locator("#tab_carr_2_hyperlink");
    this.carrier3Tab_LOC = this.page.locator("#tab_carr_3_hyperlink");
    this.loadTab_LOC = this.page.getByText("Load", { exact: true });
    this.commissionsTab_LOC = this.page.locator("//*[text()='Commissions']");
    this.loadStatusDropdown_LOC = this.page.locator("#loadsh_status");
    this.drop3Tab_LOC = this.page.locator("//a[contains(@href,'Drop_3_2')]");
    this.viewBillingButton_LOC = this.page.locator(
      "//td[contains(text(),'View Load')]/following-sibling::td//input[contains(@value,'View Billing')]"
    );
    this.viewLoadPageHeaderValue_LOC = this.page.locator(
      "div[class='col-md-3 centered-flex'] h2"
    );
    this.autoRateSuccessValue_LOC = this.page.locator(
      "//span[text()='Auto-Rate Success']"
    );
    this.autoDispatchSuccessValue_LOC = this.page.locator(
      "//span[text()='Auto-Dispatch Success']"
    );

    this.acknowledgeAcceptedValue_LOC = page.locator(
      "//td[@class='viewww' and normalize-space(text())='Accepted']"
    );
    this.eAcknowledgeDateValue_LOC = page.locator(
      "//td[@class='viewww' and contains(., 'Accepted') and contains(., ':')]"
    );
    //------------
    this.viewBidDetailsButton_LOC = page.locator(
      "//input[@id='btn-tnx-bids-open-modal']"
    );
    this.createBidButton_LOC = page.locator("//button[text()='Create Bid']");
    this.searchCarriersButton_LOC = page.locator(
      "//span[text()='Search Carriers']"
    );
    this.searchCarriersInput_LOC = page.locator(
      "//span[@class='select2-search select2-search--dropdown']//input"
    );
    this.bidAmountInput_LOC = page.locator("//input[@id='bid_amount']");
    this.addBidButton_LOC = page.locator("//button[@id='submit-add-bid']");
    this.bidSuccessMessage_LOC = page.locator(
      "//div[text()='Bid added/updated successfully']"
    );
    this.closeBidDetailsButton_LOC = page.locator(
      "//button[text()='Create Bid']//parent::div//parent::div//parent::div//following-sibling::div[@class='modal-footer ignore-responsive-css']//button[text()='Close']"
    );
    this.closeRerateMessageButton_LOC = page.locator("input[value='Close']");
    this.flagValue_LOC = page.locator("//span[normalize-space()='FLAG']");
    this.includeCarriersViewDetailsLink_LOC = page.locator("//a[@id='carriers_whitelist_view_details']");
    this.reRateMessage_LOC = page.locator("//center[contains(text(),'ReRate Occurred!')]");
    this.loadMethodDropdown_LOC = page.locator("input#loadsh_load_method");
    this.trackingTab_LOC = page.locator("//a[normalize-space()='Tracking']");
    this.trackingEventTable_LOC = page.locator("//*[@id='event_map_detail_updates_body'] /tr");
    this.internalShareTable_LOC = this.page.locator("//table[@id='commissioninternal_']//td");
    this.portalName_LOC = (text: string) =>
      this.page.locator(`//div[normalize-space()='${text}']`);
    this.banyanSpan_LOC = this.page.locator("//span[@title='banyan']");
    this.quoteReqNumberLink_LOC = page.locator("//a[contains(text(),'Quote Request #')]");
    this.autoRerateSuccessValue_LOC = page.locator("//span[text()='Auto-Rerate Success']");
    this.carrierTotalValue_LOC = page.locator("(//table[@id='financial-details']/tbody)[2]//td[@class='customer_name']/following-sibling::td[1]");
    this.customerTotalValue_LOC = page.locator("(//table[@id='financial-details']/tbody)[1]//td[@class='customer_name']/following-sibling::td[1]");
    this.viewLoadPage_LOC = page.locator("//td[@class='hedbar0 centered-flex']");
    this.sourceSystemIDValue_LOC = page.locator("//td[@class='fn' and normalize-space(.)='Source System ID']/following-sibling::td[1]");
    this.viewHistory_LOC = this.page.locator("//input[@value='View History']");
    this.historyHeader_LOC = "//font[contains(normalize-space(.), 'History of Edits for Load')]";
    this.historyHeader = (page: Page = this.page) => page.locator(this.historyHeader_LOC);
    this.fieldValue_LOC = (text: string) => `//tr[td[contains(., '${text}')]]/td[3]`;
    this.fieldValue = (page: Page, text: string) => page.locator(this.fieldValue_LOC(text));
    this.oldValue_LOC = (text: string) => `//tr[td[contains(., '${text}')]]/td[4]`;
    this.oldValue = (page: Page, text: string) => page.locator(this.oldValue_LOC(text));
    this.newValue_LOC = (text: string) => `//tr[td[contains(., '${text}')]]/td[5]`;
    this.newValue = (page: Page, text: string) => page.locator(this.newValue_LOC(text));
    this.customerTotalAmount_LOC = this.page.locator("//thead[tr/th[normalize-space()='Customer']] /following-sibling::tbody[1] //tr/td[last()]");
    this.carrierTotalAmount_LOC = this.page.locator("//thead[tr/th[normalize-space()='Carrier']] /following-sibling::tbody[1] //tr/td[last()]");
    this.notesValue_LOC = page.locator("//tr[@class='notes-items']//div[@class='nbody']");
    this.drop1Tab_LOC = this.page.locator("//a[text()='D']");
    this.uploadDocumentIcon_LOC = this.page.locator("//img[@title='Upload document']");
    this.selectDocumentType_LOC = this.page.locator("//select[@name='document_type']");
    this.dragDrop_LOC = this.page.locator("//div[@class='dz-message']");
    this.uploadTypeFile_LOC = this.page.locator("//input[@type='file']");
    this.submitButton_LOC = this.page.locator("//input[@type='submit']");
    this.successMessage_LOC = this.page.locator("//div[@id='message_display']");
    this.closeDocumentUploadDialog_LOC = this.page.locator("//div[@role='dialog' and .//span[text()='Document Upload Utility']]//button[contains(@class,'ui-dialog-titlebar-close')]");
    this.payablesButton_LOC = this.page.locator("//input[@id='cat_payables']");
    this.carrierInvoiceNumber_LOC = this.page.locator("//input[@id='carr_invoice_num_input']");
    this.carrierInvoiceAmount_LOC = this.page.locator("//input[@id='carr_invoice_amount']");
    this.autoLoadTenderCheckbox_LOC = this.page.locator("//input[@id='loadsh_auto_edi204']");
  }

  private getCarrierNameLocator(carrierName: string): Locator {
    return this.page.locator(`//li[contains(text(),'${carrierName}')]`);
  }


  /**
 * Helper method to get locators for document link and row based on document type.
 * @description Gets locators for BOL or POD documents.
 * @param type - The type of document ("BOL" or "POD").
 * @author Aniket Nale
 * @created 20-Nov-2025
 */

  private getDocumentLocators(type: "BOL" | "POD") {
    if (type === "BOL") {
      return {
        link: this.page.locator("//a[text()='Bill of Lading'] | //a[@title='bol.pdf']"),
        row: this.page.locator("//tr[td/a[text()='Bill of Lading']]"),
      };
    }

    return {
      link: this.page.locator("//a[text()='Proof of Delivery'] | //a[@title='pod.pdf']"),
      row: this.page.locator("//tr[td/a[text()='Proof of Delivery']]"),
    };
  }


  /**
   * Clicks on the Load tab
   * @author Rohit Singh
   * @modified 2025-07-23
   */
  async clickCustomerTab() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.customerTab_LOC.click();
  }
  /**
   * Clicks on the Carrier tab
   * @author Rohit Singh
   * @modified 2025-07-23
   */
  async clickCarrierTab() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.carrierTab_LOC.click();
  }
  /**
   * Clicks on the Pick tab
   * @author Rohit Singh
   * @modified 2025-07-23
   */
  async clickPickTab() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.pickTab_LOC.click();
  }
  /**
   * Clicks on the Drop tab
   * @author Rohit Singh
   * @modified 2025-07-23
   */
  async clickDropTab() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.dropTab_LOC.click();
  }
  /**
   * Clicks on the EDI tab
   * @author Rohit Singh
   * @modified 2025-08-08
   */
  async clickEDITab() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.ediTab_LOC.click();
    await this.page.waitForLoadState("domcontentloaded");
  }
  /**
   * Gets the ship number from the Load page
   * @author Rohit Singh
   * @modified 2025-07-23
   * @returns {Promise<string | null>} The ship number or null if not found
   */
  async getShipNumber(): Promise<string | null> {
    try {
      const ship = await this.shipValue_LOC.textContent();
      const trimmedText = ship?.trim() ?? null;
      console.log(`Ship Number: ${trimmedText}`);
      return trimmedText;
    } catch (error) {
      console.error(`Error Getting Ship Number: ${error}`);
      throw error;
    }
  }
  /**
   * Gets the Send As ID from the Load page
   * @author Rohit Singh
   * @modified 2025-07-23
   * @returns {Promise<string | null>} The Send As ID or null if not found
   */
  async getSendAsID(): Promise<string | null> {
    try {
      const sendAsID = await this.senderAsIDValue_LOC.textContent();
      const trimmedText = sendAsID?.trim() ?? null;
      console.log(`Send As ID: ${trimmedText}`);
      return trimmedText;
    } catch (error) {
      console.error(`Error Getting Send As ID: ${error}`);
      throw error;
    }
  }
  /**
   * Gets the Sender ID 204 from the Load page
   * @author Rohit Singh
   * @modified 2025-07-23
   * @returns {Promise<string | null>} The Sender ID 204 or null if not found
   */
  async getSender204ID(): Promise<string | null> {
    try {
      const senderID204 = await this.senderID204Value_LOC.textContent();
      const trimmedText = senderID204?.trim() ?? null;
      console.log(`Sender ID 204: ${trimmedText}`);
      return trimmedText;
    } catch (error) {
      console.error(`Error Getting Sender ID 204: ${error}`);
      throw error;
    }
  }
  /**
   * Clicks the Edit button to edit the load details
   * @author Rohit Singh
   * @modified 2025-07-23
   */
  async clickEditButton() {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForLoadState("domcontentloaded");
    await this.editButton_LOC.click();
    await this.page.waitForTimeout(WAIT.DEFAULT / 2);
  }
  /**
   * Clicks on the Carrier 2 tab
   * @author Rohit Singh
   * @modified 2025-07-28
   */
  async clickCarrier2Tab() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.carrier2Tab_LOC.click();
  }
  /**
   * Clicks on the Carrier 3 tab
   * @author Rohit Singh
   * @modified 2025-07-28
   */
  async clickCarrier3Tab() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.carrier3Tab_LOC.click();
  }
  /**
   * Gets the Load ID from the View Load Page header
   * @author Rohit Singh
   * @modified 2025-07-28
   * @returns {Promise<string>} The Load ID as a string
   */
  async getLoadID(): Promise<string> {
    await this.viewLoadPageHeader_LOC.highlight(); // Highlight for debugging
    const headerText = await this.viewLoadPageHeader_LOC.textContent();
    const loadID = await headerText?.match(/\d+/)?.[0];
    await console.log(`Load ID: ${loadID}`);
    return loadID || "";
  }
  async clickloadTab() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.loadTab_LOC.click();
  }

  async clickCommissionsTab(shouldReload = true): Promise<void> {
    if (shouldReload) {
      await this.page.reload();
      await this.page.waitForLoadState("load");
    }
    await this.commissionsTab_LOC.waitFor({ state: "visible" });
    await this.commissionsTab_LOC.click({ force: true });
  }

  async getTotalCommissionValue(): Promise<number> {
    const iframe = this.page.frameLocator("#iframe_commissions");
    const footerCell = iframe.locator(
      "//table[@id='example']//tfoot/tr/td[10]"
    );
    await footerCell.waitFor({
      state: "visible",
      timeout: WAIT.DEFAULT * 3,
    });
    const text = (await footerCell.textContent())?.trim();
    if (!text) throw new Error("COMM footer is empty");
    const value = parseFloat(text.replace(/[$,]/g, ""));
    if (isNaN(value)) throw new Error(`Invalid COMM value: "${text}"`);
    console.log(`Total Commission Value: ${value}`);
    return value;
  }
  /**
   * Validates the load status
   * @author Deepak Bohra
   * @modified 2025-09-02
   */

  async validateLoadStatus(loadStatus: string) {
    await this.page.waitForTimeout(WAIT.SMALL);
    await this.page.waitForLoadState("domcontentloaded");
    const actualLoadStatus = await this.loadStatusDropdown_LOC.textContent();
    console.log(`Load Status: ${actualLoadStatus}`);
    expect.soft(actualLoadStatus?.trim()).toBe(loadStatus);
  }

  /**
 * Validates the load status
 * @author Aniket Nale
 * @created 08-01-2026
 */

  async refreshAndValidateLoadStatus(loadStatus: string) {
    const maxWaitMs = WAIT.XXLARGE * 3
    const pollIntervalMs = WAIT.MID;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.loadStatusDropdown_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });

      const actualStatus = ((await this.loadStatusDropdown_LOC.textContent()) ?? '').replace(/\u00A0/g, ' ').trim();

      console.log(`Current Load Status: ${actualStatus}`);

      if (actualStatus === loadStatus) {
        expect.soft(actualStatus).toBe(loadStatus);
        return;
      }
      await this.page.waitForTimeout(pollIntervalMs);
      await this.page.reload({ waitUntil: 'domcontentloaded' });
    }
    throw new Error(`Load status did not change to "${loadStatus}" within 3 minutes`);
  }
  /**
   * Validates the load status
   * @author Deepak Bohra
   * @created 2025-09-02
   * @modified 2025-09-16
   */
  async validateViewLoadHeading() {
    await commonReusables.waitForAllLoadStates(this.page);
    await this.viewLoadPageHeader_LOC.waitFor({
      state: "visible",
      timeout: 60000,
    });
  }
  /**
   * @description Clicks the "Drop 3" tab.
   * @author Rohit Singh
   * @modified 2025-07-29
   */
  async clickDrop3Tab() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.drop3Tab_LOC.click();
  }
  /**
   * Clicks the View Billing button
   * @author Rohit Singh
   * @modified 2025-08-08
   */
  async clickViewBillingButton() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.viewBillingButton_LOC.click();
    //@modified 19-Jan-2026: Rohit Singh: Added log to indicate waiting for billing page to load
    console.log("Waiting for billing page to load completely...");
    await commonReusables.waitForPageStable(this.page);
  }

  /**
   * Validating Internal Share Data
   * @author Avanish Srivastava
   * @modified 2025-08-08
   */

  async getInternalShareData(): Promise<
    { percentage: string; name: string }[]
  > {
    const rows = this.page.locator("//table[@id='commissioninternal_']//tr");
    await rows.scrollIntoViewIfNeeded();
    const rowCount = await rows.count();
    const internalShares: { percentage: string; name: string }[] = [];
    for (let i = 0; i < rowCount; i++) {
      const percentage = (
        await rows.nth(i).locator("td").nth(0).innerText()
      ).trim();
      const name = (await rows.nth(i).locator("td").nth(1).innerText()).trim();
      internalShares.push({ percentage, name });
    }
    return internalShares;
  }

  /**
   * Gets and validates the selected text from the load status dropdown
   * @author Deepak Bohra
   * @created 2025-09-09
   * @param expectedStatus - The expected status text to validate against
   * @returns {Promise<string>} The text of the selected option in the dropdown
   */
  async getSelectedLoadStatusText(expectedStatus?: string): Promise<string> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.loadStatusDropdown_LOC.waitFor({ state: "visible" });
    const selectedText = await this.loadStatusDropdown_LOC.evaluate(
      (select: HTMLSelectElement) => {
        return select.options[select.selectedIndex]?.text.trim() || "";
      }
    );
    console.log(`Selected Load Status: ${selectedText}`);
    if (expectedStatus) {
      console.log(`Expected Load Status: ${expectedStatus}`);
      expect
        .soft(
          selectedText,
          `Load status validation failed - Expected: "${expectedStatus}", Found: "${selectedText}"`
        )
        .toBe(expectedStatus);
      console.log(
        `${selectedText === expectedStatus ? "✅" : "❌"
        } Load status validation ${selectedText === expectedStatus ? "passed" : "failed"
        }: "${selectedText}"`
      );
    }
    return selectedText;
  }

  async getLoadIDfromHeader(): Promise<string> {
    await this.viewLoadPageHeaderValue_LOC.highlight(); // Highlight for debugging
    const headerText = await this.viewLoadPageHeaderValue_LOC.textContent();
    const loadID = await headerText?.match(/\d+/)?.[0];
    await console.log(`Load ID: ${loadID}`);
    return loadID || "";
  }
  /**
   * Waits until the load status is "Dispatched", checking periodically
   * @author Rohit Singh
   * @created 2025-09-17
   * @param maxAttempts - Maximum number of attempts to check the status
   * @throws Will throw an error if the status does not become "Dispatched" within the maximum attempts
   */
  async waitTillLoadIsDispatched(maxAttempts: number = 10, expLoadStatus: string = LOAD_STATUS.DISPATCHED) {
    // await this.page.waitForLoadState("domcontentloaded");
    await commonReusables.waitForPageStable(this.page);
    let loadStatus = await this.loadStatusDropdown_LOC.textContent();
    for (let i = 0; i < maxAttempts; i++) {
      if (loadStatus === expLoadStatus) {
        console.log(`Load is ${expLoadStatus}.`);
        return;
      }
      loadStatus = await this.loadStatusDropdown_LOC.textContent();
      if (i === maxAttempts - 1)
        throw new Error(
          `Current load status is: ${loadStatus} after ${maxAttempts} attempts`
        );
      await this.page.waitForTimeout(WAIT.DEFAULT); // Wait for 3 seconds before the next check
      await this.page.reload();
      // await this.page.waitForLoadState("networkidle");
      await commonReusables.waitForPageStable(this.page);
    }
  }
  /**
   * Validates Auto-Rate Success
   * @author Rohit Singh
   * @created 2025-09-17
   * @throws Will throw an error if Auto-Rate Success is not visible
   */
  async validateAutoRateSuccess() {
    await this.page.waitForLoadState("domcontentloaded");
    const isVisible = await this.autoRateSuccessValue_LOC.isVisible();
    expect.soft(isVisible, "Auto-Rate Success is not visible").toBe(true);
  }
  /**
   * reload untill Auto-Rate Success is visible count = 2
   * @author Rohit Singh
   * @created 2025-12-02
   */
  async reloadUntilAutoRateSuccessVisible(maxAttempts: number = 15) {
    await this.page.waitForLoadState("domcontentloaded");
    for (let i = 0; i < maxAttempts; i++) {
      const isVisible = await this.autoRerateSuccessValue_LOC.isVisible();
      if (isVisible) {
        expect.soft(isVisible, "Auto-Rerate Success is not visible").toBe(true);
        console.log("Auto-Rerate Success is visible.");
        return;
      }
      await this.page.reload();
      await this.page.waitForLoadState("networkidle");
    }
    throw new Error(
      `Auto-Rerate Success did not visible after ${maxAttempts} attempts`
    );
  }
  /**
   * Validates Auto-Dispatch Success
   * @author Rohit Singh
   * @created 2025-09-17
   * @throws Will throw an error if Auto-Dispatch Success is not visible
   */
  async validateAutoDispatchSuccess() {
    await this.page.waitForLoadState("networkidle");
    const isVisible = await this.autoDispatchSuccessValue_LOC.isVisible({ timeout: WAIT.SMALL });
    expect.soft(isVisible, "Auto-Dispatch Success is not visible").toBe(true);
  }

  /**
   * Verify whether today's e-acknowledge date is present on Carrier Tab Page
   * @author Aniket Nale
   * @modified 2025-10-09
   */

  async eAcknowledgeDatePresent() {
    await this.page.waitForLoadState("networkidle");
    await this.eAcknowledgeDateValue_LOC.waitFor({ state: "visible" });
    await expect.soft(this.eAcknowledgeDateValue_LOC).toBeVisible();

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const cellText = await this.eAcknowledgeDateValue_LOC.textContent();
    const dateText = cellText?.match(/\d{4}-\d{2}-\d{2}/)?.[0];

    expect
      .soft(
        dateText === todayStr,
        `Expected acknowledged date '${dateText}' to equal today's date '${todayStr}'`
      )
      .toBe(true);
  }

  /**
   * Verify whether e-acknowledge acceptance is present on Carrier Tab Page
   * @author Aniket Nale
   * @modified 2025-10-09
   */

  async acknowledgeAccepted() {
    await this.page.waitForLoadState("networkidle");
    await this.acknowledgeAcceptedValue_LOC.waitFor({ state: "visible" });
    await expect.soft(this.acknowledgeAcceptedValue_LOC).toBeVisible();
  }

  /**
   * Verify whether View Bid Details button is clickable on view load page
   * @author Parth Rastogi
   * @modified 2025-10-13
   */
  async clickViewBidDetailsButton() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.viewBidDetailsButton_LOC.isEnabled();
    await this.viewBidDetailsButton_LOC.click();
  }

  /**
   * Verify whether Create Bid button is clickable on view load page
   * @author Parth Rastogi
   * @modified 2025-10-13
   */
  async clickCreateBidButton() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.createBidButton_LOC.isEnabled();
    await this.createBidButton_LOC.click();
  }

  /**
   * Clicks and enters carrier details in the search carrier field on view load page
   * @author Parth Rastogi
   * @modified 2025-10-14
   */
  async clickAndEnterCarrierDetails(carrierName: string) {
    await this.page.waitForLoadState("domcontentloaded");
    await this.searchCarriersButton_LOC.click();
    await this.page.waitForLoadState("domcontentloaded");
    await this.searchCarriersInput_LOC.fill(carrierName);

    // Wait for the dropdown to populate
    await this.page.waitForTimeout(WAIT.DEFAULT); // Waiting for carrier email to appear

    // Use the dynamic locator method to click on the carrier name
    const carrierNameLocator = this.getCarrierNameLocator(carrierName);
    await carrierNameLocator.waitFor({ state: "visible" });
    await carrierNameLocator.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Clicks and enters carrier details in the search carrier field on view load page
   * @author Parth Rastogi
   * @modified 2025-10-13
   */
  async enterBidAmountAndClickAddBidButton(amount: string) {
    await this.page.waitForLoadState("domcontentloaded");
    await this.bidAmountInput_LOC.fill(amount);
    await this.page.waitForTimeout(WAIT.DEFAULT); // Waiting for bid amount to be entered
    await this.bidAmountInput_LOC.press("Space");
    await this.addBidButton_LOC.isEnabled();
    await this.addBidButton_LOC.click();
  }
  /**
   * Validates the success message after adding a bid
   * @author Parth Rastogi
   * @modified 2025-10-13
   */
  async validateBidAddedSuccessMessage(expectedMessage: string) {
    await this.page.waitForLoadState("domcontentloaded");
    const actualMessage = await this.bidSuccessMessage_LOC.textContent();
    expect.soft(actualMessage).toBe(expectedMessage);
  }

  /**
   * Closes the Bid Details modal on view load page
   * @author Parth Rastogi
   * @modified 2025-10-13
   */
  async closeBidDetailsModal() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.closeBidDetailsButton_LOC.isEnabled();
    await this.closeBidDetailsButton_LOC.click();
  }

  /**
   * Creates a BTMS bid for a load with the specified carrier name and bid amount, then validates the success message
   * @author Parth Rastogi
   * @created 2025-10-13
   */
  async createBTMSBidForLoad(
    carrierName: string,
    bidAmount: string,
    expectedMessage: string
  ) {
    await this.clickViewBidDetailsButton();
    await this.clickCreateBidButton();
    await this.clickAndEnterCarrierDetails(carrierName);
    await this.enterBidAmountAndClickAddBidButton(bidAmount);
    await this.validateBidAddedSuccessMessage(expectedMessage);
    await this.closeBidDetailsModal();
  }

  /**
   * Verifies and closes the rerate message on load page
   * @author Aniket Nale
   * @created 2025-10-29
   */

  async verifyRerateMsgOnLoadAndClose() {
    {
      await this.page.waitForLoadState("networkidle");
      await this.reRateMessage_LOC.waitFor({
        state: "visible",
        timeout: WAIT.XLARGE,
      });
      const isVisible = await this.reRateMessage_LOC.isVisible();
      expect.soft(isVisible).toBe(true);

      await this.closeRerateMessageButton_LOC.click();
      await this.page.waitForLoadState("networkidle");
      console.log("Rerate message verified and closed successfully on load");
      await this.page.waitForLoadState("domcontentloaded");
    }
  }

  /**
   * Verifies if the flag value is present on the load page
   * @author Aniket Nale
   * @created 2025-10-29
   */

  async flagValueIsPresent() {
    await this.page.waitForLoadState("networkidle");
    await this.flagValue_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
    // const isVisible = await this.flagValue_LOC.isVisible();
    // expect.soft(isVisible).toBe(true);
    await expect(this.flagValue_LOC).toBeVisible({ timeout: WAIT.MID });
  }

  /**
   * Gets the customer total value
   * @author Aniket Nale
   * @created 2025-10-31
   */
  async getCustomerTotalValue(): Promise<number> {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForLoadState("domcontentloaded");
    await this.customerTotalValue_LOC
      .first()
      .waitFor({ state: "visible", timeout: WAIT.MID });
    const text = await this.customerTotalValue_LOC.first().textContent();
    return parseFloat(text?.replace(/[^\d.-]/g, "") || "0");
  }

  /**
   * Verify whether load created by Customer Portal is present on Load Page
   * @author Aniket Nale
   * @created 2025-11-04
   * @modified 20-Nov-2025
   * @author Aniket Nale
   * @description Make function more generic/reusable to verify any portal name
   */

  async createdByPortalName(text: string, timeout = WAIT.XLARGE) {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForLoadState("domcontentloaded");
    const loc = this.portalName_LOC(text);

    await loc.waitFor({ state: "visible", timeout });
    await expect.soft(loc).toBeVisible({ timeout });
  }

  /**
   * Get the Load Method from the Load Method dropdown
   * @author Rohit Singh
   * @created 2025-11-01
   * @returns {Promise<string>} The Load Method as a string
   */
  async getLoadMethod() {
    await this.page.waitForLoadState("domcontentloaded");
    const loadMethod = await this.loadMethodDropdown_LOC.getAttribute("value");
    console.log(`Load Method: ${loadMethod}`);
    return loadMethod || "";
  }
  /**
   * Clicks the Include Carriers View Details link
   * @author Parth Rastogi
   * @created 2025-11-10
   * @returns {Promise<void>} 
   */
  async clickIncludeCarriersViewDetailsLink() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.includeCarriersViewDetailsLink_LOC.click();
  }

  /**
 * Clicks on the Tracking tab
 * @author Aniket Nale
 * @created 2025-11-11
 */
  async clickOnTrackingTab() {
    await commonReusables.waitForAllLoadStates(this.page);
    await this.trackingTab_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
    await this.trackingTab_LOC.click();
  }

  /**
  * Verifies event details in the tracking event table within an iframe
  * @author Aniket Nale
  * @created 2025-11-12
  */
  async verifyEventDetailsInTable(
    expectedEvent: string,
    expectedCity: string,
    expectedState: string,
    expectedZip: string
  ): Promise<void> {

    await commonReusables.waitForAllLoadStates(this.page);
    await commonReusables.waitForPageStable(this.page);

    // --- Step 1: Access the correct iframe
    const frame = this.page.frameLocator('#loadsh_location_map');

    // --- Step 2: Locate event rows inside iframe
    const rows_LOC = frame.locator(this.trackingEventTable_LOC);

    // --- Step 3: Wait for at least one row to appear
    await expect(async () => {
      const count = await rows_LOC.count();
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 30000 });

    // --- Step 4: Wait for the first row to be visible
    const firstRow = rows_LOC.first();
    await expect(firstRow).toBeVisible({ timeout: WAIT.LARGE });

    // --- Step 5: Extract cell data
    const actualDateText = (await firstRow.locator('td').nth(0).textContent())?.trim() ?? '';
    const actualEventText = (await firstRow.locator('td').nth(1).textContent())?.trim() ?? '';

    // --- Step 6: Format today’s date as MM/DD/YY
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    });

    // --- Step 7: Assertions
    expect.soft(actualDateText).toContain(formattedDate);

    const expectedEventText = `${expectedEvent} - ${expectedCity}, ${expectedState} ${expectedZip} US`;
    expect.soft(actualEventText).toBe(expectedEventText);
  }

  /**
   * Get internal share table details with amount and agent name
   * @author Rohit Singh
   * @created 2025-11-13
   * @return {Promise<{ amount: string | null; agentName: string | null }>} The amount and agent name from the internal share table
   */
  async getInternalShareTableDetails(): Promise<{ amount: string | null; agentName: string | null }> {
    const amount = this.internalShareTable_LOC.first().textContent();
    const agentName = this.internalShareTable_LOC.last().textContent();
    return { amount: await amount, agentName: await agentName };
  }

  /**
 * Deleted old methods and created a generic method to get locators for BOL and POD
 * @description This method returns the locators for the document link and row based on the document type (BOL or POD).
 * @author Aniket Nale
 * @created_earlier 2025-11-14
 * @modified 20-Nov-2025
 */

  async verifyDocumentVisible(type: "BOL" | "POD") {
    const { link } = this.getDocumentLocators(type);
    await link.waitFor({ state: "visible", timeout: WAIT.MID });
    expect.soft(await link.isVisible()).toBe(true);
  }

  /**
* Deleted old methods and created a generic method to get locators for BOL and POD
* @description Clicks and opens the document (BOL or POD) in a new tab and verifies the PDF size is greater than 0 KB.
* @author Aniket Nale
* @created_earlier 2025-11-14
* @modified 20-Nov-2025
*/

  async clickAndOpenDocument(type: "BOL" | "POD") {
    const { link } = this.getDocumentLocators(type);

    const [newPage] = await Promise.all([
      this.page.waitForEvent("popup"),
      link.click()
    ]);

    await newPage.waitForLoadState("load");
    const pdfUrl = newPage.url();

    const response = await newPage.request.get(pdfUrl);
    if (!response.ok()) throw new Error(`Failed to download ${type} PDF`);

    const buffer = await response.body();
    const sizeKB = buffer.length / 1024;

    if (sizeKB <= 0) {
      throw new Error(`${type} PDF file is empty (0 KB)!`);
    }

    console.log(`${type} PDF verified. Size: ${sizeKB.toFixed(2)} KB`);
    await newPage.close();
  }

  /**
* Deleted old methods and created a generic method to get locators for BOL and POD
* @description Verifies the presence of the "banyan" text in the specified document row (BOL or POD).
* @author Aniket Nale
* @created_earlier 2025-11-14
* @modified 20-Nov-2025
*/

  async verifyBanyanText(type: "BOL" | "POD") {
    const { row } = this.getDocumentLocators(type);
    const banyanSpan = row.locator(this.banyanSpan_LOC);

    await expect.soft(banyanSpan).toBeVisible({ timeout: WAIT.MID });
    await expect.soft(banyanSpan).toHaveText("banyan");
  }

  /**
* Deleted old methods and created a generic method to get locators for BOL and POD
* @description Verifies that the document date (BOL or POD) matches today's date.
* @author Aniket Nale
* @created_earlier 2025-11-14
* @modified 20-Nov-2025
*/

  async verifyDocumentDateIsToday(type: "BOL" | "POD") {
    const { row } = this.getDocumentLocators(type);

    const dateText = (await row.locator("td").nth(2).innerText()).trim();

    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const yy = String(today.getFullYear()).slice(-2);

    const todayString = `${mm}/${dd}/${yy}`;

    expect.soft(dateText.startsWith(todayString)).toBeTruthy();
  }
  async getQuoteReqNumber() {
    await this.page.waitForLoadState("networkidle");
    await this.quoteReqNumberLink_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
    const linkText = await this.quoteReqNumberLink_LOC.textContent();
    //split link text from # and return only number
    const quoteReqNumber = linkText?.split("#")[1].trim();
    console.log(`Quote Request Number: ${quoteReqNumber}`);
    return quoteReqNumber;
  }

  /**
* Verifies that the carrier total value is not zero
* @author Aniket Nale
* @created 08-Dec-25
*/
  async verifyCarrierTotalValueIsNotZero(): Promise<void> {
    // Wait for value to be visible before reading
    await this.carrierTotalValue_LOC.first().waitFor({
      state: "visible",
      timeout: WAIT.MID,
    });

    const text = await this.carrierTotalValue_LOC.first().textContent();
    const value = parseFloat(text?.replace(/[^\d.-]/g, "") || "0");

    // Assert value > 0
    expect(value).toBeGreaterThan(0);
    console.log(`Verified carrier total value is non-zero: ${value}`);
  }

  /**
* Verifies that the customer total value is not zero
* @author Aniket Nale
* @created 08-Dec-25
*/

  async verifyCustomerTotalValueIsNotZero(): Promise<void> {
    // Wait for value to be visible before reading
    await this.customerTotalValue_LOC.first().waitFor({
      state: "visible",
      timeout: WAIT.MID,
    });

    const text = await this.customerTotalValue_LOC.first().textContent();
    const value = parseFloat(text?.replace(/[^\d.-]/g, "") || "0");

    // Assert value > 0
    expect(value).toBeGreaterThan(0);
    console.log(`Verified customer total value is non-zero: ${value}`);
  }
  /**
   *  Gets the current load status from the load status dropdown
   * @author Rohit Singh
   * @created 05-Dec-2025
   * @returns  {Promise<string>} The current load status as a string
   */
  async getLoadStatus(): Promise<string> {
    await this.page.waitForLoadState("domcontentloaded");
    const loadStatus = await this.loadStatusDropdown_LOC.textContent();
    console.log(`Load Status: ${loadStatus}`);
    return loadStatus?.trim() || "";
  }
  /**
* Verifies that the View Load Page is visible
* @author Aniket Nale
* @created 07-01-2026
*/
  async viewLoadPageVisible(): Promise<void> {
    await this.viewLoadPageHeader_LOC.first().waitFor({ state: "visible", timeout: WAIT.MID });
    await expect.soft(this.viewLoadPage_LOC.first()).toBeVisible({ timeout: WAIT.MID });
  }
  /**
* Gets the Source System ID value from the Load page
* @returns {Promise<string>} The Source System ID as a string
* @author Aniket Nale
* @created 07-01-2026
*/
  async getSourceSystemIDValue(): Promise<string> {
    await commonReusables.waitForPageStable(this.page);
    await this.sourceSystemIDValue_LOC.waitFor({ state: "visible", timeout: WAIT.MID });
    const sourceSystemID = await this.sourceSystemIDValue_LOC.textContent();
    console.log(`Source System ID: ${sourceSystemID}`);
    return sourceSystemID?.trim() || "";
  }

  /**
     * Validate load history entry for Bulk Change status update
     * @author Tejaswini
     * @field load history field description
     * @oldValue previous load status
     * @newvalue new load status after Bulk Change
     */
  async validateLoadHistory(field: string, oldValue: string, newValue: string): Promise<void> {
    await this.viewHistory_LOC.waitFor({ state: 'visible' });
    await this.viewHistory_LOC.click();
    const [newWindow] = await Promise.all([this.page.context().waitForEvent('page')]);
    await newWindow.waitForLoadState('domcontentloaded');
    //Validate Load History Header
    const headerLocator = this.historyHeader(newWindow);
    await headerLocator.waitFor({ state: 'visible' });
    const headerText = (await headerLocator.innerText()).trim();
    console.log(`✅ Load History Header: ${headerText}`);
    //Validate Field
    const fieldLocator = this.fieldValue(newWindow, field).last();
    await fieldLocator.waitFor({ state: 'visible' });
    const fieldText = (await fieldLocator.innerText()).trim();
    //Validate Old Value
    const oldValueLocator = this.oldValue(newWindow, oldValue).last();
    const oldValueText = (await oldValueLocator.innerText()).trim();
    //Validate New Value
    const newValueLocator = this.newValue(newWindow, newValue).last();
    const newValueText = (await newValueLocator.innerText()).trim();
    console.log(`Field: ${fieldText} | 
            Expected Old Value: ${oldValue} | Actual Old Value: ${oldValueText} | 
            Expected New Value: ${newValue} | Actual New Value: ${newValueText}`
    );
    expect(oldValueText).toBe(oldValue);
    expect(newValueText).toBe(newValue);
    console.log('✅ Load History entry validated successfully');
    await newWindow.close();
  }

  /**
* Verifies customer total amount with expected amount within a specified timeout
* @author Aniket Nale
* @created 19-01-2026
*/

  async getCustomerTotalAmount(): Promise<string> {
    await this.page.waitForLoadState("networkidle");
    await this.customerTotalAmount_LOC
      .first()
      .waitFor({ state: "visible", timeout: WAIT.MID });
    const text = await this.customerTotalAmount_LOC.first().textContent();
    const amount = parseFloat(text?.replace(/[^\d.-]/g, "") || "0");
    console.log(`Customer Total Amount: ${amount}`);
    return text?.trim() || "";
  }

  /**
* Verifies customer total amount with expected amount within a specified timeout
* @author Aniket Nale
* @created 19-01-2026
*/

  async expectCustomerTotalAmountToBe(expectedAmount: string,
    maxWaitMs = WAIT.XXLARGE * 4, pollIntervalMs = WAIT.MID): Promise<void> {

    const startTime = Date.now();
    const expected = this.normalizeAmount(expectedAmount);
    let lastActual: string | null = null;

    while (Date.now() - startTime < maxWaitMs) {
      try {
        lastActual = await this.getCustomerTotalAmount();
        const actual = this.normalizeAmount(lastActual);

        if (actual === expected) {
          expect.soft(actual).toBe(expected);
          console.log(`Verified Customer Total Amount: ${actual}`);
          return;
        }
      } catch { }

      console.log(`Customer total not matched yet. Actual: ${lastActual}, Expected: ${expectedAmount}. Refreshing...`);
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(pollIntervalMs);
    }

    throw new Error(`Customer Total Amount did not match within ${maxWaitMs}ms. Last actual value: ${lastActual}`);
  }

  /**
* Get carrier total amount from the Load page
* @author Aniket Nale
* @created 19-01-2026
*/

  async getCarrierTotalAmount(): Promise<string> {
    await this.page.waitForLoadState("networkidle");
    await this.carrierTotalAmount_LOC
      .first()
      .waitFor({ state: "visible", timeout: WAIT.MID });
    const text = await this.carrierTotalAmount_LOC.first().textContent();
    const amount = parseFloat(text?.replace(/[^\d.-]/g, "") || "0");
    console.log(`Carrier Total Amount: ${amount}`);
    return text?.trim() || "";
  }

  /**
* Verifies carrier total amount with expected amount within a specified timeout
* @author Aniket Nale
* @created 19-01-2026
*/

  async expectCarrierTotalAmountToBe(expectedAmount: string,
    maxWaitMs = WAIT.XXLARGE * 4, pollIntervalMs = WAIT.MID): Promise<void> {

    const startTime = Date.now();
    const expected = this.normalizeAmount(expectedAmount);
    let lastActual: string | null = null;

    while (Date.now() - startTime < maxWaitMs) {
      try {
        lastActual = await this.getCarrierTotalAmount();
        const actual = this.normalizeAmount(lastActual);

        if (actual === expected) {
          expect.soft(actual).toBe(expected);
          console.log(`Verified Carrier Total Amount: ${actual}`);
          return;
        }
      } catch { }

      console.log(`Carrier total not matched yet. Actual: ${lastActual}, Expected: ${expectedAmount}. Refreshing...`);
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(pollIntervalMs);
    }

    throw new Error(`Carrier Total Amount did not match within ${maxWaitMs}ms. Last actual value: ${lastActual}`);
  }

  /**
* Helper method to normalize amount strings to numbers
* @author Aniket Nale
* @created 19-01-2026
*/

  private normalizeAmount(value: string): number {
    return Number(
      value
        .replace(/[^\d.]/g, '') // remove $, USD, commas, spaces
    );
  }
  
  /**
   * Get Notes Values from Load Tab
   * @author Rohit Singh
   * @created 19 - Jan - 2026
   */
  async getNotesValues(): Promise<string[]> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.notesValue_LOC.first().waitFor({ state: "visible", timeout: WAIT.MID });
    const notesCount = await this.notesValue_LOC.count();
    const notes: string[] = [];
    for (let i = 0; i < notesCount; i++) {
      const noteText = (await this.notesValue_LOC.nth(i).textContent())?.trim() || '';
      notes.push(noteText);
    }
    return notes;
  }

  /**
   * Validate Notes Presence on Load Tab
   * @author Rohit Singh
   * @created 19-Jan-2026
   * @param expectedNotes - Array of expected notes to validate 
   */
  async validateNotesPresence(expectedNotes: string): Promise<void> {
    const actualNotes = await this.getNotesValues();
    expect.soft(actualNotes).toContain(expectedNotes);
  }

  /**
   * Selects Drop1 on Load tab
   */
  async selectDrop1OnLoadTab(): Promise<void> {
    await this.drop1Tab_LOC.first().waitFor({ state: 'visible' });
    await this.drop1Tab_LOC.first().click();
    console.log('Clicked on Drop 1 link on Load tab');
  }

  /**
   * Checks Auto load tender checkbox on load tab
   */
  async checkAutoLoadTenderCheckbox(): Promise<void> {
    await this.autoLoadTenderCheckbox_LOC.waitFor({ state: 'visible' });
    const isChecked = await this.autoLoadTenderCheckbox_LOC.isChecked();
    if (!isChecked) {
      await this.autoLoadTenderCheckbox_LOC.check();
      console.log('Auto Load Tender checkbox checked');
    }
  }

  /**
   * Uploads Proof of Delivery document to the load
   * @author Tejaswini
   */
  async uploadPODDocument(): Promise<void> {
    const candidatePaths = [
      path.resolve(process.cwd(), "src", "data", "bulkchange", "ProofOfDelivery.pdf")
    ];
    const filePath = candidatePaths.find(p => fs.existsSync(p));
    if (!filePath) {
      throw new Error(`POD file not found. Checked:\n- ${candidatePaths.join("\n- ")}`);
    }
    await Promise.all([this.uploadDocumentIcon_LOC.first().click()]);
    const dropdown = this.selectDocumentType_LOC;
    await dropdown.selectOption({ label: "Proof of Delivery" });
    await this.dragDrop_LOC.click();
    const uploadInput = this.uploadTypeFile_LOC;
    await uploadInput.setInputFiles(filePath);
    await this.submitButton_LOC.last().click();
    const successMessage = this.successMessage_LOC;
    await expect(successMessage).toBeVisible({ timeout: WAIT.LARGE });
    await expect(successMessage).toHaveText("All documents attached successfully.", { timeout: WAIT.LARGE });
    console.log("✅ POD document uploaded and dialog closed successfully.");
  }

  /**
   * Uploads Carrier Invoice document to the load.
   * @author Tejaswini
   * @param testData 
   */
  async uploadCarrierInvoiceDocument(testData: any): Promise<void> {
    const carrierInvoiceNumber = commonReusables.generateRandomNumber(10);
    const candidatePaths = [
      path.resolve(process.cwd(), "src", "data", "bulkchange", "CarrierInvoice.pdf")
    ];
    const filePath = candidatePaths.find(p => fs.existsSync(p));
    if (!filePath) {
      throw new Error(`Carrier Invoice file not found. Checked:\n- ${candidatePaths.join("\n- ")}`);
    }
    await this.payablesButton_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
    await expect(this.payablesButton_LOC).toBeEnabled({ timeout: WAIT.LARGE });
    await this.payablesButton_LOC.check();
    await this.selectDocumentType_LOC.waitFor({ state: 'visible', timeout: WAIT.LARGE });
    await this.selectDocumentType_LOC.selectOption({ label: 'Carrier Invoice' });
    await this.carrierInvoiceNumber_LOC.fill(carrierInvoiceNumber);
    await this.carrierInvoiceAmount_LOC.fill(testData.carrierInvoiceAmount);
    await this.dragDrop_LOC.click();
    const uploadInput = this.uploadTypeFile_LOC;
    await uploadInput.setInputFiles(filePath);
    await this.submitButton_LOC.last().click();
    const successMessage = this.successMessage_LOC;
    await expect(successMessage).toBeVisible({ timeout: WAIT.LARGE });
    await expect(successMessage).toHaveText("All documents attached successfully.", { timeout: WAIT.LARGE });
    const closeButton = this.closeDocumentUploadDialog_LOC;
    await closeButton.first().click({ force: true });
    console.log("✅ Carrier Invoice document uploaded and dialog closed successfully.");
  }

}