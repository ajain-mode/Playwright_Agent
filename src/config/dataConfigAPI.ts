import path from "path";
import fs from "fs";
import dataConfig from "./dataConfig";
import loginSetup from "@loginHelpers/loginSetup";

class DataConfigAPI {
  /**
   * Predefined data for EDI API requests.
   */
  readonly edi204RawData: string = "edi204RawData";
  readonly edi990RawData: string = "edi990RawData";
  readonly edi204Carrier1Data: string = "edi204Carrier1Data";
  readonly edi404Carrier2Data: string = "edi404Carrier2Data";
  readonly edi204Carrier3Data: string = "edi204Carrier3Data";
  readonly edi824RawData: string = "edi824RawData";
  readonly edi322RawData: string = "edi322RawData";
  readonly edi214OutData: string = "edi214OutData";
  readonly edi210DataValidation: string = "edi210DataValidation";
  readonly edi210_410RawData: string = "edi210_410RawData";
  readonly inboundEdi204TruckLoad: string = "inboundEdi204TruckLoad";
  readonly outboundEdi990TruckLoad: string = "outboundEdi990TruckLoad";
  readonly outboundEdi204TruckLoad: string = "outboundEdi204TruckLoad";
  readonly inboundEdi990TruckLoad: string = "inboundEdi990TruckLoad";
  readonly outboundEdi214AGTruckLoad: string = "outboundEdi214AGTruckLoad";
  readonly inboundEdi214TruckLoad: string = "inboundEdi214TruckLoad";
  readonly inboundEdi213TruckLoad: string = "inboundEdi213TruckLoad";
  readonly inboundEdi824TruckLoad: string = "inboundEdi824TruckLoad";
  readonly inboundEdi204NewHydrofarm: string = "inboundEdi204NewHydrofarm";
  readonly outboundEdi990NewHydrofarm: string = "outboundEdi990NewHydrofarm";
  readonly inboundEdi204ChangeHydrofarm: string = "inboundEdi204ChangeHydrofarm";
  readonly outboundEdi990ChangeHydrofarm: string = "outboundEdi990ChangeHydrofarm";
  readonly inboundEdi204TruckLoad_DFB: string = "inboundEdi204TruckLoad_DFB";
  readonly inboundEdi204TruckLoad_Waterfall: string = "inboundEdi204TruckLoad_Waterfall";
  readonly ltlRequestRates: string = "ltlRequestRates";
  readonly sample: string = "sample";
  readonly requestRates: string = "requestRates";
  readonly bookLoadRequest: string = "bookLoadRequest";
  readonly book_RequestLoadRequest: string = "book_RequestLoadRequest";
  readonly trackingDetails: string = "trackingDetails";
  readonly bookRequestLTLBtms: string = "bookRequestLTLBtms";
  
  private ediFilePath: any;

  /**
   * @author : Rohit Singh
   * @modified : 2025-07-30
   * Reads EDI raw data from a specified file.
   * @param apiDataFile - The name of the EDI data file to read.
   * @returns The raw EDI data as a string.
   */
  async getEDIRawData(apiDataFile: string) {
    if (apiDataFile === this.edi204RawData) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/intermodal_MarmaxxGroup",
        "edi204RawData.txt"
      );
    } else if (apiDataFile === this.edi990RawData) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/intermodal_MarmaxxGroup",
        "edi990RawData.txt"
      );
    } else if (apiDataFile === this.edi204Carrier1Data) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/intermodal_MarmaxxGroup",
        "edi204Carrier1Data.txt"
      );
    } else if (apiDataFile === this.edi404Carrier2Data) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/intermodal_MarmaxxGroup",
        "edi404Carrier2Data.txt"
      );
    } else if (apiDataFile === this.edi204Carrier3Data) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/intermodal_MarmaxxGroup",
        "edi204Carrier3Data.txt"
      );
    } else if (apiDataFile === this.edi824RawData) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/intermodal_MarmaxxGroup",
        "edi824RawData.txt"
      );
    } else if (apiDataFile === this.edi322RawData) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/intermodal_MarmaxxGroup",
        "edi322RawData.txt"
      );
    } else if (apiDataFile === this.edi214OutData) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/intermodal_MarmaxxGroup",
        "edi214OutData.txt"
      );
    } else if (apiDataFile === this.edi210DataValidation) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/intermodal_MarmaxxGroup",
        "edi210DataValidation.txt"
      );
    } else if (apiDataFile === this.edi210_410RawData) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/intermodal_MarmaxxGroup",
        "edi210_410RawData.txt"
      );
    } else if (apiDataFile === this.inboundEdi204TruckLoad) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/truckload_FordMotor",
        "inboundEdi204TruckLoad.txt"
      );
    } else if (apiDataFile === this.outboundEdi990TruckLoad) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/truckload_FordMotor",
        "outboundEdi990TruckLoad.txt"
      );
    } else if (apiDataFile === this.outboundEdi204TruckLoad) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/truckload_FordMotor",
        "outboundEdi204TruckLoad.txt"
      );
    } else if (apiDataFile === this.inboundEdi990TruckLoad) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/truckload_FordMotor",
        "inboundEdi990TruckLoad.txt"
      );
    } else if (apiDataFile === this.outboundEdi214AGTruckLoad) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/truckload_FordMotor",
        "outboundEdi214AGTruckLoad.txt"
      );
    } else if (apiDataFile === this.inboundEdi214TruckLoad) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/truckload_FordMotor",
        "inboundEdi214TruckLoad.txt"
      );
    } else if (apiDataFile === this.inboundEdi213TruckLoad) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/truckload_FordMotor",
        "inboundEdi213TruckLoad.txt"
      );
    } else if (apiDataFile === this.inboundEdi824TruckLoad) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/truckload_FordMotor",
        "inboundEdi824TruckLoad.txt"
      );
    } else if (apiDataFile === this.inboundEdi204NewHydrofarm) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/lTL_ELTL_Hydrofarm",
        "inboundEdi204NewHydrofarm.txt"
      );
    } else if (apiDataFile === this.outboundEdi990NewHydrofarm) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/lTL_ELTL_Hydrofarm",
        "outboundEdi990NewHydrofarm.txt"
      );
    } else if (apiDataFile === this.inboundEdi204ChangeHydrofarm) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/lTL_ELTL_Hydrofarm",
        "inboundEdi204ChangeHydrofarm.txt"
      );
    } else if (apiDataFile === this.outboundEdi990ChangeHydrofarm) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/lTL_ELTL_Hydrofarm",
        "outboundEdi990ChangeHydrofarm.txt"
      );
    } else if (apiDataFile === this.inboundEdi204TruckLoad_DFB) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/truckload_FordMotor",
        "inboundEdi204TruckLoad_DFB.txt"
      );


        } else if (apiDataFile === this.inboundEdi204TruckLoad_Waterfall) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/truckload_WINDSOR",
        "inboundEdi204TruckLoad_Waterfall.txt"
      );
    } else if (apiDataFile === this.ltlRequestRates) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/ltlQuote",
        "ltlRequestRates.txt"
      );
    } else if (apiDataFile === this.sample) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/sampleUploads",
        "sample.pdf"
      );
    } else if (apiDataFile === this.ltlRequestRates) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/customerApi",
        "requestRates.txt"
      );
    } else if (apiDataFile === this.bookLoadRequest) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/customerApi",
        "bookLoadRequest.txt"
      );
    } else if (apiDataFile === this.book_RequestLoadRequest) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/customerApi",
        "book_RequestLoadRequest.txt"
      );
    } else if (apiDataFile === this.trackingDetails) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/customerApi",
        "trackingDetails.txt"
      );
    } else if (apiDataFile === this.bookRequestLTLBtms) {
      this.ediFilePath = path.join(
        __dirname,
        "..",
        "data/api/customerApi",
        "bookRequestLTLBtms.txt"
      );
    }
    else {
      throw new Error(`Unknown EDI data file: ${apiDataFile}`);
    }
    const rawData = fs.readFileSync(this.ediFilePath, "utf-8");
    return rawData;
  }
  /**
   * @author : Rohit Singh
   * @modified : 2025-07-30
   * @returns The base URL for the API, constructed from the configuration file.
   */
  public getApiBaseUrl() {
    // const configPath = path.join(__dirname, "../loginHelpers/config.json");
    // const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const env = loginSetup.Execution_Env.toLowerCase();
    const url = loginSetup.tmsApiBaseUrl.replace("${env}", env);
    console.log("API Base URL:", url);
    return url;
  }

  async getNonProdJsonData() {
    const data = dataConfig.readJsonData("data/api/customerApi", "nonProdUsers.json");
    // console.log("API Data:", data);
    return data;
  }
}
const dataConfigAPI = new DataConfigAPI();
export default dataConfigAPI;
