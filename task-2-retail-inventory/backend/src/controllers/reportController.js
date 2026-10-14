const Sale = require('../models/Sale');
const Product = require('../models/Product');

const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { status: 'COMPLETED' };

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

    const sales = await Sale.find(filter).sort({ createdAt: -1 });

    const totalTransactions = sales.length;
    const totalRevenue = Math.round(sales.reduce((sum, s) => sum + s.totalAmount, 0) * 100) / 100;
    const totalTax = Math.round(sales.reduce((sum, s) => sum + s.taxAmount, 0) * 100) / 100;
    const totalDiscount = Math.round(sales.reduce((sum, s) => sum + s.discountAmount, 0) * 100) / 100;

    const productSalesMap = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        const key = item.sku;
        if (!productSalesMap[key]) {
          productSalesMap[key] = {
            sku: item.sku,
            name: item.name,
            totalQuantitySold: 0,
            totalRevenue: 0
          };
        }
        productSalesMap[key].totalQuantitySold += item.quantity;
        productSalesMap[key].totalRevenue += item.total;
      }
    }

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, 5)
      .map((p) => ({
        ...p,
        totalRevenue: Math.round(p.totalRevenue * 100) / 100
      }));

    return res.status(200).json({
      summary: {
        totalTransactions,
        totalRevenue,
        totalTax,
        totalDiscount,
        averageTransactionValue: totalTransactions > 0 ? Math.round((totalRevenue / totalTransactions) * 100) / 100 : 0
      },
      topSellingProducts,
      sales: sales.slice(0, 20)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate sales report', error: error.message });
  }
};

const getProfitReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { status: 'COMPLETED' };

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

    const sales = await Sale.find(filter);

    let totalRevenue = 0;
    let totalCostOfGoodsSold = 0;

    for (const sale of sales) {
      totalRevenue += sale.totalAmount;
      for (const item of sale.items) {
        totalCostOfGoodsSold += item.purchasePrice * item.quantity;
      }
    }

    totalRevenue = Math.round(totalRevenue * 100) / 100;
    totalCostOfGoodsSold = Math.round(totalCostOfGoodsSold * 100) / 100;
    const grossProfit = Math.round((totalRevenue - totalCostOfGoodsSold) * 100) / 100;
    const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 10000) / 100 : 0;

    return res.status(200).json({
      period: {
        startDate: startDate || 'All Time',
        endDate: endDate || 'All Time'
      },
      metrics: {
        totalSalesCount: sales.length,
        totalRevenue,
        totalCostOfGoodsSold,
        grossProfit,
        grossMarginPercent
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate profit report', error: error.message });
  }
};

const exportSalesCsv = async (req, res) => {
  try {
    const sales = await Sale.find().populate('cashier', 'name').sort({ createdAt: -1 });

    const headers = [
      'Invoice Number',
      'Date',
      'Customer/Cashier',
      'Items Count',
      'Subtotal (INR)',
      'Discount (INR)',
      'Tax (INR)',
      'Total Amount (INR)',
      'Payment Method',
      'Status'
    ];

    const rows = sales.map((sale) => [
      sale.invoiceNumber,
      new Date(sale.createdAt).toISOString().replace('T', ' ').substring(0, 19),
      sale.cashier ? `"${sale.cashier.name}"` : 'Staff',
      sale.items.reduce((s, i) => s + i.quantity, 0),
      sale.subtotal.toFixed(2),
      sale.discountAmount.toFixed(2),
      sale.taxAmount.toFixed(2),
      sale.totalAmount.toFixed(2),
      sale.paymentMethod,
      sale.status
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to export sales CSV', error: error.message });
  }
};

module.exports = {
  getSalesReport,
  getProfitReport,
  exportSalesCsv
};
