import axios from "axios";
import apiAuth from "./apiAuth";

class APIHeaders {

    private ediHeaders: Record<string, string>;
    private ltlQuoteRequestHeader: Record<string, string>;
    private bookLoadRequestHeader: Record<string, string>;

    constructor() {
        this.ediHeaders = {
            Authorization: 'Bearer a300c712a5c3130d28c013be64500691f974caf8',
            'Content-Type': 'text/plain',
        }
        //@modified: Rohit Singh - 11-11-2025 LTL Quote Request Headers
        this.ltlQuoteRequestHeader = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Connection': 'keep-alive',
            'Accept-Encoding': 'gzip, deflate, br',
        }
        //@modified: Rohit Singh - 11-11-2025 LTL Quote Request Headers
        this.bookLoadRequestHeader = {
            'Content-Type': 'application/json',
        }
    }
    /**
     * Returns the EDI headers for API requests.
     * @returns {Record<string, string>} The EDI headers.
     * @author Rohit Singh
     * @modified 2025-07-17
     */
    public getHeaders(): Record<string, string> {
        return this.ediHeaders;
    }
    /**
     * Returns the LTL Quote Request headers for API requests.
     * @returns {Record<string, string>} The LTL Quote Request headers.
     * @author Rohit Singh
     * @modified 2025-11-11
     */
    public async getLTLQuoteRequestHeaders(authUser: any): Promise<Record<string, string>> {
        const accessToken = await apiAuth.getAccessToken(authUser);
        return {
            ...this.ltlQuoteRequestHeader,
            'Authorization': `Bearer ${accessToken}`
        };
    }
    /**
     * Returns the Book Load Request headers for API requests.
     * @returns {Record<string, string>} The Book Load Request headers.
     * @author Rohit Singh
     * @modified 2025-11-11
     */
    public async bookLoadRequestHeaders(authUser: any): Promise<Record<string, string>> {
        const accessToken = await apiAuth.getAccessToken(authUser);
        return {
            ...this.bookLoadRequestHeader,
            'Authorization': `Bearer ${accessToken}`
        };
    }
    /**
     * Returns the LTL Quote Request headers for API requests based on client credentials.
     * @returns {Record<string, string>} The LTL Quote Request headers.
     * @author Rohit Singh
     * @modified 2025-11-25 
     */
    public async ltlQuoteRequestMultiAuthHeader(clientId: string, clientSecret: string): Promise<Record<string, string>> {
        // const accessToken = await apiAuth.getAccessToken(authUser);
        const authUser = {
            grant_type: 'client_credentials',
            client_id: `${clientId}`,
            client_secret: `${clientSecret}`,
        }
        try {
            const response = await axios.post(apiAuth.authUrl, authUser, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const accessToken = response.data.access_token;
            return {
                ...this.ltlQuoteRequestHeader,
                'Authorization': `Bearer ${accessToken}`
            };
        } catch (error) {
            console.error('Failed to get access token:', error);
            throw error;
        }
    }
}
const apiHeaders = new APIHeaders();
export default apiHeaders;