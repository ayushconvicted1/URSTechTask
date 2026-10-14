const Product = require('../models/Product');
const InventoryMovement = require('../models/InventoryMovement');

const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$availableStock', '$reorderLevel'] },
      isActive: true
    }).sort({ availableStock: 1 });

    return res.status(200).json({
      lowStockProducts: products,
      count: products.length
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch low stock products', error: error.message });
  }
};

const adjustInventory = async (req, res) => {
  try {
    const { productId, type, quantity, reason, referenceId } = req.body;

    const allowedTypes = ['RECEIVED', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid adjustment type. Allowed: ${allowedTypes.join(', ')}` });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive integer' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.availableStock;
    let newStock = previousStock;

    if (type === 'RECEIVED' || type === 'ADJUSTMENT_IN') {
      newStock = previousStock + qty;
    } else if (type === 'ADJUSTMENT_OUT') {
      if (previousStock - qty < 0) {
        return res.status(400).json({
          message: `Cannot adjust stock below zero. Current stock: ${previousStock}, Requested deduction: ${qty}`
        });
      }
      newStock = previousStock - qty;
    }

    product.availableStock = newStock;
    await product.save();

    const movement = await InventoryMovement.create({
      product: product._id,
      type,
      quantity: qty,
      previousStock,
      newStock,
      reason: reason ? reason.trim() : `Manual inventory adjustment (${type})`,
      referenceId: referenceId ? referenceId.trim() : '',
      performedBy: req.user ? req.user._id : null
    });

    return res.status(201).json({
      message: 'Inventory adjusted successfully',
      movement,
      product
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to adjust inventory', error: error.message });
  }
};

const getInventoryMovements = async (req, res) => {
  try {
    const { productId, type, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (productId) filter.product = productId;
    if (type && type !== 'All') filter.type = type;

    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [movements, total] = await Promise.all([
      InventoryMovement.find(filter)
        .populate('product', 'sku name category availableStock reorderLevel')
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      InventoryMovement.countDocuments(filter)
    ]);

    return res.status(200).json({
      movements,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch inventory movements', error: error.message });
  }
};

module.exports = {
  getLowStockProducts,
  adjustInventory,
  getInventoryMovements
};
