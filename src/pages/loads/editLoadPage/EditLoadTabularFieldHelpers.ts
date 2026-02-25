/**
 * editLoadTabularFieldHelpers.ts
 *
 * Helper functions for DFB tabular field validation spec.
 * Provides utilities to fill Pick, Consignee, and Carrier tabs with blank or invalid values for validation testing.
 *
 * @modified 2025-08-12
 * @author Deepak
 */

import commonReusables from "@utils/commonReusables";
import { PageManager } from "@utils/PageManager";


class EditLoadTabularFieldHelpers {

 
  /**
   * Fills the Pick tab with all valid values except one field, which is left blank.
   * @param pages - The pages object containing page objects and utilities.
   * @param blankIndex - The index of the field to leave blank.
   * @author Deepak
   * @modified 2025-10-08
   */
  async fillPickTabWithOneBlank(pages: PageManager, testData: any, blankIndex: number) {
  const values: string[] = [
      testData.shipperName,
      testData.shipperAddress,
      testData.shipperCity,
      testData.shipperState,
      testData.shipperZip,
      commonReusables.getNextTwoDatesFormatted().tomorrow,
      testData.shipperEarliestTime,
      commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
      testData.shipperLatestTime,
      testData.shipmentCommodityQty,
      testData.shipmentCommodityUoM,
      testData.shipmentCommodityDescription,
      testData.shipmentCommodityWeight,
    ];
    values[blankIndex] = "";
    await pages.editLoadValidationFieldPage.enterCompletePickTabDetailsManualAddress(
      values[0], values[1], values[2], values[3], values[4], values[5], values[6], values[7], values[8], values[9], values[10], values[11], values[12]
    );
  }
 
  /**
   * Fills the Consignee tab with all valid values except one field, which is left blank.
   * @param pages - The pages object containing page objects and utilities.
   * @param blankIndex - The index of the field to leave blank.
   * @author Deepak
   * @modified 2025-10-08
   */
  async fillConsigneeTabWithOneBlank(pages: PageManager, testData: any, blankIndex: number) {
  const values: string[] = [
      testData.consigneeName,
      testData.consigneeAddress,
      testData.consigneeCity,
      testData.consigneeState,
      testData.consigneeZip,
      commonReusables.getNextTwoDatesFormatted().tomorrow,
      testData.consigneeEarliestTime,
      commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
      testData.consigneeLatestTime,
    ];
    values[blankIndex] = "";
    await pages.editLoadValidationFieldPage.enterCompleteConsigneeTabDetailsManualAddress(
      values[0], values[1], values[2], values[3], values[4], values[5], values[6], values[7], values[8]
    );
  }
 
  /**
   * Fills the Carrier tab with all valid values except one field, which is left blank.
   * @param pages - The pages object containing page objects and utilities.
   * @param blankIndex - The index of the field to leave blank.
   * @author Deepak
   * @modified 2025-10-08
   */
  async fillCarrierTabWithOneBlank(pages: PageManager, testData: any, blankIndex: number) {
  const values = [
      testData.equipmentType,
      testData.trailerLength,
      testData.miles,
    ];
    values[blankIndex] = "";
    await pages.editLoadValidationFieldPage.enterCompleteCarrierDetails(
      values[0], values[1], values[2]
    );
  }
 
  /**
   * Fills the Pick tab with all valid values except one field, which is set to an invalid value.
   * @author Deepak Bohra
   * @created 2025-08-06
   * @modified 2025-10-08
   * @param pages - The pages object containing page objects and utilities.
   * @param invalidIndex - The index of the field to set as invalid.
   * @param invalidValue - The invalid value to use for the specified field.
   */
  async fillPickTabWithInvalidValue(
  pages:PageManager,
    testData: any,
    invalidIndex: number,
    invalidValue: string
  ) {
  const values: string[] = [
      testData.shipperName, // Fixed: was using consignee data
      testData.shipperAddress,
      testData.shipperCity,
      testData.shipperState,
      testData.shipperZip,
      commonReusables.getNextTwoDatesFormatted().tomorrow,
      testData.shipperEarliestTime,
      commonReusables.getNextTwoDatesFormatted().dayAfterTomorrow,
      testData.shipperLatestTime,
      testData.shipmentCommodityQty,
      testData.shipmentCommodityUoM,
      testData.shipmentCommodityDescription,
      testData.shipmentCommodityWeight,
    ];
    values[invalidIndex] = invalidValue;
    await pages.editLoadValidationFieldPage.enterCompletePickTabDetailsManualAddress(
      values[0], values[1], values[2], values[3], values[4], values[5], values[6], values[7], values[8], values[9], values[10], values[11], values[12]
    ); 
  }
 }
export default EditLoadTabularFieldHelpers;