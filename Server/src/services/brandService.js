import Brand from "../models/Brand.js";

export const buildBrandQuery = (query) => {
  const filters = {};

  if (query.search) {
    filters.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { code: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } }
    ];
  }

  if (query.monitoringEnabled === "true") {
    filters.monitoringEnabled = true;
  }

  if (query.monitoringEnabled === "false") {
    filters.monitoringEnabled = false;
  }

  if (query.status) {
    filters.lastStatus = query.status;
  }

  return filters;
};

export const findBrands = async (query = {}) => {
  const filters = buildBrandQuery(query);

  return Brand.find(filters)
    .select("-lastStatus")
    .populate("activeDomain", "domain protocol status")
    .populate("createdBy", "username email role")
    .populate("updatedBy", "username email role")
    .sort({ createdAt: -1 });
};

export const findBrandById = async (id) => {
  return Brand.findById(id)
    .populate("createdBy", "username email role")
    .populate("updatedBy", "username email role")
    .populate("activeDomain")
    .populate("candidateDomains");
};
