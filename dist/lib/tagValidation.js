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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMenuItemTags = validateMenuItemTags;
// src/utils/validateTags.ts
const predefinedTags_1 = require("../config/predefinedTags");
const Tags_1 = require("../models/Tags");
/**
 * Validate and clean menu item tags
 */
function validateMenuItemTags(tags, catalogueKind, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // 1. Load user tags from DB
        const userTags = yield Tags_1.Tag.find({ createdBy: userId }).lean();
        // 2. Combine predefined + user tags
        const allTags = {};
        [...predefinedTags_1.PREDEFINED_TAGS, ...userTags].forEach((t) => {
            allTags[t.identifier] = t;
        });
        const validTags = [];
        const seenGroups = {};
        for (const tagId of tags) {
            const tag = allTags[tagId];
            if (!tag) {
                throw new Error(`Invalid tag: ${tagId}`);
            }
            // 3. Check catalogue kind compatibility
            if (!((_a = tag.validCatalogueKinds) === null || _a === void 0 ? void 0 : _a.includes(catalogueKind))) {
                throw new Error(`Tag "${tag.name}" cannot be applied to catalogue kind "${catalogueKind}"`);
            }
            // 4. Check group multiSelect rule
            const group = tag.group || "Custom";
            if (!seenGroups[group])
                seenGroups[group] = [];
            if (!tag.multiSelect && seenGroups[group].length > 0) {
                throw new Error(`Only one tag from group "${group}" can be applied. Already added: ${seenGroups[group][0]}`);
            }
            seenGroups[group].push(tag.identifier);
            validTags.push(tag.identifier);
        }
        return validTags;
    });
}
//# sourceMappingURL=tagValidation.js.map