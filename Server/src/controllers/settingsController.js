import { restartScheduler } from "../jobs/scheduler.js";
import { getOrCreateSettings } from "../services/monitoringService.js";
import { createAuditLog } from "../services/auditService.js";
import { syncDomainsFromCheckerApi } from "../services/checkerSyncService.js";

export const getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.status(200).json({ settings });
  } catch (error) {
    console.error("getSettings error:", error);
    return res.status(500).json({
      message: "Failed to fetch settings."
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    const {
      screenshotIntervalMinutes,
      screenshotTimeoutMs,
      screenshotConcurrency
    } = req.body || {};

    if (screenshotIntervalMinutes !== undefined) {
      settings.screenshotIntervalMinutes = Math.max(1, Number(screenshotIntervalMinutes));
    }

    if (screenshotTimeoutMs !== undefined) {
      settings.screenshotTimeoutMs = Math.max(5000, Number(screenshotTimeoutMs));
    }

    if (screenshotConcurrency !== undefined) {
      settings.screenshotConcurrency = Math.max(1, Number(screenshotConcurrency));
    }

    await settings.save();
    await restartScheduler();

    await createAuditLog({
      userId: req.user?._id,
      action: "UPDATE_SETTINGS",
      entityType: "Setting",
      entityId: settings._id,
      details: {
        screenshotIntervalMinutes: settings.screenshotIntervalMinutes,
        screenshotTimeoutMs: settings.screenshotTimeoutMs,
        screenshotConcurrency: settings.screenshotConcurrency
      }
    });

    return res.status(200).json({
      message: "Settings updated successfully.",
      settings
    });
  } catch (error) {
    console.error("updateSettings error:", error);
    return res.status(500).json({
      message: "Failed to update settings."
    });
  }
};

export const syncCheckerDomains = async (req, res) => {
  try {
    const summary = await syncDomainsFromCheckerApi({
      userId: req.user?._id || null
    });

    await createAuditLog({
      userId: req.user?._id,
      action: "SYNC_CHECKER_DOMAINS",
      entityType: "Setting",
      details: summary
    });

    return res.status(200).json({
      message: "Checker sync completed successfully.",
      summary
    });
  } catch (error) {
    console.error("syncCheckerDomains error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to sync checker domains."
    });
  }
};
