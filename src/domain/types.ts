import { z } from 'zod';

/**
 * As 3 rotas semânticas oficiais do Nexus Orchestrator
 */
export type SemanticRouteId =
  | 'SUPPORT_LOGISTICS'
  | 'FINOPS_DISPUTES'
  | 'API_INTEGRATION';

export type OmnichannelSource =
  | 'PARTNER_PORTAL'
  | 'RIDER_APP'
  | 'DEVELOPER_CONSOLE'
  | 'CUSTOMER_APP';

export type ExecutionMode = 'GEMINI_INTERACTIONS_API' | 'DETERMINISTIC_ENGINE';

export interface SubAgentProfile {
  id: string;
  name: string;
  role: string;
  route: SemanticRouteId;
  slaTarget: string;
  accentColor: string;
  badgeLabel: string;
  systemInstruction: string;
}

export interface KnowledgeDocumentChunk {
  doc_id: string;
  title: string;
  category: SemanticRouteId;
  section: string;
  version: string;
  last_updated: string;
  tags: string[];
  content: string;
  sla_reference: string;
}

export interface RetrievedDocumentChunk extends KnowledgeDocumentChunk {
  relevance_score: number;
  matched_terms: string[];
  citation_reason: string;
}

export interface RouteScoreBreakdown {
  route: SemanticRouteId;
  label: string;
  score: number;
  probability: number;
  matchedKeywords: string[];
  semanticSignals: string[];
}

export interface SemanticRouterResult {
  route_matched: SemanticRouteId;
  confidence_score: number;
  latency_ms: number;
  is_ambiguous: boolean;
  scores: RouteScoreBreakdown[];
  selected_agent: SubAgentProfile;
}

export interface RagRetrievalResult {
  query: string;
  route_filter: SemanticRouteId;
  retrieved_chunks: RetrievedDocumentChunk[];
  formatted_context: string;
  latency_ms: number;
  total_corpus_scanned: number;
}

/**
 * Estrutura do documento utilizado na resposta estruturada do LLM
 */
export interface UsedDocumentReference {
  doc_id: string;
  title: string;
  section: string;
  relevance_score: number;
  excerpt_applied: string;
}

/**
 * Estrutura detalhada da resposta do sub-agente especialista
 */
export interface AgentStructuredReply {
  specialist_agent: string;
  summary_title: string;
  message: string;
  recommended_actions: string[];
  sla_priority: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_NORMAL' | 'P3_LOW';
  protocol_code: string;
  escalation_required: boolean;
}

/**
 * Métricas de execução de engenharia do ciclo de orquestração
 */
export interface ExecutionMetrics {
  model: string;
  api_version: string;
  interaction_id: string;
  execution_mode: ExecutionMode;
  latency_ms: number;
  router_latency_ms: number;
  rag_latency_ms: number;
  llm_latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  thought_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  timestamp_iso: string;
}

/**
 * Contrato de Saída Estruturada (Structured Output) exigido pelo Nexus Orchestrator
 */
export interface NexusOrchestratorOutput {
  route_matched: SemanticRouteId;
  confidence_score: number;
  retrieved_documents_used: UsedDocumentReference[];
  agent_response: AgentStructuredReply;
  execution_metrics: ExecutionMetrics;
}

/**
 * Schema de validação Zod para garantir integridade estrita do retorno JSON do modelo
 */
export const NexusOrchestratorOutputZodSchema = z.object({
  route_matched: z.enum(['SUPPORT_LOGISTICS', 'FINOPS_DISPUTES', 'API_INTEGRATION']),
  confidence_score: z.number().min(0).max(1),
  retrieved_documents_used: z.array(
    z.object({
      doc_id: z.string(),
      title: z.string(),
      section: z.string(),
      relevance_score: z.number(),
      excerpt_applied: z.string(),
    })
  ),
  agent_response: z.object({
    specialist_agent: z.string(),
    summary_title: z.string(),
    message: z.string(),
    recommended_actions: z.array(z.string()),
    sla_priority: z.enum(['P0_CRITICAL', 'P1_HIGH', 'P2_NORMAL', 'P3_LOW']),
    protocol_code: z.string(),
    escalation_required: z.boolean(),
  }),
  execution_metrics: z.object({
    model: z.string(),
    api_version: z.string(),
    interaction_id: z.string(),
    execution_mode: z.enum(['GEMINI_INTERACTIONS_API', 'DETERMINISTIC_ENGINE']),
    latency_ms: z.number(),
    router_latency_ms: z.number(),
    rag_latency_ms: z.number(),
    llm_latency_ms: z.number(),
    input_tokens: z.number(),
    output_tokens: z.number(),
    thought_tokens: z.number(),
    total_tokens: z.number(),
    estimated_cost_usd: z.number(),
    timestamp_iso: z.string(),
  }),
});

/**
 * JSON Schema oficial injetado no campo `response_format.schema` da Interactions API (`gemini-3.8-flash`)
 */
export const NEXUS_ORCHESTRATOR_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  description:
    'Contrato oficial de saída estruturada do Nexus Orchestrator para roteamento semântico, RAG documental e telemetria de sub-agentes.',
  properties: {
    route_matched: {
      type: 'string',
      enum: ['SUPPORT_LOGISTICS', 'FINOPS_DISPUTES', 'API_INTEGRATION'],
      description: 'Rota semântica classificada para o atendimento.',
    },
    confidence_score: {
      type: 'number',
      description: 'Grau de confiança da classificação semântica entre 0.0 e 1.0.',
    },
    retrieved_documents_used: {
      type: 'array',
      description: 'Lista de documentos e trechos da base RAG efetivamente utilizados na resposta.',
      items: {
        type: 'object',
        properties: {
          doc_id: {
            type: 'string',
            description: 'Identificador único do documento na base de conhecimento (ex: DOC-LOG-101).',
          },
          title: {
            type: 'string',
            description: 'Título oficial do manual ou política de SLA.',
          },
          section: {
            type: 'string',
            description: 'Seção específica do documento utilizada.',
          },
          relevance_score: {
            type: 'number',
            description: 'Score de relevância vetorial/lexical do chunk entre 0.0 e 1.0.',
          },
          excerpt_applied: {
            type: 'string',
            description: 'Resumo técnico da regra documental aplicada na resolução.',
          },
        },
        required: ['doc_id', 'title', 'section', 'relevance_score', 'excerpt_applied'],
      },
    },
    agent_response: {
      type: 'object',
      description: 'Resposta elaborada pelo sub-agente especialista com plano de ação e prioridade SLA.',
      properties: {
        specialist_agent: {
          type: 'string',
          description: 'Nome do sub-agente especialista responsável pelo atendimento.',
        },
        summary_title: {
          type: 'string',
          description: 'Título executivo curto do diagnóstico.',
        },
        message: {
          type: 'string',
          description: 'Resposta técnica detalhada e contextualizada com base nos manuais do RAG.',
        },
        recommended_actions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Passos operacionais concretos recomendados ao usuário ou parceiro.',
        },
        sla_priority: {
          type: 'string',
          enum: ['P0_CRITICAL', 'P1_HIGH', 'P2_NORMAL', 'P3_LOW'],
          description: 'Nível de criticidade operacional conforme política de SLA.',
        },
        protocol_code: {
          type: 'string',
          description: 'Código de protocolo operacional gerado para rastreabilidade.',
        },
        escalation_required: {
          type: 'boolean',
          description: 'Indica se o caso exige transbordo para engenharia N3 ou mesa de crise.',
        },
      },
      required: [
        'specialist_agent',
        'summary_title',
        'message',
        'recommended_actions',
        'sla_priority',
        'protocol_code',
        'escalation_required',
      ],
    },
    execution_metrics: {
      type: 'object',
      description: 'Métricas de telemetria e observabilidade da execução da inferência.',
      properties: {
        model: { type: 'string' },
        api_version: { type: 'string' },
        interaction_id: { type: 'string' },
        execution_mode: {
          type: 'string',
          enum: ['GEMINI_INTERACTIONS_API', 'DETERMINISTIC_ENGINE'],
        },
        latency_ms: { type: 'number' },
        router_latency_ms: { type: 'number' },
        rag_latency_ms: { type: 'number' },
        llm_latency_ms: { type: 'number' },
        input_tokens: { type: 'number' },
        output_tokens: { type: 'number' },
        thought_tokens: { type: 'number' },
        total_tokens: { type: 'number' },
        estimated_cost_usd: { type: 'number' },
        timestamp_iso: { type: 'string' },
      },
      required: [
        'model',
        'api_version',
        'interaction_id',
        'execution_mode',
        'latency_ms',
        'router_latency_ms',
        'rag_latency_ms',
        'llm_latency_ms',
        'input_tokens',
        'output_tokens',
        'thought_tokens',
        'total_tokens',
        'estimated_cost_usd',
        'timestamp_iso',
      ],
    },
  },
  required: [
    'route_matched',
    'confidence_score',
    'retrieved_documents_used',
    'agent_response',
    'execution_metrics',
  ],
};

/**
 * Registro persistido na tabela local `tb_nexus_orchestrator_logs` (IndexedDB + LocalStorage)
 */
export interface NexusOrchestratorLogRecord {
  log_id: string;
  session_id: string;
  created_at: string;
  channel: OmnichannelSource;
  user_input: string;
  router_telemetry: SemanticRouterResult;
  rag_telemetry: RagRetrievalResult;
  structured_output: NexusOrchestratorOutput;
  raw_json_payload: string;
  prompt_compiled: {
    system_instruction: string;
    user_prompt_with_rag: string;
  };
}

export interface PresetScenario {
  id: string;
  label: string;
  prompt: string;
  expectedRoute: SemanticRouteId;
  channel: OmnichannelSource;
  description: string;
}
