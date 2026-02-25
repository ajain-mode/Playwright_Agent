// Global constants for selectors
export const OFFER_RATE_INPUT_ID = "carr_1_target_rate";
/**
 * Global Constants File
 * Contains all reusable constant values used across the test automation framework
 * This helps maintain consistency and makes updates easier when UI text changes
 */

export class GlobalConstants {
  static readonly WAIT = {
    DEFAULT: 3000,
    SMALL: 10000,
    MID: 15000,
    LARGE: 20000,
    XLARGE: 30000,
    SPEC_TIMEOUT: 600000,
    SPEC_TIMEOUT_LARGE: 900000,
    XXLARGE: 120000,
  } as const;

  // Navigation Header Menu Items
  static readonly HEADERS = {
    ADMIN: "Admin",
    HOME: "Home",
    CUSTOMER: "Customers",
    AGENT: "Agent",
    OFFICE: "Office",
    LOAD: "Loads",
    REPORTS: "Reports",
    CARRIER: "Carriers",
    FINANCE: "Finance"
  } as const;

  // Admin Sub-Menu Items
  static readonly ADMIN_SUB_MENU = {
    OFFICE_SEARCH: "Office Search",
    ADMIN_TOOLS: "Admin Tools",
    SYSTEM_CONFIG: "System Config",
    POST_AUTOMATION: "Post Automation",
    OFFICE_CONFIG: "Office Config",
    AGENT_SEARCH: "Agent Search",
  } as const;

  static readonly CUSTOMER_SUB_MENU = {
    SEARCH: "Search",
    NEW_SALES_LEAD: "New Lead",
    LEADS: "Leads",
  } as const;
  /**
   * @description Finance Sub-Menu Items.
   * @author Rohit Singh
   * @modified 2025-11-28
   */
  static readonly FINANCE_SUB_MENU = {
    PAYABLES: "Payables",
    OFFICE_SEARCH: "Office Search",
    COMMISSION_AUDIT_QUEUE: "Commission Audit Queue",
    BILLING_ADJUSTMENTS_QUEUE: "Billing Adjustments Queue",
  } as const;

  //Agent Sub-Menu Items
  static readonly AGENT_SUB_MENU = {
    AGENT_SEARCH: "Agent Search",
  } as const;

  /**
* @author Aniket Nale
* @description Global constants carrier sub-menu for the test automation framework.
* @modified 25 Nov 2025
*/

  static readonly CARRIER_SUB_MENU = {
    SEARCH: "Search",
  } as const;

  // Load Types
  static readonly LOAD_TYPES = {
    NEW_LOAD_TL: "NEW LOAD - TL",
    CREATE_TL_NEW: "Create TL *NEW*",
    NEW_LTL_QUOTE: "NEW LTL QUOTE",
    NEW_LOAD_LTL: "NEW LOAD - LTL",
    NEW_LOAD_INTERMODAL: "NEW LOAD - Intermodal"
  } as const;

  static readonly CUSTOMER_NAME = {
    CUSTOMER_1: "AGRO SEVILLA-USA INC",
    CUSTOMER_2: "TRUCK MOVERS INC CORAOPOLIS",
    CUSTOMER_3: "DECAS CRANBERRY",
    CUSTOMER_4: "DOLLAR GENERAL CORPORATION - TL",
    CUSTOMER_5: "A S WATERS LLC",
  } as const;

  // Common Button Text
  static readonly BUTTONS = {
    SEARCH: "Search",
    CREATE: "Create",
    UPDATE: "Update",
    DELETE: "Delete",
    SAVE: "Save",
    CANCEL: "Cancel",
    SUBMIT: "Submit",
    CREATE_LOAD: "Create Load",
    EDIT: "Edit",
  } as const;

  // Tab Names
  static readonly LOAD_TABS = {
    LOAD: "Load",
    PICK: "Pick",
    DROP: "Drop",
    CARRIER: "Carrier",
    CUSTOMERS: "Customers",
  } as const;

  // Cargo Value Options
  static readonly CARGO_VALUES = {
    LESS_THAN_1000: "less than $1000",
    FROM_10001_TO_100000: "$10,001 to $100,000",
    FROM_100001_TO_250000: "$100,001 to $250,000",
    FROM_250001_TO_500000: "$250,001 to $500,000",
    DEFAULT: "",
  } as const;

  // Cargo Adjustment Values
  static readonly CARGO_ADJUSTMENT_VALUES = {
    ADJUSTMENT_AMOUNT: "100.00",
    MIN_MARKUP_AMOUNT: "50.00",
    MAX_MARKUP_AMOUNT: "150.00",
  } as const;

  // Cargo Value Options
  static readonly COUNTRY = {
    CANADA: "CANADA",
    USA: "UNITED STATES",
    BLANK: "",
  } as const;

  // Navigation Header Menu Items
  static readonly DFBLOAD_FORM = {
    CARRIER: "carr_1_target_rate",
    EXPIRATION_DATE: "form_expiration_date",
    EXPIRATION_TIME: "form_expiration_time",
  } as const;



  static readonly DUPLICATE_LOAD_CHECKBOX = {
    OFFICE_INFO: "Office Info",
    REFERENCES_INFO: "References Info",
    CUSTOMER_INFO: "Customer Info",
    STOP_INFO: "Stop Info",
    CARRIER_INFO: "Carrier Info",
    VENDOR_INFO: "Vendor Info",
    CUSTOMS_INFO: "Customs Info",
    RAIL_INFO: "Rail Info"
  } as const;

  // Status Values

  // Cost and Confidence Level constant
  static readonly CONFIDENCE_LEVEL = {
    confidenceLevel: 76, // or your dynamic value
  } as const;
  /**
   * @description Gets the Load Status.
   * @author Rohit Singh
   * @modified 2025-07-30
   */
  static readonly LOAD_STATUS = {
    ACTIVE: "ACTIVE",
    BOOKED: "BOOKED",
    DISPATCHED: "DISPATCHED",
    AT_ORIGIN: "AT ORIGIN",
    PICKED_UP: "PICKED-UP",
    IN_TRANSIT: "IN TRANSIT",
    OUT_FOR_DELIVERY: "OUT FOR DELIVERY",
    AT_DESTINATION: "AT DESTINATION",
    DELIVERED: "DELIVERED",
    DELIVERED_FINAL: "DELIVERED FINAL",
    INVOICED: "INVOICED",
    POOL: "POOL",
    DEAD: "DEAD",
    POSTED: "POSTED",
    MATCHED: "MATCHED",
    REQUESTED: "REQUESTED",
    NOT_POSTED: "NOT POSTED",
    PENDING: "PENDING",
    FAILED: "FAILED",
    BTMS_REQUESTED: "BTMS: REQUESTED",
    TNX_REQUESTED: "TNX: REQUESTED",
    BTMS_CANCELLED: "BTMS: CANCELLED",
    TNX_CANCELLED: "TNX: CANCELLED",
    TNX_BOOKED: "TNX: BOOKED",
  } as const;

  /**
   * @description Gets the Carrier Status.
   * @author Rohit Singh
   * @modified 02-Dec-2025
   */
  static readonly CARRIER_STATUS = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    CAUTION: "Caution",
    DNL: "DNL",
    ON_HOLD: "On Hold",
    ACTIVATE: "Activate",
    DEAD: "Dead"
  } as const;

  /**
   * @description Gets the EDI In Out.
   * @author Rohit Singh
   * @modified 2025-07-30
   */
  static readonly EDI_IN_OUT = {
    IN: "In",
    OUT: "Out",
  } as const;
  /**
   * @description Gets the EDI Type.
   * @author Rohit Singh
   * @modified 2025-07-30
   */
  static readonly EDI_CODE = {
    EDI_204: "204",
    EDI_214: "214",
    EDI_210: "210",
    EDI_990: "990",
    EDI_824: "824",
    EDI_322: "322",
    EDI_410: "410",
    EDI_213: "213",
  } as const;
  /**
   * @description Gets the EDI Status.
   * @author Rohit Singh
   * @modified 2025-07-30
   */
  static readonly EDI_STATUS = {
    AA: "AA",
    AG: "AG",
    OR: "OR",
    X3: "X3",
    I: "I",
    ACCEPTED: "Accepted",
    INVOICED: "Invoiced",
    UNKNOWN: "Unknown",
    REJECTED: "Rejected",
    ORIGINAL: "Original",
  } as const;
  /**
   * @description Gets the Commission Audit Status.
   * @author Avanish Srivastava
   * @created 2025-08-07
   */
  static readonly COMMISSION_AUDIT_STATUS = {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    OPEN: "OPEN",
    HOLD: "HOLD",
  } as const;
  /**
   * @description Gets the Internal Share Status.
   * @author Avanish Srivastava
   * @created 2025-08-12
   */
  static readonly INTERNAL_SHARE_STATUS = {
    YES: "YES",
    NO: "NO",
  } as const;

  // Agent Auth Level Options
  static readonly AGENT_AUTH_LEVEL = {
    NOACCESS: "NOACCESS",
    SALES: "SALES",
    DISPATCH: "DISPATCH",
    MANAGER: "MANAGER",
    FINANCE: "FINANCE",
    EXECUTIVE: "EXECUTIVE",
    ADMIN: "ADMIN",
  } as const;

  // Subset of auth levels allowed to create post automation rules
  static readonly AGENT_AUTH_ALLOWED = [
    "MANAGER",
    "FINANCE",
    "EXECUTIVE",
    "ADMIN",
  ] as const;

  /**
   * @description Get Customet Status.
   * @author Avanish Srivastava
   * @created 2025-09-11
   */
  static readonly CUSTOMER_STATUS = {
    NEW: "NEW",
    ACTIVE: "ACTIVE",
  } as const;

  /**
   * @description Gets the Move Type.
   * @author Rohit Singh
   * @modified 2025-08-18
   */
  static readonly MOVE_TYPE = {
    RAIL: "Rail",
    ORIGIN_DRAY: "Origin Dray",
    DESTINATION_DRAY: "Destination Dray",
  } as const;

  /**
   * @description Gets the TNX.
   * @author Deepak Bohra
   * @modified 2025-09-02
   */
  static readonly TNX = {
    MATCH_NOW: "Match Now",
    MATCH: "Match for ",
    YES_BUTTON: "Yes, I want it!",
    CARRIER_NAME: "ZZOO LOGISTICS LLC",
    CARRIER_NAME_1: "Sunteck Transport Co, LLC - Staging",
    CARRIER_BRAND_1: "Avenger Logistics, LLC - Staging",
    OFFER_RATE: "2000.00",
    OFFER_RATE_2: "3000.00",
    OFFER_RATE_3: "1000.00",
    OFFER_RATE_4: "500.00",
    OFFER_RATE_5: "1500.00",
    BID_RATE: "3500",
    BID_RATE_2: "500",
    CONGRATS_MESSAGE: "Congrats, successfully matched!",
    CARRIER_DISPATCH_NAME: "Deepak Bohra",
    CARRIER_DISPATCH_NAME_1: "Mode Staging Service",
    BID_HISTORY: "BID HISTORY",
    BID_BUTTON: "Bid",
    BID_NOW_BUTTON: "Bid Now",
    BID_SUCCESS_MESSAGE: "Bid added/updated successfully",
    CARRIER_EMAIL: "zzoologistics@gmail.com",
    BIDS: "Bids",
    SINGLE_BID_RECORD: "1 Bids",
    CARRIER_EMIAL_1: "service-tnx-stage@modeglobal.com",
    ACTIVE_JOBS: "Active Jobs",
    SINGLE_JOB_RECORD: "1 Jobs",

  } as const;

  /**
   * @description Gets the DFB Button.
   * @author Deepak Bohra
   * @modified 2025-09-02
   */
  static readonly DFB_Button = {
    Post: "submit",
    Clear_Form: "reset",
    Create_Rule: "create_rule",
    Cancel: "cancel",
  } as const;

  /**
   * @author Parth Rastogi
   * @description Global constants for the test automation framework.
   * @modified 2025-09-25
   */
  // Load Sub-Menu Items
  static readonly LOAD_SUB_MENU = {
    TEMPLATES: "Templates",
    CREATE_TL: "Create TL",
    SEARCH: "Search"
  } as const;

  /**
  * @author Parth Rastogi
  * @description Global constants for the test automation framework.
  * @modified 2025-09-25
  */
  static readonly LOAD_TEMPLATE_SEARCH_PAGE = {
    TEMPLATE_VALUE_1: "AGRO SEVILLA-USA INC",
    TEMPLATE_VALUE_2: "DFB TEMPLATE",
    TEMPLATE_VALUE_3: "DFB Automation Enabled",
    TEMPLATE_VALUE_4: "EPM - Laredo TX - Oelwein IA",
    TEMPLATE_VALUE_5: "TRUCK MOVERS INC CORAOPOLIS",
    TEMPLATE_VALUE_6: "DFB WAL-MART STORES INC",
    TEMPLATE_VALUE_7: "Ace master invoice",
    TEMPLATE_VALUE_8: "DG Canton MS to Bethel PA",
  } as const;

  /**
 * @author Aniket Nale
 * @description Global constants accessorial names for the test automation framework.
 * @modified 2025-09-25
 */

  static readonly ACCESSORIALS_NAME = {
    Blind_Shipment: "BLI",
    RESIDENTIAL_Pickup: "RSP",
    Liftgate_Delivery: "LFT",
    LIFT_GATE_ORIGIN: "LIFT GATE ORIGIN",
    LIFT_GATE_DESTINATION: "LIFT GATE DESTINATION",
    verify_Blind_Shipment: "BLIND SHIPMENT",
    verify_RESIDENTIAL_Pickup: "RESIDENTIAL PICK UP",
    verify_Liftgate_Delivery: "LIFTGATE DELIVERY",
    INSIDE_DELIVERY: "INSIDE DELIVERY",
    CONSTRUCTION_SITE_PICKUP: "CONSTRUCTION SITE PICKUP",
    CONSTRUCTION_SITE_DELIVERY: "CONSTRUCTION SITE DELIVERY"
  } as const;

  static readonly QUOTE_DETAIL_LABELS = {
    SCAC: "SCAC",
    QUOTE_NO: "Quote No.",
    /**
     * modified to match exact text on UI
     * @author Aniket Nale
     * @created 20-Nov-2025
     */
    Quote_HASH: "Quote #:",
    LOAD_ID: "Load ID",
    QUOTE_ID: "Quote ID",
  } as const;

  static readonly EDI_OVERRIDE_STATUS = {
    ACCEPTED: "A",
    REJECTED: "R",
    DECLINED: "D",
  } as const;
  /**
   * @description Gets the API Status for api test cases.
   * @author Rohit Singh
   * @modified 2025-11-18
   */
  static readonly API_STATUS = {
    OK: 'OK',
    CREATED: 'Created',
    ACCEPTED: 'Accepted',
    CONFLICT: 'Conflict',
  } as const;

  static readonly DOC_EXTENSIONS = {
    PDF: "pdf",
    XML: "xml",
  } as const;

  /**
* @author Aniket Nale
* @description Global constants carrier actions for the test automation framework on Tritan Admin Page.
* @modified 17 Nov 2025
*/
  static readonly CARRIER_ACTION = {
    BOOK: "Book",
  } as const;

  static readonly CREATED_BY = {
    CUSTOMER_PORTAL: "Customer Portal",
    LEGACY_CUSTOMER_PORTAL: "Customer",
  } as const;

  static readonly DOCUMENT_TYPE = {
    BILL_OF_LADING: "BOL",
    PROOF_OF_DELIVERY: "POD",
  } as const;

  static readonly DOCUMENT_ACTION_TYPE = {
    POPUP: "popup",
    DOWNLOAD: "download",
  } as const;

  static readonly DOCUMENT_TEXT = {
    BILL_OF_LADING: "Bill of Lading",
    PROOF_OF_DELIVERY: "Proof of Delivery",
    SHIPPING_LABEL: "Shipping Label",
  } as const;

  static readonly LOAD_METHOD = {
    ELTL: "ELTL"
  } as const;
  /**
   * @author Rohit Singh
   * @created 04-Dec-2025
   * @description Global constants toggle names for the test automation framework.
   * @modifiedBy Aniket Nale
   * @modified 10-Dec-2025
   */
  static readonly TOGGLE_NAME = {
    CARB: "CARB?",
    HOLD_ALL_PAY: "Hold All Pay?",
    SMARTWAY: "SmartWay?",
    NON_MONITORED_CARRIER: "Non-Monitored Carrier?",
    INTRASTATE_ONLY: "Intrastate-only",
    EIGHT_A: "8a",
    Q_STAR: "Q Star",
    TSA_CERTIFIED: "TSA Certified",
    UIIA_PARTICIPATION: "UIIA Participation",
    NO_BCA: "No BCA"
  } as const;



  /**
* @author Aniket Nale
* @description Global constants toggle options for the test automation framework.
* @modified 10-Dec-2025
* @note Not being used anywhere currently might be used in future
*/
  static readonly TOGGLE_OPTIONS = {
    YES: "yes",
    NO: "no",
    DEFAULT: "default"
  } as const;

  /**
   * @author Tejaswini M
   * @created 08-Dec-2025
   * @description Global constants for user roles for the test automation framework.
   */
  static readonly USER_ROLES = {
    BULK_CHANGE_LOADS_MGR: "BULK_CHANGE_LOADS_MGR"
  } as const;

  /**
   * @author Rohit Singh
   * @created 2025-12-30
   * @description Global constants for carrier tabs for the test automation framework.
   */
  static readonly CARRIER_TABS = {
    CARRIER_1: "1",
    CARRIER_2: "2",
    CARRIER_3: "3",
  } as const;


   /**
   * @author Deepak Bohra
   * @created 2026-01-13
   * @description Global constants for post automation rule for the test automation framework.
   */
  static readonly POST_AUTOMATION_RULE = {
    NEW_BUTTON: "New",
    CREATE_NEW_ENTRY: "Create new entry",
    COMMODITY_FLATBED_CODE: "F",
    DEFAULT_VALUE: "-",
    NO: "NO",
    COMMODITY_VALUE: "METAL",
    PICK: "PICK",
    DROP: "DROP",
    INCLUDE_CARRIER: "include",
    EXCLUDE_CARRIER: "exclude",
    STOP1: "STOP1",
  } as const;


  // Table column mapping for Post Automation Rules
  static readonly POST_AUTOMATION_COLUMNS = {
    checkbox: 0,
    originCity: 1,
    originState: 2,
    originZip: 3,
    originEdi: 4,
    destinationCity: 5,
    destinationState: 6,
    destinationZip: 7,
    destinationEdi: 8,
    stops: 9,
    equipment: 10,
    customerName: 11,
    method: 12,
    offerRate: 13,
    edi: 14,
    dateLastUpdated: 15,
  }as const;

}
/**
 * @author Deepak Bohra
 * @description Global constants for the test automation framework.
 * @modifiedBy Rohit Singh
 * @modified 2025-08-13
 */
// Global declarations - makes constants available without imports
declare global {
  const HEADERS: typeof GlobalConstants.HEADERS;
  const ADMIN_SUB_MENU: typeof GlobalConstants.ADMIN_SUB_MENU;
  const AGENT_SUB_MENU: typeof GlobalConstants.AGENT_SUB_MENU;
  const LOAD_TYPES: typeof GlobalConstants.LOAD_TYPES;
  const TABS: typeof GlobalConstants.LOAD_TABS;
  const CUSTOMER_SUB_MENU: typeof GlobalConstants.CUSTOMER_SUB_MENU;
  const CARGO_VALUES: typeof GlobalConstants.CARGO_VALUES;
  const CARGO_ADJUSTMENT_VALUES: typeof GlobalConstants.CARGO_ADJUSTMENT_VALUES;
  const BUTTONS: typeof GlobalConstants.BUTTONS;
  const COUNTRY: typeof GlobalConstants.COUNTRY;
  const CONFIDENCE_LEVEL: typeof GlobalConstants.CONFIDENCE_LEVEL;
  const LOAD_STATUS: typeof GlobalConstants.LOAD_STATUS;
  const EDI_IN_OUT: typeof GlobalConstants.EDI_IN_OUT;
  const EDI_CODE: typeof GlobalConstants.EDI_CODE;
  const EDI_STATUS: typeof GlobalConstants.EDI_STATUS;
  const WAIT: typeof GlobalConstants.WAIT;
  const MOVE_TYPE: typeof GlobalConstants.MOVE_TYPE;
  const TNX: typeof GlobalConstants.TNX;
  const DFB_Button: typeof GlobalConstants.DFB_Button;
  const COMMISSION_AUDIT_STATUS: typeof GlobalConstants.COMMISSION_AUDIT_STATUS;
  const CUSTOMER_STATUS: typeof GlobalConstants.CUSTOMER_STATUS;
  const INTERNAL_SHARE_STATUS: typeof GlobalConstants.INTERNAL_SHARE_STATUS;
  const DUPLICATE_LOAD_CHECKBOX: typeof GlobalConstants.DUPLICATE_LOAD_CHECKBOX;
  const LOAD_SUB_MENU: typeof GlobalConstants.LOAD_SUB_MENU;
  const LOAD_TEMPLATE_SEARCH_PAGE: typeof GlobalConstants.LOAD_TEMPLATE_SEARCH_PAGE;
  const DFBLOAD_FORM: typeof GlobalConstants.DFBLOAD_FORM;
  const ACCESSORIALS_NAME: typeof GlobalConstants.ACCESSORIALS_NAME;
  const CUSTOMER_NAME: typeof GlobalConstants.CUSTOMER_NAME;
  const QUOTE_DETAIL_LABELS: typeof GlobalConstants.QUOTE_DETAIL_LABELS;
  const EDI_OVERRIDE_STATUS: typeof GlobalConstants.EDI_OVERRIDE_STATUS;
  const API_STATUS: typeof GlobalConstants.API_STATUS;
  const DOC_EXTENSIONS: typeof GlobalConstants.DOC_EXTENSIONS;
  const CARRIER_ACTION: typeof GlobalConstants.CARRIER_ACTION;
  const CREATED_BY: typeof GlobalConstants.CREATED_BY;
  const DOCUMENT_TYPE: typeof GlobalConstants.DOCUMENT_TYPE;
  const DOCUMENT_ACTION_TYPE: typeof GlobalConstants.DOCUMENT_ACTION_TYPE;
  const DOCUMENT_TEXT: typeof GlobalConstants.DOCUMENT_TEXT;
  const LOAD_METHOD: typeof GlobalConstants.LOAD_METHOD;
  const CARRIER_SUB_MENU: typeof GlobalConstants.CARRIER_SUB_MENU;
  const CARRIER_STATUS: typeof GlobalConstants.CARRIER_STATUS;
  const TOGGLE_NAME: typeof GlobalConstants.TOGGLE_NAME;
  const TOGGLE_OPTIONS: typeof GlobalConstants.TOGGLE_OPTIONS;
  const FINANCE_SUB_MENU: typeof GlobalConstants.FINANCE_SUB_MENU;
  const USER_ROLES: typeof GlobalConstants.USER_ROLES;
  const AGENT_AUTH_LEVEL: typeof GlobalConstants.AGENT_AUTH_LEVEL;
  const AGENT_AUTH_ALLOWED: typeof GlobalConstants.AGENT_AUTH_ALLOWED;
  const CARRIER_TABS: typeof GlobalConstants.CARRIER_TABS;
  const POST_AUTOMATION_RULE: typeof GlobalConstants.POST_AUTOMATION_RULE;
  const POST_AUTOMATION_COLUMNS: typeof GlobalConstants.POST_AUTOMATION_COLUMNS;
}
/**
 * @author Deepak Bohra
 * @description This file contains global constants used across the test automation framework.
 * @modifiedBy Rohit Singh
 * @modified 2025-08-13
 */
// Make constants globally available
if (typeof globalThis !== "undefined") {
  (globalThis as any).HEADERS = GlobalConstants.HEADERS;
  (globalThis as any).ADMIN_SUB_MENU = GlobalConstants.ADMIN_SUB_MENU;
  (globalThis as any).AGENT_SUB_MENU = GlobalConstants.AGENT_SUB_MENU;
  (globalThis as any).LOAD_TYPES = GlobalConstants.LOAD_TYPES;
  (globalThis as any).TABS = GlobalConstants.LOAD_TABS;
  (globalThis as any).CUSTOMER_SUB_MENU = GlobalConstants.CUSTOMER_SUB_MENU;
  (globalThis as any).CARGO_VALUES = GlobalConstants.CARGO_VALUES;
  (globalThis as any).CARGO_ADJUSTMENT_VALUES =
    GlobalConstants.CARGO_ADJUSTMENT_VALUES;
  (globalThis as any).BUTTONS = GlobalConstants.BUTTONS;
  (globalThis as any).COUNTRY = GlobalConstants.COUNTRY;
  (globalThis as any).CONFIDENCE_LEVEL = GlobalConstants.CONFIDENCE_LEVEL;
  (globalThis as any).LOAD_STATUS = GlobalConstants.LOAD_STATUS;
  (globalThis as any).EDI_IN_OUT = GlobalConstants.EDI_IN_OUT;
  (globalThis as any).EDI_CODE = GlobalConstants.EDI_CODE;
  (globalThis as any).EDI_STATUS = GlobalConstants.EDI_STATUS;
  (globalThis as any).COMMISSION_AUDIT_STATUS =
    GlobalConstants.COMMISSION_AUDIT_STATUS;
  (globalThis as any).WAIT = GlobalConstants.WAIT;
  (globalThis as any).MOVE_TYPE = GlobalConstants.MOVE_TYPE;
  (globalThis as any).CUSTOMER_STATUS = GlobalConstants.CUSTOMER_STATUS;
  (globalThis as any).TNX = GlobalConstants.TNX;
  (globalThis as any).DFB_Button = GlobalConstants.DFB_Button;
  (globalThis as any).INTERNAL_SHARE_STATUS =
    GlobalConstants.INTERNAL_SHARE_STATUS;
  (globalThis as any).DUPLICATE_LOAD_CHECKBOX =
    GlobalConstants.DUPLICATE_LOAD_CHECKBOX;
  (globalThis as any).AGENT_AUTH_LEVEL = GlobalConstants.AGENT_AUTH_LEVEL;
  (globalThis as any).AGENT_AUTH_ALLOWED = GlobalConstants.AGENT_AUTH_ALLOWED;
  (globalThis as any).LOAD_SUB_MENU = GlobalConstants.LOAD_SUB_MENU;
  (globalThis as any).LOAD_TEMPLATE_SEARCH_PAGE =
    GlobalConstants.LOAD_TEMPLATE_SEARCH_PAGE;
  (globalThis as any).DFBLOAD_FORM = GlobalConstants.DFBLOAD_FORM;
  (globalThis as any).ACCESSORIALS_NAME = GlobalConstants.ACCESSORIALS_NAME;
  (globalThis as any).CUSTOMER_NAME = GlobalConstants.CUSTOMER_NAME;
  (globalThis as any).QUOTE_DETAIL_LABELS = GlobalConstants.QUOTE_DETAIL_LABELS;
  (globalThis as any).EDI_OVERRIDE_STATUS = GlobalConstants.EDI_OVERRIDE_STATUS;
  (globalThis as any).API_STATUS = GlobalConstants.API_STATUS;
  (globalThis as any).DOC_EXTENSIONS = GlobalConstants.DOC_EXTENSIONS;
  (globalThis as any).CARRIER_ACTION = GlobalConstants.CARRIER_ACTION;
  (globalThis as any).CREATED_BY = GlobalConstants.CREATED_BY;
  (globalThis as any).DOCUMENT_TYPE = GlobalConstants.DOCUMENT_TYPE;
  (globalThis as any).DOCUMENT_ACTION_TYPE = GlobalConstants.DOCUMENT_ACTION_TYPE;
  (globalThis as any).DOCUMENT_TEXT = GlobalConstants.DOCUMENT_TEXT;
  (globalThis as any).LOAD_METHOD = GlobalConstants.LOAD_METHOD;
  (globalThis as any).CARRIER_SUB_MENU = GlobalConstants.CARRIER_SUB_MENU;
  (globalThis as any).CARRIER_STATUS = GlobalConstants.CARRIER_STATUS;
  (globalThis as any).TOGGLE_NAME = GlobalConstants.TOGGLE_NAME;
  (globalThis as any).FINANCE_SUB_MENU = GlobalConstants.FINANCE_SUB_MENU;
  (globalThis as any).TOGGLE_OPTIONS = GlobalConstants.TOGGLE_OPTIONS;
  (globalThis as any).USER_ROLES = GlobalConstants.USER_ROLES;
  (globalThis as any).CARRIER_TABS = GlobalConstants.CARRIER_TABS;
  (globalThis as any).POST_AUTOMATION_RULE = GlobalConstants.POST_AUTOMATION_RULE;  
  (globalThis as any).POST_AUTOMATION_COLUMNS = GlobalConstants.POST_AUTOMATION_COLUMNS;
}
