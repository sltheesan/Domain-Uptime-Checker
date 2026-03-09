import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import Domain from "../models/Domain.js";
import {
  findAvailableDomains,
  findDomains,
  normalizeDomain,
  parseDomainsFromCsvText
} from "../services/domainService.js";
import { createAuditLog } from "../services/auditService.js";

export const getDomains = async (req, res) => {
  try {
    const domains = await findDomains(req.query);

    return res.status(200).json({
      count: domains.length,
      domains
    });
  } catch (error) {
    console.error("getDomains error:", error);
    return res.status(500).json({
      message: "Failed to fetch domains."
    });
  }
};

export const getAvailableDomains = async (req, res) => {
  try {
    const domains = await findAvailableDomains();

    return res.status(200).json({
      count: domains.length,
      domains
    });
  } catch (error) {
    console.error("getAvailableDomains error:", error);
    return res.status(500).json({
      message: "Failed to fetch available domains."
    });
  }
};

export const createDomain = async (req, res) => {
  try {
    const { domain, protocol, notes, brandId } = req.body || {};

    if (!domain) {
      return res.status(400).json({
        message: "Domain is required."
      });
    }

    const normalized = normalizeDomain(domain);

    if (!normalized) {
      return res.status(400).json({
        message: "Invalid domain value."
      });
    }

    const existingDomain = await Domain.findOne({ domain: normalized });

    if (existingDomain) {
      return res.status(409).json({
        message: "Domain already exists."
      });
    }

    let brand = null;
    if (brandId) {
      if (!mongoose.Types.ObjectId.isValid(brandId)) {
        return res.status(400).json({
          message: "Invalid brand ID."
        });
      }

      brand = await Brand.findById(brandId);
      if (!brand) {
        return res.status(404).json({
          message: "Brand not found."
        });
      }
    }

    const created = await Domain.create({
      domain: normalized,
      protocol: protocol === "http" ? "http" : "https",
      notes: notes?.trim() || "",
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null
    });

    if (brand) {
      created.assignedBrand = brand._id;
      created.status = brand.activeDomain ? "inactive" : "assigned";
      created.updatedBy = req.user?._id || null;
      await created.save();

      if (!brand.activeDomain) {
        brand.activeDomain = created._id;
      }
      brand.candidateDomains = brand.candidateDomains || [];
      if (!brand.candidateDomains.some((item) => String(item) === String(created._id))) {
        brand.candidateDomains.push(created._id);
      }
      brand.updatedBy = req.user?._id || null;
      await brand.save();
    }

    const createdWithBrand = await Domain.findById(created._id).populate(
      "assignedBrand",
      "name code"
    );

    await createAuditLog({
      userId: req.user?._id,
      action: "CREATE_DOMAIN",
      entityType: "Domain",
      entityId: created._id,
      details: {
        domain: created.domain,
        protocol: created.protocol,
        brandId: brand?._id || null,
        brandName: brand?.name || null
      }
    });

    return res.status(201).json({
      message: "Domain created successfully.",
      domain: createdWithBrand
    });
  } catch (error) {
    console.error("createDomain error:", error);
    return res.status(500).json({
      message: "Failed to create domain."
    });
  }
};

export const updateDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const { protocol, status, notes, lastKnownHealth } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid domain ID."
      });
    }

    const domain = await Domain.findById(id);

    if (!domain) {
      return res.status(404).json({
        message: "Domain not found."
      });
    }

    if (protocol && ["http", "https"].includes(protocol)) {
      domain.protocol = protocol;
    }

    if (status && ["available", "assigned", "blocked", "inactive"].includes(status)) {
      if (status === "available" && domain.assignedBrand) {
        return res.status(400).json({
          message: "Cannot mark an assigned domain as available."
        });
      }

      domain.status = status;
    }

    if (
      lastKnownHealth &&
      ["live", "blocked", "dead", "error"].includes(lastKnownHealth)
    ) {
      domain.lastKnownHealth = lastKnownHealth;
    }

    if (typeof notes === "string") {
      domain.notes = notes.trim();
    }

    domain.updatedBy = req.user?._id || null;

    await domain.save();

    const updated = await Domain.findById(domain._id)
      .populate("assignedBrand", "name code")
      .populate("createdBy", "username email role")
      .populate("updatedBy", "username email role");

    return res.status(200).json({
      message: "Domain updated successfully.",
      domain: updated
    });
  } catch (error) {
    console.error("updateDomain error:", error);
    return res.status(500).json({
      message: "Failed to update domain."
    });
  }
};

export const deleteDomain = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid domain ID."
      });
    }

    const domain = await Domain.findById(id);

    if (!domain) {
      return res.status(404).json({
        message: "Domain not found."
      });
    }

    if (domain.assignedBrand) {
      return res.status(400).json({
        message: "Cannot delete an assigned domain."
      });
    }

    await domain.deleteOne();

    await createAuditLog({
      userId: req.user?._id,
      action: "DELETE_DOMAIN",
      entityType: "Domain",
      entityId: domain._id,
      details: {
        domain: domain.domain
      }
    });

    return res.status(200).json({
      message: "Domain deleted successfully."
    });
  } catch (error) {
    console.error("deleteDomain error:", error);
    return res.status(500).json({
      message: "Failed to delete domain."
    });
  }
};

export const importDomainsCsv = async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        message: "CSV file is required."
      });
    }

    const csvText = req.file.buffer.toString("utf-8");
    const parsedDomains = parseDomainsFromCsvText(csvText);

    if (!parsedDomains.length) {
      return res.status(400).json({
        message: "No valid domains found in the CSV."
      });
    }

    const existingDomains = await Domain.find({
      domain: { $in: parsedDomains }
    }).select("domain");

    const existingSet = new Set(existingDomains.map((item) => item.domain));
    const newDomains = parsedDomains.filter((item) => !existingSet.has(item));

    if (!newDomains.length) {
      return res.status(200).json({
        message: "All domains in the CSV already exist.",
        importedCount: 0,
        skippedCount: parsedDomains.length
      });
    }

    const docs = newDomains.map((item) => ({
      domain: item,
      protocol: "https",
      status: "available",
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null
    }));

    await Domain.insertMany(docs);

    await createAuditLog({
      userId: req.user?._id,
      action: "IMPORT_DOMAINS_CSV",
      entityType: "Domain",
      details: {
        importedCount: newDomains.length,
        skippedCount: parsedDomains.length - newDomains.length
      }
    });

    return res.status(201).json({
      message: "Domains imported successfully.",
      importedCount: newDomains.length,
      skippedCount: parsedDomains.length - newDomains.length
    });
  } catch (error) {
    console.error("importDomainsCsv error:", error);
    return res.status(500).json({
      message: "Failed to import domains."
    });
  }
};

export const assignDomainToBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandId } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid domain ID."
      });
    }

    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({
        message: "Invalid brand ID."
      });
    }

    const domain = await Domain.findById(id);
    const brand = await Brand.findById(brandId);

    if (!domain) {
      return res.status(404).json({
        message: "Domain not found."
      });
    }

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found."
      });
    }

    if (domain.assignedBrand && String(domain.assignedBrand) !== String(brand._id)) {
      return res.status(400).json({
        message: "Domain is already assigned to another brand."
      });
    }

    domain.assignedBrand = brand._id;
    domain.status = brand.activeDomain ? "inactive" : "assigned";
    domain.updatedBy = req.user?._id || null;

    if (!brand.activeDomain) {
      brand.activeDomain = domain._id;
    }
    brand.candidateDomains = brand.candidateDomains || [];
    if (!brand.candidateDomains.some((item) => String(item) === String(domain._id))) {
      brand.candidateDomains.push(domain._id);
    }
    brand.updatedBy = req.user?._id || null;

    await domain.save();
    await brand.save();

    const updatedDomain = await Domain.findById(domain._id).populate(
      "assignedBrand",
      "name code"
    );
    const updatedBrand = await Brand.findById(brand._id).populate("activeDomain");

    await createAuditLog({
      userId: req.user?._id,
      action: "ASSIGN_DOMAIN",
      entityType: "Domain",
      entityId: updatedDomain._id,
      details: {
        domain: updatedDomain.domain,
        brandId: brand._id,
        brandName: brand.name
      }
    });

    return res.status(200).json({
      message: "Domain added to brand successfully.",
      domain: updatedDomain,
      brand: updatedBrand
    });
  } catch (error) {
    console.error("assignDomainToBrand error:", error);
    return res.status(500).json({
      message: "Failed to assign domain."
    });
  }
};

export const unassignDomainFromBrand = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid domain ID."
      });
    }

    const domain = await Domain.findById(id);

    if (!domain) {
      return res.status(404).json({
        message: "Domain not found."
      });
    }

    if (!domain.assignedBrand) {
      return res.status(400).json({
        message: "Domain is not assigned to any brand."
      });
    }

    const brand = await Brand.findById(domain.assignedBrand);

    if (brand) {
      brand.candidateDomains = (brand.candidateDomains || []).filter(
        (item) => String(item) !== String(domain._id)
      );

      if (brand.activeDomain && String(brand.activeDomain) === String(domain._id)) {
        const nextActiveId = brand.candidateDomains[0] || null;
        brand.activeDomain = nextActiveId;

        if (nextActiveId) {
          await Domain.findByIdAndUpdate(nextActiveId, {
            status: "assigned",
            updatedBy: req.user?._id || null
          });
        }
      }

      brand.updatedBy = req.user?._id || null;
      await brand.save();
    }

    domain.assignedBrand = null;
    domain.status = "available";
    domain.updatedBy = req.user?._id || null;

    await domain.save();

    await createAuditLog({
      userId: req.user?._id,
      action: "UNASSIGN_DOMAIN",
      entityType: "Domain",
      entityId: domain._id,
      details: {
        domain: domain.domain
      }
    });

    return res.status(200).json({
      message: "Domain unassigned successfully."
    });
  } catch (error) {
    console.error("unassignDomainFromBrand error:", error);
    return res.status(500).json({
      message: "Failed to unassign domain."
    });
  }
};

export const replaceBrandDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDomainId } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid current domain ID."
      });
    }

    if (!mongoose.Types.ObjectId.isValid(newDomainId)) {
      return res.status(400).json({
        message: "Invalid new domain ID."
      });
    }

    const currentDomain = await Domain.findById(id);
    const newDomain = await Domain.findById(newDomainId);

    if (!currentDomain) {
      return res.status(404).json({
        message: "Current domain not found."
      });
    }

    if (!newDomain) {
      return res.status(404).json({
        message: "Replacement domain not found."
      });
    }

    if (!currentDomain.assignedBrand) {
      return res.status(400).json({
        message: "Current domain is not assigned to any brand."
      });
    }

    const brand = await Brand.findById(currentDomain.assignedBrand);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found."
      });
    }

    if (
      newDomain.assignedBrand &&
      String(newDomain.assignedBrand) !== String(brand._id)
    ) {
      return res.status(400).json({
        message: "Replacement domain belongs to another brand."
      });
    }

    currentDomain.status = "inactive";
    currentDomain.updatedBy = req.user?._id || null;

    newDomain.assignedBrand = brand._id;
    newDomain.status = "assigned";
    newDomain.updatedBy = req.user?._id || null;

    brand.activeDomain = newDomain._id;
    brand.candidateDomains = brand.candidateDomains || [];
    if (!brand.candidateDomains.some((item) => String(item) === String(currentDomain._id))) {
      brand.candidateDomains.push(currentDomain._id);
    }
    if (!brand.candidateDomains.some((item) => String(item) === String(newDomain._id))) {
      brand.candidateDomains.push(newDomain._id);
    }
    brand.updatedBy = req.user?._id || null;
    brand.lastStatus = "error";
    brand.lastCheckedAt = null;

    await currentDomain.save();
    await newDomain.save();
    await brand.save();

    const updatedBrand = await Brand.findById(brand._id).populate("activeDomain");
    const updatedCurrentDomain = await Domain.findById(currentDomain._id).populate(
      "assignedBrand",
      "name code"
    );
    const updatedNewDomain = await Domain.findById(newDomain._id).populate(
      "assignedBrand",
      "name code"
    );

    await createAuditLog({
      userId: req.user?._id,
      action: "REPLACE_DOMAIN",
      entityType: "Brand",
      entityId: brand._id,
      details: {
        brandName: brand.name,
        oldDomain: currentDomain.domain,
        newDomain: newDomain.domain
      }
    });

    return res.status(200).json({
      message: "Active domain updated successfully.",
      brand: updatedBrand,
      oldDomain: updatedCurrentDomain,
      newDomain: updatedNewDomain
    });
  } catch (error) {
    console.error("replaceBrandDomain error:", error);
    return res.status(500).json({
      message: "Failed to replace domain."
    });
  }
};
