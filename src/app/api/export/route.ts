import { NextResponse } from "next/server";
import { entriesToCsv } from "@/lib/csv";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabaseServer = getSupabaseServer();
  const url = new URL(request.url);
  const format = (url.searchParams.get("format") ?? "json").toLowerCase();

  const { data, error } = await supabaseServer
    .from("food_entries")
    .select(
      "id,eaten_at,food_name,place_brand,price,image_url,image_width,image_height,created_at"
    )
    .order("eaten_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) {
    return NextResponse.json({ message: error?.message ?? "Export failed" }, { status: 500 });
  }

  if (format === "csv") {
    const csv = entriesToCsv(data);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=food-museum-export.csv"
      }
    });
  }

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=food-museum-export.json"
    }
  });
}
