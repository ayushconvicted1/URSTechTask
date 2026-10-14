const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/retail_inventory';
  const conn = await mongoose.connect(uri);
  isConnected = true;
  return conn;
};

module.exports = connectDB;
