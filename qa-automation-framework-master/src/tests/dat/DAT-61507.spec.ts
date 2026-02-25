import { test } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";

const testcaseID = 'DAT-61507';
test.describe.configure({ retries: 1 });
test.describe.serial('Verify DAT Username  fields value is blank/null  for  existing agent on agent info page for both in view and edit mode', { tag: ['@at_dat', '@smoke'] }, () => {
    let pages: PageManager;
    let testData: any;
    let sharedPage: any;
    test.beforeAll(async ({ browser }) => {
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);
            testData = dataConfig.getTestDataFromCsv(dataConfig.datData, testcaseID);
            await pages.btmsLoginPage.BTMSLogin(userSetup.datUser);
            pages.logger.info("BTMS login successful");
        }
        catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    });

    test.afterAll(async () => {
        try {
           if (sharedPage && !sharedPage.isClosed()) {
                await sharedPage.close();
                pages.logger.info("Shared session closed successfully");
            }
        }
         catch (error) {
            console.warn("Cleanup warning:", error);
        }
    });

    test('Case ID: 61507 - Check DAT Username  fields value is blank/null  for  existing agent on agent info page for both in view and edit mode', async ({ }) => {
        await pages.adminPage.hoverAndClickAdminMenu();
        await pages.adminPage.switchUser(testData.agentName);
        console.log(`Switched user to that has agent as its DAT Agent: ${testData.agentName}`);
        await test.step("Navigate to Agent Search page using Admin menu", async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN);
            await pages.basePage.clickSubHeaderByText(AGENT_SUB_MENU.AGENT_SEARCH);
            pages.logger.info("Navigated to Agent Search page under Admin menu");
        });

        await test.step(`Search Agent by name`, async () => {
            console.log(`Searching for agent with name: ${testData.agentName}`);
            await pages.agentSearchPage.nameInputOnAgentPage(testData.agentName);
            await pages.agentSearchPage.clickOnSearchButton();
            pages.logger.info(`Searched and opened agent with name: ${testData.agentName}`);
        });
        await pages.agentSearchPage.selectAgentByName(testData.agentName);
        await test.step('Verify DAT Username  fields value is blank/null  for  existing agent on agent info page for both in view mode', async () => {
            await pages.agentInfoPage.validateDatUsernameBlankInView();
        });
        await pages.agentInfoPage.clickEditButton();

        await test.step('Verify DAT Username  fields value is blank/null  for  existing agent on agent info page in edit mode', async () => {
            await pages.agentInfoPage.validateDatUsernameBlankInEdit();
        });
    });
});