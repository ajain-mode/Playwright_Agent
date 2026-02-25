// Config for Pick tab invalid value validation

// Centralized config for DFB tabular field validation spec
import dataConfig from "@config/dataConfig";

const testcaseID = "DFB-24971-24994";
export const testData = dataConfig.getTestDataFromCsv(
  dataConfig.dfbData,
  testcaseID
);

export const carrierRequiredFields = [
  {
    name: "Equipment Type",
    blankIndex: 0,
    errorMsg: "Please enter the Equipment type.",
  },
  {
    name: "Trailer Length",
    blankIndex: 1,
    errorMsg: "Please enter the Trailer Length.",
  },
  { name: "Miles", blankIndex: 2, errorMsg: "Please enter the Miles." },
];

export const pickRequiredFields = [
  {
    name: "Shipper Name",
    blankIndex: 0,
    errorMsg: "Please enter the Shipper's Name",
  },
  {
    name: "Shipper Address1",
    blankIndex: 1,
    errorMsg: "Please enter  Shipper's Addr1",
  },
  {
    name: "Shipper City",
    blankIndex: 2,
    errorMsg: "Please enter the Shipper's City",
  },
  {
    name: "Shipper State",
    blankIndex: 3,
    errorMsg: "Please enter the Shipper's State/Province",
  },
  {
    name: "Shipper Zip",
    blankIndex: 4,
    errorMsg: "Please enter the Shipper's ZIP",
  },
  {
    name: "Earliest Date",
    blankIndex: 5,
    errorMsg: "Please enter the Pickup Date",
    invalidErrorMsg: "Please correct invalid dates or times on this stop.",
    invalidValue: "",
  },
  {
    name: "Earliest Time",
    blankIndex: 6,
    errorMsg: "Please enter Pickup Time",
    invalidErrorMsg: "Please correct invalid dates or times on this stop.",
    invalidValue: "",
  },
  {
    name: "Latest Date",
    blankIndex: 7,
    errorMsg: "Please enter Pickup Deadline Date",
    invalidErrorMsg: "Invalid deadline date and time format.",
    invalidValue: "",
  },
  {
    name: "Latest Time",
    blankIndex: 8,
    errorMsg: "Please enter Pickup Deadline Time",
    invalidErrorMsg: "Please correct invalid dates or times on this stop.",
    invalidValue: "",
  },
  {
    name: "Commodity Quantity",
    blankIndex: 9,
    errorMsg: "Please enter the first Item Quantity",
  },

  {
    name: "Commodity UoM",
    blankIndex: 10,
    errorMsg: "Please enter the first Item Type",
  },
  {
    name: "Commodity Description",
    blankIndex: 11,
    errorMsg: "Please enter the first Item Description",
  },
  {
    name: "Commodity Weight",
    blankIndex: 12,
    errorMsg: "Please enter the first Item Weight",
  },
];

export const consigneeRequiredFields = [
  {
    name: "Consignee Name",
    blankIndex: 0,
    errorMsg: "Please enter the Consignee's Name",
  },
  {
    name: "Consignee Address1",
    blankIndex: 1,
    errorMsg: "Please enter  Consignee's Addr1",
  },
  {
    name: "Consignee City",
    blankIndex: 2,
    errorMsg: "Please enter the Consignee's City",
  },
  {
    name: "Consignee State",
    blankIndex: 3,
    errorMsg: "Please enter the Consignee's State/Province",
  },
  {
    name: "Consignee Zip",
    blankIndex: 4,
    errorMsg: "Please enter the Consignee's ZIP",
  },
  {
    name: "Actual Date",
    blankIndex: 5,
    errorMsg: "Please enter the DROP Date",
  },
  { name: "Actual Time", blankIndex: 6, errorMsg: "Please enter DROP Time" },
  {
    name: "Deadline Date",
    blankIndex: 7,
    errorMsg: "Please enter DROP Deadline Date",
  },
  {
    name: "Deadline Time",
    blankIndex: 8,
    errorMsg: "Please enter DROP Deadline Time",
  },
];

export const pickTabInvalidCases = [
  // name, fieldKey, invalidValue, alertMsg, fieldSelector, fieldMsg
  [
    "Shipper's Actual Date field",
    "actualDate",
    "abc",
    "Please correct invalid dates or times on this stop.",
    "#carr_1_stop_1_invalid_dt_msg",
    "Date is invalid! Please correct.",
  ],
  [
    "Shipper's Actual Time field",
    "actualTime",
    "abc",
    "Please correct invalid dates or times on this stop.",
    "#carr_1_stop_1_invalid_dt_msg",
    "Time is invalid! Please correct.",
  ],
  [
    "Shipper's Deadline Date field",
    "deadlineDate",
    "abc",
    "Invalid deadline date and time format.",
    "#carr_1_stop_1_invalid_dt_msg2",
    "Date is invalid! Please correct.",
  ],
  [
    "Shipper's Deadline Time field",
    "deadlineTime",
    "abc",
    "Please correct invalid dates or times on this stop.",
    "#carr_1_stop_1_invalid_dt_msg2",
    "Time is invalid! Please correct.",
  ],
  [
    "Commodity Quantity field",
    "qty",
    "abc",
    "Please enter a valid number for quantity",
    "",
    "",
  ],
  [
    "Commodity Weight field",
    "weight",
    "abce",
    "Please enter a valid number for weight",
    "",
    "",
  ],
];

export const dropTabInvalidCases = [
  // name, invalidIndex, invalidValue, alertMsg, fieldSelector, fieldMsg

  [
    "Consignee's Actual Date field",
    "actualDate",
    "abc",
    "Please correct invalid dates or times on this stop.",
    "#carr_1_stop_2_invalid_dt_msg",
    "Date is invalid! Please correct.",
  ],
  [
    "Consignee's Actual Time field",
    "actualTime",
    "abc",
    "Please correct invalid dates or times on this stop.",
    "#carr_1_stop_2_invalid_dt_msg",
    "Time is invalid! Please correct.",
  ],
  [
    "Consignee's Deadline Date field",
    "deadlineDate",
    "abc",
    "Please correct invalid dates or times on this stop.",
    "#carr_1_stop_2_invalid_dt_msg2",
    "Date is invalid! Please correct.",
  ],
  [
    "Consignee's Deadline Time field",
    "deadlineTime",
    "abc",
    "Please correct invalid dates or times on this stop.",
    "#carr_1_stop_2_invalid_dt_msg2",
    "Time is invalid! Please correct.",
  ],
];

export const pickInvalidFields = [
  {
    name: "Earliest Date",
    invalidIndex: 5,
    invalidValue: "abc",
    invalidErrorMsg: "Please correct invalid dates or times on this stop.",
  },
  {
    name: "Earliest Time",
    invalidIndex: 6,
    invalidValue: "xyz",
    invalidErrorMsg: "Please correct invalid dates or times on this stop.",
  },
  {
    name: "Latest Date",
    invalidIndex: 7,
    invalidValue: "bad-date",
    invalidErrorMsg: "Invalid deadline date and time format.",
  },
  {
    name: "Latest Time",
    invalidIndex: 8,
    invalidValue: "bad-time",
    invalidErrorMsg: "Please correct invalid dates or times on this stop.",
  },
];

export const dropInvalidFields = [
  {
    name: "Drop Date",
    invalidIndex: 5,
    invalidValue: "abc",
    invalidErrorMsg: "Please correct invalid dates or times on this stop.",
  },
  {
    name: "Drop Time",
    invalidIndex: 6,
    invalidValue: "xyz",
    invalidErrorMsg: "Please correct invalid dates or times on this stop.",
  },
  {
    name: "Latest Date",
    invalidIndex: 7,
    invalidValue: "bad-date",
    invalidErrorMsg: "Invalid deadline date and time format.",
  },
  {
    name: "Latest Time",
    invalidIndex: 8,
    invalidValue: "bad-time",
    invalidErrorMsg: "Please correct invalid dates or times on this stop.",
  },
];

// Add this at the end of your file - separate from pickTabInvalidCases
export const zipValidationCases = {
  US: {
    testCaseID: "DFB-25002-US", // Different test case ID for US data
    shipperZip: [
      "Shipper ZIP - Invalid US format",
      "shipperZip",
      "1234",
      "Invalid U.S. ZIP Code!\nFormat must be 5-digit ZIP (ex: 55555)\nor 9-digit ZIP+4 (ex: 55555-4444).",
      null,
      "Invalid U.S. ZIP Code!",
    ],
    consigneeZip: [
      "Consignee ZIP - Invalid US format",
      "consigneeZip",
      "123456",
      "Invalid U.S. ZIP Code!\nFormat must be 5-digit ZIP (ex: 55555)\nor 9-digit ZIP+4 (ex: 55555-4444).",
      null,
      "Invalid U.S. ZIP Code!",
    ],
  },
  CA: {
    testCaseID: "DFB-25002-CA", // Different test case ID for Canadian data
    shipperZip: [
      "Shipper ZIP - Invalid Canadian format",
      "shipperZip",
      "W1W1W1",
      "Invalid Canadian Postal Code!\nFormat must by 6 alphanumeric characters,\nalternating letters and digits (ex: Y6Y 6Y6).\nCan not begin with W or Z, and can not contain D, F, I, O, Q or U",
      null,
      "Invalid Canadian Postal Code!",
    ],
    consigneeZip: [
      "Consignee ZIP - Invalid Canadian format",
      "consigneeZip",
      "Z1Z1Z1",
      "Invalid Canadian Postal Code!\nFormat must be 6 alphanumeric characters,\nalternating letters and digits (ex: Y6Y 6Y6).\nCan not begin with W or Z and can not contain D, F, I, O, Q or U",
      null,
      "Invalid Canadian Postal Code!",
    ],
  },
  MX: {
    testCaseID: "DFB-25002-MX", // Different test case ID for Mexican data
    shipperZip: [
      "Shipper ZIP - Invalid Mexican format",
      "shipperZip",
      "ABCDE",
      "Invalid Mexican Postal Code!\nFormat must be 5 digits only (ex: 55555).",
      null,
      "Invalid Mexican Postal Code!",
    ],
    consigneeZip: [
      "Consignee ZIP - Invalid Mexican format",
      "consigneeZip",
      "1234",
      "Invalid Mexican Postal Code!\nFormat must be 5 digits only (ex: 55555).",
      null,
      "Invalid Mexican Postal Code!",
    ],
  },
};
