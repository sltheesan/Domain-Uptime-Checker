import path from "path";
import { chromium } from "playwright";
import { ensureDir } from "../utils/ensureDir.js";
import { classifyMonitoringResult } from "../utils/screenshotClassifier.js";

let browserInstance = null;

const MOBILE_PROFILES = [
  {
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  },
  {
    viewport: { width: 412, height: 915 },
    screen: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
  },
  {
    viewport: { width: 393, height: 873 },
    screen: { width: 393, height: 873 },
    deviceScaleFactor: 3,
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/120.0.0.0 Mobile Safari/537.36"
  }
];

const getShuffledMobileProfiles = () => {
  const profiles = [...MOBILE_PROFILES];
  for (let i = profiles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [profiles[i], profiles[j]] = [profiles[j], profiles[i]];
  }
  return profiles;
};

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

export const resolveMobileVisitUrl = async ({ url, timeoutMs = 12000 }) => {
  const browser = await getBrowser();
  let lastErrorMessage = "";

  for (const profile of getShuffledMobileProfiles()) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      screen: profile.screen,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: profile.deviceScaleFactor,
      userAgent: profile.userAgent
    });
    const page = await context.newPage();

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs
      });

      await page.waitForTimeout(1200);
      const finalUrl = page.url();

      if (finalUrl) {
        await page.close();
        await context.close();
        return {
          finalUrl,
          userAgent: profile.userAgent
        };
      }
    } catch (error) {
      lastErrorMessage = error?.message || "Failed to resolve mobile URL";
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
  }

  throw new Error(lastErrorMessage || "Failed to resolve mobile URL");
};

export const captureDomainScreenshot = async ({
  brand,
  domain,
  timeoutMs,
  storagePath
}) => {
  const browser = await getBrowser();
  const startedAt = Date.now();
  const protocol = domain.protocol || "https";
  const url = `${protocol}://${domain.domain}`;
  const dir = ensureDir(storagePath);
  const safeBrand = (brand.code || brand.name || "brand")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `${safeBrand}_latest.png`;
  const absolutePath = path.join(dir, filename);

  let lastErrorMessage = "";
  let fallbackTitle = "";
  let fallbackFinalUrl = "";
  let fallbackCaptured = false;

  for (const profile of getShuffledMobileProfiles()) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      screen: profile.screen,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: profile.deviceScaleFactor,
      userAgent: profile.userAgent
    });
    const page = await context.newPage();

    let response = null;
    let title = "";
    let finalUrl = "";
    let bodyText = "";

    try {
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

      const finalStatus = classifyMonitoringResult({
        statusCode: response?.status() ?? null,
        content: `${title} ${bodyText}`
      });

      await page.screenshot({
        path: absolutePath,
        fullPage: true
      });

      return {
        success: true,
        status: finalStatus,
        responseTimeMs: Date.now() - startedAt,
        title,
        finalUrl,
        absolutePath,
        relativePath: `/screenshots/${filename}`,
        statusCode: response?.status() ?? null,
        errorMessage: ""
      };
    } catch (error) {
      lastErrorMessage = error?.message || "Unknown screenshot error";
      fallbackFinalUrl = page.url() || fallbackFinalUrl;
      fallbackTitle = await page.title().catch(() => fallbackTitle);

      // Capture fallback visual state even on failures (DNS, timeout, blocked, etc.).
      await page
        .screenshot({
          path: absolutePath,
          fullPage: true
        })
        .then(() => {
          fallbackCaptured = true;
        })
        .catch(() => {});
    } finally {
      await page.close();
      await context.close();
    }
  }

  const finalStatus = classifyMonitoringResult({
    errorMessage: lastErrorMessage
  });

  return {
    success: false,
    status: finalStatus,
    responseTimeMs: Date.now() - startedAt,
    title: fallbackTitle || "",
    finalUrl: fallbackFinalUrl || "",
    absolutePath: fallbackCaptured ? absolutePath : "",
    relativePath: fallbackCaptured ? `/screenshots/${filename}` : "",
    statusCode: null,
    errorMessage: lastErrorMessage || "Unknown screenshot error"
  };
};
