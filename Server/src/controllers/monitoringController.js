import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import { getDashboardData, getMonitoringHistoryByBrand, monitorSingleBrand } from "../services/monitoringService.js";
import { runMonitorJob } from "../jobs/monitorJob.js";
import { resolveMobileVisitUrl } from "../services/screenshotService.js";

export const getMonitoringDashboard = async (req, res) => {
  try {
    const data = await getDashboardData();
    return res.status(200).json(data);
  } catch (error) {
    console.error("getMonitoringDashboard error:", error);
    return res.status(500).json({
      message: "Failed to load monitoring dashboard."
    });
  }
};

export const runMonitoringNow = async (req, res) => {
  try {
    await runMonitorJob();

    return res.status(200).json({
      message: "Monitoring job completed."
    });
  } catch (error) {
    console.error("runMonitoringNow error:", error);
    return res.status(500).json({
      message: "Failed to run monitoring job."
    });
  }
};

export const runBrandMonitoringNow = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid brand ID." });
    }

    const brand = await Brand.findById(id).populate("activeDomain");

    if (!brand) {
      return res.status(404).json({ message: "Brand not found." });
    }

    const result = await monitorSingleBrand(brand);

    return res.status(200).json({
      message: "Brand monitoring completed.",
      result
    });
  } catch (error) {
    console.error("runBrandMonitoringNow error:", error);
    return res.status(500).json({
      message: "Failed to run brand monitoring."
    });
  }
};

export const getBrandMonitoringHistory = async (req, res) => {
  try {
    const { brandId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ message: "Invalid brand ID." });
    }

    const logs = await getMonitoringHistoryByBrand(brandId);

    return res.status(200).json({
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error("getBrandMonitoringHistory error:", error);
    return res.status(500).json({
      message: "Failed to fetch monitoring history."
    });
  }
};

export const resolveVisitUrl = async (req, res) => {
  try {
    const { url } = req.query || {};

    if (!url) {
      return res.status(400).json({ message: "url query is required." });
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ message: "Invalid URL." });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ message: "Only http/https URLs are allowed." });
    }

    const resolved = await resolveMobileVisitUrl({
      url: parsed.toString(),
      timeoutMs: 12000
    });

    return res.status(200).json({
      originalUrl: parsed.toString(),
      finalUrl: resolved.finalUrl,
      mobileUaUsed: true
    });
  } catch (error) {
    console.error("resolveVisitUrl error:", error);
    return res.status(500).json({
      message: "Failed to resolve mobile visit URL."
    });
  }
};
