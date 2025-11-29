import { NextResponse } from "next/server";
import { updateProductLocal } from "@/lib/erp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { item_code, ...updates } = body;

    if (!item_code) {
      return NextResponse.json({ error: "Item Code required" }, { status: 400 });
    }

    // Update the JSON file
    await updateProductLocal(item_code, updates);

    return NextResponse.json({ success: true, message: "Product Updated Locally" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}