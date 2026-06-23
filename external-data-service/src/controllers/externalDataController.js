const service = require('../services/externalDataService');
const { creditBureauSchema, applicantSourceSchema } = require('../validators/externalDataValidator');
const { CircuitOpenError } = require('../simulators/creditBureauSimulator');
const { getBreakerStatus } = require('../simulators/creditBureauSimulator');

async function queryCreditBureau(req, res, next) {
  try {
    const { error, value } = creditBureauSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.details.map((d) => d.message) });
    }
    const result = await service.processCreditBureau(value.application_id, value.document_number);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof CircuitOpenError) {
      return res.status(503).json({
        error: err.message,
        circuit_breaker: getBreakerStatus(),
      });
    }
    next(err);
  }
}

async function queryUtilities(req, res, next) {
  try {
    const { error, value } = applicantSourceSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.details.map((d) => d.message) });
    }
    const result = await service.processUtilities(value.application_id, value.applicant_id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function queryWallets(req, res, next) {
  try {
    const { error, value } = applicantSourceSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.details.map((d) => d.message) });
    }
    const result = await service.processWallets(value.application_id, value.applicant_id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function queryEcommerce(req, res, next) {
  try {
    const { error, value } = applicantSourceSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.details.map((d) => d.message) });
    }
    const result = await service.processEcommerce(value.application_id, value.applicant_id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function queryMobileTopups(req, res, next) {
  try {
    const { error, value } = applicantSourceSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.details.map((d) => d.message) });
    }
    const result = await service.processMobileTopups(value.application_id, value.applicant_id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getSummary(req, res, next) {
  try {
    const summary = await service.getSummary(req.params.applicationId);
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  queryCreditBureau,
  queryUtilities,
  queryWallets,
  queryEcommerce,
  queryMobileTopups,
  getSummary,
};
