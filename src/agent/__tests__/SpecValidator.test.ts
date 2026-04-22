import { test, expect } from '@playwright/test';
import { SpecValidator } from '../validators/SpecValidator';

test.describe('SpecValidator.sanitize()', () => {
  const validator = new SpecValidator();

  test.describe('SAN-001: Smart/curly quotes replacement', () => {
    test('should replace left/right double curly quotes with straight quotes', () => {
      const input = 'const msg = \u201CHello World\u201D;';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toBe('const msg = "Hello World";');
      expect(appliedRules).toContain('SAN-001');
    });

    test('should replace left/right single curly quotes with straight apostrophes', () => {
      const input = "const msg = \u2018Hello\u2019;";
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toBe("const msg = 'Hello';");
      expect(appliedRules).toContain('SAN-001');
    });

    test('should handle mixed curly quote types', () => {
      const input = '\u201CHello\u201D and \u2018World\u2019';
      const { code } = validator.sanitize(input);

      expect(code).toBe('"Hello" and \'World\'');
    });
  });

  test.describe('SAN-003: Empty ALERT_PATTERNS dot fix', () => {
    test('should fix "ALERT_PATTERNS. )" to "ALERT_PATTERNS.UNKNOWN_MESSAGE)"', () => {
      const input = 'await validateAlert(sharedPage, ALERT_PATTERNS. );';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toContain('ALERT_PATTERNS.UNKNOWN_MESSAGE)');
      expect(appliedRules).toContain('SAN-003');
    });

    test('should fix ALERT_PATTERNS followed by newline', () => {
      const input = 'ALERT_PATTERNS.\nother code';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toContain('ALERT_PATTERNS.UNKNOWN_MESSAGE');
      expect(appliedRules).toContain('SAN-003');
    });

    test('should fix ALERT_PATTERNS followed by semicolon', () => {
      const input = 'const pattern = ALERT_PATTERNS. ;';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toContain('ALERT_PATTERNS.UNKNOWN_MESSAGE;');
      expect(appliedRules).toContain('SAN-003');
    });
  });

  test.describe('SAN-005: Trailing dots in property access', () => {
    test('should fix "testData.field. )" to "testData.field)"', () => {
      const input = 'await someMethod(testData.field. );';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toContain('testData.field)');
      expect(appliedRules).toContain('SAN-005');
    });

    test('should fix trailing dot before semicolon', () => {
      const input = 'const x = obj.prop. ;';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toContain('obj.prop;');
      expect(appliedRules).toContain('SAN-005');
    });

    test('should fix trailing dot before comma', () => {
      const input = 'fn(testData.a. , testData.b);';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toContain('testData.a,');
      expect(appliedRules).toContain('SAN-005');
    });
  });

  test.describe('SAN-006: DMELogin/TNXLogin extra password argument', () => {
    test('should fix DMELogin(user, pass) to DMELogin(user)', () => {
      const input = 'await pages.dmeLoginPage.DMELogin(userSetup.dmeUser, dmePassword);';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toBe('await pages.dmeLoginPage.DMELogin(userSetup.dmeUser);');
      expect(appliedRules).toContain('SAN-006');
    });

    test('should fix TNXLogin(user, pass) to TNXLogin(user)', () => {
      const input = 'await pages.tnxLoginPage.TNXLogin(userSetup.tnxUser, tnxPassword);';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toBe('await pages.tnxLoginPage.TNXLogin(userSetup.tnxUser);');
      expect(appliedRules).toContain('SAN-006');
    });

    test('should NOT modify DMELogin with single argument', () => {
      const input = 'await pages.dmeLoginPage.DMELogin(userSetup.dmeUser);';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toBe(input);
      expect(appliedRules).not.toContain('SAN-006');
    });
  });

  test.describe('SAN-007: navigateToHeader replacement', () => {
    test('should replace navigateToHeader with hoverOverHeaderByText', () => {
      const input = 'await pages.homePage.navigateToHeader(HEADERS.LOAD);';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toBe('await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);');
      expect(appliedRules).toContain('SAN-007');
    });

    test('should replace all occurrences', () => {
      const input = [
        'await pages.homePage.navigateToHeader(HEADERS.LOAD);',
        'await pages.homePage.navigateToHeader(HEADERS.ADMIN);',
      ].join('\n');
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).not.toContain('navigateToHeader');
      expect(code).toContain('pages.basePage.hoverOverHeaderByText(HEADERS.LOAD)');
      expect(code).toContain('pages.basePage.hoverOverHeaderByText(HEADERS.ADMIN)');
      expect(appliedRules).toContain('SAN-007');
    });
  });

  test.describe('SAN-008: testData.undefined replacement', () => {
    test('should replace testData.undefined with FIXME placeholder', () => {
      const input = 'await pages.editLoadFormPage.enterValue(testData.undefined);';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toBe(
        'await pages.editLoadFormPage.enterValue(testData.FIXME_UNDEFINED_FIELD);',
      );
      expect(appliedRules).toContain('SAN-008');
    });

    test('should replace multiple occurrences', () => {
      const input = 'fn(testData.undefined, testData.undefined);';
      const { code } = validator.sanitize(input);

      expect(code).not.toContain('testData.undefined');
      expect(code).toContain('testData.FIXME_UNDEFINED_FIELD');
    });
  });

  test.describe('SAN-011: Duplicate import deduplication', () => {
    test('should remove duplicate import lines', () => {
      const input = [
        "import { test } from '@playwright/test';",
        "import { PageManager } from '@utils/PageManager';",
        "import { test } from '@playwright/test';",
        '',
        'test("example", async () => {});',
      ].join('\n');
      const { code, appliedRules } = validator.sanitize(input);

      const importLines = code
        .split('\n')
        .filter(l => l.trim().startsWith('import '));
      expect(importLines.length).toBe(2);
      expect(appliedRules).toContain('SAN-011');
    });

    test('should keep unique imports unchanged', () => {
      const input = [
        "import { test } from '@playwright/test';",
        "import { PageManager } from '@utils/PageManager';",
        '',
        'test("example", async () => {});',
      ].join('\n');
      const { code, appliedRules } = validator.sanitize(input);

      const importLines = code
        .split('\n')
        .filter(l => l.trim().startsWith('import '));
      expect(importLines.length).toBe(2);
      expect(appliedRules).not.toContain('SAN-011');
    });

    test('should handle three identical imports', () => {
      const input = [
        "import { expect } from '@playwright/test';",
        "import { expect } from '@playwright/test';",
        "import { expect } from '@playwright/test';",
      ].join('\n');
      const { code, appliedRules } = validator.sanitize(input);

      const importLines = code
        .split('\n')
        .filter(l => l.trim().startsWith('import '));
      expect(importLines.length).toBe(1);
      expect(appliedRules).toContain('SAN-011');
    });
  });

  test.describe('No changes for clean code', () => {
    test('clean code should return empty appliedRules', () => {
      const cleanCode = [
        "import { test, expect } from '@playwright/test';",
        '',
        "test.describe.serial('Test', () => {",
        '  test.beforeAll(async ({ browser }) => {});',
        '  test.afterAll(async () => {});',
        "  test('step', async () => {",
        '    await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);',
        '    expect(true).toBe(true);',
        '  });',
        '});',
      ].join('\n');
      const { code, appliedRules } = validator.sanitize(cleanCode);

      expect(appliedRules).toHaveLength(0);
      expect(code).toBe(cleanCode);
    });
  });

  test.describe('SAN-004: TABS with embedded quotes', () => {
    test('should fix TABS."CARRIER" to TABS.CARRIER', () => {
      const input = 'await pages.editLoadPage.clickOnTab(TABS.\u201CCARRIER);';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toContain('TABS.CARRIER');
      expect(appliedRules).toContain('SAN-004');
    });
  });

  test.describe('SAN-009: page.goto("/") replacement', () => {
    test('should replace goto("/") with URL-based navigation', () => {
      const input = 'await sharedPage.goto("/");';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toContain('new URL(sharedPage.url()).origin');
      expect(code).not.toContain('goto("/")');
      expect(appliedRules).toContain('SAN-009');
    });
  });

  test.describe('SAN-010: verifyMessageDisplayed replacement', () => {
    test('should replace verifyMessageDisplayed with validateAlert', () => {
      const input = 'await pages.basePage.verifyMessageDisplayed(ALERT_PATTERNS.UNKNOWN_MESSAGE);';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toContain('pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.UNKNOWN_MESSAGE)');
      expect(appliedRules).toContain('SAN-010');
    });

    test('should replace verifyAlertMessage with validateAlert', () => {
      const input = 'await pages.basePage.verifyAlertMessage(ALERT_PATTERNS.IN_VIEW_MODE);';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toContain('pages.commonReusables.validateAlert(sharedPage, ALERT_PATTERNS.IN_VIEW_MODE)');
      expect(appliedRules).toContain('SAN-010');
    });
  });

  test.describe('SAN-012: clickHomeButton replacement', () => {
    test('should replace clickHomeButton() with URL-based navigation', () => {
      const input = 'await pages.basePage.clickHomeButton();';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toContain('new URL(sharedPage.url()).origin');
      expect(code).toContain('waitForAllLoadStates');
      expect(code).not.toContain('clickHomeButton');
      expect(appliedRules).toContain('SAN-012');
    });
  });

  test.describe('SAN-013: selectCarreirContactForRateConfirmation fix', () => {
    test('should add CARRIER_CONTACT.CONTACT_1 argument when called without args', () => {
      const input = 'await pages.dfbLoadFormPage.selectCarreirContactForRateConfirmation();';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toContain(
        'selectCarreirContactForRateConfirmation(CARRIER_CONTACT.CONTACT_1)',
      );
      expect(appliedRules).toContain('SAN-013');
    });

    test('should NOT modify when argument is already provided', () => {
      const input =
        'await pages.dfbLoadFormPage.selectCarreirContactForRateConfirmation("John Doe");';
      const { code, appliedRules } = validator.sanitize(input);

      expect(code).toBe(input);
      expect(appliedRules).not.toContain('SAN-013');
    });
  });

  test.describe('Multiple sanitizer rules in one pass', () => {
    test('should apply multiple rules when multiple issues exist', () => {
      const input = [
        "import { test } from '@playwright/test';",
        "import { test } from '@playwright/test';",
        'await pages.homePage.navigateToHeader(HEADERS.LOAD);',
        'const x = testData.undefined;',
      ].join('\n');
      const { code, appliedRules } = validator.sanitize(input);

      expect(appliedRules).toContain('SAN-007');
      expect(appliedRules).toContain('SAN-008');
      expect(appliedRules).toContain('SAN-011');
      expect(code).not.toContain('navigateToHeader');
      expect(code).not.toContain('testData.undefined');
    });
  });
});
