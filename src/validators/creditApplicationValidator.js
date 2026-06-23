const Joi = require('joi');
const { ApplicationStatus } = require('../models/CreditApplication');

const createApplicationSchema = Joi.object({
  applicant_id: Joi.string().uuid().required().messages({
    'string.guid': 'applicant_id debe ser un UUID válido',
    'any.required': 'applicant_id es requerido',
  }),
  requested_amount: Joi.number().min(1).max(1000000).precision(2).required().messages({
    'number.min': 'El monto solicitado debe ser mayor a 0',
    'number.max': 'El monto solicitado no puede exceder 1,000,000',
    'any.required': 'requested_amount es requerido',
  }),
  currency: Joi.string().length(3).uppercase().default('USD'),
  term_months: Joi.number().integer().min(1).max(360).required().messages({
    'number.min': 'El plazo mínimo es 1 mes',
    'number.max': 'El plazo máximo es 360 meses',
    'any.required': 'term_months es requerido',
  }),
  purpose: Joi.string().max(500).optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ApplicationStatus))
    .required()
    .messages({
      'any.only': `El estado debe ser uno de: ${Object.values(ApplicationStatus).join(', ')}`,
      'any.required': 'status es requerido',
    }),
});

module.exports = { createApplicationSchema, updateStatusSchema };
