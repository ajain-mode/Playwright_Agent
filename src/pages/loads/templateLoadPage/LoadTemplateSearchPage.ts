/**
 * MyLoadTemplateSearchPage - Page object model for Load Template Search Page
 * @description this class is used for template load search page operations  
 * @author Parth Rastogi
 */

import { Locator, Page } from "@playwright/test";


class LoadTemplateSearchPage {

  private readonly enterOfficeNameInput: Locator;
  private readonly enterLoadMethodInput: Locator;
  private readonly searchButton: Locator;
  private readonly templateDescriptionInput: Locator;
  private readonly customerNameInput: Locator;

  constructor(private page: Page) {

    this.enterOfficeNameInput = page.locator("//input[@placeholder='Type one or more Offices']");
    this.enterLoadMethodInput = page.locator("//input[contains(@placeholder,'Select a Load Method or Begin Typing')]");
    this.searchButton = page.locator("//input[@class='submit-report-search']");
    this.templateDescriptionInput = page.locator("//input[@id='search_template_description']");
    this.customerNameInput = page.locator("//input[@id='search_name']");
  }
  templateRecordSelect(templateText: string): Locator {
    return this.page.locator(`//td[normalize-space(text())='${templateText}']`);
  }

   /**
   * @author: Parth Rastogi
   * Search for template using any combination of search criteria
   * @param templateDescription - Optional: The template description to search for
   */
  async searchTemplate(officeName?: string, loadMethod?: string, templateDescription?: string, customerName?: string) {
    await this.page.waitForLoadState('networkidle');
    // Only fill and select office name if provided
    if (officeName) {
      await this.enterOfficeNameInput.fill(officeName);
      await this.page.keyboard.press('Enter');
    }
    // Only fill and select load method if provided
    if (loadMethod) {
      await this.enterLoadMethodInput.fill(loadMethod);
      await this.page.keyboard.press('Enter');
    }
    // Only fill template description if provide
    if (templateDescription) {
      await this.templateDescriptionInput.waitFor({ state: 'visible' });
      await this.templateDescriptionInput.fill(templateDescription);
    }
    // Only fill customer name if provided
    if (customerName) {
      await this.customerNameInput.waitFor({ state: 'visible' });
      await this.customerNameInput.fill(customerName);
    }
    // Execute search regardless of which fields were filled
    await this.searchButton.click();
  }

  /**
   * @author: Parth Rastogi
   * Click on a template record by its text content
   * @param templateText - The text content of the template record to click
   */
  async selectTemplateRecord(templateText: string) {
    await this.page.waitForLoadState('networkidle');
    const templateRecord = this.templateRecordSelect(templateText);
    await templateRecord.click();
}
}

export default LoadTemplateSearchPage;
