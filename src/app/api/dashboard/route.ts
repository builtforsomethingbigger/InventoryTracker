import { auth } from "@/lib/auth";
import { getLowStockItems, getMonthlySales } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [monthlySales, lowStock] = await Promise.all([
      getMonthlySales(session.user.id),
      getLowStockItems(session.user.id),
    ]);
    return NextResponse.json({ monthlySales, lowStock });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
