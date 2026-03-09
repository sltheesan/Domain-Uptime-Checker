import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 100
    },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
      maxlength: 30
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    activeDomain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Domain",
      default: null
    },
    candidateDomains: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Domain"
      }
    ],
    lastStatus: {
      type: String,
      enum: ["live", "blocked", "timeout", "dead", "error", "unknown"],
      default: "unknown"
    },
    lastCheckedAt: {
      type: Date,
      default: null
    },
    lastScreenshot: {
      type: String,
      default: ""
    },
    monitoringEnabled: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;