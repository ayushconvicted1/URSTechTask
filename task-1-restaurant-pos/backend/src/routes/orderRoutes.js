const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  recordPayment
} = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/status', authenticate, updateOrderStatus);
router.post('/:id/payment', authenticate, recordPayment);

module.exports = router;
