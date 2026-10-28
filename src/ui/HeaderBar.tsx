import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  Database,
  KeyRound,
  Layers,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Download,
} from 'lucide-react';
import { ExecutionMode, NexusOrchestratorLogRecord } from '../domain/types';

interface HeaderBarProps {
  logs: NexusOrchestratorLogRecord[];
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  executionMode: ExecutionMode;
  onExecutionModeChange: (mode: ExecutionMode) => void;
  onClearLogs: () => void;
  onExportLogs: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  logs,
  apiKey,
  onApiKeyChange,
  executionMode,
  onExecutionModeChange,
  onClearLogs,
  onExportLogs,
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [draftKey, setDraftKey] = useState(apiKey);

  const avgLatency =
    logs.length > 0
      ? Math.round(
          logs.reduce(
            (acc, l) => acc + l.structured_output.execution_metrics.latency_ms,
            0
          ) / logs.length
        )
      : 0;

  const totalTokensSession = logs.reduce(
    (acc, l) => acc + l.structured_output.execution_metrics.total_tokens,
    0
  );

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    onApiKeyChange(draftKey.trim());
    if (draftKey.trim()) {
      onExecutionModeChange('GEMINI_INTERACTIONS_API');
    }
    setShowKeyModal(false);
  };

  return (
    <header className="border-b border-[#30363D] bg-[#0D1117]/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-[1920px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Identidade do Sistema */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#161B22] border border-[#30363D] shadow-inner">
            <Layers className="w-5 h-5 text-[#EA1D2C]" />
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3FB950] ring-2 ring-[#0D1117]"
              title="Orquestrador Operacional Online"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold tracking-tight text-[#E6EDF3]">
                NEXUS ORCHESTRATOR
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#EA1D2C]/15 text-[#EA1D2C] border border-[#EA1D2C]/40 font-semibold">
                Omnichannel Delivery AI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#58A6FF]/15 text-[#58A6FF] border border-[#58A6FF]/30">
                <Cpu className="w-3 h-3" />
                gemini-3.8-flash (Interactions API)
              </span>
            </div>
            <p className="text-xs text-[#8B949E] hidden sm:block">
              Roteamento Semântico Multi-Agente • RAG Operacional de SLA • Telemetria Estruturada em Tempo Real
            </p>
          </div>
        </div>

        {/* Telemetria Global & Controles de Engine */}
        <div className="flex items-center flex-wrap gap-2">
          {/* KPIs rápidos da sessão */}
          <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 rounded-md bg-[#161B22] border border-[#30363D] text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[#8B949E]">
              <Database className="w-3.5 h-3.5 text-[#58A6FF]" />
              <span>tb_nexus_orchestrator_logs:</span>
              <strong className="text-[#E6EDF3]">{logs.length}</strong>
            </div>
            <span className="text-[#30363D]">|</span>
            <div className="flex items-center gap-1.5 text-[#8B949E]">
              <Activity className="w-3.5 h-3.5 text-[#3FB950]" />
              <span>Avg Latency:</span>
              <strong className="text-[#E6EDF3]">{avgLatency} ms</strong>
            </div>
            <span className="text-[#30363D]">|</span>
            <div className="flex items-center gap-1.5 text-[#8B949E]">
              <Terminal className="w-3.5 h-3.5 text-[#EA1D2C]" />
              <span>Session Tokens:</span>
              <strong className="text-[#E6EDF3]">
                {totalTokensSession.toLocaleString('pt-BR')}
              </strong>
            </div>
          </div>

          {/* Seletor de Modo de Inferência */}
          <div className="flex items-center rounded-md bg-[#161B22] p-0.5 border border-[#30363D] text-xs">
            <button
              type="button"
              onClick={() => onExecutionModeChange('GEMINI_INTERACTIONS_API')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors font-medium ${
                executionMode === 'GEMINI_INTERACTIONS_API'
                  ? 'bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/40'
                  : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
              title="Executa via SDK @google/genai (client.interactions.create com gemini-3.8-flash)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini 3.8 Flash</span>
            </button>
            <button
              type="button"
              onClick={() => onExecutionModeChange('DETERMINISTIC_ENGINE')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors font-medium ${
                executionMode === 'DETERMINISTIC_ENGINE'
                  ? 'bg-[#EA1D2C]/20 text-[#EA1D2C] border border-[#EA1D2C]/40'
                  : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
              title="Executa o motor especialista determinístico local com garantia de schema JSON"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Local RAG Engine</span>
            </button>
          </div>

          {/* Botão API Key */}
          <button
            type="button"
            onClick={() => {
              setDraftKey(apiKey);
              setShowKeyModal(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono border transition-colors ${
              apiKey
                ? 'bg-[#3FB950]/10 border-[#3FB950]/40 text-[#3FB950]'
                : 'bg-[#161B22] border-[#30363D] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#58A6FF]/50'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{apiKey ? 'API Key Ativa' : 'Configurar API Key'}</span>
          </button>

          {/* Exportar / Limpar Logs */}
          <button
            type="button"
            onClick={onExportLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono bg-[#161B22] border border-[#30363D] text-[#8B949E] hover:text-[#58A6FF] hover:border-[#58A6FF]/40 disabled:opacity-40 transition-colors"
            title="Exportar dump JSON da tabela tb_nexus_orchestrator_logs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dump JSON</span>
          </button>

          <button
            type="button"
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-mono bg-[#161B22] border border-[#30363D] text-[#8B949E] hover:text-[#EA1D2C] hover:border-[#EA1D2C]/40 disabled:opacity-40 transition-colors"
            title="Limpar tabela tb_nexus_orchestrator_logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal de Configuração de Chave da Interactions API */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#161B22] border border-[#30363D] p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#58A6FF]" />
                <h2 className="text-sm font-bold text-[#E6EDF3]">
                  Credencial Google Gemini Interactions API
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-xs text-[#8B949E] hover:text-white"
              >
                ESC
              </button>
            </div>
            <p className="text-xs text-[#8B949E] mb-4 leading-relaxed">
              Informe sua <code className="text-[#58A6FF]">GEMINI_API_KEY</code> para
              executar chamadas reais via SDK <code className="text-[#E6EDF3]">@google/genai</code>{' '}
              (<code className="text-[#E6EDF3]">client.interactions.create</code> com{' '}
              <code className="text-[#58A6FF]">gemini-3.8-flash</code>). Caso deixe em
              branco, o Nexus Orchestrator opera automaticamente com o motor especialista
              determinístico local mantendo 100% do contrato JSON Schema.
            </p>
            <form onSubmit={handleSaveKey} className="space-y-3">
              <input
                type="password"
                value={draftKey}
                onChange={(e) => setDraftKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 rounded-lg bg-[#0D1117] border border-[#30363D] text-xs font-mono text-[#E6EDF3] focus:outline-none focus:border-[#58A6FF]"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraftKey('');
                    onApiKeyChange('');
                    setShowKeyModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#8B949E] hover:text-[#E6EDF3] border border-[#30363D]"
                >
                  Usar Motor Local
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#58A6FF] text-[#0D1117] hover:bg-[#58A6FF]/90"
                >
                  Salvar Credencial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
