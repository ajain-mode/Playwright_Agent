import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";

const testcaseID = 'DFB-25013';
const testData = dataConfig.getTestDataFromCsv(
  dataConfig.dfbData,
  testcaseID
);
  
test.describe.configure({ retries: 1 });
test.describe('Case ID: 25013 - Agent with an Auth Level of MANAGER, FINANCE, EXECUTIVE OR ADMIN for post automation rule', 
  { tag: ['@dfb', '@tporegression', '@postautomationrule'] }, () => {

  test('Validate post automation rule access for allowed auth levels', async ({ page }) => {
    const pages = new PageManager(page);
    let currentAuthLevel: string = '';
    
    await test.step('Login BTMS', async () => {
      await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
    });

    await test.step('Navigate to Agent Search and get current Auth Level', async () => {
      await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
      await pages.basePage.clickSubHeaderByText(ADMIN_SUB_MENU.AGENT_SEARCH); 
      await pages.agentSearchPage.nameInputOnAgentPage(testData.agentName);
      await pages.agentSearchPage.clickOnSearchButton();
      await pages.agentSearchPage.selectAgentByName(testData.agentName);
      
      currentAuthLevel = await pages.agentInfoPage.getAuthLevel();
      pages.logger.info(`Current auth level: ${currentAuthLevel}`);
    });

    if (
      currentAuthLevel === AGENT_AUTH_LEVEL.ADMIN ||
      currentAuthLevel === AGENT_AUTH_LEVEL.MANAGER ||
      currentAuthLevel === AGENT_AUTH_LEVEL.FINANCE ||
      currentAuthLevel === AGENT_AUTH_LEVEL.EXECUTIVE
    ) {
      await test.step(`Validate Post Automation access for current auth level: ${currentAuthLevel}`, async () => {
        await pages.basePage.clickHeaderAndSubMenu(HEADERS.HOME, ADMIN_SUB_MENU.OFFICE_CONFIG);
        await pages.postAutomationRulePage.clickPostAutomationButton();
        pages.logger.info(`Post Automation button accessible with ${currentAuthLevel} auth level`);
      });
    } else {
      await test.step(`Change Auth Level to ADMIN and validate Post Automation access`, async () => {
        pages.logger.info(`Current auth level '${currentAuthLevel}' is not allowed. Changing to ADMIN.`);
        await pages.agentInfoPage.clickEditButton();
        await pages.agentEditPage.updateAuthLevel(AGENT_AUTH_LEVEL.ADMIN);
        pages.logger.info(`Auth level changed to ${AGENT_AUTH_LEVEL.ADMIN}`);
        
        await pages.basePage.clickHeaderAndSubMenu(HEADERS.HOME, ADMIN_SUB_MENU.OFFICE_CONFIG);
        await pages.postAutomationRulePage.clickPostAutomationButton();
        pages.logger.info(`Post Automation button accessible with ${AGENT_AUTH_LEVEL.ADMIN} auth level`);
      });
    }
  });
});