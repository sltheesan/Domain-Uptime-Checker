import path from "path";
import Brand from "../models/Brand.js";
import Domain from "../models/Domain.js";
import ScreenshotLog from "../models/ScreenshotLog.js";
import Setting from "../models/Setting.js";
import { captureDomainScreenshot } from "./screenshotService.js";
import { emitBrandUpdated, emitDashboardUpdated } from "../sockets/socketServer.js";

export const getOrCreateSettings = async () => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({
      screenshotIntervalMinutes: Number(process.env.SCREENSHOT_INTERVAL_MINUTES || 5),
      screenshotTimeoutMs: Number(process.env.SCREENSHOT_TIMEOUT_MS || 30000),
      screenshotConcurrency: Number(process.env.SCREENSHOT_CONCURRENCY || 4)
    });
  }

  return settings;
};

export const getDashboardData = async () => {
  const brands = await Brand.find({})
    .populate("activeDomain")
    .sort({ createdAt: -1 });

  const summary = {
    totalBrands: brands.length,
    healthyCount: brands.filter((b) => b.lastStatus === "live").length,
    blockedCount: brands.filter((b) =>
      ["blocked", "dead", "error", "timeout"].includes(b.lastStatus)
    ).length,
    monitoringEnabledCount: brands.filter((b) => b.monitoringEnabled).length
  };

  return { summary, brands };
};

export const monitorSingleBrand = async (brand) => {
  if (!brand?.activeDomain) {
    return {
      skipped: true,
      reason: "No active domain assigned."
    };
  }

  const settings = await getOrCreateSettings();

  const storagePath = path.resolve(
    process.cwd(),
    process.env.SCREENSHOT_STORAGE_PATH || "src/storage/screenshots"
  );

  const result = await captureDomainScreenshot({
    brand,
    domain: brand.activeDomain,
    timeoutMs: settings.screenshotTimeoutMs,
    storagePath
  });

  brand.lastStatus = result.status;
  brand.lastCheckedAt = new Date();
  brand.lastScreenshot = result.relativePath || brand.lastScreenshot || "";
  brand.updatedAt = new Date();
  await brand.save();

  const domain = await Domain.findById(brand.activeDomain._id);

  if (domain) {
    domain.lastKnownHealth = result.status;
    domain.lastCheckAt = new Date();

    if (["blocked", "dead", "error", "timeout"].includes(result.status)) {
      domain.status = "blocked";
    } else if (domain.assignedBrand) {
      domain.status = "assigned";
    }

    await domain.save();
  }

  const log = await ScreenshotLog.create({
    brand: brand._id,
    domain: brand.activeDomain._id,
    imagePath: result.relativePath || "",
    status: result.status,
    responseTimeMs: result.responseTimeMs,
    checkedAt: new Date(),
    meta: {
      title: result.title || "",
      finalUrl: result.finalUrl || "",
      errorMessage: result.errorMessage || ""
    }
  });

  const populatedBrand = await Brand.findById(brand._id).populate("activeDomain");

  emitBrandUpdated(String(brand._id), {
    brand: populatedBrand,
    latestLog: log
  });

  const dashboardData = await getDashboardData();
  emitDashboardUpdated(dashboardData);

  return result;
};

export const getMonitoringHistoryByBrand = async (brandId) => {
  return ScreenshotLog.find({ brand: brandId })
    .populate("brand", "name code")
    .populate("domain", "domain protocol")
    .sort({ checkedAt: -1 })
    .limit(50);
};