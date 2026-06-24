const crypto = require('crypto');
const AuditEvent = require('../models/AuditEvent');

const SECRET = process.env.DIGITAL_SIGNATURE_SECRET || 'NeoLendAuditSignature2026';
const ENABLED = process.env.AUDIT_ENABLED === 'true';

function sign(application_id, event_type, from_status, to_status, payload, occurred_at) {
  const canonical = { application_id, event_type, from_status, to_status, payload, occurred_at };
  return crypto.createHmac('sha256', SECRET).update(JSON.stringify(canonical)).digest('hex');
}

async function recordEvent(application_id, event_type, { from_status = null, to_status = null, payload = {} } = {}) {
  if (!ENABLED) return;
  try {
    const occurred_at = new Date();
    const signature = sign(application_id, event_type, from_status, to_status, payload, occurred_at);
    await AuditEvent.create({ application_id, event_type, from_status, to_status, payload, signature, occurred_at });
  } catch (err) {
    console.error(`[AUDIT] Error al registrar evento ${event_type} para ${application_id}:`, err.message);
  }
}

function verifyEvent(event) {
  const { application_id, event_type, from_status, to_status, payload, signature, occurred_at } = event;
  const expected = sign(application_id, event_type, from_status, to_status, payload, new Date(occurred_at));
  return expected === signature;
}

async function getAuditTrail(application_id) {
  const events = await AuditEvent.findAll({
    where: { application_id },
    order: [['occurred_at', 'ASC']],
  });

  return events.map((e) => {
    const plain = e.toJSON();
    return { ...plain, signature_valid: verifyEvent(plain) };
  });
}

module.exports = { recordEvent, getAuditTrail };
