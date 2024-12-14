const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  product_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }],
  total_price: { type: Number, required: true },
  customer_name: { type: String, required: true },
  payment_method: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
