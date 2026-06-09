import { auth } from "@/lib/auth";
import {
  addInventoryItem,
  getInventory,
  updateInventoryItem,
} from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await getInventory(session.user.id);
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { itemName, quantity, price } = body;

  if (!itemName?.trim()) {
    return NextResponse.json({ error: "Item name is required" }, { status: 400 });
  }

  try {
    await addInventoryItem(session.user.id, {
      itemName: itemName.trim(),
      quantity: Number(quantity) || 0,
      price: Number(price) || 0,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { rowIndex, itemName, quantity, price } = body;

  if (!rowIndex || !itemName?.trim()) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    await updateInventoryItem(session.user.id, rowIndex, {
      itemName: itemName.trim(),
      quantity: Number(quantity) || 0,
      price: Number(price) || 0,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
