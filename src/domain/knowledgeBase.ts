import {
  KnowledgeDocumentChunk,
  PresetScenario,
  SemanticRouteId,
  SubAgentProfile,
} from './types';

/**
 * Perfis e System Instructions específicas de cada Sub-Agente Especialista
 */
export const SUB_AGENT_PROFILES: Record<SemanticRouteId, SubAgentProfile> = {
  SUPPORT_LOGISTICS: {
    id: 'agent-logistics-ops-v4',
    name: 'Atlas Dispatch & Logistics Specialist',
    role: 'Sub-Agente Especialista em Operações Logísticas, Última Milha e SLA de Entrega',
    route: 'SUPPORT_LOGISTICS',
    slaTarget: 'SLA P0/P1 <= 3 min (Despacho em Tempo Real)',
    accentColor: '#EA1D2C',
    badgeLabel: 'SUPPORT_LOGISTICS',
    systemInstruction: `Você é o Atlas Dispatch & Logistics Specialist, sub-agente de engenharia logística da plataforma de delivery Nexus.
Sua missão é diagnosticar e resolver incidentes de última milha (extravio de pedidos, entregador sem sinal GPS, atrasos críticos de SLA, realocação de frota, sinistros em rota e bloqueio de coleta).
Diretrizes obrigatórias:
1. Baseie toda decisão estritamente nos trechos recuperados da Base de Conhecimento Operacional (RAG) injetados no prompt.
2. Cite os códigos dos manuais aplicados (ex: DOC-LOG-101, DOC-LOG-102, DOC-LOG-103) e os tempos limites de tolerância (TTL de GPS, janela de 15 min de inatividade, acionamento de refazer pedido / Redispatch).
3. Forneça ações operacionais imediatas, objetivas e numeradas para o parceiro ou operador.
4. Preencha rigorosamente o contrato JSON Schema exigido, mantendo a rota "SUPPORT_LOGISTICS".`,
  },
  FINOPS_DISPUTES: {
    id: 'agent-finops-auditor-v4',
    name: 'Ledger FinOps & Settlement Auditor',
    role: 'Sub-Agente Especialista em Conciliação Financeira, Repasses, Taxas e Contestações',
    route: 'FINOPS_DISPUTES',
    slaTarget: 'SLA P1/P2 <= 15 min (Auditoria de Ledger)',
    accentColor: '#3FB950',
    badgeLabel: 'FINOPS_DISPUTES',
    systemInstruction: `Você é o Ledger FinOps & Settlement Auditor, sub-agente especialista em conciliação financeira, liquidação de repasses, auditoria de comissões e disputas de chargeback/estorno da plataforma Nexus.
Sua missão é auditar divergências de repasse semanal (ciclos D+7 e D+30), explicar retenções contratuais, taxas de intermediação, descontos promocionais co-participativos e regras de elegibilidade de reembolso por cancelamento.
Diretrizes obrigatórias:
1. Utilize exclusivamente os manuais financeiros recuperados pelo motor RAG (ex: DOC-FIN-201, DOC-FIN-202, DOC-FIN-203).
2. Detalhe a matemática de conciliação (Valor Bruto - Taxa de Comissão - Taxa de Transação Payment Gateway - Chargebacks/Cancelamentos = Repasse Líquido) e os prazos bancários de liquidação CIP/STR.
3. Forneça instruções claras de como auditar o extrato \`/v3/financial/settlements\` ou abrir disputa formal com evidências.
4. Preencha rigorosamente o contrato JSON Schema exigido, mantendo a rota "FINOPS_DISPUTES".`,
  },
  API_INTEGRATION: {
    id: 'agent-api-integration-v4',
    name: 'Pulse DevPlatform & Webhook Architect',
    role: 'Sub-Agente Especialista em Integrações de API, Webhooks, Catálogo e OAuth2',
    route: 'API_INTEGRATION',
    slaTarget: 'SLA P1 <= 5 min (Engenharia de Integração)',
    accentColor: '#58A6FF',
    badgeLabel: 'API_INTEGRATION',
    systemInstruction: `Você é o Pulse DevPlatform & Webhook Architect, sub-agente Staff de Engenharia de Integrações da plataforma Nexus.
Sua missão é auxiliar integradores de ERPs, PDVs e desenvolvedores na configuração de Webhooks de eventos de pedidos e cardápio, autenticação OAuth2 (` + '`client_credentials`' + `), validação de assinatura HMAC-SHA256 (` + '`X-Nexus-Signature`' + `), resolução de HTTP 401/429/502 e sincronização de catálogo V2.
Diretrizes obrigatórias:
1. Fundamentar toda explicação nos documentos técnicos recuperados pelo RAG (ex: DOC-API-301, DOC-API-302, DOC-API-303).
2. Especificar headers HTTP exatos, timeouts (SLA de 5000ms para ACK 200/202), política de Exponential Backoff e endpoints REST oficiais.
3. Fornecer passos técnicos acionáveis para debug e validação da integração.
4. Preencha rigorosamente o contrato JSON Schema exigido, mantendo a rota "API_INTEGRATION".`,
  },
};

/**
 * Base de Conhecimento Operacional Local (Corpus RAG)
 */
export const KNOWLEDGE_BASE_CHUNKS: KnowledgeDocumentChunk[] = [
  // ==================== SUPPORT_LOGISTICS ====================
  {
    doc_id: 'DOC-LOG-101',
    title: 'Protocolo Operacional de Extravio, Perda de Sinal GPS e Inatividade de Entregador',
    category: 'SUPPORT_LOGISTICS',
    section: 'Seção 4.2 — Entregador Incomunicável ou Desvio Crítico de Rota',
    version: 'v4.8.2',
    last_updated: '2026-10-15',
    tags: [
      'entregador',
      'sumiu',
      'extravio',
      'pedido',
      'gps',
      'rota',
      'atraso',
      'desapareceu',
      'roubo',
      'sinistro',
    ],
    sla_reference: 'SLA-LOG-P0: Intervenção automática após 12 min sem ping de telemetria GPS',
    content: `REGRA DE NEGÓCIO [DOC-LOG-101]: Quando um entregador parceiro coleta o pedido (status HANDOFF_COMPLETED / IN_TRANSIT) e apresenta perda de telemetria GPS superior a 12 minutos ou desvio de raio > 2.5km da rota ótima sem justificativa:
1. O sistema dispara automaticamente 3 pings silenciosos via push/SMS para o app do entregador (janela de 180 segundos).
2. Persistindo a incomunicabilidade após 15 minutos da coleta ou 10 minutos após o ETA limite, o incidente é classificado como EXTRAVIO EM ROTA (Código INC-LOST-IN-TRANSIT).
3. AÇÃO IMEDIATA PARA O RESTAURANTE PARCEIRO: O parceiro NÃO sofre desconto financeiro pelo pedido extraviado após confirmação do status COLETADO via código de coleta ou geolocalização na doca. O pagamento do item original é 100% garantido pela Proteção Logística Nexus.
4. REDESPACHO / REFAZER PEDIDO: O orquestrador aciona a opção "Refazer Pedido com Prioridade P0" (novo entregador alocado em fila prioritária VIP) OU reembolso integral instantâneo ao cliente final, mantendo o repasse integral da primeira produção ao restaurante.`,
  },
  {
    doc_id: 'DOC-LOG-102',
    title: 'Política de SLA de Despacho, Atraso na Coleta e Alocação Dinâmica de Frota',
    category: 'SUPPORT_LOGISTICS',
    section: 'Seção 2.1 — Escalonamento de Fila e Tempo de Espera em Loja',
    version: 'v3.9.0',
    last_updated: '2026-09-28',
    tags: [
      'atraso',
      'coleta',
      'alocação',
      'entregador demorando',
      'pedido pronto',
      'espera',
      'fila',
      'despacho',
      'eta',
    ],
    sla_reference: 'SLA-LOG-P1: Alocação de entregador em até 8 min após status READY_FOR_PICKUP',
    content: `REGRA DE NEGÓCIO [DOC-LOG-102]: Caso o pedido esteja marcado como PRONTO PARA COLETA (READY_FOR_PICKUP) há mais de 10 minutos sem entregador vinculado:
1. O motor de Dispatch ativa automaticamente o Boost Dinâmico de Tarifa (Surge Nível 2) no polígono hexagonal H3 da loja para atrair entregadores num raio de 4km.
2. Se o atraso ultrapassar 20 minutos após o horário estimado de coleta, o restaurante tem direito ao Voucher de Proteção de Qualidade Térmica (ressarcimento de insumo caso o alimento perca qualidade e precise ser refeito).
3. Para acionar a troca imediata de entregador travado a caminho da loja (status HEADING_TO_STORE estagnado > 8 min), utilize o comando de Re-alocação Forçada (Force Unassign) no painel do pedido sem penalidade de taxa de cancelamento.`,
  },
  {
    doc_id: 'DOC-LOG-103',
    title: 'Manual de Devolução, Cliente Não Localizado e Código de Confirmação',
    category: 'SUPPORT_LOGISTICS',
    section: 'Seção 6.4 — Protocolo de Espera no Destino e Logística Reversa',
    version: 'v4.1.0',
    last_updated: '2026-10-02',
    tags: [
      'cliente não encontrado',
      'código de confirmação',
      'devolução',
      'portaria',
      'endereço errado',
      'entrega',
    ],
    sla_reference: 'SLA-LOG-P2: Timer regulamentar de 10 min no endereço do cliente',
    content: `REGRA DE NEGÓCIO [DOC-LOG-103]: No endereço de destino, o entregador deve validar obrigatoriamente o Código de Confirmação de 4 dígitos (quando exigido pelo score antifraude).
1. Se o cliente não atender no chat/interfone, o entregador inicia o Timer Verificado de 10 minutos (validado por cerca eletrônica Geofence a menos de 80m do pino de entrega).
2. Expirado o timer de 10 minutos com pelo menos 2 tentativas de contato registradas no chat omnichannel, o pedido é encerrado como CLIENT_NO_SHOW, preservando 100% do repasse ao restaurante e a taxa de deslocamento do entregador.`,
  },

  // ==================== FINOPS_DISPUTES ====================
  {
    doc_id: 'DOC-FIN-201',
    title: 'Manual de Conciliação Financeira, Ciclo de Repasses Semanais e Retenções',
    category: 'FINOPS_DISPUTES',
    section: 'Seção 3.1 — Cálculo do Repasse Líquido de Terça-Feira eTerças de Liquidação CIP',
    version: 'v5.2.0',
    last_updated: '2026-10-18',
    tags: [
      'repasse',
      'terça-feira',
      'menor',
      'valor',
      'pagamento',
      'extrato',
      'taxa',
      'comissão',
      'desconto',
      'conciliação',
      'financeiro',
    ],
    sla_reference: 'SLA-FIN-P1: Liquidação bancária toda terça-feira até 16h00 BRT (Ciclo Segunda a Domingo)',
    content: `REGRA DE NEGÓCIO [DOC-FIN-201]: Os repasses financeiros semanais são liquidados toda TERÇA-FEIRA (ou próximo dia útil bancário em caso de feriado nacional), referentes ao período de apuração fechado de segunda-feira (00:00:00) a domingo (23:59:59) da semana anterior (modelo D+7 ou D+30 conforme contrato).
Quando o repasse de terça-feira apresenta valor MENOR que o faturamento bruto esperado pelo parceiro, as 4 causas auditáveis no Ledger são:
1. CORTE DE JANELA HORÁRIA (Cut-off Domingo 23:59 BRT): Pedidos iniciados no domingo após 23:40 cujo status CONCLUÍDO (CONCLUDED) ocorreu após 00:00 de segunda-feira entram automaticamente no ciclo de repasse da terça-feira subsequente.
2. DESCONTOS PROMOCIONAIS CO-PARTICIPATIVOS E CUPONS: Campanhas ativas com subsídio compartilhado (ex: Cupom R$ 15 onde R$ 10 é subsidiado pela loja) são deduzidas na coluna "Investimento Promocional Parceiro".
3. AJUSTES DE CANCELAMENTO / CHARGEBACK PROCEDENTE: Débitos de pedidos cancelados por falha operacional comprovada da loja (falta de ingrediente, atraso > 45 min na produção sem entregador envolvido).
4. MENSALIDADE E TAXA DE ANTECIPAÇÃO: Cobrança de mensalidade do plano (quando faturamento supera a franquia mínima) ou taxa de antecipação de recebíveis (1.49% a.m. pro-rata) caso o plano "Repasse em 7 dias" tenha sido ativado.`,
  },
  {
    doc_id: 'DOC-FIN-202',
    title: 'Política de Contestação de Estornos, Cancelamentos Indevidos e Chargebacks',
    category: 'FINOPS_DISPUTES',
    section: 'Seção 5.3 — Elegibilidade de Reembolso Automático ao Parceiro',
    version: 'v4.6.1',
    last_updated: '2026-10-10',
    tags: [
      'estorno',
      'cancelamento',
      'contestação',
      'disputa',
      'reembolso',
      'chargeback',
      'prejuízo',
      'fraude',
    ],
    sla_reference: 'SLA-FIN-P1: Análise automática em até 30 segundos via Motor de Disputas',
    content: `REGRA DE NEGÓCIO [DOC-FIN-202]: O restaurante parceiro pode abrir contestação financeira de pedidos cancelados ou estornados em até 30 dias corridos após a data do evento:
1. ISENÇÃO AUTOMÁTICA DE DÉBITO: Se o cancelamento ocorreu após o evento "Entregador Coletou o Pedido" (logística parceira da plataforma) ou por desistência unilateral do cliente após o início comprovado do preparo (status CONFIRMED > 5 min), o estorno ao cliente é absorvido 100% pela plataforma.
2. DISPUTA DE ITEM FALTANTE OU AVARIA: Caso o cliente alegue item faltante ou embalagem violada, o motor cruza o histórico de confiabilidade da loja (Store Trust Score > 96%) com o risco do consumidor. Se deferido, o crédito de ressarcimento é agendado como "Ajuste de Contestação Aprovada (CR-ADJ)" no próximo lote de terça-feira.`,
  },
  {
    doc_id: 'DOC-FIN-203',
    title: 'Tabela de Taxas Contratuais, Split de Pagamento e Domicílio Bancário',
    category: 'FINOPS_DISPUTES',
    section: 'Seção 1.4 — Estrutura de Comissionamento e Rejeição de TED/PIX PJ',
    version: 'v3.5.0',
    last_updated: '2026-09-12',
    tags: [
      'domicílio bancário',
      'conta',
      'cnpj',
      'taxa de entrega',
      'split',
      'nota fiscal',
      'retido',
    ],
    sla_reference: 'SLA-FIN-P2: Reprocessamento de liquidação rejeitada em D+1 útil',
    content: `REGRA DE NEGÓCIO [DOC-FIN-203]: A composição padrão de deduções sobre o GMV elegível contempla:
- Taxa de Intermediação Marketplace (12% no Plano Básico ou 23% no Plano Entrega Parceira Completa).
- Taxa de Processamento de Pagamento Online via App (3.2% sobre transações pagas via Cartão/Pix in-app).
- Trava de Domicílio Bancário: Se houver alteração cadastral de conta bancária ou divergência de titularidade do CNPJ raiz, o lote fica com status HELD_FOR_COMPLIANCE até validação e é reprocessado em D+1 útil via STR/PIX PJ.`,
  },

  // ==================== API_INTEGRATION ====================
  {
    doc_id: 'DOC-API-301',
    title: 'Especificação Técnica de Webhooks de Cardápio (Catalog V2) e Eventos de Pedido',
    category: 'API_INTEGRATION',
    section: 'Seção 2.1 — Configuração de Endpoint Webhook, Eventos de Cardápio e HMAC-SHA256',
    version: 'v2.9.4',
    last_updated: '2026-10-20',
    tags: [
      'webhook',
      'cardápio',
      'configuro',
      'configurar',
      'catálogo',
      'catalog',
      'callback',
      'hmac',
      'assinatura',
      'endpoint',
      'evento',
    ],
    sla_reference: 'SLA-API-P1: Timeout máximo de ACK HTTP 200/202 = 5000ms',
    content: `ESPECIFICAÇÃO TÉCNICA [DOC-API-301]: Para configurar o Webhook de Cardápio (Catalog Sync V2) e receber notificações em tempo real de alterações de itens, preços, disponibilidade (` + '`ITEM_UNAVAILABLE`' + `) e validação de menu:
1. REGISTRO DO ENDPOINT: No Developer Console (ou via endpoint ` + '`PUT /v2/webhooks/subscriptions`' + `), cadastre uma URL HTTPS pública com TLS 1.2+ e inscreva-se nos tópicos:
   - ` + '`catalog.item.updated`' + ` (alteração de preço, estoque ou complementos)
   - ` + '`catalog.menu.published`' + ` (confirmação de publicação assíncrona do cardápio no app)
   - ` + '`catalog.ingestion.failed`' + ` (erros de schema JSON na carga de cardápio)
2. VALIDAÇÃO DE SEGURANÇA (HMAC-SHA256): Toda requisição POST enviada pelo Nexus inclui o header ` + '`X-Nexus-Signature-256`' + `. Seu servidor deve calcular o HMAC-SHA256 do raw body usando sua ` + '`webhook_secret_key`' + ` e comparar em tempo constante (` + '`crypto.timingSafeEqual`' + `).
3. REQUISITO DE SLA E ACK ASSÍNCRONO: O endpoint receptor DEVE responder com ` + '`HTTP 200 OK`' + ` ou ` + '`HTTP 202 Accepted`' + ` em no máximo **5000ms (5 segundos)**. Processe a atualização de banco de dados em fila background (Redis/SQS/RabbitMQ) após retornar o ACK.
4. POLÍTICA DE RETRY E CIRCUIT BREAKER: Em caso de HTTP 5xx ou timeout, o Nexus executa 5 retentativas com Exponential Backoff (2s, 8s, 32s, 128s, 512s). Se a taxa de falha superar 80% em 15 minutos, o Circuit Breaker pausa o webhook e ativa fallback temporário via Polling (` + '`GET /v2/events:polling`' + `).`,
  },
  {
    doc_id: 'DOC-API-302',
    title: 'Autenticação OAuth2, Ciclo de Vida de Access Token e Rate Limiting (HTTP 429)',
    category: 'API_INTEGRATION',
    section: 'Seção 1.2 — Fluxo Client Credentials, Cache de Token e Quotas por Merchant',
    version: 'v3.1.0',
    last_updated: '2026-10-11',
    tags: [
      'token',
      'oauth',
      'oauth2',
      '401',
      '403',
      '429',
      'rate limit',
      'autenticação',
      'credenciais',
      'client_id',
      'client_secret',
    ],
    sla_reference: 'SLA-API-P1: Token TTL = 10800s (3 horas) | Rate Limit = 600 req/min por App',
    content: `ESPECIFICAÇÃO TÉCNICA [DOC-API-302]: A API Nexus utiliza OAuth 2.0 no fluxo ` + '`client_credentials`' + ` para aplicações centralizadas e ` + '`authorization_code`' + ` para apps distribuídos:
1. OBTENÇÃO DE TOKEN: Envie ` + '`POST https://api.nexus-delivery.io/oauth/v2/token`' + ` com ` + '`grant_type=client_credentials`' + `, ` + '`clientId`' + ` e ` + '`clientSecret`' + ` em ` + '`application/x-www-form-urlencoded`' + `.
2. CACHE OBRIGATÓRIO DE TOKEN (ANTI-429): O ` + '`access_token`' + ` JWT possui TTL de **10.800 segundos (3 horas)**. É proibido gerar um novo token a cada requisição de cardápio ou pedido. Armazene o token em cache (Redis/Memória) e renove-o apenas quando faltar 300 segundos para expirar.
3. TRATAMENTO DE HTTP 429 (TOO MANY REQUESTS): O endpoint de autenticação possui quota estrita de 10 req/min por ` + '`clientId`' + `, enquanto os endpoints de Catalog V2 permitem 300 req/min por ` + '`merchantId`' + `. Sempre respeite o header ` + '`Retry-After`' + ` e utilize o endpoint em lote ` + '`PATCH /v2/merchants/{id}/catalog/items:batch`' + ` (até 500 itens por chamada) em vez de loops unitários.`,
  },
  {
    doc_id: 'DOC-API-303',
    title: 'Sincronização de Cardápio V2: Estrutura de Entidades (Item, Product, OptionGroup)',
    category: 'API_INTEGRATION',
    section: 'Seção 4.5 — Resolução de Erros 422 Unprocessable Entity na Árvore de Catálogo',
    version: 'v2.7.1',
    last_updated: '2026-10-05',
    tags: [
      '422',
      'schema',
      'item',
      'complemento',
      'preço',
      'estoque',
      'pausa',
      'sincronização',
      'erro api',
      'json',
    ],
    sla_reference: 'SLA-API-P2: Propagação no app consumidor em até 15 segundos via CDN Edge',
    content: `ESPECIFICAÇÃO TÉCNICA [DOC-API-303]: Na arquitetura Catalog V2, o cardápio é desacoplado em 4 entidades: ` + '`Category` -> `Item` -> `Product` -> `OptionGroup`' + `.
1. ERRO COMUM HTTP 422 (` + '`INVALID_MIN_MAX_OPTION_GROUP`' + `): Em grupos de complementos (` + '`optionGroups`' + `), ` + '`minQuantity`' + ` nunca pode ser maior que ` + '`maxQuantity`' + ` nem superar o número de opções com status ` + '`AVAILABLE`' + `.
2. ATUALIZAÇÃO RÁPIDA DE DISPONIBILIDADE E PREÇO: Para pausar um produto que acabou na cozinha ou alterar preço sem reenviar o cardápio inteiro, utilize os endpoints atômicos:
   - ` + '`PATCH /v2/merchants/{merchantId}/catalog/items/{itemId}/status`' + ` com payload ` + '`{ "status": "UNAVAILABLE" }`' + `
   - ` + '`PATCH /v2/merchants/{merchantId}/catalog/items/{itemId}/price`' + ` com payload ` + '`{ "price": { "value": 34.90, "originalValue": 39.90 } }`' + `.`,
  },
];

/**
 * Cenários pré-prontos para o Simulador Omnichannel (incluindo os 3 cenários canônicos exigidos)
 */
export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'scenario-logistics-missing-rider',
    label: 'Entregador sumiu com o pedido',
    prompt: 'O entregador sumiu com o pedido #8842 há mais de 20 minutos após coletar na loja e o GPS dele travou. O cliente está cobrando no chat e quero saber se vou perder o valor desse pedido ou se vocês vão mandar outro entregador.',
    expectedRoute: 'SUPPORT_LOGISTICS',
    channel: 'PARTNER_PORTAL',
    description: 'Aciona SUPPORT_LOGISTICS + Protocolo de Extravio DOC-LOG-101 e Redispatch P0',
  },
  {
    id: 'scenario-finops-tuesday-payout',
    label: 'Meu repasse de terça-feira veio menor',
    prompt: 'Meu repasse de terça-feira veio menor do que o faturamento que fechei no domingo à noite! Faltam cerca de R$ 1.480,00 na liquidação bancária de hoje. Por que houve essa diferença e como audito os descontos e cancelamentos?',
    expectedRoute: 'FINOPS_DISPUTES',
    channel: 'PARTNER_PORTAL',
    description: 'Aciona FINOPS_DISPUTES + Auditoria de Cut-off Domingo 23:59 e Conciliação DOC-FIN-201',
  },
  {
    id: 'scenario-api-catalog-webhook',
    label: 'Como configuro o webhook de cardápio?',
    prompt: 'Como configuro o webhook de cardápio (Catalog V2) no meu ERP para receber eventos de indisponibilidade de itens e validação de publicação? Quais são os headers de segurança HMAC e o timeout máximo de resposta?',
    expectedRoute: 'API_INTEGRATION',
    channel: 'DEVELOPER_CONSOLE',
    description: 'Aciona API_INTEGRATION + Especificação de Webhook HMAC-SHA256 DOC-API-301',
  },
  {
    id: 'scenario-logistics-delayed-pickup',
    label: 'Pedido pronto há 22 min sem entregador',
    prompt: 'Estou com o pedido #9104 marcado como pronto para coleta no balcão há 22 minutos e ainda não alocou entregador na região. O prato vai esfriar, como aciono prioridade de despacho e proteção de insumo?',
    expectedRoute: 'SUPPORT_LOGISTICS',
    channel: 'PARTNER_PORTAL',
    description: 'Aciona SUPPORT_LOGISTICS + Surge H3 e Voucher Térmico DOC-LOG-102',
  },
  {
    id: 'scenario-finops-chargeback-dispute',
    label: 'Contestação de estorno indevido',
    prompt: 'Descontaram R$ 189,90 de estorno num pedido que o entregador parceiro da plataforma já havia coletado na minha loja. Quero abrir contestação imediata desse chargeback.',
    expectedRoute: 'FINOPS_DISPUTES',
    channel: 'PARTNER_PORTAL',
    description: 'Aciona FINOPS_DISPUTES + Política de Isenção Automática DOC-FIN-202',
  },
  {
    id: 'scenario-api-oauth-429',
    label: 'Erro HTTP 429 no OAuth2 e atualização de preço',
    prompt: 'Nossa integração está tomando erro HTTP 429 Too Many Requests no endpoint /oauth/v2/token e HTTP 422 ao atualizar preços e pausar itens no cardápio. Qual é a arquitetura recomendada de cache de token e batch?',
    expectedRoute: 'API_INTEGRATION',
    channel: 'DEVELOPER_CONSOLE',
    description: 'Aciona API_INTEGRATION + OAuth2 Token Lifecycle DOC-API-302 e Catalog V2 DOC-API-303',
  },
];
