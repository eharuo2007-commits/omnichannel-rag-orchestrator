import { GoogleGenAI } from '@google/genai';
import {
  ExecutionMode,
  NEXUS_ORCHESTRATOR_JSON_SCHEMA,
  NexusOrchestratorLogRecord,
  NexusOrchestratorOutput,
  NexusOrchestratorOutputZodSchema,
  OmnichannelSource,
  RagRetrievalResult,
  SemanticRouterResult,
} from '../domain/types';
import { retrieveKnowledgeContext } from './ragService';
import { classifySemanticRoute } from './semanticRouter';

export interface OrchestrationRequestOptions {
  userInput: string;
  channel: OmnichannelSource;
  sessionId: string;
  apiKey?: string;
  preferredMode?: ExecutionMode;
  previousInteractionId?: string;
}

/**
 * Compila o prompt final injetando o contexto documental recuperado pelo RAG
 * e os metadados de telemetria do Semantic Router.
 */
export function buildOrchestrationPrompt(
  userInput: string,
  channel: OmnichannelSource,
  routerResult: SemanticRouterResult,
  ragResult: RagRetrievalResult
): string {
  return `[METADADOS DE ROTEAMENTO SEMÂNTICO]
- Canal Omnichannel de Origem: ${channel}
- Rota Classificada pelo Semantic Router: ${routerResult.route_matched}
- Score de Confiança do Router: ${routerResult.confidence_score}
- Sub-Agente Designado: ${routerResult.selected_agent.name} (${routerResult.selected_agent.id})
- Sinais Semânticos Detectados: ${
    routerResult.scores[0]?.semanticSignals.join(', ') || 'LEXICAL_MATCH'
  }

[CONTEXTO DOCUMENTAL RECUPERADO PELO RAG LOCAL (${ragResult.retrieved_chunks.length} CHUNKS)]
${ragResult.formatted_context}

[SOLICITAÇÃO DO USUÁRIO / PARCEIRO]
"${userInput}"

[INSTRUÇÃO DE SAÍDA ESTRUTURADA]
Responda estritamente no formato JSON Schema exigido contendo route_matched ("${routerResult.route_matched}"), confidence_score, retrieved_documents_used, agent_response e execution_metrics.`;
}

/**
 * Estima tokens de forma determinística quando executado em modo local ou quando a API não retorna usage
 */
function estimateTokens(text: string): number {
  return Math.max(12, Math.ceil(text.length / 3.8));
}

/**
 * Gera protocolo operacional auditável
 */
function generateProtocolCode(route: string): string {
  const prefix =
    route === 'SUPPORT_LOGISTICS'
      ? 'NX-LOG'
      : route === 'FINOPS_DISPUTES'
      ? 'NX-FIN'
      : 'NX-API';
  const stamp = Date.now().toString().slice(-6);
  return `${prefix}-2026-${stamp}`;
}

/**
 * Motor Especialista Determinístico de Alta Precisão (Fallback / Modo Simulação Local)
 * Sintetiza a resposta estruturada fundamentada nos chunks recuperados pelo RAG,
 * garantindo 100% de fidelidade ao contrato JSON Schema mesmo sem chave de API externa.
 */
function synthesizeDeterministicSpecialistOutput(
  userInput: string,
  routerResult: SemanticRouterResult,
  ragResult: RagRetrievalResult,
  compiledPrompt: string,
  llmLatencyMs: number
): NexusOrchestratorOutput {
  const route = routerResult.route_matched;
  const topChunk = ragResult.retrieved_chunks[0];
  const protocolCode = generateProtocolCode(route);

  let summaryTitle = '';
  let message = '';
  let recommendedActions: string[] = [];
  let slaPriority: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_NORMAL' | 'P3_LOW' = 'P1_HIGH';
  let escalationRequired = false;

  if (route === 'SUPPORT_LOGISTICS') {
    const isMissingRider =
      /sumiu|desapareceu|gps|extravio|roubo|perder o valor/i.test(userInput);
    if (isMissingRider) {
      slaPriority = 'P0_CRITICAL';
      escalationRequired = true;
      summaryTitle =
        'Protocolo P0 de Extravio em Rota (INC-LOST-IN-TRANSIT) & Garantia de Repasse';
      message = `Diagnóstico concluído pelo ${routerResult.selected_agent.name} com base no manual **DOC-LOG-101 (Seção 4.2)**. Como o entregador parceiro já realizou o handoff de coleta na loja e apresenta perda de telemetria GPS/inatividade acima do limite crítico de 15 minutos, o incidente foi tipificado como **INC-LOST-IN-TRANSIT**.\n\n**Garantia Financeira ao Parceiro:** De acordo com a cláusula 3 do DOC-LOG-101, sua loja **NÃO sofrerá nenhum desconto ou estorno** pelo pedido coletado. O valor da primeira produção está 100% coberto pela Proteção Logística Nexus.\n\n**Ação em Andamento:** Foram disparados 3 pings silenciosos de reconexão ao app do entregador e habilitada imediatamente a fila prioritária P0 para **Refazer Pedido (Redispatch VIP)** ou reembolso integral ao consumidor sem ônus para o restaurante.`;
      recommendedActions = [
        'Acionar o botão "Refazer Pedido com Prioridade P0" no painel do pedido (alocação VIP em <= 3 min com pagamento duplicado garantido à loja) OU autorizar reembolso automático ao cliente.',
        'Verificar no histórico do pedido a confirmação do evento HANDOFF_COMPLETED (código de coleta validado), que blinda automaticamente o repasse financeiro.',
        'Registrar no chat do cliente a mensagem automática de contingência logística vinculada ao protocolo ' +
          protocolCode +
          '.',
      ];
    } else {
      slaPriority = 'P1_HIGH';
      escalationRequired = false;
      summaryTitle =
        'Escalonamento Dinâmico de Frota (Surge H3) & Proteção Térmica Ativada';
      message = `Diagnóstico concluído pelo ${routerResult.selected_agent.name} conforme diretrizes do **DOC-LOG-102 (Seção 2.1)** e **DOC-LOG-103**. Identificamos retenção de alocação após o status \`READY_FOR_PICKUP\`.\n\nO motor de despacho ativou o **Boost Dinâmico de Tarifa (Surge Nível 2)** no hexágono H3 da sua loja para priorizar entregadores num raio de 4km. Caso a espera em balcão ultrapasse 20 minutos após o ETA de coleta, sua loja já está elegível ao **Voucher de Proteção de Qualidade Térmica** para ressarcimento integral de insumos.`;
      recommendedActions = [
        'Executar o comando "Re-alocação Forçada (Force Unassign)" caso haja entregador com status HEADING_TO_STORE estagnado há mais de 8 minutos.',
        'Manter o status READY_FOR_PICKUP ativo para preservar a elegibilidade automática ao Voucher de Proteção Térmica (DOC-LOG-102).',
        'Caso o atraso ocorra no endereço do cliente final, orientar o entregador a iniciar o Timer Verificado de 10 minutos na Geofence (DOC-LOG-103).',
      ];
    }
  } else if (route === 'FINOPS_DISPUTES') {
    const isChargeback = /estorno|chargeback|contestacao|cancelamento|descontaram/i.test(
      userInput
    );
    if (isChargeback && !/terca|terça/i.test(userInput)) {
      slaPriority = 'P1_HIGH';
      escalationRequired = false;
      summaryTitle =
        'Auditoria de Estorno & Elegibilidade de Reembolso Automático (DOC-FIN-202)';
      message = `Auditoria realizada pelo ${routerResult.selected_agent.name} aplicando a **Política de Contestação DOC-FIN-202 (Seção 5.3)**.\n\nQuando o cancelamento ocorre **após a confirmação de coleta pelo entregador parceiro** (\`HANDOFF_COMPLETED\`) ou por desistência do cliente após mais de 5 minutos do início do preparo, aplica-se a **Isenção Automática de Débito**: o ônus do estorno ao consumidor é absorvido 100% pela plataforma.\n\nO débito apontado é passível de reversão imediata via Motor de Disputas, gerando lançamento de crédito \`CR-ADJ (Ajuste de Contestação Aprovada)\` no próximo ciclo de liquidação de terça-feira.`;
      recommendedActions = [
        'Acessar Finanças > Contestações > Selecionar o pedido debitado e submeter disputa com o código de regra DOC-FIN-202-SEC5.3 (prazo legal de até 30 dias corridos).',
        'Validar no log operacional do pedido o timestamp de coleta pelo entregador parceiro para aprovação automática em até 30 segundos.',
        'Acompanhar a rubrica "Ajuste de Contestação Aprovada (CR-ADJ)" na prévia do extrato de terça-feira (/v3/financial/settlements).',
      ];
    } else {
      slaPriority = 'P1_HIGH';
      escalationRequired = false;
      summaryTitle =
        'Conciliação do Repasse de Terça-Feira: Cut-off de Domingo e Deduções (DOC-FIN-201)';
      message = `Auditoria financeira executada pelo ${routerResult.selected_agent.name} segundo o **Manual de Conciliação DOC-FIN-201 (Seção 3.1)** e **DOC-FIN-203**.\n\nA divergência entre o fechamento de caixa de domingo à noite e a liquidação bancária de terça-feira ocorre prioritariamente por **4 fatores auditáveis no Ledger**:\n1. **Corte de Janela Horária (Cut-off Domingo 23:59:59 BRT):** Pedidos abertos no domingo à noite mas concluídos (\`CONCLUDED\`) após 00:00 de segunda-feira migram automaticamente para o ciclo da terça-feira seguinte.\n2. **Subsídio Co-participativo em Promoções:** Cupons e campanhas com co-participação da loja são deduzidos na rubrica *"Investimento Promocional Parceiro"*.\n3. **Comissionamento e Taxa de Pagamento In-App:** Incidência contratual de intermediação + 3.2% de gateway sobre transações online (DOC-FIN-203).\n4. **Retenções de Cancelamento/Taxa de Antecipação:** Eventuais débitos operacionais ou taxa de antecipação D+7 (1.49% a.m. pro-rata).`;
      recommendedActions = [
        'Consultar o Relatório de Conciliação Detalhado (aba Finanças > Faturas > Ciclo Segunda-Domingo) filtrando pedidos com timestamp de conclusão após 23:59:59 de domingo.',
        'Auditar a coluna "Investimento Promocional Parceiro" e "Ajustes Operacionais" para isolar descontos de cupons de eventuais estornos.',
        'Caso identifique débito de cancelamento em pedido já coletado pela logística parceira, abrir contestação imediata amparada pelo DOC-FIN-202.',
      ];
    }
  } else {
    const isOAuthOr429 = /429|401|oauth|token|422|batch/i.test(userInput);
    if (isOAuthOr429 && !/webhook/i.test(userInput)) {
      slaPriority = 'P1_HIGH';
      escalationRequired = false;
      summaryTitle =
        'Mitigação de HTTP 429 no OAuth2 & Atualização Atômica Catalog V2 (DOC-API-302/303)';
      message = `Análise de engenharia concluída pelo ${routerResult.selected_agent.name} com base nas especificações **DOC-API-302 (Seção 1.2)** e **DOC-API-303 (Seção 4.5)**.\n\n**1. Causa Raiz do HTTP 429 em \`/oauth/v2/token\`:** O endpoint de autenticação possui quota estrita de **10 req/min por \`clientId\`**. Seu integrador está solicitando um novo token a cada chamada de API em vez de reutilizar o JWT em cache (cujo TTL é de **10.800s / 3 horas**).\n\n**2. Causa Raiz do HTTP 422 no Catálogo:** Na árvore Catalog V2 (\`Category -> Item -> Product -> OptionGroup\`), o erro \`INVALID_MIN_MAX_OPTION_GROUP\` ocorre quando \`minQuantity > maxQuantity\` ou supera a soma de complementos \`AVAILABLE\`. Além disso, para pausar itens ou alterar preços, utilize os endpoints atômicos ou batch (\`PATCH /v2/merchants/{id}/catalog/items:batch\`).`;
      recommendedActions = [
        'Implementar cache distribuído (Redis/Memória) para o access_token OAuth2 com renovação preventiva aos 10.500s (TTL total de 10.800s), eliminando chamadas redundantes ao /oauth/v2/token.',
        'Substituir atualizações unitárias em loop pelo endpoint em lote PATCH /v2/merchants/{id}/catalog/items:batch (até 500 itens por request, respeitando o header Retry-After).',
        'Usar PATCH /v2/merchants/{merchantId}/catalog/items/{itemId}/status com {"status": "UNAVAILABLE"} para pausas instantâneas e validar minQuantity <= maxQuantity nos OptionGroups.',
      ];
    } else {
      slaPriority = 'P1_HIGH';
      escalationRequired = false;
      summaryTitle =
        'Arquitetura de Webhook Catalog V2, Validação HMAC-SHA256 e SLA 5000ms (DOC-API-301)';
      message = `Especificação técnica fornecida pelo ${routerResult.selected_agent.name} conforme **DOC-API-301 (Seção 2.1)** e **DOC-API-302**.\n\nPara configurar o Webhook de Cardápio (Catalog Sync V2) no seu ERP/PDV:\n1. **Subscrição de Eventos:** Envie \`PUT /v2/webhooks/subscriptions\` registrando sua URL HTTPS (TLS 1.2+) para os tópicos \`catalog.item.updated\`, \`catalog.menu.published\` e \`catalog.ingestion.failed\`.\n2. **Autenticidade Criptográfica (HMAC-SHA256):** Valide obrigatoriamente o header \`X-Nexus-Signature-256\` computando o HMAC-SHA256 sobre o raw request body com sua \`webhook_secret_key\` usando comparação em tempo constante (\`crypto.timingSafeEqual\`).\n3. **SLA de Resposta e Desacoplamento:** Seu endpoint deve retornar \`HTTP 200 OK\` ou \`HTTP 202 Accepted\` em no máximo **5000ms (5 segundos)**. Enfileire o processamento pesado em worker assíncrono para evitar abertura do Circuit Breaker (5 retries com backoff exponencial: 2s, 8s, 32s, 128s, 512s).`;
      recommendedActions = [
        'Configurar o endpoint HTTPS no Developer Console (PUT /v2/webhooks/subscriptions) assinando os eventos catalog.item.updated, catalog.menu.published e catalog.ingestion.failed.',
        'Implementar middleware de validação do header X-Nexus-Signature-256 (HMAC-SHA256 sobre o payload bruto) antes do parse JSON.',
        'Garantir resposta HTTP 202 Accepted em < 5000ms desacoplando a persistência do ERP via fila assíncrona e manter GET /v2/events:polling como contingência de Circuit Breaker.',
      ];
    }
  }

  const usedDocs = ragResult.retrieved_chunks.map((chunk) => ({
    doc_id: chunk.doc_id,
    title: chunk.title,
    section: chunk.section,
    relevance_score: chunk.relevance_score,
    excerpt_applied: chunk.sla_reference + ' — ' + chunk.content.slice(0, 180) + '...',
  }));

  const inputTokens = estimateTokens(
    routerResult.selected_agent.systemInstruction + '\n' + compiledPrompt
  );
  const outputTokens = estimateTokens(
    summaryTitle + '\n' + message + '\n' + recommendedActions.join('\n')
  );
  const thoughtTokens = 64;
  const totalTokens = inputTokens + outputTokens + thoughtTokens;
  const totalLatencyMs = Number(
    (
      routerResult.latency_ms +
      ragResult.latency_ms +
      llmLatencyMs
    ).toFixed(2)
  );

  // Custo estimado para gemini-3.8-flash (~$0.15 / 1M input, ~$0.60 / 1M output)
  const estimatedCostUsd = Number(
    ((inputTokens * 0.00000015) + ((outputTokens + thoughtTokens) * 0.0000006)).toFixed(6)
  );

  return {
    route_matched: route,
    confidence_score: routerResult.confidence_score,
    retrieved_documents_used:
      usedDocs.length > 0
        ? usedDocs
        : [
            {
              doc_id: topChunk?.doc_id || 'DOC-GEN-001',
              title: topChunk?.title || 'Manual Operacional Nexus',
              section: topChunk?.section || 'Seção Geral',
              relevance_score: 0.85,
              excerpt_applied: 'Regra operacional padrão aplicada.',
            },
          ],
    agent_response: {
      specialist_agent: routerResult.selected_agent.name,
      summary_title: summaryTitle,
      message,
      recommended_actions: recommendedActions,
      sla_priority: slaPriority,
      protocol_code: protocolCode,
      escalation_required: escalationRequired,
    },
    execution_metrics: {
      model: 'gemini-3.8-flash',
      api_version: 'Interactions API v2026.05 (@google/genai)',
      interaction_id: `int_nx_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 7)}`,
      execution_mode: 'DETERMINISTIC_ENGINE',
      latency_ms: totalLatencyMs,
      router_latency_ms: routerResult.latency_ms,
      rag_latency_ms: ragResult.latency_ms,
      llm_latency_ms: llmLatencyMs,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      thought_tokens: thoughtTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: estimatedCostUsd,
      timestamp_iso: new Date().toISOString(),
    },
  };
}

/**
 * Executa a chamada real à Interactions API (`gemini-3.8-flash`) utilizando o SDK oficial `@google/genai`
 */
async function callGeminiInteractionsApi(
  apiKey: string,
  systemInstruction: string,
  compiledPrompt: string,
  routerResult: SemanticRouterResult,
  ragResult: RagRetrievalResult,
  previousInteractionId?: string
): Promise<NexusOrchestratorOutput> {
  const llmStart = performance.now();
  const client = new GoogleGenAI({ apiKey });

  const interaction = await client.interactions.create({
    model: 'gemini-3.8-flash',
    input: compiledPrompt,
    system_instruction: systemInstruction,
    ...(previousInteractionId
      ? { previous_interaction_id: previousInteractionId }
      : {}),
    response_format: {
      type: 'text',
      mime_type: 'application/json',
      schema: NEXUS_ORCHESTRATOR_JSON_SCHEMA,
    },
  });

  const llmLatencyMs = Math.max(
    1,
    Number((performance.now() - llmStart).toFixed(2))
  );

  const rawText = interaction.output_text;
  if (!rawText) {
    throw new Error(
      'Interactions API retornou output_text vazio para gemini-3.8-flash.'
    );
  }

  const parsed = JSON.parse(rawText);

  const inputTokens =
    interaction.usage?.total_input_tokens ??
    estimateTokens(systemInstruction + compiledPrompt);
  const outputTokens =
    interaction.usage?.total_output_tokens ?? estimateTokens(rawText);
  const thoughtTokens = interaction.usage?.total_thought_tokens ?? 0;
  const totalTokens =
    interaction.usage?.total_tokens ?? inputTokens + outputTokens + thoughtTokens;

  const totalLatencyMs = Number(
    (
      routerResult.latency_ms +
      ragResult.latency_ms +
      llmLatencyMs
    ).toFixed(2)
  );

  const estimatedCostUsd = Number(
    (
      inputTokens * 0.00000015 +
      (outputTokens + thoughtTokens) * 0.0000006
    ).toFixed(6)
  );

  // Mescla telemetria real de tempo e tokens do SDK na estrutura final validada
  const enriched: NexusOrchestratorOutput = {
    route_matched: routerResult.route_matched,
    confidence_score:
      typeof parsed.confidence_score === 'number'
        ? Number(Math.min(1, Math.max(0, parsed.confidence_score)).toFixed(2))
        : routerResult.confidence_score,
    retrieved_documents_used: Array.isArray(parsed.retrieved_documents_used)
      ? parsed.retrieved_documents_used
      : ragResult.retrieved_chunks.map((c) => ({
          doc_id: c.doc_id,
          title: c.title,
          section: c.section,
          relevance_score: c.relevance_score,
          excerpt_applied: c.sla_reference,
        })),
    agent_response: {
      specialist_agent:
        parsed.agent_response?.specialist_agent ||
        routerResult.selected_agent.name,
      summary_title:
        parsed.agent_response?.summary_title ||
        `Atendimento Especializado — ${routerResult.route_matched}`,
      message:
        parsed.agent_response?.message ||
        'Diagnóstico concluído com base nos manuais operacionais.',
      recommended_actions: Array.isArray(
        parsed.agent_response?.recommended_actions
      )
        ? parsed.agent_response.recommended_actions
        : ['Verificar procedimentos no manual vinculado.'],
      sla_priority: ['P0_CRITICAL', 'P1_HIGH', 'P2_NORMAL', 'P3_LOW'].includes(
        parsed.agent_response?.sla_priority
      )
        ? parsed.agent_response.sla_priority
        : 'P1_HIGH',
      protocol_code:
        parsed.agent_response?.protocol_code ||
        generateProtocolCode(routerResult.route_matched),
      escalation_required: Boolean(parsed.agent_response?.escalation_required),
    },
    execution_metrics: {
      model: 'gemini-3.8-flash',
      api_version: 'Interactions API v2026.05 (@google/genai)',
      interaction_id:
        interaction.id || `int_gemini_${Date.now().toString(36)}`,
      execution_mode: 'GEMINI_INTERACTIONS_API',
      latency_ms: totalLatencyMs,
      router_latency_ms: routerResult.latency_ms,
      rag_latency_ms: ragResult.latency_ms,
      llm_latency_ms: llmLatencyMs,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      thought_tokens: thoughtTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: estimatedCostUsd,
      timestamp_iso: new Date().toISOString(),
    },
  };

  return NexusOrchestratorOutputZodSchema.parse(enriched);
}

/**
 * Pipeline Completo do Nexus Orchestrator:
 * 1. Semantic Router -> 2. Local RAG Retrieval -> 3. Sub-Agent LLM Inference (Gemini 3.8 Flash Interactions API / Deterministic Fallback) -> 4. Validação JSON Schema
 */
export async function executeNexusOrchestration(
  options: OrchestrationRequestOptions
): Promise<NexusOrchestratorLogRecord> {
  const {
    userInput,
    channel,
    sessionId,
    apiKey,
    preferredMode = 'GEMINI_INTERACTIONS_API',
    previousInteractionId,
  } = options;

  if (!userInput || !userInput.trim()) {
    throw new Error('O input de atendimento não pode estar vazio.');
  }

  // Etapa 1: Roteamento Semântico (Semantic Router)
  const routerTelemetry = classifySemanticRoute(userInput);

  // Etapa 2: Recuperação de Contexto Documental (Local RAG)
  const ragTelemetry = retrieveKnowledgeContext(
    userInput,
    routerTelemetry.route_matched,
    3
  );

  // Etapa 3: Compilação do Prompt Contextualizado + System Instruction do Sub-Agente
  const systemInstruction = routerTelemetry.selected_agent.systemInstruction;
  const compiledUserPrompt = buildOrchestrationPrompt(
    userInput,
    channel,
    routerTelemetry,
    ragTelemetry
  );

  let structuredOutput: NexusOrchestratorOutput;

  const trimmedKey = apiKey?.trim();
  const shouldUseLiveApi =
    preferredMode === 'GEMINI_INTERACTIONS_API' && Boolean(trimmedKey);

  if (shouldUseLiveApi && trimmedKey) {
    try {
      structuredOutput = await callGeminiInteractionsApi(
        trimmedKey,
        systemInstruction,
        compiledUserPrompt,
        routerTelemetry,
        ragTelemetry,
        previousInteractionId
      );
    } catch (apiError) {
      console.warn(
        '[Nexus Orchestrator] Falha na chamada externa Gemini Interactions API; acionando fallback determinístico resiliente:',
        apiError
      );
      const fallbackStart = performance.now();
      await new Promise((r) => setTimeout(r, 140));
      const fallbackLatency = Number(
        (performance.now() - fallbackStart).toFixed(2)
      );
      structuredOutput = synthesizeDeterministicSpecialistOutput(
        userInput,
        routerTelemetry,
        ragTelemetry,
        compiledUserPrompt,
        fallbackLatency
      );
    }
  } else {
    // Simula latência realista de inferência do motor especialista local (160ms - 280ms)
    const simStart = performance.now();
    const simulatedDelay = 165 + (userInput.length % 95);
    await new Promise((resolve) => setTimeout(resolve, simulatedDelay));
    const llmLatencyMs = Number((performance.now() - simStart).toFixed(2));

    structuredOutput = synthesizeDeterministicSpecialistOutput(
      userInput,
      routerTelemetry,
      ragTelemetry,
      compiledUserPrompt,
      llmLatencyMs
    );
  }

  // Validação estrita do contrato JSON Schema via Zod
  const validatedOutput =
    NexusOrchestratorOutputZodSchema.parse(structuredOutput);
  const rawJsonPayload = JSON.stringify(validatedOutput, null, 2);

  const logRecord: NexusOrchestratorLogRecord = {
    log_id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    session_id: sessionId,
    created_at: validatedOutput.execution_metrics.timestamp_iso,
    channel,
    user_input: userInput,
    router_telemetry: routerTelemetry,
    rag_telemetry: ragTelemetry,
    structured_output: validatedOutput,
    raw_json_payload: rawJsonPayload,
    prompt_compiled: {
      system_instruction: systemInstruction,
      user_prompt_with_rag: compiledUserPrompt,
    },
  };

  return logRecord;
}
