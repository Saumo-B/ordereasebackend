// models/Tags.ts
import mongoose, { Schema, Document } from "mongoose";

export interface TagDoc extends Document {
  identifier: string;
  name: string;
  group?: string; // e.g. Dietary, Flavors, Cake
  multiSelect?: boolean;
  validCatalogueKinds?: string[]; // ["default"], ["celebration-cake"]
  createdBy: mongoose.Types.ObjectId;
}

const TagSchema = new Schema<TagDoc>({
  identifier: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  group: { type: String, default: true },
  multiSelect: { type: Boolean, default: true },
  validCatalogueKinds: { type: [String], default: ["default"] },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

export const Tag = mongoose.model<TagDoc>("Tag", TagSchema);
