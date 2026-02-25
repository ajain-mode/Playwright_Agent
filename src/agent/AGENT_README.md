# 🤖 Playwright Test Script Generator Agent

An AI Agent that generates Playwright test scripts from test case descriptions. The agent analyzes your project structure, understands page objects, constants, and patterns, then generates consistent and maintainable test scripts.

## Features

- **Natural Language Parsing**: Describe your test case in plain English
- **Schema-Aware Generation**: Understands your project's page objects, utilities, and constants
- **Multiple Templates**: Pre-built templates for different test types (DFB, EDI, Multi-App, etc.)
- **Interactive CLI**: User-friendly command-line interface
- **Batch Processing**: Generate multiple scripts at once
- **Preview Mode**: Preview generated code before saving

## Quick Start

### Interactive Mode (Recommended)

```bash
npm run agent
```

### Generate from Description

```bash
npm run agent:generate "Create a DFB load with cargo value between $100,001 and $250,000"
```

### Generate from File (JSON, TXT, CSV, XLSX)

```bash
# From JSON file
npm run agent -- --file src/agent/examples/sample-testcase.json

# From CSV file
npm run agent -- --file src/agent/examples/sample-testcases.csv

# From Excel file
npm run agent -- --file testcases.xlsx
```

### Preview Script

```bash
npm run agent:preview "Login to BTMS and create a new load with TNX verification"
```

### Analyze Test Case

```bash
npm run agent:analyze "Create load and verify in DME and TNX"
```

### Batch Generate

```bash
npm run agent:batch ./path/to/testcases/
```

## Input Formats

### Plain Text Description

```text
Test Case ID: DFB-TEST-001
Title: Create a DFB load with cargo value verification

Steps:
1. Login to BTMS
2. Navigate to customer search
3. Create a new non-tabular load
4. Enter offer rate and post

Expected Results:
- Load should be created successfully
- Post status should show POSTED
```

### JSON Format

```json
{
  "id": "DFB-TEST-001",
  "title": "Create a DFB load",
  "description": "Test case description",
  "category": "dfb",
  "tags": ["@dfb", "@smoke"],
  "steps": [
    { "stepNumber": 1, "action": "Login to BTMS" },
    { "stepNumber": 2, "action": "Create load" }
  ],
  "expectedResults": ["Load created successfully"]
}
```

### CSV Format

CSV files support multiple test cases in rows. Columns are case-insensitive.

```csv
Test Script ID,Title,Description,Category,Priority,Steps,Expected Results,Tags
DFB-001,"Create DFB Load","Description here",dfb,high,"1. Login;2. Create load","Expected result","@dfb,@smoke"
```

**Supported Column Names:**
| Field | Accepted Column Names |
|-------|----------------------|
| ID | Test Script ID, TestCaseID, TC ID, ID, Test ID |
| Title | Title, Test Title, Name, Test Name, Summary |
| Description | Description, Test Description, Details |
| Category | Category, Test Category, Type, Module |
| Steps | Steps, Test Steps, Procedure, Actions |
| Expected | Expected Results, Expected, Expected Result |
| Tags | Tags, Labels, Keywords |
| Priority | Priority, Severity, Importance |

### Excel (XLSX/XLS) Format

Excel files work the same as CSV files. The agent reads the first sheet by default and expects the same column structure as CSV.

```bash
# Generate from Excel file
npm run agent -- -f testcases.xlsx
```

**Features:**
- Reads first sheet by default
- Same column mappings as CSV
- Supports .xlsx and .xls formats
- Multiple test cases per file

## Available Templates

| Template | Description |
|----------|-------------|
| `non-tabular-load` | Standard TL load creation |
| `multi-app` | Tests involving BTMS, TNX, and DME |
| `edi-load` | EDI 204 load tender tests |
| `duplicate-load` | Load duplication tests |
| `template-load` | Create load from template |
| `post-automation` | Post automation rule tests |
| `generic` | Generic test template |

## Test Categories

- `dfb` - Digital Freight Broker tests
- `edi` - EDI transaction tests
- `commission` - Commission audit tests
- `salesLead` - Sales lead tests
- `banyan` - Banyan LTL tests
- `carrier` - Carrier management tests
- `bulkChange` - Bulk change tests
- `dat` - DAT loadboard tests
- `api` - API tests

## Generated Script Structure

The agent generates scripts following your project's established patterns:

```typescript
import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

const testcaseID = "DFB-TEST-001";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

test.describe.serial("Test Title", () => {
  test.beforeAll(async ({ browser }) => {
    // Setup
  });

  test.afterAll(async () => {
    // Cleanup
  });

  test("Case Id: DFB-TEST-001", { tag: "@dfb" }, async () => {
    await test.step("Login BTMS", async () => {
      await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
    });

    await test.step("Create Load", async () => {
      // Generated steps
    });
  });
});
```

## Programmatic Usage

```typescript
import { PlaywrightAgent } from './src/agent';

const agent = new PlaywrightAgent();

// Generate from description
const result = await agent.generateFromDescription(
  "Create a DFB load with cargo value verification"
);

// Generate from structured test case
const testCase = {
  id: "DFB-001",
  title: "Create DFB Load",
  category: "dfb",
  steps: [
    { stepNumber: 1, action: "Login to BTMS" }
  ],
  expectedResults: ["Load created"]
};

const result = await agent.generateFromTestCase(testCase);

// Preview without saving
const preview = await agent.previewScript(description);

// Analyze test case
const analysis = await agent.analyzeTestCase(description);
```

## Configuration

Create custom configuration by passing options:

```typescript
const agent = new PlaywrightAgent({
  outputDir: './custom/output/path',
  modelName: 'gpt-4',
  temperature: 0.3
});
```

## Output Location

Generated scripts are saved to:
```
src/tests/generated/{category}/{testcaseId}.spec.ts
```

## Best Practices

1. **Provide Clear Descriptions**: The more specific your test case description, the better the generated script.

2. **Include Test Data Reference**: If your test uses CSV data, include the test case ID that matches your data file.

3. **Specify Category**: Help the agent select the right template by mentioning the test category (DFB, EDI, etc.).

4. **Review Generated Code**: Always review and adjust the generated code as needed.

5. **Use Templates**: For complex tests, use the template-based generation for more control.

## Troubleshooting

### "Page object not found"
The action couldn't be mapped to a known page object. Update the SchemaAnalyzer with new patterns.

### "Template not found"
Specify a valid test type or use 'generic' for custom tests.

### Generated code has TODOs
Some actions couldn't be fully translated. Implement the TODO comments manually.

## Contributing

To add new page object mappings or action patterns, update:
- `src/agent/analyzers/SchemaAnalyzer.ts` - Add new action patterns
- `src/agent/templates/TestTemplates.ts` - Add new templates

## License

Part of the QA Automation Framework.
