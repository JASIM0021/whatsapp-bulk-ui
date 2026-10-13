import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { AIAgent, AgentExecution } from '@/types/agent';
import {
  Save,
  Play,
  ArrowLeft,
  Bot,
  Zap,
  Sparkles,
  Mail,
  Calendar,
  Layers,
  Cpu,
  RefreshCw,
  Trash2,
  Settings,
  Send,
} from 'lucide-react';

// ── Custom Node Components ──────────────────────────────────────────────────

function TriggerNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-2xl bg-gray-900 border transition-all duration-200 shadow-xl min-w-[200px] ${
        selected ? 'border-emerald-400 ring-2 ring-emerald-500/30' : 'border-emerald-500/40 hover:border-emerald-400'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
          <Zap size={13} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Trigger</span>
      </div>
      <div className="text-xs font-semibold text-white">{data.label || 'Inbound Trigger'}</div>
      <div className="text-[10px] text-gray-400 mt-0.5 capitalize">{data.config?.channel || 'Any Channel'}</div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-emerald-500 border-2 border-gray-900" />
    </div>
  );
}

function LLMNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-2xl bg-gray-900 border transition-all duration-200 shadow-xl min-w-[220px] ${
        selected ? 'border-blue-400 ring-2 ring-blue-500/30' : 'border-blue-500/40 hover:border-blue-400'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500 border-2 border-gray-900" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
          <Bot size={13} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">AI Reasoning</span>
      </div>
      <div className="text-xs font-semibold text-white">{data.label || 'LLM Agent Logic'}</div>
      <div className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{data.config?.system_prompt || 'Consultative model'}</div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500 border-2 border-gray-900" />
    </div>
  );
}

function InHouseNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-2xl bg-gray-900 border transition-all duration-200 shadow-xl min-w-[220px] ${
        selected ? 'border-teal-400 ring-2 ring-teal-500/30' : 'border-teal-500/40 hover:border-teal-400'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-teal-500 border-2 border-gray-900" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
          <Cpu size={13} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">In-House AI / cURL</span>
      </div>
      <div className="text-xs font-semibold text-white">{data.label || 'Custom Model Connector'}</div>
      <div className="text-[10px] text-gray-400 mt-0.5 truncate">{data.config?.url || 'Proprietary Endpoint'}</div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-teal-500 border-2 border-gray-900" />
    </div>
  );
}

function RouterNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-2xl bg-gray-900 border transition-all duration-200 shadow-xl min-w-[210px] ${
        selected ? 'border-purple-400 ring-2 ring-purple-500/30' : 'border-purple-500/40 hover:border-purple-400'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500 border-2 border-gray-900" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
          <Layers size={13} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Intent Router</span>
      </div>
      <div className="text-xs font-semibold text-white">{data.label || 'Intent Classification'}</div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500 border-2 border-gray-900" />
    </div>
  );
}

function ActionNode({ data, selected }: { data: any; selected?: boolean }) {
  return (
    <div
      className={`px-4 py-3 rounded-2xl bg-gray-900 border transition-all duration-200 shadow-xl min-w-[210px] ${
        selected ? 'border-amber-400 ring-2 ring-amber-500/30' : 'border-amber-500/40 hover:border-amber-400'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-amber-500 border-2 border-gray-900" />
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
          <Sparkles size={13} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Action Tool</span>
      </div>
      <div className="text-xs font-semibold text-white">{data.label || 'Dispatch Action'}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{data.config?.action || 'Channel Dispatch'}</div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-amber-500 border-2 border-gray-900" />
    </div>
  );
}

const nodeTypes = {
  trigger_inbound: TriggerNode,
  trigger_webhook: TriggerNode,
  trigger_schedule: TriggerNode,
  llm_reasoning: LLMNode,
  inhouse_ai: InHouseNode,
  intent_router: RouterNode,
  knowledge_rag: InHouseNode,
  action_reply: ActionNode,
  action_calendar: ActionNode,
  action_whatsapp: ActionNode,
  action_email: ActionNode,
  action_webhook: ActionNode,
};

// ── Main Agent Studio Component ─────────────────────────────────────────────

export function AgentStudioPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const templateSlug = searchParams.get('template');
  const navigate = useNavigate();

  const [agentId, setAgentId] = useState<string | null>(id || null);
  const [agentName, setAgentName] = useState('My Autonomous AI Employee');
  const [agentRole, setAgentRole] = useState('Sales & Support Specialist');
  const [agentDept, setAgentDept] = useState('sales');
  const [agentAvatar, setAgentAvatar] = useState('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150');
  const [isSaving, setIsSaving] = useState(false);

  // Nodes & Edges state
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Simulator Drawer state
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simInput, setSimInput] = useState('');
  const [simMessages, setSimMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string }>>([
    { sender: 'agent', text: 'Hello! I am your AI Employee ready to assist you. Ask me anything to test the flow!', time: 'Now' },
  ]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [executionResult, setExecutionResult] = useState<AgentExecution | null>(null);

  // Load existing agent or template
  useEffect(() => {
    loadAgentData();
  }, [id, templateSlug]);

  const loadAgentData = async () => {
    try {
      if (id) {
        const res = await apiFetch(API_ENDPOINTS.agents.get(id));
        const json = await res.json();
        if (json.success && json.data) {
          populateGraph(json.data);
          return;
        }
      }

      // If template provided or creating default
      const tempRes = await apiFetch(API_ENDPOINTS.agents.templates);
      const tempJson = await tempRes.json();
      if (tempJson.success && Array.isArray(tempJson.data)) {
        const matched = templateSlug
          ? tempJson.data.find((t: any) => t.slug === templateSlug || t.id === templateSlug)
          : tempJson.data[0];
        if (matched) {
          populateGraph(matched);
        }
      }
    } catch (e) {
      console.error('Failed to load studio graph:', e);
    }
  };

  const populateGraph = (data: AIAgent) => {
    setAgentName(data.name || 'Custom AI Worker');
    setAgentRole(data.role || 'Digital Assistant');
    setAgentDept(data.department || 'sales');
    setAgentAvatar(data.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150');

    if (data.graph && Array.isArray(data.graph.nodes)) {
      const rfNodes: Node[] = data.graph.nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position || { x: 100, y: 100 },
        data: { label: n.label, config: n.config, ...n.data },
      }));
      const rfEdges: Edge[] = (data.graph.edges || []).map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: true,
        style: { stroke: '#10b981', strokeWidth: 2 },
      }));
      setNodes(rfNodes);
      setEdges(rfEdges);
    }
  };

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges(eds =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#10b981', strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const handleAddNode = (type: string, label: string, defaultConfig: Record<string, any> = {}) => {
    const newNodeId = `node-${type}-${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type,
      position: { x: 250 + Math.random() * 100, y: 150 + Math.random() * 100 },
      data: {
        label,
        config: defaultConfig,
      },
    };
    setNodes(nds => [...nds, newNode]);
    setSelectedNode(newNode);
  };

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      const graphPayload = {
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.data.label || 'Node',
          position: n.position,
          config: n.data.config || {},
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: (e.label as string) || '',
        })),
      };

      const payload = {
        name: agentName,
        role: agentRole,
        department: agentDept,
        description: `Custom visual flow AI Employee with ${nodes.length} nodes and ${edges.length} connections.`,
        avatar: agentAvatar,
        channels: ['whatsapp', 'chatbot', 'email', 'calendar'],
        graph: graphPayload,
      };

      let res;
      if (agentId) {
        res = await apiFetch(API_ENDPOINTS.agents.update(agentId), {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiFetch(API_ENDPOINTS.agents.create, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      const json = await res.json();
      if (json.success && json.data) {
        setAgentId(json.data.id);
        alert('Workflow saved successfully!');
      } else {
        alert(json.error || 'Failed to save workflow');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunSimulator = async () => {
    if (!simInput.trim()) return;
    const userMsg = simInput.trim();
    setSimInput('');
    setSimMessages(prev => [...prev, { sender: 'user', text: userMsg, time: 'Just now' }]);
    setIsSimulating(true);

    try {
      // If agent is saved, test against backend endpoint; otherwise simulate local graph
      if (agentId) {
        const res = await apiFetch(API_ENDPOINTS.agents.test(agentId), {
          method: 'POST',
          body: JSON.stringify({
            inputText: userMsg,
            triggerType: 'chatbot',
          }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setExecutionResult(json.data);
          const replyText =
            json.data.finalOutput?.ai_response ||
            json.data.finalOutput?.message ||
            'Task executed through flow nodes.';
          setSimMessages(prev => [...prev, { sender: 'agent', text: replyText, time: 'Just now' }]);
        }
      } else {
        // Fast mock execution for unsaved draft
        setTimeout(() => {
          setSimMessages(prev => [
            ...prev,
            {
              sender: 'agent',
              text: `[Draft Flow] Processed '${userMsg}' across ${nodes.length} nodes. Please click 'Save Workflow' to activate 24/7 cloud execution!`,
              time: 'Just now',
            },
          ]);
        }, 600);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/agents')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Back to Marketplace"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Bot size={18} />
            </div>
            <div>
              <input
                type="text"
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
                className="bg-transparent text-sm font-bold text-white focus:outline-none focus:border-b border-emerald-500 px-1"
              />
              <div className="text-[10px] text-gray-400 px-1">{agentRole}</div>
            </div>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSimulatorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold transition-all active:scale-95"
          >
            <Play size={13} />
            <span>Test Simulator</span>
          </button>

          <button
            onClick={handleSaveWorkflow}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            <span>{isSaving ? 'Saving...' : 'Deploy & Save'}</span>
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Node Palette */}
        <aside className="w-64 border-r border-gray-800 bg-gray-900/60 p-4 flex flex-col space-y-5 overflow-y-auto z-10">
          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              1. Inbound Triggers
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() => handleAddNode('trigger_inbound', 'Inbound WhatsApp / Web', { channel: 'any' })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/80 hover:bg-emerald-950/40 hover:border-emerald-500/50 border border-gray-700/60 text-xs text-gray-200 transition-all text-left"
              >
                <Zap size={13} className="text-emerald-400" />
                <span>Inbound Message Trigger</span>
              </button>
              <button
                onClick={() => handleAddNode('trigger_webhook', 'Webhook / API Entry', {})}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/80 hover:bg-emerald-950/40 hover:border-emerald-500/50 border border-gray-700/60 text-xs text-gray-200 transition-all text-left"
              >
                <Zap size={13} className="text-teal-400" />
                <span>External Webhook Trigger</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              2. Intelligence &amp; AI
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() =>
                  handleAddNode('llm_reasoning', 'LLM Consultative Reasoning', {
                    system_prompt: 'You are an autonomous AI employee. Be helpful and professional.',
                  })
                }
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/80 hover:bg-blue-950/40 hover:border-blue-500/50 border border-gray-700/60 text-xs text-gray-200 transition-all text-left"
              >
                <Bot size={13} className="text-blue-400" />
                <span>LLM Reasoning Block</span>
              </button>
              <button
                onClick={() =>
                  handleAddNode('inhouse_ai', 'Custom In-House AI / cURL', {
                    url: '',
                    prompt_prefix: 'Process through proprietary model.',
                  })
                }
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/80 hover:bg-teal-950/40 hover:border-teal-500/50 border border-gray-700/60 text-xs text-gray-200 transition-all text-left"
              >
                <Cpu size={13} className="text-teal-400" />
                <span>In-House AI Engine</span>
              </button>
              <button
                onClick={() =>
                  handleAddNode('intent_router', 'Intent Classifier', {
                    intents: ['pricing', 'demo_booking', 'support'],
                  })
                }
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/80 hover:bg-purple-950/40 hover:border-purple-500/50 border border-gray-700/60 text-xs text-gray-200 transition-all text-left"
              >
                <Layers size={13} className="text-purple-400" />
                <span>Intent Router</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              3. Omni-Channel Actions
            </h4>
            <div className="space-y-1.5">
              <button
                onClick={() => handleAddNode('action_reply', 'Send Channel Response', { channel: 'auto_reply' })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/80 hover:bg-amber-950/40 hover:border-amber-500/50 border border-gray-700/60 text-xs text-gray-200 transition-all text-left"
              >
                <Sparkles size={13} className="text-amber-400" />
                <span>Auto Reply to Prospect</span>
              </button>
              <button
                onClick={() => handleAddNode('action_calendar', 'Book Nexbot Calendar', { action: 'check_and_book' })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/80 hover:bg-purple-950/40 hover:border-purple-500/50 border border-gray-700/60 text-xs text-gray-200 transition-all text-left"
              >
                <Calendar size={13} className="text-purple-400" />
                <span>Nexbot Calendar Booking</span>
              </button>
              <button
                onClick={() => handleAddNode('action_email', 'Send Formatted Email', {})}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-800/80 hover:bg-sky-950/40 hover:border-sky-500/50 border border-gray-700/60 text-xs text-gray-200 transition-all text-left"
              >
                <Mail size={13} className="text-sky-400" />
                <span>Dispatch Email Message</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Center Flow Canvas */}
        <div className="flex-1 h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-950"
          >
            <Background color="#374151" gap={24} size={1.5} variant={BackgroundVariant.Dots} />
            <Controls className="bg-gray-900 border border-gray-800 fill-white text-white rounded-xl" />
            <MiniMap
              nodeColor="#10b981"
              maskColor="rgba(0,0,0,0.7)"
              className="bg-gray-900 border border-gray-800 rounded-xl"
            />
          </ReactFlow>
        </div>

        {/* Right Inspector Drawer (Node Config) */}
        {selectedNode && (
          <aside className="w-80 border-l border-gray-800 bg-gray-900/90 backdrop-blur-md p-5 flex flex-col space-y-4 z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings size={15} className="text-emerald-400" />
                <h3 className="text-xs font-bold text-white">Node Properties</h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-lg text-gray-500 hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 font-medium mb-1">Block Label</label>
                <input
                  type="text"
                  value={(selectedNode.data as any)?.label || ''}
                  onChange={e => {
                    const newLabel = e.target.value;
                    setNodes(nds =>
                      nds.map(n => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label: newLabel } } : n))
                    );
                    setSelectedNode(prev => (prev ? { ...prev, data: { ...prev.data, label: newLabel } } : null));
                  }}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* System Prompt for LLM Nodes */}
              {selectedNode.type === 'llm_reasoning' && (
                <div>
                  <label className="block text-gray-400 font-medium mb-1">System Instructions / Persona</label>
                  <textarea
                    rows={6}
                    value={(selectedNode.data as any)?.config?.system_prompt || ''}
                    onChange={e => {
                      const newPrompt = e.target.value;
                      setNodes(nds =>
                        nds.map(n =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, config: { ...(n.data as any).config, system_prompt: newPrompt } } }
                            : n
                        )
                      );
                      setSelectedNode(prev =>
                        prev
                          ? {
                              ...prev,
                              data: { ...prev.data, config: { ...(prev.data as any).config, system_prompt: newPrompt } },
                            }
                          : null
                      );
                    }}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-gray-200 focus:outline-none focus:border-emerald-500 resize-none font-mono text-[11px]"
                  />
                </div>
              )}

              {/* In-House AI Endpoint */}
              {selectedNode.type === 'inhouse_ai' && (
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Proprietary AI / Custom Endpoint</label>
                  <input
                    type="text"
                    placeholder="https://your-api.company.com/v1/predict"
                    value={(selectedNode.data as any)?.config?.url || ''}
                    onChange={e => {
                      const newUrl = e.target.value;
                      setNodes(nds =>
                        nds.map(n =>
                          n.id === selectedNode.id
                            ? { ...n, data: { ...n.data, config: { ...(n.data as any).config, url: newUrl } } }
                            : n
                        )
                      );
                    }}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                    setSelectedNode(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors font-medium"
                >
                  <Trash2 size={13} />
                  <span>Delete Block</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── LIVE SIMULATOR SLIDE-OVER ── */}
      {simulatorOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-gray-900/95 border-l border-gray-800 shadow-2xl z-40 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play size={16} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Live Execution Simulator</h3>
            </div>
            <button onClick={() => setSimulatorOpen(false)} className="text-gray-400 hover:text-white">
              &times;
            </button>
          </div>

          {/* Chat Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {simMessages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 border border-gray-700/80 text-gray-200'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 px-1">{m.time}</span>
              </div>
            ))}
          </div>

          {/* Step Execution Logs */}
          {executionResult?.stepLogs && (
            <div className="p-3 bg-gray-950/80 border-t border-gray-800 max-h-40 overflow-y-auto text-[10px] space-y-1.5 font-mono">
              <div className="text-emerald-400 font-bold">Node Execution Sequence ({executionResult.totalDurationMs}ms):</div>
              {executionResult.stepLogs.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between text-gray-300">
                  <span>✓ {log.nodeLabel}</span>
                  <span className="text-gray-500">{log.durationMs}ms</span>
                </div>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 border-t border-gray-800 bg-gray-950 flex items-center gap-2">
            <input
              type="text"
              placeholder="Test user message..."
              value={simInput}
              onChange={e => setSimInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRunSimulator()}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleRunSimulator}
              disabled={isSimulating}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isSimulating ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
