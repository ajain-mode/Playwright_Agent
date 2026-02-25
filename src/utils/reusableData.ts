import commonReusables from "./commonReusables";

class ReusableData {
    /**
     * Generates a random US phone number
     * @param format - The format of the phone number ('dashes' or 'digits')
     * @returns A US phone number string
     * @author Rohit Singh
     * @created 2025-Oct-28
     */
    generatePhoneNumber(format: 'dashes' | 'digits' = 'dashes'): string {
        let areaCode = Math.floor(Math.random() * 700) + 200;
        if (areaCode >= 800 && areaCode <= 899) {
            areaCode = Math.floor(Math.random() * 100) + 900; // Use 900-999 range instead
        }
        const centralOffice = Math.floor(Math.random() * 800) + 200;
        const stationNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        if (format === 'digits') {
            return `${areaCode}${centralOffice}${stationNumber}`;
        } else {
            return `${areaCode}-${centralOffice}-${stationNumber}`;
        }
    }
    /**
     * Generates a random email address with @modetranspotation.com domain
     * @returns A random email address string
     * @author Rohit Singh
     * @created 2025-Oct-28
     */
    generateEmailAddress(): string {
        const domain = '@modeglobal.com';
        // Generate random username
        const adjectives = ['test', 'user', 'demo', 'qa', 'temp', 'sample'];
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNumber = commonReusables.generateRandomNumber(4);
        const username = `at-${randomNumber}-${randomAdjective}`;
        return `${username}${domain}`;
    }

}
const reusableData = new ReusableData();
export default reusableData;