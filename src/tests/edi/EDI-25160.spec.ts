import { test, expect} from '@playwright/test';
import dataConfig from '@config/dataConfig';
import apiRequests from '@api/apiRequests';
import EDILogPage from '@pages/loads/viewLoadPage/EDILogPage';
import { switchToNewTab, switchBackToOriginalTab } from '@utils/tabHelper';
import dataConfigAPI from '@config/dataConfigAPI';
import { PageManager } from '@utils/PageManager';
import dynamicDataAPI from '@config/dynamicDataAPI';
import commonReusables from '@utils/commonReusables';
import ViewLoadEDITabPage from '@pages/loads/viewLoadPage/ViewLoadEDITabPage';
import userSetup from '@loginHelpers/userSetup';
import ediHelper from '@utils/ediUtils/ediHelper';

const testcaseID = 'EDI-25160';
const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);
test.describe.configure({ retries: 3 });
test.describe.serial('Intermodal Load API Test Suite', { tag: ['@at_edi', '@tporegression', '@smoke'] }, () => {
  let loadId: string;
  let waybillNumber: string;
  let pages: PageManager;
  let response: any;
  let trailerNumber: string;
  let bolNumber: string;
  let hours: string;
  let minutes: string;
  test.beforeEach(async ({ page }) => {
      pages = new PageManager(page);
      await pages.btmsLoginPage.BTMSLogin(userSetup.ediUserMarmaxx);
    });
  test('Case Id: 25160 - Inbound EDI 204 from Customer', async ({ page }) => {
    //Setup Customer PreCondition
    await test.step('Setup Customer PreCondition', async () => {
      await ediHelper.disableAutoOverlay(page, testData.customerName);
      await pages.viewCustomerPage.clickHomeButton();
      await page.waitForLoadState("networkidle");
    });
    // Create API Post request to send EDI 204S
    minutes = await commonReusables.getCurrentESTTime("minute");
    hours = await commonReusables.getCurrentESTTime("hour");
    trailerNumber = await dynamicDataAPI.generateTrailerNumber();
    bolNumber = await dynamicDataAPI.getBolNumber() + '1';
    await console.log('Generated BOL Number:', bolNumber);
    await console.log('Generated Trailer Number:', trailerNumber);
    const updatedRawData = await dynamicDataAPI.updateEdi204IntermodalRawData(dataConfigAPI.edi204RawData, bolNumber, hours, minutes);
    ({ response } = await apiRequests.sendEDI204Request(updatedRawData));
    await console.log('Sent EDI with BOL Number:', bolNumber);
    await console.log('Status Code:', response.status);
    await expect(response.status).toBe(201);
  });
  test('Case Id: 25161 - Outbound EDI 990 to Customer', async ({ page }) => {
    //Create Load from Load Tender 204
    await test.step('Create Load from Load Tender 204', async () => {
      await pages.homePage.clickOnLoadButton();
      await pages.loadsPage.clickOnEDI204LoadTender();
      await pages.edi204LoadTendersPage.filterBolNumber(bolNumber);
      await pages.edi204LoadTendersPage.clickRowWithBolNumber(bolNumber);
      await pages.loadTender204Page.overrideCustomerID(testData.customerMasterID);
      await pages.loadTender204Page.acceptLoadTender();
    });
    //Validate Load Tab
    await test.step('Validate Load Tab', async () => {
      const actShipNumber = await pages.viewLoadPage.getShipNumber();
      await expect.soft(actShipNumber).toBe(testData.ship);
      const actSendAsID = await pages.viewLoadPage.getSendAsID();
      await expect.soft(actSendAsID).toBe(testData.senderAsID);
      const actSender204ID = await pages.viewLoadPage.getSender204ID();
      const expSender204ID = await testData.sender204ID.toString();
      await expect.soft(actSender204ID).toBe(expSender204ID);
      await expect(test.info().errors).toHaveLength(0);
      await console.log("Load Tab Verified");
    });
    //Get Load ID
    loadId = await test.step('Get Load ID', async () => {
      loadId = await pages.viewLoadPage.getLoadID();
      return loadId;
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
        await expect.soft(pickDetails.actPickOneActualTime).toBe(await `${hours}:${minutes}`);
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
        await expect.soft(dropDetails.actDropOneActualTime).toBe(`${hours}:${minutes}`);
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
      const edi990RawData = await dataConfigAPI.getEDIRawData(dataConfigAPI.edi990RawData);
      const expEdi990RawData = await ediLogPage.updateOutboundEdiData(edi990RawData, bolNumber, loadId, false);
      await expect.soft(await ediLogPage.getEdiTextLocator()).toHaveText(expEdi990RawData);
      await childTab.close();
      await switchBackToOriginalTab(page);
      await expect(test.info().errors).toHaveLength(0);
      await console.log("EDI 990 Log Page Verified");
    });
  });
  test('Case Id: 25162 - Outbound EDI 204 to Drayman', async ({ page }) => {
    await test.step('Create Complete Intermodal Load', async () => {
      await pages.basePage.searchFromMainHeader(loadId);
      await pages.viewLoadPage.clickEditButton();
      await pages.viewLoadPage.clickCustomerTab();
      await pages.editLoadCarrierTabPage.clickAddCarrier();
      await pages.editLoadPage.clickLoadTab();
      await pages.editLoadPage.selectCarrierTab();
      await pages.editLoadCarrierTabPage.selectMoveTypeCarr1(MOVE_TYPE.ORIGIN_DRAY);
      await pages.editLoadCarrierTabPage.selectCarrier1(await testData.carrier1Number);
      await pages.editLoadPage.clickLoadTab();
      await pages.editLoadCarrierTabPage.clickAddCarrier();
      await pages.editLoadPage.clickCarrier2Tab();
      await pages.editLoadCarrierTabPage.selectMoveTypeCarr2(MOVE_TYPE.RAIL);
      await pages.editLoadCarrierTabPage.selectCarrier2(await testData.carrier2Number);
      await pages.editLoadCarrierTabPage.enterContainerNumber(await testData.containerCode, trailerNumber.toString());
      await pages.editLoadRailTabPage.enterItem1Details(
        await testData.item1Qty,
        await testData.item1Type,
        await testData.stcc,
        await testData.item1Weight);
      await pages.editLoadRailTabPage.enterRoutingDetails(
        await testData.spq,
        await testData.service,
        await testData.rrPlan,
        await testData.cofc_Tofc,
        await testData.carrier2Stop1,
        await testData.carrier2Stop2);
      await pages.editLoadRailTabPage.selectRouteAndNotifyParty(await testData.routeCode, await testData.notifyParty);
      await pages.editLoadRailTabPage.selectBeneficialOwner();
      await pages.editLoadPage.clickCarrier3Tab();
      await pages.editLoadCarrierTabPage.selectMoveTypeCarr3(MOVE_TYPE.DESTINATION_DRAY);
      await pages.editLoadCarrierTabPage.selectCarrier3(await testData.carrier3Number);
      await pages.editLoadPage.clickLoadTab();
      await pages.editLoadLoadTabPage.selectRateCardValue("SPOT");
      await pages.editLoadLoadTabPage.uncheckAutoLoadTenderCheckbox();
      await commonReusables.alertAcceptWithText(page, "Status has been set to BOOKED");
      await pages.editLoadPage.clickSaveButton();
      await page.waitForLoadState("networkidle");
      await console.log("Load Edited Successfully: Status set to BOOKED");
    });
    //Send EDI Tender For Origin Dray, Rail and Destination Dray
    await test.step('Send EDI Tender For Origin Dray, Rail and Destination Dray', async () => {
      await pages.viewLoadPage.clickCarrierTab();
      // await pages.viewLoadCarrierTabPage.clickCarrier1SendEDITenderButton();
      await pages.viewLoadCarrierTabPage.clickSendEDITenderButton(CARRIER_TABS.CARRIER_1);
      await pages.viewLoadPage.clickCarrier2Tab();
      // await pages.viewLoadCarrierTabPage.clickCarrier2SendEDITenderButton();
      await pages.viewLoadCarrierTabPage.clickSendEDITenderButton(CARRIER_TABS.CARRIER_2);
      await pages.viewLoadPage.clickCarrier3Tab();
      // await pages.viewLoadCarrierTabPage.clickCarrier3SendEDITenderButton();
      await pages.viewLoadCarrierTabPage.clickSendEDITenderButton(CARRIER_TABS.CARRIER_3);
      await console.log("EDI Tender Sent Successfully for all carriers");
    });
    //Validate EDI Tab after sending EDI Tender
    await test.step('Validate EDI Tab after sending EDI Tender', async () => {
      await pages.viewLoadPage.clickEDITab();
      await pages.viewLoadEDITabPage.validateLoadLevelEDIStatus(testData.carrier1Name, testData.carrier1EdiType, testData.carrier1EdiInOut, testData.carrier1EdiStatus);
      await pages.viewLoadEDITabPage.validateLoadLevelEDIStatus(testData.carrier2Name, testData.carrier2EdiType, testData.carrier2EdiInOut, testData.carrier2EdiStatus);
      await pages.viewLoadEDITabPage.validateLoadLevelEDIStatus(testData.carrier3Name, testData.carrier3EdiType, testData.carrier3EdiInOut, testData.carrier3EdiStatus);
      await expect(test.info().errors).toHaveLength(0);
      await console.log("EDI Tab Verified after sending EDI Tender for all carriers");
    });
    await test.step('Validate Carrier 1 Full EDI Logs', async () => {
      const viewLoadEDITabPage = new ViewLoadEDITabPage(page);
      viewLoadEDITabPage.clickEDIFullLogLink(testData.carrier1Name);
      const childTab = await switchToNewTab(page.context(), page);
      expect(await childTab.title()).toBe("BTMS - Admin");
      const ediLogPage = new EDILogPage(childTab);
      const edi204Carrier1Data = await dataConfigAPI.getEDIRawData(dataConfigAPI.edi204Carrier1Data);
      const expEdi204Carrier1Data = await dynamicDataAPI.updateEdiRawData(edi204Carrier1Data, bolNumber, loadId, testData.containerCode, trailerNumber.toString(), true, true, hours, minutes);
      await expect(await ediLogPage.getEdiTextLocator()).toHaveText(expEdi204Carrier1Data);
      await childTab.close();
      await switchBackToOriginalTab(page);
      await console.log("EDI Log Page Verified for Carrier 1: " + testData.carrier1Name);
    });
  });
  test('Case Id: 25163 - Outbound EDI 404 to Rail', async ({ page }) => {
    await test.step('Validate Carrier 2 Full EDI Logs', async () => {
      await pages.basePage.searchFromMainHeader(loadId);
      await pages.viewLoadPage.clickEDITab();
      const viewLoadEDITabPage = new ViewLoadEDITabPage(page);
      viewLoadEDITabPage.clickEDIFullLogLink(testData.carrier2Name);
      const childTab = await switchToNewTab(page.context(), page);
      expect(await childTab.title()).toBe("BTMS - Admin");
      const ediLogPage = new EDILogPage(childTab);
      const edi404Carrier2Data = await dataConfigAPI.getEDIRawData(dataConfigAPI.edi404Carrier2Data);
      const expEdi404Carrier2Data = await dynamicDataAPI.updateEdiRawData(edi404Carrier2Data, bolNumber, loadId, testData.containerCode, trailerNumber.toString(), true, false, hours, minutes);
      await expect(await ediLogPage.getEdiTextLocator()).toHaveText(expEdi404Carrier2Data);
      await childTab.close();
      await switchBackToOriginalTab(page);
      await console.log("EDI Log Page Verified for Carrier 2: " + testData.carrier2Name);
    });
    await test.step('Validate Carrier 3 Full EDI Logs', async () => {
      const viewLoadEDITabPage = new ViewLoadEDITabPage(page);
      viewLoadEDITabPage.clickEDIFullLogLink(testData.carrier3Name);
      const childTab = await switchToNewTab(page.context(), page);
      expect(await childTab.title()).toBe("BTMS - Admin");
      const ediLogPage = new EDILogPage(childTab);
      const edi204Carrier3Data = await dataConfigAPI.getEDIRawData(dataConfigAPI.edi204Carrier3Data);
      const expEdi204Carrier3Data = await dynamicDataAPI.updateEdiRawData(edi204Carrier3Data, bolNumber, loadId, testData.containerCode, trailerNumber.toString(), true, true, hours, minutes);
      await expect(await ediLogPage.getEdiTextLocator()).toHaveText(expEdi204Carrier3Data);
      await childTab.close();
      await switchBackToOriginalTab(page);
      await console.log("EDI Log Page Verified for Carrier 3: " + testData.carrier3Name);
    });
  });
  test('Case Id: 25164 - Outbound EDI 824 to Rail', async ({ page }) => {
    //Send EDI 824 Request
    await test.step('Send EDI 824 Request', async () => {
      const response = await apiRequests.send824Request(await dataConfigAPI.edi824RawData,loadId, testData.containerCode, trailerNumber.toString(), hours, minutes);
      await console.log('Status Code API 824: ', response.status);
      await expect(response.status).toBe(201);
      await console.log("EDI 824 Request Sent Successfully");
    });
    //Validate  load Status as In Transit, Get Waybill Number and validate EDI Tab for 824-In-Accepted
    waybillNumber = await test.step('Validate Load Status and EDI Tab for 824-In-Accepted', async () => {
      await pages.basePage.searchFromMainHeader(loadId);
      await page.waitForTimeout(WAIT.DEFAULT);
      await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.IN_TRANSIT);
      const waybillNumber = await pages.viewLoadCarrierTabPage.getRailCarrierWaybillNumber();
      await pages.viewLoadPage.clickEDITab();
      await pages.viewLoadEDITabPage.validateLoadLevelEDIStatus(testData.railCarrierName, testData.railCarrierEdiType, testData.railCarrierEdiInOut, testData.railCarrierEdiStatus);
      await expect(test.info().errors).toHaveLength(0);
      await console.log("Successfully validated EDI Tab for 824-In-Accepted");
      await console.log("Waybill Number: ", waybillNumber);
      return waybillNumber;
    });
  });
  test('Case Id: 25165 - Inbound 322 from Rail', async () => {
    //EDI 322 Request
    await test.step('Inbound EDI 322 POST API & Validate Response', async () => {
      const response = await apiRequests.send322Request(loadId, testData.containerCode, trailerNumber.toString());
      await console.log("EDI 322 Request sent successfully");
      await console.log('Status Code:', response.status);
      await expect(response.status).toBe(201);
    });
    //Validate EDI 322 in BTMS UI
    await test.step('Verify EDI 322 in BTMS UI', async () => {
      await pages.basePage.searchFromMainHeader(loadId);
      await pages.viewLoadPage.clickEDITab();
      await pages.viewLoadEDITabPage.validateLoadLevelEDIStatus(testData.railCarrierName, EDI_CODE.EDI_322, EDI_IN_OUT.IN, EDI_STATUS.I);
      await console.log(`Successfully validated EDI 322 for ${testData.railCarrierName}`);
    });
  });
  test('Case Id: 25166 - Outbound 214 to Customer', async ({ page }) => {
    //Send EDI 214 Request
    await test.step('Send Appointment and Verify EDI 214 in BTMS UI', async () => {
      await pages.basePage.searchFromMainHeader(loadId);
      await pages.viewLoadPage.clickPickTab();
      await pages.viewPickDetailsTabPage.clickPick1SendAppointmentButton();
      await pages.viewLoadPage.clickDrop3Tab();
      await pages.viewDropDetailsTabPage.clickDrop3SendAppointmentButton();
      await pages.viewLoadPage.clickEDITab();
      await pages.viewLoadEDITabPage.sendCarrier1EdiStatus(testData.customerEdiStatus, await `${hours}:${minutes}`);
      await page.waitForTimeout(WAIT.DEFAULT);
      await pages.viewLoadEDITabPage.validateCarrier1EDIStatus(testData.customerName, EDI_CODE.EDI_214, EDI_IN_OUT.OUT, EDI_STATUS.X3);
      await pages.viewLoadEDITabPage.validateCarrier1EDIStatus(testData.customerName, EDI_CODE.EDI_214, EDI_IN_OUT.OUT, EDI_STATUS.AA);
      await pages.viewLoadEDITabPage.validateCarrier3EDIStatus(testData.customerName, EDI_CODE.EDI_214, EDI_IN_OUT.OUT, EDI_STATUS.AG);
      await pages.viewLoadEDITabPage.validateCarrier3EDIStatus(testData.customerName, EDI_CODE.EDI_214, EDI_IN_OUT.OUT, EDI_STATUS.OR);
    });
    //Validate EDI Full Log for EDI 214, EDI Status as "AA"
    await test.step('Validate Edi Full Log for EDI 214, EDI Status as "AA"', async () => {
      const viewLoadEDITabPage = new ViewLoadEDITabPage(page);
      await viewLoadEDITabPage.clickCarrier1EdiFullLogLink();
      const childTab = await switchToNewTab(page.context(), page);
      expect(await childTab.title()).toBe("BTMS - Admin");
      const ediLogPage = new EDILogPage(childTab);
      const edi214OutData = await dataConfigAPI.getEDIRawData(dataConfigAPI.edi214OutData);
      const expEdi214OutData = await dynamicDataAPI.updateEdi214Data(edi214OutData, bolNumber, loadId, testData.containerCode, trailerNumber.toString(), hours, minutes);
      await expect(await ediLogPage.getEdiTextLocator()).toHaveText(expEdi214OutData);
      await childTab.close();
      await switchBackToOriginalTab(page);
      await console.log("EDI Log Page Verified for Carrier 1: " + testData.customerName);
    });
  });
  test('Case Id: 25167 - Outbound EDI 210 to Customer', async ({ page }) => {
    // Set Load Status to Delivered Final & Validate Load Status as Invoiced
    await test.step('Set Load Status to Delivered Final & Validate Load Status as Invoiced', async () => {
      await pages.basePage.searchFromMainHeader(loadId);
      await pages.viewLoadPage.clickEditButton();
      await pages.editLoadPage.clickOnPick1Tab();
      await pages.editLoadPickTabPage.clickDriverInOutLink();
      await pages.editLoadPage.clickOnDrop2Tab();
      await pages.editLoadDropTabPage.clickDrop2DriverInOutLink();
      await pages.editLoadPage.clickLoadTab();
      await pages.editLoadLoadTabPage.selectLoadStatus(LOAD_STATUS.DELIVERED_FINAL);
      await pages.commonReusables.dialogHandler(page);
      await pages.editLoadPage.clickSaveButton();
      await expect(test.info().errors).toHaveLength(0);
      await pages.viewLoadPage.validateLoadStatus(LOAD_STATUS.INVOICED);
    });
    test.step('Validate EDI Tab after setting Load Status & Validate EDI 210', async () => {
      await pages.viewLoadPage.clickEDITab();
      await pages.viewLoadEDITabPage.validateLoadLevelEDIStatus(testData.customerName, EDI_CODE.EDI_210, EDI_IN_OUT.OUT, EDI_STATUS.INVOICED);
      await expect(test.info().errors).toHaveLength(0);
      await console.log("EDI Tab Verified after setting Load Status to Invoiced");
    });
    await test.step('Validate Edi Full Log for EDI 210', async () => {
      await pages.viewLoadPage.clickPickTab();
      const pickInTTime = (await pages.viewPickDetailsTabPage.getPickDriverInTimeValue()).toString().split(':')[0].trim();
      const pickInHoursValue = await (parseInt(pickInTTime) + 5);
      const pickInMinutesValue = (await pages.viewPickDetailsTabPage.getPickDriverInTimeValue()).toString().split(':')[1].trim();
      const pickOutHours = (await pages.viewPickDetailsTabPage.getPickDriverOutTimeValue()).toString().split(':')[0].trim();
      const pickOutHoursValue = await (parseInt(pickOutHours) + 5);
      const pickOutMinutesValue = (await pages.viewPickDetailsTabPage.getPickDriverOutTimeValue()).toString().split(':')[1].trim();
      await pages.viewLoadPage.clickDrop3Tab();
      const dropInTime = (await pages.viewDropDetailsTabPage.getDriverInTimeValue()).toString().split(':')[0].trim();
      const dropInHoursValue = await (parseInt(dropInTime) + 5);
      const dropInMinutesValue = (await pages.viewDropDetailsTabPage.getDriverInTimeValue()).toString().split(':')[1].trim();
      const dropOutHours = (await pages.viewDropDetailsTabPage.getDriverOutTimeValue()).toString().split(':')[0].trim();
      const dropOutHoursValue = await (parseInt(dropOutHours) + 5);
      const dropOutMinutesValue = (await pages.viewDropDetailsTabPage.getDriverOutTimeValue()).toString().split(':')[1].trim();
      await pages.viewLoadPage.clickEDITab();
      const viewLoadEDITabPage = new ViewLoadEDITabPage(page);
      await viewLoadEDITabPage.clickCarrierCustomerEdiFullLogLink(testData.customerName, EDI_CODE.EDI_210);
      const childTab = await switchToNewTab(page.context(), page);
      expect(await childTab.title()).toBe("BTMS - Admin");
      const ediLogPage = new EDILogPage(childTab);
      const edi210DataValidation = await dataConfigAPI.getEDIRawData(dataConfigAPI.edi210DataValidation);
      const expEdi210OutData = await dynamicDataAPI.updateEdi210Data(edi210DataValidation, bolNumber, loadId, testData.containerCode, trailerNumber.toString(), 
      pickInHoursValue, pickOutHoursValue,
      dropInHoursValue, dropOutHoursValue,
      pickInMinutesValue,pickOutMinutesValue,
      dropInMinutesValue,dropOutMinutesValue);
      await expect(await ediLogPage.getEdiTextLocator()).toHaveText(expEdi210OutData);
      await childTab.close();
      await switchBackToOriginalTab(page);
      await console.log("EDI Log Page Verified for Customer EDI 210 Out: " + testData.customerName);
    });
    await console.log('Load ID:', loadId);
    await console.log('waybill Number:', waybillNumber);
  });
  let carrierId: string;
  let carrierName: string;
  test('Case Id: 25180 - Inbound EDI 210', async () => {
    // const data = dataConfig.getTestDataFromExcel(dataConfig.ediData, "EDI-25180");
    const data = dataConfig.getTestDataFromCsv(await dataConfig.ediData, "EDI-25180");
    const invoiceNumber = INVOICE_PREFIX + await dynamicDataAPI.generateDateTimeNumber();
    await console.log('Invoice Number:', invoiceNumber);
    await test.step('Inbound EDI 210 POST API & Validate Response', async () => {
      await pages.basePage.searchFromMainHeader(loadId);
      await pages.viewLoadPage.clickViewBillingButton();
      carrierId = await pages.loadBillingPage.getCarrierId();
      carrierName = await pages.loadBillingPage.getCarrierName();
    });
    await test.step('Send EDI 210 Request', async () => {
      const updatedData = await dynamicDataAPI.updateEdi210_410RawData(dataConfigAPI.edi210_410RawData, carrierName, carrierId, loadId, invoiceNumber);
      response = await apiRequests.sendEDI210_410Request(updatedData, await EDI_CODE.EDI_210);
      await console.log('Status Code API 210: ', response.status);
      await expect(response.status).toBe(201);
      await console.log("EDI 210 Request Sent Successfully");
    });
    await test.step('Validate Invoice Created', async () => {
      await pages.loadBillingPage.waitForCompleteCarrierInvoice();
      await expect(test.info().errors).toHaveLength(0);
      await pages.loadBillingPage.validateInvoiceItems(invoiceNumber, data.invoiceStatus, data.invoiceAmount);
      await expect(test.info().errors).toHaveLength(0);
      await console.log("Invoice Items Validated Successfully");
    });
  });
  test('Case Id: 25181 - Inbound EDI 410', async () => {
    // const data = dataConfig.getTestDataFromExcel(dataConfig.ediData, "EDI-25181");
    const data = dataConfig.getTestDataFromCsv(await dataConfig.ediData, "EDI-25181");
    const invoiceNumber = INVOICE_PREFIX + await dynamicDataAPI.generateDateTimeNumber();
    await console.log('Invoice Number:', invoiceNumber);
    await test.step('Inbound EDI 410 POST API & Validate Response', async () => {
      await pages.basePage.searchFromMainHeader(loadId);
      await pages.viewLoadPage.clickViewBillingButton();
      await pages.loadBillingPage.clickRailTab();
      carrierId = await pages.loadBillingPage.getCarrierId();
      carrierName = await pages.loadBillingPage.getCarrierName();
    });
    await test.step('Send EDI 410 Request', async () => {
      const updatedData = await dynamicDataAPI.updateEdi210_410RawData(dataConfigAPI.edi210_410RawData, carrierName, carrierId, loadId, invoiceNumber);
      response = await apiRequests.sendEDI210_410Request(updatedData, await EDI_CODE.EDI_410);
      await console.log('Status Code API 410: ', response.status);
      await expect(response.status).toBe(201);
      await console.log("EDI 410 Request Sent Successfully");
    });
    await test.step('Validate Rail Invoice Created', async () => {
      await pages.loadBillingPage.waitForCompleteRailInvoice();
      await pages.loadBillingPage.validateRailInvoiceItems(invoiceNumber, data.invoiceStatus, data.invoiceAmount);
      await expect(test.info().errors).toHaveLength(0);
      await console.log("Rail Invoice Items Validated Successfully");
    });
  });
  test('Case Id: 25182 - EDI Exception Queue', async () => {
    // const data = await dataConfig.getTestDataFromExcel(dataConfig.ediData, "EDI-25182");
    const data = await dataConfig.getTestDataFromCsv(await dataConfig.ediData, "EDI-25182");
    const invoiceNumber = INVOICE_PREFIX + await dynamicDataAPI.generateDateTimeNumber();
    await console.log('Invoice Number:', invoiceNumber);
    await test.step('Send EDI 410 Request', async () => {
      const updatedData = await dynamicDataAPI.updateEdi210_410RawData(dataConfigAPI.edi210_410RawData, data.carrier1Name, data.carrier1Number, loadId, invoiceNumber);
      const response = await apiRequests.sendEDI210_410Request(updatedData, await EDI_CODE.EDI_410);
      await console.log('Status Code API 410: ', response.status);
      await expect(response.status).toBe(201);
      await console.log("EDI 410 Request Sent Successfully");
    });
    await test.step('Validate EDI Exception Queue', async () => {
      await pages.basePage.searchFromMainHeader(loadId);
      await pages.viewLoadPage.clickViewBillingButton();
      await pages.loadBillingPage.validateUnassignedInvoiceTab(data.carrier1Number, data.carrier1Name, loadId, invoiceNumber, data.invoiceAmount);
      await expect(test.info().errors).toHaveLength(0);
      await console.log("EDI Exception Queue Validated Successfully");
    });
  });

});