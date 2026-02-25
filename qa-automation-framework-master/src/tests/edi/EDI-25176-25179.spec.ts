import apiRequests from "@api/apiRequests";
import dataConfig from "@config/dataConfig";
import dataConfigAPI from "@config/dataConfigAPI";
import dynamicDataAPI from "@config/dynamicDataAPI";
import userSetup from "@loginHelpers/userSetup";
import EDILogPage from "@pages/loads/viewLoadPage/EDILogPage";
import ViewLoadEDITabPage from "@pages/loads/viewLoadPage/ViewLoadEDITabPage";
import test, { expect } from "@playwright/test";
import banyanHelper from "@utils/banyanUtils/banyanHealper";
import { PageManager } from "@utils/PageManager";
import { switchBackToOriginalTab, switchToNewTab } from "@utils/tabHelper";
test.describe.configure({ retries: 2 });
test.describe.serial('LTL/ELTL API Test Suite', { tag: ['@at_edi', '@tporegression', '@smoke'] }, async () => {
    let loadId: string;
    let pages: PageManager;
    let response: any;
    let bolNumber: string;
    
    test.beforeEach(async ({ page }) => {
        pages = new PageManager(page);
        await pages.btmsLoginPage.BTMSLogin(userSetup.ediUserMarmaxx);
    });
    test('Case Id: 25176 - Inbound EDI 204(original) from Customer', async () => {
        const testcaseID = 'EDI-25176';
        const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
        await pages.homePage.clickOnFinanceButton();
        await pages.financePage.searchCustomerIDViaFinance(testData.customerMasterID);
        await pages.customerMasterListPage.clickOnCustomerName(testData.customerName);
        await banyanHelper.enableDisableAutoRate_Dispatch(pages, true);

        // Create API Post request to send EDI 204S
        bolNumber = await dynamicDataAPI.getBolNumber() + '3';
        await console.log('Generated BOL Number:', bolNumber);
        const rawdata = await dataConfigAPI.getEDIRawData(dataConfigAPI.inboundEdi204NewHydrofarm)
        const updatedRawData = await dynamicDataAPI.updateEdiRawData(rawdata, bolNumber, '', '', '', true, false, '', '');
        await console.log('Updated EDI 204 Data: ', updatedRawData);
        ({ response } = await apiRequests.sendEDI204Request(updatedRawData));
        await console.log('Sent EDI with BOL Number:', bolNumber);
        await console.log('Status Code:', response.status);
        await expect(response.status).toBe(201);
    });
    test('Case Id: 25177 - Outbound EDI 990(original) to Customer', async ({ page }) => {
        const testcaseID = 'EDI-25177';
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
        await test.step('Wait for load status to be Dispatched & Validate Automation Alerts', async () => {
            await pages.viewLoadPage.waitTillLoadIsDispatched(30);
            await pages.viewLoadPage.validateAutoRateSuccess();
            await pages.viewLoadPage.validateAutoDispatchSuccess();
            await expect(test.info().errors).toHaveLength(0);
            await console.log("Load is Dispatched & Validated Automation Alerts: Auto Rate Success & Auto Dispatch Success");
        });
        //Validate Load Tab
        await test.step('Validate Load Tab', async () => {
            const actShipNumber = await pages.viewLoadPage.getShipNumber();
            await expect.soft(actShipNumber).toBe(testData.ship.toString());
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
            const actCustomerName = await pages.viewLoadCustomerTabPage.getCustomerName();
            await expect.soft(actCustomerName).toBe(testData.customerName);
            await expect(test.info().errors).toHaveLength(0);
            await console.log("Customer Tab Verified");
        });
        //Validate Pick Tab
        await test.step('Validate Pick Tab', async () => {
            await test.step('Validate Pick Address', async () => {
                await pages.viewLoadPage.clickPickTab();
                const pickDetails = await pages.viewPickDetailsTabPage.getPickAddressDetails();
                const actPickOneActualTime = await pickDetails.actPickOneActualTime.replace(":", '');
                const actPickOneDeadlineTime = await pickDetails.actPickOneDeadlineTime.replace(":", '');
                await expect.soft(actPickOneActualTime).toBe(testData.actualTimeP1);
                await expect.soft(actPickOneDeadlineTime).toBe(testData.actualTimeP2);
                await expect.soft(pickDetails.actPickOneName).toBe(testData.pick1Name);
                await expect.soft(pickDetails.actPickOneAddress).toBe(testData.pick1Address);
                await expect.soft(pickDetails.actPickOneCity).toBe(testData.pick1City);
                await expect.soft(pickDetails.actPickOneState).toBe(testData.pick1State);
                const pick1Zip = (await testData.pick1Zip).toString();
                expect.soft(pickDetails.actPickOneZip).toContain(pick1Zip);
                await expect(test.info().errors).toHaveLength(0);
                console.log("Pick Address Verified");
            });
            //Validate Pick Contact
            await test.step('Validate Pick Contact', async () => {
                const pickDetails = await pages.viewPickDetailsTabPage.getPickContactDetails();
                await expect.soft(pickDetails.actPickOneContact).toBe(testData.pick1Contact);
                await expect.soft(pickDetails.actPickOneEmail).toBe(testData.pick1Email);
                await expect.soft(pickDetails.actPickOnePhone).toBe(testData.pick1Phone);
                await expect(test.info().errors).toHaveLength(0);
                console.log("Pick Contact Verified");
            });
            //Validate Pick Item Details
            await test.step('Validate Pick Item Details', async () => {
                const pickDetails = await pages.viewPickDetailsTabPage.getPickItemsDetails();
                await expect.soft(pickDetails.pickOneItemOnePO.toUpperCase()).toContain(await testData.pick1Item1PO.toUpperCase());
                await expect.soft(pickDetails.pickOneItemOneQty).toBe(await testData.pick1Item1Qty.toString());
                await expect.soft(pickDetails.pickOneItemOneWeight).toBe(await testData.pick1Item1Weight.toString());

                await expect.soft(pickDetails.pickOneItemTwoPO.toUpperCase()).toContain(await testData.pick1Item2PO.toUpperCase());
                await expect.soft(pickDetails.pickOneItemTwoQty).toBe(await testData.pick1Item2Qty.toString());
                await expect.soft(pickDetails.pickOneItemTwoWeight).toBe(await testData.pick1Item2Weight.toString());

                const expItem3Data = await pages.viewPickDetailsTabPage.getPickItemsThree();
                await expect.soft(expItem3Data.pickItemPO.toUpperCase()).toContain(await testData.pick1Item3PO.toUpperCase());
                await expect.soft(expItem3Data.pickItemQty).toBe(await testData.pick1Item3Qty.toString());
                await expect.soft(expItem3Data.pickItemWeight).toBe(await testData.pick1Item3Weight.toString());

                const expItem4Data = await pages.viewPickDetailsTabPage.getPickItemsFour();
                await expect.soft(expItem4Data.pickItemPO.toUpperCase()).toContain(await testData.pick1Item4PO.toUpperCase());
                await expect.soft(expItem4Data.pickItemQty).toBe(await testData.pick1Item4Qty.toString());
                await expect.soft(expItem4Data.pickItemWeight).toBe(await testData.pick1Item4Weight.toString());
                await expect(test.info().errors).toHaveLength(0);
                console.log("Pick Items Verified");
            });
            //Validate Drop Tab
            await test.step('Validate Drop Tab', async () => {
                await test.step('Validate Drop Address', async () => {
                    await pages.viewLoadPage.clickDropTab();
                    const dropDetails = await pages.viewDropDetailsTabPage.verifyDropDetails();
                    const actDropOneActualTime = await dropDetails.actDropOneActualTime.replace(":", '');
                    const actDropOneDeadlineTime = await dropDetails.actDropOneDeadlineTime.replace(":", '');
                    await expect.soft(actDropOneActualTime).toBe(testData.drop1TimeD1);
                    await expect.soft(actDropOneDeadlineTime).toBe(testData.drop1TimeD2);
                    await expect.soft(dropDetails.actDropOneName).toBe(testData.drop1Name);
                    await expect.soft(dropDetails.actDropOneAddress).toBe(testData.drop1Address);
                    await expect.soft(dropDetails.actDropOneCity).toBe(testData.drop1City);
                    await expect.soft(dropDetails.actDropOneState).toBe(testData.drop1State);
                    const drop1Zip = (await testData.drop1Zip).toString();
                    await expect.soft(dropDetails.actDropOneZip).toContain(drop1Zip);
                    await expect(test.info().errors).toHaveLength(0);
                    console.log("Drop Address Verified");
                });
                //Validate Drop Contact
                await test.step('Validate Drop Contact', async () => {
                    const dropDetails = await pages.viewDropDetailsTabPage.getDropContactDetails();
                    await expect.soft(dropDetails.actDropOneContact).toBe(testData.drop1Contact);
                    await expect.soft(dropDetails.actDropOneEmail).toBe(testData.drop1Email);
                    await expect.soft(dropDetails.actDropOnePhone).toBe(testData.drop1Phone);
                    await expect(test.info().errors).toHaveLength(0);
                    console.log("Drop Contact Verified");
                });
                //Validate Drop Item Details
                await test.step('Validate Drop Item Details', async () => {
                    const dropDetails = await pages.viewDropDetailsTabPage.getDropItemOne();
                    await expect.soft(dropDetails.dropOneItemOneQty).toBe(testData.drop1Item1Qty.toString());
                    await expect.soft(dropDetails.dropOneItemOneWeight).toBe(testData.drop1Item1Weight.toString());
                    await expect(test.info().errors).toHaveLength(0);
                    await console.log("Drop Items Verified");
                });
            });
            //validate EDI Tab
            await test.step('Validate EDI Tab', async () => {
                await pages.viewLoadPage.clickEDITab();
                await pages.viewLoadEDITabPage.validateLeadLevelStatuses(testData.customerName);
                console.log("EDI Tab Verified");
            });
            //Validate EDI Full LOG Page
            await test.step('Validate EDI Logs', async () => {
                const viewLoadEDITabPage = new ViewLoadEDITabPage(page);
                viewLoadEDITabPage.clickViewFullEDI990Log();
                const childTab = await switchToNewTab(page.context(), page);
                expect(await childTab.title()).toBe("BTMS - Admin");
                const ediLogPage = new EDILogPage(childTab);
                const edi990RawData = await dataConfigAPI.getEDIRawData(dataConfigAPI.outboundEdi990NewHydrofarm);
                const expEdi990RawData = await ediLogPage.updateOutboundEdiData(edi990RawData, bolNumber, loadId, false);
                await expect.soft(await ediLogPage.getEdiTextLocator()).toHaveText(expEdi990RawData);
                await childTab.close();
                await switchBackToOriginalTab(page);
                await expect(test.info().errors).toHaveLength(0);
                await console.log("EDI 990 Log Page Verified");
            });
        });

    });
    test('Case Id: 25178 - Inbound EDI 204(change) from Customer', async () => {
        // const testcaseID = 'EDI-25178';
        const rawdata = await dataConfigAPI.getEDIRawData(dataConfigAPI.inboundEdi204ChangeHydrofarm)
        const updatedRawData = await dynamicDataAPI.updateEdiRawData(rawdata, bolNumber, '', '', '', true, false, '', '');
        await console.log('Updated EDI 204 Data: ', updatedRawData);
        ({ response } = await apiRequests.sendEDI204Request(updatedRawData));
        await console.log('Sent EDI with BOL Number:', bolNumber);
        await console.log('Status Code:', response.status);
        await expect(response.status).toBe(201);
    });
    test('Case Id: 25179 - Outbound EDI 990(Change) to Customer', async ({ page }) => {
        const testcaseID = 'EDI-25179';
        const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
        //Validate Load Tab after EDI 204 Change
        await test.step('Open Load', async () => {
            await pages.basePage.searchFromMainHeader(loadId);
        });
        //Validate Load Tab
        await test.step('Validate Load Tab', async () => {
            const actShipNumber = await pages.viewLoadPage.getShipNumber();
            await expect.soft(actShipNumber).toBe(testData.ship.toString());
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
            const actCustomerName = await pages.viewLoadCustomerTabPage.getCustomerName();
            await expect.soft(actCustomerName).toBe(testData.customerName);
            await expect(test.info().errors).toHaveLength(0);
            await console.log("Customer Tab Verified");
        });
        //Validate Pick Tab
        await test.step('Validate Pick Tab', async () => {
            await test.step('Validate Pick Address', async () => {
                await pages.viewLoadPage.clickPickTab();
                const pickDetails = await pages.viewPickDetailsTabPage.getPickAddressDetails();
                const actPickOneActualTime = await pickDetails.actPickOneActualTime.replace(":", '');
                const actPickOneDeadlineTime = await pickDetails.actPickOneDeadlineTime.replace(":", '');
                await expect.soft(actPickOneActualTime).toBe(testData.actualTimeP1);
                await expect.soft(actPickOneDeadlineTime).toBe(testData.actualTimeP2);
                await expect.soft(pickDetails.actPickOneName).toBe(testData.pick1Name);
                await expect.soft(pickDetails.actPickOneAddress).toBe(testData.pick1Address);
                await expect.soft(pickDetails.actPickOneCity).toBe(testData.pick1City);
                await expect.soft(pickDetails.actPickOneState).toBe(testData.pick1State);
                const pick1Zip = (await testData.pick1Zip).toString();
                expect.soft(pickDetails.actPickOneZip).toContain(pick1Zip);
                await expect(test.info().errors).toHaveLength(0);
                console.log("Pick Address Verified");
            });
            //Validate Pick Contact
            await test.step('Validate Pick Contact', async () => {
                const pickDetails = await pages.viewPickDetailsTabPage.getPickContactDetails();
                await expect.soft(pickDetails.actPickOneContact).toBe(testData.pick1Contact);
                await expect.soft(pickDetails.actPickOneEmail).toBe(testData.pick1Email);
                await expect.soft(pickDetails.actPickOnePhone).toBe(testData.pick1Phone);
                await expect(test.info().errors).toHaveLength(0);
                console.log("Pick Contact Verified");
            });
            //Validate Pick Item Details
            await test.step('Validate Pick Item Details', async () => {
                const pickDetails = await pages.viewPickDetailsTabPage.getPickItemsDetails();
                await expect.soft(pickDetails.pickOneItemOnePO.toUpperCase()).toContain(await testData.pick1Item1PO.toUpperCase());
                await expect.soft(pickDetails.pickOneItemOneQty).toBe(await testData.pick1Item1Qty.toString());
                await expect.soft(pickDetails.pickOneItemOneWeight).toBe(await testData.pick1Item1Weight.toString());

                await expect.soft(pickDetails.pickOneItemTwoPO.toUpperCase()).toContain(await testData.pick1Item2PO.toUpperCase());
                await expect.soft(pickDetails.pickOneItemTwoQty).toBe(await testData.pick1Item2Qty.toString());
                await expect.soft(pickDetails.pickOneItemTwoWeight).toBe(await testData.pick1Item2Weight.toString());

                const expItem3Data = await pages.viewPickDetailsTabPage.getPickItemsThree();
                await expect.soft(expItem3Data.pickItemPO.toUpperCase()).toContain(await testData.pick1Item3PO.toUpperCase());
                await expect.soft(expItem3Data.pickItemQty).toBe(await testData.pick1Item3Qty.toString());
                await expect.soft(expItem3Data.pickItemWeight).toBe(await testData.pick1Item3Weight.toString());

                const expItem4Data = await pages.viewPickDetailsTabPage.getPickItemsFour();
                await expect.soft(expItem4Data.pickItemPO.toUpperCase()).toContain(await testData.pick1Item4PO.toUpperCase());
                await expect.soft(expItem4Data.pickItemQty).toBe(await testData.pick1Item4Qty.toString());
                await expect.soft(expItem4Data.pickItemWeight).toBe(await testData.pick1Item4Weight.toString());
                await expect(test.info().errors).toHaveLength(0);
                console.log("Pick Items Verified");
            });
            //Validate Drop Tab
            await test.step('Validate Drop Tab', async () => {
                await test.step('Validate Drop Address', async () => {
                    await pages.viewLoadPage.clickDropTab();
                    const dropDetails = await pages.viewDropDetailsTabPage.verifyDropDetails();
                    const actDropOneActualTime = await dropDetails.actDropOneActualTime.replace(":", '');
                    const actDropOneDeadlineTime = await dropDetails.actDropOneDeadlineTime.replace(":", '');
                    await expect.soft(actDropOneActualTime).toBe(testData.drop1TimeD1);
                    await expect.soft(actDropOneDeadlineTime).toBe(testData.drop1TimeD2);
                    await expect.soft(dropDetails.actDropOneName).toBe(testData.drop1Name);
                    await expect.soft(dropDetails.actDropOneAddress).toBe(testData.drop1Address);
                    await expect.soft(dropDetails.actDropOneCity).toBe(testData.drop1City);
                    await expect.soft(dropDetails.actDropOneState).toBe(testData.drop1State);
                    const drop1Zip = (await testData.drop1Zip).toString();
                    await expect.soft(dropDetails.actDropOneZip).toContain(drop1Zip);
                    await expect(test.info().errors).toHaveLength(0);
                    console.log("Drop Address Verified");
                });
                //Validate Drop Contact
                await test.step('Validate Drop Contact', async () => {
                    const dropDetails = await pages.viewDropDetailsTabPage.getDropContactDetails();
                    await expect.soft(dropDetails.actDropOneContact).toBe(testData.drop1Contact);
                    await expect.soft(dropDetails.actDropOneEmail).toBe(testData.drop1Email);
                    await expect.soft(dropDetails.actDropOnePhone).toBe(testData.drop1Phone);
                    await expect(test.info().errors).toHaveLength(0);
                    console.log("Drop Contact Verified");
                });
                //Validate Drop Item Details
                await test.step('Validate Drop Item Details', async () => {
                    const dropDetails = await pages.viewDropDetailsTabPage.getDropItemOne();
                    await expect.soft(dropDetails.dropOneItemOneQty).toBe(testData.drop1Item1Qty.toString());
                    await expect.soft(dropDetails.dropOneItemOneWeight).toBe(testData.drop1Item1Weight.toString());
                    await expect(test.info().errors).toHaveLength(0);
                    await console.log("Drop Items Verified");
                });
            });
            //validate EDI Tab
            await test.step('Validate EDI Tab', async () => {
                await pages.viewLoadPage.clickEDITab();
                await pages.viewLoadEDITabPage.validateLeadLevelStatuses(testData.customerName);
                console.log("EDI Tab Verified");
            });
            //Validate EDI Full LOG Page
            await test.step('Validate EDI Logs', async () => {
                const viewLoadEDITabPage = new ViewLoadEDITabPage(page);
                viewLoadEDITabPage.clickViewFullEDI990Log();
                const childTab = await switchToNewTab(page.context(), page);
                expect(await childTab.title()).toBe("BTMS - Admin");
                const ediLogPage = new EDILogPage(childTab);
                const edi990RawData = await dataConfigAPI.getEDIRawData(dataConfigAPI.outboundEdi990ChangeHydrofarm);
                const expEdi990RawData = await ediLogPage.updateOutboundEdiData(edi990RawData, bolNumber, loadId, false);
                await expect.soft(await ediLogPage.getEdiTextLocator()).toHaveText(expEdi990RawData);
                await childTab.close();
                await switchBackToOriginalTab(page);
                await expect(test.info().errors).toHaveLength(0);
                await console.log("EDI 990 change Log Page Verified");
            });
        });
    });
});