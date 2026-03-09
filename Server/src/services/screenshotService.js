import path from "path";
import { chromium } from "playwright";
import { ensureDir } from "../utils/ensureDir.js";
import { classifyMonitoringResult } from "../utils/screenshotClassifier.js";

let browserInstance = null;

const getBrowser = async () => {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: true
    });
  }

  return browserInstance;
};

export const closeBrowser = async () => {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
};

export const captureDomainScreenshot = async ({
  brand,
  domain,
  timeoutMs,
  storagePath
}) => {
  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const startedAt = Date.now();
  let response = null;
  let finalStatus = "unknown";
  let title = "";
  let finalUrl = "";
  let bodyText = "";
  let errorMessage = "";

  try {
    const protocol = domain.protocol || "https";
    const url = `${protocol}://${domain.domain}`;

    response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs
    });

    await page.waitForTimeout(2500);

    title = await page.title();
    finalUrl = page.url();

    try {
      bodyText = (await page.textContent("body")) || "";
    } catch {
      bodyText = "";
    }

    finalStatus = classifyMonitoringResult({
      statusCode: response?.status() ?? null,
      content: `${title} ${bodyText}`
    });

    const dir = ensureDir(storagePath);
    const safeBrand = brand.code || brand.name.replace(/\s+/g, "_");
    const filename = `${safeBrand}_${Date.now()}.png`;
    const absolutePath = path.join(dir, filename);

    await page.screenshot({
      path: absolutePath,
      fullPage: true
    });

    const responseTimeMs = Date.now() - startedAt;

    return {
      success: true,
      status: finalStatus,
      responseTimeMs,
      title,
      finalUrl,
      absolutePath,
      relativePath: `/screenshots/${filename}`,
      statusCode: response?.status() ?? null,
      errorMessage: ""
    };
  } catch (error) {
    errorMessage = error?.message || "Unknown screenshot error";

    finalStatus = classifyMonitoringResult({
      errorMessage
    });

    return {
      success: false,
      status: finalStatus,
      responseTimeMs: Date.now() - startedAt,
      title,
      finalUrl,
      absolutePath: "",
      relativePath: "",
      statusCode: response?.status() ?? null,
      errorMessage
    };
  } finally {
    await page.close();
    await context.close();
  }
};