export class CarrierConstants {
    static readonly CARRIER_SEARCH_FILTERS = {
        SAFETY_RATING_SFD: "Safety Rating/SFD",
        LOAD_METHOD: "Load Method",
        CARRIER_MODE: "Carrier Mode",
        VENDOR_TYPE: "Vendor Type",
        CARRIER_STATUS: "Status",
        INV_PROCESS_GROUP: "Inv Process Group",
        BROKER_AUTHORITY: "Broker Authority",
        HOLD_PAY_REASON: "Hold Pay Reason",
        MINORITY_STATUS: "Minority Status",
        AVG_RATING: "Avg. Rating",
        LOADBOARD_STATUS: "Loadboard Status",
        MIN_POWER_UNITS: "Min Power Units",
        EQUIPMENT: "Equipment",
        OBSERVED_REPORTED_EQUIPMENT: "Observed/Reported Equipment"
    } as const;

    static readonly SAFETY_RATING_SFD = {
        SATISFACTORY: "Satisfactory",
        CONDITIONAL: "Conditional",
        UNSATISFACTORY: "Unsatisfactory",
        NONE: "None"
    } as const;
    /**
     * @author Rohit Singh
     * @created 12-Dec-2025
     * @description Inventory Process Group search Constants
     */
    static readonly INV_PROCESS_GROUP = {
        STANDARD: "Standard",
        NEW: "New",
        INTERNAL: "Internal",
        REVIEW: "Review"
    } as const;

    /**
 * @author Aniket Nale
 * @created 15-Dec-2025
 * @description Vendor Type search Constants
 */
    static readonly VENDOR_TYPE = {
        AIR_CARRIER: "Air Carrier",
        BANKING_SERVICE: "Banking Service",
        EQUIPMENT_PROVIDER: "Equipment Provider",
        CUSTOMS_BROKER: "Customs Broker",
    } as const;

    /**
* @author Aniket Nale
* @created 15-Dec-2025
* @description Vendor Type search Constants
*/
    static readonly CARRIER_MODE = {
        ROAD: "Road",
        AIR: "Air",
        RAIL: "Rail",
        SEA: "Sea",
    } as const;

    /**
* @author Aniket Nale
* @created 15-Dec-2025
* @description Broker Authority search Constants
*/
    static readonly BROKER_AUTHORITY = {
        ACTIVE: "ACTIVE",
        INACTIVE: "INACTIVE",
        NONE: "NONE",
    } as const;
}
// Declare global variables
declare global {
    const CARRIER_SEARCH_FILTERS: typeof CarrierConstants.CARRIER_SEARCH_FILTERS;
    const SAFETY_RATING_SFD: typeof CarrierConstants.SAFETY_RATING_SFD;
    const INV_PROCESS_GROUP: typeof CarrierConstants.INV_PROCESS_GROUP;
    const VENDOR_TYPE: typeof CarrierConstants.VENDOR_TYPE;
    const CARRIER_MODE: typeof CarrierConstants.CARRIER_MODE;
    const BROKER_AUTHORITY: typeof CarrierConstants.BROKER_AUTHORITY;
}

// Assign to globalThis if available
if (typeof globalThis !== 'undefined') {
    (globalThis as any).CARRIER_SEARCH_FILTERS = CarrierConstants.CARRIER_SEARCH_FILTERS;
    (globalThis as any).SAFETY_RATING_SFD = CarrierConstants.SAFETY_RATING_SFD;
    (globalThis as any).INV_PROCESS_GROUP = CarrierConstants.INV_PROCESS_GROUP;
    (globalThis as any).VENDOR_TYPE = CarrierConstants.VENDOR_TYPE;
    (globalThis as any).CARRIER_MODE = CarrierConstants.CARRIER_MODE;
    (globalThis as any).BROKER_AUTHORITY = CarrierConstants.BROKER_AUTHORITY;
}