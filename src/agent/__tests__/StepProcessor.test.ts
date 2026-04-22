import { test, expect } from '@playwright/test';
import { StepProcessor, PageContext } from '../analyzers/StepProcessor';

test.describe('StepProcessor', () => {
  const processor = new StepProcessor();

  test.describe('Action classification', () => {
    const cases: Array<{ input: string; expected: string }> = [
      { input: 'Login to BTMS', expected: 'login' },
      { input: 'Enter value as 500', expected: 'fill' },
      { input: 'Select equipment type', expected: 'select' },
      { input: 'Click Save button', expected: 'click' },
      { input: 'Verify load status', expected: 'verify' },
      { input: 'Navigate to Loads', expected: 'navigate' },
      { input: 'Upload POD document', expected: 'upload' },
      { input: 'Hover to Admin', expected: 'hover' },
      { input: 'Switch to TNX', expected: 'switch-app' },
      { input: 'Accept the OK alert', expected: 'alert' },
      { input: 'Wait for page to load', expected: 'wait' },
      { input: 'Click on Save button', expected: 'save' },
      { input: 'Click on Carrier tab', expected: 'tab-click' },
    ];

    for (const { input, expected } of cases) {
      test(`"${input}" should classify as "${expected}"`, () => {
        const defaultCtx: PageContext = {
          currentApp: 'btms',
          currentPage: 'home',
          currentTab: 'GENERAL',
          isEditMode: false,
          currentForm: '',
        };
        const result = processor.processStep(1, input, defaultCtx);
        expect(result.actionType).toBe(expected);
      });
    }

    test('empty string should classify as unknown', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'home',
        currentTab: 'GENERAL',
        isEditMode: false,
        currentForm: '',
      };
      const result = processor.processStep(1, '', ctx);
      expect(result.actionType).toBe('unknown');
    });

    test('SSO login should classify as login', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'home',
        currentTab: 'GENERAL',
        isEditMode: false,
        currentForm: '',
      };
      const result = processor.processStep(1, 'SSO Login to application', ctx);
      expect(result.actionType).toBe('login');
    });
  });

  test.describe('Context snapshots via processAllSteps', () => {
    test('should set contextBefore and contextAfter on each step', () => {
      const steps = [
        { stepNumber: 1, action: 'Login to BTMS' },
        { stepNumber: 2, action: 'Navigate to Loads' },
      ];
      const { processedSteps } = processor.processAllSteps(steps);

      expect(processedSteps).toHaveLength(2);
      for (const step of processedSteps) {
        expect(step.contextBefore).toBeDefined();
        expect(step.contextAfter).toBeDefined();
      }
    });

    test('contextBefore should be frozen (immutable)', () => {
      const steps = [{ stepNumber: 1, action: 'Login to BTMS' }];
      const { processedSteps } = processor.processAllSteps(steps);

      expect(Object.isFrozen(processedSteps[0].contextBefore)).toBe(true);
      expect(Object.isFrozen(processedSteps[0].contextAfter)).toBe(true);
    });

    test('consecutive steps should chain context correctly', () => {
      const steps = [
        { stepNumber: 1, action: 'Login to BTMS' },
        { stepNumber: 2, action: 'Navigate to Loads' },
        { stepNumber: 3, action: 'Click on Carrier tab' },
      ];
      const { processedSteps } = processor.processAllSteps(steps);

      // After login, currentPage should be 'home'
      expect(processedSteps[0].contextAfter!.currentPage).toBe('home');

      // Step 2 contextBefore should match step 1 contextAfter
      expect(processedSteps[1].contextBefore!.currentPage).toBe(
        processedSteps[0].contextAfter!.currentPage,
      );

      // After navigating to loads, currentPage should be 'loadform'
      expect(processedSteps[1].contextAfter!.currentPage).toBe('loadform');

      // Step 3 contextBefore should match step 2 contextAfter
      expect(processedSteps[2].contextBefore!.currentPage).toBe('loadform');

      // After clicking carrier tab, currentTab should be CARRIER
      expect(processedSteps[2].contextAfter!.currentTab).toBe('CARRIER');
    });

    test('switch-app step should change currentApp in context', () => {
      const steps = [
        { stepNumber: 1, action: 'Login to BTMS' },
        { stepNumber: 2, action: 'Switch to TNX' },
      ];
      const { processedSteps } = processor.processAllSteps(steps);

      expect(processedSteps[1].contextBefore!.currentApp).toBe('btms');
      expect(processedSteps[1].contextAfter!.currentApp).toBe('tnx');
    });

    test('save step should set isEditMode to false in context', () => {
      const steps = [
        { stepNumber: 1, action: 'Click Edit button' },
        { stepNumber: 2, action: 'Save the form' },
      ];
      const { processedSteps } = processor.processAllSteps(steps);

      // After clicking edit, isEditMode should be true
      expect(processedSteps[0].contextAfter!.isEditMode).toBe(true);

      // After save, isEditMode should be false
      expect(processedSteps[1].contextAfter!.isEditMode).toBe(false);
    });
  });

  test.describe('Field inference', () => {
    test('"Enter customer rate as 500" should infer targetField and testDataKey', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'loadform',
        currentTab: 'CARRIER',
        isEditMode: true,
        currentForm: '',
      };
      const result = processor.processStep(1, 'Enter customer rate as 500', ctx);

      expect(result.actionType).toBe('fill');
      expect(result.targetField).toBe('customer_rate');
      expect(result.targetValue).toBe('500');
    });

    test('"Enter carrier rate as 600" should infer carrier_rate field', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'loadform',
        currentTab: 'CARRIER',
        isEditMode: true,
        currentForm: '',
      };
      const result = processor.processStep(1, 'Enter carrier rate as 600', ctx);

      expect(result.actionType).toBe('fill');
      expect(result.targetField).toBe('carrier_rate');
    });

    test('"Select equipment type" should infer equipment_type field', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'loadform',
        currentTab: 'GENERAL',
        isEditMode: true,
        currentForm: '',
      };
      const result = processor.processStep(1, 'Select equipment type as VAN', ctx);

      expect(result.actionType).toBe('select');
      expect(result.targetField).toBe('equipment_type');
    });

    test('value source should be testData when key matches testData', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'loadform',
        currentTab: 'CARRIER',
        isEditMode: true,
        currentForm: '',
      };
      const testData = { customerRate: '500' };
      const result = processor.processStep(1, 'Enter customer rate as 500', ctx, testData);

      expect(result.valueSource).toBe('testData');
      expect(result.testDataKey).toBe('customerRate');
    });

    test('value source should be hardcoded when no testData match', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'loadform',
        currentTab: 'CARRIER',
        isEditMode: true,
        currentForm: '',
      };
      const result = processor.processStep(1, 'Enter customer rate as 999', ctx, {});

      expect(result.valueSource).toBe('hardcoded');
    });
  });

  test.describe('Step properties', () => {
    test('hover step should extract headerText', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'home',
        currentTab: 'GENERAL',
        isEditMode: false,
        currentForm: '',
      };
      const result = processor.processStep(1, 'Hover to Loads menu', ctx);

      expect(result.actionType).toBe('hover');
      expect(result.headerText).toBe('LOAD');
    });

    test('click step should extract buttonText', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'loadform',
        currentTab: 'GENERAL',
        isEditMode: false,
        currentForm: '',
      };
      const result = processor.processStep(1, 'Click on Create Load button', ctx);

      expect(result.actionType).toBe('click');
      expect(result.buttonText).toBe('Create Load');
    });

    test('navigate step should extract navigateTarget', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'home',
        currentTab: 'GENERAL',
        isEditMode: false,
        currentForm: '',
      };
      const result = processor.processStep(1, 'Navigate to billing', ctx);

      expect(result.actionType).toBe('navigate');
      expect(result.navigateTarget).toBe('billing');
    });

    test('upload step should extract documentType when present', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'loadform',
        currentTab: 'GENERAL',
        isEditMode: false,
        currentForm: '',
      };
      const result = processor.processStep(1, 'Upload a PDF document', ctx);

      expect(result.actionType).toBe('upload');
      expect(result.documentType).toBe('pdf');
    });

    test('tab-click step should extract targetTab', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'loadform',
        currentTab: 'GENERAL',
        isEditMode: false,
        currentForm: '',
      };
      const result = processor.processStep(1, 'Click on the Carrier tab', ctx);

      expect(result.actionType).toBe('tab-click');
      expect(result.targetTab).toBe('CARRIER');
    });

    test('negative test detection', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'loadform',
        currentTab: 'GENERAL',
        isEditMode: false,
        currentForm: '',
      };
      const result = processor.processStep(1, 'Do not select any option', ctx);

      expect(result.isNegativeTest).toBe(true);
    });

    test('expectedResult should be set from parameter', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'loadform',
        currentTab: 'GENERAL',
        isEditMode: false,
        currentForm: '',
      };
      const result = processor.processStep(
        1,
        'Verify load status',
        ctx,
        undefined,
        'Status should be BOOKED',
      );

      expect(result.expectedResult).toBeDefined();
    });

    test('app defaults to btms for standard steps', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'home',
        currentTab: 'GENERAL',
        isEditMode: false,
        currentForm: '',
      };
      const result = processor.processStep(1, 'Click Save button', ctx);

      expect(result.app).toBe('btms');
    });

    test('switch-app step should set app to target', () => {
      const ctx: PageContext = {
        currentApp: 'btms',
        currentPage: 'home',
        currentTab: 'GENERAL',
        isEditMode: false,
        currentForm: '',
      };
      const result = processor.processStep(1, 'Switch to DME', ctx);

      expect(result.app).toBe('dme');
    });
  });

  test.describe('processAllSteps with testData', () => {
    test('should resolve testDataKey from testData object', () => {
      const steps = [
        { stepNumber: 1, action: 'Enter offer rate as 750' },
      ];
      const testData = { offerRate: '750' };
      const { processedSteps } = processor.processAllSteps(steps, testData);

      expect(processedSteps[0].valueSource).toBe('testData');
      expect(processedSteps[0].testDataKey).toBe('offerRate');
    });

    test('should handle empty steps array', () => {
      const { processedSteps } = processor.processAllSteps([]);

      expect(processedSteps).toHaveLength(0);
    });

    test('rawAction should preserve original text', () => {
      const steps = [
        { stepNumber: 1, action: 'Login to BTMS application' },
      ];
      const { processedSteps } = processor.processAllSteps(steps);

      expect(processedSteps[0].rawAction).toBe('Login to BTMS application');
    });
  });
});
