const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    photo: {
      type: String,
      required: true,
    },
    location: {
      coordinates: {
        latitude: {
          type: Number,
          required: true,
        },
        longitude: {
          type: Number,
          required: true,
        },
      },
      address: {
        type: String,
        required: true,
      },
      lastUpdated: {
        type: Date,
        required: true,
        default: Date.now,
      },
    },
    locationHistory: [
      {
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
        address: String,
        lastUpdated: { type: Date, default: Date.now },
      }
    ],
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['checked-in', 'checked-out'],
      default: 'checked-in',
    },
    hoursWorked: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
