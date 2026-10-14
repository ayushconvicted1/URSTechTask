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
    availableStock: 4,
    reorderLevel: 10
  },
  {
    sku: 'ELEC-1003',
    name: 'Ergonomic Wireless Mouse',
    category: 'Electronics',
    purchasePrice: 549,
    sellingPrice: 999,
    availableStock: 18,
    reorderLevel: 5
  },
  {
    sku: 'GROC-2001',
    name: 'Organic Whole Bean Dark Roast Coffee 1kg',
    category: 'Grocery',
    purchasePrice: 450,
    sellingPrice: 799,
    availableStock: 35,
    reorderLevel: 12
  },
  {
    sku: 'GROC-2002',
    name: 'Extra Virgin Greek Olive Oil 750ml',
    category: 'Grocery',
    purchasePrice: 550,
    sellingPrice: 899,
    availableStock: 3,
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
    availableStock: 45,
    reorderLevel: 15
  },
  {
    sku: 'STAT-3002',
    name: 'Premium Gel Roller Pens Set of 10',
    category: 'Stationery',
    purchasePrice: 180,
    sellingPrice: 399,
    availableStock: 5,
    reorderLevel: 10
  },
  {
    sku: 'APPR-4001',
    name: 'Heavyweight Organic Cotton T-Shirt',
    category: 'Apparel',
    purchasePrice: 350,
    sellingPrice: 799,
    availableStock: 30,
    reorderLevel: 10
  },
  {
    sku: 'APPR-4002',
    name: 'Classic Canvas Utility Tote Bag',
    category: 'Apparel',
    purchasePrice: 200,
    sellingPrice: 499,
    availableStock: 2,
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

    const createdProducts = await Product.insertMany(initialProducts);

    for (const prod of createdProducts) {
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

    console.log('Task 2 Database seeded successfully (0 pre-orders/sales, clean deployment state)');
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
