/**
 * Agent Configuration
 * Contains configuration settings for the Playwright Agent
 * 
 * @author AI Agent Generator
 * @created 2026-02-05
 */

import path from 'path';

export interface AgentConfigOptions {
  modelName?: string;
  temperature?: number;
  llmEnabled?: boolean;
  llmMaxRetries?: number;
  llmCacheEnabled?: boolean;
  outputDir?: string;
  dataDir?: string;
  pagesDir?: string;
  utilsDir?: string;
  testsDir?: string;
}

export class AgentConfig {
  // LLM Configuration (uses Claude CLI with Max plan — no API key needed)
  public modelName: string;
  public temperature: number;
  public llmEnabled: boolean;
  public llmMaxRetries: number;
  public llmCacheEnabled: boolean;

  // Directory paths (relative to project root)
  public readonly projectRoot: string;
  public readonly outputDir: string;
  public readonly dataDir: string;
  public readonly pagesDir: string;
  public readonly utilsDir: string;
  public readonly testsDir: string;

  // Test categories available
  public readonly testCategories = [
    'dfb', 'edi', 'commission', 'salesLead', 'banyan', 
    'carrier', 'bulkChange', 'dat', 'nonOperationalLoads', 'api',
    'billingtoggle'
  ];

  // Available page objects
  public readonly pageObjects = {
    loads: [
      'AllLoadsSearchPage', 'DFBIncludeCarriersDataModalWaterfall', 'DFBLoadFormPage',
      'DuplicateLoadPage', 'EDI204LoadTendersPage', 'LoadBillingPage', 'LoadsPage',
      'LoadTender204Page', 'EditLoadPage', 'EditLoadCarrierTabPage', 'EditLoadCustomerTabPage',
      'EditLoadDropTabPage', 'EditLoadFormPage', 'EditLoadLoadTabPage', 'EditLoadPickTabPage',
      'EditLoadRailTabPage', 'EditLoadValidationFieldPage', 'NonTabularLoadPage',
      'ViewLoadPage', 'ViewLoadCarrierTabPage', 'ViewLoadCustomerTabPage',
      'ViewLoadDropTabPage', 'ViewLoadEDITabPage', 'ViewLoadPickTabPage'
    ],
    login: [
      'BTMSLoginPage', 'BTMSAcceptTermPage', 'CustomerPortalLogin', 'DMELoginPage',
      'LegacyCustomerPortalLogin', 'TNXLoginPage', 'TNXRepLoginPage', 'TRITANLoginPage'
    ],
    admin: ['AdminPage', 'OfficePage', 'SimulateEDispatch', 'ViewOfficeInfoPage', 'EditOfficeInfoPage'],
    customers: ['CustomerPage', 'EditCustomerPage', 'SearchCustomerPage', 'ViewCustomerPage', 'ViewMasterCustomerPage'],
    finance: ['FinancePage', 'AccountsPayablePage', 'BillingAdjustmentsQueue', 'OfficeCommissionsDetailPage'],
    home: ['HomePage', 'PostAutomationRulePage'],
    salesLead: ['NewSalesLeadPage', 'MySalesLeadPage', 'ViewSalesLeadPage', 'AccountClearanceQueuePage'],
    carrier: ['CarrierSearch', 'ViewCarrier'],
    tnx: ['TNXLandingPage', 'TNXCarrierTenderPage', 'TNXExecutionTenderPage', 'TNXRepLandingPage'],
    dme: ['DMEDashboardPage', 'DMELoadPage'],
    common: ['BasePage', 'HomePage', 'AgentAccountsPage']
  };

  // Global constants available (all constant groups from src/utils/*Constants*.ts files)
  public readonly globalConstants = [
    // globalConstants.ts
    'WAIT', 'HEADERS', 'ADMIN_SUB_MENU', 'CUSTOMER_SUB_MENU', 'FINANCE_SUB_MENU',
    'AGENT_SUB_MENU', 'CARRIER_SUB_MENU', 'LOAD_TYPES', 'CUSTOMER_NAME', 'BUTTONS',
    'TABS', 'CARGO_VALUES', 'CARGO_ADJUSTMENT_VALUES', 'COUNTRY', 'DFBLOAD_FORM',
    'DUPLICATE_LOAD_CHECKBOX', 'CONFIDENCE_LEVEL', 'LOAD_STATUS', 'CARRIER_STATUS',
    'EDI_IN_OUT', 'EDI_CODE', 'EDI_STATUS', 'COMMISSION_AUDIT_STATUS',
    'INTERNAL_SHARE_STATUS', 'AGENT_AUTH_LEVEL', 'AGENT_AUTH_ALLOWED',
    'CUSTOMER_STATUS', 'MOVE_TYPE', 'TNX', 'DFB_Button', 'LOAD_SUB_MENU',
    'LOAD_TEMPLATE_SEARCH_PAGE', 'ACCESSORIALS_NAME', 'QUOTE_DETAIL_LABELS',
    'EDI_OVERRIDE_STATUS', 'API_STATUS', 'DOC_EXTENSIONS', 'CARRIER_ACTION',
    'CREATED_BY', 'DOCUMENT_TYPE', 'DOCUMENT_ACTION_TYPE', 'DOCUMENT_TEXT',
    'LOAD_METHOD', 'RATE_TYPE', 'TOGGLE_NAME', 'TOGGLE_OPTIONS', 'USER_ROLES', 'CARRIER_TABS',
    'POST_AUTOMATION_RULE', 'POST_AUTOMATION_COLUMNS',
    // dfbGlobalConstants.ts
    'PRIORITY', 'LOAD_OFFER_RATES', 'CARRIER_TIMING', 'CARRIER_NAME',
    'DFB_FORM_FIELDS', 'DFB_BID_HISTORY_FIELDS', 'TENDER_DETAILS_MODAL_TABS',
    'TNX_STATUS_HISTORY', 'CARRIER_DISPATCH_NAME', 'CARRIER_CONTACT',
    'CARRIER_DISPATCH_EMAIL', 'CARRIER_VISIBILITY',
    // carrierConstants.ts
    'CARRIER_SEARCH_FILTERS', 'SAFETY_RATING_SFD', 'INV_PROCESS_GROUP',
    'VENDOR_TYPE', 'CARRIER_MODE', 'BROKER_AUTHORITY',
    // datConstants.ts
    'DAT_POST_METHOD', 'DAT_CONTACT_PREF',
    // ediConstants.ts
    'INVOICE_TYPES', 'INVOICE_PREFIX', 'INVOICE_EVENTS', 'EDI_TEST_DATA',
    // salesLeadConstants.ts
    'salesLeadFilters', 'paymentTermsOptions', 'salesLeadStatuses', 'OPERATING_OFFICE',
    // bulkChangeConstants.ts
    'REFERENCE_TYPE', 'CARRIER_CONFIRMATION_TYPE', 'BOL_HEADER_STYLE', 'SELECT_CHANGES_TYPE',
    // nonOperationalLoadsConstant.ts
    'LOAD_ACTIVITIES', 'SELECT_QUEUE_ACTION', 'INVOICE_OPTIONS', 'LOAD_CHARGES',
    'INVOICE_CHARGES_DROPDOWN', 'CHARGE_AMOUNTS', 'SETTLEMENT_REASONS',
    'APPROVAL_FOR', 'REVIEWED_BY',
  ];

  // Application source repositories for locator extraction
  public readonly appSourceRepos = [
    {
      repoUrl: 'https://github.com/modetrans/mono.git',
      branch: 'master',
      name: 'mono',
      subPath: 'btms/php/src',
      fileTypes: ['*.php'],
      app: 'btms',
    },
    {
      repoUrl: 'https://github.com/modetrans/dme.git',
      branch: 'main',
      name: 'dme',
      subPath: 'templates',
      fileTypes: ['*.twig', '*.html.twig'],
      app: 'dme',
    },
  ];

  // App source cache settings
  public readonly appSourceCacheDir: string = path.join(
    path.resolve(__dirname, '../../..'),
    'src/agent/.cache',
  );
  public readonly appSourceCacheMaxAgeMs: number = 24 * 60 * 60 * 1000;

  // Page directories excluded from scanning and code generation
  public readonly excludedPageDirs = [
    'bulkChange',
    'carrierPortal',
    'customerPortal',
    'legacyCustomerPortal',
    'salesLead',
    'tritan',
  ];

  constructor(options: AgentConfigOptions = {}) {
    this.projectRoot = path.resolve(__dirname, '../../..');
    this.modelName = options.modelName || 'claude-sonnet-4-6';
    this.temperature = options.temperature ?? 0.3;
    this.llmEnabled = options.llmEnabled ?? false;
    this.llmMaxRetries = options.llmMaxRetries ?? 1;
    this.llmCacheEnabled = options.llmCacheEnabled ?? true;
    
    this.outputDir = options.outputDir || path.join(this.projectRoot, 'src/tests/generated');
    this.dataDir = options.dataDir || path.join(this.projectRoot, 'src/data');
    this.pagesDir = options.pagesDir || path.join(this.projectRoot, 'src/pages');
    this.utilsDir = options.utilsDir || path.join(this.projectRoot, 'src/utils');
    this.testsDir = options.testsDir || path.join(this.projectRoot, 'src/tests');
  }

  /**
   * Get import paths for common dependencies
   */
  getImportPaths() {
    return {
      playwright: '@playwright/test',
      pageManager: '@utils/PageManager',
      userSetup: '@loginHelpers/userSetup',
      dataConfig: '@config/dataConfig',
      multiAppManager: '@utils/dfbUtils/MultiAppManager',
      globalConstants: '@utils/globalConstants',
      dfbGlobalConstants: '@utils/dfbUtils/dfbGlobalConstants',
      commonReusables: '@utils/commonReusables'
    };
  }
}

export default new AgentConfig();
