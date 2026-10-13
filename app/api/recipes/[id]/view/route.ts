import { NextResponse } from "next/server";
import { incrementRecipeViewsServer } from "@/lib/firebase/server";

export const runtime = "nodejs";

/** Firestore auto-ids are alphanumeric; reject anything else early. */
const RECIPE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/** POST /api/recipes/:id/view — count one view and return the new total. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!RECIPE_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Invalid recipe id." }, { status: 400 });
  }

  const views = await incrementRecipeViewsServer(id);

  if (views === null) {
    return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  }

  return NextResponse.json(
    { views },
    { headers: { "Cache-Control": "no-store" } },
  );
}
