import fs from 'fs';
import path from 'path';

export interface AppElement {
  id?: string;
  name?: string;
  type:
    | 'input'
    | 'select'
    | 'button'
    | 'textarea'
    | 'checkbox'
    | 'radio'
    | 'link'
    | 'table'
    | 'div'
    | 'span'
    | 'img'
    | 'form';
  inputType?: string;
  classes?: string[];
  text?: string;
  title?: string;
  parentForm?: string;
  sourceFile: string;
  sourceLine: number;
  context: string;
  labelText?: string;
  stabilityScore: number;
  stabilityReason: string;
  app: string;
}

export interface AppSourceIndex {
  elements: AppElement[];
  findById(id: string): AppElement[];
  findByName(name: string): AppElement[];
  findByText(text: string, type?: string): AppElement[];
  findByContext(context: string): AppElement[];
  fuzzySearch(query: string, context?: string): AppElement[];
}

const CONTEXT_BY_BASENAME: Record<string, string> = {
  loadform: 'loadform',
  carrform: 'carrform',
  billing: 'billing',
  officeform: 'officeform',
  custform: 'custform',
  quoteform: 'quoteform',
};

function hasPhpDynamic(value: string | undefined): boolean {
  if (!value) return false;
  return /\$/.test(value) || /\{\s*\$/.test(value);
}

function scoreStability(opts: {
  id?: string;
  name?: string;
  title?: string;
  text?: string;
  classes?: string[];
}): { stabilityScore: number; stabilityReason: string } {
  const { id, name, title, text, classes } = opts;
  if (id && !hasPhpDynamic(id)) {
    return { stabilityScore: 1.0, stabilityReason: 'static id' };
  }
  if (name && !hasPhpDynamic(name)) {
    return { stabilityScore: 0.9, stabilityReason: 'static name' };
  }
  if (title && !hasPhpDynamic(title)) {
    return { stabilityScore: 0.85, stabilityReason: 'title attribute' };
  }
  if (id && hasPhpDynamic(id)) {
    return { stabilityScore: 0.5, stabilityReason: 'dynamic index' };
  }
  if (text && text.trim()) {
    return { stabilityScore: 0.4, stabilityReason: 'text content only' };
  }
  if (classes && classes.length > 0) {
    return { stabilityScore: 0.3, stabilityReason: 'class only' };
  }
  if (name && hasPhpDynamic(name)) {
    return { stabilityScore: 0.5, stabilityReason: 'dynamic index' };
  }
  return { stabilityScore: 0.3, stabilityReason: 'class only' };
}

function stripQuotes(s: string): string {
  const t = s.trim();
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
    return t.slice(1, -1);
  }
  return t;
}

function parseAttrsFromTag(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(["'])((?:\\\2|(?!\2).)*?)\2/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag)) !== null) {
    attrs[m[1].toLowerCase()] = m[3];
  }
  return attrs;
}

function parseClassAttr(classStr: string | undefined): string[] | undefined {
  if (!classStr || !classStr.trim()) return undefined;
  return classStr.trim().split(/\s+/).filter(Boolean);
}

function deriveContext(filePath: string, app: string): string {
  const base = path.basename(filePath);
  const lower = base.toLowerCase();
  if (app === 'dme') {
    const m = /^(.+)\.html\.twig$/i.exec(base);
    if (m) {
      return `dme-${m[1].toLowerCase()}`;
    }
  }
  if (lower === 'loads.inc.php') return 'loads';
  const noExt = lower.replace(/\.(php|inc\.php|twig|html\.twig)$/i, '');
  const stem = noExt.replace(/\.inc$/i, '');
  const key = stem.replace(/\.php$/i, '');
  if (CONTEXT_BY_BASENAME[key]) return CONTEXT_BY_BASENAME[key];
  if (CONTEXT_BY_BASENAME[stem]) return CONTEXT_BY_BASENAME[stem];
  return stem || key || 'unknown';
}

function matchesFileTypes(relPath: string, fileTypes: string[]): boolean {
  const lower = relPath.toLowerCase();
  for (const ft of fileTypes) {
    const g = ft.replace(/^\*\./, '.');
    if (g === '.php' && lower.endsWith('.php')) return true;
    if (g === '.twig' && lower.endsWith('.twig')) return true;
    if (ft.includes('html') && ft.includes('twig') && lower.endsWith('.html.twig')) return true;
  }
  return false;
}

function walkRecursive(dir: string, out: string[]): void {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkRecursive(full, out);
    else out.push(full);
  }
}

function extractLabelForMap(line: string, map: Map<string, string>): void {
  const re =
    /<label[^>]*\s+for\s*=\s*(["'])((?:\\\1|(?!\1).)*?)\1[^>]*>([\s\S]*?)<\/label>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const id = m[2].trim();
    const inner = m[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (id && inner) map.set(id, inner);
  }
}

type FormEvent = { pos: number; kind: 'open' | 'close'; id?: string };

function findFormEvents(line: string): FormEvent[] {
  const events: FormEvent[] = [];
  const reO = /<form\b[^>]*\bid\s*=\s*(["'])((?:\\\1|(?!\1).)*?)\1/gi;
  let m: RegExpExecArray | null;
  while ((m = reO.exec(line)) !== null) {
    events.push({ pos: m.index, kind: 'open', id: m[2] });
  }
  const reC = /<\/form\b/gi;
  while ((m = reC.exec(line)) !== null) {
    events.push({ pos: m.index, kind: 'close' });
  }
  events.sort((a, b) => a.pos - b.pos);
  return events;
}

function formStackBeforePos(line: string, pos: number, stackBeforeLine: string[]): string[] {
  const events = findFormEvents(line);
  const stack = [...stackBeforeLine];
  for (const e of events) {
    if (e.pos >= pos) break;
    if (e.kind === 'open' && e.id) stack.push(e.id);
    else if (e.kind === 'close' && stack.length) stack.pop();
  }
  return stack;
}

function applyFormEventsToStack(line: string, stack: string[]): void {
  for (const e of findFormEvents(line)) {
    if (e.kind === 'open' && e.id) stack.push(e.id);
    else if (e.kind === 'close' && stack.length) stack.pop();
  }
}

function normalizeFuzzyQuery(query: string): string {
  return query.toLowerCase().replace(/[\s_\-]+/g, ' ').trim();
}

function buildFuzzyPattern(query: string): RegExp {
  const parts = query
    .toLowerCase()
    .split(/[\s_\-]+/)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(Boolean);
  if (!parts.length) return /(?!)/;
  return new RegExp(parts.join('.'), 'i');
}

function fuzzyElementScore(el: AppElement, normQuery: string, pattern: RegExp): number {
  const nq = normQuery.trim();
  if (!nq) return 0;
  const id = el.id?.toLowerCase() ?? '';
  const name = el.name?.toLowerCase() ?? '';
  const text = el.text?.toLowerCase() ?? '';
  const lt = el.labelText?.toLowerCase() ?? '';
  const tit = el.title?.toLowerCase() ?? '';

  const scores: number[] = [0];
  if (id && id === nq) scores.push(1.0);
  if (name && name === nq) scores.push(0.95);
  if (id && (id.includes(nq) || pattern.test(el.id!))) scores.push(0.8);
  if (name && (name.includes(nq) || pattern.test(el.name!))) scores.push(0.75);
  if (text && (text.includes(nq) || pattern.test(el.text || ''))) scores.push(0.6);
  if (lt && (lt.includes(nq) || pattern.test(el.labelText || ''))) scores.push(0.6);
  if (tit && (tit.includes(nq) || pattern.test(el.title || ''))) scores.push(0.55);
  return Math.max(...scores);
}

export class AppSourceIndexer implements AppSourceIndex {
  elements: AppElement[] = [];

  constructor() {}

  async buildIndex(
    sourceDirs: Map<string, string>,
    appConfigs: Array<{ name: string; app: string; fileTypes: string[] }>,
  ): Promise<void> {
    this.elements = [];
    for (const cfg of appConfigs) {
      const absDir = sourceDirs.get(cfg.name);
      if (!absDir || !fs.existsSync(absDir)) continue;
      const files: string[] = [];
      walkRecursive(absDir, files);
      for (const filePath of files) {
        const rel = path.relative(absDir, filePath).split(path.sep).join('/');
        if (!matchesFileTypes(rel, cfg.fileTypes)) continue;
        this.scanFile(filePath, rel, cfg.app);
      }
    }
  }

  private pushElement(el: AppElement): void {
    this.elements.push(el);
  }

  private makeElement(
    base: Omit<AppElement, 'stabilityScore' | 'stabilityReason'>,
    stabOverrides?: { stabilityScore: number; stabilityReason: string },
  ): AppElement {
    const comp = stabOverrides ?? scoreStability(base);
    return {
      ...base,
      stabilityScore: comp.stabilityScore,
      stabilityReason: comp.stabilityReason,
    };
  }

  private scanFile(absolutePath: string, relativePath: string, app: string): void {
    const context = deriveContext(absolutePath, app);
    const raw = fs.readFileSync(absolutePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const fileFormStack: string[] = [];
    const labelByFor = new Map<string, string>();

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];
      extractLabelForMap(line, labelByFor);

      const stackBeforeLine = [...fileFormStack];
      const parentAt = (charIdx: number): string | undefined => {
        const st = formStackBeforePos(line, charIdx, stackBeforeLine);
        return st.length ? st[st.length - 1] : undefined;
      };

      this.extractSelectbox(line, relativePath, lineNum, context, app, parentAt(0), labelByFor);
      this.extractTwigFormWidget(line, relativePath, lineNum, context, app, parentAt(0));
      this.extractHtmlTags(line, relativePath, lineNum, context, app, labelByFor, parentAt);
      this.extractLabelInline(line, relativePath, lineNum, context, app, parentAt, labelByFor);

      applyFormEventsToStack(line, fileFormStack);
    }
  }

  private extractLabelInline(
    line: string,
    sourceFile: string,
    sourceLine: number,
    context: string,
    app: string,
    parentAt: (charIdx: number) => string | undefined,
    labelByFor: Map<string, string>,
  ): void {
    const re = /<label\b[^>]*>([\s\S]*?)<\/label>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      const inner = m[1];
      const inpIdx = inner.search(/<input\b/i);
      if (inpIdx === -1) continue;
      const textPart = inner.slice(0, inpIdx).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (!textPart) continue;
      const tagRest = inner.slice(inpIdx);
      const endTag = /^(<input\b[^>]*>)/i.exec(tagRest);
      if (!endTag) continue;
      const attrs = parseAttrsFromTag(endTag[1]);
      const id = attrs.id;
      const parentForm = parentAt(m.index);
      const synthetic = this.makeElement({
        id,
        name: attrs.name,
        type:
          attrs.type === 'checkbox'
            ? 'checkbox'
            : attrs.type === 'radio'
              ? 'radio'
              : 'input',
        inputType: attrs.type || 'text',
        classes: parseClassAttr(attrs.class),
        sourceFile,
        sourceLine,
        context,
        app,
        parentForm,
        labelText: textPart,
      });
      if (id) labelByFor.set(id, textPart);
      this.pushElement(synthetic);
    }
  }

  private extractSelectbox(
    line: string,
    sourceFile: string,
    sourceLine: number,
    context: string,
    app: string,
    parentForm: string | undefined,
    labelByFor: Map<string, string>,
  ): void {
    const re1 = /\bselectbox1\s*\(\s*(["'])((?:\\\1|(?!\1).)*?)\1/gi;
    let m1: RegExpExecArray | null;
    while ((m1 = re1.exec(line)) !== null) {
      const name = stripQuotes(m1[2]);
      let id = name;
      const seg = line.slice(m1.index);
      const idAttr = /\bid\s*=\s*(["'])((?:\\\1|(?!\1).)*?)\1/i.exec(seg);
      if (idAttr) id = idAttr[2];
      const labelText = id ? labelByFor.get(id) : undefined;
      this.pushElement(
        this.makeElement({
          id,
          name,
          type: 'select',
          sourceFile,
          sourceLine,
          context,
          app,
          parentForm,
          labelText,
        }),
      );
    }

    const re2 = /\bselectbox\s*\(\s*(["'])((?:\\\1|(?!\1).)*?)\1/gi;
    let m2: RegExpExecArray | null;
    while ((m2 = re2.exec(line)) !== null) {
      const name = stripQuotes(m2[2]);
      const labelText = labelByFor.get(name);
      this.pushElement(
        this.makeElement({
          id: name,
          name,
          type: 'select',
          sourceFile,
          sourceLine,
          context,
          app,
          parentForm,
          labelText,
        }),
      );
    }
  }

  private extractTwigFormWidget(
    line: string,
    sourceFile: string,
    sourceLine: number,
    context: string,
    app: string,
    parentForm: string | undefined,
  ): void {
    const re = /\{\{\s*form_widget\s*\(\s*(\w+)\.(\w+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      const formName = m[1];
      const fieldName = m[2];
      const id = `${formName.toLowerCase()}_${fieldName}`;
      this.pushElement(
        this.makeElement(
          {
            id,
            name: fieldName,
            type: 'input',
            sourceFile,
            sourceLine,
            context,
            app,
            parentForm,
          },
          { stabilityScore: 1.0, stabilityReason: 'static id' },
        ),
      );
    }
  }

  private extractHtmlTags(
    line: string,
    sourceFile: string,
    sourceLine: number,
    context: string,
    app: string,
    labelByFor: Map<string, string>,
    parentAt: (charIdx: number) => string | undefined,
  ): void {
    const run = (re: RegExp, fn: (mm: RegExpExecArray) => Partial<AppElement> | null): void => {
      const rx = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      let mm: RegExpExecArray | null;
      while ((mm = rx.exec(line)) !== null) {
        const partial = fn(mm);
        if (!partial?.type) continue;
        const id = partial.id;
        const labelText = id ? labelByFor.get(id) : undefined;
        const parentForm = parentAt(mm.index);
        this.pushElement(
          this.makeElement({
            type: partial.type,
            id: partial.id,
            name: partial.name,
            inputType: partial.inputType,
            classes: partial.classes,
            text: partial.text,
            title: partial.title,
            sourceFile,
            sourceLine,
            context,
            app,
            parentForm,
            labelText,
          }),
        );
      }
    };

    run(/<form\b([^>]*)>/gi, (mm) => {
      const attrs = parseAttrsFromTag(mm[0]);
      return {
        id: attrs.id,
        name: attrs.name,
        type: 'form' as const,
        classes: parseClassAttr(attrs.class),
      };
    });

    run(/<input\b([^>]*)>/gi, (mm) => {
      const attrs = parseAttrsFromTag(mm[0]);
      const it = (attrs.type || 'text').toLowerCase();
      let t: AppElement['type'] = 'input';
      if (it === 'checkbox') t = 'checkbox';
      else if (it === 'radio') t = 'radio';
      return {
        id: attrs.id,
        name: attrs.name,
        type: t,
        inputType: attrs.type || 'text',
        classes: parseClassAttr(attrs.class),
        title: attrs.title,
      };
    });

    run(/<select\b([^>]*)>/gi, (mm) => {
      const attrs = parseAttrsFromTag(mm[0]);
      return {
        id: attrs.id,
        name: attrs.name,
        type: 'select' as const,
        classes: parseClassAttr(attrs.class),
      };
    });

    run(/<textarea\b([^>]*)>/gi, (mm) => {
      const attrs = parseAttrsFromTag(mm[0]);
      return {
        id: attrs.id,
        name: attrs.name,
        type: 'textarea' as const,
        classes: parseClassAttr(attrs.class),
      };
    });

    run(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi, (mm) => {
      const attrs = parseAttrsFromTag('<button ' + mm[1] + '>');
      const text = (mm[2] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return {
        id: attrs.id,
        name: attrs.name,
        type: 'button' as const,
        classes: parseClassAttr(attrs.class),
        text: text || undefined,
        title: attrs.title,
      };
    });

    run(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (mm) => {
      const attrs = parseAttrsFromTag('<a ' + mm[1] + '>');
      const text = (mm[2] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return {
        id: attrs.id,
        name: attrs.name,
        type: 'link' as const,
        classes: parseClassAttr(attrs.class),
        text: text || undefined,
        title: attrs.title,
      };
    });

    run(/<img\b([^>]*)>/gi, (mm) => {
      const attrs = parseAttrsFromTag(mm[0]);
      return {
        id: attrs.id,
        name: attrs.name,
        type: 'img' as const,
        classes: parseClassAttr(attrs.class),
        title: attrs.title,
      };
    });

    run(/<table\b([^>]*)>/gi, (mm) => {
      const attrs = parseAttrsFromTag(mm[0]);
      if (!attrs.id && !attrs.name && !attrs.class) return null;
      return {
        id: attrs.id,
        name: attrs.name,
        type: 'table' as const,
        classes: parseClassAttr(attrs.class),
      };
    });

    run(/<div\b([^>]*)>/gi, (mm) => {
      const attrs = parseAttrsFromTag(mm[0]);
      if (!attrs.id && !attrs.name && !attrs.class) return null;
      return {
        id: attrs.id,
        name: attrs.name,
        type: 'div' as const,
        classes: parseClassAttr(attrs.class),
        title: attrs.title,
      };
    });

    run(/<span\b([^>]*)>/gi, (mm) => {
      const attrs = parseAttrsFromTag(mm[0]);
      if (!attrs.id && !attrs.name && !attrs.class) return null;
      return {
        id: attrs.id,
        name: attrs.name,
        type: 'span' as const,
        classes: parseClassAttr(attrs.class),
        title: attrs.title,
      };
    });
  }

  loadFromCache(cachePath: string): boolean {
    try {
      if (!fs.existsSync(cachePath)) return false;
      const j = JSON.parse(fs.readFileSync(cachePath, 'utf8')) as { elements?: AppElement[] };
      if (!j.elements || !Array.isArray(j.elements)) return false;
      this.elements = j.elements;
      return true;
    } catch {
      return false;
    }
  }

  saveToCache(cachePath: string): void {
    const dir = path.dirname(cachePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify({ elements: this.elements }, null, 2), 'utf8');
  }

  findById(id: string): AppElement[] {
    return this.elements.filter((e) => e.id === id);
  }

  findByName(name: string): AppElement[] {
    return this.elements.filter((e) => e.name === name);
  }

  findByText(text: string, type?: string): AppElement[] {
    const t = text.toLowerCase();
    return this.elements.filter((e) => {
      const a = (e.text || '').toLowerCase();
      const b = (e.labelText || '').toLowerCase();
      const match = a.includes(t) || b.includes(t);
      if (!match) return false;
      if (type && e.type !== type) return false;
      return true;
    });
  }

  findByContext(context: string): AppElement[] {
    return this.elements.filter((e) => e.context === context);
  }

  fuzzySearch(query: string, context?: string): AppElement[] {
    const norm = normalizeFuzzyQuery(query);
    const pattern = buildFuzzyPattern(query);
    const scored: Array<{ el: AppElement; score: number }> = [];
    for (const el of this.elements) {
      let s = fuzzyElementScore(el, norm, pattern);
      if (context && el.context === context) {
        s = Math.min(1.0, s + 0.2);
      }
      if (s >= 0.3) scored.push({ el, score: s });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 10).map((x) => x.el);
  }
}
