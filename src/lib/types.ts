export type FoodEntry = {
  id: string;
  eaten_at: string;
  food_name: string;
  place_brand: string | null;
  price: string | null;
  image_url: string;
  image_width: number;
  image_height: number;
  created_at: string;
};

export type EntriesResponse = {
  data: FoodEntry[];
  nextCursor: string | null;
};