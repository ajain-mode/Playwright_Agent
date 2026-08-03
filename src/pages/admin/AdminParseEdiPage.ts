import { expect, Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

/**
 * Admin Tools → Parse an EDI 204 or 214 Message (`admintools.php?p=edi_204`).
 * Locators from mono `admintools.php` / `edi_parse_204()`.
 * @author AI Agent
 * @created 2026-07-17
 */
export default class AdminParseEdiPage {
  private readonly parseEdiMenuLink_LOC: Locator;
  private readonly senderIdInput_LOC: Locator;
  private readonly receiverIdInput_LOC: Locator;
  private readonly ediMessageTextarea_LOC: Locator;
  private readonly ediType204Radio_LOC: Locator;
  private readonly submitButton_LOC: Locator;
  private readonly flashMessage_LOC: Locator;

  constructor(private readonly page: Page) {
    // admin/index.html.twig — Admin Tools link text
    this.parseEdiMenuLink_LOC = page.getByRole("link", {
      name: /Parse an EDI 204 or 214 Message/i,
    });
    // admintools.php:edi_parse_204 form fields
    this.senderIdInput_LOC = page.locator('input[name="sender_id"]');
    this.receiverIdInput_LOC = page.locator('input[name="receiver_id"]');
    this.ediMessageTextarea_LOC = page.locator('textarea[name="edi_204_mesage"]');
    this.ediType204Radio_LOC = page.locator("#edi_type_204");
    this.submitButton_LOC = page.locator('input[type="submit"][value="Submit"]');
    this.flashMessage_LOC = page.locator("div").filter({ hasText: /Successfully parsed|Errors parsing/i }).first();
  }

  /**
   * Opens Admin → Admin Tools → Parse an EDI 204 or 214 Message.
   * @author AI Agent
   * @created 2026-07-17
   * Locator source: app/templates/admin/index.html.twig (`/fats/admintools.php?p=edi_204`)
   */
  async navigateToParseEdiPage(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.locator("//a[normalize-space()='Admin']").hover();
    await this.page.getByRole("link", { name: ADMIN_SUB_MENU.ADMIN_TOOLS }).click();
    await commonReusables.waitForPageStable(this.page);
    await this.parseEdiMenuLink_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
    await this.parseEdiMenuLink_LOC.click();
    await commonReusables.waitForPageStable(this.page);
    await this.ediMessageTextarea_LOC.waitFor({ state: "visible", timeout: WAIT.LARGE });
  }

  /**
   * Fills sender/receiver and raw EDI, then submits the parse form.
   * @author AI Agent
   * @created 2026-07-17
   * @param senderId Sender ID (e.g. PSKL)
   * @param receiverId Receiver ID (e.g. STKT)
   * @param rawEdi Raw EDI 204 message body
   * Locator source: admintools.php `edi_parse_204` — `sender_id`, `receiver_id`, `edi_204_mesage`
   */
  async parseNewEdi204(
    senderId: string,
    receiverId: string,
    rawEdi: string,
  ): Promise<void> {
    if (await this.ediType204Radio_LOC.isVisible().catch(() => false)) {
      await this.ediType204Radio_LOC.check();
    }
    await this.senderIdInput_LOC.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
    await this.senderIdInput_LOC.fill(senderId);
    await this.receiverIdInput_LOC.fill(receiverId);
    const sterling = this.page.locator('input[name="edi_provider"][value="STERLING API"]');
    if (await sterling.isVisible().catch(() => false)) {
      await sterling.check();
    }
    await this.ediMessageTextarea_LOC.fill(rawEdi);
    await this.submitButton_LOC.click();
    await commonReusables.waitForPageStable(this.page);
  }

  /**
   * Soft-asserts flash text indicates a successful 204 parse.
   * @author AI Agent
   * @created 2026-07-17
   */
  async expectParseSuccess(): Promise<void> {
    const flash = this.page.getByText(/Successfully parsed edi 204/i);
    await expect.soft(flash).toBeVisible({ timeout: WAIT.LARGE });
  }

  /**
   * Returns true when Admin Parse flash indicates EDI 204 success.
   * @author AI Agent
   * @created 2026-07-17
   * @returns Whether success flash is visible
   */
  async wasParseSuccessful(): Promise<boolean> {
    const flash = this.page.getByText(/Successfully parsed edi 204/i);
    try {
      await flash.waitFor({ state: "visible", timeout: WAIT.LARGE });
      return true;
    } catch {
      const bodyText = await this.page.locator("body").innerText().catch(() => "");
      console.log(
        "Admin Parse flash not successful. Body snippet:",
        bodyText.slice(0, 800),
      );
      return false;
    }
  }
}
