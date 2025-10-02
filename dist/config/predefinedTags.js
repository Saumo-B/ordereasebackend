"use strict";
// src/config/predefinedTags.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PREDEFINED_TAGS = void 0;
exports.PREDEFINED_TAGS = [
    { identifier: "egg", name: "Egg", group: "Dietary", multiSelect: false, validCatalogueKinds: ["default"] },
    { identifier: "non-veg", name: "Non-Veg", group: "Dietary", multiSelect: false, validCatalogueKinds: ["default"] },
    { identifier: "veg", name: "Veg", group: "Dietary", multiSelect: false, validCatalogueKinds: ["default"] },
    { identifier: "cake", name: "Cake", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "chef-special", name: "Chef's Special", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "dairy-free", name: "Dairy Free", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "fodmap-friendly", name: "FODMAP Friendly", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "gluten-free", name: "Gluten Free", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "lactose-free", name: "Lactose Free", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "new", name: "New", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "restaurant-recommended", name: "Restaurant Recommended", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "seasonal", name: "Seasonal", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "spicy", name: "Spicy", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "vegan", name: "Vegan", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "wheat-free", name: "Wheat Free", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "mrp-item", name: "MRP Item", group: "Info", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "contains-alcohol", name: "Contains Alcohol", group: "Legally Sensitive", multiSelect: true, validCatalogueKinds: ["default"] },
    { identifier: "contains-pork", name: "Contains Pork", group: "Miscellaneous", multiSelect: true, validCatalogueKinds: ["default"] },
    // Flavors (celebration-cake)
    { identifier: "cake-flavor-chocolate", name: "Chocolate", group: "Flavors", multiSelect: false, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "cake-flavor-black-forest", name: "Black Forest", group: "Flavors", multiSelect: false, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "cake-flavor-vanilla", name: "Vanilla", group: "Flavors", multiSelect: false, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "cake-flavor-fruit", name: "Fruit", group: "Flavors", multiSelect: false, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "cake-flavor-pineapple", name: "Pineapple", group: "Flavors", multiSelect: false, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "cake-flavor-butterscotch", name: "Butterscotch", group: "Flavors", multiSelect: false, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "cake-flavor-red-velvet", name: "Red Velvet", group: "Flavors", multiSelect: false, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "cake-flavor-blueberry", name: "Blueberry", group: "Flavors", multiSelect: false, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "cake-flavor-cheesecake", name: "Cheese Cake", group: "Flavors", multiSelect: false, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "cake-flavor-strawberry", name: "Strawberry", group: "Flavors", multiSelect: false, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "cake-flavor-cream", name: "Cream", group: "Flavors", multiSelect: false, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "cake-flavor-mango", name: "Mango", group: "Flavors", multiSelect: false, validCatalogueKinds: ["celebration-cake"] },
    // Cake types
    { identifier: "anniversary-wedding-cake", name: "Anniversary/Wedding Cake", group: "Cake", multiSelect: true, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "tiered-cake", name: "Tiered Cake", group: "Cake", multiSelect: true, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "birthday-cake", name: "Birthday Cake", group: "Cake", multiSelect: true, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "kids-birthday-cake", name: "Kids Birthday Cake", group: "Cake", multiSelect: true, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "gourmet-cake", name: "Gourmet Cake", group: "Cake", multiSelect: true, validCatalogueKinds: ["celebration-cake"] },
    { identifier: "premium-cake", name: "Premium Cake", group: "Cake", multiSelect: true, validCatalogueKinds: ["celebration-cake"] },
    // Speciality
    { identifier: "home-style-meal", name: "Home Style Meal", group: "Speciality", multiSelect: true, validCatalogueKinds: ["default"] },
    // GST Classification
    { identifier: "services", name: "Services", group: "GST Classification", multiSelect: false, validCatalogueKinds: ["default"] },
    { identifier: "goods", name: "Goods", group: "GST Classification", multiSelect: false, validCatalogueKinds: ["default"] },
];
//# sourceMappingURL=predefinedTags.js.map