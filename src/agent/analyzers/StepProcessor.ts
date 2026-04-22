export type ActionType =
  | 'login'
  | 'navigate'
  | 'fill'
  | 'select'
  | 'click'
  | 'verify'
  | 'upload'
  | 'alert'
  | 'switch-app'
  | 'switch-user'
  | 'wait'
  | 'save'
  | 'hover'
  | 'tab-click'
  | 'unknown';

export interface PageContext {
  currentApp: 'btms' | 'dme' | 'tnx';
  currentPage: string;
  currentTab: string;
  isEditMode: boolean;
  currentForm: string;
}

export interface ProcessedStep {
  stepNumber: number;
  rawAction: string;
  actionType: ActionType;
  targetField?: string;
  targetValue?: string;
  targetPage?: string;
  targetTab?: string;
  buttonText?: string;
  linkText?: string;
  headerText?: string;
  subHeaderText?: string;
  expectedResult?: string;
  alertPattern?: string;
  documentType?: string;
  valueSource: 'hardcoded' | 'testData' | 'generated' | 'none';
  testDataKey?: string;
  app: 'btms' | 'dme' | 'tnx' | 'unknown';
  /** @deprecated Use contextBefore instead. Kept for backward compatibility. */
  context: PageContext;
  /** Frozen snapshot of page context entering this step (set by processAllSteps) */
  contextBefore?: Readonly<PageContext>;
  /** Frozen snapshot of page context after this step was applied (set by processAllSteps) */
  contextAfter?: Readonly<PageContext>;
  toggleName?: string;
  toggleValue?: boolean;
  carrierSearchType?: string;
  navigateTarget?: string;
  isNegativeTest?: boolean;
}

const RE_LOGIN = /login|sign.?in|btmslogin|sso/i;
const RE_NAVIGATE =
  /(?:^|\b)(?:navigate|go\s+to|open)\b/i;
const RE_NAVIGATE_EXCLUDE = /\b(?:click|form)\b/i;
const RE_FILL = /enter|fill|input|type\s+in/i;
const RE_SELECT = /select|choose|dropdown|from\s+.*drop/i;
const RE_CLICK = /click|press|tap/i;
const RE_VERIFY =
  /verify|validate|assert|check|ensure|confirm|expect/i;
const RE_UPLOAD = /upload|attach|browse(?:\s+for)?\s+file/i;
const RE_ALERT = /alert|accept\s+(?:the\s+)?ok|dismiss|dialog/i;
const RE_SWITCH_APP = /switch.*(?:tnx|dme|btms)/i;
const RE_SWITCH_USER = /switch\s*(?:to\s*)?(?:a\s*)?different?\s*user|change\s*(?:the\s*)?user/i;
const RE_SAVE =
  /\bsave\s+button\b|click[^.\n]*\bsave\b|submit[^.\n]*form/i;
const RE_HOVER = /hover\s+(?:to|over|on)\s+/i;
const RE_TAB_CLICK = /click[^.\n]*\btab\b|navigate[^.\n]*\btab\b|select[^.\n]*\btab\b/i;
const RE_WAIT = /\bwait\b/i;
const RE_NEGATIVE =
  /\b(?:do\s*not|don't|must\s+not|should\s+not|never)\b/i;
const RE_QUOTED = /['"]([^'"]+)['"]|“([^”]+)”|«([^»]+)»/;
const RE_TOGGLE =
  /(?:toggle|set|turn)\s+([^,.\n]+?)\s+(?:to|as)\s+(YES|NO|ON|OFF|TRUE|FALSE|ENABLED?|DISABLED?)/i;

import { buildStepFieldAliases } from '../config/FieldRegistry';

const FIELD_ALIASES = buildStepFieldAliases();

const TAB_NAME_MAP: Array<{ re: RegExp; tab: string }> = [
  { re: /\bcarrier\b/i, tab: 'CARRIER' },
  { re: /\bpick\b/i, tab: 'PICK' },
  { re: /\bdrop\b/i, tab: 'DROP' },
  { re: /\bbilling\b/i, tab: 'BILLING' },
  { re: /\bload\b/i, tab: 'LOAD' },
  { re: /\bcustomer\b/i, tab: 'CUSTOMER' },
  { re: /\bgeneral\b/i, tab: 'GENERAL' },
];

function classifyActionType(action: string): ActionType {
  const t = action.trim();
  if (!t) {
    return 'unknown';
  }
  if (RE_LOGIN.test(t)) {
    return 'login';
  }
  if (RE_SWITCH_APP.test(t)) {
    return 'switch-app';
  }
  if (RE_SWITCH_USER.test(t)) {
    return 'switch-user';
  }
  if (RE_ALERT.test(t)) {
    return 'alert';
  }
  if (RE_UPLOAD.test(t)) {
    return 'upload';
  }
  if (RE_SAVE.test(t)) {
    return 'save';
  }
  if (RE_HOVER.test(t)) {
    return 'hover';
  }
  if (RE_TAB_CLICK.test(t)) {
    return 'tab-click';
  }
  if (RE_NAVIGATE.test(t) && !RE_NAVIGATE_EXCLUDE.test(t)) {
    return 'navigate';
  }
  if (RE_FILL.test(t)) {
    return 'fill';
  }
  if (RE_SELECT.test(t)) {
    return 'select';
  }
  if (RE_VERIFY.test(t)) {
    return 'verify';
  }
  if (RE_CLICK.test(t)) {
    return 'click';
  }
  if (RE_WAIT.test(t)) {
    return 'wait';
  }
  return 'unknown';
}

function shallowCloneContext(ctx: PageContext): PageContext {
  return { ...ctx };
}

function inferFieldFromText(text: string): { targetField: string; testDataKey: string } | undefined {
  for (const entry of FIELD_ALIASES) {
    for (const p of entry.patterns) {
      if (p.test(text)) {
        return { targetField: entry.targetField, testDataKey: entry.testDataKey };
      }
    }
  }
  return undefined;
}

function extractNumericOrQuotedValue(action: string): string | undefined {
  const mEq = action.match(
    /\b(?:as|to|=\s*|with\s+value\s+|value\s*(?:is|:)?)\s*['"]?([\d,.]+|[\w][\w\s.-]{0,120}?)(?:\s|$|['",])/i,
  );
  if (mEq?.[1]) {
    return mEq[1].trim();
  }
  const mNum = action.match(/\b(\d{1,9}(?:\.\d+)?)\b/);
  if (mNum?.[1]) {
    return mNum[1];
  }
  const q = action.match(RE_QUOTED);
  if (q) {
    return (q[1] ?? q[2] ?? q[3]).trim();
  }
  return undefined;
}

function resolveValueSource(
  extractedValue: string | undefined,
  inferredKey: string | undefined,
  testData: Record<string, any> | undefined,
): { valueSource: ProcessedStep['valueSource']; testDataKey?: string } {
  if (!extractedValue) {
    return { valueSource: 'none' };
  }
  if (inferredKey && testData && Object.prototype.hasOwnProperty.call(testData, inferredKey)) {
    return { valueSource: 'testData', testDataKey: inferredKey };
  }
  const normalized = extractedValue.replace(/[, ]/g, '');
  if (testData) {
    for (const [k, v] of Object.entries(testData)) {
      if (v === undefined || v === null) {
        continue;
      }
      const vs = String(v).replace(/[, ]/g, '');
      if (vs === normalized || String(v).trim() === extractedValue.trim()) {
        return { valueSource: 'testData', testDataKey: k };
      }
    }
  }
  return { valueSource: 'hardcoded', testDataKey: inferredKey };
}

function normalizeHeaderForHover(fragment: string): string {
  const s = fragment.trim();
  const upperMap: Record<string, string> = {
    loads: 'LOAD',
    load: 'LOAD',
    admin: 'ADMIN',
    customer: 'CUSTOMER',
    carrier: 'CARRIER',
    finance: 'FINANCE',
    home: 'HOME',
  };
  const low = s.toLowerCase();
  for (const [k, v] of Object.entries(upperMap)) {
    if (low.includes(k)) {
      return v;
    }
  }
  return s.toUpperCase().slice(0, 32);
}

function extractTabName(action: string): string | undefined {
  for (const { re, tab } of TAB_NAME_MAP) {
    if (re.test(action)) {
      return tab;
    }
  }
  return undefined;
}

function parseSwitchAppApp(action: string): 'btms' | 'dme' | 'tnx' {
  const u = action.toUpperCase();
  if (u.includes('TNX')) {
    return 'tnx';
  }
  if (u.includes('DME')) {
    return 'dme';
  }
  return 'btms';
}

function parseNavigateTarget(action: string): string | undefined {
  if (/\bloads?\b/i.test(action)) {
    return 'loads';
  }
  if (/\bcarrier\b/i.test(action) && /\bsearch\b/i.test(action)) {
    return 'carrier_search';
  }
  if (/\badmin\b/i.test(action)) {
    return 'admin';
  }
  if (/\bcustomer\b/i.test(action)) {
    return 'customer';
  }
  if (/\bcarrier\b/i.test(action)) {
    return 'carrier';
  }
  if (/\bbilling\b/i.test(action)) {
    return 'billing';
  }
  if (/\bfinance\b/i.test(action)) {
    return 'finance';
  }
  if (/\boffice\b/i.test(action)) {
    return 'office';
  }
  const after = action.match(/(?:navigate|go\s+to|open)\s+(?:to\s+)?['"]?([^'"\n]+?)(?:['"]|$)/i);
  if (after?.[1]) {
    return after[1].trim().replace(/\s+/g, '_').toLowerCase();
  }
  return action.toLowerCase().slice(0, 80);
}

function mapNavigateToPage(navigateTarget: string | undefined): string | undefined {
  if (!navigateTarget) {
    return undefined;
  }
  const n = navigateTarget.toLowerCase();
  if (n.includes('load') || n === 'loads') {
    return 'loadform';
  }
  if (n.includes('carrier') && !n.includes('search')) {
    return 'carrform';
  }
  if (n.includes('customer')) {
    return 'custform';
  }
  if (n.includes('admin')) {
    return 'admin';
  }
  if (n.includes('finance')) {
    return 'finance';
  }
  if (n.includes('billing')) {
    return 'billing';
  }
  if (n.includes('office')) {
    return 'officeform';
  }
  return undefined;
}

function extractButtonOrLinkText(action: string): { buttonText?: string; linkText?: string } {
  const btn =
    action.match(
      /\bclick\s+(?:the\s+)?(?:on\s+)?['"]?([^'"\n]+?)(?:\s+button|\s+link|\s+tab\b|$)/i,
    ) ??
    action.match(/\bpress\s+['"]?([^'"\n]+)/i) ??
    action.match(/\btap\s+(?:on\s+)?['"]?([^'"\n]+)/i);
  const raw = btn?.[1]?.trim();
  if (!raw) {
    return {};
  }
  if (/\blink\b/i.test(action) || /href/i.test(action)) {
    return { linkText: raw.replace(/\s+link$/i, '').trim() };
  }
  return { buttonText: raw.replace(/\s+button$/i, '').trim() };
}

function extractCarrierSearchType(action: string): string | undefined {
  const a = action.toUpperCase();
  if (/\bMC\b|\bM\.?C\.?\b|motor\s*carrier/i.test(a)) {
    return 'mc';
  }
  if (/\bDOT\b|d\.?o\.?t\.?/i.test(a)) {
    return 'dot';
  }
  if (/\bname\b/i.test(action) && /carrier/i.test(action)) {
    return 'name';
  }
  if (/\bid\b|scac/i.test(a)) {
    return 'id';
  }
  return undefined;
}

function extractToggle(action: string): { toggleName?: string; toggleValue?: boolean } {
  const m = action.match(RE_TOGGLE);
  if (!m?.[1] || !m?.[2]) {
    const soft = action.match(
      /(?:enable|disable|turn\s+on|turn\s+off)\s+['"]?([^'"\n,]+)/i,
    );
    if (soft?.[1]) {
      const val = /disable|turn\s+off/i.test(action) ? false : true;
      return { toggleName: soft[1].trim(), toggleValue: val };
    }
    return {};
  }
  const v = m[2].toUpperCase();
  const on =
    v === 'YES' ||
    v === 'ON' ||
    v === 'TRUE' ||
    v === 'ENABLE' ||
    v === 'ENABLED';
  return { toggleName: m[1].trim(), toggleValue: on };
}

function applyContextAfterStep(step: ProcessedStep, ctx: PageContext): void {
  switch (step.actionType) {
    case 'login':
      ctx.currentPage = 'home';
      break;
    case 'navigate': {
      const nav = step.navigateTarget ?? parseNavigateTarget(step.rawAction);
      const page = mapNavigateToPage(nav ?? undefined);
      if (page) {
        ctx.currentPage = page;
      }
      break;
    }
    case 'tab-click': {
      const tab = step.targetTab ?? extractTabName(step.rawAction);
      if (tab) {
        ctx.currentTab = tab;
      }
      break;
    }
    case 'switch-app':
      ctx.currentApp = parseSwitchAppApp(step.rawAction);
      break;
    case 'save':
      ctx.isEditMode = false;
      break;
    case 'click': {
      const bt = (step.buttonText ?? '').toLowerCase();
      if (/\bedit\b/i.test(bt) || /\bedit\b/i.test(step.rawAction)) {
        ctx.isEditMode = true;
      }
      if (/\bcreate\s+load\b/i.test(step.rawAction)) {
        ctx.currentPage = 'loadform';
        ctx.isEditMode = true;
      }
      break;
    }
    default:
      break;
  }
}

export class StepProcessor {
  processAllSteps(
    steps: Array<{ stepNumber: number; action: string; expectedResult?: string }>,
    testData?: Record<string, any>,
  ): { processedSteps: ProcessedStep[] } {
    const context: PageContext = {
      currentApp: 'btms',
      currentPage: 'home',
      currentTab: 'GENERAL',
      isEditMode: false,
      currentForm: '',
    };
    const processedSteps: ProcessedStep[] = [];
    for (const s of steps) {
      const contextBefore = Object.freeze(shallowCloneContext(context));
      const processed = this.processStep(
        s.stepNumber,
        s.action,
        context,
        testData,
        s.expectedResult,
      );
      applyContextAfterStep(processed, context);
      const contextAfter = Object.freeze(shallowCloneContext(context));

      // Attach immutable before/after snapshots
      processed.contextBefore = contextBefore;
      processed.contextAfter = contextAfter;

      processedSteps.push(processed);
    }
    return { processedSteps };
  }

  processStep(
    stepNumber: number,
    action: string,
    context: PageContext,
    testData?: Record<string, any>,
    expectedResult?: string,
  ): ProcessedStep {
    const rawAction = action;
    const actionType = classifyActionType(action);
    const ctxSnapshot = shallowCloneContext(context);

    const base: ProcessedStep = {
      stepNumber,
      rawAction,
      actionType,
      valueSource: 'none',
      app:
        context.currentApp === 'btms' ||
        context.currentApp === 'dme' ||
        context.currentApp === 'tnx'
          ? context.currentApp
          : 'unknown',
      context: ctxSnapshot,
    };

    if (expectedResult !== undefined) {
      base.expectedResult = expectedResult;
    }

    if (RE_NEGATIVE.test(action) && (actionType === 'select' || actionType === 'click')) {
      base.isNegativeTest = true;
    }

    const inferredField = inferFieldFromText(action);

    if (actionType === 'fill') {
      const tv = extractNumericOrQuotedValue(action);
      const field = inferredField;
      base.targetField = field?.targetField;
      base.targetValue = tv;
      const vs = resolveValueSource(tv, field?.testDataKey, testData);
      base.valueSource = vs.valueSource;
      base.testDataKey = vs.testDataKey;
    } else if (actionType === 'select') {
      base.targetValue = extractNumericOrQuotedValue(action);
      base.targetField = inferredField?.targetField;
      const vs = resolveValueSource(base.targetValue, inferredField?.testDataKey, testData);
      base.valueSource = vs.valueSource;
      base.testDataKey = vs.testDataKey;
    } else if (actionType === 'click') {
      const { buttonText, linkText } = extractButtonOrLinkText(action);
      base.buttonText = buttonText;
      base.linkText = linkText;
      base.carrierSearchType = extractCarrierSearchType(action);
    } else if (actionType === 'hover') {
      const hm = action.match(RE_HOVER);
      const rest = hm ? action.slice(action.indexOf(hm[0]) + hm[0].length) : action;
      base.headerText = normalizeHeaderForHover(rest.replace(/\s+(menu|submenu)\s*$/i, ''));
    } else if (actionType === 'tab-click') {
      base.targetTab = extractTabName(action);
    } else if (actionType === 'alert') {
      const q = action.match(RE_QUOTED);
      if (q) {
        base.alertPattern = (q[1] ?? q[2] ?? q[3]).trim();
      }
    } else if (actionType === 'verify') {
      const afterVerify = action.replace(/^\s*(?:verify|validate|assert|check|ensure|confirm|expect)\s+(?:that\s+)?/i, '');
      base.expectedResult = base.expectedResult ?? (afterVerify.trim() || expectedResult);
      const q = action.match(RE_QUOTED);
      if (q) {
        base.targetValue = (q[1] ?? q[2] ?? q[3]).trim();
      }
    } else if (actionType === 'navigate') {
      base.navigateTarget = parseNavigateTarget(action);
    } else if (actionType === 'upload') {
      const doc = action.match(/\b(?:pdf|csv|xlsx?|docx?|txt|image|jpeg|png)\b/i);
      if (doc) {
        base.documentType = doc[0].toLowerCase();
      }
    } else if (actionType === 'switch-app') {
      base.app = parseSwitchAppApp(action);
    }

    if (base.toggleName === undefined && base.toggleValue === undefined) {
      const toggle = extractToggle(action);
      if (toggle.toggleName !== undefined) {
        base.toggleName = toggle.toggleName;
        base.toggleValue = toggle.toggleValue;
      }
    }

    return base;
  }
}
