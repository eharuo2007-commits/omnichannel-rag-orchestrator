import React, { useEffect, useState, useCallback } from 'react';
import { PRESET_SCENARIOS } from './domain/knowledgeBase';
import {
  ExecutionMode,
  NexusOrchestratorLogRecord,
  OmnichannelSource,
} from './domain/types';
import { executeNexusOrchestration } from './services/geminiOrchestrator';
import {
  clearOrchestratorLogs,
  exportLogsAsJsonString,
  insertOrchestratorLog,
  listOrchestratorLogs,
} from './storage/orchestratorStorage';
import { HeaderBar } from './ui/HeaderBar';
import { OmnichannelSimulator } from './ui/OmnichannelSimulator';
import { OrchestrationXRay } from './ui/OrchestrationXRay';

const API_KEY_STORAGE = 'nexus_gemini_api_key';

export const App: React.FC = () => {
  const [logs, setLogs] = useState<NexusOrchestratorLogRecord[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [sessionId] = useState<string>(
    () => `sess_${Date.now().toString(36)}`
  );
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(API_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  });
  const [executionMode, setExecutionMode] = useState<ExecutionMode>(
    'GEMINI_INTERACTIONS_API'
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineStage, setPipelineStage] = useState<
    'IDLE' | 'ROUTING' | 'RAG_RETRIEVAL' | 'LLM_INFERENCE'
  >('IDLE');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    try {
      if (newKey) {
        localStorage.setItem(API_KEY_STORAGE, newKey);
      } else {
        localStorage.removeItem(API_KEY_STORAGE);
      }
    } catch {
      // ignore storage errors
    }
  };

  const handleSubmitPrompt = useCallback(
    async (prompt: string, channel: OmnichannelSource) => {
      setErrorBanner(null);
      setIsProcessing(true);
      try {
        setPipelineStage('ROUTING');
        await new Promise((r) => setTimeout(r, 70));
        setPipelineStage('RAG_RETRIEVAL');
        await new Promise((r) => setTimeout(r, 70));
        setPipelineStage('LLM_INFERENCE');

        const previousInteractionId =
          logs.length > 0 &&
          logs[0].structured_output.execution_metrics.execution_mode ===
            'GEMINI_INTERACTIONS_API'
            ? logs[0].structured_output.execution_metrics.interaction_id
            : undefined;

        const record = await executeNexusOrchestration({
          userInput: prompt,
          channel,
          sessionId,
          apiKey,
          preferredMode: executionMode,
          previousInteractionId,
        });

        await insertOrchestratorLog(record);
        const updated = await listOrchestratorLogs('ALL');
        setLogs(updated);
        setSelectedLogId(record.log_id);
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Erro inesperado durante a orquestração.';
        setErrorBanner(msg);
      } finally {
        setPipelineStage('IDLE');
        setIsProcessing(false);
      }
    },
    [apiKey, executionMode, logs, sessionId]
  );

  // Carrega o histórico de tb_nexus_orchestrator_logs ou inicializa com o primeiro cenário canônico
  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await listOrchestratorLogs('ALL');
      if (!mounted) return;
      if (stored.length > 0) {
        setLogs(stored);
        setSelectedLogId(stored[0].log_id);
      } else {
        // Executa cenário inicial de demonstração para popular o Raio-X imediatamente
        const initialScenario = PRESET_SCENARIOS[0];
        const initialRecord = await executeNexusOrchestration({
          userInput: initialScenario.prompt,
          channel: initialScenario.channel,
          sessionId,
          apiKey: '',
          preferredMode: 'DETERMINISTIC_ENGINE',
        });
        await insertOrchestratorLog(initialRecord);
        if (!mounted) return;
        setLogs([initialRecord]);
        setSelectedLogId(initialRecord.log_id);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const handleClearLogs = async () => {
    await clearOrchestratorLogs();
    setLogs([]);
    setSelectedLogId(null);
  };

  const handleExportLogs = () => {
    const jsonString = exportLogsAsJsonString(logs);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tb_nexus_orchestrator_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeRecord =
    logs.find((l) => l.log_id === selectedLogId) || logs[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#0D1117] text-[#E6EDF3]">
      <HeaderBar
        logs={logs}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        executionMode={executionMode}
        onExecutionModeChange={setExecutionMode}
        onClearLogs={handleClearLogs}
        onExportLogs={handleExportLogs}
      />

      {errorBanner && (
        <div className="max-w-[1920px] w-full mx-auto px-4 pt-3">
          <div className="px-4 py-2.5 rounded-lg bg-[#EA1D2C]/15 border border-[#EA1D2C] text-xs font-mono text-[#EA1D2C] flex items-center justify-between">
            <span>[ORCHESTRATOR EXCEPTION]: {errorBanner}</span>
            <button
              type="button"
              onClick={() => setErrorBanner(null)}
              className="underline ml-4"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Layout Split-View de Engenharia (2 Colunas Principais) */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Coluna Esquerda: Simulador Omnichannel (5 cols em telas largas) */}
        <div className="lg:col-span-5 flex flex-col min-h-[640px]">
          <OmnichannelSimulator
            logs={logs}
            selectedLogId={activeRecord?.log_id || null}
            onSelectLog={setSelectedLogId}
            onSubmitPrompt={handleSubmitPrompt}
            isProcessing={isProcessing}
            pipelineStage={pipelineStage}
          />
        </div>

        {/* Coluna Direita: Raio-X de Orquestração / Observabilidade (7 cols em telas largas) */}
        <div className="lg:col-span-7 flex flex-col min-h-[640px]">
          <OrchestrationXRay
            activeRecord={activeRecord}
            allLogs={logs}
            onSelectLog={setSelectedLogId}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
