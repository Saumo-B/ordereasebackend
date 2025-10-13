import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import {AccessControl } from "../models/Access"; // Import the AccessControl model

const router = express.Router();

// 1. POST API: Create or Add New Access Control Settings

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      orders,
      dashboard,
      salesReport,
      inventory,
      menu,
      roles,
      branches,
    } = req.body;

    // Create a new AccessControl document
    const newAccessControl = new AccessControl({
      orders: {
        type: orders?.type ?? true,
        branchSelector: orders?.branchSelector ?? false,
      },
      dashboard: {
        type: dashboard?.type ?? true,
        branchSelector: dashboard?.branchSelector ?? false,
      },
      salesReport: salesReport ?? false,
      inventory: {
        type: inventory?.type ?? false,
        branchSelector: inventory?.branchSelector ?? false,
      },
      menu: {
        type: menu?.type ?? true,
        branchSelector: menu?.branchSelector ?? false,
      },
      roles: roles ?? false,
      branches: branches ?? false,
    });

    // Save the new access control settings to the database
    const savedAccessControl = await newAccessControl.save();

    res.status(201).json({
      message: "Access control settings created successfully",
      accessControl: savedAccessControl,
    });
  } catch (error) {
    console.error("Error creating access control:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// 2. GET API: Retrieve Access Control Settings
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Fetch the access control settings
    const accessControl = await AccessControl.findOne({}).select("-createdAt -_id -updatedAt -__v");

    if (!accessControl) {
      return res.status(404).json({ error: "Access control settings not found" });
    }

    res.json({ accessControl });
  } catch (error) {
    console.error("Error fetching access control settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. PATCH API: Update Access Control Settings
router.patch("/", async (req: Request, res: Response, next: NextFunction) => {
  const {
    orders,
    dashboard,
    salesReport,
    inventory,
    menu,
    roles,
    branches,
    ordersBranchSelector,
    dashboardBranchSelector,
    inventoryBranchSelector,
    menuBranchSelector,
  } = req.body;

  try {
    // Find the single AccessControl document (since you know there's only one)
    const accessControl = await AccessControl.findOne();

    if (!accessControl) {
      return res.status(404).json({ error: "Access control settings not found" });
    }

    // Update the fields based on the request body

    // Orders
    if (orders !== undefined) accessControl.orders.type = orders;
    if (ordersBranchSelector !== undefined) accessControl.orders.branchSelector = ordersBranchSelector;

    // Dashboard
    if (dashboard !== undefined) accessControl.dashboard.type = dashboard;
    if (dashboardBranchSelector !== undefined) accessControl.dashboard.branchSelector = dashboardBranchSelector;

    // Sales Report
    if (salesReport !== undefined) accessControl.salesReport = salesReport;

    // Inventory
    if (inventory !== undefined) accessControl.inventory.type = inventory; // Make sure it's a Boolean
    if (inventoryBranchSelector !== undefined) accessControl.inventory.branchSelector = inventoryBranchSelector;

    // Menu
    if (menu !== undefined) accessControl.menu.type = menu; // Make sure it's a Boolean
    if (menuBranchSelector !== undefined) accessControl.menu.branchSelector = menuBranchSelector;

    // Roles
    if (roles !== undefined) accessControl.roles = roles;

    // Branches
    if (branches !== undefined) accessControl.branches = branches;

    // Save the updated document
    const updatedAccessControl = await accessControl.save();

    res.json({
      message: "Access control settings updated successfully",
      accessControl: updatedAccessControl,
    });
  } catch (error) {
    console.error("Error updating access control settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
