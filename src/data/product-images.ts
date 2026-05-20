import type { StaticImageData } from "next/image";
import modularDeskOrganizer from "@/img/Modular Desk Organizer.webp";
import plantWallClipSet from "@/img/Plant Wall Clip Set.webp";

export const productImages: Partial<Record<string, StaticImageData>> = {
  "desk-organizer-grid": modularDeskOrganizer,
  "plant-wall-clips": plantWallClipSet,
};
