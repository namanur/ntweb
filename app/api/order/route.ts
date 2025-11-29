import { NextResponse } from "next/server";
import { createSalesOrder } from "@/lib/erp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart, customer } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Send to ERPNext
    const erpOrder = await createSalesOrder(cart, customer);

    return NextResponse.json({ 
      success: true, 
      orderId: erpOrder.name,
      message: "Order synced to ERPNext"
    });
    
  } catch (error: any) {
    console.error("Order API Error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}