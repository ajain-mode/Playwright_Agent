import { test, expect } from '@playwright/test';
import {
  formatCsvRow,
  normalizeRowToHeaderCount,
  parseCsvLine,
  repairShiftedInvoiceAmountColumns,
  rowToRecord,
} from '../utils/csvRowUtils';

test.describe('csvRowUtils', () => {
  test('normalizeRowToHeaderCount pads trailing empty columns', () => {
    expect(normalizeRowToHeaderCount(['a', 'b'], 4)).toEqual(['a', 'b', '', '']);
  });

  test('formatCsvRow preserves trailing empty columns (prevents column shift)', () => {
    const headers = ['customerRate', 'carrierRate', 'linehaulRate', 'carrierInvoiceNumber', 'carrierInvoiceAmount1'];
    const values = ['1000', '', '', '', '700'];
    const row = formatCsvRow(values, headers.length);
    const parsed = parseCsvLine(row);

    expect(parsed).toHaveLength(headers.length);
    expect(parsed[0]).toBe('1000');
    expect(parsed[3]).toBe('');
    expect(parsed[4]).toBe('700');
  });

  test('repairShiftedInvoiceAmountColumns moves numeric invoice number to amount column', () => {
    const headers = [
      'customerRate',
      'carrierRate',
      'linehaulRate',
      'carrierInvoiceNumber',
      'carrierInvoiceAmount1',
    ];
    const values = ['1000', '', '', '700', ''];
    const { values: repaired, repaired: didRepair } = repairShiftedInvoiceAmountColumns(headers, values);

    expect(didRepair).toBe(true);
    expect(repaired[3]).toBe('');
    expect(repaired[4]).toBe('700');
  });

  test('rowToRecord maps aligned cells to header keys', () => {
    const headers = ['Test Script ID', 'officeName', 'carrierInvoiceAmount1'];
    const record = rowToRecord(headers, ['BT-82749', 'CORP', '700']);

    expect(record['Test Script ID']).toBe('BT-82749');
    expect(record.officeName).toBe('CORP');
    expect(record.carrierInvoiceAmount1).toBe('700');
  });
});
