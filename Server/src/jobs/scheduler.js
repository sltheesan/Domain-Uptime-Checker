import cron from "node-cron";
import { getOrCreateSettings } from "../services/monitoringService.js";
import { runMonitorJob } from "./monitorJob.js";

let scheduledTask = null;

export const startScheduler = async () => {
  const settings = await getOrCreateSettings();
  const minutes = Math.max(1, Number(settings.screenshotIntervalMinutes || 5));
  const cronExpr = `*/${minutes} * * * *`;

  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }

  scheduledTask = cron.schedule(cronExpr, async () => {
    console.log(`Running scheduled monitor job every ${minutes} minute(s).`);
    await runMonitorJob();
  });

  console.log(`Scheduler started with interval: every ${minutes} minute(s).`);
};

export const restartScheduler = async () => {
  await startScheduler();
};