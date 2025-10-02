"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoTagMenuItem = autoTagMenuItem;
const keywords_1 = require("../config/keywords");
function autoTagMenuItem(name, description = "") {
    const text = `${name} ${description}`.toLowerCase();
    // if any exception keyword exists, don't tag
    for (const ex of keywords_1.EXCEPTION_KEYWORDS) {
        if (text.includes(ex.toLowerCase())) {
            return ["veg"]; // force veg if exception
        }
    }
    const tags = new Set();
    // egg check
    for (const word of keywords_1.EGG_KEYWORDS) {
        if (text.includes(word.toLowerCase())) {
            tags.add("egg");
            break;
        }
    }
    // non-veg check
    for (const word of keywords_1.NON_VEG_KEYWORDS) {
        if (text.includes(word.toLowerCase())) {
            tags.add("non-veg");
            break;
        }
    }
    // if neither egg nor non-veg, default veg
    if (!tags.has("non-veg") && !tags.has("egg")) {
        tags.add("veg");
    }
    return Array.from(tags);
}
//# sourceMappingURL=autoTag.js.map