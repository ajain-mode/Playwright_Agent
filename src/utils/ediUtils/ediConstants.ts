
export class EdiConstants {
  static readonly INVOICE_PREFIX = "AUTOINV";

  static readonly INVOICE_TYPES = {
    INVOICE_TYPE_MIN: "TYPEMIN",
    INVOICE_TYPE_MSG: "TYPEMSG",
    INVOICE_TYPE_PDS: "TYPEPDS",
    INVOICE_TYPE_FUE: "TYPEFUE",
    INVOICE_TYPE_UNL: "TYPEUNL",
    INVOICE_TYPE_SE:  "TYPESE",
    INVOICE_TYPE_FSC: "TYPEFSC",
    INVOICE_TYPE_999: "TYPE999",
  } as const;
  static readonly INVOICE_EVENTS = {
    AT_ORIGIN: 'AT ORIGIN:X3',
    PICKED_UP: 'PICKED-UP:AF',
    DELIVERY_APPT: 'DELIVERY APPT:AG',
    AT_DESTINATION: 'AT DESTINATION:X1',
    DELIVERED: 'DELIVERED:D1',
    DELIVERED_FINAL: 'DELIVERED FINAL:D1'
  } as const;

  static readonly EDI_TEST_DATA = {
    DISPATCH_NOTE_LOAD_TAB: "Automation Dispatch Note - Load Tab",
    DISPATCH_NOTE_BILLING_TAB: "Automation Dispatch Note - Billing Tab",
    FINANCE_NOTE_LOAD_TAB: "Automation Finance Note - Load Tab",
    FINANCE_NOTE_BILLING_TAB: "Automation Finance Note - Billing Tab"
  } as const;
}

// Export constants outside the class
export const INVOICE_TYPES = EdiConstants.INVOICE_TYPES;
export const INVOICE_PREFIX = EdiConstants.INVOICE_PREFIX;
export const INVOICE_EVENTS = EdiConstants.INVOICE_EVENTS;
export const EDI_TEST_DATA = EdiConstants.EDI_TEST_DATA;

// Declare global variables
declare global {
  const INVOICE_TYPES: typeof EdiConstants.INVOICE_TYPES;
  const INVOICE_PREFIX: typeof EdiConstants.INVOICE_PREFIX;
  const INVOICE_EVENTS: typeof EdiConstants.INVOICE_EVENTS;
  const EDI_TEST_DATA: typeof EdiConstants.EDI_TEST_DATA;
}

// Assign to globalThis if available
if (typeof globalThis !== 'undefined') {
  (globalThis as any).INVOICE_TYPES = EdiConstants.INVOICE_TYPES;
  (globalThis as any).INVOICE_PREFIX = EdiConstants.INVOICE_PREFIX;
  (globalThis as any).INVOICE_EVENTS = EdiConstants.INVOICE_EVENTS;
  (globalThis as any).EDI_TEST_DATA = EdiConstants.EDI_TEST_DATA;
}
