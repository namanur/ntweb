import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/products.json');
    
    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ data: [] });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const products = JSON.parse(fileContent);
    
    return NextResponse.json(products); // Directly return array
  } catch (error) {
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}