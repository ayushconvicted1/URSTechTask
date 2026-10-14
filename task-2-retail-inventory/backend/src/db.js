const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/retail_inventory';
    cachedPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    }).then((m) => m.connection);
  }

  try {
    return await cachedPromise;
  } catch (err) {
    cachedPromise = null;
    throw err;
  }
};

module.exports = connectDB;

