/**
 * @author Parth Rastogi
 * DFB Global Constants File
 * Contains DFB-specific constants used across the DFB test automation framework
 * This helps maintain consistency and makes updates easier when UI text changes
 */

export class DFBGlobalConstants {
  /**
   * @description Gets the Priority.
   * @author Parth Rastogi
   * @modified 2025-11-17
   */
  static readonly PRIORITY = {
    PRIORITY_1: "1",
    PRIORITY_2: "2",
    PRIORITY_3: "3",
  } as const;

  /**
   * @author Parth Rastogi
   * @description Global constants for load offer rates.
   * @modified 2025-11-10
   */
  static readonly LOAD_OFFER_RATES = {
    OFFER_RATE_1: "1500",
    OFFER_RATE_2: "1525",
    OFFER_RATE_3: "1550",
    OFFER_RATE_4: "2000.00",
    /** Waterfall per-carrier pencil row (DFB-97788 step 62 example). */
    OFFER_RATE_500: "500",
  } as const;


  static DFB_MAIL_CONSTANTS({loadNo}: {
      loadNo?: string;
      
    }) {
      return {
        AGENT_MATCH_SUBJECT: `Load Tender for Load ${loadNo}`,
      } as const;
  }

  // DFB Carrier Timing Constants
  static readonly CARRIER_TIMING = {
    TIMING_1: "00:01",
    TIMING_2: "00:02",
    TIMING_3: "00:03",
    TIMING_4: "00:04",
    TIMING_5: "00:05",
    /** Example timing from DFB-97788 (1:00). */
    TIMING_0100: "01:00",
  } as const;

  

  /**
   * Include Carriers multi-select (DFB-97788 step 60): search typeahead, max 25 selections.
   * Manual case lists LLC/INC; automation uses INC then LLC for any shortfall.
   */
  static readonly INCLUDE_CARRIERS = {
    MAX_COUNT: 25,
    SEARCH_TERMS_INC_THEN_LLC: ["INC", "LLC"] as const,
  } as const;

  static readonly DFB_FORM_FIELDS = {
    Include_Carriers: "Include Carriers",
    Exclude_Carriers: "Exclude Carriers",
    Email_Notification: "Email Notification",
    Commodity: "Commodity",
    NOTES: "NOTES",
    Expiration_Date: "Expiration Date",
    Expiration_Time: "Expiration Time",
  } as const;

  static readonly DFB_BID_HISTORY_FIELDS = {
    EQUIPMENT_1: "F",
    SOURCE: "DFB",
  } as const;

  /**
   * Load Method label in POSTED hover tooltip table (BTMS display vs CSV code `TL`).
   * @author AI Agent
   * @created 2026-05-28
   */
  static readonly DFB_LOAD_METHOD_HOVER_LABEL = {
    TL: "TruckLoad",
  } as const;

  static readonly DFB_RATE_DEFAULTS = {
    LINEHAUL: "Flat Rate",
    FUEL_SURCHARGE: "FLAT",
  } as const;

  static readonly TENDER_DETAILS_MODAL_TABS = {
    PROGRESS: "Progress",
    REQUIREMENTS_AND_STOPS: "Requirements & Stops",
    GENERAL: "General",
  } as const;

  static readonly TNX_STATUS_HISTORY = {
    STATUS_MATCHED: "Matched",
    STATUS_DELIVERED: "Delivered",
    STATUS_IN_TRANSIT: "In Transit",
  } as const;

  static readonly CARRIER_DISPATCH_NAME = {
    DISPATCH_NAME_1: "Deepak Bohra",
    DISPATCH_NAME_2: "Deepak",
  } as const;

  static readonly CARRIER_CONTACT = {
    CONTACT_1: "Deepak Bohra (deepak.bohra@modeglobal.com)",
    CONTACT_2: "deepak bohra (deepak.bohra@modeglobal.com)",
    CONTACT_3: "Mohammed Suhaib (mohammed.suhaib@modeglobal.com)"
  } as const;

   static readonly CARRIER_DISPATCH_EMAIL = {
    EMAIL_1: "deepak.bohra@modeglobal.com",
  } as const;

  /**
   * Carrier visibility labels on the Mode IQ tab.
   * @author AI Agent
   * @created 19-Mar-2026
   */
  static readonly CARRIER_VISIBILITY = {
    AVENGER_LOGISTICS: "Avenger Logistics",
    MODE_TRANSPORTATION: "Mode Transportation",
    SUNTECK_TTS: "Suntecktts",
    TTS: "TTS",
  } as const;

}

/**
 * @author Parth Rastogi
 * @description Global constants for the test automation framework.
 * @modified 2025-11-17
 */
// Global declarations - makes constants available without imports
declare global {
  const PRIORITY: typeof DFBGlobalConstants.PRIORITY;
  const CARRIER_TIMING: typeof DFBGlobalConstants.CARRIER_TIMING;
  const LOAD_OFFER_RATES: typeof DFBGlobalConstants.LOAD_OFFER_RATES;
  const INCLUDE_CARRIERS: typeof DFBGlobalConstants.INCLUDE_CARRIERS;
  
  const DFB_FORM_FIELDS: typeof DFBGlobalConstants.DFB_FORM_FIELDS;
  const DFB_BID_HISTORY_FIELDS: typeof DFBGlobalConstants.DFB_BID_HISTORY_FIELDS;
  const DFB_LOAD_METHOD_HOVER_LABEL: typeof DFBGlobalConstants.DFB_LOAD_METHOD_HOVER_LABEL;
  const DFB_RATE_DEFAULTS: typeof DFBGlobalConstants.DFB_RATE_DEFAULTS;
  const TENDER_DETAILS_MODAL_TABS: typeof DFBGlobalConstants.TENDER_DETAILS_MODAL_TABS;
  const TNX_STATUS_HISTORY: typeof DFBGlobalConstants.TNX_STATUS_HISTORY;
  const CARRIER_DISPATCH_NAME: typeof DFBGlobalConstants.CARRIER_DISPATCH_NAME;
  const CARRIER_CONTACT: typeof DFBGlobalConstants.CARRIER_CONTACT;
  const CARRIER_DISPATCH_EMAIL: typeof DFBGlobalConstants.CARRIER_DISPATCH_EMAIL;
  const CARRIER_VISIBILITY: typeof DFBGlobalConstants.CARRIER_VISIBILITY;
  const DFB_MAIL_CONSTANTS: typeof DFBGlobalConstants.DFB_MAIL_CONSTANTS;
}

// Global exports for backward compatibility
export const {
  PRIORITY,
  CARRIER_TIMING,
  INCLUDE_CARRIERS,
  DFB_LOAD_METHOD_HOVER_LABEL,
} = DFBGlobalConstants;

// Set global constants
if (typeof globalThis !== "undefined") {
  (globalThis as any).PRIORITY = DFBGlobalConstants.PRIORITY;
  (globalThis as any).CARRIER_TIMING = DFBGlobalConstants.CARRIER_TIMING;
  (globalThis as any).LOAD_OFFER_RATES = DFBGlobalConstants.LOAD_OFFER_RATES;
  (globalThis as any).INCLUDE_CARRIERS = DFBGlobalConstants.INCLUDE_CARRIERS;

  (globalThis as any).DFB_FORM_FIELDS = DFBGlobalConstants.DFB_FORM_FIELDS;
  (globalThis as any).DFB_BID_HISTORY_FIELDS =
    DFBGlobalConstants.DFB_BID_HISTORY_FIELDS;
  (globalThis as any).DFB_LOAD_METHOD_HOVER_LABEL =
    DFBGlobalConstants.DFB_LOAD_METHOD_HOVER_LABEL;
  (globalThis as any).DFB_RATE_DEFAULTS =
    DFBGlobalConstants.DFB_RATE_DEFAULTS;
  (globalThis as any).TENDER_DETAILS_MODAL_TABS =
    DFBGlobalConstants.TENDER_DETAILS_MODAL_TABS;
  (globalThis as any).TNX_STATUS_HISTORY =
    DFBGlobalConstants.TNX_STATUS_HISTORY;
  (globalThis as any).CARRIER_DISPATCH_NAME =
    DFBGlobalConstants.CARRIER_DISPATCH_NAME;
  (globalThis as any).CARRIER_CONTACT = DFBGlobalConstants.CARRIER_CONTACT;
  (globalThis as any).CARRIER_DISPATCH_EMAIL = DFBGlobalConstants.CARRIER_DISPATCH_EMAIL;
  (globalThis as any).CARRIER_VISIBILITY = DFBGlobalConstants.CARRIER_VISIBILITY;
  (globalThis as any).DFB_MAIL_CONSTANTS = DFBGlobalConstants.DFB_MAIL_CONSTANTS;
}
