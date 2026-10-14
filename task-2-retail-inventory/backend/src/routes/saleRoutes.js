const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSaleById,
  returnSale
} = require('../controllers/saleController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, createSale);
router.get('/', authenticate, getSales);
router.get('/:id', authenticate, getSaleById);
router.post('/:id/return', authenticate, returnSale);

module.exports = router;
