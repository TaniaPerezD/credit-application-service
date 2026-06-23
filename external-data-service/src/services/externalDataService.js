const ExternalDataSnapshot = require('../models/ExternalDataSnapshot');
const { queryCreditBureau } = require('../simulators/creditBureauSimulator');
const { queryUtilities } = require('../simulators/utilitiesSimulator');
const { queryWallets } = require('../simulators/walletsSimulator');
const { queryEcommerce } = require('../simulators/ecommerceSimulator');
const { queryMobileTopups } = require('../simulators/mobileTopupsSimulator');

// Obtiene o crea el snapshot para esta solicitud
async function getOrCreateSnapshot(applicationId) {
  const [snapshot] = await ExternalDataSnapshot.findOrCreate({
    where: { application_id: applicationId },
    defaults: { application_id: applicationId, raw_data: {} },
  });
  return snapshot;
}

async function processCreditBureau(applicationId, documentNumber) {
  const data = await queryCreditBureau(documentNumber);
  const snapshot = await getOrCreateSnapshot(applicationId);
  const rawData = snapshot.raw_data || {};

  await snapshot.update({
    credit_bureau_score: data.score,
    raw_data: { ...rawData, credit_bureau: data },
  });

  return { source: 'credit_bureau', score: data.score, detail: data };
}

async function processUtilities(applicationId, applicantId) {
  const data = await queryUtilities(applicantId);
  const snapshot = await getOrCreateSnapshot(applicationId);
  const rawData = snapshot.raw_data || {};

  await snapshot.update({
    utility_payment_score: data.score,
    raw_data: { ...rawData, utilities: data },
  });

  return { source: 'utilities', score: data.score, detail: data };
}

async function processWallets(applicationId, applicantId) {
  const data = await queryWallets(applicantId);
  const snapshot = await getOrCreateSnapshot(applicationId);
  const rawData = snapshot.raw_data || {};

  await snapshot.update({
    wallet_transaction_score: data.score,
    raw_data: { ...rawData, wallets: data },
  });

  return { source: 'wallets', score: data.score, detail: data };
}

async function processEcommerce(applicationId, applicantId) {
  const data = await queryEcommerce(applicantId);
  const snapshot = await getOrCreateSnapshot(applicationId);
  const rawData = snapshot.raw_data || {};

  await snapshot.update({
    ecommerce_score: data.score,
    raw_data: { ...rawData, ecommerce: data },
  });

  return { source: 'ecommerce', score: data.score, detail: data };
}

async function processMobileTopups(applicationId, applicantId) {
  const data = await queryMobileTopups(applicantId);
  const snapshot = await getOrCreateSnapshot(applicationId);
  const rawData = snapshot.raw_data || {};

  await snapshot.update({
    mobile_topup_score: data.score,
    raw_data: { ...rawData, mobile_topups: data },
  });

  return { source: 'mobile_topups', score: data.score, detail: data };
}

async function getSummary(applicationId) {
  const snapshot = await ExternalDataSnapshot.findOne({
    where: { application_id: applicationId },
  });

  if (!snapshot) {
    throw new NotFoundError(`No hay datos externos para la solicitud ${applicationId}`);
  }

  const scores = {
    credit_bureau: snapshot.credit_bureau_score,
    utilities: snapshot.utility_payment_score,
    wallets: snapshot.wallet_transaction_score,
    ecommerce: snapshot.ecommerce_score,
    mobile_topups: snapshot.mobile_topup_score,
  };

  const availableScores = Object.values(scores).filter((s) => s !== null);
  const compositeScore =
    availableScores.length > 0
      ? Math.round(availableScores.reduce((a, b) => a + b, 0) / availableScores.length)
      : null;

  const sourcesCompleted = Object.values(scores).filter((s) => s !== null).length;

  return {
    application_id: applicationId,
    scores,
    composite_score: compositeScore,
    sources_completed: sourcesCompleted,
    sources_total: 5,
    all_sources_ready: sourcesCompleted === 5,
    raw_data: snapshot.raw_data,
    created_at: snapshot.created_at,
  };
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

module.exports = {
  processCreditBureau,
  processUtilities,
  processWallets,
  processEcommerce,
  processMobileTopups,
  getSummary,
  NotFoundError,
};
