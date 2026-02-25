import path from "path";
import fs from "fs";
import commonReusables from "@utils/commonReusables";

class DataConfig {

    readonly ediData: string = 'edidata';
    readonly dfbData: string = 'dfbdata';
    readonly commissionData: string = 'commissiondata';
    readonly ediCsvData: string = 'edidataCSV';
    readonly salesleadData: string = 'salesleaddata';
    readonly banyanData: string = 'banyandata';
    readonly apiData: string = 'apidata';
    readonly carrierData: string = 'carrierdata'
    readonly datData: string = 'datdata';
    readonly bulkChangeData: string = 'bulkchangedata'
    readonly nonOperationalLoadsData: string = 'nonoperationalloadsdata';

    private csvPath: any;
    private csvData: any;
    private userDataPath: any;
    private userData: any;

    // To be Deleted as we are not using excel based data reading anymore 
    // @modified 2025-08-25: Rohit Singh
    //*************************************************************************************************** */
    // private excelData: any;
    // private excelPath: any;
    // /***
    //  * @author : Rohit Singh
    //  * @modified : 2025-07-30
    //  * @function getTestDataFromExcel
    //  * @description Reads test data from an Excel file based on the provided test case ID.      
    //  * @param dataFile - The type of data file to read (ediData or dfbData).
    //  * @param testCaseID - The ID of the test case for which data is to be retrieved.
    //  */
    // public getTestDataFromExcel(dataFile: string, testCaseID: string): Record<string, string> {
    //     this.excelPath = this.getExcelDataFilePath(dataFile);
    //     this.excelData = commonReusables.readTestDataFromExcel(this.excelPath, testCaseID);
    //     const testData: Record<string, string> = {
    //         ...this.excelData,
    //     };
    //     return testData;
    // }

    // /**
    //  * @author Rohit Singh
    //  * @modified 2025-08-18
    //  * @description Gets test data file
    //  * @param dataFile - The type of data file to read (ediData or dfbData).
    //  */
    // private getExcelDataFilePath(dataFile: string) {
    //     if (dataFile === this.ediData) {
    //         this.excelPath = path.join(__dirname, '..', 'data/edi', 'edidata.xlsx');
    //     } else if (dataFile === this.dfbData) {
    //         this.excelPath = path.join(__dirname, '..', 'data/dfb', 'dfbdata.xlsx');
    //     } else if (dataFile === this.commissionData) {
    //         this.excelPath = path.join(__dirname, '..', 'data/commission', 'commissiondata.xlsx');

    //     } else if (dataFile === this.salesleadData) {
    //         this.excelPath = path.join(__dirname, '..', 'data/saleslead', 'salesleaddata.xlsx');
    //     }
    //     else if (dataFile === this.banyanData) {
    //         this.excelPath = path.join(__dirname, '..', 'data/banyan', 'banyandata.xlsx');
    //     }
    //     else {
    //         throw new Error(`Unknown data file: ${dataFile}`);
    //     }
    //     return this.excelPath;
    // }
    //*************************************************************************************************** */

    /**
     * Reads JSON data from a specified file in the given folder.
     * @param folderName - The name of the folder containing the JSON file.
     * @param fileName - The name of the JSON file to read.
     * @returns {Record<string, string>} The JSON data as a record.
     * @author Rohit Singh
     * @modified 2025-07-16
     */
    public readJsonData(folderName: string, fileName: string): Record<string, string> {
        this.userDataPath = path.join(__dirname, '..', folderName, fileName);
        this.userData = JSON.parse(fs.readFileSync(this.userDataPath, 'utf-8'));
        const jsonData: Record<string, string> = {
            ...this.userData,
        };
        return jsonData;
    }

    /**
     * @author : Parth Rastogi
     * @modified : 2025-08-25
     * @function getTestDataFromCsv
     * @description Reads test data from a CSV file based on the provided test case ID.      
     * @param dataFile - The type of data file to read (ediData or dfbData).
     * @param testCaseID - The ID of the test case for which data is to be retrieved.
     */
    public getTestDataFromCsv(dataFile: string, testCaseID: string): Record<string, string> {
        this.csvPath = this.getCSVDataFilePath(dataFile);
        this.csvData = commonReusables.readTestDataFromCsv(this.csvPath, testCaseID);
        const testData: Record<string, string> = {
            ...this.csvData,
        };
        return testData;
    }
    /**
    * @author Parth Rastogi
    * @modified 2025-08-25
    * @description Gets test data file
    * @param dataFile - The type of data file to read (ediData or dfbData).
    */
    private getCSVDataFilePath(dataFile: string) {
        if (dataFile === this.ediData) {
            this.csvPath = path.join(__dirname, '..', 'data/edi', 'edidata.csv');

        } else if (dataFile === this.dfbData) {
            this.csvPath = path.join(__dirname, '..', 'data/dfb', 'dfbdata.csv');

        } else if (dataFile === this.commissionData) {
            this.csvPath = path.join(__dirname, '..', 'data/commission', 'commissiondata.csv');

        } else if (dataFile === this.salesleadData) {
            this.csvPath = path.join(__dirname, '..', 'data/salesLead', 'salesleaddata.csv');
        }
        else if (dataFile === this.banyanData) {
            this.csvPath = path.join(__dirname, '..', 'data/banyan', 'banyandata.csv');
        }
        else if (dataFile === this.apiData) {
            this.csvPath = path.join(__dirname, '..', 'data/api', 'apidata.csv');
        }
        else if (dataFile === this.carrierData) {
            this.csvPath = path.join(__dirname, '..', 'data/carrier', 'carrierdata.csv');
        }
        else if (dataFile === this.datData) {
            this.csvPath = path.join(__dirname, '..', 'data/dat', 'datdata.csv');
        }
        else if (dataFile === this.bulkChangeData) {
            this.csvPath = path.join(__dirname, '..', 'data/bulkChange', 'bulkchangedata.csv');
        }
        else if (dataFile === this.nonOperationalLoadsData) {
            this.csvPath = path.join(__dirname, '..', 'data/nonOperationalLoads', 'nonoperationalloadsdata.csv');
        }
        else {
            throw new Error(`Unknown data file: ${dataFile}`);
        }
        return this.csvPath;
    }
}
const dataConfig = new DataConfig();
export default dataConfig;