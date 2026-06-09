import { auth } from "@/lib/auth";
import { addClient, getClients, updateClient } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clients = await getClients(session.user.id);
    return NextResponse.json(clients);
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
  const { clientName, phoneNumber, email } = body;

  if (!clientName?.trim()) {
    return NextResponse.json({ error: "Client name is required" }, { status: 400 });
  }

  try {
    await addClient(session.user.id, {
      clientName: clientName.trim(),
      phoneNumber: phoneNumber ?? "",
      email: email ?? "",
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
  const { rowIndex, clientName, phoneNumber, email } = body;

  if (!rowIndex || !clientName?.trim()) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    await updateClient(session.user.id, rowIndex, {
      clientName: clientName.trim(),
      phoneNumber: phoneNumber ?? "",
      email: email ?? "",
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
