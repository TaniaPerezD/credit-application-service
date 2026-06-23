const { CreditApplication, ApplicationStatus } = require('../models/CreditApplication');

const VALID_STATUS_TRANSITIONS = {
  [ApplicationStatus.CREATED]: [ApplicationStatus.DATA_COLLECTING, ApplicationStatus.REJECTED],
  [ApplicationStatus.DATA_COLLECTING]: [ApplicationStatus.SCORING, ApplicationStatus.REJECTED],
  [ApplicationStatus.SCORING]: [
    ApplicationStatus.APPROVED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.MANUAL_REVIEW,
  ],
  [ApplicationStatus.MANUAL_REVIEW]: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
  [ApplicationStatus.APPROVED]: [ApplicationStatus.DISBURSED],
  [ApplicationStatus.REJECTED]: [],
  [ApplicationStatus.DISBURSED]: [],
};

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class InvalidTransitionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidTransitionError';
  }
}

async function createApplication({ applicant_id, requested_amount, currency, term_months, purpose }) {
  const application = await CreditApplication.create({
    applicant_id,
    requested_amount,
    currency: currency ?? 'USD',
    term_months,
    purpose,
    status: ApplicationStatus.CREATED,
  });
  return application.toJSON();
}

async function getApplicationById(id) {
  const application = await CreditApplication.findByPk(id);
  if (!application) throw new NotFoundError(`Solicitud con id ${id} no encontrada`);
  return application.toJSON();
}

async function getApplicationsByApplicant(applicantId) {
  const applications = await CreditApplication.findAll({
    where: { applicant_id: applicantId },
    order: [['created_at', 'DESC']],
  });
  return applications.map((a) => a.toJSON());
}

async function updateApplicationStatus(id, { status }) {
  const application = await CreditApplication.findByPk(id);
  if (!application) throw new NotFoundError(`Solicitud con id ${id} no encontrada`);

  const allowed = VALID_STATUS_TRANSITIONS[application.status];
  if (!allowed.includes(status)) {
    throw new InvalidTransitionError(
      `Transición inválida: ${application.status} → ${status}. Permitidas: [${allowed.join(', ')}]`
    );
  }

  await application.update({ status, updated_at: new Date() });
  return application.toJSON();
}

module.exports = {
  createApplication,
  getApplicationById,
  getApplicationsByApplicant,
  updateApplicationStatus,
  NotFoundError,
  InvalidTransitionError,
};
