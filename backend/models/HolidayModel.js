const mongoose = require('mongoose');

const holidaySchema = mongoose.Schema(
  {
    date: { type: Date, required: true },
    name: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

const Holiday = mongoose.model('Holiday', holidaySchema);

module.exports = Holiday;
