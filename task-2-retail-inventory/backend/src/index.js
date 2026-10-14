require('dotenv').config();
const app = require('./app');
const connectDB = require('./db');

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => {
      console.log('MongoDB connected successfully');
      app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to database:', err.message);
      process.exit(1);
    });
}

module.exports = app;
