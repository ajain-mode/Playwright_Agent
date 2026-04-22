import { test, expect } from '@playwright/test';
import {
  FIELD_REGISTRY,
  buildStepFieldAliases,
  buildCsvAliasMap,
  csvHeaderToCanonicalKey,
  testDataKeyToFormField,
} from '../config/FieldRegistry';

test.describe('FieldRegistry', () => {
  test.describe('FIELD_REGISTRY structure', () => {
    test('should contain entries for core fields', () => {
      const keys = FIELD_REGISTRY.map(f => f.canonicalKey);

      expect(keys).toContain('customerRate');
      expect(keys).toContain('carrierRate');
      expect(keys).toContain('offerRate');
      expect(keys).toContain('carrierName');
      expect(keys).toContain('equipmentType');
      expect(keys).toContain('trailerLength');
      expect(keys).toContain('miles');
    });

    test('every entry should have canonicalKey, formFieldId, and csvAliases', () => {
      for (const field of FIELD_REGISTRY) {
        expect(field.canonicalKey).toBeTruthy();
        expect(field.formFieldId).toBeTruthy();
        expect(Array.isArray(field.csvAliases)).toBe(true);
        expect(field.csvAliases.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('buildStepFieldAliases', () => {
    test('should return entries for all FIELD_REGISTRY items with stepPatterns', () => {
      const aliases = buildStepFieldAliases();
      const registryWithPatterns = FIELD_REGISTRY.filter(f => f.stepPatterns.length > 0);

      expect(aliases.length).toBe(registryWithPatterns.length);
    });

    test('each alias should have patterns, targetField, and testDataKey', () => {
      const aliases = buildStepFieldAliases();

      for (const alias of aliases) {
        expect(alias.patterns).toBeDefined();
        expect(Array.isArray(alias.patterns)).toBe(true);
        expect(alias.patterns.length).toBeGreaterThan(0);
        expect(alias.targetField).toBeTruthy();
        expect(alias.testDataKey).toBeTruthy();
      }
    });

    test('customerRate alias should map to customer_rate form field', () => {
      const aliases = buildStepFieldAliases();
      const customerRateAlias = aliases.find(a => a.testDataKey === 'customerRate');

      expect(customerRateAlias).toBeDefined();
      expect(customerRateAlias!.targetField).toBe('customer_rate');
    });

    test('pattern for customerRate should match "customer rate"', () => {
      const aliases = buildStepFieldAliases();
      const customerRateAlias = aliases.find(a => a.testDataKey === 'customerRate');

      expect(customerRateAlias).toBeDefined();
      const matched = customerRateAlias!.patterns.some(p => p.test('Enter customer rate'));
      expect(matched).toBe(true);
    });
  });

  test.describe('buildCsvAliasMap', () => {
    test('should map formFields.offerRate to aliasMap.offerrate', () => {
      const aliasMap = buildCsvAliasMap({
        formFields: { offerRate: '750' },
      });

      expect(aliasMap['offerrate']).toBe('750');
    });

    test('should map precondition.carrierName to aliasMap.carrier', () => {
      const aliasMap = buildCsvAliasMap({
        precondition: { carrierName: 'TEST CARRIER LLC' },
      });

      expect(aliasMap['carrier']).toBe('TEST CARRIER LLC');
    });

    test('should apply loadMethod normalization when normalizer is provided', () => {
      const normalizer = (v: string): string => {
        if (v === 'TruckLoad') return 'TL';
        return v;
      };
      const aliasMap = buildCsvAliasMap(
        { formFields: { loadType: 'TruckLoad' } },
        normalizer,
      );

      expect(aliasMap['loadmethod']).toBe('TL');
    });

    test('should NOT normalize loadMethod when no normalizer is provided', () => {
      const aliasMap = buildCsvAliasMap({
        formFields: { loadType: 'TruckLoad' },
      });

      expect(aliasMap['loadmethod']).toBe('TruckLoad');
    });

    test('equipmentLength fallback: should use trailerLength when equipmentLength is missing', () => {
      const aliasMap = buildCsvAliasMap({
        formFields: { trailerLength: '53' },
      });

      expect(aliasMap['trailerlength']).toBe('53');
      expect(aliasMap['equipmentlength']).toBe('53');
    });

    test('equipmentLength should NOT fallback when explicitly provided', () => {
      const aliasMap = buildCsvAliasMap({
        formFields: {
          equipmentLength: '48',
          trailerLength: '53',
        },
      });

      expect(aliasMap['equipmentlength']).toBe('48');
      expect(aliasMap['trailerlength']).toBe('53');
    });

    test('should return empty map when no matching values exist', () => {
      const aliasMap = buildCsvAliasMap({
        formFields: {},
        precondition: {},
      });

      expect(Object.keys(aliasMap).length).toBe(0);
    });

    test('should handle missing precondition and formFields gracefully', () => {
      const aliasMap = buildCsvAliasMap({});

      expect(Object.keys(aliasMap).length).toBe(0);
    });

    test('salesAgent value should be formatted with spaces', () => {
      const aliasMap = buildCsvAliasMap({
        precondition: { switchToUser: 'John Doe(jdoe)' },
      });

      // The formatting adds space before paren: 'John Doe(jdoe)' -> 'John Doe (jdoe)'
      expect(aliasMap['salesagent']).toBe('John Doe (jdoe)');
    });
  });

  test.describe('csvHeaderToCanonicalKey', () => {
    test('should return "carrierName" for header "carrier"', () => {
      expect(csvHeaderToCanonicalKey('carrier')).toBe('carrierName');
    });

    test('should return "customerRate" for header "customerrate"', () => {
      expect(csvHeaderToCanonicalKey('customerrate')).toBe('customerRate');
    });

    test('should return "miles" for header "miles"', () => {
      expect(csvHeaderToCanonicalKey('miles')).toBe('miles');
    });

    test('should return "officeCode" for header "officename"', () => {
      expect(csvHeaderToCanonicalKey('officename')).toBe('officeCode');
    });

    test('should return undefined for unknown header', () => {
      expect(csvHeaderToCanonicalKey('unknownheader')).toBeUndefined();
    });

    test('should return "saleAgentEmail" for header "saleagentemail"', () => {
      expect(csvHeaderToCanonicalKey('saleagentemail')).toBe('saleAgentEmail');
    });
  });

  test.describe('testDataKeyToFormField', () => {
    test('should return "carrier_rate" for key "carrierRate"', () => {
      expect(testDataKeyToFormField('carrierRate')).toBe('carrier_rate');
    });

    test('should return "customer_rate" for key "customerRate"', () => {
      expect(testDataKeyToFormField('customerRate')).toBe('customer_rate');
    });

    test('should return "equipment_type" for key "equipmentType"', () => {
      expect(testDataKeyToFormField('equipmentType')).toBe('equipment_type');
    });

    test('should return "trailer_length" for key "trailerLength"', () => {
      expect(testDataKeyToFormField('trailerLength')).toBe('trailer_length');
    });

    test('should return "miles" for key "miles"', () => {
      expect(testDataKeyToFormField('miles')).toBe('miles');
    });

    test('should return undefined for unknown key', () => {
      expect(testDataKeyToFormField('nonExistentKey')).toBeUndefined();
    });

    test('should return "notification_email" for key "saleAgentEmail"', () => {
      expect(testDataKeyToFormField('saleAgentEmail')).toBe('notification_email');
    });
  });
});
