import type { SectionType } from "./useLyricsSections";

export interface TemplateSection {
  type: SectionType;
}

export interface Template {
  id: string;
  label: string;
  sections: TemplateSection[];
}

export const LYRICS_TEMPLATES: Template[] = [
  {
    id: "pop-standard",
    label: "Pop Standard",
    sections: [
      { type: "verse" },
      { type: "chorus" },
      { type: "verse" },
      { type: "chorus" },
      { type: "bridge" },
      { type: "chorus" },
    ],
  },
  {
    id: "ballad",
    label: "Ballad",
    sections: [
      { type: "intro" },
      { type: "verse" },
      { type: "chorus" },
      { type: "verse" },
      { type: "chorus" },
      { type: "outro" },
    ],
  },
  {
    id: "edm",
    label: "EDM",
    sections: [
      { type: "intro" },
      { type: "verse" },
      { type: "chorus" },
      { type: "verse" },
      { type: "chorus" },
      { type: "outro" },
    ],
  },
  {
    id: "custom",
    label: "Custom (пустая структура)",
    sections: [{ type: "verse" }],
  },
];
