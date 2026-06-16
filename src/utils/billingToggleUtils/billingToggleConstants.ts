export class BillingToggleConstants {
  /** Agent display name for Admin → Agent Search (e.g. BT-67876). */
  static readonly AGENT_SEARCH_NAME = "MATT BROWN" as const;

  /** Payables short-pay settlement labels/messages — Tritan SLC + BTMS View Billing (BT-82789). */
  static readonly PAYABLE_SHORT_PAY = {
    FUEL_SURCHARGE_REASON: "Short Pay - Fuel Surcharge",
    FUEL_SURCHARGE_COMMENT: "Carrier Agreed to include fuel surcharge in linehaul",
    FUEL_SURCHARGE_MESSAGE:
      "Short Pay - Fuel Surcharge; Carrier Agreed to include fuel surcharge in linehaul",
    ACCESSORIAL_AGAIN_COMMENT: "Carrier Agreed to include fuel surcharge in linehaul again",
    ACCESSORIAL_AGAIN_MESSAGE:
      "Short Pay - Accessorial; Carrier Agreed to include fuel surcharge in linehaul again",
  } as const;
}

declare global {
  const AGENT_SEARCH_NAME: typeof BillingToggleConstants.AGENT_SEARCH_NAME;
  const PAYABLE_SHORT_PAY: typeof BillingToggleConstants.PAYABLE_SHORT_PAY;
}

if (typeof globalThis !== "undefined") {
  (globalThis as any).AGENT_SEARCH_NAME = BillingToggleConstants.AGENT_SEARCH_NAME;
  (globalThis as any).PAYABLE_SHORT_PAY = BillingToggleConstants.PAYABLE_SHORT_PAY;
}
