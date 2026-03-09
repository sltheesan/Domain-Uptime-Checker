import mongoose from "mongoose";
import Brand from "../models/Brand.js";
import { findBrandById, findBrands } from "../services/brandService.js";
import { createAuditLog } from "../services/auditService.js";

export const getBrands = async (req, res) => {
  try {
    const brands = await findBrands(req.query);

    return res.status(200).json({
      count: brands.length,
      brands
    });
  } catch (error) {
    console.error("getBrands error:", error);
    return res.status(500).json({
      message: "Failed to fetch brands."
    });
  }
};

export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid brand ID."
      });
    }

    const brand = await findBrandById(id);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found."
      });
    }

    return res.status(200).json({
      brand
    });
  } catch (error) {
    console.error("getBrandById error:", error);
    return res.status(500).json({
      message: "Failed to fetch brand."
    });
  }
};

export const createBrand = async (req, res) => {
  try {
    const { name, code, description, notes, monitoringEnabled } = req.body || {};

    if (!name || !code) {
      return res.status(400).json({
        message: "Brand name and code are required."
      });
    }

    const trimmedName = name.trim();
    const normalizedCode = code.trim().toUpperCase();

    const existingBrand = await Brand.findOne({
      $or: [{ name: trimmedName }, { code: normalizedCode }]
    });

    if (existingBrand) {
      return res.status(409).json({
        message: "Brand name or code already exists."
      });
    }

    const brand = await Brand.create({
      name: trimmedName,
      code: normalizedCode,
      description: description?.trim() || "",
      notes: notes?.trim() || "",
      monitoringEnabled:
        typeof monitoringEnabled === "boolean" ? monitoringEnabled : true,
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null
    });

    await createAuditLog({
      userId: req.user?._id,
      action: "CREATE_BRAND",
      entityType: "Brand",
      entityId: brand._id,
      details: {
        name: brand.name,
        code: brand.code
      }
    });

    return res.status(201).json({
      message: "Brand created successfully.",
      brand
    });
  } catch (error) {
    console.error("createBrand error:", error);
    return res.status(500).json({
      message: "Failed to create brand."
    });
  }
};

export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, notes, monitoringEnabled } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid brand ID."
      });
    }

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found."
      });
    }

    if (name) {
      const trimmedName = name.trim();

      const existingName = await Brand.findOne({
        name: trimmedName,
        _id: { $ne: id }
      });

      if (existingName) {
        return res.status(409).json({
          message: "Another brand already uses this name."
        });
      }

      brand.name = trimmedName;
    }

    if (code) {
      const normalizedCode = code.trim().toUpperCase();

      const existingCode = await Brand.findOne({
        code: normalizedCode,
        _id: { $ne: id }
      });

      if (existingCode) {
        return res.status(409).json({
          message: "Another brand already uses this code."
        });
      }

      brand.code = normalizedCode;
    }

    if (typeof description === "string") {
      brand.description = description.trim();
    }

    if (typeof notes === "string") {
      brand.notes = notes.trim();
    }

    if (typeof monitoringEnabled === "boolean") {
      brand.monitoringEnabled = monitoringEnabled;
    }

    brand.updatedBy = req.user?._id || null;

    await brand.save();

    const updatedBrand = await findBrandById(id);

    await createAuditLog({
      userId: req.user?._id,
      action: "UPDATE_BRAND",
      entityType: "Brand",
      entityId: updatedBrand._id,
      details: {
        name: updatedBrand.name,
        code: updatedBrand.code,
        monitoringEnabled: updatedBrand.monitoringEnabled
      }
    });

    return res.status(200).json({
      message: "Brand updated successfully.",
      brand: updatedBrand
    });
  } catch (error) {
    console.error("updateBrand error:", error);
    return res.status(500).json({
      message: "Failed to update brand."
    });
  }
};

export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid brand ID."
      });
    }

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found."
      });
    }

    if (brand.activeDomain) {
      return res.status(400).json({
        message: "Cannot delete a brand with an assigned active domain."
      });
    }

    await brand.deleteOne();

    await createAuditLog({
      userId: req.user?._id,
      action: "DELETE_BRAND",
      entityType: "Brand",
      entityId: brand._id,
      details: {
        name: brand.name,
        code: brand.code
      }
    });

    return res.status(200).json({
      message: "Brand deleted successfully."
    });
  } catch (error) {
    console.error("deleteBrand error:", error);
    return res.status(500).json({
      message: "Failed to delete brand."
    });
  }
};

export const toggleBrandMonitoring = async (req, res) => {
  try {
    const { id } = req.params;
    const { monitoringEnabled } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid brand ID."
      });
    }

    if (typeof monitoringEnabled !== "boolean") {
      return res.status(400).json({
        message: "monitoringEnabled must be boolean."
      });
    }

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found."
      });
    }

    brand.monitoringEnabled = monitoringEnabled;
    brand.updatedBy = req.user?._id || null;

    await brand.save();

    await createAuditLog({
      userId: req.user?._id,
      action: "TOGGLE_BRAND_MONITORING",
      entityType: "Brand",
      entityId: brand._id,
      details: {
        name: brand.name,
        code: brand.code,
        monitoringEnabled: brand.monitoringEnabled
      }
    });

    return res.status(200).json({
      message: `Brand monitoring ${
        monitoringEnabled ? "enabled" : "disabled"
      } successfully.`,
      brand
    });
  } catch (error) {
    console.error("toggleBrandMonitoring error:", error);
    return res.status(500).json({
      message: "Failed to update monitoring status."
    });
  }
};

export const getDashboardSummary = async (req, res) => {
  try {
    const brands = await Brand.find({})
      .populate("activeDomain")
      .sort({ createdAt: -1 });

    const totalBrands = brands.length;
    const healthyCount = brands.filter((b) => b.lastStatus === "live").length;
    const blockedCount = brands.filter((b) =>
      ["blocked", "dead", "error"].includes(b.lastStatus)
    ).length;
    const monitoringEnabledCount = brands.filter(
      (b) => b.monitoringEnabled
    ).length;

    return res.status(200).json({
      summary: {
        totalBrands,
        healthyCount,
        blockedCount,
        monitoringEnabledCount
      },
      brands
    });
  } catch (error) {
    console.error("getDashboardSummary error:", error);
    return res.status(500).json({
      message: "Failed to load dashboard summary."
    });
  }
};
