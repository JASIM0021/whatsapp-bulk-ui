import { apiFetch, API_ENDPOINTS } from '@/config/api';

// ── Upload ────────────────────────────────────────────────────────────────────

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1200; // plenty for a 600px email at 2× density
const RESIZE_OVER_BYTES = 1.5 * 1024 * 1024;
export const DEFAULT_IMAGE_WIDTH = 560;
const INLINE_IMAGE_WIDTH = 240;

export const isImageFile = (f: File) => /^image\/(png|jpe?g|gif|webp)$/i.test(f.type);

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read image'));
    img.src = src;
  });
}

/** Downscales large photos before upload (GIFs are kept as-is to preserve animation). */
async function prepareImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const { naturalWidth: w, naturalHeight: h } = img;
    const isGif = file.type === 'image/gif';
    if (isGif || (w <= MAX_IMAGE_WIDTH && file.size <= RESIZE_OVER_BYTES)) {
      return { blob: file, width: w, height: h };
    }
    const scale = Math.min(1, MAX_IMAGE_WIDTH / w);
    const cw = Math.round(w * scale), ch = Math.round(h * scale);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    canvas.getContext('2d')!.drawImage(img, 0, 0, cw, ch);
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, type, 0.85));
    return { blob: blob && blob.size < file.size ? blob : file, width: cw, height: ch };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Uploads an image and returns its public URL and (possibly downscaled) width. */
export async function uploadImage(file: File): Promise<{ url: string; width: number }> {
  if (!isImageFile(file)) throw new Error(`${file.name}: only PNG, JPEG, GIF or WebP images are supported`);
  const { blob, width } = await prepareImage(file);
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error(`${file.name}: image is larger than 5 MB`);

  const form = new FormData();
  form.append('image', blob, file.name);
  const r = await apiFetch(API_ENDPOINTS.email.uploadImage, { method: 'POST', body: form });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.success) throw new Error(d.error || `${file.name}: upload failed`);
  return { url: d.url, width };
}

/**
 * Uploads an image and returns ready-to-insert email HTML: a centred block,
 * or (inline) a bare <img> that can sit inside a line of text.
 */
export async function uploadImageAsHtml(file: File, inline = false): Promise<string> {
  const { url, width } = await uploadImage(file);
  const alt = file.name.replace(/\.[^.]+$/, '');
  return inline
    ? buildInlineImageHtml(url, Math.min(width, INLINE_IMAGE_WIDTH), alt)
    : buildImageHtml(url, Math.min(width, DEFAULT_IMAGE_WIDTH), alt);
}

const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Email-client-safe image block: wrapper div handles alignment, width attr for Outlook. */
export function buildImageHtml(url: string, width: number, alt = '') {
  return `<div data-nx-img style="text-align:center;margin:16px 0;"><img src="${escAttr(url)}" alt="${escAttr(alt)}" width="${width}" style="display:inline-block;width:${width}px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" /></div>`;
}

export function buildInlineImageHtml(url: string, width: number, alt = '') {
  return `<img src="${escAttr(url)}" alt="${escAttr(alt)}" width="${width}" style="display:inline-block;vertical-align:middle;width:${width}px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;" />`;
}

export const isHttpUrl = (s: string) => /^https?:\/\/\S+$/i.test(s.trim());

// ── Code editor: map a drop point to a caret index ────────────────────────────

const MIRROR_PROPS = [
  'boxSizing', 'width', 'height', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight',
  'textTransform', 'wordSpacing', 'textIndent', 'tabSize',
] as const;

/**
 * Textareas don't expose a caret position for a screen point, so lay an
 * invisible mirror with identical metrics over it and hit-test that instead.
 */
export function caretIndexFromPoint(ta: HTMLTextAreaElement, x: number, y: number): number {
  const rect = ta.getBoundingClientRect();
  const cs = getComputedStyle(ta);
  const mirror = document.createElement('div');
  for (const p of MIRROR_PROPS) mirror.style[p] = cs[p];
  Object.assign(mirror.style, {
    position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, overflow: 'hidden',
    whiteSpace: 'pre-wrap', overflowWrap: 'break-word', borderStyle: 'solid', borderColor: 'transparent',
    opacity: '0', zIndex: '2147483647', pointerEvents: 'auto',
  });
  mirror.textContent = ta.value;
  document.body.appendChild(mirror);
  mirror.scrollTop = ta.scrollTop;

  let idx = ta.value.length;
  try {
    const doc = document as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
    if (doc.caretPositionFromPoint) {
      const pos = doc.caretPositionFromPoint(x, y);
      if (pos && mirror.contains(pos.offsetNode)) idx = pos.offset;
    } else if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      if (range && mirror.contains(range.startContainer)) idx = range.startOffset;
    }
  } finally {
    mirror.remove();
  }
  return snapOutOfTag(ta.value, idx);
}

/** Moves an index that falls inside `<...>` to just after that tag. */
export function snapOutOfTag(html: string, idx: number): number {
  const lastOpen = html.lastIndexOf('<', idx - 1);
  const lastClose = html.lastIndexOf('>', idx - 1);
  if (lastOpen > lastClose) {
    const next = html.indexOf('>', idx);
    return next === -1 ? html.length : next + 1;
  }
  return idx;
}

// ── Preview editor: parse / serialize the raw template ────────────────────────

/** Elements injected by the editor into the preview only (never saved). */
export const EDITOR_ATTR = 'data-nx-editor';

export const editorElements = (doc: Document): Element[] =>
  Array.from(doc.body?.querySelectorAll('*') ?? []).filter(el => !el.hasAttribute(EDITOR_ATTR));

export const parseTemplate = (html: string) => new DOMParser().parseFromString(html, 'text/html');

/** Serializes back in the same shape the user wrote: full document or fragment. */
export function serializeTemplate(doc: Document, original: string): string {
  if (/<html[\s>]/i.test(original)) {
    const doctype = /^\s*<!doctype/i.test(original) ? '<!DOCTYPE html>\n' : '';
    return doctype + doc.documentElement.outerHTML;
  }
  // Fragment: the parser hoists leading <style>/<meta> into <head> — keep them.
  return (doc.head.innerHTML ? doc.head.innerHTML + '\n' : '') + doc.body.innerHTML;
}

export function htmlToFragment(doc: Document, html: string): DocumentFragment {
  const t = doc.createElement('template');
  t.innerHTML = html;
  return t.content;
}

// ── Preview editor: where does a drop land? ───────────────────────────────────

export type DropPos = 'before' | 'after' | 'prepend' | 'append';
export interface DropTarget { el: Element; pos: DropPos }

const CONTAINER_LEAVES = new Set(['BODY', 'TD', 'TH', 'LI']);
const TEXT_BLOCKS = /^(P|H[1-6]|PRE|BLOCKQUOTE)$/;

/**
 * Walks down from <body> to the block nearest the pointer, so a drop lands
 * between paragraphs/blocks (or inside an empty table cell) rather than
 * splitting a line of text.
 */
export function findDropTarget(doc: Document, x: number, y: number): DropTarget {
  const win = doc.defaultView!;
  const isBlock = (el: Element) => {
    if (el.hasAttribute(EDITOR_ATTR) || /^(STYLE|SCRIPT|META|LINK|BR)$/.test(el.tagName)) return false;
    const d = win.getComputedStyle(el).display;
    return d !== 'none' && d !== 'contents' && !d.startsWith('inline');
  };
  const dist = (el: Element) => {
    const r = el.getBoundingClientRect();
    const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
    const dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
    return dx + dy * 2;
  };

  let el: Element = doc.body;
  for (;;) {
    if (el !== doc.body && (el.hasAttribute('data-nx-img') || TEXT_BLOCKS.test(el.tagName))) break;
    const kids = Array.from(el.children).filter(isBlock);
    if (!kids.length) break;
    el = kids.reduce((best, k) => (dist(k) < dist(best) ? k : best), kids[0]);
  }

  const r = el.getBoundingClientRect();
  const top = y < r.top + r.height / 2;
  if (CONTAINER_LEAVES.has(el.tagName) && !el.hasAttribute('data-nx-img')) {
    return { el, pos: top && el.childNodes.length ? 'prepend' : 'append' };
  }
  return { el, pos: top ? 'before' : 'after' };
}

export function insertAt(target: Element, pos: DropPos, node: Node) {
  if (pos === 'before') target.before(node);
  else if (pos === 'after') target.after(node);
  else if (pos === 'prepend') target.prepend(node);
  else target.append(node);
}

/** The movable unit for an image: its alignment wrapper, else its link, else itself. */
export function imageUnit(img: Element): Element {
  const wrap = img.closest('[data-nx-img]');
  if (wrap) return wrap;
  const a = img.parentElement;
  if (a?.tagName === 'A' && a.children.length === 1) return a;
  return img;
}

// ── Preview editor: inline (in-text) positions ────────────────────────────────

/** Caret position at a point, but only when it falls inside real text. */
export function caretRangeAt(doc: Document, x: number, y: number): Range | null {
  let range: Range | null = null;
  const d = doc as Document & { caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
  if (d.caretPositionFromPoint) {
    const pos = d.caretPositionFromPoint(x, y);
    if (pos) { range = doc.createRange(); range.setStart(pos.offsetNode, pos.offset); range.collapse(true); }
  } else if (doc.caretRangeFromPoint) {
    range = doc.caretRangeFromPoint(x, y);
  }
  const node = range?.startContainer;
  if (!range || !node || node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return null;
  const rect = node.parentElement?.getBoundingClientRect();
  if (!rect || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
  return range;
}

/** Serializes the live (edited) preview, stripping everything the editor added. */
export function serializeDisplay(doc: Document, original: string): string {
  const copy = parseTemplate('<!DOCTYPE html>' + doc.documentElement.outerHTML);
  copy.querySelectorAll(`[${EDITOR_ATTR}]`).forEach(el => el.remove());
  copy.querySelectorAll('[data-nx-drop]').forEach(el => el.removeAttribute('data-nx-drop'));
  copy.querySelectorAll('.nx-sel').forEach(el => {
    el.classList.remove('nx-sel');
    if (!el.getAttribute('class')) el.removeAttribute('class');
  });
  copy.body.removeAttribute('contenteditable');
  copy.body.removeAttribute('spellcheck');
  return serializeTemplate(copy, original);
}
