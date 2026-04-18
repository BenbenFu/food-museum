import type { FoodEntry } from "@/lib/types";

const esc = (value: string | null): string => {
  if (value === null) {
    return "";
  }
  return `"${value.replace(/"/g, '""')}"`;
};

export const entriesToCsv = (entries: FoodEntry[]): string => {
  const header = [
    "id",
    "eaten_at",
    "food_name",
    "place_brand",
    "price",
    "image_url",
    "image_width",
    "image_height",
    "created_at"
  ];

  const rows = entries.map((entry) =>
    [
      esc(entry.id),
      esc(entry.eaten_at),
      esc(entry.food_name),
      esc(entry.place_brand),
      esc(entry.price),
      esc(entry.image_url),
      String(entry.image_width),
      String(entry.image_height),
      esc(entry.created_at)
    ].join(",")
  );

  return [header.join(","), ...rows].join("\n");
};