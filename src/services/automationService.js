const EXTERNAL_URL = process.env.EXTERNAL_DATA_SERVICE_URL || 'http://localhost:3007';
const AUTO_APPROVAL_LIMIT = parseFloat(process.env.AUTO_APPROVAL_LIMIT || '500');
const MIN_SCORE_APPROVAL = parseFloat(process.env.MIN_SCORE_APPROVAL || '700');
const MIN_SCORE_MANUAL_REVIEW = parseFloat(process.env.MIN_SCORE_MANUAL_REVIEW || '600');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// Reintenta una fuente hasta maxRetries veces si la respuesta contiene un error
async function callWithRetry(url, body, maxRetries = 3, retryDelayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await postJSON(url, body);
      if (result && !result.error) return result;
      console.warn(`[AUTO] Intento ${attempt}/${maxRetries} fallido para ${url}: ${result?.error}`);
    } catch (err) {
      console.warn(`[AUTO] Intento ${attempt}/${maxRetries} error para ${url}: ${err.message}`);
    }
    if (attempt < maxRetries) await sleep(retryDelayMs);
  }
  console.error(`[AUTO] Fuente agotó reintentos: ${url}`);
  return null;
}

async function runDataCollectionFlow(applicationId, applicantId, requestedAmount) {
  try {
    console.log(`[AUTO] Iniciando recopilación para solicitud ${applicationId}`);

    const documentNumber = applicantId.replace(/-/g, '').substring(0, 10);
    const baseBody = { application_id: applicationId, applicant_id: applicantId };

    // Lanzar las 5 fuentes en paralelo con reintentos individuales.
    // El buró tiene 3 reintentos porque falla ~20% del tiempo.
    const [bureau, utilities, wallets, ecommerce, topups] = await Promise.all([
      callWithRetry(
        `${EXTERNAL_URL}/api/external-data/credit-bureau`,
        { application_id: applicationId, document_number: documentNumber },
        3,
        4000
      ),
      callWithRetry(`${EXTERNAL_URL}/api/external-data/utilities`, baseBody, 2),
      callWithRetry(`${EXTERNAL_URL}/api/external-data/wallets`, baseBody, 2),
      callWithRetry(`${EXTERNAL_URL}/api/external-data/ecommerce`, baseBody, 2),
      callWithRetry(`${EXTERNAL_URL}/api/external-data/mobile-topups`, baseBody, 2),
    ]);

    console.log('[AUTO] Respuestas recibidas:', {
      bureau: bureau ? `score=${bureau.score}` : 'FALLÓ',
      utilities: utilities ? `score=${utilities.score}` : 'FALLÓ',
      wallets: wallets ? `score=${wallets.score}` : 'FALLÓ',
      ecommerce: ecommerce ? `score=${ecommerce.score}` : 'FALLÓ',
      topups: topups ? `score=${topups.score}` : 'FALLÓ',
    });

    // Esperar a que el snapshot tenga todos los scores (máx ~30s adicionales)
    let summary = null;
    for (let i = 0; i < 10; i++) {
      await sleep(3000);
      const res = await fetch(`${EXTERNAL_URL}/api/external-data/summary/${applicationId}`);
      summary = await res.json();
      console.log(`[AUTO] Poll ${i + 1}/10 — all_sources_ready=${summary.all_sources_ready} composite=${summary.composite_score}`);
      if (summary.all_sources_ready) break;
    }

    const { updateApplicationStatus } = require('./creditApplicationService');
    const { recordEvent } = require('./auditService');

    await updateApplicationStatus(applicationId, { status: 'SCORING' });
    console.log(`[AUTO] ${applicationId} → SCORING`);

    const score = summary?.composite_score ?? 0;
    const sourcesReady = summary?.all_sources_ready ?? false;

    await recordEvent(applicationId, 'SCORING_COMPLETED', {
      to_status: 'SCORING',
      payload: {
        composite_score: score,
        sources_completed: summary?.sources_completed ?? 0,
        sources_total: 5,
        credit_bureau_score: summary?.credit_bureau_score ?? null,
        utility_payment_score: summary?.utility_payment_score ?? null,
        wallet_transaction_score: summary?.wallet_transaction_score ?? null,
        ecommerce_score: summary?.ecommerce_score ?? null,
        mobile_topup_score: summary?.mobile_topup_score ?? null,
      },
    });

    let nextStatus;

    if (!sourcesReady) {
      // Si alguna fuente nunca respondió, va a revisión manual obligatoria
      console.warn(`[AUTO] Fuentes incompletas — enviando a MANUAL_REVIEW`);
      nextStatus = 'MANUAL_REVIEW';
    } else if (requestedAmount > AUTO_APPROVAL_LIMIT) {
      nextStatus = score >= MIN_SCORE_MANUAL_REVIEW ? 'MANUAL_REVIEW' : 'REJECTED';
    } else {
      if (score >= MIN_SCORE_APPROVAL) nextStatus = 'APPROVED';
      else if (score >= MIN_SCORE_MANUAL_REVIEW) nextStatus = 'MANUAL_REVIEW';
      else nextStatus = 'REJECTED';
    }

    await updateApplicationStatus(applicationId, { status: nextStatus });
    console.log(`[AUTO] ${applicationId} → ${nextStatus} (score: ${score}, fuentes completas: ${sourcesReady})`);

    await recordEvent(applicationId, 'DECISION_MADE', {
      from_status: 'SCORING',
      to_status: nextStatus,
      payload: {
        composite_score: score,
        requested_amount: requestedAmount,
        auto_approval_limit: AUTO_APPROVAL_LIMIT,
        min_score_approval: MIN_SCORE_APPROVAL,
        min_score_manual_review: MIN_SCORE_MANUAL_REVIEW,
        sources_ready: sourcesReady,
        decision_reason: !sourcesReady
          ? 'incomplete_sources'
          : requestedAmount > AUTO_APPROVAL_LIMIT
          ? 'amount_exceeds_auto_limit'
          : score >= MIN_SCORE_APPROVAL
          ? 'score_above_approval_threshold'
          : score >= MIN_SCORE_MANUAL_REVIEW
          ? 'score_in_manual_review_range'
          : 'score_below_minimum',
      },
    });
  } catch (err) {
    console.error(`[AUTO] Error en flujo automático para ${applicationId}:`, err.message);
  }
}

module.exports = { runDataCollectionFlow };
