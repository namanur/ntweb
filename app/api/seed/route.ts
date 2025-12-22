import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public/catalog.json');
    // NOTE: This file is a derived snapshot from ERPNext. Do not write to it at runtime.

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ data: [] });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(fileContent);
    const products = Array.isArray(json) ? json : (json.products || []);
    const metadata = Array.isArray(json) ? null : (json.metadata || null);

    return NextResponse.json({ products, metadata });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}