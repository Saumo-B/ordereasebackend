// src/utils/validateTags.ts
import { PREDEFINED_TAGS, PredefinedTag } from "../config/predefinedTags";
import { Tag, TagDoc } from "../models/Tags";
import {  } from "../models/Menu";

/**
 * Validate and clean menu item tags
 */
export async function validateMenuItemTags(
  tags: string[],
  catalogueKind: string,
  userId: string
): Promise<string[]> {
  // 1. Load user tags from DB
  const userTags: TagDoc[] = await Tag.find({ createdBy: userId }).lean();

  // 2. Combine predefined + user tags
  const allTags: Record<string, PredefinedTag | TagDoc> = {};
  [...PREDEFINED_TAGS, ...userTags].forEach((t) => {
    allTags[t.identifier] = t;
  });

  const validTags: string[] = [];
  const seenGroups: Record<string, string[]> = {};

  for (const tagId of tags) {
    const tag = allTags[tagId];
    if (!tag) {
      throw new Error(`Invalid tag: ${tagId}`);
    }

    // 3. Check catalogue kind compatibility
    if (!tag.validCatalogueKinds?.includes(catalogueKind)) {
      throw new Error(
        `Tag "${tag.name}" cannot be applied to catalogue kind "${catalogueKind}"`
      );
    }

    // 4. Check group multiSelect rule
    const group = tag.group || "Custom";
    if (!seenGroups[group]) seenGroups[group] = [];

    if (!tag.multiSelect && seenGroups[group].length > 0) {
      throw new Error(
        `Only one tag from group "${group}" can be applied. Already added: ${seenGroups[group][0]}`
      );
    }

    seenGroups[group].push(tag.identifier);
    validTags.push(tag.identifier);
  }

  return validTags;
}
