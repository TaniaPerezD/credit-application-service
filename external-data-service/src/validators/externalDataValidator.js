const Joi = require('joi');

const applicationIdSchema = Joi.object({
  application_id: Joi.string().uuid().required().messages({
    'string.guid': 'application_id debe ser un UUID válido',
    'any.required': 'application_id es requerido',
  }),
});

const creditBureauSchema = applicationIdSchema.keys({
  document_number: Joi.string().min(5).max(20).required().messages({
    'any.required': 'document_number es requerido',
  }),
});

const applicantSourceSchema = applicationIdSchema.keys({
  applicant_id: Joi.string().uuid().required().messages({
    'string.guid': 'applicant_id debe ser un UUID válido',
    'any.required': 'applicant_id es requerido',
  }),
});

module.exports = { creditBureauSchema, applicantSourceSchema };
