import { ProcessedStep, PageContext, type ActionType } from '../analyzers/StepProcessor';
import { matchStepMapping, resolveCodePlaceholders } from '../config/StepMappings';
import { PageObjectScanner, type MethodInfo } from '../analyzers/PageObjectScanner';
import { type AppSourceIndexer, type AppElement } from '../analyzers/AppSourceIndexer';

export interface MatchResult {
  type: 'existing-pom' | 'new-pom' | 'todo' | 'mapping';
  code: string;
  pageObject?: string;
  methodName?: string;
  confidence: number;
  newLocator?: AppElement;
  reason: string;
}

const VERB_TO_KEYWORDS: Record<string, string[]> = {
  login: ['login', 'authenticate'],
  fill: ['enter', 'fill', 'input', 'type', 'write', 'set'],
  select: ['select', 'choose', 'pick', 'option'],
  click: ['click', 'press', 'tap', 'btn', 'button'],
  save: ['save', 'submit', 'update'],
  verify: ['verify', 'validate', 'check', 'get', 'assert', 'confirm', 'is'],
  hover: ['hover'],
  'tab-click': ['tab', 'clickontab'],
  navigate: ['navigate', 'goto', 'open'],
  alert: ['alert', 'validatealert', 'dialog'],
  upload: ['upload', 'attach', 'file'],
  'switch-app': ['switch', 'switchto'],
  'switch-user': ['switch', 'user', 'changeuser'],
  wait: ['wait', 'delay', 'timeout'],
  unknown: [],
};

const PAGE_CONTEXT_TO_CLASSES: Record<string, string[]> = {
  loadform: [
    'EditLoadFormPage',
    'EditLoadPage',
    'DFBLoadFormPage',
    'NonTabularLoadPage',
    'ViewLoadPage',
  ],
  carrform: [
    'CarrierSearch',
    'ViewCarrier',
    'EditLoadCarrierTabPage',
    'ViewLoadCarrierTabPage',
    'CarrierSearchPage',
  ],
  billing: ['LoadBillingPage', 'ViewLoadPage'],
  officeform: ['EditOfficeInfoPage', 'ViewOfficeInfoPage', 'OfficePage'],
  custform: ['CustomerPage', 'EditCustomerPage', 'SearchCustomerPage', 'ViewCustomerPage'],
  home: ['HomePage', 'BasePage', 'PostAutomationRulePage'],
  admin: ['AdminPage', 'OfficePage'],
  finance: ['FinancePage', 'AccountsPayablePage'],
};

/**
 * Tab-specific page object preferences.
 * When context.currentTab is set, the matching page object class gets a boost.
 * This disambiguates methods like enterActualDateValue that exist on both
 * EditLoadPickTabPage and EditLoadDropTabPage.
 */
const TAB_TO_PREFERRED_CLASS: Record<string, string> = {
  pick: 'EditLoadPickTabPage',
  drop: 'EditLoadDropTabPage',
  carrier: 'EditLoadCarrierTabPage',
  general: 'EditLoadFormPage',
  load: 'EditLoadFormPage',
};

function normalizeIdentifier(s: string): string {
  return s.toLowerCase().replace(/[\s_\-]+/g, '');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pascalCaseFromField(field: string): string {
  return field
    .split(/[\s_\-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function camelCaseFromField(field: string): string {
  const p = pascalCaseFromField(field);
  if (!p) {
    return 'value';
  }
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function deriveGetterName(className: string): string {
  return className.charAt(0).toLowerCase() + className.slice(1);
}

function methodNameHintScore(methodNameLower: string, keywords: string[]): number {
  if (!keywords.length) {
    return 0.35;
  }
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    if (methodNameLower.includes(k)) {
      return 1;
    }
  }
  return 0;
}

function actionAlignmentScore(actionType: ActionType, rawAction: string, methodName: string): number {
  const methodNameLower = methodName.toLowerCase();
  let keys = VERB_TO_KEYWORDS[actionType];
  if ((!keys || actionType === 'unknown') && rawAction) {
    const extra: string[] = [];
    const r = rawAction.toLowerCase();
    for (const [, kws] of Object.entries(VERB_TO_KEYWORDS)) {
      for (const kw of kws) {
        if (r.includes(kw.toLowerCase())) {
          extra.push(kw);
        }
      }
    }
    keys = [...(keys ?? []), ...extra];
  }
  keys = keys ?? [];
  return methodNameHintScore(methodNameLower, keys);
}

function fieldSimilarityScore(step: ProcessedStep, methodName: string, parameters: string): number {
  const candidates: string[] = [];
  if (step.targetField) {
    candidates.push(step.targetField);
  }
  if (step.buttonText) {
    candidates.push(step.buttonText);
  }
  if (step.linkText) {
    candidates.push(step.linkText);
  }
  if (step.targetTab) {
    candidates.push(step.targetTab);
  }
  if (!candidates.length && step.rawAction) {
    candidates.push(step.rawAction.slice(0, 120));
  }
  const paramNorm = normalizeIdentifier(parameters.replace(/[()]/g, ' '));
  const methodNorm = normalizeIdentifier(methodName);
  let best = 0;
  for (const c of candidates) {
    const nf = normalizeIdentifier(c);
    if (!nf) {
      continue;
    }
    if (methodNorm.includes(nf) || nf.includes(methodNorm)) {
      best = Math.max(best, 1);
      continue;
    }
    if (paramNorm.includes(nf) || nf.includes(paramNorm)) {
      best = Math.max(best, 0.85);
      continue;
    }
    const re = new RegExp(escapeRegExp(nf.replace(/\d/g, '')), 'i');
    if (re.test(methodNorm)) {
      best = Math.max(best, 0.65);
    }
  }
  return best;
}

function pageContextMatchScore(pageCtx: PageContext, className: string): number {
  // Tab-specific enforcement: if we know the current tab, HARD-BLOCK the wrong tab's page object
  if (pageCtx.currentTab) {
    const tabKey = pageCtx.currentTab.toLowerCase();
    const preferred = TAB_TO_PREFERRED_CLASS[tabKey];
    if (preferred) {
      if (className === preferred) return 1;
      // Hard-block wrong tab page objects — return -1 so scoreCandidate produces a negative total
      // e.g., on PICK tab, NEVER use EditLoadDropTabPage (and vice versa)
      for (const [otherTab, otherClass] of Object.entries(TAB_TO_PREFERRED_CLASS)) {
        if (otherTab !== tabKey && className === otherClass) return -1;
      }
    }
  }

  const key = pageCtx.currentPage.toLowerCase();
  const list = PAGE_CONTEXT_TO_CLASSES[key];
  if (!list?.length) {
    return 0.35;
  }
  if (list.includes(className)) {
    return 1;
  }
  const base = className.replace(/Page$/i, '');
  for (const entry of list) {
    const e = entry.replace(/Page$/i, '');
    if (className.includes(entry) || entry.includes(base) || base.includes(e)) {
      return 0.85;
    }
  }
  return 0;
}

function methodAcceptsStringLikeParam(parameters: string): boolean {
  const p = parameters.toLowerCase();
  return /\b(string|number|bigint)\b/.test(p);
}

function methodParamCount(parameters: string): number {
  const inner = parameters.replace(/^\(|\)$/g, '').trim();
  if (!inner) {
    return 0;
  }
  return inner
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean).length;
}

function parameterCompatScore(actionType: ActionType, parameters: string): number {
  const cnt = methodParamCount(parameters);
  const strOk = methodAcceptsStringLikeParam(parameters);

  if (actionType === 'fill' || actionType === 'select' || actionType === 'upload') {
    if (strOk) {
      return 1;
    }
    if (cnt > 0) {
      return 0.45;
    }
    return 0.1;
  }

  if (
    actionType === 'click' ||
    actionType === 'save' ||
    actionType === 'tab-click' ||
    actionType === 'hover' ||
    actionType === 'login' ||
    actionType === 'alert' ||
    actionType === 'navigate'
  ) {
    if (cnt === 0) {
      return 0.55;
    }
    return strOk ? 1 : 0.75;
  }

  if (actionType === 'verify') {
    return cnt === 0 ? 0.8 : strOk ? 1 : 0.7;
  }

  return strOk ? 1 : cnt === 0 ? 0.5 : 0.65;
}

function scoreCandidate(step: ProcessedStep, className: string, method: MethodInfo): number {
  if (method.isPrivate) {
    return 0;
  }
  const p = pageContextMatchScore(step.context, className);
  // Hard-block: if page context returns -1, this class is disqualified (wrong tab page object)
  if (p < 0) {
    return -1;
  }
  const a = actionAlignmentScore(step.actionType, step.rawAction, method.name);
  const f = fieldSimilarityScore(step, method.name, method.parameters);
  const c = parameterCompatScore(step.actionType, method.parameters);
  return a * 0.3 + f * 0.3 + p * 0.2 + c * 0.2;
}

function buildInvocationArgs(step: ProcessedStep, method: MethodInfo, testData?: Record<string, unknown>): string {
  const cnt = methodParamCount(method.parameters);
  if (cnt === 0) {
    return '';
  }
  if (step.testDataKey) {
    return `testData.${step.testDataKey}`;
  }
  if (step.targetField) {
    return `testData.${camelCaseFromField(step.targetField)}`;
  }
  if (step.targetValue !== undefined && step.valueSource === 'hardcoded') {
    // Instead of emitting hardcoded values, try to derive a testData key from the method name.
    // e.g., method "enterCustomerRate" → testData.customerRate
    const methodBody = method.name.replace(/^(enter|fill|select|set|type)/, '');
    if (methodBody) {
      const inferredKey = methodBody.charAt(0).toLowerCase() + methodBody.slice(1);
      console.log(`   ⚠️ buildInvocationArgs: value "${step.targetValue}" is hardcoded — inferring testData.${inferredKey} from method "${method.name}"`);
      return `testData.${inferredKey}`;
    }
    return JSON.stringify(step.targetValue);
  }
  if (testData && typeof testData === 'object') {
    const keys = Object.keys(testData);
    if (keys.length === 1) {
      return `testData.${keys[0]}`;
    }
  }
  return '/* TODO: args */';
}

function emitExistingPomCall(
  pomScanner: PageObjectScanner,
  className: string,
  method: MethodInfo,
  step: ProcessedStep,
  testData?: Record<string, unknown>,
): { code: string; pageGetter: string } {
  let getter = pomScanner.getPageManagerGetterForClass(className);
  if (!getter) {
    getter = deriveGetterName(className);
  }
  const args = buildInvocationArgs(step, method, testData);
  const argList = args ? args : '';
  const inner = argList ? `${method.name}(${argList})` : `${method.name}()`;
  const code = `await pages.${getter}.${inner};`;
  return { code, pageGetter: getter };
}

function todoFallback(step: ProcessedStep): MatchResult {
  const code = `// TODO: No POM method found for: "${step.rawAction}"
// Action type: ${step.actionType}, Target field: ${step.targetField ?? '(none)'}
// Manual implementation required
await commonReusables.waitForAllLoadStates(sharedPage);`;
  return {
    type: 'todo',
    code,
    confidence: 0,
    reason: 'No mapping, POM match, or app-source element met thresholds',
  };
}

function cssEscapeId(id: string): string {
  return id.replace(/([^\w-])/g, '\\$1');
}

function idToLabel(id: string): string {
  return id
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function viewModeLabel(el: AppElement): string | null {
  if (el.labelText) return el.labelText;
  const src = el.id || el.name;
  if (src) return idToLabel(src);
  return null;
}

function locatorExpression(el: AppElement, isViewMode = false): string {
  if (isViewMode && isFormElement(el)) {
    const label = viewModeLabel(el);
    if (label) {
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      return `this.page.getByRole('row', { name: /${escaped}/i }).locator('td').nth(1)`;
    }
  }
  if (el.id) {
    return `this.page.locator('#${cssEscapeId(el.id)}')`;
  }
  if (el.name) {
    return `this.page.locator('[name="${el.name.replace(/"/g, '\\"')}"]')`;
  }
  if (el.text && (el.type === 'button' || el.type === 'link')) {
    const t = el.text.replace(/'/g, "\\'");
    return `this.page.getByRole('${el.type === 'link' ? 'link' : 'button'}', { name: '${t}', exact: true })`;
  }
  return '';
}

function isFormElement(el: AppElement): boolean {
  return el.type === 'select' || el.type === 'input' || el.type === 'textarea' || el.type === 'checkbox' || el.type === 'radio';
}

function locatorMemberName(el: AppElement, methodName: string): string {
  if (el.id) {
    return `${camelCaseFromField(el.id)}_LOC`;
  }
  if (el.name) {
    return `${camelCaseFromField(el.name)}_LOC`;
  }
  return `${camelCaseFromField(methodName)}_LOC`;
}

function todayFormatted(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildJsDoc(
  el: AppElement,
  _methodName: string,
  description: string,
  params: Array<{ name: string; desc: string }>,
  returnType?: string,
  locatorOverride?: string,
): string {
  const locatorDesc = locatorOverride ?? `#${el.id || el.name || '(text-based)'}`;
  const lines = [
    `  /**`,
    `   * ${description}`,
    `   * Locator: ${locatorDesc} (${el.sourceFile}:${el.sourceLine})`,
    `   * @author AI Agent`,
    `   * @created ${todayFormatted()}`,
  ];
  for (const p of params) {
    lines.push(`   * @param ${p.name} - ${p.desc}`);
  }
  if (returnType) {
    lines.push(`   * @returns ${returnType}`);
  }
  lines.push(`   */`);
  return lines.join('\n');
}

function generateMethodBody(
  step: ProcessedStep,
  el: AppElement,
  methodName: string,
): { locatorDecl: string; methodCode: string } {
  const isViewMode = !step.context.isEditMode;
  const useViewLocator = isViewMode && step.actionType === 'verify' && isFormElement(el);
  const locExpr = locatorExpression(el, useViewLocator);
  if (!locExpr) {
    return { locatorDecl: '', methodCode: '' };
  }
  const locName = locatorMemberName(el, methodName);
  const locatorDecl = `  private readonly ${locName}: Locator = ${locExpr};`;

  const fieldDesc = step.targetField || el.id || el.name || methodName;
  const at = step.actionType;
  let jsdoc: string;
  let body: string;

  if (at === 'fill') {
    jsdoc = buildJsDoc(el, methodName, `Fills the ${fieldDesc} field.`, [{ name: 'value', desc: 'The value to enter.' }]);
    body = [
      jsdoc,
      `  async ${methodName}(value: string): Promise<void> {`,
      `    await this.${locName}.waitFor({ state: 'visible' });`,
      `    await this.${locName}.fill(value);`,
      `  }`,
    ].join('\n');
  } else if (at === 'select') {
    if (el.type === 'select') {
      jsdoc = buildJsDoc(el, methodName, `Selects an option from the ${fieldDesc} dropdown.`, [{ name: 'option', desc: 'The option value or label to select.' }]);
      body = [
        jsdoc,
        `  async ${methodName}(option: string): Promise<void> {`,
        `    await this.${locName}.waitFor({ state: 'visible' });`,
        `    await this.${locName}.selectOption(option);`,
        `  }`,
      ].join('\n');
    } else {
      jsdoc = buildJsDoc(el, methodName, `Fills the ${fieldDesc} field with the selected value.`, [{ name: 'value', desc: 'The value to enter.' }]);
      body = [
        jsdoc,
        `  async ${methodName}(value: string): Promise<void> {`,
        `    await this.${locName}.waitFor({ state: 'visible' });`,
        `    await this.${locName}.fill(value);`,
        `  }`,
      ].join('\n');
    }
  } else if (at === 'click') {
    jsdoc = buildJsDoc(el, methodName, `Clicks the ${fieldDesc} element.`, []);
    body = [
      jsdoc,
      `  async ${methodName}(): Promise<void> {`,
      `    await this.${locName}.waitFor({ state: 'visible' });`,
      `    await this.${locName}.click();`,
      `  }`,
    ].join('\n');
  } else if (at === 'verify') {
    if (el.type === 'checkbox' && !useViewLocator) {
      jsdoc = buildJsDoc(el, methodName, `Gets the checked state of the ${fieldDesc} checkbox.`, [], 'True if checked, false otherwise.');
      body = [
        jsdoc,
        `  async ${methodName}(): Promise<boolean> {`,
        `    await this.${locName}.waitFor({ state: 'attached' });`,
        `    return await this.${locName}.isChecked();`,
        `  }`,
      ].join('\n');
    } else if ((el.type === 'select' || el.type === 'input') && !useViewLocator) {
      jsdoc = buildJsDoc(el, methodName, `Gets the current value of the ${fieldDesc} field.`, [], 'The current input value.');
      body = [
        jsdoc,
        `  async ${methodName}(): Promise<string> {`,
        `    await this.${locName}.waitFor({ state: 'visible' });`,
        `    return await this.${locName}.inputValue();`,
        `  }`,
      ].join('\n');
    } else {
      const locDesc = useViewLocator
        ? `Playwright chained — getByRole('row', { name: /${fieldDesc}/i }).locator('td').nth(1)`
        : undefined;
      jsdoc = buildJsDoc(el, methodName, `Gets the displayed text of the ${fieldDesc} element (view mode).`, [], 'The displayed text, trimmed.', locDesc);
      body = [
        jsdoc,
        `  async ${methodName}(): Promise<string> {`,
        `    await this.${locName}.waitFor({ state: 'visible' });`,
        `    const text = await this.${locName}.textContent();`,
        `    return (text ?? '').trim();`,
        `  }`,
      ].join('\n');
    }
  } else if (at === 'upload') {
    jsdoc = buildJsDoc(el, methodName, `Uploads a file to the ${fieldDesc} input.`, [{ name: 'filePath', desc: 'Path to the file to upload.' }]);
    body = [
      jsdoc,
      `  async ${methodName}(filePath: string): Promise<void> {`,
      `    await this.${locName}.setInputFiles(filePath);`,
      `  }`,
    ].join('\n');
  } else {
    jsdoc = buildJsDoc(el, methodName, `Interacts with the ${fieldDesc} element — fills if value provided, clicks otherwise.`, [{ name: 'value', desc: 'Optional value to fill.' }]);
    body = [
      jsdoc,
      `  async ${methodName}(value?: string): Promise<void> {`,
      `    await this.${locName}.waitFor({ state: 'visible' });`,
      `    if (value !== undefined) {`,
      `      await this.${locName}.fill(value);`,
      `    } else {`,
      `      await this.${locName}.click();`,
      `    }`,
      `  }`,
    ].join('\n');
  }

  return { locatorDecl, methodCode: body };
}

function proposeMethodName(step: ProcessedStep): string {
  const base = step.targetField
    ? pascalCaseFromField(step.targetField)
    : pascalCaseFromField(step.rawAction.slice(0, 40));
  if (step.actionType === 'fill' || step.actionType === 'select') {
    return `enter${base || 'Value'}`;
  }
  if (step.actionType === 'click') {
    return `click${base || 'Element'}`;
  }
  if (step.actionType === 'verify') {
    return `verify${base || 'State'}`;
  }
  return `perform${base || 'Step'}`;
}

function pickPomClassForContext(pomScanner: PageObjectScanner, page: string): { className: string; filePath: string } | null {
  const list = PAGE_CONTEXT_TO_CLASSES[page.toLowerCase()] ?? [];
  for (const c of list) {
    const scan = pomScanner.getByClassName(c);
    if (scan) {
      return { className: scan.className, filePath: scan.filePath };
    }
  }
  return null;
}

export class POMMethodMatcher {
  private sessionCreatedMethods = new Map<string, MatchResult>();

  private batchFuzzyCache: Map<string, AppElement[]> | null = null;

  constructor(
    private pomScanner: PageObjectScanner,
    private appSourceIndexer: AppSourceIndexer | null,
  ) {}

  private cacheKey(step: ProcessedStep): string {
    return `${step.actionType}:${step.targetField ?? ''}:${step.context.currentPage}`;
  }

  private tryStepMapping(step: ProcessedStep, testData?: Record<string, any>): MatchResult | null {
    const mapping = matchStepMapping(step.rawAction);
    if (!mapping || mapping.confidence < 0.8) {
      return null;
    }
    mapping.pattern.lastIndex = 0;
    const execResult = mapping.pattern.exec(step.rawAction.toLowerCase());
    const code = resolveCodePlaceholders(mapping.code, execResult, testData);
    return {
      type: 'mapping',
      code,
      pageObject: mapping.pageObject,
      methodName: mapping.method,
      confidence: mapping.confidence,
      reason: 'Declarative StepMappings table match',
    };
  }

  private fuzzySearchCached(query: string, context: string | undefined): AppElement[] {
    const key = `${context ?? ''}::${query}`;
    if (this.batchFuzzyCache?.has(key)) {
      return this.batchFuzzyCache.get(key)!;
    }
    const res = this.appSourceIndexer!.fuzzySearch(query, context);
    this.batchFuzzyCache?.set(key, res);
    return res;
  }

  private findBestPomMatch(step: ProcessedStep, testData?: Record<string, any>): MatchResult | null {
    const all = this.pomScanner.scanAll();
    // Collect ALL viable candidates, then pick the best with tie-breaking
    const candidates: { className: string; method: MethodInfo; score: number }[] = [];
    for (const [, scan] of all) {
      for (const method of scan.methods) {
        if (method.isPrivate) {
          continue;
        }
        const score = scoreCandidate(step, scan.className, method);
        // Skip hard-blocked candidates (negative score = wrong tab page object)
        if (score < 0) {
          continue;
        }
        if (score >= 0.6) {
          candidates.push({ className: scan.className, method, score });
        }
      }
    }
    if (candidates.length === 0) {
      return null;
    }
    // Sort by score descending; when scores are close (within 0.1), prefer the class
    // that is listed in PAGE_CONTEXT_TO_CLASSES for the current page context
    const currentPageKey = step.context.currentPage.toLowerCase();
    const preferredClasses = PAGE_CONTEXT_TO_CLASSES[currentPageKey] ?? [];
    candidates.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
      // Tie-break: prefer class in current page's preferred list
      const aInCtx = preferredClasses.includes(a.className) ? 1 : 0;
      const bInCtx = preferredClasses.includes(b.className) ? 1 : 0;
      if (bInCtx !== aInCtx) return bInCtx - aInCtx;
      return scoreDiff;
    });
    const best = candidates[0];
    const { code, pageGetter } = emitExistingPomCall(
      this.pomScanner,
      best.className,
      best.method,
      step,
      testData,
    );
    return {
      type: 'existing-pom',
      code,
      pageObject: pageGetter,
      methodName: best.method.name,
      confidence: best.score,
      reason: `Weighted POM score ${best.score.toFixed(3)} (threshold 0.6)`,
    };
  }

  private phaseBNewPom(step: ProcessedStep): MatchResult | null {
    if (!this.appSourceIndexer) {
      return null;
    }
    const q = step.targetField || step.rawAction;
    const hits = this.batchFuzzyCache ? this.fuzzySearchCached(q, step.context.currentPage) : this.appSourceIndexer.fuzzySearch(q, step.context.currentPage);
    const qualified = hits.filter((h) => h.stabilityScore >= 0.7);
    if (!qualified.length) {
      return null;
    }
    const el = qualified[0];
    const methodName = proposeMethodName(step);

    // --- Guard: check if a method with the same or similar name already exists on ANY POM class ---
    const existingOwner = this.findExistingMethodOwner(methodName, step);
    if (existingOwner) {
      console.log(`   ⚠️ phaseBNewPom: method "${methodName}" already exists on ${existingOwner.className} — using existing instead of proposing new`);
      const { code, pageGetter } = emitExistingPomCall(
        this.pomScanner,
        existingOwner.className,
        existingOwner.method,
        step,
      );
      return {
        type: 'existing-pom',
        code,
        pageObject: pageGetter,
        methodName: existingOwner.method.name,
        confidence: 0.85,
        reason: `Existing POM method found during new-pom phase: ${existingOwner.className}.${existingOwner.method.name}()`,
      };
    }

    const picked = pickPomClassForContext(this.pomScanner, step.context.currentPage);
    const className = picked?.className ?? 'BasePage';
    const filePath = picked?.filePath ?? `src/pages/.../${className}.ts`;
    let getter = this.pomScanner.getPageManagerGetterForClass(className);
    if (!getter) getter = deriveGetterName(className);

    const { locatorDecl, methodCode } = generateMethodBody(step, el, methodName);

    if (!locatorDecl || !methodCode) {
      return null;
    }

    const needsValue = step.actionType === 'fill' || step.actionType === 'select';
    const callArg = needsValue
      ? step.targetValue
        ? `'${step.targetValue.replace(/'/g, "\\'")}'`
        : `testData.${camelCaseFromField(step.targetField || methodName)}`
      : '';
    const specCall = `await pages.${getter}.${methodName}(${callArg});`;

    const code = [
      `/*`,
      ` * NEW POM METHOD — add to ${filePath}`,
      ` * Source: ${el.sourceFile}:${el.sourceLine} (${el.app}, stability: ${el.stabilityScore.toFixed(2)} — ${el.stabilityReason})`,
      ` *`,
      ` * Locator declaration:`,
      ` *   ${locatorDecl}`,
      ` *`,
      ` * Method:`,
      ...methodCode.split('\n').map((l) => ` * ${l}`),
      ` */`,
      specCall,
    ].join('\n        ');

    return {
      type: 'new-pom',
      code,
      pageObject: className,
      methodName,
      confidence: el.stabilityScore,
      newLocator: el,
      reason: `App source match → ${className}.${methodName}() [${el.stabilityReason}, ${el.stabilityScore.toFixed(2)}]`,
    };
  }

  /**
   * Searches all POM classes for an existing method with the same (or very similar) name.
   * Returns the best-matching owner class + method, or null if none found.
   * Respects tab context: will not return a method on a wrong-tab page object.
   */
  private findExistingMethodOwner(
    proposedName: string,
    step: ProcessedStep,
  ): { className: string; method: MethodInfo } | null {
    const all = this.pomScanner.scanAll();
    const normProposed = proposedName.toLowerCase();
    let best: { className: string; method: MethodInfo; score: number } | null = null;

    for (const [, scan] of all) {
      // Hard-block wrong tab page objects
      const ctxScore = pageContextMatchScore(step.context, scan.className);
      if (ctxScore < 0) continue;

      for (const method of scan.methods) {
        if (method.isPrivate) continue;
        const normMethod = method.name.toLowerCase();
        // Exact match or substring containment (e.g., proposed "enterRateType" matches "selectRateType")
        let similarity = 0;
        if (normMethod === normProposed) {
          similarity = 1;
        } else if (normMethod.includes(normProposed) || normProposed.includes(normMethod)) {
          similarity = 0.85;
        } else {
          // Check action-stripped match: "isRateTypeFieldVisible" vs "selectRateType" both contain "ratetype"
          const coreProposed = normProposed.replace(/^(enter|select|click|verify|get|is|set|check|ensure|validate)/, '');
          const coreMethod = normMethod.replace(/^(enter|select|click|verify|get|is|set|check|ensure|validate)/, '');
          if (coreProposed && coreMethod && (coreMethod.includes(coreProposed) || coreProposed.includes(coreMethod))) {
            similarity = 0.75;
          }
        }
        if (similarity > 0) {
          const weightedScore = similarity * 0.7 + ctxScore * 0.3;
          if (!best || weightedScore > best.score) {
            best = { className: scan.className, method, score: weightedScore };
          }
        }
      }
    }
    return best && best.score >= 0.6 ? { className: best.className, method: best.method } : null;
  }

  matchAndGenerate(step: ProcessedStep, testData?: Record<string, any>): MatchResult {
    const mapped = this.tryStepMapping(step, testData);
    if (mapped) {
      return mapped;
    }

    const ck = this.cacheKey(step);
    const cached = this.sessionCreatedMethods.get(ck);
    if (cached) {
      return cached;
    }

    const pom = this.findBestPomMatch(step, testData);
    if (pom) {
      this.sessionCreatedMethods.set(ck, pom);
      return pom;
    }

    const novel = this.phaseBNewPom(step);
    if (novel) {
      this.sessionCreatedMethods.set(ck, novel);
      return novel;
    }

    const fall = todoFallback(step);
    this.sessionCreatedMethods.set(ck, fall);
    return fall;
  }

  private parseDirectPomInstruction(
    instruction: string,
  ): { getter: string; method: string; explicitPage: boolean } | null {
    const m1 = /pages\.(\w+)\.(\w+)\b/.exec(instruction);
    if (m1) {
      return { getter: m1[1], method: m1[2], explicitPage: true };
    }
    const m2 = /(\w+Page)\s*\.\s*(\w+)/i.exec(instruction);
    if (m2) {
      const scan = this.pomScanner.getByClassName(m2[1]);
      if (scan) {
        const getter =
          this.pomScanner.getPageManagerGetterForClass(scan.className) ?? deriveGetterName(scan.className);
        return { getter, method: m2[2], explicitPage: true };
      }
    }
    const m3 = /\b(?:method|use)\s+[`'"]?(\w+)[`'"]?/i.exec(instruction);
    if (m3) {
      const methodName = m3[1];
      const owner = this.pomScanner.findMethodOwner(methodName);
      if (owner) {
        const getter =
          this.pomScanner.getPageManagerGetterForClass(owner.className) ?? deriveGetterName(owner.className);
        return { getter, method: methodName, explicitPage: false };
      }
    }
    return null;
  }

  private tryResolveDirectPom(
    direct: { getter: string; method: string; explicitPage: boolean },
    step: ProcessedStep,
  ): MatchResult | null {
    const byGetter = this.pomScanner.getByPageManagerName(direct.getter);
    if (byGetter) {
      const method = byGetter.methods.find((m) => m.name === direct.method && !m.isPrivate);
      if (method) {
        const { code, pageGetter } = emitExistingPomCall(this.pomScanner, byGetter.className, method, step);
        return {
          type: 'existing-pom',
          code,
          pageObject: pageGetter,
          methodName: method.name,
          confidence: 1,
          reason: 'SpecValidator directive: explicit POM method',
        };
      }
      if (direct.explicitPage) {
        return null;
      }
    } else if (direct.explicitPage) {
      return null;
    }
    const owner = this.pomScanner.findMethodOwner(direct.method);
    if (!owner) {
      return null;
    }
    const method = owner.methods.find((m) => m.name === direct.method && !m.isPrivate);
    if (!method) {
      return null;
    }
    const { code, pageGetter } = emitExistingPomCall(this.pomScanner, owner.className, method, step);
    return {
      type: 'existing-pom',
      code,
      pageObject: pageGetter,
      methodName: method.name,
      confidence: 1,
      reason: 'SpecValidator directive: explicit POM method',
    };
  }

  private appSourceInstructionQuery(instruction: string): string | null {
    const m = /search\s+app\s+source\s+for\s+['"]?([^'"\n]+)['"]?/i.exec(instruction);
    return m?.[1]?.trim() ?? null;
  }

  correctStep(step: ProcessedStep, instruction: string): MatchResult {
    const direct = this.parseDirectPomInstruction(instruction);
    if (direct) {
      const resolved = this.tryResolveDirectPom(direct, step);
      if (resolved) {
        return resolved;
      }
    }

    if (this.appSourceIndexer) {
      const qFromInstr = this.appSourceInstructionQuery(instruction);
      if (qFromInstr) {
        const hits = this.appSourceIndexer.fuzzySearch(qFromInstr, step.context.currentPage);
        const qualified = hits.filter((h) => h.stabilityScore >= 0.7);
        if (qualified.length) {
          const el = qualified[0];
          const picked = pickPomClassForContext(this.pomScanner, step.context.currentPage);
          const className = picked?.className ?? 'BasePage';
          const filePath = picked?.filePath ?? `src/pages/.../${className}.ts`;
          const methodName = proposeMethodName(step);
          let getter = this.pomScanner.getPageManagerGetterForClass(className);
          if (!getter) getter = deriveGetterName(className);

          const { locatorDecl, methodCode } = generateMethodBody(step, el, methodName);
          if (locatorDecl && methodCode) {
            const needsValue = step.actionType === 'fill' || step.actionType === 'select';
            const callArg = needsValue
              ? step.targetValue
                ? `'${step.targetValue.replace(/'/g, "\\'")}'`
                : `testData.${camelCaseFromField(step.targetField || methodName)}`
              : '';
            const specCall = `await pages.${getter}.${methodName}(${callArg});`;

            const code = [
              `/*`,
              ` * NEW POM METHOD — add to ${filePath}`,
              ` * Source: ${el.sourceFile}:${el.sourceLine} (${el.app}, stability: ${el.stabilityScore.toFixed(2)} — ${el.stabilityReason})`,
              ` *`,
              ` * Locator declaration:`,
              ` *   ${locatorDecl}`,
              ` *`,
              ` * Method:`,
              ...methodCode.split('\n').map((l) => ` * ${l}`),
              ` */`,
              specCall,
            ].join('\n        ');

            return {
              type: 'new-pom',
              code,
              pageObject: className,
              methodName,
              confidence: el.stabilityScore,
              newLocator: el,
              reason: `SpecValidator app-source search → ${className}.${methodName}()`,
            };
          }
        }
      }
    }

    const mergedRaw = `${step.rawAction} ${instruction}`.trim();
    const merged: ProcessedStep = {
      ...step,
      rawAction: mergedRaw,
      targetField: step.targetField ?? (instruction.match(/field[:\s]+([\w_]+)/i)?.[1]),
    };

    return this.matchAndGenerate(merged);
  }

  correctBatch(corrections: Array<{ step: ProcessedStep; instruction: string }>): MatchResult[] {
    this.batchFuzzyCache = new Map();
    try {
      const out: MatchResult[] = new Array(corrections.length);
      const byPage = new Map<string, number[]>();
      corrections.forEach((c, i) => {
        const p = c.step.context.currentPage;
        if (!byPage.has(p)) {
          byPage.set(p, []);
        }
        byPage.get(p)!.push(i);
      });
      for (const indices of byPage.values()) {
        for (const i of indices) {
          out[i] = this.correctStep(corrections[i].step, corrections[i].instruction);
        }
      }
      return out;
    } finally {
      this.batchFuzzyCache = null;
    }
  }

  resetSession(): void {
    this.sessionCreatedMethods.clear();
  }
}
