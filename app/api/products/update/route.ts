import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";
import { updateProductLocal } from "@/lib/erp"; 
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. HANDLE DATA UPDATES (JSON)
    // This runs when you click "Save Changes"
    if (contentType.includes("application/json")) {
        const body = await req.json();
        const { item_code, ...updates } = body;

        if (!item_code) {
            return NextResponse.json({ error: "Item Code required" }, { status: 400 });
        }

        // Update the local JSON database
        await updateProductLocal(item_code, updates);
        
        // Refresh the cache so changes show up immediately
        revalidatePath('/');
        
        return NextResponse.json({ success: true, message: "Product updated successfully" });
    }

    // 2. HANDLE IMAGE UPLOADS (FormData)
    // This runs when you click "Upload Now"
    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const itemCode = formData.get("item_code") as string;

        if (!file || !itemCode) {
          return NextResponse.json({ error: "File and Item Code required" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Force rename to [ItemCode].jpg
        const filename = `${itemCode}.jpg`;
        const uploadDir = path.join(process.cwd(), "public/images");
        const filePath = path.join(uploadDir, filename);

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        await writeFile(filePath, buffer);

        // Update database with new image version to force refresh
        await updateProductLocal(itemCode, { imageVersion: Date.now() });

        revalidatePath('/');

        return NextResponse.json({ success: true, message: `Uploaded ${filename}` });
    }

    return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 400 });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}