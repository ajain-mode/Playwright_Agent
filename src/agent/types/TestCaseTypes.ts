/**
 * Type definitions for Test Cases and Generated Scripts
 * 
 * @author AI Agent Generator
 * @created 2026-02-05
 */

/**
 * Explicit values extracted from test case preconditions and steps.
 * These are hard-coded values from the CSV that the generated code should use
 * instead of generic testData.* references.
 */
export interface ExplicitValues {
  /** Values extracted from Precondition column */
  precondition: {
    loginUser?: string;
    officeCode?: string;
    switchToUser?: string;
    customerName?: string;
    matchVendors?: string;
    enableDME?: string;
    [key: string]: string | undefined;
  };
  /** Values extracted from Test Steps column */
  formFields: {
    customerName?: string;
    pickLocation?: string;
    dropLocation?: string;
    loadType?: string;
    equipmentType?: string;
    offerRate?: string;
    shipperZip?: string;
    consigneeZip?: string;
    emailNotification?: string;
    commodity?: string;
    [key: string]: string | undefined;
  };
  /** Raw precondition steps (each step as a string with its step number) */
  preconditionSteps: string[];
  /** Raw test steps (each step as a string with its step number) */
  testStepsRaw: string[];
  /** The expected result text */
  expectedResultText: string;
}

/**
 * Test case input structure
 */
export interface TestCaseInput {
  id: string;
  title: string;
  description: string;
  category: TestCategory;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  tags?: string[];
  preconditions?: string[];
  steps: TestStep[];
  expectedResults: string[];
  testData?: Record<string, any>;
  /** Explicit values extracted from structured CSV columns */
  explicitValues?: ExplicitValues;
}

/**
 * Individual test step
 */
export interface TestStep {
  stepNumber: number;
  action: string;
  expectedResult?: string;
  data?: Record<string, any>;
  /** Maps this step to CSV expected-result step numbers for inline validation */
  csvStepMapping?: number[];
}

/**
 * Available test categories
 */
export type TestCategory = 
  | 'dfb' 
  | 'edi' 
  | 'commission' 
  | 'salesLead' 
  | 'banyan' 
  | 'carrier' 
  | 'bulkChange' 
  | 'dat' 
  | 'nonOperationalLoads' 
  | 'api'
  | 'custom';

/**
 * Test type for script generation
 */
export type TestType = 
  | 'non-tabular-load'
  | 'tabular-load'
  | 'duplicate-load'
  | 'edi-load'
  | 'template-load'
  | 'post-automation'
  | 'carrier-validation'
  | 'customer-validation'
  | 'multi-app'
  | 'api-test'
  | 'generic';

/**
 * Generated test script structure
 */
export interface GeneratedScript {
  testCaseId: string;
  fileName: string;
  filePath: string;
  content: string;
  imports: string[];
  pageObjectsUsed: string[];
  constantsUsed: string[];
  testSteps: GeneratedTestStep[];
  metadata: ScriptMetadata;
}

/**
 * Generated test step
 */
export interface GeneratedTestStep {
  stepName: string;
  code: string;
  pageObjects: string[];
  assertions: string[];
  /** When true, the step code is wrapped in try/catch (optional verifications) */
  isOptional?: boolean;
  /** CSV expected-result step numbers this step validates */
  csvExpectedSteps?: number[];
}

/**
 * Script metadata
 */
export interface ScriptMetadata {
  author: string;
  createdDate: string;
  testCategory: TestCategory;
  testType: TestType;
  retryCount: number;
  timeout: number;
  tags: string[];
}

/**
 * Page object mapping
 */
export interface PageObjectMapping {
  name: string;
  path: string;
  methods: string[];
  locators: string[];
}

/**
 * Action patterns for code generation
 */
export interface ActionPattern {
  pattern: RegExp;
  action: string;
  pageObject: string;
  method: string;
  parameters?: string[];
}

/**
 * Test data structure
 */
export interface TestData {
  testCaseId: string;
  officeName?: string;
  customerName?: string;
  shipperName?: string;
  consigneeName?: string;
  salesAgent?: string;
  equipmentType?: string;
  shipperZip?: string;
  consigneeZip?: string;
  offerRate?: string;
  rateType?: string;
  loadMethod?: string;
  [key: string]: any;
}

/**
 * Agent response
 */
export interface AgentResponse {
  success: boolean;
  scripts: GeneratedScript[];
  errors?: string[];
  warnings?: string[];
  summary: {
    totalTestCases: number;
    successfullyGenerated: number;
    failed: number;
    executionTime: number;
  };
}
