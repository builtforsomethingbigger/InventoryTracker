import { auth } from "@/lib/auth";
import { addTransaction, getTransactions } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { clientName, itemName, quantity, price } = body;

  if (!clientName?.trim() || !itemName?.trim()) {
    return NextResponse.json({ error: "Client and item are required" }, { status: 400 });
  }

  const qty = Number(quantity);
  if (!qty || qty <= 0) {
    return NextResponse.json({ error: "Quantity must be greater than 0" }, { status: 400 });
  }

  try {
    await addTransaction(session.user.id, {
      clientName: clientName.trim(),
      itemName: itemName.trim(),
      quantity: qty,
      price: Number(price) || 0,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const clientName = url.searchParams.get("clientName");
    const all = await getTransactions(session.user.id);
    const filtered = clientName
      ? all.filter((t) => t.clientName === clientName)
      : all;
    return NextResponse.json(filtered);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
