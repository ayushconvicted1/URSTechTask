const express = require('express');
const router = express.Router();
const {
  getLowStockProducts,
  adjustInventory,
  getInventoryMovements
} = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');

router.get('/low-stock', authenticate, getLowStockProducts);
router.post('/adjustments', authenticate, adjustInventory);
router.get('/movements', authenticate, getInventoryMovements);

module.exports = router;
