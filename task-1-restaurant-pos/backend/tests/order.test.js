require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const MenuItem = require('../src/models/MenuItem');
const Order = require('../src/models/Order');

let adminToken;
let staffToken;
let availableItem;
let unavailableItem;

beforeAll(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant_pos_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }

  await User.deleteMany({ email: /.*@test\.com$/ });
  await MenuItem.deleteMany({ name: /.*Test Item.*/ });
  await Order.deleteMany({ customerName: 'Test Customer' });

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin.pos@test.com',
    password: 'password123',
    role: 'admin'
  });

  const staff = await User.create({
    name: 'Staff User',
    email: 'staff.pos@test.com',
    password: 'password123',
    role: 'staff'
  });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin.pos@test.com', password: 'password123' });
  adminToken = adminLogin.body.token;

  const staffLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'staff.pos@test.com', password: 'password123' });
  staffToken = staffLogin.body.token;

  availableItem = await MenuItem.create({
    name: 'Test Item Margherita Pizza',
    category: 'Mains',
    price: 10,
    isAvailable: true
  });

  unavailableItem = await MenuItem.create({
    name: 'Test Item Seasonal Truffle Pasta',
    category: 'Mains',
    price: 25,
    isAvailable: false
  });
});

afterAll(async () => {
  await User.deleteMany({ email: /.*@test\.com$/ });
  await MenuItem.deleteMany({ name: /.*Test Item.*/ });
  await Order.deleteMany({ customerName: 'Test Customer' });
  await mongoose.disconnect();
});

describe('Task 1 - Restaurant POS & Order Management Tests', () => {
  test('POST /api/auth/login should authenticate valid user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.pos@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  test('POST /api/menu should be restricted to admin', async () => {
    const forbiddenRes = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        name: 'Staff Created Item',
        category: 'Desserts',
        price: 5
      });
    expect(forbiddenRes.status).toBe(403);

    const allowedRes = await request(app)
      .post('/api/menu')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin Created Test Item',
        category: 'Desserts',
        price: 5
      });
    expect(allowedRes.status).toBe(201);
    expect(allowedRes.body.item.name).toBe('Admin Created Test Item');
  });

  test('POST /api/orders must reject unavailable menu items', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        orderType: 'dine-in',
        tableNumber: 'T-1',
        customerName: 'Test Customer',
        items: [{ menuItemId: unavailableItem._id, quantity: 1 }]
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unavailable/i);
  });

  test('POST /api/orders must calculate and enforce correct server-side billing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        orderType: 'dine-in',
        tableNumber: 'T-2',
        customerName: 'Test Customer',
        items: [{ menuItemId: availableItem._id, quantity: 2 }],
        taxRate: 5,
        discountRate: 10
      });

    expect(res.status).toBe(201);
    const order = res.body.order;
    expect(order.subtotal).toBe(20);
    expect(order.discountAmount).toBe(2);
    expect(order.taxAmount).toBe(0.9);
    expect(order.finalTotal).toBe(18.9);
    expect(order.status).toBe('Pending');
    expect(order.paymentStatus).toBe('Pending');
  });

  test('PATCH /api/orders/:id/status should strictly follow workflow transitions', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        orderType: 'takeaway',
        customerName: 'Test Customer',
        items: [{ menuItemId: availableItem._id, quantity: 1 }],
        taxRate: 5,
        discountRate: 0
      });

    const orderId = createRes.body.order._id;

    const invalidTransition = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'Completed' });
    expect(invalidTransition.status).toBe(400);

    const step1 = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'Preparing' });
    expect(step1.status).toBe(200);
    expect(step1.body.order.status).toBe('Preparing');

    const step2 = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'Ready' });
    expect(step2.status).toBe(200);
    expect(step2.body.order.status).toBe('Ready');

    const step3 = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'Completed' });
    expect(step3.status).toBe(200);
    expect(step3.body.order.status).toBe('Completed');
  });

  test('POST /api/orders/:id/payment should record payment and update status', async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        orderType: 'dine-in',
        customerName: 'Test Customer',
        items: [{ menuItemId: availableItem._id, quantity: 1 }]
      });

    const orderId = createRes.body.order._id;

    const paymentRes = await request(app)
      .post(`/api/orders/${orderId}/payment`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ paymentMethod: 'UPI' });

    expect(paymentRes.status).toBe(200);
    expect(paymentRes.body.order.paymentStatus).toBe('Paid');
    expect(paymentRes.body.order.paymentMethod).toBe('UPI');
  });
});
