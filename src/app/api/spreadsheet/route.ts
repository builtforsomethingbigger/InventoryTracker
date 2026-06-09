import { auth } from "@/lib/auth";
import { linkSpreadsheet, validateSpreadsheet } from "@/lib/sheets";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { spreadsheetUrl } = await request.json();
  if (!spreadsheetUrl) {
    return NextResponse.json(
      { error: "Spreadsheet URL is required" },
      { status: 400 }
    );
  }

  try {
    await linkSpreadsheet(session.user.id, spreadsheetUrl);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setup failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { spreadsheetUrl } = await request.json();
  if (!spreadsheetUrl) {
    return NextResponse.json(
      { error: "Spreadsheet URL is required" },
      { status: 400 }
    );
  }

  try {
    const result = await validateSpreadsheet(session.user.id, spreadsheetUrl);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
