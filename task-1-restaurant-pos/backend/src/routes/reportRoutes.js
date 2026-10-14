const express = require('express');
const router = express.Router();
const { getDailySales, exportOrdersCsv } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.get('/daily-sales', authenticate, getDailySales);
router.get('/orders/csv', authenticate, exportOrdersCsv);

module.exports = router;
