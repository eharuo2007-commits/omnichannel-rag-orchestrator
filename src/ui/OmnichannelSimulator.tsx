import React, { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Store,
  Truck,
  User,
  Wallet,
} from 'lucide-react';
import { PRESET_SCENARIOS } from '../domain/knowledgeBase';
import {
  NexusOrchestratorLogRecord,
  OmnichannelSource,
  PresetScenario,
  SemanticRouteId,
} from '../domain/types';

interface OmnichannelSimulatorProps {
  logs: NexusOrchestratorLogRecord[];
  selectedLogId: string | null;
  onSelectLog: (logId: string) => void;
  onSubmitPrompt: (prompt: string, channel: OmnichannelSource) => Promise<void>;
  isProcessing: boolean;
  pipelineStage: 'IDLE' | 'ROUTING' | 'RAG_RETRIEVAL' | 'LLM_INFERENCE';
}

const CHANNEL_OPTIONS: {
  id: OmnichannelSource;
  label: string;
  short: string;
}[] = [
  { id: 'PARTNER_PORTAL', label: 'Portal do Parceiro (Restaurante)', short: 'Parceiro' },
  { id: 'DEVELOPER_CONSOLE', label: 'Developer Console (ERP / API)', short: 'Dev / ERP' },
  { id: 'RIDER_APP', label: 'App do Entregador (Frota)', short: 'Entregador' },
  { id: 'CUSTOMER_APP', label: 'App do Consumidor Final', short: 'Cliente' },
];

export function getRouteTheme(route: SemanticRouteId) {
  switch (route) {
    case 'SUPPORT_LOGISTICS':
      return {
        badgeBg: 'bg-[#EA1D2C]/15',
        badgeText: 'text-[#EA1D2C]',
        badgeBorder: 'border-[#EA1D2C]/40',
        accentHex: '#EA1D2C',
        icon: Truck,
        shortLabel: 'SUPPORT_LOGISTICS',
      };
    case 'FINOPS_DISPUTES':
      return {
        badgeBg: 'bg-[#3FB950]/15',
        badgeText: 'text-[#3FB950]',
        badgeBorder: 'border-[#3FB950]/40',
        accentHex: '#3FB950',
        icon: Wallet,
        shortLabel: 'FINOPS_DISPUTES',
      };
    case 'API_INTEGRATION':
      return {
        badgeBg: 'bg-[#58A6FF]/15',
        badgeText: 'text-[#58A6FF]',
        badgeBorder: 'border-[#58A6FF]/40',
        accentHex: '#58A6FF',
        icon: Code2,
        shortLabel: 'API_INTEGRATION',
      };
  }
}

export const OmnichannelSimulator: React.FC<OmnichannelSimulatorProps> = ({
  logs,
  selectedLogId,
  onSelectLog,
  onSubmitPrompt,
  isProcessing,
  pipelineStage,
}) => {
  const [input, setInput] = useState('');
  const [channel, setChannel] = useState<OmnichannelSource>('PARTNER_PORTAL');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Exibe as conversas em ordem cronológica no chat (mais antigas no topo, mais recentes embaixo)
  const chronologicalLogs = [...logs].reverse();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length, isProcessing]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;
    setInput('');
    await onSubmitPrompt(trimmed, channel);
  };

  const handleTriggerScenario = async (scenario: PresetScenario) => {
    if (isProcessing) return;
    setChannel(scenario.channel);
    setInput('');
    await onSubmitPrompt(scenario.prompt, scenario.channel);
  };

  return (
    <section
      aria-label="Simulador Omnichannel"
      className="flex flex-col h-full bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden shadow-xl"
    >
      {/* Cabeçalho da Coluna Esquerda */}
      <div className="px-4 py-3 border-b border-[#30363D] bg-[#0D1117]/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#EA1D2C]" />
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#E6EDF3]">
            Simulador Omnichannel
          </h2>
          <span className="text-[11px] font-mono text-[#8B949E]">
            • Input & Dispatch
          </span>
        </div>

        {/* Seletor de Canal de Entrada */}
        <div className="flex items-center gap-1 bg-[#0D1117] p-1 rounded-lg border border-[#30363D]">
          {CHANNEL_OPTIONS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setChannel(ch.id)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                channel === ch.id
                  ? 'bg-[#EA1D2C] text-white font-semibold'
                  : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
              title={ch.label}
            >
              {ch.short}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Cenários Pré-Prontos (Quick Dispatch) */}
      <div className="px-4 py-2.5 border-b border-[#30363D] bg-[#0D1117]/40">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8B949E] flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#58A6FF]" />
            Cenários de Teste Rápido (1-Click Dispatch):
          </span>
          <span className="text-[10px] font-mono text-[#8B949E]">
            3 rotas semânticas cobertas
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {PRESET_SCENARIOS.slice(0, 3).map((sc) => {
            const theme = getRouteTheme(sc.expectedRoute);
            const RouteIcon = theme.icon;
            return (
              <button
                key={sc.id}
                type="button"
                disabled={isProcessing}
                onClick={() => handleTriggerScenario(sc)}
                className="group text-left p-2 rounded-lg bg-[#0D1117] hover:bg-[#1F242D] border border-[#30363D] hover:border-[#58A6FF]/50 transition-all disabled:opacity-50"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                  >
                    <RouteIcon className="w-2.5 h-2.5" />
                    {sc.expectedRoute}
                  </span>
                  <ArrowUpRight className="w-3 h-3 text-[#8B949E] group-hover:text-[#58A6FF] transition-colors" />
                </div>
                <p className="text-xs font-medium text-[#E6EDF3] line-clamp-1">
                  "{sc.label}"
                </p>
              </button>
            );
          })}
        </div>

        {/* Cenários Secundários de Borda */}
        <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-0.5">
          {PRESET_SCENARIOS.slice(3).map((sc) => {
            const theme = getRouteTheme(sc.expectedRoute);
            return (
              <button
                key={sc.id}
                type="button"
                disabled={isProcessing}
                onClick={() => handleTriggerScenario(sc)}
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D1117]/80 hover:bg-[#1F242D] border border-[#30363D] text-[11px] text-[#8B949E] hover:text-[#E6EDF3] transition-colors disabled:opacity-50"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: theme.accentHex }}
                />
                <span>{sc.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Área de Conversação Omnichannel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-[380px] max-h-[calc(100vh-330px)]">
        {chronologicalLogs.length === 0 && !isProcessing ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0D1117] border border-[#30363D] flex items-center justify-center mb-3">
              <Compass className="w-6 h-6 text-[#58A6FF]" />
            </div>
            <h3 className="text-sm font-semibold text-[#E6EDF3] mb-1">
              Nenhum turno de orquestração ativo na sessão
            </h3>
            <p className="text-xs text-[#8B949E] max-w-md leading-relaxed">
              Clique em um dos cenários pré-configurados acima ou digite uma solicitação de
              logística, repasse financeiro ou integração de API para acionar o{' '}
              <span className="text-[#58A6FF] font-mono">Semantic Router</span> +{' '}
              <span className="text-[#EA1D2C] font-mono">RAG Local</span>.
            </p>
          </div>
        ) : (
          chronologicalLogs.map((record) => {
            const out = record.structured_output;
            const theme = getRouteTheme(out.route_matched);
            const RouteIcon = theme.icon;
            const isSelected = record.log_id === selectedLogId;

            return (
              <div
                key={record.log_id}
                onClick={() => onSelectLog(record.log_id)}
                className={`space-y-3 rounded-xl p-3.5 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#0D1117]/90 border-[#58A6FF] ring-1 ring-[#58A6FF]/30'
                    : 'bg-[#0D1117]/40 border-[#30363D]/80 hover:border-[#30363D]'
                }`}
              >
                {/* Mensagem do Usuário / Parceiro */}
                <div className="flex items-start justify-end gap-2.5">
                  <div className="max-w-[88%] rounded-xl rounded-tr-xs bg-[#1F242D] border border-[#30363D] px-3.5 py-2.5">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-[#8B949E]">
                        <Store className="w-3 h-3 text-[#EA1D2C]" />
                        {record.channel}
                      </span>
                      <span className="text-[10px] font-mono text-[#8B949E]">
                        {new Date(record.created_at).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#E6EDF3] leading-relaxed">
                      {record.user_input}
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-[#EA1D2C]/20 border border-[#EA1D2C]/40 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-[#EA1D2C]" />
                  </div>
                </div>

                {/* Resposta do Sub-Agente Especialista */}
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${theme.badgeBg} ${theme.badgeBorder}`}
                  >
                    <Bot className={`w-4 h-4 ${theme.badgeText}`} />
                  </div>

                  <div className="flex-1 min-w-0 rounded-xl rounded-tl-xs bg-[#161B22] border border-[#30363D] p-3.5 space-y-2.5">
                    {/* Cabeçalho de Metadados do Agente */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#30363D]/70">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                        >
                          <RouteIcon className="w-3 h-3" />
                          {out.route_matched}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0D1117] text-[#58A6FF] border border-[#30363D]">
                          Confiança: {(out.confidence_score * 100).toFixed(0)}%
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                            out.agent_response.sla_priority === 'P0_CRITICAL'
                              ? 'bg-[#EA1D2C]/20 text-[#EA1D2C] border-[#EA1D2C]/50 font-bold'
                              : 'bg-[#D29922]/15 text-[#D29922] border-[#D29922]/40'
                          }`}
                        >
                          {out.agent_response.sla_priority}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-[#8B949E] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#3FB950]" />
                        {out.execution_metrics.latency_ms} ms •{' '}
                        {out.execution_metrics.total_tokens} tok
                      </span>
                    </div>

                    {/* Nome do Sub-Agente e Título do Diagnóstico */}
                    <div>
                      <div className="text-[11px] font-mono text-[#58A6FF] mb-0.5">
                        {out.agent_response.specialist_agent} • Protocolo{' '}
                        <span className="text-[#E6EDF3]">
                          {out.agent_response.protocol_code}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#E6EDF3]">
                        {out.agent_response.summary_title}
                      </h4>
                    </div>

                    {/* Corpo da Resposta */}
                    <div className="text-xs text-[#E6EDF3]/90 leading-relaxed whitespace-pre-line">
                      {out.agent_response.message}
                    </div>

                    {/* Plano de Ação Recomendado */}
                    {out.agent_response.recommended_actions.length > 0 && (
                      <div className="rounded-lg bg-[#0D1117] border border-[#30363D] p-2.5 space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[#8B949E] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#3FB950]" />
                          Plano de Ação Operacional (SLA):
                        </div>
                        <ul className="space-y-1">
                          {out.agent_response.recommended_actions.map(
                            (act, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-[#E6EDF3] flex items-start gap-2"
                              >
                                <span className="text-[10px] font-mono text-[#58A6FF] font-bold mt-0.5">
                                  0{idx + 1}.
                                </span>
                                <span>{act}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Rodapé com Documentos RAG Citados e Indicador de Inspeção */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {out.retrieved_documents_used.map((doc) => (
                          <span
                            key={doc.doc_id}
                            className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#0D1117] text-[#8B949E] border border-[#30363D]"
                            title={doc.title}
                          >
                            <FileText className="w-2.5 h-2.5 text-[#58A6FF]" />
                            {doc.doc_id} ({(doc.relevance_score * 100).toFixed(0)}%)
                          </span>
                        ))}
                        {out.agent_response.escalation_required && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#EA1D2C]/15 text-[#EA1D2C] border border-[#EA1D2C]/40">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Escalonamento N3 Ativo
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          isSelected
                            ? 'bg-[#58A6FF] text-[#0D1117] font-bold'
                            : 'text-[#58A6FF] hover:underline'
                        }`}
                      >
                        {isSelected ? '● Em Inspeção no Raio-X' : 'Ver no Raio-X →'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Indicador de Pipeline em Tempo Real durante Processamento */}
        {isProcessing && (
          <div className="rounded-xl bg-[#0D1117] border border-[#58A6FF]/50 p-4 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-[#58A6FF]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ORQUESTRAÇÃO MULTI-AGENTE EM EXECUÇÃO...</span>
              </div>
              <span className="text-[10px] font-mono text-[#8B949E]">
                gemini-3.8-flash
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
              <div
                className={`p-2 rounded border ${
                  pipelineStage === 'ROUTING'
                    ? 'bg-[#58A6FF]/20 border-[#58A6FF] text-[#E6EDF3]'
                    : 'bg-[#161B22] border-[#30363D] text-[#3FB950]'
                }`}
              >
                1. Semantic Router
              </div>
              <div
                className={`p-2 rounded border ${
                  pipelineStage === 'RAG_RETRIEVAL'
                    ? 'bg-[#58A6FF]/20 border-[#58A6FF] text-[#E6EDF3]'
                    : pipelineStage === 'LLM_INFERENCE'
                    ? 'bg-[#161B22] border-[#30363D] text-[#3FB950]'
                    : 'bg-[#161B22] border-[#30363D] text-[#8B949E]'
                }`}
              >
                2. Local RAG Context
              </div>
              <div
                className={`p-2 rounded border ${
                  pipelineStage === 'LLM_INFERENCE'
                    ? 'bg-[#EA1D2C]/20 border-[#EA1D2C] text-[#E6EDF3]'
                    : 'bg-[#161B22] border-[#30363D] text-[#8B949E]'
                }`}
              >
                3. Sub-Agent JSON
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Formulário de Entrada Omnichannel */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-[#30363D] bg-[#0D1117]"
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Digite um incidente logístico, dúvida de repasse de terça-feira ou erro de webhook/API... (Enter para despachar)"
              className="w-full rounded-lg bg-[#161B22] border border-[#30363D] focus:border-[#58A6FF] focus:outline-none px-3 py-2 text-xs sm:text-sm text-[#E6EDF3] placeholder-[#8B949E] resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="h-[54px] px-4 rounded-lg bg-[#EA1D2C] hover:bg-[#FF2E3D] disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-2 transition-colors shrink-0 shadow-lg shadow-[#EA1D2C]/20"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Orquestrar</span>
          </button>
        </div>
      </form>
    </section>
  );
};
