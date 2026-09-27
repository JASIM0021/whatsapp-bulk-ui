import { useEffect, useRef, useState } from 'react';
import {
  Code2, Eye, ImagePlus, Loader2, X, AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, Trash2, Link2, Maximize2,
} from 'lucide-react';
import {
  EDITOR_ATTR, caretIndexFromPoint, editorElements, findDropTarget, htmlToFragment, imageUnit,
  insertAt, isImageFile, parseTemplate, serializeTemplate, snapOutOfTag, uploadImageAsHtml, DropTarget,
} from './emailImageUtils';

export type EditorViewMode = 'code' | 'preview';

type Align = 'left' | 'center' | 'right';
interface ImgProps {
  width: number;
  fullWidth: boolean;
  height: number;
  autoHeight: boolean;
  align: Align;
  link: string;
  alt: string;
}

interface EditorHandlers {
  value: string;
  selIdx: number | null;
  props: ImgProps | null;
  commit: (fn: (raw: Document, els: Element[]) => Element | void) => number | null;
  decorate: () => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragStart: (e: DragEvent) => void;
  onClick: (e: MouseEvent) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  applyImage: (patch: Partial<ImgProps>) => void;
}

const MOVE_TYPE = 'text/x-nx-move';
const MAX_W = 600;

// Preview-only styles; the element is tagged so it's never saved into the template.
const EDITOR_STYLE = `<style ${EDITOR_ATTR}>
  img { cursor: pointer; }
  img.nx-sel { outline: 2px solid #2563eb !important; outline-offset: 2px; }
  [data-nx-drop="before"] { box-shadow: 0 -3px 0 0 #2563eb !important; }
  [data-nx-drop="after"] { box-shadow: 0 3px 0 0 #2563eb !important; }
  [data-nx-drop="prepend"], [data-nx-drop="append"] { outline: 2px dashed #2563eb !important; outline-offset: -2px; }
</style>`;

function readProps(img: HTMLImageElement): ImgProps {
  const win = img.ownerDocument.defaultView!;
  const wrap = img.closest('[data-nx-img]') as HTMLElement | null;
  const alignSrc = wrap ?? imageUnit(img).parentElement;
  let align = (alignSrc ? win.getComputedStyle(alignSrc).textAlign : 'left') as string;
  if (align === 'start' || align === 'justify' || align === '-webkit-auto') align = 'left';
  if (align === 'end') align = 'right';
  if (align === '-webkit-center') align = 'center';
  const rect = img.getBoundingClientRect();
  return {
    width: parseInt(img.style.width) || Number(img.getAttribute('width')) || Math.round(rect.width),
    fullWidth: img.style.width === '100%',
    height: parseInt(img.style.height) || Number(img.getAttribute('height')) || Math.round(rect.height),
    autoHeight: !img.style.height || img.style.height === 'auto',
    align: (['left', 'center', 'right'].includes(align) ? align : 'left') as Align,
    link: img.closest('a')?.getAttribute('href') ?? '',
    alt: img.getAttribute('alt') ?? '',
  };
}

function writeProps(doc: Document, img: HTMLImageElement, p: ImgProps, alignChanged: boolean) {
  if (p.fullWidth) {
    img.style.width = '100%';
    img.setAttribute('width', String(MAX_W));
  } else {
    img.style.width = `${p.width}px`;
    img.setAttribute('width', String(p.width));
  }
  img.style.maxWidth = '100%';
  if (p.autoHeight) {
    img.style.height = 'auto';
    img.removeAttribute('height');
  } else {
    img.style.height = `${p.height}px`;
    img.setAttribute('height', String(p.height));
  }
  img.setAttribute('alt', p.alt);

  const parent = img.parentElement;
  const link = p.link.trim();
  if (link) {
    let a = parent?.tagName === 'A' ? parent : null;
    if (!a) {
      a = doc.createElement('a');
      a.setAttribute('target', '_blank');
      img.before(a);
      a.append(img);
    }
    a.setAttribute('href', link);
  } else if (parent?.tagName === 'A' && parent.children.length === 1) {
    parent.replaceWith(img);
  }

  if (alignChanged) {
    let wrap = img.closest('[data-nx-img]') as HTMLElement | null;
    if (!wrap) {
      const unit = imageUnit(img);
      if (unit.parentElement?.tagName === 'P') {
        // A <div> can't live inside a <p>; align the paragraph instead.
        (unit.parentElement as HTMLElement).style.textAlign = p.align;
        return;
      }
      wrap = doc.createElement('div');
      wrap.setAttribute('data-nx-img', '');
      wrap.style.margin = '16px 0';
      unit.before(wrap);
      wrap.append(unit);
    }
    wrap.style.textAlign = p.align;
  }
}

export function EmailBodyEditor({ value, onChange, viewMode, onViewModeChange, renderPreview, subject, hint }: {
  value: string;
  onChange: (html: string) => void;
  viewMode: EditorViewMode;
  onViewModeChange: (m: EditorViewMode) => void;
  /** Turns the raw template into what the preview shows (variables filled in). */
  renderPreview: (html: string) => string;
  subject?: string;
  hint?: React.ReactNode;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef(0);
  const dropMarkRef = useRef<Element | null>(null);

  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');
  const [codeDragOver, setCodeDragOver] = useState(false);
  const [selIdx, setSelIdx] = useState<number | null>(null);
  const [props, setProps] = useState<ImgProps | null>(null);

  const frameDoc = () => iframeRef.current?.contentDocument ?? null;

  const uploadAll = async (files: File[]): Promise<string> => {
    const images = files.filter(isImageFile);
    if (images.length < files.length) setError('Only PNG, JPEG, GIF or WebP images can be added.');
    else setError('');
    if (!images.length) return '';
    setUploading(n => n + images.length);
    const parts: string[] = [];
    for (const f of images) {
      try { parts.push(await uploadImageAsHtml(f)); }
      catch (e) { setError(e instanceof Error ? e.message : String(e)); }
      finally { setUploading(n => n - 1); }
    }
    return parts.join('\n');
  };

  // Everything the iframe listeners need, refreshed after every render so the
  // listeners (attached once per iframe load) never see stale state.
  const latest = useRef<EditorHandlers>({
    value, selIdx, props,
    commit: () => null, decorate: () => {}, onDragOver: () => {}, onDrop: () => {},
    onDragStart: () => {}, onClick: () => {}, onKeyDown: () => {}, applyImage: () => {},
  });

  /**
   * Applies an edit to the raw template (never the variable-filled preview),
   * then saves it. Displayed and raw documents share element order, so the
   * preview's element index addresses the same node in the raw template.
   * Returns the new index of the image the mutation returns, if any.
   */
  const commit = (fn: (raw: Document, els: Element[]) => Element | void): number | null => {
    const original = latest.current.value;
    const raw = parseTemplate(original);
    const result = fn(raw, editorElements(raw));
    const next = serializeTemplate(raw, original);
    if (next !== original) onChange(next);
    if (result && result.tagName === 'IMG') {
      const i = editorElements(raw).indexOf(result);
      return i === -1 ? null : i;
    }
    return null;
  };

  const targetIndex = (doc: Document, t: DropTarget) => (t.el === doc.body ? -1 : editorElements(doc).indexOf(t.el));

  const clearDropMark = () => {
    dropMarkRef.current?.removeAttribute('data-nx-drop');
    dropMarkRef.current = null;
  };

  const selectedImg = (): HTMLImageElement | null => {
    const doc = frameDoc();
    if (!doc || selIdx === null) return null;
    const el = editorElements(doc)[selIdx];
    return el?.tagName === 'IMG' ? (el as HTMLImageElement) : null;
  };

  const applyImage = (patch: Partial<ImgProps>) => {
    if (selIdx === null || !props) return;
    const next = { ...props, ...patch };
    setProps(next);
    const idx = selIdx;
    const newIdx = commit((raw, els) => {
      const img = els[idx];
      if (img?.tagName !== 'IMG') return;
      writeProps(raw, img as HTMLImageElement, next, 'align' in patch);
      return img;
    });
    if (newIdx !== null) setSelIdx(newIdx);
  };

  /** Live-resizes the displayed image without saving (slider / drag handle). */
  const previewWidth = (w: number) => {
    const img = selectedImg();
    if (!img) return;
    img.style.width = `${w}px`;
    img.setAttribute('width', String(w));
    positionHandle();
  };

  const moveUnit = (dir: -1 | 1) => {
    if (selIdx === null) return;
    const idx = selIdx;
    const newIdx = commit((_raw, els) => {
      const img = els[idx];
      if (img?.tagName !== 'IMG') return;
      const unit = imageUnit(img);
      const sib = dir < 0 ? unit.previousElementSibling : unit.nextElementSibling;
      if (!sib) return img;
      if (dir < 0) sib.before(unit); else sib.after(unit);
      return img;
    });
    if (newIdx !== null) setSelIdx(newIdx);
  };

  const deleteSelected = () => {
    if (selIdx === null) return;
    const idx = selIdx;
    commit((_raw, els) => {
      const img = els[idx];
      if (img?.tagName === 'IMG') imageUnit(img).remove();
    });
    setSelIdx(null); setProps(null);
  };

  function positionHandle() {
    const doc = frameDoc();
    const handle = doc?.querySelector('[data-nx-handle]') as HTMLElement | null;
    const img = selectedImg();
    if (!doc || !handle || !img) return;
    const r = img.getBoundingClientRect();
    const win = doc.defaultView!;
    handle.style.left = `${r.right + win.scrollX - 7}px`;
    handle.style.top = `${r.bottom + win.scrollY - 7}px`;
  }

  /** Highlights the selected image and adds the drag-to-resize corner handle. */
  const decorate = () => {
    const doc = frameDoc();
    if (!doc?.body) return;
    doc.querySelectorAll('img.nx-sel').forEach(el => el.classList.remove('nx-sel'));
    doc.querySelector('[data-nx-handle]')?.remove();
    const img = selectedImg();
    if (!img) return;
    img.classList.add('nx-sel');

    const handle = doc.createElement('div');
    handle.setAttribute(EDITOR_ATTR, '');
    handle.setAttribute('data-nx-handle', '');
    handle.title = 'Drag to resize';
    Object.assign(handle.style, {
      position: 'absolute', width: '14px', height: '14px', background: '#2563eb', border: '2px solid #fff',
      borderRadius: '4px', boxShadow: '0 1px 4px rgba(0,0,0,.3)', cursor: 'nwse-resize', zIndex: '9999', touchAction: 'none',
    });
    handle.addEventListener('pointerdown', e => {
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startW = img.getBoundingClientRect().width;
      const maxW = Math.min(MAX_W, doc.body.clientWidth);
      let w = Math.round(startW);
      const move = (ev: PointerEvent) => {
        w = Math.max(24, Math.min(maxW, Math.round(startW + ev.clientX - startX)));
        img.style.width = `${w}px`;
        img.setAttribute('width', String(w));
        if (latest.current.props?.autoHeight !== false) img.style.height = 'auto';
        positionHandle();
        setProps(p => (p ? { ...p, width: w, fullWidth: false } : p));
      };
      const up = () => {
        handle.removeEventListener('pointermove', move);
        latest.current.applyImage({ width: w, fullWidth: false });
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up, { once: true });
    });
    doc.body.appendChild(handle);
    positionHandle();
  };

  const onDragOver = (e: DragEvent) => {
    const types = Array.from(e.dataTransfer?.types ?? []);
    if (!types.includes('Files') && !types.includes(MOVE_TYPE)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = types.includes(MOVE_TYPE) ? 'move' : 'copy';
    const doc = frameDoc();
    if (!doc) return;
    const t = findDropTarget(doc, e.clientX, e.clientY);
    if (dropMarkRef.current !== t.el) clearDropMark();
    t.el.setAttribute('data-nx-drop', t.pos);
    dropMarkRef.current = t.el;
  };

  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    clearDropMark();
    const doc = frameDoc();
    if (!doc || !e.dataTransfer) return;
    const t = findDropTarget(doc, e.clientX, e.clientY);
    const tIdx = targetIndex(doc, t);

    const moving = e.dataTransfer.getData(MOVE_TYPE);
    if (moving !== '') {
      const unitIdx = Number(moving);
      const newIdx = commit((raw, els) => {
        const unit = els[unitIdx];
        const target = tIdx === -1 ? raw.body : els[tIdx];
        if (!unit || !target || unit === target || unit.contains(target)) return;
        insertAt(target, t.pos, unit);
        return unit.tagName === 'IMG' ? unit : unit.querySelector('img') ?? undefined;
      });
      if (newIdx !== null) setSelIdx(newIdx);
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    const html = await uploadAll(files);
    if (!html) return;
    commit((raw, els) => {
      const target = tIdx === -1 ? raw.body : els[tIdx];
      insertAt(target ?? raw.body, target ? t.pos : 'append', htmlToFragment(raw, html));
    });
  };

  const onDragStart = (e: DragEvent) => {
    const el = e.target as Element | null;
    const doc = frameDoc();
    if (!doc || el?.tagName !== 'IMG' || !e.dataTransfer) return;
    e.dataTransfer.setData(MOVE_TYPE, String(editorElements(doc).indexOf(imageUnit(el))));
    e.dataTransfer.effectAllowed = 'move';
  };

  const onClick = (e: MouseEvent) => {
    const el = e.target as Element | null;
    if (el?.closest('a')) e.preventDefault(); // keep links from navigating the preview
    if (el?.hasAttribute('data-nx-handle')) return;
    const doc = frameDoc();
    if (doc && el?.tagName === 'IMG') {
      setSelIdx(editorElements(doc).indexOf(el));
      setProps(readProps(el as HTMLImageElement));
    } else {
      setSelIdx(null); setProps(null);
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && latest.current.selIdx !== null) {
      e.preventDefault();
      deleteSelected();
    }
  };

  useEffect(() => {
    latest.current = { value, selIdx, props, commit, decorate, onDragOver, onDrop, onDragStart, onClick, onKeyDown, applyImage };
  });

  // Re-highlight when the selection changes without an iframe reload.
  useEffect(() => { latest.current.decorate(); }, [selIdx]);

  const onFrameLoad = () => {
    const doc = frameDoc();
    const win = doc?.defaultView;
    if (!doc || !win) return;
    win.scrollTo(0, scrollRef.current);
    win.addEventListener('scroll', () => { scrollRef.current = win.scrollY; });
    doc.addEventListener('dragover', e => latest.current.onDragOver(e));
    doc.addEventListener('dragleave', e => { if (!e.relatedTarget) clearDropMark(); });
    doc.addEventListener('drop', e => latest.current.onDrop(e));
    doc.addEventListener('dragstart', e => latest.current.onDragStart(e));
    doc.addEventListener('click', e => latest.current.onClick(e));
    doc.addEventListener('keydown', e => latest.current.onKeyDown(e));
    latest.current.decorate();
  };

  // ── Code mode ───────────────────────────────────────────────────────────────

  const insertIntoCode = async (files: File[], index: number) => {
    const html = await uploadAll(files);
    if (!html) return;
    const cur = latest.current.value;
    const i = Math.min(index, cur.length);
    onChange(`${cur.slice(0, i)}\n${html}\n${cur.slice(i)}`);
  };

  const onCodeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    setCodeDragOver(false);
    if (Array.from(e.dataTransfer.types).includes(MOVE_TYPE)) { e.preventDefault(); return; }
    const files = Array.from(e.dataTransfer.files);
    if (!files.length || !taRef.current) return;
    e.preventDefault();
    insertIntoCode(files, caretIndexFromPoint(taRef.current, e.clientX, e.clientY));
  };

  const onCodePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(e.clipboardData.files).filter(isImageFile);
    if (!files.length) return;
    e.preventDefault();
    insertIntoCode(files, snapOutOfTag(value, e.currentTarget.selectionStart));
  };

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!files.length) return;
    if (viewMode === 'code') {
      const ta = taRef.current;
      insertIntoCode(files, snapOutOfTag(value, ta ? ta.selectionStart : value.length));
      return;
    }
    // Preview: place after the selected image, otherwise at the end.
    const idx = selIdx;
    const html = await uploadAll(files);
    if (!html) return;
    commit((raw, els) => {
      const img = idx !== null ? els[idx] : null;
      if (img?.tagName === 'IMG') imageUnit(img).after(htmlToFragment(raw, html));
      else raw.body.append(htmlToFragment(raw, html));
    });
  };

  const switchMode = (m: EditorViewMode) => {
    if (m === 'code') { setSelIdx(null); setProps(null); }
    onViewModeChange(m);
  };

  const iconBtn = 'p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-white disabled:opacity-40';

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">{hint}</div>
        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          {uploading > 0 && (
            <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
              <Loader2 size={12} className="animate-spin" />Uploading {uploading}…
            </span>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" multiple className="hidden" onChange={onPickFiles} />
          <button onClick={() => fileRef.current?.click()} title="Insert image (or drag & drop / paste)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700">
            <ImagePlus size={12} />Image
          </button>
          <div className="flex bg-gray-200 rounded-lg p-0.5 gap-0.5">
            <button onClick={() => switchMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Code2 size={12} />Code
            </button>
            <button onClick={() => switchMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Eye size={12} />Preview
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-red-50 border-b border-red-100 text-xs text-red-700">
          <span>{error}</span>
          <button onClick={() => setError('')} className="p-0.5 hover:bg-red-100 rounded"><X size={12} /></button>
        </div>
      )}

      {viewMode === 'code' ? (
        <div
          className="relative"
          onDragOver={e => { if (Array.from(e.dataTransfer.types).includes('Files')) { e.preventDefault(); setCodeDragOver(true); } }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setCodeDragOver(false); }}
          onDrop={onCodeDrop}
        >
          <div className="px-4 py-2 bg-slate-900 flex items-center gap-2">
            <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /><span className="w-3 h-3 rounded-full bg-yellow-500" /><span className="w-3 h-3 rounded-full bg-green-500" /></div>
            <span className="text-slate-400 text-xs ml-2 font-mono">email.html</span>
            <span className="ml-auto text-slate-500 text-[10px] hidden sm:inline">Drop or paste an image to insert it at that spot</span>
          </div>
          <textarea ref={taRef} value={value} onChange={e => onChange(e.target.value)} onPaste={onCodePaste} rows={14}
            className="w-full px-4 py-4 bg-slate-950 text-green-400 text-xs font-mono focus:outline-none resize-none leading-relaxed block"
            placeholder="Paste your HTML email here…" spellCheck={false} />
          {codeDragOver && (
            <div className="absolute inset-0 top-9 pointer-events-none border-2 border-dashed border-blue-400 bg-blue-500/10 flex items-start justify-center pt-3">
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold shadow">Drop to insert an &lt;img&gt; tag here</span>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="px-4 py-2.5 bg-white border-b border-gray-100 flex items-center gap-2 text-xs text-gray-500">
            <Eye size={12} className="text-blue-500" />
            <span className="font-medium">Live Preview</span>
            {subject && <span className="text-gray-400 truncate">· {subject}</span>}
            <span className="ml-auto text-gray-400 hidden md:inline">Drag images in · click one to resize, align, link or move it</span>
          </div>

          {props && selIdx !== null && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 bg-blue-50/60 border-b border-blue-100 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-500">Width</span>
                <input type="range" min={24} max={MAX_W} value={props.fullWidth ? MAX_W : Math.min(props.width, MAX_W)}
                  onChange={e => { const w = Number(e.target.value); setProps({ ...props, width: w, fullWidth: false }); previewWidth(w); }}
                  onPointerUp={() => applyImage({ width: props.width, fullWidth: false })}
                  onKeyUp={() => applyImage({ width: props.width, fullWidth: false })}
                  className="w-28 accent-blue-600" />
                <input type="number" min={24} max={MAX_W} value={props.fullWidth ? '' : props.width} placeholder="100%"
                  onChange={e => setProps({ ...props, width: Number(e.target.value) || 0, fullWidth: false })}
                  onBlur={() => props.width >= 24 && applyImage({ width: Math.min(props.width, MAX_W), fullWidth: false })}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className="w-16 px-2 py-1 border border-gray-200 rounded-md bg-white tabular-nums" />
                <span className="text-gray-400">px</span>
                <button onClick={() => applyImage({ fullWidth: !props.fullWidth })} title="Full width"
                  className={`p-1.5 rounded-md ${props.fullWidth ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-white'}`}>
                  <Maximize2 size={12} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-500">Height</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={props.autoHeight} onChange={e => applyImage({ autoHeight: e.target.checked })} className="accent-blue-600" />
                  Auto
                </label>
                {!props.autoHeight && (
                  <>
                    <input type="number" min={10} value={props.height}
                      onChange={e => setProps({ ...props, height: Number(e.target.value) || 0 })}
                      onBlur={() => props.height >= 10 && applyImage({ height: props.height })}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                      className="w-16 px-2 py-1 border border-gray-200 rounded-md bg-white tabular-nums" />
                    <span className="text-gray-400">px</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-0.5 bg-white/70 rounded-lg p-0.5">
                {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([a, Icon]) => (
                  <button key={a} onClick={() => applyImage({ align: a })} title={`Align ${a}`}
                    className={`p-1.5 rounded-md ${props.align === a ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-white'}`}>
                    <Icon size={12} />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <Link2 size={12} className="text-gray-400" />
                <input value={props.link} onChange={e => setProps({ ...props, link: e.target.value })}
                  onBlur={() => applyImage({ link: props.link })}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  placeholder="Link URL (optional)" className="w-40 px-2 py-1 border border-gray-200 rounded-md bg-white" />
                <input value={props.alt} onChange={e => setProps({ ...props, alt: e.target.value })}
                  onBlur={() => applyImage({ alt: props.alt })}
                  onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  placeholder="Alt text" className="w-28 px-2 py-1 border border-gray-200 rounded-md bg-white" />
              </div>

              <div className="flex items-center gap-0.5 ml-auto">
                <button onClick={() => moveUnit(-1)} className={iconBtn} title="Move up"><ArrowUp size={13} /></button>
                <button onClick={() => moveUnit(1)} className={iconBtn} title="Move down"><ArrowDown size={13} /></button>
                <button onClick={deleteSelected} className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50" title="Remove image"><Trash2 size={13} /></button>
                <button onClick={() => { setSelIdx(null); setProps(null); }} className={iconBtn} title="Done"><X size={13} /></button>
              </div>
            </div>
          )}

          <div className="relative bg-gray-50" style={{ height: 460 }}>
            <iframe ref={iframeRef} srcDoc={renderPreview(value) + EDITOR_STYLE} onLoad={onFrameLoad}
              className="w-full h-full border-0" title="Email preview" sandbox="allow-same-origin" />
            {uploading > 0 && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center pointer-events-none">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold shadow">
                  <Loader2 size={13} className="animate-spin" />Uploading image…
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
