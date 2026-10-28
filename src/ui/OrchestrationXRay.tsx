import React, { useState } from 'react';
import {
  Activity,
  BookOpen,
  Check,
  Copy,
  Cpu,
  Database,
  FileCode2,
  FileSearch,
  Gauge,
  GitBranch,
  Layers,
  ShieldAlert,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { KNOWLEDGE_BASE_CHUNKS } from '../domain/knowledgeBase';
import {
  NEXUS_ORCHESTRATOR_JSON_SCHEMA,
  NexusOrchestratorLogRecord,
  SemanticRouteId,
} from '../domain/types';
import { TB_NEXUS_ORCHESTRATOR_LOGS } from '../storage/orchestratorStorage';
import { getRouteTheme } from './OmnichannelSimulator';

interface OrchestrationXRayProps {
  activeRecord: NexusOrchestratorLogRecord | null;
  allLogs: NexusOrchestratorLogRecord[];
  onSelectLog: (logId: string) => void;
}

type XRayTab =
  | 'UNIFIED_XRAY'
  | 'PROMPT_AND_SCHEMA'
  | 'RAG_CORPUS'
  | 'STORAGE_LOGS';

export const OrchestrationXRay: React.FC<OrchestrationXRayProps> = ({
  activeRecord,
  allLogs,
  onSelectLog,
}) => {
  const [activeTab, setActiveTab] = useState<XRayTab>('UNIFIED_XRAY');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [routeFilter, setRouteFilter] = useState<SemanticRouteId | 'ALL'>('ALL');

  const handleCopyJson = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const filteredLogs =
    routeFilter === 'ALL'
      ? allLogs
      : allLogs.filter(
          (l) => l.structured_output.route_matched === routeFilter
        );

  return (
    <section
      aria-label="Raio-X de Orquestração e Observabilidade"
      className="flex flex-col h-full bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-xl"
    >
      {/* Cabeçalho da Coluna Direita */}
      <div className="px-4 py-3 border-b border-[#30363D] bg-[#0D1117]/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#58A6FF]" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E6EDF3]">
            Raio-X de Orquestração & Observabilidade
          </h2>
          {activeRecord && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0D1117] text-[#8B949E] border border-[#30363D]">
              ID: {activeRecord.structured_output.execution_metrics.interaction_id}
            </span>
          )}
        </div>

        {/* Abas de Inspeção */}
        <div className="flex items-center gap-1 bg-[#0D1117] p-1 rounded-lg border border-[#30363D] text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('UNIFIED_XRAY')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'UNIFIED_XRAY'
                ? 'bg-[#58A6FF] text-[#0D1117] font-bold'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            Raio-X Ao Vivo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PROMPT_AND_SCHEMA')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'PROMPT_AND_SCHEMA'
                ? 'bg-[#58A6FF] text-[#0D1117] font-bold'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            Prompt & Schema
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RAG_CORPUS')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'RAG_CORPUS'
                ? 'bg-[#58A6FF] text-[#0D1117] font-bold'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            Base RAG ({KNOWLEDGE_BASE_CHUNKS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('STORAGE_LOGS')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'STORAGE_LOGS'
                ? 'bg-[#58A6FF] text-[#0D1117] font-bold'
                : 'text-[#8B949E] hover:text-[#E6EDF3]'
            }`}
          >
            Logs DB ({allLogs.length})
          </button>
        </div>
      </div>

      {/* Conteúdo Principal do Painel de Observabilidade */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-140px)]">
        {!activeRecord && activeTab !== 'RAG_CORPUS' && activeTab !== 'STORAGE_LOGS' ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0D1117] border border-[#30363D] flex items-center justify-center mb-3">
              <Cpu className="w-6 h-6 text-[#8B949E]" />
            </div>
            <h3 className="text-sm font-semibold text-[#E6EDF3] mb-1">
              Aguardando Telemetria de Execução
            </h3>
            <p className="text-xs text-[#8B949E] max-w-md leading-relaxed">
              Envie uma mensagem ou selecione um cenário no Simulador Omnichannel à
              esquerda para inspecionar a Rota Semântica, os Chunks recuperados pelo
              RAG, o JSON Payload bruto e as métricas de inferência.
            </p>
          </div>
        ) : null}

        {/* ABA 1: RAIO-X UNIFICADO (ROTA + RAG CHUNKS + JSON PAYLOAD + TELEMETRIA) */}
        {activeTab === 'UNIFIED_XRAY' && activeRecord && (
          <>
            {/* 4 Cards de Telemetria Imediata */}
            {(() => {
              const out = activeRecord.structured_output;
              const metrics = out.execution_metrics;
              const theme = getRouteTheme(out.route_matched);
              const RouteIcon = theme.icon;

              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Card 1: Rota Semântica Ativada */}
                  <div className="p-3 rounded-xl bg-[#0D1117] border border-[#30363D] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8B949E] mb-1">
                      <span>Rota Semântica Ativada</span>
                      <GitBranch className="w-3.5 h-3.5 text-[#EA1D2C]" />
                    </div>
                    <div className="flex items-center gap-1.5 my-0.5">
                      <RouteIcon className={`w-4 h-4 shrink-0 ${theme.badgeText}`} />
                      <span
                        className={`text-xs font-mono font-bold truncate ${theme.badgeText}`}
                      >
                        {out.route_matched}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#8B949E] flex items-center justify-between mt-1">
                      <span>Confidence Score:</span>
                      <strong className="text-[#E6EDF3]">
                        {(out.confidence_score * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </div>

                  {/* Card 2: Chunks Recuperados pelo RAG */}
                  <div className="p-3 rounded-xl bg-[#0D1117] border border-[#30363D] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8B949E] mb-1">
                      <span>Contexto RAG Injetado</span>
                      <FileSearch className="w-3.5 h-3.5 text-[#58A6FF]" />
                    </div>
                    <div className="text-base font-mono font-bold text-[#E6EDF3]">
                      {activeRecord.rag_telemetry.retrieved_chunks.length}{' '}
                      <span className="text-xs font-normal text-[#8B949E]">
                        / {activeRecord.rag_telemetry.total_corpus_scanned} docs
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#8B949E] flex items-center justify-between mt-1">
                      <span>Top Similaridade:</span>
                      <strong className="text-[#58A6FF]">
                        {(
                          (activeRecord.rag_telemetry.retrieved_chunks[0]
                            ?.relevance_score || 0) * 100
                        ).toFixed(0)}
                        %
                      </strong>
                    </div>
                  </div>

                  {/* Card 3: Tokens Consumidos */}
                  <div className="p-3 rounded-xl bg-[#0D1117] border border-[#30363D] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8B949E] mb-1">
                      <span>Tokens Consumidos</span>
                      <Zap className="w-3.5 h-3.5 text-[#D29922]" />
                    </div>
                    <div className="text-base font-mono font-bold text-[#E6EDF3]">
                      {metrics.total_tokens.toLocaleString('pt-BR')}{' '}
                      <span className="text-[11px] font-normal text-[#8B949E]">
                        tokens
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#8B949E] flex items-center justify-between mt-1">
                      <span>
                        In: {metrics.input_tokens} | Out: {metrics.output_tokens}
                      </span>
                      <span className="text-[#3FB950]">
                        ${metrics.estimated_cost_usd.toFixed(5)}
                      </span>
                    </div>
                  </div>

                  {/* Card 4: Latência da Inferência (ms) */}
                  <div className="p-3 rounded-xl bg-[#0D1117] border border-[#30363D] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8B949E] mb-1">
                      <span>Latência Total (ms)</span>
                      <Gauge className="w-3.5 h-3.5 text-[#3FB950]" />
                    </div>
                    <div className="text-base font-mono font-bold text-[#3FB950]">
                      {metrics.latency_ms}{' '}
                      <span className="text-xs font-normal text-[#8B949E]">ms</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#8B949E] truncate mt-1">
                      Rtr {metrics.router_latency_ms}ms • RAG {metrics.rag_latency_ms}
                      ms • LLM {metrics.llm_latency_ms}ms
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* BLOCO 1: TELEMETRIA DO SEMANTIC ROUTER & SUB-AGENTE */}
            <div className="rounded-xl bg-[#0D1117] border border-[#30363D] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-[#EA1D2C]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3]">
                    1. Classificação do Semantic Router & Sub-Agente Especialista
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#58A6FF]">
                  {activeRecord.router_telemetry.selected_agent.name}
                </span>
              </div>

              {/* Barras de Probabilidade das 3 Rotas */}
              <div className="space-y-2">
                {activeRecord.router_telemetry.scores.map((scoreItem) => {
                  const isWinner =
                    scoreItem.route ===
                    activeRecord.structured_output.route_matched;
                  const pct = Math.round(scoreItem.probability * 100);
                  const routeTheme = getRouteTheme(scoreItem.route);

                  return (
                    <div
                      key={scoreItem.route}
                      className={`p-2.5 rounded-lg border ${
                        isWinner
                          ? 'bg-[#161B22] border-[#58A6FF]/50'
                          : 'bg-[#161B22]/40 border-[#30363D]/60 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              isWinner ? routeTheme.badgeText : 'text-[#8B949E]'
                            }`}
                          >
                            {scoreItem.route}
                          </span>
                          <span className="text-[11px] text-[#8B949E] hidden sm:inline">
                            — {scoreItem.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#8B949E]">
                            raw={scoreItem.score}
                          </span>
                          <span className="font-bold text-[#E6EDF3]">{pct}%</span>
                        </div>
                      </div>

                      <div className="w-full h-2 rounded-full bg-[#0D1117] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(4, pct)}%`,
                            backgroundColor: isWinner
                              ? routeTheme.accentHex
                              : '#30363D',
                          }}
                        />
                      </div>

                      {scoreItem.matchedKeywords.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-2">
                          <span className="text-[10px] font-mono text-[#8B949E]">
                            Triggers:
                          </span>
                          {scoreItem.matchedKeywords.map((kw) => (
                            <span
                              key={kw}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0D1117] text-[#E6EDF3] border border-[#30363D]"
                            >
                              {kw}
                            </span>
                          ))}
                          {scoreItem.semanticSignals.map((sig) => (
                            <span
                              key={sig}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#58A6FF]/10 text-[#58A6FF] border border-[#58A6FF]/30"
                            >
                              {sig}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BLOCO 2: CHUNKS DOCUMENTAIS RECUPERADOS PELO RAG */}
            <div className="rounded-xl bg-[#0D1117] border border-[#30363D] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileSearch className="w-4 h-4 text-[#58A6FF]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3]">
                    2. Chunks Recuperados pelo RAG Local (Context Injection)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#8B949E]">
                  Retrieval Time: {activeRecord.rag_telemetry.latency_ms} ms
                </span>
              </div>

              <div className="space-y-2.5">
                {activeRecord.rag_telemetry.retrieved_chunks.map((chunk, idx) => (
                  <div
                    key={chunk.doc_id}
                    className="p-3 rounded-lg bg-[#161B22] border border-[#30363D] space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#58A6FF]/15 text-[#58A6FF] border border-[#58A6FF]/40">
                          #{idx + 1} • {chunk.doc_id}
                        </span>
                        <span className="text-xs font-semibold text-[#E6EDF3]">
                          {chunk.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30">
                        Score RAG: {(chunk.relevance_score * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#8B949E] flex flex-wrap items-center justify-between gap-2">
                      <span>{chunk.section}</span>
                      <span className="text-[#EA1D2C]">{chunk.sla_reference}</span>
                    </div>

                    <pre className="text-[11px] font-mono text-[#E6EDF3]/90 bg-[#0D1117] p-2.5 rounded border border-[#30363D]/80 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                      {chunk.content}
                    </pre>

                    <div className="text-[10px] font-mono text-[#58A6FF]">
                      Motivo de Injeção: {chunk.citation_reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BLOCO 3: JSON PAYLOAD BRUTO RETORNADO PELO MODELO */}
            <div className="rounded-xl bg-[#0D1117] border border-[#30363D] p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-[#3FB950]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3]">
                    3. JSON Payload Estruturado Retornado pelo Modelo
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3FB950]/15 text-[#3FB950] border border-[#3FB950]/30">
                    Schema Validated (Zod + JSON Schema)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyJson(activeRecord.raw_json_payload)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161B22] hover:bg-[#1F242D] border border-[#30363D] text-[11px] font-mono text-[#E6EDF3] transition-colors"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#3FB950]" />
                      <span className="text-[#3FB950]">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#58A6FF]" />
                      <span>Copiar JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="text-[11px] font-mono text-[#58A6FF] bg-[#161B22] p-3.5 rounded-lg border border-[#30363D] overflow-x-auto leading-relaxed max-h-[360px]">
                {activeRecord.raw_json_payload}
              </pre>
            </div>
          </>
        )}

        {/* ABA 2: PROMPT COMPILADO & CONTRATO JSON SCHEMA DA INTERACTIONS API */}
        {activeTab === 'PROMPT_AND_SCHEMA' && activeRecord && (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#0D1117] border border-[#30363D] p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#EA1D2C]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3]">
                  System Instruction do Sub-Agente ({activeRecord.structured_output.route_matched})
                </h3>
              </div>
              <pre className="text-[11px] font-mono text-[#E6EDF3] bg-[#161B22] p-3 rounded-lg border border-[#30363D] whitespace-pre-wrap leading-relaxed">
                {activeRecord.prompt_compiled.system_instruction}
              </pre>
            </div>

            <div className="rounded-xl bg-[#0D1117] border border-[#30363D] p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#58A6FF]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3]">
                  User Input + Contexto RAG Injetado (client.interactions.create)
                </h3>
              </div>
              <pre className="text-[11px] font-mono text-[#8B949E] bg-[#161B22] p-3 rounded-lg border border-[#30363D] whitespace-pre-wrap leading-relaxed max-h-[280px] overflow-y-auto">
                {activeRecord.prompt_compiled.user_prompt_with_rag}
              </pre>
            </div>

            <div className="rounded-xl bg-[#0D1117] border border-[#30363D] p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#3FB950]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E6EDF3]">
                  Contrato Oficial JSON Schema (response_format.schema)
                </h3>
              </div>
              <pre className="text-[11px] font-mono text-[#3FB950] bg-[#161B22] p-3 rounded-lg border border-[#30363D] overflow-x-auto leading-relaxed max-h-[320px]">
                {JSON.stringify(NEXUS_ORCHESTRATOR_JSON_SCHEMA, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* ABA 3: EXPLORADOR DA BASE DE CONHECIMENTO OPERACIONAL (RAG CORPUS) */}
        {activeTab === 'RAG_CORPUS' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#0D1117] border border-[#30363D] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#58A6FF]" />
                <div>
                  <h3 className="text-xs font-bold text-[#E6EDF3]">
                    Base de Conhecimento Documentada (Manuais de SLA & Especificações)
                  </h3>
                  <p className="text-[11px] text-[#8B949E]">
                    Corpus operacional indexado localmente para injeção automática via RAG
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono text-[#58A6FF]">
                {KNOWLEDGE_BASE_CHUNKS.length} Documentos Ativos
              </span>
            </div>

            {KNOWLEDGE_BASE_CHUNKS.map((doc) => {
              const theme = getRouteTheme(doc.category);
              return (
                <div
                  key={doc.doc_id}
                  className="p-3.5 rounded-xl bg-[#0D1117] border border-[#30363D] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                      >
                        {doc.doc_id} • {doc.category}
                      </span>
                      <h4 className="text-xs font-bold text-[#E6EDF3]">
                        {doc.title}
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-[#8B949E]">
                      {doc.version} ({doc.last_updated})
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#58A6FF]">
                    {doc.section} • <span className="text-[#EA1D2C]">{doc.sla_reference}</span>
                  </div>
                  <p className="text-xs text-[#E6EDF3]/90 whitespace-pre-line font-mono bg-[#161B22] p-2.5 rounded border border-[#30363D]">
                    {doc.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ABA 4: PERSISTÊNCIA E HISTÓRICO (`tb_nexus_orchestrator_logs`) */}
        {activeTab === 'STORAGE_LOGS' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#0D1117] border border-[#30363D] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#58A6FF]" />
                <div>
                  <h3 className="text-xs font-bold font-mono text-[#E6EDF3]">
                    Tabela: {TB_NEXUS_ORCHESTRATOR_LOGS}
                  </h3>
                  <p className="text-[11px] text-[#8B949E]">
                    Persistência Híbrida em IndexedDB + Espelhamento Síncrono em LocalStorage
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono">
                {(
                  [
                    'ALL',
                    'SUPPORT_LOGISTICS',
                    'FINOPS_DISPUTES',
                    'API_INTEGRATION',
                  ] as const
                ).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRouteFilter(r)}
                    className={`px-2 py-1 rounded border ${
                      routeFilter === r
                        ? 'bg-[#58A6FF]/20 text-[#58A6FF] border-[#58A6FF]/50 font-bold'
                        : 'bg-[#161B22] text-[#8B949E] border-[#30363D]'
                    }`}
                  >
                    {r === 'ALL' ? 'TODOS' : r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#0D1117] border border-[#30363D] text-xs text-[#8B949E]">
                Nenhum registro encontrado para o filtro selecionado em{' '}
                <code>{TB_NEXUS_ORCHESTRATOR_LOGS}</code>.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((rec) => {
                  const out = rec.structured_output;
                  const theme = getRouteTheme(out.route_matched);
                  const isCurrent = activeRecord?.log_id === rec.log_id;
                  return (
                    <div
                      key={rec.log_id}
                      onClick={() => {
                        onSelectLog(rec.log_id);
                        setActiveTab('UNIFIED_XRAY');
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#0D1117] border-[#58A6FF]'
                          : 'bg-[#0D1117]/70 border-[#30363D] hover:border-[#58A6FF]/50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                          >
                            {out.route_matched}
                          </span>
                          <span className="text-[11px] font-mono text-[#E6EDF3]">
                            {out.agent_response.protocol_code}
                          </span>
                          <span className="text-[10px] font-mono text-[#8B949E]">
                            ({rec.channel})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8B949E]">
                          {new Date(rec.created_at).toLocaleString('pt-BR')} •{' '}
                          <strong className="text-[#3FB950]">
                            {out.execution_metrics.latency_ms} ms
                          </strong>{' '}
                          • {out.execution_metrics.total_tokens} tok
                        </span>
                      </div>
                      <p className="text-xs text-[#E6EDF3] line-clamp-1">
                        {rec.user_input}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
