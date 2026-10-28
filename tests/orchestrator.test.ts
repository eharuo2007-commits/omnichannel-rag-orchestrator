import { describe, expect, it, beforeEach } from 'vitest';
import { classifySemanticRoute } from '../src/services/semanticRouter';
import { retrieveKnowledgeContext } from '../src/services/ragService';
import { executeNexusOrchestration } from '../src/services/geminiOrchestrator';
import { NexusOrchestratorOutputZodSchema } from '../src/domain/types';
import {
  clearOrchestratorLogs,
  insertOrchestratorLog,
  listOrchestratorLogs,
} from '../src/storage/orchestratorStorage';

describe('Nexus Orchestrator — Arquitetura Multi-Agente, Semantic Router & RAG', () => {
  beforeEach(async () => {
    await clearOrchestratorLogs();
  });

  it('classifica corretamente a rota SUPPORT_LOGISTICS para incidentes de entregador e atraso', () => {
    const result = classifySemanticRoute(
      'O entregador sumiu com o pedido #8842 há mais de 20 minutos e o GPS travou'
    );
    expect(result.route_matched).toBe('SUPPORT_LOGISTICS');
    expect(result.confidence_score).toBeGreaterThanOrEqual(0.75);
    expect(result.selected_agent.route).toBe('SUPPORT_LOGISTICS');
  });

  it('classifica corretamente a rota FINOPS_DISPUTES para divergências de repasse e estornos', () => {
    const result = classifySemanticRoute(
      'Meu repasse de terça-feira veio menor do que o faturamento de domingo e descontaram estorno'
    );
    expect(result.route_matched).toBe('FINOPS_DISPUTES');
    expect(result.confidence_score).toBeGreaterThanOrEqual(0.75);
    expect(result.selected_agent.route).toBe('FINOPS_DISPUTES');
  });

  it('classifica corretamente a rota API_INTEGRATION para dúvidas de webhook, cardápio e OAuth2', () => {
    const result = classifySemanticRoute(
      'Como configuro o webhook de cardápio (Catalog V2) e valido o header HMAC com token OAuth2?'
    );
    expect(result.route_matched).toBe('API_INTEGRATION');
    expect(result.confidence_score).toBeGreaterThanOrEqual(0.75);
    expect(result.selected_agent.route).toBe('API_INTEGRATION');
  });

  it('recupera os chunks documentais corretos do RAG Local com base na rota e query', () => {
    const ragLogistics = retrieveKnowledgeContext(
      'O entregador sumiu com o pedido',
      'SUPPORT_LOGISTICS'
    );
    expect(ragLogistics.retrieved_chunks.length).toBeGreaterThan(0);
    expect(ragLogistics.retrieved_chunks[0].doc_id).toBe('DOC-LOG-101');

    const ragFinops = retrieveKnowledgeContext(
      'Meu repasse de terça-feira veio menor',
      'FINOPS_DISPUTES'
    );
    expect(ragFinops.retrieved_chunks[0].doc_id).toBe('DOC-FIN-201');

    const ragApi = retrieveKnowledgeContext(
      'Como configuro o webhook de cardápio?',
      'API_INTEGRATION'
    );
    expect(ragApi.retrieved_chunks[0].doc_id).toBe('DOC-API-301');
  });

  it('executa o pipeline completo e retorna payload estritamente aderente ao JSON Schema', async () => {
    const logRecord = await executeNexusOrchestration({
      userInput: 'Como configuro o webhook de cardápio?',
      channel: 'DEVELOPER_CONSOLE',
      sessionId: 'test_sess_01',
      preferredMode: 'DETERMINISTIC_ENGINE',
    });

    const parsed = NexusOrchestratorOutputZodSchema.parse(
      logRecord.structured_output
    );
    expect(parsed.route_matched).toBe('API_INTEGRATION');
    expect(parsed.retrieved_documents_used.length).toBeGreaterThan(0);
    expect(parsed.execution_metrics.model).toBe('gemini-3.8-flash');
    expect(parsed.execution_metrics.total_tokens).toBeGreaterThan(0);
    expect(parsed.execution_metrics.latency_ms).toBeGreaterThan(0);
  });

  it('persiste e filtra registros na tabela simulada tb_nexus_orchestrator_logs', async () => {
    const rec1 = await executeNexusOrchestration({
      userInput: 'O entregador sumiu com o pedido',
      channel: 'PARTNER_PORTAL',
      sessionId: 'test_sess_02',
      preferredMode: 'DETERMINISTIC_ENGINE',
    });
    const rec2 = await executeNexusOrchestration({
      userInput: 'Meu repasse de terça-feira veio menor',
      channel: 'PARTNER_PORTAL',
      sessionId: 'test_sess_02',
      preferredMode: 'DETERMINISTIC_ENGINE',
    });

    await insertOrchestratorLog(rec1);
    await insertOrchestratorLog(rec2);

    const all = await listOrchestratorLogs('ALL');
    expect(all.length).toBe(2);

    const finopsOnly = await listOrchestratorLogs('FINOPS_DISPUTES');
    expect(finopsOnly.length).toBe(1);
    expect(finopsOnly[0].structured_output.route_matched).toBe(
      'FINOPS_DISPUTES'
    );
  });
});
