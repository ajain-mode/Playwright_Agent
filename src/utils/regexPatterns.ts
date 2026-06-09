/**
 * Centralized regex patterns for date/datetime parsing and UI text extraction.
 * Single source of truth — update here when BTMS report or billing display formats change.
 * Mirrors the convention used by globalConstants.ts and alertPatterns.ts.
 * @author AI Agent
 * @created 2026-06-09
 */
export const REGEX_PATTERNS = {
  /** Collapse runs of whitespace to a single space (report cell / header normalization). */
  TEXT: {
    WHITESPACE_RUNS: /\s+/g,
  },

  /**
   * US-style date strings from Billing Queue report cells and datepicker inputs.
   * Used by BillingQueuePage.parseReportDate / parseFilterDateInput.
   */
  DATE: {
    /** mm/dd/yyyy with optional hh:mm or hh:mm:ss (report grid cell values). */
    US_REPORT_DATETIME: /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
    /** mm/dd/yyyy date-only, anchored (datepicker filter start/end inputs). */
    US_FILTER_DATE: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  },

  /**
   * Label extraction from billing.php `#finance_issues_block` inner text.
   * Used by LoadBillingPage toggle date display readers.
   */
  BILLING_TOGGLE: {
    INITIAL_TOGGLE_DATE_LABEL: /Initial Toggle Date:\s*([^\n]+)/i,
    CURRENT_TOGGLE_DATE_LABEL: /Current Toggle Date:\s*([^\n]+)/i,
  },
} as const;

export type RegexPatterns = typeof REGEX_PATTERNS;
