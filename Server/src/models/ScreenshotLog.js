import mongoose from "mongoose";

const screenshotLogSchema = new mongoose.Schema(
  {
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true
    },
    domain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domain",
      required: true
    },
    imagePath: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["live", "blocked", "timeout", "dead", "error", "unknown"],
      default: "unknown"
    },
    responseTimeMs: {
      type: Number,
      default: null
    },
    checkedAt: {
      type: Date,
      default: Date.now
    },
    meta: {
      title: { type: String, default: "" },
      finalUrl: { type: String, default: "" },
      errorMessage: { type: String, default: "" }
    }
  },
  {
    timestamps: true
  }
);

const ScreenshotLog = mongoose.model("ScreenshotLog", screenshotLogSchema);

export default ScreenshotLog;