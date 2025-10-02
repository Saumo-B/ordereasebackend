import { NON_VEG_KEYWORDS, EGG_KEYWORDS, EXCEPTION_KEYWORDS } from "../config/keywords";

export function autoTagMenuItem(name: string, description: string = ""): string[] {
  const text = `${name} ${description}`.toLowerCase();

  // if any exception keyword exists, don't tag
  for (const ex of EXCEPTION_KEYWORDS) {
    if (text.includes(ex.toLowerCase())) {
      return ["veg"]; // force veg if exception
    }
  }

  const tags: Set<string> = new Set();

  // egg check
  for (const word of EGG_KEYWORDS) {
    if (text.includes(word.toLowerCase())) {
      tags.add("egg");
      break;
    }
  }

  // non-veg check
  for (const word of NON_VEG_KEYWORDS) {
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
