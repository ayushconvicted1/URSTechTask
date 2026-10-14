const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    type: {
      type: String,
      enum: ['RECEIVED', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'SALE', 'RETURN'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    previousStock: {
      type: Number,
      required: true
    },
    newStock: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      default: '',
      trim: true
    },
    referenceId: {
      type: String,
      default: '',
      trim: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

inventoryMovementSchema.index({ product: 1, createdAt: -1 });
inventoryMovementSchema.index({ type: 1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
