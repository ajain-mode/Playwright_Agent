import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import test, { Browser, BrowserContext, expect, Page } from "@playwright/test";
import { PageManager } from "@utils/PageManager";

test.describe("Carrier Search Tests", { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, () => {

    let pages: PageManager;
    let testData: any;
    let page: Page;
    let browser: Browser;
    let context: BrowserContext;

    test.beforeEach(async ({ browser: browserInstance }) => {
        try {
            browser = browserInstance;
            context = await browser.newContext();
            page = await context.newPage();
            pages = new PageManager(page);
            await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
            pages.logger.info("BTMS login successful");
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);

        } catch (error) {
            console.error("Setup failed:", error);
            throw error;
        }
    });

    test.afterEach(async () => {
        try {
            if (context) {
                await context.close();   // automatically closes all pages
                pages?.logger?.info("Context closed successfully");
            }
        } catch (error) {
            pages?.logger?.warn("Cleanup warning:", error);
        }
    });

    /**
* @Test_Case_ID CARRIER-72101
* @Description Carrier Search - MC Carrier Search
* @author Aniket Nale
* @created 25-Nov-2025
*/
    test("Case Id: 72101 - Carrier Search - MC Carrier Search", { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        const testCaseID = "CARRIER-72101";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

        await pages.carrierSearchPage.mcNoInputOnCarrierPage(testData.mcNumber);
        await pages.carrierSearchPage.selectActiveOnCarrier();
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyMCNoInputOnCarrierSearchPage(testData.mcNumber);
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
        await pages.viewCarrierPage.verifyMcNumberInDetails(testData.mcNumber);
        pages.logger.info("Carrier search by MC number executed successfully");
    });

    /**
* @Test_Case_ID CARRIER-72102
* @Description Carrier Search - MC Quick Search
* @author Aniket Nale
* @created 25-Nov-2025
*/
    test("Case Id: 72102 - Carrier Search - MC Quick Search", { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        const testCaseID = "CARRIER-72102";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

        await pages.basePage.searchFromMainHeader(testData.mcNumber);
        await pages.viewCarrierPage.verifyMcNumberInDetails(testData.mcNumber);
        pages.logger.info("Carrier quick search by MC number executed successfully");
    });

    /**
* @Test_Case_ID CARRIER-72103
* @Description Carrier Search - DOT
* @author Aniket Nale
* @created 26-Nov-2025
*/
    test("Case Id: 72103 - Carrier Search - DOT", { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        const testCaseID = "CARRIER-72103";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

        await pages.carrierSearchPage.dotNoInputOnCarrierPage(testData.dotNumber);
        await pages.carrierSearchPage.selectActiveOnCarrier();
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyDotNoInputOnCarrierSearchPage(testData.dotNumber);
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
        await pages.viewCarrierPage.verifyDotNumberInDetails(testData.dotNumber);
        pages.logger.info("Carrier search by DOT number executed successfully");
    });

    /**
* @Test_Case_ID CARRIER-72104
* @Description Carrier Search - Name
* @author Aniket Nale
* @created 26-Nov-2025
*/
    test("Case Id: 72104 - Carrier Search - Name", { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        const testCaseID = "CARRIER-72104";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.selectActiveOnCarrier();
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyNameInputOnCarrierSearchPage(testData.carrierName);
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
        await pages.viewCarrierPage.verifyCarrierNameInDetails(testData.carrierName);
        pages.logger.info("Carrier search by carrier name executed successfully");
    });

    /**
* @Test_Case_ID CARRIER-72107
* @Description Carrier Search - Intrastate #
* @author Aniket Nale
* @created 27-Nov-2025
*/
    test("Case Id: 72107 - Carrier Search - Intrastate #", { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        const testCaseID = "CARRIER-72107";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

        await pages.carrierSearchPage.intraStateInputOnCarrierPage(testData.intraStateNumber);
        await pages.carrierSearchPage.selectActiveOnCarrier();
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyIntraStateInputOnCarrierSearchPage(testData.intraStateNumber);
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
        await pages.viewCarrierPage.verifyIntraStateInDetails(testData.intraStateNumber);
        pages.logger.info("Carrier search by carrier name executed successfully");
    });

    /**
* @Test_Case_ID CARRIER-72123
* @Description Carrier Search - MX/FF Only - FF#
* @author Aniket Nale
* @created 02-Dec-2025
*/
    test("Case Id: 72123 - Carrier Search - MX/FF Only - FF#", { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        const testCaseID = "CARRIER-72123";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

        await pages.carrierSearchPage.ffInputOnCarrierPage(testData.ffNumber);
        await pages.carrierSearchPage.selectActiveOnCarrier();
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyFFInputOnCarrierSearchPage(testData.ffNumber);
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
        await pages.viewCarrierPage.verifyFFInDetails(testData.ffNumber);
        pages.logger.info("Carrier search by carrier name executed successfully");
    });

    /**
    * @Test_Case_ID CARRIER-72110
    * @Description Carrier Search - Carrier ID
    * @author Aniket Nale
    * @created 28-Nov-2025
    */
    test("Case Id: 72110 - Carrier Search - Carrier ID", { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        const testCaseID = "CARRIER-72110";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

        await pages.carrierSearchPage.carrierIDInputOnCarrierPage(testData.carrierID);
        await pages.carrierSearchPage.selectActiveOnCarrier();
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyCarrierIDInputOnCarrierSearchPage(testData.carrierID);
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
        await pages.viewCarrierPage.verifyCarrierIDInDetails(testData.carrierID);
        pages.logger.info("Carrier search by carrier name executed successfully");
    });

    /**
    * @Test_Case_ID CARRIER-72124
    * @Description Carrier Search - MX/FF Only - MX#
    * @author Aniket Nale
    * @created 02-Dec-2025
    */
    test("Case Id: 72124 - Carrier Search - MX/FF Only - MX#", { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        const testCaseID = "CARRIER-72124";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

        await pages.carrierSearchPage.mxInputOnCarrierPage(testData.mxNumber);
        await pages.carrierSearchPage.selectActiveOnCarrier();
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyMxInputOnCarrierSearchPage(testData.mxNumber);
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
        await pages.viewCarrierPage.verifyMxInDetails(testData.mxNumber);
        pages.logger.info("Carrier search by carrier name executed successfully");
    });
    /**
     * @Test_Case_ID CARRIER-72109
     * @Description Carrier Search - Status
     * @author Rohit Singh
     * @created 04-Dec-2025
     */
    test('Case Id: 72109 - Carrier Search - Status', { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        // First validates search with Inactive status with no results then with Active status 
        const testCaseID = "CARRIER-72109";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

        await pages.carrierSearchPage.carrierStatus(CARRIER_STATUS.INACTIVE);
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.clickOnSearchButton();
        // Verify no records found
        await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();
        // Now search with Active status
        await pages.carrierSearchPage.clickOnClearButton();
        await pages.carrierSearchPage.carrierStatus(CARRIER_STATUS.ACTIVE);
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
        await pages.carrierSearchPage.verifyCarrerListTableData(CARRIER_STATUS.ACTIVE.toUpperCase());
        pages.logger.info("Carrier search by Status executed successfully");
    });
    /**
     * @Test_Case_ID CARRIER-72111
     * @Description Carrier Search - Factor
     * @author Rohit Singh
     * @created 04-Dec-2025
     */
    test('Case Id: 72111 - Carrier Search - Factor', { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        //Apply filter for a factor and & carrier name and verify results
        const testCaseID = "CARRIER-72111";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

        await pages.carrierSearchPage.selectFactorByName(testData.factor);
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
        await pages.carrierSearchPage.verifyCarrerListTableData(testData.factor.toUpperCase());
        pages.logger.info("Carrier search by Factor executed successfully");
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
        await pages.viewCarrierPage.verifyCarrierNameInDetails(testData.carrierName);
        const factorValue = await pages.viewCarrierPage.getFactorValue();
        expect(factorValue?.trim()).toBe(testData.factor);
    });
    /**
     * @Test_Case_ID CARRIER-72108
     * @Description Carrier Search - CARB?
     * @author Rohit Singh
     * @created 04-Dec-2025
     */
    test('Case Id: 72108 - Carrier Search - CARB?', { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        //Apply filter for CARB Yes/No and & carrier name and verify results
        const testCaseID = "CARRIER-72108";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
        const carbValue = await pages.viewCarrierPage.getCarbValue();
        console.log(`CARB Value for carrier ${testData.carrierName} is: ${carbValue}`);

        await pages.basePage.clickHomeButton();
        await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
        await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.setSliderValue(TOGGLE_NAME.CARB, carbValue);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
        pages.logger.info("Carrier search by CARB executed successfully");

        await pages.basePage.clickHomeButton();
        await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
        await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.setOppositeSliderValue(TOGGLE_NAME.CARB, carbValue);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();
        await expect(test.info().errors.length).toEqual(0);
        console.log(`Test Case - ${testCaseID} executed successfully`);
    });
    /**
     * @Test_Case_ID CARRIER-72115
     * @Description Carrier Search - Safety Rating
     * @author Rohit Singh
     * @created 05-Dec-2025
     */
    test('Case Id: 72115 - Carrier Search - Safety Rating', { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        // Apply filter for Safety Rating/SFD & carrier name and verify results
        const testCaseID = "CARRIER-72115";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.SAFETY_RATING_SFD, SAFETY_RATING_SFD.UNSATISFACTORY)
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();
        // Now search with Satisfactory rating
        await pages.carrierSearchPage.clickOnClearButton();
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.SAFETY_RATING_SFD, SAFETY_RATING_SFD.SATISFACTORY)
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
        await pages.carrierSearchPage.verifyCarrerListTableData(SAFETY_RATING_SFD.SATISFACTORY);
        pages.logger.info("Carrier search by Safety Rating/SFD executed successfully");
    });

    /**
 * @Test_Case_ID CARRIER-72106
 * @Description Carrier Search - Intrastate-Only
 * @author Aniket Nale
 * @created 11-Dec-2025
 */
    test('Case Id: 72106 - Carrier Search - Intrastate-Only',
        { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
            const testCaseID = "CARRIER-72106";
            testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
            const intraStateOnlyValue = await pages.viewCarrierPage.getInstraStateOnlyValue();
            console.log(`Intra State Only Value for carrier ${testData.carrierName} is: ${intraStateOnlyValue}`);
            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setToggleValue(TOGGLE_NAME.INTRASTATE_ONLY, intraStateOnlyValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
            pages.logger.info("Carrier search by INTRASTATE_ONLY executed successfully");
            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setOppositeToggleValue(TOGGLE_NAME.INTRASTATE_ONLY, intraStateOnlyValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();
            await expect(test.info().errors.length).toEqual(0);
            console.log(`Test Case - ${testCaseID} executed successfully`);
        });

    test('Case Id: 72130 - Carrier Search - 8a',
        { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
            const testCaseID = "CARRIER-72130";
            testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
            const eightAValue = await pages.viewCarrierPage.getEightAValue();
            console.log(`8a Value for carrier ${testData.carrierName} is: ${eightAValue}`);

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setToggleValue(TOGGLE_NAME.EIGHT_A, eightAValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
            pages.logger.info("Carrier search by EIGHT_A executed successfully");

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setOppositeToggleValue(TOGGLE_NAME.EIGHT_A, eightAValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            await expect(test.info().errors.length).toEqual(0);
            console.log(`Test Case - ${testCaseID} executed successfully`);
        });

    test('Case Id: 72129 - Carrier Search - Q-Star',
        { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
            const testCaseID = "CARRIER-72129";
            testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
            const qStarValue = await pages.viewCarrierPage.getQStarValue();
            console.log(`Q-Star Value for carrier ${testData.carrierName} is: ${qStarValue}`);

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setToggleValue(TOGGLE_NAME.Q_STAR, qStarValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
            pages.logger.info("Carrier search by Q_STAR executed successfully");

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setOppositeToggleValue(TOGGLE_NAME.Q_STAR, qStarValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            await expect(test.info().errors.length).toEqual(0);
            console.log(`Test Case - ${testCaseID} executed successfully`);
        });

    test('Case Id: 72132 - Carrier Search - TSA Certified',
        { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
            const testCaseID = "CARRIER-72132";
            testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
            const tCertifiedValue = await pages.viewCarrierPage.getTCertifiedValue();
            console.log(`TSA Certified Value for carrier ${testData.carrierName} is: ${tCertifiedValue}`);

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setToggleValue(TOGGLE_NAME.TSA_CERTIFIED, tCertifiedValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
            pages.logger.info("Carrier search by TSA_CERTIFIED executed successfully");

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setOppositeToggleValue(TOGGLE_NAME.TSA_CERTIFIED, tCertifiedValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            await expect(test.info().errors.length).toEqual(0);
            console.log(`Test Case - ${testCaseID} executed successfully`);
        });

    test('Case Id: 72137 - Carrier Search - UIIA Participation?',
        { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
            const testCaseID = "CARRIER-72137";
            testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
            const uiiaParticipationValue = await pages.viewCarrierPage.getUIIAParticipationValue();
            console.log(`UIIA Participation Value for carrier ${testData.carrierName} is: ${uiiaParticipationValue}`);

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setToggleValue(TOGGLE_NAME.UIIA_PARTICIPATION, uiiaParticipationValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
            pages.logger.info("Carrier search by UIIA_PARTICIPATION executed successfully");

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setOppositeToggleValue(TOGGLE_NAME.TSA_CERTIFIED, uiiaParticipationValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            await expect(test.info().errors.length).toEqual(0);
            console.log(`Test Case - ${testCaseID} executed successfully`);
        });

    test('Case Id: 72139 - Carrier Search - SmartWay?',
        { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
            const testCaseID = "CARRIER-72139";
            testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
            const smartWayValue = await pages.viewCarrierPage.getSmartWayValue();
            console.log(`SmartWay Value for carrier ${testData.carrierName} is: ${smartWayValue}`);

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setSliderValue(TOGGLE_NAME.SMARTWAY, smartWayValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
            pages.logger.info("Carrier search by SmartWay? executed successfully");

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setOppositeSliderValue(TOGGLE_NAME.SMARTWAY, smartWayValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            await expect(test.info().errors.length).toEqual(0);
            console.log(`Test Case - ${testCaseID} executed successfully`);
        });

    /**
     * @Test_Case_ID CARRIER-72118
     * @Description Carrier Search - Inv Process Group
     * @author Rohit Singh
     * @created 12-Dec-2025
     */
    test('Case Id: 72118 - Carrier Search - Inv Process Group', { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
        //Apply filter for Inv Process Group and & carrier name and verify results
        const testCaseID = "CARRIER-72118";
        testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.INV_PROCESS_GROUP, INV_PROCESS_GROUP.NEW);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();
        // Now search with Internal
        await pages.carrierSearchPage.clickOnClearButton();
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.INV_PROCESS_GROUP, INV_PROCESS_GROUP.INTERNAL);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();
        // Now search with Review
        await pages.carrierSearchPage.clickOnClearButton();
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.INV_PROCESS_GROUP, INV_PROCESS_GROUP.REVIEW);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();
        // Now search with Standard
        await pages.carrierSearchPage.clickOnClearButton();
        await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
        await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.INV_PROCESS_GROUP, INV_PROCESS_GROUP.STANDARD);
        await pages.carrierSearchPage.clickOnSearchButton();
        await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
        await pages.carrierSearchPage.selectCarrierByName(testData.carrierName.toUpperCase());
        const invProcessGroupValue = await pages.viewCarrierPage.getInvProcessGroupValue();
        expect(invProcessGroupValue).toBe(INV_PROCESS_GROUP.STANDARD);
        pages.logger.info("Carrier search by Inv Process Group executed successfully");
    });

    /**
 * @Test_Case_ID CARRIER-72114
 * @Description Carrier Search - Vendor Type
 * @author Aniket Nale
 * @created 15-Dec-2025
 */
    test('Case Id: 72114 - Carrier Search - Vendor Type',
        { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
            //Apply filter for Vendor Type and & carrier name and verify results
            const testCaseID = "CARRIER-72114";
            testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.VENDOR_TYPE, VENDOR_TYPE.BANKING_SERVICE);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            // Now search with EQUIPMENT_PROVIDER
            await pages.carrierSearchPage.clickOnClearButton();
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.VENDOR_TYPE, VENDOR_TYPE.EQUIPMENT_PROVIDER);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            // Now search with CUSTOMS_BROKER
            await pages.carrierSearchPage.clickOnClearButton();
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.VENDOR_TYPE, VENDOR_TYPE.CUSTOMS_BROKER);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            // Now search with AIR_CARRIER 
            await pages.carrierSearchPage.clickOnClearButton();
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.VENDOR_TYPE, VENDOR_TYPE.AIR_CARRIER);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
            await pages.carrierSearchPage.selectCarrierByName(testData.carrierName.toUpperCase());
            const vendorTypeValue = await pages.viewCarrierPage.getVendorTypeValue();
            expect(vendorTypeValue).toBe(VENDOR_TYPE.AIR_CARRIER);
            pages.logger.info("Carrier search by Vendor Type executed successfully");
        });

    /**
* @Test_Case_ID CARRIER-72113
* @Description Carrier Search - Carrier Mode
* @author Aniket Nale
* @created 15-Dec-2025
*/
    test('Case Id: 72113 - Carrier Search - Carrier Mode',
        { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {

            const testCaseID = "CARRIER-72113";
            testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

            //Apply filter for Carrier Mode and & carrier name and verify results
            //Search with SEA
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.CARRIER_MODE, CARRIER_MODE.SEA);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            // Now search with AIR
            await pages.carrierSearchPage.clickOnClearButton();
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.CARRIER_MODE, CARRIER_MODE.AIR);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            // Now search with RAIL
            await pages.carrierSearchPage.clickOnClearButton();
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.CARRIER_MODE, CARRIER_MODE.RAIL);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            // Now search with ROAD
            await pages.carrierSearchPage.clickOnClearButton();
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.selectValueFromDropdownFilter(CARRIER_SEARCH_FILTERS.CARRIER_MODE, CARRIER_MODE.ROAD);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
            await pages.carrierSearchPage.selectCarrierByName(testData.carrierName.toUpperCase());
            const carrierModeValue = await pages.viewCarrierPage.getCarrierModeValue();
            expect(carrierModeValue).toBe(CARRIER_MODE.ROAD);
            pages.logger.info("Carrier search by Carrier Mode executed successfully");
        });

    /**
* @Test_Case_ID CARRIER-72131
* @Description Carrier Search - No BCA
* @author Aniket Nale
* @created 16-Dec-2025
*/

    test('Case Id: 72131 - Carrier Search - No BCA',
        { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {
            const testCaseID = "CARRIER-72131";
            testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

            await pages.carrierSearchPage.selectActiveOnCarrier();
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.selectCarrierByName(testData.carrierName);
            const noBcaValue = await pages.viewCarrierPage.getNoBCA();
            console.log(`No BCA Value for carrier ${testData.carrierName} is: ${noBcaValue}`);

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.selectActiveOnCarrier();
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setToggleValue(TOGGLE_NAME.NO_BCA, noBcaValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
            pages.logger.info("Carrier search by NO_BCA executed successfully");

            await pages.basePage.clickHomeButton();
            await pages.basePage.hoverOverHeaderByText(HEADERS.CARRIER);
            await pages.basePage.clickSubHeaderByText(CARRIER_SUB_MENU.SEARCH);
            await pages.carrierSearchPage.selectActiveOnCarrier();
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.setOppositeToggleValue(TOGGLE_NAME.NO_BCA, noBcaValue);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            await expect(test.info().errors.length).toEqual(0);
            console.log(`Test Case - ${testCaseID} executed successfully`);
        });

    /**
* @Test_Case_ID CARRIER-72113
* @Description Carrier Search - Carrier Mode
* @author Aniket Nale
* @created 15-Dec-2025
*/
    test('Case Id: 72119 - Carrier Search - Broker Authority',
        { tag: ['@tporegression', '@smoke', '@at_carriersearch'] }, async () => {

            const testCaseID = "CARRIER-72119";
            testData = dataConfig.getTestDataFromCsv(dataConfig.carrierData, testCaseID);

            //Apply filter for Broker Authority and & carrier name and verify results
            //Search with NONE
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.selectValueFromDropdownFilter
                (CARRIER_SEARCH_FILTERS.BROKER_AUTHORITY, BROKER_AUTHORITY.NONE);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            // Now search with INACTIVE
            await pages.carrierSearchPage.clickOnClearButton();
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.selectValueFromDropdownFilter
                (CARRIER_SEARCH_FILTERS.BROKER_AUTHORITY, BROKER_AUTHORITY.INACTIVE);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyNoRecordsFoundInCarrierSearch();

            // Now search with ACTIVE
            await pages.carrierSearchPage.clickOnClearButton();
            await pages.carrierSearchPage.nameInputOnCarrierPage(testData.carrierName);
            await pages.carrierSearchPage.selectValueFromDropdownFilter
                (CARRIER_SEARCH_FILTERS.BROKER_AUTHORITY, BROKER_AUTHORITY.ACTIVE);
            await pages.carrierSearchPage.clickOnSearchButton();
            await pages.carrierSearchPage.verifyCarrerListTableData(testData.carrierName.toUpperCase());
            await pages.carrierSearchPage.selectCarrierByName(testData.carrierName.toUpperCase());

            await pages.viewCarrierPage.verifyBrokerAuthorityStatus();
            pages.logger.info("Carrier search by Broker Authority executed successfully");
        });
});