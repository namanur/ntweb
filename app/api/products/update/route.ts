import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";
import { updateProductLocal } from "@/lib/erp"; // Import the update function
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const itemCode = formData.get("item_code") as string;

    if (!file || !itemCode) {
      return NextResponse.json({ error: "File and Item Code required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 1. FORCE RENAME TO SKU: Save as [ItemCode].jpg in public/images
    const filename = `${itemCode}.jpg`;
    const uploadDir = path.join(process.cwd(), "public/images");
    const filePath = path.join(uploadDir, filename);

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Write file to disk (Overwrites if exists)
    await writeFile(filePath, buffer);

    // 2. UPDATE DATABASE: Set imageVersion to current timestamp
    // This tells the frontend "Hey, I have a new image!"
    await updateProductLocal(itemCode, { imageVersion: Date.now() });

    // 3. CLEAR CACHE: Tell Next.js to refresh the data
    revalidatePath('/');

    return NextResponse.json({ success: true, message: `Uploaded ${filename}` });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}