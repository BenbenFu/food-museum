import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabaseServer = getSupabaseServer();
  const { id } = await context.params;

  const { data: existing, error: findError } = await supabaseServer
    .from("food_entries")
    .select("id,image_path")
    .eq("id", id)
    .single();

  if (findError || !existing) {
    return NextResponse.json({ message: "Entry not found" }, { status: 404 });
  }

  const { error: removeError } = await supabaseServer.from("food_entries").delete().eq("id", id);
  if (removeError) {
    return NextResponse.json({ message: removeError.message }, { status: 500 });
  }

  if (existing.image_path) {
    await supabaseServer.storage.from(env.supabaseBucket).remove([existing.image_path]);
  }

  return NextResponse.json({ ok: true });
}
