import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";

const testcaseID = 'DAT-61510';
const testData = dataConfig.getTestDataFromCsv(
  dataConfig.datData,
  testcaseID
);

test.describe.configure({ retries: 1 });
test.describe.serial('Verify Check Credentials button is visible in edit mode on agent record for new or existing agent', { tag: ['@at_dat', '@smoke'] }, () => {
  
  test('Case ID:61510-Check Credentials button is visible in edit mode on agent record', async ({ page }) => {
    const pages = new PageManager(page);
    await test.step(`Login BTMS`, async () => {
      await pages.btmsLoginPage.BTMSLogin(userSetup.datUser);
    });
    await test.step(`Navigate to Agent Search page under Admin menu`, async () => {
      await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
      await pages.basePage.clickSubHeaderByText(AGENT_SUB_MENU.AGENT_SEARCH);
      pages.logger.info(`Navigated to Agent Search page under Admin menu`);
    });

    await test.step(`Search Agent by name`, async () => {
      await pages.agentSearchPage.nameInputOnAgentPage(testData.agentName);
      await pages.agentSearchPage.clickOnSearchButton();
      pages.logger.info(`Searched and opened agent with name: ${testData.agentName}`);
    });

    await pages.agentSearchPage.selectAgentByName(testData.agentName);
    await test.step(`Verify Check Credentials button is visible in edit mode on agent record for existing agent`, async () => {
      await pages.agentInfoPage.clickEditButton();
      await pages.agentInfoPage.expectCheckCredentialsVisibleAndEnabledInEdit();
    });
  });
});