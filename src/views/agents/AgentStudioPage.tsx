import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ReactFlow, ReactFlowProvider, Background, Controls, MiniMap, BackgroundVariant, MarkerType,
  useNodesState, useEdgesState, useReactFlow, type Connection, type Edge, type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ArrowLeft, Save, FlaskConical, Rocket, History, Settings2, RefreshCw, CircleAlert, AlertTriangle,
  CheckCircle2, ChevronUp, X, MousePointerClick, LayoutTemplate, PauseCircle, Radio, Monitor,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import type { AIAgent, AgentDeployment, AgentExecution, AgentGraph, GraphIssue } from '@/types/agent';
import { BASE_VARIABLES, GROUPS, NODE_DEFS, asList, getDef, intentHandle, sampleKeys, type StepConfig } from './studio/catalog';
import { StudioNode, type StudioNodeData } from './studio/StudioNode';
import { DeletableEdge } from './studio/DeletableEdge';
import { Inspector, type VariableOption } from './studio/Inspector';
import { TestPanel } from './studio/TestPanel';
import { RunsPanel } from './studio/RunsPanel';
import { DeployDialog, type DeployChoice } from './studio/DeployDialog';

const nodeTypes = { step: StudioNode };
const edgeTypes = { deletable: DeletableEdge };
const DND_TYPE = 'application/x-nexbotix-step';
const NODE_W = 260;

type StepNode = Node<StudioNodeData>;
type Panel = 'inspector' | 'test' | 'runs' | 'settings' | null;
interface Toast { id: number; kind: 'ok' | 'error' | 'info'; text: string }

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150';

// A flow every new employee starts from: it answers messages with AI.
function starterGraph(): AgentGraph {
  const mk = (id: string, type: string, y: number) => {
    const def = getDef(type)!;
    return { id, type, label: def.title, position: { x: 200, y }, config: { ...def.defaults } };
  };
  return {
    nodes: [mk('trigger', 'trigger_inbound', 40), mk('facts', 'knowledge_rag', 210), mk('ai', 'llm_reasoning', 380), mk('reply', 'action_reply', 550)],
    edges: [
      { id: 'e1', source: 'trigger', target: 'facts' },
      { id: 'e2', source: 'facts', target: 'ai' },
      { id: 'e3', source: 'ai', target: 'reply' },
    ],
  };
}

const toRFNodes = (g: AgentGraph): StepNode[] =>
  (g.nodes || []).map(n => ({
    id: n.id,
    type: 'step',
    position: n.position || { x: 100, y: 100 },
    data: { stepType: n.type === 'action_webhook' ? 'action_http' : n.type, label: n.label, config: n.config || {} },
  }));

const toRFEdges = (g: AgentGraph): Edge[] =>
  (g.edges || []).map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || null, type: 'deletable' }));

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function Studio() {
  const { id: routeId } = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const templateSlug = search.get('template');
  const navigate = useNavigate();
  const rf = useReactFlow();

  const [agentId, setAgentId] = useState<string | null>(routeId ?? null);
  const [meta, setMeta] = useState({ name: 'New AI employee', role: 'AI employee', department: 'general', description: '', avatar: DEFAULT_AVATAR });
  const [settings, setSettings] = useState<StepConfig>({});
  const [status, setStatus] = useState<AIAgent['status']>('draft');
  const [deployment, setDeployment] = useState<AgentDeployment | undefined>();
  const [nodes, setNodes, onNodesChange] = useNodesState<StepNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [issues, setIssues] = useState<GraphIssue[]>([]);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deployOpen, setDeployOpen] = useState(search.get('deploy') === '1');
  const [deployBusy, setDeployBusy] = useState(false);
  const [deployResult, setDeployResult] = useState<{ issues: GraphIssue[]; notes: string[]; error?: string } | null>(null);
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [runStatus, setRunStatus] = useState<Record<string, 'success' | 'failed'>>({});
  const [connectors, setConnectors] = useState<{ id: string; name: string }[]>([]);
  const [eventTypes, setEventTypes] = useState<{ slug: string; title: string }[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const loadedRef = useRef<string | null>(null);

  const toast = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, kind, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), kind === 'error' ? 7000 : 3500);
  }, []);

  // ── Loading ──
  const applyAgent = useCallback((a: AIAgent, fromTemplate = false) => {
    setMeta({ name: a.name, role: a.role || 'AI employee', department: a.department || 'general', description: a.description || '', avatar: a.avatar || DEFAULT_AVATAR });
    setSettings(a.settings || {});
    if (!fromTemplate) {
      setStatus(a.status);
      setDeployment(a.deployment);
    }
    setNodes(toRFNodes(a.graph));
    setEdges(toRFEdges(a.graph));
    setTimeout(() => rf.fitView({ padding: 0.3, maxZoom: 1 }), 60);
  }, [rf, setEdges, setNodes]);

  useEffect(() => {
    const key = routeId ?? `new:${templateSlug ?? ''}`;
    if (loadedRef.current === key || (routeId && loadedRef.current === routeId)) return;
    loadedRef.current = key;
    (async () => {
      setLoading(true);
      try {
        if (routeId) {
          const res = await apiFetch(API_ENDPOINTS.agents.get(routeId));
          const json = await res.json();
          if (!json.success) throw new Error(json.error || 'Employee not found');
          applyAgent(json.data);
          setAgentId(json.data.id);
          setIssues(json.issues || []);
        } else if (templateSlug) {
          const res = await apiFetch(API_ENDPOINTS.agents.templates);
          const json = await res.json();
          const tpl = (json.data || []).find((t: AIAgent) => t.slug === templateSlug);
          if (tpl) { applyAgent(tpl, true); setDirty(true); } else applyAgent({ ...emptyAgent(), graph: starterGraph() }, true);
        } else {
          applyAgent({ ...emptyAgent(), graph: starterGraph() }, true);
          setDirty(true);
        }
      } catch (e) {
        toast('error', e instanceof Error ? e.message : 'Could not load this employee');
      } finally {
        setLoading(false);
      }
    })();
  }, [routeId, templateSlug, applyAgent, toast]);

  useEffect(() => {
    apiFetch(API_ENDPOINTS.connectors.list).then(r => r.json()).then(j => {
      if (j.success) setConnectors((j.data || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
    }).catch(() => {});
    apiFetch(API_ENDPOINTS.calendar.eventTypes).then(r => r.json()).then(j => {
      const list = Array.isArray(j) ? j : j.data;
      if (Array.isArray(list)) setEventTypes((list as { slug: string; title: string; isActive?: boolean }[]).filter(e => e.isActive !== false).map(e => ({ slug: e.slug, title: e.title })));
    }).catch(() => {});
  }, []);

  // ── Graph helpers ──
  const toGraph = useCallback((): AgentGraph => ({
    nodes: nodes.map(n => ({ id: n.id, type: n.data.stepType, label: n.data.label || getDef(n.data.stepType)?.title || 'Step', position: n.position, config: n.data.config || {} })),
    edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || '' })),
  }), [nodes, edges]);

  // Server-side checklist (same rules that gate deploying), debounced.
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.agents.validate, { method: 'POST', body: JSON.stringify(toGraph()) });
        const json = await res.json();
        if (json.success) setIssues(json.data || []);
      } catch { /* keep the last checklist */ }
    }, 500);
    return () => clearTimeout(t);
  }, [nodes, edges, loading, toGraph]);

  const markDirty = () => setDirty(true);

  const issuesByNode = useMemo(() => {
    const m: Record<string, GraphIssue[]> = {};
    for (const i of issues) if (i.nodeId) (m[i.nodeId] ||= []).push(i);
    return m;
  }, [issues]);

  const displayNodes = useMemo(
    () => nodes.map(n => ({ ...n, selected: n.id === selectedId, data: { ...n.data, issues: issuesByNode[n.id], runStatus: runStatus[n.id] } })),
    [nodes, issuesByNode, runStatus, selectedId],
  );

  const displayEdges = useMemo(() => {
    const byId = new Map(nodes.map(n => [n.id, n]));
    return edges.map(e => {
      const src = byId.get(e.source);
      const branch = src && e.sourceHandle ? getDef(src.data.stepType)?.branches?.(src.data.config)?.find(b => b.id === e.sourceHandle) : undefined;
      return { ...e, type: 'deletable', label: branch?.label, markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' } };
    });
  }, [edges, nodes]);

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  const available: DeployChoice = useMemo(() => {
    const c: DeployChoice = { whatsapp: false, chatbot: false, webhook: false, schedule: false };
    for (const n of nodes) {
      const t = n.data.stepType;
      if (t === 'trigger_inbound') {
        const ch = n.data.config?.channel || 'any';
        if (ch === 'any' || ch === 'whatsapp') c.whatsapp = true;
        if (ch === 'any' || ch === 'chatbot') c.chatbot = true;
      }
      if (t === 'trigger_webhook') c.webhook = true;
      if (t === 'trigger_schedule') c.schedule = true;
    }
    return c;
  }, [nodes]);

  // ── Editing ──
  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return;
    setEdges(eds => {
      if (eds.some(e => e.source === c.source && e.target === c.target && (e.sourceHandle || null) === (c.sourceHandle || null))) return eds;
      return [...eds, { id: newId('e'), source: c.source!, target: c.target!, sourceHandle: c.sourceHandle || null, type: 'deletable' }];
    });
    markDirty();
  }, [setEdges]);

  const addStep = useCallback((type: string, position?: { x: number; y: number }) => {
    const def = getDef(type);
    if (!def) return;
    const id = newId(type.split('_')[0]);
    const anchor = selectedId ? nodes.find(n => n.id === selectedId) : nodes[nodes.length - 1];
    let pos = position;
    if (!pos) {
      if (anchor) pos = { x: anchor.position.x, y: anchor.position.y + 170 };
      else {
        const center = rf.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        pos = { x: center.x - NODE_W / 2, y: center.y - 50 };
      }
    }
    const node: StepNode = { id, type: 'step', position: pos, data: { stepType: type, label: def.title, config: JSON.parse(JSON.stringify(def.defaults)) } };
    setNodes(ns => [...ns, node]);
    // Clicking a step while another is selected chains it after that step.
    if (!position && anchor && def.group !== 'trigger') {
      const anchorDef = getDef(anchor.data.stepType);
      const branches = anchorDef?.branches?.(anchor.data.config);
      const used = new Set(edges.filter(e => e.source === anchor.id).map(e => e.sourceHandle || ''));
      const handle = branches ? branches.find(b => !used.has(b.id))?.id : (used.size === 0 ? '' : undefined);
      if (handle !== undefined) {
        setEdges(es => [...es, { id: newId('e'), source: anchor.id, target: id, sourceHandle: handle || null, type: 'deletable' }]);
      }
    }
    setSelectedId(id);
    setPanel('inspector');
    markDirty();
  }, [edges, nodes, rf, selectedId, setEdges, setNodes]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData(DND_TYPE);
    if (!type) return;
    const p = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    addStep(type, { x: p.x - NODE_W / 2, y: p.y - 30 });
  }, [addStep, rf]);

  const updateNode = (nid: string, patch: { label?: string; config?: StepConfig }) => {
    const cur = nodes.find(n => n.id === nid);
    if (cur && patch.config && cur.data.stepType === 'intent_router') remapRouterEdges(nid, cur.data.config, patch.config);
    setNodes(ns => ns.map(n => {
      if (n.id !== nid) return n;
      return { ...n, data: { ...n.data, ...(patch.label !== undefined ? { label: patch.label } : {}), ...(patch.config ? { config: patch.config } : {}) } };
    }));
    markDirty();
  };

  // Keep "Sort by topic" connections attached while topics are renamed.
  const remapRouterEdges = (nid: string, oldCfg: StepConfig, newCfg: StepConfig) => {
    const before = asList(oldCfg.intents).map(intentHandle);
    const after = asList(newCfg.intents).map(intentHandle);
    if (before.join('|') === after.join('|')) return;
    const valid = new Set([...after, 'other']);
    setEdges(es => es.flatMap(e => {
      if (e.source !== nid || !e.sourceHandle || e.sourceHandle === 'other') return [e];
      if (before.length === after.length) {
        const i = before.indexOf(e.sourceHandle);
        return i >= 0 ? [{ ...e, sourceHandle: after[i] }] : [e];
      }
      return valid.has(e.sourceHandle) ? [e] : [];
    }));
  };

  const deleteNode = (nid: string) => {
    setNodes(ns => ns.filter(n => n.id !== nid));
    setEdges(es => es.filter(e => e.source !== nid && e.target !== nid));
    setSelectedId(null);
    setPanel(null);
    markDirty();
  };

  const duplicateNode = (nid: string) => {
    const n = nodes.find(x => x.id === nid);
    if (!n) return;
    const id = newId('copy');
    setNodes(ns => [...ns, { ...n, id, selected: false, position: { x: n.position.x + 40, y: n.position.y + 40 }, data: { ...n.data, label: `${n.data.label} (copy)`, config: JSON.parse(JSON.stringify(n.data.config)) } }]);
    setSelectedId(id);
    markDirty();
  };

  const focusNode = (nid?: string) => {
    if (!nid) return;
    setSelectedId(nid);
    setPanel('inspector');
    rf.fitView({ nodes: [{ id: nid }], duration: 400, maxZoom: 1.1, padding: 0.6 });
  };

  // ── Saving, testing, deploying ──
  const save = useCallback(async (quiet = false): Promise<string | null> => {
    if (!meta.name.trim()) { toast('error', 'Give this employee a name first.'); return null; }
    setSaving(true);
    try {
      const payload = { ...meta, channels: Object.entries(available).filter(([, v]) => v).map(([k]) => k), graph: toGraph(), settings };
      const res = await apiFetch(agentId ? API_ENDPOINTS.agents.update(agentId) : API_ENDPOINTS.agents.create, {
        method: agentId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) { toast('error', json.error || 'Could not save'); return null; }
      const saved: AIAgent = json.data;
      setDirty(false);
      setStatus(saved.status);
      setDeployment(saved.deployment);
      if (!agentId) {
        setAgentId(saved.id);
        loadedRef.current = saved.id;
        navigate(`/studio/${saved.id}`, { replace: true });
      }
      if (!quiet) toast('ok', status === 'active' ? 'Saved. The live employee now uses this flow.' : 'Saved as a draft.');
      return saved.id;
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Could not save');
      return null;
    } finally {
      setSaving(false);
    }
  }, [agentId, available, meta, navigate, settings, status, toGraph, toast]);

  const runTest = async (input: { inputText: string; variables?: Record<string, unknown>; history: { role: string; content: string }[] }) => {
    const id = dirty || !agentId ? await save(true) : agentId;
    if (!id) return null;
    try {
      const res = await apiFetch(API_ENDPOINTS.agents.test(id), { method: 'POST', body: JSON.stringify(input) });
      const json = await res.json();
      if (!json.success) { toast('error', json.error || 'Test failed'); return null; }
      const exec: AgentExecution = json.data;
      const marks: Record<string, 'success' | 'failed'> = {};
      exec.stepLogs.forEach(s => { marks[s.nodeId] = s.status === 'failed' ? 'failed' : 'success'; });
      setRunStatus(marks);
      return exec;
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Test failed');
      return null;
    }
  };

  const deploy = async (choice: DeployChoice) => {
    setDeployBusy(true);
    setDeployResult(null);
    try {
      const id = dirty || !agentId ? await save(true) : agentId;
      if (!id) return;
      const res = await apiFetch(API_ENDPOINTS.agents.deploy(id), { method: 'POST', body: JSON.stringify(choice) });
      const json = await res.json();
      const data = json.data || {};
      if (!json.success) {
        setDeployResult({ issues: data.issues || [], notes: data.notes || [], error: json.error });
        return;
      }
      setStatus(data.agent.status);
      setDeployment(data.agent.deployment);
      setDeployResult({ issues: [], notes: data.notes || [] });
      const where = [choice.whatsapp && 'WhatsApp', choice.chatbot && 'website chat', choice.webhook && 'webhook', choice.schedule && 'schedule'].filter(Boolean).join(', ');
      toast('ok', `Live on ${where}.`);
      if (!choice.webhook && !(data.notes || []).length) setDeployOpen(false);
    } catch (e) {
      setDeployResult({ issues: [], notes: [], error: e instanceof Error ? e.message : 'Deploy failed' });
    } finally {
      setDeployBusy(false);
    }
  };

  const pause = async () => {
    if (!agentId) return;
    setDeployBusy(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.agents.pause(agentId), { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setStatus('paused');
        setDeployOpen(false);
        toast('info', 'Paused. It no longer answers anyone until you deploy it again.');
      } else toast('error', json.error || 'Could not pause');
    } finally {
      setDeployBusy(false);
    }
  };

  // Ctrl/Cmd+S saves; leaving with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
    };
    const onUnload = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onUnload);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('beforeunload', onUnload); };
  }, [dirty, save]);

  const goBack = () => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) return;
    navigate('/agents');
  };

  // ── Variables offered in the selected step's text fields ──
  const variables: VariableOption[] = useMemo(() => {
    if (!selectedId) return [];
    const parents = new Map<string, string[]>();
    edges.forEach(e => parents.set(e.target, [...(parents.get(e.target) || []), e.source]));
    const seen = new Set<string>();
    const stack = [...(parents.get(selectedId) || [])];
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      stack.push(...(parents.get(id) || []));
    }
    const out: VariableOption[] = [];
    const add = (key: string, label: string, from: string) => { if (key && !out.some(o => o.key === key)) out.push({ key, label, from }); };
    nodes.filter(n => seen.has(n.id)).forEach(n => {
      const def = getDef(n.data.stepType);
      if (!def) return;
      const from = n.data.label || def.title;
      if (n.data.stepType === 'trigger_webhook') sampleKeys(n.data.config.sample).forEach(k => add(k, 'From the webhook data', from));
      if (n.data.stepType === 'set_variable') add(n.data.config.name, 'Saved value', from);
      if (n.data.stepType === 'llm_reasoning' && n.data.config.output_var) add(n.data.config.output_var, 'AI answer', from);
      def.outputs.forEach(o => add(o.key, o.label, from));
    });
    BASE_VARIABLES.forEach(v => add(v.key, v.label, 'every flow'));
    return out;
  }, [selectedId, nodes, edges]);

  const selected = nodes.find(n => n.id === selectedId);
  const firstTrigger = nodes.find(n => getDef(n.data.stepType)?.group === 'trigger');
  const liveWhere = deployment ? [deployment.whatsapp && 'WhatsApp', deployment.chatbot && 'Website chat', deployment.webhook && 'Webhook', deployment.schedule && 'Schedule'].filter(Boolean).join(' · ') : '';

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-950 text-gray-100">
      {/* The site's support chat bubble would cover the step palette here. */}
      <style>{'#nexbotix-chatbot-host{display:none!important}'}</style>
      {/* Header */}
      <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-800 bg-gray-900/90 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" onClick={goBack} title="Back to AI employees" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"><ArrowLeft size={18} /></button>
          <img src={meta.avatar} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <input
              value={meta.name}
              onChange={e => { setMeta(m => ({ ...m, name: e.target.value })); markDirty(); }}
              aria-label="Employee name"
              className="w-[220px] truncate rounded bg-transparent px-1 text-[14px] font-bold text-white hover:bg-gray-800 focus:bg-gray-800 focus:outline-none"
            />
            <div className="flex items-center gap-2 px-1 text-[11px]">
              {status === 'active' ? (
                <span className="flex items-center gap-1 text-emerald-400"><Radio size={11} className="animate-pulse" /> Live{liveWhere ? ` · ${liveWhere}` : ''}</span>
              ) : status === 'paused' ? (
                <span className="flex items-center gap-1 text-amber-400"><PauseCircle size={11} /> Paused</span>
              ) : (
                <span className="text-gray-400">Draft · not live yet</span>
              )}
              {dirty && <span className="text-gray-500">· unsaved changes</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <HeaderBtn active={panel === 'settings'} onClick={() => { setSelectedId(null); setPanel(panel === 'settings' ? null : 'settings'); }} icon={<Settings2 size={14} />} label="Settings" />
          <HeaderBtn active={panel === 'runs'} disabled={!agentId} onClick={() => setPanel(panel === 'runs' ? null : 'runs')} icon={<History size={14} />} label="Runs" />
          <HeaderBtn active={panel === 'test'} onClick={() => setPanel(panel === 'test' ? null : 'test')} icon={<FlaskConical size={14} />} label="Test" />
          <button type="button" onClick={() => save()} disabled={saving} className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-3 py-1.5 text-[12px] font-semibold text-gray-100 hover:bg-gray-800 disabled:opacity-50">
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />} Save
          </button>
          <button
            type="button"
            onClick={() => { setDeployResult(null); setDeployOpen(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-[12px] font-bold text-white hover:bg-emerald-500"
          >
            <Rocket size={13} /> {status === 'active' ? 'Live settings' : 'Deploy'}
          </button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Palette */}
        <aside className="z-10 w-60 shrink-0 space-y-5 overflow-y-auto border-r border-gray-800 bg-gray-900/70 p-3">
          <p className="rounded-xl bg-gray-800/60 p-2.5 text-[11px] leading-snug text-gray-400">
            <MousePointerClick size={12} className="mb-0.5 mr-1 inline text-emerald-400" />
            Drag a step onto the canvas, or click it to add it after the selected step. Connect steps by dragging from a dot at the bottom of one step to another step.
          </p>
          {GROUPS.map(g => (
            <div key={g.id}>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-300">{g.title}</h4>
              <p className="mb-2 text-[10px] text-gray-500">{g.hint}</p>
              <div className="space-y-1.5">
                {NODE_DEFS.filter(d => d.group === g.id).map(d => {
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.type}
                      type="button"
                      draggable
                      onDragStart={e => { e.dataTransfer.setData(DND_TYPE, d.type); e.dataTransfer.effectAllowed = 'move'; }}
                      onClick={() => addStep(d.type)}
                      title={d.description}
                      className="flex w-full cursor-grab items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 px-2.5 py-2 text-left text-[12px] text-gray-200 hover:border-gray-600 active:cursor-grabbing"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg" style={{ background: `${d.accent}22`, color: d.accent }}><Icon size={13} /></span>
                      {d.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Canvas */}
        <div className="relative h-full flex-1" onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }} onDrop={onDrop}>
          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={ch => { onNodesChange(ch); if (ch.some(c => c.type === 'position' && c.dragging === false || c.type === 'remove')) markDirty(); }}
            onEdgesChange={ch => { onEdgesChange(ch); if (ch.some(c => c.type === 'remove')) markDirty(); }}
            onNodesDelete={del => { if (del.some(d => d.id === selectedId)) { setSelectedId(null); setPanel(null); } }}
            onConnect={onConnect}
            onNodeClick={(_, n) => { setSelectedId(n.id); setPanel('inspector'); }}
            onPaneClick={() => { setSelectedId(null); if (panel === 'inspector') setPanel(null); }}
            deleteKeyCode={['Backspace', 'Delete']}
            defaultEdgeOptions={{ type: 'deletable' }}
            connectionLineStyle={{ stroke: '#34d399', strokeWidth: 2 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.2}
            maxZoom={1.6}
            className="bg-gray-950"
          >
            <Background color="#1f2937" gap={22} size={1.5} variant={BackgroundVariant.Dots} />
            <Controls className="!rounded-xl !border !border-gray-800 [&>button]:!border-gray-800 [&>button]:!bg-gray-900 [&>button]:!fill-gray-300" />
            <MiniMap style={{ width: 150, height: 96 }} pannable zoomable nodeColor={n => getDef((n.data as StudioNodeData).stepType)?.accent ?? '#4b5563'} maskColor="rgba(3,7,18,0.7)" className="!rounded-xl !border !border-gray-800 !bg-gray-900" />
          </ReactFlow>

          {!loading && nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div className="pointer-events-auto max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center shadow-2xl">
                <p className="text-[15px] font-bold text-white">Start with a trigger</p>
                <p className="mt-1.5 text-[13px] text-gray-400">Drag “Message received” from the left to answer customers, or start from a ready-made employee.</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button type="button" onClick={() => { const g = starterGraph(); setNodes(toRFNodes(g)); setEdges(toRFEdges(g)); markDirty(); setTimeout(() => rf.fitView({ padding: 0.3, maxZoom: 1 }), 50); }} className="rounded-xl bg-emerald-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-emerald-500">Use AI auto-reply starter</button>
                  <button type="button" onClick={() => navigate('/agents')} className="flex items-center gap-1 rounded-xl border border-gray-700 px-3 py-2 text-[12px] text-gray-200 hover:bg-gray-800"><LayoutTemplate size={13} /> Templates</button>
                </div>
              </div>
            </div>
          )}

          {/* Checklist */}
          {!loading && nodes.length > 0 && (
            <div className="absolute bottom-4 left-16 z-10 w-[min(400px,calc(100%-260px))]">
              {checklistOpen && issues.length > 0 && (
                <ul className="mb-2 max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900/95 p-2 shadow-2xl">
                  {[...errors, ...warnings].map((i, k) => (
                    <li key={k}>
                      <button type="button" onClick={() => focusNode(i.nodeId)} className="flex w-full gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] hover:bg-gray-800">
                        {i.severity === 'error' ? <CircleAlert size={14} className="mt-px shrink-0 text-red-400" /> : <AlertTriangle size={14} className="mt-px shrink-0 text-amber-400" />}
                        <span className="text-gray-200">{i.message}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setChecklistOpen(o => !o)}
                className={`flex w-full items-center justify-between rounded-full border px-4 py-2 text-[12px] font-semibold shadow-xl ${
                  errors.length ? 'border-red-500/40 bg-red-950/80 text-red-200' : warnings.length ? 'border-amber-500/40 bg-amber-950/80 text-amber-100' : 'border-emerald-500/40 bg-emerald-950/80 text-emerald-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  {errors.length ? <CircleAlert size={14} /> : warnings.length ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                  {errors.length
                    ? `${errors.length} thing${errors.length > 1 ? 's' : ''} to fix before deploying`
                    : warnings.length ? `Ready to deploy · ${warnings.length} suggestion${warnings.length > 1 ? 's' : ''}` : 'Ready to deploy'}
                </span>
                {issues.length > 0 && <ChevronUp size={14} className={checklistOpen ? '' : 'rotate-180'} />}
              </button>
            </div>
          )}
        </div>

        {/* Right panels */}
        {panel === 'inspector' && selected && (
          <Inspector
            key={selected.id}
            nodeId={selected.id}
            type={selected.data.stepType}
            label={selected.data.label}
            config={selected.data.config}
            issues={issuesByNode[selected.id] || []}
            variables={variables}
            connectors={connectors}
            eventTypes={eventTypes}
            onChange={p => updateNode(selected.id, p)}
            onDelete={() => deleteNode(selected.id)}
            onDuplicate={() => duplicateNode(selected.id)}
            onClose={() => { setSelectedId(null); setPanel(null); }}
          />
        )}
        {panel === 'test' && (
          <TestPanel
            triggerType={firstTrigger?.data.stepType ?? null}
            webhookSample={firstTrigger?.data.stepType === 'trigger_webhook' ? String(firstTrigger.data.config.sample || '{}') : '{}'}
            onRun={runTest}
            onClose={() => { setPanel(null); setRunStatus({}); }}
          />
        )}
        {panel === 'runs' && agentId && <RunsPanel agentId={agentId} onClose={() => setPanel(null)} />}
        {panel === 'settings' && (
          <SettingsPanel
            meta={meta}
            instructions={String(settings.customInstruction || '')}
            onMeta={m => { setMeta(prev => ({ ...prev, ...m })); markDirty(); }}
            onInstructions={v => { setSettings(s => ({ ...s, customInstruction: v })); markDirty(); }}
            onClose={() => setPanel(null)}
          />
        )}
      </div>

      {deployOpen && (
        <DeployDialog
          status={status}
          deployment={deployment}
          available={available}
          errors={errors}
          result={deployResult}
          busy={deployBusy}
          onDeploy={deploy}
          onPause={pause}
          onClose={() => setDeployOpen(false)}
        />
      )}

      {/* Small screens */}
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-gray-950 p-8 text-center md:hidden">
        <Monitor size={32} className="text-emerald-400" />
        <p className="text-[15px] font-semibold text-white">The studio needs a bigger screen</p>
        <p className="text-[13px] text-gray-400">Open it on a laptop or desktop to build and edit AI employees.</p>
        <button type="button" onClick={() => navigate('/agents')} className="rounded-xl border border-gray-700 px-4 py-2 text-[13px] text-gray-200">Back to AI employees</button>
      </div>

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] space-y-2" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex max-w-sm items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] shadow-2xl ${
            t.kind === 'error' ? 'border-red-500/40 bg-red-950 text-red-100' : t.kind === 'ok' ? 'border-emerald-500/40 bg-emerald-950 text-emerald-100' : 'border-gray-700 bg-gray-900 text-gray-100'
          }`}>
            <span className="flex-1">{t.text}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))}><X size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function emptyAgent(): AIAgent {
  return {
    id: '', name: 'New AI employee', role: 'AI employee', department: 'general', description: '', avatar: DEFAULT_AVATAR,
    status: 'draft', channels: [], graph: { nodes: [], edges: [] }, metrics: { totalRuns: 0, successfulRuns: 0, failedRuns: 0, avgResponseTimeMs: 0 },
    createdAt: '', updatedAt: '',
  };
}

function HeaderBtn({ active, disabled, onClick, icon, label }: { active?: boolean; disabled?: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? 'Save first' : undefined}
      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[12px] font-medium disabled:opacity-40 ${active ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
    >
      {icon} {label}
    </button>
  );
}

function SettingsPanel({ meta, instructions, onMeta, onInstructions, onClose }: {
  meta: { name: string; role: string; description: string; avatar: string };
  instructions: string;
  onMeta: (m: Partial<{ name: string; role: string; description: string; avatar: string }>) => void;
  onInstructions: (v: string) => void;
  onClose: () => void;
}) {
  const input = 'w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-[13px] text-gray-100 focus:border-emerald-500 focus:outline-none';
  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-gray-800 bg-gray-900/95">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h3 className="text-[13px] font-semibold text-white">Employee settings</h3>
        <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-800 hover:text-white"><X size={16} /></button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <label className="block"><span className="mb-1 block text-[12px] font-medium text-gray-300">Name</span><input className={input} value={meta.name} onChange={e => onMeta({ name: e.target.value })} /></label>
        <label className="block"><span className="mb-1 block text-[12px] font-medium text-gray-300">Job title</span><input className={input} value={meta.role} onChange={e => onMeta({ role: e.target.value })} /></label>
        <label className="block"><span className="mb-1 block text-[12px] font-medium text-gray-300">What it does (for your team)</span><textarea rows={3} className={input} value={meta.description} onChange={e => onMeta({ description: e.target.value })} /></label>
        <label className="block">
          <span className="mb-1 block text-[12px] font-medium text-gray-300">Instructions for every AI step</span>
          <textarea rows={5} className={input} value={instructions} placeholder="Always reply in Hindi if the customer writes in Hindi. Sign off as ‘Team Sharma Sweets’." onChange={e => onInstructions(e.target.value)} />
          <span className="mt-1 block text-[11px] text-gray-500">Added to every “AI writes a reply” step in this flow.</span>
        </label>
        <label className="block"><span className="mb-1 block text-[12px] font-medium text-gray-300">Avatar image URL</span><input className={input} value={meta.avatar} onChange={e => onMeta({ avatar: e.target.value })} /></label>
      </div>
    </aside>
  );
}

export function AgentStudioPage() {
  return (
    <ReactFlowProvider>
      <Studio />
    </ReactFlowProvider>
  );
}
