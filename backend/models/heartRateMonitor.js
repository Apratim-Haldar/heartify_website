import mongoose from 'mongoose';

const schema = mongoose.Schema;

const HeartRateMonitor = new schema(
  {
    maxBPM: {
      type: Number,
      default: 0,
      require: true,
    },
    avgBPM: {
      type: Number,
      default: 0,
      require: true,
    },
    minBPM: {
      type: Number,
      default: 0,
      require: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users',
      required: false, // Making it optional for backward compatibility
    },
    heartifyID: {
      type: String,
      required: false, // Making it optional for backward compatibility
    }
  },
  { timestamps: true }
);

const heartRates = mongoose.model("HeartRateMonitor", HeartRateMonitor, "HeartRateMonitor");

export default heartRates;