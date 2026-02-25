import axios from "axios";

class PostMarkUtils {
   private apiKey: string | null = null;

    constructor() {
        this.apiKey = process.env.POSTMARK_API_KEY || null;
    }

    private validateApiKey(): void {
        if (!this.apiKey) {
            throw new Error("POSTMARK_API_KEY environment variable is not set");
        }
    }
    
    /**
     * Get Message ID from Postmark API with retry logic
     * @author Rohit Singh
     * @created 2026-01-07
     * @param subject Subject of the email to filter messages 
     * @returns 
     */
    async getMessageID(subject?: string): Promise<any> {
        await this.validateApiKey();
        const maxRetries = 5;
        const pollInterval = WAIT.SMALL; // 10 seconds

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios.get(`https://api.postmarkapp.com/messages/outbound`, {
                    params: {
                        count: 1,
                        offset: 0,
                        subject: `*${subject}*`
                    },
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Postmark-Server-Token': this.apiKey,
                    },
                });
                const messageID = response.data.Messages[0]?.MessageID;
                if (messageID) {
                    return messageID;
                }
                console.log(`Attempt ${attempt}/${maxRetries}: Message ID not found, retrying in ${pollInterval / 1000} seconds`);
            } catch (error) {
                console.error(`Attempt ${attempt}/${maxRetries}: Error fetching message ID:`, error);
            }

            // Wait before retrying (except on last attempt)
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }
        throw new Error("Failed to retrieve message ID after 5 retry attempts");
    }

    /**
     * Get Message Body from Postmark API using Message ID
     * @author Rohit Singh
     * @created 2026-01-07
     * @param messageID Message ID of the email 
     * @returns 
     */
    async getMessageData(messageID: string): Promise<any> {
        await this.validateApiKey();
        const response = await axios.get(`https://api.postmarkapp.com/messages/outbound/${messageID}/details`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Postmark-Server-Token': this.apiKey,
            },
        });
        return response.data;
    }

    /**
     * Convert HTML body to plain text
     * @author Rohit Singh
     * @created 13-Jan-2026
     * @param htmlBody HTML content to convert
     * @returns Plain text version of the HTML content
     */
    public convertHtmlToPlainText(htmlBody: string): string {
        if (!htmlBody) {
            return "";
        }
        let plainText = htmlBody
            // Remove script and style elements
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            // Convert <br>, <br/>, <br /> tags to newlines
            .replace(/<br\s*\/?>/gi, "\n")
            // Convert <p>, <div> tags to newlines (with spacing)
            .replace(/<\/(p|div)>/gi, "\n")
            .replace(/<(p|div)[^>]*>/gi, "")
            // Convert <li> tags
            .replace(/<li[^>]*>/gi, "\n• ")
            .replace(/<\/li>/gi, "")
            // Convert <a> tags to text with URL
            .replace(/<a\s+href=["']([^"']*?)["'][^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
            // Remove all other HTML tags
            .replace(/<[^>]+>/g, "")
            // Decode HTML entities
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            // Remove extra whitespace
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join("\n");

        return plainText;
    }

}
const postMarkUtils = new PostMarkUtils();
export default postMarkUtils;