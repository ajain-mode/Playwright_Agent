/**
 * Agent Configuration
 * Contains configuration settings for the Playwright Agent
 * 
 * @author AI Agent Generator
 * @created 2026-02-05
 */

import path from 'path';

export interface AgentConfigOptions {
  openaiApiKey?: string;
  modelName?: string;
  temperature?: number;
  outputDir?: string;
  dataDir?: string;
  pagesDir?: string;
  utilsDir?: string;
  testsDir?: string;
}

export class AgentConfig {
  // API Configuration
  public openaiApiKey: string;
  public modelName: string;
  public temperature: number;

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
    'carrier', 'bulkChange', 'dat', 'nonOperationalLoads', 'api'
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

  // Global constants available
  public readonly globalConstants = [
    'HEADERS', 'ADMIN_SUB_MENU', 'CUSTOMER_SUB_MENU', 'LOAD_TYPES', 'TABS',
    'CARGO_VALUES', 'COUNTRY', 'LOAD_STATUS', 'TNX', 'DFB_Button', 'WAIT',
    'EDI_CODE', 'EDI_STATUS', 'CARRIER_STATUS', 'CARRIER_NAME'
  ];

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
    this.openaiApiKey = options.openaiApiKey || process.env.OPENAI_API_KEY || '';
    this.modelName = options.modelName || 'gpt-4-turbo-preview';
    this.temperature = options.temperature || 0.3;
    
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
