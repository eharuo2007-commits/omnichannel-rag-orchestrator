import { SUB_AGENT_PROFILES } from '../domain/knowledgeBase';
import {
  RouteScoreBreakdown,
  SemanticRouteId,
  SemanticRouterResult,
} from '../domain/types';

interface RouteIntentLexicon {
  route: SemanticRouteId;
  label: string;
  primaryPhrases: { phrase: string; weight: number; signal: string }[];
  keywords: { term: string; weight: number }[];
  regexPatterns: { pattern: RegExp; weight: number; signal: string }[];
}

const ROUTE_LEXICONS: RouteIntentLexicon[] = [
  {
    route: 'SUPPORT_LOGISTICS',
    label: 'Operações Logísticas & Última Milha',
    primaryPhrases: [
      { phrase: 'entregador sumiu', weight: 6.5, signal: 'CRITICAL_RIDER_MISSING' },
      { phrase: 'sumiu com o pedido', weight: 6.5, signal: 'ORDER_LOST_IN_TRANSIT' },
      { phrase: 'pronto para coleta', weight: 5.5, signal: 'PICKUP_SLA_DELAY' },
      { phrase: 'sem entregador', weight: 5.2, signal: 'FLEET_UNALLOCATED' },
      { phrase: 'gps travou', weight: 5.0, signal: 'GPS_TELEMETRY_LOSS' },
      { phrase: 'nao alocou entregador', weight: 5.5, signal: 'DISPATCH_QUEUE_STUCK' },
      { phrase: 'codigo de confirmacao', weight: 4.8, signal: 'HANDOFF_PIN_VALIDATION' },
      { phrase: 'cliente nao encontrado', weight: 4.8, signal: 'CLIENT_NO_SHOW_PROTOCOL' },
      { phrase: 'mandar outro entregador', weight: 5.0, signal: 'REDISPATCH_REQUEST' },
      { phrase: 'desvio de rota', weight: 4.5, signal: 'ROUTE_ANOMALY' },
    ],
    keywords: [
      { term: 'entregador', weight: 3.2 },
      { term: 'motoboy', weight: 3.2 },
      { term: 'sumiu', weight: 3.0 },
      { term: 'desapareceu', weight: 3.0 },
      { term: 'atraso', weight: 2.6 },
      { term: 'atrasado', weight: 2.6 },
      { term: 'rota', weight: 2.8 },
      { term: 'gps', weight: 3.1 },
      { term: 'coleta', weight: 2.9 },
      { term: 'coletar', weight: 2.7 },
      { term: 'coletou', weight: 2.4 },
      { term: 'despacho', weight: 3.0 },
      { term: 'alocar', weight: 2.6 },
      { term: 'alocou', weight: 2.6 },
      { term: 'extravio', weight: 3.5 },
      { term: 'extraviado', weight: 3.5 },
      { term: 'esfriar', weight: 2.5 },
      { term: 'balcao', weight: 2.3 },
      { term: 'portaria', weight: 2.4 },
      { term: 'entrega', weight: 2.0 },
    ],
    regexPatterns: [
      {
        pattern: /#\d{3,8}/i,
        weight: 1.8,
        signal: 'ORDER_ID_ENTITY_DETECTED',
      },
      {
        pattern: /\b\d+\s*(min|minutos)\b/i,
        weight: 2.2,
        signal: 'SLA_DURATION_ENTITY',
      },
    ],
  },
  {
    route: 'FINOPS_DISPUTES',
    label: 'FinOps, Repasses & Contestações',
    primaryPhrases: [
      { phrase: 'repasse de terca', weight: 6.8, signal: 'TUESDAY_SETTLEMENT_CYCLE' },
      { phrase: 'veio menor', weight: 5.5, signal: 'PAYOUT_VARIANCE_DISPUTE' },
      { phrase: 'contestacao de estorno', weight: 6.2, signal: 'CHARGEBACK_CONTESTATION' },
      { phrase: 'abrir contestacao', weight: 5.6, signal: 'DISPUTE_WORKFLOW_TRIGGER' },
      { phrase: 'liquidacao bancaria', weight: 5.4, signal: 'CIP_STR_SETTLEMENT' },
      { phrase: 'domicilio bancario', weight: 5.2, signal: 'BANK_DOMICILE_LOCK' },
      { phrase: 'faturamento que fechei', weight: 5.0, signal: 'RECONCILIATION_CUTOFF_CHECK' },
      { phrase: 'descontaram', weight: 4.5, signal: 'LEDGER_DEBIT_AUDIT' },
    ],
    keywords: [
      { term: 'repasse', weight: 3.8 },
      { term: 'repasses', weight: 3.8 },
      { term: 'terca-feira', weight: 3.4 },
      { term: 'terca', weight: 3.0 },
      { term: 'menor', weight: 2.4 },
      { term: 'estorno', weight: 3.6 },
      { term: 'estornado', weight: 3.5 },
      { term: 'chargeback', weight: 3.8 },
      { term: 'taxa', weight: 2.8 },
      { term: 'taxas', weight: 2.8 },
      { term: 'comissao', weight: 3.2 },
      { term: 'financeiro', weight: 3.0 },
      { term: 'conciliacao', weight: 3.5 },
      { term: 'extrato', weight: 3.1 },
      { term: 'faturamento', weight: 3.0 },
      { term: 'reembolso', weight: 3.1 },
      { term: 'desconto', weight: 2.6 },
      { term: 'descontos', weight: 2.6 },
      { term: 'audito', weight: 2.8 },
      { term: 'auditar', weight: 2.8 },
      { term: 'bancaria', weight: 2.7 },
    ],
    regexPatterns: [
      {
        pattern: /r\$\s*\d+([.,]\d{2})?/i,
        weight: 3.2,
        signal: 'BRL_CURRENCY_AMOUNT_DETECTED',
      },
      {
        pattern: /\bd\+\d{1,2}\b/i,
        weight: 3.0,
        signal: 'SETTLEMENT_CYCLE_D_PLUS',
      },
    ],
  },
  {
    route: 'API_INTEGRATION',
    label: 'Engenharia de API, Webhooks & Catálogo',
    primaryPhrases: [
      { phrase: 'webhook de cardapio', weight: 7.0, signal: 'CATALOG_WEBHOOK_CONFIG' },
      { phrase: 'configuro o webhook', weight: 6.5, signal: 'WEBHOOK_SUBSCRIPTION_SETUP' },
      { phrase: 'como configuro o webhook', weight: 6.8, signal: 'WEBHOOK_ONBOARDING_QUERY' },
      { phrase: 'catalog v2', weight: 6.0, signal: 'CATALOG_V2_SCHEMA' },
      { phrase: 'too many requests', weight: 6.2, signal: 'RATE_LIMIT_429_THROTTLING' },
      { phrase: 'headers de seguranca hmac', weight: 6.0, signal: 'HMAC_SIGNATURE_VERIFICATION' },
      { phrase: 'cache de token', weight: 5.8, signal: 'OAUTH2_TOKEN_LIFECYCLE' },
    ],
    keywords: [
      { term: 'webhook', weight: 4.0 },
      { term: 'webhooks', weight: 4.0 },
      { term: 'cardapio', weight: 3.1 },
      { term: 'catalogo', weight: 3.2 },
      { term: 'catalog', weight: 3.2 },
      { term: 'api', weight: 3.4 },
      { term: 'token', weight: 3.6 },
      { term: 'oauth', weight: 3.8 },
      { term: 'oauth2', weight: 4.0 },
      { term: 'hmac', weight: 3.8 },
      { term: 'endpoint', weight: 3.5 },
      { term: 'erp', weight: 3.0 },
      { term: 'pdv', weight: 3.0 },
      { term: 'integracao', weight: 3.1 },
      { term: 'timeout', weight: 3.1 },
      { term: 'headers', weight: 3.0 },
      { term: 'header', weight: 3.0 },
      { term: 'payload', weight: 3.2 },
      { term: 'json', weight: 2.9 },
      { term: 'batch', weight: 2.9 },
      { term: 'polling', weight: 3.2 },
    ],
    regexPatterns: [
      {
        pattern: /\b(401|403|404|422|429|500|502|503|504)\b/,
        weight: 3.8,
        signal: 'HTTP_STATUS_CODE_DETECTED',
      },
      {
        pattern: /\/(v1|v2|v3|oauth)\/[a-z0-9/_:-]+/i,
        weight: 4.0,
        signal: 'REST_API_PATH_DETECTED',
      },
    ],
  },
];

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Classifica a intenção do usuário através da Camada de Roteamento Semântico (Semantic Router)
 */
export function classifySemanticRoute(userInput: string): SemanticRouterResult {
  const startTime = performance.now();
  const normalized = normalizeText(userInput);

  const rawBreakdowns: {
    route: SemanticRouteId;
    label: string;
    rawScore: number;
    matchedKeywords: string[];
    semanticSignals: string[];
  }[] = ROUTE_LEXICONS.map((lexicon) => {
    let rawScore = 0.35; // Prior basal para suavização de Laplace
    const matchedKeywords = new Set<string>();
    const semanticSignals = new Set<string>();

    // 1. Avalia expressões semânticas compostas (n-grams)
    for (const item of lexicon.primaryPhrases) {
      if (normalized.includes(item.phrase)) {
        rawScore += item.weight;
        matchedKeywords.add(item.phrase);
        semanticSignals.add(item.signal);
      }
    }

    // 2. Avalia termos do vocabulário de domínio
    for (const kw of lexicon.keywords) {
      const escaped = kw.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(normalized) || normalized.includes(kw.term)) {
        rawScore += kw.weight;
        matchedKeywords.add(kw.term);
      }
    }

    // 3. Avalia padrões de entidades técnicas via Regex
    for (const rx of lexicon.regexPatterns) {
      const match = userInput.match(rx.pattern);
      if (match) {
        rawScore += rx.weight;
        matchedKeywords.add(match[0]);
        semanticSignals.add(rx.signal);
      }
    }

    if (semanticSignals.size === 0 && matchedKeywords.size > 0) {
      semanticSignals.add(`${lexicon.route}_LEXICAL_AFFINITY`);
    }

    return {
      route: lexicon.route,
      label: lexicon.label,
      rawScore,
      matchedKeywords: Array.from(matchedKeywords),
      semanticSignals: Array.from(semanticSignals),
    };
  });

  // Calcula distribuição Softmax calibrada (Temperatura T = 2.8) para probabilidades interpretáveis
  const temperature = 2.8;
  const maxRaw = Math.max(...rawBreakdowns.map((b) => b.rawScore));
  const expScores = rawBreakdowns.map((b) =>
    Math.exp((b.rawScore - maxRaw) / temperature)
  );
  const sumExp = expScores.reduce((acc, val) => acc + val, 0);

  const scores: RouteScoreBreakdown[] = rawBreakdowns
    .map((b, idx) => {
      const probability = Number((expScores[idx] / sumExp).toFixed(4));
      return {
        route: b.route,
        label: b.label,
        score: Number(b.rawScore.toFixed(2)),
        probability,
        matchedKeywords: b.matchedKeywords,
        semanticSignals: b.semanticSignals,
      };
    })
    .sort((a, b) => b.probability - a.probability);

  const winner = scores[0];
  const runnerUp = scores[1];

  // Calibra o confidence_score entre 0.62 e 0.99 baseado na margem de separação e densidade de sinais
  const margin = winner.probability - runnerUp.probability;
  const signalBoost = Math.min(0.12, winner.matchedKeywords.length * 0.02);
  const calibratedConfidence = Number(
    Math.min(0.99, Math.max(0.64, winner.probability * 0.85 + margin * 0.12 + signalBoost)).toFixed(2)
  );

  const elapsedMs = Math.max(
    1,
    Number((performance.now() - startTime).toFixed(2))
  );

  return {
    route_matched: winner.route,
    confidence_score: calibratedConfidence,
    latency_ms: elapsedMs,
    is_ambiguous: margin < 0.18,
    scores,
    selected_agent: SUB_AGENT_PROFILES[winner.route],
  };
}
