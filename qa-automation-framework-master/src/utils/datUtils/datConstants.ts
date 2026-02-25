export class DatConstants {

    static readonly DAT_POST_METHOD = {
        API: 'API',
        FTP: 'FTP'
    } as const;

    static readonly DAT_CONTACT_PREF = {
        PRIMARY_PHONE: 'Primary Phone',
        ALTERNATE_PHONE: 'Alternate Phone',
        EMAIL: 'Email',
    } as const;
}

/**
 * @author Mukul Khan
 * @description  Global declarations - makes constants available without imports
 * @created 19-Jan-2026
 */
declare global {
    const DAT_POST_METHOD: typeof DatConstants.DAT_POST_METHOD;
    const DAT_CONTACT_PREF: typeof DatConstants.DAT_CONTACT_PREF;

}

/**
 * @author Mukul Khan
 * @description This file contains global constants used across the test automation framework for DAT load creation. //Assign to globalThis if available
 * @created 19-Jan-2026
 */
if (typeof globalThis !== 'undefined') {
    (globalThis as any).DAT_POST_METHOD = DatConstants.DAT_POST_METHOD;
    (globalThis as any).DAT_CONTACT_PREF = DatConstants.DAT_CONTACT_PREF;
}



