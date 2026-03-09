import Brand from "../models/Brand.js";
import Domain from "../models/Domain.js";
import { normalizeDomain } from "./domainService.js";

const CHECKER_API_URL = process.env.CHECKER_API_URL || "https://linkchecker.200m.website/api/urls";

const getUniqueObjectIds = (ids = []) => {
  const seen = new Set();
  const result = [];

  for (const id of ids) {
    const key = String(id || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(id);
  }

  return result;
};

export const syncDomainsFromCheckerApi = async ({ userId = null } = {}) => {
  const apiKey = process.env.CHECKER_API_KEY || "";

  if (!apiKey) {
    throw new Error("CHECKER_API_KEY is missing in environment variables.");
  }

  const response = await fetch(CHECKER_API_URL, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Checker API request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const rawItems = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];

  const domainToBrandCode = new Map();

  for (const item of rawItems) {
    const brandCode = String(item?.brand || "").trim().toUpperCase();
    const normalizedDomain = normalizeDomain(String(item?.Domain || item?.domain || ""));

    if (!brandCode || !normalizedDomain) continue;

    domainToBrandCode.set(normalizedDomain, brandCode);
  }

  const uniqueDomains = Array.from(domainToBrandCode.keys());
  const uniqueBrandCodes = Array.from(new Set(domainToBrandCode.values()));

  const brandMap = new Map();
  const existingBrands = await Brand.find({
    code: { $in: uniqueBrandCodes }
  });

  existingBrands.forEach((brand) => {
    brandMap.set(brand.code, brand);
  });

  let brandsAdded = 0;
  for (const brandCode of uniqueBrandCodes) {
    if (brandMap.has(brandCode)) continue;

    const created = await Brand.create({
      name: brandCode,
      code: brandCode,
      monitoringEnabled: true,
      createdBy: userId || null,
      updatedBy: userId || null
    });

    brandsAdded += 1;
    brandMap.set(brandCode, created);
  }

  const existingDomains = await Domain.find({});
  const existingDomainMap = new Map(existingDomains.map((domain) => [domain.domain, domain]));
  const touchedBrandIds = new Set();

  let domainsAdded = 0;
  let domainsUpdated = 0;
  let domainsRemoved = 0;

  for (const [domainName, brandCode] of domainToBrandCode.entries()) {
    const brand = brandMap.get(brandCode);
    if (!brand) continue;

    let domainDoc = existingDomainMap.get(domainName);
    const shouldBeActive = !brand.activeDomain;

    if (!domainDoc) {
      domainDoc = await Domain.create({
        domain: domainName,
        protocol: "https",
        status: shouldBeActive ? "assigned" : "inactive",
        assignedBrand: brand._id,
        createdBy: userId || null,
        updatedBy: userId || null
      });
      existingDomainMap.set(domainName, domainDoc);
      domainsAdded += 1;
    } else {
      let changed = false;

      if (!domainDoc.assignedBrand || String(domainDoc.assignedBrand) !== String(brand._id)) {
        domainDoc.assignedBrand = brand._id;
        changed = true;
      }

      const targetStatus = shouldBeActive ? "assigned" : "inactive";
      if (domainDoc.status !== targetStatus) {
        domainDoc.status = targetStatus;
        changed = true;
      }

      if (changed) {
        domainDoc.updatedBy = userId || null;
        await domainDoc.save();
        domainsUpdated += 1;
      }
    }

    brand.candidateDomains = getUniqueObjectIds([...(brand.candidateDomains || []), domainDoc._id]);
    if (!brand.activeDomain) {
      brand.activeDomain = domainDoc._id;
    }
    brand.updatedBy = userId || null;
    await brand.save();

    touchedBrandIds.add(String(brand._id));
  }

  const staleDomains = await Domain.find({
    domain: { $nin: uniqueDomains }
  });

  for (const stale of staleDomains) {
    if (stale.assignedBrand) {
      const brand = await Brand.findById(stale.assignedBrand);
      if (brand) {
        brand.candidateDomains = (brand.candidateDomains || []).filter(
          (id) => String(id) !== String(stale._id)
        );

        if (brand.activeDomain && String(brand.activeDomain) === String(stale._id)) {
          brand.activeDomain = brand.candidateDomains[0] || null;
        }

        brand.updatedBy = userId || null;
        await brand.save();
        touchedBrandIds.add(String(brand._id));
      }
    }

    await stale.deleteOne();
    domainsRemoved += 1;
  }

  for (const brandId of touchedBrandIds) {
    const brand = await Brand.findById(brandId);
    if (!brand) continue;

    const linkedDomains = await Domain.find({ assignedBrand: brand._id }).sort({ domain: 1 });
    const linkedIds = linkedDomains.map((item) => item._id);
    const currentActiveValid = linkedIds.some((id) => String(id) === String(brand.activeDomain));

    if (!currentActiveValid) {
      brand.activeDomain = linkedIds[0] || null;
    }

    brand.candidateDomains = getUniqueObjectIds(linkedIds);
    brand.updatedBy = userId || null;
    await brand.save();

    for (const linkedDomain of linkedDomains) {
      const status = brand.activeDomain && String(linkedDomain._id) === String(brand.activeDomain)
        ? "assigned"
        : "inactive";

      if (linkedDomain.status !== status) {
        linkedDomain.status = status;
        linkedDomain.updatedBy = userId || null;
        await linkedDomain.save();
      }
    }
  }

  await Domain.updateMany(
    { assignedBrand: null, status: { $ne: "available" } },
    { $set: { status: "available", updatedBy: userId || null } }
  );

  return {
    totalFromApi: rawItems.length,
    validItems: uniqueDomains.length,
    brandsAdded,
    domainsAdded,
    domainsUpdated,
    domainsRemoved
  };
};
