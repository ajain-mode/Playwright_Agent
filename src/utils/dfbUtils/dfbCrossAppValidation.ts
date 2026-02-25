/**
 * Common post-save, DME, TNX, and BTMS validation steps for DFB E2E tests
 * Extracted as a reusable helper for Playwright test flows.
 * @author Deepak Bohra
 * @created 2025-09-30
 */
import userSetup from "@loginHelpers/userSetup";
import { PageManager } from "@utils/PageManager";
import { Page } from "playwright";
import { MultiAppManager } from "./MultiAppManager";


export class DfbCrossAppValidator {
  async completePostSaveAndCrossAppValidation({
    pages,
    appManager,
    sharedPage,
    testData,
    loadNumber,
    totalMiles,
  }: {
    pages: PageManager;
    appManager: MultiAppManager;
    sharedPage: any;
    testData: any;
    loadNumber: string;
    totalMiles: string;
  }) {
    await pages.dfbLoadFormPage.validateDFBTextFieldHaveExpectedValues({
      offerRate: TNX.OFFER_RATE,
      expirationDate:
        pages.commonReusables.getNextTwoDatesFormatted().tomorrow,
      expirationTime: testData.shipperLatestTime,
    });
    await pages.dfbLoadFormPage.validateFormFieldsState({
      emailNotification: testData.saleAgentEmail,
    });
    await pages.dfbLoadFormPage.validateFieldsAreNotEditable([
      DFB_FORM_FIELDS.Email_Notification,
      DFB_FORM_FIELDS.Expiration_Date,
      DFB_FORM_FIELDS.Expiration_Time,
      DFB_FORM_FIELDS.Commodity,
      DFB_FORM_FIELDS.NOTES,
      DFB_FORM_FIELDS.Include_Carriers,
      DFB_FORM_FIELDS.Exclude_Carriers,
    ]);
    await pages.dfbLoadFormPage.validateMixedButtonStates({
      [DFB_Button.Post]: false,
      [DFB_Button.Clear_Form]: false,
      [DFB_Button.Create_Rule]: true,
      [DFB_Button.Cancel]: true,
    });
    await pages.viewLoadCarrierTabPage.getBidsReportValue();
    await pages.dfbLoadFormPage.hoverOverPostedIcon();
    await pages.dfbLoadFormPage.validateTableFields(sharedPage, {
      "Origin Zip": testData.shipperZip,
      "Destination Zip": testData.consigneeZip,
      "Offer Rate": `$${TNX.OFFER_RATE}`,
      Equipment: testData.equipmentType,
      "Load Method": testData.loadMethod,
    });

    // DME validation
    const dmePages = await appManager.switchToDME();
    try {
      await dmePages.dmeDashboardPage.clickOnLoadsLink();
      await dmePages.dmeDashboardPage.searchLoad(loadNumber);
      await dmePages.dmeLoadPage.validateSingleTableRowPresent();
      await dmePages.dmeLoadPage.validateAndGetSourceIdText(loadNumber);
      await dmePages.dmeLoadPage.ValidateDMEStatusText(LOAD_STATUS.BTMS_REQUESTED,LOAD_STATUS.TNX_REQUESTED);
      await dmePages.dmeLoadPage.clickOnDataDetailsLink();
      await dmePages.dmeLoadPage.clickOnShowIconLink();
      await dmePages.dmeLoadPage.validateAuctionAssignedText(
        loadNumber,
        dmePages.dmeDashboardPage
      );
    } catch (error) {
      throw new Error("DME validation failed: " + error);
    }

    // TNX validation
    const tnxPages = await appManager.switchToTNX();
    await appManager.tnxPage.setViewportSize({ width: 1920, height: 1080 });
    try {
      await tnxPages.tnxLandingPage.selectOrganizationByText(TNX.CARRIER_NAME);
      await tnxPages.tnxLandingPage.handleOptionalSkipButton();
      await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
      await tnxPages.tnxLandingPage.clickPlusSignButton();
      await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
      await tnxPages.tnxLandingPage.clickLoadSearchLink();
      await tnxPages.tnxLandingPage.validateAvailableLoadsText(loadNumber);
      await tnxPages.tnxLandingPage.clickLoadLink();
      await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.MATCH_NOW);
      await tnxPages.tnxLandingPage.clickTnxBiddingButton(TNX.YES_BUTTON);
      await tnxPages.tnxLandingPage.validateTnxElementVisible(TNX.CONGRATS_MESSAGE);
      await tnxPages.tnxCarrierTenderPage.validateMatchSuccessToast();
      await tnxPages.tnxCarrierTenderPage.waitForMatchSuccessToastToDisappear();
      await tnxPages.tnxExecutionTenderPage.validateExecutionNotesFieldsPresence();
    } catch (error) {
      throw new Error("TNX validation failed: " + error);
    }

    // DME final status
    const dmePages2 = await appManager.switchToDME();
    await dmePages2.dmeDashboardPage.searchLoad(loadNumber);
    await dmePages2.dmeLoadPage.validateSingleTableRowPresent();
    await dmePages2.dmeLoadPage.validateAndGetSourceIdText(loadNumber);
    await dmePages2.dmeLoadPage.validateAndGetStatusTextWithRetry(
      LOAD_STATUS.BTMS_CANCELLED,
      LOAD_STATUS.TNX_BOOKED,
      loadNumber,
      dmePages2.dmeDashboardPage
    );

    // BTMS final status
    const btmsPages = await appManager.switchToBTMS();
    await btmsPages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.MATCHED);
    await appManager.btmsPage.reload();
    await btmsPages.viewLoadPage.validateLoadStatus(LOAD_STATUS.BOOKED);
    await btmsPages.editLoadCarrierTabPage.clickOnCarrierTab();
    await btmsPages.viewLoadCarrierTabPage.validateBidsReportValue();
    await btmsPages.commonReusables.getCurrentDateTime();
    await pages.viewLoadCarrierTabPage.clickViewLoadPageLinks(TNX.BID_HISTORY);
    await pages.viewLoadCarrierTabPage.getBidHistoryFirstRowDetails();
    await pages.viewLoadCarrierTabPage.validateBidHistoryFirstRow({
      carrier: testData.Carrier,
      bidRate: testData.offerRate,
      shipCity: testData.shipperCity,
      shipState: testData.shipperState,
      consCity: testData.consigneeCity,
      consState: testData.consigneeState,
      timestamp: pages.commonReusables.formattedDateTime,
      email: userSetup.tnxUser,
      totalMiles: totalMiles,
    });
    await btmsPages.viewLoadCarrierTabPage.validateCarrierLinkText(TNX.CARRIER_NAME);
    await btmsPages.viewLoadCarrierTabPage.validateCarrierDispatchName(TNX.CARRIER_DISPATCH_NAME);
    await btmsPages.viewLoadCarrierTabPage.validateCarrierDispatchEmail(userSetup.tnxUser);
    await appManager.closeAllSecondaryPages();
  }
}

const  dfbCrossAppValidator = new DfbCrossAppValidator();
export default dfbCrossAppValidator;
