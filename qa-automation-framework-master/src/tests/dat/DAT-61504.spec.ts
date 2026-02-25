import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import dynamicDataAPI from "@config/dynamicDataAPI";

const testcaseID = 'DAT-61504';
const testData = dataConfig.getTestDataFromCsv(
    dataConfig.datData,
    testcaseID
);

test.describe.configure({ retries: 1 });
test.describe.serial('DAT Username fields value should be blank/null for new agent on agent info page for both in view and edit mode.', { tag: ['@at_dat', '@high'] }, () => {

    test('Case ID:61504-Verify DAT Username  fields value is blank for new agent on agent info page for both in view and edit mode.', async ({ page }) => {
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
        await pages.agentInfoPage.clickDuplicateButton();
        const timeStamp = await dynamicDataAPI.generateDateTimeNumber();
        const randomAgentName = `Dat_Auto-${timeStamp}`;
        await pages.duplicateAgentPage.enterAgentNameInDuplicateAgentMode(randomAgentName);
        await pages.agentEditPage.clickSaveButton();

        const agentName = await pages.agentInfoPage.getAgentName();
        pages.logger.info(`Newly created DAT agent name is: ${agentName}`);

        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(agentName);
        pages.logger.info(`Switched user to Newly created DAT agent: ${agentName}`);

        await test.step(`Navigate to Agent Search page under Admin menu`, async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
            await pages.basePage.clickSubHeaderByText(AGENT_SUB_MENU.AGENT_SEARCH);
            pages.logger.info(`Navigated to Agent Search page under Admin menu`);
        });
        await test.step(`Search Agent by name`, async () => {
            await pages.agentSearchPage.nameInputOnAgentPage(agentName);
            await pages.agentSearchPage.clickOnSearchButton();
            pages.logger.info(`Searched and opened agent with name: ${agentName}`);
        });
        await pages.agentSearchPage.selectAgentByName(agentName);
        await test.step('Verify DAT Username  fields value is blank/null for newly created agent on agent info page in view mode', async () => {
            await pages.agentInfoPage.validateDatUsernameBlankInView();
        });
        await pages.agentInfoPage.clickEditButton();

        await test.step('Verify DAT Username  fields value is blank/null  for  newly created agent on agent info page in edit mode', async () => {
            await pages.agentInfoPage.validateDatUsernameBlankInEdit();
        });
    });
});