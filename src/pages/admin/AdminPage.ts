import { Locator, Page } from "@playwright/test";
import commonReusables from "@utils/commonReusables";

class AdminPage {

  private readonly leadsActivationLink_LOC: Locator;
  private readonly adminSiteMenuLink_LOC: Locator;
  private readonly switchUserButton_LOC: Locator;
  private readonly typeUserNameInput_LOC: Locator;
  private readonly switchUserInput_LOC: Locator;
  private readonly simulatorToolStatusUpdateLink_LOC: Locator;
  private readonly simulatorToolDocumentUploadLink_LOC: Locator;

  LoadMenuList: (menuname: string) => Locator;

  constructor(private page: Page) {
    this.adminSiteMenuLink_LOC = page.locator("//a[normalize-space()='Admin']");
    this.switchUserButton_LOC = page.locator("//span[contains(@class,'select2-selection__arrow')]");
    this.typeUserNameInput_LOC = page.locator("//input[contains(@class,'select2-search__field')]");
    this.leadsActivationLink_LOC = page.locator("//li/a[text()='Leads Requesting Activation']");
    this.switchUserInput_LOC = page.locator(
      "//*[@id='select2-user-switch-results']//li"
    );
    this.simulatorToolStatusUpdateLink_LOC = page.locator("//a[normalize-space()='Simulate E-Dispatch Status Update']");
    this.simulatorToolDocumentUploadLink_LOC = page.locator("//a[normalize-space()='Simulate E-Dispatch Document Upload']");
    /**
* @author Parth Rastogi
* @description This method handles clicking the Load Menu List
* @modified 2025-07-15
*/
    this.LoadMenuList = (menuname: string) => {
      return this.page.getByRole('link', { name: menuname })
    }
  }

  /**
   * @author Parth Rastogi
   * @description Hover and click Admin menu
   * @modified 2025-07-15
   */
  async hoverAndClickAdminMenu() {
    const adminMenu = this.adminSiteMenuLink_LOC;
    await adminMenu.waitFor({ state: "visible", timeout: WAIT.DEFAULT });
    await adminMenu.hover();
    await adminMenu.click();
  }

  async clickOnLeadsActivationLink() {
    await this.leadsActivationLink_LOC.waitFor({ state: 'visible' });
    await this.leadsActivationLink_LOC.scrollIntoViewIfNeeded();
    await this.leadsActivationLink_LOC.click();
    await this.page.waitForLoadState('load');
  }

  /**
* @author Parth Rastogi
* @description This method handles switching the user in Admin page
* @modified 2025-08-25
*/
  async switchUser(username: string) {
    console.log(username);
    const switchUser = this.switchUserButton_LOC;
    await switchUser.waitFor({ state: "visible" });
    await switchUser.click();
    const typeUserName = this.typeUserNameInput_LOC;
    await typeUserName.waitFor({ state: "visible" });
    // Clear any existing text first
    await typeUserName.clear();
    // Type the username
    await typeUserName.fill(username);
    await this.switchUserInput_LOC.first().click();
  }

  /**
* @author Aniket Nale
* @description Click on Simulator Tool status update Link in Admin Page
* @modified 2025-08-25
*/
  async clickOnSimulatorToolLink() {
    const simulatorToolLink = this.simulatorToolStatusUpdateLink_LOC;
    await simulatorToolLink.waitFor({ state: "visible", timeout: WAIT.LARGE });
    await simulatorToolLink.click();
    await commonReusables.waitForPageStable(this.page);
  }

  /**
* @author Aniket Nale
* @description Click on Simulator Tool document upload Link in Admin Page
* @modified 2025-08-25
*/

  async clickOnSimulatorToolDocumentUploadLink() {
    const simulatorToolLink = this.simulatorToolDocumentUploadLink_LOC;
    await simulatorToolLink.waitFor({ state: "visible", timeout: WAIT.LARGE });
    await simulatorToolLink.click();
    await commonReusables.waitForPageStable(this.page);
  }
}
export default AdminPage;
