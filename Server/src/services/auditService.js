import AuditLog from "../models/AuditLog.js";

export const createAuditLog = async ({
  userId = null,
  action,
  entityType,
  entityId = "",
  details = {}
}) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      entityType,
      entityId: String(entityId || ""),
      details
    });
  } catch (error) {
    console.error("createAuditLog error:", error.message);
  }
};