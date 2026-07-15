/**
 * Version type mapping utilities
 */

export function getVersionType(mode: string | null): string {
  switch (mode) {
    case "add_vocals":
      return "vocal_add";
    case "add_instrumental":
      return "instrumental_add";
    case "extend":
      return "extension";
    case "cover":
      return "cover";
    case "remix":
      return "remix";
    case "replace_section":
      return "replace_section";
    case "inpaint":
      return "inpaint";
    default:
      return "initial";
  }
}

export const VERSION_LABELS = ["A", "B", "C", "D", "E"];
