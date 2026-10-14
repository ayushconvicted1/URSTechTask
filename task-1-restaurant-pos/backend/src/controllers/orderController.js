const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

const generateOrderNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await Order.countDocuments({
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lte: new Date(new Date().setHours(23, 59, 59, 999))
    }
  });
  const sequence = String(countToday + 1).padStart(3, '0');
  return `ORD-${dateStr}-${sequence}`;
};

const createOrder = async (req, res) => {
  try {
    const { orderType, tableNumber, customerName, items, taxRate = 5, discountRate = 0 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    const itemIds = items.map((i) => i.menuItemId || i.menuItem || i._id);
    const dbMenuItems = await MenuItem.find({ _id: { $in: itemIds } });

    const menuMap = new Map();
    dbMenuItems.forEach((item) => menuMap.set(item._id.toString(), item));

    const processedItems = [];
    let subtotal = 0;

    for (const requestedItem of items) {
      const id = (requestedItem.menuItemId || requestedItem.menuItem || requestedItem._id || '').toString();
      const menuItem = menuMap.get(id);

      if (!menuItem) {
        return res.status(400).json({ message: `Menu item not found: ${id}` });
      }

      if (!menuItem.isAvailable) {
        return res.status(400).json({
          message: `Item "${menuItem.name}" is currently unavailable and cannot be ordered`
        });
      }

      const quantity = parseInt(requestedItem.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        return res.status(400).json({ message: `Invalid quantity for item "${menuItem.name}"` });
      }

      const itemPrice = menuItem.price;
      const itemSubtotal = Math.round(itemPrice * quantity * 100) / 100;
      subtotal += itemSubtotal;

      processedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: itemPrice,
        quantity,
        subtotal: itemSubtotal
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    const parsedTaxRate = Math.max(0, parseFloat(taxRate) || 0);
    const parsedDiscountRate = Math.min(100, Math.max(0, parseFloat(discountRate) || 0));

    const discountAmount = Math.round(((subtotal * parsedDiscountRate) / 100) * 100) / 100;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxAmount = Math.round(((discountedSubtotal * parsedTaxRate) / 100) * 100) / 100;
    const finalTotal = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

    const orderNumber = await generateOrderNumber();

    const order = new Order({
      orderNumber,
      orderType: orderType === 'takeaway' ? 'takeaway' : 'dine-in',
      tableNumber: orderType === 'takeaway' ? '' : (tableNumber ? tableNumber.trim() : ''),
      customerName: customerName && customerName.trim() ? customerName.trim() : 'Walk-in Customer',
      items: processedItems,
      subtotal,
      taxRate: parsedTaxRate,
      taxAmount,
      discountRate: parsedDiscountRate,
      discountAmount,
      finalTotal,
      status: 'Pending',
      paymentStatus: 'Pending',
      paymentMethod: 'Pending',
      createdBy: req.user ? req.user._id : null
    });

    const savedOrder = await order.save();
    return res.status(201).json({ message: 'Order created successfully', order: savedOrder });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const { status, search, date, startDate, endDate, paymentStatus, orderType, limit } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (paymentStatus && paymentStatus !== 'All') {
      filter.paymentStatus = paymentStatus;
    }

    if (orderType && orderType !== 'All') {
      filter.orderType = orderType;
    }

    if (search && search.trim() !== '') {
      filter.$or = [
        { orderNumber: { $regex: search.trim(), $options: 'i' } },
        { customerName: { $regex: search.trim(), $options: 'i' } },
        { tableNumber: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    } else if (startDate || endDate) {
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

    const query = Order.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    if (limit && Number(limit) > 0) {
      query.limit(Number(limit));
    }

    const orders = await query;

    return res.status(200).json({ orders, count: orders.length });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('createdBy', 'name email role');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.status(200).json({ order });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const validTransitions = {
      Pending: ['Preparing', 'Cancelled'],
      Preparing: ['Ready', 'Cancelled'],
      Ready: ['Completed', 'Cancelled'],
      Completed: [],
      Cancelled: []
    };

    if (order.status !== status && !validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        message: `Cannot transition order status from "${order.status}" to "${status}"`
      });
    }

    order.status = status;
    const updated = await order.save();
    return res.status(200).json({ message: `Order status updated to ${status}`, order: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const allowedMethods = ['Cash', 'UPI', 'Card'];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: `Valid payment method required: ${allowedMethods.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot record payment for a cancelled order' });
    }

    order.paymentStatus = 'Paid';
    order.paymentMethod = paymentMethod;
    order.paymentReceivedAt = new Date();

    const updated = await order.save();
    return res.status(200).json({ message: 'Payment recorded successfully', order: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to record payment', error: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  recordPayment
};
