import dataConfig from "@config/dataConfig";
import userSetup from "@loginHelpers/userSetup";
import test, { expect } from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import ediHelper from "@utils/ediUtils/ediHelper";
import postMarkUtils from "@utils/emailUtils/postMarkUtils";
import { PageManager } from "@utils/PageManager";
import reusableData from "@utils/reusableData";

test.describe.configure({ retries: 1 });
test.describe.serial('Intermodal Lifecycle Tests', { tag: ['@at_edi', '@at_intermodallifecycle', '@tporegression', '@smoke'] }, () => {
    let pages: PageManager;
    let sharedPage: any;
    let loadId: string;
    let emailAddress: string;
    test.beforeAll(async ({ browser }) => {
        // Setup code before all tests in this describe block
        try {
            sharedPage = await browser.newPage();
            pages = new PageManager(sharedPage);
            await pages.btmsLoginPage.BTMSLogin(userSetup.ediUserIBO);
        } catch (error) {
            console.error('Error in beforeAll hook:', error);
        }
    });

    test.afterAll(async () => {
        try {
            if (sharedPage && !sharedPage.isClosed()) {
                await sharedPage.close();
                pages.logger.info("Shared session closed successfully");
            }
        } catch (error) {
            console.warn("Cleanup warning:", error);
        }
    });
    /**
     * Creates a new Intermodal load via EDI 204 and verifies its creation
     * @author Rohit Singh
     * @created 2024-12-26
     */
    test('Case Id: 89404 - Intermodal Lifecycle - Create new Intermodal load', async () => {
        const testCaseID = "EDI-89404";
        const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testCaseID);
        await test.step('Create new Intermodal load via EDI 204', async () => {
            await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
            await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
            await pages.searchCustomerPage.enterCustomerName(testData.customerName);
            await pages.searchCustomerPage.toggleUpdate('Office', 'Yes');
            await pages.searchCustomerPage.clickOnSearchCustomer();
            await pages.searchCustomerPage.clickOnActiveCustomer();
            await pages.viewCustomerPage.clickCreateLoadLink(LOAD_TYPES.NEW_LOAD_INTERMODAL);
        });
        await test.step('Create Intermodal load with Active Status', async () => {
            loadId = await ediHelper.createIntermodalLoadWithActiveStatus(sharedPage, testData);
            await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.ACTIVE);
        });
    });
    /**
     * Attempts to change the load status to Booked without assigning carriers and railroads,
     * and verifies that the load status remains Active
     * @author Rohit Singh
     * @created 2024-12-29
     */
    test('Case Id: 89405 - Intermodal Lifecycle - Confirm load cannot be changed to booked without carriers and railroads assigned', async () => {
        // const testCaseID = "EDI-89405";
        // const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testCaseID);
        await pages.basePage.clickHomeButton();
        await pages.basePage.searchFromMainHeader(loadId);
        await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.ACTIVE);
        await test.step('Attempt to change load status to Booked without carriers and railroads', async () => {
            await pages.viewLoadPage.clickEditButton();
            await pages.editLoadLoadTabPage.selectLoadStatus(LOAD_STATUS.BOOKED);
            await sharedPage.waitForTimeout(WAIT.DEFAULT); // Wait for potential validation messages to appear
            await pages.editLoadPage.clickSaveButton();
        });
        await test.step('Validate load status remains Active once load is saved', async () => {
            await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.ACTIVE);
        });
    });
    /**
     * Books drayman and railroad for the Intermodal load and verifies that the load status changes to Booked
     * @author Rohit Singh
     * @created 2024-12-30
     */
    test('Case Id: 89406 - Intermodal Lifecycle - Book drayman and railroad', async () => {
        const testCaseID = "EDI-89406";
        const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testCaseID);
        await pages.basePage.clickHomeButton();
        await pages.basePage.searchFromMainHeader(loadId);
        await test.step('Book drayman and railroad for the load', async () => {
            await pages.viewLoadPage.clickEditButton();
            // Select Origin Drayman
            await pages.editLoadPage.clickOnCarrierTab();
            await pages.editLoadCarrierTabPage.selectCarrier1(await testData.carrier1Number);
            // Select Railroad
            await pages.editLoadPage.clickCarrier2Tab();
            await pages.editLoadCarrierTabPage.selectCarrier2(await testData.carrier2Number);
            // Select Destination Drayman
            await pages.editLoadPage.clickCarrier3Tab();
            await pages.editLoadCarrierTabPage.selectCarrier3(await testData.carrier3Number);
            //Save the load after assigning carriers
            await pages.editLoadPage.clickLoadTab();
            await pages.editLoadPage.clickSaveButton();
            await commonReusables.waitForPageStable(sharedPage);
        });
        // Validate load status is Booked
        await test.step('Validate load status is Booked after saving', async () => {
            await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.BOOKED);
        });
    });
    /**
     * Attempts to change the load status back to Active after carriers and railroads have been assigned,
     * and verifies that the load status remains Booked
     * @author Rohit Singh
     * @created 2025-12-31
     */
    test('Case Id: 89407 - Intermodal Lifecycle - Confirm load cannot be changed back to active when carriers and railroads are assigned', async () => {
        // const testCaseID = "EDI-89407";
        await pages.basePage.clickHomeButton();
        await pages.basePage.searchFromMainHeader(loadId);
        await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.BOOKED);
        // Attempt to change load status back to Active
        await test.step('Attempt to change load status to Active when carriers and railroads are assigned', async () => {
            await pages.viewLoadPage.clickEditButton();
            await pages.editLoadLoadTabPage.selectLoadStatus(LOAD_STATUS.ACTIVE);
            await sharedPage.waitForTimeout(WAIT.DEFAULT);
            await pages.editLoadPage.clickSaveButton();
            await commonReusables.waitForPageStable(sharedPage);
        });
        // Validate load status remains Booked
        await test.step('Validate load status remains Booked once load is saved', async () => {
            await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.BOOKED);
        });
    });
    /**
     * Sends an origin pre-note for the Intermodal load and verifies the action
     * @author Rohit Singh
     * @created 2025-12-31
     */
    let emailSubject: string;
    let emailMessage: string;
    test('Case Id: 89408 - Intermodal Lifecycle - Send origin pre-note', async () => {
        const testCaseID = "EDI-89408";
        const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testCaseID);
        await pages.basePage.clickHomeButton();
        await pages.basePage.searchFromMainHeader(loadId);
        await pages.viewLoadPage.clickCarrierTab();
        await test.step('Send origin pre-note for the load', async () => {
            await pages.viewLoadCarrierTabPage.clickSendConfirmationButton(CARRIER_TABS.CARRIER_1);
            await pages.emailedDocumentsForLoadPage.clickRemoveEmailButton();
            await pages.emailedDocumentsForLoadPage.updateEmailSubject(testData.emailData);
            await pages.emailedDocumentsForLoadPage.updateEmailMessage(testData.emailData);
            emailAddress = await reusableData.generateEmailAddress();
            await pages.emailedDocumentsForLoadPage.enterEmailAddress(emailAddress);
            // await pages.emailedDocumentsForLoadPage.clickSendEmailButton();
            await commonReusables.waitForPageStable(sharedPage);
        });
        emailSubject = await pages.emailedDocumentsForLoadPage.getEmailSubject();
        emailMessage = postMarkUtils.convertHtmlToPlainText(await pages.emailedDocumentsForLoadPage.getEmailMessage());
        expect.soft(emailSubject).toContain(testData.emailData);
        expect.soft(emailMessage).toContain(testData.emailData);

        await pages.emailedDocumentsForLoadPage.clickSendEmailButton();
        const emailSentSuccessfully = await pages.emailedDocumentsForLoadPage.isEmailSentSuccessfully();
        expect.soft(emailSentSuccessfully).toBeTruthy();
    });
    test('Case Id: 89409 - Intermodal Lifecycle - Accept origin pre-note', async ({ browser }) => {
        const testCaseID = "EDI-89409";
        const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testCaseID);
        let href;
        let driverNumber: string;
        let dispatchNumber: string;
        let dispatchEmail: string;
        await test.step('Retrieve and accept origin pre-note from email', async () => {
            const messageID = await postMarkUtils.getMessageID(emailAddress);
            const messageData = await postMarkUtils.getMessageData(messageID);
            const actBody = await postMarkUtils.convertHtmlToPlainText(messageData.HtmlBody);
            // validate email subject and body
            console.log('Validating email subject and body content');
            console.log("Expected Body: " + emailMessage);
            console.log("Expected Subject: " + emailSubject);
            expect.soft(messageData.Subject, "Email subject does not match").toContain(emailSubject);
            expect.soft(actBody.trim(), "Email body does not match").toContain(emailMessage);
            const htmlBody = messageData.HtmlBody;
            const hrefRegex = /href=["']([^"']+)["']/g;
            href = hrefRegex.exec(htmlBody)?.[1];
            console.log("link: " + href);
        });
        //navigate to the link to accept the pre-note
        await test.step('Navigate to the Carrier acceptance link & Accept Tender', async () => {
            const context = await browser.newContext();
            const page = await context.newPage();
            const carrierPage = new PageManager(page);
            await page.goto(href!);
            driverNumber = await reusableData.generatePhoneNumber("digits");
            dispatchNumber = await reusableData.generatePhoneNumber("digits");
            dispatchEmail = await reusableData.generateEmailAddress();
            await carrierPage.carrierPortalPage.enterDriverName(testData.driverName);
            await carrierPage.carrierPortalPage.enterDriverNumber(driverNumber);
            await carrierPage.carrierPortalPage.enterCarrierDetails(testData.dispatchName, dispatchNumber, dispatchEmail);
            await carrierPage.carrierPortalPage.checkAgreeTermsCheckbox();
            await carrierPage.carrierPortalPage.clickAcceptTenderButton();
            await carrierPage.carrierPortalPage.verifyLoadTenderAcceptedSuccessMessage(loadId);
            await context.close();
            await console.log("Origin pre-note accepted successfully, load tender accepted. Tab closed.");
        });
        await test.step('Validate Driver & Dispatch details are updated in BTMS', async () => {
            await pages.basePage.clickHomeButton();
            await pages.basePage.searchFromMainHeader(loadId);
            await pages.viewLoadPage.clickCarrierTab();
            const btmsDriverName = (await pages.viewLoadCarrierTabPage.getDriverDetails(CARRIER_TABS.CARRIER_1)).name;
            const btmsDriverNumber = (await pages.viewLoadCarrierTabPage.getDriverDetails(CARRIER_TABS.CARRIER_1)).phone;
            const btmsDispatchName = (await pages.viewLoadCarrierTabPage.getCarrierDispatchDetails(CARRIER_TABS.CARRIER_1)).name;
            const btmsDispatchNumber = (await pages.viewLoadCarrierTabPage.getCarrierDispatchDetails(CARRIER_TABS.CARRIER_1)).phone;
            const btmsDispatchEmail = (await pages.viewLoadCarrierTabPage.getCarrierDispatchDetails(CARRIER_TABS.CARRIER_1)).email;

            expect.soft(btmsDriverName).toBe(testData.driverName);
            expect.soft(btmsDriverNumber.replace(/-/g, '')).toBe(driverNumber);
            expect.soft(btmsDispatchName).toBe(testData.dispatchName);
            expect.soft(btmsDispatchNumber).toBe(dispatchNumber);
            expect.soft(btmsDispatchEmail).toBe(dispatchEmail);
            console.log("Driver and Dispatch details verified successfully in BTMS.");
        });
    });

    /**
     * Changes the load status to At Origin and Arrive pickup,
     * then verifies that the load status updates correctly
     * @author Rohit Singh
     * @created 14-Jan-2026
     */
    test('Case Id: 89410 - Intermodal Lifecycle - Arrive pickup', async () => {
        // const testCaseID = "EDI-89410";
        // const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testCaseID);
        await pages.basePage.clickHomeButton();
        await pages.basePage.searchFromMainHeader(loadId);
        await pages.viewLoadPage.clickEditButton();
        await test.step('Change load status to At Origin & Arrive pickup for the load', async () => {
            await pages.editLoadLoadTabPage.selectLoadStatus(LOAD_STATUS.AT_ORIGIN);
            await pages.editLoadPage.clickOnPick1Tab();
            await pages.editLoadPickTabPage.clickDriverInLink();

            await pages.editLoadPage.clickSaveButton();
        });
        await test.step('Validate load status is At Origin after saving', async () => {
            await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.AT_ORIGIN);
            console.log(`Load status is now At Origin as expected.`);
        });
    });
    /**
     * Sends an EDI 404 for the Intermodal load and verifies the EDI tab updates correctly
     * @author Rohit Singh
     * @created 15-Jan-2026
     */
    test('Case Id: 89411 - Intermodal Lifecycle - Send EDI 404', async () => {
        const testCaseID = "EDI-89411";
        const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testCaseID);
        await pages.basePage.clickHomeButton();
        await pages.basePage.searchFromMainHeader(loadId);
        //Send EDI 404 for Carrier 2 (Rail)
        await test.step('Send EDI 404 for the load', async () => {
            await pages.viewLoadPage.clickCarrier2Tab();
            await pages.viewLoadCarrierTabPage.clickSendEDITenderButton(CARRIER_TABS.CARRIER_2);
        });
        //Validate EDI Tab after sending EDI Tender
            await test.step('Validate EDI Tab after sending EDI Tender', async () => {
              await pages.viewLoadPage.clickEDITab();
              await pages.viewLoadEDITabPage.validateLoadLevelEDIStatus(testData.carrier2Name, testData.carrier2EdiType, testData.carrier2EdiInOut, testData.carrier2EdiStatus);
              await expect(test.info().errors).toHaveLength(0);
              await console.log("EDI Tab Verified Successfully after sending EDI Rail Tender.");
            });
    });
    /**
     * Changes the load status to Depart pickup,
     * then verifies that the load status updates correctly
     * @author Rohit Singh
     * @created 16-Jan-2026
     */
    test('Case Id: 89412 - Intermodal Lifecycle - Depart pickup', async () => {
        // const testCaseID = "EDI-89412";
        // const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testCaseID);
        await pages.basePage.clickHomeButton();
        await pages.basePage.searchFromMainHeader(loadId);
        await pages.viewLoadPage.clickEditButton();
        await test.step('Change load status to pickup for the load', async () => {
            await pages.editLoadLoadTabPage.selectLoadStatus(LOAD_STATUS.PICKED_UP);
            console.log(`Load status changed to ${LOAD_STATUS.PICKED_UP} in Edit Load page.`);
        });
        await test.step('Select Driver out for the load on Pick 1', async () => {
            await pages.editLoadPage.clickOnPick1Tab();
            await pages.editLoadPickTabPage.clickDriverOutLink();
            console.log(`Driver Out selected for Pick 1.`);
            await pages.editLoadPage.clickSaveButton();
        });
        await test.step('Validate load status is Picked Up after saving', async () => {
            await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.PICKED_UP);
            console.log(`Load status is now Picked Up as expected.`);
        });
    });
    /**
     * Intermodal Lifecycle - Change to in-transit manually
     * @author Rohit Singh
     * @created 19-Jan-2026
     */
    test('Case Id: 89413 - Intermodal Lifecycle - Change to in-transit manually', async () => {
        // const testCaseID = "EDI-89413";
        // const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testCaseID);
        await pages.basePage.clickHomeButton();
        await pages.basePage.searchFromMainHeader(loadId);
        await pages.viewLoadPage.clickEditButton();
        await test.step('Change load status to In-Transit for the load', async () => {
            await pages.editLoadLoadTabPage.selectLoadStatus(LOAD_STATUS.IN_TRANSIT);
            console.log(`Load status changed to ${LOAD_STATUS.IN_TRANSIT} in Edit Load page.`);
            await pages.editLoadPage.clickSaveButton();
        });
        await test.step('Validate load status is In-Transit after saving', async () => {
            await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.IN_TRANSIT);
            console.log(`Load status is now In-Transit as expected.`);
        });
    });
    test('Case Id: 89414 - Intermodal Lifecycle - Enter dispatch notes', async () => {
       // const testCaseID = "EDI-89414";
       // const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testCaseID);
        await pages.basePage.clickHomeButton();
        await pages.basePage.searchFromMainHeader(loadId);
        await pages.viewLoadPage.clickEditButton();
        await test.step('Enter dispatch notes for the load Tab', async () => {
            // Add Load Dispatch Notes for Edit Load Page
            await pages.editLoadLoadTabPage.enterDispatchNotes(EDI_TEST_DATA.DISPATCH_NOTE_LOAD_TAB);
            await pages.editLoadPage.clickSaveButton();
        });
        await test.step('Validate Dispatch notes are saved successfully, & Visible on View Billing Tab', async () => {
            // Validate Load Dispatch notes on View Load Page
            await pages.viewLoadPage.validateNotesPresence(EDI_TEST_DATA.DISPATCH_NOTE_LOAD_TAB);
            console.log("Dispatch Notes verified successfully on View Load Tab.");
            await pages.viewLoadPage.clickViewBillingButton();
            // Validate Load Dispatch notes on View Billing Page
            await pages.loadBillingPage.validateDispatchNotes(EDI_TEST_DATA.DISPATCH_NOTE_LOAD_TAB);
        });
        await test.step('Add Dispatch Notes for View Billing Page', async () => {
            // Add Billing Dispatch Notes for View Billing Page
            await pages.loadBillingPage.enterDispatchNotes(EDI_TEST_DATA.DISPATCH_NOTE_BILLING_TAB);
            console.log("Dispatch Notes added successfully on View Billing Tab.");
        });
        await test.step('Validate Dispatch notes are saved successfully, & Visible on View Load Tab', async () => {
            // Validate Billing Dispatch notes on View Billing Page
            await pages.loadBillingPage.validateDispatchNotes(EDI_TEST_DATA.DISPATCH_NOTE_BILLING_TAB);
            console.log("Dispatch Notes verified successfully on View Billing Tab.");
            // Validate Billing Dispatch notes on View Load Page
            await pages.basePage.clickHomeButton();
            await pages.basePage.searchFromMainHeader(loadId);
            await pages.viewLoadPage.validateNotesPresence(EDI_TEST_DATA.DISPATCH_NOTE_BILLING_TAB);
            console.log("Dispatch Notes verified successfully on View Load Tab.");
        });
    });
});