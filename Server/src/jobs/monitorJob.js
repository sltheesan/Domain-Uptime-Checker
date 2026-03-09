import pLimit from "p-limit";
import Brand from "../models/Brand.js";
import { getOrCreateSettings, monitorSingleBrand } from "../services/monitoringService.js";

let isMonitorJobRunning = false;

export const runMonitorJob = async () => {
  if (isMonitorJobRunning) {
    console.log("Monitor job skipped: already running.");
    return;
  }

  isMonitorJobRunning = true;

  try {
    const settings = await getOrCreateSettings();

    const brands = await Brand.find({
      monitoringEnabled: true,
      activeDomain: { $ne: null }
    }).populate("activeDomain");

    const limit = pLimit(settings.screenshotConcurrency || 4);

    const tasks = brands.map((brand) =>
      limit(async () => {
        try {
          const result = await monitorSingleBrand(brand);
          console.log(`Monitored ${brand.name}: ${result.status}`);
          return result;
        } catch (error) {
          console.error(`Monitoring failed for ${brand.name}:`, error.message);
          return null;
        }
      })
    );

    await Promise.all(tasks);
  } catch (error) {
    console.error("Monitor job failed:", error.message);
  } finally {
    isMonitorJobRunning = false;
  }
};