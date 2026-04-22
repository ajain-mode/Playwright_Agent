/**
 * Unified Field Registry
 *
 * Single source of truth for all field name mappings used across:
 * - StepProcessor (natural-language → form field inference)
 * - PlaywrightAgent (CSV column header → extracted value aliasing)
 * - DataValidator (value normalization per field)
 *
 * Each canonical field definition ties together:
 * - canonicalKey: the testData key used in generated code (camelCase)
 * - formFieldId: the HTML form field name/id
 * - stepPatterns: regexes that match this field in natural-language steps
 * - csvAliases: lowercase CSV column headers that map to this field
 * - extractionSources: where the value can come from in explicitValues
 *
 * @author AI Agent
 * @created 2026-04-22
 */

// ─── Field Definition ────────────────────────────────────────────────

export interface FieldDefinition {
  /** The canonical testData key (camelCase), used in generated code as testData.<key> */
  canonicalKey: string;
  /** The HTML form field id/name (snake_case) used in locators */
  formFieldId: string;
  /** Regexes that match this field in natural-language test steps */
  stepPatterns: RegExp[];
  /** Lowercase CSV column headers that should map to this field's value */
  csvAliases: string[];
  /**
   * Where to find this field's value in testCase.explicitValues.
   * Format: 'precondition.<key>' or 'formFields.<key>'
   */
  extractionSources: string[];
}

// ─── Registry ────────────────────────────────────────────────────────

export const FIELD_REGISTRY: FieldDefinition[] = [
  {
    canonicalKey: 'customerRate',
    formFieldId: 'customer_rate',
    stepPatterns: [/customer\s*rate/i, /cust\.?\s*rate/i],
    csvAliases: ['customerrate'],
    extractionSources: ['formFields.customerRate'],
  },
  {
    canonicalKey: 'carrierRate',
    formFieldId: 'carrier_rate',
    stepPatterns: [/carrier\s*rate/i],
    csvAliases: ['carrierrate'],
    extractionSources: ['formFields.carrierRate'],
  },
  {
    canonicalKey: 'offerRate',
    formFieldId: 'offer_rate',
    stepPatterns: [/offer\s*rate/i],
    csvAliases: ['offerrate'],
    extractionSources: ['formFields.offerRate'],
  },
  {
    canonicalKey: 'officeCode',
    formFieldId: 'office_code',
    stepPatterns: [/office\s*code/i],
    csvAliases: ['officename'],
    extractionSources: ['precondition.officeCode'],
  },
  {
    canonicalKey: 'carrierName',
    formFieldId: 'carrier_name',
    stepPatterns: [/carrier\s*name/i],
    csvAliases: ['carrier'],
    extractionSources: ['formFields.carrierName', 'precondition.carrierName'],
  },
  {
    canonicalKey: 'trailerLength',
    formFieldId: 'trailer_length',
    stepPatterns: [/trailer\s*length/i],
    csvAliases: ['trailerlength'],
    extractionSources: ['formFields.trailerLength'],
  },
  {
    canonicalKey: 'expiration',
    formFieldId: 'expiration',
    stepPatterns: [/expiration/i],
    csvAliases: ['expiration'],
    extractionSources: ['formFields.expiration'],
  },
  {
    canonicalKey: 'miles',
    formFieldId: 'miles',
    stepPatterns: [/miles?\b/i],
    csvAliases: ['miles'],
    extractionSources: ['formFields.totalMiles'],
  },
  {
    canonicalKey: 'customerName',
    formFieldId: 'customer_name',
    stepPatterns: [/customer\s*name/i],
    csvAliases: ['customername'],
    extractionSources: ['precondition.customerName', 'formFields.customerName'],
  },
  {
    canonicalKey: 'equipmentType',
    formFieldId: 'equipment_type',
    stepPatterns: [/equipment\s*type/i, /equip\.?\s*type/i],
    csvAliases: ['equipmenttype'],
    extractionSources: ['formFields.equipmentType'],
  },
  {
    canonicalKey: 'loadMethod',
    formFieldId: 'load_method',
    stepPatterns: [/load\s*(?:method|type)/i],
    csvAliases: ['loadmethod'],
    extractionSources: ['formFields.loadType'],
  },
  {
    canonicalKey: 'equipmentLength',
    formFieldId: 'equipment_length',
    stepPatterns: [/equipment\s*length/i],
    csvAliases: ['equipmentlength'],
    extractionSources: ['formFields.equipmentLength'],
  },
  {
    canonicalKey: 'customerValue',
    formFieldId: 'customer_value',
    stepPatterns: [/customer\s*value/i],
    csvAliases: ['customervalue'],
    extractionSources: ['formFields.customerValue'],
  },
  {
    canonicalKey: 'commodity',
    formFieldId: 'commodity',
    stepPatterns: [/commodity/i],
    csvAliases: ['commodity'],
    extractionSources: ['formFields.commodity'],
  },
  {
    canonicalKey: 'saleAgentEmail',
    formFieldId: 'notification_email',
    stepPatterns: [/email\s*(?:for\s*)?notification/i, /notification\s*email/i],
    csvAliases: ['saleagentemail'],
    extractionSources: ['formFields.emailNotification'],
  },
  {
    canonicalKey: 'salesAgent',
    formFieldId: 'sales_agent',
    stepPatterns: [/sales?\s*agent/i, /salesperson/i],
    csvAliases: ['salesagent'],
    extractionSources: ['precondition.switchToUser', 'formFields.salesperson'],
  },
  {
    canonicalKey: 'shipperName',
    formFieldId: 'shipper_name',
    stepPatterns: [/shipper\s*name/i, /pick\s*(?:up\s*)?location/i],
    csvAliases: ['shippername'],
    extractionSources: ['formFields.pickLocation'],
  },
  {
    canonicalKey: 'consigneeName',
    formFieldId: 'consignee_name',
    stepPatterns: [/consignee\s*name/i, /drop\s*(?:off\s*)?location/i],
    csvAliases: ['consigneename'],
    extractionSources: ['formFields.dropLocation'],
  },
  {
    canonicalKey: 'shipperZip',
    formFieldId: 'shipper_zip',
    stepPatterns: [/shipper\s*zip/i],
    csvAliases: ['shipperzip'],
    extractionSources: ['formFields.shipperZip'],
  },
  {
    canonicalKey: 'consigneeZip',
    formFieldId: 'consignee_zip',
    stepPatterns: [/consignee\s*zip/i],
    csvAliases: ['consigneezip'],
    extractionSources: ['formFields.consigneeZip'],
  },
  {
    canonicalKey: 'shipperCity',
    formFieldId: 'shipper_city',
    stepPatterns: [/shipper\s*city/i],
    csvAliases: ['shippercity'],
    extractionSources: [],
  },
  {
    canonicalKey: 'shipperState',
    formFieldId: 'shipper_state',
    stepPatterns: [/shipper\s*state/i],
    csvAliases: ['shipperstate'],
    extractionSources: [],
  },
  {
    canonicalKey: 'consigneeCity',
    formFieldId: 'consignee_city',
    stepPatterns: [/consignee\s*city/i],
    csvAliases: ['consigneecity'],
    extractionSources: [],
  },
  {
    canonicalKey: 'consigneeState',
    formFieldId: 'consignee_state',
    stepPatterns: [/consignee\s*state/i],
    csvAliases: ['consigneestate'],
    extractionSources: [],
  },
  {
    canonicalKey: 'mileageEngine',
    formFieldId: 'mileage_engine',
    stepPatterns: [/mileage\s*engine/i],
    csvAliases: ['mileageengine'],
    extractionSources: ['formFields.mileageEngine'],
  },
  {
    canonicalKey: 'method',
    formFieldId: 'method',
    stepPatterns: [/\bmethod\b/i],
    csvAliases: ['method'],
    extractionSources: ['formFields.method'],
  },
  {
    canonicalKey: 'rateType',
    formFieldId: 'rate_type',
    stepPatterns: [/rate\s*type/i],
    csvAliases: ['ratetype'],
    extractionSources: ['formFields.rateType'],
  },
  {
    canonicalKey: 'shipmentCommodityQty',
    formFieldId: 'shipment_commodity_qty',
    stepPatterns: [/qty|quantity/i],
    csvAliases: ['shipmentcommodityqty'],
    extractionSources: ['formFields.qty'],
  },
  {
    canonicalKey: 'shipmentCommodityUoM',
    formFieldId: 'shipment_commodity_uom',
    stepPatterns: [/uom|unit\s*of\s*measure/i],
    csvAliases: ['shipmentcommodityuom'],
    extractionSources: ['formFields.uom'],
  },
  {
    canonicalKey: 'shipmentCommodityDescription',
    formFieldId: 'shipment_commodity_description',
    stepPatterns: [/commodity\s*desc/i],
    csvAliases: ['shipmentcommoditydescription'],
    extractionSources: ['formFields.description'],
  },
  {
    canonicalKey: 'shipmentCommodityWeight',
    formFieldId: 'shipment_commodity_weight',
    stepPatterns: [/commodity\s*weight|weight/i],
    csvAliases: ['shipmentcommodityweight'],
    extractionSources: ['formFields.weight'],
  },
  {
    canonicalKey: 'shipperEarliestTime',
    formFieldId: 'shipper_earliest_time',
    stepPatterns: [/shipper\s*earliest/i],
    csvAliases: ['shipperearliesttime'],
    extractionSources: ['formFields.shipperEarliestTime'],
  },
  {
    canonicalKey: 'shipperLatestTime',
    formFieldId: 'shipper_latest_time',
    stepPatterns: [/shipper\s*latest/i],
    csvAliases: ['shipperlatesttime'],
    extractionSources: ['formFields.shipperLatestTime'],
  },
  {
    canonicalKey: 'consigneeEarliestTime',
    formFieldId: 'consignee_earliest_time',
    stepPatterns: [/consignee\s*earliest/i],
    csvAliases: ['consigneeearliesttime'],
    extractionSources: ['formFields.consigneeEarliestTime'],
  },
  {
    canonicalKey: 'consigneeLatestTime',
    formFieldId: 'consignee_latest_time',
    stepPatterns: [/consignee\s*latest/i],
    csvAliases: ['consigneelatesttime'],
    extractionSources: ['formFields.consigneeLatestTime'],
  },
];

// ─── Derived Lookups ─────────────────────────────────────────────────

/** StepProcessor-compatible: patterns → { targetField, testDataKey } */
export function buildStepFieldAliases(): Array<{
  patterns: RegExp[];
  targetField: string;
  testDataKey: string;
}> {
  return FIELD_REGISTRY
    .filter(f => f.stepPatterns.length > 0)
    .map(f => ({
      patterns: f.stepPatterns,
      targetField: f.formFieldId,
      testDataKey: f.canonicalKey,
    }));
}

/**
 * Build the CSV column-to-value alias map from explicitValues.
 * Replaces the 60+ line aliasMap block in PlaywrightAgent.appendTestDataToCsv().
 */
export function buildCsvAliasMap(
  explicitValues: { precondition?: Record<string, any>; formFields?: Record<string, any> },
  normalizeLoadMethod?: (v: string) => string,
): Record<string, string> {
  const aliasMap: Record<string, string> = {};
  const pre = explicitValues.precondition || {};
  const form = explicitValues.formFields || {};

  for (const field of FIELD_REGISTRY) {
    // Walk extraction sources to find a value
    let value: string | undefined;
    for (const src of field.extractionSources) {
      const [section, key] = src.split('.', 2);
      const bucket = section === 'precondition' ? pre : form;
      if (bucket[key]) {
        value = String(bucket[key]);
        break;
      }
    }
    if (!value) continue;

    // Special handling: loadMethod normalization
    if (field.canonicalKey === 'loadMethod' && normalizeLoadMethod) {
      value = normalizeLoadMethod(value);
    }

    // Special handling: salesAgent formatting
    if (field.canonicalKey === 'salesAgent' && value) {
      value = value.replace(/\(/, ' (').replace(/\s{2,}/, ' ').trim();
    }

    // Write into all CSV aliases for this field
    for (const alias of field.csvAliases) {
      aliasMap[alias] = value;
    }
  }

  // equipmentLength fallback: use trailerLength if equipmentLength is missing
  if (!aliasMap['equipmentlength'] && aliasMap['trailerlength']) {
    aliasMap['equipmentlength'] = aliasMap['trailerlength'];
  }

  return aliasMap;
}

/**
 * Given a lowercase-normalized CSV column header, find the canonical testData key.
 * Used for CSV read operations to normalize column names.
 */
export function csvHeaderToCanonicalKey(headerLower: string): string | undefined {
  for (const field of FIELD_REGISTRY) {
    if (field.csvAliases.includes(headerLower)) {
      return field.canonicalKey;
    }
  }
  return undefined;
}

/**
 * Given a testData key (camelCase), find the form field id.
 */
export function testDataKeyToFormField(key: string): string | undefined {
  for (const field of FIELD_REGISTRY) {
    if (field.canonicalKey === key) {
      return field.formFieldId;
    }
  }
  return undefined;
}
