const service = require('../services/creditApplicationService');
const auditService = require('../services/auditService');
const { createApplicationSchema, updateStatusSchema } = require('../validators/creditApplicationValidator');

async function createApplication(req, res, next) {
  try {
    const { error, value } = createApplicationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Datos de solicitud inválidos',
        details: error.details.map((d) => d.message),
      });
    }
    const application = await service.createApplication(value);
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
}

async function getApplicationById(req, res, next) {
  try {
    const application = await service.getApplicationById(req.params.id);
    res.status(200).json(application);
  } catch (err) {
    next(err);
  }
}

async function getApplicationsByApplicant(req, res, next) {
  try {
    const applications = await service.getApplicationsByApplicant(req.params.applicantId);
    res.status(200).json(applications);
  } catch (err) {
    next(err);
  }
}

async function updateApplicationStatus(req, res, next) {
  try {
    const { error, value } = updateStatusSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: 'Datos de actualización inválidos',
        details: error.details.map((d) => d.message),
      });
    }
    const application = await service.updateApplicationStatus(req.params.id, value);
    res.status(200).json(application);
  } catch (err) {
    next(err);
  }
}

async function getAuditTrail(req, res, next) {
  try {
    const events = await auditService.getAuditTrail(req.params.id);
    res.status(200).json({ application_id: req.params.id, events });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createApplication,
  getApplicationById,
  getApplicationsByApplicant,
  updateApplicationStatus,
  getAuditTrail,
};
