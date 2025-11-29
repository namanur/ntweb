import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Check if products file exists and is readable
    const filePath = path.join(process.cwd(), 'src/data/products.json');
    const dbStatus = fs.existsSync(filePath) ? "Connected" : "Not Found";
    
    // Check file size/stats
    const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
    const lastModified = stats ? stats.mtime.toISOString() : "Unknown";

    return NextResponse.json({ 
      status: "Online", 
      database: dbStatus,
      lastUpdate: lastModified,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      status: "Error", 
      database: "Error", 
      error: String(error) 
    }, { status: 500 });
  }
}