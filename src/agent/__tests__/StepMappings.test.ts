import { test, expect } from '@playwright/test';
import { matchStepMapping } from '../config/StepMappings';

test.describe('StepMappings', () => {
  test.describe('LOGIN category', () => {
    test('"Login to BTMS" should match a LOGIN category mapping', () => {
      const result = matchStepMapping('Login to BTMS');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('LOGIN');
      expect(result!.pageObject).toBe('btmsLoginPage');
    });

    test('"Login to TNX" should match TNX login', () => {
      const result = matchStepMapping('Login to TNX');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('LOGIN');
      expect(result!.pageObject).toBe('tnxLoginPage');
    });

    test('"Login to DME" should match DME login', () => {
      const result = matchStepMapping('Login to DME');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('LOGIN');
      expect(result!.pageObject).toBe('dmeLoginPage');
    });
  });

  test.describe('HOVER category', () => {
    test('"Hover to Loads" should match a HOVER category mapping', () => {
      const result = matchStepMapping('Hover to Loads');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('HOVER');
      expect(result!.method).toBe('hoverOverHeaderByText');
    });

    test('"Hover over Admin" should match HOVER category', () => {
      const result = matchStepMapping('Hover over Admin');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('HOVER');
    });

    test('"Hover on Customer" should match HOVER category', () => {
      const result = matchStepMapping('Hover on Customer');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('HOVER');
    });
  });

  test.describe('CLICK and SAVE category', () => {
    test('"Click on Save button" should match CLICK or SAVE mapping', () => {
      const result = matchStepMapping('Click on Save button');

      expect(result).not.toBeNull();
      // Either CLICK or SAVE is acceptable since "save button" can match both
      expect(['CLICK', 'SAVE']).toContain(result!.category);
    });

    test('"Click on Search" should match CLICK', () => {
      const result = matchStepMapping('Click on Search');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('CLICK');
    });

    test('"Click on Create Load button" should match CLICK', () => {
      const result = matchStepMapping('Click on Create Load button');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('CLICK');
    });
  });

  test.describe('CARRIER_TAB category', () => {
    test('"Enter carrier rate as 500" should match CARRIER_TAB', () => {
      const result = matchStepMapping('Enter carrier rate as 500');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('CARRIER_TAB');
      expect(result!.method).toBe('enterCarrierRate');
    });

    test('"Enter customer rate as 300" should match CARRIER_TAB', () => {
      const result = matchStepMapping('Enter customer rate as 300');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('CARRIER_TAB');
      expect(result!.method).toBe('enterCustomerRate');
    });

    test('"Enter total miles as 100" should match CARRIER_TAB', () => {
      const result = matchStepMapping('Enter total miles as 100');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('CARRIER_TAB');
      expect(result!.method).toBe('enterMiles');
    });

    test('"Choose carrier" should match CARRIER_TAB', () => {
      const result = matchStepMapping('Choose carrier');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('CARRIER_TAB');
      expect(result!.method).toBe('clickOnChooseCarrier');
    });
  });

  test.describe('Best-match scoring (specificity)', () => {
    test('"Click on View Billing button" should match BILLING over generic CLICK', () => {
      const result = matchStepMapping('Click on View Billing button');

      expect(result).not.toBeNull();
      // "view billing" matches the BILLING category mapping which is more specific
      // The view billing mapping has pattern /view\s*billing/i
      expect(result!.category).toBe('BILLING');
    });

    test('"Enter carrier rate" should match CARRIER_TAB over generic fill', () => {
      const result = matchStepMapping('Enter carrier rate as 1000');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('CARRIER_TAB');
    });

    test('"Save and close" should match SAVE with save.*close pattern', () => {
      const result = matchStepMapping('Save and close the form');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('SAVE');
      expect(result!.method).toBe('clickSaveAndClose');
    });

    test('"Upload carrier invoice" should match BILLING upload pattern', () => {
      const result = matchStepMapping('Upload carrier invoice document');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('BILLING');
    });
  });

  test.describe('NAVIGATION category', () => {
    test('"Navigate to carrier search" should match NAVIGATION', () => {
      const result = matchStepMapping('Navigate to carrier search');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('NAVIGATION');
    });

    test('"Go to office config" should match NAVIGATION', () => {
      const result = matchStepMapping('Go to office config');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('NAVIGATION');
    });

    test('"Navigate to loads" should match NAVIGATION', () => {
      const result = matchStepMapping('Navigate to loads');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('NAVIGATION');
    });
  });

  test.describe('MULTI_APP category', () => {
    test('"Switch to DME" should match MULTI_APP', () => {
      const result = matchStepMapping('Switch to DME');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('MULTI_APP');
      expect(result!.method).toBe('switchToDME');
    });

    test('"Switch to TNX" should match MULTI_APP', () => {
      const result = matchStepMapping('Switch to TNX');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('MULTI_APP');
      expect(result!.method).toBe('switchToTNX');
    });

    test('"Switch back to BTMS" should match MULTI_APP', () => {
      const result = matchStepMapping('Switch back to BTMS');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('MULTI_APP');
      expect(result!.method).toBe('switchToBTMS');
    });
  });

  test.describe('No match cases', () => {
    test('random gibberish should return null', () => {
      const result = matchStepMapping('xyzzy plugh 12345 foobar');

      expect(result).toBeNull();
    });

    test('empty string should return null', () => {
      const result = matchStepMapping('');

      expect(result).toBeNull();
    });
  });

  test.describe('Mapping result properties', () => {
    test('matched mapping should include code and confidence', () => {
      const result = matchStepMapping('Login to BTMS');

      expect(result).not.toBeNull();
      expect(result!.code).toBeTruthy();
      expect(result!.confidence).toBeGreaterThan(0);
      expect(result!.confidence).toBeLessThanOrEqual(1);
    });

    test('matched mapping should include pageObject and method', () => {
      const result = matchStepMapping('Hover to Admin');

      expect(result).not.toBeNull();
      expect(result!.pageObject).toBeTruthy();
      expect(result!.method).toBeTruthy();
    });

    test('matched mapping with captures should populate args', () => {
      const result = matchStepMapping('Click on the Billing tab');

      expect(result).not.toBeNull();
      // The pattern /click\s+(?:on\s+)?(?:the\s+)?(.+?)\s+tab/i captures "Billing"
      expect(result!.args).toBeDefined();
      if (result!.args) {
        expect(result!.args.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('WAIT and REFRESH categories', () => {
    test('"Wait for page" should match WAIT', () => {
      const result = matchStepMapping('Wait for page to load');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('WAIT');
    });

    test('"Refresh status" should match REFRESH', () => {
      const result = matchStepMapping('Refresh and check status');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('REFRESH');
    });
  });

  test.describe('ALERT_MESSAGE category', () => {
    test('"Accept the alert" should match ALERT_MESSAGE', () => {
      const result = matchStepMapping('Accept the alert and click OK');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('ALERT_MESSAGE');
    });

    test('"Validate alert message" should match ALERT_MESSAGE', () => {
      const result = matchStepMapping('Validate the alert message');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('ALERT_MESSAGE');
    });
  });

  test.describe('SWITCH_USER category', () => {
    test('"Switch user" should match SWITCH_USER', () => {
      const result = matchStepMapping('Switch user to admin');

      expect(result).not.toBeNull();
      expect(result!.category).toBe('SWITCH_USER');
    });
  });
});
