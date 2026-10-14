const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem
} = require('../controllers/menuController');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', getMenuItems);
router.get('/:id', getMenuItemById);
router.post('/', authenticate, requireRole('admin'), createMenuItem);
router.put('/:id', authenticate, requireRole('admin'), updateMenuItem);
router.patch('/:id/toggle', authenticate, requireRole('admin'), toggleAvailability);
router.delete('/:id', authenticate, requireRole('admin'), deleteMenuItem);

module.exports = router;
