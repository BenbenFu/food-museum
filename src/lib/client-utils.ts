import type { FoodEntry } from "@/lib/types";

const MAX_EDGE = 1800;
const JPEG_QUALITY = 0.82;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image"));
    };
    img.src = url;
  });

export const compressImage = async (
  file: File
): Promise<{ file: File; width: number; height: number }> => {
  const image = await loadImage(file);
  const ratio = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.round(image.width * ratio);
  const height = Math.round(image.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D is not available");
  }

  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });

  if (!blob) {
    throw new Error("Failed to compress image");
  }

  const output = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
    type: "image/jpeg"
  });

  return { file: output, width, height };
};

export const mergeEntry = (items: FoodEntry[], incoming: FoodEntry): FoodEntry[] => {
  const existing = new Set(items.map((item) => item.id));
  if (existing.has(incoming.id)) {
    return items;
  }
  return [incoming, ...items];
};
