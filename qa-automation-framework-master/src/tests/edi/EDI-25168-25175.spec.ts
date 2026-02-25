import apiRequests from "@api/apiRequests";
import dataConfig from "@config/dataConfig";
import dataConfigAPI from "@config/dataConfigAPI";
import dynamicDataAPI from "@config/dynamicDataAPI";
import userSetup from "@loginHelpers/userSetup";
import EDILogPage from "@pages/loads/viewLoadPage/EDILogPage";
import ViewLoadEDITabPage from "@pages/loads/viewLoadPage/ViewLoadEDITabPage";
import test, { expect} from "@playwright/test";
import commonReusables from "@utils/commonReusables";
import ediHelper from "@utils/ediUtils/ediHelper";
import { PageManager } from "@utils/PageManager";
import { switchBackToOriginalTab, switchToNewTab } from "@utils/tabHelper";
test.describe.configure({ retries: 3 });
test.describe.serial('Truck Load API Test Suite', { tag: ['@at_edi', '@tporegression', '@smoke'] }, async () => {
    let loadId: string;
    let pages: PageManager;
    let response: any;
    let bolNumber: string;
    const userName = userSetup.globalUser;
    test.beforeEach(async ({ page }) => {
        pages = new PageManager(page);
        await pages.btmsLoginPage.BTMSLogin(userName);
    });
    test('Case Id: 25168 - Inbound EDI 204 from Customer', async ({ page }) => {
        const testcaseID = 'EDI-25168';
        const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
        //Setup Customer PreCondition
        await test.step('Setup Customer PreCondition', async () => {
            await ediHelper.disableAutoOverlay(page, testData.customerName, "FORD");
            await pages.viewCustomerPage.clickHomeButton();
            await page.waitForLoadState("networkidle");
        });
        // Create API Post request to send EDI 204S
        bolNumber = await dynamicDataAPI.getBolNumber() + '2';
        await console.log('Generated BOL Number:', bolNumber);
        // trailerNumber = await dynamicDataAPI.generateTrailerNumber();
        const updatedRawData = await dynamicDataAPI.updateEdi204TruckLoadRawData(dataConfigAPI.inboundEdi204TruckLoad, bolNumber);
        ({ response } = await apiRequests.sendEDI204Request(updatedRawData));
        await console.log('Sent EDI with BOL Number:', bolNumber);
        await console.log('Status Code:', response.status);
        await expect(response.status).toBe(201);    
    });
    test('Case Id: 25169 - Outbound EDI 990 to Customer', async ({ page }) => {
        const testcaseID = 'EDI-25169';
        const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
        //Create Load from Load Tender 204
        await test.step('Auto accept Load from Load Tender 204', async () => {
            await pages.homePage.clickOnLoadButton();
            await pages.loadsPage.clickOnEDI204LoadTender();
            await pages.edi204LoadTendersPage.filterBolNumber(bolNumber);
            //Get Load ID
            loadId = await pages.edi204LoadTendersPage.getLoadIDwithBolNumber(bolNumber);
            await console.log("Created Load ID is: " + loadId);
        });
        await test.step('Open Created Load', async () => {
            await pages.basePage.searchFromMainHeader(loadId);
        });
        //Validate Load Tab
        await test.step('Validate Load Tab', async () => {
            const actShipNumber = await pages.viewLoadPage.getShipNumber();
            await expect.soft(actShipNumber).toBe(bolNumber);
            const actSendAsID = await pages.viewLoadPage.getSendAsID();
            await expect.soft(actSendAsID).toBe(testData.senderAsID);
            const actSender204ID = await pages.viewLoadPage.getSender204ID();
            const expSender204ID = await testData.sender204ID.toString();
            await expect.soft(actSender204ID).toBe(expSender204ID);
            await expect(test.info().errors).toHaveLength(0);
            await console.log("Load Tab Verified");
        });
        //Validate Customers Tab
        await test.step('Validate Customer Tab', async () => {
            await pages.viewLoadPage.clickCustomerTab();
            const actCutomerName = await pages.viewLoadCustomerTabPage.getCustomerName();
            await expect.soft(actCutomerName).toBe(testData.customerName);
            await expect(test.info().errors).toHaveLength(0);
            await console.log("Customer Tab Verified");
        });
        //Validate Pick Tab
        await test.step('Validate Pick Tab', async () => {
            await test.step('Validate Pick Address', async () => {
                await pages.viewLoadPage.clickPickTab();
                const pickDetails = await pages.viewPickDetailsTabPage.getPickAddressDetails();
                await expect.soft(pickDetails.actPickOneEDIID).toBe(testData.pick1EDI);
                await expect.soft(pickDetails.actPickOneActualTime).toBe(testData.actualTimeP1);
                await expect.soft(pickDetails.actPickOneDeadlineTime).toBe(testData.actualTimeP2);
                await expect.soft(pickDetails.actPickOneName).toBe(testData.pick1Name);
                await expect.soft(pickDetails.actPickOneAddress).toBe(testData.pick1Address);
                await expect.soft(pickDetails.actPickOneCity).toBe(testData.pick1City);
                await expect.soft(pickDetails.actPickOneState).toBe(testData.pick1State);
                const pick1Zip = (await testData.pick1Zip).toString();
                expect.soft(pickDetails.actPickOneZip).toContain(pick1Zip);
                await expect(test.info().errors).toHaveLength(0);
                console.log("Pick Address Verified");
            });
            //Validate Pick Item Details
            await test.step('Validate Pick Item Details', async () => {
                const pickDetails = await pages.viewPickDetailsTabPage.getPickItemsDetails();
                await expect.soft(pickDetails.pickOneItemOnePO).toContain(await testData.pick1Item1PO.toString());
                await expect.soft(pickDetails.pickOneItemOneQty).toBe(await testData.pick1Item1Qty.toString());
                await expect.soft(pickDetails.pickOneItemOneWeight).toBe(await testData.pick1Item1Weight.toString());
                await expect.soft(pickDetails.pickOneItemTwoPO).toContain(await testData.pick1Item2PO.toString());
                await expect.soft(pickDetails.pickOneItemTwoQty).toBe(await testData.pick1Item2Qty.toString());
                await expect.soft(pickDetails.pickOneItemTwoWeight).toBe(await testData.pick1Item2Weight.toString());
                await expect(test.info().errors).toHaveLength(0);
                console.log("Pick Items Verified");
            });
        });
        //Validate Drop Tab
        await test.step('Validate Drop Tab', async () => {
            await test.step('Validate Drop Address', async () => {
                await pages.viewLoadPage.clickDropTab();
                const dropDetails = await pages.viewDropDetailsTabPage.verifyDropDetails();
                await expect.soft(dropDetails.actDropOneEDIID).toBe(testData.drop1EDI);
                await expect.soft(dropDetails.actDropOneActualTime).toBe(testData.drop1TimeD1);
                await expect.soft(dropDetails.actDropOneDeadlineTime).toBe(testData.drop1TimeD2);
                await expect.soft(dropDetails.actDropOneName).toBe(testData.drop1Name);
                await expect.soft(dropDetails.actDropOneAddress).toBe(testData.drop1Address);
                await expect.soft(dropDetails.actDropOneCity).toBe(testData.drop1City);
                await expect.soft(dropDetails.actDropOneState).toBe(testData.drop1State);
                const drop1Zip = (await testData.drop1Zip).toString();
                await expect.soft(dropDetails.actDropOneZip).toContain(drop1Zip);
                await expect(test.info().errors).toHaveLength(0);
                console.log("Drop Address Verified");
            });
            //Validate Drop Item Details
            await test.step('Validate Drop Item Details', async () => {
                const dropDetails = await pages.viewDropDetailsTabPage.getDropItemsDetails();
                await expect.soft(dropDetails.dropOneItemOnePO).toContain(await testData.drop1Item1PO.toString());
                await expect.soft(dropDetails.dropOneItemOneQty).toBe(await testData.drop1Item1Qty.toString());
                await expect.soft(dropDetails.dropOneItemOneWeight).toBe(await testData.drop1Item1Weight.toString());
                await expect.soft(dropDetails.dropOneItemTwoPO).toContain(await testData.drop1Item2PO.toString());
                await expect.soft(dropDetails.dropOneItemTwoQty).toBe(await testData.drop1Item2Qty.toString());
                await expect.soft(dropDetails.dropOneItemTwoWeight).toBe(await testData.drop1Item2Weight.toString());
                await expect(test.info().errors).toHaveLength(0);
                await console.log("Drop Items Verified");
            });
        });
        //validate EDI Tab
        await test.step('Validate EDI Tab', async () => {
            await pages.viewLoadPage.clickEDITab();
            await pages.viewLoadEDITabPage.validateLeadLevelStatuses(testData.customerName);
        });
        //Validate EDI Full LOG Page
        await test.step('Validate EDI Logs', async () => {
            const viewLoadEDITabPage = new ViewLoadEDITabPage(page);
            viewLoadEDITabPage.clickViewFullEDI990Log();
            const childTab = await switchToNewTab(page.context(), page);
            expect(await childTab.title()).toBe("BTMS - Admin");
            const ediLogPage = new EDILogPage(childTab);
            const outbound990Data = await dataConfigAPI.getEDIRawData(dataConfigAPI.outboundEdi990TruckLoad);
            const expEdi990RawData = await ediLogPage.updateOutboundEdiData(outbound990Data, bolNumber, loadId, true);
            await expect.soft(await ediLogPage.getEdiTextLocator()).toHaveText(expEdi990RawData);
            await childTab.close();
            await switchBackToOriginalTab(page);
            await expect(test.info().errors).toHaveLength(0);
            await console.log("EDI 990 Full Logs Verified");
        });
    });
    test('Case Id: 25170 - Outbound EDI 204 to Carrier', async ({ page }) => {
        const testcaseID = 'EDI-25170';
        const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
        await test.step('Add carrier to Truck Load', async () => {
            await pages.basePage.searchFromMainHeader(loadId);
            await pages.viewLoadPage.clickEditButton();
            await commonReusables.dialogHandler(page);
            await pages.viewLoadPage.clickCustomerTab();
            await pages.editLoadPage.selectCarrierTab();
            await pages.editLoadCarrierTabPage.selectCarrier1(await testData.carrier1Number);
            await pages.editLoadPage.clickLoadTab();
            await pages.editLoadLoadTabPage.selectRateCardValue("SPOT");
            await pages.editLoadLoadTabPage.uncheckAutoLoadTenderCheckbox();
            await commonReusables.alertAcceptWithText(page, "Status has been set to BOOKED");
            await pages.editLoadPage.clickSaveButton();
            await page.waitForLoadState("networkidle");
            await console.log("Load Edited Successfully: Status set to BOOKED");
        });
        //Send EDI Tender For carrier
        await test.step('Send EDI Tender For Carrier', async () => {
            await pages.viewLoadPage.clickCarrierTab();
            // await pages.viewLoadCarrierTabPage.clickCarrier1SendEDITenderButton();
            await pages.viewLoadCarrierTabPage.clickSendEDITenderButton(CARRIER_TABS.CARRIER_1);
            await console.log("EDI Tender Sent Successfully for carrier");
        });
        //Validate EDI Tab after sending EDI Tender
        await test.step('Validate EDI Tab after sending EDI Tender', async () => {
            await pages.viewLoadPage.clickEDITab();
            await pages.viewLoadEDITabPage.validateLoadLevelEDIStatus(testData.carrier1Name, testData.carrier1EdiType, testData.carrier1EdiInOut, testData.carrier1EdiStatus);
            await expect(test.info().errors).toHaveLength(0);
            await console.log("EDI Tab Verified after sending EDI Tender for carrier");
           
        });
        await test.step('Validate Carrier 1 Full EDI Logs', async () => {
            const viewLoadEDITabPage = new ViewLoadEDITabPage(page);
            viewLoadEDITabPage.clickEDIFullLogLink(testData.carrier1Name);
            const childTab = await switchToNewTab(page.context(), page);
            expect(await childTab.title()).toBe("BTMS - Admin");
            const ediLogPage = new EDILogPage(childTab);
            let edi204CarrierData = await dataConfigAPI.getEDIRawData(dataConfigAPI.outboundEdi204TruckLoad);
            if(userName.toUpperCase() === "SVC.TESTAUTOMATION") {
                const updatedName = "SVC_TESTAUTOMATION";
                edi204CarrierData = edi204CarrierData.replace(/\{UserName\}/g, updatedName);
            }
            edi204CarrierData = edi204CarrierData.replace(/\{UserName\}/g, await userName.toUpperCase());
            const expEdi204CarrierData = await dynamicDataAPI.updateEdiRawData(edi204CarrierData, bolNumber, loadId, "", "", true, true,"","");
            await expect(await ediLogPage.getEdiTextLocator()).toHaveText(expEdi204CarrierData);
            await childTab.close();
            await switchBackToOriginalTab(page);
            await console.log("EDI Outbound 204 Logs Verified for Carrier: " + testData.carrier1Name);
        });
    });
    test('Case Id: 25171 - Inbound EDI 990 from Carrier', async ({ page }) => {
        const testcaseID = 'EDI-25171';
        const testData = await dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
        //Send Inbound EDI 990 from Carrier
        test.step('Send Inbound EDI 990 Request', async () => {
            const rawData = await dataConfigAPI.getEDIRawData(dataConfigAPI.inboundEdi990TruckLoad);
            response = await apiRequests.sendEDI990RequestTruckLoad(rawData, loadId);
            await console.log('Status Code:', response.status);
            await expect(response.status).toBe(201);
        });
        //Validate EDI Tab after receiving EDI 990 from Carrier
        await test.step('Validate EDI Tab after receiving EDI 990 from Carrier', async () => {
            await pages.basePage.searchFromMainHeader(loadId);
            await pages.viewLoadPage.clickEDITab();
            await pages.viewLoadEDITabPage.validateEDIDetails(testData.carrier1Name, EDI_CODE.EDI_990, EDI_IN_OUT.IN, EDI_STATUS.ACCEPTED);
            await pages.viewLoadEDITabPage.validateEDIDetails(testData.customerName, EDI_CODE.EDI_990, EDI_IN_OUT.OUT, EDI_STATUS.AG);
            await expect(test.info().errors).toHaveLength(0);
            await console.log("EDI Tab Verified after receiving EDI 990 from carrier");
        });
        await test.step('Validate Customer "AG" EDI 214 Full Log', async () => {
            const viewLoadEDITabPage = new ViewLoadEDITabPage(page);
            await viewLoadEDITabPage.clickEDIFullLogLinkCommon(testData.customerName, EDI_STATUS.AG);
            const childTab = await switchToNewTab(page.context(), page);
            expect(await childTab.title()).toBe("BTMS - Admin");
            const ediLogPage = new EDILogPage(childTab);
            const edi214OutData = await dataConfigAPI.getEDIRawData(dataConfigAPI.outboundEdi214AGTruckLoad);
            const expEdi214OutData = await dynamicDataAPI.updateEdi214Data(edi214OutData, bolNumber, loadId, '', '', '', '');
            await expect(await ediLogPage.getEdiTextLocator()).toHaveText(expEdi214OutData);
            await childTab.close();
            await switchBackToOriginalTab(page);
            await console.log("EDI Log Page Verified for Customer: " + testData.customerName);
        });
    });
    test('Case Id: 25172 - Inbound EDI 214 from Carrier', async ({ page }) => {
        const testcaseID = 'EDI-25172';
        const testData = await dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
        await test.step('Allow send auto updates', async () => {
            await pages.basePage.searchFromMainHeader(loadId);
            await pages.viewLoadPage.clickEditButton();
            await pages.editLoadLoadTabPage.checkAllowAutoStatusUpdateCheckbox();
            await pages.editLoadPage.clickOnCarrierTab();
            await pages.editLoadCarrierTabPage.disableGPSTrackingifEnabled(); 
            await pages.editLoadPage.clickSaveButton();
            await console.log("Load Edited Successfully: Unchecked Allow Auto Status Update and Disabled GPS Tracking if enabled");  
        });
        await test.step('Send Inbound EDI 214 Request', async () => {
            const inboundEdi214 = await dataConfigAPI.getEDIRawData(dataConfigAPI.inboundEdi214TruckLoad);
            const date = await commonReusables.getDate("today", "YYYYMMDD");
            response = await apiRequests.sendEDI214_213RequestTruckLoad(inboundEdi214, EDI_CODE.EDI_214, loadId, date, bolNumber);
            await console.log('Status Code:', response.status);
            await expect(response.status).toBe(201);
            await console.log("Inbound EDI 214 from Carrier Sent Successfully");
        });
        await test.step('Validate EDI Tab after receiving EDI 214 from Carrier', async () => {
            await commonReusables.reloadPage(page);
            await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.AT_ORIGIN);
            await pages.viewLoadPage.clickEDITab();
            await pages.viewLoadEDITabPage.validateEDIDetails(testData.carrier1Name, EDI_CODE.EDI_214, EDI_IN_OUT.IN, EDI_STATUS.X3);
            await pages.viewLoadEDITabPage.validateEDIDetails(testData.customerName, EDI_CODE.EDI_214, EDI_IN_OUT.OUT, EDI_STATUS.X3);
            await expect(test.info().errors).toHaveLength(0);
            await console.log("EDI Tab Verified after receiving EDI 214 from carrier");
        });
    });
    test('Case Id: 25173 - Inbound EDI 213 from Customer', async () => {
        const testcaseID = 'EDI-25173';
        const testData = await dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
        await test.step('Send Inbound EDI 213 Request', async () => {
            const inboundEdi213 = await dataConfigAPI.getEDIRawData(dataConfigAPI.inboundEdi213TruckLoad);
            response = await apiRequests.sendEDI214_213RequestTruckLoad(inboundEdi213, EDI_CODE.EDI_213, loadId, "", bolNumber);
            await console.log('Status Code:', response.status);
            await expect(response.status).toBe(201);
            await console.log("Inbound EDI 213 from Customer Sent Successfully");
        });
        await test.step('Validate EDI 213 after receiving EDI 213 from Customer', async () => {
            await pages.basePage.searchFromMainHeader(loadId);
            await pages.viewLoadPage.clickEDITab();
            await pages.viewLoadEDITabPage.validateEDIDetails(testData.customerName, EDI_CODE.EDI_213, EDI_IN_OUT.IN, EDI_STATUS.UNKNOWN); 
            await console.log("EDI Tab Verified after receiving EDI 213 from Customer");
        });
    });
    test('Case Id: 25174 - Outbound EDI 214 to Customer (triggered by inbound EDI 213)', async () => {
        const testcaseID = 'EDI-25174';
        const testData = await dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
        await test.step('Validate EDI 214 Outbound after receiving EDI 213 from Customer', async () => {
            await pages.basePage.searchFromMainHeader(loadId);
            await pages.viewLoadPage.clickEDITab();
            const AGCount = await pages.viewLoadEDITabPage.getEDIFullLogLinkCommonElement(testData.customerName, EDI_STATUS.AG);
            await expect(AGCount).toHaveCount(2);
            await console.log("Validate EDI 214 Outbound with 'AG' Status after receiving EDI 213 from Customer")
        });
    });
    test('Case Id: 25175 - Inbound EDI 824 from Customer', async ({ page }) => {
        const testcaseID = 'EDI-25175';
        const testData = await dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
        await test.step('Send Inbound EDI 824 Request', async () => {
            const response = await apiRequests.send824Request(await dataConfigAPI.inboundEdi824TruckLoad, loadId, '', '', '', '', bolNumber);
            await console.log('Status Code API 824: ', response.status);
            await expect(response.status).toBe(201);
            await console.log("EDI 824 Request Sent Successfully");
        });
        await test.step('Validate EDI 824 Inbound after receiving EDI 824 from Customer', async () => {
            await pages.basePage.searchFromMainHeader(loadId);
            await pages.viewLoadPage.clickEDITab();
            await pages.viewLoadEDITabPage.validateEDIDetails(testData.customerName, EDI_CODE.EDI_824, EDI_IN_OUT.IN, EDI_STATUS.REJECTED);
            await console.log("EDI Tab Verified after receiving EDI 824 from Customer");
        });
        await test.step('Validate Customer "REJECTED" EDI 824 Full Log', async () => {
            const viewLoadEDITabPage = new ViewLoadEDITabPage(page);
            await viewLoadEDITabPage.clickEDIFullLogLinkCommon(testData.customerName, EDI_STATUS.REJECTED, 1);
            const childTab = await switchToNewTab(page.context(), page);
            await expect(await childTab.title()).toBe("BTMS - Admin");
            const ediLogPage = new EDILogPage(childTab);
            await ediLogPage.clickEdi824ReviewedButton();
            await ediLogPage.validateEDI824();
            await expect(test.info().errors).toHaveLength(0);
            await childTab.close();
            await switchBackToOriginalTab(page);
            await console.log("EDI 824 Reviewed Successfully");
        });
    });
});