/**
 * Schema Analyzer
 * Analyzes the project structure to understand available page objects,
 * methods, constants, and patterns for code generation.
 * 
 * Enhanced with dynamic PageObjectScanner for live page file analysis.
 * 
 * @author AI Agent Generator
 * @created 2026-02-05
 * @modified 2026-02-12 - Added dynamic page object scanning
 */

import path from 'path';
import { PageObjectMapping, ActionPattern } from '../types/TestCaseTypes';
import { PageObjectScanner, PageObjectScanResult } from './PageObjectScanner';
import { PageObjectWriter, NewMethodDef, NewLocatorDef, WriteResult } from './PageObjectWriter';

export class SchemaAnalyzer {
  private pageObjectCache: Map<string, PageObjectMapping> = new Map();
  private actionPatterns: ActionPattern[] = [];
  private scanner: PageObjectScanner;
  private writer: PageObjectWriter;
  private dynamicScanDone = false;

  constructor(pagesDir?: string, excludedDirs?: string[]) {
    const resolvedPagesDir = pagesDir || path.resolve(__dirname, '../../../pages');
    this.scanner = new PageObjectScanner(resolvedPagesDir, excludedDirs);
    this.writer = new PageObjectWriter(this.scanner);
    this.initializeActionPatterns();
  }

  // ======================== PUBLIC API ========================

  /**
   * Get the PageObjectScanner instance
   */
  getScanner(): PageObjectScanner {
    return this.scanner;
  }

  /**
   * Get the PageObjectWriter instance
   */
  getWriter(): PageObjectWriter {
    return this.writer;
  }

  /**
   * Perform a full dynamic scan of all page object files (call once during init)
   */
  performDynamicScan(): Map<string, PageObjectScanResult> {
    console.log('🔍 Scanning page object files...');
    const results = this.scanner.scanAll();
    this.dynamicScanDone = true;
    console.log(`   Found ${results.size} page object classes`);
    
    // Merge scanned methods into the static pageObjectCache
    for (const [className, scanResult] of results) {
      const existing = this.pageObjectCache.get(className);
      if (existing) {
        // Merge dynamically discovered methods into existing mapping
        const discoveredMethods = scanResult.methods
          .filter(m => !m.isPrivate)
          .map(m => m.name);
        const allMethods = new Set([...existing.methods, ...discoveredMethods]);
        existing.methods = Array.from(allMethods);
      } else {
        // Create a new PageObjectMapping from scan
        this.pageObjectCache.set(className, {
          name: className,
          path: scanResult.filePath,
          methods: scanResult.methods.filter(m => !m.isPrivate).map(m => m.name),
          locators: scanResult.locators.map(l => l.name),
        });
      }
    }

    return results;
  }

  /**
   * Check if a method exists on any page object (uses dynamic scan)
   */
  methodExistsAnywhere(methodName: string): { exists: boolean; className?: string } {
    this.ensureDynamicScan();
    const owner = this.scanner.findMethodOwner(methodName);
    if (owner) {
      return { exists: true, className: owner.className };
    }
    return { exists: false };
  }

  /**
   * Check if a method exists on a specific page object class
   */
  methodExistsOnClass(className: string, methodName: string): boolean {
    this.ensureDynamicScan();
    return this.scanner.methodExists(className, methodName);
  }

  /**
   * Add a new reusable method to a page object class file
   */
  addMethodToPageObject(className: string, method: NewMethodDef): WriteResult {
    this.ensureDynamicScan();
    return this.writer.addMethods(className, [method]);
  }

  /**
   * Add a new locator to a page object class file
   */
  addLocatorToPageObject(className: string, locator: NewLocatorDef): WriteResult {
    this.ensureDynamicScan();
    return this.writer.addLocators(className, [locator]);
  }

  /**
   * Add multiple locators and methods to a page object class
   */
  addToPageObject(className: string, locators: NewLocatorDef[], methods: NewMethodDef[]): WriteResult {
    this.ensureDynamicScan();
    return this.writer.addToPageObject(className, locators, methods);
  }

  /**
   * Get all public method names for a given class
   */
  getClassMethods(className: string): string[] {
    this.ensureDynamicScan();
    return this.scanner.getPublicMethods(className).map(m => m.name);
  }

  /**
   * Get a summary of all page objects with their public methods
   */
  getPageObjectSummary(): Map<string, string[]> {
    this.ensureDynamicScan();
    return this.scanner.getSummary();
  }

  /**
   * Initialize action patterns for code generation
   */
  private initializeActionPatterns() {
    this.actionPatterns = [
      // Login patterns
      { pattern: /login\s*(?:to\s*)?(btms|system)/i, action: 'login', pageObject: 'btmsLoginPage', method: 'BTMSLogin' },
      { pattern: /login\s*(?:to\s*)?tnx/i, action: 'login', pageObject: 'tnxLoginPage', method: 'TNXLogin' },
      { pattern: /login\s*(?:to\s*)?dme/i, action: 'login', pageObject: 'dmeLoginPage', method: 'DMELogin' },
      
      // Navigation patterns
      { pattern: /navigate\s*(?:to\s*)?(?:the\s*)?admin/i, action: 'navigate', pageObject: 'basePage', method: 'hoverOverHeaderByText', parameters: ['HEADERS.ADMIN'] },
      { pattern: /navigate\s*(?:to\s*)?(?:the\s*)?customer/i, action: 'navigate', pageObject: 'basePage', method: 'hoverOverHeaderByText', parameters: ['HEADERS.CUSTOMER'] },
      { pattern: /navigate\s*(?:to\s*)?(?:the\s*)?load/i, action: 'navigate', pageObject: 'basePage', method: 'hoverOverHeaderByText', parameters: ['HEADERS.LOAD'] },
      { pattern: /navigate\s*(?:to\s*)?(?:the\s*)?home/i, action: 'navigate', pageObject: 'basePage', method: 'hoverOverHeaderByText', parameters: ['HEADERS.HOME'] },
      { pattern: /click\s*(?:on\s*)?home\s*button/i, action: 'click', pageObject: 'basePage', method: 'clickHomeButton' },
      
      // Customer patterns
      { pattern: /search\s*(?:for\s*)?customer/i, action: 'search', pageObject: 'searchCustomerPage', method: 'searchCustomerAndClickDetails' },
      { pattern: /enter\s*customer\s*name/i, action: 'enter', pageObject: 'searchCustomerPage', method: 'enterCustomerName' },
      { pattern: /click\s*(?:on\s*)?search\s*customer/i, action: 'click', pageObject: 'searchCustomerPage', method: 'clickOnSearchCustomer' },
      
      // Load creation patterns
      { pattern: /create\s*(?:a\s*)?(?:new\s*)?(?:non-?tabular\s*)?load/i, action: 'create', pageObject: 'nonTabularLoadPage', method: 'createNonTabularLoad' },
      { pattern: /click\s*(?:on\s*)?create\s*load\s*button/i, action: 'click', pageObject: 'nonTabularLoadPage', method: 'clickCreateLoadButton' },
      { pattern: /navigate\s*(?:to\s*)?new\s*load/i, action: 'navigate', pageObject: 'viewCustomerPage', method: 'navigateToLoad', parameters: ['LOAD_TYPES.NEW_LOAD_TL'] },
      
      // Edit load patterns
      { pattern: /click\s*(?:on\s*)?(?:the\s*)?(?:load|pick|drop|carrier|customer)\s*tab/i, action: 'click', pageObject: 'editLoadPage', method: 'clickOnTab' },
      { pattern: /validate\s*(?:the\s*)?edit\s*load/i, action: 'validate', pageObject: 'editLoadPage', method: 'validateEditLoadHeadingText' },
      { pattern: /click\s*(?:on\s*)?save/i, action: 'click', pageObject: 'editLoadFormPage', method: 'clickOnSaveBtn' },
      
      // DFB patterns
      { pattern: /enter\s*offer\s*rate/i, action: 'enter', pageObject: 'dfbLoadFormPage', method: 'enterOfferRate' },
      { pattern: /select\s*(?:the\s*)?include\s*carrier/i, action: 'select', pageObject: 'dfbLoadFormPage', method: 'selectCarriersInIncludeCarriers' },
      { pattern: /click\s*(?:on\s*)?post\s*button/i, action: 'click', pageObject: 'dfbLoadFormPage', method: 'clickOnPostButton' },
      { pattern: /validate\s*(?:the\s*)?post\s*status/i, action: 'validate', pageObject: 'dfbLoadFormPage', method: 'validatePostStatus' },
      { pattern: /get\s*load\s*number/i, action: 'get', pageObject: 'dfbLoadFormPage', method: 'getLoadNumber' },
      { pattern: /select\s*cargo\s*value/i, action: 'select', pageObject: 'editLoadCarrierTabPage', method: 'selectCargoValue' },
      
      // View load patterns
      { pattern: /validate\s*(?:the\s*)?view\s*load/i, action: 'validate', pageObject: 'viewLoadPage', method: 'validateViewLoadHeading' },
      
      // Office patterns
      { pattern: /configure\s*office/i, action: 'configure', pageObject: 'officePage', method: 'configureOfficePreConditions' },
      { pattern: /ensure\s*toggle/i, action: 'ensure', pageObject: 'officePage', method: 'ensureToggleValues' },
      
      // Admin patterns
      { pattern: /switch\s*user/i, action: 'switch', pageObject: 'adminPage', method: 'switchUser' },
      
      // TNX patterns
      { pattern: /select\s*organization/i, action: 'select', pageObject: 'tnxLandingPage', method: 'selectOrganizationByText' },
      { pattern: /search\s*load\s*(?:in\s*)?tnx/i, action: 'search', pageObject: 'tnxLandingPage', method: 'searchLoadValue' },
      { pattern: /validate\s*available\s*load/i, action: 'validate', pageObject: 'tnxLandingPage', method: 'validateAvailableLoadsText' },
      
      // DME patterns
      { pattern: /click\s*(?:on\s*)?loads\s*link/i, action: 'click', pageObject: 'dmeDashboardPage', method: 'clickOnLoadsLink' },
      { pattern: /search\s*load\s*(?:in\s*)?dme/i, action: 'search', pageObject: 'dmeDashboardPage', method: 'searchLoad' },
      
      // Assertion patterns
      { pattern: /expect|assert|verify\s*(?:that\s*)?/i, action: 'assert', pageObject: 'expect', method: '' },
    ];
  }

  /**
   * Analyze the project schema and return available resources
   */
  async analyzeSchema(): Promise<{
    pageObjects: PageObjectMapping[];
    constants: string[];
    utilities: string[];
    testPatterns: string[];
  }> {
    const pageObjects = await this.scanPageObjects();
    const constants = this.getAvailableConstants();
    const utilities = await this.scanUtilities();
    const testPatterns = await this.analyzeTestPatterns();

    return {
      pageObjects,
      constants,
      utilities,
      testPatterns
    };
  }

  /**
   * Scan page objects directory - combines static definitions with dynamic scan
   */
  async scanPageObjects(): Promise<PageObjectMapping[]> {
    // Perform dynamic scan to discover actual methods
    this.ensureDynamicScan();

    // Return all cached mappings (static + dynamic)
    return Array.from(this.pageObjectCache.values());
  }

  /**
   * Get available constants
   */
  getAvailableConstants(): string[] {
    return [
      'HEADERS', 'ADMIN_SUB_MENU', 'CUSTOMER_SUB_MENU', 'LOAD_SUB_MENU',
      'LOAD_TYPES', 'TABS', 'CARGO_VALUES', 'COUNTRY', 'LOAD_STATUS',
      'TNX', 'DFB_Button', 'WAIT', 'EDI_CODE', 'EDI_STATUS',
      'CARRIER_STATUS', 'CARRIER_NAME', 'DFB_FORM_FIELDS',
      'DFBLOAD_FORM', 'CONFIDENCE_LEVEL', 'COMMISSION_AUDIT_STATUS',
      'LOAD_OFFER_RATES', 'CARRIER_NAME'
    ];
  }

  /**
   * Scan utilities directory
   */
  async scanUtilities(): Promise<string[]> {
    return [
      'PageManager',
      'MultiAppManager',
      'dfbHelpers',
      'commonReusables',
      'toggleSettings',
      'dataConfig',
      'userSetup',
      'requiredFieldAlertValidator',
      'commissionHelper',
      'bulkChangeHelper'
    ];
  }

  /**
   * Analyze existing test patterns
   */
  async analyzeTestPatterns(): Promise<string[]> {
    return [
      'test.describe.serial - For sequential tests',
      'test.beforeAll - Setup shared context',
      'test.afterAll - Cleanup resources',
      'test.step - Group related actions',
      'test.setTimeout - Set custom timeouts',
      'MultiAppManager - For multi-application tests',
      'PageManager - Centralized page object access',
      'expect.soft - Continue on assertion failure',
      'test.use - Configure test options'
    ];
  }

  /**
   * Get action pattern for a given action text
   */
  getActionPattern(actionText: string): ActionPattern | undefined {
    return this.actionPatterns.find(pattern => pattern.pattern.test(actionText));
  }

  /**
   * Get page object mapping by name
   */
  getPageObjectMapping(name: string): PageObjectMapping | undefined {
    return this.pageObjectCache.get(name);
  }

  /**
   * Suggest page objects for an action
   */
  suggestPageObjects(action: string): string[] {
    const suggestions: string[] = [];
    const lowerAction = action.toLowerCase();

    // Check action patterns
    for (const pattern of this.actionPatterns) {
      if (pattern.pattern.test(lowerAction)) {
        suggestions.push(pattern.pageObject);
      }
    }

    // Add suggestions based on keywords
    if (lowerAction.includes('login')) suggestions.push('btmsLoginPage');
    if (lowerAction.includes('customer')) suggestions.push('searchCustomerPage', 'viewCustomerPage');
    if (lowerAction.includes('load')) suggestions.push('editLoadPage', 'viewLoadPage', 'nonTabularLoadPage');
    if (lowerAction.includes('carrier')) suggestions.push('editLoadCarrierTabPage', 'dfbLoadFormPage');
    if (lowerAction.includes('tnx')) suggestions.push('tnxLandingPage');
    if (lowerAction.includes('dme')) suggestions.push('dmeDashboardPage', 'dmeLoadPage');
    if (lowerAction.includes('office')) suggestions.push('officePage');
    if (lowerAction.includes('admin')) suggestions.push('adminPage');
    if (lowerAction.includes('post') && lowerAction.includes('automation')) suggestions.push('postAutomationRulePage');

    return [...new Set(suggestions)];
  }

  /**
   * Get all action patterns
   */
  getAllActionPatterns(): ActionPattern[] {
    return this.actionPatterns;
  }

  // ======================== PRIVATE ========================

  private ensureDynamicScan(): void {
    if (!this.dynamicScanDone) {
      this.performDynamicScan();
    }
  }
}

export default new SchemaAnalyzer();
