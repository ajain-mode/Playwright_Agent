import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { CsvDataService } from '../services/CsvDataService';
import { parseCsvLine } from '../utils/csvRowUtils';
import { TestCaseInput } from '../types/TestCaseTypes';

test.describe('CsvDataService', () => {
  let tempDir: string;
  let csvService: CsvDataService;

  test.beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csv-data-service-'));
    csvService = new CsvDataService(tempDir);
  });

  test.afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('appendTestDataToCsv writes carrierInvoiceAmount1 in the correct column', () => {
    const billingDir = path.join(tempDir, 'billingtoggle');
    fs.mkdirSync(billingDir, { recursive: true });

    const headerLine =
      'Test Script ID,officeName,customerRate,carrierRate,linehaulRate,carrierInvoiceNumber,carrierInvoiceAmount1,carrierInvoiceAmount2';
    const csvPath = path.join(billingDir, 'billingtoggledata.csv');
    fs.writeFileSync(csvPath, `${headerLine}\n`, 'utf-8');

    const headers = parseCsvLine(headerLine);
    const testCase: TestCaseInput = {
      id: 'BT-82749',
      title: 'Missing Paperwork toggle',
      description: '',
      category: 'billingtoggle',
      steps: [],
      expectedResults: [],
      testData: {
        officeName: 'CORP',
        customerRate: '1000',
        carrierInvoiceAmount1: '700',
      },
      explicitValues: {
        precondition: {},
        formFields: { carrierInvoiceAmount1: '700' },
      },
    };

    csvService.ensureTestDataInCsv(testCase);

    const lines = fs.readFileSync(csvPath, 'utf-8').split(/\r?\n/).filter(l => l.trim());
    expect(lines).toHaveLength(2);

    const parsed = parseCsvLine(lines[1]);
    expect(parsed).toHaveLength(headers.length);

    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h.trim()] = parsed[idx] ?? '';
    });

    expect(record['Test Script ID']).toBe('BT-82749');
    expect(record.customerRate).toBe('1000');
    expect(record.carrierInvoiceNumber).toBe('');
    expect(record.carrierInvoiceAmount1).toBe('700');
  });

  test('normalizeExistingRowAlignment repairs shifted invoice amount on existing row', () => {
    const billingDir = path.join(tempDir, 'billingtoggle');
    fs.mkdirSync(billingDir, { recursive: true });

    const headerLine =
      'Test Script ID,customerRate,carrierRate,linehaulRate,carrierInvoiceNumber,carrierInvoiceAmount1';
    // Missing one empty column: 700 lands in carrierInvoiceNumber
    const badRow = 'BT-TEST,1000,,,700';
    const csvPath = path.join(billingDir, 'billingtoggledata.csv');
    fs.writeFileSync(csvPath, `${headerLine}\n${badRow}\n`, 'utf-8');

    const testCase: TestCaseInput = {
      id: 'BT-TEST',
      title: 'Repair alignment',
      description: '',
      category: 'billingtoggle',
      steps: [],
      expectedResults: [],
      testData: {},
      explicitValues: { precondition: {}, formFields: {} },
    };

    csvService.ensureTestDataInCsv(testCase);

    const lines = fs.readFileSync(csvPath, 'utf-8').split(/\r?\n/).filter(l => l.trim());
    const headers = parseCsvLine(lines[0]);
    const parsed = parseCsvLine(lines[1]);

    expect(parsed).toHaveLength(headers.length);
    const invNumIdx = headers.indexOf('carrierInvoiceNumber');
    const invAmtIdx = headers.indexOf('carrierInvoiceAmount1');
    expect(parsed[invNumIdx]).toBe('');
    expect(parsed[invAmtIdx]).toBe('700');
  });
});
