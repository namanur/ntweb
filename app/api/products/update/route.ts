import { NextResponse } from "next/server";
// import fs from "fs";
// import path from "path";
// import { writeFile } from "fs/promises";
// import { updateProductLocal } from "@/lib/erp"; 
// import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  return NextResponse.json({
    error: "Product updates are disabled. This application uses a read-only snapshot from ERPNext."
  }, { status: 403 });
}

/*
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    ...

  try {
    const contentType = req.headers.get("content-type") || "";

    // 1. HANDLE DATA UPDATES (JSON)
    if (contentType.includes("application/json")) {
        const body = await req.json();
        const { item_code, ...updates } = body;

        if (!item_code) {
            return NextResponse.json({ error: "Item Code required" }, { status: 400 });
        }

        await updateProductLocal(item_code, updates);
        revalidatePath('/');
        return NextResponse.json({ success: true, message: "Product updated successfully" });
    }

    // 2. HANDLE MULTIPLE IMAGE UPLOADS (FormData)
    if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const itemCode = formData.get("item_code") as string;
        
        // Get all files with the key "file" (or "files")
        const files = formData.getAll("file") as File[]; 

        if (!files || files.length === 0 || !itemCode) {
          return NextResponse.json({ error: "Files and Item Code required" }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), "public/images");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const savedImages: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const buffer = Buffer.from(await file.arrayBuffer());
            
            // First image = Main Image [ItemCode].jpg
            // Subsequent images = [ItemCode]-1.jpg, [ItemCode]-2.jpg
            let filename = "";
            if (i === 0) {
                filename = `${itemCode}.jpg`;
            } else {
                filename = `${itemCode}-${i}.jpg`;
            }

            const filePath = path.join(uploadDir, filename);
            await writeFile(filePath, buffer);
            savedImages.push(filename);
        }

        // Update database with image version (to force refresh) AND list of all images
        await updateProductLocal(itemCode, { 
            imageVersion: Date.now(),
            images: savedImages 
        });

        revalidatePath('/');

        return NextResponse.json({ success: true, message: `Uploaded ${files.length} images` });
    }

    return NextResponse.json({ error: "Unsupported Content-Type" }, { status: 400 });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
*/