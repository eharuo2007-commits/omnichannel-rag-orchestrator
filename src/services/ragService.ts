import { KNOWLEDGE_BASE_CHUNKS } from '../domain/knowledgeBase';
import {
  RagRetrievalResult,
  RetrievedDocumentChunk,
  SemanticRouteId,
} from '../domain/types';
import { normalizeText } from './semanticRouter';

/**
 * Motor de RAG Local (Hybrid Lexical + Route-Scoped Semantic Retrieval)
 * Recupera trechos de manuais técnicos e políticas de SLA da plataforma.
 */
export function retrieveKnowledgeContext(
  userQuery: string,
  routeMatched: SemanticRouteId,
  topK = 3
): RagRetrievalResult {
  const startTime = performance.now();
  const normalizedQuery = normalizeText(userQuery);
  const queryTokens = normalizedQuery
    .split(/[^a-z0-9#/_+-]+/)
    .filter((t) => t.length >= 3);

  const scoredChunks: RetrievedDocumentChunk[] = KNOWLEDGE_BASE_CHUNKS.map(
    (chunk) => {
      let rawRelevance = 0;
      const matchedTerms = new Set<string>();

      // 1. Afinidade de Rota Semântica (Prior de domínio)
      if (chunk.category === routeMatched) {
        rawRelevance += 0.42;
      } else {
        rawRelevance += 0.08;
      }

      // 2. Match nas tags indexadas do documento
      for (const tag of chunk.tags) {
        const normTag = normalizeText(tag);
        if (normalizedQuery.includes(normTag)) {
          rawRelevance += 0.14;
          matchedTerms.add(tag);
        }
      }

      // 3. Term Frequency (TF) no título, seção e conteúdo do chunk
      const normTitle = normalizeText(chunk.title + ' ' + chunk.section);
      const normContent = normalizeText(chunk.content);

      for (const token of queryTokens) {
        if (normTitle.includes(token)) {
          rawRelevance += 0.09;
          matchedTerms.add(token);
        } else if (normContent.includes(token)) {
          rawRelevance += 0.04;
          matchedTerms.add(token);
        }
      }

      const relevanceScore = Number(
        Math.min(0.99, Math.max(0.15, rawRelevance)).toFixed(2)
      );

      const termsArray = Array.from(matchedTerms);
      const citationReason =
        termsArray.length > 0
          ? `Correspondência semântica direta nos termos [${termsArray
              .slice(0, 5)
              .join(', ')}] + escopo de rota ${chunk.category}`
          : `Documento canônico de SLA obrigatório da rota ${chunk.category}`;

      return {
        ...chunk,
        relevance_score: relevanceScore,
        matched_terms: termsArray,
        citation_reason: citationReason,
      };
    }
  );

  // Filtra prioritariamente documentos da rota ou com altíssima relevância cruzada
  const sortedChunks = scoredChunks
    .filter(
      (chunk) =>
        chunk.category === routeMatched || chunk.relevance_score >= 0.55
    )
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, topK);

  const formattedContext = sortedChunks
    .map(
      (c, idx) =>
        `--- [CHUNK #${idx + 1} | ID: ${c.doc_id} | Score: ${c.relevance_score} | SLA: ${c.sla_reference}] ---
TÍTULO: ${c.title} (${c.version})
SEÇÃO: ${c.section}
CONTEÚDO DOCUMENTAL:
${c.content}`
    )
    .join('\n\n');

  const elapsedMs = Math.max(
    1,
    Number((performance.now() - startTime).toFixed(2))
  );

  return {
    query: userQuery,
    route_filter: routeMatched,
    retrieved_chunks: sortedChunks,
    formatted_context: formattedContext,
    latency_ms: elapsedMs,
    total_corpus_scanned: KNOWLEDGE_BASE_CHUNKS.length,
  };
}
