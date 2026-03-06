import dataConfig from "@config/dataConfig";
import dotenv from "dotenv";

dotenv.config();

class UserSetup {
    globalUser: string;
    globalPassword: string;
    // SSO Users
    btmsSSOUser: string
    btmsSSOPassword: string;
    ediUserMarmaxx: string;
    ediUserIBO: string;
    UserCommission: string;
    UserSales: string;
    tnxUser: string;
    tnxRepUser: string;
    tnxRepPassword: string;
    tnxPassword: string;
    dmeUser: string;
    dmePassword: string;
    tritanCustomer: string;
    tritanCustomerPassword: string;
    customerPortalUser: string;
    customerPortalPassword: string;
    tritanAdminCustomer: string;
    tritanAdminCustomerPassword: string;
    legacyCustomerPortalPassword: string;
    legacyCustomerPortalUser_pit: string;
    legacyCustomerPortalUser_stage: string;
    banyanUser: string;
    datUser: string;
    bulkChangeUser: string;
    bulkChangePassword: string;

    userData = dataConfig.readJsonData("loginHelpers", "userConfig.json");
    constructor() {
        this.globalUser = this.userData && this.userData.globalUser;
        this.globalPassword = process.env.GLOBAL_PASSWORD || '';
        // SSO Users
        const ssoUserData = this.userData && this.userData.ssoUser ? (this.userData.ssoUser as any) : {};
        this.btmsSSOUser = ssoUserData.btmsSSOUser || '';
        this.btmsSSOPassword = process.env.BTMS_SSO_PASSWORD || '';
        const userEdiData = this.userData && this.userData.edi ? (this.userData.edi as any) : {};
        this.ediUserMarmaxx = userEdiData.UserMarmaxx || '';
        this.ediUserIBO = userEdiData.ediUserIBO || '';
        const userCommissionData = this.userData && this.userData.commissions ? (this.userData.commissions as any) : {};
        this.UserCommission = userCommissionData.UserCommission || '';
        const userSalesData = this.userData && this.userData.saleslead ? (this.userData.saleslead as any) : {};
        this.UserSales = userSalesData.UserSales || '';
        this.tnxUser = this.userData && this.userData.tnx ? (this.userData.tnx as any).tnxUser : '';
        this.tnxRepUser = this.userData && this.userData.tnxRep ? (this.userData.tnxRep as any).tnxRepUser : '';
        this.tnxPassword = process.env.TNX_PASSWORD || '';
        this.tnxRepPassword = process.env.TNX_REP_PASSWORD || '';
        this.dmeUser = this.userData && this.userData.dme ? (this.userData.dme as any).dmeUser : '';
        this.dmePassword = process.env.DME_PASSWORD || '';
        // @modified : Rohit Singh - 24-oct-2025 -> users added for Tritan
        const tritanUserData = this.userData && this.userData.tritan ? (this.userData.tritan as any) : {};
        this.tritanCustomer = tritanUserData.tritanCustomer || '';
        this.tritanCustomerPassword = process.env.TRITAN_CUSTOMER_PASSWORD || '';
        // @modified : Aniket Nale - 2025-11-03 -> users added for Customer Portal
        const customerPortalUserData = this.userData && this.userData.customerPortal ? (this.userData.customerPortal as any) : {};
        this.customerPortalUser = customerPortalUserData.customerPortalUser || '';
        this.customerPortalPassword = process.env.CUSTOMER_PORTAL_PASSWORD || '';
        // @added : Aniket Nale - 2025-11-17 -> users added for Tritan1
        const tritanAdminUserData = this.userData && this.userData.tritanAdmin ? (this.userData.tritanAdmin as any) : {};
        this.tritanAdminCustomer = tritanAdminUserData.tritanAdminCustomer || '';
        this.tritanAdminCustomerPassword = process.env.TRITAN_ADMIN_CUSTOMER_PASSWORD || '';
        // @added : Aniket Nale - 2025-11-19 -> users added for Legacy Customer Portal
        const legacyCustomerPortalUserData = this.userData && this.userData.legacyCustomerPortal ? (this.userData.legacyCustomerPortal as any) : {};
        this.legacyCustomerPortalUser_pit = legacyCustomerPortalUserData.legacyCustomerPortalUser_pit || '';
        this.legacyCustomerPortalUser_stage = legacyCustomerPortalUserData.legacyCustomerPortalUser_stage || '';
        this.legacyCustomerPortalPassword = process.env.LEGACY_CUSTOMER_PORTAL_PASSWORD || '';

        // @added : Aniket Nale - 2025-12-22 -> users added for Banyan
        const banyanUserData = this.userData && this.userData.banyan ? (this.userData.banyan as any) : {};
        this.banyanUser = banyanUserData.banyanUser || '';
        const userDatData = this.userData && this.userData.dat ? (this.userData.dat as any) : {};
        this.datUser = userDatData.datUser || '';
        //@added : Tejaswini - 2025-12-01 -> user added for Bulk Change
        const bulkChangeUserData = this.userData && this.userData.bulkChange ? (this.userData.bulkChange as any) : {};
        this.bulkChangeUser = bulkChangeUserData.bulkChangeUser || '';
        this.bulkChangePassword = process.env.BULK_CHANGE_PASSWORD || '';
    }
}

const userSetup = new UserSetup();
export default userSetup;
