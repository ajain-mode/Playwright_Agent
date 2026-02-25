import commonReusables from "@utils/commonReusables";

 /**
   * Edi replacement helper class
   * @author Deepak Bohra
   * @created : 2025-10-10
   */

class EdiReplacementsHelper {
  async getEdi204Replacements(bolNumber: string, testData: any): Promise<Record<string, string>> {
    return {
      BOLNumber: bolNumber,
      Tomorrow: await commonReusables.getDate("tomorrow", "YYYYMMDD"),
      DayAfterTomorrow: await commonReusables.getDate("dayAfterTomorrow", "YYYYMMDD"),
      ShipperName: testData.shipperName,
      ShipperEDICode: testData.shipperEDICode,
      ShipperAddress: testData.shipperAddress,
      ShipperCity: testData.shipperCity,
      ShipperState: testData.shipperState,
      ShipperZip: testData.shipperZip,
      ConsigneeName: testData.consigneeName,
      ConsigneeEDICode: testData.consigneeEDICode,
      ConsigneeAddress: testData.consigneeAddress,
      ConsigneeCity: testData.consigneeCity,
      ConsigneeState: testData.consigneeState,
      ConsigneeZip: testData.consigneeZip,
      // Add more fields as needed
    };
  }
}

const ediReplacementsHelper = new EdiReplacementsHelper();
export default ediReplacementsHelper;


