export class BulkChangeConstants {

    static readonly REFERENCE_TYPE = {
        PO: "PO#",
        PRO: "PRO#",
        SHIP: "SHIP#",
        CUST_REF: "CUST REF#"
    } as const;

    static readonly CARRIER_CONFIRMATION_TYPE = {
        EDI: "EDI",
        EMAIL: "EMAIL"
    } as const;

    static readonly BOL_HEADER_STYLE = {
        BOL: "BOL",
        BOL_MASTER: "BOL (master)",
        SUNTECK_14785_PRESTON_ADDRESS: "Sunteck - 14785 Preston address",
        TTS_14785_PRESTON_ADDRESS: "TTS - 14785 Preston address",
        CUSTOMER_NAME_WITH_LOGO_AGENT_OFFICE_ADDRESS: "Customer Name w Logo - Agent Office Address",
        TTS_AGENT_OFFICE_ADDRESS: "TTS - Agent Office Address",
        CUSTOMER_NAME_SUNTECK_14785_PRESTON_ADDRESS: "Customer Name % Sunteck - 14785 Preston address",
        CUSTOMER_NAME_TTS_14785_PRESTON_ADDRESS: "Customer Name % TTS - 14785 Preston address",
        SUNTECK_CUSTOMER_NAME_14785_PRESTON_ADDRESS: "Sunteck % Customer Name - 14785 Preston address"
    } as const;

    static readonly SELECT_CHANGES_TYPE = {    
        STATUS: "Status",
        ADD_REPLACE_REFERENCE: "Add/Replace Reference",
        UPDATE_SHIP_DELIVERY_DATE: "Update Ship/Delivery Date",
        PRINT_BOL: "Print BOL",
        SEND_CARRIER_CONFIRMATION: "Send Carrier Confirmation",
        CHANGE_PICK_DROP_LOCATION: "Change Pick/Drop Location",
        CHOOSE_A_CARRIER: "Choose a Carrier"
    } as const;
}

//declare global variables
declare global {
    const REFERENCE_TYPE: typeof BulkChangeConstants.REFERENCE_TYPE;
    const CARRIER_CONFIRMATION_TYPE: typeof BulkChangeConstants.CARRIER_CONFIRMATION_TYPE;
    const BOL_HEADER_STYLE: typeof BulkChangeConstants.BOL_HEADER_STYLE;
    const SELECT_CHANGES_TYPE: typeof BulkChangeConstants.SELECT_CHANGES_TYPE;
}

//Assign to globalThis if available
if (typeof globalThis !== 'undefined') {
    (globalThis as any).REFERENCE_TYPE = BulkChangeConstants.REFERENCE_TYPE;
    (globalThis as any).CARRIER_CONFIRMATION_TYPE = BulkChangeConstants.CARRIER_CONFIRMATION_TYPE;
    (globalThis as any).BOL_HEADER_STYLE = BulkChangeConstants.BOL_HEADER_STYLE;
    (globalThis as any).SELECT_CHANGES_TYPE = BulkChangeConstants.SELECT_CHANGES_TYPE;
}