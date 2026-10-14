require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const InventoryMovement = require('../src/models/InventoryMovement');
const Sale = require('../src/models/Sale');

let adminToken;
let staffToken;
let testProduct;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/retail_inventory_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  await User.deleteMany({ email: /.*@retailtest\.com$/ });
  await Product.deleteMany({ sku: /^TEST-SKU/ });
  await Sale.deleteMany({ invoiceNumber: /^INV-TEST/ });
  await InventoryMovement.deleteMany({ referenceId: /^INIT-TEST/ });

  await User.create({
    name: 'Admin User',
    email: 'admin@retailtest.com',
    password: 'password123',
    role: 'admin'
  });

  await User.create({
    name: 'Staff User',
    email: 'staff@retailtest.com',
    password: 'password123',
    role: 'staff'
  });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@retailtest.com', password: 'password123' });
  adminToken = adminLogin.body.token;

  const staffLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'staff@retailtest.com', password: 'password123' });
  staffToken = staffLogin.body.token;

  testProduct = await Product.create({
    sku: 'TEST-SKU-100',
    name: 'Test Mechanical Keyboard',
    category: 'Electronics',
    purchasePrice: 40,
    sellingPrice: 80,
    availableStock: 5,
    reorderLevel: 2,
    isActive: true
  });
});

afterAll(async () => {
  await User.deleteMany({ email: /.*@retailtest\.com$/ });
  await Product.deleteMany({ sku: /^TEST-SKU/ });
  await Sale.deleteMany({ invoiceNumber: /^INV-TEST/ });
  await InventoryMovement.deleteMany({ referenceId: /^INIT-TEST/ });
  await mongoose.disconnect();
});

describe('Task 2 - Retail Inventory & Sales Management Tests', () => {
  test('POST /api/products should enforce admin-only access and SKU uniqueness', async () => {
    const forbidden = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        sku: 'TEST-SKU-200',
        name: 'Staff Item',
        category: 'Electronics',
        purchasePrice: 10,
        sellingPrice: 20
      });
    expect(forbidden.status).toBe(403);

    const duplicateSku = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sku: 'TEST-SKU-100',
        name: 'Duplicate SKU Item',
        category: 'Electronics',
        purchasePrice: 10,
        sellingPrice: 20
      });
    expect(duplicateSku.status).toBe(400);
    expect(duplicateSku.body.message).toMatch(/already exists/i);
  });

  test('POST /api/sales must prevent sales that exceed available stock', async () => {
    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        items: [{ productId: testProduct._id, quantity: 10 }]
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/insufficient stock/i);

    const currentProd = await Product.findById(testProduct._id);
    expect(currentProd.availableStock).toBe(5);
  });

  test('POST /api/sales should deduct stock and record audited inventory movement', async () => {
    const initialProduct = await Product.findById(testProduct._id);
    const initialStock = initialProduct.availableStock;

    const res = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        items: [{ productId: testProduct._id, quantity: 2 }],
        discountAmount: 10,
        taxRate: 5,
        paymentMethod: 'Cash'
      });

    expect(res.status).toBe(201);
    expect(res.body.sale.invoiceNumber).toBeDefined();
    expect(res.body.sale.subtotal).toBe(160);
    expect(res.body.sale.discountAmount).toBe(10);
    expect(res.body.sale.taxAmount).toBe(7.5);
    expect(res.body.sale.totalAmount).toBe(157.5);

    const updatedProduct = await Product.findById(testProduct._id);
    expect(updatedProduct.availableStock).toBe(initialStock - 2);

    const movement = await InventoryMovement.findOne({
      product: testProduct._id,
      type: 'SALE'
    });
    expect(movement).toBeDefined();
    expect(movement.quantity).toBe(2);
    expect(movement.previousStock).toBe(initialStock);
    expect(movement.newStock).toBe(initialStock - 2);
  });

  test('POST /api/inventory/adjustments should adjust stock and audit correctly', async () => {
    const initialProduct = await Product.findById(testProduct._id);
    const prevStock = initialProduct.availableStock;

    const adjustRes = await request(app)
      .post('/api/inventory/adjustments')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        productId: testProduct._id,
        type: 'RECEIVED',
        quantity: 10,
        reason: 'Restocking shipment'
      });

    expect(adjustRes.status).toBe(201);
    expect(adjustRes.body.product.availableStock).toBe(prevStock + 10);

    const invalidDeduct = await request(app)
      .post('/api/inventory/adjustments')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        productId: testProduct._id,
        type: 'ADJUSTMENT_OUT',
        quantity: 999,
        reason: 'Large damage'
      });
    expect(invalidDeduct.status).toBe(400);
    expect(invalidDeduct.body.message).toMatch(/below zero/i);
  });

  test('POST /api/sales/:id/return should restore stock and record return movement', async () => {
    const saleRes = await request(app)
      .post('/api/sales')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        items: [{ productId: testProduct._id, quantity: 1 }]
      });

    const saleId = saleRes.body.sale._id;
    const stockAfterSale = (await Product.findById(testProduct._id)).availableStock;

    const returnRes = await request(app)
      .post(`/api/sales/${saleId}/return`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ reason: 'Defective packaging returned by customer' });

    expect(returnRes.status).toBe(200);
    expect(returnRes.body.sale.status).toBe('RETURNED');

    const restoredProduct = await Product.findById(testProduct._id);
    expect(restoredProduct.availableStock).toBe(stockAfterSale + 1);

    const returnMovement = await InventoryMovement.findOne({
      referenceId: saleRes.body.sale.invoiceNumber,
      type: 'RETURN'
    });
    expect(returnMovement).toBeDefined();
    expect(returnMovement.quantity).toBe(1);
  });
});
