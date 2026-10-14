const Product = require('../models/Product');
const Sale = require('../models/Sale');
const InventoryMovement = require('../models/InventoryMovement');

const generateInvoiceNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await Sale.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lte: new Date(new Date().setHours(23, 59, 59, 999))
    }
  });
  const sequence = String(countToday + 1).padStart(4, '0');
  return `INV-${dateStr}-${sequence}`;
};

const createSale = async (req, res) => {
  const deductionsToRollback = [];

  try {
    const { items, discountRate = 0, discountAmount = 0, taxRate = 5, paymentMethod = 'Cash' } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Sale must contain at least one item' });
    }

    const requestedProductIds = items.map((i) => i.productId || i.product || i._id);
    const dbProducts = await Product.find({ _id: { $in: requestedProductIds } });

    const productMap = new Map();
    dbProducts.forEach((p) => productMap.set(p._id.toString(), p));

    for (const item of items) {
      const pid = (item.productId || item.product || item._id || '').toString();
      const dbProduct = productMap.get(pid);

      if (!dbProduct) {
        return res.status(400).json({ message: `Product not found: ${pid}` });
      }

      if (!dbProduct.isActive) {
        return res.status(400).json({ message: `Product "${dbProduct.name}" is deactivated` });
      }

      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ message: `Invalid quantity for product "${dbProduct.name}"` });
      }

      if (dbProduct.availableStock < qty) {
        return res.status(400).json({
          message: `Insufficient stock for "${dbProduct.name}". Available: ${dbProduct.availableStock}, Requested: ${qty}`
        });
      }
    }

    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const pid = (item.productId || item.product || item._id || '').toString();
      const qty = parseInt(item.quantity, 10);

      const updatedProduct = await Product.findOneAndUpdate(
        { _id: pid, availableStock: { $gte: qty } },
        { $inc: { availableStock: -qty } },
        { new: false }
      );

      if (!updatedProduct) {
        for (const rollback of deductionsToRollback) {
          await Product.findByIdAndUpdate(rollback.productId, { $inc: { availableStock: rollback.quantity } });
        }
        return res.status(400).json({
          message: `Stock conflict: insufficient stock during checkout for item ID ${pid}`
        });
      }

      const prevStock = updatedProduct.availableStock;
      const newStock = prevStock - qty;

      deductionsToRollback.push({
        productId: pid,
        quantity: qty,
        previousStock: prevStock,
        newStock: newStock
      });

      const unitPrice = updatedProduct.sellingPrice;
      const itemTotal = Math.round(unitPrice * qty * 100) / 100;
      subtotal += itemTotal;

      processedItems.push({
        product: updatedProduct._id,
        sku: updatedProduct.sku,
        name: updatedProduct.name,
        purchasePrice: updatedProduct.purchasePrice,
        unitPrice: unitPrice,
        quantity: qty,
        total: itemTotal
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const parsedRate = Math.min(100, Math.max(0, parseFloat(discountRate) || 0));
    const parsedDiscount = parsedRate > 0
      ? Math.round(((subtotal * parsedRate) / 100) * 100) / 100
      : Math.min(subtotal, Math.max(0, parseFloat(discountAmount) || 0));
    const discountedSubtotal = Math.max(0, subtotal - parsedDiscount);
    const parsedTaxRate = Math.max(0, parseFloat(taxRate) || 0);
    const taxAmount = Math.round(((discountedSubtotal * parsedTaxRate) / 100) * 100) / 100;
    const totalAmount = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

    const invoiceNumber = await generateInvoiceNumber();

    const sale = new Sale({
      invoiceNumber,
      items: processedItems,
      subtotal,
      discountRate: parsedRate,
      discountAmount: parsedDiscount,
      taxRate: parsedTaxRate,
      taxAmount,
      totalAmount,
      paymentMethod: ['Cash', 'Card', 'UPI'].includes(paymentMethod) ? paymentMethod : 'Cash',
      status: 'COMPLETED',
      cashier: req.user ? req.user._id : null
    });

    const savedSale = await sale.save();

    for (const record of deductionsToRollback) {
      await InventoryMovement.create({
        product: record.productId,
        type: 'SALE',
        quantity: record.quantity,
        previousStock: record.previousStock,
        newStock: record.newStock,
        reason: `Deduction for invoice ${savedSale.invoiceNumber}`,
        referenceId: savedSale.invoiceNumber,
        performedBy: req.user ? req.user._id : null
      });
    }

    return res.status(201).json({
      message: 'Sale completed successfully',
      sale: savedSale
    });
  } catch (error) {
    for (const rollback of deductionsToRollback) {
      try {
        await Product.findByIdAndUpdate(rollback.productId, { $inc: { availableStock: rollback.quantity } });
      } catch (rbErr) {}
    }
    return res.status(500).json({ message: 'Failed to process sale', error: error.message });
  }
};

const getSales = async (req, res) => {
  try {
    const { startDate, endDate, search, paymentMethod, status } = req.query;
    const filter = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    if (search && search.trim() !== '') {
      filter.invoiceNumber = { $regex: search.trim(), $options: 'i' };
    }

    if (paymentMethod && paymentMethod !== 'All') {
      filter.paymentMethod = paymentMethod;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    const sales = await Sale.find(filter)
      .populate('cashier', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({ sales, count: sales.length });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch sales', error: error.message });
  }
};

const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('cashier', 'name email role');
    if (!sale) {
      return res.status(404).json({ message: 'Sale invoice not found' });
    }
    return res.status(200).json({ sale });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch sale details', error: error.message });
  }
};

const returnSale = async (req, res) => {
  try {
    const { reason } = req.body;
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: 'Sale invoice not found' });
    }

    if (sale.status === 'RETURNED') {
      return res.status(400).json({ message: 'This sale invoice has already been returned' });
    }

    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const previousStock = product.availableStock;
        const newStock = previousStock + item.quantity;

        product.availableStock = newStock;
        await product.save();

        await InventoryMovement.create({
          product: product._id,
          type: 'RETURN',
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: reason ? reason.trim() : `Customer return for invoice ${sale.invoiceNumber}`,
          referenceId: sale.invoiceNumber,
          performedBy: req.user ? req.user._id : null
        });
      }
    }

    sale.status = 'RETURNED';
    sale.returnReason = reason ? reason.trim() : 'Customer return';
    sale.returnedAt = new Date();

    const updatedSale = await sale.save();

    return res.status(200).json({
      message: 'Sale returned and inventory restored successfully',
      sale: updatedSale
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process return', error: error.message });
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  returnSale
};
