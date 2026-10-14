const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getProfitReport,
  exportSalesCsv
} = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.get('/sales', authenticate, getSalesReport);
router.get('/profit', authenticate, getProfitReport);
router.get('/sales/csv', authenticate, exportSalesCsv);

module.exports = router;
