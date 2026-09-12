export interface NodePosition {
  x: number;
  y: number;
}

export interface AgentNode {
  id: string;
  type: string;
  label: string;
  position: NodePosition;
  config: Record<string, any>;
  data?: Record<string, any>;
}

export interface AgentEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: string;
}

export interface AgentGraph {
  nodes: AgentNode[];
  edges: AgentEdge[];
}

export interface AgentMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgResponseTimeMs: number;
  lastRunAt?: string;
}

export interface AIAgent {
  id: string;
  name: string;
  slug?: string;
  role: string;
  department: string;
  description: string;
  avatar: string;
  status: 'draft' | 'active' | 'paused';
  channels: string[];
  graph: AgentGraph;
  settings?: Record<string, any>;
  isTemplate?: boolean;
  templateCategory?: string;
  metrics: AgentMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionStepLog {
  stepIndex: number;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: 'success' | 'failed' | 'skipped';
  durationMs: number;
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  executedAt: string;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  triggerType: string;
  status: 'running' | 'success' | 'failed';
  initialPayload?: Record<string, any>;
  finalOutput?: Record<string, any>;
  stepLogs: ExecutionStepLog[];
  totalDurationMs: number;
  error?: string;
  createdAt: string;
}

export interface ConnectorParam {
  name: string;
  type: string;
  description?: string;
  required: boolean;
  defaultVal?: string;
}

export interface ConnectorHeader {
  key: string;
  value: string;
  isSecret: boolean;
}

export interface ConnectorOutputMapping {
  targetVar: string;
  jsonPath: string;
}

export interface CustomConnector {
  id: string;
  name: string;
  description: string;
  category: string;
  method: string;
  url: string;
  headers: ConnectorHeader[];
  authType: string;
  bodyType: string;
  bodyTemplate?: string;
  params: ConnectorParam[];
  outputMappings?: ConnectorOutputMapping[];
  timeoutSeconds: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestConnectorResponse {
  statusCode: number;
  durationMs: number;
  rawResponse: string;
  extracted?: Record<string, any>;
  error?: string;
}
