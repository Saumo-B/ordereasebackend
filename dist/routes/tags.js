"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
// import mongoose from "mongoose";
const predefinedTags_1 = require("../config/predefinedTags");
const Tags_1 = require("../models/Tags");
const router = express_1.default.Router();
/**
 * CREATE Tag
 */
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { identifier, name, group, multiSelect, validCatalogueKinds, createdBy } = req.body;
        if (!identifier || !name || !createdBy) {
            return res.status(400).json({ error: "identifier, name, and createdBy are required" });
        }
        const tag = new Tags_1.Tag({
            identifier: identifier.toLowerCase().trim(),
            name,
            group,
            multiSelect,
            validCatalogueKinds,
            createdBy,
        });
        yield tag.save();
        return res.status(201).json({ message: "Tag created successfully", tag });
    }
    catch (err) {
        console.error("Tag create error:", err);
        if (err.code === 11000) {
            return res.status(400).json({ error: "Identifier must be unique" });
        }
        return res.status(500).json({ error: "Internal server error" });
    }
}));
/**
 * READ all Tags
 */
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userTags = yield Tags_1.Tag.find().lean();
        return res.json({
            predefined: predefinedTags_1.PREDEFINED_TAGS,
            userdefine: userTags,
        });
    }
    catch (err) {
        console.error("Tag fetch error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
/**
 * READ single Tag
 */
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tag = yield Tags_1.Tag.findById(req.params.id);
        if (!tag)
            return res.status(404).json({ error: "Tag not found" });
        return res.json(tag);
    }
    catch (err) {
        console.error("Tag fetch error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
/**
 * UPDATE Tag
 */
router.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updates = req.body;
        const tag = yield Tags_1.Tag.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!tag)
            return res.status(404).json({ error: "Tag not found" });
        return res.json({ message: "Tag updated successfully", tag });
    }
    catch (err) {
        console.error("Tag update error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
/**
 * DELETE Tag
 */
router.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tag = yield Tags_1.Tag.findByIdAndDelete(req.params.id);
        if (!tag)
            return res.status(404).json({ error: "Tag not found" });
        return res.json({ message: "Tag deleted successfully" });
    }
    catch (err) {
        console.error("Tag delete error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}));
exports.default = router;
//# sourceMappingURL=tags.js.map