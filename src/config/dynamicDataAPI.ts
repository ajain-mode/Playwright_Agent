import { promises as fs } from 'fs';
import commonReusables from '@utils/commonReusables';
import dataConfigAPI from './dataConfigAPI';


class DynamicDataAPI {

    //get unique trailer Number
    async generateDateTimeNumber(): Promise<string> {
        const now = new Date();
        const year = now.getFullYear().toString(); // Full year
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month (01-12)
        const day = now.getDate().toString().padStart(2, '0'); // Day (01-31)
        const hours = now.getHours().toString().padStart(2, '0'); // Hours (00-23)
        const minutes = now.getMinutes().toString().padStart(2, '0'); // Minutes (00-59)
        const dateTime = `${year}${month}${day}${hours}${minutes}`;
        return dateTime;
    }
    /**
     * @author Rohit Singh
     * @modified 2025-07-30
     * @description Generates a unique trailer number by reading and incrementing a number from a file
     * @returns A promise that resolves to a string representing the generated trailer number.
     * 
     */
    async generateTrailerNumber(): Promise<string> {
        // const trailerNumber = await this.getAndIncrementNumber();
        const trailerNumber = commonReusables.generateRandomNumber(6);
        return trailerNumber;
    }
    /**
 * @file Dynamic Data API utilities for EDI automation
 * * This class provides methods to generate dynamic BOL numbers,
 * @author Rohit Singh
 * @created 2025-07-23
 */
    async getBolNumber(): Promise<string> {
        // Generate a random BOL number using the generateRandomData method
        // and format it as required
        const number = await this.generateDateTimeNumber();
        const bolNumber = `EDI${number}`;
        return bolNumber;
    }
    /**
     * @author Rohit Singh
     * @created 2025-07-16
     * @description Updates the EDI 204 raw data with the provided BOL number, Load ID, container code, and trailer number.
     * @param ediRawData - The raw EDI 204 data to be updated.
     * @param bolNumber - The BOL number to be inserted into the EDI data.
     * @param loadId - The Load ID to be inserted into the EDI data.
     * @param containerCode - The container code to be inserted into the EDI data.
     * @param trailerNumber - The trailer number to be inserted into the EDI data.
     * @returns Updated EDI 204 raw data as a string.
     */
    async updateEdiRawData(ediRawData: string, bolNumber: string, loadId: string, containerCode: string, trailerNumber: string, updatedToday: boolean, updateTomorrow: boolean, hours: string, minutes: string): Promise<string> {
        const today = commonReusables.formatDateToYYYYMMDD(commonReusables.today);
        const tomorrow = commonReusables.formatDateToYYYYMMDD(commonReusables.tomorrow);
        const Time = hours + minutes;
        // let expEdi204Carrier2Data = ediRawData;

        // Only replace if parameter is not blank/empty
        if (bolNumber && bolNumber.trim() !== '') {
            ediRawData = ediRawData.replace(/\{BOLNumber\}/g, bolNumber);
        }
        if (hours && minutes && hours.trim() !== '' && minutes.trim() !== '') {
            ediRawData = ediRawData.replace(/\{Time\}/g, Time);
        }

        if (loadId && loadId.trim() !== '') {
            ediRawData = ediRawData.replace(/\{LoadID\}/g, loadId);
        }

        if (containerCode && containerCode.trim() !== '') {
            ediRawData = ediRawData.replace(/\{containerCode\}/g, containerCode);
        }

        if (trailerNumber && trailerNumber.trim() !== '') {
            ediRawData = ediRawData.replace(/\{trailerNumber\}/g, trailerNumber.toString());
        }

        // Always replace date placeholders
        if (updatedToday) {
            ediRawData = ediRawData.replace(/\{Today\}/g, today);
        }

        if (updateTomorrow) {
            ediRawData = ediRawData.replace(/\{Tomorrow\}/g, tomorrow);
        }

        return ediRawData?.trim() ?? null;
    }
    /**
     * @description Updates the EDI 214 data with dynamic values.
     * @param ediRawData The raw EDI 214 data to be updated.
     * @returns The updated EDI 214 data with dynamic values.
     * @author Rohit Singh
     * @modified 2025-07-29
     */
    async updateEdi214Data(ediRawData: string, bolNumber: string, loadId: string, containerCode: string, trailerNumber: string, hours: string, minutes: string): Promise<string> {
        const Time = hours + minutes;
        const updateEdi214Data = ediRawData
            .replace(/\{BOLNumber\}/g, bolNumber)
            .replace(/\{LoadID\}/g, loadId)
            .replace(/\{Today\}/g, await commonReusables.getDate("today", "MM/DD/YY"))
            .replace(/\{Tomorrow\}/g, await commonReusables.getDate("tomorrow", "MM/DD/YY"))
            .replace(/\{containerCode\}/g, containerCode)
            .replace(/\{trailerNumber\}/g, trailerNumber)
            .replace(/\{Time\}/g, Time);
        return updateEdi214Data;
    }
    /**
     * @author Rohit Singh
     * @created 2025-08-07
     * @description Updates the EDI 210 data with dynamic values.
     * @param ediRawData The raw EDI 210 data to be updated.
     * @param bolNumber The BOL number to be inserted into the EDI data.
     * @param loadId The Load ID to be inserted into the EDI data.
     * @param containerCode The container code to be inserted into the EDI data.
     * @param trailerNumber The trailer number to be inserted into the EDI data.
     * @param minutes The minutes value to be inserted into the EDI data.
     * @returns The updated EDI 210 data with dynamic values.
     */
    async updateEdi210Data(ediRawData: string, bolNumber: string, loadId: string, containerCode: string, trailerNumber: string, pickInHours: number,pickOutHours: number, dropInHours: number, dropOutHours: number, pickInMinutes: string,pickOutMinutes: string, dropInMinutes: string, dropOutMinutes: string): Promise<string> {
        if (pickInHours>=24) {
            pickInHours = (pickInHours - 24);
            pickOutHours = (pickOutHours - 24);
            dropInHours = (dropInHours - 24);
            dropOutHours = (dropOutHours - 24);
        }
        const pickInHour = pickInHours.toString().padStart(2, '0');
        const pickOutHour = pickOutHours.toString().padStart(2, '0');
        const dropInHour = dropInHours.toString().padStart(2, '0');
        const dropOutHour = dropOutHours.toString().padStart(2, '0');
        const updateEdi210Data = await ediRawData
            .replace(/\{BOLNumber\}/g, bolNumber)
            .replace(/\{LoadID\}/g, loadId)
            .replace(/\{Today\}/g, await commonReusables.getDate("today", "MM/DD/YY"))
            .replace(/\{containerCode\}/g, containerCode)
            .replace(/\{trailerNumber\}/g, trailerNumber)
            .replace(/\{PickInHours\}/g, pickInHour)
            .replace(/\{PickOutHours\}/g, pickOutHour)
            .replace(/\{PickInMinutes\}/g, pickInMinutes.toString())
            .replace(/\{PickOutMinutes\}/g, pickOutMinutes.toString())
            .replace(/\{DropInHours\}/g, dropInHour)
            .replace(/\{DropOutHours\}/g, dropOutHour)
            .replace(/\{DropInMinutes\}/g, dropInMinutes.toString())
            .replace(/\{DropOutMinutes\}/g, dropOutMinutes.toString());
        return updateEdi210Data;
    }
    /**
     * @author Rohit Singh
     * @created 2025-07-30
     * @returns A promise that resolves to a number representing the next trailer number.
     * @description Reads a number from a file, increments it by 1, and writes it back to the file.
     */
    async getAndIncrementNumber(): Promise<number> {
        const filePath = 'src/data/api/number.txt';
        let number = 100000;
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            const parsed = parseInt(data, 10);
            if (!isNaN(parsed)) {
                number = parsed;
            }
        } catch (err) {
            // If file doesn't exist, start from 100000
        }
        number += 1;
        await fs.writeFile(filePath, number.toString(), 'utf-8');
        return number;
    }
    async updateEdi204IntermodalRawData(rawData: string, bolNumber: string, hours: string, minutes: string){
        const edi204RawData = await dataConfigAPI.getEDIRawData(rawData);
        // const bolNumber = await dynamicDataAPI.getBolNumber();
        const actualDateP1 = await commonReusables.formatDateToYYYYMMDD(commonReusables.today);
        const actualDateD1 = await commonReusables.formatDateToYYYYMMDD(commonReusables.today);
        const actualDateP2 = await commonReusables.formatDateToYYYYMMDD(commonReusables.tomorrow);
        const actualDateD2 = await commonReusables.formatDateToYYYYMMDD(commonReusables.tomorrow);
        const Time = hours + minutes;
        // Replace all placeholders in the raw data
        const updatedRawData = await edi204RawData
            .replace(/\$\{BOLNumber\}/g, bolNumber)
            .replace(/\$\{Time\}/g, Time)
            .replace(/\$\{ActualDateP1\}/g, actualDateP1)
            .replace(/\$\{ActualDateD1\}/g, actualDateD1)
            .replace(/\$\{ActualDateP2\}/g, actualDateP2)
            .replace(/\$\{ActualDateD2\}/g, actualDateD2);
            await console.log("Updated EDI 204 Raw Data:", updatedRawData);
            return updatedRawData;
    }
    /**
     * @author Rohit Singh
     * @created 2025-08-08
     * @description Updates the EDI 210 raw data with the provided Carrier Name and Carrier ID.
     * @param edi210RawData - The raw EDI 210 data to be updated.
     * @param carrierName - The Carrier Name to be inserted into the EDI data.
     * @param carrierId - The Carrier ID to be inserted into the EDI data.
     * @returns Updated EDI 210 raw data as a string.
     */
    async updateEdi210_410RawData(ediRawData: any, carrierName: string, carrierId: string, loadId: string, InvoiceNumber: string): Promise<string> {
        const edi210RawData = await dataConfigAPI.getEDIRawData(ediRawData);
        const updatedEdi210RawData = await edi210RawData
            .replace(/\{CarrierName\}/g, carrierName)
            .replace(/\{CarrierId\}/g, carrierId)
            .replace(/\{LoadId\}/g, loadId)
            .replace(/\{InvoiceNumber\}/g, InvoiceNumber)
            .replace(/\{Today\}/g, await commonReusables.getDate("today", "MM/DD/YY"));
        return updatedEdi210RawData;
    }
    /**
     * @author Rohit Singh
     * @created 2025-08-21
     * @description Updates the EDI 210 raw data with the provided Carrier Name and Carrier ID.
     * @param edi210RawData - The raw EDI 210 data to be updated.
     * @returns Updated EDI 210 raw data as a string.
     */
    async updateEdi204TruckLoadRawData(rawData: any, bolNumber: string): Promise<string> {
        const data = await dataConfigAPI.getEDIRawData(rawData);
        const updatedData = await data
            .replace(/\{BOLNumber\}/g, bolNumber)
            .replace(/\{Today\}/g, await commonReusables.getDate("today", "YYYYMMDD"))
            .replace(/\{Tomorrow\}/g, await commonReusables.getDate("tomorrow", "YYYYMMDD"));
        await console.log("Updated EDI 204 Truck Load Raw Data:", updatedData);
        return updatedData;
    }

        /**
     * @author Parth Rastogi
     * @created 2025-09-21
     * @description Updates the EDI 210 raw data with the provided Carrier Name and Carrier ID.
     * @param edi210RawData - The raw EDI 210 data to be updated.
     * @returns Updated EDI 210 raw data as a string.
     */
    async updateEdi204TLRawData(rawData: any, bolNumber: string): Promise<string> {
        const data = await dataConfigAPI.getEDIRawData(rawData);
        const updatedData = await data
            .replace(/\{BOLNumber\}/g, bolNumber)
            .replace(/\{Tomorrow\}/g, await commonReusables.getDate("tomorrow", "YYYYMMDD"))
            .replace(/\{DayAfterTomorrow\}/g, await commonReusables.getDate("dayAfterTomorrow", "YYYYMMDD"));
        await console.log("Updated EDI 204 Truck Load Raw Data:", updatedData);
        return updatedData;
    }

      /**
     * @author Deepak Bohra
     * @created 2025-09-25
     * @description Updates the EDI 210 raw data with the provided Carrier Name and Carrier ID.
     * @param edi210RawData - The raw EDI 210 data to be updated.
     * @returns Updated EDI 210 raw data as a string.
     */
   async dynamicUpdateEdi204TLRawData(rawData: any, replacements: Record<string, string>): Promise<string> {
    const data = await dataConfigAPI.getEDIRawData(rawData);
    let updatedData = data;

    // Replace all placeholders using the replacements object
    for (const [key, value] of Object.entries(replacements)) {
        updatedData = updatedData.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }

    await console.log("Updated EDI 204 Truck Load Raw Data:", updatedData);
    return updatedData;
}


}
const dynamicDataAPI = new DynamicDataAPI();
export default dynamicDataAPI;
