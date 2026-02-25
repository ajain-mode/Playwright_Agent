export class NonOperationalLoadsConstant {
    static readonly LOAD_ACTIVITIES = {
        SET_COMPLETE: "Set Complete",
    } as const;

    static readonly SELECT_QUEUE_ACTION = {
        FORTY_EXTRACT: "40 Extract",
    } as const;

    static readonly INVOICE_OPTIONS = {
        SINGLE_INVOICE: "Single Invoice",
    } as const;

    static readonly LOAD_CHARGES = {
        CUSTOM_CHARGES: "CUSTOM CHARGES",
    } as const;

    static readonly INVOICE_CHARGES_DROPDOWN = {
        ADMINISTRATION_FEE: "ADMINISTRATION FEE",
    } as const;

    static readonly CHARGE_AMOUNTS = {
        ONE_HUNDRED_FIFTY: "150.00",
        ONE_HUNDRED: "100.00",
        EIGHTY_EIGHT: "88.00",
        NINETY_NINE: "99.00",
    } as const;

    static readonly SETTLEMENT_REASONS = {
        ACCESSORIAL_CHARGE_ADDED: "Accessorial Charge Added",
    } as const;

    static readonly APPROVAL_FOR = {
        CUSTOMER: 1,
        CARRIER: 2,
    } as const;

    static readonly REVIEWED_BY = {
        INTELYS_API_PORTAL: "Intelys API Portal",
    } as const;
}
// Declare global variables
declare global {
    const LOAD_ACTIVITIES: typeof NonOperationalLoadsConstant.LOAD_ACTIVITIES;
    const SELECT_QUEUE_ACTION: typeof NonOperationalLoadsConstant.SELECT_QUEUE_ACTION;
    const INVOICE_OPTIONS: typeof NonOperationalLoadsConstant.INVOICE_OPTIONS;
    const LOAD_CHARGES: typeof NonOperationalLoadsConstant.LOAD_CHARGES;
    const INVOICE_CHARGES_DROPDOWN: typeof NonOperationalLoadsConstant.INVOICE_CHARGES_DROPDOWN;
    const CHARGE_AMOUNTS: typeof NonOperationalLoadsConstant.CHARGE_AMOUNTS;
    const SETTLEMENT_REASONS: typeof NonOperationalLoadsConstant.SETTLEMENT_REASONS;
    const APPROVAL_FOR: typeof NonOperationalLoadsConstant.APPROVAL_FOR;
    const REVIEWED_BY: typeof NonOperationalLoadsConstant.REVIEWED_BY;
}
// Assign to globalThis if available
if (typeof globalThis !== 'undefined') {
    (globalThis as any).LOAD_ACTIVITIES = NonOperationalLoadsConstant.LOAD_ACTIVITIES;
    (globalThis as any).SELECT_QUEUE_ACTION = NonOperationalLoadsConstant.SELECT_QUEUE_ACTION;
    (globalThis as any).INVOICE_OPTIONS = NonOperationalLoadsConstant.INVOICE_OPTIONS;
    (globalThis as any).LOAD_CHARGES = NonOperationalLoadsConstant.LOAD_CHARGES;
    (globalThis as any).INVOICE_CHARGES_DROPDOWN = NonOperationalLoadsConstant.INVOICE_CHARGES_DROPDOWN;
    (globalThis as any).CHARGE_AMOUNTS = NonOperationalLoadsConstant.CHARGE_AMOUNTS;
    (globalThis as any).SETTLEMENT_REASONS = NonOperationalLoadsConstant.SETTLEMENT_REASONS;
    (globalThis as any).APPROVAL_FOR = NonOperationalLoadsConstant.APPROVAL_FOR;
    (globalThis as any).REVIEWED_BY = NonOperationalLoadsConstant.REVIEWED_BY;
}