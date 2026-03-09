import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    screenshotIntervalMinutes: {
      type: Number,
      default: 5
    },
    screenshotTimeoutMs: {
      type: Number,
      default: 30000
    },
    screenshotConcurrency: {
      type: Number,
      default: 4
    }
  },
  {
    timestamps: true
  }
);

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;