import mongoose from "mongoose";

const domainSchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true
    },
    protocol: {
      type: String,
      enum: ["http", "https"],
      default: "https"
    },
    status: {
      type: String,
      enum: ["available", "assigned", "blocked", "inactive"],
      default: "available"
    },
    assignedBrand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      default: null
    },
    lastKnownHealth: {
      type: String,
      enum: ["live", "blocked", "timeout", "dead", "error", "unknown"],
      default: "unknown"
    },
    lastCheckAt: {
      type: Date,
      default: null
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

const Domain = mongoose.model("Domain", domainSchema);

export default Domain;