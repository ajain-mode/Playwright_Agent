export class salesLeadConstants {

    static readonly salesLeadFilters = {
        DENIED: "Denied",
    } as const;

    static readonly paymentTermsOptions = {
        NET_15: "NET 15",
    } as const;

    static readonly salesLeadStatuses = {
        ACTIVATE: "ACTIVATE",
        ACTIVE: "ACTIVE",
        DENIED: "DENIED",
    } as const;

    static readonly OPERATING_OFFICE = {
        GA_JS: "OPS - JANE SANDERS (GA-JS)",
    } as const;
}
// Declare global variables
declare global {
    const salesLeadFilters: typeof salesLeadConstants.salesLeadFilters;
    type SalesLeadFiltersType = typeof salesLeadConstants.salesLeadFilters;

    const paymentTermsOptions: typeof salesLeadConstants.paymentTermsOptions;
    type PaymentTermsOptionsType = typeof salesLeadConstants.paymentTermsOptions;

    const salesLeadStatuses: typeof salesLeadConstants.salesLeadStatuses;
    type SalesLeadStatusesType = typeof salesLeadConstants.salesLeadStatuses;

    const OPERATING_OFFICE: typeof salesLeadConstants.OPERATING_OFFICE;
    type OperatingOfficeType = typeof salesLeadConstants.OPERATING_OFFICE;
}

// Assign to globalThis if available
if (typeof globalThis !== 'undefined') {
    (globalThis as any).salesLeadFilters = salesLeadConstants.salesLeadFilters;
    (globalThis as any).paymentTermsOptions = salesLeadConstants.paymentTermsOptions;
    (globalThis as any).salesLeadStatuses = salesLeadConstants.salesLeadStatuses;
    (globalThis as any).OPERATING_OFFICE = salesLeadConstants.OPERATING_OFFICE;
}