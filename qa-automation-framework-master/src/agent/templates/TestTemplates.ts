/**
 * Test Templates
 * Pre-built templates for different test types
 * 
 * @author AI Agent Generator
 * @created 2026-02-05
 */

import { TestType, TestCaseInput, TestData } from '../types/TestCaseTypes';

export interface TestTemplate {
  type: TestType;
  name: string;
  description: string;
  template: string;
  requiredData: string[];
  optionalData: string[];
}

export class TestTemplates {
  private templates: Map<TestType, TestTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Non-Tabular Load Template
    this.templates.set('non-tabular-load', {
      type: 'non-tabular-load',
      name: 'Non-Tabular Load Creation',
      description: 'Template for creating a new non-tabular TL load',
      requiredData: ['customerName', 'shipperName', 'consigneeName', 'salesAgent', 'officeName'],
      optionalData: ['equipmentType', 'shipperZip', 'consigneeZip', 'offerRate'],
      template: `import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

/**
 * Test Case: {{TEST_CASE_ID}} - {{TEST_TITLE}}
 * @author {{AUTHOR}}
 * @date {{DATE}}
 */
const testcaseID = "{{TEST_CASE_ID}}";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let loadNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial("{{TEST_TITLE}}", () => {
  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    pages = new PageManager(sharedPage);
  });

  test.afterAll(async () => {
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: {{TEST_CASE_ID}} - {{TEST_TITLE}}",
    {
      tag: "{{TAGS}}"
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT);

      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });

      await test.step("Navigate to Customer and Create Load", async () => {
        await pages.basePage.hoverOverHeaderByText(HEADERS.CUSTOMER);
        await pages.basePage.clickSubHeaderByText(CUSTOMER_SUB_MENU.SEARCH);
        await pages.searchCustomerPage.searchCustomerAndClickDetails(testData.customerName);
        await pages.viewCustomerPage.navigateToLoad(LOAD_TYPES.NEW_LOAD_TL);
      });

      await test.step("Create Non-Tabular Load", async () => {
        await pages.nonTabularLoadPage.createNonTabularLoad({
          shipperValue: testData.shipperName,
          consigneeValue: testData.consigneeName,
          shipperEarliestTime: testData.shipperEarliestTime,
          shipperLatestTime: testData.shipperLatestTime,
          consigneeEarliestTime: testData.consigneeEarliestTime,
          consigneeLatestTime: testData.consigneeLatestTime,
          shipmentCommodityQty: testData.shipmentCommodityQty,
          shipmentCommodityUoM: testData.shipmentCommodityUoM,
          shipmentCommodityDescription: testData.shipmentCommodityDescription,
          shipmentCommodityWeight: testData.shipmentCommodityWeight,
          equipmentType: testData.equipmentType,
          equipmentLength: testData.equipmentLength,
          distanceMethod: testData.Method
        });
      });

      await test.step("Click Create Load and Verify", async () => {
        await pages.nonTabularLoadPage.clickCreateLoadButton();
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.editLoadPage.validateEditLoadHeadingText();
        await pages.editLoadPage.validateCurrentTabValue(TABS.LOAD);
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(\`Load Number: \${loadNumber}\`);
      });

      {{CUSTOM_STEPS}}
    }
  );
});
`
    });

    // DFB Multi-App Template
    this.templates.set('multi-app', {
      type: 'multi-app',
      name: 'DFB Multi-Application Test',
      description: 'Template for tests involving BTMS, TNX, and DME applications',
      requiredData: ['customerName', 'salesAgent', 'officeName', 'offerRate'],
      optionalData: ['includeCarriers', 'excludeCarriers', 'cargoValue'],
      template: `import { test, expect } from "@playwright/test";
import { MultiAppManager } from "@utils/dfbUtils/MultiAppManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";
import { PageManager } from "@utils/PageManager";

/**
 * Test Case: {{TEST_CASE_ID}} - {{TEST_TITLE}}
 * @author {{AUTHOR}}
 * @date {{DATE}}
 */
const testcaseID = "{{TEST_CASE_ID}}";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let cargoValue: string;
let loadNumber: string;
let sharedContext: any;
let sharedPage: any;
let appManager: MultiAppManager;
let pages: PageManager;
let totalMiles: string;

test.describe.configure({ retries: 1 });
test.describe.serial("{{TEST_TITLE}}", () => {
  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    appManager = new MultiAppManager(sharedContext, sharedPage);
    pages = appManager.btmsPageManager;
  });

  test.afterAll(async () => {
    if (appManager) {
      await appManager.closeAllSecondaryPages();
    }
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: {{TEST_CASE_ID}} - {{TEST_TITLE}}",
    {
      tag: "{{TAGS}}"
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT_LARGE);
      const toggleSettingsValue = pages.toggleSettings.enable_DME;

      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });

      await test.step("Pre-Conditions setup for creating a load", async () => {
        cargoValue = await pages.dfbHelpers.setupDFBTestPreConditions(
          pages,
          testData.officeName,
          toggleSettingsValue,
          pages.toggleSettings.verifyAutoPost,
          testData.salesAgent,
          testData.customerName,
          CARGO_VALUES.DEFAULT,
          LOAD_TYPES.CREATE_TL_NEW,
          false,
          true
        );
      });

      await test.step("Create a Non-Tabular Load", async () => {
        await pages.nonTabularLoadPage.createNonTabularLoad({
          shipperValue: testData.shipperName,
          consigneeValue: testData.consigneeName,
          shipperEarliestTime: testData.shipperEarliestTime,
          shipperLatestTime: testData.shipperLatestTime,
          consigneeEarliestTime: testData.consigneeEarliestTime,
          consigneeLatestTime: testData.consigneeLatestTime,
          shipmentCommodityQty: testData.shipmentCommodityQty,
          shipmentCommodityUoM: testData.shipmentCommodityUoM,
          shipmentCommodityDescription: testData.shipmentCommodityDescription,
          shipmentCommodityWeight: testData.shipmentCommodityWeight,
          equipmentType: testData.equipmentType,
          equipmentLength: testData.equipmentLength,
          distanceMethod: testData.Method
        });
      });

      await test.step("Create Load and Verify", async () => {
        await pages.nonTabularLoadPage.clickCreateLoadButton();
        await pages.editLoadLoadTabPage.checkLoadTabDetails(testData.rateType);
        await pages.editLoadPage.validateEditLoadHeadingText();
        loadNumber = await pages.dfbLoadFormPage.getLoadNumber();
        console.log(\`Load Number: \${loadNumber}\`);
      });

      await test.step("Enter offer rate and post load", async () => {
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.enterOfferRate(TNX.OFFER_RATE);
        await pages.editLoadFormPage.clickOnSaveBtn();
        await pages.viewLoadPage.validateViewLoadHeading();
        await pages.editLoadPage.clickOnTab(TABS.CARRIER);
        await pages.dfbLoadFormPage.clickOnPostButton();
        await pages.dfbLoadFormPage.validatePostStatus(LOAD_STATUS.POSTED);
      });

      {{CUSTOM_STEPS}}

      await test.step("Open DME application and verify", async () => {
        const dmePages = await appManager.switchToDME();
        try {
          await dmePages.dmeDashboardPage.clickOnLoadsLink();
          await dmePages.dmeDashboardPage.searchLoad(loadNumber);
          await dmePages.dmeLoadPage.validateSingleTableRowPresent();
          await dmePages.dmeLoadPage.validateAndGetSourceIdText(loadNumber);
          console.log("✅ DME operations completed successfully");
        } catch (error) {
          console.error("❌ Error in DME operations:", error);
          throw error;
        }
      });

      await test.step("Open TNX application and verify", async () => {
        const tnxPages = await appManager.switchToTNX();
        try {
          await tnxPages.tnxLandingPage.handleOptionalSkipButton();
          await tnxPages.tnxLandingPage.handleOptionalNoThanksButton();
          await tnxPages.tnxLandingPage.clickPlusSignButton();
          await tnxPages.tnxLandingPage.searchLoadValue(loadNumber);
          await tnxPages.tnxLandingPage.clickLoadSearchLink();
          await tnxPages.tnxLandingPage.validateAvailableLoadsText(loadNumber);
          console.log("✅ TNX operations completed successfully");
        } catch (error) {
          console.error("❌ Error in TNX operations:", error);
          throw error;
        }
      });
    }
  );
});
`
    });

    // EDI Load Template
    this.templates.set('edi-load', {
      type: 'edi-load',
      name: 'EDI 204 Load Tender',
      description: 'Template for EDI 204 load tender tests',
      requiredData: ['customerName', 'shipperEDICode', 'consigneeEDICode'],
      optionalData: ['ediStatus', 'ediCode'],
      template: `import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

/**
 * Test Case: {{TEST_CASE_ID}} - {{TEST_TITLE}}
 * @author {{AUTHOR}}
 * @date {{DATE}}
 */
const testcaseID = "{{TEST_CASE_ID}}";
const testData = dataConfig.getTestDataFromCsv(dataConfig.ediData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let loadNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial("{{TEST_TITLE}}", () => {
  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    pages = new PageManager(sharedPage);
  });

  test.afterAll(async () => {
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: {{TEST_CASE_ID}} - {{TEST_TITLE}}",
    {
      tag: "{{TAGS}}"
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT);

      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });

      await test.step("Navigate to EDI 204 Load Tenders", async () => {
        await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        // Navigate to EDI section
      });

      {{CUSTOM_STEPS}}
    }
  );
});
`
    });

    // Duplicate Load Template
    this.templates.set('duplicate-load', {
      type: 'duplicate-load',
      name: 'Duplicate Load Test',
      description: 'Template for duplicating an existing load',
      requiredData: ['sourceLoadNumber', 'customerName'],
      optionalData: ['duplicateOptions'],
      template: `import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

/**
 * Test Case: {{TEST_CASE_ID}} - {{TEST_TITLE}}
 * @author {{AUTHOR}}
 * @date {{DATE}}
 */
const testcaseID = "{{TEST_CASE_ID}}";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let originalLoadNumber: string;
let duplicatedLoadNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial("{{TEST_TITLE}}", () => {
  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    pages = new PageManager(sharedPage);
  });

  test.afterAll(async () => {
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: {{TEST_CASE_ID}} - {{TEST_TITLE}}",
    {
      tag: "{{TAGS}}"
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT);

      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });

      await test.step("Search for Load to Duplicate", async () => {
        // Search for the load
      });

      await test.step("Duplicate Load", async () => {
        // Duplicate the load
      });

      {{CUSTOM_STEPS}}
    }
  );
});
`
    });

    // Template Load Template
    this.templates.set('template-load', {
      type: 'template-load',
      name: 'Create Load from Template',
      description: 'Template for creating loads from templates',
      requiredData: ['templateName', 'customerName'],
      optionalData: ['overrideData'],
      template: `import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

/**
 * Test Case: {{TEST_CASE_ID}} - {{TEST_TITLE}}
 * @author {{AUTHOR}}
 * @date {{DATE}}
 */
const testcaseID = "{{TEST_CASE_ID}}";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;
let loadNumber: string;

test.describe.configure({ retries: 1 });
test.describe.serial("{{TEST_TITLE}}", () => {
  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    pages = new PageManager(sharedPage);
  });

  test.afterAll(async () => {
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: {{TEST_CASE_ID}} - {{TEST_TITLE}}",
    {
      tag: "{{TAGS}}"
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT);

      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });

      await test.step("Navigate to Load Templates", async () => {
        await pages.basePage.hoverOverHeaderByText(HEADERS.LOAD);
        await pages.basePage.clickSubHeaderByText(LOAD_SUB_MENU.TEMPLATES);
      });

      await test.step("Search and Select Template", async () => {
        // Search for template
      });

      {{CUSTOM_STEPS}}
    }
  );
});
`
    });

    // Post Automation Rule Template
    this.templates.set('post-automation', {
      type: 'post-automation',
      name: 'Post Automation Rule Test',
      description: 'Template for post automation rule tests',
      requiredData: ['customerName', 'equipment', 'pickLocation', 'destination'],
      optionalData: ['offerRate', 'includeCarriers', 'excludeCarriers'],
      template: `import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

/**
 * Test Case: {{TEST_CASE_ID}} - {{TEST_TITLE}}
 * @author {{AUTHOR}}
 * @date {{DATE}}
 */
const testcaseID = "{{TEST_CASE_ID}}";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial("{{TEST_TITLE}}", () => {
  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    pages = new PageManager(sharedPage);
  });

  test.afterAll(async () => {
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: {{TEST_CASE_ID}} - {{TEST_TITLE}}",
    {
      tag: "{{TAGS}}"
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT);

      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });

      await test.step("Navigate to Post Automation Rules", async () => {
        await pages.basePage.hoverOverHeaderByText(HEADERS.HOME);
        // Navigate to Post Automation
      });

      await test.step("Create/Verify Post Automation Rule", async () => {
        // Post automation rule logic
      });

      {{CUSTOM_STEPS}}
    }
  );
});
`
    });

    // Generic Test Template
    this.templates.set('generic', {
      type: 'generic',
      name: 'Generic Test',
      description: 'Generic test template for custom tests',
      requiredData: [],
      optionalData: ['customerName', 'testData'],
      template: `import { test, expect } from "@playwright/test";
import { PageManager } from "@utils/PageManager";
import userSetup from "@loginHelpers/userSetup";
import dataConfig from "@config/dataConfig";

/**
 * Test Case: {{TEST_CASE_ID}} - {{TEST_TITLE}}
 * @author {{AUTHOR}}
 * @date {{DATE}}
 */
const testcaseID = "{{TEST_CASE_ID}}";
const testData = dataConfig.getTestDataFromCsv(dataConfig.dfbData, testcaseID);

let sharedContext: any;
let sharedPage: any;
let pages: PageManager;

test.describe.configure({ retries: 1 });
test.describe.serial("{{TEST_TITLE}}", () => {
  test.beforeAll(async ({ browser }) => {
    sharedContext = await browser.newContext();
    sharedPage = await sharedContext.newPage();
    pages = new PageManager(sharedPage);
  });

  test.afterAll(async () => {
    if (sharedContext) {
      await sharedContext.close();
    }
  });

  test(
    "Case Id: {{TEST_CASE_ID}} - {{TEST_TITLE}}",
    {
      tag: "{{TAGS}}"
    },
    async () => {
      test.setTimeout(WAIT.SPEC_TIMEOUT);

      await test.step("Login BTMS", async () => {
        await pages.btmsLoginPage.BTMSLogin(userSetup.globalUser);
        console.log("BTMS Login Successful");
      });

      {{CUSTOM_STEPS}}
    }
  );
});
`
    });
  }

  /**
   * Get template by type
   */
  getTemplate(type: TestType): TestTemplate | undefined {
    return this.templates.get(type);
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): TestTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Fill template with test case data
   */
  fillTemplate(
    type: TestType,
    testCase: TestCaseInput,
    customSteps: string = '',
    _testData?: TestData
  ): string {
    const template = this.templates.get(type);
    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }

    let filledTemplate = template.template;

    // Replace placeholders
    filledTemplate = filledTemplate.replace(/{{TEST_CASE_ID}}/g, testCase.id);
    filledTemplate = filledTemplate.replace(/{{TEST_TITLE}}/g, testCase.title);
    filledTemplate = filledTemplate.replace(/{{AUTHOR}}/g, 'AI Agent Generator');
    filledTemplate = filledTemplate.replace(/{{DATE}}/g, new Date().toISOString().split('T')[0]);
    filledTemplate = filledTemplate.replace(/{{TAGS}}/g, (testCase.tags || []).join(','));
    filledTemplate = filledTemplate.replace(/{{CUSTOM_STEPS}}/g, customSteps);

    return filledTemplate;
  }

  /**
   * Suggest template based on test case
   */
  suggestTemplate(testCase: TestCaseInput): TestType {
    const description = testCase.description.toLowerCase();

    if (description.includes('tnx') || description.includes('dme') || description.includes('multi-app')) {
      return 'multi-app';
    }
    if (description.includes('edi') || description.includes('204') || description.includes('tender')) {
      return 'edi-load';
    }
    if (description.includes('duplicate') || description.includes('copy')) {
      return 'duplicate-load';
    }
    if (description.includes('template')) {
      return 'template-load';
    }
    if (description.includes('post automation') || description.includes('automation rule')) {
      return 'post-automation';
    }
    if (description.includes('create load') || description.includes('non-tabular')) {
      return 'non-tabular-load';
    }
    if (description.includes('tabular')) {
      return 'tabular-load';
    }

    return 'generic';
  }
}

export default new TestTemplates();
