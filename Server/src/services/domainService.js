import Domain from "../models/Domain.js";

export const normalizeDomain = (value = "") => {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .split("/")[0];
};

export const buildDomainQuery = (query) => {
  const filters = {};

  if (query.search) {
    filters.domain = { $regex: query.search, $options: "i" };
  }

  if (query.status) {
    filters.status = query.status;
  }

  if (query.lastKnownHealth) {
    filters.lastKnownHealth = query.lastKnownHealth;
  }

  if (query.assignedBrand === "unassigned") {
    filters.assignedBrand = null;
  }

  if (query.assignedBrand && query.assignedBrand !== "unassigned") {
    filters.assignedBrand = query.assignedBrand;
  }

  return filters;
};

export const parseDomainsFromCsvText = (csvText = "") => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const results = [];

  for (const line of lines) {
    const firstCell = line.split(",")[0]?.trim();

    if (!firstCell) continue;

    const normalized = normalizeDomain(firstCell);

    if (!normalized || normalized === "domain") continue;

    results.push(normalized);
  }

  return [...new Set(results)];
};

export const findDomains = async (query = {}) => {
  const filters = buildDomainQuery(query);

  return Domain.find(filters)
    .populate("assignedBrand", "name code")
    .populate("createdBy", "username email role")
    .populate("updatedBy", "username email role")
    .sort({ createdAt: -1 });
};

export const findAvailableDomains = async () => {
  return Domain.find({ status: "available", assignedBrand: null }).sort({ domain: 1 });
};