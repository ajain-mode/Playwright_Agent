import { describe, expect, test } from '@playwright/test';
import { TestCaseMatcher } from '../analyzers/TestCaseMatcher';
import { TestCaseParser } from '../parsers/TestCaseParser';
import type { TestCaseInput } from '../types/TestCaseTypes';

describe('TestCaseMatcher', () => {
  const matcher = new TestCaseMatcher();

  test('rejects office-flow reference for customer-search-only testcase', () => {
    const customerCase: TestCaseInput = {
      id: 'BT-67847',
      title: 'LTL not Delivered Final price difference',
      description: '',
      category: 'billingtoggle',
      priority: 'medium',
      tags: ['billingtoggle'],
      preconditions: [],
      steps: [
        { stepNumber: 1, action: 'Log in to BTMS' },
        { stepNumber: 6, action: 'Hover to Customer and Click on Search.' },
        { stepNumber: 10, action: 'Scroll down and click CREATE TL *NEW*' },
        { stepNumber: 46, action: 'On Load tab click on View Billing button.' },
      ],
      expectedResults: [
        'Ensure after step 51:\n- Billing Toggle set to Agent',
      ],
      testData: {},
    };

    const officeRefCase: TestCaseInput = {
      id: 'BT-67846',
      title: 'Billing toggle office flow',
      description: '',
      category: 'billingtoggle',
      priority: 'medium',
      tags: ['billingtoggle'],
      preconditions: [],
      steps: [
        { stepNumber: 1, action: 'Login BTMS' },
        { stepNumber: 2, action: 'Admin Office Search ensure Invoice Process Central' },
        { stepNumber: 10, action: 'Customer search CREATE TL NEW' },
      ],
      expectedResults: [],
      testData: {},
    };

    const match = {
      matchedId: 'BT-67846',
      score: 0.79,
      specPath: 'src/tests/AIAgent/billingtoggle/BT-67846.spec.ts',
      matchedData: {},
      reasons: ['test'],
    };

    // Without loaded CSV corpus, isReferenceSuitable uses step similarity only
    const suitable = matcher.isReferenceSuitable(customerCase, match);
    expect(suitable).toBe(false);
    void officeRefCase;
  });
});

describe('TestCaseParser expected column', () => {
  const parser = new TestCaseParser();

  test('parseExpectedColumn groups Ensure after step N bullets', () => {
    const text = `51.Ensure after step 51:
- Billing Toggle set to Agent
- Not Deliv Final checkbox is checked.

Ensure after step 52:
- Waiting on value is set to Agent`;

    const results = (parser as any).parseExpectedColumn(text) as string[];
    expect(results.length).toBe(2);
    expect(results[0]).toContain('Billing Toggle');
    expect(results[1]).toContain('Waiting on');
  });
});
