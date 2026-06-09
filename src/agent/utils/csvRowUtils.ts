/**
 * Shared CSV row helpers for agent pipeline data files (dfbdata.csv, billingtoggledata.csv, etc.).
 * Ensures every row has exactly one cell per header so trailing empty columns are not dropped.
 *
 * @author AI Agent
 * @created 2026-06-01
 */

/**
 * Parse a CSV line handling quoted values (including escaped quotes).
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Escape a CSV cell value (wrap in quotes when it contains special characters).
 */
export function escapeCsvValue(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('(') ||
    value.includes(')')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Pad or trim a parsed row so it aligns 1:1 with the header column count.
 * Missing trailing cells become empty strings; excess cells are dropped.
 */
export function normalizeRowToHeaderCount(values: string[], headerCount: number): string[] {
  if (headerCount <= 0) return values;
  const normalized = values.slice(0, headerCount);
  while (normalized.length < headerCount) {
    normalized.push('');
  }
  return normalized;
}

/**
 * When a row is short by one or more trailing commas, numeric invoice amounts can land in
 * `carrierInvoiceNumber` instead of `carrierInvoiceAmount1`. Move pure-numeric invoice numbers
 * into the amount column when the amount cell is empty.
 */
export function repairShiftedInvoiceAmountColumns(
  headers: string[],
  values: string[],
): { values: string[]; repaired: boolean } {
  const invNumIdx = headers.findIndex(h => h.trim() === 'carrierInvoiceNumber');
  const invAmt1Idx = headers.findIndex(h => h.trim() === 'carrierInvoiceAmount1');
  if (invNumIdx === -1 || invAmt1Idx === -1) {
    return { values, repaired: false };
  }

  const next = [...values];
  const invNum = (next[invNumIdx] ?? '').trim();
  const invAmt1 = (next[invAmt1Idx] ?? '').trim();

  if (invNum && /^\d+(?:\.\d+)?$/.test(invNum) && !invAmt1) {
    next[invAmt1Idx] = invNum;
    next[invNumIdx] = '';
    return { values: next, repaired: true };
  }

  return { values, repaired: false };
}

/**
 * Serialize a row with exactly `headerCount` columns (pads trailing empties).
 */
export function formatCsvRow(values: string[], headerCount: number): string {
  return normalizeRowToHeaderCount(values, headerCount)
    .map(v => escapeCsvValue(v ?? ''))
    .join(',');
}

/**
 * Map parsed CSV row cells to a header-keyed record (all headers present).
 */
export function rowToRecord(headers: string[], values: string[]): Record<string, string> {
  const aligned = normalizeRowToHeaderCount(values, headers.length);
  const record: Record<string, string> = {};
  headers.forEach((header, idx) => {
    record[header.trim()] = (aligned[idx] ?? '').trim();
  });
  return record;
}
