import { expect, test } from "@playwright/test";
import { REGEX_PATTERNS } from "@utils/regexPatterns";

test.describe("REGEX_PATTERNS", () => {
  test("US_REPORT_DATETIME parses date-only and date-time values", () => {
    const dateOnly = "6/3/2026".match(REGEX_PATTERNS.DATE.US_REPORT_DATETIME);
    expect(dateOnly).not.toBeNull();
    expect(dateOnly![1]).toBe("6");
    expect(dateOnly![2]).toBe("3");
    expect(dateOnly![3]).toBe("2026");

    const withTime = "06/03/2026 14:30:45".match(REGEX_PATTERNS.DATE.US_REPORT_DATETIME);
    expect(withTime).not.toBeNull();
    expect(withTime![4]).toBe("14");
    expect(withTime![5]).toBe("30");
    expect(withTime![6]).toBe("45");
  });

  test("US_BILLING_TOGGLE_DATETIME requires mm/dd/yyyy hh:mm:ss", () => {
    expect("06/03/2026 14:30:45".match(REGEX_PATTERNS.DATE.US_BILLING_TOGGLE_DATETIME)).not.toBeNull();
    expect("06/01/2026 10:15".match(REGEX_PATTERNS.DATE.US_BILLING_TOGGLE_DATETIME)).toBeNull();
    expect("N/A".match(REGEX_PATTERNS.DATE.US_BILLING_TOGGLE_DATETIME)).toBeNull();
    expect("".match(REGEX_PATTERNS.DATE.US_BILLING_TOGGLE_DATETIME)).toBeNull();
  });

  test("US_FILTER_DATE requires anchored mm/dd/yyyy", () => {
    expect("6/3/2026".match(REGEX_PATTERNS.DATE.US_FILTER_DATE)).not.toBeNull();
    expect("6/3/2026 14:30".match(REGEX_PATTERNS.DATE.US_FILTER_DATE)).toBeNull();
    expect("not-a-date".match(REGEX_PATTERNS.DATE.US_FILTER_DATE)).toBeNull();
  });

  test("BILLING_TOGGLE labels extract display values from finance block text", () => {
    const blockText =
      "Waiting On: Agent\nInitial Toggle Date: 06/01/2026 10:15\nCurrent Toggle Date: N/A\n";

    const initial = blockText.match(REGEX_PATTERNS.BILLING_TOGGLE.INITIAL_TOGGLE_DATE_LABEL);
    const current = blockText.match(REGEX_PATTERNS.BILLING_TOGGLE.CURRENT_TOGGLE_DATE_LABEL);

    expect(initial?.[1]).toBe("06/01/2026 10:15");
    expect(current?.[1]).toBe("N/A");
  });

  test("WHITESPACE_RUNS collapses runs to a single space", () => {
    expect("  hello \n\t world  ".replace(REGEX_PATTERNS.TEXT.WHITESPACE_RUNS, " ").trim()).toBe(
      "hello world"
    );
  });
});
