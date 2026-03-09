import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import { getDashboardData, getMonitoringHistoryByBrand, monitorSingleBrand } from "../services/monitoringService.js";
import { runMonitorJob } from "../jobs/monitorJob.js";

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