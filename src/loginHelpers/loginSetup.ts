import dataConfig from "@config/dataConfig";

class LoginSetup {
    Execution_Env: string;
    btmsUrl: string;
    tnxUrl: string;
    tnxRepUrl : string;
    dmeUrl: string;
    tritanUrl: string;
    customerPortalUrl: string;
    apiUrl: string;
    legacyCustomerPortalUrl: string;
    tmsApiBaseUrl: string;
    /** SSH bastion host — resolved from config.json `database.sshHost` */
    sshHost: string;
    /** MySQL host behind bastion — resolved from config.json `database.dbHost` */
    dbHost: string;
    /** MySQL port — from .env `BTMS_DB_PORT` */
    dbPort: number;
    /** SSH bastion port — from .env `BTMS_SSH_PORT` */
    sshPort: number;
    /** SSH bastion user — from .env `BTMS_SSH_USER` */
    sshUser: string;
    /** MySQL user — from .env `BTMS_DB_USER` */
    dbUser: string;
    /** MySQL schema — from .env `BTMS_DB_SCHEMA` */
    dbSchema: string;
    private data = dataConfig.readJsonData("loginHelpers", "config.json");
    constructor() {
        // Access nested properties based on env.json structure
        const envData = this.data && this.data.env ? (this.data.env as any) : {};
        const urlsData = this.data && this.data.urls ? (this.data.urls as any) : {};
        const databaseData = this.data && this.data.database ? (this.data.database as any) : {};
        // Initialize properties with default values or from the config
        //@modified: Rohit Singh - 23-dec-2025 -> Read Execution env from github workflow input or from env.json
        this.Execution_Env = process.env.EXECUTION_ENV || envData.Execution_Env;
        // this.Execution_Env = envData.Execution_Env || '';
        this.btmsUrl = urlsData.btmsUrl.replace('${env}', this.Execution_Env) || '';
        this.tnxUrl = urlsData.tnxUrl.replace('${env}', this.Execution_Env) || '';
        this.dmeUrl = urlsData.dmeUrl.replace('${env}', this.Execution_Env) || '';
        this.tnxRepUrl = urlsData.tnxRepUrl.replace('${env}', this.Execution_Env) || '';
        // @modified : Rohit Singh - 24-oct-2025 -> Tritan URL added
        this.tritanUrl = urlsData.tritanUrl || '';
        // @modified : Aniket Nale - 2025-11-03 -> Customer Portal URL added
        this.customerPortalUrl = urlsData.customerPortalUrl.replace('${env}', this.Execution_Env) || '';
        this.tnxRepUrl = urlsData.tnxRepUrl.replace('${env}', this.Execution_Env) || '';
        // @modified : Rohit Singh - 2025-12-05 -> API URL added
        this.apiUrl = urlsData.apiUrl.replace('${env}', this.Execution_Env) || '';
        this.tmsApiBaseUrl = urlsData.tmsApiBaseUrl.replace('${env}', this.Execution_Env) || '';
        // @added : Aniket Nale - 2025-11-19 -> Legacy Customer Portal URL added
        this.legacyCustomerPortalUrl = urlsData.legacyCustomerPortalUrl.replace('${env}', this.Execution_Env) || '';
        // @added : AI Agent - 2026-06-10 -> BTMS DB / SSH bastion hosts from config.json (env-specific)
        this.sshHost = (databaseData.sshHost || '').replace('${env}', this.Execution_Env);
        this.dbHost = (databaseData.dbHost || '').replace('${env}', this.Execution_Env);
        this.dbPort = Number(process.env.BTMS_DB_PORT ?? 3306);
        this.sshPort = Number(process.env.BTMS_SSH_PORT ?? 22);
        this.sshUser = process.env.BTMS_SSH_USER || 'bastion';
        this.dbUser = process.env.BTMS_DB_USER || 'readonly';
        this.dbSchema = process.env.BTMS_DB_SCHEMA || 'sunteck_fats';
    }
}
const loginSetup = new LoginSetup();
export default loginSetup;