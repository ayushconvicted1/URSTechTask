require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const InventoryMovement = require('./models/InventoryMovement');
const Sale = require('./models/Sale');
const connectDB = require('./db');

const initialUsers = [
  {
    name: 'Inventory Manager',
    email: 'admin@urstechsolution.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Retail Cashier',
    email: 'staff@urstechsolution.com',
    password: 'staff123',
    role: 'staff'
  }
];

const initialProducts = [
  {
    sku: 'ELEC-1001',
    name: 'Wireless Bluetooth Headphones',
    category: 'Electronics',
    purchasePrice: 1499,
    sellingPrice: 2499,
    availableStock: 25,
    reorderLevel: 8
  },
  {
    sku: 'ELEC-1002',
    name: 'Fast USB-C 65W GaN Charger',
    category: 'Electronics',
    purchasePrice: 699,
    sellingPrice: 1299,
    availableStock: 5,
    reorderLevel: 10
  },
  {
    sku: 'ELEC-1003',
    name: 'Ergonomic Wireless Mouse',
    category: 'Electronics',
    purchasePrice: 549,
    sellingPrice: 999,
    availableStock: 19,
    reorderLevel: 5
  },
  {
    sku: 'GROC-2001',
    name: 'Organic Whole Bean Dark Roast Coffee 1kg',
    category: 'Grocery',
    purchasePrice: 450,
    sellingPrice: 799,
    availableStock: 37,
    reorderLevel: 12
  },
  {
    sku: 'GROC-2002',
    name: 'Extra Virgin Greek Olive Oil 750ml',
    category: 'Grocery',
    purchasePrice: 550,
    sellingPrice: 899,
    availableStock: 4,
    reorderLevel: 8
  },
  {
    sku: 'GROC-2003',
    name: 'Artisan Raw Blossom Honey 500g',
    category: 'Grocery',
    purchasePrice: 220,
    sellingPrice: 450,
    availableStock: 0,
    reorderLevel: 5
  },
  {
    sku: 'STAT-3001',
    name: 'Hardcover Dot Grid Journal A5',
    category: 'Stationery',
    purchasePrice: 150,
    sellingPrice: 349,
    availableStock: 48,
    reorderLevel: 15
  },
  {
    sku: 'STAT-3002',
    name: 'Premium Gel Roller Pens Set of 10',
    category: 'Stationery',
    purchasePrice: 180,
    sellingPrice: 399,
    availableStock: 6,
    reorderLevel: 10
  },
  {
    sku: 'APPR-4001',
    name: 'Heavyweight Organic Cotton T-Shirt',
    category: 'Apparel',
    purchasePrice: 350,
    sellingPrice: 799,
    availableStock: 32,
    reorderLevel: 10
  },
  {
    sku: 'APPR-4002',
    name: 'Classic Canvas Utility Tote Bag',
    category: 'Apparel',
    purchasePrice: 200,
    sellingPrice: 499,
    availableStock: 3,
    reorderLevel: 6
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    await User.deleteMany({});
    for (const u of initialUsers) {
      await User.create(u);
    }

    await Product.deleteMany({});
    await InventoryMovement.deleteMany({});
    await Sale.deleteMany({});

    const adminUser = await User.findOne({ email: 'admin@urstechsolution.com' });
    const staffUser = await User.findOne({ email: 'staff@urstechsolution.com' });

    const createdProducts = await Product.insertMany(initialProducts);
    const prodMap = new Map();
    for (const prod of createdProducts) {
      prodMap.set(prod.sku, prod);
      if (prod.availableStock > 0) {
        await InventoryMovement.create({
          product: prod._id,
          type: 'RECEIVED',
          quantity: prod.availableStock,
          previousStock: 0,
          newStock: prod.availableStock,
          reason: 'Initial inventory intake',
          referenceId: `INIT-${prod.sku}`,
          performedBy: adminUser._id
        });
      }
    }

    const today = new Date();
    const setTime = (hours, minutes) => {
      const d = new Date(today);
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    const salesPlan = [
      {
        invoiceNumber: 'INV-20261014-0001',
        createdAt: setTime(9, 45),
        cashier: staffUser._id,
        paymentMethod: 'UPI',
        items: [
          { sku: 'ELEC-1001', qty: 1 },
          { sku: 'ELEC-1002', qty: 1 }
        ],
        discountRate: 0,
        discountAmount: 0,
        taxRate: 5
      },
      {
        invoiceNumber: 'INV-20261014-0002',
        createdAt: setTime(11, 20),
        cashier: staffUser._id,
        paymentMethod: 'Card',
        items: [
          { sku: 'GROC-2001', qty: 2 },
          { sku: 'STAT-3001', qty: 1 }
        ],
        discountRate: 0,
        discountAmount: 50,
        taxRate: 5
      },
      {
        invoiceNumber: 'INV-20261014-0003',
        createdAt: setTime(13, 15),
        cashier: adminUser._id,
        paymentMethod: 'UPI',
        items: [
          { sku: 'APPR-4001', qty: 2 },
          { sku: 'APPR-4002', qty: 1 }
        ],
        discountRate: 0,
        discountAmount: 100,
        taxRate: 5
      },
      {
        invoiceNumber: 'INV-20261014-0004',
        createdAt: setTime(15, 5),
        cashier: staffUser._id,
        paymentMethod: 'Cash',
        items: [
          { sku: 'STAT-3002', qty: 1 },
          { sku: 'STAT-3001', qty: 2 }
        ],
        discountRate: 0,
        discountAmount: 0,
        taxRate: 5
      },
      {
        invoiceNumber: 'INV-20261014-0005',
        createdAt: setTime(16, 40),
        cashier: staffUser._id,
        paymentMethod: 'Card',
        items: [
          { sku: 'ELEC-1003', qty: 1 }
        ],
        discountRate: 0,
        discountAmount: 0,
        taxRate: 5
      },
      {
        invoiceNumber: 'INV-20261014-0006',
        createdAt: setTime(17, 30),
        cashier: staffUser._id,
        paymentMethod: 'Cash',
        items: [
          { sku: 'GROC-2002', qty: 1 }
        ],
        discountRate: 0,
        discountAmount: 0,
        taxRate: 5
      }
    ];

    for (const plan of salesPlan) {
      let subtotal = 0;
      const saleItems = [];

      for (const itemPlan of plan.items) {
        const prod = prodMap.get(itemPlan.sku);
        const itemTotal = prod.sellingPrice * itemPlan.qty;
        subtotal += itemTotal;

        saleItems.push({
          product: prod._id,
          sku: prod.sku,
          name: prod.name,
          purchasePrice: prod.purchasePrice,
          unitPrice: prod.sellingPrice,
          quantity: itemPlan.qty,
          total: itemTotal
        });

        const prevStock = prod.availableStock;
        const newStock = prevStock - itemPlan.qty;
        prod.availableStock = newStock;
        await Product.findByIdAndUpdate(prod._id, { availableStock: newStock });

        await InventoryMovement.create({
          product: prod._id,
          type: 'SALE',
          quantity: itemPlan.qty,
          previousStock: prevStock,
          newStock: newStock,
          reason: 'Retail POS Sale',
          referenceId: plan.invoiceNumber,
          performedBy: plan.cashier,
          createdAt: plan.createdAt
        });
      }

      const taxable = Math.max(0, subtotal - plan.discountAmount);
      const taxAmount = Number(((taxable * plan.taxRate) / 100).toFixed(2));
      const totalAmount = Number((taxable + taxAmount).toFixed(2));

      await Sale.create({
        invoiceNumber: plan.invoiceNumber,
        items: saleItems,
        subtotal,
        discountRate: plan.discountRate,
        discountAmount: plan.discountAmount,
        taxRate: plan.taxRate,
        taxAmount,
        totalAmount,
        paymentMethod: plan.paymentMethod,
        status: 'COMPLETED',
        cashier: plan.cashier,
        createdAt: plan.createdAt,
        updatedAt: plan.createdAt
      });
    }

    console.log('Task 2 Database seeded successfully with live production sales and audited movements');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
