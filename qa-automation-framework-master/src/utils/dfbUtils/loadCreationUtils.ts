// Utility to fill Pick, Drop, Carrier tabs and create load for DFB tests
// Author: Deepak
// Date: 2025-10-01

import { PageManager } from "@utils/PageManager";
import { Page } from "playwright";

/**
 * Fills Pick, Drop, Carrier tabs and creates a load in the DFB workflow.
 * @param pages Page object manager
 * @param testData Test data for the load
 * @returns The created load number
 */
export class LoadCreationUtils {
  /**
   * Fills Pick, Drop, Carrier tabs and creates a load in the DFB workflow.
   * @author Deepak
   * @created 2025-10-01
   * @param pages Page object manager
   * @param testData Test data for the load
   * @returns The created load number
   */
  async fillTabsAndCreateLoad(
    pages: PageManager,
    testData: any
  ): Promise<string> {
    await pages.editLoadPage.clickOnTab(TABS.PICK);
    await pages.editLoadPickTabPage.enterCompletePickTabDetails(testData);
    await pages.editLoadPage.clickOnTab(TABS.DROP);
    await pages.editLoadDropTabPage.enterCompleteDropTabDetails(
      testData.consigneeName,
      pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
      testData.consigneeEarliestTime,
      pages.commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
      testData.consigneeLatestTime
    );
    await pages.editLoadPage.clickOnTab(TABS.CARRIER);
    await pages.editLoadCarrierTabPage.enterCompleteCarrierTabDetails(
      testData.equipmentType,
      testData.trailerLength
    );
    await pages.editLoadLoadTabPage.clickCreateLoadButton();
    await pages.editLoadPage.validateEditLoadHeadingText();
    const loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
    await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
    return loadNumber;
  }
}

const loadCreationUtils = new LoadCreationUtils();
export default loadCreationUtils;
