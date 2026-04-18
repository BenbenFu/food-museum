import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase/server";
import { toErrorMessage, withHint } from "@/lib/api-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

const isValidDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

export async function GET(request: Request) {
  try {
    const supabaseServer = getSupabaseServer();
    const url = new URL(request.url);
    const cursor = url.searchParams.get("cursor");

    let query = supabaseServer
      .from("food_entries")
      .select(
        "id,eaten_at,food_name,place_brand,price,image_url,image_path,image_width,image_height,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1);

    if (cursor) query = query.lt("created_at", cursor);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ message: withHint(error.message) }, { status: 500 });
    }

    const rows =
      data?.map((row) => ({
        ...row,
        image_url:
          row.image_path
            ? supabaseServer.storage.from(env.supabaseBucket).getPublicUrl(row.image_path).data.publicUrl
            : row.image_url
      })) ?? [];
    const hasMore = rows.length > PAGE_SIZE;
    const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = hasMore ? page[page.length - 1]?.created_at ?? null : null;

    return NextResponse.json({ data: page, nextCursor });
  } catch (error) {
    return NextResponse.json(
      { message: withHint(toErrorMessage(error, "Failed to load entries")) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabaseServer = getSupabaseServer();
    const form = await request.formData();

  const eatenAt = String(form.get("eatenAt") ?? "").trim();
  const foodName = String(form.get("foodName") ?? "").trim();
  const placeBrandRaw = String(form.get("placeBrand") ?? "").trim();
  const priceRaw = String(form.get("price") ?? "").trim();
  const widthRaw = Number(form.get("width") ?? 0);
  const heightRaw = Number(form.get("height") ?? 0);
  const image = form.get("image");

    if (!eatenAt || !isValidDate(eatenAt)) {
      return NextResponse.json({ message: "Invalid date format" }, { status: 400 });
    }
    if (!foodName) {
      return NextResponse.json({ message: "Food name is required" }, { status: 400 });
    }
    if (!(image instanceof File)) {
      return NextResponse.json({ message: "Image file is required" }, { status: 400 });
    }
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: "Image is too large" }, { status: 400 });
    }
    if (
      !Number.isFinite(widthRaw) ||
      !Number.isFinite(heightRaw) ||
      widthRaw <= 0 ||
      heightRaw <= 0
    ) {
      return NextResponse.json({ message: "Invalid image dimensions" }, { status: 400 });
    }

    const [year, month] = eatenAt.split("-");
    const extension = image.type === "image/png" ? "png" : "jpg";
    const imagePath = `${year}/${month}/${crypto.randomUUID()}.${extension}`;

    const upload = await supabaseServer.storage.from(env.supabaseBucket).upload(imagePath, image, {
      contentType: image.type,
      upsert: false
    });
    if (upload.error) {
      return NextResponse.json({ message: withHint(upload.error.message) }, { status: 500 });
    }

    const publicUrl = supabaseServer.storage.from(env.supabaseBucket).getPublicUrl(imagePath).data.publicUrl;

    const { data, error } = await supabaseServer
      .from("food_entries")
      .insert({
        eaten_at: eatenAt,
        food_name: foodName,
        place_brand: placeBrandRaw || null,
        price: priceRaw || null,
        image_url: publicUrl,
        image_path: imagePath,
        image_width: Math.round(widthRaw),
        image_height: Math.round(heightRaw)
      })
      .select(
        "id,eaten_at,food_name,place_brand,price,image_url,image_width,image_height,created_at"
      )
      .single();

    if (error || !data) {
      await supabaseServer.storage.from(env.supabaseBucket).remove([imagePath]);
      return NextResponse.json(
        { message: withHint(error?.message ?? "Failed to save entry") },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: withHint(toErrorMessage(error, "Failed to upload image")) },
      { status: 500 }
    );
  }
}
