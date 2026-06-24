const { Router } = require('express');
const controller = require('../controllers/creditApplicationController');

const router = Router();

router.post('/', controller.createApplication);
router.get('/applicant/:applicantId', controller.getApplicationsByApplicant);
router.get('/:id', controller.getApplicationById);
router.patch('/:id/status', controller.updateApplicationStatus);
router.get('/:id/audit', controller.getAuditTrail);

module.exports = router;
