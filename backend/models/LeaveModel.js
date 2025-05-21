const mongoose = require('mongoose');

const leaveSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;
