import commonReusables from "@utils/commonReusables";
import dataConfigAPI from "@config/dataConfigAPI";
import axios from "axios";
import apiHeaders from "./apiHeader";
import loginSetup from "@loginHelpers/loginSetup";



class APIRequests {

    /**
     * Sends an EDI 204 request and returns the response and BOL number.
     * @returns {Promise<{ response: any, bolNumber: string }>} The response and BOL number.
     * @author Rohit Singh
     * @modified 2025-07-17
     */
    async sendEDI204Request(updatedRawData: string): Promise<{ response: any }> {
        const response = await axios.post(dataConfigAPI.getApiBaseUrl() + 'edi/204', updatedRawData, {
            headers: apiHeaders.getHeaders(),
            validateStatus: () => true,
        });

        // Send request
        return { response };
    }
    /**
     * Sends an EDI 990 request and returns the response.
     * @param loadId - The Load ID to be included in the EDI 990 request.
     * @returns {Promise<any>} The response from the EDI 990 request.
     * @author Rohit Singh
     * @modified 2025-07-21
     */
    async send824Request(fileName: string, loadId: string, containerCode: string, trailerNumber: string, hours: string, minutes: string, bolNumber: string = ''): Promise<any> {
        const edi824RawData = await dataConfigAPI.getEDIRawData(fileName);
        const Time = hours + minutes;
        const updatedRawData = await edi824RawData
            .replace(/\{BOLNumber\}/g, bolNumber)
            .replace(/\{LoadID\}/g, loadId)
            .replace(/\{containerCode\}/g, containerCode)
            .replace(/\{trailerNumber\}/g, trailerNumber)
            .replace(/\{Time\}/g, Time);

        const response = await axios.post(dataConfigAPI.getApiBaseUrl() + 'edi/824', updatedRawData, {
            headers: apiHeaders.getHeaders(),
            validateStatus: () => true,
        });
        return response;

    }
    /**
     * Sends an EDI 322 request and returns the response.
     * @param loadId - The Load ID to be included in the EDI 322 request.
     * @param containerCode - The container code to be included in the EDI 322 request.
     * @param trailerNumber - The trailer number to be included in the EDI 322 request.
     * @returns {Promise<any>} The response from the EDI 322 request.
     * @author Rohit Singh
     * @modified 2025-07-24
     */
    async send322Request(loadId: string, containerCode: string, trailerNumber: string): Promise<any> {
        const today = await commonReusables.formatDateToYYYYMMDD(commonReusables.today);
        const edi322RawData = await dataConfigAPI.getEDIRawData(dataConfigAPI.edi322RawData);
        const updatedRawData = await edi322RawData
            .replace(/\{LoadID\}/g, loadId)
            .replace(/\{Today\}/g, today)
            .replace(/\{containerCode\}/g, containerCode)
            .replace(/\{trailerNumber\}/g, trailerNumber);

        const response = await axios.post(dataConfigAPI.getApiBaseUrl() + 'edi/322', updatedRawData, {
            headers: apiHeaders.getHeaders(),
            validateStatus: () => true,
        });
        return response;
    }
    /**
     * Sends an EDI 210 request and returns the response.
     * @param ediRawData - The raw EDI 210 data to be sent.
     * @returns {Promise<any>} The response from the EDI 210 request.
     * @author Rohit Singh
     * @modified 2025-08-08
     */
    async sendEDI210_410Request(ediRawData: string, endPoint: string): Promise<any> {
        const response = await axios.post(dataConfigAPI.getApiBaseUrl() + `edi/${endPoint}`, ediRawData, {
            headers: apiHeaders.getHeaders(),
            validateStatus: () => true,
        });
        return response;
    }
    /**
     * Sends an EDI 990 request and returns the response.
     * @param updatedRawData - The updated raw data for the EDI 990 request.
     * @returns {Promise<any>} The response from the EDI 990 request.
     * @author Rohit Singh
     * @created 2025-09-08
     */
    async sendEDI990RequestTruckLoad(ediRawData: string, loadId: string): Promise<any> {
        const updatedRawData = await ediRawData.replace(/\{LoadID\}/g, loadId);
        const response = await axios.post(dataConfigAPI.getApiBaseUrl() + 'edi/990', updatedRawData, {
            headers: apiHeaders.getHeaders(),
            validateStatus: () => true,
        });
        return response;
    }
    async sendEDI214_213RequestTruckLoad(updatedEdiRawData: string, endPoint: string, loadId: string, date: string, bolNumber: string): Promise<any> {
        const updatedData = await updatedEdiRawData.replace(/\{LoadID\}/g, loadId)
            .replace(/\{Today\}/g, date)
            .replace(/\{BOLNumber\}/g, bolNumber);
        await console.log(`Updated EDI ${endPoint} Data: `, updatedData);
        const response = await axios.post(dataConfigAPI.getApiBaseUrl() + `edi/${endPoint}`, updatedData, {
            headers: apiHeaders.getHeaders(),
            validateStatus: () => true,
        });
        return response;
    }
    /**
     * @author : Rohit Singh
     * @created : 2025-11-11
     * Sends LTL Rate Quote API Request
     * @returns {Promise<any>} The response from the LTL Rate Quote API Request
     * @param authUser - The authentication user details to be used for getting the access token.i.e. LogoChair or ELOGISTEK
     */
    async ltlRateQuoteAPIRequest(authUser: any): Promise<any> {
        let EarliestDateTime1 = await commonReusables.getDate('today', 'YYYY-MM-DD');
        EarliestDateTime1 = EarliestDateTime1 + 'T13:00:00.000Z';
        let EarliestDateTime2 = await commonReusables.getDate('tomorrow', 'YYYY-MM-DD');
        EarliestDateTime2 = EarliestDateTime2 + 'T15:00:00.000Z';
        const ltlRequestRatesRawData = (await dataConfigAPI.getEDIRawData(dataConfigAPI.ltlRequestRates))
            .replace(/\{EarliestDateTime1\}/g, EarliestDateTime1)
            .replace(/\{EarliestDateTime2\}/g, EarliestDateTime2);
        console.log('LTL Rate Quote Request Data: ', ltlRequestRatesRawData);
        const response = await axios.post(loginSetup.apiUrl + 'rate/v1/ltl?timeout=25', ltlRequestRatesRawData, {
            headers: await apiHeaders.getLTLQuoteRequestHeaders(authUser),
            validateStatus: () => true,
        });
        return response;
    }
    /**
     * @author : Rohit Singh
     * @created : 2025-11-17
     * Gets Rates from Quote ID API Request
     * @returns {Promise<any>} The response from the Get Rates from Quote ID API Request
     * @param quoteId - The Quote ID to get the rates for
     */
    async getRatesFromQuoteIdAPIRequest(quoteId: string, authUser: any): Promise<any> {
        const response = await axios.get(loginSetup.apiUrl + `rate/v1/${quoteId}?timeout=25`, {
            headers: await apiHeaders.getLTLQuoteRequestHeaders(authUser),
            validateStatus: () => true,
        });
        return response;
    }
    /**
     * @author : Rohit Singh
     * @created : 2025-11-17
     * Books Load from Quote ID API Request
     * @returns {Promise<any>} The response from the Book Load from Quote ID API Request
     * @param quoteId - The Quote ID to book the load for
     * @param priceSheetId - The Price Sheet ID to book the load for
     */
    async bookLoadFromQuoteIdAPIRequest(authUser: any, quoteId: string, priceSheetId: string, reference: string): Promise<any> {
        const earliestDate1 = await commonReusables.getDate('today', 'YYYY-MM-DD');
        const earliestDate2 = await commonReusables.getDate('tomorrow', 'YYYY-MM-DD');
        const updatedData = (await dataConfigAPI.getEDIRawData(dataConfigAPI.bookLoadRequest)).replace(/\{QuoteId\}/g, quoteId)
            .replace(/\{PriceSheetId\}/g, priceSheetId)
            .replace(/\{Reference\}/g, reference)
            .replace(/\{EarliestDate1\}/g, earliestDate1)
            .replace(/\{EarliestDate2\}/g, earliestDate2);
        // console.log('Book Load Request Data: ', updatedData);
        const headers = await apiHeaders.bookLoadRequestHeaders(authUser);
        // console.log('Book Load Request Headers: ', headers); 
        const requestBody = JSON.parse(updatedData);
        const response = await axios.post(loginSetup.apiUrl + "book/v1/ltl", requestBody, {
            headers: headers,
            validateStatus: () => true,
        });
        return response;
    }
    /**
     * @author : Rohit Singh
     * @created : 2025-11-18
     * Books Load without quote Id API Request
     * @returns {Promise<any>} The response from the Book Load API Request: Load Id
     * @param reference - The unique reference to book the load.
     */
    async book_RequestLoadFromQuoteIdAPIRequest(fileName:string, authUser: any, reference: string): Promise<any> {
        const earliestDate1 = await commonReusables.getDate('today', 'YYYY-MM-DD');
        const earliestDate2 = await commonReusables.getDate('tomorrow', 'YYYY-MM-DD');
        const updatedData = (await dataConfigAPI.getEDIRawData(fileName))
            .replace(/\{Reference\}/g, reference)
            .replace(/\{EarliestDate1\}/g, earliestDate1)
            .replace(/\{EarliestDate2\}/g, earliestDate2);
        console.log('Book Load Request Data: ', updatedData);
        const headers = await apiHeaders.bookLoadRequestHeaders(authUser);
        // console.log('Book Load Request Headers: ', headers); 
        const requestBody = JSON.parse(updatedData);
        const response = await axios.post(loginSetup.apiUrl + "book-request/v1/ltl", requestBody, {
            headers: headers,
            validateStatus: () => true,
        });
        return response;
    }
    /**
     * @author : Rohit Singh
     * @created : 2025-11-18
     * Get Load without quote Id API Request
     * @returns {Promise<any>} The response from the Book Load API Request: Load Id
     * @param reference - The unique reference to book the load.
     */
    async getLoadDetailsAPIRequest(authUser: any, loadId: string): Promise<any> {
        const response = await axios.get(loginSetup.apiUrl + `details/v1/${loadId}`, {
            headers: await apiHeaders.getLTLQuoteRequestHeaders(authUser),
            validateStatus: () => true,
        });
        return response;
    }
    /**
     * @author : Rohit Singh
     * @created : 2025-11-19
     * Get Load without quote Id API Request
     * @returns {Promise<any>} The response from the Book Load API Request: Load Id
     * @param reference - The unique reference to book the load.
     */
    async getLoadTrackingDetailsAPIRequest(authUser: any, loadId: string): Promise<any> {
        const response = await axios.get(loginSetup.apiUrl + `track/v1/${loadId}`, {
            headers: await apiHeaders.getLTLQuoteRequestHeaders(authUser),
            validateStatus: () => true,
        });
        return response;
    }
    /**
     * @author : Rohit Singh
     * @created : 2025-11-19
     * Get Load without quote Id API Request
     * @returns {Promise<any>} The response from the Book Load API Request: Load Id
     * @param reference - The unique reference to book the load.
     */
    async getLoadDocumentsAPIRequest(authUser: any, loadId: string): Promise<any> {
        const response = await axios.get(loginSetup.apiUrl + `documents/v1/${loadId}`, {
            headers: await apiHeaders.getLTLQuoteRequestHeaders(authUser),
            validateStatus: () => true,
        });
        return response;
    }
}
const apiRequests = new APIRequests();
export default apiRequests;