// alertPatterns.ts
// Centralized alert message patterns for validation in Playwright tests

export const ALERT_PATTERNS = {
  // Date validation alerts
  PICKUP_DELIVERY_DATE_ORDER_ERROR: "Pickup and Delivery dates must be in correct order",
  OFFER_RATE_SET_BY_GREENSCREENS: /The offer rate of this load has been set to \$\d+(?:\.\d{2})? by GreenScreens\./,
  INVALID_SHIPPER_ZIP_CODE_US: "Invalid U.S. ZIP Code! Format must be 5-digit ZIP (ex: 55555) or 9-digit ZIP+4 (ex: 55555-4444).",
  INVALID_SHIPPER_ZIP_CODE_CA: "Invalid Canadian Postal Code! Format must by 6 alphanumeric characters, alternating letters and digits (ex: Y6Y 6Y6). Can not begin with W or Z, and can not contain D, F, I, O, Q or U",
  INVALID_SHIPPER_ZIP_CODE_MX: "Invalid Mexican Postal Code! Format must be 5 digits only (ex: 55555).",
  POST_AUTOMATION_RULE_MATCHED: /The load matched a post automation rule\.[\s\S]*The offer rate on this load has been set to the value of the offer rate[\s\S]*The other DFB fields on this load have been set to the values/,
  CARRIER_ALREADY_INCLUDED_ERROR: "In order to post this load, the checkbox labeled \"Post to all Carriers upon completion of the Waterfall\" needs to be unchecked",
  CARRIER_NOT_INCLUDED_ERROR: "Loads with a cargo value greater than $100,000 cannot be posted without a dedicated carrier at this time",

  // Post Automation Rule form validation alerts
  EMAIL_NOTIFICATION_REQUIRED: "Enter at least one email for notifications",
  CUSTOMER_REQUIRED: "Please select a customer",
  PICK_LOCATION_REQUIRED: "Please select a pick location",
  DROP_LOCATION_REQUIRED: "Please select a drop location",
  EQUIPMENT_TYPE_REQUIRED: "Please select an equipment type",
  LOAD_TYPE_REQUIRED: "Please select a load type",
  OFFER_RATE_REQUIRED: "Please enter an offer rate",
  INVALID_CUSTOMER_SUPPLIED: "Invalid customer supplied",

  INVALID_TARGET_RATE_SUPPLIED: "Invalid target rate supplied",

  A_CARRIER_CONTACT_FOR_AUTO_ACCEPT_MUST_BE_SELECTED: "A carrier contact for auto accept must be selected",

  IN_VIEW_MODE: "in view mode",

  UNKNOWN_MESSAGE: ":",

};


/**
* @description Added Alert Patterns for Sales Lead
* @author Avanish Srivastava
* @created 2025-09-17
*/
export const SALES_LEAD_ALERT_PATTERNS = {
  SALES_LEAD_CUSTOMER_NAME_ERROR: "Please enter a value for the Name field.",
  SALES_LEAD_CITY_NAME_ERROR: "Please enter a value for the City field.",
  SALES_LEAD_STATE_NAME_ERROR: "Please enter a value for the state field.",
};
