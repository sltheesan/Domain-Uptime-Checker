import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    entityType: {
      type: String,
      required: true,
      trim: true
    },
    entityId: {
      type: String,
      default: ""
    },
    details: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;