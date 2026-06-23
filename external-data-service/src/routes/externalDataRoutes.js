const { Router } = require('express');
const controller = require('../controllers/externalDataController');

const router = Router();

router.post('/credit-bureau', controller.queryCreditBureau);
router.post('/utilities', controller.queryUtilities);
router.post('/wallets', controller.queryWallets);
router.post('/ecommerce', controller.queryEcommerce);
router.post('/mobile-topups', controller.queryMobileTopups);
router.get('/summary/:applicationId', controller.getSummary);

module.exports = router;
