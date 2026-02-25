# Test Case Layout Guide

This document describes the expected format/layout for test cases that the AI Agent can process and convert into Playwright scripts.

---

## 📊 Supported File Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| CSV | `.csv` | Comma-separated values |
| Excel | `.xlsx`, `.xls` | Microsoft Excel spreadsheets |
| JSON | `.json` | JavaScript Object Notation |
| Text | `.txt` | Plain text descriptions |

---

## 📋 CSV / Excel Column Layout

### Required Columns
| Column Name | Aliases | Description | Example |
|-------------|---------|-------------|---------|
| Test Script ID | `TestCaseID`, `TC ID`, `ID`, `Test ID` | Unique identifier | `DFB-001` |
| Title | `Test Title`, `Name`, `Summary` | Short test name | `Create DFB Load` |
| Steps | `Test Steps`, `Procedure`, `Actions` | Semicolon-separated steps | `1. Login;2. Navigate;3. Click` |

### Optional Columns
| Column Name | Aliases | Description | Example |
|-------------|---------|-------------|---------|
| Description | `Details`, `Full Description` | Detailed description | `This test verifies...` |
| Category | `Test Category`, `Type`, `Module` | Test category | `dfb`, `edi`, `commission` |
| Priority | `Severity`, `Importance` | Priority level | `critical`, `high`, `medium`, `low` |
| Expected Results | `Expected`, `Assertions` | Expected outcomes | `Load created;Status verified` |
| Tags | `Labels`, `Keywords` | Test tags | `@smoke,@regression` |
| Preconditions | `Prerequisites`, `Setup` | Required setup | `User logged in;Data exists` |

### Test Data Columns (Optional)
| Column Name | Description | Example |
|-------------|-------------|---------|
| officeName | Office name for test | `Mode Office 1` |
| customerName | Customer name | `Test Customer` |
| shipperName | Shipper name | `ABC Shipper` |
| consigneeName | Consignee name | `XYZ Consignee` |
| salesAgent | Sales agent name | `John Doe` |
| equipmentType | Equipment type | `Van`, `Flatbed`, `Reefer` |
| shipperZip | Shipper ZIP code | `10001` |
| consigneeZip | Consignee ZIP code | `90210` |
| offerRate | Offer rate amount | `1500` |
| cargoValue | Cargo value | `150000` |

---

## 📝 Step Format Guidelines

### Numbered Steps (Recommended)
```
1. Login to BTMS;2. Navigate to Loads;3. Create new load;4. Enter cargo value;5. Save and verify
```

### Bullet Points
```
- Login to BTMS
- Navigate to Loads
- Create new load
```

### Keywords for Better Code Generation

| Action Type | Keywords to Use | Generated Code |
|-------------|-----------------|----------------|
| Login | `login to btms`, `login btms` | Full login with credentials |
| Navigation | `navigate to loads`, `go to admin` | Header navigation code |
| Create Load | `create load`, `create non-tabular` | Full load creation code |
| Enter Value | `enter cargo value 150000` | Field entry with value |
| Save | `save and verify`, `save load` | Save with assertions |
| Verify | `verify status`, `validate load` | Assertion code |
| Post | `post to tnx`, `post load` | DFB post action |

---

## 📄 Sample CSV File

```csv
Test Script ID,Title,Description,Category,Priority,Steps,Expected Results,Tags,officeName,customerName,shipperName,consigneeName
DFB-001,Create DFB Load,Create load with high cargo value,dfb,high,"1. Login to BTMS;2. Navigate to Loads;3. Create new non-tabular load;4. Enter cargo value as 150000;5. Save and verify load","Load should be created;Cargo value displayed","@dfb,@smoke",Mode Office,Test Customer,ABC Shipper,XYZ Consignee
DFB-002,Verify TNX Post,Test post automation,dfb,medium,"1. Login to BTMS;2. Setup automation rule;3. Create load;4. Verify auto-post","Automation triggered;Load in TNX","@dfb,@automation",Mode Office,Customer 2,Shipper 2,Consignee 2
EDI-001,Process 204 Tender,EDI tender processing,edi,critical,"1. Receive 204 tender;2. Accept tender;3. Verify 990 sent","Tender processed;990 sent","@edi,@critical",,,
```

---

## 📄 Sample JSON Format

```json
[
  {
    "id": "DFB-001",
    "title": "Create DFB Load with High Cargo Value",
    "description": "Create a non-tabular load with cargo value between $100,001 and $250,000",
    "category": "dfb",
    "priority": "high",
    "tags": ["@dfb", "@smoke", "@regression"],
    "preconditions": ["User must be logged in", "Test data available"],
    "steps": [
      "Login to BTMS",
      "Navigate to Loads",
      "Create new non-tabular load",
      "Enter cargo value as 150000",
      "Save and verify load"
    ],
    "expectedResults": [
      "Load should be created successfully",
      "Cargo value should display as $150,000",
      "TNX post status should be verified"
    ],
    "testData": {
      "officeName": "Mode Office 1",
      "customerName": "Test Customer",
      "shipperName": "ABC Shipper",
      "consigneeName": "XYZ Consignee",
      "cargoValue": "150000"
    }
  },
  {
    "id": "DFB-002",
    "title": "Verify TNX Post Automation",
    "description": "Test post automation rule with carrier waterfall",
    "category": "dfb",
    "priority": "medium",
    "steps": [
      "Login to BTMS",
      "Setup post automation rule",
      "Configure carrier waterfall",
      "Create load matching rule",
      "Verify auto-post to TNX"
    ],
    "expectedResults": [
      "Post automation should trigger",
      "Load should appear in TNX"
    ]
  }
]
```

---

## 📄 Sample Text Format

```text
Test Case ID: DFB-001
Title: Create DFB Load with High Cargo Value
Category: dfb
Priority: high

Preconditions:
- User logged into BTMS
- Test data configured

Steps:
1. Login to BTMS
2. Navigate to Loads section
3. Create new non-tabular load
4. Enter cargo value as 150000
5. Save and verify load

Expected Results:
- Load should be created successfully
- Cargo value should display as $150,000
- TNX post status should be verified

Tags: @dfb, @smoke, @regression
===
Test Case ID: DFB-002
Title: Verify TNX Post Automation
...
```

---

## 🎯 Test Categories

| Category | Keywords | Description |
|----------|----------|-------------|
| `dfb` | dfb, cargo value, tnx, waterfall | DFB/TNX related tests |
| `edi` | edi, 204, 214, 990, tender | EDI processing tests |
| `commission` | commission, audit, agent share | Commission tests |
| `salesLead` | sales lead, activation, clearance | Sales lead tests |
| `carrier` | carrier, dnl, profile | Carrier management tests |
| `bulkChange` | bulk change, mass edit | Bulk operations tests |
| `api` | api, endpoint, request | API tests |

---

## 🚀 Usage Examples

### Generate from CSV
```bash
npm run agent -- -f path/to/testcases.csv
```

### Generate from Excel
```bash
npm run agent -- -f path/to/testcases.xlsx
```

### Generate from JSON
```bash
npm run agent -- -f path/to/testcases.json
```

### Batch Generate from Directory
```bash
npm run agent -- -b path/to/testcases/
```

### Preview Script (without saving)
```bash
npm run agent -- -p "Login to BTMS, create load, verify status"
```

---

## 📁 Output Structure

Generated scripts are saved to:
```
src/tests/generated/
├── dfb/
│   ├── DFB-001.spec.ts
│   └── DFB-002.spec.ts
├── edi/
│   └── EDI-001.spec.ts
├── commission/
├── salesLead/
└── custom/
```

---

## ✅ Best Practices

1. **Use clear step descriptions** - Include action verbs like "Login", "Navigate", "Create", "Verify"
2. **Include test data columns** - Provide shipper, consignee, and other data when available
3. **Use semicolons** - Separate multiple steps with semicolons in CSV/Excel
4. **Specify expected results** - Each expected result becomes an assertion in the test
5. **Add appropriate tags** - Use tags for filtering and reporting
6. **Match category keywords** - Use keywords that match test categories for proper organization
