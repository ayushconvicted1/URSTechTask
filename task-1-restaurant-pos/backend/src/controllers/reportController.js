const Order = require('../models/Order');

const getDailySales = async (req, res) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const ordersToday = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });

    const totalOrders = ordersToday.length;
    const completedOrders = ordersToday.filter((o) => o.status === 'Completed').length;
    const paidOrders = ordersToday.filter((o) => o.paymentStatus === 'Paid');

    const totalSales = Math.round(
      paidOrders.reduce((sum, order) => sum + order.finalTotal, 0) * 100
    ) / 100;

    const cashSales = Math.round(
      paidOrders
        .filter((o) => o.paymentMethod === 'Cash')
        .reduce((sum, o) => sum + o.finalTotal, 0) * 100
    ) / 100;

    const upiSales = Math.round(
      paidOrders
        .filter((o) => o.paymentMethod === 'UPI')
        .reduce((sum, o) => sum + o.finalTotal, 0) * 100
    ) / 100;

    const cardSales = Math.round(
      paidOrders
        .filter((o) => o.paymentMethod === 'Card')
        .reduce((sum, o) => sum + o.finalTotal, 0) * 100
    ) / 100;

    const dineInOrders = ordersToday.filter((o) => o.orderType === 'dine-in').length;
    const takeawayOrders = ordersToday.filter((o) => o.orderType === 'takeaway').length;

    const averageOrderValue =
      paidOrders.length > 0
        ? Math.round((totalSales / paidOrders.length) * 100) / 100
        : 0;

    const itemMap = {};
    ordersToday.forEach((order) => {
      if (order.status !== 'Cancelled') {
        order.items.forEach((item) => {
          if (!itemMap[item.name]) {
            itemMap[item.name] = { name: item.name, quantity: 0, revenue: 0 };
          }
          itemMap[item.name].quantity += item.quantity;
          itemMap[item.name].revenue += item.subtotal;
        });
      }
    });

    const topItems = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        revenue: Math.round(item.revenue * 100) / 100
      }));

    const recentOrders = ordersToday.slice(0, 20);

    return res.status(200).json({
      date: startOfDay.toISOString().slice(0, 10),
      summary: {
        totalOrders,
        completedOrders,
        pendingOrders: ordersToday.filter((o) => o.status === 'Pending').length,
        preparingOrders: ordersToday.filter((o) => o.status === 'Preparing').length,
        readyOrders: ordersToday.filter((o) => o.status === 'Ready').length,
        cancelledOrders: ordersToday.filter((o) => o.status === 'Cancelled').length,
        totalSales,
        averageOrderValue,
        paymentBreakdown: {
          Cash: cashSales,
          UPI: upiSales,
          Card: cardSales
        },
        orderTypeBreakdown: {
          dineIn: dineInOrders,
          takeaway: takeawayOrders
        }
      },
      topItems,
      recentOrders
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate daily sales report', error: error.message });
  }
};

const exportOrdersCsv = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    const headers = ['Order Number', 'Date', 'Type', 'Table', 'Customer', 'Items Count', 'Subtotal (INR)', 'Tax (INR)', 'Discount (INR)', 'Final Total (INR)', 'Payment Status', 'Payment Method', 'Order Status'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toISOString(),
      o.orderType,
      `"${o.tableNumber || '-'}"`,
      `"${o.customerName || '-'}"`,
      o.items.reduce((sum, i) => sum + i.quantity, 0),
      o.subtotal.toFixed(2),
      o.taxAmount.toFixed(2),
      o.discountAmount.toFixed(2),
      o.finalTotal.toFixed(2),
      o.paymentStatus,
      o.paymentMethod,
      o.status
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-export-${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to export orders CSV', error: error.message });
  }
};

module.exports = {
  getDailySales,
  exportOrdersCsv
};
