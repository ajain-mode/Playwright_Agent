import type { AgentAuthRolesExpectation } from "@pages/admin/agent/AgentInfoPage";
import { GlobalConstants } from "@utils/globalConstants";

/** Reusable payables-toggle test scenario — agent auth, customer, and load routing context. */
export type PayablesToggleScenario = {
  label: string;
  agentSearchName: string;
  switchUserName: string;
  authExpectation: AgentAuthRolesExpectation;
  customerName: string;
  shipperName: string;
  /** Required when shipper is not in the customer ship-point dropdown (manual entry). */
  shipperAddress?: string;
  shipperCity?: string;
  shipperState?: string;
  shipperZip?: string;
  consigneeName: string;
  expectedSalesperson: string;
  expectedDispatcher: string;
};

export class BillingToggleConstants {
  /** Agent display name for Admin → Agent Search (e.g. BT-67876). */
  static readonly AGENT_SEARCH_NAME = "MATT BROWN" as const;

  /** Payables short-pay settlement labels/messages — Tritan SLC + BTMS View Billing. */
  static readonly PAYABLE_SHORT_PAY = {
    FUEL_SURCHARGE_REASON: "Short Pay - Fuel Surcharge",
    FUEL_SURCHARGE_COMMENT: "Carrier Agreed to include fuel surcharge in linehaul",
    FUEL_SURCHARGE_MESSAGE:
      "Short Pay - Fuel Surcharge; Carrier Agreed to include fuel surcharge in linehaul",
    ACCESSORIAL_AGAIN_COMMENT: "Carrier Agreed to include fuel surcharge in linehaul again",
    ACCESSORIAL_AGAIN_MESSAGE:
      "Short Pay - Accessorial; Carrier Agreed to include fuel surcharge in linehaul again",
    FUEL_SURCHARGE_AMOUNT: 125,
  } as const;

  /** Agent display names used across payables-toggle scenarios. */
  static readonly AGENT_NAMES = {
    FRISCO_TL: "FRISCO TL",
    COMMERCIAL_SALES_HOUSE: "COMMERCIAL SALES HOUSE (SALES)",
  } as const;

  /** Customer names used across payables-toggle scenarios. */
  static readonly CUSTOMER_NAMES = {
    CRESCENT_SPECIALTY_FOODS: "CRESCENT SPECIALTY FOODS INC",
  } as const;

  /** Shipper/consignee locations for payables-toggle load creation. */
  static readonly SHIP_LOCATIONS = {
    BLB_VERGINIA_LLC: {
      name: "BLB VERGINIA LLC",
      address: "8422 WELLINGTON RD",
      city: "MANASSAS",
      state: "VA",
      zip: "20109",
    },
    CONSIGNEE_CRESCENT_EVERETT: "|CRESCENT SPECIALTY FOODS|EVERETT|WA",
  } as const;

  /** Expected agent auth level and roles for payables-toggle precondition flows. */
  static readonly AGENT_AUTH_EXPECTATIONS = {
    MANAGER: {
      authLevel: GlobalConstants.AGENT_AUTH_LEVEL.MANAGER,
      requiredRoles: [
        GlobalConstants.AGENT_USER_ROLES.BTMS_USER,
        GlobalConstants.AGENT_USER_ROLES.PRINCIPAL,
      ],
      forbiddenRoles: [
        GlobalConstants.AGENT_USER_ROLES.ADMIN,
        GlobalConstants.AGENT_USER_ROLES.SYSTEM_ADMIN,
      ],
    } satisfies AgentAuthRolesExpectation,
    SALES: {
      authLevel: GlobalConstants.AGENT_AUTH_LEVEL.SALES,
      requiredRoles: [
        GlobalConstants.AGENT_USER_ROLES.BTMS_USER,
        GlobalConstants.AGENT_USER_ROLES.PRINCIPAL,
        GlobalConstants.AGENT_USER_ROLES.PAYABLES_MANAGER,
      ],
      forbiddenRoles: [
        GlobalConstants.AGENT_USER_ROLES.ADMIN,
        GlobalConstants.AGENT_USER_ROLES.SYSTEM_ADMIN,
      ],
    } satisfies AgentAuthRolesExpectation,
  } as const;

  /** Payables toggle slider behaviour and allowed values on View Billing. */
  static readonly PAYABLES_TOGGLE = {
    NEUTRAL_BLOCKED_ALLOWED_VALUES: [
      GlobalConstants.PAYABLES_TOGGLE_VALUE.PAYABLES,
      GlobalConstants.PAYABLES_TOGGLE_VALUE.AGENT,
    ],
    SCENARIO_LABEL: {
      MANAGER_FRISCO: "Manager (FRISCO TL)",
      SALES_COMMERCIAL_HOUSE: "Sales Agent (COMMERCIAL SALES HOUSE)",
    },
  } as const;

  static readonly EDI210_PAYLOAD_PATH = "src/data/api/billingtoggle/edi210_carrier_not_booked.json" as const;
}

/** Uppercase agent display name without parenthetical suffix (salesperson/dispatcher checks). */
export function agentDisplayNameFragment(agentDisplayName: string): string {
  return agentDisplayName.toUpperCase().split("(")[0].trim();
}

/**
 * Manager-agent scenario — FRISCO TL; customer/shipper/consignee from CSV test data.
 * @param testData - billingtoggle CSV row (customerName, shipperName, salesAgent, etc.)
 */
export function buildManagerPayablesToggleScenario(
  testData: Record<string, string>,
): PayablesToggleScenario {
  const { AGENT_NAMES, AGENT_AUTH_EXPECTATIONS, PAYABLES_TOGGLE } = BillingToggleConstants;
  return {
    label: PAYABLES_TOGGLE.SCENARIO_LABEL.MANAGER_FRISCO,
    agentSearchName: AGENT_NAMES.FRISCO_TL,
    switchUserName: testData.salesAgent,
    authExpectation: AGENT_AUTH_EXPECTATIONS.MANAGER,
    customerName: testData.customerName,
    shipperName: testData.shipperName,
    consigneeName: testData.consigneeName,
    expectedSalesperson: testData.salesAgent,
    expectedDispatcher: testData.salesAgent,
  };
}

/**
 * Sales-agent scenario — COMMERCIAL SALES HOUSE; fixed customer and manual shipper entry.
 */
export function buildSalesPayablesToggleScenario(): PayablesToggleScenario {
  const { AGENT_NAMES, CUSTOMER_NAMES, SHIP_LOCATIONS, AGENT_AUTH_EXPECTATIONS, PAYABLES_TOGGLE } =
    BillingToggleConstants;
  const shipper = SHIP_LOCATIONS.BLB_VERGINIA_LLC;
  const agent = AGENT_NAMES.COMMERCIAL_SALES_HOUSE;
  return {
    label: PAYABLES_TOGGLE.SCENARIO_LABEL.SALES_COMMERCIAL_HOUSE,
    agentSearchName: agent,
    switchUserName: agent,
    authExpectation: AGENT_AUTH_EXPECTATIONS.SALES,
    customerName: CUSTOMER_NAMES.CRESCENT_SPECIALTY_FOODS,
    shipperName: shipper.name,
    shipperAddress: shipper.address,
    shipperCity: shipper.city,
    shipperState: shipper.state,
    shipperZip: shipper.zip,
    consigneeName: SHIP_LOCATIONS.CONSIGNEE_CRESCENT_EVERETT,
    expectedSalesperson: agent,
    expectedDispatcher: agent,
  };
}

/** Maps a payables-toggle scenario + CSV test data into non-tabular load creation fields. */
export function buildNonTabularLoadFieldsFromScenario(
  testData: Record<string, string>,
  scenario: PayablesToggleScenario,
) {
  return {
    shipperValue: scenario.shipperName,
    shipperAddress: scenario.shipperAddress,
    shipperCity: scenario.shipperCity,
    shipperState: scenario.shipperState,
    shipperZip: scenario.shipperZip,
    consigneeValue: scenario.consigneeName,
    shipperEarliestTime: testData.shipperEarliestTime,
    shipperLatestTime: testData.shipperLatestTime,
    consigneeEarliestTime: testData.consigneeEarliestTime,
    consigneeLatestTime: testData.consigneeLatestTime,
    shipmentCommodityQty: testData.shipmentCommodityQty,
    shipmentCommodityUoM: testData.shipmentCommodityUoM,
    shipmentCommodityDescription: testData.shipmentCommodityDescription,
    shipmentCommodityWeight: testData.shipmentCommodityWeight,
    equipmentType: testData.equipmentType,
    equipmentLength: testData.equipmentLength,
  };
}

declare global {
  const AGENT_SEARCH_NAME: typeof BillingToggleConstants.AGENT_SEARCH_NAME;
  const PAYABLE_SHORT_PAY: typeof BillingToggleConstants.PAYABLE_SHORT_PAY;
  const AGENT_NAMES: typeof BillingToggleConstants.AGENT_NAMES;
  const CUSTOMER_NAMES: typeof BillingToggleConstants.CUSTOMER_NAMES;
  const SHIP_LOCATIONS: typeof BillingToggleConstants.SHIP_LOCATIONS;
  const AGENT_AUTH_EXPECTATIONS: typeof BillingToggleConstants.AGENT_AUTH_EXPECTATIONS;
  const PAYABLES_TOGGLE: typeof BillingToggleConstants.PAYABLES_TOGGLE;
  const EDI210_PAYLOAD_PATH: typeof BillingToggleConstants.EDI210_PAYLOAD_PATH;
}

if (typeof globalThis !== "undefined") {
  (globalThis as any).AGENT_SEARCH_NAME = BillingToggleConstants.AGENT_SEARCH_NAME;
  (globalThis as any).PAYABLE_SHORT_PAY = BillingToggleConstants.PAYABLE_SHORT_PAY;
  (globalThis as any).AGENT_NAMES = BillingToggleConstants.AGENT_NAMES;
  (globalThis as any).CUSTOMER_NAMES = BillingToggleConstants.CUSTOMER_NAMES;
  (globalThis as any).SHIP_LOCATIONS = BillingToggleConstants.SHIP_LOCATIONS;
  (globalThis as any).AGENT_AUTH_EXPECTATIONS = BillingToggleConstants.AGENT_AUTH_EXPECTATIONS;
  (globalThis as any).PAYABLES_TOGGLE = BillingToggleConstants.PAYABLES_TOGGLE;
  (globalThis as any).EDI210_PAYLOAD_PATH = BillingToggleConstants.EDI210_PAYLOAD_PATH;
}
